import type { Database } from "@carbon/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type FieldDefinition,
  getFieldsByKeys,
  MODULE_PRIMARY_TABLE
} from "~/utils/field-registry";

// A single flat row in the export output — field keys map to their raw values.
export type ExportRow = Record<string, unknown>;

// ─── Select string builder ─────────────────────────────────────────────────────
//
// Groups fields by their relation alias (or "header" for direct columns) and
// produces a PostgREST-compatible select string, e.g.:
//   "purchaseOrderId, orderDate, delivery:purchaseOrderDelivery(receiptRequestedDate),
//    purchaseOrderLine(itemReadableId, unitPrice)"
//
function buildSelectString(fields: FieldDefinition[]): string {
  const headerCols = new Set<string>();
  // alias → { table, fk, columns }
  const relations = new Map<
    string,
    { table: string; fk: string; columns: Set<string> }
  >();

  for (const field of fields) {
    if (!field.relation) {
      headerCols.add(field.column);
    } else {
      const alias = field.relation.alias ?? field.relation.table;
      if (!relations.has(alias)) {
        relations.set(alias, {
          table: field.relation.table,
          fk: field.relation.fk,
          columns: new Set()
        });
      }
      relations.get(alias)!.columns.add(field.column);
    }
  }

  const parts: string[] = [...headerCols];

  for (const [alias, rel] of relations) {
    const cols = [...rel.columns].join(", ");
    // PostgREST syntax: alias:table(col1, col2)
    const clause =
      alias === rel.table
        ? `${rel.table}(${cols})`
        : `${alias}:${rel.table}(${cols})`;
    parts.push(clause);
  }

  return parts.join(", ");
}

// ─── Row flattener ─────────────────────────────────────────────────────────────
//
// Takes a header record (which may contain nested arrays for line relations)
// and explodes it into one flat row per line item.
// If no line fields were selected, returns a single flat row.
//
function flattenRecord(
  record: Record<string, unknown>,
  fields: FieldDefinition[]
): ExportRow[] {
  // Find the first relation that has line data (array value on the record)
  const lineAliases = new Set(
    fields
      .filter((f) => f.relation)
      .map((f) => f.relation!.alias ?? f.relation!.table)
  );

  // Build header portion — all non-relation fields, keyed by field.key
  const headerRow: ExportRow = {};
  for (const field of fields.filter((f) => !f.relation)) {
    headerRow[field.key] = record[field.column] ?? null;
  }

  // Find the first line alias that produced an array
  let lineAlias: string | null = null;
  for (const alias of lineAliases) {
    if (Array.isArray(record[alias])) {
      lineAlias = alias;
      break;
    }
  }

  if (!lineAlias) {
    // No lines — 1-to-1 join or header-only
    // Still pull in any relation columns that came back as objects (1-to-1)
    for (const field of fields.filter((f) => f.relation)) {
      const alias = field.relation!.alias ?? field.relation!.table;
      const rel = record[alias] as Record<string, unknown> | null;
      headerRow[field.key] = rel?.[field.column] ?? null;
    }
    return [headerRow];
  }

  // Group line fields by their alias
  const lineFieldsByAlias = new Map<string, FieldDefinition[]>();
  for (const field of fields.filter((f) => f.relation)) {
    const alias = field.relation!.alias ?? field.relation!.table;
    if (!lineFieldsByAlias.has(alias)) lineFieldsByAlias.set(alias, []);
    lineFieldsByAlias.get(alias)!.push(field);
  }

  const lines = record[lineAlias] as Record<string, unknown>[];
  if (lines.length === 0) return [headerRow];

  return lines.map((line) => {
    const row: ExportRow = { ...headerRow };
    for (const field of lineFieldsByAlias.get(lineAlias!) ?? []) {
      row[field.key] = line[field.column] ?? null;
    }
    return row;
  });
}

// ─── Main export query function ────────────────────────────────────────────────

export type ExportQueryResult =
  | { data: ExportRow[]; fields: FieldDefinition[]; error: null }
  | { data: null; fields: null; error: unknown };

export async function runExportQuery(
  client: SupabaseClient<Database>,
  {
    module,
    category,
    fieldKeys,
    companyId,
    filters
  }: {
    module: string;
    category: string | null;
    fieldKeys: string[];
    companyId: string;
    filters?: Record<string, string>; // additional eq filters e.g. { status: "Draft" }
  }
): Promise<ExportQueryResult> {
  const registryKey = category ? `${module}:${category}` : module;
  const primaryTable = MODULE_PRIMARY_TABLE[registryKey];

  if (!primaryTable) {
    return {
      data: null,
      fields: null,
      error: `Unknown module/category: ${registryKey}`
    };
  }

  const fields = getFieldsByKeys(module, category, fieldKeys);
  if (fields.length === 0) {
    return { data: [], fields: [], error: null };
  }

  const selectStr = buildSelectString(fields);

  console.log(selectStr, "--selectStr--");

  // biome-ignore lint/suspicious/noExplicitAny: Supabase types not generated for new tables
  let query = (client as any)
    .from(primaryTable)
    .select(selectStr)
    .eq("companyId", companyId);

  if (filters) {
    for (const [col, val] of Object.entries(filters)) {
      query = query.eq(col, val);
    }
  }

  const { data, error } = await query;

  if (error) return { data: null, fields: null, error };

  const rows = (data as Record<string, unknown>[]).flatMap((record) =>
    flattenRecord(record, fields)
  );

  return { data: rows, fields, error: null };
}
