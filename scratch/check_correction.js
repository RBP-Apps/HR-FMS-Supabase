import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unydjalszyszoxvgocmx.supabase.co';
const supabaseKey = 'sb_publishable_kgJM40embkgUsOEY3LOiAw_jTGiX7Js';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCorrectionKeys() {
  console.log("Checking columns of corrected attendance records...");
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('approved_status', 'corrected')
    .limit(1);

  if (error) {
    console.error("Error fetching correction:", error);
  } else if (data && data.length > 0) {
    console.log("Correction record keys:", Object.keys(data[0]));
    console.log("Correction record details:", data[0]);
  } else {
    console.log("No corrected attendance records found. Fetching any record with non-null remark...");
    const { data: data2, error: error2 } = await supabase
      .from('attendance')
      .select('*')
      .not('remark', 'is', null)
      .limit(1);
    if (error2) {
      console.error("Error fetching record with remark:", error2);
    } else if (data2 && data2.length > 0) {
      console.log("Record with remark keys:", Object.keys(data2[0]));
    } else {
      console.log("No records with non-null remarks found.");
    }
  }
}

checkCorrectionKeys();
