import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in server/.env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearOldData() {
  console.log("Clearing old data...");
  await supabase.from('ambulance_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('emergency_alerts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('emergency_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('appointments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('triage_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('doctor_schedules').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('doctor_hospitals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('doctors').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('hospitals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('departments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('cities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
}

async function seed() {
  try {
    await clearOldData();
    console.log("Seeding Database...");

    // 1. Insert City
    const { data: city, error: cityErr } = await supabase
      .from('cities')
      .insert({ name: 'Delhi' })
      .select()
      .single();
    if (cityErr) throw cityErr;
    console.log("City inserted:", city.name);

    // 2. Insert Departments
    const deptNames = [
      'General Medicine',
      'Cardiology',
      'Orthopedics',
      'Pediatrics',
      'Dermatology',
      'Neurology',
      'Emergency Medicine'
    ];
    const depts = [];
    for (const name of deptNames) {
      const { data, error } = await supabase.from('departments').insert({ name }).select().single();
      if (error) throw error;
      depts.push(data);
    }
    console.log(`Departments inserted: ${depts.length}`);

    // 3. Insert sample/demo hospitals. Use hospital/OPD numbers only, not private doctor numbers.
    const hospitalData = [
      { name: 'AIIMS New Delhi', address: 'Ansari Nagar, New Delhi', phone: '011-26588500', website: 'https://www.aiims.edu', city_id: city.id },
      { name: 'Safdarjung Hospital', address: 'Ring Road, New Delhi', phone: '011-26165060', website: 'http://vmmc-sjh.nic.in', city_id: city.id },
      { name: 'Max Super Speciality Hospital', address: 'Saket, New Delhi', phone: '011-26515050', website: 'https://www.maxhealthcare.in', city_id: city.id },
      { name: 'Apollo Hospitals', address: 'Sarita Vihar, New Delhi', phone: '011-29871090', website: 'https://delhi.apollohospitals.com', city_id: city.id },
      { name: 'Fortis Escorts Heart Institute', address: 'Okhla Road, New Delhi', phone: '011-47135000', website: 'https://www.fortishealthcare.com', city_id: city.id }
    ];
    const hospitals = [];
    for (const h of hospitalData) {
      const { data, error } = await supabase.from('hospitals').insert(h).select().single();
      if (error) throw error;
      hospitals.push(data);
    }
    console.log(`Hospitals inserted: ${hospitals.length}`);
    console.log("Doctor directory seed data is sample/demo data. Verify official OPD details before production use.");

    // 4. Insert sample/demo doctors.
    const doctorData = [
      { name: 'Dr. Ramesh Kumar', deptName: 'General Medicine', qualification: 'MBBS, MD (Medicine)', reg: 'DMC-1234' },
      { name: 'Dr. Sunita Sharma', deptName: 'General Medicine', qualification: 'MBBS, DNB (Internal Medicine)', reg: 'DMC-1235' },
      { name: 'Dr. Anil Gupta', deptName: 'Cardiology', qualification: 'MBBS, MD, DM (Cardiology)', reg: 'DMC-1236' },
      { name: 'Dr. Neha Singh', deptName: 'Cardiology', qualification: 'MBBS, MD (Med), DNB (Cardio)', reg: 'DMC-1237' },
      { name: 'Dr. Vikram Malhotra', deptName: 'Orthopedics', qualification: 'MBBS, MS (Ortho)', reg: 'DMC-1238' },
      { name: 'Dr. Anjali Desai', deptName: 'Orthopedics', qualification: 'MBBS, DNB (Ortho)', reg: 'DMC-1239' },
      { name: 'Dr. Rohit Verma', deptName: 'Pediatrics', qualification: 'MBBS, MD (Pediatrics)', reg: 'DMC-1240' },
      { name: 'Dr. Priya Mehta', deptName: 'Pediatrics', qualification: 'MBBS, DCH', reg: 'DMC-1241' },
      { name: 'Dr. Sanjay Joshi', deptName: 'Dermatology', qualification: 'MBBS, MD (Dermatology)', reg: 'DMC-1242' },
      { name: 'Dr. Kavita Rao', deptName: 'Dermatology', qualification: 'MBBS, DDVL', reg: 'DMC-1243' },
      { name: 'Dr. Amit Patel', deptName: 'General Medicine', qualification: 'MBBS, MD', reg: 'DMC-1244' },
      { name: 'Dr. Meera Nair', deptName: 'Cardiology', qualification: 'MBBS, DM (Cardiology)', reg: 'DMC-1245' },
      { name: 'Dr. Rajesh Chawla', deptName: 'Orthopedics', qualification: 'MBBS, MS (Ortho)', reg: 'DMC-1246' },
      { name: 'Dr. Swati Jain', deptName: 'Pediatrics', qualification: 'MBBS, MD', reg: 'DMC-1247' },
      { name: 'Dr. Arjun Reddy', deptName: 'Dermatology', qualification: 'MBBS, MD (Derm)', reg: 'DMC-1248' },
      { name: 'Dr. Nisha Bansal', deptName: 'Neurology', qualification: 'MBBS, DM (Neurology)', reg: 'DMC-1249' },
      { name: 'Dr. Karan Mehra', deptName: 'Neurology', qualification: 'MBBS, MD, DNB (Neurology)', reg: 'DMC-1250' },
      { name: 'Dr. Farah Khan', deptName: 'Emergency Medicine', qualification: 'MBBS, MD (Emergency Medicine)', reg: 'DMC-1251' },
      { name: 'Dr. Abhishek Suri', deptName: 'Emergency Medicine', qualification: 'MBBS, DNB (Emergency Medicine)', reg: 'DMC-1252' }
    ];

    const doctors = [];
    for (const d of doctorData) {
      const dept = depts.find(dp => dp.name === d.deptName);
      const { data, error } = await supabase.from('doctors').insert({
        name: d.name,
        department_id: dept.id,
        qualification: d.qualification,
        registration_number: d.reg
      }).select().single();
      if (error) throw error;
      doctors.push(data);
    }
    console.log(`Doctors inserted: ${doctors.length}`);

    // 5. Link Doctors to Hospitals (DoctorHospitals)
    // We will distribute doctors among hospitals randomly but ensure each hospital has some
    const doctorHospitals = [];
    for (let i = 0; i < doctors.length; i++) {
      const doc = doctors[i];
      // Assign each doctor to 1 or 2 hospitals
      const h1 = hospitals[i % hospitals.length];
      const h2 = hospitals[(i + 2) % hospitals.length];
      
      const assignments = [h1];
      if (i % 3 === 0) assignments.push(h2); // Some doctors work at multiple hospitals

      for (const h of assignments) {
        const { data, error } = await supabase.from('doctor_hospitals').insert({
          doctor_id: doc.id,
          hospital_id: h.id,
          room_number: `Room ${100 + Math.floor(Math.random() * 100)}`,
          consultation_fee: 500 + Math.floor(Math.random() * 10) * 100, // 500 to 1500
          source_url: h.website,
          last_verified_at: new Date().toISOString()
        }).select().single();
        if (error) throw error;
        doctorHospitals.push(data);
      }
    }
    console.log(`Doctor-Hospital links inserted: ${doctorHospitals.length}`);

    // 6. Insert Schedules
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let scheduleCount = 0;

    for (const dh of doctorHospitals) {
      // Create 2-4 schedule entries per doctor_hospital
      const numDays = 2 + Math.floor(Math.random() * 3);
      const selectedDays = days.sort(() => 0.5 - Math.random()).slice(0, numDays);

      for (const day of selectedDays) {
        const { error } = await supabase.from('doctor_schedules').insert({
          doctor_hospital_id: dh.id,
          day_of_week: day,
          start_time: '09:00:00',
          end_time: '13:00:00',
          shift_label: 'Morning OPD',
          max_slots: 16 // 4 hrs * 2 slots/hr (30 mins each) = 16 slots
        });
        if (error) throw error;
        scheduleCount++;
        
        // Some evening shifts
        if (Math.random() > 0.5) {
          const { error: err2 } = await supabase.from('doctor_schedules').insert({
            doctor_hospital_id: dh.id,
            day_of_week: day,
            start_time: '16:00:00',
            end_time: '19:00:00',
            shift_label: 'Evening OPD',
            max_slots: 12
          });
          if (err2) throw err2;
          scheduleCount++;
        }
      }
    }
    console.log(`Doctor schedules inserted: ${scheduleCount}`);
    
    console.log("Seeding completed successfully!");
  } catch (err) {
    console.error("Seeding failed:", err);
  }
}

seed();
