/**
 * Tests for SM-2 spaced repetition algorithm from Module5.jsx.
 * Functions are not exported, so we replicate the pure logic here.
 */
import { describe, it, expect } from 'vitest'

// ═══════════════════════════════════════════════════════
// Replicated SM-2 functions from Module5.jsx
// ═══════════════════════════════════════════════════════

function getToday() {
  return new Date().toLocaleDateString('en-CA')
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-CA')
}

function computeNextReview(card, rating) {
  const now = getToday()
  let { interval, ease, history } = card
  const reviewCount = (history || []).length

  if (typeof interval !== 'number' || interval < 1) interval = 1
  if (typeof ease !== 'number') ease = 2.5

  let newInterval
  let newEase = ease

  if (reviewCount === 0) {
    newInterval = 1
  } else if (reviewCount === 1 && rating >= 2) {
    newInterval = 3
  } else {
    switch (rating) {
      case 0:
        newInterval = 1
        newEase = Math.max(1.3, ease - 0.2)
        break
      case 1:
        newInterval = Math.max(1, Math.round(interval * 1.2))
        newEase = Math.max(1.3, ease - 0.15)
        break
      case 2:
        newInterval = Math.round(interval * ease)
        break
      case 3:
        newInterval = Math.round(interval * ease * 1.3)
        newEase = Math.min(3.0, ease + 0.15)
        break
      default:
        newInterval = 1
    }
  }

  if (newInterval < 1) newInterval = 1

  const nextReview = addDays(now, newInterval) + 'T00:00:00.000Z'

  return {
    interval: newInterval,
    ease: newEase,
    nextReview,
    history: [
      ...(history || []),
      { date: new Date().toISOString(), rating, interval: newInterval },
    ],
  }
}

function isLeech(card) {
  if (!card.history || card.history.length < 5) return false
  const recentFails = card.history.slice(-8).filter(h => h.rating === 0).length
  return recentFails >= 5
}

// ═══════════════════════════════════════════════════════
// getToday
// ═══════════════════════════════════════════════════════
describe('getToday', () => {
  it('returns YYYY-MM-DD format', () => {
    expect(getToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('returns today in local time', () => {
    const today = getToday()
    const parts = today.split('-')
    expect(parseInt(parts[0])).toBeGreaterThanOrEqual(2024)
    expect(parseInt(parts[1])).toBeGreaterThanOrEqual(1)
    expect(parseInt(parts[1])).toBeLessThanOrEqual(12)
    expect(parseInt(parts[2])).toBeGreaterThanOrEqual(1)
    expect(parseInt(parts[2])).toBeLessThanOrEqual(31)
  })
})

// ═══════════════════════════════════════════════════════
// addDays
// ═══════════════════════════════════════════════════════
describe('addDays', () => {
  it('adds 1 day', () => {
    expect(addDays('2026-03-23', 1)).toBe('2026-03-24')
  })

  it('adds 3 days', () => {
    expect(addDays('2026-03-23', 3)).toBe('2026-03-26')
  })

  it('handles month boundary', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
  })

  it('handles year boundary', () => {
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01')
  })

  it('handles Feb 28 non-leap year', () => {
    expect(addDays('2025-02-28', 1)).toBe('2025-03-01')
  })

  it('handles Feb 28 leap year', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29')
  })

  it('handles Feb 29 leap year', () => {
    expect(addDays('2024-02-29', 1)).toBe('2024-03-01')
  })

  it('adds 0 days (identity)', () => {
    expect(addDays('2026-03-23', 0)).toBe('2026-03-23')
  })

  it('adds large number of days', () => {
    expect(addDays('2026-01-01', 365)).toBe('2027-01-01')
  })

  it('returns YYYY-MM-DD format', () => {
    expect(addDays('2026-03-23', 7)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

// ═══════════════════════════════════════════════════════
// computeNextReview — First review (reviewCount=0)
// ═══════════════════════════════════════════════════════
describe('computeNextReview — first review', () => {
  const newCard = { interval: 1, ease: 2.5, history: [] }

  it('always returns interval=1 for rating 0', () => {
    const result = computeNextReview(newCard, 0)
    expect(result.interval).toBe(1)
  })

  it('always returns interval=1 for rating 1', () => {
    const result = computeNextReview(newCard, 1)
    expect(result.interval).toBe(1)
  })

  it('always returns interval=1 for rating 2', () => {
    const result = computeNextReview(newCard, 2)
    expect(result.interval).toBe(1)
  })

  it('always returns interval=1 for rating 3', () => {
    const result = computeNextReview(newCard, 3)
    expect(result.interval).toBe(1)
  })

  it('preserves ease on first review', () => {
    const result = computeNextReview(newCard, 2)
    expect(result.ease).toBe(2.5)
  })

  it('adds entry to history', () => {
    const result = computeNextReview(newCard, 2)
    expect(result.history.length).toBe(1)
    expect(result.history[0].rating).toBe(2)
    expect(result.history[0].interval).toBe(1)
  })

  it('returns a valid nextReview date', () => {
    const result = computeNextReview(newCard, 2)
    expect(result.nextReview).toMatch(/^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/)
  })
})

// ═══════════════════════════════════════════════════════
// computeNextReview — Second review (reviewCount=1)
// ═══════════════════════════════════════════════════════
describe('computeNextReview — second review', () => {
  const cardAfterFirst = { interval: 1, ease: 2.5, history: [{ rating: 2, interval: 1 }] }

  it('rating >= 2 gives interval=3', () => {
    expect(computeNextReview(cardAfterFirst, 2).interval).toBe(3)
    expect(computeNextReview(cardAfterFirst, 3).interval).toBe(3)
  })

  it('rating < 2 goes to switch (rating=0 → interval=1)', () => {
    const result = computeNextReview(cardAfterFirst, 0)
    expect(result.interval).toBe(1)
  })

  it('rating=1 on second review goes to switch', () => {
    const result = computeNextReview(cardAfterFirst, 1)
    expect(result.interval).toBe(Math.max(1, Math.round(1 * 1.2)))
  })
})

// ═══════════════════════════════════════════════════════
// computeNextReview — Rating 0 (Nochmal)
// ═══════════════════════════════════════════════════════
describe('computeNextReview — Rating 0 (Nochmal)', () => {
  const card = { interval: 10, ease: 2.5, history: [{ rating: 2 }, { rating: 2 }] }

  it('resets interval to 1', () => {
    expect(computeNextReview(card, 0).interval).toBe(1)
  })

  it('decreases ease by 0.2', () => {
    expect(computeNextReview(card, 0).ease).toBe(2.3)
  })

  it('ease does not go below 1.3', () => {
    const hardCard = { interval: 10, ease: 1.4, history: [{ rating: 0 }, { rating: 0 }] }
    expect(computeNextReview(hardCard, 0).ease).toBe(1.3)
  })

  it('ease floors at exactly 1.3', () => {
    const card13 = { interval: 5, ease: 1.3, history: [{ rating: 0 }, { rating: 0 }] }
    expect(computeNextReview(card13, 0).ease).toBe(1.3)
  })
})

// ═══════════════════════════════════════════════════════
// computeNextReview — Rating 1 (Schwer)
// ═══════════════════════════════════════════════════════
describe('computeNextReview — Rating 1 (Schwer)', () => {
  const card = { interval: 10, ease: 2.5, history: [{ rating: 2 }, { rating: 2 }] }

  it('multiplies interval by 1.2', () => {
    expect(computeNextReview(card, 1).interval).toBe(Math.max(1, Math.round(10 * 1.2)))
  })

  it('decreases ease by 0.15', () => {
    expect(computeNextReview(card, 1).ease).toBe(2.35)
  })

  it('interval floors at 1', () => {
    const tinyCard = { interval: 0, ease: 2.5, history: [{ rating: 2 }, { rating: 2 }] }
    expect(computeNextReview(tinyCard, 1).interval).toBeGreaterThanOrEqual(1)
  })

  it('ease floors at 1.3', () => {
    const hardCard = { interval: 5, ease: 1.4, history: [{ rating: 1 }, { rating: 1 }] }
    expect(computeNextReview(hardCard, 1).ease).toBeCloseTo(1.3, 1)
  })
})

// ═══════════════════════════════════════════════════════
// computeNextReview — Rating 2 (Gut)
// ═══════════════════════════════════════════════════════
describe('computeNextReview — Rating 2 (Gut)', () => {
  const card = { interval: 10, ease: 2.5, history: [{ rating: 2 }, { rating: 2 }] }

  it('multiplies interval by ease', () => {
    expect(computeNextReview(card, 2).interval).toBe(Math.round(10 * 2.5))
  })

  it('ease remains unchanged', () => {
    expect(computeNextReview(card, 2).ease).toBe(2.5)
  })
})

// ═══════════════════════════════════════════════════════
// computeNextReview — Rating 3 (Leicht)
// ═══════════════════════════════════════════════════════
describe('computeNextReview — Rating 3 (Leicht)', () => {
  const card = { interval: 10, ease: 2.5, history: [{ rating: 2 }, { rating: 2 }] }

  it('multiplies interval by ease * 1.3', () => {
    expect(computeNextReview(card, 3).interval).toBe(Math.round(10 * 2.5 * 1.3))
  })

  it('increases ease by 0.15', () => {
    expect(computeNextReview(card, 3).ease).toBe(2.65)
  })

  it('ease caps at 3.0', () => {
    const easyCard = { interval: 10, ease: 2.95, history: [{ rating: 3 }, { rating: 3 }] }
    expect(computeNextReview(easyCard, 3).ease).toBe(3.0)
  })

  it('ease does not exceed 3.0', () => {
    const maxCard = { interval: 10, ease: 3.0, history: [{ rating: 3 }, { rating: 3 }] }
    expect(computeNextReview(maxCard, 3).ease).toBe(3.0)
  })
})

// ═══════════════════════════════════════════════════════
// Edge cases
// ═══════════════════════════════════════════════════════
describe('computeNextReview — Edge cases', () => {
  it('handles missing interval (defaults to 1)', () => {
    const card = { ease: 2.5, history: [{ rating: 2 }, { rating: 2 }] }
    const result = computeNextReview(card, 2)
    expect(result.interval).toBeGreaterThanOrEqual(1)
  })

  it('handles missing ease (defaults to 2.5)', () => {
    const card = { interval: 5, history: [{ rating: 2 }, { rating: 2 }] }
    const result = computeNextReview(card, 2)
    expect(result.interval).toBe(Math.round(5 * 2.5))
  })

  it('handles null history (treated as empty)', () => {
    const card = { interval: 1, ease: 2.5, history: null }
    const result = computeNextReview(card, 2)
    expect(result.interval).toBe(1) // first review
    expect(result.history.length).toBe(1)
  })

  it('handles negative interval (corrected to 1)', () => {
    const card = { interval: -5, ease: 2.5, history: [{ rating: 2 }, { rating: 2 }] }
    const result = computeNextReview(card, 2)
    expect(result.interval).toBeGreaterThanOrEqual(1)
  })

  it('handles string interval (corrected to 1)', () => {
    const card = { interval: 'abc', ease: 2.5, history: [{ rating: 2 }, { rating: 2 }] }
    const result = computeNextReview(card, 2)
    expect(result.interval).toBeGreaterThanOrEqual(1)
  })

  it('handles unknown rating (default case → interval=1)', () => {
    const card = { interval: 10, ease: 2.5, history: [{ rating: 2 }, { rating: 2 }] }
    const result = computeNextReview(card, 99)
    expect(result.interval).toBe(1)
  })

  it('history is immutable (original not modified)', () => {
    const original = [{ rating: 2 }, { rating: 2 }]
    const card = { interval: 5, ease: 2.5, history: original }
    computeNextReview(card, 2)
    expect(original.length).toBe(2)
  })
})

// ═══════════════════════════════════════════════════════
// Repeated reviews — simulate card lifecycle
// ═══════════════════════════════════════════════════════
describe('computeNextReview — repeated reviews', () => {
  it('10x rating=2 (Gut) grows intervals', () => {
    let card = { interval: 1, ease: 2.5, history: [] }
    const intervals = []
    for (let i = 0; i < 10; i++) {
      card = { ...card, ...computeNextReview(card, 2) }
      intervals.push(card.interval)
    }
    // First review: 1, second: 3, then grows
    expect(intervals[0]).toBe(1)
    expect(intervals[1]).toBe(3)
    // Each subsequent should be >= previous
    for (let i = 2; i < intervals.length; i++) {
      expect(intervals[i]).toBeGreaterThanOrEqual(intervals[i - 1])
    }
  })

  it('alternating fail/pass keeps intervals low', () => {
    let card = { interval: 1, ease: 2.5, history: [] }
    for (let i = 0; i < 6; i++) {
      card = { ...card, ...computeNextReview(card, i % 2 === 0 ? 0 : 2) }
    }
    // Intervals should stay low due to resets
    expect(card.interval).toBeLessThan(10)
  })

  it('all rating=3 (Leicht) grows fast with ease increase', () => {
    let card = { interval: 1, ease: 2.5, history: [] }
    for (let i = 0; i < 8; i++) {
      card = { ...card, ...computeNextReview(card, 3) }
    }
    expect(card.ease).toBeGreaterThan(2.5)
    expect(card.ease).toBeLessThanOrEqual(3.0)
    expect(card.interval).toBeGreaterThan(50)
  })
})

// ═══════════════════════════════════════════════════════
// Ease boundary stress tests
// ═══════════════════════════════════════════════════════
describe('Ease boundaries', () => {
  it('20x rating=0 never drops ease below 1.3', () => {
    let card = { interval: 1, ease: 2.5, history: [] }
    for (let i = 0; i < 20; i++) {
      card = { ...card, ...computeNextReview(card, 0) }
    }
    expect(card.ease).toBe(1.3)
  })

  it('20x rating=3 never raises ease above 3.0', () => {
    let card = { interval: 1, ease: 2.5, history: [] }
    for (let i = 0; i < 20; i++) {
      card = { ...card, ...computeNextReview(card, 3) }
    }
    expect(card.ease).toBe(3.0)
  })
})

// ═══════════════════════════════════════════════════════
// isLeech
// ═══════════════════════════════════════════════════════
describe('isLeech', () => {
  it('false for empty history', () => {
    expect(isLeech({ history: [] })).toBe(false)
  })

  it('false for null history', () => {
    expect(isLeech({ history: null })).toBe(false)
  })

  it('false for missing history', () => {
    expect(isLeech({})).toBe(false)
  })

  it('false for < 5 items', () => {
    expect(isLeech({ history: [{ rating: 0 }, { rating: 0 }, { rating: 0 }, { rating: 0 }] })).toBe(false)
  })

  it('true for 5+ fails in last 8', () => {
    const history = Array(8).fill(null).map(() => ({ rating: 0 }))
    expect(isLeech({ history })).toBe(true)
  })

  it('false for exactly 4 fails in last 8', () => {
    const history = [
      { rating: 0 }, { rating: 0 }, { rating: 0 }, { rating: 0 },
      { rating: 2 }, { rating: 2 }, { rating: 2 }, { rating: 2 },
    ]
    expect(isLeech({ history })).toBe(false)
  })

  it('true for exactly 5 fails in last 8', () => {
    const history = [
      { rating: 0 }, { rating: 0 }, { rating: 0 }, { rating: 0 },
      { rating: 0 }, { rating: 2 }, { rating: 2 }, { rating: 2 },
    ]
    expect(isLeech({ history })).toBe(true)
  })

  it('only considers last 8 reviews', () => {
    // 10 fails early, but last 8 have only 3
    const history = [
      ...Array(10).fill({ rating: 0 }),
      { rating: 2 }, { rating: 2 }, { rating: 2 }, { rating: 2 }, { rating: 2 },
      { rating: 0 }, { rating: 0 }, { rating: 0 },
    ]
    expect(isLeech({ history })).toBe(false)
  })

  it('rating=1 is not counted as fail', () => {
    const history = [
      { rating: 1 }, { rating: 1 }, { rating: 1 }, { rating: 1 },
      { rating: 1 }, { rating: 1 }, { rating: 1 }, { rating: 1 },
    ]
    expect(isLeech({ history })).toBe(false)
  })
})
