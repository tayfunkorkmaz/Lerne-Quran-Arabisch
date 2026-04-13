const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'src', 'data');
let quran;
try {
  quran = JSON.parse(fs.readFileSync(path.join(dataDir, 'quran-simple-clean.json'), 'utf8'));
} catch(e) {
  console.error('Could not load quran-simple-clean.json:', e.message);
  process.exit(1);
}

// Build verse count per surah
const surahVerseCounts = {};
if (Array.isArray(quran)) {
  quran.forEach(v => {
    const s = v.surah || v.chapter;
    if (!surahVerseCounts[s] || v.ayah > surahVerseCounts[s] || v.verse > surahVerseCounts[s]) {
      surahVerseCounts[s] = v.ayah || v.verse;
    }
  });
} else if (quran.surahs) {
  quran.surahs.forEach(s => { surahVerseCounts[s.number || s.index] = s.ayahs ? s.ayahs.length : s.verses.length; });
} else {
  // Try object keys
  Object.keys(quran).forEach(k => {
    const parts = k.split(':');
    if (parts.length === 2) {
      const s = parseInt(parts[0]), v = parseInt(parts[1]);
      if (!surahVerseCounts[s] || v > surahVerseCounts[s]) surahVerseCounts[s] = v;
    }
  });
}

function validateRef(ref) {
  if (!ref || ref === '—' || ref === '--' || ref === 'nicht belegt') return null;
  const m = String(ref).match(/(\d+):(\d+)/);
  if (!m) return null;
  const s = parseInt(m[1]), v = parseInt(m[2]);
  if (s < 1 || s > 114) return { ref, error: `Invalid surah ${s}` };
  const max = surahVerseCounts[s];
  if (max && v > max) return { ref, error: `Ayah ${v} exceeds max ${max} for surah ${s}` };
  if (v < 1) return { ref, error: `Invalid ayah ${v}` };
  return null;
}

let totalRefs = 0, invalidRefs = [];

function scanValue(val, filepath) {
  if (!val) return;
  if (typeof val === 'string') {
    const matches = val.match(/\d+:\d+/g);
    if (matches) matches.forEach(ref => {
      totalRefs++;
      const err = validateRef(ref);
      if (err) invalidRefs.push({ ...err, file: path.basename(filepath) });
    });
  } else if (Array.isArray(val)) {
    val.forEach(item => scanValue(item, filepath));
  } else if (typeof val === 'object') {
    Object.entries(val).forEach(([k, v]) => {
      if (['ref', 'location', 'quranicRef', 'verse', 'quranRef'].includes(k) && typeof v === 'string') {
        totalRefs++;
        const err = validateRef(v);
        if (err) invalidRefs.push({ ...err, file: path.basename(filepath) });
      }
      if (k === 'quranicLocations' && Array.isArray(v)) {
        v.forEach(r => { totalRefs++; const e = validateRef(r); if (e) invalidRefs.push({...e, file: path.basename(filepath)}); });
      }
      scanValue(v, filepath);
    });
  }
}

const jsonFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.json') && !f.includes('node_modules'));
jsonFiles.forEach(f => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8'));
    scanValue(data, f);
  } catch { /* skip non-parseable */ }
});

console.log(`\n=== Quran Reference Validation ===`);
console.log(`Files scanned: ${jsonFiles.length}`);
console.log(`Total references found: ${totalRefs}`);
console.log(`Invalid references: ${invalidRefs.length}`);
if (invalidRefs.length > 0) {
  console.log(`\nInvalid references:`);
  invalidRefs.forEach(r => console.log(`  ${r.file}: ${r.ref} — ${r.error}`));
  process.exit(1);
} else {
  console.log(`\nAll references valid.`);
  process.exit(0);
}
