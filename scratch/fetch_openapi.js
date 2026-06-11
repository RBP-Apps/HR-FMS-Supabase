import fs from 'fs';

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

const url = env.VITE_SUPABASE_URL + '/rest/v1/';
const key = env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

async function fetchOpenAPI() {
  const response = await fetch(url, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });
  const data = await response.json();
  fs.writeFileSync('scratch/openapi.json', JSON.stringify(data, null, 2));
  console.log('OpenAPI schema fetched and saved to scratch/openapi.json');
}

fetchOpenAPI();
