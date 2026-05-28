// routes/dashboardRoutes.js
// Routes for Dashboard.js page
// Handles: patient profile, stats summary, upcoming appointments snapshot, active medications snapshot

import express from 'express';
import authenticateToken from '../middleware/authMiddleware.js';
import {
  getDashboardSummary,
  getPatientProfile,
  updatePatientProfile,
} from '../controllers/dashboardController.js';

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticateToken);

// GET /api/dashboard/summary    → Overall stats (upcoming appts, active meds, records, treatments count)
router.get('/summary', getDashboardSummary);

// GET /api/dashboard/profile    → Get logged-in patient profile info
router.get('/profile', getPatientProfile);

// PUT /api/dashboard/profile    → Update patient profile info
router.put('/profile', updatePatientProfile);

export default router;
