// controllers/medicalRecordsController.js
// Controller for MedicalRecords.js page
// Handles listing, uploading, and deleting medical records from Supabase Storage + DB

import supabase from '../config/supabaseClient.js';

// GET /api/medical-records
export const getMedicalRecords = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { data: records, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', patientId)
      .order('upload_date', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Map database model to frontend style
    const formattedRecords = records.map(r => {
      const dateObj = new Date(r.upload_date);
      const formattedDate = dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      
      return {
        id: r.id,
        name: r.name,
        date: formattedDate,
        type: r.type,
        size: r.size || '1.1 MB',
        icon: r.icon || '📋',
        color: r.color || '#e8f5ee',
        doctor: r.doctor || 'Dr. Self Reported',
        facility: r.facility || 'Personal Upload',
        notes: r.notes || 'No notes provided.',
        vitals: r.vitals || []
      };
    });

    res.json(formattedRecords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/medical-records
export const uploadMedicalRecord = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { name, type, size, doctor, facility, notes, vitals, icon, color, fileUrl } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'name and type are required' });
    }

    const { data: newRecord, error } = await supabase
      .from('medical_records')
      .insert({
        patient_id: patientId,
        name,
        type,
        size: size || '1.1 MB',
        file_url: fileUrl || null,
        icon: icon || '📋',
        color: color || '#e8f5ee',
        doctor: doctor || 'Dr. Self Reported',
        facility: facility || 'Personal Upload',
        notes: notes || 'No notes provided.',
        vitals: vitals || []
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const dateObj = new Date(newRecord.upload_date);
    const formattedDate = dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    res.status(201).json({
      id: newRecord.id,
      name: newRecord.name,
      date: formattedDate,
      type: newRecord.type,
      size: newRecord.size,
      icon: newRecord.icon,
      color: newRecord.color,
      doctor: newRecord.doctor,
      facility: newRecord.facility,
      notes: newRecord.notes,
      vitals: newRecord.vitals
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/medical-records/:id
export const deleteMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('medical_records')
      .delete()
      .eq('id', id)
      .eq('patient_id', req.user.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Medical record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
