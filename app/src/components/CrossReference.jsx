import { useState, useMemo, useCallback, useEffect } from 'react'
import { cleanArabicText } from '../utils/arabic.js'
import quranData from '../data/quran-simple-clean.json'
import { loadMorphologyDB } from '../utils/lazyData.js'

/**
 * CrossReference — Concordance / Cross-Reference tool
 * Shows all occurrences of a word form or root across the entire Quran.
 * Supports consonantal form search, root search, and phrase search.
 */

// Lazy-built indexes (populated once on first load)
let _indexCache = null
async function ensureMorphIndexes() {
  if (_indexCache) return _indexCache
  try {
    const morphologyDB = await loadMorphologyDB()
    const morphIdx = new Map()
    const rootIdx = new Map()
    const consIdx = new Map()
    if (morphologyDB?.words) {
      for (const w of morphologyDB.words) {
        if (w.l) morphIdx.set(w.l, w)
        if (w.r) {
          const r = w.r.trim()
          if (!rootIdx.has(r)) rootIdx.set(r, [])
          rootIdx.get(r).push(w)
        }
        if (w.v) {
          const c = cleanArabicText(w.v)
          if (c && c.length > 1) {
            if (!consIdx.has(c)) consIdx.set(c, [])
            consIdx.get(c).push(w)
          }
        }
      }
    }
    _indexCache = { MORPHOLOGY_INDEX: morphIdx, ROOT_INDEX: rootIdx, CONSONANTAL_INDEX: consIdx }
  } catch {
    _indexCache = { MORPHOLOGY_INDEX: new Map(), ROOT_INDEX: new Map(), CONSONANTAL_INDEX: new Map() }
  }
  return _indexCache
}

// Pre-build a flat list of all verses for phrase search
const ALL_VERSES = []
if (quranData?.surahs) {
  for (const s of quranData.surahs) {
    for (const v of s.verses) {
      ALL_VERSES.push({ surah: s.number, verse: v.number, text: v.text, textClean: cleanArabicText(v.text) })
    }
  }
}

/**
 * Convert a wildcard pattern (using *) to a RegExp.
 * The * matches any sequence of Arabic characters within a word boundary.
 */
function wildcardToRegex(pattern) {
  // Escape regex special chars except *
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
  // Replace * with Arabic-char wildcard
  const regexStr = escaped.replace(/\*/g, '[\\u0621-\\u064A\\u0671-\\u06D3]*')
  return new RegExp('^' + regexStr + '$')
}

export default function CrossReference({ word, root, onNavigate, onClose }) {
  const [mode, setMode] = useState(root ? 'root' : 'form')
  const [maxResults, setMaxResults] = useState(50)
  const [surahFilter, setSurahFilter] = useState(0) // 0 = all surahs
  const [phraseInput, setPhraseInput] = useState('')
  const [indexes, setIndexes] = useState(null)

  useEffect(() => {
    let cancelled = false
    ensureMorphIndexes().then(idx => { if (!cancelled) setIndexes(idx) })
    return () => { cancelled = true }
  }, [])

  const consonantal = useMemo(() => word ? cleanArabicText(word) : '', [word])

  // Detect if consonantal input contains wildcard
  const hasWildcard = useMemo(() => consonantal.includes('*'), [consonantal])

  const formResults = useMemo(() => {
    if (mode !== 'form' || !indexes) return []
    if (!consonantal) return []

    if (hasWildcard) {
      // Wildcard search across all consonantal forms
      try {
        const regex = wildcardToRegex(consonantal)
        const matches = []
        for (const [form, entries] of indexes.CONSONANTAL_INDEX.entries()) {
          if (regex.test(form)) {
            matches.push(...entries)
          }
        }
        return matches
      } catch {
        return []
      }
    }

    return indexes.CONSONANTAL_INDEX.get(consonantal) || []
  }, [consonantal, mode, hasWildcard, indexes])

  const rootResults = useMemo(() => {
    if (!root || mode !== 'root' || !indexes) return []
    const normalized = root.trim()
    return indexes.ROOT_INDEX.get(normalized) || []
  }, [root, mode, indexes])

  // Phrase search
  const phraseResults = useMemo(() => {
    if (mode !== 'phrase') return []
    const query = phraseInput.trim()
    if (!query || query.length < 2) return []

    const queryClean = cleanArabicText(query)
    if (!queryClean) return []

    const matches = []
    for (const v of ALL_VERSES) {
      if (v.textClean.includes(queryClean)) {
        matches.push(v)
      }
    }
    return matches
  }, [phraseInput, mode])

  // Select the right result set based on mode
  const rawResults = mode === 'root' ? rootResults : mode === 'phrase' ? phraseResults : formResults

  // Apply surah filter
  const results = useMemo(() => {
    if (surahFilter === 0) return rawResults
    return rawResults.filter(r => {
      if (r.l) {
        const s = parseInt(r.l.split(':')[0], 10)
        return s === surahFilter
      }
      if (r.surah) return r.surah === surahFilter
      return true
    })
  }, [rawResults, surahFilter])

  const displayed = results.slice(0, maxResults)

  // Group by surah for summary
  const surahSummary = useMemo(() => {
    const summary = {}
    for (const r of results) {
      let surah
      if (r.l) {
        surah = parseInt(r.l.split(':')[0], 10)
      } else if (r.surah) {
        surah = r.surah
      }
      if (surah) summary[surah] = (summary[surah] || 0) + 1
    }
    return Object.entries(summary).sort((a, b) => a[0] - b[0]).map(([s, c]) => ({ surah: parseInt(s), count: c }))
  }, [results])

  const handleNavigate = useCallback((loc) => {
    // loc can be "surah:verse" or "surah:verse:word"
    const parts = loc.split(':')
    if (parts.length >= 2 && onNavigate) {
      onNavigate(parseInt(parts[0], 10), parseInt(parts[1], 10))
    }
  }, [onNavigate])

  // Highlight phrase in verse text
  const highlightPhrase = useCallback((text, query) => {
    if (!query) return text
    const queryClean = cleanArabicText(query)
    const textClean = cleanArabicText(text)

    // Find the position in the clean text, then map back to original
    const idx = textClean.indexOf(queryClean)
    if (idx === -1) return text

    // Map clean-text indices to original-text indices
    let cleanIdx = 0
    let origStart = -1
    let origEnd = -1
    for (let i = 0; i < text.length; i++) {
      const cleanChar = cleanArabicText(text[i])
      if (cleanChar.length > 0) {
        if (cleanIdx === idx) origStart = i
        if (cleanIdx === idx + queryClean.length - 1) {
          // Find the end including trailing diacritics
          origEnd = i + 1
          // Include any following diacritics
          while (origEnd < text.length && cleanArabicText(text[origEnd]).length === 0) origEnd++
          break
        }
        cleanIdx++
      }
    }

    if (origStart === -1 || origEnd === -1) return text

    return (
      <>
        {text.slice(0, origStart)}
        <mark style={{ background: 'var(--accent-teal-bg)', color: 'var(--accent-teal)', borderRadius: '2px', padding: '0 2px' }}>
          {text.slice(origStart, origEnd)}
        </mark>
        {text.slice(origEnd)}
      </>
    )
  }, [])

  // Build surah list for filter dropdown
  const surahOptions = useMemo(() => {
    if (!quranData?.surahs) return []
    return quranData.surahs.map(s => ({ number: s.number, verseCount: s.verses?.length || 0 }))
  }, [])

  const btnStyle = (active, color = 'teal') => ({
    padding: '6px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', cursor: 'pointer',
    background: active ? `var(--accent-${color}-bg)` : 'var(--bg-input)',
    color: active ? `var(--accent-${color})` : 'var(--text-secondary)',
    border: active ? `1px solid var(--accent-${color})` : '1px solid var(--border)',
    fontWeight: active ? 600 : 400,
  })

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
      maxHeight: '600px',
      overflow: 'auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-heading)' }}>
          Querverweis / Konkordanz
        </h3>
        {onClose && (
          <button onClick={onClose} style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px 10px', fontSize: '0.8rem',
          }}>Schließen</button>
        )}
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {word && (
          <button
            onClick={() => setMode('form')}
            style={btnStyle(mode === 'form', 'teal')}
          >
            Konsonanten: <span className="arabic" dir="rtl">{consonantal}</span> ({formResults.length})
          </button>
        )}
        {root && (
          <button
            onClick={() => setMode('root')}
            style={btnStyle(mode === 'root', 'gold')}
          >
            Wurzel: <span className="arabic" dir="rtl">{root.replace(/ /g, '-')}</span> ({rootResults.length})
          </button>
        )}
        <button
          onClick={() => setMode('phrase')}
          style={btnStyle(mode === 'phrase', 'teal')}
        >
          Phrase {mode === 'phrase' && phraseResults.length > 0 ? `(${phraseResults.length})` : ''}
        </button>
        {root && (
          <button
            onClick={() => {
              const r = root.replace(/ /g, '')
              window.open(`https://ejtaal.net/aa/#hw4=${encodeURIComponent(r)}`, '_blank', 'noopener')
            }}
            style={{
              padding: '6px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: 600,
              background: 'rgba(168,85,247,0.1)', border: '1px solid #a855f7', color: '#a855f7',
            }}
          >
            Lane's Lexikon
          </button>
        )}
      </div>

      {/* Phrase search input */}
      {mode === 'phrase' && (
        <div style={{ marginBottom: '12px' }}>
          <input
            type="text"
            dir="rtl"
            className="arabic"
            value={phraseInput}
            onChange={e => { setPhraseInput(e.target.value); setMaxResults(50) }}
            placeholder="Phrase eingeben, z.B. الذين امنوا"
            style={{
              width: '100%', padding: '8px 12px', fontSize: '1.1rem',
              background: 'var(--bg-input)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', color: 'var(--arabic-text)',
              fontFamily: 'var(--font-arabic)',
            }}
          />
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Sucht nach der exakten Wortfolge im gesamten Text (diakritikfrei).
          </div>
        </div>
      )}

      {/* Wildcard hint in form mode */}
      {mode === 'form' && hasWildcard && (
        <div style={{ fontSize: '0.75rem', color: 'var(--accent-teal)', marginBottom: '8px' }}>
          Platzhaltersuche aktiv: * steht für beliebige Zeichen
        </div>
      )}

      {/* Surah filter dropdown */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
        <select
          value={surahFilter}
          onChange={e => { setSurahFilter(parseInt(e.target.value)); setMaxResults(50) }}
          style={{
            padding: '5px 10px', fontSize: '0.8rem',
            background: 'var(--bg-input)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
          }}
        >
          <option value={0}>Alle Suren</option>
          {surahOptions.map(s => (
            <option key={s.number} value={s.number}>Sure {s.number} ({s.verseCount} Verse)</option>
          ))}
        </select>

        {/* Summary */}
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {results.length} Vorkommen{surahFilter > 0 ? ` in Sure ${surahFilter}` : ` in ${surahSummary.length} Suren`}
        </span>
      </div>

      {/* Surah distribution bar */}
      {surahSummary.length > 0 && surahFilter === 0 && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '3px', marginBottom: '16px',
          padding: '8px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)',
        }}>
          {surahSummary.map(({ surah, count }) => (
            <button
              key={surah}
              onClick={() => setSurahFilter(surah)}
              style={{
                padding: '2px 5px', borderRadius: '3px', fontSize: '0.65rem',
                background: count > 5 ? 'var(--accent-teal-bg)' : 'transparent',
                color: count > 5 ? 'var(--accent-teal)' : 'var(--text-muted)',
                border: 'none', cursor: 'pointer',
              }}
              title={`Sure ${surah}: ${count}x — klicken zum Filtern`}
            >
              {surah}:{count}
            </button>
          ))}
        </div>
      )}

      {/* Results list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {mode === 'phrase' ? (
          // Phrase results: show full verse text with highlight
          displayed.map((entry, i) => (
            <button
              key={i}
              onClick={() => handleNavigate(`${entry.surah}:${entry.verse}`)}
              style={{
                display: 'flex', flexDirection: 'column', gap: '4px',
                padding: '8px 10px', textAlign: 'right', width: '100%',
                background: 'var(--bg-input)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                color: 'var(--text-primary)',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-teal)', fontWeight: 600, textAlign: 'left' }}>
                {entry.surah}:{entry.verse}
              </span>
              <span className="arabic" dir="rtl" style={{ fontSize: '1.05rem', color: 'var(--arabic-text)', lineHeight: 1.8 }}>
                {highlightPhrase(entry.text, phraseInput)}
              </span>
            </button>
          ))
        ) : (
          // Form/Root results: show word entries
          displayed.map((entry, i) => (
            <button
              key={i}
              onClick={() => handleNavigate(entry.l)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '6px 10px', textAlign: 'left', width: '100%',
                background: 'var(--bg-input)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                fontSize: '0.85rem', color: 'var(--text-primary)',
              }}
            >
              <span style={{ minWidth: '60px', color: 'var(--accent-teal)', fontWeight: 600, fontSize: '0.75rem' }}>
                {entry.l}
              </span>
              <span className="arabic" dir="rtl" style={{ fontSize: '1.1rem', color: 'var(--arabic-text)' }}>
                {entry.v || ''}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: 'auto' }}>
                {entry.p || ''} {entry.m ? `(${entry.m.slice(0, 20)})` : ''}
              </span>
            </button>
          ))
        )}
      </div>

      {results.length > maxResults && (
        <button
          onClick={() => setMaxResults(m => m + 50)}
          style={{
            marginTop: '12px', padding: '8px 16px', width: '100%',
            background: 'var(--bg-input)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', cursor: 'pointer',
            color: 'var(--text-secondary)', fontSize: '0.85rem',
          }}
        >
          Weitere {Math.min(50, results.length - maxResults)} von {results.length} anzeigen
        </button>
      )}

      {results.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px 0', textAlign: 'center' }}>
          {mode === 'form' && 'Diese Wortform kommt nicht in der Morphologie-Datenbank vor.'}
          {mode === 'root' && 'Diese Wurzel wurde nicht gefunden.'}
          {mode === 'phrase' && (phraseInput.trim().length < 2
            ? 'Bitte eine Phrase mit mindestens 2 Zeichen eingeben.'
            : 'Diese Phrase wurde nicht gefunden.')}
        </div>
      )}
    </div>
  )
}
