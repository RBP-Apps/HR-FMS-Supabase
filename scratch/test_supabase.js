const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://unydjalszyszoxvgocmx.supabase.co";
const supabaseKey = "sb_publishable_kgJM40embkgUsOEY3LOiAw_jTGiX7Js";
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  try {
    // Try to fetch follow_up
    console.log("Fetching follow_up...");
    const { data: followUp, error: err1 } = await supabase.from('follow_up').select('*').limit(1);
    if (err1) {
      console.error("Error follow_up:", err1);
    } else {
      console.log("follow_up exists, count:", followUp.length);
    }

    // Try to fetch offer_letters
    console.log("Fetching offer_letters...");
    const { data: offerLetters, error: err2 } = await supabase.from('offer_letters').select('*').limit(1);
    if (err2) {
      console.error("Error offer_letters:", err2);
    } else {
      console.log("offer_letters exists, count:", offerLetters.length);
    }

    // Try to fetch enquiry
    console.log("Fetching enquiry...");
    const { data: enquiry, error: err3 } = await supabase.from('enquiry').select('*').limit(1);
    if (err3) {
      console.error("Error enquiry:", err3);
    } else {
      console.log("enquiry exists, count:", enquiry.length);
    }
  } catch (e) {
    console.error("Exception:", e);
  }
}

checkTables();
