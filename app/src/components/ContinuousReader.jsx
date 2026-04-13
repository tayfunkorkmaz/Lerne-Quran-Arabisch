import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { splitIntoWords, cleanArabicText, transliterateToLatin, stripVowelMarks, stripTashkilKeepUthmani, stripEmbeddedBasmala } from '../utils/arabic.js'
import { loadAllRoots } from '../utils/storage.js'
import { playVerseAudio, stopAudio as stopGlobalAudio, getDefaultReciterFolder, getCurrentAudio, isOnline } from '../utils/audio.js'
import { loadMorphologyDB, loadQuranVocalized, loadQuranUthmani, loadQuranRasm } from '../utils/lazyData.js'
import quranData from '../data/quran-simple-clean.json'
import ambiguitiesData from '../data/ambiguities.json'

/**
 * ContinuousReader — Fortlaufender Lesemodus
 * Der Lernende liest mehrere Verse / halbe Seite / ganze Seite am Stück.
 * Hilfe ist auf Nachfrage verfügbar (Wort antippen zeigt Analyse).
 * Audio-Text-Sync: Wort-für-Wort-Highlighting beim Abspielen.
 *
 * Large data (morphology DB, vocalized/uthmani/rasm text) is loaded lazily
 * to avoid blocking the initial render with ~10 MB of JSON.
 */

// Pre-built surah maps for O(1) lookup — populated lazily
function buildSurahMap(data) {
  const map = new Map()
  if (data?.surahs) data.surahs.forEach(s => map.set(s.number, s))
  return map
}

// Module-level caches populated once on first load
let _morphLookup = null
let _consonantalRootLookup = null
let _vocalizedMap = null
let _uthmaniMap = null
let _rasmMap = null

async function ensureMorphData() {
  if (_morphLookup) return { morphLookup: _morphLookup, consonantalRootLookup: _consonantalRootLookup }
  try {
    const morphologyDB = await loadMorphologyDB()
    _morphLookup = new Map()
    _consonantalRootLookup = new Map()
    if (morphologyDB?.words) {
      morphologyDB.words.forEach(w => {
        if (w.l) _morphLookup.set(w.l, w)
        if (w.c && w.r && !_consonantalRootLookup.has(w.c)) {
          _consonantalRootLookup.set(w.c, w.r)
        }
      })
    }
  } catch {
    _morphLookup = new Map()
    _consonantalRootLookup = new Map()
  }
  return { morphLookup: _morphLookup, consonantalRootLookup: _consonantalRootLookup }
}

async function ensureLayerData(layerId) {
  if (layerId === 'vocalized' || layerId === 'adaptive') {
    if (!_vocalizedMap) _vocalizedMap = buildSurahMap(await loadQuranVocalized())
    return _vocalizedMap
  }
  if (layerId === 'uthmani') {
    if (!_uthmaniMap) _uthmaniMap = buildSurahMap(await loadQuranUthmani())
    return _uthmaniMap
  }
  if (layerId === 'rasm') {
    if (!_rasmMap) _rasmMap = buildSurahMap(await loadQuranRasm())
    return _rasmMap
  }
  return null
}

const VERSES_PER_PAGE = [5, 10, 15, 20, 30]

// ===== Progressive text layers =====
const READER_LAYERS = [
  { id: 'vocalized', label: 'Vokalisiert', desc: 'Voll vokalisiert (Tashkil)' },
  { id: 'adaptive', label: 'Adaptiv', desc: 'Nur unbekannte/mehrdeutige Wörter bleiben vokalisiert' },
  { id: 'simple', label: 'Konsonantal', desc: 'Konsonanten + I\'jam (Simple Clean)' },
  { id: 'uthmani', label: 'Uthmani', desc: 'Uthmani-Orthographie mit Sonderschreibungen' },
  { id: 'rasm', label: 'Rasm', desc: 'Reiner Rasm ohne Punkte' },
]

// Build set of ambiguous consonantal forms for adaptive layer
const AMBIGUOUS_FORMS = new Set()
if (ambiguitiesData?.entries) {
  ambiguitiesData.entries.forEach(e => {
    if (e.consonants) AMBIGUOUS_FORMS.add(cleanArabicText(e.consonants))
  })
}

function getReaderVerseText(layerId, surahNum, verseNum, fallbackText, layerMap) {
  if (layerId === 'vocalized' || layerId === 'adaptive') {
    const s = layerMap?.get(surahNum)
    const v = s?.verses?.[verseNum - 1]
    return v?.text || fallbackText
  }
  if (layerId === 'uthmani') {
    const s = layerMap?.get(surahNum)
    const v = s?.verses?.[verseNum - 1]
    const raw = v?.text || fallbackText
    return stripTashkilKeepUthmani(stripEmbeddedBasmala(raw, 'uthmani', surahNum, verseNum))
  }
  if (layerId === 'rasm') {
    const s = layerMap?.get(surahNum)
    const v = s?.verses?.[verseNum - 1]
    const raw = v?.text || fallbackText
    return stripEmbeddedBasmala(raw, 'rasm', surahNum, verseNum)
  }
  return fallbackText // 'simple' = base text
}

/**
 * For the adaptive layer: strip vowel marks from a word if the learner
 * already knows its root AND the word is not ambiguous in the consonantal text.
 * Unknown/ambiguous words keep full vocalization.
 */
function adaptiveStripWord(word, knownRoots, consonantalRootLookup) {
  const consonantal = cleanArabicText(word)

  // Keep vocalization for ambiguous forms
  if (AMBIGUOUS_FORMS.has(consonantal)) return word

  // Check if this word's root is known via morphology DB
  const root = consonantalRootLookup?.get(consonantal)
  if (root && knownRoots.has(cleanArabicText(root))) {
    return stripVowelMarks(word)
  }

  // Keep vocalization for unknown words
  return word
}

const DEFAULT_RECITER_FOLDER = getDefaultReciterFolder()

export default function ContinuousReader({ initialSurah, initialVerse, onClose }) {
  const [surah, setSurah] = useState(initialSurah || 1)
  const [startVerse, setStartVerse] = useState(initialVerse || 1)
  const [versesPerPage, setVersesPerPage] = useState(10)
  const [selectedWord, setSelectedWord] = useState(null)
  const [showNumbers, setShowNumbers] = useState(true)
  const [fontSize, setFontSize] = useState(28)
  const [activeLayer, setActiveLayer] = useState('vocalized')
  const [knownRoots, setKnownRoots] = useState(new Set())
  const textRef = useRef(null)

  // Lazily loaded data
  const [layerMap, setLayerMap] = useState(null)
  const [morphLookup, setMorphLookup] = useState(null)
  const [consonantalRootLookup, setConsonantalRootLookup] = useState(null)

  // Load text layer data when active layer changes
  useEffect(() => {
    let cancelled = false
    ensureLayerData(activeLayer).then(map => {
      if (!cancelled) setLayerMap(map)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [activeLayer])

  // Load morphology data on mount (needed for word analysis + adaptive layer)
  useEffect(() => {
    let cancelled = false
    ensureMorphData().then(({ morphLookup: ml, consonantalRootLookup: crl }) => {
      if (!cancelled) {
        setMorphLookup(ml)
        setConsonantalRootLookup(crl)
      }
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  // Load known roots for adaptive layer
  useEffect(() => {
    let cancelled = false
    loadAllRoots().then(roots => {
      if (!cancelled && roots) {
        const rootSet = new Set(Object.keys(roots).map(k => cleanArabicText(k.replace(/-/g, ''))))
        setKnownRoots(rootSet)
      }
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  // Audio-text sync state
  const [playingVerse, setPlayingVerse] = useState(null) // verse number currently playing
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(-1)
  const [wordTempo, setWordTempo] = useState(0.5) // seconds per word
  const [highlightOnly, setHighlightOnly] = useState(false) // highlight without audio
  const [isPaused, setIsPaused] = useState(false)
  const [audioSource, setAudioSource] = useState(null) // 'cache' | 'network' | 'speech' | null
  const [online, setOnline] = useState(isOnline())
  const intervalRef = useRef(null)
  const wordIndexRef = useRef(-1) // track current word index for interval
  const pausedRef = useRef(false) // track pause state for interval

  // Track online/offline status
  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  const surahData = useMemo(() => {
    return quranData?.surahs?.find(s => s.number === surah) || null
  }, [surah])

  const displayedVerses = useMemo(() => {
    if (!surahData) return []
    return surahData.verses.slice(startVerse - 1, startVerse - 1 + versesPerPage)
  }, [surahData, startVerse, versesPerPage])

  const totalVerses = surahData?.verses?.length || 0

  const handleWordClick = useCallback((word, verseNum, wordIdx) => {
    // Look up morphology — handle يا vocative particle alignment
    const verseData = surahData?.verses?.find(v => v.number === verseNum)
    const allWords = verseData ? splitIntoWords(verseData.text) : []
    let yaOffset = 0
    for (let i = 0; i < wordIdx && i < allWords.length; i++) {
      if (allWords[i] === '\u064a\u0627') yaOffset++
    }
    const directKey = `${surah}:${verseNum}:${wordIdx + 1}`
    const adjustedKey = yaOffset > 0 ? `${surah}:${verseNum}:${wordIdx + 1 - yaOffset}` : null
    const entry = morphLookup?.get(directKey) || (adjustedKey ? morphLookup?.get(adjustedKey) : null)
    setSelectedWord({ word, verseNum, wordIdx, entry, key: directKey })
  }, [surah, surahData, morphLookup])

  // Cleanup interval and audio on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      stopGlobalAudio()
    }
  }, [])

  // Stop playback helper
  const stopPlayback = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    stopGlobalAudio()
    setPlayingVerse(null)
    setHighlightedWordIndex(-1)
    setIsPaused(false)
    setAudioSource(null)
    wordIndexRef.current = -1
    pausedRef.current = false
  }, [])

  // Start word-by-word highlighting for a verse
  const startHighlighting = useCallback((verseNum, wordCount) => {
    // Clear any existing interval
    if (intervalRef.current) clearInterval(intervalRef.current)

    wordIndexRef.current = 0
    setHighlightedWordIndex(0)
    setPlayingVerse(verseNum)
    setIsPaused(false)
    pausedRef.current = false

    intervalRef.current = setInterval(() => {
      if (pausedRef.current) return // skip advancing when paused

      wordIndexRef.current += 1
      if (wordIndexRef.current >= wordCount) {
        // Done highlighting
        clearInterval(intervalRef.current)
        intervalRef.current = null
        setPlayingVerse(null)
        setHighlightedWordIndex(-1)
        setAudioSource(null)
        wordIndexRef.current = -1
        stopGlobalAudio()
      } else {
        setHighlightedWordIndex(wordIndexRef.current)
      }
    }, wordTempo * 1000)
  }, [wordTempo])

  // Play verse: audio + highlighting
  const handlePlayVerse = useCallback(async (verseNum) => {
    // If same verse is playing, stop it
    if (playingVerse === verseNum) {
      stopPlayback()
      return
    }

    // Stop any previous playback
    stopPlayback()

    const verseData = surahData?.verses?.find(v => v.number === verseNum)
    if (!verseData) return

    const words = splitIntoWords(verseData.text)
    const wordCount = words.length

    if (highlightOnly) {
      // Just highlight, no audio
      setAudioSource(null)
      startHighlighting(verseNum, wordCount)
      return
    }

    // Use centralized audio utility with fallback chain
    const result = await playVerseAudio(
      surah, verseNum,
      DEFAULT_RECITER_FOLDER,
      verseData.text,
      {
        onEnd: () => {
          // Audio ended; interval will handle its own cleanup
        },
        onError: () => {
          // Audio error — highlighting still continues
        },
      }
    )

    setAudioSource(result.source)
    startHighlighting(verseNum, wordCount)
  }, [playingVerse, surah, surahData, highlightOnly, stopPlayback, startHighlighting])

  // Pause/resume
  const handlePauseResume = useCallback(() => {
    if (!playingVerse) return

    const currentAudioEl = getCurrentAudio()
    if (isPaused) {
      // Resume
      setIsPaused(false)
      pausedRef.current = false
      if (currentAudioEl) currentAudioEl.play().catch(() => {})
    } else {
      // Pause
      setIsPaused(true)
      pausedRef.current = true
      if (currentAudioEl) currentAudioEl.pause()
    }
  }, [playingVerse, isPaused])

  // Stop playback when navigating
  const handleNextPage = useCallback(() => {
    stopPlayback()
    const next = startVerse + versesPerPage
    if (next <= totalVerses) {
      setStartVerse(next)
      setSelectedWord(null)
      textRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (surah < 114) {
      setSurah(s => s + 1)
      setStartVerse(1)
      setSelectedWord(null)
    }
  }, [startVerse, versesPerPage, totalVerses, surah, stopPlayback])

  const handlePrevPage = useCallback(() => {
    stopPlayback()
    const prev = startVerse - versesPerPage
    if (prev >= 1) {
      setStartVerse(prev)
      setSelectedWord(null)
    } else if (surah > 1) {
      setSurah(s => s - 1)
      setStartVerse(1)
      setSelectedWord(null)
    }
  }, [startVerse, versesPerPage, surah, stopPlayback])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
      {/* Offline banner */}
      {!online && (
        <div style={{
          padding: '6px 20px', background: 'var(--accent-gold-bg)',
          borderBottom: '1px solid var(--accent-gold)',
          fontSize: '0.8rem', color: 'var(--accent-gold)', textAlign: 'center',
        }}>
          Offline — Audio wird per Sprachsynthese oder im Highlight-Modus abgespielt.
        </div>
      )}
      {/* Top controls */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
        padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sure</label>
          <input type="number" min={1} max={114} value={surah}
            onChange={e => { stopPlayback(); setSurah(Math.max(1, Math.min(114, parseInt(e.target.value) || 1))); setStartVerse(1) }}
            style={{ width: '55px', padding: '4px 6px', textAlign: 'center' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ab Vers</label>
          <input type="number" min={1} max={totalVerses} value={startVerse}
            onChange={e => { stopPlayback(); setStartVerse(Math.max(1, Math.min(totalVerses, parseInt(e.target.value) || 1))) }}
            style={{ width: '55px', padding: '4px 6px', textAlign: 'center' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ {totalVerses}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Verse</label>
          <select value={versesPerPage} onChange={e => setVersesPerPage(parseInt(e.target.value))}
            style={{ padding: '4px 8px' }}>
            {VERSES_PER_PAGE.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Größe</label>
          <input type="range" min={20} max={48} value={fontSize}
            onChange={e => setFontSize(parseInt(e.target.value))}
            style={{ width: '80px' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{fontSize}px</span>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={showNumbers} onChange={e => setShowNumbers(e.target.checked)} />
          Versnummern
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderLeft: '1px solid var(--border)', paddingLeft: '10px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Schicht</label>
          {READER_LAYERS.map(layer => (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              title={layer.desc}
              style={{
                padding: '3px 8px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', cursor: 'pointer',
                background: activeLayer === layer.id ? 'var(--accent-teal-bg)' : 'var(--bg-input)',
                border: activeLayer === layer.id ? '1px solid var(--accent-teal)' : '1px solid var(--border)',
                color: activeLayer === layer.id ? 'var(--accent-teal)' : 'var(--text-secondary)',
                fontWeight: activeLayer === layer.id ? 600 : 400,
              }}
            >
              {layer.label}
            </button>
          ))}
        </div>
        {onClose && (
          <button onClick={onClose} style={{
            marginLeft: 'auto', padding: '4px 12px', borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-input)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem',
          }}>Schließen</button>
        )}
      </div>

      {/* Audio controls bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap',
        padding: '8px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Wort-Tempo</label>
          <input
            type="range" min={0.3} max={1.5} step={0.1} value={wordTempo}
            onChange={e => setWordTempo(parseFloat(e.target.value))}
            style={{ width: '90px' }}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '30px' }}>{wordTempo.toFixed(1)}s</span>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={highlightOnly} onChange={e => setHighlightOnly(e.target.checked)} />
          Nur Highlighting
        </label>
        {playingVerse && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button onClick={handlePauseResume} style={{
              padding: '3px 10px', borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-gold-bg)', border: '1px solid var(--accent-gold)',
              color: 'var(--accent-gold)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
            }}>
              {isPaused ? 'Weiter' : 'Pause'}
            </button>
            <button onClick={stopPlayback} style={{
              padding: '3px 10px', borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-input)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem',
            }}>
              Stop
            </button>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-teal)' }}>
              Vers {playingVerse} — Wort {highlightedWordIndex + 1}
            </span>
            {audioSource && (
              <span style={{
                fontSize: '0.65rem', padding: '1px 6px', borderRadius: 'var(--radius-sm)',
                background: audioSource === 'speech' ? 'var(--accent-gold-bg)' : audioSource === 'cache' ? 'var(--correct-bg)' : 'var(--bg-input)',
                border: `1px solid ${audioSource === 'speech' ? 'var(--accent-gold)' : audioSource === 'cache' ? 'var(--correct)' : 'var(--border)'}`,
                color: audioSource === 'speech' ? 'var(--accent-gold)' : audioSource === 'cache' ? 'var(--correct)' : 'var(--text-muted)',
              }}>
                {audioSource === 'cache' ? 'Cache' : audioSource === 'network' ? 'Netzwerk' : audioSource === 'speech' ? 'Sprachsynthese' : ''}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main text area */}
      <div ref={textRef} style={{
        flex: 1, overflow: 'auto', padding: '24px 32px',
        direction: 'rtl', textAlign: 'right', lineHeight: 2.4,
        fontSize: `${fontSize}px`, fontFamily: 'var(--font-arabic)',
        color: 'var(--arabic-text)',
      }}>
        {displayedVerses.map(verse => {
          const layerText = getReaderVerseText(activeLayer, surah, verse.number, verse.text, layerMap)
          const words = splitIntoWords(layerText)
          const origWords = activeLayer !== 'simple' ? splitIntoWords(verse.text) : words
          const isPlaying = playingVerse === verse.number

          return (
            <div key={verse.number} style={{ display: 'inline', position: 'relative' }}>
              {/* Play button per verse */}
              <span
                onClick={() => handlePlayVerse(verse.number)}
                title={isPlaying ? 'Stop' : 'Vers abspielen'}
                style={{
                  display: 'inline-block', cursor: 'pointer',
                  fontSize: '0.4em', verticalAlign: 'middle',
                  fontFamily: 'var(--font-ui)', direction: 'ltr',
                  margin: '0 6px 0 2px',
                  padding: '1px 5px', borderRadius: '3px',
                  background: isPlaying ? 'var(--accent-teal-bg)' : 'var(--bg-input)',
                  border: isPlaying ? '1px solid var(--accent-teal)' : '1px solid var(--border)',
                  color: isPlaying ? 'var(--accent-teal)' : 'var(--text-muted)',
                  transition: 'all 0.15s',
                }}
              >
                {isPlaying ? '\u25A0' : '\u25B6'}
              </span>

              {showNumbers && (
                <span style={{
                  fontSize: '0.5em', color: 'var(--text-muted)', verticalAlign: 'super',
                  fontFamily: 'var(--font-ui)', direction: 'ltr', margin: '0 4px',
                }}>
                  {verse.number}
                </span>
              )}
              {words.map((word, wi) => {
                const isHighlighted = isPlaying && wi === highlightedWordIndex
                const isSelected = selectedWord?.verseNum === verse.number && selectedWord?.wordIdx === wi
                const origWord = origWords[wi] || word
                // Adaptive layer: strip vocalization from known, non-ambiguous words
                const displayWord = activeLayer === 'adaptive' ? adaptiveStripWord(word, knownRoots, consonantalRootLookup) : word
                const isStripped = activeLayer === 'adaptive' && displayWord !== word

                return (
                  <span key={wi}>
                    <span
                      className="arabic"
                      onClick={() => handleWordClick(origWord, verse.number, wi)}
                      style={{
                        cursor: 'pointer', padding: '2px 1px', borderRadius: '3px',
                        transition: 'background 0.15s',
                        background: isHighlighted
                          ? 'rgba(0, 188, 212, 0.25)'
                          : isSelected
                            ? 'var(--accent-teal-bg)'
                            : 'transparent',
                        boxShadow: isHighlighted ? '0 0 0 2px rgba(0, 188, 212, 0.35)' : 'none',
                        opacity: isStripped ? 0.7 : 1,
                      }}
                      onMouseEnter={e => { if (!isSelected && !isHighlighted) e.target.style.background = 'var(--bg-hover)' }}
                      onMouseLeave={e => { if (!isSelected && !isHighlighted) e.target.style.background = 'transparent' }}
                    >
                      {displayWord}
                    </span>
                    {' '}
                  </span>
                )
              })}
              {' '}
            </div>
          )
        })}
      </div>

      {/* Word info panel (bottom) */}
      {selectedWord && (
        <div style={{
          padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)',
          display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap',
        }}>
          <span className="arabic" dir="rtl" style={{ fontSize: '1.8rem', color: 'var(--accent-gold)' }}>
            {selectedWord.word}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {selectedWord.key}
          </span>
          {selectedWord.entry ? (
            <>
              {selectedWord.entry.r && (
                <span style={{ fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Wurzel: </span>
                  <span className="arabic" dir="rtl" style={{ color: 'var(--accent-teal)' }}>
                    {selectedWord.entry.r.replace(/ /g, '-')}
                  </span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>
                    ({transliterateToLatin(selectedWord.entry.r.replace(/ /g, ''))})
                  </span>
                </span>
              )}
              {selectedWord.entry.p && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  POS: {selectedWord.entry.p}
                </span>
              )}
              {selectedWord.entry.m && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {selectedWord.entry.m}
                </span>
              )}
              {selectedWord.entry.v && (
                <span style={{ fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Vokalisiert: </span>
                  <span className="arabic" dir="rtl" style={{ color: 'var(--arabic-text)' }}>
                    {selectedWord.entry.v}
                  </span>
                </span>
              )}
            </>
          ) : (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Keine Morphologiedaten verfügbar
            </span>
          )}
          <button onClick={() => setSelectedWord(null)} style={{
            marginLeft: 'auto', padding: '4px 10px', borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-input)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem',
          }}>X</button>
        </div>
      )}

      {/* Page navigation */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: '12px', padding: '10px',
        borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)',
      }}>
        <button onClick={handlePrevPage} disabled={startVerse <= 1 && surah <= 1}
          style={{
            padding: '6px 20px', borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-input)', border: '1px solid var(--border)',
            color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.9rem',
            opacity: startVerse <= 1 && surah <= 1 ? 0.4 : 1,
          }}>
          Zurück
        </button>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
          Sure {surah}, Verse {startVerse}-{Math.min(startVerse + versesPerPage - 1, totalVerses)}
        </span>
        <button onClick={handleNextPage}
          disabled={startVerse + versesPerPage > totalVerses && surah >= 114}
          style={{
            padding: '6px 20px', borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-teal-bg)', border: '1px solid var(--accent-teal)',
            color: 'var(--accent-teal)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
            opacity: startVerse + versesPerPage > totalVerses && surah >= 114 ? 0.4 : 1,
          }}>
          Weiter
        </button>
      </div>
    </div>
  )
}
