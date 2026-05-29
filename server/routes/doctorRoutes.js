import express from 'express';
import { getDoctorEmergencyAlerts, acceptEmergencyAlert, declineEmergencyAlert } from '../controllers/doctorController.js';

const router = express.Router();

router.get('/emergency-alerts', getDoctorEmergencyAlerts);
router.post('/emergency-alerts/:requestId/accept', acceptEmergencyAlert);
router.post('/emergency-alerts/:requestId/decline', declineEmergencyAlert);

export default router;
