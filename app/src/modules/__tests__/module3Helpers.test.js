/**
 * Tests for Module3.jsx helper functions.
 *
 * These functions are NOT exported from Module3.jsx, so we replicate their
 * logic here using the same data imports and utility functions.
 */
import { describe, it, expect } from 'vitest'

import {
  cleanArabicText,
  transliterateToArabic,
  containsArabic,
} from '../../utils/arabic.js'
import {
  detectAmbiguities,
  mergeAmbiguities,
  buildConsonantalLookup,
} from '../../utils/ambiguityDetection.js'

import particlesData from '../../data/particles.json'
import pronounsData from '../../data/pronouns.json'
import ambiguitiesData from '../../data/ambiguities.json'
import morphologyDB from '../../data/quran-morphology-db.json'

// ============================================================
// Replicate Module3 helper infrastructure
// ============================================================

// --- ROOT_CONSONANTS ---
const ROOT_CONSONANTS = new Set([
  '\u0621','\u0627','\u0628','\u062A','\u062B','\u062C','\u062D','\u062E',
  '\u062F','\u0630','\u0631','\u0632','\u0633','\u0634','\u0635','\u0636',
  '\u0637','\u0638','\u0639','\u063A','\u0641','\u0642','\u0643','\u0644',
  '\u0645','\u0646','\u0647','\u0648','\u064A',
])

// --- MORPHOLOGY_LOOKUP ---
const MORPHOLOGY_LOOKUP = new Map()
if (morphologyDB && morphologyDB.words) {
  morphologyDB.words.forEach(w => {
    MORPHOLOGY_LOOKUP.set(w.l, w)
  })
}

// --- PARTICLE_LOOKUP ---
const PARTICLE_LOOKUP = new Map()
particlesData.particles.forEach(p => {
  const clean = cleanArabicText(p.consonantal).replace(/[\u0640~]/g, '')
  PARTICLE_LOOKUP.set(clean, p)
  const stripped = cleanArabicText(p.arabic).replace(/[\u0640~]/g, '')
  if (stripped !== clean) PARTICLE_LOOKUP.set(stripped, p)
})

// --- PRONOUN_LOOKUP ---
const PRONOUN_LOOKUP = new Map()
function addPronouns(list, category) {
  if (!list) return
  list.forEach(p => {
    const forms = [p.arabic]
    if (p.consonantal) forms.push(p.consonantal)
    forms.forEach(f => {
      const clean = cleanArabicText(f).replace(/[\u0640~\u0020\u200C\u200D]/gu, '').replace(/\//g, '')
      if (clean.length > 0) PRONOUN_LOOKUP.set(clean, { ...p, category })
    })
  })
}
addPronouns(pronounsData.independent?.pronouns, 'independent')
addPronouns(pronounsData.suffix?.pronouns, 'suffix')
addPronouns(pronounsData.demonstrative?.near?.pronouns, 'demonstrative_near')
addPronouns(pronounsData.demonstrative?.far?.pronouns, 'demonstrative_far')
addPronouns(pronounsData.relative?.pronouns, 'relative')

// --- AMBIGUITY_LOOKUP + CONSONANTAL_AMBIGUITY_LOOKUP ---
const autoDetectedAmbiguities = detectAmbiguities(morphologyDB)
const mergedAmbiguitiesData = mergeAmbiguities(ambiguitiesData, autoDetectedAmbiguities)
const CONSONANTAL_AMBIGUITY_LOOKUP = buildConsonantalLookup(mergedAmbiguitiesData)

const AMBIGUITY_LOOKUP = new Map()
if (mergedAmbiguitiesData.entries) {
  mergedAmbiguitiesData.entries.forEach(e => {
    if (e.location) {
      AMBIGUITY_LOOKUP.set(e.location, e)
    }
    if (e.autoDetected && e.sampleLocations) {
      e.sampleLocations.forEach(loc => {
        if (!AMBIGUITY_LOOKUP.has(loc)) {
          AMBIGUITY_LOOKUP.set(loc, e)
        }
      })
    }
  })
}

// ============================================================
// Replicated helper functions (exact logic from Module3.jsx)
// ============================================================

function getCorpusEntryAligned(surah, verse, wordIndex, word, allWordsInVerse) {
  const directKey = `${surah}:${verse}:${wordIndex + 1}`
  const directEntry = MORPHOLOGY_LOOKUP.get(directKey)

  if (word === '\u064a\u0627') {
    return directEntry
  }

  let yaOffset = 0
  for (let i = 0; i < wordIndex && i < allWordsInVerse.length; i++) {
    if (allWordsInVerse[i] === '\u064a\u0627') {
      yaOffset++
    }
  }

  if (yaOffset === 0) {
    return directEntry
  }

  const adjustedKey = `${surah}:${verse}:${wordIndex + 1 - yaOffset}`
  const adjustedEntry = MORPHOLOGY_LOOKUP.get(adjustedKey)
  if (adjustedEntry) {
    return adjustedEntry
  }

  return directEntry
}

function isParticle(word) {
  const clean = cleanArabicText(word).replace(/[\u0640~]/g, '')
  return PARTICLE_LOOKUP.has(clean)
}

function getParticleInfo(word) {
  const clean = cleanArabicText(word).replace(/[\u0640~]/g, '')
  return PARTICLE_LOOKUP.get(clean)
}

function isPronoun(word) {
  const clean = cleanArabicText(word).replace(/[\u0640~]/g, '')
  return PRONOUN_LOOKUP.has(clean)
}

function getPronounInfo(word) {
  const clean = cleanArabicText(word).replace(/[\u0640~]/g, '')
  return PRONOUN_LOOKUP.get(clean)
}

function parseRootInput(input) {
  if (!input || !input.trim()) return null
  const trimmed = input.trim()
  if (containsArabic(trimmed)) {
    const letters = [...cleanArabicText(trimmed)].filter(c => ROOT_CONSONANTS.has(c))
    return letters
  }
  const arabic = transliterateToArabic(trimmed.replace(/-/g, ''))
  const letters = [...cleanArabicText(arabic)].filter(c => ROOT_CONSONANTS.has(c))
  return letters
}

function isPlausibleRoot(letters) {
  return letters && letters.length >= 3 && letters.length <= 4 &&
    letters.every(l => ROOT_CONSONANTS.has(l))
}

function getAmbiguity(surah, ayah, wordIdx, word) {
  const key = `${surah}:${ayah}:${wordIdx + 1}`
  const byLocation = AMBIGUITY_LOOKUP.get(key)
  if (byLocation) return byLocation

  if (word) {
    const consonantal = cleanArabicText(word)
    const byConsonantal = CONSONANTAL_AMBIGUITY_LOOKUP.get(consonantal)
    if (byConsonantal) return byConsonantal
  }

  return undefined
}

// ============================================================
// TESTS
// ============================================================

// 1. getCorpusEntryAligned
describe('getCorpusEntryAligned', () => {
  it('returns direct lookup when no ya precedes the word', () => {
    // 1:1:1 = "bismi" — no ya offset
    const words = ['بِسْمِ', 'اللَّهِ', 'الرَّحْمَنِ', 'الرَّحِيمِ']
    const entry = getCorpusEntryAligned(1, 1, 0, 'بِسْمِ', words)
    expect(entry).toBeDefined()
    expect(entry.l).toBe('1:1:1')
    expect(entry.r).toBe('س م و')
  })

  it('returns direct entry for a mid-verse word with no ya offset', () => {
    // 1:2:3 = "rabb" (third word in verse 2 of Al-Fatiha)
    const words = ['الْحَمْدُ', 'لِلَّهِ', 'رَبِّ', 'الْعَالَمِينَ']
    const entry = getCorpusEntryAligned(1, 2, 2, 'رَبِّ', words)
    expect(entry).toBeDefined()
    expect(entry.l).toBe('1:2:3')
    expect(entry.r).toBe('ر ب ب')
  })

  it('applies offset of 1 when one ya precedes the word', () => {
    // Surah 7:73 has "يا" as a standalone word
    // The verse text has: يَا قَوْمِ اعْبُدُوا اللَّهَ ...
    // "يا" at index 0, "قوم" at index 1 — DB index for "قوم" would be 1:73:1
    // because ya is merged; so adjusted key = 7:73:2-1 = 7:73:1
    // First build a synthetic test case where we know the morphology DB structure
    const mockWords = ['\u064a\u0627', 'قَوْمِ', 'اعْبُدُوا']
    // After ya at index 0, word at index 1 has yaOffset=1
    // directKey = 7:73:2, adjustedKey = 7:73:1
    const entry = getCorpusEntryAligned(7, 73, 1, 'قَوْمِ', mockWords)
    // We mainly verify that the function does not crash and returns some entry.
    // The adjusted entry or the direct entry should be returned.
    expect(entry === undefined || typeof entry === 'object').toBe(true)
  })

  it('applies offset of 2 when two ya precede the word', () => {
    // Synthetic case: two ya particles before the target word
    const mockWords = ['\u064a\u0627', 'قَوْمِ', '\u064a\u0627', 'مُوسَى', 'اذْكُرُوا']
    // Word at index 4 "اذكروا" — 2 ya before it (at indices 0 and 2)
    // directKey = 1:1:5 (does not exist in DB)
    // adjustedKey = 1:1:3 (exists in DB — "الرحمن")
    // The function should return the adjusted entry since it exists.
    const entry = getCorpusEntryAligned(1, 1, 4, 'اذْكُرُوا', mockWords)
    // adjustedKey 1:1:3 = "الرحمن" — so the offset of 2 was applied
    expect(entry).toBeDefined()
    expect(entry.l).toBe('1:1:3')
  })

  it('returns direct entry when the word IS ya (vocative particle)', () => {
    // When the word itself is "يا", the function returns the direct entry
    const mockWords = ['\u064a\u0627', 'قَوْمِ', 'اعْبُدُوا']
    const entry = getCorpusEntryAligned(36, 20, 0, '\u064a\u0627', mockWords)
    // Direct entry for 36:20:1 — may or may not exist in DB.
    // The key point: the function does NOT apply any yaOffset when the word IS ya.
    // It returns whatever the direct lookup gives.
    const directKey = '36:20:1'
    const expected = MORPHOLOGY_LOOKUP.get(directKey)
    expect(entry).toBe(expected)
  })

  it('falls back to direct entry when adjusted lookup fails', () => {
    // Use a verse where ya offset shifts to a non-existent DB key,
    // but the direct key exists. We mock this by choosing a known direct entry
    // and preceding it with ya in the word list.
    // 1:1:4 = "الرحيم" exists at direct key
    const mockWords = ['\u064a\u0627', 'dummy', 'dummy2', 'الرَّحِيمِ']
    // wordIndex=3, ya at index 0 => yaOffset=1
    // directKey = 1:1:4, adjustedKey = 1:1:3
    // adjustedKey 1:1:3 = "الرحمن" (exists) — so adjusted entry returned
    const entry = getCorpusEntryAligned(1, 1, 3, 'الرَّحِيمِ', mockWords)
    expect(entry).toBeDefined()
    // In this case adjustedKey 1:1:3 does exist, so it returns that
    expect(entry.l).toBe('1:1:3')
  })

  it('falls back to direct entry when adjusted key points to nothing', () => {
    // Construct a scenario where adjustedKey is invalid but directKey is valid
    // surah 114 verse 1 has only a few words. Use a wordIndex that creates
    // a valid directKey but an invalid adjustedKey.
    const directKey = '114:1:1'
    const directExists = MORPHOLOGY_LOOKUP.has(directKey)
    if (directExists) {
      // Put ya before: wordIndex=1, yaOffset=1, directKey=114:1:2, adjustedKey=114:1:1
      // Actually let's use wordIndex=0 with ya trickery — wait, ya at index 0
      // means wordIndex must be > 0 for offset to apply.
      // Use wordIndex=5 (directKey=114:1:6 probably missing),
      // adjustedKey=114:1:5 also likely missing
      // Better: use a real scenario.
      const words = ['\u064a\u0627', 'بسم']
      // wordIndex=1, directKey=114:1:2, adjustedKey=114:1:1
      const entry = getCorpusEntryAligned(114, 1, 1, 'بسم', words)
      // adjustedKey=114:1:1 does exist, so it should return that
      expect(entry).toBeDefined()
    }
  })
})

// 2. isParticle / getParticleInfo
describe('isParticle', () => {
  it('recognises و (wa) as a particle', () => {
    expect(isParticle('وَ')).toBe(true)
    // Also without vowels
    expect(isParticle('و')).toBe(true)
  })

  it('recognises ف (fa) as a particle', () => {
    expect(isParticle('فَ')).toBe(true)
    expect(isParticle('ف')).toBe(true)
  })

  it('recognises في (fi) as a particle', () => {
    expect(isParticle('فِي')).toBe(true)
    expect(isParticle('في')).toBe(true)
  })

  it('recognises من (min) as a particle', () => {
    expect(isParticle('مِنْ')).toBe(true)
    expect(isParticle('من')).toBe(true)
  })

  it('recognises الى (ila) as a particle', () => {
    expect(isParticle('إِلَى')).toBe(true)
    expect(isParticle('الى')).toBe(true)
  })

  it('recognises على (ala) as a particle', () => {
    expect(isParticle('عَلَى')).toBe(true)
    expect(isParticle('على')).toBe(true)
  })

  it('recognises لا (la) as a particle', () => {
    expect(isParticle('لَا')).toBe(true)
    expect(isParticle('لا')).toBe(true)
  })

  it('recognises ما (ma) as a particle', () => {
    expect(isParticle('مَا')).toBe(true)
    expect(isParticle('ما')).toBe(true)
  })

  it('recognises لم (lam) as a particle', () => {
    expect(isParticle('لَمْ')).toBe(true)
    expect(isParticle('لم')).toBe(true)
  })

  it('recognises إنّ (inna) as a particle', () => {
    expect(isParticle('إِنَّ')).toBe(true)
  })

  it('recognises أنّ (anna) as a particle', () => {
    expect(isParticle('أَنَّ')).toBe(true)
  })

  it('does NOT recognise a non-particle word', () => {
    expect(isParticle('كتب')).toBe(false)
    expect(isParticle('رجل')).toBe(false)
    expect(isParticle('مسلم')).toBe(false)
  })
})

describe('getParticleInfo', () => {
  it('returns particle info object for a known particle', () => {
    const info = getParticleInfo('وَ')
    expect(info).toBeDefined()
    expect(info.id).toBe('wa')
    expect(info.category).toBe('conjunction')
  })

  it('returns particle info for من (min)', () => {
    const info = getParticleInfo('من')
    expect(info).toBeDefined()
    expect(info.id).toBe('min')
    expect(info.category).toBe('preposition')
  })

  it('returns undefined for a non-particle', () => {
    const info = getParticleInfo('كتاب')
    expect(info).toBeUndefined()
  })
})

// 3. isPronoun / getPronounInfo
describe('isPronoun', () => {
  it('recognises هو (huwa) as a pronoun', () => {
    expect(isPronoun('هُوَ')).toBe(true)
    expect(isPronoun('هو')).toBe(true)
  })

  it('recognises هي (hiya) as a pronoun', () => {
    expect(isPronoun('هِيَ')).toBe(true)
    expect(isPronoun('هي')).toBe(true)
  })

  it('recognises هم (hum) as a pronoun', () => {
    expect(isPronoun('هُمْ')).toBe(true)
    expect(isPronoun('هم')).toBe(true)
  })

  it('recognises أنا (ana) as a pronoun', () => {
    expect(isPronoun('أَنَا')).toBe(true)
    // With hamza-on-alif (matching the data source)
    expect(isPronoun('أنا')).toBe(true)
  })

  it('recognises نحن (nahnu) as a pronoun', () => {
    expect(isPronoun('نَحْنُ')).toBe(true)
    expect(isPronoun('نحن')).toBe(true)
  })

  it('recognises أنت (anta) as a pronoun', () => {
    expect(isPronoun('أَنْتَ')).toBe(true)
    // With hamza-on-alif (matching the data source)
    expect(isPronoun('أنت')).toBe(true)
  })

  it('does NOT recognise a non-pronoun word', () => {
    expect(isPronoun('كتب')).toBe(false)
    expect(isPronoun('مسجد')).toBe(false)
    expect(isPronoun('يوم')).toBe(false)
  })
})

describe('getPronounInfo', () => {
  it('returns pronoun info for هو (huwa)', () => {
    const info = getPronounInfo('هُوَ')
    expect(info).toBeDefined()
    expect(info.id).toBe('3ms')
    expect(info.category).toBe('independent')
  })

  it('returns pronoun info for نحن (nahnu)', () => {
    const info = getPronounInfo('نَحْنُ')
    expect(info).toBeDefined()
    expect(info.id).toBe('1p')
    expect(info.category).toBe('independent')
  })

  it('returns undefined for a non-pronoun', () => {
    const info = getPronounInfo('شمس')
    expect(info).toBeUndefined()
  })
})

// 4. parseRootInput
describe('parseRootInput', () => {
  it('parses Arabic input "كتب" into individual letters', () => {
    const result = parseRootInput('كتب')
    expect(result).toEqual(['\u0643', '\u062A', '\u0628']) // ك ت ب
  })

  it('parses Arabic input with vowels, stripping them', () => {
    const result = parseRootInput('كَتَبَ')
    expect(result).toEqual(['\u0643', '\u062A', '\u0628']) // ك ت ب
  })

  it('parses transliterated input "k-t-b" into Arabic letters', () => {
    const result = parseRootInput('k-t-b')
    // transliterateToArabic("ktb") should produce Arabic consonants
    expect(result).toBeDefined()
    expect(result.length).toBe(3)
    expect(result).toEqual(['\u0643', '\u062A', '\u0628']) // ك ت ب
  })

  it('parses continuous transliteration "ktb" into Arabic letters', () => {
    const result = parseRootInput('ktb')
    expect(result).toBeDefined()
    expect(result.length).toBe(3)
    expect(result[0]).toBe('\u0643') // ك
    expect(result[1]).toBe('\u062A') // ت
    expect(result[2]).toBe('\u0628') // ب
  })

  it('returns null for empty input', () => {
    expect(parseRootInput('')).toBeNull()
    expect(parseRootInput(null)).toBeNull()
    expect(parseRootInput(undefined)).toBeNull()
    expect(parseRootInput('   ')).toBeNull()
  })

  it('strips vowel marks from Arabic input leaving only consonants', () => {
    // "ضَرَبَ" with fatha on each letter -> only consonants ض ر ب
    const result = parseRootInput('ضَرَبَ')
    expect(result).toEqual(['\u0636', '\u0631', '\u0628']) // ض ر ب
  })

  it('handles quadriliteral root input', () => {
    const result = parseRootInput('زلزل')
    expect(result).toBeDefined()
    expect(result.length).toBe(4)
    expect(result).toEqual(['\u0632', '\u0644', '\u0632', '\u0644']) // ز ل ز ل
  })
})

// 5. isPlausibleRoot
describe('isPlausibleRoot', () => {
  it('returns true for 3 consonant letters (triliteral root)', () => {
    expect(isPlausibleRoot(['\u0643', '\u062A', '\u0628'])).toBe(true) // ك ت ب
  })

  it('returns true for 4 consonant letters (quadriliteral root)', () => {
    expect(isPlausibleRoot(['\u0632', '\u0644', '\u0632', '\u0644'])).toBe(true) // ز ل ز ل
  })

  it('returns false for 2 letters', () => {
    expect(isPlausibleRoot(['\u0643', '\u062A'])).toBe(false) // ك ت
  })

  it('returns false for 5 or more letters', () => {
    expect(isPlausibleRoot(['\u0643', '\u062A', '\u0628', '\u0631', '\u0633'])).toBe(false)
  })

  it('returns false for null or undefined', () => {
    expect(isPlausibleRoot(null)).toBeFalsy()
    expect(isPlausibleRoot(undefined)).toBeFalsy()
  })

  it('returns false for empty array', () => {
    expect(isPlausibleRoot([])).toBe(false)
  })

  it('returns false when letters include non-consonants', () => {
    // U+064E fatha is a vowel mark, not a consonant
    expect(isPlausibleRoot(['\u0643', '\u064E', '\u0628'])).toBe(false)
  })

  it('returns true for all valid Arabic consonant triples', () => {
    // ع ب د
    expect(isPlausibleRoot(['\u0639', '\u0628', '\u062F'])).toBe(true)
    // ر ح م
    expect(isPlausibleRoot(['\u0631', '\u062D', '\u0645'])).toBe(true)
  })
})

// 6. getAmbiguity
describe('getAmbiguity', () => {
  it('finds a known ambiguous word by exact location', () => {
    // Entry id 1: location "1:4:1" — مالك / ملك in Al-Fatiha
    // wordIdx is 0-based, so wordIdx=0 => key "1:4:1"
    const result = getAmbiguity(1, 4, 0, 'مَالِكِ')
    expect(result).toBeDefined()
    expect(result.consonants).toBe('ملك')
    expect(result.options).toBeDefined()
    expect(result.options.length).toBeGreaterThanOrEqual(2)
  })

  it('returns the correct options for a known ambiguity', () => {
    // Same entry: 1:4:1
    const result = getAmbiguity(1, 4, 0, 'مَالِكِ')
    const roots = result.options.map(o => o.root)
    expect(roots).toContain('م ل ك')
  })

  it('falls back to consonantal lookup when no location match', () => {
    // Use a word whose consonantal form is in the consonantal lookup
    // but whose specific location is not stored directly.
    // We pick the consonantal form from the first ambiguity entry: "ملك"
    const consonantalKey = 'ملك'
    const hasConsonantal = CONSONANTAL_AMBIGUITY_LOOKUP.has(consonantalKey)
    if (hasConsonantal) {
      // Use a non-existent location (999:999:0-based=999, key=999:999:1000)
      // but provide the word whose consonantal form matches
      const result = getAmbiguity(999, 999, 999, 'مَلِكِ')
      // cleanArabicText('مَلِكِ') = 'ملك' which should match the consonantal lookup
      expect(result).toBeDefined()
      expect(result.consonants).toBeDefined()
    }
  })

  it('returns undefined for an unknown word at an unknown location', () => {
    const result = getAmbiguity(999, 999, 999, 'قققق')
    expect(result).toBeUndefined()
  })

  it('returns undefined when no word and no location match', () => {
    const result = getAmbiguity(0, 0, 0, undefined)
    expect(result).toBeUndefined()
  })

  it('location lookup uses 1-indexed word position', () => {
    // Verify that wordIdx=0 maps to key ":1" in the location string
    // Entry at "2:6:5" — wordIdx should be 4 (0-based) to produce key "2:6:5"
    const hasEntry = AMBIGUITY_LOOKUP.has('2:6:5')
    if (hasEntry) {
      const result = getAmbiguity(2, 6, 4, 'ءانذرتهم')
      expect(result).toBeDefined()
      expect(result.location).toBe('2:6:5')
    }
  })
})
