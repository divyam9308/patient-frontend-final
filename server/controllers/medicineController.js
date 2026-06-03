// controllers/medicineController.js
// Controller for MedicineVerification.js page
// Handles medication list management and medicine verification via Supabase

import supabase from '../config/supabaseClient.js';

const isMissingTableError = (error, tableName) => {
  const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
  return error?.code === '42P01' || message.includes(tableName.toLowerCase());
};

const isMissingColumnError = (error) => {
  const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
  return error?.code === '42703' ||
    error?.code === 'PGRST204' ||
    message.includes('column') ||
    message.includes('schema cache');
};

const buildLegacyVerification = (code, requestedName) => {
  const result = {
    verified: false,
    finalName: requestedName || `Unknown Batch (${code})`,
    mfr: 'Unverified / Fake Source',
    expiry: '—',
    color: '#fffbeb',
    icon: '⚠️',
    status: 'warning',
    brandName: null,
    source: 'Legacy fallback rules',
    dosageForm: null,
    strength: null
  };

  if (code.startsWith('MP') || code.startsWith('AT') || code.startsWith('AM') || code === 'PA7788D' || code === 'AM3344X') {
    result.verified = true;
    result.color = '#e8f5ee';
    result.icon = '💊';
    result.status = 'verified';

    if (code.startsWith('MP')) {
      result.finalName = 'Metformin 500mg';
      result.mfr = 'Sun Pharma Ltd';
      result.expiry = 'Nov 2026';
    } else if (code.startsWith('AT')) {
      result.finalName = 'Atorvastatin 20mg';
      result.mfr = 'Cipla Ltd';
      result.expiry = 'Aug 2026';
    } else if (code.startsWith('AM') && code !== 'AM3344X') {
      result.finalName = 'Amlodipine 5mg';
      result.mfr = "Dr. Reddy's Laboratories";
      result.expiry = 'Mar 2027';
    } else if (code === 'PA7788D') {
      result.finalName = 'Paracetamol 500mg';
      result.mfr = 'GSK Consumer Healthcare';
      result.expiry = 'Dec 2027';
    } else if (code === 'AM3344X') {
      result.finalName = 'Amoxicillin 250mg';
      result.mfr = 'Abbott Laboratories';
      result.expiry = 'Sep 2026';
    }
  }

  return result;
};

// GET /api/medicines
export const getMedications = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { data: medications, error } = await supabase
      .from('medications')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const formatted = medications.map(m => ({
      id: m.id,
      name: m.name,
      purpose: m.purpose || 'Medication',
      freq: m.frequency || 'Once daily',
      icon: m.icon || '💊',
      color: m.color || '#e8f5ee'
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/medicines/verify
export const verifyMedicine = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { batchCode, name } = req.body;

    if (!batchCode) {
      return res.status(400).json({ error: 'Batch code is required' });
    }

    const code = batchCode.toUpperCase().trim();
    const verification = buildLegacyVerification(code, name);

    const { data: batchMatch, error: lookupError } = await supabase
      .from('medicine_batches')
      .select('*')
      .eq('batch_code', code)
      .maybeSingle();

    if (lookupError && !isMissingTableError(lookupError, 'medicine_batches')) {
      return res.status(500).json({ error: lookupError.message });
    }

    if (lookupError && isMissingTableError(lookupError, 'medicine_batches')) {
      console.warn('[Medicine Verification] medicine_batches table unavailable; using legacy verification fallback.');
    }

    if (batchMatch) {
      verification.finalName = batchMatch.medicine_name || verification.finalName;
      verification.mfr = batchMatch.manufacturer || verification.mfr;
      verification.brandName = batchMatch.brand_name || null;
      verification.source = batchMatch.source || 'Medicine batch database';
      verification.dosageForm = batchMatch.dosage_form || null;
      verification.strength = batchMatch.strength || null;

      const expDate = new Date(batchMatch.expiry_date);
      const now = new Date();
      verification.expiry = Number.isNaN(expDate.getTime())
        ? verification.expiry
        : expDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

      if (batchMatch.verification_status === 'recalled') {
        verification.verified = false;
        verification.status = 'recalled';
        verification.color = '#fee2e2';
        verification.icon = '🚨';
      } else if (batchMatch.verification_status === 'expired' || (!Number.isNaN(expDate.getTime()) && expDate < now)) {
        verification.verified = false;
        verification.status = 'expired';
        verification.color = '#ffedd5';
        verification.icon = '⏳';
      } else {
        verification.verified = true;
        verification.status = 'verified';
        verification.color = '#e8f5ee';
        verification.icon = '✅';
      }
    }

    const baseInsert = {
      patient_id: patientId,
      name: verification.finalName,
      manufacturer: verification.mfr,
      expiry: verification.expiry,
      batch: code,
      verified: verification.verified
    };

    const enrichedInsert = {
      ...baseInsert,
      status: verification.status,
      brand_name: verification.brandName,
      source: verification.source,
      dosage_form: verification.dosageForm,
      strength: verification.strength
    };

    let { data: newVerification, error } = await supabase
      .from('medicine_verifications')
      .insert(enrichedInsert)
      .select()
      .single();

    if (error && isMissingColumnError(error)) {
      const fallbackInsert = await supabase
        .from('medicine_verifications')
        .insert(baseInsert)
        .select()
        .single();
      newVerification = fallbackInsert.data;
      error = fallbackInsert.error;
    }

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const dateObj = new Date(newVerification.verification_date || Date.now());
    const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    res.status(201).json({
      id: newVerification.id,
      name: newVerification.name,
      mfr: newVerification.manufacturer,
      expiry: newVerification.expiry,
      batch: newVerification.batch,
      verified: newVerification.verified,
      date: formattedDate,
      icon: verification.icon,
      color: verification.color,
      status: newVerification.status || verification.status,
      brandName: newVerification.brand_name || verification.brandName,
      source: newVerification.source || verification.source,
      dosageForm: newVerification.dosage_form || verification.dosageForm,
      strength: newVerification.strength || verification.strength
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/medicines/verify/history
export const getVerificationHistory = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { data: verifications, error } = await supabase
      .from('medicine_verifications')
      .select('*')
      .eq('patient_id', patientId)
      .order('verification_date', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const formatted = verifications.map(v => {
      const dateObj = new Date(v.verification_date);
      const formattedDate = dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

      // Determine colors and icons based on status, default to previous logic if status not set
      let color = "#fffbeb";
      let icon = "⚠️";
      if (v.status === 'verified' || (v.verified && !v.status)) {
        color = "#e8f5ee";
        icon = "✅";
      } else if (v.status === 'recalled') {
        color = '#fee2e2';
        icon = '🚨';
      } else if (v.status === 'expired') {
        color = '#ffedd5';
        icon = '⏳';
      } else if (v.status === 'warning' || !v.verified) {
        color = "#fffbeb";
        icon = "⚠️";
      }

      return {
        id: v.id,
        name: v.name,
        mfr: v.manufacturer || 'Unknown',
        expiry: v.expiry || '—',
        batch: v.batch,
        verified: v.verified,
        status: v.status || (v.verified ? 'verified' : 'warning'),
        date: formattedDate,
        icon,
        color,
        brandName: v.brand_name,
        source: v.source,
        dosageForm: v.dosage_form,
        strength: v.strength
      };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/medicines
export const addMedication = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { name, purpose, frequency, icon, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Medication name is required' });
    }

    const { data: newMed, error } = await supabase
      .from('medications')
      .insert({
        patient_id: patientId,
        name,
        purpose: purpose || 'Medication',
        frequency: frequency || 'Once daily',
        icon: icon || '💊',
        color: color || '#e8f5ee'
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({
      id: newMed.id,
      name: newMed.name,
      purpose: newMed.purpose,
      freq: newMed.frequency,
      icon: newMed.icon,
      color: newMed.color
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/medicines/:id
export const removeMedication = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('medications')
      .delete()
      .eq('id', id)
      .eq('patient_id', req.user.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Medication removed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
