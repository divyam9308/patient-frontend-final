import express from 'express';
import { submitTriage, getTriageRequest } from '../controllers/triageController.js';

const router = express.Router();

router.post('/', submitTriage);
router.get('/:id', getTriageRequest);

export default router;
