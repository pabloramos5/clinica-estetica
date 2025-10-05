/*
  Warnings:

  - A unique constraint covering the columns `[patient_code]` on the table `patients` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "accepts_marketing" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "accepts_whatsapp" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allergies" TEXT,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "medical_conditions" TEXT,
ADD COLUMN     "medications" TEXT,
ADD COLUMN     "occupation" TEXT,
ADD COLUMN     "patient_code" TEXT,
ADD COLUMN     "referred_by" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "license_number" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "specialty" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "patients_patient_code_key" ON "patients"("patient_code");

-- CreateIndex
CREATE INDEX "patients_patient_code_idx" ON "patients"("patient_code");

-- CreateIndex
CREATE INDEX "patients_phone_idx" ON "patients"("phone");
