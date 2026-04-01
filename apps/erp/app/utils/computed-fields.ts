import type { ExportField } from "@carbon/documents/pdf";
import type {
  ArithmeticConfig,
  ComputedField,
  ConcatConfig,
  ConditionalConfig,
  ConditionalRule,
  DateDiffConfig,
  OutputFormat
} from "~/modules/settings/types";
import {
  ArithmeticOperator,
  COMPUTED_KEY_PREFIX,
  ConcatPartType,
  ConditionalOperator,
  DateDiffUnit,
  FormulaType,
  OutputFormatType
} from "~/modules/settings/types";

// ─── Value resolution ─────────────────────────────────────────────────────────

/**
 * Resolves a field reference from a row.
 * Handles both source fields ("qty") and computed refs ("computed:cf_123").
 */
function resolveValue(ref: string, row: Record<string, unknown>): unknown {
  return row[ref] ?? row[`${COMPUTED_KEY_PREFIX}:${ref}`] ?? null;
}

// ─── Formula evaluators ───────────────────────────────────────────────────────

function evalDateDiff(
  cfg: DateDiffConfig,
  row: Record<string, unknown>
): number | null {
  const a = resolveValue(cfg.fieldA, row);
  const b = resolveValue(cfg.fieldB, row);
  if (!a || !b) return null;

  const aMs = new Date(String(a)).getTime();
  const bMs = new Date(String(b)).getTime();

  if (Number.isNaN(aMs) || Number.isNaN(bMs)) return null;

  const diffMs = aMs - bMs;
  let result: number;
  switch (cfg.unit) {
    case DateDiffUnit.Days:
      result = Math.round(diffMs / 86400000);
      break;
    case DateDiffUnit.Weeks:
      result = Math.round((diffMs / 604800000) * 10) / 10;
      break;
    case DateDiffUnit.Months:
      result = Math.round((diffMs / 2629746000) * 10) / 10;
      break;
  }
  return cfg.absolute ? Math.abs(result) : result;
}

function evalArithmetic(
  cfg: ArithmeticConfig,
  row: Record<string, unknown>
): number | null {
  const a = Number(resolveValue(cfg.fieldA, row));
  const b = cfg.isConstant
    ? Number(cfg.fieldB)
    : Number(resolveValue(String(cfg.fieldB), row));

  if (Number.isNaN(a) || Number.isNaN(b)) return null;

  let result: number | null;
  switch (cfg.operator) {
    case ArithmeticOperator.Add:
      result = a + b;
      break;
    case ArithmeticOperator.Subtract:
      result = a - b;
      break;
    case ArithmeticOperator.Multiply:
      result = a * b;
      break;
    case ArithmeticOperator.Divide:
      result = b === 0 ? null : a / b;
      break;
    case ArithmeticOperator.Percentage:
      result = b === 0 ? null : (a / b) * 100;
      break;
    default:
      result = null;
  }

  if (result === null) return null;
  const decimals = cfg.roundTo ?? 2;
  return Math.round(result * 10 ** decimals) / 10 ** decimals;
}

function matchesRule(value: unknown, rule: ConditionalRule): boolean {
  if (rule.operator === ConditionalOperator.IsNull)
    return value === null || value === undefined;
  if (value === null || value === undefined) return false;

  const n = Number(value);
  const rv = Number(rule.value);

  switch (rule.operator) {
    case ConditionalOperator.Gt:
      return n > rv;
    case ConditionalOperator.Lt:
      return n < rv;
    case ConditionalOperator.Gte:
      return n >= rv;
    case ConditionalOperator.Lte:
      return n <= rv;
    case ConditionalOperator.Eq:
      return String(value) === String(rule.value);
    case ConditionalOperator.Neq:
      return String(value) !== String(rule.value);
    case ConditionalOperator.Between:
      return rule.valueTo !== undefined && n >= rv && n <= Number(rule.valueTo);
    default:
      return false;
  }
}

function evalConditional(
  cfg: ConditionalConfig,
  row: Record<string, unknown>
): string {
  const value = resolveValue(cfg.sourceField, row);
  for (const rule of cfg.rules) {
    if (matchesRule(value, rule)) return rule.output;
  }
  return cfg.fallback;
}

function evalConcat(cfg: ConcatConfig, row: Record<string, unknown>): string {
  const sep = cfg.separator ?? " ";
  return cfg.parts
    .map((p) =>
      p.type === ConcatPartType.Field
        ? String(resolveValue(p.value, row) ?? "")
        : p.value
    )
    .join(sep);
}

// ─── Topological sort ─────────────────────────────────────────────────────────

function getDependencies(field: ComputedField): string[] {
  const cfg = field.config;
  const deps: string[] = [];

  switch (cfg.type) {
    case FormulaType.DateDiff:
      if (cfg.fieldA.startsWith(`${COMPUTED_KEY_PREFIX}:`))
        deps.push(cfg.fieldA.slice(9));
      if (cfg.fieldB.startsWith(`${COMPUTED_KEY_PREFIX}:`))
        deps.push(cfg.fieldB.slice(9));
      break;
    case FormulaType.Arithmetic:
      if (cfg.fieldA.startsWith(`${COMPUTED_KEY_PREFIX}:`))
        deps.push(cfg.fieldA.slice(9));
      if (
        !cfg.isConstant &&
        String(cfg.fieldB).startsWith(`${COMPUTED_KEY_PREFIX}:`)
      )
        deps.push(String(cfg.fieldB).slice(9));
      break;
    case FormulaType.Conditional:
      if (cfg.sourceField.startsWith(`${COMPUTED_KEY_PREFIX}:`))
        deps.push(cfg.sourceField.slice(9));
      break;
    case FormulaType.Concat:
      for (const p of cfg.parts) {
        if (
          p.type === ConcatPartType.Field &&
          p.value.startsWith(`${COMPUTED_KEY_PREFIX}:`)
        )
          deps.push(p.value.slice(9));
      }
      break;
  }
  return deps;
}

function topoSort(fields: ComputedField[]): ComputedField[] {
  const idMap = new Map(fields.map((f) => [f.id, f]));
  const visited = new Set<string>();
  const result: ComputedField[] = [];

  function visit(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const field = idMap.get(id);
    if (!field) return;
    for (const depId of getDependencies(field)) {
      visit(depId);
    }
    result.push(field);
  }

  for (const field of fields) {
    visit(field.id);
  }
  return result;
}

// ─── Row evaluator ────────────────────────────────────────────────────────────

function evaluateField(
  field: ComputedField,
  row: Record<string, unknown>
): unknown {
  try {
    const cfg = field.config;
    switch (cfg.type) {
      case FormulaType.DateDiff:
        return evalDateDiff(cfg, row);
      case FormulaType.Arithmetic:
        return evalArithmetic(cfg, row);
      case FormulaType.Conditional:
        return evalConditional(cfg, row);
      case FormulaType.Concat:
        return evalConcat(cfg, row);
    }
  } catch {
    return null;
  }
}

/**
 * Evaluates all enabled computed fields against a single row.
 * Results are stored under `computed::<fieldId>` keys.
 */
export function evaluateRow(
  row: Record<string, unknown>,
  fields: ComputedField[]
): Record<string, unknown> {
  const sorted = topoSort(fields.filter((f) => f.enabled));
  const result = { ...row };
  for (const field of sorted) {
    result[`${COMPUTED_KEY_PREFIX}:${field.id}`] = evaluateField(field, result);
  }
  return result;
}

/**
 * Applies computed fields to every row in the dataset.
 */
export function applyComputedFields(
  rows: Record<string, unknown>[],
  fields: ComputedField[]
): Record<string, unknown>[] {
  if (!fields.length) return rows;
  const sorted = topoSort(fields.filter((f) => f.enabled));
  return rows.map((row) => {
    const result = { ...row };
    for (const field of sorted) {
      result[`${COMPUTED_KEY_PREFIX}:${field.id}`] = evaluateField(
        field,
        result
      );
    }
    return result;
  });
}

// ─── Export field mapper ──────────────────────────────────────────────────────

/**
 * Maps a computed field's outputFormat to an ExportField for the PDF/CSV renderer.
 */
export function computedFieldToExportField(field: ComputedField): ExportField {
  const fmt: OutputFormat = field.outputFormat ?? {
    type: OutputFormatType.Text
  };
  let type: ExportField["type"] = "text";

  switch (fmt.type) {
    case OutputFormatType.Number:
    case OutputFormatType.Percentage:
      type = "number";
      break;
    case OutputFormatType.Currency:
      type = "currency";
      break;
    default:
      type = "text";
  }

  return {
    key: `${COMPUTED_KEY_PREFIX}:${field.id}`,
    label: field.name,
    type,
    ...(fmt.suffix ? { suffix: fmt.suffix } : {}),
    ...(fmt.prefix ? { prefix: fmt.prefix } : {})
  };
}

// ─── CSV formatter ────────────────────────────────────────────────────────────

function formatCsvValue(value: unknown, fmt?: OutputFormat): string {
  if (value === null || value === undefined || value === "") return "-";

  let str: string;

  if (
    fmt?.type === OutputFormatType.Number ||
    fmt?.type === OutputFormatType.Percentage
  ) {
    const n = Number(value);
    if (Number.isNaN(n)) return "";
    str = n.toFixed(fmt.decimals ?? 2);
  } else if (fmt?.type === OutputFormatType.Currency) {
    const n = Number(value);
    str = Number.isNaN(n) ? "" : n.toFixed(fmt.decimals ?? 2);
  } else {
    str = String(value);
  }

  if (fmt?.prefix) str = `${fmt.prefix} ` + str;
  if (fmt?.suffix) str = str + ` ${fmt.suffix}`;
  return str;
}

/**
 * Serialises rows + fields (including computed) into a CSV string.
 */
export function buildCsvString(
  rows: Record<string, unknown>[],
  sourceFields: ExportField[],
  computedFields: ComputedField[]
): string {
  const enabledComputed = computedFields.filter((f) => f.enabled);
  const computedExportFields = enabledComputed.map(computedFieldToExportField);
  const allFields = [...sourceFields, ...computedExportFields];

  const header = allFields.map((f) => csvCell(f.label)).join(",");

  const dataRows = rows.map((row) => {
    return allFields
      .map((f) => {
        const computed = enabledComputed.find(
          (cf) => `${COMPUTED_KEY_PREFIX}:${cf.id}` === f.key
        );
        const raw = row[f.key];
        const formatted = computed
          ? formatCsvValue(raw, computed.outputFormat)
          : raw === null || raw === undefined
            ? "-"
            : String(raw);
        return csvCell(formatted);
      })
      .join(",");
  });

  return [header, ...dataRows].join("\n");
}

function csvCell(value: string): string {
  const str = String(value ?? "-");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
