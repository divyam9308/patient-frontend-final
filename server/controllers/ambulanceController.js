import supabase from '../config/supabaseClient.js';

export const createAmbulanceRequest = async (req, res) => {
  try {
    const {
      emergency_request_id,
      pickup_location,
      destination_hospital_id,
      patient_phone,
    } = req.body;

    if (!emergency_request_id || !pickup_location) {
      return res.status(400).json({ error: 'emergency_request_id and pickup_location are required' });
    }

    const { data: emergency, error: emergencyError } = await supabase
      .from('emergency_requests')
      .select('id, status')
      .eq('id', emergency_request_id)
      .maybeSingle();

    if (emergencyError) throw emergencyError;
    if (!emergency) return res.status(404).json({ error: 'Emergency request not found' });

    const { data, error } = await supabase
      .from('ambulance_requests')
      .insert({
        emergency_request_id,
        patient_id: req.user?.id || null,
        pickup_location,
        destination_hospital_id,
        patient_phone,
        status: 'requested',
      })
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('emergency_requests')
      .update({ ambulance_requested: true, ambulance_status: 'requested' })
      .eq('id', emergency_request_id);

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Create ambulance request error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getAmbulanceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('ambulance_requests')
      .select('*, hospitals(name, address, phone)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Ambulance request not found' });

    res.json(data);
  } catch (error) {
    console.error('Get ambulance request error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateAmbulanceRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) return res.status(400).json({ error: 'status is required' });

    const { data, error } = await supabase
      .from('ambulance_requests')
      .update({ status })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Ambulance request not found' });

    if (data.emergency_request_id) {
      await supabase
        .from('emergency_requests')
        .update({ ambulance_status: status })
        .eq('id', data.emergency_request_id);
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Update ambulance request error:', error);
    res.status(500).json({ error: error.message });
  }
};
