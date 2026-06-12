import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unydjalszyszoxvgocmx.supabase.co';
const supabaseKey = 'sb_publishable_kgJM40embkgUsOEY3LOiAw_jTGiX7Js';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  const tables = ['holiday_master', 'final_attendance', 'leave_ledger', 'attendance_finalization_log'];
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`Table "${table}" error:`, error.message);
      } else {
        console.log(`Table "${table}" exists. Sample:`, data);
      }
    } catch (err) {
      console.log(`Table "${table}" fetch exception:`, err);
    }
  }
}

testQuery();
