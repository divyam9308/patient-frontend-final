import React from "react";
import "../App.css";

function Home() {
  return (
    <div className="homepage">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          <span className="logo-icon">💚</span> HealthCare
        </div>
        <div className="nav-buttons">
          <button className="btn-outline">Login</button>
          <button className="btn-filled">Register</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <h1>
          Smart Healthcare, <span className="highlight">Better Treatment</span>
        </h1>
        <p>
          Priority-based appointments, centralized medical records, and smart
          medicine verification. Healthcare made simple and safe.
        </p>
        <button className="btn-filled hero-btn">Get Started →</button>
        <img
          src="[images.unsplash.com](https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=900&q=80)"
          alt="Healthcare abstract"
          className="hero-image"
        />
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>Complete Healthcare Solution</h2>
        <p>Everything you need for better patient care</p>
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">❤️</span>
            <div>
              <h3>Priority System</h3>
              <p>
                Symptom-based priority classification ensures critical patients
                get immediate care.
              </p>
            </div>
          </div>
          <div className="feature-card">
            <span className="feature-icon">📋</span>
            <div>
              <h3>Medical Records</h3>
              <p>
                All your medical data in one secure, accessible location.
              </p>
            </div>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🛡️</span>
            <div>
              <h3>Emergency Access</h3>
              <p>
                Instant access to patient data in critical situations.
              </p>
            </div>
          </div>
          <div className="feature-card">
            <span className="feature-icon">💊</span>
            <div>
              <h3>Medicine Verification</h3>
              <p>
                Scan and verify medicine authenticity instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <h2>Ready to get started?</h2>
        <p>
          Join thousands using our platform for better healthcare.
        </p>
        <button className="btn-filled">Create Account</button>
      </section>
    </div>
  );
}

export default Home;
