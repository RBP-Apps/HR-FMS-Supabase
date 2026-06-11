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

async function testList() {
  const potentials = [
    'leave_ledger', 'leave_balance', 'emp_leave_balance', 'employee_leave_balance',
    'leave_ledger_history', 'leave_ledgers', 'leave_ledger_entries', 'leave_entries',
    'leave_ledger_details', 'leave_history', 'leave_accruals', 'leave_ledger_record',
    'leave_ledger_records'
  ];
  for (const name of potentials) {
    const { error } = await supabase.from(name).select('*').limit(1);
    if (!error) {
      console.log(`Table ${name} exists!`);
    } else {
      if (error.code !== 'PGRST205') { // PGRST205 means table not found
        console.log(`Table ${name} exists but check returned: ${error.message} (code: ${error.code})`);
      }
    }
  }
}

testList();
