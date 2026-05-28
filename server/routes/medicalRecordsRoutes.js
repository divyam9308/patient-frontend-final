// routes/medicalRecordsRoutes.js
// Routes for MedicalRecords.js page
// Handles: list records, upload record, download record, delete record

import express from 'express';
import authenticateToken from '../middleware/authMiddleware.js';
import {
  getMedicalRecords,
  uploadMedicalRecord,
  deleteMedicalRecord,
} from '../controllers/medicalRecordsController.js';

const router = express.Router();

// All medical records routes require authentication
router.use(authenticateToken);

// GET    /api/medical-records          → Get all medical records for logged-in patient
router.get('/', getMedicalRecords);

// POST   /api/medical-records          → Upload a new medical record (file/document)
router.post('/', uploadMedicalRecord);

// DELETE /api/medical-records/:id      → Delete a medical record
router.delete('/:id', deleteMedicalRecord);

export default router;
