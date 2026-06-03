import supabase from '../config/supabaseClient.js';

const EMERGENCY_KEYWORDS = [
  'chest pain',
  'difficulty breathing',
  'unconscious',
  'loss of consciousness',
  'severe bleeding',
  'bleeding that won',
  'stroke',
  'seizure',
  'convulsion',
  'poisoning',
  'major accident',
  'severe head injury',
  'sudden severe chest tightness',
];

const PRIORITY_KEYWORDS = [
  'high fever',
  'severe pain',
  'infection',
  'pregnancy pain',
  'worsening symptoms',
  'dehydration',
  'uncontrolled vomiting',
  'asthma',
  'fracture',
  'severe swelling',
];

function inferDepartment(symptoms) {
  if (symptoms.includes('chest pain') || symptoms.includes('heart') || symptoms.includes('heartbeat')) {
    return 'Cardiology';
  }
  if (symptoms.includes('breathing') || symptoms.includes('asthma') || symptoms.includes('cough')) {
    return 'General Medicine';
  }
  if (symptoms.includes('fracture') || symptoms.includes('injury') || symptoms.includes('accident') || symptoms.includes('joint')) {
    return 'Orthopedics';
  }
  if (symptoms.includes('child') || symptoms.includes('pediatric')) {
    return 'Pediatrics';
  }
  if (symptoms.includes('skin') || symptoms.includes('rash') || symptoms.includes('allergic')) {
    return 'Dermatology';
  }
  if (symptoms.includes('seizure') || symptoms.includes('stroke') || symptoms.includes('head injury') || symptoms.includes('numbness')) {
    return 'Neurology';
  }
  return 'General Medicine';
}

export const submitTriage = async (req, res) => {
  try {
    const {
      symptoms,
      symptom_duration,
      symptomDuration,
      recommended_city_id,
    } = req.body;

    if (!symptoms) {
      return res.status(400).json({ error: 'Symptoms are required' });
    }

    const symptomText = Array.isArray(symptoms) ? symptoms.join(', ') : String(symptoms);
    const normalized = symptomText.toLowerCase();
    const severity = EMERGENCY_KEYWORDS.some(keyword => normalized.includes(keyword))
      ? 'emergency'
      : PRIORITY_KEYWORDS.some(keyword => normalized.includes(keyword))
        ? 'priority'
        : 'regular';

    const departmentName = inferDepartment(normalized);
    const { data: department } = await supabase
      .from('departments')
      .select('id, name')
      .eq('name', departmentName)
      .maybeSingle();

    const { data, error } = await supabase
      .from('triage_requests')
      .insert({
        patient_id: req.user?.id || null,
        symptoms: symptomText,
        symptom_duration: symptom_duration || symptomDuration || null,
        severity_result: severity,
        recommended_department_id: department?.id || null,
        recommended_city_id: recommended_city_id || null,
      })
      .select(`
        id,
        symptoms,
        symptom_duration,
        severity_result,
        recommended_department_id,
        recommended_city_id,
        created_at
      `)
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      triage_id: data.id,
      severity_result: data.severity_result,
      recommended_department_id: data.recommended_department_id,
      recommended_city_id: data.recommended_city_id,
      symptoms: data.symptoms,
      symptom_duration: data.symptom_duration,
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
        recommended_department:departments(id, name),
        recommended_city:cities(id, name)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Triage request not found' });

    res.json(data);
  } catch (error) {
    console.error('Get triage error:', error);
    res.status(500).json({ error: error.message });
  }
};
