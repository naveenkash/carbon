import {
  ArithmeticOperator,
  ConditionalOperator,
  DateDiffUnit,
  FormulaType,
  OutputFormatType
} from "~/modules/settings/types";

export const FORMULA_TYPES = [
  { value: FormulaType.DateDiff, label: "Date Diff" },
  { value: FormulaType.Arithmetic, label: "Arithmetic" },
  { value: FormulaType.Conditional, label: "Conditional" }
  // { value: FormulaType.Concat, label: "Concat" }
] as const;

export const UNIT_OPTIONS = [
  { value: DateDiffUnit.Days, label: "Days" },
  { value: DateDiffUnit.Weeks, label: "Weeks" },
  { value: DateDiffUnit.Months, label: "Months" }
];

export const OPERATOR_OPTIONS = [
  { value: ArithmeticOperator.Add, label: "+" },
  { value: ArithmeticOperator.Subtract, label: "−" },
  { value: ArithmeticOperator.Multiply, label: "×" },
  { value: ArithmeticOperator.Divide, label: "÷" },
  { value: ArithmeticOperator.Percentage, label: "%" }
];

export const CONDITION_OPERATORS = [
  { value: ConditionalOperator.Gt, label: ">" },
  { value: ConditionalOperator.Lt, label: "<" },
  { value: ConditionalOperator.Gte, label: ">=" },
  { value: ConditionalOperator.Lte, label: "<=" },
  { value: ConditionalOperator.Eq, label: "=" },
  { value: ConditionalOperator.Neq, label: "≠" },
  { value: ConditionalOperator.Between, label: "between" },
  { value: ConditionalOperator.IsNull, label: "is null" }
];

export const OUTPUT_TYPES = [
  { value: OutputFormatType.Number, label: "Number" },
  { value: OutputFormatType.Currency, label: "Currency" },
  { value: OutputFormatType.Percentage, label: "Percentage" },
  { value: OutputFormatType.Text, label: "Text" },
  { value: OutputFormatType.Badge, label: "Badge" }
];
