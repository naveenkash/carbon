// src/lib/export-fields.ts

export type FieldDefinition = {
  field_key: string;
  display_name: string;
  data_type: "text" | "number" | "date" | "currency" | "boolean" | "status";
  is_nested?: boolean;
  parent_entity?: string;
};

export type ModuleFields = Record<string, FieldDefinition[]>;

// All modules with their fields
export const MODULE_FIELDS: ModuleFields = {
  orders: [
    {
      field_key: "readableId",
      display_name: "Order Number",
      data_type: "text"
    },
    { field_key: "order_date", display_name: "Order Date", data_type: "date" },
    { field_key: "status", display_name: "Status", data_type: "status" },
    {
      field_key: "total_value",
      display_name: "Total Value",
      data_type: "currency"
    },
    {
      field_key: "customer.name",
      display_name: "Customer Name",
      data_type: "text",
      is_nested: true,
      parent_entity: "customer"
    }
  ],

  purchase_orders: [
    { field_key: "readableId", display_name: "PO Number", data_type: "text" },
    { field_key: "order_date", display_name: "Order Date", data_type: "date" },
    {
      field_key: "expected_receipt_date",
      display_name: "Expected Receipt Date",
      data_type: "date"
    },
    { field_key: "status", display_name: "PO Status", data_type: "status" },
    {
      field_key: "total_amount",
      display_name: "Total Amount",
      data_type: "currency"
    },
    {
      field_key: "purchase_order_type",
      display_name: "PO Type",
      data_type: "text"
    },

    {
      field_key: "supplier.name",
      display_name: "Supplier Name",
      data_type: "text",
      is_nested: true,
      parent_entity: "supplier"
    },
    {
      field_key: "supplier.id",
      display_name: "Supplier ID",
      data_type: "text",
      is_nested: true,
      parent_entity: "supplier"
    },

    {
      field_key: "purchase_order_line.item.readableId",
      display_name: "Item Code",
      data_type: "text",
      is_nested: true,
      parent_entity: "line"
    },
    {
      field_key: "purchase_order_line.item.name",
      display_name: "Item Name",
      data_type: "text",
      is_nested: true,
      parent_entity: "line"
    },
    {
      field_key: "purchase_order_line.quantity",
      display_name: "Quantity",
      data_type: "number",
      is_nested: true,
      parent_entity: "line"
    },
    {
      field_key: "purchase_order_line.unit_price",
      display_name: "Unit Price",
      data_type: "currency",
      is_nested: true,
      parent_entity: "line"
    },
    {
      field_key: "purchase_order_line.line_amount",
      display_name: "Line Amount",
      data_type: "currency",
      is_nested: true,
      parent_entity: "line"
    }
  ],

  inventory: [
    { field_key: "readableId", display_name: "Item Code", data_type: "text" },
    { field_key: "name", display_name: "Item Name", data_type: "text" },
    {
      field_key: "quantity_on_hand",
      display_name: "Stock on Hand",
      data_type: "number"
    },
    { field_key: "item_type", display_name: "Item Type", data_type: "text" }
  ],

  suppliers: [
    { field_key: "name", display_name: "Supplier Name", data_type: "text" },
    { field_key: "status", display_name: "Status", data_type: "status" },
    { field_key: "rating", display_name: "Rating", data_type: "number" }
  ],

  jobs: [
    { field_key: "readableId", display_name: "Job Number", data_type: "text" },
    { field_key: "status", display_name: "Job Status", data_type: "status" },
    { field_key: "due_date", display_name: "Due Date", data_type: "date" },
    { field_key: "quantity", display_name: "Quantity", data_type: "number" }
  ]
};

// Helper to get fields dynamically
export const getFieldsForModule = (
  module: keyof ModuleFields
): FieldDefinition[] => {
  return MODULE_FIELDS[module as keyof ModuleFields] || [];
};

// Maps export-field module keys to the DB module enum values
export const MODULE_ENUM_MAP: Record<keyof ModuleFields, string> = {
  orders: "Sales",
  purchase_orders: "Purchasing",
  inventory: "Inventory",
  suppliers: "Purchasing",
  jobs: "Production"
};

// Reverse map: DB module enum value → export-field module key
export const ENUM_TO_MODULE: Partial<Record<string, keyof ModuleFields>> = {
  Sales: "orders",
  Purchasing: "purchase_orders",
  Inventory: "inventory",
  Production: "jobs"
};
