import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import {
  getCities,
  getDepartmentsByCity,
  getHospitalsByCityAndDepartment,
  getTriageRequest,
  createEmergencyRequest,
} from "../utils/api.js";
import "./EmergencyBooking.css";

export default function EmergencyBooking() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const routeState = location.state || {};
  const triageId = routeState.triage_id || searchParams.get("triage_id");
  const routeDepartmentId = routeState.recommended_department_id || searchParams.get("dept") || "";

  const [triage, setTriage] = useState(null);
  const [cities, setCities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [hospitals, setHospitals] = useState([]);

  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDept, setSelectedDept] = useState(routeDepartmentId);
  const [selectedHospital, setSelectedHospital] = useState("");
  const [patientLocation, setPatientLocation] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [ambulanceRequested, setAmbulanceRequested] = useState(false);
  const [pickupLocation, setPickupLocation] = useState("");

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!triageId) {
      navigate("/symptom-analyser", { replace: true });
      return;
    }

    setPageLoading(true);
    Promise.all([getTriageRequest(triageId), getCities()])
      .then(([triageData, cityData]) => {
        if (triageData.severity_result !== "emergency") {
          const mode = triageData.severity_result === "priority" ? "priority" : "regular";
          const dept = triageData.recommended_department_id ? `&dept=${triageData.recommended_department_id}` : "";
          navigate(`/appointments?mode=${mode}&triage_id=${triageId}${dept}`, { replace: true });
          return;
        }

        setTriage(triageData);
        setCities(cityData);
        if (cityData.length === 1) {
          setSelectedCity(cityData[0].id);
        }
        if (!routeDepartmentId && triageData.recommended_department_id) {
          setSelectedDept(triageData.recommended_department_id);
        }
      })
      .catch(err => setError(err.message || "Unable to load emergency booking details"))
      .finally(() => setPageLoading(false));
  }, [navigate, routeDepartmentId, triageId]);

  useEffect(() => {
    setDepartments([]);
    setSelectedHospital("");
    if (!selectedCity) return;

    getDepartmentsByCity(selectedCity)
      .then(setDepartments)
      .catch(err => setError(err.message || "Unable to load departments"));
  }, [selectedCity]);

  useEffect(() => {
    setHospitals([]);
    setSelectedHospital("");
    if (!selectedCity || !selectedDept) return;

    getHospitalsByCityAndDepartment(selectedCity, selectedDept)
      .then(setHospitals)
      .catch(err => setError(err.message || "Unable to load hospitals"));
  }, [selectedCity, selectedDept]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedCity || !selectedDept || !selectedHospital || !patientLocation || !patientPhone) {
      setError("Please fill all required emergency details.");
      return;
    }

    setLoading(true);
    try {
      const result = await createEmergencyRequest({
        triage_id: triageId,
        city_id: selectedCity,
        department_id: selectedDept,
        hospital_id: selectedHospital,
        patient_location: patientLocation,
        patient_phone: patientPhone,
        ambulance_requested: ambulanceRequested,
        pickup_location: ambulanceRequested ? (pickupLocation || patientLocation) : null,
      });
      setSuccess(result);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message || "Failed to send emergency request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout activeTab="appointments">
      <div className="eb-container">
        {success ? (
          <div className="eb-success-card">
            <div className="eb-success-icon">Emergency Alert Sent</div>
            <h2 className="eb-success-title">Waiting for doctor acceptance</h2>
            <p className="eb-success-msg">
              Your emergency request was sent to eligible doctors at the selected hospital.
            </p>
            <p className="eb-success-sub">
              Alerts sent: {success.alerts_sent || 0}
              {success.ambulance_request_id && " - Ambulance requested"}
            </p>
            <button className="eb-btn-primary" onClick={() => navigate("/dashboard")}>
              Return to Dashboard
            </button>
          </div>
        ) : (
          <div className="eb-form-card">
            <div className="eb-header">
              <h2>Emergency Booking</h2>
              <p>An alert will be sent to eligible doctors at the selected hospital.</p>
            </div>

            {error && <div className="eb-error">{error}</div>}

            <div className="eb-triage-summary">
              <div className="eb-summary-title">Symptoms from triage</div>
              <div className="eb-summary-text">
                {pageLoading ? "Loading triage details..." : triage?.symptoms}
              </div>
              {triage?.symptom_duration && (
                <div className="eb-summary-meta">Duration: {triage.symptom_duration}</div>
              )}
            </div>

            <div className="eb-safety-warning">
              If this is life-threatening, call emergency services immediately or go to the nearest emergency department.
            </div>

            <form onSubmit={handleSubmit} className="eb-form">
              <div className="eb-row">
                <div className="eb-group">
                  <label>City *</label>
                  <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} required>
                    <option value="">Choose a city</option>
                    {cities.map(city => (
                      <option key={city.id} value={city.id}>{city.name}</option>
                    ))}
                  </select>
                </div>

                <div className="eb-group">
                  <label>Department *</label>
                  <select
                    value={selectedDept}
                    onChange={e => setSelectedDept(e.target.value)}
                    required
                    disabled={!selectedCity}
                  >
                    <option value="">Choose department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="eb-group">
                <label>Nearest / Preferred Hospital *</label>
                <select
                  value={selectedHospital}
                  onChange={e => setSelectedHospital(e.target.value)}
                  required
                  disabled={!selectedDept}
                >
                  <option value="">Choose hospital</option>
                  {hospitals.map(hospital => (
                    <option key={hospital.id} value={hospital.id}>{hospital.name}</option>
                  ))}
                </select>
              </div>

              <div className="eb-row">
                <div className="eb-group">
                  <label>Current Location *</label>
                  <input
                    type="text"
                    value={patientLocation}
                    onChange={e => setPatientLocation(e.target.value)}
                    placeholder="Current address or landmark"
                    required
                  />
                </div>
                <div className="eb-group">
                  <label>Phone / Contact *</label>
                  <input
                    type="tel"
                    value={patientPhone}
                    onChange={e => setPatientPhone(e.target.value)}
                    placeholder="Phone number"
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
                  Request ambulance
                </label>

                {ambulanceRequested && (
                  <div className="eb-group" style={{ marginTop: 12 }}>
                    <label>Pickup Location</label>
                    <input
                      type="text"
                      value={pickupLocation}
                      onChange={e => setPickupLocation(e.target.value)}
                      placeholder="Leave blank to use current location"
                    />
                  </div>
                )}
              </div>

              <div className="eb-actions">
                <button type="button" className="eb-btn-secondary" onClick={() => navigate(-1)}>
                  Cancel
                </button>
                <button type="submit" className="eb-btn-danger" disabled={loading || pageLoading}>
                  {loading ? "Sending..." : "Send Emergency Alert"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
