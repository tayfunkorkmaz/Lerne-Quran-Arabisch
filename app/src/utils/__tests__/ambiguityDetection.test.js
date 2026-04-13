/**
 * Tests for src/utils/ambiguityDetection.js
 */
import { describe, it, expect } from 'vitest'
import {
  detectAmbiguities,
  mergeAmbiguities,
  buildAmbiguityLookup,
  buildConsonantalLookup,
} from '../ambiguityDetection.js'

// ===== detectAmbiguities =====
describe('detectAmbiguities', () => {
  it('returns empty array for null/undefined morphDB', () => {
    expect(detectAmbiguities(null)).toEqual([])
    expect(detectAmbiguities(undefined)).toEqual([])
    expect(detectAmbiguities({})).toEqual([])
  })

  it('returns empty array for empty words array', () => {
    expect(detectAmbiguities({ words: [] })).toEqual([])
  })

  it('returns empty array when all words have the same root', () => {
    const morphDB = {
      words: [
        { v: 'كَتَبَ', r: 'ك ت ب', l: '1:1:1', p: 'V', m: 'ACT' },
        { v: 'كَتَبُوا', r: 'ك ت ب', l: '2:1:1', p: 'V', m: 'ACT' },
      ],
    }
    // Same root, different forms -- not ambiguous by Rule 1
    const results = detectAmbiguities(morphDB)
    // These have different consonantal forms, so no ambiguity on the same form
    const rootAmbiguities = results.filter(r => r.category === 'root_ambiguity')
    expect(rootAmbiguities).toEqual([])
  })

  it('detects multi-root forms (Rule 1)', () => {
    // Same consonantal form "فعل" with two different roots
    const morphDB = {
      words: [
        { v: 'فَعَلَ', r: 'ف ع ل', l: '1:1:1', p: 'V', m: 'ACT' },
        { v: 'فُعِلَ', r: 'ف ع ل', l: '1:1:2', p: 'V', m: 'PASS' },
        { v: 'فَعَلَ', r: 'ف ع ل 2', l: '2:1:1', p: 'V', m: 'ACT' },
      ],
    }
    const results = detectAmbiguities(morphDB)
    // The consonantal form "فعل" appears with two roots: "ف ع ل" and "ف ع ل 2"
    const rootAmbiguities = results.filter(r => r.category === 'root_ambiguity')
    expect(rootAmbiguities.length).toBeGreaterThan(0)
    expect(rootAmbiguities[0].autoDetected).toBe(true)
    expect(rootAmbiguities[0].options.length).toBeGreaterThanOrEqual(2)
  })

  it('detects active/passive ambiguities (Rule 2)', () => {
    // Same consonantal form with ACT and PASS morphology
    const morphDB = {
      words: [
        { v: 'عَلِمَ', r: 'ع ل م', l: '2:1:1', p: 'V', m: 'PERF ACT' },
        { v: 'عُلِمَ', r: 'ع ل م', l: '3:1:1', p: 'V', m: 'PERF PASS' },
      ],
    }
    const results = detectAmbiguities(morphDB)
    const apAmbiguities = results.filter(r => r.category === 'active_passive')
    expect(apAmbiguities.length).toBeGreaterThan(0)
    // Should have active and passive options
    const entry = apAmbiguities[0]
    const voices = entry.options.map(o => o.voice)
    expect(voices).toContain('active')
    expect(voices).toContain('passive')
  })

  it('assigns auto-generated IDs starting from 10000', () => {
    const morphDB = {
      words: [
        { v: 'فَعَلَ', r: 'root1', l: '1:1:1', p: 'V', m: 'ACT' },
        { v: 'فُعِلَ', r: 'root2', l: '2:1:1', p: 'V', m: 'ACT' },
      ],
    }
    const results = detectAmbiguities(morphDB)
    if (results.length > 0) {
      expect(results[0].id).toMatch(/^auto_\d+/)
      const idNum = parseInt(results[0].id.replace('auto_', ''))
      expect(idNum).toBeGreaterThanOrEqual(10000)
    }
  })
})

// ===== mergeAmbiguities =====
describe('mergeAmbiguities', () => {
  it('manual entries take precedence over auto-detected', () => {
    const manual = {
      entries: [
        { id: 1, consonants: 'ملك', location: '1:4:3', options: [{ root: 'م ل ك' }] },
      ],
    }
    const autoDetected = [
      {
        id: 'auto_10000',
        consonants: 'ملك',
        category: 'root_ambiguity',
        autoDetected: true,
        sampleLocations: ['1:4:3'],
        options: [{ root: 'م ل ك' }],
      },
    ]
    const merged = mergeAmbiguities(manual, autoDetected)
    // The auto entry should be filtered out because it duplicates the manual one
    const autoEntries = merged.entries.filter(e => e.autoDetected)
    expect(autoEntries).toHaveLength(0)
    // The manual entry should be present
    expect(merged.entries.find(e => e.id === 1)).toBeTruthy()
  })

  it('includes auto entries when no manual overlap', () => {
    const manual = {
      entries: [
        { id: 1, consonants: 'كتب', location: '2:1:1', options: [] },
      ],
    }
    const autoDetected = [
      {
        id: 'auto_10001',
        consonants: 'فعل',
        category: 'root_ambiguity',
        autoDetected: true,
        sampleLocations: ['5:1:1'],
        options: [],
      },
    ]
    const merged = mergeAmbiguities(manual, autoDetected)
    expect(merged.entries).toHaveLength(2)
  })

  it('handles null manual ambiguities gracefully', () => {
    const autoDetected = [
      {
        id: 'auto_10000',
        consonants: 'فعل',
        autoDetected: true,
        sampleLocations: ['1:1:1'],
        options: [],
      },
    ]
    const merged = mergeAmbiguities(null, autoDetected)
    expect(merged.entries).toHaveLength(1)
  })

  it('includes _meta with autoDetectedCount', () => {
    const manual = { entries: [] }
    const autoDetected = [
      { id: 'auto_10000', consonants: 'فعل', autoDetected: true, sampleLocations: ['1:1:1'], options: [] },
      { id: 'auto_10001', consonants: 'كتب', autoDetected: true, sampleLocations: ['2:1:1'], options: [] },
    ]
    const merged = mergeAmbiguities(manual, autoDetected)
    expect(merged._meta.autoDetectedCount).toBe(2)
  })
})

// ===== buildAmbiguityLookup =====
describe('buildAmbiguityLookup', () => {
  it('returns empty map for null input', () => {
    const lookup = buildAmbiguityLookup(null)
    expect(lookup.size).toBe(0)
  })

  it('indexes manual entries by location', () => {
    const merged = {
      entries: [
        { id: 1, location: '1:4:3', consonants: 'ملك', options: [] },
      ],
    }
    const lookup = buildAmbiguityLookup(merged)
    expect(lookup.has('1:4:3')).toBe(true)
    expect(lookup.get('1:4:3').id).toBe(1)
  })

  it('indexes auto-detected entries by sampleLocations', () => {
    const merged = {
      entries: [
        {
          id: 'auto_10000',
          autoDetected: true,
          consonants: 'فعل',
          sampleLocations: ['2:1:5', '3:2:1'],
          options: [],
        },
      ],
    }
    const lookup = buildAmbiguityLookup(merged)
    expect(lookup.has('2:1:5')).toBe(true)
    expect(lookup.has('3:2:1')).toBe(true)
  })

  it('manual entries take precedence over auto at same location', () => {
    const merged = {
      entries: [
        { id: 1, location: '1:4:3', consonants: 'ملك', options: [] },
        {
          id: 'auto_10000',
          autoDetected: true,
          consonants: 'ملك',
          sampleLocations: ['1:4:3'],
          options: [],
        },
      ],
    }
    const lookup = buildAmbiguityLookup(merged)
    // Manual entry comes first, so the auto one should NOT overwrite
    expect(lookup.get('1:4:3').id).toBe(1)
  })
})

// ===== buildConsonantalLookup =====
describe('buildConsonantalLookup', () => {
  it('returns empty map for null input', () => {
    const lookup = buildConsonantalLookup(null)
    expect(lookup.size).toBe(0)
  })

  it('indexes entries by consonantal form', () => {
    const merged = {
      entries: [
        { id: 1, consonants: 'ملك', options: [] },
        { id: 2, consonants: 'كتب', options: [] },
      ],
    }
    const lookup = buildConsonantalLookup(merged)
    expect(lookup.has('ملك')).toBe(true)
    expect(lookup.has('كتب')).toBe(true)
    expect(lookup.get('ملك').id).toBe(1)
  })

  it('first entry wins for duplicate consonantal forms', () => {
    const merged = {
      entries: [
        { id: 1, consonants: 'ملك', options: [{ root: 'first' }] },
        { id: 2, consonants: 'ملك', options: [{ root: 'second' }] },
      ],
    }
    const lookup = buildConsonantalLookup(merged)
    expect(lookup.get('ملك').id).toBe(1)
  })

  it('strips vowels from consonants field before indexing', () => {
    const merged = {
      entries: [
        { id: 1, consonants: 'مَلِكِ', options: [] },
      ],
    }
    const lookup = buildConsonantalLookup(merged)
    // After stripping vowels, the key should be 'ملك'
    expect(lookup.has('ملك')).toBe(true)
  })
})
