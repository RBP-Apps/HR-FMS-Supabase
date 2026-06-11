import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env manually
const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    env[key] = value;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

console.log('URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('enquiry').select('*').limit(1);
  if (error) {
    console.error('Error fetching:', error);
  } else {
    console.log('Keys in enquiry:', data.length > 0 ? Object.keys(data[0]) : 'No rows');
    if (data.length > 0) {
      console.log('Sample row:', data[0]);
    }
  }
}

check();
