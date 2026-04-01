import type { Database } from "@carbon/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type Category,
  type FieldDefinition,
  getFieldsByKeys,
  type JoinStep,
  MODULE_PRIMARY_TABLE,
  type Module,
  type RegistryKey
} from "~/utils/field-registry";

// A single flat row in the export output — field keys map to their raw values.
export type ExportRow = Record<string, unknown>;

// ─── Join graph ────────────────────────────────────────────────────────────────
//
// Groups JoinSteps by their parent table so trees can be built in any order.
// Steps with no `from` are children of the primary table (sentinel: ROOT).

const ROOT = "__root__";

type JoinGraph = Map<string, JoinStep[]>; // parentTable → child steps

function buildJoinGraph(joins: JoinStep[]): JoinGraph {
  const graph: JoinGraph = new Map();
  for (const step of joins) {
    const parent = step.from ?? ROOT;
    if (!graph.has(parent)) graph.set(parent, []);
    graph.get(parent)!.push(step);
  }
  return graph;
}

// ─── Internal tree types ───────────────────────────────────────────────────────

type SelectNode = {
  table: string;
  alias: string;
  columns: Set<string>;
  children: Map<string, SelectNode>; // keyed by alias
};

type FieldNode = {
  fields: FieldDefinition[];
  children: Map<string, FieldNode>; // alias → child node
};

// ─── Select string builder ─────────────────────────────────────────────────────
//
// Walks the join graph recursively from ROOT outward, building a SelectNode tree,
// then serialises into a PostgREST-compatible select string. Join order in the
// `joins` array does NOT matter — only `from` determines nesting.
//
//   "supplierQuoteId, quotedDate,
//    supplierQuoteLine(description, taxPercent,
//      supplierQuoteLinePrice(supplierUnitPrice, unitPrice, quantity))"
//

function buildSelectString(fields: FieldDefinition[]): string {
  const rootColumns = new Set<string>();
  const rootChildren = new Map<string, SelectNode>();

  for (const field of fields) {
    if (!field.joins || field.joins.length === 0) {
      rootColumns.add(field.column);
      continue;
    }
    const graph = buildJoinGraph(field.joins);
    addSelectColumn(field.column, ROOT, graph, rootChildren);
  }

  return serializeLevel(rootColumns, rootChildren);
}

function addSelectColumn(
  column: string,
  parentKey: string,
  graph: JoinGraph,
  parentChildren: Map<string, SelectNode>
): void {
  const steps = graph.get(parentKey);
  if (!steps) return;

  for (const step of steps) {
    const alias = step.alias ?? step.table;

    if (!parentChildren.has(alias)) {
      parentChildren.set(alias, {
        table: step.table,
        alias,
        columns: new Set(),
        children: new Map()
      });
    }

    const node = parentChildren.get(alias)!;
    const hasChildren = graph.has(step.table);

    if (hasChildren) {
      // Intermediate node: recurse deeper
      addSelectColumn(column, step.table, graph, node.children);
    } else {
      // Leaf: column lives on this table
      node.columns.add(column);
    }
  }
}

function serializeNode(node: SelectNode): string {
  return serializeLevel(node.columns, node.children);
}

function serializeLevel(
  columns: Set<string>,
  children: Map<string, SelectNode>
): string {
  const parts: string[] = [...columns];

  for (const child of children.values()) {
    const inner = serializeNode(child);
    const clause =
      child.alias === child.table
        ? `${child.table}(${inner})`
        : `${child.alias}:${child.table}(${inner})`;
    parts.push(clause);
  }

  return parts.join(", ");
}

// ─── Row flattener ─────────────────────────────────────────────────────────────
//
// Builds a FieldNode tree using the same graph approach, then recursively walks
// the PostgREST response — exploding 1-to-many arrays into individual rows and
// merging 1-to-1 objects. Join order in the `joins` array does NOT matter.
//
// Example for a 2-level join (quote → line → price break):
//
//   { supplierQuoteId: "q1",
//     supplierQuoteLine: [
//       { description: "Part A",
//         supplierQuoteLinePrice: [
//           { supplierUnitPrice: 10, quantity: 100 },
//           { supplierUnitPrice: 9,  quantity: 200 }
//         ]
//       }
//     ]
//   }
//

function buildFieldTree(fields: FieldDefinition[]): FieldNode {
  const root: FieldNode = { fields: [], children: new Map() };

  for (const field of fields) {
    if (!field.joins || field.joins.length === 0) {
      root.fields.push(field);
      continue;
    }
    const graph = buildJoinGraph(field.joins);
    addFieldToNode(field, ROOT, graph, root);
  }

  return root;
}

function addFieldToNode(
  field: FieldDefinition,
  parentKey: string,
  graph: JoinGraph,
  parentNode: FieldNode
): void {
  const steps = graph.get(parentKey);
  if (!steps) return;

  for (const step of steps) {
    const alias = step.alias ?? step.table;

    if (!parentNode.children.has(alias)) {
      parentNode.children.set(alias, { fields: [], children: new Map() });
    }

    const node = parentNode.children.get(alias)!;
    const hasChildren = graph.has(step.table);

    if (hasChildren) {
      // Intermediate node: recurse deeper
      addFieldToNode(field, step.table, graph, node);
    } else {
      // Leaf: field belongs on this table
      node.fields.push(field);
    }
  }
}

// ─── Scalar coercion ───────────────────────────────────────────────────────────
//
// Prevents raw JSON objects (JSON/JSONB columns) and PostgreSQL array values
// (e.g. NUMERIC[]) from reaching downstream formatters as plain objects,
// which would otherwise produce "[object Object]" when stringified.
//

function toScalar(v: unknown): unknown {
  if (v === null || v === undefined) return null;
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return v;
}

// ─── Recursive row expander ────────────────────────────────────────────────────

function flattenNode(
  record: Record<string, unknown>,
  node: FieldNode
): ExportRow[] {
  const baseRow: ExportRow = {};
  for (const field of node.fields) {
    baseRow[field.key] = toScalar(record[field.column] ?? null);
  }

  if (node.children.size === 0) return [baseRow];

  let rows: ExportRow[] = [baseRow];

  for (const [alias, childNode] of node.children) {
    const value = record[alias];

    if (Array.isArray(value)) {
      // 1-to-many: cross-product current rows with each child's flattened rows
      const expanded: ExportRow[] = [];
      for (const currentRow of rows) {
        const items = value as Record<string, unknown>[];
        if (items.length === 0) {
          // No child rows — preserve parent row (child columns absent)
          expanded.push(currentRow);
        } else {
          for (const item of items) {
            for (const childRow of flattenNode(item, childNode)) {
              expanded.push({ ...currentRow, ...childRow });
            }
          }
        }
      }
      rows = expanded;
    } else if (
      value !== null &&
      value !== undefined &&
      typeof value === "object"
    ) {
      // 1-to-1: merge child columns into every current row
      const childRows = flattenNode(
        value as Record<string, unknown>,
        childNode
      );
      rows = rows.flatMap((currentRow) =>
        childRows.map((childRow) => ({ ...currentRow, ...childRow }))
      );
    }
    // null/undefined: rows unchanged, child columns absent (treated as null downstream)
  }

  return rows;
}

function flattenRecord(
  record: Record<string, unknown>,
  fields: FieldDefinition[]
): ExportRow[] {
  return flattenNode(record, buildFieldTree(fields));
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
    module: Module;
    category: Category;
    fieldKeys: string[];
    companyId: string;
    filters?: Record<string, string>;
  }
): Promise<ExportQueryResult> {
  const registryKey: RegistryKey = `${module}:${category}`;
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

  console.log(error);

  if (error) return { data: null, fields: null, error };

  const rows = (data as Record<string, unknown>[]).flatMap((record) =>
    flattenRecord(record, fields)
  );

  return { data: rows, fields, error: null };
}
