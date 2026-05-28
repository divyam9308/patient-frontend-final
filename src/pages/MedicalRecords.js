import React, { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { api } from "../utils/api.js";
import "./Dashboard.css";
import "./MedicalRecords.css";


export default function MedicalRecords() {
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [uploading, setUploading] = useState(false);

  // Fetch records from backend on mount
  useEffect(() => {
    api.get('/medical-records')
      .then(data => setRecords(data))
      .catch(() => {})
      .finally(() => setLoadingRecords(false));
  }, []);
  
  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Upload Form state
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("Lab Report");
  const [newDoctor, setNewDoctor] = useState("");
  const [newFacility, setNewFacility] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newVitalsInput, setNewVitalsInput] = useState(""); // E.g. "Metric: Value, Metric: Value"
  const [selectedFile, setSelectedFile] = useState(null);

  // Sharing states
  const [activeShareId, setActiveShareId] = useState(null);
  const [copied, setCopied] = useState(false);

  // Filter records based on search and category tab
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.facility.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.type.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedCategory === "all") return true;
    if (selectedCategory === "lab" && r.type === "Lab Report") return true;
    if (selectedCategory === "imaging" && r.type === "Radiology") return true;
    if (selectedCategory === "prescriptions" && r.type === "Prescription") return true;
    if (selectedCategory === "other" && r.type !== "Lab Report" && r.type !== "Radiology" && r.type !== "Prescription") return true;

    return false;
  });

  // Handle Mock File Selector
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Handle Form Submission — saves to backend
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setUploading(true);

    // Parse Vitals string: "HbA1c: 6.0%, Vitamin D: 30"
    const parsedVitals = [];
    if (newVitalsInput.trim()) {
      const parts = newVitalsInput.split(",");
      parts.forEach((part) => {
        const colonIndex = part.indexOf(":");
        if (colonIndex !== -1) {
          const name = part.substring(0, colonIndex).trim();
          const value = part.substring(colonIndex + 1).trim();
          parsedVitals.push({ name, value, range: "Referenced", status: "Normal" });
        }
      });
    }

    // Assign color based on category
    let color = "#e8f5ee";
    let icon = "🧪";
    if (newType === "Radiology") { color = "#eff6ff"; icon = "🫁"; }
    else if (newType === "Cardiology") { color = "#fef2f2"; icon = "❤️"; }
    else if (newType === "Prescription") { color = "#f5f3ff"; icon = "📋"; }
    else if (newType === "Hospital Doc") { color = "#fffbeb"; icon = "🏥"; }
    else if (newType === "Other") { color = "#f0fdf4"; icon = "📁"; }

    const payload = {
      name: newTitle,
      type: newType,
      size: selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : "1.1 MB",
      icon,
      color,
      doctor: newDoctor || "Dr. Self Reported",
      facility: newFacility || "Personal Upload",
      notes: newNotes || "No notes provided.",
      vitals: parsedVitals.length > 0 ? parsedVitals : [{ name: "Document Status", value: "Archived", range: "N/A", status: "Normal" }]
    };

    try {
      const newRecord = await api.post('/medical-records', payload);
      setRecords([newRecord, ...records]);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }

    // Reset Form
    setNewTitle("");
    setNewType("Lab Report");
    setNewDoctor("");
    setNewFacility("");
    setNewDate("");
    setNewNotes("");
    setNewVitalsInput("");
    setSelectedFile(null);
    setShowUploadModal(false);
  };

  // Simulate file download
  const handleDownload = (e, name) => {
    e.stopPropagation(); // prevent modal opening
    alert(`Starting download for: ${name}\nFile size: Mock PDF file compiled successfully.`);
  };

  // Generate Doctor Sharing link
  const handleShareClick = (recordId) => {
    setActiveShareId(recordId);
    setCopied(false);
  };

  const copyShareLink = (link) => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout activeTab="records">
      <div className="mr-content">
        {/* Page Heading */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 className="db-page-title" style={{ textAlign: "left" }}>Medical Records</h1>
            <p className="db-page-subtitle" style={{ textAlign: "left", marginBottom: 28 }}>
              Securely store, manage, and share your clinical reports, prescriptions, and imaging tests.
            </p>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="mr-filter-bar">
          <div className="mr-search-wrap">
            <span className="mr-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by title, doctor, facility or type..."
              className="mr-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="mr-category-tabs">
            <button
              className={`mr-cat-btn ${selectedCategory === "all" ? "active" : ""}`}
              onClick={() => setSelectedCategory("all")}
            >
              All Records
            </button>
            <button
              className={`mr-cat-btn ${selectedCategory === "lab" ? "active" : ""}`}
              onClick={() => setSelectedCategory("lab")}
            >
              🧪 Lab Reports
            </button>
            <button
              className={`mr-cat-btn ${selectedCategory === "imaging" ? "active" : ""}`}
              onClick={() => setSelectedCategory("imaging")}
            >
              🫁 Imaging (X-Ray)
            </button>
            <button
              className={`mr-cat-btn ${selectedCategory === "prescriptions" ? "active" : ""}`}
              onClick={() => setSelectedCategory("prescriptions")}
            >
              📋 Prescriptions
            </button>
            <button
              className={`mr-cat-btn ${selectedCategory === "other" ? "active" : ""}`}
              onClick={() => setSelectedCategory("other")}
            >
              📁 Other
            </button>
          </div>
        </div>

        {/* Main Grid: Left is Records list, Right is Vitals Insights and Upload Card */}
        <div className="mr-grid">
          {/* LEFT: Records List */}
          <div className="mr-list-col">
            <div className="mr-list-card">
              <div className="mr-list-header">
                <h2 className="mr-section-title">📁 Patient Document Repository</h2>
                <span className="mr-count">{filteredRecords.length} records matching</span>
              </div>

              <div className="mr-records-container">
                {loadingRecords ? (
                  <div className="mr-empty-state">
                    <span className="mr-empty-icon">⏳</span>
                    <h3 className="mr-empty-title">Loading records...</h3>
                    <p className="mr-empty-desc">Fetching your medical documents from the server.</p>
                  </div>
                ) : filteredRecords.length === 0 ? (
                  <div className="mr-empty-state">
                    <span className="mr-empty-icon">📂</span>
                    <h3 className="mr-empty-title">No records found</h3>
                    <p className="mr-empty-desc">
                      Try updating your search query or select another category filter.
                    </p>
                  </div>
                ) : (
                  filteredRecords.map((r) => (
                    <div
                      className="mr-record-row"
                      key={r.id}
                      onClick={() => {
                        setSelectedRecord(r);
                        setActiveShareId(null);
                        setCopied(false);
                      }}
                    >
                      <div className="mr-record-icon-box" style={{ background: r.color }}>
                        {r.icon}
                      </div>
                      <div className="mr-record-main">
                        <h3 className="mr-record-name-text">{r.name}</h3>
                        <div className="mr-record-meta-text">
                          <span>{r.type}</span>
                          <span className="mr-record-meta-dot">•</span>
                          <span>{r.date}</span>
                          <span className="mr-record-meta-dot">•</span>
                          <span>{r.facility}</span>
                        </div>
                      </div>
                      <span className="mr-record-size-badge">{r.size}</span>
                      <div className="mr-record-action-group">
                        <button
                          className="mr-btn-action"
                          onClick={(e) => handleDownload(e, r.name)}
                        >
                          ⬇ Download
                        </button>
                        <button className="mr-btn-action secondary">
                          👁 View
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Upload CTA + Vitals Trend Summary */}
          <div className="mr-aside-col">
            {/* Upload CTA Card */}
            <div className="mr-upload-card">
              <h2 className="mr-upload-title">Got a new medical document?</h2>
              <p className="mr-upload-desc">
                Upload your blood tests, prescriptions, and radiology reports to extract key health vitals and securely share with doctors.
              </p>
              <button
                className="mr-upload-btn"
                onClick={() => setShowUploadModal(true)}
              >
                ＋ Upload Medical Record
              </button>
            </div>

            {/* Vitals parsed trends from records */}
            <div className="mr-insights-card">
              <div className="mr-insights-header">
                <h2 className="mr-section-title">📈 Key Vitals Trend Tracker</h2>
                <p className="mr-insights-subtitle">
                  Aggregated and parsed metrics from your laboratory and clinical reports:
                </p>
              </div>

              {records.length === 0 ? (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "40px 20px",
                  textAlign: "center",
                  background: "#fcfdfd",
                  borderRadius: "12px",
                  border: "1px dashed #e2e8f0",
                  marginTop: "16px"
                }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📊</div>
                  <h4 style={{ margin: "0 0 6px 0", color: "var(--text-primary)", fontWeight: 600 }}>No vitals tracked yet</h4>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                    Once you upload reports containing clinical results (like HbA1c, Vitamin D, or Cholesterol), your key metrics and trends will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="mr-vitals-trends-list">
                  {/* Glucose trend */}
                  <div className="mr-trend-item">
                    <div className="mr-trend-top">
                      <span className="mr-trend-label">HbA1c (Blood Sugar)</span>
                      <span className="mr-trend-status warning">Pre-diabetic</span>
                    </div>
                    <div className="mr-trend-middle">
                      <span className="mr-trend-value">6.2%</span>
                      <span className="mr-trend-change down">↓ -0.3% (from 6.5%)</span>
                    </div>
                    <div className="mr-sparkline-wrap">
                      <span>Aug 24: 6.8%</span>
                      <div className="mr-spark-bar-container">
                        <div
                          className="mr-spark-bar-fill"
                          style={{ width: "62%", background: "var(--amber)" }}
                        />
                      </div>
                      <span>Mar 25: 6.2%</span>
                    </div>
                  </div>

                  {/* Cholesterol Trend */}
                  <div className="mr-trend-item">
                    <div className="mr-trend-top">
                      <span className="mr-trend-label">Total Cholesterol</span>
                      <span className="mr-trend-status normal">Optimal</span>
                    </div>
                    <div className="mr-trend-middle">
                      <span className="mr-trend-value">180 mg/dL</span>
                      <span className="mr-trend-change down">↓ -15 mg/dL (from 195)</span>
                    </div>
                    <div className="mr-sparkline-wrap">
                      <span>Nov 24: 195</span>
                      <div className="mr-spark-bar-container">
                        <div
                          className="mr-spark-bar-fill"
                          style={{ width: "80%", background: "var(--green-cta)" }}
                        />
                      </div>
                      <span>Mar 25: 180</span>
                    </div>
                  </div>

                  {/* Vitamin D Trend */}
                  <div className="mr-trend-item">
                    <div className="mr-trend-top">
                      <span className="mr-trend-label">Vitamin D3</span>
                      <span className="mr-trend-status normal">Sufficient</span>
                    </div>
                    <div className="mr-trend-middle">
                      <span className="mr-trend-value">32 ng/mL</span>
                      <span className="mr-trend-change up-good">↑ +14 ng/mL (from 18)</span>
                    </div>
                    <div className="mr-sparkline-wrap">
                      <span>Aug 23: 18</span>
                      <div className="mr-spark-bar-container">
                        <div
                          className="mr-spark-bar-fill"
                          style={{ width: "100%", background: "var(--green-cta)" }}
                        />
                      </div>
                      <span>Mar 25: 32</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =============================================
          MODAL: UPLOAD RECORD
          ============================================= */}
      {showUploadModal && (
        <div className="mr-modal-overlay">
          <div className="mr-modal-container">
            <button
              className="mr-modal-close"
              onClick={() => setShowUploadModal(false)}
            >
              ✕
            </button>
            <div className="mr-modal-header">
              <h2 className="mr-modal-title">＋ Upload Medical Record</h2>
            </div>
            <form onSubmit={handleUploadSubmit}>
              <div className="mr-modal-body">
                <div className="mr-form">
                  <div className="mr-form-field">
                    <label className="mr-form-label">Document Title</label>
                    <input
                      type="text"
                      className="mr-form-input"
                      placeholder="e.g. Thyroid Panel Test, Dental Scan"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />
                  </div>

                  <div className="mr-form-row">
                    <div className="mr-form-field">
                      <label className="mr-form-label">Record Type</label>
                      <select
                        className="mr-form-select"
                        value={newType}
                        onChange={(e) => setNewType(e.target.value)}
                      >
                        <option value="Lab Report">Lab Report</option>
                        <option value="Radiology">Radiology (X-Ray/MRI)</option>
                        <option value="Cardiology">Cardiology (ECG)</option>
                        <option value="Prescription">Prescription</option>
                        <option value="Hospital Doc">Discharge / Clinic Summary</option>
                        <option value="Other">Other Document</option>
                      </select>
                    </div>

                    <div className="mr-form-field">
                      <label className="mr-form-label">Document Date</label>
                      <input
                        type="date"
                        className="mr-form-input"
                        required
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mr-form-row">
                    <div className="mr-form-field">
                      <label className="mr-form-label">Prescribing Physician</label>
                      <input
                        type="text"
                        className="mr-form-input"
                        placeholder="e.g. Dr. Ramesh Kumar"
                        value={newDoctor}
                        onChange={(e) => setNewDoctor(e.target.value)}
                      />
                    </div>

                    <div className="mr-form-field">
                      <label className="mr-form-label">Health Facility / Lab</label>
                      <input
                        type="text"
                        className="mr-form-input"
                        placeholder="e.g. Lal PathLabs"
                        value={newFacility}
                        onChange={(e) => setNewFacility(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mr-form-field">
                    <label className="mr-form-label">Extractable Key Vitals (Optional)</label>
                    <input
                      type="text"
                      className="mr-form-input"
                      placeholder="Format: Metric: Value, Metric: Value (e.g. TSH: 2.4 mIU/L, Thyroxine: 1.2 ng/dL)"
                      value={newVitalsInput}
                      onChange={(e) => setNewVitalsInput(e.target.value)}
                    />
                    <small style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 2 }}>
                      Separate multiple metrics with commas. They will display in your parsed vitals table.
                    </small>
                  </div>

                  <div className="mr-form-field">
                    <label className="mr-form-label">Physician Notes / Summary</label>
                    <textarea
                      rows="3"
                      className="mr-form-textarea"
                      placeholder="Add key remarks or diagnostic instructions..."
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                    />
                  </div>

                  <div className="mr-form-field">
                    <label className="mr-form-label">File Attachment</label>
                    <div
                      className="mr-drag-drop-zone"
                      onClick={() => document.getElementById("file-upload-input").click()}
                    >
                      <input
                        type="file"
                        id="file-upload-input"
                        style={{ display: "none" }}
                        onChange={handleFileSelect}
                      />
                      <span className="mr-drag-icon">📁</span>
                      <span className="mr-drag-title">Click to browse or drag file here</span>
                      <span className="mr-drag-subtitle">PDF, PNG, JPG up to 10MB</span>
                    </div>

                    {selectedFile && (
                      <div className="mr-selected-file-badge">
                        📄 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mr-modal-footer">
                <button
                  type="button"
                  className="mr-btn-action secondary"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="mr-btn-action" disabled={uploading}>
                  {uploading ? "Uploading..." : "Upload & Parse →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =============================================
          MODAL: VIEW DETAILED RECORD
          ============================================= */}
      {selectedRecord && (
        <div className="mr-modal-overlay">
          <div className="mr-modal-container" style={{ maxWidth: "800px" }}>
            <button
              className="mr-modal-close"
              onClick={() => setSelectedRecord(null)}
            >
              ✕
            </button>
            <div className="mr-modal-header">
              <h2 className="mr-modal-title">{selectedRecord.name}</h2>
            </div>
            <div className="mr-modal-body">
              <div className="mr-viewer-grid">
                {/* LEFT: Paper Document mockup graphic */}
                <div className="mr-doc-mock">
                  <div className="mr-doc-watermark">{selectedRecord.type.substring(0, 4).toUpperCase()}</div>
                  <div className="mr-doc-header">
                    <div className="mr-doc-logo">🏥 HealthCare</div>
                    <div className="mr-doc-title">CLINICAL DOC</div>
                  </div>
                  <div className="mr-doc-patient-info">
                    <div>
                      <strong>Patient:</strong> {(() => { try { return JSON.parse(localStorage.getItem('user'))?.name || 'Patient'; } catch { return 'Patient'; } })()}<br />
                      <strong>DOB:</strong> {(() => { try { return JSON.parse(localStorage.getItem('user'))?.dob || '—'; } catch { return '—'; } })()}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <strong>Date:</strong> {selectedRecord.date}<br />
                      <strong>Facility:</strong> {selectedRecord.facility.split(" ")[0]}
                    </div>
                  </div>
                  
                  <div className="mr-doc-skeleton-lines">
                    <div className="mr-doc-skeleton-line header"></div>
                    <div className="mr-doc-skeleton-line sub"></div>

                    {/* Show structured table mockup */}
                    <div className="mr-doc-table-mock">
                      <div className="mr-doc-table-header"></div>
                      {selectedRecord.vitals.map((v, i) => (
                        <div className="mr-doc-table-row" key={i}>
                          <div className="mr-doc-table-cell" style={{ width: "30%" }}></div>
                          <div className="mr-doc-table-cell" style={{ width: "20%" }}></div>
                          <div className="mr-doc-table-cell" style={{ width: "25%" }}></div>
                        </div>
                      ))}
                    </div>

                    {/* Cardiology Heartbeat ECG wave visual, or Radiology bones, or prescription pills */}
                    {selectedRecord.type === "Cardiology" && (
                      <div style={{ height: 28, width: "100%", opacity: 0.25, borderTop: "1px solid red", borderBottom: "1px solid red", background: "repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(239, 68, 68, 0.2) 10px, rgba(239, 68, 68, 0.2) 11px)", display: "flex", alignItems: "center" }}>
                        <span style={{ fontSize: 10, color: "red", fontFamily: "monospace", paddingLeft: 4 }}>ECG TRAIL: /\/\_/\_/\/\_</span>
                      </div>
                    )}
                    
                    {selectedRecord.type === "Radiology" && (
                      <div style={{ display: "flex", justifyContent: "center", padding: "10px 0", opacity: 0.2 }}>
                        <span style={{ fontSize: 26 }}>🩻</span>
                      </div>
                    )}

                    {selectedRecord.type === "Prescription" && (
                      <div style={{ display: "flex", justifyContent: "center", padding: "10px 0", opacity: 0.25 }}>
                        <span style={{ fontSize: 26 }}>💊📋</span>
                      </div>
                    )}

                    <div className="mr-doc-sign">
                      <div className="mr-doc-sign-line"></div>
                      Authorized Signatory
                    </div>
                  </div>
                </div>

                {/* RIGHT: Extracted clinical values + notes */}
                <div className="mr-viewer-details">
                  <div className="mr-viewer-section">
                    <span className="mr-viewer-label">Prescribing / Reviewing Doctor</span>
                    <span className="mr-viewer-value">{selectedRecord.doctor}</span>
                  </div>

                  <div className="mr-viewer-section">
                    <span className="mr-viewer-label">Performing Facility</span>
                    <span className="mr-viewer-facility">{selectedRecord.facility}</span>
                  </div>

                  <div className="mr-viewer-section">
                    <span className="mr-viewer-label">Parsed Health Vitals & Observations</span>
                    <table className="mr-vitals-table">
                      <thead>
                        <tr>
                          <th>Parameter</th>
                          <th>Observed Value</th>
                          <th>Reference Range</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRecord.vitals.map((v, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 600 }}>{v.name}</td>
                            <td>{v.value}</td>
                            <td>
                              <span style={{ color: "var(--text-muted)" }}>{v.range} </span>
                              {v.status !== "Normal" && (
                                <span className={`mr-vitals-status-pill ${v.status.toLowerCase()}`}>
                                  {v.status}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mr-viewer-section">
                    <span className="mr-viewer-label">Clinical Comments</span>
                    <p className="mr-viewer-notes">
                      {selectedRecord.notes}
                    </p>
                  </div>

                  {/* Secure Sharing Widget */}
                  <div className="mr-share-section">
                    <span className="mr-viewer-label">🔑 Secure Share Link (Doctor Portal)</span>
                    {activeShareId === selectedRecord.id ? (
                      <div>
                        <div className="mr-share-row">
                          <div className="mr-share-link-box">
                            {`https://healthcare-portal.in/share/records/${selectedRecord.id}-${Math.floor(100000 + Math.random() * 900000)}`}
                          </div>
                          <button
                            className="mr-share-copy-btn"
                            onClick={() =>
                              copyShareLink(
                                `https://healthcare-portal.in/share/records/${selectedRecord.id}`
                              )
                            }
                          >
                            {copied ? "Copied! ✓" : "Copy Link"}
                          </button>
                        </div>
                        <span className="mr-share-tip">
                          ⚠️ This link grants secure read-only access to this record and will auto-expire in 48 hours.
                        </span>
                      </div>
                    ) : (
                      <button
                        className="mr-btn-action"
                        style={{ width: "100%", padding: "10px", justifyContent: "center" }}
                        onClick={() => handleShareClick(selectedRecord.id)}
                      >
                        Generate Secure Shareable Link
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="mr-modal-footer">
              <button
                className="mr-btn-action secondary"
                onClick={() => handleDownload(null, selectedRecord.name)}
              >
                ⬇ Download PDF
              </button>
              <button
                className="mr-btn-action"
                onClick={() => setSelectedRecord(null)}
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
