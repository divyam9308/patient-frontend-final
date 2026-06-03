import React, { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { api } from "../utils/api.js";
import { analyzeLabReport, extractTextFromFile } from "../utils/labReportAnalyzer.js";
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
  const [reportText, setReportText] = useState("");
  const [parseStatus, setParseStatus] = useState("");
  const [parseError, setParseError] = useState("");
  const [parsedVitalsPreview, setParsedVitalsPreview] = useState([]);

  // Sharing states
  const [activeShareId, setActiveShareId] = useState(null);
  const [copied, setCopied] = useState(false);

  // Filter records based on search and category tab
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      (r.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.doctor || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.facility || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.type || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedCategory === "all") return true;
    if (selectedCategory === "lab" && r.type === "Lab Report") return true;
    if (selectedCategory === "imaging" && r.type === "Radiology") return true;
    if (selectedCategory === "prescriptions" && r.type === "Prescription") return true;
    if (selectedCategory === "other" && r.type !== "Lab Report" && r.type !== "Radiology" && r.type !== "Prescription") return true;

    return false;
  });

  const runAnalysisForText = (text) => {
    const result = analyzeLabReport(text);
    setParsedVitalsPreview(result.vitals);
    return result;
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setReportText("");
    setParseStatus("");
    setParseError("");
    setParsedVitalsPreview([]);
    const input = document.getElementById("file-upload-input");
    if (input) input.value = "";
  };

  // Handle File Selector and parse readable report text.
  const handleFileSelect = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setParseError("");
      setParseStatus("Reading report...");
      if (!newTitle.trim()) {
        setNewTitle(file.name.replace(/\.[^.]+$/, ""));
      }

      try {
        await new Promise(resolve => setTimeout(resolve, 20));
        const text = await extractTextFromFile(file);
        setReportText(text);
        const result = runAnalysisForText(text);
        if (!text.trim()) {
          setParseError("This file did not expose readable lab values. Add the important values manually below if it is a scanned image.");
        } else if (!result.vitals.length) {
          setParseError("Readable text was found, but no supported lab values were detected. Add missing values manually below if needed.");
        }
      } catch (err) {
        setParseError(err.message || "Unable to read this file. Add the important values manually below if needed.");
      } finally {
        setParseStatus("");
      }
    }
  };

  // Handle Form Submission — saves to backend
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setUploading(true);

    const reportResult = runAnalysisForText(reportText);
    const parsedVitals = reportResult.vitals.filter(vital => vital.valid);

    if (newVitalsInput.trim()) {
      const manualResult = analyzeLabReport(newVitalsInput.replace(/,/g, "\n"));
      manualResult.vitals.filter(vital => vital.valid).forEach((manualVital) => {
        const existingIndex = parsedVitals.findIndex(vital => vital.name === manualVital.name);
        if (existingIndex === -1) {
          parsedVitals.push(manualVital);
        } else {
          parsedVitals[existingIndex] = manualVital;
        }
      });
    }

    const finalAnalysis = analyzeLabReport(
      `${reportText}\n${newVitalsInput.replace(/,/g, "\n")}`
    ).analysis;

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
      notes: newNotes || (
        finalAnalysis.abnormalCount
          ? `${finalAnalysis.abnormalCount} abnormal lab level${finalAnalysis.abnormalCount === 1 ? "" : "s"} detected.`
          : "No abnormal supported lab levels detected."
      ),
      vitals: parsedVitals,
      analysis: finalAnalysis,
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
    setReportText("");
    setParseStatus("");
    setParseError("");
    setParsedVitalsPreview([]);
    setShowUploadModal(false);
  };

  // Simulate file download
  const handleDownload = (e, name) => {
    if (e) e.stopPropagation(); // prevent modal opening
    alert(`Starting download for: ${name}\nFile size: Mock PDF file compiled successfully.`);
  };

  // Delete medical record from backend and local state
  const handleDeleteRecord = async (e, recordId) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this medical record? This will also remove any vitals associated with it.")) {
      return;
    }
    try {
      await api.delete(`/medical-records/${recordId}`);
      setRecords(records.filter(r => r.id !== recordId));
      if (selectedRecord && selectedRecord.id === recordId) {
        setSelectedRecord(null);
      }
    } catch (err) {
      alert("Failed to delete medical record: " + err.message);
    }
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

  const statusText = (status) => String(status || "").toLowerCase();
  const displayStatus = (status) => {
    const value = statusText(status);
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : "Uncertain";
  };
  const sourcePage = (vital) => Number(vital.source_page || vital.sourcePage || 0);
  const confidence = (vital) => Number(vital.confidence || 0);
  const isConfirmedAbnormal = (vital) =>
    ["high", "low", "critical"].includes(statusText(vital.status));
  const vitalValueClass = (status) => `mr-vital-value ${statusText(status) || "uncertain"}`;
  const trackerStatus = (vital) => {
    const value = statusText(vital.status);
    if (value === "normal") return "normal";
    if (value === "critical") return "critical";
    if (value === "high") return "high";
    return "borderline";
  };

  const trendItems = records
    .flatMap(record => (record.vitals || []).map(vital => ({ ...vital, recordName: record.name, recordDate: record.date })))
    .filter(vital => vital.name && vital.value && vital.valid !== false);
  const groupedTrendItems = {
    normal: trendItems.filter(vital => trackerStatus(vital) === "normal"),
    borderline: trendItems.filter(vital => trackerStatus(vital) === "borderline"),
    high: trendItems.filter(vital => trackerStatus(vital) === "high"),
    critical: trendItems.filter(vital => trackerStatus(vital) === "critical"),
  };

  const validPreview = parsedVitalsPreview.filter(v => v.valid);
  const abnormalRecordVitals = selectedRecord
    ? (selectedRecord.vitals || []).filter(isConfirmedAbnormal)
    : [];
  const selectedRecordFindings = [];

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
                        <button
                          className="mr-btn-action danger"
                          onClick={(e) => handleDeleteRecord(e, r.id)}
                          style={{
                            background: "#fee2e2",
                            color: "#b91c1c",
                            borderColor: "#fca5a5"
                          }}
                        >
                          🗑️ Delete
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

              {trendItems.length === 0 ? (
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
                  {trendItems.map((vital, index) => (
                    <div className="mr-trend-item" key={`${vital.recordName}-${vital.name}-${index}`}>
                      <div className="mr-trend-top">
                        <span className="mr-trend-label">{vital.name}</span>
                        <span className={`mr-trend-status ${statusText(vital.status)}`}>
                          {displayStatus(vital.status)}
                        </span>
                      </div>
                      <div className="mr-trend-middle">
                        <span className="mr-trend-value">{vital.value} {vital.unit || ""}</span>
                        <span className="mr-trend-change up-bad">
                          Confirmed row match
                        </span>
                      </div>
                      <div className="mr-sparkline-wrap">
                        <span>{vital.recordDate}</span>
                        <div className="mr-spark-bar-container">
                          <div
                            className="mr-spark-bar-fill"
                            style={{
                              width: "100%",
                              background: "var(--red)",
                            }}
                          />
                        </div>
                        <span>{vital.recordName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mr-insights-card mr-tracker-section">
          <div className="mr-insights-header">
            <h2 className="mr-section-title">Key Vitals Trend Tracker</h2>
            <p className="mr-insights-subtitle">
              Aggregated and parsed metrics from your uploaded medical records.
            </p>
          </div>

          {trendItems.length === 0 ? (
            <div className="mr-tracker-empty">
              <div className="mr-tracker-empty-icon">Vitals</div>
              <h4>No vitals tracked yet</h4>
              <p>
                Once you upload reports containing clinical results, your key metrics will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="mr-tracker-groups">
              {[
                { key: "normal", title: "Normal", items: groupedTrendItems.normal },
                { key: "borderline", title: "Borderline", items: groupedTrendItems.borderline },
                { key: "high", title: "High", items: groupedTrendItems.high },
                { key: "critical", title: "Critical", items: groupedTrendItems.critical },
              ].map(group => (
                <section className={`mr-tracker-group ${group.key}`} key={group.key}>
                  <div className="mr-tracker-group-header">
                    <h3>{group.title}</h3>
                    <span>{group.items.length}</span>
                  </div>
                  {group.items.length === 0 ? (
                    <p className="mr-tracker-empty-group">No {group.title.toLowerCase()} vitals.</p>
                  ) : (
                    <div className="mr-vitals-trends-list">
                      {group.items.map((vital, index) => (
                        <div className={`mr-trend-item ${trackerStatus(vital)}`} key={`${group.key}-${vital.recordName}-${vital.name}-${index}`}>
                          <div className="mr-trend-top">
                            <span className="mr-trend-label">{vital.name}</span>
                            <span className={`mr-trend-status ${trackerStatus(vital)}`}>
                              {group.title}
                            </span>
                          </div>
                          <div className="mr-trend-middle">
                            <span className={`mr-trend-value ${trackerStatus(vital)}`}>
                              {vital.value} {vital.unit || ""}
                            </span>
                            <span className="mr-trend-change">
                              {vital.reference_range || vital.range || "No report range"}
                            </span>
                          </div>
                          <div className="mr-sparkline-wrap">
                            <span>{vital.recordDate || "Date not set"}</span>
                            <div className="mr-spark-bar-container">
                              <div className={`mr-spark-bar-fill ${trackerStatus(vital)}`} style={{ width: "100%" }} />
                            </div>
                            <span>{vital.recordName}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
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
                    <label className="mr-form-label">Add Missing Lab Values (Optional)</label>
                    <input
                      type="text"
                      className="mr-form-input"
                      placeholder="Only if the upload misses something: TSH: 7.8, Vitamin D: 18"
                      value={newVitalsInput}
                      onChange={(e) => setNewVitalsInput(e.target.value)}
                    />
                    <small style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 2 }}>
                      The app classifies these values too. Use commas between values.
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
                        <span>
                        📄 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                        </span>
                        <button type="button" onClick={clearSelectedFile}>
                          Remove
                        </button>
                      </div>
                    )}
                    {parseStatus && <div className="mr-parse-status">{parseStatus}</div>}
                    {parseError && <div className="mr-parse-error">{parseError}</div>}
                  </div>

                  {false && parsedVitalsPreview.length > 0 && (
                    <div className="mr-ai-preview-card">
                      <div className="mr-ai-preview-title">
                        {validPreview.length > 0 ? `⚠️ ${validPreview.length} Abnormal Level${validPreview.length === 1 ? '' : 's'} Detected` : '✅ All Detected Levels Normal'}
                      </div>
                      {validPreview.length > 0 ? (
                        <div className="mr-abnormal-list">
                          {validPreview.map((vital, index) => (
                            <div key={`${vital.name}-${index}`} className="mr-abnormal-item-v2">
                              <div className="mr-abnormal-item-header">
                                <strong className="mr-abnormal-name">{vital.name}</strong>
                                <span className={`mr-vitals-status-pill ${vital.status.toLowerCase()}`}>
                                  {vital.status}
                                </span>
                              </div>
                              <div className="mr-abnormal-values-row">
                                <span className="mr-abnormal-current-val">Current: <b>{vital.value}</b></span>
                                <span className="mr-abnormal-ref-val">Normal Range: {vital.range}</span>
                              </div>
                              {vital.possibleConditions?.length > 0 && (
                                <div className="mr-abnormal-conditions">
                                  <span className="mr-abnormal-conditions-label">Possible causes:</span>
                                  <div className="mr-abnormal-conditions-list">
                                    {vital.possibleConditions.map((cond, ci) => (
                                      <span key={ci} className="mr-condition-tag">{cond}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: 13, color: 'var(--text-mid)', margin: '8px 0 0' }}>No abnormal supported lab levels were detected from the readable values.</p>
                      )}
                    </div>
                  )}
                  
                  {parsedVitalsPreview.length > 0 && (
                    <div className="mr-ai-preview-card">
                      <div className="mr-ai-preview-title">
                        {validPreview.length > 0
                          ? `${validPreview.length} Extracted Lab Value${validPreview.length === 1 ? "" : "s"}`
                          : "No Extracted Lab Values"}
                      </div>
                      {validPreview.length > 0 ? (
                        <div className="mr-abnormal-list">
                          {validPreview.map((vital, index) => (
                            <div key={`${vital.name}-${index}`} className="mr-abnormal-item-v2">
                              <div className="mr-abnormal-item-header">
                                <strong className="mr-abnormal-name">{vital.test_name || vital.name}</strong>
                                <span className={`mr-vitals-status-pill ${statusText(vital.status)}`}>
                                  {displayStatus(vital.status)}
                                </span>
                              </div>
                              <div className="mr-abnormal-values-row">
                                <span className={`mr-abnormal-current-val ${statusText(vital.status)}`}>
                                  Value: <b className={vitalValueClass(vital.status)}>{vital.value} {vital.unit || ""}</b>
                                </span>
                                <span className="mr-abnormal-ref-val">Report Range: {vital.reference_range || vital.range}</span>
                              </div>
                              <small className="mr-source-trace">
                                Page {sourcePage(vital)} | Confidence {confidence(vital)}%
                              </small>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: 13, color: "var(--text-mid)", margin: "8px 0 0" }}>
                          Results are extracted from the report. Please verify with the original document.
                        </p>
                      )}
                    </div>
                  )}
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
                      {(selectedRecord.vitals || []).map((v, i) => (
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

                  {/* AI Interpretations of findings, showing big and individually */}
                  {selectedRecord.type === "Lab Report" && selectedRecordFindings.length > 0 ? (
                    <div className="mr-viewer-section">
                      <span className="mr-viewer-label">🔬 Clinical Findings & Analysis</span>
                      <div className="mr-findings-list">
                        {selectedRecordFindings.map((group, index) => (
                          <div key={index} className={`mr-finding-card ${group.severity}`}>
                            <div className="mr-finding-card-header">
                              <span className="mr-finding-badge">{group.badge}</span>
                              <h4 className="mr-finding-title">{group.title}</h4>
                              <span className={`mr-finding-severity-pill ${group.severity}`}>
                                {group.severity === "high" ? "Action Required" : group.severity === "warning" ? "Borderline" : "Normal"}
                              </span>
                            </div>
                            <div className="mr-finding-vitals-summary">
                              {group.vitals.map((vital, vitalIdx) => (
                                <div key={vitalIdx} className="mr-finding-vital-row">
                                  <span className="mr-finding-vital-name">{vital.name}</span>
                                  <span className={`mr-finding-vital-val ${statusText(vital.status)}`}>{vital.value}</span>
                                  <span className="mr-finding-vital-range">Ref: {vital.range}</span>
                                  <span className={`mr-vitals-status-pill ${vital.status.toLowerCase()}`}>
                                    {vital.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <p className="mr-finding-interpretation">{group.interpretation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      {false && abnormalRecordVitals.length > 0 && (
                        <div className="mr-viewer-section">
                          <span className="mr-viewer-label">Abnormal Lab Levels</span>
                          <table className="mr-vitals-table">
                            <thead>
                              <tr>
                                <th>Parameter</th>
                                <th>Observed Value</th>
                                <th>Reference Range</th>
                              </tr>
                            </thead>
                            <tbody>
                              {abnormalRecordVitals.map((v, i) => (
                                <tr key={i}>
                                  <td style={{ fontWeight: 600 }}>{v.name}</td>
                                  <td>{v.value}</td>
                                  <td>
                                    <span style={{ color: "var(--text-muted)" }}>{v.range} </span>
                                    <span className={`mr-vitals-status-pill ${(v.status || "Normal").toLowerCase()}`}>
                                      {v.status || "Normal"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}

                  <div className="mr-viewer-section">
                    <span className="mr-viewer-label">Confirmed Abnormal Lab Rows</span>
                    <table className="mr-vitals-table">
                      <thead>
                        <tr>
                          <th>Test</th>
                          <th>Value</th>
                          <th>Unit</th>
                          <th>Report Range</th>
                          <th>Source</th>
                        </tr>
                      </thead>
                      <tbody>
                        {abnormalRecordVitals.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={{ color: "var(--text-muted)" }}>
                              No abnormal alert is shown because no row-validated result met the 95 confidence rule.
                            </td>
                          </tr>
                        ) : (
                          abnormalRecordVitals.map((v, i) => (
                            <tr key={i}>
                              <td style={{ fontWeight: 600 }}>{v.test_name || v.name}</td>
                              <td className={vitalValueClass(v.status)}>{v.value}</td>
                              <td>{v.unit || "-"}</td>
                              <td>
                                <span style={{ color: "var(--text-muted)" }}>{v.reference_range || v.range || "-"} </span>
                                <span className={`mr-vitals-status-pill ${statusText(v.status)}`}>
                                  {displayStatus(v.status)}
                                </span>
                              </td>
                              <td>Page {sourcePage(v)} | {confidence(v)}%</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="mr-viewer-section">
                    <span className="mr-viewer-label">Clinical Comments / Summary</span>
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
                className="mr-btn-action danger"
                onClick={(e) => handleDeleteRecord(e, selectedRecord.id)}
                style={{
                  background: "#fee2e2",
                  color: "#b91c1c",
                  borderColor: "#fca5a5",
                  marginRight: "auto"
                }}
              >
                🗑️ Delete Record
              </button>
              <button
                className="mr-btn-action secondary"
                onClick={(e) => handleDownload(null, selectedRecord.name)}
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
