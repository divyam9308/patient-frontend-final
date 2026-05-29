import express from 'express';
import authenticateToken from '../middleware/authMiddleware.js';
import {
  createAmbulanceRequest,
  getAmbulanceRequest,
  updateAmbulanceRequestStatus,
} from '../controllers/ambulanceController.js';

const router = express.Router();

router.use(authenticateToken);
router.post('/', createAmbulanceRequest);
router.get('/:id', getAmbulanceRequest);
router.patch('/:id/status', updateAmbulanceRequestStatus);

export default router;
