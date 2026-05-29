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
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id      UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_name     TEXT NOT NULL,
  department      TEXT NOT NULL,
  appointment_time TIMESTAMP NOT NULL,
  status          TEXT DEFAULT 'upcoming', -- 'upcoming', 'completed', 'cancelled'
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

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
-- MIGRATION: Appointment Booking Enhancements (branch: Appointment)
-- Run these statements if your appointments table was already created
-- before this update. Safe to run multiple times (IF NOT EXISTS).
-- ────────────────────────────────────────────────

-- 1. City preference for appointment
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS city TEXT;

-- 2. Hospital name selected during multi-step booking
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS hospital_name TEXT;

-- 3. Flag for high-alert emergency appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_emergency BOOLEAN DEFAULT false;

-- ─────────────────────────────────────────────────
-- HOW TO RUN: Supabase Dashboard → SQL Editor → New Query → paste → Run
-- ─────────────────────────────────────────────────
