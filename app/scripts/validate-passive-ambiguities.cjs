const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'src', 'data');
let ambiguities;
try {
  ambiguities = JSON.parse(fs.readFileSync(path.join(dataDir, 'ambiguities.json'), 'utf8'));
} catch(e) {
  console.error('Could not load ambiguities.json:', e.message);
  process.exit(1);
}

const entries = ambiguities.entries || ambiguities.ambiguities || ambiguities;
const items = Array.isArray(entries) ? entries : [];
let checked = 0, flagged = [];

items.forEach(entry => {
  if (entry.category !== 'active_passive') return;
  checked++;
  const opts = entry.options || [];
  if (opts.length < 2) return;

  const active = opts[0];
  const passive = opts[1];

  if (active.vocalized === passive.vocalized) {
    flagged.push({
      id: entry.id,
      location: entry.location,
      consonants: entry.consonants,
      activeVocalized: active.vocalized,
      passiveVocalized: passive.vocalized,
      issue: 'Active and passive vocalizations are IDENTICAL'
    });
  }
});

console.log(`\n=== Passive Ambiguity Validation ===`);
console.log(`Active/passive entries checked: ${checked}`);
console.log(`Flagged entries: ${flagged.length}`);
if (flagged.length > 0) {
  console.log(`\nFlagged entries:`);
  flagged.forEach(f => {
    console.log(`  id=${f.id} (${f.location}) "${f.consonants}": ${f.issue}`);
    console.log(`    Active:  ${f.activeVocalized}`);
    console.log(`    Passive: ${f.passiveVocalized}`);
  });
  process.exit(1);
} else {
  console.log(`\nAll active/passive pairs have distinct vocalizations.`);
  process.exit(0);
}
