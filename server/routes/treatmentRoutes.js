// routes/treatmentRoutes.js
// Routes for Treatments.js page
// Handles: list treatments, add treatment, update treatment progress, delete treatment

import express from 'express';
import authenticateToken from '../middleware/authMiddleware.js';
import {
  getTreatments,
  addTreatment,
  updateTreatment,
  deleteTreatment,
  getDiaryLogs,
  addDiaryLog,
} from '../controllers/treatmentController.js';

const router = express.Router();

// All treatment routes require authentication
router.use(authenticateToken);

// GET    /api/treatments/logs         → Get diary logs
router.get('/logs', getDiaryLogs);

// POST   /api/treatments/logs         → Add a diary log
router.post('/logs', addDiaryLog);

// GET    /api/treatments              → Get all treatments for logged-in patient
router.get('/', getTreatments);

// POST   /api/treatments              → Add a new treatment plan
router.post('/', addTreatment);

// PUT    /api/treatments/:id          → Update treatment progress/details
router.put('/:id', updateTreatment);

// DELETE /api/treatments/:id          → Delete a treatment
router.delete('/:id', deleteTreatment);

export default router;
