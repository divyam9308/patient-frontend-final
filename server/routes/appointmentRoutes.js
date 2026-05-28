// routes/appointmentRoutes.js
// Routes for Appointment.js page
// Handles: list appointments, book new appointment, cancel/update appointment

import express from 'express';
import authenticateToken from '../middleware/authMiddleware.js';
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from '../controllers/appointmentController.js';

const router = express.Router();

// All appointment routes require authentication
router.use(authenticateToken);

// GET    /api/appointments         → Get all appointments for logged-in patient
router.get('/', getAppointments);

// POST   /api/appointments         → Book a new appointment
router.post('/', createAppointment);

// PUT    /api/appointments/:id     → Update/reschedule an appointment
router.put('/:id', updateAppointment);

// DELETE /api/appointments/:id     → Cancel an appointment
router.delete('/:id', deleteAppointment);

export default router;
