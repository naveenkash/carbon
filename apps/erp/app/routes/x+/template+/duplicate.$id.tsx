import { assertIsPost, error, success } from "@carbon/auth";
import { requirePermissions } from "@carbon/auth/auth.server";
import { flash } from "@carbon/auth/session.server";
import type { ActionFunctionArgs } from "react-router";
import { data, redirect } from "react-router";
import { duplicateTemplate } from "~/modules/settings";
import { path } from "~/utils/path";

export async function action({ request, params }: ActionFunctionArgs) {
  assertIsPost(request);
  const { client, companyId, userId } = await requirePermissions(request, {
    create: "settings"
  });

  const { id } = params;
  if (!id) throw new Response("Not found", { status: 404 });

  const result = await duplicateTemplate(client, id, companyId, userId);

  if (result.error) {
    return data(
      {},
      await flash(request, error(result.error, "Failed to duplicate template"))
    );
  }

  throw redirect(
    path.to.template(result.data.id),
    await flash(request, success("Template duplicated"))
  );
}
