export type FieldDefinition = {
  key: string; // dot-notation key used in the export output row
  label: string;
  type: "text" | "number" | "date" | "currency" | "boolean" | "status";
  group?: string; // grouping in the field picker UI
  column: string; // actual DB column name on the owning table
  relation?: {
    table: string; // related DB table (e.g. "purchaseOrderLine")
    fk: string; // FK column on the related table pointing back to the header (e.g. "purchaseOrderId")
    alias?: string; // PostgREST alias for the select clause (defaults to table name)
  };
};

// Registry keyed by "Module:Category" or just "Module" when no category applies.
// Module and Category must match the DB enum values exactly.
const FIELD_REGISTRY: Record<string, FieldDefinition[]> = {
  // ─── Purchasing → Orders ──────────────────────────────────────────────────
  "Purchasing:Orders": [
    {
      key: "purchaseOrderId",
      label: "PO Number",
      type: "text",
      column: "purchaseOrderId"
    },
    {
      key: "orderDate",
      label: "Order Date",
      type: "date",
      column: "orderDate"
    },
    { key: "status", label: "Status", type: "status", column: "status" },
    {
      key: "purchaseOrderType",
      label: "PO Type",
      type: "text",
      column: "purchaseOrderType"
    },
    {
      key: "supplierReference",
      label: "Supplier Reference",
      type: "text",
      column: "supplierReference"
    },
    { key: "closedAt", label: "Closed At", type: "date", column: "closedAt" },
    // Line fields
    {
      key: "line.purchaseOrderLineType",
      label: "Line Type",
      type: "text",
      column: "purchaseOrderLineType",
      group: "Order Lines",
      relation: { table: "purchaseOrderLine", fk: "purchaseOrderId" }
    },
    {
      key: "line.description",
      label: "Description",
      type: "text",
      column: "description",
      group: "Order Lines",
      relation: { table: "purchaseOrderLine", fk: "purchaseOrderId" }
    },
    {
      key: "line.purchaseQuantity",
      label: "Purchase Qty",
      type: "number",
      column: "purchaseQuantity",
      group: "Order Lines",
      relation: { table: "purchaseOrderLine", fk: "purchaseOrderId" }
    },
    {
      key: "line.quantityReceived",
      label: "Qty Received",
      type: "number",
      column: "quantityReceived",
      group: "Order Lines",
      relation: { table: "purchaseOrderLine", fk: "purchaseOrderId" }
    },
    {
      key: "line.quantityToReceive",
      label: "Qty To Receive",
      type: "number",
      column: "quantityToReceive",
      group: "Order Lines",
      relation: { table: "purchaseOrderLine", fk: "purchaseOrderId" }
    },
    {
      key: "line.quantityInvoiced",
      label: "Qty Invoiced",
      type: "number",
      column: "quantityInvoiced",
      group: "Order Lines",
      relation: { table: "purchaseOrderLine", fk: "purchaseOrderId" }
    },
    {
      key: "line.quantityToInvoice",
      label: "Qty To Invoice",
      type: "number",
      column: "quantityToInvoice",
      group: "Order Lines",
      relation: { table: "purchaseOrderLine", fk: "purchaseOrderId" }
    },
    {
      key: "line.supplierUnitPrice",
      label: "Supplier Unit Price",
      type: "currency",
      column: "supplierUnitPrice",
      group: "Order Lines",
      relation: { table: "purchaseOrderLine", fk: "purchaseOrderId" }
    },
    {
      key: "line.unitPrice",
      label: "Unit Price",
      type: "currency",
      column: "unitPrice",
      group: "Order Lines",
      relation: { table: "purchaseOrderLine", fk: "purchaseOrderId" }
    },
    {
      key: "line.supplierExtendedPrice",
      label: "Supplier Extended Price",
      type: "currency",
      column: "supplierExtendedPrice",
      group: "Order Lines",
      relation: { table: "purchaseOrderLine", fk: "purchaseOrderId" }
    },
    {
      key: "line.extendedPrice",
      label: "Extended Price",
      type: "currency",
      column: "extendedPrice",
      group: "Order Lines",
      relation: { table: "purchaseOrderLine", fk: "purchaseOrderId" }
    },

    {
      key: "line.requestedDate",
      label: "Requested Date",
      type: "date",
      column: "requestedDate",
      group: "Order Lines",
      relation: { table: "purchaseOrderLine", fk: "purchaseOrderId" }
    },
    {
      key: "line.receivedDate",
      label: "Received Date",
      type: "date",
      column: "receivedDate",
      group: "Order Lines",
      relation: { table: "purchaseOrderLine", fk: "purchaseOrderId" }
    }
  ]
};

// ─── Primary table per module:category ────────────────────────────────────────

export const MODULE_PRIMARY_TABLE: Record<string, string> = {
  "Purchasing:Orders": "purchaseOrder"
};

// ─── Public helpers ────────────────────────────────────────────────────────────

export function getFieldsForModuleCategory(
  module: string,
  category?: string | null
): FieldDefinition[] {
  const key = category ? `${module}:${category}` : module;
  return FIELD_REGISTRY[key] ?? [];
}

export function getFieldsByKeys(
  module: string,
  category: string | null,
  keys: string[]
): FieldDefinition[] {
  const all = getFieldsForModuleCategory(module, category);
  const keySet = new Set(keys);
  return all.filter((f) => keySet.has(f.key));
}

// All valid (module, category) combinations — used to populate the "New Template" dropdown.
export const REGISTERED_TEMPLATES = Object.keys(FIELD_REGISTRY).map((key) => {
  const [module, category] = key.split(":");
  return {
    module,
    category: category ?? null,
    label: key.replace(":", " → ")
  };
});
