import { assertIsPost, error, success } from "@carbon/auth";
import { requirePermissions } from "@carbon/auth/auth.server";
import { getCarbonServiceRole } from "@carbon/auth/client.server";
import { flash } from "@carbon/auth/session.server";
import { validationError, validator } from "@carbon/form";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  HStack,
  IconButton,
  toast,
  VStack
} from "@carbon/react";
import { startRegistration } from "@simplewebauthn/browser";
import { useState } from "react";
import { LuFingerprint, LuTrash2 } from "react-icons/lu";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  data,
  redirect,
  useFetcher,
  useLoaderData,
  useRevalidator
} from "react-router";
import {
  accountProfileValidator,
  getAccount,
  updateAvatar,
  updatePublicAccount
} from "~/modules/account";
import { ProfileForm, ProfilePhotoForm } from "~/modules/account/ui/Profile";
import type { Handle } from "~/utils/handle";
import { path } from "~/utils/path";

export const handle: Handle = {
  breadcrumb: "Profile",
  to: path.to.profile
};

type Passkey = {
  id: string;
  credentialName: string;
  createdAt: string;
  lastUsedAt: string | null;
  backedUp: boolean;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { client, userId } = await requirePermissions(request, {});
  const serviceRole = getCarbonServiceRole();

  const [user, passkeysResult] = await Promise.all([
    getAccount(client, userId),
    (serviceRole as any)
      .from("passkeyCredential")
      .select("id, credentialName, createdAt, lastUsedAt, backedUp")
      .eq("userId", userId)
      .order("createdAt", { ascending: false })
  ]);

  if (user.error || !user.data) {
    throw redirect(
      path.to.authenticatedRoot,
      await flash(request, error(user.error, "Failed to get user"))
    );
  }

  return {
    user: user.data,
    passkeys: (passkeysResult.data ?? []) as Passkey[]
  };
}

export async function action({ request }: ActionFunctionArgs) {
  assertIsPost(request);
  const { client, userId } = await requirePermissions(request, {});
  const formData = await request.formData();

  if (formData.get("intent") === "about") {
    const validation = await validator(accountProfileValidator).validate(
      formData
    );

    if (validation.error) {
      return validationError(validation.error);
    }

    const { firstName, lastName, about } = validation.data;

    const updateAccount = await updatePublicAccount(client, {
      id: userId,
      firstName,
      lastName,
      about
    });
    if (updateAccount.error)
      return data(
        {},
        await flash(
          request,
          error(updateAccount.error, "Failed to update profile")
        )
      );

    return data({}, await flash(request, success("Updated profile")));
  }

  if (formData.get("intent") === "photo") {
    const photoPath = formData.get("path");
    if (photoPath === null || typeof photoPath === "string") {
      const avatarUpdate = await updateAvatar(client, userId, photoPath);
      if (avatarUpdate.error) {
        throw redirect(
          path.to.profile,
          await flash(
            request,
            error(avatarUpdate.error, "Failed to update avatar")
          )
        );
      }

      throw redirect(
        path.to.profile,
        await flash(
          request,
          success(photoPath === null ? "Removed avatar" : "Updated avatar")
        )
      );
    } else {
      throw redirect(
        path.to.profile,
        await flash(request, error(null, "Invalid avatar path"))
      );
    }
  }

  if (formData.get("intent") === "deletePasskey") {
    const credentialId = formData.get("credentialId") as string;
    if (!credentialId) {
      return data(error(null, "Missing credentialId"), { status: 400 });
    }

    const serviceRole = getCarbonServiceRole();
    const { error: dbError } = await (serviceRole as any)
      .from("passkeyCredential")
      .delete()
      .eq("id", credentialId)
      .eq("userId", userId);

    if (dbError) {
      return data(
        error(dbError, "Failed to delete passkey"),
        await flash(request, error(dbError, "Failed to delete passkey"))
      );
    }

    return data(success("Passkey removed"));
  }

  return null;
}

export default function AccountProfile() {
  const { user, passkeys } = useLoaderData<typeof loader>();
  const deleteFetcher = useFetcher();
  const { revalidate } = useRevalidator();
  const [registering, setRegistering] = useState(false);

  const onAddPasskey = async () => {
    setRegistering(true);
    try {
      const optRes = await fetch("/api/passkey/register/options", {
        method: "POST"
      });
      if (!optRes.ok) throw new Error("Failed to get options");
      const options = await optRes.json();

      const credential = await startRegistration({
        optionsJSON: options
      } as any);

      const verifyRes = await fetch("/api/passkey/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credential)
      });

      if (!verifyRes.ok) {
        const body = await verifyRes.json().catch(() => ({}));
        throw new Error(body.message ?? "Registration failed");
      }

      const result = await verifyRes.json();
      toast.success(`${result.credentialName ?? "Passkey"} registered`);
      revalidate();
    } catch (e: any) {
      if (e?.name !== "NotAllowedError" && e?.name !== "AbortError") {
        toast.error(e.message ?? "Failed to register passkey");
      }
    } finally {
      setRegistering(false);
    }
  };

  const onDeletePasskey = (credentialId: string) => {
    const formData = new FormData();
    formData.append("intent", "deletePasskey");
    formData.append("credentialId", credentialId);
    deleteFetcher.submit(formData, { method: "post" });
  };

  return (
    <VStack spacing={2}>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            This information will be visible to all users, so be careful what
            you share.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 w-full">
            {/* @ts-expect-error TS2322 */}
            <ProfileForm user={user} />
            <ProfilePhotoForm user={user} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <HStack className="justify-between">
            <div>
              <CardTitle>Passkeys</CardTitle>
              <CardDescription>
                Sign in with biometrics instead of a magic link. Passkeys are
                secured by Face ID, Touch ID, or your device PIN.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={onAddPasskey}
              isDisabled={registering}
              isLoading={registering}
              leftIcon={<LuFingerprint className="size-4" />}
            >
              Add Passkey
            </Button>
          </HStack>
        </CardHeader>
        <CardContent>
          {passkeys.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No passkeys registered yet.
            </p>
          ) : (
            <HStack spacing={2}>
              {passkeys.map((pk) => (
                <HStack
                  key={pk.id}
                  className="justify-between p-3 rounded-md border border-border space-x-4"
                >
                  <HStack spacing={3} className="items-start">
                    <LuFingerprint className="size-4 text-muted-foreground shrink-0 mt-1" />
                    <VStack spacing={0}>
                      <p className="text-sm font-medium">{pk.credentialName}</p>
                      <p className="text-xs text-muted-foreground">
                        Added{" "}
                        {new Date(pk.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric"
                        })}
                        {pk.lastUsedAt && (
                          <>
                            {" · "}Last used{" "}
                            {new Date(pk.lastUsedAt).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric"
                              }
                            )}
                          </>
                        )}
                        {pk.backedUp && " · Synced"}
                      </p>
                    </VStack>
                  </HStack>

                  <IconButton
                    onClick={() => onDeletePasskey(pk.id)}
                    aria-label="Delete pass key"
                    type="submit"
                    variant="ghost"
                    icon={<LuTrash2 />}
                    className="cursor-pointer"
                  />
                </HStack>
              ))}
            </HStack>
          )}
        </CardContent>
      </Card>
    </VStack>
  );
}
