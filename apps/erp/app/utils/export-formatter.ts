import type { ExportRow } from "~/utils/export-query";
import type { FieldDefinition } from "~/utils/field-registry";

// Formatted row — every value is a display string (for CSV/Excel/PDF rendering)
export type FormattedRow = Record<string, string>;

// Column header list in the order the fields were selected
export type ExportColumn = { key: string; label: string };

function formatValue(value: unknown, type: FieldDefinition["type"]): string {
  if (value === null || value === undefined) return "";

  switch (type) {
    case "date": {
      const d = new Date(value as string);
      return Number.isNaN(d.getTime())
        ? String(value)
        : d.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "2-digit"
          });
    }
    case "currency": {
      const n = Number(value);
      return Number.isNaN(n) ? String(value) : n.toFixed(2);
    }
    case "number": {
      const n = Number(value);
      return Number.isNaN(n) ? String(value) : String(n);
    }
    case "boolean":
      return value ? "Yes" : "No";
    case "status":
    case "text":
    default:
      return String(value);
  }
}

export function formatExportRows(
  rows: ExportRow[],
  fields: FieldDefinition[]
): { columns: ExportColumn[]; rows: FormattedRow[] } {
  const columns: ExportColumn[] = fields.map((f) => ({
    key: f.key,
    label: f.label
  }));

  const formatted = rows.map((row) => {
    const out: FormattedRow = {};
    for (const field of fields) {
      out[field.key] = formatValue(row[field.key], field.type);
    }
    return out;
  });

  return { columns, rows: formatted };
}

// ─── CSV serializer ────────────────────────────────────────────────────────────

export function rowsToCsv(
  columns: ExportColumn[],
  rows: FormattedRow[]
): string {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;

  const header = columns.map((c) => escape(c.label)).join(",");
  const body = rows
    .map((row) => columns.map((c) => escape(row[c.key] ?? "")).join(","))
    .join("\n");

  return `${header}\n${body}`;
}
