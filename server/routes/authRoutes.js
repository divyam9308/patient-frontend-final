// routes/authRoutes.js
// Routes for Login.js and Register.js pages
// Handles: user registration, user login

import express from 'express';
import { register, login, googleVerify, sendEmailOTP, verifyEmailOTP } from '../controllers/authController.js';

const router = express.Router();

// POST /api/auth/google-verify → Real Google authentication token verification
router.post('/google-verify', googleVerify);

// Disable traditional email/password registration and login
// router.post('/register', register);
// router.post('/login', login);
// router.post('/send-otp', sendEmailOTP);
// router.post('/verify-otp', verifyEmailOTP);

export default router;
