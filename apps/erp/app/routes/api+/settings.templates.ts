import { requirePermissions } from "@carbon/auth/auth.server";
import type { LoaderFunctionArgs } from "react-router";
import { getTemplates } from "~/modules/settings";
import type { Category, Module } from "~/utils/field-registry";
import { getGenericQueryFilters } from "~/utils/query";

export async function loader({ request }: LoaderFunctionArgs) {
  const { client, companyId } = await requirePermissions(request, {});

  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const search = searchParams.get("search");
  const module = searchParams.get("module") as Module;
  const category = searchParams.get("category") as Category;
  const { limit, offset, sorts, filters } =
    getGenericQueryFilters(searchParams);

  const query = getTemplates(client, companyId, {
    search,
    module: module,
    category: category,
    limit,
    offset,
    sorts,
    filters
  });

  return query;
}
