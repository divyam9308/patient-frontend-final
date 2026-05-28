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

// In-memory store for OTPs (For production, consider Redis or adding columns to your database)
const otpStore = new Map();

// Resend is initialized above with the API key from .env

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, dob, gender, bloodGroup, address, aadhar } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('patients')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      return res.status(500).json({ error: checkError.message });
    }

    if (existingUser) {
      return res.status(400).json({ error: 'A patient with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Compute initials
    const initials = name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 3);

    // Insert new patient
    const { data: newUser, error: insertError } = await supabase
      .from('patients')
      .insert({
        name,
        email,
        password: hashedPassword,
        phone,
        dob,
        gender,
        blood_group: bloodGroup,
        address,
        aadhar,
        initials,
        role: 'Patient',
      })
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
      process.env.JWT_SECRET || 'your_jwt_secret_here',
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({
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

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find patient by email
    const { data: patient, error: fetchError } = await supabase
      .from('patients')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (fetchError) {
      return res.status(500).json({ error: fetchError.message });
    }

    if (!patient) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, patient.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT
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

// POST /api/auth/google-verify
export const googleVerify = async (req, res) => {
  try {
    const { credential } = req.body;

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

    // If user does not exist, auto-register them
    if (!patient) {
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

// POST /api/auth/send-otp
export const sendEmailOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in memory with a 5 minute expiration
    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
    });

    // Send Email via Resend
    const { error: emailError } = await getResend().emails.send({
      from: 'HealthCare App <onboarding@resend.dev>',
      to: email,
      subject: 'Your Login Passcode',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:400px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px">
          <h2 style="color:#1a5c3a">🔐 Your Login Passcode</h2>
          <p style="font-size:16px">Use the code below to sign in to your HealthCare account:</p>
          <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:24px;text-align:center;margin:24px 0">
            <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#15803d">${otp}</span>
          </div>
          <p style="color:#64748b;font-size:14px">This code expires in <strong>5 minutes</strong>. Do not share it with anyone.</p>
        </div>
      `,
    });

    if (emailError) {
      console.error('Resend Error:', emailError);
      return res.status(500).json({ error: 'Failed to send OTP email: ' + emailError.message });
    }
    
    res.json({ message: 'Passcode sent successfully' });
  } catch (error) {
    console.error('OTP Send Error:', error);
    res.status(500).json({ error: 'Failed to send OTP email.' });
  }
};

// POST /api/auth/verify-otp
export const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const storedData = otpStore.get(email);

    if (!storedData) {
      return res.status(400).json({ error: 'No OTP requested for this email or it has expired' });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ error: 'OTP has expired' });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // OTP is valid, clear it
    otpStore.delete(email);

    // Find patient by email
    let { data: patient, error: fetchError } = await supabase
      .from('patients')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (fetchError) {
      return res.status(500).json({ error: fetchError.message });
    }

    // If patient doesn't exist, we could auto-register them like Google login, 
    // but typically we want them to have set a name. 
    // Let's create a minimal profile or require registration first.
    if (!patient) {
      // Create minimal profile
      const randomPassword = Math.random().toString(36).slice(-10) + Date.now().toString();
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);
      
      const { data: newPatient, error: insertError } = await supabase
        .from('patients')
        .insert({
          name: email.split('@')[0], // Use part of email as default name
          email,
          password: hashedPassword,
          initials: email.substring(0, 2).toUpperCase(),
          role: 'Patient',
        })
        .select()
        .single();

      if (insertError) {
        return res.status(500).json({ error: insertError.message });
      }
      
      patient = newPatient;
    }

    // Generate JWT
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
