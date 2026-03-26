import { assertIsPost, error } from "@carbon/auth";
import { requirePermissions } from "@carbon/auth/auth.server";
import { flash } from "@carbon/auth/session.server";
import { validationError, validator } from "@carbon/form";
import { useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  data,
  redirect,
  useLoaderData,
  useNavigate,
  useOutletContext
} from "react-router";
import {
  getTemplate,
  TemplateManager,
  templateValidator,
  upsertTemplate
} from "~/modules/settings";
import {
  DEFAULT_TEMPLATE_CONFIG,
  type TemplateConfig
} from "~/modules/settings/types";
import type { TemplateOutletContext } from "~/routes/x+/template+/_layout";
import { path } from "~/utils/path";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { client } = await requirePermissions(request, {
    update: "settings"
  });

  const { id } = params;
  if (!id) throw new Response("Not found", { status: 404 });

  const result = await getTemplate(client, id);
  if (result.error || !result.data) {
    throw new Response("Template not found", { status: 404 });
  }

  return { template: result.data };
}

export async function action({ request, params }: ActionFunctionArgs) {
  assertIsPost(request);
  const { client, companyId, userId } = await requirePermissions(request, {
    update: "settings"
  });

  const { id } = params;
  if (!id) throw new Response("Not found", { status: 404 });

  const formData = await request.formData();
  const validation = await validator(templateValidator).validate(formData);

  if (validation.error) {
    return validationError(validation.error);
  }

  const {
    id: _id,
    fields: fieldsJson,
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
    enableDatestamp,
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
    fontSize: fontSize ?? "default",
    pdfTitleConfigs: {
      title: pdfTitle ?? "",
      isUppercase: pdfIsUppercase === "true",
      layout: pdfLayout ?? "left_aligned"
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
      order: sortOrder || null
    }
  };

  const result = await upsertTemplate(client, {
    id,
    ...rest,
    templateConfiguration,
    companyId,
    updatedBy: userId
  });

  if (result.error) {
    return data(
      {},
      await flash(request, error(result.error, "Failed to update template"))
    );
  }

  return redirect(path.to.templates);
}

export default function EditTemplateRoute() {
  const { template } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const {
    selectedFields,
    setSelectedFields,
    setModule,
    setCategory,
    setAction,
    setInitialName,
    setInitialConfig
  } = useOutletContext<TemplateOutletContext>();

  const raw = template.templateConfiguration as
    | (Partial<TemplateConfig> & { fields?: string[] })
    | null;
  const initialFields = raw?.fields ?? [];
  // module and category are stored as DB enum values
  const module = template.module ?? "Purchasing";
  const category = template.category ?? null;

  useEffect(() => {
    setModule(module);
    setCategory(category);
    setAction(path.to.template(template.id));
    setInitialName(template.name);
    setSelectedFields(initialFields);
    setInitialConfig({ ...DEFAULT_TEMPLATE_CONFIG, ...raw });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.id]);

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
