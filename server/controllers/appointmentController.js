// controllers/appointmentController.js
// Controller for Appointment.js page
// Handles all CRUD operations for the 'appointments' table in Supabase
// NEW: getAppointmentMeta, getAvailableSlots, past-date validation, emergency booking

import supabase from '../config/supabaseClient.js';
import {
  CITIES_DATA,
  DEFAULT_SLOTS,
  getCities,
  getHospitalsByCity,
  getDepartmentsByHospital,
  getDoctorsByDepartment,
  findRecommendations,
} from '../database/doctorsData.js';

// ─────────────────────────────────────────────────────────
// GET /api/appointments/meta
// Returns the full city → hospital → department → doctors hierarchy
// ─────────────────────────────────────────────────────────
export const getAppointmentMeta = async (req, res) => {
  try {
    res.json({ cities: CITIES_DATA });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/appointments/available-slots?city=&hospital=&department=&doctor=&date=
// Returns time slots for a doctor on a given date, filtering out already-booked
// slots and (for today) slots whose time has already passed.
// ─────────────────────────────────────────────────────────
export const getAvailableSlots = async (req, res) => {
  try {
    const { city, hospital, department, doctor, date } = req.query;

    if (!doctor || !date) {
      return res.status(400).json({ error: 'doctor and date are required' });
    }

    // Validate doctor exists in our data
    const validDoctors = getDoctorsByDepartment(city, hospital, department);
    if (!validDoctors.includes(doctor)) {
      return res.status(400).json({ error: 'Doctor not found in our records' });
    }

    // Find all booked appointments for this doctor on this date
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd   = new Date(`${date}T23:59:59.999Z`);

    const { data: booked, error } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('doctor_name', doctor)
      .gte('appointment_time', dayStart.toISOString())
      .lte('appointment_time', dayEnd.toISOString())
      .neq('status', 'cancelled');

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Build set of booked HH:MM times
    const bookedTimes = new Set(
      (booked || []).map(b => {
        const d = new Date(b.appointment_time);
        return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
      })
    );

    const now = new Date();
    const isToday = (new Date(date).toDateString() === now.toDateString());

    const available = DEFAULT_SLOTS.filter(slot => {
      if (bookedTimes.has(slot)) return false;
      // If booking for today, also remove slots already past
      if (isToday) {
        const [h, m] = slot.split(':').map(Number);
        const slotTime = new Date();
        slotTime.setHours(h, m, 0, 0);
        if (slotTime <= now) return false;
      }
      return true;
    });

    res.json({ slots: available, bookedCount: bookedTimes.size });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/appointments/recommendations?city=&hospital=&department=
// Returns alternative hospital recommendations when no doctor is available
// ─────────────────────────────────────────────────────────
export const getRecommendations = async (req, res) => {
  try {
    const { city, hospital, department } = req.query;
    if (!city || !hospital || !department) {
      return res.status(400).json({ error: 'city, hospital, and department are required' });
    }
    const recs = findRecommendations(city, hospital, department);
    res.json({ recommendations: recs });
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
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patientId)
      .order('appointment_time', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const formattedAppts = appointments.map(a => {
      const dateObj = new Date(a.appointment_time);
      const day  = dateObj.getDate().toString().padStart(2, '0');
      const mon  = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const time = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      return {
        id:               a.id,
        doc:              a.doctor_name,
        dept:             a.department,
        city:             a.city || null,
        hospital:         a.hospital_name || null,
        is_emergency:     a.is_emergency || false,
        day,
        mon,
        time,
        status:           a.status,
        appointment_time: a.appointment_time,
      };
    });

    res.json(formattedAppts);
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
    const { doc, dept, date, time, city, hospital, is_emergency } = req.body;

    if (!doc || !dept || !date || !time) {
      return res.status(400).json({ error: 'doc, dept, date, and time are required' });
    }

    // Build appointment datetime
    let appointmentTime;
    if (time.includes('AM') || time.includes('PM')) {
      const [timeStr, modifier] = time.split(' ');
      let [hours, minutes] = timeStr.split(':');
      if (hours === '12') hours = '00';
      if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
      appointmentTime = new Date(`${date}T${hours.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}:00`);
    } else {
      appointmentTime = new Date(`${date}T${time}:00`);
    }

    // ── Past-date / past-time validation for non-emergency appointments ──
    if (!is_emergency && appointmentTime <= new Date()) {
      return res.status(400).json({
        error: 'Cannot book an appointment in the past. Please choose a future date and time.',
      });
    }

    const insertPayload = {
      patient_id:       patientId,
      doctor_name:      doc,
      department:       dept,
      appointment_time: appointmentTime.toISOString(),
      status:           'upcoming',
    };

    // Attach optional fields only if columns exist (graceful)
    if (city)         insertPayload.city          = city;
    if (hospital)     insertPayload.hospital_name = hospital;
    if (is_emergency) insertPayload.is_emergency  = true;

    const { data: newAppt, error } = await supabase
      .from('appointments')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const dateObj      = new Date(newAppt.appointment_time);
    const day          = dateObj.getDate().toString().padStart(2, '0');
    const mon          = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const timeFormatted = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    res.status(201).json({
      id:           newAppt.id,
      doc:          newAppt.doctor_name,
      dept:         newAppt.department,
      city:         newAppt.city || null,
      hospital:     newAppt.hospital_name || null,
      is_emergency: newAppt.is_emergency || false,
      day,
      mon,
      time: timeFormatted,
      status:           newAppt.status,
      appointment_time: newAppt.appointment_time,
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
    const { id }                 = req.params;
    const { doc, dept, date, time, status } = req.body;

    const updateData = {};
    if (doc)    updateData.doctor_name = doc;
    if (dept)   updateData.department  = dept;
    if (status) updateData.status      = status;
    if (date && time) {
      const appointmentTime        = new Date(`${date}T${time}:00`);
      updateData.appointment_time  = appointmentTime.toISOString();
    }
    updateData.updated_at = new Date();

    const { data: updatedAppt, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .eq('patient_id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const dateObj       = new Date(updatedAppt.appointment_time);
    const day           = dateObj.getDate().toString().padStart(2, '0');
    const mon           = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const timeFormatted = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    res.json({
      id:   updatedAppt.id,
      doc:  updatedAppt.doctor_name,
      dept: updatedAppt.department,
      day,
      mon,
      time: timeFormatted,
      status:           updatedAppt.status,
      appointment_time: updatedAppt.appointment_time,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// DELETE /api/appointments/:id  (soft-cancel)
// ─────────────────────────────────────────────────────────
export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: updatedAppt, error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled', updated_at: new Date() })
      .eq('id', id)
      .eq('patient_id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Appointment cancelled successfully', appointment: updatedAppt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
