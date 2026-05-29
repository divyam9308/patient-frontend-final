-- database/schema.sql
-- Supabase PostgreSQL Database Schema for Patient Portal
-- Run this SQL in your Supabase project: Dashboard → SQL Editor → New Query → Paste → Run
-- 
-- Tables:
--   patients          → Users/patients (linked to Login.js, Register.js, Dashboard.js)
--   appointments      → Patient appointments (linked to Appointment.js)
--   medical_records   → Uploaded health documents (linked to MedicalRecords.js)
--   medications       → Active prescriptions (linked to MedicineVerification.js)
--   treatments        → Ongoing/completed treatment plans (linked to Treatments.js)
--   priority_queue    → Triage/priority requests (linked to PrioritySystem.js)

-- ────────────────────────────────────────────────
-- 1. PATIENTS TABLE (linked to Login.js, Register.js, Dashboard.js)
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  password        TEXT NOT NULL, -- bcrypt hashed
  phone           TEXT,
  dob             TEXT,
  gender          TEXT,
  blood_group     TEXT,
  address         TEXT,
  aadhar          TEXT UNIQUE,
  initials        TEXT,
  role            TEXT DEFAULT 'Patient',
  emergency_contact TEXT,
  registered_since  TIMESTAMP DEFAULT NOW(),
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ────────────────────────────────────────────────
-- 2. APPOINTMENTS TABLE (linked to Appointment.js)
-- Replaced by relational tables at the end of the file.
-- ────────────────────────────────────────────────

-- ────────────────────────────────────────────────
-- 3. MEDICAL RECORDS TABLE (linked to MedicalRecords.js)
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medical_records (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id      UUID REFERENCES patients(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,        -- e.g. "Blood Test Report March 2025"
  type            TEXT NOT NULL,        -- e.g. "Lab Report", "Radiology"
  size            TEXT,                 -- e.g. "1.2 MB"
  file_url        TEXT,                 -- Supabase Storage URL
  icon            TEXT DEFAULT '📋',
  color           TEXT DEFAULT '#e8f5ee',
  doctor          TEXT,                 -- prescribing physician
  facility        TEXT,                 -- clinical facility
  notes           TEXT,                 -- physician remarks
  vitals          JSONB DEFAULT '[]'::jsonb, -- parsed vitals list
  upload_date     TIMESTAMP DEFAULT NOW(),
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ────────────────────────────────────────────────
-- 4. MEDICATIONS TABLE (linked to MedicineVerification.js)
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medications (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id      UUID REFERENCES patients(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,        -- e.g. "Metformin 500mg"
  purpose         TEXT,                 -- e.g. "Diabetes management"
  frequency       TEXT,                 -- e.g. "Twice daily"
  icon            TEXT DEFAULT '💊',
  color           TEXT DEFAULT '#e8f5ee',
  prescribed_at   TIMESTAMP DEFAULT NOW(),
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ────────────────────────────────────────────────
-- 5. TREATMENTS TABLE (linked to Treatments.js)
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS treatments (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id      UUID REFERENCES patients(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,        -- e.g. "Type 2 Diabetes Management"
  doctor          TEXT,                 -- e.g. "Dr. Meena Kapoor — Endocrinology"
  status          TEXT DEFAULT 'ongoing', -- 'ongoing', 'completed'
  progress        INTEGER DEFAULT 0,    -- 0-100 (percentage)
  start_date      TEXT,                 -- e.g. "Jan 2024"
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ────────────────────────────────────────────────
-- 6. PRIORITY QUEUE TABLE (linked to PrioritySystem.js)
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS priority_queue (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id      UUID REFERENCES patients(id) ON DELETE CASCADE,
  symptoms        TEXT,
  severity        TEXT,                 -- 'low', 'medium', 'high', 'critical'
  priority_level  TEXT,                 -- assigned triage priority
  queue_position  INTEGER,
  status          TEXT DEFAULT 'waiting', -- 'waiting', 'attended', 'escalated', 'resolved'
  estimated_wait  INTEGER,              -- minutes
  requested_at    TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ────────────────────────────────────────────────
-- 7. MEDICINE VERIFICATIONS TABLE (linked to MedicineVerification.js)
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medicine_verifications (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id      UUID REFERENCES patients(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  manufacturer    TEXT,
  expiry          TEXT,
  batch           TEXT NOT NULL,
  verified        BOOLEAN DEFAULT false,
  verification_date TIMESTAMP DEFAULT NOW()
);

-- ────────────────────────────────────────────────
-- 8. TREATMENT DIARY LOGS TABLE (linked to Treatments.js)
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS treatment_diary_logs (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id      UUID REFERENCES patients(id) ON DELETE CASCADE,
  treatment_id    UUID REFERENCES treatments(id) ON DELETE CASCADE,
  log_text        TEXT NOT NULL,
  logged_at       TIMESTAMP DEFAULT NOW()
);

-- ────────────────────────────────────────────────
-- 9. NORMALIZED APPOINTMENT SYSTEM TABLES
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cities (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS departments (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS hospitals (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  city_id         UUID REFERENCES cities(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  address         TEXT,
  phone           TEXT,
  website         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doctors (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT NOT NULL,
  department_id   UUID REFERENCES departments(id) ON DELETE CASCADE,
  qualification   TEXT,
  registration_number TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doctor_hospitals (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id       UUID REFERENCES doctors(id) ON DELETE CASCADE,
  hospital_id     UUID REFERENCES hospitals(id) ON DELETE CASCADE,
  room_number     TEXT,
  consultation_fee NUMERIC,
  source_url      TEXT,
  last_verified_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doctor_schedules (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_hospital_id UUID REFERENCES doctor_hospitals(id) ON DELETE CASCADE,
  day_of_week     TEXT NOT NULL,
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  shift_label     TEXT,
  max_slots       INTEGER DEFAULT 20
);

-- ────────────────────────────────────────────────
-- 10. TRIAGE & EMERGENCY SYSTEM TABLES
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS triage_requests (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  symptoms text not null,
  symptom_duration text,
  severity_result text check (severity_result in ('regular','priority','emergency')),
  recommended_department_id uuid references departments(id),
  recommended_city_id uuid references cities(id),
  created_at timestamptz default now()
);

-- DROP existing appointments table to rebuild with new schema
DROP TABLE IF EXISTS appointments CASCADE;

CREATE TABLE appointments (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id      UUID REFERENCES patients(id) ON DELETE CASCADE,
  appointment_type TEXT CHECK (appointment_type IN ('follow_up','regular','priority','emergency')),
  doctor_hospital_id UUID REFERENCES doctor_hospitals(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status          TEXT DEFAULT 'pending',
  reason          TEXT,
  triage_id       UUID REFERENCES triage_requests(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emergency_requests (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  triage_id uuid references triage_requests(id) ON DELETE CASCADE,
  city_id uuid references cities(id) ON DELETE SET NULL,
  department_id uuid references departments(id) ON DELETE SET NULL,
  hospital_id uuid references hospitals(id) ON DELETE SET NULL,
  symptoms text not null,
  patient_location text,
  patient_phone text,
  ambulance_requested boolean default false,
  ambulance_status text default 'not_requested',
  status text default 'open',
  assigned_doctor_hospital_id uuid references doctor_hospitals(id) ON DELETE SET NULL,
  accepted_by_doctor_id uuid references doctors(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS emergency_alerts (
  id uuid primary key default gen_random_uuid(),
  emergency_request_id uuid references emergency_requests(id) on delete cascade,
  doctor_hospital_id uuid references doctor_hospitals(id) on delete cascade,
  status text default 'sent',
  created_at timestamptz default now(),
  responded_at timestamptz
);

CREATE TABLE IF NOT EXISTS ambulance_requests (
  id uuid primary key default gen_random_uuid(),
  emergency_request_id uuid references emergency_requests(id) on delete cascade,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  pickup_location text not null,
  destination_hospital_id uuid references hospitals(id) ON DELETE SET NULL,
  patient_phone text,
  status text default 'requested',
  created_at timestamptz default now()
);

-- Unique index to prevent double booking the exact same doctor at the same time
CREATE UNIQUE INDEX IF NOT EXISTS unique_appt_slot 
ON appointments(doctor_hospital_id, appointment_date, appointment_time);

-- ─────────────────────────────────────────────────
-- HOW TO RUN: Supabase Dashboard → SQL Editor → New Query → paste → Run
-- ─────────────────────────────────────────────────
