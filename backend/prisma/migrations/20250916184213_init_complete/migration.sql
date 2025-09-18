-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MEDICO', 'AUXILIAR', 'RECEPCION', 'CONTABILIDAD');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PROGRAMADA', 'CONFIRMADA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('DNI', 'NIE', 'PASAPORTE', 'OTRO');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('M', 'F', 'O');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('BORRADOR', 'EMITIDA', 'PAGADA', 'ANULADA', 'DEVUELTA');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'BIZUM', 'OTRO');

-- CreateEnum
CREATE TYPE "TreatmentType" AS ENUM ('BOTOX', 'LASER', 'PEELING', 'INFILTRACION', 'FLEBOLOGIA', 'DIETA', 'OTRO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'RECEPCION',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "last_access" TIMESTAMP(3),
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "cod_cliente" INTEGER,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "alias" TEXT,
    "document_type" "DocumentType" NOT NULL,
    "document_number" TEXT NOT NULL,
    "birth_date" TIMESTAMP(3),
    "gender" "Gender",
    "profession" TEXT,
    "phone" TEXT NOT NULL,
    "alternative_phone" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "fax" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postal_code" TEXT,
    "province" TEXT,
    "country" TEXT NOT NULL DEFAULT 'España',
    "bank_name" TEXT,
    "bank_account" TEXT,
    "wants_sms" BOOLEAN NOT NULL DEFAULT false,
    "wants_email" BOOLEAN NOT NULL DEFAULT true,
    "observations" TEXT,
    "data_consent" BOOLEAN NOT NULL DEFAULT false,
    "image_consent" BOOLEAN NOT NULL DEFAULT false,
    "marketing_consent" BOOLEAN NOT NULL DEFAULT false,
    "consent_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "medico_cod" INTEGER,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "document_type" "DocumentType" NOT NULL,
    "document_number" TEXT NOT NULL,
    "license_number" TEXT,
    "specialty" TEXT,
    "default_treatment" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "sala_cod" INTEGER,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 2,
    "observations" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatments" (
    "id" TEXT NOT NULL,
    "trat_cod" INTEGER,
    "name" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "default_doctor" TEXT,
    "observations" TEXT,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "vat_percentage" DECIMAL(5,2) NOT NULL DEFAULT 21,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treatments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "cod_diario" INTEGER,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "treatment_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PROGRAMADA',
    "observations" TEXT,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmation_date" TIMESTAMP(3),
    "reminder_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_histories" (
    "id" TEXT NOT NULL,
    "contador" INTEGER,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "photography" TEXT,
    "consent" TEXT,
    "clinic_treatment" TEXT,
    "diseases" TEXT,
    "allergies" TEXT,
    "medications" TEXT,
    "smoker" BOOLEAN NOT NULL DEFAULT false,
    "current_treatment" TEXT,
    "treatment_ok" BOOLEAN,
    "creams" TEXT,
    "hematomas" BOOLEAN NOT NULL DEFAULT false,
    "keloid" BOOLEAN NOT NULL DEFAULT false,
    "exploration" TEXT,
    "other_observations" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatment_evolutions" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "treatment_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "treatment_type" "TreatmentType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "zone" TEXT,
    "dose" TEXT,
    "product" TEXT,
    "observations" TEXT,
    "num_injections" INTEGER,
    "pulse" DOUBLE PRECISION,
    "spot" DOUBLE PRECISION,
    "power" DOUBLE PRECISION,
    "num_shots" INTEGER,
    "volume" DOUBLE PRECISION,
    "amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "billable" BOOLEAN NOT NULL DEFAULT true,
    "billed" BOOLEAN NOT NULL DEFAULT false,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treatment_evolutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "contador" INTEGER,
    "invoice_number" INTEGER NOT NULL,
    "invoice_year" INTEGER NOT NULL,
    "invoice_series" TEXT,
    "patient_id" TEXT NOT NULL,
    "fiscal_name" TEXT NOT NULL,
    "fiscal_id" TEXT NOT NULL,
    "fiscal_address" TEXT NOT NULL,
    "fiscal_city" TEXT,
    "fiscal_postal_code" TEXT,
    "fiscal_province" TEXT,
    "issue_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3),
    "subtotal" DECIMAL(10,2) NOT NULL,
    "commercial_discount" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "total_discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "taxable_base" DECIMAL(10,2) NOT NULL,
    "total_vat" DECIMAL(10,2) NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'BORRADOR',
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "payment_date" TIMESTAMP(3),
    "payment_method" "PaymentMethod",
    "observations" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_lines" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "line_number" INTEGER NOT NULL,
    "concept" TEXT NOT NULL,
    "product_name" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "discount_percentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "vat_percentage" DECIMAL(5,2) NOT NULL DEFAULT 21,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "vat_amount" DECIMAL(10,2) NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_sent" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT,
    "sent_count" INTEGER NOT NULL DEFAULT 1,
    "sent_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_sent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuration" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "patients_cod_cliente_key" ON "patients"("cod_cliente");

-- CreateIndex
CREATE UNIQUE INDEX "patients_document_number_key" ON "patients"("document_number");

-- CreateIndex
CREATE INDEX "patients_document_number_idx" ON "patients"("document_number");

-- CreateIndex
CREATE INDEX "patients_first_name_idx" ON "patients"("first_name");

-- CreateIndex
CREATE INDEX "patients_last_name_idx" ON "patients"("last_name");

-- CreateIndex
CREATE INDEX "patients_cod_cliente_idx" ON "patients"("cod_cliente");

-- CreateIndex
CREATE UNIQUE INDEX "staff_medico_cod_key" ON "staff"("medico_cod");

-- CreateIndex
CREATE UNIQUE INDEX "staff_document_number_key" ON "staff"("document_number");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_sala_cod_key" ON "rooms"("sala_cod");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_name_key" ON "rooms"("name");

-- CreateIndex
CREATE UNIQUE INDEX "treatments_trat_cod_key" ON "treatments"("trat_cod");

-- CreateIndex
CREATE UNIQUE INDEX "treatments_name_key" ON "treatments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_cod_diario_key" ON "appointments"("cod_diario");

-- CreateIndex
CREATE INDEX "appointments_date_idx" ON "appointments"("date");

-- CreateIndex
CREATE INDEX "appointments_patient_id_idx" ON "appointments"("patient_id");

-- CreateIndex
CREATE INDEX "appointments_doctor_id_idx" ON "appointments"("doctor_id");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "medical_histories_contador_key" ON "medical_histories"("contador");

-- CreateIndex
CREATE INDEX "medical_histories_patient_id_idx" ON "medical_histories"("patient_id");

-- CreateIndex
CREATE INDEX "medical_histories_date_idx" ON "medical_histories"("date");

-- CreateIndex
CREATE INDEX "treatment_evolutions_patient_id_idx" ON "treatment_evolutions"("patient_id");

-- CreateIndex
CREATE INDEX "treatment_evolutions_date_idx" ON "treatment_evolutions"("date");

-- CreateIndex
CREATE INDEX "treatment_evolutions_treatment_type_idx" ON "treatment_evolutions"("treatment_type");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_contador_key" ON "invoices"("contador");

-- CreateIndex
CREATE INDEX "invoices_patient_id_idx" ON "invoices"("patient_id");

-- CreateIndex
CREATE INDEX "invoices_issue_date_idx" ON "invoices"("issue_date");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_invoice_year_invoice_series_key" ON "invoices"("invoice_number", "invoice_year", "invoice_series");

-- CreateIndex
CREATE UNIQUE INDEX "configuration_key_key" ON "configuration"("key");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_treatment_id_fkey" FOREIGN KEY ("treatment_id") REFERENCES "treatments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_histories" ADD CONSTRAINT "medical_histories_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_histories" ADD CONSTRAINT "medical_histories_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_evolutions" ADD CONSTRAINT "treatment_evolutions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_evolutions" ADD CONSTRAINT "treatment_evolutions_treatment_id_fkey" FOREIGN KEY ("treatment_id") REFERENCES "treatments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_evolutions" ADD CONSTRAINT "treatment_evolutions_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
