import { Boolean, Select, ValidatedForm } from "@carbon/form";
import {
  Heading,
  HStack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useMount,
  VStack
} from "@carbon/react";
import { themes } from "@carbon/utils";
import type React from "react";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { useFetcher, useParams, useSearchParams } from "react-router";
import { Hidden, Input } from "~/components/Form";
import FieldPicker from "~/components/Templates/FieldPicker";
import { useRouteData } from "~/hooks";
import { templateValidator } from "~/modules/settings/settings.models";
import {
  type ComputedField,
  DEFAULT_TEMPLATE_CONFIG,
  type Template,
  type TemplateConfig,
  type TemplateField
} from "~/modules/settings/types";
import { getFieldsForModuleCategory } from "~/utils/field-registry";
import { path } from "~/utils/path";
import ComputedFieldsTab from "./ComputedFieldsTab";

interface SettingsPanelProps {
  selectedFields: TemplateField[];
  onToggleField: (fieldKey: string) => void;
  computedFields: ComputedField[];
  setComputedFields: Dispatch<SetStateAction<ComputedField[]>>;
  onConfigChange: (config: TemplateConfig) => void;
}

export const TEMPLATE_FORM_ID = "template-settings-form";

const COLOR_THEME_OPTIONS = themes.map((t) => ({
  label: t.label,
  value: t.name
}));

const FONT_OPTIONS = [{ value: "Inter", label: "Inter" }];

const TEMPLATE_STYLE_OPTIONS = [
  { value: "REPORT_TEMPLATE_CLASSIC", label: "Classic" },
  { value: "REPORT_TEMPLATE_MODERN", label: "Modern" },
  { value: "REPORT_TEMPLATE_MINIMAL", label: "Minimal" }
];

const MARGINS_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "narrow", label: "Narrow" },
  { value: "wide", label: "Wide" }
];

const FONT_SIZE_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "small", label: "Small" },
  { value: "large", label: "Large" }
];

const LAYOUT_OPTIONS = [
  { value: "left_aligned", label: "Left Aligned" },
  { value: "centered", label: "Centered" },
  { value: "right_aligned", label: "Right Aligned" }
];

type LocalConfig = {
  colorTheme: string;
  margins: string;
  templateFont: string;
  templateStyle: string;
  fontSize: string;
  pdfTitle: string;
  pdfLayout: string;
  pdfIsUppercase: boolean;
  enablePageNumber: boolean;
  enableGeneratedBy: boolean;
  enableTimeStamp: boolean;
  sortType: string;
  primarySortBy: string;
  sortOrder: string | null;
};

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  selectedFields,
  onToggleField,
  computedFields,
  setComputedFields,
  onConfigChange
}) => {
  const fetcher = useFetcher();
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const routeData = useRouteData<{ template: Template }>(
    id ? path.to.template(id) : ""
  );

  const isEditing = !!id;
  const template = routeData?.template ?? null;

  const module = isEditing
    ? (template?.module ?? "")
    : (searchParams.get("module") ?? "");
  const category = isEditing
    ? (template?.category ?? null)
    : searchParams.get("category");

  const action = isEditing ? path.to.template(id!) : path.to.newTemplate;
  const initialName = template?.name ?? "";
  const rawConfig = template?.templateConfiguration as
    | (Partial<TemplateConfig> & { fields?: unknown[] })
    | null;
  const initialConfig: Partial<TemplateConfig> = rawConfig
    ? { ...DEFAULT_TEMPLATE_CONFIG, ...rawConfig }
    : DEFAULT_TEMPLATE_CONFIG;

  const cfg = initialConfig;
  const pdf = {
    ...DEFAULT_TEMPLATE_CONFIG.pdfTitleConfigs,
    ...initialConfig?.pdfTitleConfigs
  };
  const footer = {
    ...DEFAULT_TEMPLATE_CONFIG.pageFooterConfigs,
    ...initialConfig?.pageFooterConfigs
  };
  const sort = {
    ...DEFAULT_TEMPLATE_CONFIG.sortConfigs,
    ...initialConfig?.sortConfigs
  };

  const availableFields = getFieldsForModuleCategory(module, category);

  // Local state for live preview tracking
  const [localConfig, setLocalConfig] = useState<LocalConfig>({
    colorTheme: cfg.colorTheme ?? DEFAULT_TEMPLATE_CONFIG.colorTheme,
    margins: cfg.margins ?? DEFAULT_TEMPLATE_CONFIG.margins,
    templateFont: cfg.templateFont ?? DEFAULT_TEMPLATE_CONFIG.templateFont,
    templateStyle: cfg.templateStyle ?? DEFAULT_TEMPLATE_CONFIG.templateStyle,
    fontSize: cfg.fontSize ?? DEFAULT_TEMPLATE_CONFIG.fontSize,
    pdfTitle: pdf.title ?? "",
    pdfLayout: pdf.layout ?? DEFAULT_TEMPLATE_CONFIG.pdfTitleConfigs.layout,
    pdfIsUppercase: pdf.isUppercase ?? false,
    enablePageNumber: footer.enablePageNumber ?? true,
    enableGeneratedBy: footer.enableGeneratedBy ?? false,
    enableTimeStamp: footer.enableTimeStamp ?? false,
    sortType: sort.type ?? DEFAULT_TEMPLATE_CONFIG.sortConfigs.type,
    primarySortBy:
      sort.primarySortBy ?? DEFAULT_TEMPLATE_CONFIG.sortConfigs.primarySortBy,
    sortOrder: sort.order ?? null
  });

  useMount(() => {
    if (routeData?.template.templateConfiguration) {
      setComputedFields(
        routeData.template.templateConfiguration.computedFields ?? []
      );
    }
  });

  // Propagate local config changes to parent for live preview
  useEffect(() => {
    onConfigChange({
      colorTheme: localConfig.colorTheme,
      margins: localConfig.margins,
      templateFont: localConfig.templateFont,
      templateStyle: localConfig.templateStyle,
      fontSize: localConfig.fontSize,
      fields: initialConfig.fields ?? [],
      computedFields: initialConfig.computedFields ?? [],
      pdfTitleConfigs: {
        title: localConfig.pdfTitle,
        isUppercase: localConfig.pdfIsUppercase,
        layout: localConfig.pdfLayout
      },
      pageFooterConfigs: {
        enablePageNumber: localConfig.enablePageNumber,
        enableGeneratedBy: localConfig.enableGeneratedBy,
        enableTimeStamp: localConfig.enableTimeStamp
      },
      sortConfigs: {
        type: localConfig.sortType,
        primarySortBy: localConfig.primarySortBy,
        order: localConfig.sortOrder
      }
    });
  }, [
    localConfig,
    onConfigChange,
    initialConfig.computedFields,
    initialConfig.fields
  ]);

  return (
    <VStack className="w-4/12 bg-card h-full overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-accent border-l border-border px-4 py-2 text-sm">
      <VStack>
        <Heading size="h2">Template Settings</Heading>
        <ValidatedForm
          key={`${action}-${initialName}`}
          className="w-full"
          id={TEMPLATE_FORM_ID}
          validator={templateValidator}
          method="post"
          action={action}
          defaultValues={{
            name: initialName,
            colorTheme: cfg.colorTheme,
            margins: cfg.margins,
            fields: JSON.stringify(selectedFields),
            computedFields: JSON.stringify(computedFields),
            templateFont: cfg.templateFont,
            templateStyle: cfg.templateStyle,
            fontSize: cfg.fontSize,
            pdfTitle: pdf.title,
            pdfLayout: pdf.layout,
            pdfIsUppercase: pdf.isUppercase,
            enablePageNumber: footer.enablePageNumber,
            enableGeneratedBy: footer.enableGeneratedBy,
            enableTimeStamp: footer.enableTimeStamp,
            sortType: sort.type,
            primarySortBy: sort.primarySortBy,
            sortOrder: sort.order ?? ""
          }}
          fetcher={fetcher}
        >
          <Hidden name="module" value={module} />
          {category && <Hidden name="category" value={category} />}
          <Hidden name="fields" value={JSON.stringify(selectedFields)} />
          <Hidden
            name="computedFields"
            value={JSON.stringify(computedFields)}
          />

          <Tabs defaultValue="fields">
            <TabsList>
              <TabsTrigger value="fields">Fields</TabsTrigger>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="pdf">PDF</TabsTrigger>
              <TabsTrigger value="computed">Computed</TabsTrigger>
            </TabsList>

            <TabsContent
              forceMount
              value="fields"
              className="min-h-[120px] pt-4 data-[state=inactive]:hidden"
            >
              <FieldPicker
                module={module}
                category={category}
                selectedFields={selectedFields}
                onToggleField={onToggleField}
              />
            </TabsContent>

            <TabsContent
              forceMount
              value="general"
              className="min-h-[120px] pt-4 data-[state=inactive]:hidden"
            >
              <VStack spacing={4} className="pb-5">
                <Input
                  name="name"
                  placeholder="Template name"
                  label="Template Name"
                />
                <Select
                  name="colorTheme"
                  label="Color Theme"
                  options={COLOR_THEME_OPTIONS}
                  onChange={(v) =>
                    setLocalConfig((p) => ({
                      ...p,
                      colorTheme: v?.value ?? p.colorTheme
                    }))
                  }
                />
                <Select
                  name="margins"
                  label="Margins"
                  options={MARGINS_OPTIONS}
                  onChange={(v) =>
                    setLocalConfig((p) => ({
                      ...p,
                      margins: v?.value ?? p.margins
                    }))
                  }
                />
                <Select
                  name="templateFont"
                  label="Font"
                  options={FONT_OPTIONS}
                  onChange={(v) =>
                    setLocalConfig((p) => ({
                      ...p,
                      templateFont: v?.value ?? p.templateFont
                    }))
                  }
                />
                <Select
                  name="templateStyle"
                  label="Template Style"
                  options={TEMPLATE_STYLE_OPTIONS}
                  onChange={(v) =>
                    setLocalConfig((p) => ({
                      ...p,
                      templateStyle: v?.value ?? p.templateStyle
                    }))
                  }
                />
                <Select
                  name="fontSize"
                  label="Font Size"
                  options={FONT_SIZE_OPTIONS}
                  onChange={(v) =>
                    setLocalConfig((p) => ({
                      ...p,
                      fontSize: v?.value ?? p.fontSize
                    }))
                  }
                />
              </VStack>

              {/* <VStack>
                  <Heading size="h4">Sort</Heading>
                  <Select
                    name="primarySortBy"
                    label="Primary Sort By"
                    options={SORT_BY_OPTIONS}
                    onChange={(v) =>
                      setLocalConfig((p) => ({
                        ...p,
                        primarySortBy: v?.value ?? p.primarySortBy
                      }))
                    }
                  />
                </VStack> */}
            </TabsContent>

            <TabsContent
              forceMount
              value="pdf"
              className="min-h-[120px] pt-5 data-[state=inactive]:hidden"
            >
              <VStack spacing={4}>
                <VStack className="border-b pb-5">
                  <Select
                    className="mb-3"
                    name="pdfLayout"
                    label="Layout"
                    options={LAYOUT_OPTIONS}
                    onChange={(v) =>
                      setLocalConfig((p) => ({
                        ...p,
                        pdfLayout: v?.value ?? p.pdfLayout
                      }))
                    }
                  />
                  <Heading size="h4">Header Details</Heading>
                  <Input
                    placeholder="PDF Title"
                    name="pdfTitle"
                    label="Title"
                    onChange={(e) =>
                      setLocalConfig((p) => ({
                        ...p,
                        pdfTitle: e.target.value
                      }))
                    }
                  />
                  <Boolean
                    name="pdfIsUppercase"
                    label="Title Uppercase"
                    onChange={(checked) =>
                      setLocalConfig((p) => ({
                        ...p,
                        pdfIsUppercase: checked
                      }))
                    }
                  />
                </VStack>

                <VStack className="pb-5">
                  <Heading size="h4">Footer</Heading>
                  <HStack className="space-x-2 justify-between w-full">
                    <Boolean
                      name="enablePageNumber"
                      label="Enable Page Number"
                      onChange={(checked) =>
                        setLocalConfig((p) => ({
                          ...p,
                          enablePageNumber: checked
                        }))
                      }
                    />
                    <Boolean
                      name="enableGeneratedBy"
                      label="Enable Generated By"
                      onChange={(checked) =>
                        setLocalConfig((p) => ({
                          ...p,
                          enableGeneratedBy: checked
                        }))
                      }
                    />
                  </HStack>
                  <HStack className="space-x-2 justify-between w-full">
                    <Boolean
                      name="enableTimeStamp"
                      label="Enable Timestamp"
                      onChange={(checked) =>
                        setLocalConfig((p) => ({
                          ...p,
                          enableTimeStamp: checked
                        }))
                      }
                    />
                  </HStack>
                </VStack>
              </VStack>
            </TabsContent>

            <TabsContent
              value="computed"
              className="min-h-[120px] pt-4 data-[state=inactive]:hidden"
            >
              <ComputedFieldsTab
                computedFields={computedFields}
                setComputedFields={setComputedFields}
                availableFields={availableFields}
              />
            </TabsContent>
          </Tabs>
        </ValidatedForm>
      </VStack>
    </VStack>
  );
};

export default SettingsPanel;
