
CREATE TYPE category AS ENUM (
  'Orders',
  'Invoices'
);

CREATE VIEW "categories" AS
    SELECT unnest(enum_range(NULL::category)) AS name;


CREATE TABLE IF NOT EXISTS public."templates" (
    "id" TEXT NOT NULL DEFAULT xid(),

    "name" TEXT NOT NULL CHECK (length(trim("name")) > 0),

    "companyId" TEXT NOT NULL,

    "module" module NOT NULL,        -- e.g., 'Purchasing', 'Inventory'
    "category" category,             -- e.g., 'Orders', 'Invoices'

    "templateConfiguration" JSONB NOT NULL DEFAULT '{}'::jsonb,

    "isDefault" BOOLEAN DEFAULT FALSE,

    "createdBy" TEXT NOT NULL,
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


CREATE INDEX idx_templates_created_by ON public."templates"("createdBy");
CREATE INDEX idx_templates_company_module
ON public."templates"("companyId", "module");
CREATE INDEX idx_templates_category ON public."templates"("category");
CREATE INDEX idx_templates_company ON public."templates"("companyId");
CREATE UNIQUE INDEX idx_templates_default_per_module
ON public."templates"("companyId", "module")
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