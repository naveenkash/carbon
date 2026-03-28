import { assertIsPost, error, success } from "@carbon/auth";
import { requirePermissions } from "@carbon/auth/auth.server";
import { flash } from "@carbon/auth/session.server";
import { validationError, validator } from "@carbon/form";
import { useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data, redirect, useLoaderData, useOutletContext } from "react-router";
import {
  getTemplate,
  TemplateManager,
  templateValidator,
  upsertTemplate
} from "~/modules/settings";
import type { TemplateConfig } from "~/modules/settings/types";
import type { TemplateOutletContext } from "~/routes/x+/template+/_layout";
import { path } from "~/utils/path";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { client, companyId } = await requirePermissions(request, {
    update: "settings"
  });

  const { id } = params;
  if (!id) throw new Response("Not found", { status: 404 });

  const result = await getTemplate(client, id, companyId);
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
      id,
      ...rest,
      templateConfiguration,
      companyId,
      updatedBy: userId
    },
    companyId
  );

  if (result.error) {
    return data(
      {},
      await flash(request, error(result.error, "Failed to update template"))
    );
  }

  throw redirect(
    path.to.templates,
    await flash(request, success("Template updated"))
  );
}

export default function EditTemplateRoute() {
  const { template } = useLoaderData<typeof loader>();

  const { selectedFields, setSelectedFields } =
    useOutletContext<TemplateOutletContext>();

  const raw = template.templateConfiguration as
    | (Partial<TemplateConfig> & { fields?: string[] })
    | null;
  const initialFields = raw?.fields ?? [];
  const module = template.module ?? "Purchasing";
  const category = template.category ?? null;

  useEffect(() => {
    setSelectedFields(initialFields);
  }, [initialFields, setSelectedFields]);

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
