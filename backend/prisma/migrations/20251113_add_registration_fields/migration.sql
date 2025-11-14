-- AlterTable
ALTER TABLE "User"
  ADD COLUMN "lastName" TEXT,
  ADD COLUMN "email" TEXT,
  ADD COLUMN "referralCode" TEXT,
  ADD COLUMN "termsAcceptedAt" TIMESTAMP(3),
  ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "phoneVerifiedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
