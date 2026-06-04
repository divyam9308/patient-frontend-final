import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import {
  api,
  getCities,
  getDepartmentsByCity,
  getHospitalsByCityAndDepartment,
  getDoctorsByHospitalAndDepartment,
  getDoctorSchedules,
  createAppointment,
  getTriageRequest,
} from "../utils/api.js";
import { notifyAppointmentBooked, notifyAppointmentUpdated, syncAppointmentReminders } from "../utils/notifications.js";
import "./Dashboard.css";
import "./Appointment.css";

const STATUS_STYLES = {
  upcoming: { label: "Upcoming", color: "#2d6a3f", bg: "#eaf4ec", border: "#c8e6c9" },
  completed: { label: "Completed", color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  cancelled: { label: "Cancelled", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  missed: { label: "Missed", color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
};

const BOOKING_COPY = {
  follow_up: {
    title: "Book Follow-up Appointment",
    subtitle: "Choose a city, department, hospital, doctor, date, and time.",
    note: "Recommended: book follow-up visits more than 7 days from today when possible.",
    badge: "Follow-up",
  },
  regular: {
    title: "Book Regular Appointment",
    subtitle: "This booking started from your symptom triage.",
    note: "Recommended: regular visits are usually best scheduled 1-2 days from now.",
    badge: "Regular",
  },
  priority: {
    title: "Book Priority Appointment",
    subtitle: "This booking started from your symptom triage.",
    note: "Recommended: priority visits are usually best scheduled today or within 24 hours.",
    badge: "Priority",
  },
};

const TYPE_BADGES = {
  follow_up: { label: "FOLLOW-UP", bg: "#eaf4ec", color: "#2d6a3f", border: "#c8e6c9" },
  regular: { label: "REGULAR", bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  priority: { label: "PRIORITY", bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
  emergency: { label: "EMERGENCY", bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
};

function fmtSlot(slot) {
  const [h, m] = slot.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function cleanMode(mode) {
  return ["regular", "priority"].includes(mode) ? mode : "follow_up";
}

export default function Appointment() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const incomingMode = cleanMode(location.state?.mode || searchParams.get("mode"));
  const incomingTriageId = location.state?.triage_id || searchParams.get("triage_id") || "";
  const incomingDeptId = location.state?.recommended_department_id || searchParams.get("dept") || "";

  const [filter, setFilter] = useState("all");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const [showBooking, setShowBooking] = useState(false);
  const [bookingMode, setBookingMode] = useState("follow_up");
  const [activeTriageId, setActiveTriageId] = useState("");
  const [triage, setTriage] = useState(null);
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState("");

  const [cities, setCities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedHospital, setSelectedHospital] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [reason, setReason] = useState("");
  const [preferredDeptId, setPreferredDeptId] = useState("");

  const [loadingOptions, setLoadingOptions] = useState({
    cities: false,
    depts: false,
    hospitals: false,
    doctors: false,
    schedules: false,
  });

  const selectedDoctor = doctors.find(d => d.doctor_hospital_id === selectedDoctorId);
  const bookingCopy = BOOKING_COPY[bookingMode] || BOOKING_COPY.follow_up;

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/appointments");
      const list = Array.isArray(data) ? data : [];
      setAppointments(list);
      syncAppointmentReminders(list);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCities = useCallback(async () => {
    setLoadingOptions(p => ({ ...p, cities: true }));
    try {
      const data = await getCities();
      setCities(Array.isArray(data) ? data : []);
      if (data?.length === 1) {
        setSelectedCity(prev => prev || data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOptions(p => ({ ...p, cities: false }));
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    loadCities();
  }, [fetchAppointments, loadCities]);

  useEffect(() => {
    if (!appointments.length) return undefined;
    const timer = window.setInterval(() => syncAppointmentReminders(appointments), 60000);
    return () => window.clearInterval(timer);
  }, [appointments]);

  useEffect(() => {
    if (incomingMode === "follow_up") return;

    setSelectedCity(cities.length === 1 ? cities[0].id : "");
    setSelectedDept("");
    setSelectedHospital("");
    setSelectedDoctorId("");
    setSelectedDate("");
    setSelectedTime("");
    setReason("");
    setBookError("");
    setBookingMode(incomingMode);
    setActiveTriageId(incomingTriageId);
    setPreferredDeptId(incomingDeptId);
    setShowBooking(true);
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (!incomingTriageId) {
      setBookError("A triage request is required for regular and priority booking.");
      return;
    }

    getTriageRequest(incomingTriageId)
      .then(data => {
        if (data.severity_result === "emergency") {
          navigate(`/emergency-booking?triage_id=${incomingTriageId}`, { replace: true });
          return;
        }

        const modeFromTriage = data.severity_result === "priority" ? "priority" : "regular";
        setBookingMode(modeFromTriage);
        setTriage(data);
        setActiveTriageId(data.id);
        if (data.recommended_city_id) setSelectedCity(data.recommended_city_id);
        if (data.recommended_department_id) setPreferredDeptId(data.recommended_department_id);
      })
      .catch(err => setBookError(err.message || "Unable to load triage request"));
  }, [cities, incomingDeptId, incomingMode, incomingTriageId, navigate]);

  useEffect(() => {
    setSelectedDept("");
    setSelectedHospital("");
    setSelectedDoctorId("");
    setSelectedDate("");
    setSelectedTime("");
    setDepartments([]);
    setHospitals([]);
    setDoctors([]);
    setSchedules([]);

    if (!selectedCity) return;

    setLoadingOptions(p => ({ ...p, depts: true }));
    getDepartmentsByCity(selectedCity)
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setDepartments(list);
        if (preferredDeptId && list.some(d => d.id === preferredDeptId)) {
          setSelectedDept(preferredDeptId);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingOptions(p => ({ ...p, depts: false })));
  }, [selectedCity, preferredDeptId]);

  useEffect(() => {
    setSelectedHospital("");
    setSelectedDoctorId("");
    setSelectedDate("");
    setSelectedTime("");
    setHospitals([]);
    setDoctors([]);
    setSchedules([]);

    if (!selectedCity || !selectedDept) return;

    setLoadingOptions(p => ({ ...p, hospitals: true }));
    getHospitalsByCityAndDepartment(selectedCity, selectedDept)
      .then(data => setHospitals(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoadingOptions(p => ({ ...p, hospitals: false })));
  }, [selectedDept, selectedCity]);

  useEffect(() => {
    setSelectedDoctorId("");
    setSelectedDate("");
    setSelectedTime("");
    setDoctors([]);
    setSchedules([]);

    if (!selectedHospital || !selectedDept) return;

    setLoadingOptions(p => ({ ...p, doctors: true }));
    getDoctorsByHospitalAndDepartment(selectedHospital, selectedDept)
      .then(data => setDoctors(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoadingOptions(p => ({ ...p, doctors: false })));
  }, [selectedHospital, selectedDept]);

  useEffect(() => {
    setSelectedDate("");
    setSelectedTime("");
    setSchedules([]);

    if (!selectedDoctorId) return;

    setLoadingOptions(p => ({ ...p, schedules: true }));
    getDoctorSchedules(selectedDoctorId)
      .then(data => setSchedules(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoadingOptions(p => ({ ...p, schedules: false })));
  }, [selectedDoctorId]);

  const availableSlots = useMemo(() => {
    if (!selectedDate || !schedules.length) return [];

    const dayOfWeek = new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-US", { weekday: "long" });
    const daySchedules = schedules.filter(s => s.day_of_week === dayOfWeek);
    const slots = [];

    daySchedules.forEach(schedule => {
      const startTime = String(schedule.start_time).substring(0, 8);
      const endTime = String(schedule.end_time).substring(0, 8);
      const current = new Date(`${selectedDate}T${startTime}`);
      const end = new Date(`${selectedDate}T${endTime}`);

      while (current < end) {
        slots.push(current.toTimeString().substring(0, 5) + ":00");
        current.setMinutes(current.getMinutes() + 30);
      }
    });

    if (selectedDate === todayStr()) {
      const nowStr = new Date().toTimeString().substring(0, 8);
      return slots.filter(slot => slot > nowStr).sort();
    }

    return slots.sort();
  }, [selectedDate, schedules]);

  const openFollowUpModal = () => {
    resetForm();
    setBookingMode("follow_up");
    setActiveTriageId("");
    setTriage(null);
    setShowBooking(true);
  };

  const closeModal = () => {
    setShowBooking(false);
    resetForm();
  };

  function resetForm() {
    setSelectedCity(cities.length === 1 ? cities[0].id : "");
    setSelectedDept("");
    setSelectedHospital("");
    setSelectedDoctorId("");
    setSelectedDate("");
    setSelectedTime("");
    setReason("");
    setBookError("");
    setPreferredDeptId("");
  }

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    setCancellingId(id);
    try {
      await api.delete(`/appointments/${id}`);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: "cancelled" } : a));
      notifyAppointmentUpdated({
        title: "Appointment cancelled",
        message: "Your appointment was cancelled successfully.",
      });
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setCancellingId(null);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const updated = await api.put(`/appointments/${id}`, { status: newStatus });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: updated.status } : a));
      notifyAppointmentUpdated({
        title: "Appointment status updated",
        message: `Appointment marked as ${String(newStatus).replace("_", " ")}.`,
      });
    } catch (err) {
      alert("Error updating status: " + err.message);
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setBookError("");

    if (!selectedCity || !selectedDept || !selectedHospital || !selectedDoctorId || !selectedDate || !selectedTime) {
      setBookError("Please complete city, department, hospital, doctor, date, and time.");
      return;
    }

    if ((bookingMode === "regular" || bookingMode === "priority") && !activeTriageId) {
      setBookError("This booking mode needs a completed symptom triage first.");
      return;
    }

    setBooking(true);
    try {
      await createAppointment({
        doctor_hospital_id: selectedDoctorId,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        appointment_type: bookingMode,
        triage_id: activeTriageId || null,
        reason: reason || triage?.symptoms || null,
      });
      notifyAppointmentBooked({
        date: selectedDate,
        time: selectedTime,
        doctor: selectedDoctor?.name,
        type: bookingMode,
      });
      await fetchAppointments();
      closeModal();
    } catch (err) {
      setBookError(err.message || "Failed to book appointment");
    } finally {
      setBooking(false);
    }
  };

  const filtered = appointments.filter(a => {
    const isPast = a.appointment_date ? new Date(`${a.appointment_date}T${a.appointment_time}`) < new Date() : false;
    const displayStatus = (a.status === "upcoming" && isPast) ? "completed" : a.status;
    if (filter === "all") return true;
    return displayStatus === filter;
  });

  return (
    <DashboardLayout activeTab="appointments">
      <div className="db-page-title">Appointments</div>
      <div className="db-page-subtitle">Your upcoming and past appointments</div>

      <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap", justifyContent: "space-between" }}>
        <button className="db-new-appt-btn" onClick={openFollowUpModal} style={{ margin: 0 }}>
          + Book Follow-up Appointment
        </button>
        <button className="appt-triage-trigger-btn" onClick={() => navigate("/priority-system")} style={{ margin: 0 }}>
          Symptom Check for Regular/Priority/Emergency
        </button>
      </div>

      {showBooking && (
        <div className="appt-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="appt-modal">
            <div className="appt-modal-header">{bookingCopy.title}</div>
            <div className="appt-modal-sub">{bookingCopy.subtitle}</div>

            <div className="appt-recommendation-note">{bookingCopy.note}</div>

            {triage && bookingMode !== "follow_up" && (
              <div className="appt-triage-summary">
                <div className="appt-triage-title">Triage summary</div>
                <div className="appt-triage-text">{triage.symptoms}</div>
                {triage.symptom_duration && (
                  <div className="appt-triage-meta">Duration: {triage.symptom_duration}</div>
                )}
              </div>
            )}

            {bookError && <div className="appt-error-box">{bookError}</div>}

            <form onSubmit={handleBook} className="appt-form">
              <div className="appt-step">
                <div className="appt-step-num">1</div>
                <div className="appt-step-body">
                  <label className="appt-label">Select City</label>
                  <select
                    className="appt-select"
                    value={selectedCity}
                    onChange={e => {
                      setPreferredDeptId("");
                      setSelectedCity(e.target.value);
                    }}
                    required
                  >
                    <option value="">{loadingOptions.cities ? "Loading cities..." : "Choose a city"}</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {selectedCity && (
                <div className="appt-step">
                  <div className="appt-step-num">2</div>
                  <div className="appt-step-body">
                    <label className="appt-label">Select Department</label>
                    <select
                      className="appt-select"
                      value={selectedDept}
                      onChange={e => setSelectedDept(e.target.value)}
                      required
                    >
                      <option value="">{loadingOptions.depts ? "Loading departments..." : "Choose department"}</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {selectedDept && (
                <div className="appt-step">
                  <div className="appt-step-num">3</div>
                  <div className="appt-step-body">
                    <label className="appt-label">Select Hospital</label>
                    <select
                      className="appt-select"
                      value={selectedHospital}
                      onChange={e => setSelectedHospital(e.target.value)}
                      required
                    >
                      <option value="">{loadingOptions.hospitals ? "Loading hospitals..." : "Choose a hospital"}</option>
                      {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {selectedHospital && (
                <div className="appt-step">
                  <div className="appt-step-num">4</div>
                  <div className="appt-step-body">
                    <label className="appt-label">Select Doctor</label>
                    <select
                      className="appt-select"
                      value={selectedDoctorId}
                      onChange={e => setSelectedDoctorId(e.target.value)}
                      required
                    >
                      <option value="">{loadingOptions.doctors ? "Loading doctors..." : "Choose a doctor"}</option>
                      {doctors.map(d => (
                        <option key={d.doctor_hospital_id} value={d.doctor_hospital_id}>
                          {d.name}{d.qualification ? ` (${d.qualification})` : ""}
                        </option>
                      ))}
                    </select>

                    {selectedDoctor && (
                      <div className="appt-doctor-card">
                        <div className="appt-doctor-name">{selectedDoctor.name}</div>
                        <div><strong>Qualification:</strong> {selectedDoctor.qualification || "Not listed"}</div>
                        <div><strong>Department:</strong> {selectedDoctor.department_name || departments.find(d => d.id === selectedDept)?.name || "Department"}</div>
                        <div><strong>Hospital:</strong> {selectedDoctor.hospital_name || hospitals.find(h => h.id === selectedHospital)?.name || "Hospital"}</div>
                        <div><strong>Room:</strong> {selectedDoctor.room_number || "Not listed"}</div>
                        <div><strong>Hospital phone:</strong> {selectedDoctor.hospital_phone || "Not listed"}</div>
                        {selectedDoctor.consultation_fee && <div><strong>Fee:</strong> Rs {selectedDoctor.consultation_fee}</div>}
                        {selectedDoctor.last_verified_at && (
                          <div><strong>Last verified:</strong> {new Date(selectedDoctor.last_verified_at).toLocaleDateString()}</div>
                        )}
                        {selectedDoctor.source_url && (
                          <div><strong>Source:</strong> <a href={selectedDoctor.source_url} target="_blank" rel="noreferrer">Verify details</a></div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedDoctorId && (
                <div className="appt-step">
                  <div className="appt-step-num">5</div>
                  <div className="appt-step-body">
                    <label className="appt-label">Select Date</label>
                    <input
                      type="date"
                      className="appt-input"
                      value={selectedDate}
                      min={todayStr()}
                      onChange={e => setSelectedDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {selectedDate && (
                <div className="appt-step">
                  <div className="appt-step-num">6</div>
                  <div className="appt-step-body">
                    <label className="appt-label">Select Available Slot</label>

                    {loadingOptions.schedules && <div className="appt-slots-loading">Loading availability...</div>}

                    {!loadingOptions.schedules && availableSlots.length === 0 && (
                      <div className="appt-slots-empty">
                        No slots available for this doctor on the selected date. Try another date or doctor.
                      </div>
                    )}

                    {!loadingOptions.schedules && availableSlots.length > 0 && (
                      <div className="appt-slots-grid">
                        {availableSlots.map(s => (
                          <button
                            key={s}
                            type="button"
                            className={`appt-slot-btn ${selectedTime === s ? "appt-slot-active" : ""}`}
                            onClick={() => setSelectedTime(s)}
                          >
                            {fmtSlot(s)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedTime && (
                <div className="appt-step">
                  <div className="appt-step-num">7</div>
                  <div className="appt-step-body">
                    <label className="appt-label">Reason / Notes</label>
                    <textarea
                      className="appt-input appt-textarea"
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      placeholder="Optional"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              <div className="appt-form-actions">
                <button type="button" className="appt-cancel-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="appt-submit-btn" disabled={booking || !selectedTime}>
                  {booking ? "Booking..." : `Confirm ${bookingCopy.badge} Booking`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="db-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 28px", borderBottom: "1px solid #d4e8da"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#1b3d2a" }}>All Appointments</span>
          </div>
          <span style={{ fontSize: 13, color: "#7a9485", fontWeight: 500 }}>
            {appointments.length} total
          </span>
        </div>

        <div style={{
          display: "flex", gap: 8, padding: "14px 28px",
          background: "#f0f8f2", borderBottom: "1px solid #d4e8da", flexWrap: "wrap"
        }}>
          {["all", "upcoming", "completed", "missed", "cancelled"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "7px 18px", borderRadius: 50,
                border: filter === f ? "none" : "1.5px solid #d4e8da",
                background: filter === f ? "#2d6a3f" : "#fff",
                color: filter === f ? "#fff" : "#4a6355",
                fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                textTransform: "capitalize", transition: "all 0.2s"
              }}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div>
          {loading ? (
            <div style={{ padding: "48px 28px", textAlign: "center", color: "#7a9485", fontSize: 14 }}>
              Loading appointments...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "48px 28px", textAlign: "center", color: "#7a9485", fontSize: 14 }}>
              No {filter === "all" ? "" : filter} appointments found.
            </div>
          ) : filtered.map((a, i) => {
            const isPast = a.appointment_date ? new Date(`${a.appointment_date}T${a.appointment_time}`) < new Date() : false;
            const displayStatus = (a.status === "upcoming" && isPast) ? "completed" : a.status;
            const statusStyle = STATUS_STYLES[displayStatus] || STATUS_STYLES.upcoming;
            const type = TYPE_BADGES[a.appointment_type] || TYPE_BADGES.follow_up;
            const isActionable = a.status === "upcoming" || a.status === "pending";

            return (
              <div
                key={a.id}
                style={{
                  padding: "18px 28px",
                  borderBottom: i < filtered.length - 1 ? "1px solid #eaf4ec" : "none",
                }}
              >
                {/* Top row: date badge + info + status pill */}
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div className="appt-date-badge">
                    <span style={{ fontSize: 18, fontWeight: 800, lineHeight: 1 }}>{a.day}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.85 }}>{a.mon}</span>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#1b3d2a" }}>{a.doc || "Unknown Doctor"}</span>
                      <span
                        className="appt-type-badge"
                        style={{ background: type.bg, color: type.color, borderColor: type.border }}
                      >
                        {type.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "#7a9485", marginTop: 2 }}>
                      {a.dept || "Department"}
                      {a.hospital && <> - {a.hospital}</>}
                      {a.city && <> - {a.city}</>}
                    </div>
                    <div style={{ fontSize: 12, color: "#aab8b0", marginTop: 1 }}>
                      {a.time}
                    </div>
                  </div>

                  <span style={{
                    padding: "4px 12px", borderRadius: 50,
                    background: (a.status === "upcoming" && isPast) ? "#f3f4f6" : statusStyle.bg,
                    color: (a.status === "upcoming" && isPast) ? "#4b5563" : statusStyle.color,
                    border: `1px solid ${(a.status === "upcoming" && isPast) ? "#e5e7eb" : statusStyle.border}`,
                    fontSize: 12, fontWeight: 700, flexShrink: 0
                  }}>
                    {a.status === "upcoming" && isPast ? "Past Appointment" : statusStyle.label}
                  </span>
                </div>

                {/* Action buttons row — always visible for upcoming appointments */}
                {isActionable && (
                  <div style={{
                    display: "flex", gap: 8, marginTop: 12, paddingLeft: 58,
                    flexWrap: "wrap"
                  }}>
                    <button
                      onClick={() => handleUpdateStatus(a.id, "completed")}
                      style={{
                        padding: "7px 18px", borderRadius: 50,
                        border: "1.5px solid #bfdbfe", background: "#eff6ff",
                        color: "#1d4ed8", fontSize: 12, fontWeight: 700,
                        cursor: "pointer", transition: "all 0.2s"
                      }}
                    >
                      ✓ Mark Completed
                    </button>

                    {!isPast && (
                      <button
                        onClick={() => handleCancel(a.id)}
                        disabled={cancellingId === a.id}
                        style={{
                          padding: "7px 18px", borderRadius: 50,
                          border: "1.5px solid #fecaca", background: "#fff",
                          color: "#dc2626", fontSize: 12, fontWeight: 700,
                          cursor: "pointer", opacity: cancellingId === a.id ? 0.6 : 1,
                          transition: "all 0.2s"
                        }}
                      >
                        {cancellingId === a.id ? "Cancelling..." : "✕ Cancel"}
                      </button>
                    )}

                    {isPast && (
                      <button
                        onClick={() => handleUpdateStatus(a.id, "missed")}
                        style={{
                          padding: "7px 18px", borderRadius: 50,
                          border: "1.5px solid #fde68a", background: "#fffbeb",
                          color: "#b45309", fontSize: 12, fontWeight: 700,
                          cursor: "pointer", transition: "all 0.2s"
                        }}
                      >
                        ⚠ Mark Missed
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
