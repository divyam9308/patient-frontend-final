import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import "./Dashboard.css";

/* ─── Mock user data ─── */
const USER = {
  name: "Arjun Sharma",
  email: "arjun.sharma@gmail.com",
  phone: "+91 98765 43210",
  dob: "14 March 1992",
  gender: "Male",
  bloodGroup: "B+",
  address: "42, Sector 17, Chandigarh, Punjab - 160017",
  aadhar: "7845 6231 9012",
  initials: "AS",
  role: "Patient",
  registeredSince: "Jan 2023",
  emergency: "Priya Sharma (Wife) — +91 98001 22334",
};

const APPOINTMENTS = [
  { id: 1, doc: "Dr. Meena Kapoor", dept: "Cardiology", day: "18", mon: "Apr", time: "10:30 AM", status: "upcoming" },
  { id: 2, doc: "Dr. Raj Verma", dept: "Dermatology", day: "24", mon: "Apr", time: "02:00 PM", status: "upcoming" },
  { id: 3, doc: "Dr. Anita Singh", dept: "General Medicine", day: "02", mon: "Apr", time: "11:00 AM", status: "completed" },
  { id: 4, doc: "Dr. Suresh Naidu", dept: "Orthopedics", day: "15", mon: "Mar", time: "09:00 AM", status: "completed" },
  { id: 5, doc: "Dr. Pooja Iyer", dept: "Neurology", day: "10", mon: "Mar", time: "03:30 PM", status: "cancelled" },
];

const MEDICATIONS = [
  { id: 1, name: "Metformin 500mg", purpose: "Diabetes management", freq: "Twice daily", icon: "💊", color: "#e8f5ee" },
  { id: 2, name: "Atorvastatin 20mg", purpose: "Cholesterol control", freq: "Once at night", icon: "🔵", color: "#eff6ff" },
  { id: 3, name: "Amlodipine 5mg", purpose: "Blood pressure", freq: "Once daily", icon: "❤️", color: "#fef2f2" },
  { id: 4, name: "Vitamin D3 1000 IU", purpose: "Bone health supplement", freq: "Once daily", icon: "🌟", color: "#fffbeb" },
];

const RECORDS = [
  { id: 1, name: "Blood Test Report — March 2025", date: "02 Mar 2025", type: "Lab Report", size: "1.2 MB", icon: "🧪", color: "#e8f5ee" },
  { id: 2, name: "Chest X-Ray — Jan 2025", date: "15 Jan 2025", type: "Radiology", size: "4.8 MB", icon: "🫁", color: "#eff6ff" },
  { id: 3, name: "ECG Report — Nov 2024", date: "20 Nov 2024", type: "Cardiology", size: "0.8 MB", icon: "❤️", color: "#fef2f2" },
  { id: 4, name: "Discharge Summary — Sep 2024", date: "10 Sep 2024", type: "Hospital Doc", size: "2.1 MB", icon: "🏥", color: "#fffbeb" },
  { id: 5, name: "Prescription — Dr. Verma Feb 2025", date: "28 Feb 2025", type: "Prescription", size: "0.3 MB", icon: "📋", color: "#f5f3ff" },
];

const TREATMENTS = [
  { id: 1, name: "Type 2 Diabetes Management", doc: "Dr. Meena Kapoor — Endocrinology", status: "ongoing", progress: 68, start: "Jan 2024", note: "Regular HbA1c monitoring. Diet control + Metformin." },
  { id: 2, name: "Hypertension Control", doc: "Dr. Raj Verma — Cardiology", status: "ongoing", progress: 55, start: "Mar 2024", note: "Target BP < 130/80 mmHg. Monthly check-ups advised." },
  { id: 3, name: "Vitamin D Deficiency", doc: "Dr. Anita Singh — General Medicine", status: "completed", progress: 100, start: "Aug 2023", note: "12-week supplementation completed. Levels normalised." },
];

/* ─── Stat Card ─── */
function StatCard({ icon, num, label, iconBg }) {
  return (
    <div className="db-stat-card">
      <div className="db-stat-icon" style={{ background: iconBg }}>{icon}</div>
      <div>
        <div className="db-stat-num">{num}</div>
        <div className="db-stat-label">{label}</div>
      </div>
    </div>
  );
}

/* ─── OVERVIEW TAB ─── */
function OverviewTab({ navigate }) {
  return (
    <div>
      <div className="db-welcome-banner">
        <div>
          <div className="db-welcome-title">Good morning, {USER.name.split(" ")[0]}! 👋</div>
          <div className="db-welcome-sub">You have 2 upcoming appointments this week.</div>
        </div>
        {/* ✅ navigates directly to the separate Appointments page */}
        <button className="db-welcome-btn" onClick={() => navigate("/appointments")}>
          View Appointments →
        </button>
      </div>

      <div className="db-stats-row">
        <StatCard icon="📅" num="2" label="Upcoming Appts" iconBg="#e8f5ee" />
        <StatCard icon="💊" num="4" label="Active Medicines" iconBg="#eff6ff" />
        <StatCard icon="📋" num="5" label="Medical Records" iconBg="#fef2f2" />
        <StatCard icon="🏥" num="3" label="Treatments" iconBg="#fffbeb" />
      </div>

      <div className="db-two-col">
        <div className="db-card">
          <div className="db-card-header">
            <div className="db-card-title">📅 Upcoming Appointments</div>
            {/* ✅ also navigates to the separate page */}
            <button className="db-card-action" onClick={() => navigate("/appointments")}>View all →</button>
          </div>
          <div className="db-appt-list">
            {APPOINTMENTS.filter(a => a.status === "upcoming").map(a => (
              <div className="db-appt-item" key={a.id}>
                <div className="db-appt-date-box">
                  <div className="db-appt-date-day">{a.day}</div>
                  <div className="db-appt-date-mon">{a.mon}</div>
                </div>
                <div className="db-appt-info">
                  <div className="db-appt-doc">{a.doc}</div>
                  <div className="db-appt-dept">{a.dept}</div>
                </div>
                <div className="db-appt-time">{a.time}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="db-card">
          <div className="db-card-header">
            <div className="db-card-title">💊 Current Medications</div>
            <button className="db-card-action" onClick={() => navigate("/medicines")}>View all →</button>
          </div>
          <div className="db-med-list">
            {MEDICATIONS.map(m => (
              <div className="db-med-item" key={m.id}>
                <div className="db-med-icon" style={{ background: m.color }}>{m.icon}</div>
                <div>
                  <div className="db-med-name">{m.name}</div>
                  <div className="db-med-dose">{m.purpose}</div>
                </div>
                <div className="db-med-freq">{m.freq}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="db-two-col">
        <div className="db-card">
          <div className="db-card-header">
            <div className="db-card-title">❤️ Latest Vitals</div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>As of 02 Apr 2025</span>
          </div>
          <div className="db-vitals-grid">
            <div className="db-vital-item">
              <div className="db-vital-label">Blood Pressure</div>
              <div className="db-vital-val">128<span className="db-vital-unit">/82 mmHg</span></div>
              <span className="db-vital-status status-watch">Watch</span>
            </div>
            <div className="db-vital-item">
              <div className="db-vital-label">Blood Sugar</div>
              <div className="db-vital-val">108<span className="db-vital-unit"> mg/dL</span></div>
              <span className="db-vital-status status-normal">Normal</span>
            </div>
            <div className="db-vital-item">
              <div className="db-vital-label">Heart Rate</div>
              <div className="db-vital-val">74<span className="db-vital-unit"> bpm</span></div>
              <span className="db-vital-status status-normal">Normal</span>
            </div>
            <div className="db-vital-item">
              <div className="db-vital-label">SpO₂</div>
              <div className="db-vital-val">98<span className="db-vital-unit">%</span></div>
              <span className="db-vital-status status-normal">Normal</span>
            </div>
            <div className="db-vital-item">
              <div className="db-vital-label">Weight</div>
              <div className="db-vital-val">78<span className="db-vital-unit"> kg</span></div>
              <span className="db-vital-status status-normal">Normal</span>
            </div>
            <div className="db-vital-item">
              <div className="db-vital-label">Temperature</div>
              <div className="db-vital-val">98.4<span className="db-vital-unit">°F</span></div>
              <span className="db-vital-status status-normal">Normal</span>
            </div>
          </div>
        </div>

        <div className="db-card">
          <div className="db-card-header">
            <div className="db-card-title">🏥 Active Treatments</div>
            <button className="db-card-action" onClick={() => navigate("/treatments")}>View all →</button>
          </div>
          <div className="db-treatment-list">
            {TREATMENTS.filter(t => t.status === "ongoing").map(t => (
              <div className="db-treatment-item" key={t.id} style={{ padding: "14px 16px" }}>
                <div className="db-treatment-header" style={{ marginBottom: 8 }}>
                  <div>
                    <div className="db-treatment-name" style={{ fontSize: 13.5 }}>{t.name}</div>
                    <div className="db-treatment-doc">{t.doc}</div>
                  </div>
                  <span className="db-treatment-status t-ongoing">Ongoing</span>
                </div>
                <div className="db-progress-bar">
                  <div className="db-progress-fill" style={{ width: `${t.progress}%` }} />
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{t.progress}% complete</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── PROFILE TAB ─── */
function ProfileTab() {
  return (
    <div>
      <div className="db-profile-top">
        <div className="db-profile-avatar-wrap">
          <div className="db-profile-avatar">{USER.initials}</div>
          <div className="db-profile-verified">✓</div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="db-profile-name">{USER.name}</div>
          <div className="db-profile-email">{USER.email} · {USER.phone}</div>
          <div className="db-profile-tags">
            <span className="db-profile-tag">🩸 {USER.bloodGroup}</span>
            <span className="db-profile-tag">👤 {USER.gender}</span>
            <span className="db-profile-tag">🎂 {USER.dob}</span>
            <span className="db-profile-tag">✅ Verified Patient</span>
          </div>
        </div>
        <button className="db-edit-btn" style={{ background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.35)", color: "white" }}>
          ✏️ Edit Profile
        </button>
      </div>

      <div className="db-two-col" style={{ marginBottom: 20 }}>
        <div className="db-aadhar-card">
          <div className="db-aadhar-header">
            <div>
              <div className="db-aadhar-gov">GOVERNMENT OF INDIA</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>Unique Identification Authority</div>
            </div>
            <div className="db-aadhar-emblem">🇮🇳</div>
          </div>
          <div className="db-aadhar-body">
            <div className="db-aadhar-photo">{USER.initials}</div>
            <div className="db-aadhar-info">
              <div className="db-aadhar-name">{USER.name}</div>
              <div className="db-aadhar-dob">DOB: {USER.dob} · {USER.gender}</div>
              <div className="db-aadhar-number">{USER.aadhar}</div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>आधार</div>
            </div>
          </div>
          <div className="db-aadhar-footer">
            <div className="db-aadhar-barcode">▮▯▮▮▯▮▯▮▮▯</div>
            <div className="db-aadhar-uidai">This document is digitally verified.<br />UIDAI · uidai.gov.in · 1947</div>
          </div>
        </div>

        <div className="db-card">
          <div className="db-card-header">
            <div className="db-card-title">👤 Personal Information</div>
            <button className="db-edit-btn">✏️ Edit</button>
          </div>
          <div className="db-info-grid">
            <div className="db-info-item">
              <div className="db-info-label">Full Name</div>
              <div className="db-info-value">{USER.name}</div>
            </div>
            <div className="db-info-item">
              <div className="db-info-label">Date of Birth</div>
              <div className="db-info-value">{USER.dob}</div>
            </div>
            <div className="db-info-item">
              <div className="db-info-label">Gender</div>
              <div className="db-info-value">{USER.gender}</div>
            </div>
            <div className="db-info-item">
              <div className="db-info-label">Blood Group</div>
              <div className="db-info-value" style={{ color: "var(--red)", fontWeight: 700 }}>{USER.bloodGroup}</div>
            </div>
            <div className="db-info-item" style={{ gridColumn: "1/-1" }}>
              <div className="db-info-label">Address</div>
              <div className="db-info-value">{USER.address}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="db-two-col">
        <div className="db-card">
          <div className="db-card-header">
            <div className="db-card-title">📞 Contact & Account</div>
            <button className="db-edit-btn">✏️ Edit</button>
          </div>
          <div className="db-info-grid">
            <div className="db-info-item">
              <div className="db-info-label">Email</div>
              <div className="db-info-value">{USER.email}</div>
            </div>
            <div className="db-info-item">
              <div className="db-info-label">Phone</div>
              <div className="db-info-value">{USER.phone}</div>
            </div>
            <div className="db-info-item">
              <div className="db-info-label">Member Since</div>
              <div className="db-info-value">{USER.registeredSince}</div>
            </div>
            <div className="db-info-item">
              <div className="db-info-label">Account Type</div>
              <div className="db-info-value">Patient · Free Plan</div>
            </div>
          </div>
        </div>

        <div className="db-card">
          <div className="db-card-header">
            <div className="db-card-title">🚨 Emergency Contact</div>
            <button className="db-edit-btn">✏️ Edit</button>
          </div>
          <div style={{ padding: "14px 16px", background: "var(--red-bg)", borderRadius: "var(--radius-sm)", border: "1px solid #fecaca", marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--red)", marginBottom: 4 }}>Emergency Contact</div>
            <div style={{ fontSize: 14, color: "var(--text-dark)", fontWeight: 500 }}>{USER.emergency}</div>
          </div>
          <div style={{ padding: "14px 16px", background: "var(--green-mist)", borderRadius: "var(--radius-sm)", border: "1px solid var(--green-border)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--green-dark)", marginBottom: 4 }}>Aadhar Linked</div>
            <div style={{ fontSize: 14, color: "var(--text-dark)", fontFamily: "monospace", letterSpacing: 2 }}>{USER.aadhar}</div>
          </div>
          <div style={{ marginTop: 16 }}>
            <div className="db-card-title" style={{ marginBottom: 12 }}>🔒 Security</div>
            <button className="db-edit-btn" style={{ width: "100%", justifyContent: "center", marginBottom: 8 }}>🔑 Change Password</button>
            <button className="db-edit-btn" style={{ width: "100%", justifyContent: "center" }}>📱 Two-Factor Authentication</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── MEDICAL RECORDS TAB ─── */
function RecordsTab() {
  return (
    <div>
      <div className="db-card">
        <div className="db-card-header">
          <div className="db-card-title">📁 Medical Records</div>
          <button className="db-new-appt-btn" style={{ margin: 0, padding: "8px 18px", fontSize: 13 }}>＋ Upload Record</button>
        </div>
        <div className="db-records-list">
          {RECORDS.map(r => (
            <div className="db-record-item" key={r.id}>
              <div className="db-record-icon" style={{ background: r.color }}>{r.icon}</div>
              <div className="db-record-info">
                <div className="db-record-name">{r.name}</div>
                <div className="db-record-meta">{r.type} · {r.date}</div>
              </div>
              <div className="db-record-size">{r.size}</div>
              <button className="db-record-dl">⬇ Download</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN DASHBOARD ─── */
export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState(location.state?.tab || "overview");

  useEffect(() => {
    if (location.state?.tab) {
      setTab(location.state.tab);
    }
  }, [location.state]);

  // ✅ handleTabChange is NOW inside the component
  //    so it has access to navigate and setTab
  const handleTabChange = (newTab) => {
    if (newTab === "appointments") {
      navigate("/appointments");
      return;
    }
    if (newTab === "records") {
      navigate("/records");
      return;
    }
    setTab(newTab);
  };

  const pageTitles = {
    overview: { title: "Dashboard", sub: "Welcome back, " + USER.name.split(" ")[0] },
    profile: { title: "My Profile", sub: "Manage your personal information and Aadhar details" },
    records: { title: "Medical Records", sub: "Access and download your health documents" },
  };

  return (
    <DashboardLayout activeTab={tab} onTabChange={handleTabChange}>
      <div className="db-page-title">{pageTitles[tab]?.title}</div>
      <div className="db-page-subtitle">{pageTitles[tab]?.sub}</div>

      {tab === "overview" && <OverviewTab navigate={navigate} />}
      {tab === "profile" && <ProfileTab />}
      {tab === "records" && <RecordsTab />}
    </DashboardLayout>
  );
}