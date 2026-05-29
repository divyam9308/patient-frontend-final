import express from 'express';
import { createAmbulanceRequest, getAmbulanceRequest, updateAmbulanceRequestStatus } from '../controllers/ambulanceController.js';

const router = express.Router();

router.post('/', createAmbulanceRequest);
router.get('/:id', getAmbulanceRequest);
router.patch('/:id/status', updateAmbulanceRequestStatus);

export default router;
