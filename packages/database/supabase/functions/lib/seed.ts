/**
 * Deno-compatible re-export of seed data for edge functions.
 * Source of truth is packages/database/src/seed/seed.data.ts
 */

export {
  accountCategories,
  accountDefaults,
  accounts,
  currencies,
  customerStatuses,
  failureModes,
  fiscalYearSettings,
  gaugeTypes,
  nonConformanceRequiredActions,
  nonConformanceTypes,
  paymentTerms,
  postingGroupInventory,
  postingGroupPurchasing,
  postingGroupSales,
  scrapReasons,
  sequences,
  unitOfMeasures,
} from "./seed.data.ts";

import { groups as _groups } from "./seed.data.ts";

export const groupCompanyTemplate = "XXXX-XXXX-XXXXXXXXXXXX";

export const groups = _groups.map(({ idPrefix, ...g }) => ({
  ...g,
  id: `${idPrefix}-${groupCompanyTemplate}`,
}));

// ─── Standard Templates ────────────────────────────────────────────────────────
// One default template per registered module:category combination.
// Fields are ordered to match the field-registry definition order.

const standardTemplateConfig = {
  colorTheme: "zinc",
  margins: "default",
  templateFont: "Inter",
  templateStyle: "REPORT_TEMPLATE_CLASSIC",
  fontSize: "default",
  pdfTitleConfigs: {
    title: "Report Title",
    isUppercase: false,
    layout: "left_aligned"
  },
  pageFooterConfigs: {
    enablePageNumber: true,
    enableGeneratedBy: false,
    enableTimeStamp: false
  },
  sortConfigs: {
    sortBy: "",
    sortDirection: "asc"
  },
  computedFields: []
};

export const standardTemplates: Array<{
  name: string;
  module: string;
  category: string | null;
  templateConfiguration: Record<string, unknown>;
}> = [
  {
    name: "Standard Purchase Orders",
    module: "Purchasing",
    category: "Orders",
    templateConfiguration: {
      ...standardTemplateConfig,
      pdfTitleConfigs: {
        title: "Purchase Orders Report",
        ...standardTemplateConfig.pdfTitleConfigs,
      },
      fields: [
        { key: "purchaseOrderId", order: 0 },
        { key: "orderDate", order: 1 },
        { key: "status", order: 2 },
        { key: "purchaseOrderType", order: 3 },
        { key: "supplierReference", order: 4 },
        { key: "closedAt", order: 5 },
        { key: "line.purchaseOrderLineType", order: 6 },
        { key: "line.description", order: 7 },
        { key: "line.purchaseQuantity", order: 8 },
        { key: "line.quantityReceived", order: 9 },
        { key: "line.quantityToReceive", order: 10 },
        { key: "line.quantityInvoiced", order: 11 },
        { key: "line.quantityToInvoice", order: 12 },
        { key: "line.supplierUnitPrice", order: 13 },
        { key: "line.unitPrice", order: 14 },
        { key: "line.supplierExtendedPrice", order: 15 },
        { key: "line.extendedPrice", order: 16 },
        { key: "line.requestedDate", order: 17 },
        { key: "line.receivedDate", order: 18 },
      ],
    },
  },
  {
    name: "Standard Purchase Invoices",
    module: "Purchasing",
    category: "Invoices",
    templateConfiguration: {
      ...standardTemplateConfig,
      pdfTitleConfigs: {
        title: "Purchase Invoices Report",
        ...standardTemplateConfig.pdfTitleConfigs,
      },
      fields: [
        { key: "invoiceId",                  order: 0 },
        { key: "status",                     order: 1 },
        { key: "supplierReference",          order: 2 },
        { key: "dateIssued",                 order: 3 },
        { key: "dateDue",                    order: 4 },
        { key: "datePaid",                   order: 5 },
        { key: "postingDate",                order: 6 },
        { key: "subtotal",                   order: 7 },
        { key: "totalDiscount",              order: 8 },
        { key: "totalTax",                   order: 9 },
        { key: "totalAmount",                order: 10 },
        { key: "balance",                    order: 11 },
        { key: "line.invoiceLineType",       order: 12 },
        { key: "line.description",           order: 13 },
        { key: "line.quantity",              order: 14 },
        { key: "line.supplierUnitPrice",     order: 15 },
        { key: "line.unitPrice",             order: 16 },
        { key: "line.supplierExtendedPrice", order: 17 },
        { key: "line.extendedPrice",         order: 18 },
        { key: "line.taxPercent",            order: 19 },
        { key: "line.taxAmount",             order: 20 },
        { key: "line.totalAmount",           order: 21 },
      ],
    },
  },
  {
    name: "Standard Purchasing Supplier Quotes",
    module: "Purchasing",
    category: "Quotes",
    templateConfiguration: {
      ...standardTemplateConfig,
      pdfTitleConfigs: {
        title: "Purchase Supplier Quotes Report",
        ...standardTemplateConfig.pdfTitleConfigs,
      },
      fields: [
        { key: "supplierQuoteId",                 order: 0 },
        { key: "status",                          order: 1 },
        { key: "supplierReference",               order: 2 },
        { key: "quotedDate",                      order: 3 },
        { key: "expirationDate",                  order: 4 },
        { key: "currencyCode",                    order: 5 },
        { key: "line.description",                order: 6 },
        { key: "line.supplierPartId",             order: 7 },
        { key: "line.supplierPartRevision",       order: 8 },
        { key: "line.inventoryUnitOfMeasureCode", order: 9 },
        { key: "line.purchaseUnitOfMeasureCode",  order: 10 },
        { key: "line.conversionFactor",           order: 11 },
        { key: "line.taxPercent",                 order: 12 },
      ],
    },
  },
  {
    name: "Standard Purchase RFQs",
    module: "Purchasing",
    category: "Rfqs",
    templateConfiguration: {
      ...standardTemplateConfig,
      pdfTitleConfigs: {
        title: "Purchase RFQs Report",
        ...standardTemplateConfig.pdfTitleConfigs,
      },
      fields: [
        { key: "rfqId",                           order: 0 },
        { key: "status",                          order: 1 },
        { key: "rfqDate",                         order: 2 },
        { key: "expirationDate",                  order: 3 },
        { key: "line.description",                order: 4 },
        { key: "line.purchaseUnitOfMeasureCode",  order: 5 },
        { key: "line.inventoryUnitOfMeasureCode", order: 6 },
        { key: "line.conversionFactor",           order: 7 },
      ],
    },
  },
  {
    name: "Standard Purchasing Suppliers",
    module: "Purchasing",
    category: "Suppliers",
    templateConfiguration: {
      ...standardTemplateConfig,
      pdfTitleConfigs: {
        title: "Purchasing Suppliers Report",
        ...standardTemplateConfig.pdfTitleConfigs,
      },
      fields: [
        { key: "name",                        order: 0 },
        { key: "taxId",                       order: 1 },
        { key: "vatNumber",                   order: 2 },
        { key: "phone",                       order: 3 },
        { key: "website",                     order: 4 },
        { key: "currencyCode",                order: 5 },
        { key: "taxPercent",                  order: 6 },
      ],
    },
  },
];
