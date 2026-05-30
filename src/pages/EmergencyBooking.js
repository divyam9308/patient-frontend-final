import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import {
  getCities,
  getDepartmentsByCity,
  getTriageRequest,
  createEmergencyRequest,
  getDelhiEmergencyLocalities,
  getEmergencyHospitalAvailability,
} from "../utils/api.js";
import "./EmergencyBooking.css";

function getEmergencyTimeOptions() {
  const now = new Date();
  const max = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  const options = [];
  const first = new Date(now);
  first.setMinutes(Math.ceil(first.getMinutes() / 15) * 15, 0, 0);

  for (let slot = first; slot <= max; slot = new Date(slot.getTime() + 15 * 60 * 1000)) {
    const label = slot.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const minutesAway = Math.max(0, Math.round((slot.getTime() - now.getTime()) / 60000));
    options.push({
      value: slot.toISOString(),
      label: minutesAway <= 5 ? `${label} (now)` : `${label} (${minutesAway} min)`,
    });
  }

  return options;
}

function formatLocality(locality) {
  return locality
    .split(" ")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

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
  const [localities, setLocalities] = useState([]);
  const [hospitalAvailability, setHospitalAvailability] = useState([]);

  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDept, setSelectedDept] = useState(routeDepartmentId);
  const [selectedHospital, setSelectedHospital] = useState("");
  const [selectedLocality, setSelectedLocality] = useState("");
  const [selectedArrivalTime, setSelectedArrivalTime] = useState("");
  const [patientLocation, setPatientLocation] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [ambulanceRequested, setAmbulanceRequested] = useState(false);
  const [pickupLocation, setPickupLocation] = useState("");

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const timeOptions = useMemo(() => getEmergencyTimeOptions(), []);
  const selectedHospitalDetails = hospitalAvailability.find(h => h.id === selectedHospital);
  const selectedArrivalLabel = timeOptions.find(option => option.value === selectedArrivalTime)?.label || "";
  const selectedLocationLabel = selectedLocality ? formatLocality(selectedLocality) : "";
  const estimatedDepartmentName =
    departments.find(dept => dept.id === selectedDept)?.name
    || triage?.recommended_department?.name
    || "Estimating from symptoms";

  useEffect(() => {
    if (!triageId) {
      navigate("/symptom-analyser", { replace: true });
      return;
    }

    setPageLoading(true);
    Promise.all([getTriageRequest(triageId), getCities(), getDelhiEmergencyLocalities()])
      .then(([triageData, cityData, localityData]) => {
        if (triageData.severity_result !== "emergency") {
          const mode = triageData.severity_result === "priority" ? "priority" : "regular";
          const dept = triageData.recommended_department_id ? `&dept=${triageData.recommended_department_id}` : "";
          navigate(`/appointments?mode=${mode}&triage_id=${triageId}${dept}`, { replace: true });
          return;
        }

        setTriage(triageData);
        setCities(cityData);
        setLocalities(Array.isArray(localityData) ? localityData : []);
        if (cityData.length === 1) {
          setSelectedCity(cityData[0].id);
        }
        setSelectedDept(routeDepartmentId || triageData.recommended_department_id || "");
      })
      .catch(err => setError(err.message || "Unable to load emergency booking details"))
      .finally(() => setPageLoading(false));
  }, [navigate, routeDepartmentId, triageId]);

  useEffect(() => {
    setDepartments([]);
    setSelectedHospital("");
    if (!selectedCity) return;

    getDepartmentsByCity(selectedCity)
      .then(deptData => {
        setDepartments(deptData);
        setSelectedDept(current => {
          if (current) return current;

          const recommended = triage?.recommended_department_id;
          if (recommended && deptData.some(dept => dept.id === recommended)) {
            return recommended;
          }

          const fallback = deptData.find(dept => dept.name === "Emergency Medicine")
            || deptData.find(dept => dept.name === "General Medicine")
            || deptData[0];
          return fallback?.id || "";
        });
      })
      .catch(err => setError(err.message || "Unable to load departments"));
  }, [selectedCity, triage?.recommended_department_id]);

  useEffect(() => {
    setSelectedHospital("");
    setHospitalAvailability([]);
    if (!selectedCity || !selectedDept || !selectedLocality) return;

    setAvailabilityLoading(true);
    getEmergencyHospitalAvailability({
      cityId: selectedCity,
      departmentId: selectedDept,
      locality: selectedLocality,
    })
      .then(result => setHospitalAvailability(result.hospitals || []))
      .catch(err => setError(err.message || "Unable to load emergency bed availability"))
      .finally(() => setAvailabilityLoading(false));
  }, [selectedCity, selectedDept, selectedLocality]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedCity || !selectedDept || !selectedLocality || !selectedArrivalTime || !patientPhone) {
      setError("Please fill all required emergency details.");
      return;
    }

    if (!selectedHospital) {
      setError("Please select a hospital from the availability table.");
      return;
    }

    setLoading(true);
    try {
      const result = await createEmergencyRequest({
        triage_id: triageId,
        city_id: selectedCity,
        department_id: selectedDept,
        hospital_id: selectedHospital,
        patient_location: [selectedLocality, patientLocation].filter(Boolean).join(" - "),
        patient_phone: patientPhone,
        requested_arrival_time: selectedArrivalTime,
        ambulance_requested: ambulanceRequested,
        pickup_location: ambulanceRequested ? (pickupLocation || patientLocation || selectedLocality) : null,
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
                  <label>Estimated Department</label>
                  <div className="eb-readonly-field">
                    {estimatedDepartmentName}
                  </div>
                </div>
              </div>

              <div className="eb-row">
                <div className="eb-group">
                  <label>Current Area in Delhi *</label>
                  <select
                    value={selectedLocality}
                    onChange={e => setSelectedLocality(e.target.value)}
                    required
                    disabled={!selectedCity || !selectedDept}
                  >
                    <option value="">Choose area</option>
                    {localities.map(locality => (
                      <option key={locality} value={locality}>
                        {formatLocality(locality)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="eb-group">
                  <label>Emergency Time *</label>
                  <select
                    value={selectedArrivalTime}
                    onChange={e => setSelectedArrivalTime(e.target.value)}
                    required
                  >
                    <option value="">Choose time within 4 hours</option>
                    {timeOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="eb-row">
                <div className="eb-group">
                  <label>Landmark / Full Address</label>
                  <input
                    type="text"
                    value={patientLocation}
                    onChange={e => setPatientLocation(e.target.value)}
                    placeholder="House, block, or nearby landmark"
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

              {(selectedLocality || selectedArrivalTime) && (
                <div className="eb-selection-summary">
                  <div>
                    <span>Selected location</span>
                    <strong>{selectedLocationLabel || "Choose location"}</strong>
                  </div>
                  <div>
                    <span>Emergency appointment time</span>
                    <strong>{selectedArrivalLabel || "Choose time"}</strong>
                  </div>
                </div>
              )}

              <div className="eb-hospital-panel">
                <div className="eb-panel-header">
                  <div>
                    <h3>Nearby Emergency Spaces</h3>
                    <p>App-reserved beds and ambulances reduce only when patients book through this app.</p>
                  </div>
                  {availabilityLoading && <span className="eb-loading-pill">Checking...</span>}
                </div>

                {!selectedLocality ? (
                  <div className="eb-table-empty">Choose your Delhi area above to see nearby hospitals.</div>
                ) : hospitalAvailability.length === 0 && !availabilityLoading ? (
                  <div className="eb-table-empty">No hospitals found for this department and area.</div>
                ) : (
                  <div className="eb-table-wrap">
                    <table className="eb-hospital-table">
                      <thead>
                        <tr>
                          <th>Hospital</th>
                          <th>Proximity</th>
                          <th>App Beds</th>
                          <th>Total Beds</th>
                          <th>Other Bookings</th>
                          <th>Ambulances</th>
                          <th>Contact</th>
                          <th>Response</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {hospitalAvailability.map(hospital => (
                          <tr key={hospital.id} className={selectedHospital === hospital.id ? "eb-row-selected" : ""}>
                            <td>
                              <strong>{hospital.name}</strong>
                              <span>{hospital.address || "Delhi"}</span>
                              {hospital.data_source_url && (
                                <a href={hospital.data_source_url} target="_blank" rel="noreferrer">Source</a>
                              )}
                            </td>
                            <td>{hospital.proximity_label}</td>
                            <td>
                              <span className={hospital.available_emergency_spaces > 0 ? "eb-bed-count" : "eb-bed-count eb-bed-zero"}>
                                {hospital.available_emergency_spaces}
                              </span>
                              <small>{hospital.occupied_emergency_spaces} used of {hospital.app_reserved_beds} reserved</small>
                            </td>
                            <td>
                              <strong>{hospital.total_bed_capacity || "NA"}</strong>
                              <small>published total</small>
                            </td>
                            <td>
                              <strong>{hospital.occupied_emergency_spaces}</strong>
                              <small>{hospital.other_booked_appointments} other appointments</small>
                            </td>
                            <td>
                              <strong>{hospital.available_ambulances ?? "Call"}</strong>
                              <small>
                                {hospital.app_reserved_ambulances === null
                                  ? "fleet count not public"
                                  : `${hospital.active_ambulance_requests} used of ${hospital.app_reserved_ambulances} app reserved`}
                              </small>
                              <small>
                                {hospital.total_ambulance_fleet === null
                                  ? "total not public"
                                  : `${hospital.total_ambulance_fleet} total listed`}
                              </small>
                            </td>
                            <td>{hospital.emergency_contact || hospital.phone || "Hospital desk"}</td>
                            <td>{hospital.estimated_response_time}</td>
                            <td>
                              <button
                                type="button"
                                className="eb-table-select"
                                disabled={hospital.available_emergency_spaces <= 0}
                                onClick={() => setSelectedHospital(hospital.id)}
                              >
                                {selectedHospital === hospital.id ? "Selected" : hospital.available_emergency_spaces > 0 ? "Select" : "Full"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {selectedHospitalDetails && (
                <div className="eb-selected-hospital">
                  <div>
                    <strong>{selectedHospitalDetails.name}</strong>
                    <span>{selectedHospitalDetails.address}</span>
                  </div>
                  <div className={selectedHospitalDetails.available_emergency_spaces > 0 ? "eb-space-pill" : "eb-space-pill eb-space-full"}>
                    {selectedHospitalDetails.available_emergency_spaces} of {selectedHospitalDetails.app_reserved_beds} app beds available
                  </div>
                </div>
              )}

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
                      placeholder="Leave blank to use selected area / landmark"
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
