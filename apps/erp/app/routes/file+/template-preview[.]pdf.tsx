import { requirePermissions } from "@carbon/auth/auth.server";
import type { ExportField, ExportRow } from "@carbon/documents/pdf";
import { ExportTemplatePDF } from "@carbon/documents/pdf";
import { renderToStream } from "@react-pdf/renderer";
import type { LoaderFunctionArgs } from "react-router";
import type { TemplateConfig } from "~/modules/settings/types";
import { DEFAULT_TEMPLATE_CONFIG } from "~/modules/settings/types";
import {
  applyComputedFields,
  computedFieldToExportField
} from "~/utils/computed-fields";
import { getFieldsForModuleCategory } from "~/utils/field-registry";
import { getLocale } from "~/utils/request";

export async function loader({ request }: LoaderFunctionArgs) {
  await requirePermissions(request, { view: "settings" });

  const sp = new URL(request.url).searchParams;
  const module = sp.get("module") ?? "Purchasing";
  const category = sp.get("category") ?? null;

  let config: TemplateConfig = DEFAULT_TEMPLATE_CONFIG;
  try {
    const raw = JSON.parse(sp.get("config") ?? "{}");
    config = { ...DEFAULT_TEMPLATE_CONFIG, ...raw };
  } catch {
    // fall back to defaults
  }

  const fieldKeys = (Array.isArray(config.fields) ? config.fields : []).map(
    (f) => f.key
  );
  const computedFields = Array.isArray(config.computedFields)
    ? config.computedFields
    : [];

  const locale = getLocale(request);
  const allFields = getFieldsForModuleCategory(module, category);
  const activeDefs =
    fieldKeys.length > 0
      ? allFields.filter((f) => fieldKeys.includes(f.key))
      : [];

  const sourceRows: ExportRow[] =
    activeDefs.length > 0
      ? Array.from({ length: 5 }, (_, i) => {
          const row: Record<string, unknown> = {};
          for (const f of activeDefs) {
            row[f.key] = "";
          }
          return row;
        })
      : [];

  const rows = applyComputedFields(sourceRows, computedFields);

  const sourceFields: ExportField[] = activeDefs.map((f) => ({
    key: f.key,
    label: f.label,
    type: (f.type === "status" ? "text" : f.type) as ExportField["type"]
  }));

  const computedExportFields = computedFields
    .filter((f) => f.enabled)
    .map(computedFieldToExportField);

  const fields: ExportField[] = [...sourceFields, ...computedExportFields];

  const stream = await renderToStream(
    <ExportTemplatePDF
      rows={rows}
      fields={fields}
      config={config}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      company={{ name: "Preview" } as any}
      locale={locale}
      templateName={config.pdfTitleConfigs.title || "Template Preview"}
    />
  );

  const body = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on("data", (d) => chunks.push(d));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });

  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="preview.pdf"'
    }
  });
}
