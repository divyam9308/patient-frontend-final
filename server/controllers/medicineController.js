// controllers/medicineController.js
// Controller for MedicineVerification.js page
// Handles medication list management and medicine verification via Supabase

import supabase from '../config/supabaseClient.js';

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
    let verified = false;
    let finalName = name || `Unknown Batch (${code})`;
    let mfr = "Unverified / Fake Source";
    let expiry = "—";
    let color = "#fffbeb";
    let icon = "⚠️";
    let status = "warning";
    let brandName = null;
    let source = "Unknown";
    let dosageForm = null;
    let strength = null;

    // Database lookup
    const { data: batchMatch, error: lookupError } = await supabase
      .from('medicine_batches')
      .select('*')
      .eq('batch_code', code)
      .maybeSingle();

    if (lookupError) {
      return res.status(500).json({ error: lookupError.message });
    }

    if (batchMatch) {
      finalName = batchMatch.medicine_name;
      mfr = batchMatch.manufacturer;
      brandName = batchMatch.brand_name;
      source = batchMatch.source;
      dosageForm = batchMatch.dosage_form;
      strength = batchMatch.strength;

      // Handle Date correctly
      const expDate = new Date(batchMatch.expiry_date);
      const now = new Date();
      expiry = expDate.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
      
      if (batchMatch.verification_status === 'recalled') {
        verified = false;
        status = 'recalled';
        color = '#fee2e2'; // Light red
        icon = '🚨';
      } else if (expDate < now || batchMatch.verification_status === 'expired') {
        verified = false;
        status = 'expired';
        color = '#ffedd5'; // Light orange
        icon = '⏳';
      } else {
        verified = true;
        status = 'verified';
        color = '#e8f5ee'; // Light green
        icon = '✅';
      }
    } else {
      status = 'warning';
      color = '#fffbeb'; // Light yellow
      icon = '⚠️';
      verified = false;
    }

    // Insert verification scan into database
    const { data: newVerification, error } = await supabase
      .from('medicine_verifications')
      .insert({
        patient_id: patientId,
        name: finalName,
        manufacturer: mfr,
        expiry,
        batch: code,
        verified,
        status,
        brand_name: brandName,
        source,
        dosage_form: dosageForm,
        strength
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const dateObj = new Date(newVerification.verification_date);
    const formattedDate = dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    res.status(201).json({
      id: newVerification.id,
      name: newVerification.name,
      mfr: newVerification.manufacturer,
      expiry: newVerification.expiry,
      batch: newVerification.batch,
      verified: newVerification.verified,
      date: formattedDate,
      icon,
      color,
      status: newVerification.status,
      brandName: newVerification.brand_name,
      source: newVerification.source,
      dosageForm: newVerification.dosage_form,
      strength: newVerification.strength
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
