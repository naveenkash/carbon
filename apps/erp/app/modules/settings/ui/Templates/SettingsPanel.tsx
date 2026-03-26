import { Select, ValidatedForm } from "@carbon/form";
import {
  Checkbox,
  Heading,
  HStack,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  VStack
} from "@carbon/react";
import type React from "react";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { Hidden, Input } from "~/components/Form";
import { templateValidator } from "~/modules/settings/settings.models";
import {
  DEFAULT_TEMPLATE_CONFIG,
  type TemplateConfig
} from "~/modules/settings/types";

interface SettingsPanelProps {
  action: string;
  module: string;
  category?: string | null;
  selectedFields: string[];
  initialName?: string;
  initialConfig?: Partial<TemplateConfig>;
}

export const TEMPLATE_FORM_ID = "template-settings-form";

const COLOR_THEME_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "red", label: "Red" }
];

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Helvetica", label: "Helvetica" }
];

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

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  action,
  module,
  category,
  selectedFields,
  initialName = "",
  initialConfig
}) => {
  const fetcher = useFetcher();
  const cfg = { ...DEFAULT_TEMPLATE_CONFIG, ...initialConfig };
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

  const [pdfIsUppercase, setPdfIsUppercase] = useState(pdf.isUppercase);
  const [enablePageNumber, setEnablePageNumber] = useState(
    footer.enablePageNumber
  );
  const [enableGeneratedBy, setEnableGeneratedBy] = useState(
    footer.enableGeneratedBy
  );
  const [enableDatestamp, setEnableDatestamp] = useState(
    footer.enableDatestamp
  );
  const [enableTimeStamp, setEnableTimeStamp] = useState(
    footer.enableTimeStamp
  );

  // Re-sync checkbox state when initialConfig changes (e.g. after edit template loads)
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset on action change
  useEffect(() => {
    setPdfIsUppercase(pdf.isUppercase);
    setEnablePageNumber(footer.enablePageNumber);
    setEnableGeneratedBy(footer.enableGeneratedBy);
    setEnableDatestamp(footer.enableDatestamp);
    setEnableTimeStamp(footer.enableTimeStamp);
  }, [action, initialName]);

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
            sortType: sort.type,
            primarySortBy: sort.primarySortBy,
            sortOrder: sort.order ?? ""
          }}
          fetcher={fetcher}
        >
          <Hidden name="module" value={module} />
          {category && <Hidden name="category" value={category} />}
          <Hidden name="fields" value={JSON.stringify(selectedFields)} />
          <Hidden name="pdfIsUppercase" value={String(pdfIsUppercase)} />
          <Hidden name="enablePageNumber" value={String(enablePageNumber)} />
          <Hidden name="enableGeneratedBy" value={String(enableGeneratedBy)} />
          <Hidden name="enableDatestamp" value={String(enableDatestamp)} />
          <Hidden name="enableTimeStamp" value={String(enableTimeStamp)} />

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

                  <HStack className="items-center gap-2">
                    <Input
                      placeholder="PDF Title"
                      name="pdfTitle"
                      label="Title"
                    />
                    <HStack className="items-center gap-2 mt-5">
                      <Checkbox
                        id="isUppercase"
                        checked={pdfIsUppercase}
                        onCheckedChange={(v) => setPdfIsUppercase(!!v)}
                      />
                      <Label htmlFor="isUppercase">Uppercase</Label>
                    </HStack>
                  </HStack>

                  <Select
                    name="pdfLayout"
                    label="Layout"
                    options={LAYOUT_OPTIONS}
                  />
                </VStack>

                <VStack className="border-b pb-5">
                  <Heading size="h4">Footer</Heading>
                  <HStack className="space-x-2 justify-between w-full">
                    <HStack className="items-center gap-2">
                      <Checkbox
                        id="enablePageNumber"
                        checked={enablePageNumber}
                        onCheckedChange={(v) => setEnablePageNumber(!!v)}
                      />
                      <Label htmlFor="enablePageNumber">
                        Enable Page Number
                      </Label>
                    </HStack>
                    <HStack className="items-center gap-2">
                      <Checkbox
                        id="enableGeneratedBy"
                        checked={enableGeneratedBy}
                        onCheckedChange={(v) => setEnableGeneratedBy(!!v)}
                      />
                      <Label htmlFor="enableGeneratedBy">
                        Enable Generated By
                      </Label>
                    </HStack>
                  </HStack>
                  <HStack className="space-x-2 justify-between w-full">
                    <HStack className="items-center gap-2">
                      <Checkbox
                        id="enableDatestamp"
                        checked={enableDatestamp}
                        onCheckedChange={(v) => setEnableDatestamp(!!v)}
                      />
                      <Label htmlFor="enableDatestamp">Enable Datestamp</Label>
                    </HStack>
                    <HStack className="items-center gap-2">
                      <Checkbox
                        id="enableTimeStamp"
                        checked={enableTimeStamp}
                        onCheckedChange={(v) => setEnableTimeStamp(!!v)}
                      />
                      <Label htmlFor="enableTimeStamp">Enable Timestamp</Label>
                    </HStack>
                  </HStack>
                </VStack>

                <Heading size="h4">Sort</Heading>
                {/* <Select name="sortType" label="Sort Type" options={SORT_TYPE_OPTIONS} /> */}
                <Select
                  name="primarySortBy"
                  label="Primary Sort By"
                  options={SORT_BY_OPTIONS}
                />
                {/* <Input name="sortOrder" label="Sort Order" /> */}
              </VStack>
            </TabsContent>
          </Tabs>
        </ValidatedForm>
      </VStack>
    </VStack>
  );
};

export default SettingsPanel;
