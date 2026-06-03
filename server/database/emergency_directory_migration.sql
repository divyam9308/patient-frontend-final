ALTER TABLE hospitals
  ADD COLUMN IF NOT EXISTS emergency_phone TEXT,
  ADD COLUMN IF NOT EXISTS emergency_bed_capacity INTEGER,
  ADD COLUMN IF NOT EXISTS ambulance_fleet INTEGER,
  ADD COLUMN IF NOT EXISTS app_reserved_beds INTEGER,
  ADD COLUMN IF NOT EXISTS app_reserved_ambulances INTEGER,
  ADD COLUMN IF NOT EXISTS data_source_url TEXT,
  ADD COLUMN IF NOT EXISTS data_verified_at TIMESTAMPTZ;

ALTER TABLE emergency_requests
  ADD COLUMN IF NOT EXISTS requested_arrival_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cleared_at TIMESTAMPTZ;
