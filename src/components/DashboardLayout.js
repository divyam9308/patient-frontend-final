import React from "react";
import { useNavigate } from "react-router-dom";
import {
  clearNotifications,
  getNotifications,
  markAllNotificationsRead,
  removeNotification,
  subscribeNotifications,
} from "../utils/notifications.js";
import "../pages/Dashboard.css";

export default function DashboardLayout({ children, activeTab, onTabChange }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = React.useState(() => getNotifications());
  const [toastItems, setToastItems] = React.useState([]);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const bellRef = React.useRef(null);

  React.useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const user = (() => {
    try {
      const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : {};
    } catch {
      return {};
    }
  })();

  const playAppointmentPing = React.useCallback(() => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
      gain.connect(ctx.destination);

      [880, 1174].forEach((frequency, index) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(frequency, ctx.currentTime + index * 0.12);
        osc.connect(gain);
        osc.start(ctx.currentTime + index * 0.12);
        osc.stop(ctx.currentTime + 0.42 + index * 0.1);
      });

      window.setTimeout(() => ctx.close(), 900);
    } catch {
      // Notification sound is optional; blocked audio should not affect the UI.
    }
  }, []);

  React.useEffect(() => {
    const unsubscribe = subscribeNotifications(({ notifications: nextNotifications, toast }) => {
      setNotifications(Array.isArray(nextNotifications) ? nextNotifications : getNotifications());
      if (toast) {
        setToastItems(prev => [toast, ...prev].slice(0, 4));
        if (toast.playSound) playAppointmentPing();
        window.setTimeout(() => {
          setToastItems(prev => prev.filter(item => item.id !== toast.id));
        }, 10000);
      }
    });

    return unsubscribe;
  }, [playAppointmentPing]);

  React.useEffect(() => {
    const handleClickAway = event => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickAway);
    return () => document.removeEventListener("mousedown", handleClickAway);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/login");
  };

  const navItems = [
    { id: "overview", icon: "🏠", label: "Overview" },
    { id: "profile", icon: "👤", label: "My Profile" },
    { id: "appointments", icon: "📅", label: "Appointments" },
    { id: "treatments", icon: "🏥", label: "Treatments" },
    { id: "medicines", icon: "💊", label: "Medicine Verification" },
    { id: "records", icon: "📁", label: "Medical Records" },
    { id: "symptom", icon: "🩺", label: "Symptom Analyser" },
    ...(
      user.role === "Doctor" ||
      user.role === "Admin" ||
      localStorage.getItem("doctorMode") === "true"
        ? [{ id: "emergency-alerts", icon: "!", label: "Emergency Alerts", badge: "Live" }]
        : []
    ),
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
    } else if (onTabChange) {
      onTabChange(item.id);
    } else {
      navigate("/dashboard", { state: { tab: item.id } });
    }
  };

  const unreadCount = notifications.filter(item => !item.read).length;

  const toggleNotifications = () => {
    setNotifOpen(prev => {
      const next = !prev;
      if (!prev) setNotifications(markAllNotificationsRead());
      return next;
    });
  };

  const notificationIcon = (type) => {
    if (type === "appointment" || type === "reminder") return "📅";
    if (type === "record") return "📄";
    if (type === "profile") return "👤";
    return "🔔";
  };

  const BellIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 8.8a6 6 0 10-12 0c0 7-3 7-3 8.2h18c0-1.2-3-1.2-3-8.2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.6 20a2.6 2.6 0 004.8 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );

  const SettingsIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M19.4 15a1.7 1.7 0 00.34 1.88l.04.04a2.05 2.05 0 11-2.9 2.9l-.04-.04A1.7 1.7 0 0015 19.4a1.7 1.7 0 00-1 1.55V21a2.05 2.05 0 11-4.1 0v-.06A1.7 1.7 0 009 19.4a1.7 1.7 0 00-1.88.34l-.04.04a2.05 2.05 0 11-2.9-2.9l.04-.04A1.7 1.7 0 004.6 15a1.7 1.7 0 00-1.55-1H3a2.05 2.05 0 110-4.1h.06A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.34-1.88l-.04-.04a2.05 2.05 0 112.9-2.9l.04.04A1.7 1.7 0 009 4.6a1.7 1.7 0 001-1.55V3a2.05 2.05 0 114.1 0v.06A1.7 1.7 0 0015 4.6a1.7 1.7 0 001.88-.34l.04-.04a2.05 2.05 0 112.9 2.9l-.04.04A1.7 1.7 0 0019.4 9a1.7 1.7 0 001.55 1H21a2.05 2.05 0 110 4.1h-.06A1.7 1.7 0 0019.4 15Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const formatNotificationTime = (createdAt) => {
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  return (
    <div className="db-root">
      <nav className="db-topnav">
        <div className="db-nav-left">
          <div className="db-logo" onClick={() => navigate("/")}>
            <div className="db-logo-icon">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M10 17.5C10 17.5 2.5 13.125 2.5 7.5A4.375 4.375 0 0110 4.375 4.375 4.375 0 0117.5 7.5C17.5 13.125 10 17.5 10 17.5Z" fill="white" />
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
          <div className="db-notif-wrap" ref={bellRef}>
            <button
              className="db-nav-icon-btn db-bell-btn"
              title="Notifications"
              type="button"
              onClick={toggleNotifications}
            >
              <BellIcon />
              {unreadCount > 0 && <span className="db-notif-count">{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </button>

            {notifOpen && (
              <div className="db-notif-panel">
                <div className="db-notif-panel-head">
                  <span>Notifications</span>
                  <button type="button" className="db-notif-head-btn" onClick={() => setNotifications(markAllNotificationsRead())}>
                    Mark read
                  </button>
                </div>
                <div className="db-notif-list">
                  {notifications.length === 0 ? (
                    <div className="db-notif-empty">No notifications yet.</div>
                  ) : notifications.map(item => (
                    <div className={`db-notif-item ${item.read ? "" : "unread"}`} key={item.id}>
                      <div className="db-notif-item-icon">{notificationIcon(item.type)}</div>
                      <div className="db-notif-item-body">
                        <div className="db-notif-item-title">{item.title}</div>
                        <div className="db-notif-item-text">{item.message}</div>
                        <div className="db-notif-item-time">{formatNotificationTime(item.createdAt)}</div>
                      </div>
                      <button
                        type="button"
                        className="db-notif-remove"
                        aria-label="Remove notification"
                        onClick={() => setNotifications(removeNotification(item.id))}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="db-notif-clear-btn"
                  onClick={() => setNotifications(clearNotifications())}
                  disabled={notifications.length === 0}
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
          <button className="db-nav-icon-btn" title="Settings" type="button" onClick={() => handleNavClick({ id: "profile" })}>
            <SettingsIcon />
          </button>
          <div className="db-nav-avatar" title={user.name}>{user.initials || "PT"}</div>
        </div>
      </nav>

      <div className="db-toast-stack">
        {toastItems.map(item => (
          <div className={`db-toast db-toast-${item.type || "info"}`} key={item.id}>
            <div className="db-toast-icon">{notificationIcon(item.type)}</div>
            <div className="db-toast-body">
              <div className="db-toast-title">{item.title}</div>
              <div className="db-toast-text">{item.message}</div>
            </div>
            <button
              type="button"
              className="db-toast-close"
              aria-label="Dismiss notification"
              onClick={() => setToastItems(prev => prev.filter(toast => toast.id !== item.id))}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="db-body">
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

        <main className="db-main">
          {children}
        </main>
      </div>
    </div>
  );
}
