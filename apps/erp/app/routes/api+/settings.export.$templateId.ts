import { requirePermissions } from "@carbon/auth/auth.server";
import type { LoaderFunctionArgs } from "react-router";
import { getTemplate } from "~/modules/settings";
import type { TemplateConfig } from "~/modules/settings/types";
import { formatExportRows, rowsToCsv } from "~/utils/export-formatter";
import { runExportQuery } from "~/utils/export-query";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { client, companyId } = await requirePermissions(request, {
    view: "settings"
  });

  const { templateId } = params;
  if (!templateId) throw new Response("Not found", { status: 404 });

  // Load the template
  const result = await getTemplate(client, templateId);
  if (result.error || !result.data) {
    throw new Response("Template not found", { status: 404 });
  }

  const template = result.data;
  const raw = template.templateConfiguration as
    | (Partial<TemplateConfig> & { fields?: string[] })
    | null;

  const fieldKeys: string[] = raw?.fields ?? [];
  const module: string = template.module ?? "";
  const category: string | null = template.category ?? null;

  if (!module || fieldKeys.length === 0) {
    throw new Response("Template has no fields configured", { status: 400 });
  }

  const queryResult = await runExportQuery(client, {
    module,
    category,
    fieldKeys,
    companyId
  });
  console.log(queryResult.error);

  if (queryResult.error) {
    throw new Response(queryResult.error.message, { status: 500 });
  }

  const { columns, rows } = formatExportRows(
    queryResult.data,
    queryResult.fields
  );
  const csv = rowsToCsv(columns, rows);

  const filename = `${template.name.replace(/\s+/g, "_")}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
