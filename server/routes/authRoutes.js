// routes/authRoutes.js
// Routes for Login.js and Register.js pages
// Handles: user registration, user login

import express from 'express';
import { register, login, googleVerify, sendEmailOTP, verifyEmailOTP } from '../controllers/authController.js';

const router = express.Router();

// POST /api/auth/register   → Register a new patient (Register.js page)
router.post('/register', register);

// POST /api/auth/login      → Login existing patient (Login.js page)
router.post('/login', login);

// POST /api/auth/google-verify → Real Google authentication token verification
router.post('/google-verify', googleVerify);

// POST /api/auth/send-otp   → Send Email OTP
router.post('/send-otp', sendEmailOTP);

// POST /api/auth/verify-otp → Verify Email OTP
router.post('/verify-otp', verifyEmailOTP);

export default router;
