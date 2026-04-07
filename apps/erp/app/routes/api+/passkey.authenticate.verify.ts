import { assertIsPost, error } from "@carbon/auth";
import { signInWithPasskey } from "@carbon/auth/auth.server";
import { getCarbonServiceRole } from "@carbon/auth/client.server";
import { setCompanyId } from "@carbon/auth/company.server";
import {
  type StoredCredential,
  verifyPasskeyAuthentication
} from "@carbon/auth/passkey.server";
import { setAuthSession } from "@carbon/auth/session.server";
import type { ActionFunctionArgs } from "react-router";
import { data, redirect } from "react-router";
import { path } from "~/utils/path";

export async function action({ request }: ActionFunctionArgs) {
  assertIsPost(request);

  let body: { credential: any; challengeId: string; redirectTo?: string };
  try {
    body = await request.json();
  } catch {
    return data(error(null, "Invalid request body"), { status: 400 });
  }

  const { credential: webAuthnResponse, challengeId, redirectTo } = body;

  if (!webAuthnResponse?.id || !challengeId) {
    return data(error(null, "Missing credential or challengeId"), {
      status: 400
    });
  }

  const serviceRole = getCarbonServiceRole();

  // Look up stored credential by ID
  const { data: credRow, error: credError } = await (serviceRole as any)
    .from("passkeyCredential")
    .select("id, userId, publicKey, counter, transports")
    .eq("id", webAuthnResponse.id)
    .maybeSingle();

  if (credError || !credRow) {
    // Return info so client can call signalUnknownCredential
    return data(
      {
        success: false,
        unknownCredential: true,
        credentialId: webAuthnResponse.id
      },
      { status: 404 }
    );
  }

  const storedCredential: StoredCredential = {
    id: credRow.id,
    userId: credRow.userId,
    publicKey: Buffer.from(credRow.publicKey, "base64"),
    counter: credRow.counter,
    transports: credRow.transports ?? null,
    aaguid: "",
    credentialName: ""
  };

  try {
    const { newCounter } = await verifyPasskeyAuthentication(
      challengeId,
      webAuthnResponse,
      storedCredential
    );

    // Update counter + lastUsedAt (fire-and-forget)
    void (serviceRole as any)
      .from("passkeyCredential")
      .update({ counter: newCounter, lastUsedAt: new Date().toISOString() })
      .eq("id", credRow.id);

    // Resolve user email for session creation
    const { data: authUser } = await serviceRole.auth.admin.getUserById(
      credRow.userId
    );
    if (!authUser.user?.email) {
      return data(error(null, "User not found"), { status: 404 });
    }

    // Create Supabase session via service role
    const authSession = await signInWithPasskey(
      credRow.userId,
      authUser.user.email
    );
    if (!authSession) {
      return data(error(null, "Failed to create session"), { status: 500 });
    }

    const sessionCookie = await setAuthSession(request, { authSession });
    const companyIdCookie = setCompanyId(authSession.companyId);

    return redirect(redirectTo ?? path.to.authenticatedRoot, {
      headers: [
        ["Set-Cookie", sessionCookie],
        ["Set-Cookie", companyIdCookie]
      ]
    });
  } catch (e: any) {
    return data(error(null, e.message ?? "Authentication failed"), {
      status: 401
    });
  }
}
