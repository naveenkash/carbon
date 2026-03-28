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
import type React from "react";
import { useFetcher, useParams, useSearchParams } from "react-router";
import { Hidden, Input } from "~/components/Form";
import { useRouteData } from "~/hooks";
import { templateValidator } from "~/modules/settings/settings.models";
import {
  DEFAULT_TEMPLATE_CONFIG,
  type Template,
  type TemplateConfig
} from "~/modules/settings/types";
import { path } from "~/utils/path";

interface SettingsPanelProps {
  selectedFields: string[];
}

export const TEMPLATE_FORM_ID = "template-settings-form";

const COLOR_THEME_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "red", label: "Red" }
];

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

const SORT_BY_OPTIONS = [
  { value: "NAME_ASC", label: "Name (A–Z)" },
  { value: "NAME_DESC", label: "Name (Z–A)" },
  { value: "CODE_ASC", label: "Code (A–Z)" },
  { value: "CODE_DESC", label: "Code (Z–A)" },
  { value: "DATE_ASC", label: "Date (Oldest)" },
  { value: "DATE_DESC", label: "Date (Newest)" }
];

const SettingsPanel: React.FC<SettingsPanelProps> = ({ selectedFields }) => {
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
    | (Partial<TemplateConfig> & { fields?: string[] })
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

          <Tabs defaultValue="general">
            <HStack>
              <TabsList>
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="pdf">PDF</TabsTrigger>
              </TabsList>
            </HStack>

            <TabsContent
              forceMount
              value="general"
              className="min-h-[120px] pt-4 data-[state=inactive]:hidden"
            >
              <VStack spacing={4}>
                <Input
                  name="name"
                  placeholder="Template name"
                  label="Template Name"
                />
                <Select
                  name="colorTheme"
                  label="Color Theme"
                  options={COLOR_THEME_OPTIONS}
                />
                <Select
                  name="margins"
                  label="Margins"
                  options={MARGINS_OPTIONS}
                />
                <Select
                  name="templateFont"
                  label="Font"
                  options={FONT_OPTIONS}
                />
                <Select
                  name="templateStyle"
                  label="Template Style"
                  options={TEMPLATE_STYLE_OPTIONS}
                />
                <Select
                  name="fontSize"
                  label="Font Size"
                  options={FONT_SIZE_OPTIONS}
                />
              </VStack>
            </TabsContent>

            <TabsContent
              forceMount
              value="pdf"
              className="min-h-[120px] pt-4 data-[state=inactive]:hidden"
            >
              <VStack spacing={4}>
                <VStack className="border-b pb-5">
                  <Heading size="h4">Title</Heading>
                  <Input
                    placeholder="PDF Title"
                    name="pdfTitle"
                    label="Title"
                  />
                  <Boolean name="pdfIsUppercase" label="Title Uppercase" />
                  <Select
                    name="pdfLayout"
                    label="Layout"
                    options={LAYOUT_OPTIONS}
                  />
                </VStack>

                <VStack className="border-b pb-5">
                  <Heading size="h4">Footer</Heading>
                  <HStack className="space-x-2 justify-between w-full">
                    <Boolean
                      name="enablePageNumber"
                      label="Enable Page Number"
                    />
                    <Boolean
                      name="enableGeneratedBy"
                      label="Enable Generated By"
                    />
                  </HStack>
                  <HStack className="space-x-2 justify-between w-full">
                    <Boolean name="enableTimeStamp" label="Enable Timestamp" />
                  </HStack>{" "}
                </VStack>

                <Heading size="h4">Sort</Heading>
                <Select
                  name="primarySortBy"
                  label="Primary Sort By"
                  options={SORT_BY_OPTIONS}
                />
              </VStack>
            </TabsContent>
          </Tabs>
        </ValidatedForm>
      </VStack>
    </VStack>
  );
};

export default SettingsPanel;
