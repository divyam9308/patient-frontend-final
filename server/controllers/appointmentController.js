import supabase from '../config/supabaseClient.js';

// ─────────────────────────────────────────────────────────
// GET /api/cities
// ─────────────────────────────────────────────────────────
export const getCities = async (req, res) => {
  try {
    const { data, error } = await supabase.from('cities').select('id, name');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/departments?cityId=...
// ─────────────────────────────────────────────────────────
export const getDepartments = async (req, res) => {
  try {
    const { cityId } = req.query;
    if (!cityId) return res.status(400).json({ error: 'cityId is required' });

    // Find departments that have at least one doctor in a hospital in this city
    const { data, error } = await supabase
      .from('departments')
      .select(`
        id,
        name,
        doctors!inner (
          doctor_hospitals!inner (
            hospitals!inner (
              city_id
            )
          )
        )
      `)
      .eq('doctors.doctor_hospitals.hospitals.city_id', cityId);

    if (error) throw error;

    // Deduplicate departments
    const uniqueDepts = [];
    const ids = new Set();
    for (const d of data) {
      if (!ids.has(d.id)) {
        ids.add(d.id);
        uniqueDepts.push({ id: d.id, name: d.name });
      }
    }
    res.json(uniqueDepts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/hospitals?cityId=...&departmentId=...
// ─────────────────────────────────────────────────────────
export const getHospitals = async (req, res) => {
  try {
    const { cityId, departmentId } = req.query;
    if (!cityId || !departmentId) {
      return res.status(400).json({ error: 'cityId and departmentId required' });
    }

    const { data, error } = await supabase
      .from('hospitals')
      .select(`
        id,
        name,
        address,
        doctor_hospitals!inner (
          doctors!inner (
            department_id
          )
        )
      `)
      .eq('city_id', cityId)
      .eq('doctor_hospitals.doctors.department_id', departmentId);

    if (error) throw error;

    const uniqueHospitals = [];
    const ids = new Set();
    for (const h of data) {
      if (!ids.has(h.id)) {
        ids.add(h.id);
        uniqueHospitals.push({ id: h.id, name: h.name, address: h.address });
      }
    }
    res.json(uniqueHospitals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/doctors?hospitalId=...&departmentId=...
// ─────────────────────────────────────────────────────────
export const getDoctors = async (req, res) => {
  try {
    const { hospitalId, departmentId } = req.query;
    if (!hospitalId || !departmentId) {
      return res.status(400).json({ error: 'hospitalId and departmentId required' });
    }

    const { data, error } = await supabase
      .from('doctor_hospitals')
      .select(`
        id,
        room_number,
        consultation_fee,
        source_url,
        last_verified_at,
        doctors!inner (
          name,
          qualification,
          department_id
        ),
        hospitals!inner (
          name,
          phone
        )
      `)
      .eq('hospital_id', hospitalId)
      .eq('doctors.department_id', departmentId);

    if (error) throw error;

    const formatted = data.map(d => ({
      doctor_hospital_id: d.id,
      name: d.doctors.name,
      qualification: d.doctors.qualification,
      room_number: d.room_number,
      consultation_fee: d.consultation_fee,
      hospital_name: d.hospitals.name,
      hospital_phone: d.hospitals.phone,
      source_url: d.source_url,
      last_verified_at: d.last_verified_at
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/doctors/:doctorHospitalId/schedules
// ─────────────────────────────────────────────────────────
export const getDoctorSchedules = async (req, res) => {
  try {
    const { doctorHospitalId } = req.params;
    const { data, error } = await supabase
      .from('doctor_schedules')
      .select('*')
      .eq('doctor_hospital_id', doctorHospitalId);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/appointments
// ─────────────────────────────────────────────────────────
export const getAppointments = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        appointment_time,
        status,
        is_emergency,
        doctor_hospitals (
          doctors (name, departments(name)),
          hospitals (name, cities(name))
        )
      `)
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (error) throw error;

    const formatted = data.map(a => {
      const docHosp = a.doctor_hospitals;
      const dateObj = new Date(`${a.appointment_date}T${a.appointment_time}`);
      
      return {
        id: a.id,
        doc: docHosp?.doctors?.name,
        dept: docHosp?.doctors?.departments?.name,
        city: docHosp?.hospitals?.cities?.name,
        hospital: docHosp?.hospitals?.name,
        is_emergency: a.is_emergency,
        day: dateObj.getDate().toString().padStart(2, '0'),
        mon: dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
        time: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        status: a.status,
        appointment_date: a.appointment_date,
        appointment_time: a.appointment_time,
      };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/appointments
// ─────────────────────────────────────────────────────────
export const createAppointment = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { doctor_hospital_id, appointment_date, appointment_time, reason, is_emergency } = req.body;

    if (!doctor_hospital_id || !appointment_date || !appointment_time) {
      return res.status(400).json({ error: 'doctor_hospital_id, appointment_date, and appointment_time are required' });
    }

    // Past date/time validation for non-emergency
    const appointmentTime = new Date(`${appointment_date}T${appointment_time}`);
    if (!is_emergency && appointmentTime <= new Date()) {
      return res.status(400).json({
        error: 'Cannot book an appointment in the past. Please choose a future date and time.',
      });
    }

    const { data: newAppt, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: patientId,
        doctor_hospital_id,
        appointment_date,
        appointment_time,
        reason,
        is_emergency: !!is_emergency,
        status: 'upcoming'
      })
      .select(`
        id, appointment_date, appointment_time, status, is_emergency,
        doctor_hospitals (
          doctors (name, departments(name)),
          hospitals (name, cities(name))
        )
      `)
      .single();

    if (error) {
      if (error.code === '23505') { // Postgres Unique Violation
        return res.status(409).json({ error: 'This time slot is already booked for this doctor. Please select another slot.' });
      }
      return res.status(500).json({ error: error.message });
    }

    const docHosp = newAppt.doctor_hospitals;
    const dateObj = new Date(`${newAppt.appointment_date}T${newAppt.appointment_time}`);

    res.status(201).json({
      id: newAppt.id,
      doc: docHosp?.doctors?.name,
      dept: docHosp?.doctors?.departments?.name,
      city: docHosp?.hospitals?.cities?.name,
      hospital: docHosp?.hospitals?.name,
      is_emergency: newAppt.is_emergency,
      day: dateObj.getDate().toString().padStart(2, '0'),
      mon: dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
      time: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      status: newAppt.status,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// PUT /api/appointments/:id
// ─────────────────────────────────────────────────────────
export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // Can only update status for now (e.g. cancelled)

    const { data, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)
      .eq('patient_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// DELETE /api/appointments/:id
// ─────────────────────────────────────────────────────────
export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id)
      .eq('patient_id', req.user.id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
