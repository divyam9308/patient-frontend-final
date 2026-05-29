import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { 
  getCities, 
  getDepartmentsByCity, 
  getHospitalsByCityAndDepartment,
  getTriageRequest,
  createEmergencyRequest
} from "../utils/api.js";
import "./EmergencyBooking.css";

export default function EmergencyBooking() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // From triage redirect
  const {
    triage_id: stateTriageId,
    recommended_department_id: stateRecommendedDepartmentId
  } = location.state || {};
  const triageId = stateTriageId || searchParams.get("triage_id");
  const recommendedDepartmentId = stateRecommendedDepartmentId || searchParams.get("dept");

  const [cities, setCities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDept, setSelectedDept] = useState(recommendedDepartmentId || "");
  const [selectedHospital, setSelectedHospital] = useState("");
  
  const [patientLocation, setPatientLocation] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [ambulanceRequested, setAmbulanceRequested] = useState(false);
  const [pickupLocation, setPickupLocation] = useState("");

  const [loading, setLoading] = useState(false);
  const [triageRequest, setTriageRequest] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!triageId) {
      // Must come through triage first for emergency
      navigate('/symptom-analyser');
      return;
    }
    getCities().then(setCities).catch(console.error);
    getTriageRequest(triageId)
      .then(data => {
        if (data.severity_result !== "emergency") {
          const mode = data.severity_result === "priority" ? "priority" : "regular";
          const dept = data.recommended_department_id ? `&dept=${data.recommended_department_id}` : "";
          navigate(`/appointments?mode=${mode}&triage_id=${triageId}${dept}`, { replace: true });
          return;
        }
        setTriageRequest(data);
        if (!recommendedDepartmentId && data.recommended_department_id) {
          setSelectedDept(data.recommended_department_id);
        }
      })
      .catch(err => setError(err.message || "Unable to load triage details"));
  }, [triageId, navigate, recommendedDepartmentId]);

  useEffect(() => {
    setSelectedDept(recommendedDepartmentId || triageRequest?.recommended_department_id || "");
    setDepartments([]);
    if (!selectedCity) return;
    getDepartmentsByCity(selectedCity).then(setDepartments).catch(console.error);
  }, [selectedCity, recommendedDepartmentId, triageRequest]);

  useEffect(() => {
    setSelectedHospital("");
    setHospitals([]);
    if (!selectedCity || !selectedDept) return;
    getHospitalsByCityAndDepartment(selectedCity, selectedDept).then(setHospitals).catch(console.error);
  }, [selectedDept, selectedCity]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await createEmergencyRequest({
        triage_id: triageId,
        city_id: selectedCity,
        department_id: selectedDept,
        hospital_id: selectedHospital,
        patient_location: patientLocation,
        patient_phone: patientPhone,
        ambulance_requested: ambulanceRequested,
        pickup_location: ambulanceRequested ? pickupLocation || patientLocation : null
      });

      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message || "Failed to create emergency request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout activeTab="appointments">
      <div className="eb-container">
        
        {success ? (
          <div className="eb-success-card">
            <div className="eb-success-icon">🚨</div>
            <h2 className="eb-success-title">Emergency Alert Sent!</h2>
            <p className="eb-success-msg">
              Your request has been broadcasted to all available doctors at the selected hospital. 
              {ambulanceRequested && " An ambulance request has also been dispatched."}
            </p>
            <p className="eb-success-sub">
              Please stay calm and keep your phone nearby. The hospital staff will contact you immediately.
            </p>
            <button className="eb-btn-primary" onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </button>
          </div>
        ) : (
          <div className="eb-form-card">
            <div className="eb-header">
              <h2>🚨 Emergency Booking</h2>
              <p>An alert will be sent immediately to all available doctors at the hospital.</p>
            </div>

            {error && <div className="eb-error">⚠️ {error}</div>}

            <div className="eb-triage-summary">
              <div className="eb-summary-title">Triage Summary</div>
              <div className="eb-summary-text">
                {triageRequest?.symptoms || "Loading triage symptoms..."}
              </div>
              {triageRequest?.symptom_duration && (
                <div className="eb-summary-meta">Duration: {triageRequest.symptom_duration}</div>
              )}
            </div>

            <div className="eb-safety-warning">
              If this is life-threatening, call emergency services immediately or go to the nearest emergency department.
            </div>

            <form onSubmit={handleSubmit} className="eb-form">
              
              <div className="eb-row">
                <div className="eb-group">
                  <label>Select City *</label>
                  <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} required>
                    <option value="">— Choose a city —</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                
                <div className="eb-group">
                  <label>Department *</label>
                  <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)} required disabled={!selectedCity}>
                    <option value="">— Choose specialty —</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="eb-group">
                <label>Select Hospital *</label>
                <select value={selectedHospital} onChange={e => setSelectedHospital(e.target.value)} required disabled={!selectedDept}>
                  <option value="">— Choose a hospital —</option>
                  {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>

              <div className="eb-row">
                <div className="eb-group">
                  <label>Your Current Location *</label>
                  <input 
                    type="text" 
                    placeholder="E.g., 123 Main St, Appt 4B" 
                    value={patientLocation} 
                    onChange={e => setPatientLocation(e.target.value)} 
                    required 
                  />
                </div>
                <div className="eb-group">
                  <label>Phone Number *</label>
                  <input 
                    type="tel" 
                    placeholder="Enter 10-digit number" 
                    value={patientPhone} 
                    onChange={e => setPatientPhone(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="eb-ambulance-section">
                <label className="eb-checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={ambulanceRequested} 
                    onChange={e => setAmbulanceRequested(e.target.checked)} 
                  />
                  🚑 Request an Ambulance
                </label>

                {ambulanceRequested && (
                  <div className="eb-group" style={{ marginTop: '12px' }}>
                    <label>Pickup Location (If different from current location)</label>
                    <input 
                      type="text" 
                      placeholder="Leave blank to use current location" 
                      value={pickupLocation} 
                      onChange={e => setPickupLocation(e.target.value)} 
                    />
                  </div>
                )}
              </div>

              <div className="eb-actions">
                <button type="button" className="eb-btn-secondary" onClick={() => navigate(-1)}>
                  Cancel
                </button>
                <button type="submit" className="eb-btn-danger" disabled={loading}>
                  {loading ? "Sending Alert..." : "🚨 Broadcast Emergency Alert"}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
