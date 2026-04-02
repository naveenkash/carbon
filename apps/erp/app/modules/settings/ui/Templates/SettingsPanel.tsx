import { Boolean, Select, ValidatedForm } from "@carbon/form";
import {
  Heading,
  HStack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  VStack
} from "@carbon/react";
import { themes } from "@carbon/utils";
import type React from "react";
import { useFetcher, useSearchParams } from "react-router";
import { Hidden, Input } from "~/components/Form";
import FieldPicker from "~/components/Templates/FieldPicker";
import { templateValidator } from "~/modules/settings/settings.models";
import {
  DEFAULT_TEMPLATE_CONFIG,
  type Template,
  type TemplateConfig,
  type TemplateField
} from "~/modules/settings/types";
import {
  type Category,
  getFieldsForModuleCategory,
  type Module
} from "~/utils/field-registry";
import { path } from "~/utils/path";
import ComputedFieldsTab from "./ComputedFieldsTab";

interface SettingsPanelProps {
  template: Template | null;
  config: TemplateConfig;
  onConfigChange: (patch: Partial<TemplateConfig>) => void;
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

const SORT_DIRECTION_OPTIONS = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" }
];

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  template,
  config,
  onConfigChange
}) => {
  const fetcher = useFetcher();
  const [searchParams] = useSearchParams();

  const isEditing = !!template;

  const module = isEditing
    ? template.module
    : (searchParams.get("module") as Module);
  const category = isEditing
    ? template.category
    : (searchParams.get("category") as Category);

  const action = isEditing
    ? path.to.template(template.id)
    : path.to.newTemplate;
  const initialName = template?.name ?? "";
  const rawConfig = template?.templateConfiguration as
    | (Partial<TemplateConfig> & { fields?: unknown[] })
    | null;
  const initialConfig: Partial<TemplateConfig> = rawConfig
    ? { ...DEFAULT_TEMPLATE_CONFIG, ...rawConfig }
    : DEFAULT_TEMPLATE_CONFIG;

  const pdf = {
    ...DEFAULT_TEMPLATE_CONFIG.pdfTitleConfigs,
    ...initialConfig?.pdfTitleConfigs
  };
  const footer = {
    ...DEFAULT_TEMPLATE_CONFIG.pageFooterConfigs,
    ...initialConfig?.pageFooterConfigs
  };
  const sort = {
    sortBy: "",
    sortDirection: "asc" as const,
    ...initialConfig?.sortConfigs
  };

  const availableFields = getFieldsForModuleCategory(module, category);

  function handleToggleField(fieldKey: string) {
    const exists = config.fields.find((f: TemplateField) => f.key === fieldKey);
    const newFields = exists
      ? config.fields.filter((f: TemplateField) => f.key !== fieldKey)
      : [
          ...config.fields,
          {
            key: fieldKey,
            order:
              config.fields.length === 0
                ? 0
                : Math.max(
                    ...config.fields.map((f: TemplateField) => f.order)
                  ) + 1
          }
        ];
    onConfigChange({ fields: newFields });
  }

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
            colorTheme: initialConfig.colorTheme,
            margins: initialConfig.margins,
            fields: JSON.stringify(initialConfig.fields ?? []),
            computedFields: JSON.stringify(initialConfig.computedFields ?? []),
            templateFont: initialConfig.templateFont,
            templateStyle: initialConfig.templateStyle,
            fontSize: initialConfig.fontSize,
            pdfTitle: pdf.title,
            pdfLayout: pdf.layout,
            pdfIsUppercase: pdf.isUppercase,
            enablePageNumber: footer.enablePageNumber,
            enableGeneratedBy: footer.enableGeneratedBy,
            enableTimeStamp: footer.enableTimeStamp,
            sortBy: sort.sortBy,
            sortDirection: sort.sortDirection
          }}
          fetcher={fetcher}
        >
          <Hidden name="module" value={module} />
          {category && <Hidden name="category" value={category} />}
          <Hidden name="fields" value={JSON.stringify(config.fields)} />
          <Hidden
            name="computedFields"
            value={JSON.stringify(config.computedFields)}
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
                selectedFields={config.fields}
                onToggleField={handleToggleField}
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
                    onConfigChange({
                      colorTheme: v?.value ?? config.colorTheme
                    })
                  }
                />
                <Select
                  name="margins"
                  label="Margins"
                  options={MARGINS_OPTIONS}
                  onChange={(v) =>
                    onConfigChange({ margins: v?.value ?? config.margins })
                  }
                />
                <Select
                  name="templateFont"
                  label="Font"
                  options={FONT_OPTIONS}
                  onChange={(v) =>
                    onConfigChange({
                      templateFont: v?.value ?? config.templateFont
                    })
                  }
                />
                <Select
                  name="templateStyle"
                  label="Template Style"
                  options={TEMPLATE_STYLE_OPTIONS}
                  onChange={(v) =>
                    onConfigChange({
                      templateStyle: v?.value ?? config.templateStyle
                    })
                  }
                />
                <Select
                  name="fontSize"
                  label="Font Size"
                  options={FONT_SIZE_OPTIONS}
                  onChange={(v) =>
                    onConfigChange({ fontSize: v?.value ?? config.fontSize })
                  }
                />
                <Select
                  name="sortBy"
                  label="Sort By"
                  options={[
                    { value: "__none__", label: "None" },
                    ...availableFields.map((f) => ({
                      value: f.key,
                      label: f.label
                    }))
                  ]}
                  onChange={(v) =>
                    onConfigChange({
                      sortConfigs: {
                        sortBy: v?.value === "__none__" ? "" : (v?.value ?? ""),
                        sortDirection:
                          config.sortConfigs?.sortDirection ?? "asc"
                      }
                    })
                  }
                />
                <Select
                  name="sortDirection"
                  label="Sort Direction"
                  options={SORT_DIRECTION_OPTIONS}
                  onChange={(v) =>
                    onConfigChange({
                      sortConfigs: {
                        sortBy: config.sortConfigs?.sortBy ?? "",
                        sortDirection:
                          (v?.value as "asc" | "desc") ??
                          config.sortConfigs?.sortDirection ??
                          "asc"
                      }
                    })
                  }
                />
              </VStack>
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
                      onConfigChange({
                        pdfTitleConfigs: {
                          ...config.pdfTitleConfigs,
                          layout: v?.value ?? config.pdfTitleConfigs.layout
                        }
                      })
                    }
                  />
                  <Heading size="h4">Header Details</Heading>
                  <Input
                    placeholder="PDF Title"
                    name="pdfTitle"
                    label="Title"
                    onChange={(e) =>
                      onConfigChange({
                        pdfTitleConfigs: {
                          ...config.pdfTitleConfigs,
                          title: e.target.value
                        }
                      })
                    }
                  />
                  <Boolean
                    name="pdfIsUppercase"
                    label="Title Uppercase"
                    onChange={(checked) =>
                      onConfigChange({
                        pdfTitleConfigs: {
                          ...config.pdfTitleConfigs,
                          isUppercase: checked
                        }
                      })
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
                        onConfigChange({
                          pageFooterConfigs: {
                            ...config.pageFooterConfigs,
                            enablePageNumber: checked
                          }
                        })
                      }
                    />
                    <Boolean
                      name="enableGeneratedBy"
                      label="Enable Generated By"
                      onChange={(checked) =>
                        onConfigChange({
                          pageFooterConfigs: {
                            ...config.pageFooterConfigs,
                            enableGeneratedBy: checked
                          }
                        })
                      }
                    />
                  </HStack>
                  <HStack className="space-x-2 justify-between w-full">
                    <Boolean
                      name="enableTimeStamp"
                      label="Enable Timestamp"
                      onChange={(checked) =>
                        onConfigChange({
                          pageFooterConfigs: {
                            ...config.pageFooterConfigs,
                            enableTimeStamp: checked
                          }
                        })
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
                computedFields={config.computedFields}
                onComputedFieldsChange={(fields) =>
                  onConfigChange({ computedFields: fields })
                }
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
