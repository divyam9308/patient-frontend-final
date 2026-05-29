import express from 'express';
import { createEmergencyRequest } from '../controllers/emergencyController.js';

const router = express.Router();

router.post('/', createEmergencyRequest);

export default router;
