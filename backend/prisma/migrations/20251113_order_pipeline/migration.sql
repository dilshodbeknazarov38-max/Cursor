-- Rebuild order table with new status pipeline

ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_leadId_fkey";
ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_productId_fkey";
ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_targetologId_fkey";
ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_operatorId_fkey";

DROP TABLE IF EXISTS "Order" CASCADE;

DROP TYPE IF EXISTS "OrderStatus";
CREATE TYPE "OrderStatus" AS ENUM ('PACKING', 'SHIPPED', 'DELIVERED', 'RETURNED');

CREATE TABLE "Order" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "productId" TEXT NOT NULL,
  "targetologId" TEXT NOT NULL,
  "operatorId" TEXT,
  "leadId" TEXT,
  "status" "OrderStatus" NOT NULL DEFAULT 'PACKING',
  "amount" DECIMAL(12,2) NOT NULL,
  "packedAt" TIMESTAMP(3),
  "shippedAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "returnedAt" TIMESTAMP(3),
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Order_productId_idx" ON "Order"("productId");
CREATE INDEX "Order_targetologId_idx" ON "Order"("targetologId");
CREATE INDEX "Order_operatorId_idx" ON "Order"("operatorId");
CREATE INDEX "Order_status_idx" ON "Order"("status");

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "Order_targetologId_fkey" FOREIGN KEY ("targetologId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "Order_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Order_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
