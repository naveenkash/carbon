export type FieldDefinition = {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "currency" | "boolean" | "status";
  group?: string; // for nested/related entity grouping in the picker
};

// Registry keyed by "Module:Category" or just "Module" when no category applies.
// Module and Category must match the DB enum values exactly.
const FIELD_REGISTRY: Record<string, FieldDefinition[]> = {
  "Purchasing:Orders": [
    { key: "readableId", label: "PO Number", type: "text" },
    { key: "orderDate", label: "Order Date", type: "date" },
    { key: "expectedReceiptDate", label: "Expected Receipt", type: "date" },
    { key: "status", label: "Status", type: "status" },
    { key: "purchaseOrderType", label: "PO Type", type: "text" },
    { key: "totalAmount", label: "Total Amount", type: "currency" },
    {
      key: "supplier.name",
      label: "Supplier Name",
      type: "text",
      group: "Supplier"
    },
    {
      key: "supplier.id",
      label: "Supplier ID",
      type: "text",
      group: "Supplier"
    },
    {
      key: "line.part.readableId",
      label: "Part Code",
      type: "text",
      group: "Lines"
    },
    { key: "line.part.name", label: "Part Name", type: "text", group: "Lines" },
    { key: "line.quantity", label: "Quantity", type: "number", group: "Lines" },
    {
      key: "line.unitPrice",
      label: "Unit Price",
      type: "currency",
      group: "Lines"
    },
    {
      key: "line.lineAmount",
      label: "Line Amount",
      type: "currency",
      group: "Lines"
    }
  ],

  "Sales:Orders": [
    { key: "readableId", label: "Order Number", type: "text" },
    { key: "orderDate", label: "Order Date", type: "date" },
    { key: "status", label: "Status", type: "status" },
    { key: "totalValue", label: "Total Value", type: "currency" },
    {
      key: "customer.name",
      label: "Customer Name",
      type: "text",
      group: "Customer"
    },
    {
      key: "customer.id",
      label: "Customer ID",
      type: "text",
      group: "Customer"
    },
    {
      key: "line.part.readableId",
      label: "Part Code",
      type: "text",
      group: "Lines"
    },
    { key: "line.part.name", label: "Part Name", type: "text", group: "Lines" },
    { key: "line.quantity", label: "Quantity", type: "number", group: "Lines" },
    {
      key: "line.unitPrice",
      label: "Unit Price",
      type: "currency",
      group: "Lines"
    },
    {
      key: "line.lineAmount",
      label: "Line Amount",
      type: "currency",
      group: "Lines"
    }
  ],

  "Invoicing:Invoices": [
    { key: "readableId", label: "Invoice Number", type: "text" },
    { key: "invoiceDate", label: "Invoice Date", type: "date" },
    { key: "dueDate", label: "Due Date", type: "date" },
    { key: "status", label: "Status", type: "status" },
    { key: "totalAmount", label: "Total Amount", type: "currency" },
    {
      key: "customer.name",
      label: "Customer Name",
      type: "text",
      group: "Customer"
    }
  ],

  Inventory: [
    { key: "readableId", label: "Item Code", type: "text" },
    { key: "name", label: "Item Name", type: "text" },
    { key: "quantityOnHand", label: "Stock on Hand", type: "number" },
    { key: "itemType", label: "Item Type", type: "text" },
    { key: "location.name", label: "Location", type: "text", group: "Location" }
  ],

  Production: [
    { key: "readableId", label: "Job Number", type: "text" },
    { key: "status", label: "Status", type: "status" },
    { key: "dueDate", label: "Due Date", type: "date" },
    { key: "quantity", label: "Quantity", type: "number" },
    { key: "part.readableId", label: "Part Code", type: "text", group: "Part" },
    { key: "part.name", label: "Part Name", type: "text", group: "Part" }
  ]
};

export function getFieldsForModuleCategory(
  module: string,
  category?: string | null
): FieldDefinition[] {
  const key = category ? `${module}:${category}` : module;
  return FIELD_REGISTRY[key] ?? [];
}

// All valid (module, category) combinations that have a field registry entry.
// Used to populate the "New Template" dropdown.
export const REGISTERED_TEMPLATES = Object.keys(FIELD_REGISTRY).map((key) => {
  const [module, category] = key.split(":");
  return { module, category: category ?? null, label: key.replace(":", " → ") };
});
