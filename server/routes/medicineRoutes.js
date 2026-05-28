// routes/medicineRoutes.js
// Routes for MedicineVerification.js page
// Handles: list medications, verify a medicine, add medication, remove medication

import express from 'express';
import authenticateToken from '../middleware/authMiddleware.js';
import {
  getMedications,
  verifyMedicine,
  getVerificationHistory,
  addMedication,
  removeMedication,
} from '../controllers/medicineController.js';

const router = express.Router();

// All medicine routes require authentication
router.use(authenticateToken);

// GET    /api/medicines                → Get all active medications for logged-in patient
router.get('/', getMedications);

// GET    /api/medicines/verify/history → Get verification history list
router.get('/verify/history', getVerificationHistory);

// POST   /api/medicines/verify         → Verify a medicine by name/barcode scan
router.post('/verify', verifyMedicine);

// POST   /api/medicines                → Add a new medication to patient's list
router.post('/', addMedication);

// DELETE /api/medicines/:id            → Remove a medication from patient's list
router.delete('/:id', removeMedication);

export default router;
