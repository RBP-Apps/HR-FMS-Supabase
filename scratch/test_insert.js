import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Parse .env manually
const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    env[key] = value;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('joining')
    .insert([{
      rbp_joining_id: 'RBP-TEST-TEMP',
      status: 'Active',
      firm_name: 'Test Firm',
      name_as_per_aadhar: 'Test User',
      employee_category: 'Office Staff'
    }])
    .select();

  if (error) {
    console.error('Error inserting with employee_category:', error);
  } else {
    console.log('Success inserting with employee_category:', data);
    // Delete the temp row
    const { error: delErr } = await supabase
      .from('joining')
      .delete()
      .eq('rbp_joining_id', 'RBP-TEST-TEMP');
    console.log('Deleted temp row, error if any:', delErr);
  }
}

test();
