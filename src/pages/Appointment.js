import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { 
  api, 
  getCities, 
  getDepartmentsByCity, 
  getHospitalsByCityAndDepartment, 
  getDoctorsByHospitalAndDepartment, 
  getDoctorSchedules, 
  createAppointment 
} from "../utils/api.js";
import "./Dashboard.css";
import "./Appointment.css";

const STATUS_STYLES = {
  upcoming:  { label: "Upcoming",  color: "#2d6a3f", bg: "#eaf4ec", border: "#c8e6c9" },
  completed: { label: "Completed", color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  cancelled: { label: "Cancelled", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  missed:    { label: "Missed",    color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
};

function fmtSlot(slot) {
  const [h, m] = slot.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr   = h % 12 || 12;
  return `${hr.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function todayStr() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

export default function Appointment() {
  const location = useLocation();

  // ── List state ──────────────────────────────────────────
  const [filter,       setFilter]       = useState("all");
  const [appointments, setAppointments] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  // ── Modal state ─────────────────────────────────────────
  const [showBooking, setShowBooking] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [booking,     setBooking]     = useState(false);
  const [bookError,   setBookError]   = useState("");

  // ── Dependent Dropdown Options ──────────────────────────
  const [cities, setCities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  
  // ── Selection State ─────────────────────────────────────
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedHospital, setSelectedHospital] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  // ── Loading States ──────────────────────────────────────
  const [loadingOptions, setLoadingOptions] = useState({
    cities: false, depts: false, hospitals: false, doctors: false, schedules: false
  });

  const selectedDoctor = doctors.find(d => d.doctor_hospital_id === selectedDoctorId);

  // ── Fetch appointments list ─────────────────────────────
  const fetchAppointments = useCallback(() => {
    setLoading(true);
    api.get("/appointments")
      .then(data => setAppointments(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAppointments();
    // Fetch initial cities
    setLoadingOptions(p => ({ ...p, cities: true }));
    getCities().then(setCities).catch(console.error).finally(() => setLoadingOptions(p => ({ ...p, cities: false })));
  }, [fetchAppointments]);

  useEffect(() => {
    if (location.state?.openEmergency) {
      setIsEmergency(true);
      setShowBooking(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location.state]);

  // ── Cascading Fetch Logic ────────────────────────────────
  useEffect(() => {
    setSelectedDept("");
    setDepartments([]);
    if (!selectedCity) return;
    setLoadingOptions(p => ({ ...p, depts: true }));
    getDepartmentsByCity(selectedCity)
      .then(setDepartments)
      .catch(console.error)
      .finally(() => setLoadingOptions(p => ({ ...p, depts: false })));
  }, [selectedCity]);

  useEffect(() => {
    setSelectedHospital("");
    setHospitals([]);
    if (!selectedCity || !selectedDept) return;
    setLoadingOptions(p => ({ ...p, hospitals: true }));
    getHospitalsByCityAndDepartment(selectedCity, selectedDept)
      .then(setHospitals)
      .catch(console.error)
      .finally(() => setLoadingOptions(p => ({ ...p, hospitals: false })));
  }, [selectedDept, selectedCity]);

  useEffect(() => {
    setSelectedDoctorId("");
    setDoctors([]);
    if (!selectedHospital || !selectedDept) return;
    setLoadingOptions(p => ({ ...p, doctors: true }));
    getDoctorsByHospitalAndDepartment(selectedHospital, selectedDept)
      .then(setDoctors)
      .catch(console.error)
      .finally(() => setLoadingOptions(p => ({ ...p, doctors: false })));
  }, [selectedHospital, selectedDept]);

  useEffect(() => {
    setSelectedDate("");
    setSelectedTime("");
    setSchedules([]);
    if (!selectedDoctorId) return;
    setLoadingOptions(p => ({ ...p, schedules: true }));
    getDoctorSchedules(selectedDoctorId)
      .then(setSchedules)
      .catch(console.error)
      .finally(() => setLoadingOptions(p => ({ ...p, schedules: false })));
  }, [selectedDoctorId]);

  // ── Slot Generation ──────────────────────────────────────
  const availableSlots = React.useMemo(() => {
    if (!selectedDate || !schedules.length) return [];
    
    const dayOfWeek = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });
    const daySchedules = schedules.filter(s => s.day_of_week === dayOfWeek);
    
    if (!daySchedules.length) return [];

    const slots = [];
    daySchedules.forEach(sched => {
      let current = new Date(`${selectedDate}T${sched.start_time}`);
      const end = new Date(`${selectedDate}T${sched.end_time}`);
      
      while (current < end) {
        slots.push(current.toTimeString().substring(0, 5) + ':00');
        current.setMinutes(current.getMinutes() + 30);
      }
    });

    // If today, filter out past slots
    if (selectedDate === todayStr()) {
      const nowStr = new Date().toTimeString().substring(0, 8);
      return slots.filter(s => s > nowStr).sort();
    }
    
    return slots.sort();
  }, [selectedDate, schedules]);


  // ── Actions ─────────────────────────────────────────────
  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    setCancellingId(id);
    try {
      await api.put(`/appointments/${id}`, { status: "cancelled" });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: "cancelled" } : a));
    } catch (err) {
      alert(err.message || "Failed to cancel appointment");
    } finally {
      setCancellingId(null);
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setBookError("");

    if (!selectedDoctorId || !selectedDate || !selectedTime) {
      setBookError("Please select doctor, date, and time.");
      return;
    }

    setBooking(true);
    try {
      const newAppt = await createAppointment({
        doctor_hospital_id: selectedDoctorId,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        is_emergency: isEmergency
      });
      setAppointments(prev => [...prev, newAppt].sort((a,b) => new Date(a.appointment_date) - new Date(b.appointment_date)));
      setShowBooking(false);
      resetForm();
    } catch (err) {
      setBookError(err.message || "Failed to book appointment");
    } finally {
      setBooking(false);
    }
  };

  const resetForm = () => {
    setSelectedCity("");
    setSelectedDept("");
    setSelectedHospital("");
    setSelectedDoctorId("");
    setSelectedDate("");
    setSelectedTime("");
    setBookError("");
    setIsEmergency(false);
  };

  const filtered = appointments.filter(a => {
    if (filter === "all") return true;
    if (filter === "upcoming") return a.status === "upcoming";
    if (filter === "past") return ["completed", "cancelled", "missed"].includes(a.status);
    return true;
  });

  return (
    <DashboardLayout>
      <div className="appt-container fade-in">
        <header className="appt-header">
          <div>
            <h1>My Appointments</h1>
            <p className="text-secondary">Book, view, and manage your upcoming visits.</p>
          </div>
          <div className="appt-actions">
            <button className="btn-emergency" onClick={() => { setIsEmergency(true); setShowBooking(true); }}>
              🚨 Emergency Booking
            </button>
            <button className="btn-primary" onClick={() => { setIsEmergency(false); setShowBooking(true); }}>
              + Book Appointment
            </button>
          </div>
        </header>

        {/* List / Tabs */}
        <div className="appt-tabs">
          <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All</button>
          <button className={filter === "upcoming" ? "active" : ""} onClick={() => setFilter("upcoming")}>Upcoming</button>
          <button className={filter === "past" ? "active" : ""} onClick={() => setFilter("past")}>Past</button>
        </div>

        {loading ? (
          <div className="skeleton-loader"><div className="skeleton-card" /><div className="skeleton-card" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>No appointments found</h3>
            <p className="text-secondary">You don't have any {filter !== 'all' ? filter : ''} appointments.</p>
          </div>
        ) : (
          <div className="appt-grid">
            {filtered.map(a => {
              const st = STATUS_STYLES[a.status] || STATUS_STYLES.upcoming;
              return (
                <div key={a.id} className={`appt-card ${a.is_emergency ? "emergency-card" : ""}`}>
                  <div className="appt-card-header">
                    <div className="appt-date">
                      <span className="appt-day">{a.day}</span>
                      <span className="appt-mon">{a.mon}</span>
                    </div>
                    <div className="appt-info">
                      <h3>{a.doc || 'Unknown Doctor'} {a.is_emergency && <span className="em-badge">URGENT</span>}</h3>
                      <p className="appt-dept">{a.dept || 'Department'}</p>
                      <p className="appt-hosp text-secondary">{a.hospital}, {a.city}</p>
                    </div>
                  </div>
                  <div className="appt-card-body">
                    <div className="appt-time">
                      <span className="icon">🕒</span> {a.time}
                    </div>
                    <span 
                      className="status-badge"
                      style={{ color: st.color, backgroundColor: st.bg, borderColor: st.border }}
                    >
                      {st.label}
                    </span>
                  </div>
                  {a.status === "upcoming" && (
                    <div className="appt-card-actions">
                      <button 
                        className="btn-outline-danger" 
                        onClick={() => handleCancel(a.id)}
                        disabled={cancellingId === a.id}
                      >
                        {cancellingId === a.id ? "Cancelling..." : "Cancel"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Booking Modal */}
        {showBooking && (
          <div className="modal-overlay fade-in">
            <div className="modal-content large-modal slide-up">
              <button className="modal-close" onClick={() => { setShowBooking(false); resetForm(); }}>&times;</button>
              <h2>{isEmergency ? "🚨 Emergency Booking" : "Book New Appointment"}</h2>
              
              <form onSubmit={handleBook} className="book-form">
                
                {/* Step 1: City */}
                <div className="form-group">
                  <label>1. Select City</label>
                  <select 
                    value={selectedCity} 
                    onChange={e => setSelectedCity(e.target.value)}
                    required
                  >
                    <option value="">{loadingOptions.cities ? "Loading cities..." : "-- Choose City --"}</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Step 2: Department */}
                <div className="form-group">
                  <label>2. Select Department</label>
                  <select 
                    value={selectedDept} 
                    onChange={e => setSelectedDept(e.target.value)}
                    disabled={!selectedCity}
                    required
                  >
                    <option value="">{loadingOptions.depts ? "Loading departments..." : "-- Choose Department --"}</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                {/* Step 3: Hospital */}
                <div className="form-group">
                  <label>3. Select Hospital</label>
                  <select 
                    value={selectedHospital} 
                    onChange={e => setSelectedHospital(e.target.value)}
                    disabled={!selectedDept}
                    required
                  >
                    <option value="">{loadingOptions.hospitals ? "Loading hospitals..." : "-- Choose Hospital --"}</option>
                    {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>

                {/* Step 4: Doctor */}
                <div className="form-group">
                  <label>4. Select Doctor</label>
                  <select 
                    value={selectedDoctorId} 
                    onChange={e => setSelectedDoctorId(e.target.value)}
                    disabled={!selectedHospital}
                    required
                  >
                    <option value="">{loadingOptions.doctors ? "Loading doctors..." : "-- Choose Doctor --"}</option>
                    {doctors.map(d => <option key={d.doctor_hospital_id} value={d.doctor_hospital_id}>{d.name} ({d.qualification})</option>)}
                  </select>
                </div>

                {/* Doctor Details Card */}
                {selectedDoctor && (
                  <div className="doctor-details-card fade-in">
                    <h4>🩺 {selectedDoctor.name}</h4>
                    <p><strong>Qualification:</strong> {selectedDoctor.qualification}</p>
                    <p><strong>Hospital:</strong> {selectedDoctor.hospital_name}</p>
                    <p><strong>Room:</strong> {selectedDoctor.room_number}</p>
                    <p><strong>Phone:</strong> {selectedDoctor.hospital_phone}</p>
                    <p><strong>Fee:</strong> ₹{selectedDoctor.consultation_fee}</p>
                    {selectedDoctor.source_url && (
                      <p><strong>Source:</strong> <a href={selectedDoctor.source_url} target="_blank" rel="noreferrer">Verify Schedule</a></p>
                    )}
                  </div>
                )}

                {/* Step 5: Date & Time */}
                <div className="form-row">
                  <div className="form-group">
                    <label>5a. Select Date</label>
                    <input 
                      type="date" 
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      min={!isEmergency ? todayStr() : undefined}
                      disabled={!selectedDoctorId}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>5b. Select Time Slot</label>
                    <select 
                      value={selectedTime} 
                      onChange={e => setSelectedTime(e.target.value)}
                      disabled={!selectedDate || availableSlots.length === 0}
                      required
                    >
                      <option value="">
                        {loadingOptions.schedules 
                          ? "Loading schedules..." 
                          : (!selectedDate 
                              ? "-- Select date first --" 
                              : (availableSlots.length === 0 ? "No slots available this day" : "-- Choose Slot --"))}
                      </option>
                      {availableSlots.map(slot => (
                        <option key={slot} value={slot}>{fmtSlot(slot)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {bookError && <div className="error-msg fade-in">{bookError}</div>}

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => { setShowBooking(false); resetForm(); }}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={booking || !selectedTime}>
                    {booking ? "Booking..." : (isEmergency ? "🚨 Book Emergency" : "Confirm Booking")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}