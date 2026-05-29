import express from 'express';
import authenticateToken from '../middleware/authMiddleware.js';
import { createEmergencyRequest } from '../controllers/emergencyController.js';

const router = express.Router();

router.use(authenticateToken);
router.post('/', createEmergencyRequest);

export default router;
