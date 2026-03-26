import type {
  getApiKeys,
  getCompanies,
  getCustomField,
  getCustomFieldsTables,
  getIntegrations,
  getSequences,
  getTemplates,
  getWebhooks
} from "./settings.service";

export type ApiKey = NonNullable<
  Awaited<ReturnType<typeof getApiKeys>>["data"]
>[number];

export type Company = NonNullable<
  Awaited<ReturnType<typeof getCompanies>>["data"]
>[number];

export type CustomField = NonNullable<
  Awaited<ReturnType<typeof getCustomField>>["data"]
>;

export type CustomFieldsTableType = NonNullable<
  Awaited<ReturnType<typeof getCustomFieldsTables>>["data"]
>[number];

export type Integration = NonNullable<
  Awaited<ReturnType<typeof getIntegrations>>["data"]
>[number];

export type Sequence = NonNullable<
  Awaited<ReturnType<typeof getSequences>>["data"]
>[number];

export type Webhook = NonNullable<
  Awaited<ReturnType<typeof getWebhooks>>["data"]
>[number];

export type Template = NonNullable<
  Awaited<ReturnType<typeof getTemplates>>["data"]
>[number];

export type TemplateConfig = {
  colorTheme: string;
  margins: string;
  templateFont: string;
  templateStyle: string;
  fontSize: string;
  fields: [];
  documentLogo: {
    link: string;
    name: string;
    fileName: string;
    fileId: string;
    fileUrl: string;
    fileType: string;
  }[];
  pdfTitleConfigs: {
    title: string;
    isUppercase: boolean;
    layout: string;
  };
  pageFooterConfigs: {
    enablePageNumber: boolean;
    enableGeneratedBy: boolean;
    enableDatestamp: boolean;
    enableTimeStamp: boolean;
  };
  sortConfigs: {
    type: string;
    primarySortBy: string;
    order: string | null;
  };
};

export const DEFAULT_TEMPLATE_CONFIG: TemplateConfig = {
  colorTheme: "default",
  margins: "default",
  templateFont: "Inter", // inter,lato,roboto
  templateStyle: "REPORT_TEMPLATE_CLASSIC", // classic, modern, balanced
  fontSize: "default",
  documentLogo: [],
  fields: [],
  pdfTitleConfigs: {
    title: "",
    isUppercase: false,
    layout: "left_aligned"
  },
  pageFooterConfigs: {
    enablePageNumber: true,
    enableGeneratedBy: false,
    enableDatestamp: false,
    enableTimeStamp: false
  },
  sortConfigs: {
    type: "FIXED",
    primarySortBy: "NAME_ASC",
    order: null
  }
};
