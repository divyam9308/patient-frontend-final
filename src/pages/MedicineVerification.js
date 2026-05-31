import React, { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { api } from "../utils/api.js";
import './Dashboard.css';
import "./MedicineVerification.css";

export default function MedicineVerification() {
  const [medicines, setMedicines] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [batchCode, setBatchCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [activeMode, setActiveMode] = useState("camera"); // camera or manual

  // Fetch verification history on mount
  useEffect(() => {
    api.get('/medicines/verify/history')
      .then(data => setMedicines(data))
      .catch(() => { })
      .finally(() => setLoadingHistory(false));
  }, []);

  // Helper: call API to verify a batch code
  const doVerify = async (code) => {
    const result = await api.post('/medicines/verify', { batchCode: code });
    setMedicines(prev => [result, ...prev]);
    setScanResult(result);
  };

  const handleSimulateScan = () => {
    if (scanning) return;
    setScanning(true);
    setScanResult(null);

    // Simulate a short camera scan delay, then send a random known batch code
    const randomCodes = ["MP2312A", "AT2209B", "AM2401C", "PA7788D", "XX9999Z"];
    const code = randomCodes[Math.floor(Math.random() * randomCodes.length)];

    setTimeout(async () => {
      try {
        await doVerify(code);
      } catch (err) {
        console.error(err);
      } finally {
        setScanning(false);
      }
    }, 2200);
  };

  const handleManualVerify = async (e) => {
    e.preventDefault();
    if (!batchCode.trim()) return;
    setScanning(true);
    setScanResult(null);
    try {
      await doVerify(batchCode.trim());
      setBatchCode("");
    } catch (err) {
      alert("Verification error: " + err.message);
    } finally {
      setScanning(false);
    }
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
                        <p>Simulate a barcode camera scan using the verification API</p>
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
                    Note: Enter the exact batch/lot code printed on the medicine strip, bottle, or box.
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
                <span className="mv-loader"></span> Connecting to Central Drug Database Registry...
              </div>
            )}

            {scanResult && (
              <div className={`mv-result-card ${scanResult.status === 'verified' ? "verified" : "fake"}`} style={{
                borderColor: scanResult.status === 'recalled' ? '#f87171' :
                  scanResult.status === 'expired' ? '#fb923c' :
                    scanResult.status === 'warning' ? '#facc15' : '#a7f3d0',
                backgroundColor: scanResult.status === 'recalled' ? '#fef2f2' :
                  scanResult.status === 'expired' ? '#fff7ed' :
                    scanResult.status === 'warning' ? '#fefce8' : '#ecfdf5'
              }}>
                <div className="mv-result-header">
                  <span className="mv-result-badge" style={{
                    color: scanResult.status === 'recalled' ? '#991b1b' :
                      scanResult.status === 'expired' ? '#9a3412' :
                        scanResult.status === 'warning' ? '#854d0e' : '#065f46',
                    backgroundColor: scanResult.status === 'recalled' ? '#fee2e2' :
                      scanResult.status === 'expired' ? '#ffedd5' :
                        scanResult.status === 'warning' ? '#fef9c3' : '#d1fae5'
                  }}>
                    {scanResult.status === 'verified' ? "✅ Genuine Product" :
                      scanResult.status === 'recalled' ? "🚨 Recalled Product (Warning)" :
                        scanResult.status === 'expired' ? "⏳ Expired Product" :
                          "⚠️ Unverified / Unknown Batch"}
                  </span>
                </div>
                <h3 className="mv-result-name">{scanResult.name} {scanResult.brandName && `(${scanResult.brandName})`}</h3>
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
                    <span>Format</span>
                    <strong>{scanResult.dosageForm ? `${scanResult.strength} ${scanResult.dosageForm}` : '—'}</strong>
                  </div>
                  <div className="mv-result-item" style={{ gridColumn: '1 / -1' }}>
                    <span>Data Source</span>
                    <strong>{scanResult.source || 'Unknown Database'}</strong>
                  </div>
                </div>
                <p className="mv-result-desc" style={{
                  color: scanResult.status === 'recalled' ? '#991b1b' :
                    scanResult.status === 'expired' ? '#9a3412' :
                      scanResult.status === 'warning' ? '#854d0e' : '#065f46'
                }}>
                  {scanResult.status === 'verified'
                    ? "This drug batch matches verified manufacturer manufacturing records and has been registered on the national database."
                    : scanResult.status === 'expired'
                      ? "This medicine batch exists in our records but is expired. Do not use."
                      : scanResult.status === 'recalled'
                        ? "This medicine batch exists but has a recall/safety warning. Contact a medical professional immediately."
                        : "No matching record found for this batch identifier. This product may be counterfeited or unverified. Do not consume without professional advice."}
                </p>
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(0,0,0,0.1)', fontSize: '0.85rem', color: '#6b7280' }}>
                  <strong>Medical Disclaimer</strong>: Verification is based only on records available in this database. If you suspect counterfeit medicine, contact a pharmacist, doctor, manufacturer, or local drug authority.
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Verified Medicines History */}
          <div className="mv-history-card">
            <div className="mv-card-header">
              <h2 className="mv-section-title">🕒 Verification History</h2>
              <span className="mv-meds-count">{medicines.filter(m => m.verified).length} verified</span>
            </div>
            <p className="mv-history-desc">
              List of medicines previously verified on this account:
            </p>

            <div className="mv-history-list">
              {loadingHistory ? (
                <div style={{ padding: 16, color: "#7a9485", fontSize: 13 }}>Loading history...</div>
              ) : medicines.length === 0 ? (
                <div style={{ padding: 16, color: "#7a9485", fontSize: 13 }}>No verifications yet. Scan a medicine above!</div>
              ) : medicines.map(m => (
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
                  <div className={`mv-pill ${m.status === 'verified' ? 'verified' :
                      (m.status === 'recalled' || m.status === 'expired' || m.status === 'warning') ? 'fake' : 'fake'
                    }`} style={{
                      backgroundColor: m.status === 'recalled' ? '#fee2e2' :
                        m.status === 'expired' ? '#ffedd5' :
                          m.status === 'warning' ? '#fef9c3' : undefined,
                      color: m.status === 'recalled' ? '#991b1b' :
                        m.status === 'expired' ? '#9a3412' :
                          m.status === 'warning' ? '#854d0e' : undefined,
                      border: 'none'
                    }}>
                    {m.status === 'verified' ? 'Verified' :
                      m.status === 'recalled' ? 'Recalled' :
                        m.status === 'expired' ? 'Expired' : 'Unverified'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
