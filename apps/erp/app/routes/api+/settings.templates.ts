import { requirePermissions } from "@carbon/auth/auth.server";
import type { LoaderFunctionArgs } from "react-router";
import { getTemplates } from "~/modules/settings";

export async function loader({ request }: LoaderFunctionArgs) {
  const { client, companyId } = await requirePermissions(request, {});

  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const module = searchParams.get("module");
  const search = searchParams.get("search");
  const category = searchParams.get("category");

  let query = getTemplates(client, companyId, {
    module,
    search,
    category
  });

  return query;
}
