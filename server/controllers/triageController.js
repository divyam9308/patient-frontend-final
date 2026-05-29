import { supabase } from '../config/supabaseClient.js';

export const submitTriage = async (req, res) => {
  try {
    const { symptoms, symptomDuration, patientId = null } = req.body;

    if (!symptoms) {
      return res.status(400).json({ error: 'Symptoms are required' });
    }

    const s = symptoms.toLowerCase();
    let severity = 'regular';

    // Emergency check
    const emergencyKeywords = ['chest pain', 'difficulty breathing', 'unconscious', 'severe bleeding', 'stroke', 'seizure', 'poisoning', 'major accident', 'severe head injury'];
    // Priority check
    const priorityKeywords = ['high fever', 'severe pain', 'infection', 'pregnancy pain', 'worsening symptoms', 'dehydration', 'uncontrolled vomiting', 'asthma', 'fracture'];

    if (emergencyKeywords.some(kw => s.includes(kw))) {
      severity = 'emergency';
    } else if (priorityKeywords.some(kw => s.includes(kw))) {
      severity = 'priority';
    }

    // Infer department
    let recommendedDepartmentName = null;
    if (s.includes('chest pain')) recommendedDepartmentName = 'Cardiology';
    else if (s.includes('breathing') || s.includes('asthma')) recommendedDepartmentName = 'General Medicine'; // Or Emergency Medicine
    else if (s.includes('fracture') || s.includes('severe injury') || s.includes('accident')) recommendedDepartmentName = 'Orthopedics';
    else if (s.includes('child') || s.includes('pediatric')) recommendedDepartmentName = 'Pediatrics';
    else if (s.includes('skin') || s.includes('rash')) recommendedDepartmentName = 'Dermatology';
    else if (s.includes('seizure') || s.includes('stroke') || s.includes('head injury')) recommendedDepartmentName = 'Neurology';

    let departmentId = null;
    if (recommendedDepartmentName) {
      const { data: deptData } = await supabase
        .from('departments')
        .select('id')
        .eq('name', recommendedDepartmentName)
        .single();
      
      if (deptData) {
        departmentId = deptData.id;
      }
    }

    const { data: triageReq, error } = await supabase
      .from('triage_requests')
      .insert([{
        patient_id: patientId,
        symptoms,
        symptom_duration: symptomDuration,
        severity_result: severity,
        recommended_department_id: departmentId
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      triage_id: triageReq.id,
      severity_result: triageReq.severity_result,
      recommended_department_id: triageReq.recommended_department_id
    });
  } catch (error) {
    console.error('Submit triage error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getTriageRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('triage_requests')
      .select(`
        *,
        recommended_department:departments(name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Triage request not found' });

    res.json(data);
  } catch (error) {
    console.error('Get triage error:', error);
    res.status(500).json({ error: error.message });
  }
};
