import { requirePermissions } from "@carbon/auth/auth.server";
import type { ExportField } from "@carbon/documents/pdf";
import type { LoaderFunctionArgs } from "react-router";
import { getTemplate } from "~/modules/settings";
import type {
  ComputedField,
  TemplateConfig,
  TemplateField
} from "~/modules/settings/types";
import { applyComputedFields, buildCsvString } from "~/utils/computed-fields";
import { runExportQuery } from "~/utils/export-query";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { client, companyId } = await requirePermissions(request, {
    view: "settings"
  });

  const { templateId } = params;
  if (!templateId) throw new Response("Not found", { status: 404 });

  const templateResult = await getTemplate(client, templateId, companyId);
  if (templateResult.error || !templateResult.data) {
    throw new Response("Template not found", { status: 404 });
  }

  const template = templateResult.data;

  const raw = template.templateConfiguration as
    | (Partial<TemplateConfig> & {
        fields?: TemplateField[];
        computedFields?: ComputedField[];
      })
    | null;

  const fieldKeys = (raw?.fields ?? []).map((f) => f.key);
  const computedFields: ComputedField[] = raw?.computedFields ?? [];
  const sortConfigs = raw?.sortConfigs;

  const exportResult = await runExportQuery(client, {
    module: template.module,
    category: template.category ?? null,
    fieldKeys,
    companyId
  });

  if (exportResult.error) {
    throw new Response(String(exportResult.error), { status: 500 });
  }

  const sourceRows = exportResult.data ?? [];
  const rows = applyComputedFields(sourceRows, computedFields);

  if (sortConfigs?.sortBy) {
    const { sortBy, sortDirection } = sortConfigs;
    rows.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      let cmp: number;
      if (typeof aVal === "number" && typeof bVal === "number") {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal));
      }
      return sortDirection === "desc" ? -cmp : cmp;
    });
  }

  const sourceFields = exportResult.fields as ExportField[];

  const csv = buildCsvString(rows, sourceFields, computedFields);

  const headers = new Headers({
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${template.name}.csv"`
  });

  return new Response(csv, { status: 200, headers });
}
