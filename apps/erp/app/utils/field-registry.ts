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
    {
      key: "line.purchaseOrderLineType",
      label: "Line Type",
      type: "text",
      column: "purchaseOrderLineType",
      group: "Lines",
      relation: { table: "purchaseOrderLine", fk: "purchaseOrderId" }
    },
    {
      key: "line.description",
      label: "Description",
      type: "text",
      column: "description",
      group: "Lines",
      relation: { table: "purchaseOrderLine", fk: "purchaseOrderId" }
    },
    {
      key: "line.purchaseQuantity",
      label: "Purchase Qty",
      type: "number",
      column: "purchaseQuantity",
      group: "Lines",
      relation: { table: "purchaseOrderLine", fk: "purchaseOrderId" }
    },
    {
      key: "line.quantityReceived",
      label: "Qty Received",
      type: "number",
      column: "quantityReceived",
      group: "Lines",
      relation: { table: "purchaseOrderLine", fk: "purchaseOrderId" }
    },
    {
      key: "line.supplierUnitPrice",
      label: "Unit Price",
      type: "currency",
      column: "supplierUnitPrice",
      group: "Lines",
      relation: { table: "purchaseOrderLine", fk: "purchaseOrderId" }
    }
  ],

  // ─── Purchasing → Invoices ────────────────────────────────────────────────
  "Purchasing:Invoices": [
    {
      key: "invoiceId",
      label: "Invoice Number",
      type: "text",
      column: "invoiceId"
    },
    { key: "status", label: "Status", type: "status", column: "status" },
    {
      key: "dateIssued",
      label: "Issue Date",
      type: "date",
      column: "dateIssued"
    },
    { key: "dateDue", label: "Due Date", type: "date", column: "dateDue" },
    { key: "datePaid", label: "Paid Date", type: "date", column: "datePaid" },
    {
      key: "subtotal",
      label: "Subtotal",
      type: "currency",
      column: "subtotal"
    },
    {
      key: "totalDiscount",
      label: "Discount",
      type: "currency",
      column: "totalDiscount"
    },
    { key: "totalTax", label: "Tax", type: "currency", column: "totalTax" },
    {
      key: "totalAmount",
      label: "Total Amount",
      type: "currency",
      column: "totalAmount"
    },
    { key: "balance", label: "Balance", type: "currency", column: "balance" },
    {
      key: "currencyCode",
      label: "Currency",
      type: "text",
      column: "currencyCode"
    },
    {
      key: "supplierReference",
      label: "Supplier Reference",
      type: "text",
      column: "supplierReference"
    },
    // Lines
    {
      key: "line.itemReadableId",
      label: "Item Code",
      type: "text",
      column: "itemReadableId",
      group: "Lines",
      relation: { table: "purchaseInvoiceLine", fk: "invoiceId" }
    },
    {
      key: "line.description",
      label: "Description",
      type: "text",
      column: "description",
      group: "Lines",
      relation: { table: "purchaseInvoiceLine", fk: "invoiceId" }
    },
    {
      key: "line.quantity",
      label: "Quantity",
      type: "number",
      column: "quantity",
      group: "Lines",
      relation: { table: "purchaseInvoiceLine", fk: "invoiceId" }
    },
    {
      key: "line.unitPrice",
      label: "Unit Price",
      type: "currency",
      column: "unitPrice",
      group: "Lines",
      relation: { table: "purchaseInvoiceLine", fk: "invoiceId" }
    },
    {
      key: "line.totalAmount",
      label: "Line Total",
      type: "currency",
      column: "totalAmount",
      group: "Lines",
      relation: { table: "purchaseInvoiceLine", fk: "invoiceId" }
    }
  ],

  // ─── Sales → Orders ───────────────────────────────────────────────────────
  "Sales:Orders": [
    {
      key: "salesOrderId",
      label: "Order Number",
      type: "text",
      column: "salesOrderId"
    },
    {
      key: "orderDate",
      label: "Order Date",
      type: "date",
      column: "orderDate"
    },
    { key: "status", label: "Status", type: "status", column: "status" },
    {
      key: "customerReference",
      label: "Customer Reference",
      type: "text",
      column: "customerReference"
    },
    {
      key: "currencyCode",
      label: "Currency",
      type: "text",
      column: "currencyCode"
    },
    { key: "closedAt", label: "Closed At", type: "date", column: "closedAt" },
    // Lines
    {
      key: "line.salesOrderLineType",
      label: "Line Type",
      type: "text",
      column: "salesOrderLineType",
      group: "Lines",
      relation: { table: "salesOrderLine", fk: "salesOrderId" }
    },
    {
      key: "line.itemReadableId",
      label: "Item Code",
      type: "text",
      column: "itemReadableId",
      group: "Lines",
      relation: { table: "salesOrderLine", fk: "salesOrderId" }
    },
    {
      key: "line.description",
      label: "Description",
      type: "text",
      column: "description",
      group: "Lines",
      relation: { table: "salesOrderLine", fk: "salesOrderId" }
    },
    {
      key: "line.saleQuantity",
      label: "Sale Qty",
      type: "number",
      column: "saleQuantity",
      group: "Lines",
      relation: { table: "salesOrderLine", fk: "salesOrderId" }
    },
    {
      key: "line.quantitySent",
      label: "Qty Sent",
      type: "number",
      column: "quantitySent",
      group: "Lines",
      relation: { table: "salesOrderLine", fk: "salesOrderId" }
    },
    {
      key: "line.unitPrice",
      label: "Unit Price",
      type: "currency",
      column: "unitPrice",
      group: "Lines",
      relation: { table: "salesOrderLine", fk: "salesOrderId" }
    }
  ],

  // ─── Sales → Invoices ─────────────────────────────────────────────────────
  "Sales:Invoices": [
    {
      key: "invoiceId",
      label: "Invoice Number",
      type: "text",
      column: "invoiceId"
    },
    { key: "status", label: "Status", type: "status", column: "status" },
    {
      key: "dateIssued",
      label: "Issue Date",
      type: "date",
      column: "dateIssued"
    },
    { key: "dateDue", label: "Due Date", type: "date", column: "dateDue" },
    { key: "datePaid", label: "Paid Date", type: "date", column: "datePaid" },
    {
      key: "subtotal",
      label: "Subtotal",
      type: "currency",
      column: "subtotal"
    },
    {
      key: "totalDiscount",
      label: "Discount",
      type: "currency",
      column: "totalDiscount"
    },
    { key: "totalTax", label: "Tax", type: "currency", column: "totalTax" },
    {
      key: "totalAmount",
      label: "Total Amount",
      type: "currency",
      column: "totalAmount"
    },
    { key: "balance", label: "Balance", type: "currency", column: "balance" },
    {
      key: "currencyCode",
      label: "Currency",
      type: "text",
      column: "currencyCode"
    },
    {
      key: "customerReference",
      label: "Customer Reference",
      type: "text",
      column: "customerReference"
    },
    // Lines
    {
      key: "line.itemReadableId",
      label: "Item Code",
      type: "text",
      column: "itemReadableId",
      group: "Lines",
      relation: { table: "salesInvoiceLine", fk: "invoiceId" }
    },
    {
      key: "line.description",
      label: "Description",
      type: "text",
      column: "description",
      group: "Lines",
      relation: { table: "salesInvoiceLine", fk: "invoiceId" }
    },
    {
      key: "line.quantity",
      label: "Quantity",
      type: "number",
      column: "quantity",
      group: "Lines",
      relation: { table: "salesInvoiceLine", fk: "invoiceId" }
    },
    {
      key: "line.unitPrice",
      label: "Unit Price",
      type: "currency",
      column: "unitPrice",
      group: "Lines",
      relation: { table: "salesInvoiceLine", fk: "invoiceId" }
    },
    {
      key: "line.totalAmount",
      label: "Line Total",
      type: "currency",
      column: "totalAmount",
      group: "Lines",
      relation: { table: "salesInvoiceLine", fk: "invoiceId" }
    }
  ]
};

// ─── Primary table per module:category ────────────────────────────────────────

export const MODULE_PRIMARY_TABLE: Record<string, string> = {
  "Purchasing:Orders": "purchaseOrder",
  "Purchasing:Invoices": "purchaseInvoice",
  "Sales:Orders": "salesOrder",
  "Sales:Invoices": "salesInvoice"
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
