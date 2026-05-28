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

    // Matching mock rules from frontend
    if (code.startsWith("MP") || code.startsWith("AT") || code.startsWith("AM") || code === "PA7788D" || code === "AM3344X") {
      verified = true;
      color = "#e8f5ee";
      icon = "💊";
      if (code.startsWith("MP")) {
        finalName = "Metformin 500mg";
        mfr = "Sun Pharma Ltd";
        expiry = "Nov 2026";
      } else if (code.startsWith("AT")) {
        finalName = "Atorvastatin 20mg";
        mfr = "Cipla Ltd";
        expiry = "Aug 2026";
      } else if (code.startsWith("AM") && code !== "AM3344X") {
        finalName = "Amlodipine 5mg";
        mfr = "Dr. Reddy's Laboratories";
        expiry = "Mar 2027";
      } else if (code === "PA7788D") {
        finalName = "Paracetamol 500mg";
        mfr = "GSK Consumer Healthcare";
        expiry = "Dec 2027";
      } else if (code === "AM3344X") {
        finalName = "Amoxicillin 250mg";
        mfr = "Abbott Laboratories";
        expiry = "Sep 2026";
      }
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
        verified
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
      color
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

      const isFake = !v.verified;
      const color = isFake ? "#fffbeb" : "#e8f5ee";
      const icon = isFake ? "⚠️" : "💊";

      return {
        id: v.id,
        name: v.name,
        mfr: v.manufacturer || 'Unknown',
        expiry: v.expiry || '—',
        batch: v.batch,
        verified: v.verified,
        date: formattedDate,
        icon,
        color
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
