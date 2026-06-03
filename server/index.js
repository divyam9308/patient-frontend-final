// index.js
// Main Express server entry point for the Patient Portal backend
// Uses Supabase as the database provider

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import all route files
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import medicalRecordsRoutes from './routes/medicalRecordsRoutes.js';
import medicineRoutes from './routes/medicineRoutes.js';
import treatmentRoutes from './routes/treatmentRoutes.js';
import priorityRoutes from './routes/priorityRoutes.js';
import triageRoutes from './routes/triageRoutes.js';
import emergencyRoutes from './routes/emergencyRoutes.js';
import ambulanceRoutes from './routes/ambulanceRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import { expireOldEmergencyRequests } from './controllers/emergencyController.js';
import authenticateToken from './middleware/authMiddleware.js';
import {
  getCities,
  getDepartments,
  getHospitals,
  getDoctors,
  getDoctorSchedules,
} from './controllers/appointmentController.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });
console.log('[Backend Startup] SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('[Backend Startup] JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('[Backend Startup] GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);

const requiredEnv = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.warn(`[Backend Startup] Missing environment variables: ${missingEnv.join(', ')}`);
}

const app = express();
const PORT = process.env.PORT || 5000;
const EMERGENCY_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

// ── Middleware ──────────────────────────────────────────
app.use(cors({ origin: '*' })); // Allow all origins for local network testing
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[Backend] ${req.method} ${req.url}`);
  next();
});

// ── Routes ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);             // Login.js, Register.js
app.use('/api/dashboard', dashboardRoutes);   // Dashboard.js
app.use('/api/appointments', appointmentRoutes);    // Appointment.js
app.use('/api/medical-records', medicalRecordsRoutes); // MedicalRecords.js
app.use('/api/medicines', medicineRoutes);    // MedicineVerification.js
app.use('/api/treatments', treatmentRoutes);  // Treatments.js
app.use('/api/priority', priorityRoutes);     // PrioritySystem.js
app.use('/api/triage', triageRoutes);         // Symptom triage
app.use('/api/emergency-requests', emergencyRoutes);
app.use('/api/ambulance-requests', ambulanceRoutes);
app.use('/api/doctor', doctorRoutes);

// Top-level directory aliases used by the appointment flow.
app.get('/api/cities', authenticateToken, getCities);
app.get('/api/departments', authenticateToken, getDepartments);
app.get('/api/hospitals', authenticateToken, getHospitals);
app.get('/api/doctors', authenticateToken, getDoctors);
app.get('/api/doctors/:doctorHospitalId/schedules', authenticateToken, getDoctorSchedules);

// ── Health Check ────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Patient Portal API is running' });
});

// ── Start Server ────────────────────────────────────────
// Vercel handles the port listening automatically in production
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  expireOldEmergencyRequests();
  setInterval(expireOldEmergencyRequests, EMERGENCY_CLEANUP_INTERVAL_MS);
}

// Export the Express API for Vercel's serverless function
export default app;
