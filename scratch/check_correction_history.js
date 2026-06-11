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

async function testInsert() {
  const mockRecord = {
    employee_id: '123',
    employee_name: 'Test Employee',
    date: '2026-06-10',
    old_value: 'A',
    new_value: 'P',
    changed_by: 'HR Admin',
    remark: 'Test Correction',
    changed_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('attendance_correction_history')
    .insert([mockRecord])
    .select();

  if (error) {
    console.error('Insert error:', error.message);
  } else {
    console.log('Insert success! Inserted row:', data);
    // clean up
    await supabase.from('attendance_correction_history').delete().eq('employee_id', '123');
  }
}
testInsert();
