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
  const { data, error } = await supabase.from('employee_leave_balance').select('*').limit(1);
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('employee_leave_balance exists, count:', data.length);
    if (data.length > 0) {
      console.log('Columns:', Object.keys(data[0]));
      console.log('Row:', data[0]);
    } else {
      console.log('No rows. Let\'s try to insert a test row to discover columns.');
      // Try minimal insert
      const { data: insData, error: insErr } = await supabase
        .from('employee_leave_balance')
        .insert([{ employee_id: '123' }])
        .select();
      if (insErr) {
        console.error('Insert error:', insErr.message);
      } else {
        console.log('Insert success! Columns:', Object.keys(insData[0]));
        await supabase.from('employee_leave_balance').delete().eq('id', insData[0].id);
      }
    }
  }
}

inspect();
