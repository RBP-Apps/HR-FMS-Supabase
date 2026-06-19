import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://unydjalszyszoxvgocmx.supabase.co";
const supabaseKey = "sb_publishable_kgJM40embkgUsOEY3LOiAw_jTGiX7Js";
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('joining')
    .select('rbp_joining_id, name_as_per_aadhar, date_of_joining')
    .or('name_as_per_aadhar.ilike.%vishal%,name_as_per_aadhar.ilike.%devesh%,name_as_per_aadhar.ilike.%urvasi%');

  if (error) {
    console.error(error);
    return;
  }

  console.log("Dates of joining:");
  data.forEach(row => {
    console.log(`${row.name_as_per_aadhar}: ${row.date_of_joining}`);
  });
}
test();
