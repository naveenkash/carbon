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
    colorTheme,
    margins,
    templateFont,
    templateStyle,
    isDecorator,
    isUppercase,
    fontSize,
    pdfTitle,
    pdfIsUppercase,
    pdfLayout,
    enablePageNumber,
    enableGeneratedBy,
    enableTimeStamp,
    sortType,
    primarySortBy,
    sortOrder,
    ...rest
  } = validation.data;
  const fields: string[] = fieldsJson ? JSON.parse(fieldsJson) : [];

  const templateConfiguration: TemplateConfig = {
    fields,
    colorTheme: colorTheme ?? "default",
    margins: margins ?? "default",
    templateFont: templateFont ?? "Inter",
    templateStyle: templateStyle ?? "REPORT_TEMPLATE_CLASSIC",
    isDecorator: isDecorator === "true",
    isUppercase: isUppercase === "true",
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
      type: sortType ?? "FIXED",
      primarySortBy: primarySortBy ?? "NAME_ASC",
      order: sortOrder || null
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

  const { selectedFields, setSelectedFields } =
    useOutletContext<TemplateOutletContext>();

  const handleToggleField = (fieldKey: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldKey)
        ? prev.filter((key) => key !== fieldKey)
        : [...prev, fieldKey]
    );
  };

  return (
    <TemplateManager
      module={module}
      category={category}
      selectedFields={selectedFields}
      onToggleField={handleToggleField}
    />
  );
}
