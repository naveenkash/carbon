
CREATE TYPE category AS ENUM (
  'Orders',
  'Invoices',
  'Quotes',
  'Rfqs',
  'Suppliers'
);

CREATE VIEW "categories" AS
    SELECT unnest(enum_range(NULL::category)) AS name;


CREATE TABLE "templates" (
    "id" TEXT NOT NULL DEFAULT xid(),

    "name" TEXT NOT NULL CHECK (length(trim("name")) > 0),

    "companyId" TEXT NOT NULL,

    "module" module NOT NULL,        -- e.g., 'Purchasing', 'Inventory'
    "category" category NOT NULL,             -- e.g., 'Orders', 'Invoices'

    "templateConfiguration" JSONB NOT NULL DEFAULT '{}'::jsonb,

    "isDefault" BOOLEAN DEFAULT FALSE,

    "createdBy" TEXT,
    "updatedBy" TEXT,

    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE,

    -- Foreign keys
    CONSTRAINT "templates_pkey" PRIMARY KEY ("id"),

    CONSTRAINT "templates_createdBy_fkey"
        FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE SET NULL,

    CONSTRAINT "templates_updatedBy_fkey"
        FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE SET NULL,

    CONSTRAINT "templates_companyId_fkey"
        FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE
);

ALTER TABLE "templates" ENABLE ROW LEVEL SECURITY;                                                                              
                                                                                                                                  
CREATE POLICY "SELECT" ON "public"."templates"                                                                                  
FOR SELECT                                                                                                                      
USING (                                                                                                                         
"companyId" = ANY (                                                                                                           
    (SELECT get_companies_with_employee_permission('settings_view'))::text[]                                                    
)                                                                                                                             
);
                                                                                                                                
CREATE POLICY "INSERT" ON "public"."templates"                                                                                
FOR INSERT
WITH CHECK (
"companyId" = ANY (
    (SELECT get_companies_with_employee_permission('settings_create'))::text[]
)                                                                                                                             
);
                                                                                                                                
CREATE POLICY "UPDATE" ON "public"."templates"                                                                                
FOR UPDATE
USING (
"companyId" = ANY (
    (SELECT get_companies_with_employee_permission('settings_update'))::text[]
)                                                                                                                             
);
                                                                                                                                
CREATE POLICY "DELETE" ON "public"."templates"                                                                                
FOR DELETE
USING (
"companyId" = ANY (
    (SELECT get_companies_with_employee_permission('settings_delete'))::text[]
)
);                                                                                                                              

CREATE INDEX idx_templates_created_by ON public."templates"("createdBy");
CREATE INDEX idx_templates_company_module
ON public."templates"("companyId", "module");
CREATE INDEX idx_templates_category ON public."templates"("category");
CREATE INDEX idx_templates_company ON public."templates"("companyId");
CREATE UNIQUE INDEX idx_templates_default_per_module_category
ON public."templates"("companyId", "module", "category")
WHERE "isDefault" = TRUE;

-- JSONB index
CREATE INDEX idx_templates_config_gin
ON public."templates"
USING GIN ("templateConfiguration");

-- =============================================
-- Trigger to auto-update updatedAt
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_templates_updated_at
BEFORE UPDATE ON public."templates"
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- Seed default templates for all existing companies that don't have any templates yet.
INSERT INTO "templates" (
  "name",
  "module",
  "category",
  "templateConfiguration",
  "isDefault",
  "companyId",
  "createdBy"
)
SELECT
  'Standard Purchase Orders'    AS "name",
  'Purchasing'::module         AS "module",
  'Orders'::category           AS "category",
  '{
    "colorTheme": "zinc",
    "margins": "default",
    "templateFont": "Inter",
    "templateStyle": "REPORT_TEMPLATE_CLASSIC",
    "fontSize": "default",
    "fields": [
      {"key": "purchaseOrderId",             "order": 0},
      {"key": "orderDate",                   "order": 1},
      {"key": "status",                      "order": 2},
      {"key": "purchaseOrderType",           "order": 3},
      {"key": "supplierReference",           "order": 4},
      {"key": "closedAt",                    "order": 5},
      {"key": "line.purchaseOrderLineType",  "order": 6},
      {"key": "line.description",            "order": 7},
      {"key": "line.purchaseQuantity",       "order": 8},
      {"key": "line.quantityReceived",       "order": 9},
      {"key": "line.quantityToReceive",      "order": 10},
      {"key": "line.quantityInvoiced",       "order": 11},
      {"key": "line.quantityToInvoice",      "order": 12},
      {"key": "line.supplierUnitPrice",      "order": 13},
      {"key": "line.unitPrice",              "order": 14},
      {"key": "line.supplierExtendedPrice",  "order": 15},
      {"key": "line.extendedPrice",          "order": 16},
      {"key": "line.requestedDate",          "order": 17},
      {"key": "line.receivedDate",           "order": 18}
    ],
    "pdfTitleConfigs": {
      "title": "Purchase Orders Report",
      "isUppercase": false,
      "layout": "left_aligned"
    },
    "pageFooterConfigs": {
      "enablePageNumber": true,
      "enableGeneratedBy": false,
      "enableTimeStamp": false
    },
    "sortConfigs": {
      "sortBy": "",
      "sortDirection": "asc"
    },
    "computedFields": []
  }'::jsonb                     AS "templateConfiguration",
  TRUE                          AS "isDefault",
  c.id                          AS "companyId",
  NULL                          AS "createdBy"
FROM "company" c
WHERE NOT EXISTS (
  SELECT 1 FROM "templates" t
  WHERE t."companyId" = c.id
  AND t."module" = 'Purchasing'::module
  AND t."category" = 'Quotes'::category
);

-- Seed standard Purchasing → Invoices template for all existing companies
-- that don't already have a template for this module/category.

INSERT INTO "templates" (
  "name",
  "module",
  "category",
  "templateConfiguration",
  "isDefault",
  "companyId",
  "createdBy"
)
SELECT
  'Standard Purchase Invoices'  AS "name",
  'Purchasing'::module           AS "module",
  'Invoices'::category           AS "category",
  '{
    "colorTheme": "zinc",
    "margins": "default",
    "templateFont": "Inter",
    "templateStyle": "REPORT_TEMPLATE_CLASSIC",
    "fontSize": "default",
    "fields": [
      {"key": "invoiceId",                  "order": 0},
      {"key": "status",                     "order": 1},
      {"key": "supplierReference",          "order": 2},
      {"key": "dateIssued",                 "order": 3},
      {"key": "dateDue",                    "order": 4},
      {"key": "datePaid",                   "order": 5},
      {"key": "postingDate",                "order": 6},
      {"key": "subtotal",                   "order": 7},
      {"key": "totalDiscount",              "order": 8},
      {"key": "totalTax",                   "order": 9},
      {"key": "totalAmount",                "order": 10},
      {"key": "balance",                    "order": 11},
      {"key": "line.invoiceLineType",       "order": 12},
      {"key": "line.description",           "order": 13},
      {"key": "line.quantity",              "order": 14},
      {"key": "line.supplierUnitPrice",     "order": 15},
      {"key": "line.unitPrice",             "order": 16},
      {"key": "line.supplierExtendedPrice", "order": 17},
      {"key": "line.extendedPrice",         "order": 18},
      {"key": "line.taxPercent",            "order": 19},
      {"key": "line.taxAmount",             "order": 20},
      {"key": "line.totalAmount",           "order": 21}
    ],
    "pdfTitleConfigs": {
      "title": "Purchase Invoices Report",
      "isUppercase": false,
      "layout": "left_aligned"
    },
    "pageFooterConfigs": {
      "enablePageNumber": true,
      "enableGeneratedBy": false,
      "enableTimeStamp": false
    },
    "sortConfigs": {
      "sortBy": "",
      "sortDirection": "asc"
    },
    "computedFields": []
  }'::jsonb                       AS "templateConfiguration",
  TRUE                            AS "isDefault",
  c.id                            AS "companyId",
  NULL                            AS "createdBy"
FROM "company" c
WHERE NOT EXISTS (
  SELECT 1 FROM "templates" t
  WHERE t."companyId" = c.id
  AND t."module" = 'Purchasing'::module
  AND t."category" = 'Quotes'::category
);

-- Seed standard Purchasing → Quotes (Supplier Quotes) template for all existing
-- companies that don't already have a template for this module/category.

INSERT INTO "templates" (
  "name",
  "module",
  "category",
  "templateConfiguration",
  "isDefault",
  "companyId",
  "createdBy"
)
SELECT
  'Standard Supplier Quotes'    AS "name",
  'Purchasing'::module           AS "module",
  'Quotes'::category             AS "category",
  '{
    "colorTheme": "zinc",
    "margins": "default",
    "templateFont": "Inter",
    "templateStyle": "REPORT_TEMPLATE_CLASSIC",
    "fontSize": "default",
    "fields": [
      {"key": "supplierQuoteId",                 "order": 0},
      {"key": "status",                          "order": 1},
      {"key": "supplierReference",               "order": 2},
      {"key": "quotedDate",                      "order": 3},
      {"key": "expirationDate",                  "order": 4},
      {"key": "currencyCode",                    "order": 5},
      {"key": "line.description",                "order": 6},
      {"key": "line.supplierPartId",             "order": 7},
      {"key": "line.supplierPartRevision",       "order": 8},
      {"key": "line.inventoryUnitOfMeasureCode", "order": 9},
      {"key": "line.purchaseUnitOfMeasureCode",  "order": 10},
      {"key": "line.conversionFactor",           "order": 11}
    ],
    "pdfTitleConfigs": {
      "title": "Purchase Supplier Quotes Report",
      "isUppercase": false,
      "layout": "left_aligned"
    },
    "pageFooterConfigs": {
      "enablePageNumber": true,
      "enableGeneratedBy": false,
      "enableTimeStamp": false
    },
    "sortConfigs": {
      "sortBy": "",
      "sortDirection": "asc"
    },
    "computedFields": []
  }'::jsonb                       AS "templateConfiguration",
  TRUE                            AS "isDefault",
  c.id                            AS "companyId",
  NULL                            AS "createdBy"
FROM "company" c
WHERE NOT EXISTS (
  SELECT 1 FROM "templates" t
  WHERE t."companyId" = c.id
  AND t."module" = 'Purchasing'::module
  AND t."category" = 'Quotes'::category
);

-- Seed standard Purchasing → RFQs template for all existing companies
-- that don't already have a template for this module/category.

INSERT INTO "templates" (
  "name",
  "module",
  "category",
  "templateConfiguration",
  "isDefault",
  "companyId",
  "createdBy"
)
SELECT
  'Standard Purchase RFQs'       AS "name",
  'Purchasing'::module            AS "module",
  'Rfqs'::category                AS "category",
  '{
    "colorTheme": "zinc",
    "margins": "default",
    "templateFont": "Inter",
    "templateStyle": "REPORT_TEMPLATE_CLASSIC",
    "fontSize": "default",
    "fields": [
      {"key": "rfqId",                              "order": 0},
      {"key": "status",                             "order": 1},
      {"key": "rfqDate",                            "order": 2},
      {"key": "expirationDate",                     "order": 3},
      {"key": "line.description",                   "order": 4},
      {"key": "line.purchaseUnitOfMeasureCode",     "order": 5},
      {"key": "line.inventoryUnitOfMeasureCode",    "order": 6},
      {"key": "line.conversionFactor",              "order": 7}
    ],
    "pdfTitleConfigs": {
      "title": "Purchase RFQs Report",
      "isUppercase": false,
      "layout": "left_aligned"
    },
    "pageFooterConfigs": {
      "enablePageNumber": true,
      "enableGeneratedBy": false,
      "enableTimeStamp": false
    },
    "sortConfigs": {
      "sortBy": "",
      "sortDirection": "asc"
    },
    "computedFields": []
  }'::jsonb                        AS "templateConfiguration",
  TRUE                             AS "isDefault",
  c.id                             AS "companyId",
  NULL                             AS "createdBy"
FROM "company" c
WHERE NOT EXISTS (
  SELECT 1 FROM "templates" t
  WHERE t."companyId" = c.id
  AND t."module" = 'Purchasing'::module
  AND t."category" = 'Rfqs'::category
);

-- Seed standard Purchasing → Suppliers template for all existing companies
-- that don't already have a template for this module/category.

INSERT INTO "templates" (
  "name",
  "module",
  "category",
  "templateConfiguration",
  "isDefault",
  "companyId",
  "createdBy"
)
SELECT
  'Standard Purchasing Suppliers' AS "name",
  'Purchasing'::module             AS "module",
  'Suppliers'::category            AS "category",
  '{
    "colorTheme": "zinc",
    "margins": "default",
    "templateFont": "Inter",
    "templateStyle": "REPORT_TEMPLATE_CLASSIC",
    "fontSize": "default",
    "fields": [
      {"key": "name",                       "order": 0},
      {"key": "taxId",                      "order": 1},
      {"key": "vatNumber",                  "order": 2},
      {"key": "phone",                      "order": 3},
      {"key": "website",                    "order": 4},
      {"key": "currencyCode",               "order": 5},
      {"key": "taxPercent",                 "order": 6}
    ],
    "pdfTitleConfigs": {
      "title": "Purchasing Suppliers Report",
      "isUppercase": false,
      "layout": "left_aligned"
    },
    "pageFooterConfigs": {
      "enablePageNumber": true,
      "enableGeneratedBy": false,
      "enableTimeStamp": false
    },
    "sortConfigs": {
      "sortBy": "",
      "sortDirection": "asc"
    },
    "computedFields": []
  }'::jsonb                         AS "templateConfiguration",
  TRUE                              AS "isDefault",
  c.id                              AS "companyId",
  NULL                              AS "createdBy"
FROM "company" c
WHERE NOT EXISTS (
  SELECT 1 FROM "templates" t
  WHERE t."companyId" = c.id
  AND t."module" = 'Purchasing'::module
  AND t."category" = 'Suppliers'::category
);
