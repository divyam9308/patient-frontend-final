// routes/authRoutes.js
// Routes for Login.js and Register.js pages
// Handles: user registration, user login

import express from 'express';
import { register, login } from '../controllers/authController.js';

const router = express.Router();

// POST /api/auth/register   → Register a new patient (Register.js page)
router.post('/register', register);

// POST /api/auth/login      → Login existing patient (Login.js page)
router.post('/login', login);

export default router;
