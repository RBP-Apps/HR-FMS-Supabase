import fs from 'fs';

const openapi = JSON.parse(fs.readFileSync('scratch/openapi.json', 'utf-8'));
const definitions = openapi.definitions || (openapi.components && openapi.components.schemas);

if (!definitions) {
  console.log('No definitions or components.schemas found in openapi.json');
} else {
  const targetTables = ['holiday_master', 'attendance_management', 'attendance_correction_history'];
  for (const t of targetTables) {
    if (definitions[t]) {
      console.log(`\n=== Table: ${t} ===`);
      const properties = definitions[t].properties;
      if (properties) {
        for (const [propName, propVal] of Object.entries(properties)) {
          console.log(`  - ${propName}: ${propVal.type} (${propVal.format || 'no format'})`);
        }
      } else {
        console.log('No properties found.');
      }
    } else {
      console.log(`Table ${t} not found in definitions.`);
    }
  }
}
