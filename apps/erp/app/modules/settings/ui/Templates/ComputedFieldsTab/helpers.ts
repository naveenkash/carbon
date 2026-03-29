import {
  ArithmeticOperator,
  type ComputedField,
  ConcatPartType,
  DateDiffUnit,
  type FormulaConfig,
  FormulaType,
  type OutputFormat,
  OutputFormatType
} from "~/modules/settings/types";
import { OPERATOR_OPTIONS } from "./constants";

export function defaultConfig(type: FormulaConfig["type"]): FormulaConfig {
  switch (type) {
    case FormulaType.DateDiff:
      return { type, fieldA: "", fieldB: "", unit: DateDiffUnit.Days };
    case FormulaType.Arithmetic:
      return {
        type,
        fieldA: "",
        operator: ArithmeticOperator.Multiply,
        fieldB: "",
        isConstant: false,
        roundTo: 2
      };
    case FormulaType.Conditional:
      return { type, sourceField: "", rules: [], fallback: "" };
    case FormulaType.Concat:
      return { type, parts: [], separator: " " };
  }
}

export function defaultOutput(type: FormulaConfig["type"]): OutputFormat {
  switch (type) {
    case FormulaType.DateDiff:
      return { type: OutputFormatType.Number, suffix: "" };
    case FormulaType.Arithmetic:
      return { type: OutputFormatType.Number, decimals: 2 };
    case FormulaType.Conditional:
      return { type: OutputFormatType.Badge };
    case FormulaType.Concat:
      return { type: OutputFormatType.Text };
  }
}

export function formulaSummary(
  field: ComputedField,
  labelMap: Record<string, string>
): string {
  const cfg = field.config;
  const l = (key: string) => labelMap[key] ?? key;
  switch (cfg.type) {
    case FormulaType.DateDiff:
      return `${l(cfg.fieldA)} − ${l(cfg.fieldB)} (${cfg.unit})`;
    case FormulaType.Arithmetic: {
      const opLabel =
        OPERATOR_OPTIONS.find((o) => o.value === cfg.operator)?.label ??
        cfg.operator;
      const b = cfg.isConstant ? String(cfg.fieldB) : l(String(cfg.fieldB));
      return `${l(cfg.fieldA)} ${opLabel} ${b}`;
    }
    case FormulaType.Conditional:
      return `Based on ${l(cfg.sourceField)} → ${cfg.rules.map((r) => r.output).join(" / ")}`;
    case FormulaType.Concat:
      return cfg.parts
        .map((p) =>
          p.type === ConcatPartType.Field ? l(p.value) : `"${p.value}"`
        )
        .join(" + ");
  }
}
