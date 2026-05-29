import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api.js";
import "./Auth.css";

export default function Login() {
  const navigate = useNavigate();
  
  // Remember Me state initialization
  const [rememberMe, setRememberMe] = useState(() => {
    const saved = localStorage.getItem('rememberMe');
    return saved === null ? true : saved === 'true';
  });

  const [form, setForm] = useState({ 
    email: localStorage.getItem('rememberedEmail') || "", 
    password: "" 
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

  const finishLogin = useCallback((response) => {
    if (rememberMe) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('rememberedEmail', form.email);
      localStorage.setItem('rememberMe', 'true');
    } else {
      sessionStorage.setItem('token', response.token);
      sessionStorage.setItem('user', JSON.stringify(response.user));
      localStorage.removeItem('rememberedEmail');
      localStorage.setItem('rememberMe', 'false');
    }
    navigate("/dashboard");
  }, [rememberMe, form.email, navigate]);

  // Google Sign-In callback
  const handleGoogleResponse = useCallback(async (response) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post('/auth/google-verify', {
        credential: response.credential,
        isLogin: true
      });

      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      localStorage.setItem('rememberMe', 'true');
      
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Google authentication failed");
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
        const btnEl = document.getElementById("google-signIn-btn");
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

    // Poll until Google SDK loads
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const response = await api.post('/auth/login', form);
      finishLogin(response);
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      {/* Floating blobs background */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      {/* Floating card accents */}
      <div className="float-card fc-a" />
      <div className="float-card fc-b" />
      <div className="float-card fc-c" />
      <div className="float-card fc-d" />

      {/* Navbar */}
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
          <a href="/login" className="nav-link active">Login</a>
          <a href="/register" className="btn-register-nav">Register</a>
        </div>
      </nav>

      {/* Main */}
      <main className="auth-main">
        <div className="auth-card-wrap">
          {/* Left panel */}
          <div className="auth-left">
            <div className="auth-badge">
              <span className="badge-dot" />
              Live · 50,000+ patients served
            </div>
            <h1 className="auth-heading">
              Welcome<br />
              <span className="auth-heading-italic">Back</span>
            </h1>
            <p className="auth-sub">
              Priority-based appointments, centralized medical records, and smart medicine verification — unified in one powerful platform.
            </p>

            <div className="auth-stats">
              <div className="stat">
                <span className="stat-num">98%</span>
                <span className="stat-label">Satisfaction</span>
              </div>
              <div className="stat-divider" />
              <div className="stat">
                <span className="stat-num">500+</span>
                <span className="stat-label">Doctors</span>
              </div>
              <div className="stat-divider" />
              <div className="stat">
                <span className="stat-num">24/7</span>
                <span className="stat-label">Support</span>
              </div>
            </div>

            {/* Feature pills */}
            <div className="feature-pills">
              <div className="feature-pill">
                <span className="pill-icon">🩺</span> Priority System
              </div>
              <div className="feature-pill">
                <span className="pill-icon">📋</span> Medical Records
              </div>
              <div className="feature-pill">
                <span className="pill-icon">🚨</span> Emergency Access
              </div>
              <div className="feature-pill">
                <span className="pill-icon">💊</span> Medicine Verification
              </div>
            </div>
          </div>

          {/* Right panel — form */}
          <div className="auth-card">
            <div className="card-header">
              <h2 className="card-title">Sign In</h2>
              <p className="card-sub">Access your health dashboard securely</p>
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

            <form className="auth-form" onSubmit={handleSubmit}>
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
                <label className="field-label">Password</label>
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
                    placeholder="Enter your password"
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
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="remember-label">
                  <input 
                    type="checkbox" 
                    className="remember-check" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="check-custom" />
                  Remember me
                </label>
                <a href="/forgot" className="forgot-link">Forgot password?</a>
              </div>

              <button
                type="submit"
                className={`btn-submit ${loading ? "loading" : ""}`}
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner" />
                ) : (
                  <>Sign In <span className="btn-arrow">→</span></>
                )}
              </button>
            </form>

            <div className="divider"><span>or continue with</span></div>

            <div className="social-row" style={{ display: 'flex', justifyContent: 'center' }}>
              <div id="google-signIn-btn"></div>
            </div>

            <p className="auth-switch" style={{ marginTop: '24px' }}>
              Don't have an account? <a href="/register">Create one →</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}