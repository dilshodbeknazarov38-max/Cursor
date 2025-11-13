-- Alter enum ProductStatus to add pending approval state
ALTER TYPE "ProductStatus" ADD VALUE IF NOT EXISTS 'PENDING_APPROVAL';

-- Add new columns to Product table
ALTER TABLE "Product"
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "category" TEXT,
  ADD COLUMN "shortDescription" TEXT,
  ADD COLUMN "fullDescription" TEXT,
  ADD COLUMN "cpaTargetolog" DECIMAL(12,2),
  ADD COLUMN "cpaOperator" DECIMAL(12,2),
  ADD COLUMN "mainImageUrl" TEXT,
  ADD COLUMN "creativeUrl" TEXT,
  ADD COLUMN "seoTitle" TEXT,
  ADD COLUMN "seoDescription" TEXT,
  ADD COLUMN "tags" TEXT[] DEFAULT '{}',
  ADD COLUMN "trafficSources" TEXT[] DEFAULT '{}',
  ADD COLUMN "smartLinkUrl" TEXT,
  ADD COLUMN "marketplaceId" TEXT,
  ADD COLUMN "externalUrl" TEXT,
  ALTER COLUMN "status" SET DEFAULT 'PENDING_APPROVAL';

-- Populate newly added columns for existing rows
UPDATE "Product"
SET
  "slug" = lower(regexp_replace(coalesce("name", 'mahsulot'), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr("id", 1, 6)
WHERE "slug" IS NULL;

UPDATE "Product"
SET
  "category" = COALESCE("category", 'Umumiy'),
  "shortDescription" = COALESCE(substring("description" FROM 1 FOR 180), 'Qisqa tavsif kiritilmagan.'),
  "fullDescription" = COALESCE("description", ''),
  "mainImageUrl" = COALESCE("mainImageUrl", '/static/placeholders/product.png')
WHERE "category" IS NULL
   OR "shortDescription" IS NULL
   OR "mainImageUrl" IS NULL;

-- Drop legacy description column once migrated
ALTER TABLE "Product" DROP COLUMN IF EXISTS "description";

-- Enforce non-null constraints and unique slug
ALTER TABLE "Product"
  ALTER COLUMN "slug" SET NOT NULL,
  ALTER COLUMN "category" SET NOT NULL,
  ALTER COLUMN "shortDescription" SET NOT NULL,
  ALTER COLUMN "mainImageUrl" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Product_slug_key" ON "Product"("slug");
