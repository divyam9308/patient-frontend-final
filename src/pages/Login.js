import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api.js";
import "./Auth.css";

export default function Login() {
  const navigate = useNavigate();
  
  const [error, setError] = useState("");

  // Auto-login redirect if there is an active session
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (token && user) {
      navigate("/dashboard");
    }
  }, [navigate]);

  // Google Sign-In callback
  const handleGoogleResponse = useCallback(async (response) => {
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

            <div className="divider" style={{ marginTop: '20px' }}><span>Sign in with</span></div>

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