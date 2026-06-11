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

async function inspect() {
  const tables = ['holiday_master', 'attendance_management', 'attendance_correction_history'];
  for (const t of tables) {
    console.log(`\n--- Inspecting ${t} ---`);
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.error(`Error fetching from ${t}:`, error.message);
    } else {
      console.log(`Fetched data for ${t}:`, data);
      if (data && data.length > 0) {
        console.log(`Columns in ${t}:`, Object.keys(data[0]));
      } else {
        console.log(`Table ${t} has no rows. Trying to insert and rollback or just querying rest metadata if available.`);
      }
    }
  }
}
inspect();
