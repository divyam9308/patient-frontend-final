// controllers/medicalRecordsController.js
// Handles listing, uploading, and deleting medical records.

import supabase from '../config/supabaseClient.js';

function isMissingAnalysisColumn(error) {
  return String(error?.message || '').toLowerCase().includes('analysis');
}

function isMissingReportDateColumn(error) {
  return String(error?.message || '').toLowerCase().includes('report_date');
}

function formatRecordDate(record) {
  const dateObj = new Date(record.report_date || record.upload_date);
  if (Number.isNaN(dateObj.getTime())) return '';

  return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatMedicalRecord(record, analysisFallback = null) {
  return {
    id: record.id,
    name: record.name,
    date: formatRecordDate(record),
    reportDate: record.report_date || null,
    type: record.type,
    size: record.size || '1.1 MB',
    icon: record.icon || '\uD83D\uDCCB',
    color: record.color || '#e8f5ee',
    doctor: record.doctor || 'Dr. Self Reported',
    facility: record.facility || 'Personal Upload',
    notes: record.notes || 'No notes provided.',
    vitals: record.vitals || [],
    analysis: record.analysis || analysisFallback || null,
  };
}

function vitalKey(vital) {
  return String(vital?.test_name || vital?.testName || vital?.name || '')
    .trim()
    .toLowerCase();
}

async function updateRepeatedVitalsForPatient(patientId, newRecordId, newVitals, reportDate) {
  const latestVitalsByName = new Map(
    (Array.isArray(newVitals) ? newVitals : [])
      .filter(vital => vitalKey(vital))
      .map(vital => [vitalKey(vital), {
        ...vital,
        updatedFromRecordId: newRecordId,
        updatedFromReportDate: reportDate || null,
      }])
  );

  if (latestVitalsByName.size === 0) return;

  const { data: records, error } = await supabase
    .from('medical_records')
    .select('id, vitals')
    .eq('patient_id', patientId)
    .neq('id', newRecordId);

  if (error) {
    console.warn('Unable to load existing vitals for update:', error.message);
    return;
  }

  await Promise.all((records || []).map(async (record) => {
    const currentVitals = Array.isArray(record.vitals) ? record.vitals : [];
    let changed = false;
    const mergedVitals = currentVitals.map(vital => {
      const replacement = latestVitalsByName.get(vitalKey(vital));
      if (!replacement) return vital;

      changed = true;
      return {
        ...replacement,
        previousValue: vital.value,
        previousNumericValue: vital.numericValue,
        previousStatus: vital.status,
      };
    });

    if (!changed) return;

    const { error: updateError } = await supabase
      .from('medical_records')
      .update({ vitals: mergedVitals })
      .eq('id', record.id)
      .eq('patient_id', patientId);

    if (updateError) {
      console.warn(`Unable to update repeated vitals for record ${record.id}:`, updateError.message);
    }
  }));
}

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

    res.json((records || []).map(formatMedicalRecord));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/medical-records
export const uploadMedicalRecord = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { name, type, size, doctor, facility, notes, vitals, icon, color, fileUrl, analysis, reportDate } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'name and type are required' });
    }

    const baseInsert = {
      patient_id: patientId,
      name,
      type,
      size: size || '1.1 MB',
      file_url: fileUrl || null,
      icon: icon || '\uD83D\uDCCB',
      color: color || '#e8f5ee',
      doctor: doctor || 'Dr. Self Reported',
      facility: facility || 'Personal Upload',
      notes: notes || analysis?.conclusion || 'No notes provided.',
      vitals: vitals || [],
      analysis: analysis || null,
      report_date: reportDate || null,
    };

    let { data: newRecord, error } = await supabase
      .from('medical_records')
      .insert(baseInsert)
      .select()
      .single();

    if (error && (isMissingAnalysisColumn(error) || isMissingReportDateColumn(error))) {
      const fallbackInsert = { ...baseInsert };
      if (isMissingAnalysisColumn(error)) delete fallbackInsert.analysis;
      if (isMissingReportDateColumn(error)) delete fallbackInsert.report_date;

      const fallback = await supabase
        .from('medical_records')
        .insert(fallbackInsert)
        .select()
        .single();

      newRecord = fallback.data;
      error = fallback.error;
    }

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    await updateRepeatedVitalsForPatient(patientId, newRecord.id, newRecord.vitals, newRecord.report_date || reportDate);

    res.status(201).json(formatMedicalRecord(newRecord, analysis));
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
