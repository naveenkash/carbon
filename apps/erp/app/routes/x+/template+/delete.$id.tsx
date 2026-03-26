import { assertIsPost, error, success } from "@carbon/auth";
import { requirePermissions } from "@carbon/auth/auth.server";
import { flash } from "@carbon/auth/session.server";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data, redirect, useNavigate, useParams } from "react-router";
import { ConfirmDelete } from "~/components/Modals";
import { deleteTemplate, getTemplate } from "~/modules/settings";
import { path } from "~/utils/path";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { client } = await requirePermissions(request, {
    delete: "settings"
  });

  const { id } = params;
  if (!id) throw new Response("Not found", { status: 404 });

  const result = await getTemplate(client, id);
  if (result.error || !result.data) {
    throw redirect(
      path.to.templates,
      await flash(request, error(result.error, "Template not found"))
    );
  }

  return { template: result.data };
}

export async function action({ request, params }: ActionFunctionArgs) {
  assertIsPost(request);
  const { client } = await requirePermissions(request, {
    delete: "settings"
  });

  const { id } = params;
  if (!id) throw new Response("Not found", { status: 404 });

  const result = await deleteTemplate(client, id);

  if (result.error) {
    return data(
      {},
      await flash(request, error(result.error, "Failed to delete template"))
    );
  }

  throw redirect(
    path.to.templates,
    await flash(request, success("Template deleted"))
  );
}

export default function DeleteTemplateRoute() {
  const navigate = useNavigate();
  const { id } = useParams();

  if (!id) throw new Error("Could not find id");

  return (
    <ConfirmDelete
      action={path.to.deleteTemplate(id!)}
      name="template"
      text="Are you sure you want to delete this template? This action cannot be undone."
      onCancel={() => navigate(path.to.templates)}
    />
  );
}
