/**
 * Tests for Module4.jsx helper functions (Root Notebook).
 * Functions are not exported, so we replicate the pure logic here.
 */
import { describe, it, expect } from 'vitest'
import { cleanArabicText, transliterateToLatin } from '../../utils/arabic.js'

// ═══════════════════════════════════════════════════════
// classifyWeakRoot — replicated from Module4.jsx
// ═══════════════════════════════════════════════════════
function classifyWeakRoot(rootConsonants) {
  const chars = rootConsonants.replace(/-/g, '').replace(/[\u064B-\u0652]/g, '')
  if (chars.length < 2) return null
  const labels = []
  if (chars.length >= 4) labels.push('Quadriliteral')
  const hasHamza = /[\u0621\u0623\u0625\u0624\u0626]/.test(chars)
  if (chars.length >= 3) {
    if (chars[0] === '\u0648' || chars[0] === '\u064A') labels.push('Assimiliert')
    if (chars.length >= 3 && (chars[1] === '\u0648' || chars[1] === '\u064A')) labels.push('Hohl')
    if (chars[chars.length - 1] === '\u0648' || chars[chars.length - 1] === '\u064A' || chars[chars.length - 1] === '\u0649') labels.push('Defektiv')
    if (chars.length >= 3 && chars[chars.length - 1] === chars[chars.length - 2]) labels.push('Verdoppelt')
  }
  if (hasHamza) labels.push('Hamza')
  return labels.length > 0 ? labels : null
}

describe('classifyWeakRoot', () => {
  it('sound root (3 consonants, no weak) returns null', () => {
    expect(classifyWeakRoot('\u0643\u062A\u0628')).toBeNull() // كتب
  })

  it('assimilated root (starts with waw)', () => {
    const result = classifyWeakRoot('\u0648\u0639\u062F') // وعد
    expect(result).toContain('Assimiliert')
  })

  it('assimilated root (starts with ya)', () => {
    const result = classifyWeakRoot('\u064A\u0633\u0631') // يسر
    expect(result).toContain('Assimiliert')
  })

  it('hollow root (middle waw)', () => {
    const result = classifyWeakRoot('\u0642\u0648\u0644') // قول
    expect(result).toContain('Hohl')
  })

  it('hollow root (middle ya)', () => {
    const result = classifyWeakRoot('\u0633\u064A\u0631') // سير
    expect(result).toContain('Hohl')
  })

  it('defective root (ends with waw)', () => {
    const result = classifyWeakRoot('\u062F\u0639\u0648') // دعو
    expect(result).toContain('Defektiv')
  })

  it('defective root (ends with ya)', () => {
    const result = classifyWeakRoot('\u0647\u062F\u064A') // هدي
    expect(result).toContain('Defektiv')
  })

  it('defective root (ends with alif maqsura)', () => {
    const result = classifyWeakRoot('\u0647\u062F\u0649') // هدى
    expect(result).toContain('Defektiv')
  })

  it('doubly weak (assimilated + defective)', () => {
    const result = classifyWeakRoot('\u0648\u0642\u064A') // وقي
    expect(result).toContain('Assimiliert')
    expect(result).toContain('Defektiv')
  })

  it('hamza root', () => {
    const result = classifyWeakRoot('\u0633\u0623\u0644') // سأل
    expect(result).toContain('Hamza')
  })

  it('geminated/doubled root', () => {
    const result = classifyWeakRoot('\u0645\u062F\u062F') // مدد
    expect(result).toContain('Verdoppelt')
  })

  it('quadriliteral root', () => {
    const result = classifyWeakRoot('\u0632\u0644\u0632\u0644') // زلزل
    expect(result).toContain('Quadriliteral')
  })

  it('short input (1 char) returns null', () => {
    expect(classifyWeakRoot('\u0643')).toBeNull()
  })

  it('empty string returns null', () => {
    expect(classifyWeakRoot('')).toBeNull()
  })

  it('handles dash-separated input', () => {
    const result = classifyWeakRoot('\u0648-\u0639-\u062F') // و-ع-د
    expect(result).toContain('Assimiliert')
  })

  it('strips vowel marks before classification', () => {
    const result = classifyWeakRoot('\u0648\u064E\u0639\u064E\u062F\u064E') // وَعَدَ with fatha
    expect(result).toContain('Assimiliert')
  })
})

// ═══════════════════════════════════════════════════════
// buildLanesUrl — replicated from Module4.jsx
// ═══════════════════════════════════════════════════════
function buildLanesUrl(rootConsonants) {
  const transliterated = transliterateToLatin(rootConsonants).replace(/-/g, '')
  return `https://ejtaal.net/aa/#ll=${encodeURIComponent(transliterated)}`
}

describe('buildLanesUrl', () => {
  it('builds URL for ktb root', () => {
    const url = buildLanesUrl('\u0643\u062A\u0628') // كتب
    expect(url).toContain('ejtaal.net/aa/#ll=')
    expect(url).toContain('ktb')
  })

  it('starts with correct base URL', () => {
    const url = buildLanesUrl('\u0639\u0644\u0645') // علم
    expect(url.startsWith('https://ejtaal.net/aa/#ll=')).toBe(true)
  })

  it('handles dash-separated root', () => {
    const url = buildLanesUrl('\u0643-\u062A-\u0628') // ك-ت-ب
    expect(url).toContain('ktb')
  })
})

// ═══════════════════════════════════════════════════════
// buildCorpusUrl — replicated from Module4.jsx
// ═══════════════════════════════════════════════════════
function buildCorpusUrl(rootConsonants) {
  const transliterated = transliterateToLatin(rootConsonants).replace(/-/g, '')
  return `https://corpus.quran.com/qurandictionary.jsp?q=${encodeURIComponent(transliterated)}`
}

describe('buildCorpusUrl', () => {
  it('builds correct corpus URL', () => {
    const url = buildCorpusUrl('\u0643\u062A\u0628')
    expect(url).toContain('corpus.quran.com/qurandictionary.jsp?q=')
    expect(url).toContain('ktb')
  })

  it('starts with https', () => {
    const url = buildCorpusUrl('\u0639\u0644\u0645')
    expect(url.startsWith('https://')).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════
// groupWordsByRoot — replicated from Module4.jsx
// ═══════════════════════════════════════════════════════
function groupWordsByRoot(analyzedWords) {
  const rootMap = {}
  for (const [wordKey, analysis] of Object.entries(analyzedWords)) {
    const root = analysis.userRoot || analysis.autoAnalysis?.formatted || ''
    if (!root) continue
    const rootClean = cleanArabicText(root.replace(/-/g, ''))
    if (!rootClean || rootClean.length < 2) continue
    if (!rootMap[rootClean]) {
      rootMap[rootClean] = { derivatives: [], verses: [] }
    }
    const word = analysis.word || ''
    if (word && !rootMap[rootClean].derivatives.some(d => d.word === word)) {
      rootMap[rootClean].derivatives.push({
        word,
        wordKey,
        surah: analysis.surah,
        verse: analysis.verse,
      })
    }
    const verseRef = `${analysis.surah}:${analysis.verse}`
    if (!rootMap[rootClean].verses.some(v => v.ref === verseRef)) {
      rootMap[rootClean].verses.push({
        ref: verseRef,
        surah: analysis.surah,
        verse: analysis.verse,
        analyzed: true,
      })
    }
  }
  return rootMap
}

describe('groupWordsByRoot', () => {
  it('returns empty object for empty input', () => {
    expect(groupWordsByRoot({})).toEqual({})
  })

  it('groups words by their root', () => {
    const words = {
      '2:1:1': { word: '\u0643\u062A\u0628', userRoot: '\u0643-\u062A-\u0628', surah: 2, verse: 1 },
      '2:1:2': { word: '\u0643\u0627\u062A\u0628', userRoot: '\u0643-\u062A-\u0628', surah: 2, verse: 1 },
    }
    const result = groupWordsByRoot(words)
    const rootKey = '\u0643\u062A\u0628'
    expect(result[rootKey]).toBeDefined()
    expect(result[rootKey].derivatives.length).toBe(2)
  })

  it('deduplicates verse references', () => {
    const words = {
      '2:1:1': { word: '\u0643\u062A\u0628', userRoot: '\u0643-\u062A-\u0628', surah: 2, verse: 1 },
      '2:1:2': { word: '\u0643\u0627\u062A\u0628', userRoot: '\u0643-\u062A-\u0628', surah: 2, verse: 1 },
    }
    const result = groupWordsByRoot(words)
    const rootKey = '\u0643\u062A\u0628'
    expect(result[rootKey].verses.length).toBe(1) // same verse, deduplicated
  })

  it('skips words with no root', () => {
    const words = {
      '1:1:1': { word: '\u0641\u064A', surah: 1, verse: 1 },
    }
    const result = groupWordsByRoot(words)
    expect(Object.keys(result).length).toBe(0)
  })

  it('skips roots shorter than 2 consonants', () => {
    const words = {
      '1:1:1': { word: '\u0648', userRoot: '\u0648', surah: 1, verse: 1 },
    }
    const result = groupWordsByRoot(words)
    expect(Object.keys(result).length).toBe(0)
  })

  it('handles autoAnalysis.formatted fallback', () => {
    const words = {
      '2:1:1': {
        word: '\u0639\u0644\u0645',
        autoAnalysis: { formatted: '\u0639-\u0644-\u0645' },
        surah: 2, verse: 1,
      },
    }
    const result = groupWordsByRoot(words)
    const rootKey = '\u0639\u0644\u0645'
    expect(result[rootKey]).toBeDefined()
  })

  it('separates different roots', () => {
    const words = {
      '2:1:1': { word: '\u0643\u062A\u0628', userRoot: '\u0643-\u062A-\u0628', surah: 2, verse: 1 },
      '2:1:2': { word: '\u0639\u0644\u0645', userRoot: '\u0639-\u0644-\u0645', surah: 2, verse: 1 },
    }
    const result = groupWordsByRoot(words)
    expect(Object.keys(result).length).toBe(2)
  })

  it('deduplicates derivative words', () => {
    const words = {
      '2:1:1': { word: '\u0643\u062A\u0628', userRoot: '\u0643-\u062A-\u0628', surah: 2, verse: 1 },
      '3:5:2': { word: '\u0643\u062A\u0628', userRoot: '\u0643-\u062A-\u0628', surah: 3, verse: 5 },
    }
    const result = groupWordsByRoot(words)
    const rootKey = '\u0643\u062A\u0628'
    expect(result[rootKey].derivatives.length).toBe(1) // same word, deduplicated
    expect(result[rootKey].verses.length).toBe(2) // different verses
  })
})
