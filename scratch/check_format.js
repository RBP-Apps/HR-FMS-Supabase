import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unydjalszyszoxvgocmx.supabase.co';
const supabaseKey = 'sb_publishable_kgJM40embkgUsOEY3LOiAw_jTGiX7Js';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBioFormat() {
  const { data, error } = await supabase
    .from('offline_biometric_punch')
    .select('in_time, out_time, attendance_date')
    .not('in_time', 'is', null)
    .limit(3);
  
  if (error) {
    console.error(error);
  } else {
    console.log("Biometric format samples:", data);
  }

  const { data: data2, error: error2 } = await supabase
    .from('attendance')
    .select('time, date')
    .not('time', 'is', null)
    .limit(3);
  
  if (error2) {
    console.error(error2);
  } else {
    console.log("Attendance format samples:", data2);
  }
}

checkBioFormat();
