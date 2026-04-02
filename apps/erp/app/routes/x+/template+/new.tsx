import { assertIsPost, error, success } from "@carbon/auth";
import { requirePermissions } from "@carbon/auth/auth.server";
import { flash } from "@carbon/auth/session.server";
import { validationError, validator } from "@carbon/form";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  data,
  redirect,
  useOutletContext,
  useSearchParams
} from "react-router";
import {
  type ComputedField,
  type TemplateConfig,
  TemplateManager,
  templateValidator,
  upsertTemplate
} from "~/modules/settings";
import type { TemplateOutletContext } from "~/routes/x+/template+/_layout";
import { path } from "~/utils/path";

export async function loader({ request }: LoaderFunctionArgs) {
  await requirePermissions(request, { create: "settings" });
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  assertIsPost(request);
  const { client, companyId, userId } = await requirePermissions(request, {
    create: "settings"
  });

  const formData = await request.formData();
  const validation = await validator(templateValidator).validate(formData);

  if (validation.error) return validationError(validation.error);

  const {
    id: _id,
    fields: fieldsJson,
    computedFields: computedFieldsJson,
    colorTheme,
    margins,
    templateFont,
    templateStyle,
    fontSize,
    pdfTitle,
    pdfIsUppercase,
    pdfLayout,
    enablePageNumber,
    enableGeneratedBy,
    enableTimeStamp,
    sortBy,
    sortDirection,
    ...rest
  } = validation.data;
  const fields = fieldsJson ? JSON.parse(fieldsJson) : [];
  const computedFields: ComputedField[] = computedFieldsJson
    ? JSON.parse(computedFieldsJson)
    : [];

  const templateConfiguration: TemplateConfig = {
    fields,
    computedFields,
    colorTheme: colorTheme ?? "default",
    margins: margins ?? "default",
    templateFont: templateFont ?? "Inter",
    templateStyle: templateStyle ?? "REPORT_TEMPLATE_CLASSIC",
    fontSize: fontSize ?? "default",
    pdfTitleConfigs: {
      title: pdfTitle ?? "",
      isUppercase: pdfIsUppercase,
      layout: pdfLayout ?? "left_aligned"
    },
    pageFooterConfigs: {
      enablePageNumber,
      enableGeneratedBy,
      enableTimeStamp
    },
    sortConfigs: {
      sortBy: sortBy ?? "",
      sortDirection: (sortDirection as "asc" | "desc") ?? "asc"
    }
  };

  const result = await upsertTemplate(
    client,
    {
      ...rest,
      templateConfiguration,
      companyId,
      createdBy: userId
    },
    companyId
  );

  if (result.error) {
    return data(
      {},
      await flash(request, error(result.error, "Failed to create template"))
    );
  }

  throw redirect(
    path.to.templates,
    await flash(request, success("New template created"))
  );
}

export default function NewTemplateRoute() {
  const [searchParams] = useSearchParams();

  const module = searchParams.get("module") ?? "Purchasing";
  const category = searchParams.get("category");

  const { liveConfig } = useOutletContext<TemplateOutletContext>();

  return (
    <TemplateManager
      module={module}
      category={category}
      previewConfig={liveConfig}
    />
  );
}
