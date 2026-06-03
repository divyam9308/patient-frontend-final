import express from 'express';
import authenticateToken from '../middleware/authMiddleware.js';
import {
  getDoctorEmergencyAlerts,
  acceptEmergencyAlert,
  declineEmergencyAlert,
} from '../controllers/doctorController.js';

const router = express.Router();

router.use(authenticateToken);
router.get('/emergency-alerts', getDoctorEmergencyAlerts);
router.post('/emergency-alerts/:requestId/accept', acceptEmergencyAlert);
router.post('/emergency-alerts/:requestId/decline', declineEmergencyAlert);

export default router;
