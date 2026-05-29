import express from 'express';
import authenticateToken from '../middleware/authMiddleware.js';
import { submitTriage, getTriageRequest } from '../controllers/triageController.js';

const router = express.Router();

router.use(authenticateToken);
router.post('/', submitTriage);
router.get('/:id', getTriageRequest);

export default router;
