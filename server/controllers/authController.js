// controllers/authController.js
// Controller for Login.js and Register.js pages
// Connects to Supabase Auth for registration and login

import supabase from '../config/supabaseClient.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
