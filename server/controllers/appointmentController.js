// controllers/appointmentController.js
// Controller for Appointment.js page
// Handles all CRUD operations for the 'appointments' table in Supabase

import supabase from '../config/supabaseClient.js';

// GET /api/appointments
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

    // Map database model to frontend style
    const formattedAppts = appointments.map(a => {
      const dateObj = new Date(a.appointment_time);
      const day = dateObj.getDate().toString().padStart(2, '0');
      const mon = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const time = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      return {
        id: a.id,
        doc: a.doctor_name,
        dept: a.department,
        day,
        mon,
        time,
        status: a.status,
        appointment_time: a.appointment_time
      };
    });

    res.json(formattedAppts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/appointments
export const createAppointment = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { doc, dept, date, time } = req.body;

    if (!doc || !dept || !date || !time) {
      return res.status(400).json({ error: 'doc, dept, date, and time are required' });
    }

    // Combine date and time to ISO String
    // Expected date: YYYY-MM-DD
    // Expected time: HH:MM or 10:30 AM/PM
    let appointmentTime;
    if (time.includes('AM') || time.includes('PM')) {
      // Parse AM/PM style time
      const [timeStr, modifier] = time.split(' ');
      let [hours, minutes] = timeStr.split(':');
      if (hours === '12') hours = '00';
      if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
      appointmentTime = new Date(`${date}T${hours.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}:00`);
    } else {
      // Already in 24hr HH:MM style
      appointmentTime = new Date(`${date}T${time}:00`);
    }

    const { data: newAppt, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: patientId,
        doctor_name: doc,
        department: dept,
        appointment_time: appointmentTime.toISOString(),
        status: 'upcoming'
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const dateObj = new Date(newAppt.appointment_time);
    const day = dateObj.getDate().toString().padStart(2, '0');
    const mon = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const timeFormatted = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    res.status(201).json({
      id: newAppt.id,
      doc: newAppt.doctor_name,
      dept: newAppt.department,
      day,
      mon,
      time: timeFormatted,
      status: newAppt.status,
      appointment_time: newAppt.appointment_time
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/appointments/:id
export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { doc, dept, date, time, status } = req.body;

    const updateData = {};
    if (doc) updateData.doctor_name = doc;
    if (dept) updateData.department = dept;
    if (status) updateData.status = status;
    if (date && time) {
      const appointmentTime = new Date(`${date}T${time}:00`);
      updateData.appointment_time = appointmentTime.toISOString();
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

    const dateObj = new Date(updatedAppt.appointment_time);
    const day = dateObj.getDate().toString().padStart(2, '0');
    const mon = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const timeFormatted = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    res.json({
      id: updatedAppt.id,
      doc: updatedAppt.doctor_name,
      dept: updatedAppt.department,
      day,
      mon,
      time: timeFormatted,
      status: updatedAppt.status,
      appointment_time: updatedAppt.appointment_time
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/appointments/:id
export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete / cancel
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
