/**
 * Universal JSON validator — tests EVERY JSON data file in the project.
 * Validates: parseable, non-empty, correct top-level type, no null values in arrays.
 *
 * This dynamically imports ALL 116 JSON files from src/data/.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

const DATA_DIR = join(__dirname, '..')

// Discover all JSON files
const jsonFiles = readdirSync(DATA_DIR)
  .filter(f => f.endsWith('.json'))
  .sort()

describe('Universal JSON validation', () => {
  it('found at least 100 JSON files', () => {
    expect(jsonFiles.length).toBeGreaterThanOrEqual(100)
  })

  describe.each(jsonFiles)('%s', (filename) => {
    const filePath = join(DATA_DIR, filename)
    let data

    it('is valid JSON', () => {
      const raw = readFileSync(filePath, 'utf8')
      expect(() => { data = JSON.parse(raw) }).not.toThrow()
    })

    it('is not null or undefined', () => {
      const raw = readFileSync(filePath, 'utf8')
      data = JSON.parse(raw)
      expect(data).not.toBeNull()
      expect(data).toBeDefined()
    })

    it('is a non-empty object or array', () => {
      const raw = readFileSync(filePath, 'utf8')
      data = JSON.parse(raw)
      if (Array.isArray(data)) {
        expect(data.length).toBeGreaterThan(0)
      } else if (typeof data === 'object') {
        expect(Object.keys(data).length).toBeGreaterThan(0)
      }
    })

    it('top-level arrays contain no null entries', () => {
      const raw = readFileSync(filePath, 'utf8')
      data = JSON.parse(raw)
      // Check all top-level array properties
      if (typeof data === 'object' && !Array.isArray(data)) {
        for (const [key, value] of Object.entries(data)) {
          if (Array.isArray(value)) {
            value.forEach((item, i) => {
              expect(item, `${filename} → ${key}[${i}] is null`).not.toBeNull()
            })
          }
        }
      }
      // If top-level is array
      if (Array.isArray(data)) {
        data.forEach((item, i) => {
          expect(item, `${filename}[${i}] is null`).not.toBeNull()
        })
      }
    })
  })
})

// ═══════════════════════════════════════════════════════
// Cross-reference: all 4 Quran text layers consistent
// ═══════════════════════════════════════════════════════
describe('Cross-reference: Quran text layers', () => {
  const simple = JSON.parse(readFileSync(join(DATA_DIR, 'quran-simple-clean.json'), 'utf8'))
  const rasm = JSON.parse(readFileSync(join(DATA_DIR, 'quran-rasm.json'), 'utf8'))
  const uthmani = JSON.parse(readFileSync(join(DATA_DIR, 'quran-uthmani.json'), 'utf8'))
  const vocalized = JSON.parse(readFileSync(join(DATA_DIR, 'quran-vocalized.json'), 'utf8'))

  it('all layers have 114 surahs', () => {
    expect(simple.surahs.length).toBe(114)
    expect(rasm.surahs.length).toBe(114)
    expect(uthmani.surahs.length).toBe(114)
    expect(vocalized.surahs.length).toBe(114)
  })

  it('verse counts match across all layers for every surah', () => {
    for (let i = 0; i < 114; i++) {
      const expected = simple.surahs[i].verses.length
      expect(rasm.surahs[i].verses.length, `rasm surah ${i + 1}`).toBe(expected)
      expect(uthmani.surahs[i].verses.length, `uthmani surah ${i + 1}`).toBe(expected)
      expect(vocalized.surahs[i].verses.length, `vocalized surah ${i + 1}`).toBe(expected)
    }
  })

  it('total verses = 6236 in all layers', () => {
    const count = (data) => data.surahs.reduce((sum, s) => sum + s.verses.length, 0)
    expect(count(simple)).toBe(6236)
    expect(count(rasm)).toBe(6236)
    expect(count(uthmani)).toBe(6236)
    expect(count(vocalized)).toBe(6236)
  })
})

// ═══════════════════════════════════════════════════════
// Cross-reference: audio config verse counts
// ═══════════════════════════════════════════════════════
describe('Cross-reference: audio config', () => {
  const simple = JSON.parse(readFileSync(join(DATA_DIR, 'quran-simple-clean.json'), 'utf8'))
  const audio = JSON.parse(readFileSync(join(DATA_DIR, 'audio-config.json'), 'utf8'))

  it('audio config has 114 surah counts', () => {
    expect(audio.surahAyahCounts.counts.length).toBe(114)
  })

  it('audio config verse counts match quran data', () => {
    for (let i = 0; i < 114; i++) {
      expect(audio.surahAyahCounts.counts[i], `surah ${i + 1}`).toBe(simple.surahs[i].verses.length)
    }
  })
})

// ═══════════════════════════════════════════════════════
// Cross-reference: checksum metadata
// ═══════════════════════════════════════════════════════
describe('Cross-reference: checksum', () => {
  const checksum = JSON.parse(readFileSync(join(DATA_DIR, 'quran-checksum.json'), 'utf8'))

  it('has correct totalSurahs', () => {
    expect(checksum.totalSurahs).toBe(114)
  })

  it('has correct totalVerses', () => {
    expect(checksum.totalVerses).toBe(6236)
  })

  it('has a 64-char hex hash', () => {
    expect(checksum.hash).toMatch(/^[0-9a-f]{64}$/)
  })
})

// ═══════════════════════════════════════════════════════
// Specific structure validation for critical files
// ═══════════════════════════════════════════════════════
describe('Critical file structures', () => {
  it('particles.json has particles array with required fields', () => {
    const data = JSON.parse(readFileSync(join(DATA_DIR, 'particles.json'), 'utf8'))
    expect(data.particles.length).toBeGreaterThan(0)
    const p = data.particles[0]
    expect(p).toHaveProperty('id')
    expect(p).toHaveProperty('arabic')
    expect(p).toHaveProperty('german')
  })

  it('pronouns.json has independent and suffix sections', () => {
    const data = JSON.parse(readFileSync(join(DATA_DIR, 'pronouns.json'), 'utf8'))
    expect(data).toHaveProperty('independent')
    expect(data).toHaveProperty('suffix')
    expect(data.independent).toHaveProperty('pronouns')
    expect(data.independent.pronouns.length).toBeGreaterThan(0)
  })

  it('morphology-tables.json has verbForms array', () => {
    const data = JSON.parse(readFileSync(join(DATA_DIR, 'morphology-tables.json'), 'utf8'))
    expect(data.verbForms.length).toBe(10) // Forms I-X
  })

  it('morphology-lessons.json has lessons array', () => {
    const data = JSON.parse(readFileSync(join(DATA_DIR, 'morphology-lessons.json'), 'utf8'))
    expect(data.lessons.length).toBeGreaterThan(0)
    expect(data.lessons[0]).toHaveProperty('id')
    expect(data.lessons[0]).toHaveProperty('title')
  })

  it('ambiguities.json has entries with consonants and options', () => {
    const data = JSON.parse(readFileSync(join(DATA_DIR, 'ambiguities.json'), 'utf8'))
    expect(data.entries.length).toBeGreaterThan(0)
    expect(data.entries[0]).toHaveProperty('consonants')
    expect(data.entries[0]).toHaveProperty('options')
  })

  it('root-frequency-complete.json has roots with rootArabic, rank, count', () => {
    const data = JSON.parse(readFileSync(join(DATA_DIR, 'root-frequency-complete.json'), 'utf8'))
    expect(data.roots.length).toBeGreaterThan(1000)
    expect(data.roots[0]).toHaveProperty('rootArabic')
    expect(data.roots[0]).toHaveProperty('rank')
    expect(data.roots[0]).toHaveProperty('count')
  })

  it('root-meanings.json has roots with root and meaning', () => {
    const data = JSON.parse(readFileSync(join(DATA_DIR, 'root-meanings.json'), 'utf8'))
    expect(data.roots.length).toBeGreaterThan(0)
    expect(data.roots[0]).toHaveProperty('root')
    expect(data.roots[0]).toHaveProperty('meaning')
  })

  it('quran-morphology-db.json has words array with required fields', () => {
    const data = JSON.parse(readFileSync(join(DATA_DIR, 'quran-morphology-db.json'), 'utf8'))
    expect(data.words.length).toBeGreaterThan(70000)
    const w = data.words[0]
    expect(w).toHaveProperty('l') // location
    expect(w).toHaveProperty('p') // POS
  })

  it('alphabet.json has letters array', () => {
    const data = JSON.parse(readFileSync(join(DATA_DIR, 'alphabet.json'), 'utf8'))
    expect(data.letters.length).toBeGreaterThanOrEqual(28)
  })

  it('thematic-fields.json has fields array', () => {
    const data = JSON.parse(readFileSync(join(DATA_DIR, 'thematic-fields.json'), 'utf8'))
    expect(data.fields.length).toBeGreaterThan(0)
    expect(data.fields[0]).toHaveProperty('id')
  })

  it('advanced-stages.json has stages array', () => {
    const data = JSON.parse(readFileSync(join(DATA_DIR, 'advanced-stages.json'), 'utf8'))
    expect(data.stages.length).toBeGreaterThan(0)
  })

  it('collocations.json has rootCollocations', () => {
    const data = JSON.parse(readFileSync(join(DATA_DIR, 'collocations.json'), 'utf8'))
    expect(data.rootCollocations.length).toBeGreaterThan(0)
  })

  it('sura-index.json has entries', () => {
    const data = JSON.parse(readFileSync(join(DATA_DIR, 'sura-index.json'), 'utf8'))
    expect(data.surahs.length).toBe(114)
  })

  it('syntax-exercises.json has exercises', () => {
    const data = JSON.parse(readFileSync(join(DATA_DIR, 'syntax-exercises.json'), 'utf8'))
    expect(data.exercises.length).toBeGreaterThan(0)
  })

  it('all syntax chunk files have exercises', () => {
    const chunks = [
      'syntax-3-01-10.json', 'syntax-3-11-20.json', 'syntax-3-21-30.json',
      'syntax-3-31-38.json', 'syntax-3-39-41.json', 'syntax-3-42-44.json',
      'syntax-4-01-07.json', 'syntax-4-08-15.json',
    ]
    for (const chunk of chunks) {
      const data = JSON.parse(readFileSync(join(DATA_DIR, chunk), 'utf8'))
      expect(data.exercises?.length || data.length, chunk).toBeGreaterThan(0)
    }
  })

  it('all syntax-exercises-extended files have exercises', () => {
    const exts = [
      'syntax-exercises-extended.json', 'syntax-exercises-extended-2.json',
      'syntax-exercises-extended-3.json', 'syntax-exercises-extended-4.json',
    ]
    for (const ext of exts) {
      const data = JSON.parse(readFileSync(join(DATA_DIR, ext), 'utf8'))
      expect(data.exercises?.length || data.length, ext).toBeGreaterThan(0)
    }
  })
})
