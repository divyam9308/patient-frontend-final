// routes/priorityRoutes.js
// Routes for PrioritySystem.js page
// Handles: fetching priority queue, updating priority level, assigning triage level

import express from 'express';
import authenticateToken from '../middleware/authMiddleware.js';
import {
  getPriorityQueue,
  submitPriorityRequest,
  updatePriorityStatus,
} from '../controllers/priorityController.js';

const router = express.Router();

// All priority system routes require authentication
router.use(authenticateToken);

// GET  /api/priority                 → Get current priority/triage queue status for patient
router.get('/', getPriorityQueue);

// POST /api/priority                 → Submit a new priority/triage request
router.post('/', submitPriorityRequest);

// PUT  /api/priority/:id             → Update priority status (e.g. attended, escalated)
router.put('/:id', updatePriorityStatus);

export default router;
