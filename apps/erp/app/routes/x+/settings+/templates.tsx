import { error } from "@carbon/auth";
import { requirePermissions } from "@carbon/auth/auth.server";
import { flash } from "@carbon/auth/session.server";
import type { LoaderFunctionArgs } from "react-router";
import { Outlet, redirect, useLoaderData } from "react-router";
import { getTemplates, TemplatesTable } from "~/modules/settings";
import type { Handle } from "~/utils/handle";
import { path } from "~/utils/path";
// import { getGenericQueryFilters } from "~/utils/query";

export const handle: Handle = {
  breadcrumb: "Templates",
  to: path.to.templates
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { client, companyId } = await requirePermissions(request, {
    view: "settings"
  });

  // const url = new URL(request.url);
  // const searchParams = new URLSearchParams(url.search);
  // const search = searchParams.get("search");
  // const { limit, offset, sorts, filters } =
  //   getGenericQueryFilters(searchParams);

  const templates = await getTemplates(client, companyId);

  if (templates.error) {
    throw redirect(
      path.to.settings,
      await flash(request, error(templates.error, "Failed to load templates"))
    );
  }

  return {
    templates: templates.data ?? [],
    count: templates.count ?? 0
  };
}

export default function TemplatesRoute() {
  const { templates, count } = useLoaderData<typeof loader>();
  return (
    <>
      <TemplatesTable count={count} data={templates} />
      <Outlet />
    </>
  );
}
