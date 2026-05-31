// controllers/dashboardController.js
// Controller for Dashboard.js page
// Aggregates data from multiple Supabase tables to build the dashboard view

import supabase from '../config/supabaseClient.js';

// GET /api/dashboard/summary
export const getDashboardSummary = async (req, res) => {
  try {
    const patientId = req.user.id;

    const { count: upcomingApptsCount, error: apptError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patientId)
      .in('status', ['upcoming', 'pending'])
      .gt('appointment_date', new Date().toISOString().split('T')[0]);

    if (apptError && String(apptError.message).includes('appointment_date')) {
       // fallback for old schema
       const old = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('patient_id', patientId).eq('status', 'upcoming').gt('appointment_time', new Date().toISOString());
       upcomingApptsCount = old.count;
    }

    const { count: activeEmergenciesCount } = await supabase
      .from('emergency_requests')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patientId)
      .in('status', ['open', 'accepted']);

    const totalUpcoming = (upcomingApptsCount || 0) + (activeEmergenciesCount || 0);

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

    // 5. Fetch top 3 upcoming appointments (only future ones) for the snapshot
    const { data: upcomingAppointments } = await supabase
      .from('appointments')
      .select(`
        id, appointment_date, appointment_time, status, appointment_type,
        doctor_hospitals ( doctors(name, departments(name)) )
      `)
      .eq('patient_id', patientId)
      .in('status', ['upcoming', 'pending']);
      
    let apptList = upcomingAppointments || [];
    if (!apptList.length) {
      // fallback for old schema
      const old = await supabase.from('appointments').select('*').eq('patient_id', patientId).in('status', ['upcoming', 'pending']).limit(3);
      apptList = old.data || [];
    }

    const { data: emergencyData } = await supabase
      .from('emergency_requests')
      .select(`id, created_at, requested_arrival_time, status, departments(name)`)
      .eq('patient_id', patientId)
      .in('status', ['open', 'accepted']);

    // Map database fields to frontend friendly camelCase formats
    const formattedAppts = apptList.map(a => {
      let dateObj;
      if (a.appointment_date && a.appointment_time) {
        dateObj = new Date(`${a.appointment_date}T${a.appointment_time}`);
      } else {
        dateObj = new Date(a.appointment_time);
      }
      return {
        id: a.id,
        doc: a.doctor_hospitals?.doctors?.name || a.doctor_name,
        dept: a.doctor_hospitals?.doctors?.departments?.name || a.department,
        day: dateObj.getDate().toString().padStart(2, '0'),
        mon: dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
        time: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        status: a.status === 'pending' ? 'upcoming' : a.status,
        timestamp: dateObj.getTime()
      };
    });

    const formattedEmergencies = (emergencyData || []).map(e => {
      const dateObj = new Date(e.requested_arrival_time || e.created_at);
      return {
        id: e.id,
        doc: 'Emergency / Ambulance',
        dept: e.departments?.name || 'Emergency',
        day: dateObj.getDate().toString().padStart(2, '0'),
        mon: dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
        time: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        status: 'upcoming',
        timestamp: dateObj.getTime()
      };
    });

    const combinedAndSorted = [...formattedAppts, ...formattedEmergencies]
      .filter(a => a.timestamp > Date.now() || a.status === 'upcoming')
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, 3)
      .map(({ timestamp, ...rest }) => rest);

    res.json({
      stats: {
        upcomingAppts: totalUpcoming,
        activeMedicines: activeMedicationsCount || 0,
        medicalRecords: medicalRecordsCount || 0,
        treatments: treatmentsCount || 0
      },
      upcomingAppointments: combinedAndSorted
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
