const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'src', 'data');
const jsonFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
let valid = 0, invalid = 0, errors = [];

jsonFiles.forEach(f => {
  try {
    const content = fs.readFileSync(path.join(dataDir, f), 'utf8');
    JSON.parse(content);
    valid++;
  } catch(e) {
    invalid++;
    errors.push({ file: f, error: e.message.split('\n')[0] });
  }
});

console.log(`\n=== JSON Structure Validation ===`);
console.log(`Files checked: ${jsonFiles.length}`);
console.log(`Valid JSON: ${valid}`);
console.log(`Invalid JSON: ${invalid}`);
if (errors.length > 0) {
  console.log(`\nInvalid files:`);
  errors.forEach(e => console.log(`  ${e.file}: ${e.error}`));
  process.exit(1);
} else {
  console.log(`\nAll JSON files are valid.`);
  process.exit(0);
}
