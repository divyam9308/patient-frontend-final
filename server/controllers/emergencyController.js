import supabase from '../config/supabaseClient.js';
import {
  DELHI_EMERGENCY_HOSPITALS,
  LOCALITY_HOSPITAL_PRIORITY,
} from '../data/delhiEmergencyDirectory.js';

const DEFAULT_EMERGENCY_CAPACITY = 0;
const EMERGENCY_CLEAR_AFTER_MS = 60 * 60 * 1000;

const DIRECTORY_BY_NAME = DELHI_EMERGENCY_HOSPITALS.flatMap(hospital => [
  hospital.name,
  ...(hospital.aliases || []),
].map(name => [name.toLowerCase(), hospital]));

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

function isMissingClearedAtColumn(error) {
  return String(error?.message || '').toLowerCase().includes('cleared_at');
}

function isMissingHospitalResourceColumn(error) {
  const message = String(error?.message || '').toLowerCase();
  return [
    'emergency_phone',
    'emergency_bed_capacity',
    'ambulance_fleet',
    'app_reserved_beds',
    'app_reserved_ambulances',
    'data_source_url',
    'data_verified_at',
  ].some(column => message.includes(column));
}

function getDirectoryRecord(hospitalName) {
  const normalized = String(hospitalName || '').toLowerCase();
  const exact = DIRECTORY_BY_NAME.find(([name]) => name === normalized);
  if (exact) return exact[1];

  const partial = DIRECTORY_BY_NAME.find(([name]) => normalized.includes(name) || name.includes(normalized));
  return partial?.[1] || null;
}

function toNumberOrNull(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getDefaultAppReserve(total) {
  const numericTotal = toNumberOrNull(total);
  if (!numericTotal || numericTotal <= 0) return 0;
  return Math.max(1, Math.round(numericTotal * 0.4));
}

async function getHospitalsForAvailability(cityId, departmentId) {
  const resourceSelect = `
    id,
    name,
    address,
    phone,
    website,
    emergency_phone,
    emergency_bed_capacity,
    ambulance_fleet,
    app_reserved_beds,
    app_reserved_ambulances,
    data_source_url,
    data_verified_at,
    doctor_hospitals!inner (
      id,
      doctors!inner (
        department_id
      )
    )
  `;

  let { data, error } = await supabase
    .from('hospitals')
    .select(resourceSelect)
    .eq('city_id', cityId)
    .eq('doctor_hospitals.doctors.department_id', departmentId);

  if (error && isMissingHospitalResourceColumn(error)) {
    const fallback = await supabase
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

    data = fallback.data;
    error = fallback.error;
  }

  if (error) throw error;
  return data || [];
}

export const expireOldEmergencyRequests = async () => {
  try {
    const cutoff = new Date(Date.now() - EMERGENCY_CLEAR_AFTER_MS).toISOString();
    const { data: staleRequests, error: staleError } = await supabase
      .from('emergency_requests')
      .select('id')
      .in('status', ['open', 'accepted'])
      .or(`requested_arrival_time.lte.${cutoff},and(requested_arrival_time.is.null,created_at.lte.${cutoff})`);

    if (staleError) {
      if (isMissingRequestedTimeColumn(staleError)) return { expired: 0, skipped: true };
      throw staleError;
    }

    const staleIds = (staleRequests || []).map(request => request.id);
    if (!staleIds.length) return { expired: 0 };

    let { error: requestUpdateError } = await supabase
      .from('emergency_requests')
      .update({
        status: 'expired',
        ambulance_status: 'expired',
        cleared_at: new Date().toISOString(),
      })
      .in('id', staleIds);

    if (requestUpdateError && isMissingClearedAtColumn(requestUpdateError)) {
      const fallback = await supabase
        .from('emergency_requests')
        .update({
          status: 'expired',
          ambulance_status: 'expired',
        })
        .in('id', staleIds);
      requestUpdateError = fallback.error;
    }

    if (requestUpdateError) throw requestUpdateError;

    await supabase
      .from('emergency_alerts')
      .update({ status: 'expired', responded_at: new Date().toISOString() })
      .in('emergency_request_id', staleIds)
      .in('status', ['sent', 'accepted']);

    await supabase
      .from('ambulance_requests')
      .update({ status: 'expired' })
      .in('emergency_request_id', staleIds)
      .in('status', ['requested', 'dispatched', 'on_route']);

    return { expired: staleIds.length };
  } catch (error) {
    console.error('Expire old emergency requests error:', error);
    return { expired: 0, error: error.message };
  }
};

export const getDelhiLocalities = (req, res) => {
  res.json(Object.keys(LOCALITY_HOSPITAL_PRIORITY).filter(locality => locality !== 'default'));
};

export const getEmergencyHospitalAvailability = async (req, res) => {
  try {
    await expireOldEmergencyRequests();

    const { cityId, departmentId, locality = 'default' } = req.query;

    if (!cityId || !departmentId) {
      return res.status(400).json({ error: 'cityId and departmentId are required' });
    }

    const hospitals = await getHospitalsForAvailability(cityId, departmentId);

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

      const directoryRecord = getDirectoryRecord(hospital.name);
      const totalBeds = toNumberOrNull(hospital.emergency_bed_capacity)
        || directoryRecord?.publishedBedCapacity
        || DEFAULT_EMERGENCY_CAPACITY;
      const totalAmbulances = toNumberOrNull(hospital.ambulance_fleet)
        || toNumberOrNull(directoryRecord?.ambulanceFleet);
      const appReservedBeds = toNumberOrNull(hospital.app_reserved_beds)
        || directoryRecord?.appReservedBeds
        || getDefaultAppReserve(totalBeds);
      const appReservedAmbulances = toNumberOrNull(hospital.app_reserved_ambulances)
        || directoryRecord?.appReservedAmbulances
        || (totalAmbulances === null ? null : getDefaultAppReserve(totalAmbulances));
      const occupied = activeByHospital[hospital.id] || 0;
      const otherBookedAppointments = appointmentsByHospital[hospital.id] || 0;
      const busyAmbulances = ambulancesBusyByHospital[hospital.id] || 0;
      const priorityIndex = priority.findIndex(name => hospital.name.toLowerCase().includes(name.toLowerCase()));

      uniqueHospitals.push({
        id: hospital.id,
        name: hospital.name,
        address: hospital.address || directoryRecord?.address,
        phone: hospital.phone || directoryRecord?.phone,
        website: hospital.website || directoryRecord?.website,
        emergency_capacity: appReservedBeds,
        total_bed_capacity: totalBeds,
        app_reserved_beds: appReservedBeds,
        occupied_emergency_spaces: occupied,
        available_emergency_spaces: Math.max(appReservedBeds - occupied, 0),
        other_booked_appointments: otherBookedAppointments,
        total_emergency_load: occupied + otherBookedAppointments,
        ambulance_fleet: appReservedAmbulances,
        total_ambulance_fleet: totalAmbulances,
        app_reserved_ambulances: appReservedAmbulances,
        active_ambulance_requests: busyAmbulances,
        available_ambulances: appReservedAmbulances === null ? null : Math.max(appReservedAmbulances - busyAmbulances, 0),
        emergency_contact: hospital.emergency_phone || directoryRecord?.emergencyPhone || hospital.phone || 'Hospital emergency desk',
        data_source_url: hospital.data_source_url || directoryRecord?.sourceUrl || hospital.website,
        data_source_note: directoryRecord?.sourceNote || 'Hospital details are from the configured hospital directory.',
        data_verified_at: hospital.data_verified_at || null,
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
    await expireOldEmergencyRequests();

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

    if (req.user?.id) {
      const { data: existing } = await supabase
        .from('emergency_requests')
        .select('id')
        .eq('patient_id', req.user.id)
        .in('status', ['open', 'accepted'])
        .limit(1);
      
      if (existing && existing.length > 0) {
        return res.status(400).json({ error: 'You already have a booked emergency appointment that is currently active.' });
      }
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
