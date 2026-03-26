import { error } from "@carbon/auth";
import { requirePermissions } from "@carbon/auth/auth.server";
import { flash } from "@carbon/auth/session.server";
import type { LoaderFunctionArgs } from "react-router";
import { Outlet, redirect, useLoaderData } from "react-router";
import { getApiKeys, TemplatesTable } from "~/modules/settings";
import type { Handle } from "~/utils/handle";
import { path } from "~/utils/path";
import { getGenericQueryFilters } from "~/utils/query";

export const handle: Handle = {
  breadcrumb: "Temapltes",
  to: path.to.templates
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { client, companyId } = await requirePermissions(request, {
    update: "users"
  });

  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const search = searchParams.get("search");
  const { limit, offset, sorts, filters } =
    getGenericQueryFilters(searchParams);

  const apiKeys = await getApiKeys(client, companyId, {
    limit,
    offset,
    sorts,
    search,
    filters
  });
  if (apiKeys.error) {
    throw redirect(
      path.to.settings,
      await flash(request, error(apiKeys.error, "Failed to load templates"))
    );
  }

  return {
    apiKeys: apiKeys.data?.map(({ keyHash, ...rest }: any) => rest) ?? [],
    count: apiKeys.count ?? 0,
    companyId
  };
}

export default function Templates() {
  const { apiKeys, count } = useLoaderData<typeof loader>();
  return (
    <>
      <TemplatesTable count={count} data={apiKeys} />
      <Outlet />
    </>
  );
}
