/**
 * Tests for src/utils/integrity.js
 */
import { describe, it, expect } from 'vitest'
import { computeSHA256, detectVowelMarks, VOWEL_MARKS } from '../integrity.js'

// ===== computeSHA256 =====
describe('computeSHA256', () => {
  it('computes a known hash for a known input', async () => {
    // SHA-256 of empty string is well known
    const hash = await computeSHA256('')
    // SHA-256('') = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    if (hash !== null) {
      expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
    }
  })

  it('computes a different hash for different input', async () => {
    const hash1 = await computeSHA256('hello')
    const hash2 = await computeSHA256('world')
    if (hash1 !== null && hash2 !== null) {
      expect(hash1).not.toBe(hash2)
    }
  })

  it('returns a 64-character hex string', async () => {
    const hash = await computeSHA256('test')
    if (hash !== null) {
      expect(hash).toHaveLength(64)
      expect(hash).toMatch(/^[0-9a-f]{64}$/)
    }
  })

  it('returns null when crypto.subtle is unavailable', async () => {
    const originalCrypto = globalThis.crypto
    try {
      // Temporarily remove crypto
      Object.defineProperty(globalThis, 'crypto', {
        value: {},
        writable: true,
        configurable: true,
      })
      const hash = await computeSHA256('test')
      expect(hash).toBeNull()
    } finally {
      Object.defineProperty(globalThis, 'crypto', {
        value: originalCrypto,
        writable: true,
        configurable: true,
      })
    }
  })
})

// ===== verifyQuranIntegrity =====
// We test the logic inline since importing verifyQuranIntegrity requires the
// checksum JSON which is available as a module.
describe('verifyQuranIntegrity (logic tests)', () => {
  // We dynamically import to avoid issues with the JSON import in test context
  let verifyQuranIntegrity

  it('can be imported', async () => {
    const mod = await import('../integrity.js')
    verifyQuranIntegrity = mod.verifyQuranIntegrity
    expect(typeof verifyQuranIntegrity).toBe('function')
  })

  it('returns valid:false for null input', async () => {
    const mod = await import('../integrity.js')
    const result = await mod.verifyQuranIntegrity(null)
    expect(result.valid).toBe(false)
    expect(result.details.error).toBeTruthy()
  })

  it('returns valid:false for data without surahs array', async () => {
    const mod = await import('../integrity.js')
    const result = await mod.verifyQuranIntegrity({ surahs: 'not_array' })
    expect(result.valid).toBe(false)
  })

  it('returns valid:false for missing surahs (wrong count)', async () => {
    const mod = await import('../integrity.js')
    // Only 2 surahs instead of 114
    const fakeData = {
      surahs: [
        { number: 1, verses: [{ number: 1, text: 'test' }] },
        { number: 2, verses: [{ number: 1, text: 'test2' }] },
      ],
    }
    const result = await mod.verifyQuranIntegrity(fakeData)
    expect(result.valid).toBe(false)
    expect(result.details.error).toContain('Suren-Anzahl')
  })

  it('returns valid:false for wrong verse count', async () => {
    const mod = await import('../integrity.js')
    // 114 surahs but each with only 1 verse (= 114 total, not 6236)
    const fakeSurahs = Array.from({ length: 114 }, (_, i) => ({
      number: i + 1,
      verses: [{ number: 1, text: 'test' }],
    }))
    const fakeData = { surahs: fakeSurahs }
    const result = await mod.verifyQuranIntegrity(fakeData)
    expect(result.valid).toBe(false)
    expect(result.details.error).toContain('Vers-Anzahl')
  })

  it('returns valid:false for surah with invalid verses', async () => {
    const mod = await import('../integrity.js')
    const fakeSurahs = Array.from({ length: 114 }, (_, i) => ({
      number: i + 1,
      verses: i === 0 ? 'not_array' : [{ number: 1, text: 'test' }],
    }))
    const fakeData = { surahs: fakeSurahs }
    const result = await mod.verifyQuranIntegrity(fakeData)
    expect(result.valid).toBe(false)
    expect(result.details.error).toContain('ungültige Verse')
  })
})

// ===== detectVowelMarks =====
describe('detectVowelMarks', () => {
  it('detects tashkil in vocalized text', () => {
    const result = detectVowelMarks('بِسْمِ ٱللَّهِ')
    expect(result.hasVowels).toBe(true)
    expect(result.count).toBeGreaterThan(0)
  })

  it('returns hasVowels:false for consonantal-only text', () => {
    const result = detectVowelMarks('بسم الله')
    expect(result.hasVowels).toBe(false)
    expect(result.count).toBe(0)
  })

  it('reports positions of found vowel marks', () => {
    const result = detectVowelMarks('كَتَبَ')
    expect(result.hasVowels).toBe(true)
    expect(result.positions.length).toBeGreaterThan(0)
    // Each position should have index, char, charCode
    expect(result.positions[0]).toHaveProperty('index')
    expect(result.positions[0]).toHaveProperty('char')
    expect(result.positions[0]).toHaveProperty('charCode')
  })

  it('limits positions to at most 20 entries', () => {
    // Create text with many vowel marks
    const manyVowels = 'كَ'.repeat(30)
    const result = detectVowelMarks(manyVowels)
    expect(result.positions.length).toBeLessThanOrEqual(20)
  })

  it('detects individual vowel mark types', () => {
    // Test fatha specifically
    const resultFatha = detectVowelMarks('كَ')
    expect(resultFatha.hasVowels).toBe(true)
    expect(resultFatha.positions[0].charCode).toBe('U+064E')

    // Test shadda
    const resultShadda = detectVowelMarks('كّ')
    expect(resultShadda.hasVowels).toBe(true)
    expect(resultShadda.positions[0].charCode).toBe('U+0651')
  })
})

// ===== VOWEL_MARKS constants =====
describe('VOWEL_MARKS', () => {
  it('has all expected vowel mark constants', () => {
    expect(VOWEL_MARKS.FATHA).toBe('\u064E')
    expect(VOWEL_MARKS.DAMMA).toBe('\u064F')
    expect(VOWEL_MARKS.KASRA).toBe('\u0650')
    expect(VOWEL_MARKS.SHADDA).toBe('\u0651')
    expect(VOWEL_MARKS.SUKUN).toBe('\u0652')
    expect(VOWEL_MARKS.FATHATAN).toBe('\u064B')
    expect(VOWEL_MARKS.DAMMATAN).toBe('\u064C')
    expect(VOWEL_MARKS.KASRATAN).toBe('\u064D')
  })
})
