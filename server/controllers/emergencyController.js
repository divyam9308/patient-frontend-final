import supabase from '../config/supabaseClient.js';

const DEFAULT_EMERGENCY_CAPACITY = 8;
const DEFAULT_AMBULANCE_FLEET = 3;

const HOSPITAL_EMERGENCY_CAPACITY = {
  'AIIMS New Delhi': 18,
  'Safdarjung Hospital': 20,
  'Max Super Speciality Hospital': 10,
  'Apollo Hospitals': 12,
  'Fortis Escorts Heart Institute': 8,
};

const HOSPITAL_AMBULANCE_FLEET = {
  'AIIMS New Delhi': 7,
  'Safdarjung Hospital': 8,
  'Max Super Speciality Hospital': 4,
  'Apollo Hospitals': 5,
  'Fortis Escorts Heart Institute': 4,
};

const LOCALITY_HOSPITAL_PRIORITY = {
  kalkaji: ['Fortis Escorts Heart Institute', 'Apollo Hospitals', 'Max Super Speciality Hospital', 'Safdarjung Hospital', 'AIIMS New Delhi'],
  govindpuri: ['Fortis Escorts Heart Institute', 'Apollo Hospitals', 'Max Super Speciality Hospital', 'Safdarjung Hospital', 'AIIMS New Delhi'],
  'greater kailash': ['Fortis Escorts Heart Institute', 'Max Super Speciality Hospital', 'Apollo Hospitals', 'Safdarjung Hospital', 'AIIMS New Delhi'],
  saket: ['Max Super Speciality Hospital', 'AIIMS New Delhi', 'Safdarjung Hospital', 'Apollo Hospitals', 'Fortis Escorts Heart Institute'],
  'malviya nagar': ['Max Super Speciality Hospital', 'AIIMS New Delhi', 'Safdarjung Hospital', 'Fortis Escorts Heart Institute', 'Apollo Hospitals'],
  'sarita vihar': ['Apollo Hospitals', 'Fortis Escorts Heart Institute', 'Max Super Speciality Hospital', 'Safdarjung Hospital', 'AIIMS New Delhi'],
  okhla: ['Fortis Escorts Heart Institute', 'Apollo Hospitals', 'Max Super Speciality Hospital', 'Safdarjung Hospital', 'AIIMS New Delhi'],
  'lajpat nagar': ['Safdarjung Hospital', 'AIIMS New Delhi', 'Fortis Escorts Heart Institute', 'Max Super Speciality Hospital', 'Apollo Hospitals'],
  'south extension': ['AIIMS New Delhi', 'Safdarjung Hospital', 'Max Super Speciality Hospital', 'Fortis Escorts Heart Institute', 'Apollo Hospitals'],
  'hauz khas': ['AIIMS New Delhi', 'Safdarjung Hospital', 'Max Super Speciality Hospital', 'Fortis Escorts Heart Institute', 'Apollo Hospitals'],
  'green park': ['AIIMS New Delhi', 'Safdarjung Hospital', 'Max Super Speciality Hospital', 'Fortis Escorts Heart Institute', 'Apollo Hospitals'],
  'vasant kunj': ['Max Super Speciality Hospital', 'AIIMS New Delhi', 'Safdarjung Hospital', 'Fortis Escorts Heart Institute', 'Apollo Hospitals'],
  default: ['AIIMS New Delhi', 'Safdarjung Hospital', 'Max Super Speciality Hospital', 'Apollo Hospitals', 'Fortis Escorts Heart Institute'],
};

function validateEmergencyArrivalTime(value) {
  if (!value) return null;

  const requested = new Date(value);
  if (Number.isNaN(requested.getTime())) {
    return 'Please choose a valid emergency arrival time';
  }

  const now = new Date();
  const max = new Date(now.getTime() + (4 * 60 * 60 * 1000));
  if (requested < now || requested > max) {
    return 'Emergency appointment time must be from now up to 4 hours ahead';
  }

  return null;
}

function isMissingRequestedTimeColumn(error) {
  return String(error?.message || '').toLowerCase().includes('requested_arrival_time');
}

export const getDelhiLocalities = (req, res) => {
  res.json(Object.keys(LOCALITY_HOSPITAL_PRIORITY).filter(locality => locality !== 'default'));
};

export const getEmergencyHospitalAvailability = async (req, res) => {
  try {
    const { cityId, departmentId, locality = 'default' } = req.query;

    if (!cityId || !departmentId) {
      return res.status(400).json({ error: 'cityId and departmentId are required' });
    }

    const { data: hospitals, error: hospitalError } = await supabase
      .from('hospitals')
      .select(`
        id,
        name,
        address,
        phone,
        website,
        doctor_hospitals!inner (
          id,
          doctors!inner (
            department_id
          )
        )
      `)
      .eq('city_id', cityId)
      .eq('doctor_hospitals.doctors.department_id', departmentId);

    if (hospitalError) throw hospitalError;

    const hospitalIds = [...new Set((hospitals || []).map(h => h.id))];
    const { data: activeRequests, error: requestError } = hospitalIds.length
      ? await supabase
        .from('emergency_requests')
        .select('hospital_id, status, ambulance_requested, ambulance_status, created_at')
        .in('hospital_id', hospitalIds)
        .in('status', ['open', 'accepted'])
      : { data: [], error: null };

    if (requestError) throw requestError;

    const doctorHospitalIds = [
      ...new Set(
        (hospitals || [])
          .flatMap(hospital => hospital.doctor_hospitals || [])
          .map(record => record.id)
          .filter(Boolean)
      ),
    ];

    const { data: bookedAppointments, error: appointmentError } = doctorHospitalIds.length
      ? await supabase
        .from('appointments')
        .select(`
          id,
          patient_id,
          status,
          appointment_date,
          appointment_time,
          doctor_hospital_id,
          doctor_hospitals (
            hospital_id
          )
        `)
        .in('doctor_hospital_id', doctorHospitalIds)
        .in('status', ['pending', 'upcoming', 'accepted'])
      : { data: [], error: null };

    if (appointmentError) throw appointmentError;

    const { data: activeAmbulances, error: ambulanceError } = hospitalIds.length
      ? await supabase
        .from('ambulance_requests')
        .select('destination_hospital_id, status')
        .in('destination_hospital_id', hospitalIds)
        .in('status', ['requested', 'dispatched', 'on_route'])
      : { data: [], error: null };

    if (ambulanceError) throw ambulanceError;

    const activeByHospital = (activeRequests || []).reduce((acc, request) => {
      acc[request.hospital_id] = (acc[request.hospital_id] || 0) + 1;
      return acc;
    }, {});

    const appointmentsByHospital = (bookedAppointments || []).reduce((acc, appointment) => {
      const hospitalId = appointment.doctor_hospitals?.hospital_id;
      if (!hospitalId) return acc;
      acc[hospitalId] = (acc[hospitalId] || 0) + 1;
      return acc;
    }, {});

    const ambulancesBusyByHospital = (activeAmbulances || []).reduce((acc, request) => {
      acc[request.destination_hospital_id] = (acc[request.destination_hospital_id] || 0) + 1;
      return acc;
    }, {});

    const priority = LOCALITY_HOSPITAL_PRIORITY[String(locality).toLowerCase()] || LOCALITY_HOSPITAL_PRIORITY.default;
    const uniqueHospitals = [];
    const seen = new Set();

    for (const hospital of hospitals || []) {
      if (seen.has(hospital.id)) continue;
      seen.add(hospital.id);

      const capacity = HOSPITAL_EMERGENCY_CAPACITY[hospital.name] || DEFAULT_EMERGENCY_CAPACITY;
      const ambulanceFleet = HOSPITAL_AMBULANCE_FLEET[hospital.name] || DEFAULT_AMBULANCE_FLEET;
      const occupied = activeByHospital[hospital.id] || 0;
      const otherBookedAppointments = appointmentsByHospital[hospital.id] || 0;
      const busyAmbulances = ambulancesBusyByHospital[hospital.id] || 0;
      const priorityIndex = priority.findIndex(name => hospital.name.toLowerCase().includes(name.toLowerCase()));

      uniqueHospitals.push({
        id: hospital.id,
        name: hospital.name,
        address: hospital.address,
        phone: hospital.phone,
        website: hospital.website,
        emergency_capacity: capacity,
        occupied_emergency_spaces: occupied,
        available_emergency_spaces: Math.max(capacity - occupied, 0),
        other_booked_appointments: otherBookedAppointments,
        total_emergency_load: occupied + otherBookedAppointments,
        ambulance_fleet: ambulanceFleet,
        active_ambulance_requests: busyAmbulances,
        available_ambulances: Math.max(ambulanceFleet - busyAmbulances, 0),
        emergency_contact: hospital.phone || 'Hospital emergency desk',
        estimated_response_time: priorityIndex === -1
          ? '45-60 min'
          : priorityIndex < 2
            ? '10-20 min'
            : '25-40 min',
        locality_rank: priorityIndex === -1 ? 99 : priorityIndex + 1,
        proximity_label: priorityIndex === -1
          ? 'Available in Delhi'
          : priorityIndex < 2
            ? 'Closest match'
            : 'Nearby option',
      });
    }

    uniqueHospitals.sort((a, b) => {
      if (b.available_emergency_spaces !== a.available_emergency_spaces) {
        const aHasBeds = a.available_emergency_spaces > 0 ? 1 : 0;
        const bHasBeds = b.available_emergency_spaces > 0 ? 1 : 0;
        if (aHasBeds !== bHasBeds) return bHasBeds - aHasBeds;
      }
      return a.locality_rank - b.locality_rank || b.available_emergency_spaces - a.available_emergency_spaces;
    });

    res.json({
      locality,
      hospitals: uniqueHospitals,
    });
  } catch (error) {
    console.error('Get emergency hospital availability error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const createEmergencyRequest = async (req, res) => {
  try {
    const {
      triage_id,
      city_id,
      department_id,
      hospital_id,
      patient_location,
      patient_phone,
      requested_arrival_time,
      ambulance_requested = false,
      pickup_location,
    } = req.body;

    if (!triage_id || !city_id || !department_id || !hospital_id || !patient_location || !patient_phone) {
      return res.status(400).json({
        error: 'triage_id, city_id, department_id, hospital_id, patient_location, and patient_phone are required',
      });
    }

    if (ambulance_requested && !(pickup_location || patient_location)) {
      return res.status(400).json({ error: 'Pickup location is required when ambulance is requested' });
    }

    const arrivalTimeError = validateEmergencyArrivalTime(requested_arrival_time);
    if (arrivalTimeError) {
      return res.status(400).json({ error: arrivalTimeError });
    }

    const { data: triage, error: triageError } = await supabase
      .from('triage_requests')
      .select('id, symptoms, severity_result')
      .eq('id', triage_id)
      .maybeSingle();

    if (triageError) throw triageError;
    if (!triage) return res.status(400).json({ error: 'Invalid triage_id' });
    if (triage.severity_result !== 'emergency') {
      return res.status(400).json({ error: 'Ambulance/emergency booking is available only for emergency triage results' });
    }

    let { data: emergency, error: emergencyError } = await supabase
      .from('emergency_requests')
      .insert({
        patient_id: req.user?.id || null,
        triage_id,
        city_id,
        department_id,
        hospital_id,
        symptoms: triage.symptoms,
        patient_location,
        patient_phone,
        requested_arrival_time: requested_arrival_time || null,
        ambulance_requested: !!ambulance_requested,
        ambulance_status: ambulance_requested ? 'requested' : 'not_requested',
        status: 'open',
      })
      .select()
      .single();

    if (emergencyError && isMissingRequestedTimeColumn(emergencyError)) {
      const fallback = await supabase
        .from('emergency_requests')
        .insert({
          patient_id: req.user?.id || null,
          triage_id,
          city_id,
          department_id,
          hospital_id,
          symptoms: triage.symptoms,
          patient_location,
          patient_phone,
          ambulance_requested: !!ambulance_requested,
          ambulance_status: ambulance_requested ? 'requested' : 'not_requested',
          status: 'open',
        })
        .select()
        .single();

      emergency = fallback.data;
      emergencyError = fallback.error;
    }

    if (emergencyError) throw emergencyError;

    const { data: eligibleDoctors, error: doctorsError } = await supabase
      .from('doctor_hospitals')
      .select('id, doctors!inner(department_id)')
      .eq('hospital_id', hospital_id)
      .eq('doctors.department_id', department_id);

    if (doctorsError) throw doctorsError;

    if (eligibleDoctors?.length) {
      const alerts = eligibleDoctors.map(doctor => ({
        emergency_request_id: emergency.id,
        doctor_hospital_id: doctor.id,
        status: 'sent',
      }));

      const { error: alertError } = await supabase
        .from('emergency_alerts')
        .insert(alerts);

      if (alertError) throw alertError;
    }

    let ambulanceRequest = null;
    if (ambulance_requested) {
      const { data: ambulance, error: ambulanceError } = await supabase
        .from('ambulance_requests')
        .insert({
          emergency_request_id: emergency.id,
          patient_id: req.user?.id || null,
          pickup_location: pickup_location || patient_location,
          destination_hospital_id: hospital_id,
          patient_phone,
          status: 'requested',
        })
        .select()
        .single();

      if (ambulanceError) throw ambulanceError;
      ambulanceRequest = ambulance;
    }

    res.status(201).json({
      success: true,
      emergency_request_id: emergency.id,
      status: emergency.status,
      requested_arrival_time: requested_arrival_time || null,
      alerts_sent: eligibleDoctors?.length || 0,
      ambulance_request_id: ambulanceRequest?.id || null,
      ambulance_status: emergency.ambulance_status,
    });
  } catch (error) {
    console.error('Create emergency request error:', error);
    res.status(500).json({ error: error.message });
  }
};
