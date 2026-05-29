import { supabase } from '../config/supabaseClient.js';

export const getDoctorEmergencyAlerts = async (req, res) => {
  try {
    // In a real app, this would filter by the logged-in doctor's doctor_hospital_id.
    // For demo purposes, if doctorHospitalId is provided in query, use it, else return all open alerts.
    const { doctorHospitalId } = req.query;

    let query = supabase
      .from('emergency_alerts')
      .select(`
        *,
        emergency_requests (
          id, symptoms, patient_location, patient_phone, ambulance_requested, status, created_at,
          hospitals(name),
          departments(name)
        )
      `)
      .eq('status', 'sent');

    if (doctorHospitalId) {
      query = query.eq('doctor_hospital_id', doctorHospitalId);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const acceptEmergencyAlert = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { doctor_hospital_id } = req.body;

    if (!doctor_hospital_id) {
      return res.status(400).json({ error: 'doctor_hospital_id required' });
    }

    const { data: doctorHospital, error: doctorErr } = await supabase
      .from('doctor_hospitals')
      .select('doctor_id')
      .eq('id', doctor_hospital_id)
      .single();

    if (doctorErr || !doctorHospital) {
      return res.status(400).json({ error: 'Invalid doctor_hospital_id' });
    }

    const { data: updatedReq, error: updateErr } = await supabase
      .from('emergency_requests')
      .update({
        status: 'accepted',
        assigned_doctor_hospital_id: doctor_hospital_id,
        accepted_by_doctor_id: doctorHospital.doctor_id,
        accepted_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .eq('status', 'open')
      .select()
      .maybeSingle();

    if (updateErr) throw updateErr;
    if (!updatedReq) {
      return res.status(409).json({ error: 'Request is no longer open (already accepted or closed)' });
    }

    await supabase
      .from('emergency_alerts')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('emergency_request_id', requestId)
      .eq('doctor_hospital_id', doctor_hospital_id);

    await supabase
      .from('emergency_alerts')
      .update({ status: 'expired', responded_at: new Date().toISOString() })
      .eq('emergency_request_id', requestId)
      .neq('doctor_hospital_id', doctor_hospital_id)
      .eq('status', 'sent');

    res.json({ success: true, message: 'Emergency request accepted', request: updatedReq });
  } catch (error) {
    console.error('Accept alert error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const declineEmergencyAlert = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { doctor_hospital_id } = req.body;

    if (!doctor_hospital_id) {
      return res.status(400).json({ error: 'doctor_hospital_id required' });
    }

    const { error } = await supabase
      .from('emergency_alerts')
      .update({ status: 'declined', responded_at: new Date().toISOString() })
      .eq('emergency_request_id', requestId)
      .eq('doctor_hospital_id', doctor_hospital_id);

    if (error) throw error;

    res.json({ success: true, message: 'Alert declined' });
  } catch (error) {
    console.error('Decline alert error:', error);
    res.status(500).json({ error: error.message });
  }
};
