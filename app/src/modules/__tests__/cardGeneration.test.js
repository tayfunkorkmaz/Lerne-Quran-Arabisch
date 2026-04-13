/**
 * Tests for SRS card generation logic from Module5.jsx.
 * Functions are not exported, so we replicate the pure logic here.
 */
import { describe, it, expect } from 'vitest'
import { cleanArabicText } from '../../utils/arabic.js'
import particles from '../../data/particles.json'
import morphologyTables from '../../data/morphology-tables.json'

// ═══════════════════════════════════════════════════════
// Letter Card Generation (29 Arabic letters)
// ═══════════════════════════════════════════════════════

const ARABIC_LETTERS = [
  { letter: '\u0627', name: 'Alif' }, { letter: '\u0628', name: 'Ba' },
  { letter: '\u062A', name: 'Ta' }, { letter: '\u062B', name: 'Tha' },
  { letter: '\u062C', name: 'Dschim' }, { letter: '\u062D', name: 'Ha' },
  { letter: '\u062E', name: 'Cha' }, { letter: '\u062F', name: 'Dal' },
  { letter: '\u0630', name: 'Dhal' }, { letter: '\u0631', name: 'Ra' },
  { letter: '\u0632', name: 'Zay' }, { letter: '\u0633', name: 'Sin' },
  { letter: '\u0634', name: 'Schin' }, { letter: '\u0635', name: 'Sad' },
  { letter: '\u0636', name: 'Dad' }, { letter: '\u0637', name: 'Ta' },
  { letter: '\u0638', name: 'Dha' }, { letter: '\u0639', name: 'Ain' },
  { letter: '\u063A', name: 'Ghain' }, { letter: '\u0641', name: 'Fa' },
  { letter: '\u0642', name: 'Qaf' }, { letter: '\u0643', name: 'Kaf' },
  { letter: '\u0644', name: 'Lam' }, { letter: '\u0645', name: 'Mim' },
  { letter: '\u0646', name: 'Nun' }, { letter: '\u0647', name: 'Ha' },
  { letter: '\u0648', name: 'Waw' }, { letter: '\u064A', name: 'Ya' },
  { letter: '\u0621', name: 'Hamza' },
]

function generateLetterCards() {
  return ARABIC_LETTERS.map((l) => ({
    id: `buchstabe_${l.letter}`,
    type: 'buchstabe',
    front: l.letter,
    back: `Name: ${l.name}`,
    interval: 1,
    ease: 2.5,
    nextReview: null,
    history: [],
  }))
}

describe('generateLetterCards', () => {
  const cards = generateLetterCards()

  it('generates exactly 29 cards', () => {
    expect(cards.length).toBe(29)
  })

  it('all cards have type "buchstabe"', () => {
    cards.forEach(c => expect(c.type).toBe('buchstabe'))
  })

  it('all cards have unique IDs', () => {
    const ids = new Set(cards.map(c => c.id))
    expect(ids.size).toBe(29)
  })

  it('all cards have SM-2 defaults', () => {
    cards.forEach(c => {
      expect(c.interval).toBe(1)
      expect(c.ease).toBe(2.5)
      expect(c.nextReview).toBeNull()
      expect(c.history).toEqual([])
    })
  })

  it('front is a single Arabic letter', () => {
    cards.forEach(c => {
      expect(c.front.length).toBeLessThanOrEqual(2) // some letters are 1 char, hamza is 1
      expect(c.front).toBeTruthy()
    })
  })

  it('includes Hamza', () => {
    expect(cards.some(c => c.front === '\u0621')).toBe(true)
  })

  it('includes Alif', () => {
    expect(cards.some(c => c.front === '\u0627')).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════
// Particle Card Generation
// ═══════════════════════════════════════════════════════

function generateParticleCards(count = 20) {
  const particleList = (particles.particles || []).slice(0, count)
  return particleList.map((p) => ({
    id: `partikel_${p.id}`,
    type: 'partikel',
    front: p.consonantal || cleanArabicText(p.arabic),
    back: `Bedeutung: ${p.german}\nFunktion: ${p.function}`,
    interval: 1,
    ease: 2.5,
    nextReview: null,
    history: [],
  }))
}

describe('generateParticleCards', () => {
  it('generates up to 20 cards by default', () => {
    const cards = generateParticleCards()
    expect(cards.length).toBeLessThanOrEqual(20)
    expect(cards.length).toBeGreaterThan(0)
  })

  it('respects count parameter', () => {
    const cards = generateParticleCards(5)
    expect(cards.length).toBe(5)
  })

  it('all cards have type "partikel"', () => {
    const cards = generateParticleCards()
    cards.forEach(c => expect(c.type).toBe('partikel'))
  })

  it('all cards have unique IDs', () => {
    const cards = generateParticleCards()
    const ids = new Set(cards.map(c => c.id))
    expect(ids.size).toBe(cards.length)
  })

  it('card front is Arabic text', () => {
    const cards = generateParticleCards(3)
    cards.forEach(c => {
      expect(c.front).toBeTruthy()
      expect(typeof c.front).toBe('string')
    })
  })

  it('card back contains meaning', () => {
    const cards = generateParticleCards(3)
    cards.forEach(c => {
      expect(c.back).toContain('Bedeutung:')
    })
  })
})

// ═══════════════════════════════════════════════════════
// Morphology Card Generation
// ═══════════════════════════════════════════════════════

function generateMorphologyCards() {
  const forms = morphologyTables?.verbForms || []
  const cards = []
  forms.forEach((vf) => {
    cards.push({
      id: `morphologie_form_${vf.form}`,
      type: 'morphologie',
      front: `Verbform ${vf.form}: ${vf.pattern?.arabic || ''}`,
      back: `Muster: ${vf.pattern?.transliteration || ''}\nBedeutungsverschiebung: ${vf.meaningShiftGerman || vf.meaningShift}`,
      interval: 1,
      ease: 2.5,
      nextReview: null,
      history: [],
    })
    if (vf.perfect?.['3ms']) {
      cards.push({
        id: `morphologie_perf3ms_${vf.form}`,
        type: 'morphologie',
        front: `Form ${vf.form} - Perfekt 3. Person m. Sg.?`,
        back: vf.perfect['3ms'],
        interval: 1,
        ease: 2.5,
        nextReview: null,
        history: [],
      })
    }
    if (vf.imperfect?.['3ms']) {
      cards.push({
        id: `morphologie_imperf3ms_${vf.form}`,
        type: 'morphologie',
        front: `Form ${vf.form} - Imperfekt 3. Person m. Sg.?`,
        back: vf.imperfect['3ms'],
        interval: 1,
        ease: 2.5,
        nextReview: null,
        history: [],
      })
    }
  })
  return cards
}

describe('generateMorphologyCards', () => {
  const cards = generateMorphologyCards()

  it('generates cards for all 10 verb forms', () => {
    const formCards = cards.filter(c => c.id.startsWith('morphologie_form_'))
    expect(formCards.length).toBe(10)
  })

  it('generates conjugation cards (perfect + imperfect)', () => {
    const conjCards = cards.filter(c => c.id.includes('perf3ms') || c.id.includes('imperf3ms'))
    expect(conjCards.length).toBeGreaterThan(0)
  })

  it('all cards have type "morphologie"', () => {
    cards.forEach(c => expect(c.type).toBe('morphologie'))
  })

  it('all cards have unique IDs', () => {
    const ids = new Set(cards.map(c => c.id))
    expect(ids.size).toBe(cards.length)
  })

  it('form cards contain Arabic pattern', () => {
    const formCards = cards.filter(c => c.id.startsWith('morphologie_form_'))
    formCards.forEach(c => {
      expect(c.front).toContain('Verbform')
    })
  })
})

// ═══════════════════════════════════════════════════════
// Leech Detection
// ═══════════════════════════════════════════════════════

function isLeech(card) {
  if (!card.history || card.history.length < 5) return false
  const recentFails = card.history.slice(-8).filter(h => h.rating === 0).length
  return recentFails >= 5
}

describe('isLeech', () => {
  it('returns false for card with no history', () => {
    expect(isLeech({ history: [] })).toBe(false)
  })

  it('returns false for card with < 5 history items', () => {
    expect(isLeech({ history: [{ rating: 0 }, { rating: 0 }, { rating: 0 }, { rating: 0 }] })).toBe(false)
  })

  it('returns true for card with 5+ fails in last 8', () => {
    const history = Array(8).fill(null).map(() => ({ rating: 0 }))
    expect(isLeech({ history })).toBe(true)
  })

  it('returns false for card with 4 fails in last 8', () => {
    const history = [
      { rating: 0 }, { rating: 0 }, { rating: 0 }, { rating: 0 },
      { rating: 2 }, { rating: 2 }, { rating: 2 }, { rating: 2 },
    ]
    expect(isLeech({ history })).toBe(false)
  })

  it('returns true for card with 5 fails in last 8 mixed', () => {
    const history = [
      { rating: 2 }, { rating: 0 }, { rating: 0 }, { rating: 0 },
      { rating: 0 }, { rating: 0 }, { rating: 2 }, { rating: 2 },
    ]
    expect(isLeech({ history })).toBe(true)
  })

  it('only considers last 8 reviews', () => {
    // 5 fails in first 5, but last 8 have only 3 fails
    const history = [
      { rating: 0 }, { rating: 0 }, { rating: 0 }, { rating: 0 }, { rating: 0 },
      { rating: 2 }, { rating: 2 }, { rating: 2 }, { rating: 2 }, { rating: 2 },
      { rating: 0 }, { rating: 0 }, { rating: 0 },
    ]
    expect(isLeech({ history })).toBe(false) // last 8: 3 fails
  })

  it('handles null history', () => {
    expect(isLeech({ history: null })).toBe(false)
  })

  it('handles missing history', () => {
    expect(isLeech({})).toBe(false)
  })
})
