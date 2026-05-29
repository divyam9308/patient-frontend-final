import { supabase } from '../config/supabaseClient.js';

export const createAmbulanceRequest = async (req, res) => {
  try {
    const { emergency_request_id, patient_id, pickup_location, destination_hospital_id, patient_phone } = req.body;

    if (!emergency_request_id || !pickup_location) {
      return res.status(400).json({ error: 'emergency_request_id and pickup_location are required' });
    }

    const { data, error } = await supabase
      .from('ambulance_requests')
      .insert([{
        emergency_request_id,
        patient_id,
        pickup_location,
        destination_hospital_id,
        patient_phone
      }])
      .select()
      .single();

    if (error) throw error;

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
      .select('*, hospitals(name)')
      .eq('id', id)
      .single();

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
      .single();

    if (error) throw error;

    // Also update emergency_requests.ambulance_status if needed
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
