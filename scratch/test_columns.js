import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unydjalszyszoxvgocmx.supabase.co';
const supabaseKey = 'sb_publishable_kgJM40embkgUsOEY3LOiAw_jTGiX7Js';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSingleColumns() {
  const columns = ['employee_code', 'remark', 'attachment', 'reason', 'timestamp', 'date_and_time', 'end_date', 'status', 'latitude', 'longitude', 'map_link', 'address', 'person_name', 'date', 'time', 'year_name', 'month_name', 'approved_status', 'images'];
  
  for (const col of columns) {
    const { error } = await supabase
      .from('attendance')
      .select(col)
      .limit(1);
    
    if (error) {
      console.log(`Column '${col}': DOES NOT EXIST (Error: ${error.message})`);
    } else {
      console.log(`Column '${col}': EXISTS`);
    }
  }
}

testSingleColumns();
