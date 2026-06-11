import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unydjalszyszoxvgocmx.supabase.co';
const supabaseKey = 'sb_publishable_kgJM40embkgUsOEY3LOiAw_jTGiX7Js';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("=== MASTER_HR FIRM NAMES ===");
  const { data, error } = await supabase
    .from("master_hr")
    .select("firm_name")
    .not("firm_name", "is", null);

  if (error) console.error("Error:", error);
  else console.log(data);
}

run();
