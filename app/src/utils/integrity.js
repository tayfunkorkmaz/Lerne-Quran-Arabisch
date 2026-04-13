/**
 * Integrity verification for Quran text data.
 * Ensures the loaded text has not been corrupted or tampered with.
 */

import checksumData from '../data/quran-checksum.json'
import { TASHKIL_REGEX_SOURCE } from './arabic.js'

// Unified tashkil regex (imported from arabic.js for consistency)
const VOWEL_MARKS_REGEX = new RegExp(TASHKIL_REGEX_SOURCE, 'g')

// Individual vowel mark constants for reference
export const VOWEL_MARKS = {
  FATHATAN: '\u064B',   // tanwin fatha
  DAMMATAN: '\u064C',   // tanwin damma
  KASRATAN: '\u064D',   // tanwin kasra
  FATHA: '\u064E',      // fatha
  DAMMA: '\u064F',      // damma
  KASRA: '\u0650',      // kasra
  SHADDA: '\u0651',     // shadda
  SUKUN: '\u0652',      // sukun
}

/**
 * Compute SHA-256 checksum of a string using the Web Crypto API.
 * @param {string} text - The text to hash.
 * @returns {Promise<string>} Hex-encoded SHA-256 hash.
 */
export async function computeSHA256(text) {
  if (!crypto?.subtle?.digest) {
    console.warn('Web Crypto API nicht verfügbar — Integritätsprüfung übersprungen')
    return null
  }
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Verify the integrity of loaded Quran text data by comparing
 * its SHA-256 checksum against the stored known-good checksum.
 *
 * @param {object} quranData - The loaded quran-simple-clean.json data.
 * @returns {Promise<{valid: boolean, computed: string, expected: string, details: object}>}
 */
export async function verifyQuranIntegrity(quranData) {
  const expected = checksumData.hash
  const expectedSurahs = checksumData.totalSurahs
  const expectedVerses = checksumData.totalVerses

  // Validate structure
  if (!quranData || !quranData.surahs || !Array.isArray(quranData.surahs)) {
    return {
      valid: false,
      computed: null,
      expected,
      details: { error: 'Ungültige Datenstruktur' },
    }
  }

  // Validate surah count
  const surahCount = quranData.surahs.length
  if (surahCount !== expectedSurahs) {
    return {
      valid: false,
      computed: null,
      expected,
      details: {
        error: `Suren-Anzahl: ${surahCount}, erwartet: ${expectedSurahs}`,
        surahCount,
        expectedSurahs,
      },
    }
  }

  // Count total verses and concatenate text
  let totalVerses = 0
  let concatenated = ''

  for (const surah of quranData.surahs) {
    if (!surah.verses || !Array.isArray(surah.verses)) {
      return {
        valid: false,
        computed: null,
        expected,
        details: {
          error: `Sure ${surah.number} hat ungültige Verse`,
        },
      }
    }
    totalVerses += surah.verses.length
    for (const verse of surah.verses) {
      concatenated += verse.text
    }
  }

  // Validate verse count
  if (totalVerses !== expectedVerses) {
    return {
      valid: false,
      computed: null,
      expected,
      details: {
        error: `Vers-Anzahl: ${totalVerses}, erwartet: ${expectedVerses}`,
        totalVerses,
        expectedVerses,
      },
    }
  }

  // Compute checksum
  const computed = await computeSHA256(concatenated)

  // If crypto API unavailable, skip hash check but validate structure
  if (computed === null) {
    return {
      valid: true,
      computed: null,
      expected,
      details: {
        surahCount,
        totalVerses,
        textLength: concatenated.length,
        note: 'Crypto API nicht verfügbar — nur Strukturprüfung',
      },
    }
  }

  return {
    valid: computed === expected,
    computed,
    expected,
    details: {
      surahCount,
      totalVerses,
      textLength: concatenated.length,
    },
  }
}

/**
 * Detect if text contains Arabic vowel marks (tashkeel).
 * Used to verify that the consonantal text is clean.
 *
 * @param {string} text - Arabic text to check.
 * @returns {{hasVowels: boolean, count: number, positions: Array<{index: number, char: string, charCode: string}>}}
 */
export function detectVowelMarks(text) {
  const matches = [...text.matchAll(VOWEL_MARKS_REGEX)]

  return {
    hasVowels: matches.length > 0,
    count: matches.length,
    positions: matches.slice(0, 20).map(m => ({
      index: m.index,
      char: m[0],
      charCode: 'U+' + m[0].charCodeAt(0).toString(16).toUpperCase().padStart(4, '0'),
    })),
  }
}

/**
 * Scan the entire Quran data for vowel marks.
 * Returns a summary of which surahs/verses contain unexpected diacritics.
 *
 * @param {object} quranData - The loaded Quran data.
 * @returns {{clean: boolean, violations: Array}}
 */
export function scanForVowelMarks(quranData) {
  const violations = []

  for (const surah of quranData.surahs) {
    for (const verse of surah.verses) {
      const result = detectVowelMarks(verse.text)
      if (result.hasVowels) {
        violations.push({
          surah: surah.number,
          verse: verse.number,
          vowelCount: result.count,
          sample: result.positions.slice(0, 3),
        })
      }
    }
  }

  return {
    clean: violations.length === 0,
    violations,
  }
}

/**
 * Validate verse counts per surah against known structure.
 * Standard Quran has 6236 verses across 114 surahs.
 *
 * @param {object} quranData - The loaded Quran data.
 * @returns {{valid: boolean, totalVerses: number, totalSurahs: number}}
 */
export function validateVerseCount(quranData) {
  if (!quranData || !quranData.surahs) {
    return { valid: false, totalVerses: 0, totalSurahs: 0 }
  }

  const totalSurahs = quranData.surahs.length
  let totalVerses = 0

  for (const surah of quranData.surahs) {
    totalVerses += surah.verses ? surah.verses.length : 0
  }

  return {
    valid: totalSurahs === 114 && totalVerses === 6236,
    totalVerses,
    totalSurahs,
  }
}
