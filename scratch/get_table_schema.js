import fs from 'fs';

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

const url = env.VITE_SUPABASE_URL + '/rest/v1/attendance_correction_history';
const key = env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

async function getOptions() {
  const response = await fetch(url, {
    method: 'OPTIONS',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });
  const data = await response.json();
  console.log('OPTIONS Response for attendance_correction_history:', JSON.stringify(data, null, 2));
}

getOptions();
