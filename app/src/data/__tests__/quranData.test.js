/**
 * Tests for Quran data integrity.
 * Validates structural correctness of the core data JSON files.
 */
import { describe, it, expect } from 'vitest'
import quranData from '../quran-simple-clean.json'
import rootFrequency from '../root-frequency.json'
import particles from '../particles.json'
import alphabet from '../alphabet.json'

// ===== quran-simple-clean.json =====
describe('quran-simple-clean.json', () => {
  it('has a surahs array', () => {
    expect(quranData).toHaveProperty('surahs')
    expect(Array.isArray(quranData.surahs)).toBe(true)
  })

  it('has exactly 114 surahs', () => {
    expect(quranData.surahs).toHaveLength(114)
  })

  it('has exactly 6236 verses total', () => {
    let totalVerses = 0
    for (const surah of quranData.surahs) {
      totalVerses += surah.verses.length
    }
    expect(totalVerses).toBe(6236)
  })

  it('every surah has a number property', () => {
    for (const surah of quranData.surahs) {
      expect(surah, `Surah missing number`).toHaveProperty('number')
      expect(typeof surah.number).toBe('number')
    }
  })

  it('every surah has a verses array', () => {
    for (const surah of quranData.surahs) {
      expect(surah, `Surah ${surah.number} missing verses`).toHaveProperty('verses')
      expect(Array.isArray(surah.verses), `Surah ${surah.number} verses is not array`).toBe(true)
    }
  })

  it('surah numbers are sequential from 1 to 114', () => {
    for (let i = 0; i < quranData.surahs.length; i++) {
      expect(quranData.surahs[i].number).toBe(i + 1)
    }
  })

  it('every verse has number and text properties', () => {
    for (const surah of quranData.surahs) {
      for (const verse of surah.verses) {
        expect(verse, `Surah ${surah.number} verse missing number`).toHaveProperty('number')
        expect(verse, `Surah ${surah.number} verse missing text`).toHaveProperty('text')
        expect(typeof verse.text).toBe('string')
        expect(verse.text.length, `Surah ${surah.number}:${verse.number} has empty text`).toBeGreaterThan(0)
      }
    }
  })

  it('verse numbers within each surah are sequential starting from 1', () => {
    for (const surah of quranData.surahs) {
      for (let i = 0; i < surah.verses.length; i++) {
        expect(
          surah.verses[i].number,
          `Surah ${surah.number}: verse at index ${i} has wrong number`
        ).toBe(i + 1)
      }
    }
  })

  it('Al-Fatiha (surah 1) has 7 verses', () => {
    expect(quranData.surahs[0].verses).toHaveLength(7)
  })

  it('Al-Baqara (surah 2) has 286 verses', () => {
    expect(quranData.surahs[1].verses).toHaveLength(286)
  })

  it('Al-Kawthar (surah 108) has 3 verses (shortest surah)', () => {
    expect(quranData.surahs[107].verses).toHaveLength(3)
  })
})

// ===== root-frequency.json =====
describe('root-frequency.json', () => {
  it('has a meta object', () => {
    expect(rootFrequency).toHaveProperty('meta')
    expect(rootFrequency.meta).toHaveProperty('totalRoots')
  })

  it('has a roots array', () => {
    expect(rootFrequency).toHaveProperty('roots')
    expect(Array.isArray(rootFrequency.roots)).toBe(true)
  })

  it('has at least 300 roots', () => {
    expect(rootFrequency.roots.length).toBeGreaterThanOrEqual(300)
  })

  it('meta.totalRoots is a positive number', () => {
    expect(rootFrequency.meta.totalRoots).toBeGreaterThan(0)
  })

  it('every root entry has rank, root, count', () => {
    for (const entry of rootFrequency.roots) {
      expect(entry).toHaveProperty('rank')
      expect(entry).toHaveProperty('root')
      expect(entry).toHaveProperty('count')
      expect(typeof entry.rank).toBe('number')
      expect(typeof entry.count).toBe('number')
    }
  })

  it('roots are sorted by rank (ascending)', () => {
    for (let i = 1; i < rootFrequency.roots.length; i++) {
      expect(
        rootFrequency.roots[i].rank,
        `Root at index ${i} has rank ${rootFrequency.roots[i].rank} but previous is ${rootFrequency.roots[i - 1].rank}`
      ).toBeGreaterThanOrEqual(rootFrequency.roots[i - 1].rank)
    }
  })

  it('most frequent root is ا ل ه (God/deity)', () => {
    const top = rootFrequency.roots[0]
    expect(top.root).toBe('ا ل ه')
    expect(top.rank).toBe(1)
  })
})

// ===== particles.json =====
describe('particles.json', () => {
  it('has a particles array', () => {
    expect(particles).toHaveProperty('particles')
    expect(Array.isArray(particles.particles)).toBe(true)
  })

  it('particle count matches meta.totalCount', () => {
    expect(particles.particles).toHaveLength(particles.meta.totalCount)
  })

  it('meta.totalCount matches actual count', () => {
    expect(particles.meta.totalCount).toBe(particles.particles.length)
  })

  it('every particle has arabic property', () => {
    for (const particle of particles.particles) {
      expect(particle, `Particle missing arabic property`).toHaveProperty('arabic')
      expect(particle.arabic.length).toBeGreaterThan(0)
    }
  })
})

// ===== alphabet.json =====
describe('alphabet.json', () => {
  it('has a letters array', () => {
    expect(alphabet).toHaveProperty('letters')
    expect(Array.isArray(alphabet.letters)).toBe(true)
  })

  it('has 28 letters', () => {
    expect(alphabet.letters).toHaveLength(28)
  })

  it('every letter has id, name, and forms', () => {
    for (const letter of alphabet.letters) {
      expect(letter).toHaveProperty('id')
      expect(letter).toHaveProperty('name')
      expect(letter).toHaveProperty('forms')
      expect(typeof letter.id).toBe('number')
      expect(typeof letter.name).toBe('string')
    }
  })

  it('letter IDs are sequential from 1 to 28', () => {
    for (let i = 0; i < alphabet.letters.length; i++) {
      expect(alphabet.letters[i].id).toBe(i + 1)
    }
  })

  it('first letter is Alif', () => {
    expect(alphabet.letters[0].name).toBe('Alif')
  })

  it('every letter has isolated form', () => {
    for (const letter of alphabet.letters) {
      expect(letter.forms).toHaveProperty('isolated')
      expect(letter.forms.isolated.length).toBeGreaterThan(0)
    }
  })
})
