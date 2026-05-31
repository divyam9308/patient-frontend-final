import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api.js";
import "./Auth.css";

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "",
    password: "", confirm: "", role: "patient",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Auto-login redirect if there is an active session
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (token && user) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleNext = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = {
        name: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      };
      const response = await api.post('/auth/register', payload);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In callback
  const handleGoogleResponse = useCallback(async (response) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post('/auth/google-verify', {
        credential: response.credential,
        isLogin: false
      });

      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      localStorage.setItem('rememberMe', 'true');

      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Google registration failed");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Handle Google SDK Load — robust with polling fallback
  useEffect(() => {
    const initGoogle = () => {
      if (!window.google) return false;
      try {
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || '1234567890-example.apps.googleusercontent.com',
          callback: handleGoogleResponse
        });
        const btnEl = document.getElementById("google-signUp-btn");
        if (btnEl) {
          window.google.accounts.id.renderButton(btnEl, {
            theme: "outline", size: "large", width: 250
          });
        }
        return true;
      } catch (e) {
        console.error("Google Sign-In init error:", e);
        return false;
      }
    };

    if (initGoogle()) return;

    const checkGoogle = setInterval(() => {
      if (initGoogle()) {
        clearInterval(checkGoogle);
      }
    }, 300);

    const timeout = setTimeout(() => clearInterval(checkGoogle), 10000);
    return () => {
      clearInterval(checkGoogle);
      clearTimeout(timeout);
    };
  }, [handleGoogleResponse]);

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#3b82f6", "#16a34a"][strength];

  return (
    <div className="auth-root">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      <div className="float-card fc-a" />
      <div className="float-card fc-b" />
      <div className="float-card fc-c" />
      <div className="float-card fc-d" />

      <nav className="auth-nav">
        <a href="/" className="auth-logo">
          <span className="logo-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M10 17.5C10 17.5 2.5 13.125 2.5 7.5A4.375 4.375 0 0110 4.375 4.375 4.375 0 0117.5 7.5C17.5 13.125 10 17.5 10 17.5Z"
                fill="white"
              />
            </svg>
          </span>
          HealthCare
        </a>
        <div className="auth-nav-links">
          <a href="/login" className="nav-link">Login</a>
          <a href="/register" className="btn-register-nav active-reg">Register</a>
        </div>
      </nav>

      <main className="auth-main">
        <div className="auth-card-wrap">
          {/* Left panel */}
          <div className="auth-left">
            <div className="auth-badge">
              <span className="badge-dot" />
              Join 50,000+ patients today
            </div>
            <h1 className="auth-heading">
              Smart Healthcare,<br />
              <span className="auth-heading-italic">Better Treatment</span>
            </h1>
            <p className="auth-sub">
              Priority-based appointments, centralized medical records, and smart medicine verification — unified in one powerful platform.
            </p>

            <div className="feature-cards-mini">
              <div className="mini-card">
                <span className="mini-icon" style={{ background: "#e6f4ea" }}>🩺</span>
                <div>
                  <div className="mini-title">Priority System</div>
                  <div className="mini-desc">Critical patients seen first — automatically.</div>
                  <span className="mini-badge">3x faster triage</span>
                </div>
              </div>
              <div className="mini-card">
                <span className="mini-icon" style={{ background: "#e8eaf6" }}>📋</span>
                <div>
                  <div className="mini-title">Medical Records</div>
                  <div className="mini-desc">All your data in one secure place.</div>
                </div>
              </div>
              <div className="mini-card">
                <span className="mini-icon" style={{ background: "#fce4ec" }}>💊</span>
                <div>
                  <div className="mini-title">Medicine Verification</div>
                  <div className="mini-desc">Scan and verify authenticity instantly.</div>
                  <span className="mini-badge verified">✓ Verified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel — form */}
          <div className="auth-card">
            {/* Step indicator */}
            <div className="step-row">
              <div className={`step-dot ${step >= 1 ? "active" : ""}`}>
                {step > 1 ? "✓" : "1"}
              </div>
              <div className={`step-line ${step >= 2 ? "done" : ""}`} />
              <div className={`step-dot ${step >= 2 ? "active" : ""}`}>2</div>
            </div>
            <p className="step-label">{step === 1 ? "Personal Info" : "Set Password"}</p>

            <div className="card-header">
              <h2 className="card-title">Create Account</h2>
              <p className="card-sub">Join the smart healthcare platform</p>
            </div>

            {error && (
              <div className="auth-error-msg" style={{
                color: "#dc2626", background: "#fef2f2", padding: "10px 14px",
                borderRadius: "10px", border: "1px solid #fecaca", fontSize: "13px",
                marginBottom: "16px", textAlign: "left", fontWeight: 500
              }}>
                ⚠️ {error}
              </div>
            )}

            {step === 1 ? (
              <form className="auth-form" onSubmit={handleNext}>
                {/* Role selector */}
                <div className="field-group">
                  <label className="field-label">I am a</label>
                  <div className="role-row">
                    {["patient", "doctor", "staff"].map((r) => (
                      <button
                        key={r}
                        type="button"
                        className={`role-btn ${form.role === r ? "role-active" : ""}`}
                        onClick={() => setForm({ ...form, role: r })}
                      >
                        {r === "patient" ? "🙋 Patient" : r === "doctor" ? "👨‍⚕️ Doctor" : "🏥 Staff"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">Full Name</label>
                  <div className="field-wrap">
                    <span className="field-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </span>
                    <input
                      type="text"
                      name="fullName"
                      placeholder="John Doe"
                      value={form.fullName}
                      onChange={handleChange}
                      className="field-input"
                      required
                    />
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">Email Address</label>
                  <div className="field-wrap">
                    <span className="field-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </span>
                    <input
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                      className="field-input"
                      required
                    />
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">Phone Number</label>
                  <div className="field-wrap">
                    <span className="field-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012.18 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.15a16 16 0 006.94 6.94l1.51-1.52a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                      </svg>
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={handleChange}
                      className="field-input"
                    />
                  </div>
                </div>

                <button type="submit" className="btn-submit">
                  Continue <span className="btn-arrow">→</span>
                </button>

                <div className="divider" style={{ margin: "20px 0" }}><span>or create with</span></div>

                <div className="social-row" style={{ display: "flex", justifyContent: "center" }}>
                  <div id="google-signUp-btn"></div>
                </div>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="field-group">
                  <label className="field-label">Create Password</label>
                  <div className="field-wrap">
                    <span className="field-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0110 0v4"/>
                      </svg>
                    </span>
                    <input
                      type={showPass ? "text" : "password"}
                      name="password"
                      placeholder="Create a strong password"
                      value={form.password}
                      onChange={handleChange}
                      className="field-input"
                      required
                    />
                    <button
                      type="button"
                      className="toggle-pass"
                      onClick={() => setShowPass(!showPass)}
                    >
                      {showPass ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  {form.password && (
                    <div className="strength-bar">
                      <div className="strength-track">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="strength-seg"
                            style={{ background: i <= strength ? strengthColor : "#e2e8e4" }}
                          />
                        ))}
                      </div>
                      <span className="strength-text" style={{ color: strengthColor }}>
                        {strengthLabel}
                      </span>
                    </div>
                  )}
                </div>

                <div className="field-group">
                  <label className="field-label">Confirm Password</label>
                  <div className="field-wrap">
                    <span className="field-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </span>
                    <input
                      type="password"
                      name="confirm"
                      placeholder="Repeat your password"
                      value={form.confirm}
                      onChange={handleChange}
                      className="field-input"
                      required
                    />
                    {form.confirm && (
                      <span
                        className="match-icon"
                        style={{ color: form.password === form.confirm ? "#16a34a" : "#ef4444" }}
                      >
                        {form.password === form.confirm ? "✓" : "✗"}
                      </span>
                    )}
                  </div>
                </div>

                <label className="terms-label">
                  <input type="checkbox" required className="remember-check" />
                  <span className="check-custom" />
                  I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>
                </label>

                <button
                  type="submit"
                  className={`btn-submit ${loading ? "loading" : ""}`}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="spinner" />
                  ) : (
                    <>Create Account <span className="btn-arrow">→</span></>
                  )}
                </button>

                <button
                  type="button"
                  className="btn-back"
                  onClick={() => setStep(1)}
                >
                  ← Back
                </button>
              </form>
            )}

             <p className="auth-switch">
              Already have an account? <a href="/login">Sign in →</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}