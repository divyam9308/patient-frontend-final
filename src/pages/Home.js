import React from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function Cuboid({ className }) {
  return (
    <div className={`cuboid ${className}`}>
      <div className="cuboid-face cuboid-top" />
      <div className="cuboid-face cuboid-front" />
      <div className="cuboid-face cuboid-side" />
    </div>
  );
}

function Navbar() {
  const navigate = useNavigate();
  
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <div className="navbar-logo-mark">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"
              fill="white"
            />
          </svg>
        </div>
        <span className="navbar-logo-text">HealthCare</span>
      </div>
      <div className="navbar-actions">
        <button className="btn-outline" onClick={() => navigate("/login")}>Login</button>
        <button className="btn-primary" onClick={() => navigate("/register")}>Register</button>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="cuboids-scene" aria-hidden="true">
        <Cuboid className="cuboid-1" />
        <Cuboid className="cuboid-2" />
        <Cuboid className="cuboid-3" />
        <Cuboid className="cuboid-4" />
        <Cuboid className="cuboid-5" />
        <Cuboid className="cuboid-6" />
        <Cuboid className="cuboid-7" />
        <Cuboid className="cuboid-8" />
        <Cuboid className="cuboid-9" />
        <Cuboid className="cuboid-10" />
      </div>

      <div className="blob blob-1" aria-hidden="true" />
      <div className="blob blob-2" aria-hidden="true" />
      <div className="blob blob-3" aria-hidden="true" />

      <div className="hero-inner">
        <div className="hero-left">
          <div className="hero-badge">
            <span className="badge-dot" />
            Live &middot; 50,000+ patients served
          </div>

          <h1 className="hero-heading">
            Smart Healthcare,<br />
            <em className="hero-highlight">Better Treatment</em>
          </h1>

          <p className="hero-subtext">
            Priority-based appointments, centralized medical records,
            and smart medicine verification — unified in one powerful platform.
          </p>

          <div className="hero-cta-row">
            <button className="btn-primary btn-hero">
              Get Started <span className="btn-arrow">→</span>
            </button>
            <button className="btn-ghost-hero">
              <span className="play-icon">▶</span> Watch Demo
            </button>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-num">98%</span>
              <span className="stat-label">Satisfaction</span>
            </div>
            <div className="stat-divider" />
            <div className="hero-stat">
              <span className="stat-num">500+</span>
              <span className="stat-label">Doctors</span>
            </div>
            <div className="stat-divider" />
            <div className="hero-stat">
              <span className="stat-num">24/7</span>
              <span className="stat-label">Support</span>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className="cards-grid">
            <div className="glass-card card-main">
              <div className="card-icon-wrap green-icon">🩺</div>
              <h3 className="card-title">Priority System</h3>
              <p className="card-desc">
                Critical patients seen first — automatically, intelligently.
              </p>
              <div className="card-pill">
                <span className="pill-num">3x</span>
                <span className="pill-label">faster triage</span>
              </div>
            </div>

            <div className="glass-card card-sm">
              <div className="card-icon-wrap blue-icon">📋</div>
              <h3 className="card-title">Medical Records</h3>
              <p className="card-desc">All data in one secure place.</p>
            </div>

            <div className="glass-card card-sm">
              <div className="card-icon-wrap red-icon">🚨</div>
              <h3 className="card-title">Emergency Access</h3>
              <p className="card-desc">Instant data in critical moments.</p>
            </div>

            <div className="glass-card card-wide">
              <div className="card-icon-wrap yellow-icon">💊</div>
              <div>
                <h3 className="card-title">Medicine Verification</h3>
                <p className="card-desc">Scan and verify authenticity instantly.</p>
              </div>
              <div className="verified-badge">✓ Verified</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="page-wrapper">
      <Navbar />
      <Hero />
    </div>
  );
}