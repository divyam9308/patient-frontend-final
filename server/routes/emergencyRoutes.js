import express from 'express';
import authenticateToken from '../middleware/authMiddleware.js';
import {
  createEmergencyRequest,
  getDelhiLocalities,
  getEmergencyHospitalAvailability,
} from '../controllers/emergencyController.js';

const router = express.Router();

router.use(authenticateToken);
router.get('/localities', getDelhiLocalities);
router.get('/hospital-availability', getEmergencyHospitalAvailability);
router.post('/', createEmergencyRequest);

export default router;
