import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api.js";
import "./Auth.css";

export default function Register() {
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
        isLogin: false
      });

      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      localStorage.setItem('rememberMe', 'true');

      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Google registration failed");
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

            <div className="divider" style={{ margin: "20px 0" }}><span>Create account with</span></div>

            <div className="social-row" style={{ display: "flex", justifyContent: "center" }}>
              <div id="google-signUp-btn"></div>
            </div>

             <p className="auth-switch">
              Already have an account? <a href="/login">Sign in →</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}