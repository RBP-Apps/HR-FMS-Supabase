import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unydjalszyszoxvgocmx.supabase.co';
const supabaseKey = 'sb_publishable_kgJM40embkgUsOEY3LOiAw_jTGiX7Js';

async function getDetailedColumns() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
      }
    });
    const schema = await res.json();
    console.log("Response:", schema);
  } catch (e) {
    console.error("Error fetching schema:", e);
  }
}

getDetailedColumns();
