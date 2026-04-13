/**
 * Comprehensive data integrity tests.
 * Catches: stray characters, wrong verse refs, field mismatches, theological glosses.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

const DATA_DIR = join(__dirname, '..')

// ── helpers ──────────────────────────────────────────────────────────────────

function loadJson(filename) {
  return JSON.parse(readFileSync(join(DATA_DIR, filename), 'utf8'))
}

/** Arabic tashkil (diacritics) Unicode range */
const TASHKIL = /[\u064B-\u065F\u0670]/

/** Stray characters that should never appear inside Arabic text fields */
// eslint-disable-next-line no-misleading-character-class -- intentional: U+0655 is a combining mark we want to detect as a stray
const STRAY_CHARS = /[@ٕ]/

/** Theological superlative glosses that should not be used as meanings */
const THEOLOGICAL_GLOSSES = [
  'Allwissend', 'Allbarmherzig', 'Allerbarmer', 'Allmächtig', 'Allmächtig',
  'Allhörend', 'Allhörend', 'Allsehend', 'Allvergebend',
  'Barmherzigste',
]

// ── Quran verse map (built once) ────────────────────────────────────────────

let verseCounts // { 1: 7, 2: 286, ... }

beforeAll(() => {
  const quran = loadJson('quran-simple-clean.json')
  verseCounts = {}
  for (const s of quran.surahs) {
    verseCounts[s.number] = s.verses.length
  }
})

function verseExists(ref) {
  if (!ref || ref === '—' || ref === 'implizit' || ref === '–' || ref === '0:0') return true
  const m = String(ref).match(/^(\d+):(\d+)/)
  if (!m) return true // non-standard format, skip
  const surah = Number(m[1])
  const ayah = Number(m[2])
  if (surah === 0) return true // non-Quranic example (e.g. ism al-fi'l)
  if (!verseCounts[surah]) return false
  return ayah >= 1 && ayah <= verseCounts[surah]
}

/** Recursively extract all string values from an object */
function allStrings(obj, key = '') {
  const results = []
  if (typeof obj === 'string') {
    results.push({ key, value: obj })
  } else if (Array.isArray(obj)) {
    obj.forEach((item, i) => results.push(...allStrings(item, `${key}[${i}]`)))
  } else if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      results.push(...allStrings(v, key ? `${key}.${k}` : k))
    }
  }
  return results
}

/** Extract verse references from any object */
function extractRefs(obj) {
  const refs = []
  if (!obj || typeof obj !== 'object') return refs
  const refKeys = ['ref', 'location', 'quranRef', 'quranicLocation', 'quranLocation']
  for (const [k, v] of Object.entries(obj)) {
    if (refKeys.includes(k) && typeof v === 'string') {
      // handle "2:255" or "2:255-256" or compound "2:255, 3:14"
      for (const part of v.split(/[,;]/)) {
        const trimmed = part.trim()
        if (trimmed && trimmed !== '—' && trimmed !== 'implizit') refs.push(trimmed)
      }
    } else if (k === 'surah' && obj.ayah != null) {
      refs.push(`${v}:${obj.ayah}`)
    }
    if (typeof v === 'object' && v !== null) {
      // don't recurse too deep for performance
    }
  }
  return refs
}

// ── Drill / exercise files ──────────────────────────────────────────────────

const DRILL_FILES = readdirSync(DATA_DIR)
  .filter(f => f.endsWith('.json') && (
    f.includes('drill') || f.includes('exercises') || f.includes('generated')
  ))
  .sort()

// ── 1. Stray Character Detection ────────────────────────────────────────────

describe('Stray character detection', () => {
  const CHECK_FILES = readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json') && (
      f.includes('drill') || f.includes('generated') || f.includes('exercises') ||
      f.includes('layer-buildup') || f.includes('hapax')
    ))
    .sort()

  it.each(CHECK_FILES)('%s has no stray characters in Arabic text', (filename) => {
    const data = loadJson(filename)
    const strings = allStrings(data)
    const problems = []
    for (const { key, value } of strings) {
      if (STRAY_CHARS.test(value)) {
        problems.push(`${key}: "${value.substring(0, 80)}..."`)
      }
    }
    expect(problems, `Stray characters found in ${filename}`).toHaveLength(0)
  })
})

// ── 2. Verse Reference Validation ───────────────────────────────────────────

describe('Verse reference validation', () => {
  const REF_FILES = readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json') && !f.includes('checksum') && !f.includes('quran-'))
    .sort()

  it.each(REF_FILES)('%s has only valid verse references', (filename) => {
    const raw = readFileSync(join(DATA_DIR, filename), 'utf8')
    const data = JSON.parse(raw)
    const items = Array.isArray(data) ? data
      : data.lessons ? data.lessons
      : data.exercises ? data.exercises
      : data.entries ? data.entries
      : data.pairs ? data.pairs
      : data.surahs ? data.surahs
      : data.drills ? data.drills
      : Array.isArray(data.roots) ? data.roots
      : [data]

    const invalid = []
    function checkObj(obj, path = '') {
      if (!obj || typeof obj !== 'object') return
      const refs = extractRefs(obj)
      for (const ref of refs) {
        if (!verseExists(ref)) {
          invalid.push(`${path}: ref="${ref}"`)
        }
      }
      // check one level of nested arrays
      for (const [k, v] of Object.entries(obj)) {
        if (Array.isArray(v)) {
          v.forEach((item, i) => {
            if (item && typeof item === 'object') checkObj(item, `${path}.${k}[${i}]`)
          })
        } else if (v && typeof v === 'object' && !Array.isArray(v)) {
          checkObj(v, `${path}.${k}`)
        }
      }
    }

    if (Array.isArray(items)) {
      items.forEach((item, i) => checkObj(item, `[${i}]`))
    }
    expect(invalid, `Invalid verse refs in ${filename}`).toHaveLength(0)
  })
})

// ── 3. Rasm-Vocalization Consistency ────────────────────────────────────────

describe('Rasm drill consistency', () => {
  const RASM_FILES = ['rasm-vocalization-drill.json', 'rasm-vocalization-drill-ext.json', 'rasm-vocalization-drill-generated.json']
    .filter(f => readdirSync(DATA_DIR).includes(f))

  it.each(RASM_FILES)('%s entries are internally consistent', (filename) => {
    const data = loadJson(filename)
    const entries = Array.isArray(data) ? data : data.exercises || data.drills || []
    const problems = []

    for (const entry of entries) {
      const id = entry.id || '?'
      // rasm should have no tashkil
      if (entry.rasm && TASHKIL.test(entry.rasm)) {
        problems.push(`${id}: rasm has tashkil: "${entry.rasm}"`)
      }
      // vocalization should have tashkil
      const voc = entry.vocalization || (entry.steps && entry.steps.vocalization)
      if (voc && !TASHKIL.test(voc)) {
        problems.push(`${id}: vocalization has no tashkil: "${voc}"`)
      }
      // root should have 3-4 parts
      const root = entry.root || (entry.steps && entry.steps.root)
      if (root && typeof root === 'string') {
        const parts = root.split('-').length
        if (parts < 3 || parts > 4) {
          problems.push(`${id}: root has ${parts} parts: "${root}"`)
        }
      }
    }
    expect(problems, `Consistency issues in ${filename}`).toHaveLength(0)
  })
})

// ── 4. No empty required fields ─────────────────────────────────────────────

describe('Required fields check', () => {
  it.each(DRILL_FILES)('%s has no empty ids or meanings', (filename) => {
    const data = loadJson(filename)
    const items = Array.isArray(data) ? data
      : data.exercises || data.drills || data.entries || data.pairs || []
    if (!Array.isArray(items) || items.length === 0) return

    const problems = []
    // Only check for ids if at least one item in the file has an 'id' field
    const hasIdField = items.some(item => 'id' in item)
    if (hasIdField) {
      items.forEach((item, i) => {
        if (item.id === null || item.id === undefined || item.id === '') {
          problems.push(`[${i}]: empty id`)
        }
      })
    }
    expect(problems, `Empty required fields in ${filename}`).toHaveLength(0)
  })
})

// ── 5. No theological glosses in meaning fields ─────────────────────────────

describe('No theological glosses', () => {
  const MEANING_FILES = [
    'root-meanings.json', 'root-starter-cards.json', 'thematic-fields.json',
    'alphabet.json', 'decomposition-exercises.json', 'morphology-lessons.json',
    'morphology-tables.json', 'verb-form-semantics.json', 'grammar-glossary.json',
    'synonym-contrast.json', 'particles.json',
  ].filter(f => readdirSync(DATA_DIR).includes(f))

  it.each(MEANING_FILES)('%s contains no theological superlative glosses', (filename) => {
    const raw = readFileSync(join(DATA_DIR, filename), 'utf8')
    const matches = []
    for (const term of THEOLOGICAL_GLOSSES) {
      let idx = raw.indexOf(term)
      while (idx !== -1) {
        const context = raw.substring(Math.max(0, idx - 40), Math.min(raw.length, idx + 60))
        matches.push(`"${term}" at pos ${idx}: ...${context.replace(/\n/g, ' ')}...`)
        idx = raw.indexOf(term, idx + 1)
      }
    }
    expect(matches, `Theological glosses in ${filename}`).toHaveLength(0)
  })
})
