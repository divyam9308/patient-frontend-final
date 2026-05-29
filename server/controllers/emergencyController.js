import { supabase } from '../config/supabaseClient.js';

export const createEmergencyRequest = async (req, res) => {
  try {
    const {
      triage_id,
      city_id,
      department_id,
      hospital_id,
      patient_location,
      patient_phone,
      ambulance_requested,
      pickup_location,
      patientId = null
    } = req.body;

    if (!triage_id || !hospital_id || !department_id) {
      return res.status(400).json({ error: 'triage_id, hospital_id, and department_id are required' });
    }

    // 1. Fetch symptoms from triage_request
    const { data: triageReq, error: triageErr } = await supabase
      .from('triage_requests')
      .select('symptoms')
      .eq('id', triage_id)
      .single();

    if (triageErr || !triageReq) {
      return res.status(400).json({ error: 'Invalid triage_id' });
    }

    // 2. Create emergency_requests
    const { data: emergencyReq, error: emergencyErr } = await supabase
      .from('emergency_requests')
      .insert([{
        patient_id: patientId,
        triage_id,
        city_id,
        department_id,
        hospital_id,
        symptoms: triageReq.symptoms,
        patient_location,
        patient_phone,
        ambulance_requested: ambulance_requested || false,
        ambulance_status: ambulance_requested ? 'requested' : 'not_requested'
      }])
      .select()
      .single();

    if (emergencyErr) throw emergencyErr;

    // 3. Create ambulance_requests if requested
    if (ambulance_requested) {
      const { error: ambErr } = await supabase
        .from('ambulance_requests')
        .insert([{
          emergency_request_id: emergencyReq.id,
          patient_id: patientId,
          pickup_location: pickup_location || patient_location,
          destination_hospital_id: hospital_id,
          patient_phone
        }]);
      if (ambErr) console.error('Error creating ambulance request:', ambErr);
    }

    // 4. Fetch eligible doctors
    const { data: eligibleDoctors, error: docErr } = await supabase
      .from('doctor_hospitals')
      .select('id, doctors!inner(department_id)')
      .eq('hospital_id', hospital_id)
      .eq('doctors.department_id', department_id);

    if (docErr) throw docErr;

    // 5. Create emergency_alerts for doctors
    if (eligibleDoctors && eligibleDoctors.length > 0) {
      const alertsToInsert = eligibleDoctors.map(doc => ({
        emergency_request_id: emergencyReq.id,
        doctor_hospital_id: doc.id
      }));

      const { error: alertErr } = await supabase
        .from('emergency_alerts')
        .insert(alertsToInsert);
      
      if (alertErr) console.error('Error creating emergency alerts:', alertErr);
    }

    res.status(201).json({
      success: true,
      emergency_request_id: emergencyReq.id,
      status: emergencyReq.status,
      alerts_sent: eligibleDoctors ? eligibleDoctors.length : 0
    });
  } catch (error) {
    console.error('Create emergency request error:', error);
    res.status(500).json({ error: error.message });
  }
};
