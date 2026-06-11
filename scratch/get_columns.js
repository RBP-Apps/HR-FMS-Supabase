import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unydjalszyszoxvgocmx.supabase.co';
const supabaseKey = 'sb_publishable_kgJM40embkgUsOEY3LOiAw_jTGiX7Js';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  console.log("Checking columns for offline_biometric_punch...");
  const { data: bioData, error: bioError } = await supabase
    .from('offline_biometric_punch')
    .select('*')
    .limit(1);
  if (bioError) {
    console.error("Error offline_biometric_punch:", bioError);
  } else {
    console.log("offline_biometric_punch sample row:", bioData[0] ? Object.keys(bioData[0]) : "No records");
  }

  console.log("\nChecking columns for attendance...");
  const { data: attData, error: attError } = await supabase
    .from('attendance')
    .select('*')
    .limit(1);
  if (attError) {
    console.error("Error attendance:", attError);
  } else {
    console.log("attendance sample row:", attData[0] ? Object.keys(attData[0]) : "No records");
  }
}

checkColumns();
