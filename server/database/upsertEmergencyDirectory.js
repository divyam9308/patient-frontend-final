import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  DELHI_EMERGENCY_HOSPITALS,
  VERIFIED_DOCTOR_DIRECTORY,
} from '../data/delhiEmergencyDirectory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in server/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getOrCreateCity(name) {
  const { data: existing, error: existingError } = await supabase
    .from('cities')
    .select('id, name')
    .eq('name', name)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing;

  const { data, error } = await supabase
    .from('cities')
    .insert({ name })
    .select('id, name')
    .single();

  if (error) throw error;
  return data;
}

async function getOrCreateDepartment(name) {
  const { data: existing, error: existingError } = await supabase
    .from('departments')
    .select('id, name')
    .eq('name', name)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing;

  const { data, error } = await supabase
    .from('departments')
    .insert({ name })
    .select('id, name')
    .single();

  if (error) throw error;
  return data;
}

async function upsertHospital(cityId, hospital) {
  const payload = {
    city_id: cityId,
    name: hospital.name,
    address: hospital.address,
    phone: hospital.phone,
    website: hospital.website,
    emergency_phone: hospital.emergencyPhone,
    emergency_bed_capacity: hospital.publishedBedCapacity,
    ambulance_fleet: hospital.ambulanceFleet,
    app_reserved_beds: hospital.appReservedBeds,
    app_reserved_ambulances: hospital.appReservedAmbulances,
    data_source_url: hospital.sourceUrl,
    data_verified_at: new Date().toISOString(),
  };

  const { data: existing, error: existingError } = await supabase
    .from('hospitals')
    .select('id')
    .eq('city_id', cityId)
    .eq('name', hospital.name)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing) {
    const { data, error } = await supabase
      .from('hospitals')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('hospitals')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function upsertDoctor(doctorRecord, hospitalByName) {
  const department = await getOrCreateDepartment(doctorRecord.department);
  const hospital = hospitalByName.get(doctorRecord.hospital);

  if (!hospital) {
    console.warn(`Skipping ${doctorRecord.name}: hospital not found (${doctorRecord.hospital})`);
    return null;
  }

  const { data: existingDoctor, error: existingDoctorError } = await supabase
    .from('doctors')
    .select('id')
    .eq('name', doctorRecord.name)
    .eq('department_id', department.id)
    .maybeSingle();

  if (existingDoctorError) throw existingDoctorError;

  let doctor = existingDoctor;
  if (doctor) {
    const { data, error } = await supabase
      .from('doctors')
      .update({
        qualification: doctorRecord.qualification,
        registration_number: null,
      })
      .eq('id', doctor.id)
      .select('id')
      .single();
    if (error) throw error;
    doctor = data;
  } else {
    const { data, error } = await supabase
      .from('doctors')
      .insert({
        name: doctorRecord.name,
        department_id: department.id,
        qualification: doctorRecord.qualification,
        registration_number: null,
      })
      .select('id')
      .single();
    if (error) throw error;
    doctor = data;
  }

  const { data: existingLink, error: existingLinkError } = await supabase
    .from('doctor_hospitals')
    .select('id')
    .eq('doctor_id', doctor.id)
    .eq('hospital_id', hospital.id)
    .maybeSingle();

  if (existingLinkError) throw existingLinkError;
  if (existingLink) return doctor;

  const { error: linkError } = await supabase
    .from('doctor_hospitals')
    .insert({
      doctor_id: doctor.id,
      hospital_id: hospital.id,
      room_number: 'Emergency / OPD desk',
      consultation_fee: null,
      source_url: doctorRecord.sourceUrl,
      last_verified_at: new Date().toISOString(),
    });

  if (linkError) throw linkError;
  return doctor;
}

async function main() {
  const city = await getOrCreateCity('Delhi');
  const hospitalByName = new Map();

  for (const hospitalRecord of DELHI_EMERGENCY_HOSPITALS) {
    const hospital = await upsertHospital(city.id, hospitalRecord);
    hospitalByName.set(hospitalRecord.name, hospital);
  }

  for (const doctorRecord of VERIFIED_DOCTOR_DIRECTORY) {
    await upsertDoctor(doctorRecord, hospitalByName);
  }

  console.log(`Upserted ${DELHI_EMERGENCY_HOSPITALS.length} sourced hospital records.`);
  console.log(`Upserted ${VERIFIED_DOCTOR_DIRECTORY.length} sourced doctor records.`);
  console.log('Ambulance fleet counts remain null where no official/public source was found.');
}

main().catch(error => {
  const message = String(error?.message || '');
  if (message.includes('ambulance_fleet') || message.includes('emergency_bed_capacity')) {
    console.error('Emergency directory upsert failed: live database schema is missing emergency directory columns.');
    console.error('Run server/database/emergency_directory_migration.sql in Supabase SQL Editor, then rerun this script.');
    process.exit(1);
  }

  console.error('Emergency directory upsert failed:', error);
  process.exit(1);
});
