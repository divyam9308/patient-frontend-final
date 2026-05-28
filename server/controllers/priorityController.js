// controllers/priorityController.js
// Controller for PrioritySystem.js page
// Handles patient triage/priority queue management via Supabase

import supabase from '../config/supabaseClient.js';

// GET /api/priority
export const getPriorityQueue = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { data: request, error } = await supabase
      .from('priority_queue')
      .select('*')
      .eq('patient_id', patientId)
      .order('requested_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(request || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/priority
export const submitPriorityRequest = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { symptoms, severityScore, severityLabel } = req.body;

    if (!symptoms || severityScore === undefined) {
      return res.status(400).json({ error: 'symptoms and severityScore are required' });
    }

    // Determine estimated wait and priority level
    let estimatedWait = 15;
    let priorityLevel = 'Regular';
    if (severityScore >= 70) {
      estimatedWait = 5;
      priorityLevel = 'Immediate';
    } else if (severityScore >= 40) {
      estimatedWait = 120;
      priorityLevel = 'Priority';
    } else {
      estimatedWait = 360;
      priorityLevel = 'Standard';
    }

    // Calculate queue position
    const { count, error: countError } = await supabase
      .from('priority_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'waiting');

    if (countError) throw countError;

    const queuePosition = (count || 0) + 1;

    const { data: newRequest, error: insertError } = await supabase
      .from('priority_queue')
      .insert({
        patient_id: patientId,
        symptoms: symptoms.join(', '),
        severity: severityLabel,
        priority_level: priorityLevel,
        queue_position: queuePosition,
        status: 'waiting',
        estimated_wait: estimatedWait
      })
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }

    res.status(201).json(newRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/priority/:id
export const updatePriorityStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data: updated, error } = await supabase
      .from('priority_queue')
      .update({ status, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
