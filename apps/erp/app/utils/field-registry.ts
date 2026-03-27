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
    // Delivery (1-to-1 join on id)
    {
      key: "receiptRequestedDate",
      label: "Receipt Requested",
      type: "date",
      column: "receiptRequestedDate",
      group: "Delivery",
      relation: { table: "purchaseOrderDelivery", fk: "id", alias: "delivery" }
    },
    {
      key: "receiptPromisedDate",
      label: "Receipt Promised",
      type: "date",
      column: "receiptPromisedDate",
      group: "Delivery",
      relation: { table: "purchaseOrderDelivery", fk: "id", alias: "delivery" }
    },
    // Lines (1-to-many join on purchaseOrderId)
    {
      key: "line.purchaseOrderLineType",
      label: "Line Type",
      type: "text",
      column: "purchaseOrderLineType",
      group: "Lines",
      relation: { table: "purchaseOrderLine", fk: "purchaseOrderId" }
    },
    {
      key: "line.itemReadableId",
      label: "Item Code",
      type: "text",
      column: "itemReadableId",
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
      key: "line.unitPrice",
      label: "Unit Price",
      type: "currency",
      column: "unitPrice",
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
  ],

  // ─── Inventory ────────────────────────────────────────────────────────────
  Inventory: [
    {
      key: "readableId",
      label: "Item Code",
      type: "text",
      column: "readableId"
    },
    { key: "name", label: "Item Name", type: "text", column: "name" },
    {
      key: "description",
      label: "Description",
      type: "text",
      column: "description"
    },
    { key: "type", label: "Item Type", type: "text", column: "type" },
    {
      key: "unitOfMeasureCode",
      label: "Unit of Measure",
      type: "text",
      column: "unitOfMeasureCode"
    },
    { key: "active", label: "Active", type: "boolean", column: "active" },
    // Stock levels (1-to-many by location, treated as lines)
    {
      key: "stock.quantityOnHand",
      label: "Qty on Hand",
      type: "number",
      column: "quantityOnHand",
      group: "Stock",
      relation: { table: "itemInventory", fk: "itemId", alias: "stock" }
    },
    {
      key: "stock.quantityOnPurchase",
      label: "Qty on Purchase",
      type: "number",
      column: "quantityOnPurchase",
      group: "Stock",
      relation: { table: "itemInventory", fk: "itemId", alias: "stock" }
    },
    {
      key: "stock.quantityOnSalesOrder",
      label: "Qty on Sales Order",
      type: "number",
      column: "quantityOnSalesOrder",
      group: "Stock",
      relation: { table: "itemInventory", fk: "itemId", alias: "stock" }
    },
    {
      key: "stock.quantityOnProductionOrder",
      label: "Qty on Production",
      type: "number",
      column: "quantityOnProductionOrder",
      group: "Stock",
      relation: { table: "itemInventory", fk: "itemId", alias: "stock" }
    }
  ],

  // ─── Production → Operations ──────────────────────────────────────────────
  "Production:Operations": [
    { key: "jobId", label: "Job Number", type: "text", column: "jobId" },
    { key: "status", label: "Status", type: "status", column: "status" },
    { key: "dueDate", label: "Due Date", type: "date", column: "dueDate" },
    {
      key: "quantity",
      label: "Qty Ordered",
      type: "number",
      column: "quantity"
    },
    {
      key: "quantityComplete",
      label: "Qty Complete",
      type: "number",
      column: "quantityComplete"
    },
    // Operations
    {
      key: "operation.order",
      label: "Op Sequence",
      type: "number",
      column: "order",
      group: "Operations",
      relation: { table: "jobOperation", fk: "jobId", alias: "operations" }
    },
    {
      key: "operation.description",
      label: "Op Description",
      type: "text",
      column: "description",
      group: "Operations",
      relation: { table: "jobOperation", fk: "jobId", alias: "operations" }
    },
    {
      key: "operation.setupTime",
      label: "Setup Time",
      type: "number",
      column: "setupTime",
      group: "Operations",
      relation: { table: "jobOperation", fk: "jobId", alias: "operations" }
    },
    {
      key: "operation.laborTime",
      label: "Labor Time",
      type: "number",
      column: "laborTime",
      group: "Operations",
      relation: { table: "jobOperation", fk: "jobId", alias: "operations" }
    },
    {
      key: "operation.machineTime",
      label: "Machine Time",
      type: "number",
      column: "machineTime",
      group: "Operations",
      relation: { table: "jobOperation", fk: "jobId", alias: "operations" }
    }
  ],

  // ─── Production → Materials ───────────────────────────────────────────────
  "Production:Materials": [
    { key: "jobId", label: "Job Number", type: "text", column: "jobId" },
    { key: "status", label: "Status", type: "status", column: "status" },
    { key: "dueDate", label: "Due Date", type: "date", column: "dueDate" },
    {
      key: "quantity",
      label: "Qty Ordered",
      type: "number",
      column: "quantity"
    },
    {
      key: "quantityComplete",
      label: "Qty Complete",
      type: "number",
      column: "quantityComplete"
    },
    // Materials
    {
      key: "material.order",
      label: "Seq",
      type: "number",
      column: "order",
      group: "Materials",
      relation: { table: "jobMaterial", fk: "jobId", alias: "materials" }
    },
    {
      key: "material.itemReadableId",
      label: "Item Code",
      type: "text",
      column: "itemReadableId",
      group: "Materials",
      relation: { table: "jobMaterial", fk: "jobId", alias: "materials" }
    },
    {
      key: "material.description",
      label: "Description",
      type: "text",
      column: "description",
      group: "Materials",
      relation: { table: "jobMaterial", fk: "jobId", alias: "materials" }
    },
    {
      key: "material.quantity",
      label: "Quantity",
      type: "number",
      column: "quantity",
      group: "Materials",
      relation: { table: "jobMaterial", fk: "jobId", alias: "materials" }
    },
    {
      key: "material.unitCost",
      label: "Unit Cost",
      type: "currency",
      column: "unitCost",
      group: "Materials",
      relation: { table: "jobMaterial", fk: "jobId", alias: "materials" }
    }
  ]
};

// ─── Primary table per module:category ────────────────────────────────────────

export const MODULE_PRIMARY_TABLE: Record<string, string> = {
  "Purchasing:Orders": "purchaseOrder",
  "Purchasing:Invoices": "purchaseInvoice",
  "Sales:Orders": "salesOrder",
  "Sales:Invoices": "salesInvoice",
  Inventory: "item",
  "Production:Operations": "job",
  "Production:Materials": "job"
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
