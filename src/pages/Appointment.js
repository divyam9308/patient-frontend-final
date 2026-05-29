import React, { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { api } from "../utils/api.js";
import "./Dashboard.css";

const STATUS_STYLES = {
  upcoming: { label: "Upcoming", color: "#2d6a3f", bg: "#eaf4ec", border: "#c8e6c9" },
  completed: { label: "Completed", color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  cancelled: { label: "Cancelled", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  missed: { label: "Missed", color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
};

export default function Appointment() {
  const [filter, setFilter] = useState("all");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [bookForm, setBookForm] = useState({ doc: "", dept: "", date: "", time: "" });
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  const fetchAppointments = () => {
    setLoading(true);
    api.get('/appointments')
      .then(data => setAppointments(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const filtered = appointments.filter(a => {
    const isPast = a.appointment_time ? new Date(a.appointment_time) < new Date() : false;
    const displayStatus = (a.status === 'upcoming' && isPast) ? 'completed' : a.status;
    if (filter === "all") return true;
    return displayStatus === filter;
  });

  const handleBook = async (e) => {
    e.preventDefault();
    setBookError("");
    setBooking(true);
    try {
      const newAppt = await api.post('/appointments', bookForm);
      setAppointments([newAppt, ...appointments]);
      setShowBooking(false);
      setBookForm({ doc: "", dept: "", date: "", time: "" });
    } catch (err) {
      setBookError(err.message || "Failed to book appointment");
    } finally {
      setBooking(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this appointment?")) return;
    setCancellingId(id);
    try {
      await api.delete(`/appointments/${id}`);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
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

  return (
    <DashboardLayout activeTab="appointments">
      {/* Page heading */}
      <div className="db-page-title">Appointments</div>
      <div className="db-page-subtitle">Your upcoming and past appointments</div>

      {/* Book button */}
      <button
        className="db-new-appt-btn"
        style={{ marginBottom: 28 }}
        onClick={() => setShowBooking(true)}
      >
        + Book New Appointment
      </button>

      {/* Book New Appointment modal */}
      {showBooking && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: 32, width: 420,
            boxShadow: "0 8px 40px rgba(45,106,63,0.18)", fontFamily: "'DM Sans', sans-serif"
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#1b3d2a", marginBottom: 6 }}>
              Book New Appointment
            </div>
            <div style={{ fontSize: 13, color: "#7a9485", marginBottom: 24 }}>
              Fill in the details to schedule a visit
            </div>

            {bookError && (
              <div style={{ color: "#dc2626", background: "#fef2f2", padding: "8px 12px", borderRadius: 8, border: "1px solid #fecaca", fontSize: 13, marginBottom: 14 }}>
                ⚠️ {bookError}
              </div>
            )}

            <form onSubmit={handleBook}>
              {[
                { label: "Doctor / Specialist", key: "doc", placeholder: "e.g. Dr. Mehta — Cardiology", type: "text" },
                { label: "Department", key: "dept", placeholder: "e.g. Cardiology", type: "text" },
                { label: "Preferred Date", key: "date", type: "date" },
                { label: "Preferred Time (24hr)", key: "time", type: "time" },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#4a6355", display: "block", marginBottom: 6 }}>
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={bookForm[f.key]}
                    onChange={e => setBookForm({ ...bookForm, [f.key]: e.target.value })}
                    required
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: 10,
                      border: "1.5px solid #d4e8da", fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                      background: "#f0f8f2", outline: "none", boxSizing: "border-box"
                    }}
                  />
                </div>
              ))}

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => { setShowBooking(false); setBookError(""); }}
                  style={{
                    flex: 1, padding: "11px", borderRadius: 50, border: "1.5px solid #d4e8da",
                    background: "transparent", fontSize: 14, fontWeight: 600, color: "#4a6355", cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={booking}
                  style={{
                    flex: 1, padding: "11px", borderRadius: 50, border: "none",
                    background: "#2d6a3f", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                    opacity: booking ? 0.7 : 1
                  }}
                >
                  {booking ? "Booking..." : "Confirm Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main card */}
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
          background: "#f0f8f2", borderBottom: "1px solid #d4e8da"
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

        {/* Appointments list */}
        <div>
          {loading ? (
            <div style={{ padding: "48px 28px", textAlign: "center", color: "#7a9485", fontSize: 14 }}>
              Loading appointments...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "48px 28px", textAlign: "center", color: "#7a9485", fontSize: 14 }}>
              No {filter === 'all' ? '' : filter} appointments found.
            </div>
          ) : filtered.map((a, i) => {
            const isPast = a.appointment_time ? new Date(a.appointment_time) < new Date() : false;
            const displayStatus = (a.status === 'upcoming' && isPast) ? 'completed' : a.status;
            const s = STATUS_STYLES[displayStatus] || STATUS_STYLES.upcoming;
            return (
              <div
                key={a.id}
                style={{
                  display: "flex", alignItems: "center", gap: 18,
                  padding: "18px 28px",
                  borderBottom: i < filtered.length - 1 ? "1px solid #eaf4ec" : "none",
                  transition: "background 0.15s"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#f0f8f2"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {/* Date badge */}
                <div style={{
                  width: 52, minWidth: 52, height: 56, borderRadius: 12,
                  background: "#2d6a3f", color: "#fff",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center"
                }}>
                  <span style={{ fontSize: 18, fontWeight: 800, lineHeight: 1 }}>{a.day}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.85 }}>{a.mon}</span>
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1b3d2a" }}>{a.doc}</div>
                  <div style={{ fontSize: 13, color: "#7a9485", marginTop: 2 }}>
                    {a.dept} · {a.time}
                  </div>
                </div>

                {/* Status + action */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    padding: "4px 12px", borderRadius: 50,
                    background: a.status === 'upcoming' && isPast ? '#f3f4f6' : s.bg,
                    color: a.status === 'upcoming' && isPast ? '#4b5563' : s.color,
                    border: `1px solid ${a.status === 'upcoming' && isPast ? '#e5e7eb' : s.border}`,
                    fontSize: 12, fontWeight: 700
                  }}>
                    {a.status === 'upcoming' && isPast ? 'Past Appointment' : s.label}
                  </span>

                  {a.status === "upcoming" && !isPast && (
                    <button
                      onClick={() => handleCancel(a.id)}
                      disabled={cancellingId === a.id}
                      style={{
                        padding: "6px 16px", borderRadius: 50,
                        border: "1.5px solid #fecaca", background: "#fff",
                        color: "#dc2626", fontSize: 12, fontWeight: 600,
                        cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                        opacity: cancellingId === a.id ? 0.6 : 1
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
                          color: "#1d4ed8", fontSize: 12, fontWeight: 600,
                          cursor: "pointer", fontFamily: "'DM Sans', sans-serif"
                        }}
                      >
                        ✓ Completed
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(a.id, "missed")}
                        style={{
                          padding: "6px 12px", borderRadius: 50,
                          border: "1.5px solid #fde68a", background: "#fffbeb",
                          color: "#b45309", fontSize: 12, fontWeight: 600,
                          cursor: "pointer", fontFamily: "'DM Sans', sans-serif"
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