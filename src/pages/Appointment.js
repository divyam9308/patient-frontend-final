import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
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
  upcoming:  { label: "Upcoming",  color: "#2d6a3f", bg: "#eaf4ec", border: "#c8e6c9" },
  completed: { label: "Completed", color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  cancelled: { label: "Cancelled", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  missed:    { label: "Missed",    color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
};

function fmtSlot(slot) {
  const [h, m] = slot.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr   = h % 12 || 12;
  return `${hr.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function todayStr() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

export default function Appointment() {
  const location = useLocation();

  // ── List state ──────────────────────────────────────────
  const [filter,       setFilter]       = useState("all");
  const [appointments, setAppointments] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  // ── Modal state ─────────────────────────────────────────
  const [showBooking, setShowBooking] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [booking,     setBooking]     = useState(false);
  const [bookError,   setBookError]   = useState("");

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

  const selectedDoctor = doctors.find(d => d.doctor_hospital_id === selectedDoctorId);

  // ── Fetch appointments list ─────────────────────────────
  const fetchAppointments = useCallback(() => {
    setLoading(true);
    api.get("/appointments")
      .then(data => setAppointments(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAppointments();
    setLoadingOptions(p => ({ ...p, cities: true }));
    getCities().then(setCities).catch(console.error).finally(() => setLoadingOptions(p => ({ ...p, cities: false })));
  }, [fetchAppointments]);

  useEffect(() => {
    if (location.state?.openEmergency) {
      setIsEmergency(true);
      setShowBooking(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location.state]);

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
  const openModal = (emergency = false) => {
    setIsEmergency(emergency);
    resetForm();
    setShowBooking(true);
  };

  const closeModal = () => {
    setShowBooking(false);
    setIsEmergency(false);
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

    if (isEmergency) {
      setBooking(true);
      try {
        const now = new Date();
        const date = now.toISOString().split("T")[0];
        const hh   = now.getHours().toString().padStart(2, "0");
        const mm   = now.getMinutes().toString().padStart(2, "0");
        const newAppt = await createAppointment({
          doctor_hospital_id: doctors[0]?.doctor_hospital_id || null, // Best effort for emergency
          appointment_date: date,
          appointment_time: `${hh}:${mm}`,
          is_emergency: true
        });
        setAppointments(prev => [newAppt, ...prev].sort((a,b) => new Date(a.appointment_date) - new Date(b.appointment_date)));
        closeModal();
      } catch (err) {
        setBookError(err.message || "Emergency booking failed");
      } finally {
        setBooking(false);
      }
      return;
    }

    if (!selectedDoctorId || !selectedDate || !selectedTime) {
      setBookError("Please select doctor, date, and time.");
      return;
    }

    setBooking(true);
    try {
      const newAppt = await createAppointment({
        doctor_hospital_id: selectedDoctorId,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        is_emergency: false
      });
      setAppointments(prev => [...prev, newAppt].sort((a,b) => new Date(a.appointment_date) - new Date(b.appointment_date)));
      closeModal();
    } catch (err) {
      setBookError(err.message || "Failed to book appointment");
    } finally {
      setBooking(false);
    }
  };

  const filtered = appointments.filter(a => {
    const isPast        = a.appointment_date ? new Date(`${a.appointment_date}T${a.appointment_time}`) < new Date() : false;
    const displayStatus = (a.status === "upcoming" && isPast) ? "completed" : a.status;
    if (filter === "all") return true;
    return displayStatus === filter;
  });

  return (
    <DashboardLayout activeTab="appointments">
      <div className="db-page-title">Appointments</div>
      <div className="db-page-subtitle">Your upcoming and past appointments</div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        <button className="db-new-appt-btn" onClick={() => openModal(false)}>
          + Book New Appointment
        </button>
        <button className="appt-emergency-trigger-btn" onClick={() => openModal(true)}>
          🚨 Emergency Booking
        </button>
      </div>

      {/* ── BOOKING MODAL ──────────────────────────────────────────────────────── */}
      {showBooking && (
        <div className="appt-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className={`appt-modal ${isEmergency ? "appt-modal-emergency" : ""}`}>

            {/* Header */}
            <div className="appt-modal-header">
              {isEmergency
                ? <><span className="appt-em-pulse">🚨</span> Emergency Appointment</>
                : <>📅 Book New Appointment</>
              }
            </div>
            <div className="appt-modal-sub">
              {isEmergency
                ? "High-priority slot — no availability check. Doctor is alerted immediately."
                : "Follow the steps below to find a doctor and available slot."}
            </div>

            {/* Error */}
            {bookError && (
              <div className="appt-error-box">⚠️ {bookError}</div>
            )}

            <form onSubmit={handleBook} className="appt-form">

              {/* ── EMERGENCY FORM ───────────────────────────────────────────── */}
              {isEmergency && (
                <>
                  <div className="appt-emergency-banner">
                    🆘 An alert will be sent to the on-call doctor immediately upon booking.
                    Your appointment is being created for <strong>right now</strong>.
                  </div>

                  <div className="appt-form-actions">
                    <button type="button" className="appt-cancel-btn" onClick={closeModal}>
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="appt-submit-btn appt-submit-emergency"
                      disabled={booking}
                    >
                      {booking ? "Booking..." : "🚨 Book Emergency NOW"}
                    </button>
                  </div>
                </>
              )}

              {/* ── REGULAR STEPPED FORM ─────────────────────────────────────── */}
              {!isEmergency && (
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
                          min={todayStr()}
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
              )}
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
            const isPast        = a.appointment_date ? new Date(`${a.appointment_date}T${a.appointment_time}`) < new Date() : false;
            const displayStatus = (a.status === "upcoming" && isPast) ? "completed" : a.status;
            const s             = STATUS_STYLES[displayStatus] || STATUS_STYLES.upcoming;

            return (
              <div
                key={a.id}
                className={a.is_emergency ? "appt-row appt-row-emergency" : "appt-row"}
                style={{ borderBottom: i < filtered.length - 1 ? "1px solid #eaf4ec" : "none" }}
              >
                {/* Date badge */}
                <div className={`appt-date-badge ${a.is_emergency ? "appt-date-badge-emergency" : ""}`}>
                  <span style={{ fontSize: 18, fontWeight: 800, lineHeight: 1 }}>{a.day}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.85 }}>{a.mon}</span>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#1b3d2a" }}>{a.doc || 'Unknown Doctor'}</span>
                    {a.is_emergency && (
                      <span className="appt-em-badge">🚨 EMERGENCY</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: "#7a9485", marginTop: 2 }}>
                    {a.dept || 'Department'}
                    {a.hospital && <> · {a.hospital}</>}
                    {a.city    && <> · {a.city}</>}
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
                    color:      (a.status === "upcoming" && isPast) ? "#4b5563" : s.color,
                    border:     `1px solid ${(a.status === "upcoming" && isPast) ? "#e5e7eb" : s.border}`,
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