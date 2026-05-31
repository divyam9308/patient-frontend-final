import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const medicineBatches = [
  { medicine_name: 'Paracetamol', brand_name: 'Panadol', manufacturer: 'Haleon / GSK', batch_code: 'PAN8812', expiry_date: '2028-06-30', verification_status: 'verified', source: 'UK MHRA Public Drug Database', manufacturing_date: '2023-06-30', dosage_form: 'tablet', strength: '500mg', country: 'UK' },
  { medicine_name: 'Atorvastatin', brand_name: 'Lipitor', manufacturer: 'Pfizer Inc', batch_code: 'LIP5340', expiry_date: '2027-04-30', verification_status: 'verified', source: 'FDA Approved Package Label', manufacturing_date: '2024-04-30', dosage_form: 'tablet', strength: '20mg', country: 'USA' },
  { medicine_name: 'Metformin HCl', brand_name: 'Riomet', manufacturer: 'Sun Pharma', batch_code: 'MET1802', expiry_date: '2024-05-15', verification_status: 'expired', source: 'FDA Recall Notice / Expired', manufacturing_date: '2022-05-15', dosage_form: 'tablet', strength: '500mg', country: 'USA' },
  { medicine_name: 'Metformin HCl', brand_name: 'Riomet', manufacturer: 'Sun Pharma', batch_code: 'MET9901', expiry_date: '2026-11-30', verification_status: 'recalled', source: 'FDA NDMA impurity recall notice', manufacturing_date: '2023-11-30', dosage_form: 'tablet', strength: '500mg', country: 'USA' },
  { medicine_name: 'Amoxicillin', brand_name: 'Amoxil', manufacturer: 'Sandoz / Novartis', batch_code: 'AMX1948', expiry_date: '2027-10-31', verification_status: 'verified', source: 'Health Canada Drug Registry', manufacturing_date: '2024-10-31', dosage_form: 'capsule', strength: '250mg', country: 'Canada' },
  { medicine_name: 'Ibuprofen', brand_name: 'Advil', manufacturer: 'Haleon / Pfizer', batch_code: 'ADV9012', expiry_date: '2028-12-31', verification_status: 'verified', source: 'OTC Package Label', manufacturing_date: '2023-12-31', dosage_form: 'tablet', strength: '200mg', country: 'USA' },
  { medicine_name: 'Pantoprazole', brand_name: 'Pan-40', manufacturer: 'Alkem Laboratories', batch_code: 'PAN8832', expiry_date: '2027-05-31', verification_status: 'verified', source: 'Indian CDSCO Registry', manufacturing_date: '2024-05-31', dosage_form: 'tablet', strength: '40mg', country: 'India' },
  { medicine_name: 'Metoprolol ER', brand_name: 'Succinate', manufacturer: 'Dr. Reddy\'s Labs', batch_code: 'MET3912', expiry_date: '2027-01-31', verification_status: 'recalled', source: 'FDA recall database for dissolution failure', manufacturing_date: '2024-01-31', dosage_form: 'tablet', strength: '50mg', country: 'USA' },
  { medicine_name: 'Amlodipine', brand_name: 'Amlip', manufacturer: 'Cipla Ltd', batch_code: 'CIP5050', expiry_date: '2027-08-31', verification_status: 'verified', source: 'Public Drug Label', manufacturing_date: '2024-08-31', dosage_form: 'tablet', strength: '5mg', country: 'India' },
  { medicine_name: 'Losartan Potassium', brand_name: 'Cozaar', manufacturer: 'Lupin Pharm.', batch_code: 'LUP1122', expiry_date: '2026-04-30', verification_status: 'recalled', source: 'FDA Azido Impurity Recall Notice', manufacturing_date: '2023-04-30', dosage_form: 'tablet', strength: '50mg', country: 'USA' },
  { medicine_name: 'Guaifenesin', brand_name: 'Cough Syrup', manufacturer: 'Maiden Pharm.', batch_code: 'MAI2022', expiry_date: '2027-09-30', verification_status: 'recalled', source: 'WHO Medical Product Alert (contamination)', manufacturing_date: '2024-09-30', dosage_form: 'syrup', strength: '100mg/5ml', country: 'India' },
  { medicine_name: 'Ranitidine', brand_name: 'Zantac', manufacturer: 'Sanofi', batch_code: 'ZAN9988', expiry_date: '2023-09-30', verification_status: 'recalled', source: 'FDA NDMA contamination recall', manufacturing_date: '2021-09-30', dosage_form: 'tablet', strength: '150mg', country: 'USA' },
  { medicine_name: 'Sildenafil', brand_name: 'Viagra', manufacturer: 'Pfizer Inc', batch_code: 'VIA007A', expiry_date: '2027-12-31', verification_status: 'verified', source: 'Public Package Label', manufacturing_date: '2024-12-31', dosage_form: 'tablet', strength: '50mg', country: 'USA' },
  { medicine_name: 'Vitamin D3', brand_name: 'Softgels', manufacturer: 'Nature\'s Bounty', batch_code: 'VIT8899', expiry_date: '2028-01-31', verification_status: 'verified', source: 'OTC Package Label', manufacturing_date: '2025-01-31', dosage_form: 'capsule', strength: '1000 IU', country: 'USA' },
  { medicine_name: 'Cetirizine', brand_name: 'Zyrtec', manufacturer: 'McNeil Consumer', batch_code: 'ZYR4421', expiry_date: '2028-03-31', verification_status: 'verified', source: 'OTC Package Label', manufacturing_date: '2025-03-31', dosage_form: 'tablet', strength: '10mg', country: 'USA' },
  { medicine_name: 'Paracetamol', brand_name: 'Panadol', manufacturer: 'Haleon / GSK', batch_code: 'EXP1023', expiry_date: '2023-10-31', verification_status: 'expired', source: 'Demonstration of expired batch', manufacturing_date: '2020-10-31', dosage_form: 'tablet', strength: '500mg', country: 'UK' },
  { medicine_name: 'Atorvastatin', brand_name: 'Lipitor', manufacturer: 'Pfizer Inc', batch_code: 'EXP1224', expiry_date: '2024-12-31', verification_status: 'expired', source: 'Demonstration of expired batch', manufacturing_date: '2021-12-31', dosage_form: 'tablet', strength: '20mg', country: 'USA' },
  { medicine_name: 'Aspirin', brand_name: 'Bayer', manufacturer: 'Bayer AG', batch_code: 'BAY1048', expiry_date: '2027-07-31', verification_status: 'verified', source: 'Package Label', manufacturing_date: '2024-07-31', dosage_form: 'tablet', strength: '81mg', country: 'Germany' },
  { medicine_name: 'Lisinopril', brand_name: 'Lisinopril', manufacturer: 'Sandoz', batch_code: 'LIS8772', expiry_date: '2027-02-28', verification_status: 'verified', source: 'Package Label', manufacturing_date: '2024-02-28', dosage_form: 'tablet', strength: '10mg', country: 'USA' },
  { medicine_name: 'Pantoprazole', brand_name: 'Pan-40', manufacturer: 'Alkem Laboratories', batch_code: 'EXP0525', expiry_date: '2025-05-31', verification_status: 'expired', source: 'Demonstration of expired batch', manufacturing_date: '2022-05-31', dosage_form: 'tablet', strength: '40mg', country: 'India' }
];

async function seed() {
  console.log("Starting seed script...");
  
  // Try checking if table exists
  const { data, error: testError } = await supabase.from('medicine_batches').select('id').limit(1);
  if (testError) {
    console.error("Table check failed! You probably need to run the SQL query in Supabase Dashboard first.");
    console.error(testError);
    process.exit(1);
  }

  for (const batch of medicineBatches) {
    const { error } = await supabase
      .from('medicine_batches')
      .upsert(batch, { onConflict: 'batch_code' });
      
    if (error) {
      console.error(`Error inserting batch ${batch.batch_code}:`, error);
    } else {
      console.log(`Inserted/Upserted batch: ${batch.batch_code}`);
    }
  }
  
  console.log("Seed completed.");
  process.exit(0);
}

seed();
