import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

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

async function check() {
  const { data, error } = await supabase.from('attendance_management').select('attendance_data').eq('id', 13).single();
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('attendance_data keys:', Object.keys(data.attendance_data));
    console.log('attendance_data day 1:', data.attendance_data['1']);
    console.log('attendance_data day 2:', data.attendance_data['2']);
    console.log('attendance_data day 15:', data.attendance_data['15']);
  }
}
check();
