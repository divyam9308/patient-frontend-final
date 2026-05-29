import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PrioritySystem from "./pages/PrioritySystem";
import Appointment from "./pages/Appointment";
import Dashboard from "./pages/Dashboard";
import Treatments from "./pages/Treatments";
import MedicineVerification from "./pages/MedicineVerification";
import MedicalRecords from "./pages/MedicalRecords";
import EmergencyBooking from "./pages/EmergencyBooking";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/priority-system" element={<PrioritySystem />} />
        <Route path="/symptom-analyser" element={<PrioritySystem />} />
        <Route path="/appointments" element={<Appointment />} />
        <Route path="/emergency-booking" element={<EmergencyBooking />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/treatments" element={<Treatments />} />
        <Route path="/medicines" element={<MedicineVerification />} />
        <Route path="/records" element={<MedicalRecords />} />
      </Routes>
    </Router>
  );
}

export default App;

