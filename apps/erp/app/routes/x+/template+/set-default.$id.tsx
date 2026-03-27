import { assertIsPost, error, success } from "@carbon/auth";
import { requirePermissions } from "@carbon/auth/auth.server";
import { flash } from "@carbon/auth/session.server";
import type { ActionFunctionArgs } from "react-router";
import { data, redirect } from "react-router";
import { setDefaultTemplate } from "~/modules/settings";
import { path } from "~/utils/path";

export async function action({ request, params }: ActionFunctionArgs) {
  assertIsPost(request);
  const { client, companyId } = await requirePermissions(request, {
    update: "settings"
  });

  const { id } = params;
  if (!id) throw new Response("Not found", { status: 404 });

  const result = await setDefaultTemplate(client, id, companyId);

  if (result.error) {
    return data(
      {},
      await flash(
        request,
        error(result.error, "Failed to set default template")
      )
    );
  }

  throw redirect(
    path.to.templates,
    await flash(request, success("Default template updated"))
  );
}
