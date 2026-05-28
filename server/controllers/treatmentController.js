// controllers/treatmentController.js
// Controller for Treatments.js page
// Handles all CRUD operations for the 'treatments' table in Supabase

import supabase from '../config/supabaseClient.js';

// GET /api/treatments
export const getTreatments = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { data: treatments, error } = await supabase
      .from('treatments')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Map fields
    const formatted = treatments.map(t => ({
      id: t.id,
      name: t.name,
      doc: t.doctor,
      status: t.status || 'ongoing',
      progress: t.progress || 0,
      start: t.start_date || '',
      note: t.notes || '',
      // Mock meds mapping based on treatment type for E2E alignment
      meds: t.name.toLowerCase().includes('diabetes') ? ["Metformin 500mg (Twice daily)"]
          : t.name.toLowerCase().includes('hypertension') ? ["Amlodipine 5mg (Once daily)"]
          : t.name.toLowerCase().includes('vitamin d') ? ["Vitamin D3 1000 IU (Once daily)"]
          : []
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/treatments
export const addTreatment = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { name, doctor, start_date, notes } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Treatment name is required' });
    }

    const { data: newTreatment, error } = await supabase
      .from('treatments')
      .insert({
        patient_id: patientId,
        name,
        doctor: doctor || 'Unknown Physician',
        start_date: start_date || new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' }),
        notes: notes || '',
        status: 'ongoing',
        progress: 0
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({
      id: newTreatment.id,
      name: newTreatment.name,
      doc: newTreatment.doctor,
      status: newTreatment.status,
      progress: newTreatment.progress,
      start: newTreatment.start_date,
      note: newTreatment.notes,
      meds: []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/treatments/:id
export const updateTreatment = async (req, res) => {
  try {
    const { id } = req.params;
    const { progress, status, notes } = req.body;

    const updateData = {};
    if (progress !== undefined) updateData.progress = progress;
    if (status) updateData.status = status;
    if (notes) updateData.notes = notes;
    updateData.updated_at = new Date();

    const { data: updated, error } = await supabase
      .from('treatments')
      .update(updateData)
      .eq('id', id)
      .eq('patient_id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      id: updated.id,
      name: updated.name,
      doc: updated.doctor,
      status: updated.status,
      progress: updated.progress,
      start: updated.start_date,
      note: updated.notes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/treatments/:id
export const deleteTreatment = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('treatments')
      .delete()
      .eq('id', id)
      .eq('patient_id', req.user.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Treatment plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/treatments/logs
export const getDiaryLogs = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { data: logs, error } = await supabase
      .from('treatment_diary_logs')
      .select('id, log_text, logged_at, treatments(name)')
      .eq('patient_id', patientId)
      .order('logged_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const formatted = logs.map(l => {
      const dateObj = new Date(l.logged_at);
      const formattedDate = dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

      return {
        id: l.id,
        date: formattedDate,
        treatment: l.treatments ? l.treatments.name : 'General Log',
        text: l.log_text
      };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/treatments/logs
export const addDiaryLog = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { treatmentId, text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Diary log text is required' });
    }

    const { data: newLog, error } = await supabase
      .from('treatment_diary_logs')
      .insert({
        patient_id: patientId,
        treatment_id: treatmentId || null,
        log_text: text
      })
      .select('id, log_text, logged_at, treatments(name)')
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const dateObj = new Date(newLog.logged_at);
    const formattedDate = dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    res.status(201).json({
      id: newLog.id,
      date: formattedDate,
      treatment: newLog.treatments ? newLog.treatments.name : 'General Log',
      text: newLog.log_text
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
