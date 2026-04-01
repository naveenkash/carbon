import type { Database } from "@carbon/database";

export type Module = Database["public"]["Enums"]["module"];
export type Category = Database["public"]["Enums"]["category"];

export type JoinStep = {
  table: string; // DB table name at this hop
  fk: string; // FK column on this table pointing back to its parent
  from?: string; // parent table name; omit for primary-table-level joins
  alias?: string; // PostgREST alias (defaults to table name)
};

export type FieldDefinition = {
  key: string; // dot-notation key used in the export output row
  label: string;
  type: "text" | "number" | "date" | "currency" | "boolean" | "status";
  group?: string; // grouping in the field picker UI
  column: string; // actual DB column name on the owning table
  joins?: JoinStep[]; // path from the primary table to this field's table; absent = header field
};

export type RegistryKey = `${Module}:${Category}`;

// Registry keyed by "Module:Category" or just "Module" when no category applies.
const FIELD_REGISTRY: Partial<Record<RegistryKey, FieldDefinition[]>> = {
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
      joins: [{ table: "purchaseOrderLine", fk: "purchaseOrderId" }]
    },
    {
      key: "line.description",
      label: "Description",
      type: "text",
      column: "description",
      group: "Order Lines",
      joins: [{ table: "purchaseOrderLine", fk: "purchaseOrderId" }]
    },
    {
      key: "line.purchaseQuantity",
      label: "Purchase Qty",
      type: "number",
      column: "purchaseQuantity",
      group: "Order Lines",
      joins: [{ table: "purchaseOrderLine", fk: "purchaseOrderId" }]
    },
    {
      key: "line.quantityReceived",
      label: "Qty Received",
      type: "number",
      column: "quantityReceived",
      group: "Order Lines",
      joins: [{ table: "purchaseOrderLine", fk: "purchaseOrderId" }]
    },
    {
      key: "line.quantityToReceive",
      label: "Qty To Receive",
      type: "number",
      column: "quantityToReceive",
      group: "Order Lines",
      joins: [{ table: "purchaseOrderLine", fk: "purchaseOrderId" }]
    },
    {
      key: "line.quantityInvoiced",
      label: "Qty Invoiced",
      type: "number",
      column: "quantityInvoiced",
      group: "Order Lines",
      joins: [{ table: "purchaseOrderLine", fk: "purchaseOrderId" }]
    },
    {
      key: "line.quantityToInvoice",
      label: "Qty To Invoice",
      type: "number",
      column: "quantityToInvoice",
      group: "Order Lines",
      joins: [{ table: "purchaseOrderLine", fk: "purchaseOrderId" }]
    },
    {
      key: "line.supplierUnitPrice",
      label: "Supplier Unit Price",
      type: "currency",
      column: "supplierUnitPrice",
      group: "Order Lines",
      joins: [{ table: "purchaseOrderLine", fk: "purchaseOrderId" }]
    },
    {
      key: "line.unitPrice",
      label: "Unit Price",
      type: "currency",
      column: "unitPrice",
      group: "Order Lines",
      joins: [{ table: "purchaseOrderLine", fk: "purchaseOrderId" }]
    },
    {
      key: "line.supplierExtendedPrice",
      label: "Supplier Extended Price",
      type: "currency",
      column: "supplierExtendedPrice",
      group: "Order Lines",
      joins: [{ table: "purchaseOrderLine", fk: "purchaseOrderId" }]
    },
    {
      key: "line.extendedPrice",
      label: "Extended Price",
      type: "currency",
      column: "extendedPrice",
      group: "Order Lines",
      joins: [{ table: "purchaseOrderLine", fk: "purchaseOrderId" }]
    },
    {
      key: "line.requestedDate",
      label: "Requested Date",
      type: "date",
      column: "requestedDate",
      group: "Order Lines",
      joins: [{ table: "purchaseOrderLine", fk: "purchaseOrderId" }]
    },
    {
      key: "line.receivedDate",
      label: "Received Date",
      type: "date",
      column: "receivedDate",
      group: "Order Lines",
      joins: [{ table: "purchaseOrderLine", fk: "purchaseOrderId" }]
    }
  ],

  // ─── Purchasing → Invoices ────────────────────────────────────────────────
  "Purchasing:Invoices": [
    { key: "invoiceId", label: "Invoice #", type: "text", column: "invoiceId" },
    { key: "status", label: "Status", type: "status", column: "status" },
    {
      key: "supplierReference",
      label: "Supplier Reference",
      type: "text",
      column: "supplierReference"
    },
    {
      key: "dateIssued",
      label: "Date Issued",
      type: "date",
      column: "dateIssued"
    },
    { key: "dateDue", label: "Date Due", type: "date", column: "dateDue" },
    { key: "datePaid", label: "Date Paid", type: "date", column: "datePaid" },
    {
      key: "postingDate",
      label: "Posting Date",
      type: "date",
      column: "postingDate"
    },
    {
      key: "subtotal",
      label: "Subtotal",
      type: "currency",
      column: "subtotal"
    },
    {
      key: "totalDiscount",
      label: "Total Discount",
      type: "currency",
      column: "totalDiscount"
    },
    {
      key: "totalTax",
      label: "Total Tax",
      type: "currency",
      column: "totalTax"
    },
    {
      key: "totalAmount",
      label: "Total Amount",
      type: "currency",
      column: "totalAmount"
    },
    { key: "balance", label: "Balance", type: "currency", column: "balance" },
    // Line fields
    {
      key: "line.invoiceLineType",
      label: "Line Type",
      type: "text",
      column: "invoiceLineType",
      group: "Invoice Lines",
      joins: [{ table: "purchaseInvoiceLine", fk: "invoiceId" }]
    },
    {
      key: "line.description",
      label: "Description",
      type: "text",
      column: "description",
      group: "Invoice Lines",
      joins: [{ table: "purchaseInvoiceLine", fk: "invoiceId" }]
    },
    {
      key: "line.quantity",
      label: "Quantity",
      type: "number",
      column: "quantity",
      group: "Invoice Lines",
      joins: [{ table: "purchaseInvoiceLine", fk: "invoiceId" }]
    },
    {
      key: "line.supplierUnitPrice",
      label: "Supplier Unit Price",
      type: "currency",
      column: "supplierUnitPrice",
      group: "Invoice Lines",
      joins: [{ table: "purchaseInvoiceLine", fk: "invoiceId" }]
    },
    {
      key: "line.unitPrice",
      label: "Unit Price",
      type: "currency",
      column: "unitPrice",
      group: "Invoice Lines",
      joins: [{ table: "purchaseInvoiceLine", fk: "invoiceId" }]
    },
    {
      key: "line.supplierExtendedPrice",
      label: "Supplier Extended Price",
      type: "currency",
      column: "supplierExtendedPrice",
      group: "Invoice Lines",
      joins: [{ table: "purchaseInvoiceLine", fk: "invoiceId" }]
    },
    {
      key: "line.extendedPrice",
      label: "Extended Price",
      type: "currency",
      column: "extendedPrice",
      group: "Invoice Lines",
      joins: [{ table: "purchaseInvoiceLine", fk: "invoiceId" }]
    },
    {
      key: "line.taxPercent",
      label: "Tax %",
      type: "number",
      column: "taxPercent",
      group: "Invoice Lines",
      joins: [{ table: "purchaseInvoiceLine", fk: "invoiceId" }]
    },
    {
      key: "line.taxAmount",
      label: "Tax Amount",
      type: "currency",
      column: "taxAmount",
      group: "Invoice Lines",
      joins: [{ table: "purchaseInvoiceLine", fk: "invoiceId" }]
    },
    {
      key: "line.totalAmount",
      label: "Line Total",
      type: "currency",
      column: "totalAmount",
      group: "Invoice Lines",
      joins: [{ table: "purchaseInvoiceLine", fk: "invoiceId" }]
    }
  ],

  // ─── Purchasing → Quotes (Supplier Quotes) ────────────────────────────────
  "Purchasing:Quotes": [
    {
      key: "supplierQuoteId",
      label: "Quote #",
      type: "text",
      column: "supplierQuoteId"
    },
    { key: "status", label: "Status", type: "status", column: "status" },
    {
      key: "supplierReference",
      label: "Supplier Reference",
      type: "text",
      column: "supplierReference"
    },
    {
      key: "quotedDate",
      label: "Quoted Date",
      type: "date",
      column: "quotedDate"
    },
    {
      key: "expirationDate",
      label: "Expiration Date",
      type: "date",
      column: "expirationDate"
    },
    {
      key: "currencyCode",
      label: "Currency",
      type: "text",
      column: "currencyCode"
    },
    // Line fields (supplierQuoteLine)
    {
      key: "line.description",
      label: "Description",
      type: "text",
      column: "description",
      group: "Quote Lines",
      joins: [{ table: "supplierQuoteLine", fk: "supplierQuoteId" }]
    },
    {
      key: "line.supplierPartId",
      label: "Supplier Part #",
      type: "text",
      column: "supplierPartId",
      group: "Quote Lines",
      joins: [{ table: "supplierQuoteLine", fk: "supplierQuoteId" }]
    },
    {
      key: "line.supplierPartRevision",
      label: "Part Revision",
      type: "text",
      column: "supplierPartRevision",
      group: "Quote Lines",
      joins: [{ table: "supplierQuoteLine", fk: "supplierQuoteId" }]
    },
    {
      key: "line.inventoryUnitOfMeasureCode",
      label: "Inventory UOM",
      type: "text",
      column: "inventoryUnitOfMeasureCode",
      group: "Quote Lines",
      joins: [{ table: "supplierQuoteLine", fk: "supplierQuoteId" }]
    },
    {
      key: "line.purchaseUnitOfMeasureCode",
      label: "Purchase UOM",
      type: "text",
      column: "purchaseUnitOfMeasureCode",
      group: "Quote Lines",
      joins: [{ table: "supplierQuoteLine", fk: "supplierQuoteId" }]
    },
    {
      key: "line.conversionFactor",
      label: "Conversion Factor",
      type: "number",
      column: "conversionFactor",
      group: "Quote Lines",
      joins: [{ table: "supplierQuoteLine", fk: "supplierQuoteId" }]
    },
    // Pricing fields (supplierQuoteLinePrice — 2-level join)
    {
      key: "price.quantity",
      label: "Break Qty",
      type: "number",
      column: "quantity",
      group: "Quote Pricing",
      joins: [
        { table: "supplierQuoteLine", fk: "supplierQuoteId" },
        {
          table: "supplierQuoteLinePrice",
          fk: "supplierQuoteLineId",
          from: "supplierQuoteLine"
        }
      ]
    },
    {
      key: "price.leadTime",
      label: "Lead Time",
      type: "number",
      column: "leadTime",
      group: "Quote Pricing",
      joins: [
        { table: "supplierQuoteLine", fk: "supplierQuoteId" },
        {
          table: "supplierQuoteLinePrice",
          fk: "supplierQuoteLineId",
          from: "supplierQuoteLine"
        }
      ]
    },
    {
      key: "price.supplierUnitPrice",
      label: "Supplier Unit Price",
      type: "currency",
      column: "supplierUnitPrice",
      group: "Quote Pricing",
      joins: [
        { table: "supplierQuoteLine", fk: "supplierQuoteId" },
        {
          table: "supplierQuoteLinePrice",
          fk: "supplierQuoteLineId",
          from: "supplierQuoteLine"
        }
      ]
    },
    {
      key: "price.unitPrice",
      label: "Unit Price",
      type: "currency",
      column: "unitPrice",
      group: "Quote Pricing",
      joins: [
        { table: "supplierQuoteLine", fk: "supplierQuoteId" },
        {
          table: "supplierQuoteLinePrice",
          fk: "supplierQuoteLineId",
          from: "supplierQuoteLine"
        }
      ]
    },
    {
      key: "price.supplierExtendedPrice",
      label: "Supplier Extended Price",
      type: "currency",
      column: "supplierExtendedPrice",
      group: "Quote Pricing",
      joins: [
        { table: "supplierQuoteLine", fk: "supplierQuoteId" },
        {
          table: "supplierQuoteLinePrice",
          fk: "supplierQuoteLineId",
          from: "supplierQuoteLine"
        }
      ]
    },
    {
      key: "price.extendedPrice",
      label: "Extended Price",
      type: "currency",
      column: "extendedPrice",
      group: "Quote Pricing",
      joins: [
        { table: "supplierQuoteLine", fk: "supplierQuoteId" },
        {
          table: "supplierQuoteLinePrice",
          fk: "supplierQuoteLineId",
          from: "supplierQuoteLine"
        }
      ]
    },
    {
      key: "price.supplierShippingCost",
      label: "Supplier Shipping",
      type: "currency",
      column: "supplierShippingCost",
      group: "Quote Pricing",
      joins: [
        { table: "supplierQuoteLine", fk: "supplierQuoteId" },
        {
          table: "supplierQuoteLinePrice",
          fk: "supplierQuoteLineId",
          from: "supplierQuoteLine"
        }
      ]
    },
    {
      key: "price.shippingCost",
      label: "Shipping Cost",
      type: "currency",
      column: "shippingCost",
      group: "Quote Pricing",
      joins: [
        { table: "supplierQuoteLine", fk: "supplierQuoteId" },
        {
          table: "supplierQuoteLinePrice",
          fk: "supplierQuoteLineId",
          from: "supplierQuoteLine"
        }
      ]
    }
  ],

  // ─── Purchasing → RFQs ────────────────────────────────────────────────────
  "Purchasing:Rfqs": [
    { key: "rfqId", label: "RFQ #", type: "text", column: "rfqId" },
    { key: "status", label: "Status", type: "status", column: "status" },
    { key: "rfqDate", label: "RFQ Date", type: "date", column: "rfqDate" },
    {
      key: "expirationDate",
      label: "Expiration Date",
      type: "date",
      column: "expirationDate"
    },
    // Line fields
    {
      key: "line.description",
      label: "Description",
      type: "text",
      column: "description",
      group: "RFQ Lines",
      joins: [{ table: "purchasingRfqLine", fk: "purchasingRfqId" }]
    },
    {
      key: "line.purchaseUnitOfMeasureCode",
      label: "Purchase UOM",
      type: "text",
      column: "purchaseUnitOfMeasureCode",
      group: "RFQ Lines",
      joins: [{ table: "purchasingRfqLine", fk: "purchasingRfqId" }]
    },
    {
      key: "line.inventoryUnitOfMeasureCode",
      label: "Inventory UOM",
      type: "text",
      column: "inventoryUnitOfMeasureCode",
      group: "RFQ Lines",
      joins: [{ table: "purchasingRfqLine", fk: "purchasingRfqId" }]
    },
    {
      key: "line.conversionFactor",
      label: "Conversion Factor",
      type: "number",
      column: "conversionFactor",
      group: "RFQ Lines",
      joins: [{ table: "purchasingRfqLine", fk: "purchasingRfqId" }]
    }
  ],

  // ─── Purchasing → Suppliers ───────────────────────────────────────────────
  "Purchasing:Suppliers": [
    { key: "name", label: "Name", type: "text", column: "name" },
    { key: "taxId", label: "Tax ID", type: "text", column: "taxId" },
    {
      key: "vatNumber",
      label: "VAT Number",
      type: "text",
      column: "vatNumber"
    },
    { key: "phone", label: "Phone", type: "text", column: "phone" },
    { key: "website", label: "Website", type: "text", column: "website" },
    {
      key: "currencyCode",
      label: "Currency",
      type: "text",
      column: "currencyCode"
    },
    {
      key: "taxPercent",
      label: "Tax %",
      type: "number",
      column: "taxPercent"
    }
  ]
};

// ─── Primary table per module:category ────────────────────────────────────────

export const MODULE_PRIMARY_TABLE: Partial<Record<RegistryKey, string>> = {
  "Purchasing:Orders": "purchaseOrder",
  "Purchasing:Invoices": "purchaseInvoice",
  "Purchasing:Quotes": "supplierQuote",
  "Purchasing:Rfqs": "purchasingRfq",
  "Purchasing:Suppliers": "suppliers"
};

// ─── Public helpers ────────────────────────────────────────────────────────────

export function getFieldsForModuleCategory(
  module: Module,
  category: Category
): FieldDefinition[] {
  const key: RegistryKey = `${module}:${category}`;
  return FIELD_REGISTRY[key] ?? [];
}

export function getFieldsByKeys(
  module: Module,
  category: Category,
  keys: string[]
): FieldDefinition[] {
  const all = getFieldsForModuleCategory(module, category);
  const keySet = new Set(keys);
  return all.filter((f) => keySet.has(f.key));
}

// All valid (module, category) combinations — used to populate the "New Template" dropdown.
export const REGISTERED_TEMPLATES = (
  Object.keys(FIELD_REGISTRY) as RegistryKey[]
).reduce(
  (acc, key) => {
    const [module, category] = key.split(":") as [Module, Category];

    if (!acc[module]) {
      acc[module] = [];
    }

    acc[module]!.push({
      category
    });

    return acc;
  },
  {} as Partial<Record<Module, { category: Category }[]>>
);
