const supabaseUrl = "https://unydjalszyszoxvgocmx.supabase.co";
const supabaseKey = "sb_publishable_kgJM40embkgUsOEY3LOiAw_jTGiX7Js";

async function listTables() {
  try {
    const response = await fetch(supabaseUrl + '/rest/v1/', {
      headers: {
        'apikey': supabaseKey,
        'Authorization': 'Bearer ' + supabaseKey
      }
    });
    const text = await response.text();
    console.log("Raw Response:", text.substring(0, 1000));
  } catch (e) {
    console.error("Error:", e.message);
  }
}

listTables();
