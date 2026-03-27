import { assertIsPost, error, success } from "@carbon/auth";
import { requirePermissions } from "@carbon/auth/auth.server";
import { flash } from "@carbon/auth/session.server";
import { validationError, validator } from "@carbon/form";
import { useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  data,
  redirect,
  useNavigate,
  useOutletContext,
  useSearchParams
} from "react-router";
import {
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
    pdfHeadline,
    pdfDateTitle,
    enablePageNumber,
    enableGeneratedBy,
    enableDatestamp,
    enableTimeStamp,
    sortType,
    primarySortBy,
    secondarySortBy,
    sortOrder,
    ...rest
  } = validation.data;
  const fields: string[] = fieldsJson ? JSON.parse(fieldsJson) : [];

  const templateConfiguration = {
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
      isUppercase: pdfIsUppercase === "true",
      layout: pdfLayout ?? "left_aligned",
      headline: pdfHeadline ?? "HEADLINE_COMPANY_NAME",
      dateTitle: pdfDateTitle ?? ""
    },
    pageFooterConfigs: {
      enablePageNumber: enablePageNumber === "true",
      enableGeneratedBy: enableGeneratedBy === "true",
      enableDatestamp: enableDatestamp === "true",
      enableTimeStamp: enableTimeStamp === "true"
    },
    sortConfigs: {
      type: sortType ?? "FIXED",
      primarySortBy: primarySortBy ?? "NAME_ASC",
      secondarySortBy: secondarySortBy ?? "CODE_ASC",
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // These are DB enum values passed from the calling context (e.g. ?module=Purchasing&category=Orders)
  const module = searchParams.get("module") ?? "Purchasing";
  const category = searchParams.get("category");

  const {
    selectedFields,
    setSelectedFields,
    setModule,
    setCategory,
    setAction,
    setInitialName
  } = useOutletContext<TemplateOutletContext>();

  useEffect(() => {
    setModule(module);
    setCategory(category);
    setAction(path.to.newTemplate);
    setInitialName("");
    setSelectedFields([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module, category, setAction]);

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
      onClose={() => navigate(-1)}
    />
  );
}
