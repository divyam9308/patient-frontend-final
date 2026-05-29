import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import {
  api,
  getCities,
  getDepartmentsByCity,
  getHospitalsByCityAndDepartment,
  getDoctorsByHospitalAndDepartment,
  getDoctorSchedules,
  createAppointment
} from "../utils/api.js";
import "./Dashboard.css";
import "./Appointment.css";

const STATUS_STYLES = {
  upcoming: { label: "Upcoming", color: "#2d6a3f", bg: "#eaf4ec", border: "#c8e6c9" },
  completed: { label: "Completed", color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  cancelled: { label: "Cancelled", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  missed: { label: "Missed", color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
};

function fmtSlot(slot) {
  const [h, m] = slot.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function todayStr() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

export default function Appointment() {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // ── Booking Mode from URL ───────────────────────────────
  const urlMode = searchParams.get('mode'); // 'regular', 'priority', or null (follow_up)
  const urlTriageId = searchParams.get('triage_id');
  const urlDeptId = searchParams.get('dept');
  const bookingMode = urlMode || 'follow_up'; // Default to follow_up

  // ── List state ──────────────────────────────────────────
  const [filter, setFilter] = useState("all");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  // ── Modal state ─────────────────────────────────────────
  const [showBooking, setShowBooking] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState("");

  // ── Dependent Dropdown Options ──────────────────────────
  const [cities, setCities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);

  // ── Selection State ─────────────────────────────────────
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedHospital, setSelectedHospital] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  // ── Loading States ──────────────────────────────────────
  const [loadingOptions, setLoadingOptions] = useState({
    cities: false, depts: false, hospitals: false, doctors: false, schedules: false
  });

  // ── Date constraints based on booking mode ──────────────
  const dateMin = useMemo(() => {
    const d = new Date();
    if (bookingMode === 'follow_up') {
      d.setDate(d.getDate() + 8); // > 7 days from now
    } else if (bookingMode === 'regular') {
      d.setDate(d.getDate() + 1); // at least 1 day from now (advised, not blocked)
    }
    // priority: same day allowed
    return d.toISOString().split('T')[0];
  }, [bookingMode]);

  const modeLabel = bookingMode === 'follow_up' ? 'Follow-Up'
    : bookingMode === 'priority' ? 'Priority'
      : bookingMode === 'regular' ? 'Regular' : 'Follow-Up';

  const selectedDoctor = doctors.find(d => d.doctor_hospital_id === selectedDoctorId);

  // ── Fetch appointments list ─────────────────────────────
  const fetchAppointments = useCallback(() => {
    setLoading(true);
    api.get("/appointments")
      .then(data => setAppointments(data))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAppointments();
    setLoadingOptions(p => ({ ...p, cities: true }));
    getCities().then(setCities).catch(console.error).finally(() => setLoadingOptions(p => ({ ...p, cities: false })));
  }, [fetchAppointments]);

  // Auto-open modal if coming from triage redirect (mode in URL)
  useEffect(() => {
    if (urlMode === 'regular' || urlMode === 'priority') {
      setShowBooking(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [urlMode]);

  // ── Cascading Fetch Logic ────────────────────────────────
  useEffect(() => {
    setSelectedDept("");
    setDepartments([]);
    if (!selectedCity) return;
    setLoadingOptions(p => ({ ...p, depts: true }));
    getDepartmentsByCity(selectedCity)
      .then(setDepartments)
      .catch(console.error)
      .finally(() => setLoadingOptions(p => ({ ...p, depts: false })));
  }, [selectedCity]);

  useEffect(() => {
    setSelectedHospital("");
    setHospitals([]);
    if (!selectedCity || !selectedDept) return;
    setLoadingOptions(p => ({ ...p, hospitals: true }));
    getHospitalsByCityAndDepartment(selectedCity, selectedDept)
      .then(setHospitals)
      .catch(console.error)
      .finally(() => setLoadingOptions(p => ({ ...p, hospitals: false })));
  }, [selectedDept, selectedCity]);

  useEffect(() => {
    setSelectedDoctorId("");
    setDoctors([]);
    if (!selectedHospital || !selectedDept) return;
    setLoadingOptions(p => ({ ...p, doctors: true }));
    getDoctorsByHospitalAndDepartment(selectedHospital, selectedDept)
      .then(setDoctors)
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
      .then(setSchedules)
      .catch(console.error)
      .finally(() => setLoadingOptions(p => ({ ...p, schedules: false })));
  }, [selectedDoctorId]);

  // ── Slot Generation ──────────────────────────────────────
  const availableSlots = React.useMemo(() => {
    if (!selectedDate || !schedules.length) return [];

    const dayOfWeek = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });
    const daySchedules = schedules.filter(s => s.day_of_week === dayOfWeek);

    if (!daySchedules.length) return [];

    const slots = [];
    daySchedules.forEach(sched => {
      let current = new Date(`${selectedDate}T${sched.start_time}`);
      const end = new Date(`${selectedDate}T${sched.end_time}`);

      while (current < end) {
        slots.push(current.toTimeString().substring(0, 5) + ':00');
        current.setMinutes(current.getMinutes() + 30);
      }
    });

    if (selectedDate === todayStr()) {
      const nowStr = new Date().toTimeString().substring(0, 8);
      return slots.filter(s => s > nowStr).sort();
    }

    return slots.sort();
  }, [selectedDate, schedules]);


  // ── Actions ─────────────────────────────────────────────
  const openModal = () => {
    resetForm();
    setShowBooking(true);
  };

  const closeModal = () => {
    setShowBooking(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedCity("");
    setSelectedDept("");
    setSelectedHospital("");
    setSelectedDoctorId("");
    setSelectedDate("");
    setSelectedTime("");
    setBookError("");
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    setCancellingId(id);
    try {
      await api.delete(`/appointments/${id}`);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: "cancelled" } : a));
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
    } catch (err) {
      alert("Error updating status: " + err.message);
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setBookError("");

    if (!selectedDoctorId || !selectedDate || !selectedTime) {
      setBookError("Please select doctor, date, and time.");
      return;
    }

    setBooking(true);
    try {
      const payload = {
        doctor_hospital_id: selectedDoctorId,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        appointment_type: bookingMode,
      };
      if (urlTriageId) payload.triage_id = urlTriageId;

      const newAppt = await createAppointment(payload);
      setAppointments(prev => [...prev, newAppt].sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date)));
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

      {/* Mode banner */}
      {urlMode && (
        <div style={{
          background: bookingMode === 'priority' ? '#fffbeb' : '#eff6ff',
          border: `1.5px solid ${bookingMode === 'priority' ? '#fde68a' : '#bfdbfe'}`,
          borderRadius: 12, padding: '12px 18px', marginBottom: 16,
          fontSize: 14, fontWeight: 600,
          color: bookingMode === 'priority' ? '#92400e' : '#1d4ed8'
        }}>
          {bookingMode === 'priority'
            ? '⚡ Priority Booking — Based on your triage results, you can book a same-day or within-24-hour appointment.'
            : '📋 Regular Booking — Based on your triage results, we recommend booking within 1-2 days.'}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap", justifyContent: "space-between" }}>
        <button className="db-new-appt-btn" onClick={() => openModal()} style={{ margin: 0 }}>
          + Book Follow Up Appointment
        </button>
        <button className="appt-emergency-trigger-btn" onClick={() => window.location.href = '/symptom-analyser'} style={{ margin: 0 }}>
          🩺 Symptom Check / Triage
        </button>
      </div>

      {/* ── BOOKING MODAL ──────────────────────────────────────────────────────── */}
      {showBooking && (
        <div className="appt-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="appt-modal">

            {/* Header */}
            <div className="appt-modal-header">
              📅 Book {modeLabel} Appointment
            </div>
            <div className="appt-modal-sub">
              {bookingMode === 'priority'
                ? 'Priority booking — same-day or within 24 hours. Select a doctor and available slot.'
                : bookingMode === 'regular'
                  ? 'Regular booking — we advise scheduling within 1-2 days.'
                  : 'Follow-up booking — must be at least 7 days from today.'}
            </div>

            {/* Error */}
            {bookError && (
              <div className="appt-error-box">⚠️ {bookError}</div>
            )}

            <form onSubmit={handleBook} className="appt-form">

              {/* ── STEPPED FORM ─────────────────────────────────────── */}
              <>
                {/* Step 1: City */}
                <div className="appt-step">
                  <div className="appt-step-num">1</div>
                  <div className="appt-step-body">
                    <label className="appt-label">Select City</label>
                    <select
                      className="appt-select"
                      value={selectedCity}
                      onChange={e => setSelectedCity(e.target.value)}
                      required
                    >
                      <option value="">{loadingOptions.cities ? "Loading cities..." : "— Choose a city —"}</option>
                      {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Step 2: Department */}
                {selectedCity && (
                  <div className="appt-step">
                    <div className="appt-step-num">2</div>
                    <div className="appt-step-body">
                      <label className="appt-label">Select Specialty / Department</label>
                      <select
                        className="appt-select"
                        value={selectedDept}
                        onChange={e => setSelectedDept(e.target.value)}
                        required
                      >
                        <option value="">{loadingOptions.depts ? "Loading departments..." : "— Choose specialty —"}</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 3: Hospital */}
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
                        <option value="">{loadingOptions.hospitals ? "Loading hospitals..." : "— Choose a hospital —"}</option>
                        {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 4: Doctor */}
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
                        <option value="">{loadingOptions.doctors ? "Loading doctors..." : "— Choose a doctor —"}</option>
                        {doctors.map(d => <option key={d.doctor_hospital_id} value={d.doctor_hospital_id}>{d.name} ({d.qualification})</option>)}
                      </select>

                      {/* Doctor Details Card inside the step */}
                      {selectedDoctor && (
                        <div style={{ marginTop: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#475569' }}>
                          <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>🩺 {selectedDoctor.name}</div>
                          <div style={{ marginBottom: '4px' }}><strong>Room:</strong> {selectedDoctor.room_number}</div>
                          <div style={{ marginBottom: '4px' }}><strong>Phone:</strong> {selectedDoctor.hospital_phone}</div>
                          <div style={{ marginBottom: '4px' }}><strong>Fee:</strong> ₹{selectedDoctor.consultation_fee}</div>
                          {selectedDoctor.source_url && (
                            <div><strong>Source:</strong> <a href={selectedDoctor.source_url} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>Verify Schedule</a></div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 5: Date */}
                {selectedDoctorId && (
                  <div className="appt-step">
                    <div className="appt-step-num">5</div>
                    <div className="appt-step-body">
                      <label className="appt-label">Select Date</label>
                      <input
                        type="date"
                        className="appt-input"
                        value={selectedDate}
                        min={dateMin}
                        onChange={e => setSelectedDate(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #c2d1c7', outline: 'none' }}
                      />
                    </div>
                  </div>
                )}

                {/* Step 6: Slot */}
                {selectedDate && (
                  <div className="appt-step">
                    <div className="appt-step-num">6</div>
                    <div className="appt-step-body">
                      <label className="appt-label">Select Available Slot</label>

                      {loadingOptions.schedules && (
                        <div className="appt-slots-loading">⏳ Loading availability...</div>
                      )}

                      {!loadingOptions.schedules && availableSlots.length === 0 && (
                        <div className="appt-slots-empty">
                          😞 No slots available for this doctor on the selected date.
                          Try another date or doctor.
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

                {/* Actions */}
                <div className="appt-form-actions">
                  <button type="button" className="appt-cancel-btn" onClick={closeModal}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="appt-submit-btn"
                    disabled={booking || !selectedTime}
                  >
                    {booking ? "Booking..." : "Confirm Booking"}
                  </button>
                </div>
              </>
            </form>
          </div>
        </div>
      )}

      {/* ── APPOINTMENTS LIST ────────────────────────────────────────────────── */}
      <div className="db-card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Card header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 28px", borderBottom: "1px solid #d4e8da"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>📅</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#1b3d2a" }}>All Appointments</span>
          </div>
          <span style={{ fontSize: 13, color: "#7a9485", fontWeight: 500 }}>
            {appointments.length} total
          </span>
        </div>

        {/* Filter tabs */}
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

        {/* List */}
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
            const s = STATUS_STYLES[displayStatus] || STATUS_STYLES.upcoming;

            return (
              <div
                key={a.id}
                className={a.appointment_type === 'emergency' ? "appt-row appt-row-emergency" : "appt-row"}
                style={{ borderBottom: i < filtered.length - 1 ? "1px solid #eaf4ec" : "none" }}
              >
                {/* Date badge */}
                <div className={`appt-date-badge ${a.appointment_type === 'emergency' ? "appt-date-badge-emergency" : ""}`}>
                  <span style={{ fontSize: 18, fontWeight: 800, lineHeight: 1 }}>{a.day}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.85 }}>{a.mon}</span>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#1b3d2a" }}>{a.doc || 'Unknown Doctor'}</span>
                    {a.appointment_type === 'emergency' && (
                      <span className="appt-em-badge">🚨 EMERGENCY</span>
                    )}
                    {a.appointment_type === 'priority' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 9px', background: '#fffbeb', color: '#b45309', border: '1.5px solid #fde68a', borderRadius: 50, fontSize: 11, fontWeight: 700 }}>⚡ PRIORITY</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: "#7a9485", marginTop: 2 }}>
                    {a.dept || 'Department'}
                    {a.hospital && <> · {a.hospital}</>}
                    {a.city && <> · {a.city}</>}
                  </div>
                  <div style={{ fontSize: 12, color: "#aab8b0", marginTop: 1 }}>
                    {a.time}
                  </div>
                </div>

                {/* Status + actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <span style={{
                    padding: "4px 12px", borderRadius: 50,
                    background: (a.status === "upcoming" && isPast) ? "#f3f4f6" : s.bg,
                    color: (a.status === "upcoming" && isPast) ? "#4b5563" : s.color,
                    border: `1px solid ${(a.status === "upcoming" && isPast) ? "#e5e7eb" : s.border}`,
                    fontSize: 12, fontWeight: 700
                  }}>
                    {a.status === "upcoming" && isPast ? "Past Appointment" : s.label}
                  </span>

                  {a.status === "upcoming" && !isPast && (
                    <button
                      onClick={() => handleCancel(a.id)}
                      disabled={cancellingId === a.id}
                      style={{
                        padding: "6px 16px", borderRadius: 50,
                        border: "1.5px solid #fecaca", background: "#fff",
                        color: "#dc2626", fontSize: 12, fontWeight: 600,
                        cursor: "pointer", opacity: cancellingId === a.id ? 0.6 : 1
                      }}
                    >
                      {cancellingId === a.id ? "Cancelling..." : "Cancel"}
                    </button>
                  )}

                  {a.status === "upcoming" && isPast && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => handleUpdateStatus(a.id, "completed")}
                        style={{
                          padding: "6px 12px", borderRadius: 50,
                          border: "1.5px solid #bfdbfe", background: "#eff6ff",
                          color: "#1d4ed8", fontSize: 12, fontWeight: 600, cursor: "pointer"
                        }}
                      >
                        ✓ Completed
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(a.id, "missed")}
                        style={{
                          padding: "6px 12px", borderRadius: 50,
                          border: "1.5px solid #fde68a", background: "#fffbeb",
                          color: "#b45309", fontSize: 12, fontWeight: 600, cursor: "pointer"
                        }}
                      >
                        ✖ Missed
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}