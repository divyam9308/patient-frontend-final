import React, { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import './Dashboard.css';
import "./MedicineVerification.css";

const INITIAL_MEDICINES = [
  { id: 1, name: "Metformin 500mg", mfr: "Sun Pharma Ltd", expiry: "Nov 2026", batch: "MP2312A", verified: true, date: "24 May 2026", icon: "💊", color: "#e8f5ee" },
  { id: 2, name: "Atorvastatin 20mg", mfr: "Cipla Ltd", expiry: "Aug 2026", batch: "AT2209B", verified: true, date: "20 May 2026", icon: "🔵", color: "#eff6ff" },
  { id: 3, name: "Amlodipine 5mg", mfr: "Dr. Reddy's Laboratories", expiry: "Mar 2027", batch: "AM2401C", verified: true, date: "15 May 2026", icon: "❤️", color: "#fef2f2" },
  { id: 4, name: "Counterfeit/Unverified Tablet", mfr: "Unknown Manufacturer", expiry: "—", batch: "XX9999Z", verified: false, date: "10 May 2026", icon: "⚠️", color: "#fffbeb" },
];

export default function MedicineVerification() {
  const [medicines, setMedicines] = useState(INITIAL_MEDICINES);
  const [batchCode, setBatchCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [activeMode, setActiveMode] = useState("camera"); // camera or manual

  const handleSimulateScan = () => {
    if (scanning) return;
    setScanning(true);
    setScanResult(null);

    // Simulate scanning for 2 seconds
    setTimeout(() => {
      // Pick a random medicine to verify
      const mockMeds = [
        { name: "Paracetamol 500mg", mfr: "GSK Consumer Healthcare", expiry: "Dec 2027", batch: "PA7788D", verified: true, icon: "💊", color: "#e8f5ee" },
        { name: "Amoxicillin 250mg", mfr: "Abbott Laboratories", expiry: "Sep 2026", batch: "AM3344X", verified: true, icon: "💊", color: "#e8f5ee" },
        { name: "Unidentified Capsule", mfr: "Unregistered Import", expiry: "—", batch: "CF5544B", verified: false, icon: "⚠️", color: "#fffbeb" }
      ];

      const selected = mockMeds[Math.floor(Math.random() * mockMeds.length)];
      const newMed = {
        ...selected,
        id: Date.now(),
        date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      };

      setMedicines([newMed, ...medicines]);
      setScanResult(newMed);
      setScanning(false);
    }, 2200);
  };

  const handleManualVerify = (e) => {
    e.preventDefault();
    if (!batchCode.trim()) return;

    setScanning(true);
    setScanResult(null);

    setTimeout(() => {
      // Check if code matches a mock pattern
      const code = batchCode.toUpperCase().trim();
      let verifiedMed;

      if (code.startsWith("MP") || code.startsWith("AT") || code.startsWith("AM") || code === "PA7788D") {
        verifiedMed = {
          id: Date.now(),
          name: code.startsWith("MP") ? "Metformin 500mg" : code.startsWith("AT") ? "Atorvastatin 20mg" : code.startsWith("AM") ? "Amlodipine 5mg" : "Paracetamol 500mg",
          mfr: "Verified Pharma Partner",
          expiry: "Oct 2027",
          batch: code,
          verified: true,
          date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
          icon: "💊",
          color: "#e8f5ee"
        };
      } else {
        verifiedMed = {
          id: Date.now(),
          name: `Unknown Batch (${code})`,
          mfr: "Unverified / Fake Source",
          expiry: "—",
          batch: code,
          verified: false,
          date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
          icon: "⚠️",
          color: "#fffbeb"
        };
      }

      setMedicines([verifiedMed, ...medicines]);
      setScanResult(verifiedMed);
      setScanning(false);
      setBatchCode("");
    }, 1500);
  };

  return (
    <DashboardLayout activeTab="medicines">
      <div className="mv-content" style={{ padding: "0 0 80px 0", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Page heading */}
        <div className="db-page-title" style={{ textAlign: "left" }}>Medicine Verification</div>
        <div className="db-page-subtitle" style={{ textAlign: "left", marginBottom: 28 }}>
          Instantly check whether your medication is counterfeit or genuine by scanning the barcode or entering the batch number.
        </div>

        <div className="mv-grid">
          {/* LEFT: Scanner Panel */}
          <div className="mv-scan-card">
            <div className="mv-mode-toggle">
              <button
                className={`mv-toggle-btn ${activeMode === "camera" ? "active" : ""}`}
                onClick={() => { setActiveMode("camera"); setScanResult(null); }}
              >
                📷 Camera Scanner
              </button>
              <button
                className={`mv-toggle-btn ${activeMode === "manual" ? "active" : ""}`}
                onClick={() => { setActiveMode("manual"); setScanResult(null); }}
              >
                ✏️ Manual Batch Code
              </button>
            </div>

            {activeMode === "camera" ? (
              <div className="mv-camera-area">
                <div className={`mv-camera-feed ${scanning ? "scanning" : ""}`} onClick={handleSimulateScan}>
                  {scanning && <div className="mv-scan-laser"></div>}
                  <div className="mv-overlay-frame">
                    <div className="corner-br border-top-left"></div>
                    <div className="corner-br border-top-right"></div>
                    <div className="corner-br border-bottom-left"></div>
                    <div className="corner-br border-bottom-right"></div>
                  </div>

                  <div className="mv-feed-content">
                    {scanning ? (
                      <div className="mv-pulse-text">Reading barcode...</div>
                    ) : (
                      <>
                        <span className="mv-feed-icon">📷</span>
                        <h3>Tap here to Scan Barcode</h3>
                        <p>Simulate a barcode camera scan using mock verification</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleManualVerify} className="mv-manual-form">
                <div className="mv-field">
                  <label className="mv-label">Enter Batch Code / Serial Number</label>
                  <input
                    type="text"
                    className="mv-input"
                    placeholder="E.g., MP2312A, AT2209B"
                    value={batchCode}
                    onChange={(e) => setBatchCode(e.target.value)}
                    disabled={scanning}
                  />
                  <small className="mv-input-tip">
                    Note: Batch codes starting with 'MP', 'AT', 'AM' will simulate a verified result.
                  </small>
                </div>
                <button type="submit" className="mv-verify-btn" disabled={!batchCode.trim() || scanning}>
                  {scanning ? "Verifying..." : "Verify Batch Code →"}
                </button>
              </form>
            )}

            {/* Live scan/verify feedback */}
            {scanning && activeMode === "manual" && (
              <div className="mv-loading-status">
                <span className="mv-loader"></span> Connecting to Central drug database Registry...
              </div>
            )}

            {scanResult && (
              <div className={`mv-result-card ${scanResult.verified ? "verified" : "fake"}`}>
                <div className="mv-result-header">
                  <span className="mv-result-badge">{scanResult.verified ? "✅ Genuine Product" : "🚨 Warning: Unverified"}</span>
                </div>
                <h3 className="mv-result-name">{scanResult.name}</h3>
                <div className="mv-result-grid">
                  <div className="mv-result-item">
                    <span>Manufacturer</span>
                    <strong>{scanResult.mfr}</strong>
                  </div>
                  <div className="mv-result-item">
                    <span>Batch Number</span>
                    <strong>{scanResult.batch}</strong>
                  </div>
                  <div className="mv-result-item">
                    <span>Expiry Date</span>
                    <strong>{scanResult.expiry}</strong>
                  </div>
                  <div className="mv-result-item">
                    <span>Verification Date</span>
                    <strong>{scanResult.date}</strong>
                  </div>
                </div>
                <p className="mv-result-desc">
                  {scanResult.verified
                    ? "This drug batch matches verified manufacturer manufacturing records and has been registered on the national medical blockchain registry."
                    : "No matching record found for this batch identifier. This product may be counterfeited or unverified. Do not consume without professional advice."}
                </p>
              </div>
            )}
          </div>

          {/* RIGHT: Verified Medicines History */}
          <div className="mv-history-card">
            <div className="mv-card-header">
              <h2 className="mv-section-title">🕒 Verification History</h2>
              <span className="mv-meds-count">{medicines.length} verified</span>
            </div>
            <p className="mv-history-desc">
              List of medicines previously verified on this device:
            </p>

            <div className="mv-history-list">
              {medicines.map(m => (
                <div className="mv-history-item" key={m.id}>
                  <div className="mv-history-icon" style={{ background: m.color }}>{m.icon}</div>
                  <div className="mv-history-info">
                    <div className="mv-history-name">{m.name}</div>
                    <div className="mv-history-details">
                      Mfr: <strong>{m.mfr}</strong> · Batch: <strong>{m.batch}</strong>
                    </div>
                    <div className="mv-history-meta">
                      Checked: {m.date}
                    </div>
                  </div>
                  {m.verified ? (
                    <div className="mv-pill verified">Verified</div>
                  ) : (
                    <div className="mv-pill fake">Unverified</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
