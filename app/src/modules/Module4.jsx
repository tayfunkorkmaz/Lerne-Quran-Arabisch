import { useState, useEffect, useCallback, useMemo } from 'react'
import ArabicKeyboard from '../components/ArabicKeyboard.jsx'
import {
  formatRoot,
  transliterateToLatin,
  transliterateToArabic,
  cleanArabicText,
  containsArabic,
  getArabicAlphabet,
} from '../utils/arabic.js'
import {
  loadAllRoots,
  saveRoot,
  loadAllAnalyzedWords,
} from '../utils/storage.js'


import rootFrequency from '../data/root-frequency-complete.json'
import thematicFields from '../data/thematic-fields.json'
import diptoteData from '../data/diptote-data.json'
import collocationsData from '../data/collocations.json'




/**
 * Module 4: Wurzel-Notizbuch (Root Notebook)
 *
 * Automatically grows as the learner analyzes words in Module 3.
 * Each root entry shows: consonants, Lane's link, derivatives found,
 * verse occurrences, personal notes, and meaning summary.
 */

// ===== Constants =====

const TOTAL_QURAN_ROOTS = 1642 // Basiert auf root-frequency-complete.json (Quranic Arabic Corpus)

import rootMeaningsData from '../data/root-meanings.json'
const ROOT_MEANINGS_LOOKUP = new Map()
if (rootMeaningsData?.roots) {
  rootMeaningsData.roots.forEach(r => {
    const key = cleanArabicText(r.root)
    ROOT_MEANINGS_LOOKUP.set(key, { meaning: r.meaning, semanticField: r.semanticField, keyDerivatives: r.keyDerivatives })
  })
}

// Build frequency lookup from root-frequency-complete.json (all 1642 roots)
const ROOT_FREQ_LOOKUP = new Map()
if (rootFrequency?.roots) {
  rootFrequency.roots.forEach(r => {
    const key = cleanArabicText(r.rootArabic)
    const meaningEntry = ROOT_MEANINGS_LOOKUP.get(key)
    ROOT_FREQ_LOOKUP.set(key, { rank: r.rank, count: r.count, meaning: meaningEntry?.meaning || r.meaning || '', semanticField: meaningEntry?.semanticField || '', keyDerivatives: meaningEntry?.keyDerivatives || [] })
  })
}

// Build weak root classification from data and consonant analysis
function classifyWeakRoot(rootConsonants) {
  const chars = rootConsonants.replace(/-/g, '').replace(/[\u064B-\u0652]/g, '')
  if (chars.length < 2) return null
  const labels = []
  if (chars.length >= 4) labels.push('Quadriliteral')
  const hasHamza = /[ءأإؤئ]/.test(chars)
  if (chars.length >= 3) {
    if ((chars[0] === 'و' || chars[0] === 'ي')) labels.push('Assimiliert')
    if (chars.length >= 3 && (chars[1] === 'و' || chars[1] === 'ي')) labels.push('Hohl')
    if (chars[chars.length - 1] === 'و' || chars[chars.length - 1] === 'ي' || chars[chars.length - 1] === 'ى') labels.push('Defektiv')
    if (chars.length >= 3 && chars[chars.length - 1] === chars[chars.length - 2]) labels.push('Verdoppelt')
  }
  if (hasHamza) labels.push('Hamza')
  return labels.length > 0 ? labels : null
}

// Build POS distribution lookup
const POS_DIST_LOOKUP = new Map()
if (rootFrequency?.roots) {
  rootFrequency.roots.forEach(r => {
    if (r.posDistribution) {
      const key = cleanArabicText(r.rootArabic)
      POS_DIST_LOOKUP.set(key, r.posDistribution)
    }
  })
}

// Build collocation lookup
const COLLOCATION_LOOKUP = new Map()
if (collocationsData?.rootCollocations) {
  collocationsData.rootCollocations.forEach(pair => {
    const r1 = cleanArabicText(pair.root1 || '')
    const r2 = cleanArabicText(pair.root2 || '')
    if (r1 && r2) {
      if (!COLLOCATION_LOOKUP.has(r1)) COLLOCATION_LOOKUP.set(r1, [])
      if (!COLLOCATION_LOOKUP.has(r2)) COLLOCATION_LOOKUP.set(r2, [])
      COLLOCATION_LOOKUP.get(r1).push({ root: pair.root2, count: pair.count || pair.cooccurrences || 0 })
      COLLOCATION_LOOKUP.get(r2).push({ root: pair.root1, count: pair.count || pair.cooccurrences || 0 })
    }
  })
  // Sort each entry by count descending
  COLLOCATION_LOOKUP.forEach((v, _k) => { v.sort((a, b) => b.count - a.count) })
}

const POS_CONFIG = {
  V: { label: 'Verb', color: 'var(--accent-teal)' },
  N: { label: 'Nomen', color: 'var(--accent-gold)' },
  ADJ: { label: 'Adjektiv', color: '#b07aff' },
  PN: { label: 'Eigenname', color: '#2196f3' },
}

const SORT_OPTIONS = [
  { id: 'alpha', label: 'Alphabetisch' },
  { id: 'frequency', label: 'Häufigkeit' },
  { id: 'date', label: 'Zuletzt gelernt' },
]

// Build set of known diptote words for badge display
const DIPTOTE_WORDS = new Set()
if (diptoteData?.categories) {
  diptoteData.categories.forEach(cat => {
    ;(cat.examples || cat.patterns || []).forEach(ex => {
      if (ex.word) DIPTOTE_WORDS.add(cleanArabicText(ex.word))
    })
  })
}

// ===== Helper: Build Lane's Lexicon URL =====

function buildLanesUrl(rootConsonants) {
  const transliterated = transliterateToLatin(rootConsonants).replace(/-/g, '')
  // Use ejtaal.net which hosts Lane's Lexicon (Edward William Lane, 1863-1893)
  // as scanned page images — confirmed working and complete (~3040 pages)
  return `https://ejtaal.net/aa/#ll=${encodeURIComponent(transliterated)}`
}

function buildCorpusUrl(rootConsonants) {
  const transliterated = transliterateToLatin(rootConsonants).replace(/-/g, '')
  return `https://corpus.quran.com/qurandictionary.jsp?q=${encodeURIComponent(transliterated)}`
}

// ===== Helper: Group analyzed words by root =====

function groupWordsByRoot(analyzedWords) {
  const rootMap = {} // rootKey -> { derivatives: [...], verses: [...] }
  for (const [wordKey, analysis] of Object.entries(analyzedWords)) {
    const root = analysis.userRoot || analysis.autoAnalysis?.formatted || ''
    if (!root) continue

    // Normalize the root key by removing dashes and cleaning
    const rootClean = cleanArabicText(root.replace(/-/g, ''))
    if (!rootClean || rootClean.length < 2) continue

    if (!rootMap[rootClean]) {
      rootMap[rootClean] = { derivatives: [], verses: [] }
    }

    // Track derivative words
    const word = analysis.word || ''
    if (word && !rootMap[rootClean].derivatives.some(d => d.word === word)) {
      rootMap[rootClean].derivatives.push({
        word,
        wordKey,
        surah: analysis.surah,
        verse: analysis.verse,
      })
    }

    // Track verse references
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

// ===== Sub-component: Root Detail View =====

function RootDetailView({ rootKey, rootData, analyzedData, onClose, onSave, onNavigateToVerse }) {
  const [notes, setNotes] = useState(rootData.notes || '')
  const [meaning, setMeaning] = useState(rootData.meaning || '')
  const [notesChanged, setNotesChanged] = useState(false)

  const formatted = rootData.formatted || formatRoot(rootKey)
  const translit = rootData.transliteration || transliterateToLatin(rootKey)

  const derivatives = analyzedData?.derivatives || rootData.derivatives || []
  const analyzedVerses = analyzedData?.verses || []
  const totalVerseCount = rootData.totalVerseCount || analyzedVerses.length

  // How many more derivatives and verses exist that the learner hasn't analyzed yet
  const hiddenDerivatives = (rootData.totalDerivativeCount || 0) - derivatives.length
  const hiddenVerses = totalVerseCount - analyzedVerses.length

  const handleSaveNotes = useCallback(async () => {
    const updated = {
      ...rootData,
      notes,
      meaning,
    }
    await onSave(rootKey, updated)
    setNotesChanged(false)
  }, [rootKey, rootData, notes, meaning, onSave])

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      marginBottom: '20px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <div className="arabic" style={{
            fontSize: '2.5rem',
            color: 'var(--accent-gold)',
            marginBottom: '4px',
          }}>
            {formatted}
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {translit}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <a
            href={buildLanesUrl(rootKey)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius)',
              background: 'var(--accent-gold-bg)',
              color: 'var(--accent-gold)',
              border: '1px solid var(--accent-gold)',
              fontSize: '0.8rem',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Lane's Lexicon
          </a>
          <a
            href={buildCorpusUrl(rootKey)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius)',
              background: 'var(--accent-teal-bg)',
              color: 'var(--accent-teal)',
              border: '1px solid var(--accent-teal)',
              fontSize: '0.8rem',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Corpus Quran
          </a>
          <button
            onClick={onClose}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius)',
              background: 'var(--bg-input)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            Schließen
          </button>
        </div>
      </div>

      {/* Weak root classification + POS + Frequency badges */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {(() => {
          const weakLabels = classifyWeakRoot(rootKey)
          return weakLabels ? weakLabels.map((label, i) => (
            <span key={i} style={{
              padding: '3px 10px', borderRadius: '12px',
              background: '#fff3e0', color: '#e65100',
              fontSize: '0.75rem', fontWeight: 600,
            }}>{label}</span>
          )) : (
            <span style={{
              padding: '3px 10px', borderRadius: '12px',
              background: 'var(--bg-input)', color: 'var(--text-muted)',
              fontSize: '0.75rem',
            }}>Regulär</span>
          )
        })()}
        {(() => {
          const freq = ROOT_FREQ_LOOKUP.get(cleanArabicText(rootKey))
          return freq ? (
            <span style={{
              padding: '3px 10px', borderRadius: '12px',
              background: freq.rank <= 50 ? 'var(--correct-bg)' : freq.rank <= 300 ? 'var(--accent-gold-bg)' : 'var(--bg-input)',
              color: freq.rank <= 50 ? 'var(--correct)' : freq.rank <= 300 ? 'var(--accent-gold)' : 'var(--text-muted)',
              fontSize: '0.75rem', fontWeight: 600,
            }} title={`${freq.count}x im Quran`}>
              Rang #{freq.rank}
            </span>
          ) : null
        })()}
      </div>

      {/* POS Distribution */}
      {(() => {
        const posDist = POS_DIST_LOOKUP.get(cleanArabicText(rootKey))
        if (!posDist) return null
        const total = Object.values(posDist).reduce((s, v) => s + v, 0)
        if (total === 0) return null
        return (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>
              Wortarten-Verteilung
            </label>
            <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '6px' }}>
              {Object.entries(posDist).filter(([, v]) => v > 0).map(([pos, count]) => (
                <div key={pos} style={{ width: `${(count / total) * 100}%`, background: POS_CONFIG[pos]?.color || 'var(--text-muted)' }} title={`${POS_CONFIG[pos]?.label || pos}: ${count} (${Math.round(count / total * 100)}%)`} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {Object.entries(posDist).filter(([, v]) => v > 0).map(([pos, count]) => (
                <span key={pos} style={{ fontSize: '0.7rem', color: POS_CONFIG[pos]?.color || 'var(--text-muted)' }}>
                  {POS_CONFIG[pos]?.label || pos}: {count} ({Math.round(count / total * 100)}%)
                </span>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Collocations */}
      {(() => {
        const colls = COLLOCATION_LOOKUP.get(cleanArabicText(rootKey))
        if (!colls || colls.length === 0) return null
        return (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>
              Häufige Begleitwurzeln
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {colls.slice(0, 8).map((c, i) => (
                <span key={i} style={{
                  padding: '3px 10px', borderRadius: '12px',
                  background: 'var(--bg-input)', border: '1px solid var(--border)',
                  fontSize: '0.75rem', fontFamily: 'var(--font-arabic)', direction: 'rtl',
                }} title={`${c.count}x gemeinsam`}>
                  {c.root} <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>({c.count})</span>
                </span>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Meaning field */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'block',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          marginBottom: '6px',
          fontWeight: 500,
        }}>
          Bedeutungszusammenfassung
        </label>
        <input
          type="text"
          value={meaning}
          onChange={(e) => { setMeaning(e.target.value); setNotesChanged(true) }}
          placeholder="Was bedeutet diese Wurzel im Quran? (dein Verständnis)"
          style={{ width: '100%' }}
        />
      </div>

      {/* Analyzed derivatives */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{
          fontSize: '0.85rem',
          color: 'var(--accent-teal)',
          marginBottom: '8px',
        }}>
          Gefundene Ableitungen ({derivatives.length})
        </h4>
        {derivatives.length > 0 ? (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
          }}>
            {derivatives.map((d, i) => (
              <span
                key={i}
                className="arabic"
                style={{
                  padding: '4px 10px',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '1.1rem',
                  color: 'var(--arabic-text)',
                  cursor: 'pointer',
                }}
                title={`Sure ${d.surah}, Vers ${d.verse}`}
                onClick={() => onNavigateToVerse && onNavigateToVerse(d.surah, d.verse)}
              >
                {d.word}
              </span>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Noch keine Ableitungen analysiert.
          </div>
        )}
        {hiddenDerivatives > 0 && (
          <div style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            marginTop: '6px',
            fontStyle: 'italic',
          }}>
            und {hiddenDerivatives} weitere Ableitungen
          </div>
        )}
      </div>

      {/* Verse references */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{
          fontSize: '0.85rem',
          color: 'var(--accent-teal)',
          marginBottom: '8px',
        }}>
          Versreferenzen ({analyzedVerses.length}{hiddenVerses > 0 ? ` + ${hiddenVerses}` : ''})
        </h4>
        {analyzedVerses.length > 0 ? (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
          }}>
            {analyzedVerses.map((v, i) => (
              <button
                key={i}
                onClick={() => onNavigateToVerse && onNavigateToVerse(v.surah, v.verse)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: v.analyzed ? 'var(--accent-teal-bg)' : 'var(--bg-input)',
                  color: v.analyzed ? 'var(--accent-teal)' : 'var(--text-muted)',
                  border: `1px solid ${v.analyzed ? 'var(--accent-teal)' : 'var(--border)'}`,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontWeight: v.analyzed ? 600 : 400,
                }}
                title={`Sure ${v.surah}:${v.verse} öffnen in Modul 3`}
              >
                {v.surah}:{v.verse}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Noch keine Verse analysiert.
          </div>
        )}
        {hiddenVerses > 0 && (
          <div style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            marginTop: '6px',
            fontStyle: 'italic',
          }}>
            und {hiddenVerses} weitere Verse
          </div>
        )}
      </div>

      {/* Personal notes */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{
          display: 'block',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          marginBottom: '6px',
          fontWeight: 500,
        }}>
          Persönliche Notizen
        </label>
        <textarea
          value={notes}
          onChange={(e) => { setNotes(e.target.value); setNotesChanged(true) }}
          rows={3}
          placeholder="Eigene Beobachtungen, Zusammenhänge, Merkregeln..."
          style={{ width: '100%', resize: 'vertical' }}
        />
      </div>

      {notesChanged && (
        <button
          className="settings-btn settings-btn--primary"
          onClick={handleSaveNotes}
        >
          Änderungen speichern
        </button>
      )}
    </div>
  )
}

// ===== Main Module 4 Component =====

export default function Module4({ settings: _settings }) {
  const [roots, setRoots] = useState({})
  const [analyzedWords, setAnalyzedWords] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('alpha')
  const [selectedRoot, setSelectedRoot] = useState(null)
  const [filterLetter, setFilterLetter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('roots') // 'roots' | 'fields' | 'diptotes'

  // Manual root entry state
  const [showAddRoot, setShowAddRoot] = useState(false)
  const [newRoot, setNewRoot] = useState('')
  const [newMeaning, setNewMeaning] = useState('')
  const [keyboardVisible, setKeyboardVisible] = useState(false)

  const alphabet = getArabicAlphabet()

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [rootData, wordData] = await Promise.all([
          loadAllRoots(),
          loadAllAnalyzedWords(),
        ])
        setRoots(rootData)
        setAnalyzedWords(wordData)
      } catch (err) {
        console.error('Fehler beim Laden der Wurzeldaten:', err)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  // Group analyzed words by root
  const analyzedByRoot = useMemo(() => {
    return groupWordsByRoot(analyzedWords)
  }, [analyzedWords])

  // Merge stored roots with analyzed-word roots to get complete root list
  const mergedRoots = useMemo(() => {
    const merged = {}

    // First add all stored roots
    for (const [key, data] of Object.entries(roots)) {
      const cleanKey = cleanArabicText(key.replace(/-/g, ''))
      merged[cleanKey] = { ...data, rootKey: cleanKey }
    }

    // Then add roots discovered from analysis that aren't already stored
    for (const [rootClean, data] of Object.entries(analyzedByRoot)) {
      if (!merged[rootClean]) {
        merged[rootClean] = {
          root: rootClean,
          formatted: formatRoot(rootClean),
          transliteration: transliterateToLatin(rootClean),
          meaning: '',
          notes: '',
          rootKey: rootClean,
          createdAt: data.derivatives[0]?.analyzedAt || new Date().toISOString(),
        }
      }
    }

    return merged
  }, [roots, analyzedByRoot])

  // Filter and sort
  const filteredRoots = useMemo(() => {
    let entries = Object.entries(mergedRoots)

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase()
      const arabicTerm = containsArabic(term) ? cleanArabicText(term) : transliterateToArabic(term)

      entries = entries.filter(([key, value]) => {
        // Search in root consonants
        if (key.includes(arabicTerm) || key.includes(term)) return true
        if (cleanArabicText(key).includes(cleanArabicText(searchTerm))) return true
        // Search in transliteration
        const translit = (value.transliteration || transliterateToLatin(key)).toLowerCase()
        if (translit.includes(term)) return true
        // Search in meaning
        if (value.meaning && value.meaning.toLowerCase().includes(term)) return true
        // Search in notes
        if (value.notes && value.notes.toLowerCase().includes(term)) return true
        return false
      })
    }

    // Filter by first letter
    if (filterLetter) {
      entries = entries.filter(([key]) => {
        const firstChar = [...cleanArabicText(key)][0]
        return firstChar === filterLetter
      })
    }

    // Sort
    entries.sort((a, b) => {
      const [keyA, dataA] = a
      const [keyB, dataB] = b

      if (sortBy === 'alpha') {
        // Arabic alphabetical order
        return keyA.localeCompare(keyB, 'ar')
      }
      if (sortBy === 'frequency') {
        // By number of analyzed derivatives (more = first)
        const countA = (analyzedByRoot[keyA]?.derivatives?.length || 0)
        const countB = (analyzedByRoot[keyB]?.derivatives?.length || 0)
        return countB - countA
      }
      if (sortBy === 'date') {
        // By most recently updated
        const dateA = dataA.updatedAt || dataA.createdAt || ''
        const dateB = dataB.updatedAt || dataB.createdAt || ''
        return dateB.localeCompare(dateA)
      }
      return 0
    })

    return entries
  }, [mergedRoots, searchTerm, sortBy, filterLetter, analyzedByRoot])

  // Stats
  const totalRoots = Object.keys(mergedRoots).length
  const progressPercent = Math.min(100, Math.round((totalRoots / TOTAL_QURAN_ROOTS) * 100))

  // Save root (from detail view or manual entry)
  const handleSaveRoot = useCallback(async (rootKey, rootData) => {
    await saveRoot(rootKey, rootData)
    setRoots(prev => ({ ...prev, [rootKey]: rootData }))
  }, [])

  // Manual root entry
  const handleAddRoot = useCallback(async () => {
    if (!newRoot.trim()) return

    const rootClean = cleanArabicText(newRoot.trim().replace(/-/g, ''))
    if (rootClean.length < 2) return

    const rootData = {
      root: rootClean,
      formatted: formatRoot(rootClean),
      transliteration: transliterateToLatin(rootClean),
      meaning: newMeaning,
      notes: '',
      createdAt: new Date().toISOString(),
    }

    await saveRoot(rootClean, rootData)
    setRoots(prev => ({ ...prev, [rootClean]: rootData }))
    setNewRoot('')
    setNewMeaning('')
    setShowAddRoot(false)
    setSelectedRoot(rootClean)
  }, [newRoot, newMeaning])

  // Navigate to Module 3 with specific verse
  const handleNavigateToVerse = useCallback((surah, verse) => {
    // Use React Router or window location to navigate to Module 3 with parameters
    window.location.href = `/module/3?surah=${surah}&verse=${verse}`
  }, [])

  if (loading) {
    return (
      <div className="module-page">
        <div className="module-placeholder">
          <div className="module-placeholder__icon">{'\u23F3'}</div>
          <div className="module-placeholder__title">Wurzeldaten werden geladen...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="module-page" style={{ maxWidth: '1000px' }}>
      <h2>Modul 4: Wurzel-Notizbuch</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
        Dein persönliches Verzeichnis arabischer Wortwurzeln. Wächst automatisch, wenn du Wörter in Modul 3 analysierst.
      </p>

      {/* View mode tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
        {[['roots', 'Wurzelliste'], ['fields', 'Semantische Felder'], ['diptotes', 'Diptote']].map(([m, label]) => (
          <button key={m} onClick={() => setViewMode(m)} style={{
            padding: '8px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
            background: viewMode === m ? 'var(--accent-teal-bg)' : 'var(--bg-card)',
            color: viewMode === m ? 'var(--accent-teal)' : 'var(--text-secondary)',
            border: viewMode === m ? '1px solid var(--accent-teal)' : '1px solid var(--border)',
            fontWeight: viewMode === m ? 600 : 400, fontSize: '0.85rem',
          }}>{label}</button>
        ))}
      </div>

      {/* === SEMANTIC FIELDS VIEW === */}
      {viewMode === 'fields' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>
            Wurzeln nach semantischem Feld gruppiert. Zeigt wie viele Wurzeln jedes Feldes du bereits in deinem Notizbuch hast.
          </p>
          {(thematicFields.fields || []).map(field => {
            const fieldRootKeys = (field.roots || []).map(r => cleanArabicText(r.root.replace(/ /g, '')))
            const learnedCount = fieldRootKeys.filter(k => mergedRoots[k]).length
            return (
              <details key={field.id} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', overflow: 'hidden',
              }}>
                <summary style={{
                  padding: '16px', cursor: 'pointer', display: 'flex',
                  justifyContent: 'space-between', alignItems: 'center',
                  fontWeight: 600, color: 'var(--text-primary)',
                }}>
                  <span>{field.title}</span>
                  <span style={{
                    fontSize: '0.8rem', padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                    background: learnedCount > 0 ? 'var(--accent-teal-bg)' : 'var(--bg-input)',
                    color: learnedCount > 0 ? 'var(--accent-teal)' : 'var(--text-muted)',
                  }}>
                    {learnedCount} / {field.roots?.length || 0}
                  </span>
                </summary>
                <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(field.roots || []).map((r, i) => {
                    const rKey = cleanArabicText(r.root.replace(/ /g, ''))
                    const inNotebook = !!mergedRoots[rKey]
                    return (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '8px 12px', background: 'var(--bg-input)',
                        borderRadius: 'var(--radius)', border: inNotebook ? '1px solid var(--accent-teal)' : '1px solid var(--border)',
                      }}>
                        <span className="arabic" dir="rtl" style={{ fontSize: '1.2rem', minWidth: '60px', color: 'var(--accent-gold)' }}>
                          {r.root}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.transliteration}</span>
                        <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {(r.keyWords || []).join(', ')}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.count}</span>
                        {inNotebook && <span style={{ color: 'var(--accent-teal)', fontSize: '0.8rem' }}>&#10003;</span>}
                      </div>
                    )
                  })}
                </div>
              </details>
            )
          })}
        </div>
      )}

      {/* === DIPTOTE REFERENCE VIEW === */}
      {viewMode === 'diptotes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            padding: '16px', background: 'var(--accent-gold-bg)', border: '1px solid var(--accent-gold)',
            borderRadius: 'var(--radius)', fontSize: '0.85rem', lineHeight: 1.7,
          }}>
            <strong>Diptote (mamnu min as-sarf)</strong>: {diptoteData.explanation?.diptote?.description}
          </div>
          <div style={{
            padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius)',
            fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6,
          }}>
            <strong>Normalisierung mit Artikel:</strong> {diptoteData.explanation?.diptote_with_article?.description}
          </div>
          {(diptoteData.categories || []).map(cat => (
            <div key={cat.id} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '16px',
            }}>
              <h4 style={{ marginBottom: '6px', color: 'var(--accent-gold)' }}>{cat.title}</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>{cat.description}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(cat.examples || cat.patterns || []).map((ex, i) => (
                  <span key={i} style={{
                    padding: '4px 10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem', border: '1px solid var(--border)',
                  }}>
                    <span className="arabic" dir="rtl" style={{ color: 'var(--accent-gold)' }}>
                      {ex.word || ex.example || ex.pattern}
                    </span>
                    {ex.meaning && <span style={{ color: 'var(--text-muted)', marginLeft: '6px', fontSize: '0.75rem' }}>
                      {ex.meaning}
                    </span>}
                  </span>
                ))}
              </div>
              {cat.exception && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', fontStyle: 'italic' }}>
                  {cat.exception}
                </p>
              )}
              {cat.note && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', fontStyle: 'italic' }}>
                  {cat.note}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* === ROOTS VIEW (original, only shown when viewMode === 'roots') === */}
      {viewMode !== 'roots' ? null : (<>
      {/* Existing root view content continues below */}

      {/* Root learning path suggestion */}
      {totalRoots < 50 && rootFrequency?.roots && (
        <div style={{
          padding: '12px 16px', marginBottom: '16px',
          background: 'var(--accent-gold-bg)', border: '1px solid var(--accent-gold)',
          borderRadius: 'var(--radius)', fontSize: '0.85rem', lineHeight: 1.6,
        }}>
          <strong style={{ color: 'var(--accent-gold)' }}>Lernpfad-Empfehlung:</strong> Die {Math.min(50, rootFrequency.roots.length)} häufigsten Wurzeln decken {rootFrequency.meta.top50coverage ? Math.round((rootFrequency.meta.top50coverage / rootFrequency.meta.totalWords) * 100) : '~30'}% des Qurantextes ab.
          Beginne mit diesen in Modul 3 — sie kommen in fast jedem Vers vor:
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
            {rootFrequency.roots.slice(0, 20).map(r => (
              <span key={r.rank} style={{
                padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem',
                background: mergedRoots[cleanArabicText(r.rootArabic)] ? 'var(--correct-bg)' : 'var(--bg-input)',
                color: mergedRoots[cleanArabicText(r.rootArabic)] ? 'var(--correct)' : 'var(--text-secondary)',
                border: `1px solid ${mergedRoots[cleanArabicText(r.rootArabic)] ? 'var(--correct)' : 'var(--border)'}`,
              }} title={`#${r.rank}: ${r.meaning} (${r.count}x)`}>
                <span className="arabic" dir="rtl">{r.rootArabic}</span>
                <span style={{ marginLeft: '4px' }}>{r.meaning ? '= ' + r.meaning.split('/')[0] : ''}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Statistics bar */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '20px',
        flexWrap: 'wrap',
        alignItems: 'stretch',
      }}>
        {/* Total roots */}
        <div style={{
          padding: '12px 20px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          textAlign: 'center',
          minWidth: '100px',
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
            {totalRoots}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Wurzeln erfasst
          </div>
        </div>

        {/* Analyzed words */}
        <div style={{
          padding: '12px 20px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          textAlign: 'center',
          minWidth: '100px',
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-teal)' }}>
            {Object.keys(analyzedWords).length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Wörter analysiert
          </div>
        </div>

        {/* Progress toward ~1800 */}
        <div style={{
          flex: 1,
          minWidth: '200px',
          padding: '12px 20px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginBottom: '6px',
          }}>
            <span>Fortschritt</span>
            <span>{totalRoots} / ~{TOTAL_QURAN_ROOTS} ({progressPercent}%)</span>
          </div>
          <div style={{
            height: '8px',
            background: 'var(--bg-input)',
            borderRadius: '4px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: progressPercent < 25
                ? 'var(--accent-teal)'
                : progressPercent < 50
                  ? 'var(--accent-gold)'
                  : 'var(--correct)',
              borderRadius: '4px',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Search and controls */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '12px',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <div style={{ flex: '1 1 250px', position: 'relative' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Wurzeln suchen (Arabisch, Transliteration, Notizen)..."
            style={{ width: '100%', paddingRight: '36px' }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '1.1rem',
                padding: '2px',
              }}
              title="Suche löschen"
            >
              {'\u2715'}
            </button>
          )}
        </div>

        {/* Sort selector */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: '8px 12px',
            minWidth: '140px',
          }}
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>

        {/* Add root button */}
        <button
          className="settings-btn settings-btn--primary"
          onClick={() => setShowAddRoot(!showAddRoot)}
        >
          {showAddRoot ? 'Abbrechen' : '+ Wurzel hinzufügen'}
        </button>
      </div>

      {/* Alphabetical letter filter */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '3px',
        marginBottom: '16px',
        padding: '8px',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
      }}>
        <button
          onClick={() => setFilterLetter(null)}
          style={{
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            background: filterLetter === null ? 'var(--accent-teal-bg)' : 'transparent',
            color: filterLetter === null ? 'var(--accent-teal)' : 'var(--text-muted)',
            border: filterLetter === null ? '1px solid var(--accent-teal)' : '1px solid transparent',
            fontSize: '0.75rem',
            cursor: 'pointer',
            fontWeight: filterLetter === null ? 600 : 400,
          }}
        >
          Alle
        </button>
        {alphabet.map(letter => {
          const hasRoots = Object.keys(mergedRoots).some(key => {
            const firstChar = [...cleanArabicText(key)][0]
            return firstChar === letter
          })
          return (
            <button
              key={letter}
              onClick={() => setFilterLetter(filterLetter === letter ? null : letter)}
              className="arabic"
              style={{
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)',
                background: filterLetter === letter ? 'var(--accent-gold-bg)' : 'transparent',
                color: filterLetter === letter
                  ? 'var(--accent-gold)'
                  : hasRoots
                    ? 'var(--arabic-text)'
                    : 'var(--text-muted)',
                border: filterLetter === letter ? '1px solid var(--accent-gold)' : '1px solid transparent',
                fontSize: '1.1rem',
                cursor: hasRoots ? 'pointer' : 'default',
                opacity: hasRoots ? 1 : 0.4,
                lineHeight: 1.4,
              }}
              disabled={!hasRoots}
              title={transliterateToLatin(letter)}
            >
              {letter}
            </button>
          )
        })}
      </div>

      {/* Manual root entry form */}
      {showAddRoot && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--accent-teal)',
          borderRadius: 'var(--radius)',
          padding: '16px',
          marginBottom: '16px',
        }}>
          <h3 style={{ marginBottom: '12px', color: 'var(--accent-teal)', fontSize: '0.95rem' }}>
            Neue Wurzel manuell eintragen
          </h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <input
              type="text"
              className="arabic-input"
              value={newRoot}
              onChange={(e) => setNewRoot(e.target.value)}
              placeholder="Wurzel (z.B. كتب)"
              style={{ flex: '1', minWidth: '120px' }}
              dir="rtl"
            />
            <input
              type="text"
              value={newMeaning}
              onChange={(e) => setNewMeaning(e.target.value)}
              placeholder="Grundbedeutung"
              style={{ flex: '2', minWidth: '180px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button className="settings-btn settings-btn--primary" onClick={handleAddRoot}>
              Wurzel speichern
            </button>
            <ArabicKeyboard
              onInput={(char) => setNewRoot(prev => prev + char)}
              onBackspace={() => setNewRoot(prev => prev.slice(0, -1))}
              onClear={() => setNewRoot('')}
              visible={keyboardVisible}
              onToggle={() => setKeyboardVisible(!keyboardVisible)}
            />
          </div>
        </div>
      )}

      {/* Selected root detail view */}
      {selectedRoot && mergedRoots[selectedRoot] && (
        <RootDetailView
          rootKey={selectedRoot}
          rootData={mergedRoots[selectedRoot]}
          analyzedData={analyzedByRoot[selectedRoot]}
          onClose={() => setSelectedRoot(null)}
          onSave={handleSaveRoot}
          onNavigateToVerse={handleNavigateToVerse}
        />
      )}

      {/* Root list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {filteredRoots.length === 0 ? (
          <div className="module-placeholder">
            <div className="module-placeholder__icon">{'\u{1F333}'}</div>
            <div className="module-placeholder__title">
              {searchTerm || filterLetter
                ? 'Keine Wurzeln gefunden'
                : 'Noch keine Wurzeln erfasst'}
            </div>
            <div className="module-placeholder__desc">
              {searchTerm || filterLetter
                ? 'Versuche eine andere Suche oder wähle einen anderen Buchstaben.'
                : 'Analysiere Wörter in Modul 3 - die Wurzeln erscheinen automatisch hier.'}
            </div>
          </div>
        ) : (
          filteredRoots.map(([key, root]) => {
            const isSelected = selectedRoot === key
            const derivCount = analyzedByRoot[key]?.derivatives?.length || 0
            const verseCount = analyzedByRoot[key]?.verses?.length || 0
            const freqInfo = ROOT_FREQ_LOOKUP.get(cleanArabicText(key))

            return (
              <button
                key={key}
                onClick={() => setSelectedRoot(isSelected ? null : key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '10px 16px',
                  background: isSelected ? 'var(--accent-gold-bg)' : 'var(--bg-card)',
                  border: `1px solid ${isSelected ? 'var(--accent-gold)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all var(--transition)',
                }}
              >
                {/* Root display */}
                <div className="arabic" style={{
                  fontSize: '1.5rem',
                  color: 'var(--accent-gold)',
                  minWidth: '80px',
                  textAlign: 'center',
                }}>
                  {root.formatted || formatRoot(key)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {root.transliteration || transliterateToLatin(key)}
                  </div>
                  {root.meaning && (
                    <div style={{
                      fontSize: '0.9rem',
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {root.meaning}
                    </div>
                  )}
                </div>

                {/* Badges */}
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  {/* Weak root classification badge */}
                  {(() => {
                    const weakLabels = classifyWeakRoot(key)
                    return weakLabels ? (
                      <span style={{
                        padding: '2px 8px', borderRadius: '10px',
                        background: '#fff3e0', color: '#e65100',
                        fontSize: '0.65rem', fontWeight: 600,
                      }} title={weakLabels.join(' + ')}>
                        {weakLabels[0]}
                      </span>
                    ) : null
                  })()}
                  {freqInfo && (
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: freqInfo.rank <= 50 ? 'var(--correct-bg)' : freqInfo.rank <= 300 ? 'var(--accent-gold-bg)' : 'var(--bg-input)',
                      color: freqInfo.rank <= 50 ? 'var(--correct)' : freqInfo.rank <= 300 ? 'var(--accent-gold)' : 'var(--text-muted)',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                    }}
                      title={`Rang ${freqInfo.rank} von ${rootFrequency.meta.totalRoots} Wurzeln (${freqInfo.count}x im Quran)${freqInfo.meaning ? ' — ' + freqInfo.meaning : ''}`}
                    >
                      #{freqInfo.rank} ({freqInfo.count}x)
                    </span>
                  )}
                  {derivCount > 0 && (
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: 'var(--accent-teal-bg)',
                      color: 'var(--accent-teal)',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                    }}>
                      {derivCount} Abl.
                    </span>
                  )}
                  {verseCount > 0 && (
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: 'var(--ambiguous-bg)',
                      color: 'var(--ambiguous)',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                    }}>
                      {verseCount} V.
                    </span>
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Footer stats */}
      {filteredRoots.length > 0 && (
        <div style={{
          marginTop: '16px',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <span>
            {filteredRoots.length} von {totalRoots} Wurzel{totalRoots !== 1 ? 'n' : ''} angezeigt
          </span>
          <span>
            Klicke auf eine Wurzel für Details und Lane's Lexicon
          </span>
        </div>
      )}
      </>)}
    </div>
  )
}
