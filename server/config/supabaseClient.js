// config/supabaseClient.js
// Supabase client setup using the official JS SDK
// This is the database connection used across all routes

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// TODO: Add your Supabase URL and keys to your .env file
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default supabase;
