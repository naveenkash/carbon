import { requirePermissions } from "@carbon/auth/auth.server";
import type {
  ExportRow,
  ExportTemplateConfig,
  ExportTemplatePDFProps
} from "@carbon/documents/pdf";
import { ExportTemplatePDF } from "@carbon/documents/pdf";
import { renderToStream } from "@react-pdf/renderer";
import type { LoaderFunctionArgs } from "react-router";
import { getCompany, getTemplate } from "~/modules/settings";
import {
  type ComputedField,
  DEFAULT_TEMPLATE_CONFIG,
  type TemplateConfig,
  type TemplateField
} from "~/modules/settings/types";
import {
  applyComputedFields,
  computedFieldToExportField
} from "~/utils/computed-fields";
import { runExportQuery } from "~/utils/export-query";
import { getLocale } from "~/utils/request";
import type { Company } from "../../../../../../packages/documents/src/types";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { client, companyId, userId } = await requirePermissions(request, {
    view: "settings"
  });

  const { templateId } = params;
  if (!templateId) throw new Response("Not found", { status: 404 });

  const [templateResult, companyResult, userResult] = await Promise.all([
    getTemplate(client, templateId, companyId),
    getCompany(client, companyId),
    client.from("user").select("fullName").eq("id", userId).single()
  ]);

  if (templateResult.error || !templateResult.data) {
    throw new Response(templateResult.error.message, { status: 404 });
  }
  if (companyResult.error || !companyResult.data) {
    throw new Response("Company not found", { status: 404 });
  }

  const template = templateResult.data;
  const company = companyResult.data;
  const generatedBy = userResult.data?.fullName ?? undefined;

  const raw = template.templateConfiguration as
    | (Partial<TemplateConfig> & {
        fields?: TemplateField[];
        computedFields?: ComputedField[];
      })
    | null;
  const config: TemplateConfig = { ...DEFAULT_TEMPLATE_CONFIG, ...(raw ?? {}) };
  const fieldKeys = (raw?.fields ?? []).map((f) => f.key);
  const computedFields: ComputedField[] = raw?.computedFields ?? [];

  const locale = getLocale(request);

  const exportResult = await runExportQuery(client, {
    module: template.module,
    category: template.category ?? null,
    fieldKeys,
    companyId
  });

  if (exportResult.error) {
    throw new Response("Failed to export", { status: 500 });
  }

  const sourceRows = exportResult.data ?? [];

  const rows: ExportRow[] = applyComputedFields(sourceRows, computedFields);

  const computedExportFields = computedFields
    .filter((f) => f.enabled)
    .map(computedFieldToExportField);

  const fields: ExportTemplatePDFProps["fields"] = [
    ...(exportResult.fields as ExportTemplatePDFProps["fields"]),
    ...computedExportFields
  ];

  const pdfConfig: ExportTemplateConfig = {
    templateStyle: config.templateStyle,
    colorTheme: config.colorTheme,
    templateFont: config.templateFont,
    margins: config.margins,
    fontSize: config.fontSize,
    pdfTitleConfigs: config.pdfTitleConfigs,
    pageFooterConfigs: config.pageFooterConfigs
  };

  const stream = await renderToStream(
    <ExportTemplatePDF
      rows={rows}
      fields={fields}
      config={pdfConfig}
      company={company as Company}
      locale={locale}
      currencyCode={company.baseCurrencyCode}
      templateName={template.name}
      generatedBy={generatedBy}
    />
  );

  const body: Buffer = await new Promise((resolve, reject) => {
    const buffers: Uint8Array[] = [];
    stream.on("data", (data) => {
      buffers.push(data);
    });
    stream.on("end", () => {
      resolve(Buffer.concat(buffers));
    });
    stream.on("error", reject);
  });

  const headers = new Headers({
    "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename="${template.name}.pdf"`
  });
  return new Response(new Uint8Array(body), { status: 200, headers });
}
