-- Add lead metadata for fraud analysis
ALTER TABLE "Lead"
  ADD COLUMN IF NOT EXISTS "sourceIp" TEXT,
  ADD COLUMN IF NOT EXISTS "userAgent" TEXT;

CREATE INDEX IF NOT EXISTS "Lead_sourceIp_idx" ON "Lead"("sourceIp");

-- Create system settings table
CREATE TABLE IF NOT EXISTS "SystemSetting" (
  "key" TEXT PRIMARY KEY,
  "value" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION touch_system_setting_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS system_setting_updated_at ON "SystemSetting";
CREATE TRIGGER system_setting_updated_at
BEFORE UPDATE ON "SystemSetting"
FOR EACH ROW
EXECUTE FUNCTION touch_system_setting_updated_at();
