// controllers/authController.js
// Controller for Login.js and Register.js pages
// Connects to Supabase Auth for registration and login

import supabase from '../config/supabaseClient.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { Resend } from 'resend';

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'your_google_client_id');
let resend;
const getResend = () => {
  if (!resend) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: true });
    console.log('Loaded RESEND_API_KEY in authController:', process.env.RESEND_API_KEY);
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

// POST /api/auth/google-verify
export const googleVerify = async (req, res) => {
  try {
    const { credential, isLogin } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Google credential token is required' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID || 'your_google_client_id',
    });
    
    const payload = ticket.getPayload();
    const { email, name } = payload;

    // Check if user already exists
    let { data: patient, error: fetchError } = await supabase
      .from('patients')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (fetchError) {
      return res.status(500).json({ error: fetchError.message });
    }

    // If user does not exist, handle based on isLogin flag
    if (!patient) {
      if (isLogin) {
        return res.status(404).json({ error: 'Account not found. Please create an account.' });
      }

      // Generate a secure random password hash
      const randomPassword = Math.random().toString(36).slice(-10) + Date.now().toString();
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      // Compute initials
      const initials = name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .substring(0, 3) || 'G';

      // Insert new Google authenticated user
      const { data: newPatient, error: insertError } = await supabase
        .from('patients')
        .insert({
          name,
          email,
          password: hashedPassword,
          initials,
          role: 'Patient',
        })
        .select()
        .single();

      if (insertError) {
        return res.status(500).json({ error: insertError.message });
      }

      patient = newPatient;
    }

    // Generate JWT for patient session
    const token = jwt.sign(
      { id: patient.id, email: patient.email, name: patient.name, role: patient.role },
      process.env.JWT_SECRET || 'your_jwt_secret_here',
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = patient;
    res.json({
      token,
      user: {
        ...userWithoutPassword,
        bloodGroup: userWithoutPassword.blood_group,
        registeredSince: userWithoutPassword.registered_since,
        emergency: userWithoutPassword.emergency_contact,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Deprecated email/password controller functions
export const register = async (req, res) => {
  res.status(410).json({ error: 'Traditional registration is deprecated. Please use Google Sign-Up.' });
};

export const login = async (req, res) => {
  res.status(410).json({ error: 'Traditional login is deprecated. Please use Google Sign-In.' });
};

export const sendEmailOTP = async (req, res) => {
  res.status(410).json({ error: 'Email OTP is deprecated. Please use Google authentication.' });
};

export const verifyEmailOTP = async (req, res) => {
  res.status(410).json({ error: 'Email OTP verification is deprecated. Please use Google authentication.' });
};
