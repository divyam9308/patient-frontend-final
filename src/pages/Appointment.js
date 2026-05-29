import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { api } from "../utils/api.js";
import "./Dashboard.css";
import "./Appointment.css";

const STATUS_STYLES = {
  upcoming:  { label: "Upcoming",  color: "#2d6a3f", bg: "#eaf4ec", border: "#c8e6c9" },
  completed: { label: "Completed", color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  cancelled: { label: "Cancelled", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  missed:    { label: "Missed",    color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
};

// ── Format HH:MM → 12hr display ─────────────────────────
function fmtSlot(slot) {
  const [h, m] = slot.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr   = h % 12 || 12;
  return `${hr.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// ── Today's date as YYYY-MM-DD ───────────────────────────
function todayStr() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

const BLANK_FORM = {
  city: "", hospital: "", dept: "", doc: "", date: "", slot: ""
};

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

  // ── Form cascade state ──────────────────────────────────
  const [form,     setForm]     = useState(BLANK_FORM);
  const [meta,     setMeta]     = useState(null);   // { cities: CITIES_DATA }
  const [slots,    setSlots]    = useState([]);
  const [loadSlots, setLoadSlots] = useState(false);
  const [recs,     setRecs]     = useState([]);
  const [loadRecs, setLoadRecs] = useState(false);

  // ── Derived options ─────────────────────────────────────
  const cityList    = meta ? Object.keys(meta.cities) : [];
  const hospitalList = (form.city && meta)
    ? Object.keys(meta.cities[form.city]?.hospitals || {})
    : [];
  const deptList    = (form.city && form.hospital && meta)
    ? Object.keys(meta.cities[form.city]?.hospitals[form.hospital]?.departments || {})
    : [];
  const doctorList  = (form.city && form.hospital && form.dept && meta)
    ? (meta.cities[form.city]?.hospitals[form.hospital]?.departments[form.dept] || [])
    : [];

  // ── Fetch appointments list ─────────────────────────────
  const fetchAppointments = useCallback(() => {
    setLoading(true);
    api.get("/appointments")
      .then(data => setAppointments(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Fetch metadata on mount ─────────────────────────────
  useEffect(() => {
    fetchAppointments();
    api.get("/appointments/meta")
      .then(data => setMeta(data))
      .catch(() => {});
  }, [fetchAppointments]);

  // ── Open Emergency mode if routed from Symptom Analyser ─
  useEffect(() => {
    if (location.state?.openEmergency) {
      setIsEmergency(true);
      setShowBooking(true);
      // Scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location.state]);

  // ── Fetch available slots when doctor + date are set ────
  useEffect(() => {
    if (!form.doc || !form.date || isEmergency) {
      setSlots([]);
      return;
    }
    setLoadSlots(true);
    setSlots([]);
    setForm(f => ({ ...f, slot: "" }));
    const params = new URLSearchParams({
      city: form.city, hospital: form.hospital,
      department: form.dept, doctor: form.doc, date: form.date
    });
    api.get(`/appointments/available-slots?${params}`)
      .then(data => setSlots(data.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setLoadSlots(false));
  }, [form.doc, form.date, form.city, form.hospital, form.dept, isEmergency]);

  // ── Fetch recommendations when dept set but no doctors ──
  useEffect(() => {
    if (!form.city || !form.hospital || !form.dept) {
      setRecs([]);
      return;
    }
    if (doctorList.length > 0) {
      setRecs([]);
      return;
    }
    setLoadRecs(true);
    const params = new URLSearchParams({
      city: form.city, hospital: form.hospital, department: form.dept
    });
    api.get(`/appointments/recommendations?${params}`)
      .then(data => setRecs(data.recommendations || []))
      .catch(() => setRecs([]))
      .finally(() => setLoadRecs(false));
  }, [form.city, form.hospital, form.dept, doctorList.length]);

  // ── Handle form field changes with cascade reset ────────
  const handleField = (key, value) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === "city")     { next.hospital = ""; next.dept = ""; next.doc = ""; next.slot = ""; }
      if (key === "hospital") { next.dept = ""; next.doc = ""; next.slot = ""; }
      if (key === "dept")     { next.doc = ""; next.slot = ""; }
      if (key === "doc")      { next.slot = ""; }
      if (key === "date")     { next.slot = ""; }
      return next;
    });
    setRecs([]);
  };

  // ── Apply a recommendation ──────────────────────────────
  const applyRec = (rec) => {
    setForm({
      city: rec.city, hospital: rec.hospital,
      dept: rec.department, doc: rec.doctors[0] || "",
      date: "", slot: ""
    });
    setRecs([]);
  };

  // ── Open booking modal ──────────────────────────────────
  const openModal = (emergency = false) => {
    setIsEmergency(emergency);
    setForm(BLANK_FORM);
    setSlots([]);
    setRecs([]);
    setBookError("");
    setShowBooking(true);
  };

  const closeModal = () => {
    setShowBooking(false);
    setIsEmergency(false);
    setBookError("");
    setForm(BLANK_FORM);
    setSlots([]);
    setRecs([]);
  };

  // ── Book appointment ────────────────────────────────────
  const handleBook = async (e) => {
    e.preventDefault();
    setBookError("");

    if (isEmergency) {
      // Emergency: book immediately for NOW, no slot check
      setBooking(true);
      try {
        const now = new Date();
        const date = now.toISOString().split("T")[0];
        const hh   = now.getHours().toString().padStart(2, "0");
        const mm   = now.getMinutes().toString().padStart(2, "0");
        const newAppt = await api.post("/appointments", {
          doc:          form.doc  || "Emergency Duty Doctor",
          dept:         form.dept || "Emergency",
          date,
          time:         `${hh}:${mm}`,
          city:         form.city     || null,
          hospital:     form.hospital || null,
          is_emergency: true,
        });
        setAppointments(prev => [newAppt, ...prev]);
        closeModal();
      } catch (err) {
        setBookError(err.message || "Emergency booking failed");
      } finally {
        setBooking(false);
      }
      return;
    }

    // Regular booking validations
    if (!form.city || !form.hospital || !form.dept || !form.doc) {
      setBookError("Please complete all selection steps.");
      return;
    }
    if (!form.date) {
      setBookError("Please select a date.");
      return;
    }
    if (!form.slot) {
      setBookError("Please select an available time slot.");
      return;
    }

    // Past-date check (also validated server-side)
    const apptDT = new Date(`${form.date}T${form.slot}:00`);
    if (apptDT <= new Date()) {
      setBookError("Selected date/time is in the past. Please choose a future slot.");
      return;
    }

    setBooking(true);
    try {
      const newAppt = await api.post("/appointments", {
        doc:      form.doc,
        dept:     form.dept,
        date:     form.date,
        time:     form.slot,
        city:     form.city,
        hospital: form.hospital,
      });
      setAppointments(prev => [newAppt, ...prev]);
      closeModal();
    } catch (err) {
      setBookError(err.message || "Failed to book appointment");
    } finally {
      setBooking(false);
    }
  };

  // ── Cancel appointment ──────────────────────────────────
  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this appointment?")) return;
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

  // ── Filtered list ───────────────────────────────────────
  const filtered = appointments.filter(a => {
    const isPast        = a.appointment_time ? new Date(a.appointment_time) < new Date() : false;
    const displayStatus = (a.status === "upcoming" && isPast) ? "completed" : a.status;
    if (filter === "all") return true;
    return displayStatus === filter;
  });

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
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

      {/* ── BOOKING MODAL ─────────────────────────────────── */}
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

              {/* ── EMERGENCY FORM ────────────────────────── */}
              {isEmergency && (
                <>
                  <div className="appt-emergency-banner">
                    🆘 An alert will be sent to the on-call doctor immediately upon booking.
                    Your appointment is being created for <strong>right now</strong>.
                  </div>

                  {/* Optional preferred city/hospital */}
                  {meta && (
                    <>
                      <label className="appt-label">Preferred City (optional)</label>
                      <select
                        className="appt-select"
                        value={form.city}
                        onChange={e => handleField("city", e.target.value)}
                      >
                        <option value="">Any city — assign nearest available</option>
                        {cityList.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>

                      {form.city && (
                        <>
                          <label className="appt-label">Preferred Hospital (optional)</label>
                          <select
                            className="appt-select"
                            value={form.hospital}
                            onChange={e => handleField("hospital", e.target.value)}
                          >
                            <option value="">Any hospital in {form.city}</option>
                            {hospitalList.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </>
                      )}

                      <label className="appt-label">Emergency Department</label>
                      <select
                        className="appt-select"
                        value={form.dept}
                        onChange={e => handleField("dept", e.target.value)}
                      >
                        <option value="">Emergency (General)</option>
                        {(form.city && form.hospital ? deptList : [
                          "Cardiology", "Neurology", "Orthopedics", "General", "Pediatrics"
                        ]).map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </>
                  )}

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

              {/* ── REGULAR STEPPED FORM ──────────────────── */}
              {!isEmergency && (
                <>
                  {/* Step 1: City */}
                  <div className="appt-step">
                    <div className="appt-step-num">1</div>
                    <div className="appt-step-body">
                      <label className="appt-label">Select City</label>
                      <select
                        className="appt-select"
                        value={form.city}
                        onChange={e => handleField("city", e.target.value)}
                        required
                      >
                        <option value="">— Choose a city —</option>
                        {cityList.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Step 2: Hospital */}
                  {form.city && (
                    <div className="appt-step">
                      <div className="appt-step-num">2</div>
                      <div className="appt-step-body">
                        <label className="appt-label">Select Hospital in {form.city}</label>
                        <select
                          className="appt-select"
                          value={form.hospital}
                          onChange={e => handleField("hospital", e.target.value)}
                          required
                        >
                          <option value="">— Choose a hospital —</option>
                          {hospitalList.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Department / Specialty */}
                  {form.hospital && (
                    <div className="appt-step">
                      <div className="appt-step-num">3</div>
                      <div className="appt-step-body">
                        <label className="appt-label">Select Specialty / Department</label>
                        <select
                          className="appt-select"
                          value={form.dept}
                          onChange={e => handleField("dept", e.target.value)}
                          required
                        >
                          <option value="">— Choose specialty —</option>
                          {deptList.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Recommendation card (no doctors in chosen dept) */}
                  {form.dept && doctorList.length === 0 && !loadRecs && recs.length > 0 && (
                    <div className="appt-rec-card">
                      <div className="appt-rec-title">
                        😔 No {form.dept} doctors at {form.hospital}
                      </div>
                      <div className="appt-rec-sub">We found doctors in these locations:</div>
                      {recs.map((rec, i) => (
                        <div key={i} className={`appt-rec-item appt-rec-${rec.tier}`}>
                          <div>
                            <span className="appt-rec-badge">
                              {rec.tier === "same_city" ? "🏥 Same City" : "📍 Other City"}
                            </span>
                            <div className="appt-rec-hosp">{rec.hospital}</div>
                            <div className="appt-rec-loc">{rec.city} · {rec.department}</div>
                            <div className="appt-rec-docs">
                              Doctors: {rec.doctors.slice(0, 2).join(", ")}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="appt-rec-switch-btn"
                            onClick={() => applyRec(rec)}
                          >
                            Switch →
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recommendation loading */}
                  {form.dept && doctorList.length === 0 && loadRecs && (
                    <div className="appt-rec-loading">🔍 Searching for doctors nearby...</div>
                  )}

                  {/* No doctors anywhere */}
                  {form.dept && doctorList.length === 0 && !loadRecs && recs.length === 0 && (
                    <div className="appt-rec-none">
                      ℹ️ No {form.dept} specialists found in our network right now.
                    </div>
                  )}

                  {/* Step 4: Doctor */}
                  {doctorList.length > 0 && (
                    <div className="appt-step">
                      <div className="appt-step-num">4</div>
                      <div className="appt-step-body">
                        <label className="appt-label">Select Doctor</label>
                        <select
                          className="appt-select"
                          value={form.doc}
                          onChange={e => handleField("doc", e.target.value)}
                          required
                        >
                          <option value="">— Choose a doctor —</option>
                          {doctorList.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Step 5: Date */}
                  {form.doc && (
                    <div className="appt-step">
                      <div className="appt-step-num">5</div>
                      <div className="appt-step-body">
                        <label className="appt-label">Select Date</label>
                        <input
                          type="date"
                          className="appt-input"
                          value={form.date}
                          min={todayStr()}
                          onChange={e => handleField("date", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 6: Slot */}
                  {form.date && (
                    <div className="appt-step">
                      <div className="appt-step-num">6</div>
                      <div className="appt-step-body">
                        <label className="appt-label">Select Available Slot</label>

                        {loadSlots && (
                          <div className="appt-slots-loading">⏳ Checking availability...</div>
                        )}

                        {!loadSlots && slots.length === 0 && (
                          <div className="appt-slots-empty">
                            😞 No slots available for this doctor on the selected date.
                            Try another date or doctor.
                          </div>
                        )}

                        {!loadSlots && slots.length > 0 && (
                          <div className="appt-slots-grid">
                            {slots.map(s => (
                              <button
                                key={s}
                                type="button"
                                className={`appt-slot-btn ${form.slot === s ? "appt-slot-active" : ""}`}
                                onClick={() => handleField("slot", s)}
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
                      disabled={booking || !form.slot}
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

      {/* ── APPOINTMENTS LIST ─────────────────────────────── */}
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
            const isPast        = a.appointment_time ? new Date(a.appointment_time) < new Date() : false;
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
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#1b3d2a" }}>{a.doc}</span>
                    {a.is_emergency && (
                      <span className="appt-em-badge">🚨 EMERGENCY</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: "#7a9485", marginTop: 2 }}>
                    {a.dept}
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
                        ✗ Missed
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