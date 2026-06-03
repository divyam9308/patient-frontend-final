ALTER TABLE medical_records
  ADD COLUMN IF NOT EXISTS analysis JSONB;
