import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import {
  api,
  getDoctorEmergencyAlerts,
  acceptEmergencyAlert,
  declineEmergencyAlert,
} from "../utils/api.js";
import "./Dashboard.css";

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
  const [stats, setStats] = useState({ upcomingAppts: 0, activeMedicines: 0, medicalRecords: 0, treatments: 0 });
  const [appointments, setAppointments] = useState([]);
  const [medications, setMedications] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; }
  });

  useEffect(() => {
    // Fetch dashboard summary (stats + upcoming appointments)
    api.get('/dashboard/summary').then(data => {
      setStats(data.stats);
      setAppointments(data.upcomingAppointments || []);
    }).catch(() => {});

    // Fetch medications for dashboard card
    api.get('/medicines').then(data => setMedications(data.slice(0, 4))).catch(() => {});

    // Fetch treatments for dashboard card
    api.get('/treatments').then(data => setTreatments(data.filter(t => t.status === 'ongoing').slice(0, 2))).catch(() => {});
  }, []);

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  return (
    <div>
      <div className="db-welcome-banner">
        <div>
          <div className="db-welcome-title">Good morning, {firstName}! 👋</div>
          <div className="db-welcome-sub">
            {stats.upcomingAppts > 0
              ? `You have ${stats.upcomingAppts} upcoming appointment${stats.upcomingAppts > 1 ? 's' : ''} this week.`
              : 'No upcoming appointments. Book one today!'}
          </div>
        </div>
        <button className="db-welcome-btn" onClick={() => navigate("/appointments")}>
          View Appointments →
        </button>
      </div>

      <div className="db-stats-row">
        <StatCard icon="📅" num={stats.upcomingAppts} label="Upcoming Appts" iconBg="#e8f5ee" />
        <StatCard icon="💊" num={stats.activeMedicines} label="Active Medicines" iconBg="#eff6ff" />
        <StatCard icon="📋" num={stats.medicalRecords} label="Medical Records" iconBg="#fef2f2" />
        <StatCard icon="🏥" num={stats.treatments} label="Treatments" iconBg="#fffbeb" />
      </div>

      <div className="db-two-col">
        <div className="db-card">
          <div className="db-card-header">
            <div className="db-card-title">📅 Upcoming Appointments</div>
            <button className="db-card-action" onClick={() => navigate("/appointments")}>View all →</button>
          </div>
          <div className="db-appt-list">
            {appointments.length === 0 ? (
              <div style={{ padding: '20px 16px', color: '#7a9485', fontSize: 13 }}>No upcoming appointments.</div>
            ) : appointments.map(a => (
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
            {medications.length === 0 ? (
              <div style={{ padding: '20px 16px', color: '#7a9485', fontSize: 13 }}>No medications on record.</div>
            ) : medications.map(m => (
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
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>As of last visit</span>
          </div>
          <div className="db-vitals-grid">
            <div className="db-vital-item">
              <div className="db-vital-label">Blood Pressure</div>
              <div className="db-vital-val">—<span className="db-vital-unit"> mmHg</span></div>
              <span className="db-vital-status status-normal">N/A</span>
            </div>
            <div className="db-vital-item">
              <div className="db-vital-label">Blood Sugar</div>
              <div className="db-vital-val">—<span className="db-vital-unit"> mg/dL</span></div>
              <span className="db-vital-status status-normal">N/A</span>
            </div>
            <div className="db-vital-item">
              <div className="db-vital-label">Heart Rate</div>
              <div className="db-vital-val">—<span className="db-vital-unit"> bpm</span></div>
              <span className="db-vital-status status-normal">N/A</span>
            </div>
            <div className="db-vital-item">
              <div className="db-vital-label">SpO₂</div>
              <div className="db-vital-val">—<span className="db-vital-unit">%</span></div>
              <span className="db-vital-status status-normal">N/A</span>
            </div>
            <div className="db-vital-item">
              <div className="db-vital-label">Weight</div>
              <div className="db-vital-val">—<span className="db-vital-unit"> kg</span></div>
              <span className="db-vital-status status-normal">N/A</span>
            </div>
            <div className="db-vital-item">
              <div className="db-vital-label">Temperature</div>
              <div className="db-vital-val">—<span className="db-vital-unit">°F</span></div>
              <span className="db-vital-status status-normal">N/A</span>
            </div>
          </div>
        </div>

        <div className="db-card">
          <div className="db-card-header">
            <div className="db-card-title">🏥 Active Treatments</div>
            <button className="db-card-action" onClick={() => navigate("/treatments")}>View all →</button>
          </div>
          <div className="db-treatment-list">
            {treatments.length === 0 ? (
              <div style={{ padding: '20px 16px', color: '#7a9485', fontSize: 13 }}>No active treatments.</div>
            ) : treatments.map(t => (
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
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; }
  });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    api.get('/dashboard/profile').then(data => {
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
    }).catch(() => {});
  }, []);

  const handleEdit = () => {
    setForm({
      name: user.name || '',
      phone: user.phone || '',
      dob: user.dob || '',
      gender: user.gender || '',
      bloodGroup: user.bloodGroup || user.blood_group || '',
      address: user.address || '',
      aadhar: user.aadhar || '',
      emergency: user.emergency || user.emergency_contact || '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.put('/dashboard/profile', form);
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      setEditing(false);
      setSaveMsg('Profile updated!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      setSaveMsg('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.initials || (user?.name ? user.name.split(' ').map(p => p[0]).join('').toUpperCase().substring(0, 2) : '??');
  const bloodGroup = user?.bloodGroup || user?.blood_group || '—';
  const emergency = user?.emergency || user?.emergency_contact || '—';
  const aadhar = user?.aadhar || '—';

  const formatDOB = (dob) => {
    if (!dob) return '—';
    const parts = dob.split('-');
    if (parts.length === 3) {
      return `${parts[2]} ${parts[1]} ${parts[0]}`;
    }
    return dob;
  };

  return (
    <div>
      {saveMsg && (
        <div style={{ padding: '10px 16px', background: '#eaf4ec', border: '1px solid #c8e6c9', borderRadius: 10, marginBottom: 16, color: '#2d6a3f', fontWeight: 600, fontSize: 13 }}>
          ✓ {saveMsg}
        </div>
      )}

      <div className="db-profile-top">
        <div className="db-profile-avatar-wrap">
          <div className="db-profile-avatar">{initials}</div>
          <div className="db-profile-verified">✓</div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="db-profile-name">{user?.name || '—'}</div>
          <div className="db-profile-email">{user?.email || '—'} · {user?.phone || '—'}</div>
          <div className="db-profile-tags">
            <span className="db-profile-tag">🩸 {bloodGroup}</span>
            <span className="db-profile-tag">👤 {user?.gender || '—'}</span>
            <span className="db-profile-tag">🎂 {formatDOB(user?.dob)}</span>
            <span className="db-profile-tag">✅ Verified Patient</span>
          </div>
        </div>
        <button className="db-edit-btn" style={{ background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.35)", color: "white", position: "relative", zIndex: 2 }} onClick={handleEdit}>
          ✏️ Edit Profile
        </button>
      </div>

      {editing && (
        <div className="db-card" style={{ marginBottom: 20 }}>
          <div className="db-card-header">
            <div className="db-card-title">✏️ Edit Profile</div>
          </div>
          <div className="db-info-grid">
            {[
              { label: 'Full Name', key: 'name', type: 'text' },
              { label: 'Phone', key: 'phone', type: 'text', maxLength: 10, pattern: /^\d*$/ },
              { label: 'Date of Birth', key: 'dob', type: 'date' },
              { label: 'Gender', key: 'gender', type: 'select', options: ['Male', 'Female', 'Other', 'Prefer not to say'] },
              { label: 'Blood Group', key: 'bloodGroup', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
              { label: 'Address', key: 'address', type: 'text' },
              { label: 'Aadhar', key: 'aadhar', type: 'text', maxLength: 12, pattern: /^\d*$/ },
              { label: 'Emergency Contact', key: 'emergency', type: 'text', maxLength: 10, pattern: /^\d*$/ },
            ].map(f => {
              const value = form[f.key] || '';
              return (
                <div key={f.key} className="db-info-item">
                  <div className="db-info-label" style={{ marginBottom: 4 }}>{f.label}</div>
                  {f.type === 'select' ? (
                    <select
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #d4e8da', fontSize: 13, fontFamily: 'inherit', background: 'white' }}
                      value={value}
                      onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    >
                      <option value="">Select {f.label}</option>
                      {f.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : f.maxLength ? (
                    <div style={{ position: 'relative', width: '100%' }}>
                      <input
                        type={f.type}
                        maxLength={f.maxLength}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: '1.5px solid #d4e8da',
                          fontSize: 14,
                          fontFamily: 'monospace',
                          letterSpacing: '2px',
                          background: 'transparent',
                          position: 'relative',
                          zIndex: 2,
                          color: '#1e3a2f',
                          fontWeight: '700'
                        }}
                        value={value}
                        onChange={e => {
                          const val = e.target.value;
                          if (f.pattern && !f.pattern.test(val)) return;
                          setForm({ ...form, [f.key]: val });
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          left: 13,
                          top: 11,
                          fontSize: 14,
                          fontFamily: 'monospace',
                          letterSpacing: '2px',
                          color: '#cbd5e1',
                          pointerEvents: 'none',
                          zIndex: 1,
                          fontWeight: '700',
                          whiteSpace: 'pre'
                        }}
                      >
                        <span style={{ color: 'transparent' }}>{value}</span>
                        {'X'.repeat(Math.max(0, f.maxLength - value.length))}
                      </div>
                    </div>
                  ) : (
                    <input
                      type={f.type}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #d4e8da', fontSize: 13, fontFamily: 'inherit' }}
                      value={value}
                      onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="db-new-appt-btn" style={{ margin: 0 }} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : '💾 Save Changes'}
            </button>
            <button className="db-edit-btn" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      )}

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
            <div className="db-aadhar-photo">{initials}</div>
            <div className="db-aadhar-info">
              <div className="db-aadhar-name">{user?.name || '—'}</div>
              <div className="db-aadhar-dob">DOB: {user?.dob || '—'} · {user?.gender || '—'}</div>
              <div className="db-aadhar-number">{aadhar}</div>
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
          </div>
          <div className="db-info-grid">
            <div className="db-info-item">
              <div className="db-info-label">Full Name</div>
              <div className="db-info-value">{user?.name || '—'}</div>
            </div>
            <div className="db-info-item">
              <div className="db-info-label">Date of Birth</div>
              <div className="db-info-value">{user?.dob || '—'}</div>
            </div>
            <div className="db-info-item">
              <div className="db-info-label">Gender</div>
              <div className="db-info-value">{user?.gender || '—'}</div>
            </div>
            <div className="db-info-item">
              <div className="db-info-label">Blood Group</div>
              <div className="db-info-value" style={{ color: "var(--red)", fontWeight: 700 }}>{bloodGroup}</div>
            </div>
            <div className="db-info-item" style={{ gridColumn: "1/-1" }}>
              <div className="db-info-label">Address</div>
              <div className="db-info-value">{user?.address || '—'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="db-two-col">
        <div className="db-card">
          <div className="db-card-header">
            <div className="db-card-title">📞 Contact & Account</div>
          </div>
          <div className="db-info-grid">
            <div className="db-info-item">
              <div className="db-info-label">Email</div>
              <div className="db-info-value">{user?.email || '—'}</div>
            </div>
            <div className="db-info-item">
              <div className="db-info-label">Phone</div>
              <div className="db-info-value">{user?.phone || '—'}</div>
            </div>
            <div className="db-info-item">
              <div className="db-info-label">Member Since</div>
              <div className="db-info-value">{user?.registeredSince || '—'}</div>
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
          </div>
          <div style={{ padding: "14px 16px", background: "var(--red-bg)", borderRadius: "var(--radius-sm)", border: "1px solid #fecaca", marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--red)", marginBottom: 4 }}>Emergency Contact</div>
            <div style={{ fontSize: 14, color: "var(--text-dark)", fontWeight: 500 }}>{emergency}</div>
          </div>
          <div style={{ padding: "14px 16px", background: "var(--green-mist)", borderRadius: "var(--radius-sm)", border: "1px solid var(--green-border)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--green-dark)", marginBottom: 4 }}>Aadhar Linked</div>
            <div style={{ fontSize: 14, color: "var(--text-dark)", fontFamily: "monospace", letterSpacing: 2 }}>{aadhar}</div>
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

/* ─── MEDICAL RECORDS TAB (lightweight, points to full page) ─── */
function RecordsTab() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/records'); }, [navigate]);
  return null;
}

function EmergencyAlertsTab() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState("");

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const doctorHospitalId = localStorage.getItem("doctor_hospital_id") || "";
      const data = await getDoctorEmergencyAlerts(doctorHospitalId);
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load emergency alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
    const timer = setInterval(loadAlerts, 15000);
    return () => clearInterval(timer);
  }, [loadAlerts]);

  const handleAccept = async (alert) => {
    const requestId = alert.emergency_request_id || alert.emergency_requests?.id;
    if (!requestId || !alert.doctor_hospital_id) return;

    setWorkingId(alert.id);
    try {
      await acceptEmergencyAlert(requestId, { doctor_hospital_id: alert.doctor_hospital_id });
      await loadAlerts();
    } catch (err) {
      setError(err.message || "Unable to accept emergency alert");
    } finally {
      setWorkingId("");
    }
  };

  const handleDecline = async (alert) => {
    const requestId = alert.emergency_request_id || alert.emergency_requests?.id;
    if (!requestId || !alert.doctor_hospital_id) return;

    setWorkingId(alert.id);
    try {
      await declineEmergencyAlert(requestId, { doctor_hospital_id: alert.doctor_hospital_id });
      setAlerts(prev => prev.filter(item => item.id !== alert.id));
    } catch (err) {
      setError(err.message || "Unable to decline emergency alert");
    } finally {
      setWorkingId("");
    }
  };

  return (
    <div className="db-emergency-alerts">
      {error && <div className="db-alert-error">{error}</div>}

      <div className="db-card">
        <div className="db-card-header">
          <div className="db-card-title">Emergency Alerts</div>
          <button className="db-card-action" onClick={loadAlerts}>Refresh</button>
        </div>

        {loading ? (
          <div className="db-empty-state">Loading emergency alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="db-empty-state">No open emergency alerts right now.</div>
        ) : (
          <div className="db-alert-list">
            {alerts.map(alert => {
              const request = alert.emergency_requests || {};
              const hospital = request.hospitals?.name || "Selected hospital";
              const department = request.departments?.name || "Department";
              const requestedAt = request.created_at
                ? new Date(request.created_at).toLocaleString()
                : "Just now";

              return (
                <div className="db-alert-item" key={alert.id}>
                  <div className="db-alert-main">
                    <div className="db-alert-topline">
                      <span className="db-alert-pill">Open</span>
                      <span className="db-alert-time">{requestedAt}</span>
                    </div>
                    <div className="db-alert-symptoms">{request.symptoms || "Emergency symptoms not listed"}</div>
                    <div className="db-alert-meta">{hospital} - {department}</div>
                    <div className="db-alert-meta">
                      Location: {request.patient_location || "Not provided"}
                      {request.patient_phone && <> - Phone: {request.patient_phone}</>}
                    </div>
                    <div className="db-alert-meta">
                      Ambulance requested: {request.ambulance_requested ? "Yes" : "No"}
                      {request.ambulance_status && <> - Status: {request.ambulance_status}</>}
                    </div>
                  </div>
                  <div className="db-alert-actions">
                    <button
                      className="db-alert-accept"
                      disabled={workingId === alert.id}
                      onClick={() => handleAccept(alert)}
                    >
                      {workingId === alert.id ? "Working..." : "Accept"}
                    </button>
                    <button
                      className="db-alert-decline"
                      disabled={workingId === alert.id}
                      onClick={() => handleDecline(alert)}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

  const user = (() => { try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; } })();

  const pageTitles = {
    overview: { title: "Dashboard", sub: "Welcome back, " + (user?.name ? user.name.split(' ')[0] : 'there') },
    profile: { title: "My Profile", sub: "Manage your personal information and Aadhar details" },
    records: { title: "Medical Records", sub: "Access and download your health documents" },
    "emergency-alerts": { title: "Emergency Alerts", sub: "Open emergency requests waiting for doctor response" },
  };

  return (
    <DashboardLayout activeTab={tab} onTabChange={handleTabChange}>
      <div className="db-page-title">{pageTitles[tab]?.title}</div>
      <div className="db-page-subtitle">{pageTitles[tab]?.sub}</div>

      {tab === "overview" && <OverviewTab navigate={navigate} />}
      {tab === "profile" && <ProfileTab />}
      {tab === "records" && <RecordsTab />}
      {tab === "emergency-alerts" && <EmergencyAlertsTab />}
    </DashboardLayout>
  );
}
