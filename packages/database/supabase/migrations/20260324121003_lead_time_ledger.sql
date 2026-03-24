CREATE TYPE "leadTimeLedgerDocumentType" AS ENUM (
  'Purchase Order',
  'Purchase Invoice'
);

CREATE TABLE IF NOT EXISTS "leadTimeLedger" (
  "id" TEXT NOT NULL,
  "companyId" TEXT,
  "itemId" TEXT,
  "supplierId" TEXT,
  "documentType" "leadTimeLedgerDocumentType", -- 'Purchase Order' | 'Purchase Invoice'
  "documentId" TEXT,
  "orderDate" TIMESTAMP WITH TIME ZONE,
  "receiptDate" TIMESTAMP WITH TIME ZONE,
  "quantity" INTEGER NOT NULL CHECK ("quantity" >= 0),
  "leadTimeDays" INTEGER NOT NULL CHECK ("leadTimeDays" >= 0),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  CONSTRAINT "leadTimeLedger_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "leadTimeLedger_id_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "leadTimeLedger_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX "leadTimeLedger_companyId_fkey" ON "leadTimeLedger"("companyId");
CREATE INDEX "leadTimeLedger_itemId_fkey" ON "leadTimeLedger"("itemId");
CREATE INDEX "leadTimeLedger_supplierId_fkey" ON "leadTimeLedger"("supplierId");

ALTER TABLE "supplierPart"
ADD COLUMN IF NOT EXISTS "leadTimeDays" INTEGER NOT NULL DEFAULT 0;
