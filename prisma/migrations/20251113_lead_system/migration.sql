-- Rebuild lead table with new status workflow and flow/operator relations

ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_leadId_fkey";

DROP TABLE IF EXISTS "Lead" CASCADE;

DROP TYPE IF EXISTS "LeadStatus";
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'ASSIGNED', 'CALLBACK', 'CONFIRMED', 'CANCELLED');

CREATE TABLE "Lead" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "flowId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "targetologId" TEXT NOT NULL,
  "operatorId" TEXT,
  "phone" TEXT NOT NULL,
  "name" TEXT,
  "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
  "notes" TEXT,
  CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Lead_targetologId_idx" ON "Lead"("targetologId");
CREATE INDEX "Lead_operatorId_idx" ON "Lead"("operatorId");
CREATE INDEX "Lead_productId_idx" ON "Lead"("productId");
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

ALTER TABLE "Lead"
  ADD CONSTRAINT "Lead_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Lead_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Lead_targetologId_fkey" FOREIGN KEY ("targetologId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Lead_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
