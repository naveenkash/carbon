import { Select, ValidatedForm } from "@carbon/form";
import {
  Checkbox,
  Heading,
  HStack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  VStack
} from "@carbon/react";
import type React from "react";
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

  return (
    <VStack className="w-4/12 bg-card h-full overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-accent border-l border-border px-4 py-2 text-sm">
      <VStack>
        <Heading size="h2">Template Settings</Heading>
        <ValidatedForm
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
            isDecorator: String(cfg.isDecorator),
            isUppercase: String(cfg.isUppercase),
            fontSize: cfg.fontSize,
            pdfTitle: pdf.title,
            pdfIsUppercase: String(pdf.isUppercase),
            pdfLayout: pdf.layout,
            pdfHeadline: pdf.headline,
            pdfDateTitle: pdf.dateTitle,
            enablePageNumber: String(footer.enablePageNumber),
            enableGeneratedBy: String(footer.enableGeneratedBy),
            enableDatestamp: String(footer.enableDatestamp),
            enableTimeStamp: String(footer.enableTimeStamp),
            sortType: sort.type,
            primarySortBy: sort.primarySortBy,
            secondarySortBy: sort.secondarySortBy,
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

            <TabsContent value="general" className="min-h-[120px] pt-4">
              <VStack spacing={4}>
                <Input name="name" label="Template Name" />
                <Select
                  name="colorTheme"
                  label="Color Theme"
                  // inline={(value, options) => {
                  //   return value;
                  // }}
                  // isReadOnly={isDisabled}
                  options={[
                    {
                      value: "Default",
                      label: "Default"
                    }
                  ]}
                  onChange={(value) => {
                    // onUpdate(
                    //   JSON.stringify({
                    //     ...fields,
                    //     [field.id]: value?.value ?? null
                    //   })
                    // );
                  }}
                />
                {/* <Input name="colorTheme" label="Color Theme" /> */}
                <Select
                  name="templateFont"
                  label="Font"
                  // inline={(value, options) => {
                  //   return value;
                  // }}
                  // isReadOnly={isDisabled}
                  options={[
                    {
                      value: "Inter",
                      label: "Inter"
                    }
                  ]}
                  onChange={(value) => {
                    // onUpdate(
                    //   JSON.stringify({
                    //     ...fields,
                    //     [field.id]: value?.value ?? null
                    //   })
                    // );
                  }}
                />
              </VStack>
            </TabsContent>

            <TabsContent value="pdf" className="min-h-[120px] pt-4">
              <VStack spacing={4}>
                <VStack className="pb-4 border-b">
                  <Heading size="h4">Title</Heading>
                  <HStack className="space-x-3">
                    <Input name="pdfTitle" label="Pdf Title" />
                    <HStack
                      key="isUppercase"
                      className="mt-5"
                      onClick={() => {}}
                    >
                      <Checkbox checked={cfg.pdfTitleConfigs.isUppercase} />
                      <label htmlFor="isUppercase">Uppercase</label>
                    </HStack>
                  </HStack>
                </VStack>

                <Heading size="h4">Footer</Heading>
                <VStack className="space-y-3">
                  <HStack className="justify-between w-full">
                    <HStack
                      key="enableGeneratedBy"
                      className="mt-4"
                      onClick={() => {}}
                    >
                      <Checkbox checked={cfg.pdfTitleConfigs.isUppercase} />
                      <label htmlFor="enableGeneratedBy">
                        Enable generated by
                      </label>
                    </HStack>
                    <HStack
                      key="enablePageNumber"
                      className="mt-4"
                      onClick={() => {}}
                    >
                      <Checkbox checked={cfg.pdfTitleConfigs.isUppercase} />
                      <label htmlFor="enablePageNumber">
                        Enable Pagenumber
                      </label>
                    </HStack>
                  </HStack>
                  <HStack className="justify-between w-full">
                    <HStack
                      key="enableTimeStamp"
                      className="mt-4"
                      onClick={() => {}}
                    >
                      <Checkbox checked={cfg.pdfTitleConfigs.isUppercase} />
                      <label htmlFor="enableTimeStamp">Enable Timestamp</label>
                    </HStack>
                  </HStack>
                </VStack>
              </VStack>
            </TabsContent>
          </Tabs>
        </ValidatedForm>
      </VStack>
    </VStack>
  );
};

export default SettingsPanel;
