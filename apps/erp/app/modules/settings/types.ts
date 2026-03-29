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

export const COMPUTED_KEY_PREFIX = "computed" as const;

export enum FormulaType {
  DateDiff = "date_diff",
  Arithmetic = "arithmetic",
  Conditional = "conditional",
  Concat = "concat"
}

export enum DateDiffUnit {
  Days = "days",
  Weeks = "weeks",
  Months = "months"
}

export enum ArithmeticOperator {
  Add = "add",
  Subtract = "subtract",
  Multiply = "multiply",
  Divide = "divide",
  Percentage = "percentage"
}

export enum ConditionalOperator {
  Gt = "gt",
  Lt = "lt",
  Gte = "gte",
  Lte = "lte",
  Eq = "eq",
  Neq = "neq",
  Between = "between",
  IsNull = "is_null"
}

export enum OutputFormatType {
  Number = "number",
  Currency = "currency",
  Percentage = "percentage",
  Text = "text",
  Badge = "badge"
}

export enum ConcatPartType {
  Field = "field",
  Literal = "literal"
}

export type ConditionalRule = {
  operator: ConditionalOperator;
  value?: number | string;
  valueTo?: number;
  output: string;
};

export type DateDiffConfig = {
  type: FormulaType.DateDiff;
  fieldA: string;
  fieldB: string;
  unit: DateDiffUnit;
  absolute?: boolean;
};

export type ArithmeticConfig = {
  type: FormulaType.Arithmetic;
  fieldA: string;
  operator: ArithmeticOperator;
  fieldB: string | number;
  isConstant?: boolean;
  roundTo?: number;
};

export type ConditionalConfig = {
  type: FormulaType.Conditional;
  sourceField: string;
  rules: ConditionalRule[];
  fallback: string;
};

export type ConcatPart = {
  type: ConcatPartType;
  value: string;
};

export type ConcatConfig = {
  type: FormulaType.Concat;
  parts: ConcatPart[];
  separator?: string;
};

export type FormulaConfig =
  | DateDiffConfig
  | ArithmeticConfig
  | ConditionalConfig
  | ConcatConfig;

export type OutputFormat = {
  type: OutputFormatType;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  badgeColors?: Record<string, string>;
};

export type ComputedField = {
  id: string;
  name: string;
  config: FormulaConfig;
  outputFormat?: OutputFormat;
  description?: string;
  enabled: boolean;
};

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
    enableTimeStamp: boolean;
  };
  sortConfigs: {
    type: string;
    primarySortBy: string;
    order: string | null;
  };
  computedFields: ComputedField[];
};

export const DEFAULT_TEMPLATE_CONFIG: TemplateConfig = {
  colorTheme: "zinc",
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
    enableTimeStamp: false
  },
  sortConfigs: {
    type: "FIXED",
    primarySortBy: "NAME_ASC",
    order: null
  },
  computedFields: []
};
