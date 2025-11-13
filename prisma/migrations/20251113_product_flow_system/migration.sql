-- Rebuild product structure and add flow support

TRUNCATE TABLE "Product" CASCADE;

DROP INDEX IF EXISTS "Product_slug_key";
DROP INDEX IF EXISTS "Product_sellerId_idx";
DROP INDEX IF EXISTS "Product_status_idx";

ALTER TABLE "Product"
  DROP COLUMN IF EXISTS "name",
  DROP COLUMN IF EXISTS "slug",
  DROP COLUMN IF EXISTS "category",
  DROP COLUMN IF EXISTS "shortDescription",
  DROP COLUMN IF EXISTS "fullDescription",
  DROP COLUMN IF EXISTS "cpaTargetolog",
  DROP COLUMN IF EXISTS "cpaOperator",
  DROP COLUMN IF EXISTS "mainImageUrl",
  DROP COLUMN IF EXISTS "creativeUrl",
  DROP COLUMN IF EXISTS "seoTitle",
  DROP COLUMN IF EXISTS "seoDescription",
  DROP COLUMN IF EXISTS "tags",
  DROP COLUMN IF EXISTS "trafficSources",
  DROP COLUMN IF EXISTS "smartLinkUrl",
  DROP COLUMN IF EXISTS "marketplaceId",
  DROP COLUMN IF EXISTS "externalUrl",
  DROP COLUMN IF EXISTS "status",
  DROP COLUMN IF EXISTS "sellerId";

DROP TYPE IF EXISTS "ProductStatus";

CREATE TYPE "ProductStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE "Product"
  ADD COLUMN "title" TEXT NOT NULL,
  ADD COLUMN "description" TEXT NOT NULL,
  ADD COLUMN "price" DECIMAL(12,2) NOT NULL,
  ADD COLUMN "cpaTargetolog" DECIMAL(12,2),
  ADD COLUMN "cpaOperator" DECIMAL(12,2),
  ADD COLUMN "images" TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN "stock" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "status" "ProductStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "ownerId" TEXT NOT NULL;

CREATE INDEX "Product_ownerId_idx" ON "Product"("ownerId");
CREATE INDEX "Product_status_idx" ON "Product"("status");

ALTER TABLE "Product"
  ADD CONSTRAINT "Product_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "Flow" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "title" TEXT NOT NULL,
  "urlSlug" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "productId" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  CONSTRAINT "Flow_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Flow_urlSlug_key" ON "Flow"("urlSlug");
CREATE INDEX "Flow_productId_idx" ON "Flow"("productId");
CREATE INDEX "Flow_ownerId_idx" ON "Flow"("ownerId");

ALTER TABLE "Flow"
  ADD CONSTRAINT "Flow_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Flow_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
