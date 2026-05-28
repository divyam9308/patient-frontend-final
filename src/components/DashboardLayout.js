import React from "react";
import { useNavigate } from "react-router-dom";
import "../pages/Dashboard.css"; // Reuse dashboard styling



export default function DashboardLayout({ children, activeTab, onTabChange }) {
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
    }
  }, [navigate]);

  const user = (() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : {};
    } catch {
      return {};
    }
  })();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { id: "overview",      icon: "🏠", label: "Overview" },
    { id: "profile",       icon: "👤", label: "My Profile" },
    { id: "appointments",  icon: "📅", label: "Appointments" },
    { id: "treatments",    icon: "🏥", label: "Treatments" },
    { id: "medicines",     icon: "💊", label: "Medicine Verification" },
    { id: "records",       icon: "📁", label: "Medical Records" },
    { id: "symptom",       icon: "🩺", label: "Symptom Analyser" },
  ];

  const handleNavClick = (item) => {
    if (item.id === "symptom") {
      navigate("/priority-system");
    } else if (item.id === "treatments") {
      navigate("/treatments");
    } else if (item.id === "medicines") {
      navigate("/medicines");
    } else if (item.id === "appointments") {
      navigate("/appointments");
    } else if (item.id === "records") {
      navigate("/records");
    } else {
      if (onTabChange) {
        onTabChange(item.id);
      } else {
        navigate("/dashboard", { state: { tab: item.id } });
      }
    }
  };

  return (
    <div className="db-root">
      {/* Top Nav */}
      <nav className="db-topnav">
        <div className="db-nav-left">
          <div className="db-logo" onClick={() => navigate("/")}>
            <div className="db-logo-icon">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M10 17.5C10 17.5 2.5 13.125 2.5 7.5A4.375 4.375 0 0110 4.375 4.375 4.375 0 0117.5 7.5C17.5 13.125 10 17.5 10 17.5Z" fill="white"/>
              </svg>
            </div>
            <span className="db-logo-text">HealthCare</span>
          </div>
          <div className="db-nav-divider" />
          <div className="db-nav-greeting">
            Hello, <strong>{user.name ? user.name.split(" ")[0] : "Patient"}</strong> 👋
          </div>
        </div>
        <div className="db-nav-right">
          <div className="db-nav-icon-btn" title="Notifications">
            🔔
            <span className="db-notif-dot" />
          </div>
          <div className="db-nav-icon-btn" title="Settings" onClick={() => handleNavClick({ id: "profile" })}>⚙️</div>
          <div className="db-nav-avatar" title={user.name}>{user.initials || "PT"}</div>
        </div>
      </nav>

      <div className="db-body">
        {/* Sidebar */}
        <aside className="db-sidebar">
          <div className="db-sidebar-section-label">Main Menu</div>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`db-nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => handleNavClick(item)}
            >
              <span className="db-nav-icon">{item.icon}</span>
              {item.label}
              {item.badge && <span className="db-nav-badge">{item.badge}</span>}
            </button>
          ))}

          <div className="db-sidebar-section-label">Account</div>
          <button 
            className={`db-nav-item ${activeTab === "profile" ? "active" : ""}`} 
            onClick={() => handleNavClick({ id: "profile" })}
          >
            <span className="db-nav-icon">⚙️</span> Account Settings
          </button>
          <button className="db-nav-item">
            <span className="db-nav-icon">❓</span> Help & Support
          </button>

          <div className="db-sidebar-footer">
            <button className="db-logout-btn" onClick={handleLogout}>
              🚪 Log Out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="db-main">
          {children}
        </main>
      </div>
    </div>
  );
}
