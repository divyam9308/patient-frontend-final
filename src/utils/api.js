// src/utils/api.js
// API helper utility to perform fetch requests to the Express backend

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : (process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`);

const getHeaders = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (
      response.status === 401 ||
      response.status === 403 ||
      data.error === 'Patient not found'
    ) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
};

export const api = {
  get: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  post: async (endpoint, body) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  put: async (endpoint, body) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  delete: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  patch: async (endpoint, body) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },
};

// ── Appointment Helper Functions ─────────────────────────

export const getCities = () => api.get('/appointments/cities');

export const getDepartmentsByCity = (cityId) => 
  api.get(`/appointments/departments?cityId=${cityId}`);

export const getHospitalsByCityAndDepartment = (cityId, departmentId) => 
  api.get(`/appointments/hospitals?cityId=${cityId}&departmentId=${departmentId}`);

export const getDoctorsByHospitalAndDepartment = (hospitalId, departmentId) => 
  api.get(`/appointments/doctors?hospitalId=${hospitalId}&departmentId=${departmentId}`);

export const getDoctorSchedules = (doctorHospitalId) => 
  api.get(`/appointments/doctors/${doctorHospitalId}/schedules`);

export const createAppointment = (payload) => 
  api.post('/appointments', payload);

// Triage helper functions

export const submitTriage = (payload) =>
  api.post('/triage', payload);

export const getTriageRequest = (triageId) =>
  api.get(`/triage/${triageId}`);

// Emergency helper functions

export const createEmergencyRequest = (payload) =>
  api.post('/emergency-requests', payload);

// Doctor alert helper functions

export const getDoctorEmergencyAlerts = (doctorHospitalId) =>
  api.get(`/doctor/emergency-alerts${doctorHospitalId ? `?doctorHospitalId=${doctorHospitalId}` : ''}`);

export const acceptEmergencyAlert = (requestId, payload) =>
  api.post(`/doctor/emergency-alerts/${requestId}/accept`, payload);

export const declineEmergencyAlert = (requestId, payload) =>
  api.post(`/doctor/emergency-alerts/${requestId}/decline`, payload);

// Ambulance helper functions

export const createAmbulanceRequest = (payload) =>
  api.post('/ambulance-requests', payload);

export const getAmbulanceRequest = (id) =>
  api.get(`/ambulance-requests/${id}`);

export const updateAmbulanceRequestStatus = (id, status) =>
  api.patch(`/ambulance-requests/${id}/status`, { status });
