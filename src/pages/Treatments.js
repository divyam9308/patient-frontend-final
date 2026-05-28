import React, { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { api } from "../utils/api.js";
import './Dashboard.css';
import "./Treatments.css";

export default function Treatments() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [treatments, setTreatments] = useState([]);
  const [loadingTreatments, setLoadingTreatments] = useState(true);

  // Diary log state
  const [diaryLogs, setDiaryLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState("");
  const [newLogText, setNewLogText] = useState("");
  const [savingLog, setSavingLog] = useState(false);

  // Fetch treatments
  useEffect(() => {
    api.get('/treatments')
      .then(data => {
        setTreatments(data);
        if (data.length > 0) setSelectedTreatmentId(data[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingTreatments(false));
  }, []);

  // Fetch diary logs
  useEffect(() => {
    api.get('/treatments/logs')
      .then(data => setDiaryLogs(data))
      .catch(() => {})
      .finally(() => setLoadingLogs(false));
  }, []);

  const handleAddLog = async (e) => {
    e.preventDefault();
    if (!newLogText.trim()) return;
    setSavingLog(true);
    try {
      const newLog = await api.post('/treatments/logs', {
        treatmentId: selectedTreatmentId || null,
        text: newLogText,
      });
      setDiaryLogs([newLog, ...diaryLogs]);
      setNewLogText("");
    } catch (err) {
      alert("Error saving log: " + err.message);
    } finally {
      setSavingLog(false);
    }
  };

  const filteredTreatments = treatments.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.doc.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout activeTab="treatments">
      <div className="t-content" style={{ padding: "0 0 80px 0", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Page heading */}
        <div className="db-page-title" style={{ textAlign: "left" }}>My Treatments</div>
        <div className="db-page-subtitle" style={{ textAlign: "left", marginBottom: 28 }}>
          Track active medical plans, progress milestones, and log daily recovery details.
        </div>

        {/* Filters & Actions */}
        <div className="t-filter-bar">
          <div className="t-search-wrap">
            <span className="t-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search treatments or physicians..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="t-search-input"
            />
          </div>
          <div className="t-filter-options">
            <button className={`t-filter-btn ${filterStatus === "all" ? "active" : ""}`} onClick={() => setFilterStatus("all")}>All</button>
            <button className={`t-filter-btn ${filterStatus === "ongoing" ? "active" : ""}`} onClick={() => setFilterStatus("ongoing")}>Ongoing</button>
            <button className={`t-filter-btn ${filterStatus === "completed" ? "active" : ""}`} onClick={() => setFilterStatus("completed")}>Completed</button>
          </div>
        </div>

        <div className="t-grid">
          {/* LEFT: Treatments list */}
          <div className="t-list-col">
            <h2 className="t-section-title">🩺 Active & Past Plans</h2>
            <div className="t-treatment-list">
              {loadingTreatments ? (
                <div className="t-empty-state"><div className="t-empty-icon">⏳</div><h3>Loading treatments...</h3></div>
              ) : filteredTreatments.length === 0 ? (
                <div className="t-empty-state">
                  <div className="t-empty-icon">📂</div>
                  <h3>No treatments found</h3>
                  <p>Try refining your search query or filters.</p>
                </div>
              ) : (
                filteredTreatments.map(t => (
                  <div className={`t-card ${t.status}`} key={t.id}>
                    <div className="t-card-header">
                      <div>
                        <h3 className="t-treatment-name">{t.name}</h3>
                        <div className="t-treatment-doc">{t.doc}</div>
                      </div>
                      <span className={`t-status-badge ${t.status}`}>
                        {t.status === "ongoing" ? "Ongoing" : "Completed"}
                      </span>
                    </div>

                    <div className="t-meta-row">
                      <span className="t-meta-item">📅 Started: <strong>{t.start}</strong></span>
                      {t.meds && t.meds.length > 0 && (
                        <div className="t-meds-tags">
                          {t.meds.map((m, idx) => (
                            <span className="t-med-pill" key={idx}>💊 {m}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {t.note && (
                      <div className="t-note-box">
                        <strong>Physician Note:</strong> {t.note}
                      </div>
                    )}

                    <div className="t-progress-section">
                      <div className="t-progress-header">
                        <span>Treatment Progress</span>
                        <span>{t.progress}%</span>
                      </div>
                      <div className="t-progress-bar">
                        <div className="t-progress-fill" style={{ width: `${t.progress}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: Interactive Diary Log */}
          <div className="t-diary-col">
            <div className="t-diary-card">
              <h2 className="t-section-title">✍️ Daily Patient Diary</h2>
              <p className="t-diary-desc">
                Log your vitals, symptoms, or comments. Regular tracking helps your doctor monitor your health journey.
              </p>

              <form onSubmit={handleAddLog} className="t-diary-form">
                <div className="t-field">
                  <label className="t-label">Select Treatment</label>
                  <select
                    className="t-select"
                    value={selectedTreatmentId}
                    onChange={(e) => setSelectedTreatmentId(e.target.value)}
                  >
                    {treatments.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="t-field">
                  <label className="t-label">How do you feel today?</label>
                  <textarea
                    rows="3"
                    className="t-textarea"
                    placeholder="E.g., Took medicine on time, blood pressure normal, feeling energetic."
                    value={newLogText}
                    onChange={(e) => setNewLogText(e.target.value)}
                  ></textarea>
                </div>
                <button type="submit" className="t-submit-btn" disabled={savingLog}>
                  {savingLog ? "Saving..." : "Save Diary Entry"}
                </button>
              </form>

              <div className="t-logs-wrapper">
                <h3 className="t-logs-title">Recent Activity Logs</h3>
                <div className="t-logs-list">
                  {loadingLogs ? (
                    <div style={{ padding: 16, color: "#7a9485", fontSize: 13 }}>Loading logs...</div>
                  ) : diaryLogs.length === 0 ? (
                    <div style={{ padding: 16, color: "#7a9485", fontSize: 13 }}>No diary entries yet. Add your first one above!</div>
                  ) : diaryLogs.map(log => (
                    <div className="t-log-item" key={log.id}>
                      <div className="t-log-meta">
                        <span className="t-log-date">{log.date}</span>
                        <span className="t-log-treatment">{log.treatment}</span>
                      </div>
                      <p className="t-log-text">{log.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
