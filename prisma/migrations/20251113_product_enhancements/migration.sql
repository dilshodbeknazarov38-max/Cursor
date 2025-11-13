-- Extend product status enum
ALTER TYPE "ProductStatus" ADD VALUE IF NOT EXISTS 'PENDING_APPROVAL';

-- Create balance enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BalanceAccountType') THEN
    CREATE TYPE "BalanceAccountType" AS ENUM (
      'TARGETOLOG_HOLD',
      'TARGETOLOG_MAIN',
      'OPERATOR_HOLD',
      'OPERATOR_MAIN',
      'AFFILIATE_MAIN',
      'SELLER_MAIN',
      'BLOGGER_MAIN',
      'MANAGER_MAIN',
      'GENERIC_MAIN'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BalanceTransactionType') THEN
    CREATE TYPE "BalanceTransactionType" AS ENUM (
      'LEAD_ACCEPTED',
      'LEAD_SOLD',
      'LEAD_CANCELLED',
      'PAYOUT_REQUEST',
      'PAYOUT_APPROVED',
      'PAYOUT_REJECTED',
      'ADMIN_ADJUSTMENT',
      'FRAUD_REVERSAL'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FraudCheckStatus') THEN
    CREATE TYPE "FraudCheckStatus" AS ENUM ('OPEN', 'REVIEWING', 'RESOLVED', 'REVOKED');
  END IF;
END$$;

-- Augment product table with CPA/SEO/smart-link fields
ALTER TABLE "User"
  ADD COLUMN "salesSharePercent" DECIMAL(5,2) NOT NULL DEFAULT 100;

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

ALTER TABLE "Product" DROP COLUMN IF EXISTS "description";

ALTER TABLE "Product"
  ALTER COLUMN "slug" SET NOT NULL,
  ALTER COLUMN "category" SET NOT NULL,
  ALTER COLUMN "shortDescription" SET NOT NULL,
  ALTER COLUMN "mainImageUrl" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Product_slug_key" ON "Product"("slug");

-- Create balance tables
CREATE TABLE IF NOT EXISTS "BalanceAccount" (
  "id" TEXT PRIMARY KEY,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "BalanceAccountType" NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'UZS'
);

CREATE UNIQUE INDEX IF NOT EXISTS "BalanceAccount_userId_type_key"
  ON "BalanceAccount"("userId", "type");
CREATE INDEX IF NOT EXISTS "BalanceAccount_userId_idx"
  ON "BalanceAccount"("userId");

CREATE TABLE IF NOT EXISTS "BalanceTransaction" (
  "id" TEXT PRIMARY KEY,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "accountId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "BalanceTransactionType" NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "balanceBefore" DECIMAL(18,2) NOT NULL,
  "balanceAfter" DECIMAL(18,2) NOT NULL,
  "isCredit" BOOLEAN NOT NULL,
  "note" TEXT,
  "metadata" JSONB,
  "leadId" TEXT,
  "payoutId" TEXT
);

CREATE INDEX IF NOT EXISTS "BalanceTransaction_accountId_idx"
  ON "BalanceTransaction"("accountId");
CREATE INDEX IF NOT EXISTS "BalanceTransaction_userId_idx"
  ON "BalanceTransaction"("userId");
CREATE INDEX IF NOT EXISTS "BalanceTransaction_leadId_idx"
  ON "BalanceTransaction"("leadId");
CREATE INDEX IF NOT EXISTS "BalanceTransaction_payoutId_idx"
  ON "BalanceTransaction"("payoutId");

CREATE TABLE IF NOT EXISTS "BalanceFraudCheck" (
  "id" TEXT PRIMARY KEY,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "userId" TEXT NOT NULL,
  "transactionId" TEXT,
  "status" "FraudCheckStatus" NOT NULL DEFAULT 'OPEN',
  "reason" TEXT NOT NULL,
  "resolutionNote" TEXT,
  "metadata" JSONB
);

CREATE INDEX IF NOT EXISTS "BalanceFraudCheck_userId_idx"
  ON "BalanceFraudCheck"("userId");
CREATE INDEX IF NOT EXISTS "BalanceFraudCheck_transactionId_idx"
  ON "BalanceFraudCheck"("transactionId");

-- Extend payouts with card info
ALTER TABLE "Payout"
  ADD COLUMN "cardNumber" TEXT,
  ADD COLUMN "cardHolder" TEXT;

-- Add foreign keys
ALTER TABLE "BalanceAccount"
  ADD CONSTRAINT "BalanceAccount_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BalanceTransaction"
  ADD CONSTRAINT "BalanceTransaction_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "BalanceAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "BalanceTransaction_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "BalanceTransaction_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "BalanceTransaction_payoutId_fkey"
  FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BalanceFraudCheck"
  ADD CONSTRAINT "BalanceFraudCheck_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "BalanceFraudCheck_transactionId_fkey"
  FOREIGN KEY ("transactionId") REFERENCES "BalanceTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
