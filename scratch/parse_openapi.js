import fs from 'fs';

const openapi = JSON.parse(fs.readFileSync('scratch/openapi.json', 'utf-8'));
console.log('Keys in openapi:', Object.keys(openapi));
if (openapi.paths) {
  console.log('Keys in paths:', Object.keys(openapi.paths));
} else {
  console.log('paths is undefined. OpenAPI root:', openapi);
}

