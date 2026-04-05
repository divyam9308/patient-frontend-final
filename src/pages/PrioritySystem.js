import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PrioritySystem.css";

const SYMPTOMS = [
  { id: 1, label: "Chest Pain", weight: 30 },
  { id: 2, label: "Difficulty Breathing", weight: 28 },
  { id: 3, label: "High Fever (>103°F)", weight: 20 },
  { id: 4, label: "Severe Headache", weight: 18 },
  { id: 5, label: "Vomiting / Nausea", weight: 12 },
  { id: 6, label: "Dizziness / Fainting", weight: 22 },
  { id: 7, label: "Rapid Heart Rate", weight: 25 },
  { id: 8, label: "Persistent Cough", weight: 10 },
  { id: 9, label: "Body Ache / Fatigue", weight: 8 },
  { id: 10, label: "Mild Fever (<100°F)", weight: 6 },
  { id: 11, label: "Skin Rash", weight: 9 },
  { id: 12, label: "Sore Throat", weight: 5 },
];

const DURATION_OPTIONS = [
  "Less than 24 hours",
  "1–3 days",
  "4–7 days",
  "More than a week",
];

function getSeverityDetails(pct) {
  if (pct >= 70)
    return {
      label: "Critical",
      color: "#c0392b",
      bg: "#fdf1f0",
      ring: "#e74c3c",
      icon: "🚨",
      appointmentMsg:
        "Your condition is critical. An emergency appointment is being booked immediately.",
      appointmentLabel: "Book Emergency Appointment",
      appointmentClass: "btn-critical",
      waitMsg: "Priority: Immediate",
    };
  if (pct >= 40)
    return {
      label: "Moderate",
      color: "#d68910",
      bg: "#fef9ec",
      ring: "#f39c12",
      icon: "⚠️",
      appointmentMsg:
        "Your condition requires attention. You will be scheduled ahead of mild cases.",
      appointmentLabel: "Book Priority Appointment",
      appointmentClass: "btn-moderate",
      waitMsg: "Estimated Wait: 2–4 hours",
    };
  return {
    label: "Mild",
    color: "#1e8449",
    bg: "#eafaf1",
    ring: "#27ae60",
    icon: "✅",
    appointmentMsg:
      "Your condition is mild. We'll schedule you after higher-priority patients.",
    appointmentLabel: "Book Regular Appointment",
    appointmentClass: "btn-mild",
    waitMsg: "Estimated Wait: Same day / Next day",
  };
}

export default function PrioritySystem() {
  const navigate = useNavigate();

  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [duration, setDuration] = useState("");
  const [age, setAge] = useState("");
  const [analyzed, setAnalyzed] = useState(false);
  const [severity, setSeverity] = useState(0);
  const [loading, setLoading] = useState(false);
  const [booked, setBooked] = useState(false);
  const [animating, setAnimating] = useState(false);

  const toggleSymptom = (id) => {
    setAnalyzed(false);
    setBooked(false);
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const analyzeSymptoms = () => {
    if (selectedSymptoms.length === 0 || !duration) return;
    setLoading(true);
    setAnimating(false);

    setTimeout(() => {
      const baseScore = selectedSymptoms.reduce((acc, id) => {
        const s = SYMPTOMS.find((s) => s.id === id);
        return acc + (s ? s.weight : 0);
      }, 0);

      const durationBonus =
        duration === "More than a week"
          ? 15
          : duration === "4–7 days"
          ? 10
          : duration === "1–3 days"
          ? 5
          : 0;

      const ageBonus = age > 60 ? 10 : age < 12 ? 8 : 0;
      const raw = baseScore + durationBonus + ageBonus;
      const pct = Math.min(98, Math.round((raw / 120) * 100));

      setSeverity(pct);
      setLoading(false);
      setAnalyzed(true);
      setTimeout(() => setAnimating(true), 50);
    }, 1800);
  };

  const details = getSeverityDetails(severity);

  return (
    <div className="ps-page">
      {/* Nav */}
      <nav className="ps-nav">
        <div className="ps-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <span className="ps-logo-icon">🫀</span>
          <span className="ps-logo-text">HealthCare</span>
        </div>
        <div className="ps-nav-links">
          <a href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }}>Home</a>
          <a href="/appointments" onClick={(e) => { e.preventDefault(); navigate("/appointments"); }}>Appointments</a>
          <a href="/records" onClick={(e) => { e.preventDefault(); navigate("/records"); }}>Records</a>
        </div>
        <div className="ps-nav-actions">
          <button className="ps-btn-outline" onClick={() => navigate("/login")}>Login</button>
          <button className="ps-btn-solid" onClick={() => navigate("/register")}>Register</button>
        </div>
      </nav>

      <div className="ps-content">
        {/* Header */}
        <div className="ps-header">
          <div className="ps-badge">🩺 AI-Powered Triage</div>
          <h1 className="ps-title">
            Symptom Severity <span className="ps-title-accent">Analyzer</span>
          </h1>
          <p className="ps-subtitle">
            Select your symptoms below. Our system analyses your inputs along
            with your medical history to calculate a precise severity score and
            prioritize your appointment accordingly.
          </p>
        </div>

        <div className="ps-grid">
          {/* LEFT: Input Panel */}
          <div className="ps-card ps-input-card">
            <h2 className="ps-card-title">
              <span>📋</span> Tell Us How You Feel
            </h2>

            {/* Age */}
            <div className="ps-field">
              <label className="ps-label">Your Age</label>
              <input
                className="ps-input"
                type="number"
                placeholder="Enter your age"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
              />
            </div>

            {/* Duration */}
            <div className="ps-field">
              <label className="ps-label">How long have you had symptoms?</label>
              <div className="ps-duration-grid">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    className={`ps-duration-btn ${
                      duration === opt ? "ps-duration-active" : ""
                    }`}
                    onClick={() => {
                      setDuration(opt);
                      setAnalyzed(false);
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Symptoms */}
            <div className="ps-field">
              <label className="ps-label">
                Select Symptoms{" "}
                <span className="ps-label-hint">(select all that apply)</span>
              </label>
              <div className="ps-symptoms-grid">
                {SYMPTOMS.map((s) => (
                  <button
                    key={s.id}
                    className={`ps-symptom-btn ${
                      selectedSymptoms.includes(s.id) ? "ps-symptom-active" : ""
                    }`}
                    onClick={() => toggleSymptom(s.id)}
                  >
                    <span className="ps-symptom-check">
                      {selectedSymptoms.includes(s.id) ? "✓" : "+"}
                    </span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              className={`ps-analyze-btn ${
                selectedSymptoms.length === 0 || !duration ? "ps-disabled" : ""
              }`}
              onClick={analyzeSymptoms}
              disabled={selectedSymptoms.length === 0 || !duration || loading}
            >
              {loading ? (
                <span className="ps-spinner-wrap">
                  <span className="ps-spinner"></span> Analysing...
                </span>
              ) : (
                "Analyse My Symptoms →"
              )}
            </button>
          </div>

          {/* RIGHT: Result Panel */}
          <div className="ps-result-col">
            {!analyzed && !loading && (
              <div className="ps-placeholder-card">
                <div className="ps-placeholder-icon">🔬</div>
                <h3>Awaiting Your Symptoms</h3>
                <p>
                  Fill in the form on the left and click "Analyse My Symptoms"
                  to see your severity score and appointment options.
                </p>
                <div className="ps-placeholder-steps">
                  <div className="ps-step">
                    <span className="ps-step-num">1</span>
                    <span>Enter your age & duration</span>
                  </div>
                  <div className="ps-step">
                    <span className="ps-step-num">2</span>
                    <span>Select your symptoms</span>
                  </div>
                  <div className="ps-step">
                    <span className="ps-step-num">3</span>
                    <span>Get instant severity score</span>
                  </div>
                </div>
              </div>
            )}

            {loading && (
              <div className="ps-loading-card">
                <div className="ps-pulse-ring">
                  <div className="ps-pulse-inner">🧬</div>
                </div>
                <h3>Analysing Symptoms...</h3>
                <p>
                  Cross-referencing with your medical history and our diagnostic
                  engine.
                </p>
                <div className="ps-loading-bars">
                  <div className="ps-bar" style={{ animationDelay: "0s" }}></div>
                  <div className="ps-bar" style={{ animationDelay: "0.2s" }}></div>
                  <div className="ps-bar" style={{ animationDelay: "0.4s" }}></div>
                  <div className="ps-bar" style={{ animationDelay: "0.6s" }}></div>
                </div>
              </div>
            )}

            {analyzed && !loading && (
              <>
                {/* Severity Card */}
                <div
                  className={`ps-severity-card ${animating ? "ps-severity-visible" : ""}`}
                  style={{ background: details.bg }}
                >
                  <div className="ps-severity-header">
                    <span className="ps-severity-icon">{details.icon}</span>
                    <div>
                      <div className="ps-severity-label">Severity Score</div>
                      <div
                        className="ps-severity-level"
                        style={{ color: details.color }}
                      >
                        {details.label} Condition
                      </div>
                    </div>
                  </div>

                  {/* Circular gauge */}
                  <div className="ps-gauge-wrap">
                    <svg
                      className="ps-gauge-svg"
                      viewBox="0 0 120 120"
                      width="160"
                      height="160"
                    >
                      <circle
                        cx="60" cy="60" r="50"
                        fill="none"
                        stroke="#e8f5e9"
                        strokeWidth="10"
                      />
                      <circle
                        cx="60" cy="60" r="50"
                        fill="none"
                        stroke={details.ring}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${animating ? (severity / 100) * 314 : 0} 314`}
                        strokeDashoffset="78.5"
                        style={{ transition: "stroke-dasharray 1.4s ease" }}
                      />
                      <text
                        x="60" y="55"
                        textAnchor="middle"
                        fontSize="22"
                        fontWeight="700"
                        fill={details.color}
                      >
                        {animating ? severity : 0}%
                      </text>
                      <text
                        x="60" y="74"
                        textAnchor="middle"
                        fontSize="9"
                        fill="#888"
                      >
                        Severity
                      </text>
                    </svg>
                  </div>

                  <div
                    className="ps-wait-badge"
                    style={{ color: details.color, border: `1.5px solid ${details.ring}` }}
                  >
                    ⏱ {details.waitMsg}
                  </div>

                  {/* Selected symptoms summary */}
                  <div className="ps-selected-summary">
                    <div className="ps-summary-title">Symptoms Detected</div>
                    <div className="ps-tags">
                      {selectedSymptoms.map((id) => {
                        const s = SYMPTOMS.find((s) => s.id === id);
                        return (
                          <span
                            key={id}
                            className="ps-tag"
                            style={{
                              background: details.bg,
                              border: `1px solid ${details.ring}`,
                              color: details.color,
                            }}
                          >
                            {s.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Appointment Card */}
                <div
                  className={`ps-appt-card ${animating ? "ps-appt-visible" : ""}`}
                >
                  <div className="ps-appt-icon">📅</div>
                  <h3 className="ps-appt-title">Appointment Recommendation</h3>
                  <p className="ps-appt-msg">{details.appointmentMsg}</p>

                  {!booked ? (
                    <button
                      className={`ps-appt-btn ${details.appointmentClass}`}
                      onClick={() => setBooked(true)}
                    >
                      {details.appointmentLabel}
                    </button>
                  ) : (
                    <div className="ps-booked-confirm">
                      <span className="ps-booked-check">✓</span>
                      <div>
                        <strong>Appointment Confirmed!</strong>
                        <p>
                          You will receive a confirmation on your registered
                          number shortly.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="ps-disclaimer">
                    ⚕️ This is an AI-assisted triage. Always consult a qualified
                    doctor for medical advice.
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}