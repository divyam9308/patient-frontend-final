// routes/appointmentRoutes.js
// Routes for Appointment.js page
// Handles: list appointments, book new appointment, cancel/update appointment
// NEW: cities, departments, hospitals, doctors, and schedules

import express from 'express';
import authenticateToken from '../middleware/authMiddleware.js';
import {
  getCities,
  getDepartments,
  getHospitals,
  getDoctors,
  getDoctorSchedules,
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from '../controllers/appointmentController.js';

const router = express.Router();

// All appointment routes require authentication
router.use(authenticateToken);

// Relational Meta Routes
router.get('/cities', getCities);
router.get('/departments', getDepartments);
router.get('/hospitals', getHospitals);
router.get('/doctors', getDoctors);
router.get('/doctors/:doctorHospitalId/schedules', getDoctorSchedules);

// Appointment CRUD
router.get('/', getAppointments);
router.post('/', createAppointment);
router.put('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);

export default router;
