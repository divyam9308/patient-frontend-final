import React, { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import "./Dashboard.css";

const APPOINTMENTS = [
  { id: 1, doc: "Dr. Meena Kapoor", dept: "Cardiology", day: "18", mon: "APR", time: "10:30 AM", status: "upcoming" },
  { id: 2, doc: "Dr. Raj Verma", dept: "Dermatology", day: "24", mon: "APR", time: "02:00 PM", status: "upcoming" },
  { id: 3, doc: "Dr. Anita Singh", dept: "General Medicine", day: "02", mon: "APR", time: "11:00 AM", status: "completed" },
  { id: 4, doc: "Dr. Suresh Naidu", dept: "Orthopedics", day: "15", mon: "MAR", time: "09:00 AM", status: "completed" },
  { id: 5, doc: "Dr. Pooja Iyer", dept: "Neurology", day: "10", mon: "MAR", time: "03:30 PM", status: "cancelled" },
];

const STATUS_STYLES = {
  upcoming: { label: "Upcoming", color: "#2d6a3f", bg: "#eaf4ec", border: "#c8e6c9" },
  completed: { label: "Completed", color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  cancelled: { label: "Cancelled", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

export default function Appointment() {
  const [filter, setFilter] = useState("all");
  const [showBooking, setShowBooking] = useState(false);

  const filtered = filter === "all"
    ? APPOINTMENTS
    : APPOINTMENTS.filter(a => a.status === filter);

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

      {/* Book New Appointment modal (simple) */}
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

            {[
              { label: "Doctor / Specialist", placeholder: "e.g. Dr. Mehta — Cardiology" },
              { label: "Preferred Date", placeholder: "DD / MM / YYYY", type: "date" },
              { label: "Preferred Time", placeholder: "e.g. 10:30 AM", type: "time" },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#4a6355", display: "block", marginBottom: 6 }}>
                  {f.label}
                </label>
                <input
                  type={f.type || "text"}
                  placeholder={f.placeholder}
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
                onClick={() => setShowBooking(false)}
                style={{
                  flex: 1, padding: "11px", borderRadius: 50, border: "1.5px solid #d4e8da",
                  background: "transparent", fontSize: 14, fontWeight: 600, color: "#4a6355", cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowBooking(false)}
                style={{
                  flex: 1, padding: "11px", borderRadius: 50, border: "none",
                  background: "#2d6a3f", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer"
                }}
              >
                Confirm Booking
              </button>
            </div>
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
            {APPOINTMENTS.length} total
          </span>
        </div>

        {/* Filter tabs */}
        <div style={{
          display: "flex", gap: 8, padding: "14px 28px",
          background: "#f0f8f2", borderBottom: "1px solid #d4e8da"
        }}>
          {["all", "upcoming", "completed", "cancelled"].map(f => (
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
          {filtered.map((a, i) => {
            const s = STATUS_STYLES[a.status];
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
                    background: s.bg, color: s.color,
                    border: `1px solid ${s.border}`,
                    fontSize: 12, fontWeight: 700
                  }}>
                    {s.label}
                  </span>

                  {a.status === "upcoming" && (
                    <button style={{
                      padding: "6px 16px", borderRadius: 50,
                      border: "1.5px solid #d4e8da", background: "#fff",
                      color: "#4a6355", fontSize: 12, fontWeight: 600,
                      cursor: "pointer", fontFamily: "'DM Sans', sans-serif"
                    }}>
                      Reschedule
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div style={{ padding: "48px 28px", textAlign: "center", color: "#7a9485", fontSize: 14 }}>
              No {filter} appointments found.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}