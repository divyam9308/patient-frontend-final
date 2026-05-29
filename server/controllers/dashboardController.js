// controllers/dashboardController.js
// Controller for Dashboard.js page
// Aggregates data from multiple Supabase tables to build the dashboard view

import supabase from '../config/supabaseClient.js';

// GET /api/dashboard/summary
export const getDashboardSummary = async (req, res) => {
  try {
    const patientId = req.user.id;

    // 1. Count upcoming appointments
    const { count: upcomingApptsCount, error: apptError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patientId)
      .eq('status', 'upcoming');

    if (apptError) throw apptError;

    // 2. Count medications
    const { count: activeMedicationsCount, error: medError } = await supabase
      .from('medications')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patientId);

    if (medError) throw medError;

    // 3. Count medical records
    const { count: medicalRecordsCount, error: recordError } = await supabase
      .from('medical_records')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patientId);

    if (recordError) throw recordError;

    // 4. Count ongoing treatments
    const { count: treatmentsCount, error: treatmentError } = await supabase
      .from('treatments')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patientId)
      .eq('status', 'ongoing');

    if (treatmentError) throw treatmentError;

    // 5. Fetch top 3 upcoming appointments for the snapshot
    const { data: upcomingAppointments, error: apptListError } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patientId)
      .eq('status', 'upcoming')
      .order('appointment_time', { ascending: true })
      .limit(3);

    if (apptListError) throw apptListError;

    // Map database fields to frontend friendly camelCase formats
    const formattedAppts = upcomingAppointments.map(a => {
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
        status: a.status
      };
    });

    res.json({
      stats: {
        upcomingAppts: upcomingApptsCount || 0,
        activeMedicines: activeMedicationsCount || 0,
        medicalRecords: medicalRecordsCount || 0,
        treatments: treatmentsCount || 0
      },
      upcomingAppointments: formattedAppts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/dashboard/profile
export const getPatientProfile = async (req, res) => {
  try {
    const { data: patient, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const { password: _, ...userWithoutPassword } = patient;
    res.json({
      ...userWithoutPassword,
      bloodGroup: userWithoutPassword.blood_group,
      registeredSince: userWithoutPassword.registered_since,
      emergency: userWithoutPassword.emergency_contact,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/dashboard/profile
export const updatePatientProfile = async (req, res) => {
  try {
    const { name, phone, dob, gender, bloodGroup, address, aadhar, emergency } = req.body;

    let initials;
    if (name) {
      initials = name
        .split(' ')
        .filter(Boolean)
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .substring(0, 3) || 'P';
    }

    const updateFields = {
      name,
      phone,
      dob,
      gender,
      blood_group: bloodGroup,
      address,
      aadhar,
      emergency_contact: emergency,
      updated_at: new Date().toISOString()
    };

    if (initials) {
      updateFields.initials = initials;
    }

    const { data: updatedPatient, error } = await supabase
      .from('patients')
      .update(updateFields)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const { password: _, ...userWithoutPassword } = updatedPatient;
    res.json({
      ...userWithoutPassword,
      bloodGroup: userWithoutPassword.blood_group,
      registeredSince: userWithoutPassword.registered_since,
      emergency: userWithoutPassword.emergency_contact,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
