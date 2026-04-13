/**
 * audit-verify-urls.cjs
 * Final audit of verifyUrl coverage across all JSON data files.
 * Scans every .json file, recursively traverses structures, counts URL fields,
 * detects missing verifyUrls on verse-referencing objects, and reports coverage.
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const VERSE_REF_PATTERN = /\d{1,3}:\d{1,3}/;
const INLINE_VERSE_REF = /\(\d{1,3}:\d{1,3}\)/;

// Fields that contain verse references (surah:ayah format)
const VERSE_REF_FIELDS = [
  'location', 'ref', 'quranRef', 'mainLocation', 'exampleLocation',
  'verseRef', 'ayahRef', 'source', 'sourceRef', 'reference',
  'quranReference', 'verseLocation', 'loc'
];

// Text fields to scan for inline verse refs like (2:255)
const TEXT_FIELDS = [
  'prompt', 'explanation', 'answer', 'content', 'meaning',
  'description', 'note', 'notes', 'hint', 'text', 'question',
  'meaning_de', 'meaning_en', 'context', 'comment', 'remark',
  'detail', 'details'
];

// Files to skip (raw Quran text, morphology DB, etc. -- not exercise/reference data)
const SKIP_FILES = new Set([
  'quran-simple-clean.json',
  'quran-uthmani.json',
  'quran-vocalized.json',
  'quran-rasm.json',
  'quran-morphology-db.json',
  'quran-checksum.json',
  'audio-config.json',
  'lanes-lexicon-urls.json',
  'sura-index.json',
  'rasm-glyph-mapping.json'
]);

function getJsonFiles(dir) {
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json') && !SKIP_FILES.has(f))
    .sort();
}

function isPlainObject(val) {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

/**
 * Check if an object has separate surah + ayah/verse numeric fields
 */
function hasSurahVerseFields(obj) {
  const hasSurah = typeof obj.surah === 'number' || typeof obj.sura === 'number';
  const hasVerse = typeof obj.ayah === 'number' || typeof obj.verse === 'number' ||
                   typeof obj.aya === 'number';
  return hasSurah && hasVerse;
}

/**
 * Check if an object has a verse ref in a known ref field
 */
function hasVerseRefField(obj) {
  for (const field of VERSE_REF_FIELDS) {
    if (typeof obj[field] === 'string' && VERSE_REF_PATTERN.test(obj[field])) {
      return field;
    }
  }
  return null;
}

/**
 * Check if any text field contains an inline verse ref like (2:255)
 */
function hasInlineVerseRef(obj) {
  for (const field of TEXT_FIELDS) {
    if (typeof obj[field] === 'string' && INLINE_VERSE_REF.test(obj[field])) {
      return field;
    }
  }
  return null;
}

/**
 * Recursively traverse JSON and collect stats
 */
function traverse(val, stats, parentHasVerifyUrl = false) {
  if (Array.isArray(val)) {
    for (const item of val) {
      traverse(item, stats, parentHasVerifyUrl);
    }
    return;
  }

  if (!isPlainObject(val)) return;

  // Count URL fields
  if (val.verifyUrl) stats.verifyUrls++;
  if (val.corpusUrl) stats.corpusUrls++;
  if (val.lanesUrl) stats.lanesUrls++;
  if (val.wrightUrl) stats.wrightUrls++;
  if (val.externalUrl) stats.externalUrls++;

  const thisHasVerifyUrl = !!(val.verifyUrl) || parentHasVerifyUrl;

  // Check for verse references WITHOUT verifyUrl
  if (!val.verifyUrl) {
    // Check named ref fields
    const refField = hasVerseRefField(val);
    if (refField) {
      stats.missingFromRefField++;
      if (stats.missingSamples.length < 5) {
        stats.missingSamples.push({ type: 'refField', field: refField, value: val[refField] });
      }
    }

    // Check surah+ayah numeric fields
    if (hasSurahVerseFields(val)) {
      // But check if a sibling/parent verifyUrl covers it
      if (!parentHasVerifyUrl) {
        stats.missingFromSurahVerse++;
        if (stats.missingSamples.length < 5) {
          const s = val.surah || val.sura;
          const v = val.ayah || val.verse || val.aya;
          stats.missingSamples.push({ type: 'surahVerse', ref: `${s}:${v}` });
        }
      }
    }

    // Check inline refs in text fields
    if (!thisHasVerifyUrl) {
      const inlineField = hasInlineVerseRef(val);
      if (inlineField) {
        stats.missingFromInline++;
        if (stats.missingSamples.length < 5) {
          const match = val[inlineField].match(INLINE_VERSE_REF);
          stats.missingSamples.push({ type: 'inline', field: inlineField, ref: match ? match[0] : '?' });
        }
      }
    }
  }

  // Recurse into children
  for (const key of Object.keys(val)) {
    if (key === '_meta' || key === 'meta') continue; // skip metadata
    const child = val[key];
    if (Array.isArray(child) || isPlainObject(child)) {
      traverse(child, stats, thisHasVerifyUrl);
    }
  }
}

function analyzeFile(filePath) {
  const stats = {
    verifyUrls: 0,
    corpusUrls: 0,
    lanesUrls: 0,
    wrightUrls: 0,
    externalUrls: 0,
    missingFromRefField: 0,
    missingFromSurahVerse: 0,
    missingFromInline: 0,
    missingSamples: []
  };

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    traverse(data, stats, false);
  } catch (err) {
    stats.error = err.message;
  }

  stats.totalMissing = stats.missingFromRefField + stats.missingFromSurahVerse + stats.missingFromInline;
  return stats;
}

// ========== MAIN ==========
const jsonFiles = getJsonFiles(DATA_DIR);
const results = [];
const grandTotals = {
  files: 0,
  verifyUrls: 0,
  corpusUrls: 0,
  lanesUrls: 0,
  lanesLexiconUrls: 0,
  wrightUrls: 0,
  externalUrls: 0,
  missingFromRefField: 0,
  missingFromSurahVerse: 0,
  missingFromInline: 0,
  totalMissing: 0
};

for (const file of jsonFiles) {
  const filePath = path.join(DATA_DIR, file);
  const stats = analyzeFile(filePath);
  results.push({ file, ...stats });

  grandTotals.files++;
  grandTotals.verifyUrls += stats.verifyUrls;
  grandTotals.corpusUrls += stats.corpusUrls;
  grandTotals.lanesUrls += stats.lanesUrls;
  grandTotals.wrightUrls += stats.wrightUrls;
  grandTotals.externalUrls += stats.externalUrls;
  grandTotals.missingFromRefField += stats.missingFromRefField;
  grandTotals.missingFromSurahVerse += stats.missingFromSurahVerse;
  grandTotals.missingFromInline += stats.missingFromInline;
  grandTotals.totalMissing += stats.totalMissing;
}

// ========== OUTPUT ==========
console.log('='.repeat(130));
console.log('  VERIFY-URL COVERAGE AUDIT — COMPLETE PROJECT SCAN');
console.log('='.repeat(130));
console.log(`  Files scanned: ${grandTotals.files} (${SKIP_FILES.size} raw/config files skipped)`);
console.log(`  Date: ${new Date().toISOString().slice(0, 10)}`);
console.log('='.repeat(130));
console.log('');

// Per-file table
const header = 'File'.padEnd(48) +
  'verifyUrl'.padStart(10) +
  'corpusUrl'.padStart(10) +
  'lanesUrl'.padStart(10) +
  'extUrl'.padStart(8) +
  'miss:ref'.padStart(10) +
  'miss:s/v'.padStart(10) +
  'miss:inl'.padStart(10) +
  'TOTAL_MISS'.padStart(12);

console.log(header);
console.log('-'.repeat(130));

for (const r of results) {
  const hasAnything = r.verifyUrls || r.corpusUrls || r.lanesUrls || r.externalUrls || r.totalMissing;
  if (!hasAnything) continue; // skip files with no URL-relevant content

  const line = r.file.padEnd(48) +
    String(r.verifyUrls).padStart(10) +
    String(r.corpusUrls).padStart(10) +
    String(r.lanesUrls).padStart(10) +
    String(r.externalUrls).padStart(8) +
    String(r.missingFromRefField).padStart(10) +
    String(r.missingFromSurahVerse).padStart(10) +
    String(r.missingFromInline).padStart(10) +
    String(r.totalMissing).padStart(12);
  console.log(line);
}

console.log('-'.repeat(130));
const totalLine = 'GRAND TOTAL'.padEnd(48) +
  String(grandTotals.verifyUrls).padStart(10) +
  String(grandTotals.corpusUrls).padStart(10) +
  String(grandTotals.lanesUrls).padStart(10) +
  String(grandTotals.externalUrls).padStart(8) +
  String(grandTotals.missingFromRefField).padStart(10) +
  String(grandTotals.missingFromSurahVerse).padStart(10) +
  String(grandTotals.missingFromInline).padStart(10) +
  String(grandTotals.totalMissing).padStart(12);
console.log(totalLine);
console.log('');

// Coverage summary
const totalItems = grandTotals.verifyUrls + grandTotals.totalMissing;
const coverage = totalItems > 0 ? ((grandTotals.verifyUrls / totalItems) * 100).toFixed(2) : 'N/A';
console.log('='.repeat(130));
console.log('  COVERAGE SUMMARY');
console.log('='.repeat(130));
console.log(`  Total verifyUrls present:                 ${grandTotals.verifyUrls}`);
console.log(`  Total corpusUrls present:                 ${grandTotals.corpusUrls}`);
console.log(`  Total lanesUrls present:                  ${grandTotals.lanesUrls}`);
console.log(`  Total externalUrls present:               ${grandTotals.externalUrls}`);
console.log(`  Total wrightUrls present:                 ${grandTotals.wrightUrls}`);
console.log(`  Total ALL URLs combined:                  ${grandTotals.verifyUrls + grandTotals.corpusUrls + grandTotals.lanesUrls + grandTotals.wrightUrls + grandTotals.externalUrls}`);
console.log('');
console.log(`  Missing (verse ref field, no verifyUrl):  ${grandTotals.missingFromRefField}`);
console.log(`  Missing (surah+verse fields, no URL):     ${grandTotals.missingFromSurahVerse}`);
console.log(`  Missing (inline refs in text, no URL):    ${grandTotals.missingFromInline}`);
console.log(`  TOTAL MISSING:                            ${grandTotals.totalMissing}`);
console.log('');
console.log(`  Items with verifyUrl:                     ${grandTotals.verifyUrls}`);
console.log(`  Items needing verifyUrl (estimated):      ${totalItems}`);
console.log(`  OVERALL COVERAGE:                         ${coverage}%`);
console.log('='.repeat(130));
console.log('');

// Top 20 files with most missing
const sorted = results
  .filter(r => r.totalMissing > 0)
  .sort((a, b) => b.totalMissing - a.totalMissing)
  .slice(0, 20);

if (sorted.length > 0) {
  console.log('  TOP 20 FILES WITH MOST MISSING verifyUrls');
  console.log('-'.repeat(80));
  console.log('  #   File'.padEnd(55) + 'Missing'.padStart(10) + '  Details');
  console.log('-'.repeat(80));
  sorted.forEach((r, i) => {
    const details = [];
    if (r.missingFromRefField) details.push(`ref:${r.missingFromRefField}`);
    if (r.missingFromSurahVerse) details.push(`s/v:${r.missingFromSurahVerse}`);
    if (r.missingFromInline) details.push(`inl:${r.missingFromInline}`);
    const num = String(i + 1).padStart(3);
    const line = `  ${num}  ${r.file.padEnd(48)}${String(r.totalMissing).padStart(10)}  ${details.join(', ')}`;
    console.log(line);
  });
  console.log('-'.repeat(80));
  console.log('');
}

// Show some sample missing items
if (sorted.length > 0) {
  console.log('  SAMPLE MISSING ITEMS (from top files):');
  console.log('-'.repeat(80));
  for (const r of sorted.slice(0, 5)) {
    if (r.missingSamples.length > 0) {
      console.log(`  ${r.file}:`);
      for (const s of r.missingSamples) {
        if (s.type === 'refField') {
          console.log(`    - ${s.field}: "${s.value}"`);
        } else if (s.type === 'surahVerse') {
          console.log(`    - surah/verse fields: ${s.ref}`);
        } else if (s.type === 'inline') {
          console.log(`    - inline ref in ${s.field}: ${s.ref}`);
        }
      }
    }
  }
  console.log('-'.repeat(80));
}

// Files with zero relevant content (no URLs and no verse refs at all)
const emptyFiles = results.filter(r =>
  !r.verifyUrls && !r.corpusUrls && !r.lanesUrls && !r.externalUrls && !r.totalMissing
);
if (emptyFiles.length > 0) {
  console.log('');
  console.log(`  FILES WITH NO URL-RELEVANT CONTENT (${emptyFiles.length} files):`);
  console.log('  ' + emptyFiles.map(r => r.file).join(', '));
}

console.log('');
console.log('='.repeat(130));
console.log('  AUDIT COMPLETE');
console.log('='.repeat(130));
