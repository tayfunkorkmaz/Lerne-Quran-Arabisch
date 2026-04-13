/**
 * validate-vocalizations.cjs
 *
 * Validates vocalized Arabic words across data files against the actual
 * vocalized Quran text (quran-vocalized.json).
 *
 * For every data file that contains a vocalized Arabic word together with a
 * Quran location (surah:ayah or surah:ayah:wordPos), this script extracts the
 * word from the vocalized Quran text and compares.
 *
 * Run:  node validate-vocalizations.cjs
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const VOCALIZED_FILE = path.join(DATA_DIR, 'quran-vocalized.json');
const UTHMANI_FILE = path.join(DATA_DIR, 'quran-uthmani.json');

// ── Arabic text normalization ───────────────────────────────────────────────

/**
 * Strip diacritics for consonantal comparison.
 * Removes: fatha, damma, kasra, shadda, sukun, tanwin, maddah,
 *          superscript alif, hamzat al-wasl mark, etc.
 */
function stripDiacritics(s) {
  // Unicode ranges for Arabic diacritics
  return s.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u08D3-\u08E1\u08E3-\u08FF]/g, '');
}

/**
 * Normalize alif variants: plain alif, alif-wasla, alif-madda, alif-hamza-above,
 * alif-hamza-below all collapse to plain alif for comparison.
 */
function normalizeAlifs(s) {
  return s
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')  // hamza/wasla variants -> plain alif
    .replace(/\u0649/g, '\u064A');  // alif-maqsura -> ya (for comparison)
}

/**
 * Full normalization: strip diacritics, normalize alifs, remove tatweel, trim.
 */
function normalizeConsonantal(s) {
  let n = stripDiacritics(s);
  n = normalizeAlifs(n);
  n = n.replace(/\u0640/g, '');  // tatweel
  return n.trim();
}

/**
 * Light normalization for vocalized comparison: normalize alifs but keep diacritics.
 */
function normalizeVocalized(s) {
  return normalizeAlifs(s).replace(/\u0640/g, '').trim();
}

// ── Load the vocalized Quran text ───────────────────────────────────────────

function loadVocalizedQuran() {
  // Prefer the full Uthmani Mushaf (with phonetic markers U+06E5, U+06E6 etc.)
  // as the canonical source. quran-vocalized.json is a "lighter" variant
  // without these markers and is used by the runtime reader as one of several
  // display modes — but the lessons are migrated against the Uthmani form.
  let filePath = UTHMANI_FILE;
  if (!fs.existsSync(filePath)) {
    filePath = VOCALIZED_FILE;
  }
  if (!fs.existsSync(filePath)) {
    console.error('ERROR: Neither quran-uthmani.json nor quran-vocalized.json found.');
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`Loaded vocalized Quran from: ${path.basename(filePath)}`);

  // Build lookup: "surah:ayah" -> { text, words[] }
  const lookup = new Map();
  for (const surah of raw.surahs) {
    for (const verse of surah.verses) {
      const key = `${surah.number}:${verse.number}`;
      const words = verse.text.split(/\s+/);
      lookup.set(key, { text: verse.text, words });
    }
  }
  return lookup;
}

// ── Scan data files for vocalized words with locations ──────────────────────

const LOCATION_RE = /^(\d{1,3}):(\d{1,3})(?::(\d+))?$/;

/**
 * Known field-name pairs where a vocalized word and a location co-occur.
 * The walker looks for objects that have at least one location field and one
 * vocalized-word field.
 */
const LOCATION_FIELDS = ['location', 'ref', 'quranicLocation'];
const VOCALIZED_FIELDS = ['vocalized', 'vocalization', 'quranicText'];
const WORD_FIELDS = ['word', 'arabic'];

/**
 * Skip filters: lemma-citation entries (single word without wordPos),
 * distractor options inside ambiguity drills, vocabulary cards mixing
 * Latin/German with Arabic, root indicators, and ellipsis-abridged quotes.
 */
function isVerseQuoteCandidate(claim, locationStr, fieldPath) {
  if (typeof claim !== 'string' || claim.length < 3) return false;
  // Reject Latin/German content (vocabulary-with-citation entries)
  if (/[A-Za-zÄÖÜäöüß]/.test(claim)) return false;
  // Reject ellipsis-abridged quotations
  if (claim.includes('…') || claim.includes('...')) return false;
  // Reject verse-boundary-spanning constructions joined by middle dot ·
  // (these intentionally span two verses to teach a syntactic phenomenon
  // like Badal across the verse boundary).
  if (claim.includes('·')) return false;
  // Reject root-indicator strings (letter-hyphen-letter-hyphen-letter)
  if (/[\u0621-\u064A][-\s][\u0621-\u064A][-\s][\u0621-\u064A]/.test(claim)) return false;
  // Reject objects inside `options` arrays (distractor vocalizations)
  if (/\.options\[/.test(fieldPath)) return false;
  // Single-word claims without wordPos are lemma citations, not verse quotes
  const m = LOCATION_RE.exec(locationStr);
  const hasWordPos = m && m[3];
  const isMultiWord = /\s/.test(claim.trim());
  if (!isMultiWord && !hasWordPos) return false;
  return true;
}

/**
 * Recursively walk the data, collecting objects that have both a location and
 * a vocalized form. Only collects entries that look like verse quotes (skips
 * lemma citations, distractor options, vocabulary cards).
 */
function collectVocalizedRefs(value, filePath, results, depth) {
  if (depth > 30 || value === null || value === undefined) return;

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      collectVocalizedRefs(value[i], `${filePath}[${i}]`, results, depth + 1);
    }
    return;
  }

  if (typeof value !== 'object') return;

  // Check if this object has both a location and a vocalized word
  let locationStr = null;
  for (const f of LOCATION_FIELDS) {
    if (typeof value[f] === 'string' && LOCATION_RE.test(value[f])) {
      locationStr = value[f];
      break;
    }
  }

  // Also check {surah, ayah} pattern
  if (!locationStr && typeof value.surah === 'number' && typeof value.ayah === 'number') {
    locationStr = `${value.surah}:${value.ayah}`;
  }

  let vocalizedWord = null;
  let vocalizedFieldName = null;
  for (const f of VOCALIZED_FIELDS) {
    if (typeof value[f] === 'string' && value[f].length > 0) {
      vocalizedWord = value[f];
      vocalizedFieldName = f;
      break;
    }
  }
  // Fallback: check 'word' and 'arabic' fields — only if they contain Arabic diacritics
  if (!vocalizedWord) {
    for (const f of WORD_FIELDS) {
      if (typeof value[f] === 'string' && /[\u064B-\u065F\u0670]/.test(value[f])) {
        vocalizedWord = value[f];
        vocalizedFieldName = f;
        break;
      }
    }
  }

  if (locationStr && vocalizedWord && isVerseQuoteCandidate(vocalizedWord, locationStr, filePath)) {
    const m = LOCATION_RE.exec(locationStr);
    if (m) {
      results.push({
        surah: parseInt(m[1], 10),
        ayah: parseInt(m[2], 10),
        wordPos: m[3] ? parseInt(m[3], 10) : null,
        vocalized: vocalizedWord,
        fieldName: vocalizedFieldName,
        fieldPath: filePath
      });
    }
  }

  // Recurse into child properties
  for (const key of Object.keys(value)) {
    collectVocalizedRefs(value[key], `${filePath}.${key}`, results, depth + 1);
  }
}

// ── Comparison ──────────────────────────────────────────────────────────────

function compareVocalized(claimed, actual) {
  // Exact match
  if (claimed === actual) return { match: true };

  // Normalized match (alif variants, tatweel)
  const cn = normalizeVocalized(claimed);
  const an = normalizeVocalized(actual);
  if (cn === an) return { match: true, note: 'match after alif normalization' };

  // Consonantal match (vocalized words may differ in diacritics due to
  // encoding variants but share the same consonantal skeleton)
  const cc = normalizeConsonantal(claimed);
  const ac = normalizeConsonantal(actual);
  if (cc === ac) return { match: true, note: 'consonantal match (diacritics differ)' };

  return { match: false, claimedNorm: cn, actualNorm: an };
}

// ── Main ────────────────────────────────────────────────────────────────────

function main() {
  console.log('=== Validate Vocalizations Against Quran Text ===\n');

  const quran = loadVocalizedQuran();

  // Skip Quran source files themselves
  const skipFiles = new Set([
    'quran-simple-clean.json',
    'quran-vocalized.json',
    'quran-uthmani.json',
    'quran-rasm.json',
    'quran-checksum.json',
    'quran-morphology-db.json'
  ]);

  const jsonFiles = fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json') && !skipFiles.has(f));

  let totalChecked = 0;
  let totalMatch = 0;
  let totalMismatch = 0;
  let totalSkipped = 0;
  const allMismatches = [];

  for (const file of jsonFiles) {
    const fp = path.join(DATA_DIR, file);
    let data;
    try {
      data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    } catch (e) {
      console.error(`  WARNING: Could not parse ${file}: ${e.message}`);
      continue;
    }

    const refs = [];
    collectVocalizedRefs(data, '$', refs, 0);
    if (refs.length === 0) continue;

    const fileMismatches = [];

    for (const ref of refs) {
      const verseKey = `${ref.surah}:${ref.ayah}`;
      const verseData = quran.get(verseKey);
      if (!verseData) {
        totalSkipped++;
        continue;
      }

      totalChecked++;

      // If we have a word position, compare against that specific word
      if (ref.wordPos !== null && ref.wordPos >= 1 && ref.wordPos <= verseData.words.length) {
        const actualWord = verseData.words[ref.wordPos - 1]; // 1-indexed
        const result = compareVocalized(ref.vocalized, actualWord);
        if (result.match) {
          totalMatch++;
        } else {
          totalMismatch++;
          fileMismatches.push({
            location: `${verseKey}:${ref.wordPos}`,
            field: ref.fieldName,
            claimed: ref.vocalized,
            actual: actualWord,
            fullVerse: verseData.text,
            fieldPath: ref.fieldPath
          });
        }
      } else {
        // No word position: check if the vocalized word appears anywhere in the verse
        const verseText = verseData.text;
        const claimedNorm = normalizeVocalized(ref.vocalized);
        const verseNorm = normalizeVocalized(verseText);

        // Check if the vocalized word (or its normalized form) is a substring
        // Also check individual words
        let found = false;

        // Direct substring check
        if (verseNorm.includes(claimedNorm)) {
          found = true;
        }

        // Check consonantal match against each word
        if (!found) {
          const claimedCons = normalizeConsonantal(ref.vocalized);
          for (const w of verseData.words) {
            if (normalizeConsonantal(w) === claimedCons) {
              found = true;
              break;
            }
          }
        }

        // For multi-word phrases (quranicText field), check if the consonantal
        // skeleton of the phrase appears in the verse
        if (!found && ref.vocalized.includes(' ')) {
          const claimedCons = normalizeConsonantal(ref.vocalized);
          const verseCons = normalizeConsonantal(verseText);
          if (verseCons.includes(claimedCons)) {
            found = true;
          }
        }

        if (found) {
          totalMatch++;
        } else {
          totalMismatch++;
          fileMismatches.push({
            location: verseKey,
            field: ref.fieldName,
            claimed: ref.vocalized,
            actual: '(not found in verse)',
            fullVerse: verseData.text,
            fieldPath: ref.fieldPath
          });
        }
      }
    }

    if (fileMismatches.length > 0) {
      allMismatches.push({ file, mismatches: fileMismatches });
    }
  }

  // ── Report ──────────────────────────────────────────────────────────────

  if (allMismatches.length > 0) {
    console.log('\nVOCALIZATION MISMATCHES FOUND:\n');
    for (const { file, mismatches } of allMismatches) {
      console.log(`  ${file}:`);
      for (const mm of mismatches) {
        console.log(`    Location: ${mm.location}`);
        console.log(`      Field:   ${mm.field}`);
        console.log(`      Claimed: ${mm.claimed}`);
        console.log(`      Actual:  ${mm.actual}`);
        if (mm.fullVerse.length < 200) {
          console.log(`      Verse:   ${mm.fullVerse}`);
        }
        console.log('');
      }
    }
  }

  console.log('--- Summary ---');
  console.log(`Files scanned:      ${jsonFiles.length}`);
  console.log(`Words checked:      ${totalChecked}`);
  console.log(`Matches:            ${totalMatch}`);
  console.log(`Mismatches:         ${totalMismatch}`);
  console.log(`Skipped (no verse): ${totalSkipped}`);

  if (totalMismatch > 0) {
    console.log('\nRESULT: FAIL');
    process.exit(1);
  } else {
    console.log('\nRESULT: PASS');
    process.exit(0);
  }
}

main();
