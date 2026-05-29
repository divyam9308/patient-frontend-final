import supabase from '../config/supabaseClient.js';

export const getDoctorEmergencyAlerts = async (req, res) => {
  try {
    const { doctorHospitalId } = req.query;
    let query = supabase
      .from('emergency_alerts')
      .select(`
        *,
        emergency_requests!inner (
          id,
          symptoms,
          patient_location,
          patient_phone,
          ambulance_requested,
          ambulance_status,
          status,
          created_at,
          hospitals(name),
          departments(name)
        )
      `)
      .eq('status', 'sent')
      .eq('emergency_requests.status', 'open')
      .order('created_at', { ascending: false });

    if (doctorHospitalId) {
      query = query.eq('doctor_hospital_id', doctorHospitalId);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Get doctor emergency alerts error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const acceptEmergencyAlert = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { doctor_hospital_id } = req.body;

    if (!doctor_hospital_id) {
      return res.status(400).json({ error: 'doctor_hospital_id is required' });
    }

    const { data: alert, error: alertLookupError } = await supabase
      .from('emergency_alerts')
      .select('id, status')
      .eq('emergency_request_id', requestId)
      .eq('doctor_hospital_id', doctor_hospital_id)
      .eq('status', 'sent')
      .maybeSingle();

    if (alertLookupError) throw alertLookupError;
    if (!alert) {
      return res.status(409).json({ error: 'This alert is no longer open for this doctor' });
    }

    const { data: doctorHospital, error: doctorError } = await supabase
      .from('doctor_hospitals')
      .select('doctor_id')
      .eq('id', doctor_hospital_id)
      .maybeSingle();

    if (doctorError) throw doctorError;
    if (!doctorHospital) return res.status(400).json({ error: 'Invalid doctor_hospital_id' });

    const { data: updatedRequest, error: updateError } = await supabase
      .from('emergency_requests')
      .update({
        status: 'accepted',
        assigned_doctor_hospital_id: doctor_hospital_id,
        accepted_by_doctor_id: doctorHospital.doctor_id,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .eq('status', 'open')
      .select()
      .maybeSingle();

    if (updateError) throw updateError;
    if (!updatedRequest) {
      return res.status(409).json({ error: 'This emergency request was already accepted or closed' });
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

    res.json({
      success: true,
      message: 'Emergency request accepted',
      request: updatedRequest,
    });
  } catch (error) {
    console.error('Accept emergency alert error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const declineEmergencyAlert = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { doctor_hospital_id } = req.body;

    if (!doctor_hospital_id) {
      return res.status(400).json({ error: 'doctor_hospital_id is required' });
    }

    const { error } = await supabase
      .from('emergency_alerts')
      .update({ status: 'declined', responded_at: new Date().toISOString() })
      .eq('emergency_request_id', requestId)
      .eq('doctor_hospital_id', doctor_hospital_id)
      .eq('status', 'sent');

    if (error) throw error;

    res.json({ success: true, message: 'Alert declined' });
  } catch (error) {
    console.error('Decline emergency alert error:', error);
    res.status(500).json({ error: error.message });
  }
};
