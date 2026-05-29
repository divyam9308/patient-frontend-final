import supabase from '../config/supabaseClient.js';

export const createEmergencyRequest = async (req, res) => {
  try {
    const {
      triage_id,
      city_id,
      department_id,
      hospital_id,
      patient_location,
      patient_phone,
      ambulance_requested = false,
      pickup_location,
    } = req.body;

    if (!triage_id || !city_id || !department_id || !hospital_id || !patient_location || !patient_phone) {
      return res.status(400).json({
        error: 'triage_id, city_id, department_id, hospital_id, patient_location, and patient_phone are required',
      });
    }

    if (ambulance_requested && !(pickup_location || patient_location)) {
      return res.status(400).json({ error: 'Pickup location is required when ambulance is requested' });
    }

    const { data: triage, error: triageError } = await supabase
      .from('triage_requests')
      .select('id, symptoms, severity_result')
      .eq('id', triage_id)
      .maybeSingle();

    if (triageError) throw triageError;
    if (!triage) return res.status(400).json({ error: 'Invalid triage_id' });
    if (triage.severity_result !== 'emergency') {
      return res.status(400).json({ error: 'Ambulance/emergency booking is available only for emergency triage results' });
    }

    const { data: emergency, error: emergencyError } = await supabase
      .from('emergency_requests')
      .insert({
        patient_id: req.user?.id || null,
        triage_id,
        city_id,
        department_id,
        hospital_id,
        symptoms: triage.symptoms,
        patient_location,
        patient_phone,
        ambulance_requested: !!ambulance_requested,
        ambulance_status: ambulance_requested ? 'requested' : 'not_requested',
        status: 'open',
      })
      .select()
      .single();

    if (emergencyError) throw emergencyError;

    const { data: eligibleDoctors, error: doctorsError } = await supabase
      .from('doctor_hospitals')
      .select('id, doctors!inner(department_id)')
      .eq('hospital_id', hospital_id)
      .eq('doctors.department_id', department_id);

    if (doctorsError) throw doctorsError;

    if (eligibleDoctors?.length) {
      const alerts = eligibleDoctors.map(doctor => ({
        emergency_request_id: emergency.id,
        doctor_hospital_id: doctor.id,
        status: 'sent',
      }));

      const { error: alertError } = await supabase
        .from('emergency_alerts')
        .insert(alerts);

      if (alertError) throw alertError;
    }

    let ambulanceRequest = null;
    if (ambulance_requested) {
      const { data: ambulance, error: ambulanceError } = await supabase
        .from('ambulance_requests')
        .insert({
          emergency_request_id: emergency.id,
          patient_id: req.user?.id || null,
          pickup_location: pickup_location || patient_location,
          destination_hospital_id: hospital_id,
          patient_phone,
          status: 'requested',
        })
        .select()
        .single();

      if (ambulanceError) throw ambulanceError;
      ambulanceRequest = ambulance;
    }

    res.status(201).json({
      success: true,
      emergency_request_id: emergency.id,
      status: emergency.status,
      alerts_sent: eligibleDoctors?.length || 0,
      ambulance_request_id: ambulanceRequest?.id || null,
      ambulance_status: emergency.ambulance_status,
    });
  } catch (error) {
    console.error('Create emergency request error:', error);
    res.status(500).json({ error: error.message });
  }
};
