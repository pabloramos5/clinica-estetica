ALTER TABLE "patients" 
ADD COLUMN IF NOT EXISTS "patient_code" VARCHAR(10),
ADD COLUMN IF NOT EXISTS "allergies" TEXT,
ADD COLUMN IF NOT EXISTS "medications" TEXT,
ADD COLUMN IF NOT EXISTS "medical_conditions" TEXT,
ADD COLUMN IF NOT EXISTS "occupation" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "referred_by" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "accepts_marketing" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "accepts_whatsapp" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP;

-- Hacer patient_code único si no lo es
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'patients_patient_code_key'
    ) THEN
        ALTER TABLE "patients" ADD CONSTRAINT "patients_patient_code_key" UNIQUE ("patient_code");
    END IF;
END $$;

-- Generar códigos de paciente para registros existentes
DO $$
DECLARE
    r RECORD;
    counter INTEGER := 1;
    year_code VARCHAR(2);
BEGIN
    year_code := TO_CHAR(CURRENT_DATE, 'YY');
    
    FOR r IN 
        SELECT id FROM "patients" 
        WHERE "patient_code" IS NULL OR "patient_code" = ''
        ORDER BY "created_at"
    LOOP
        UPDATE "patients" 
        SET "patient_code" = 'PAC' || year_code || LPAD(counter::TEXT, 4, '0')
        WHERE id = r.id;
        
        counter := counter + 1;
    END LOOP;
END $$;

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS "patients_patient_code_idx" ON "patients"("patient_code");
CREATE INDEX IF NOT EXISTS "patients_phone_idx" ON "patients"("phone");
CREATE INDEX IF NOT EXISTS "patients_is_active_idx" ON "patients"("is_active");

-- Actualizar valores por defecto
UPDATE "patients" SET "accepts_marketing" = true WHERE "accepts_marketing" IS NULL;
UPDATE "patients" SET "accepts_whatsapp" = true WHERE "accepts_whatsapp" IS NULL;
UPDATE "patients" SET "is_active" = true WHERE "is_active" IS NULL;
