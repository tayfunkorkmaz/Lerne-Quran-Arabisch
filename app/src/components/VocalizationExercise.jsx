import { useState, useCallback, useMemo, useEffect } from 'react'
import quranData from '../data/quran-simple-clean.json'
import { cleanArabicText, splitIntoWords } from '../utils/arabic.js'
import { loadMorphologyDB } from '../utils/lazyData.js'

/**
 * VocalizationExercise: Given consonantal text, derive vocalization grammatically.
 * The learner identifies word type, root, form, syntactic role, and vocalized form.
 * Works with any verse in the Quran (1-114 Suren, dynamische Ayah-Auswahl).
 */

const STARTER_VERSES = [
  { surah: 1, verse: 1, label: '1:1' },
  { surah: 1, verse: 2, label: '1:2' },
  { surah: 1, verse: 3, label: '1:3' },
  { surah: 1, verse: 4, label: '1:4' },
  { surah: 1, verse: 5, label: '1:5' },
  { surah: 1, verse: 6, label: '1:6' },
  { surah: 1, verse: 7, label: '1:7' },
  { surah: 112, verse: 1, label: '112:1' },
  { surah: 112, verse: 2, label: '112:2' },
  { surah: 112, verse: 3, label: '112:3' },
  { surah: 112, verse: 4, label: '112:4' },
  { surah: 2, verse: 2, label: '2:2' },
  { surah: 2, verse: 3, label: '2:3' },
  { surah: 2, verse: 255, label: '2:255' },
  { surah: 96, verse: 1, label: '96:1' },
]

// Pre-compute surah list with verse counts for the selector
const SURAH_LIST = (quranData.surahs || []).map(s => ({
  number: s.number,
  verseCount: s.verses?.length || 0,
}))

const POS_OPTIONS = [
  { id: 'harf', label: 'Partikel (Harf)' },
  { id: 'fi3l', label: 'Verb (Fil)' },
  { id: 'ism', label: 'Nomen/Adjektiv (Ism)' },
]

const ROLE_OPTIONS = [
  { id: 'fail', label: 'Fail (Subjekt)' },
  { id: 'maful', label: "Mafʿul bihi (Objekt)" },
  { id: 'mubtada', label: "Mubtada' (Thema)" },
  { id: 'khabar', label: 'Khabar (Prädikat)' },
  { id: 'jarr', label: 'Jarr wa-Majrur' },
  { id: 'mudaf_ilayhi', label: 'Mudaf ilayhi (Genitiv)' },
  { id: 'sifa', label: 'Sifa (Attribut)' },
  { id: 'hal', label: 'Hal (Zustand)' },
  { id: 'tamyiz', label: 'Tamyiz (Spezifikation)' },
  { id: 'harf', label: 'Harf (Partikel)' },
  { id: 'naib_fail', label: "Naʿib al-Faʿil" },
  { id: 'atf', label: "Atf (Koordination)" },
]

// Lazy-built morphology lookup (populated on first load)
let _morphLookupCache = null
async function ensureMorphLookup() {
  if (_morphLookupCache) return _morphLookupCache
  const morphologyDB = await loadMorphologyDB()
  _morphLookupCache = new Map()
  if (morphologyDB?.words) {
    morphologyDB.words.forEach(entry => {
      if (entry.l) _morphLookupCache.set(entry.l, entry)
    })
  }
  return _morphLookupCache
}

function getMorphEntry(morphLookup, surah, verse, wordIdx) {
  if (!morphLookup) return null
  // Try direct key
  const key = `${surah}:${verse}:${wordIdx + 1}`
  return morphLookup.get(key) || null
}

function getVerseText(surah, verse) {
  const s = quranData.surahs?.find(s => s.number === surah)
  const v = s?.verses?.find(v => v.number === verse)
  return v?.text || ''
}

export default function VocalizationExercise({ onBack }) {
  const [surah, setSurah] = useState(1)
  const [verse, setVerse] = useState(1)
  const [selectedWordIdx, setSelectedWordIdx] = useState(null)
  const [step, setStep] = useState(0) // 0=type, 1=root, 2=form, 3=role, 4=vocalize
  const [answers, setAnswers] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [wordScores, setWordScores] = useState({}) // wordIdx -> { attempted, correct }
  const [rootInput, setRootInput] = useState('')
  const [vocalInput, setVocalInput] = useState('')
  const [morphLookup, setMorphLookup] = useState(null)

  useEffect(() => {
    let cancelled = false
    ensureMorphLookup().then(lookup => { if (!cancelled) setMorphLookup(lookup) })
    return () => { cancelled = true }
  }, [])

  const verseText = useMemo(() => getVerseText(surah, verse), [surah, verse])
  const words = useMemo(() => splitIntoWords(verseText), [verseText])

  const maxVerse = useMemo(() => {
    const s = quranData.surahs?.find(s => s.number === surah)
    return s?.verses?.length || 1
  }, [surah])

  const selectWord = useCallback((idx) => {
    setSelectedWordIdx(idx)
    setStep(0)
    setAnswers({})
    setFeedback(null)
    setRootInput('')
    setVocalInput('')
  }, [])

  const loadVerse = useCallback((s, v) => {
    setSurah(s)
    setVerse(v)
    setSelectedWordIdx(null)
    setStep(0)
    setAnswers({})
    setFeedback(null)
    setWordScores({})
  }, [])

  const morphEntry = useMemo(() => {
    if (selectedWordIdx === null || !morphLookup) return null
    return getMorphEntry(morphLookup, surah, verse, selectedWordIdx)
  }, [surah, verse, selectedWordIdx, morphLookup])

  const checkStep = useCallback((stepId, answer) => {
    const newAnswers = { ...answers, [stepId]: answer }
    setAnswers(newAnswers)

    if (!morphEntry) {
      setFeedback({ correct: false, message: 'Kein Morphologie-Eintrag für dieses Wort in der Datenbank.' })
      return
    }

    let correct = false
    let expected = ''

    switch (stepId) {
      case 'type': {
        const pos = morphEntry.pos || ''
        const isParticle = pos === 'P' || pos === 'CONJ' || pos === 'INTG' || pos === 'NEG' || pos === 'CERT' || pos === 'RES' || pos === 'COND' || pos === 'VOC' || pos === 'EXP' || pos === 'SUP' || pos === 'PREV' || pos === 'RET' || pos === 'INC'
        const isVerb = pos === 'V'
        if (answer === 'harf' && isParticle) correct = true
        else if (answer === 'fi3l' && isVerb) correct = true
        else if (answer === 'ism' && !isParticle && !isVerb) correct = true
        expected = isParticle ? 'Partikel' : isVerb ? 'Verb' : 'Nomen/Adjektiv'
        break
      }
      case 'root': {
        const dbRoot = cleanArabicText((morphEntry.root || '').replace(/ /g, '').replace(/-/g, ''))
        const userRoot = cleanArabicText(answer.replace(/ /g, '').replace(/-/g, ''))
        correct = dbRoot === userRoot
        expected = morphEntry.root || '(keine Wurzel)'
        break
      }
      case 'vocalize': {
        const dbVocalized = cleanArabicText(morphEntry.vocalized || '')
        const userVocalized = cleanArabicText(answer)
        correct = dbVocalized === userVocalized
        // Accept NFC/NFD normalization differences but NOT stripped vowels —
        // the whole point of this exercise is to produce correct vocalization
        if (!correct && answer.trim()) {
          correct = dbVocalized.normalize('NFC') === userVocalized.normalize('NFC')
        }
        expected = morphEntry.vocalized || '(nicht verfügbar)'
        break
      }
      default:
        // form and role: no strict check, just show reference
        correct = true
        expected = morphEntry.morphology || morphEntry.form || ''
    }

    setFeedback({
      correct,
      message: correct
        ? 'Richtig!'
        : `Erwartet: ${expected}`,
      expected,
    })

    if (stepId === 'vocalize' && selectedWordIdx !== null) {
      setWordScores(prev => ({
        ...prev,
        [selectedWordIdx]: { attempted: true, correct },
      }))
    }
  }, [answers, morphEntry, selectedWordIdx])

  const nextStep = useCallback(() => {
    setStep(s => Math.min(s + 1, 4))
    setFeedback(null)
  }, [])

  const totalAttempted = Object.values(wordScores).filter(s => s.attempted).length
  const totalCorrect = Object.values(wordScores).filter(s => s.correct).length

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={onBack} style={{
        background: 'none', border: 'none', color: 'var(--text-secondary)',
        cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: '12px',
      }}>Zurück zur Übersicht</button>

      <h2 style={{ marginBottom: '4px' }}>Vokalisierungsübung</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
        Der Konsonantentext trägt keine Vokalzeichen. Die Vokalisierung wird aus der Grammatik abgeleitet:
        Wortart erkennen — Wurzel extrahieren — Form bestimmen — syntaktische Rolle bestimmen — Kasus und Vokalisation ableiten.
      </p>

      {/* Beliebiger Vers section */}
      <div style={{
        padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', marginBottom: '12px',
      }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-teal)', marginBottom: '8px' }}>
          Beliebiger Vers
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Wähle einen Vers aus dem Quran. Du kannst jeden Vers Wort für Wort analysieren und die Vokalisierung aus der Grammatik ableiten.
        </p>
        <div style={{
          display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap',
        }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sure:</label>
          <select
            value={surah}
            onChange={e => loadVerse(+e.target.value, 1)}
            style={{
              padding: '6px 10px', borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)',
              fontSize: '0.9rem', minWidth: '100px',
            }}
          >
            {SURAH_LIST.map(s => (
              <option key={s.number} value={s.number}>
                {s.number} ({s.verseCount} Verse)
              </option>
            ))}
          </select>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ayah:</label>
          <select
            value={verse}
            onChange={e => loadVerse(surah, +e.target.value)}
            style={{
              padding: '6px 10px', borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)',
              fontSize: '0.9rem', minWidth: '70px',
            }}
          >
            {Array.from({ length: maxVerse }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({maxVerse} Verse)</span>
          {totalAttempted > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--accent-teal)' }}>
              {totalCorrect}/{totalAttempted} Wörter korrekt
            </span>
          )}
        </div>
      </div>

      {/* Quick-start buttons */}
      <div style={{
        padding: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', marginBottom: '16px',
      }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
          Empfohlene Starter-Verse:
        </div>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '4px',
        }}>
          {STARTER_VERSES.map(sv => (
            <button key={sv.label} onClick={() => loadVerse(sv.surah, sv.verse)} style={{
              padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', cursor: 'pointer',
              background: surah === sv.surah && verse === sv.verse ? 'var(--accent-teal-bg)' : 'var(--bg-input)',
              color: surah === sv.surah && verse === sv.verse ? 'var(--accent-teal)' : 'var(--text-muted)',
              border: surah === sv.surah && verse === sv.verse ? '1px solid var(--accent-teal)' : '1px solid var(--border)',
            }}>{sv.label}</button>
          ))}
        </div>
      </div>

      {/* Verse display with clickable words */}
      <div style={{
        padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', marginBottom: '16px',
      }}>
        <div dir="rtl" style={{
          display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center',
          lineHeight: 2.2,
        }}>
          {words.map((word, idx) => {
            const isSelected = selectedWordIdx === idx
            const score = wordScores[idx]
            let borderColor = 'transparent'
            if (score?.correct) borderColor = 'var(--correct)'
            else if (score?.attempted) borderColor = 'var(--wrong)'
            return (
              <button
                key={idx}
                onClick={() => selectWord(idx)}
                className="arabic"
                style={{
                  fontSize: 'var(--arabic-size, 28px)', padding: '4px 8px',
                  background: isSelected ? 'var(--accent-teal-bg)' : 'transparent',
                  color: isSelected ? 'var(--accent-teal)' : 'var(--text-primary)',
                  border: `2px solid ${isSelected ? 'var(--accent-teal)' : borderColor}`,
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {word}
              </button>
            )
          })}
        </div>
        <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Klicke ein Wort an um es zu analysieren
        </div>
      </div>

      {/* Analysis panel */}
      {selectedWordIdx !== null && (
        <div style={{
          padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span className="arabic" dir="rtl" style={{ fontSize: '1.8rem', color: 'var(--accent-gold)' }}>
              {words[selectedWordIdx]}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Wort {selectedWordIdx + 1} / {words.length}
            </span>
            {morphEntry && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                DB: {morphEntry.pos} {morphEntry.root ? `| ${morphEntry.root}` : ''}
              </span>
            )}
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
            {['Wortart', 'Wurzel', 'Form', 'Rolle', 'Vokalisierung'].map((label, i) => (
              <div key={i} style={{
                flex: 1, padding: '6px', textAlign: 'center', borderRadius: 'var(--radius-sm)',
                background: step === i ? 'var(--accent-teal-bg)' : i < step ? 'rgba(0,200,150,0.05)' : 'var(--bg-input)',
                color: step === i ? 'var(--accent-teal)' : i < step ? 'var(--correct)' : 'var(--text-muted)',
                fontSize: '0.75rem', fontWeight: step === i ? 600 : 400,
                border: step === i ? '1px solid var(--accent-teal)' : '1px solid var(--border)',
              }}>{i + 1}. {label}</div>
            ))}
          </div>

          {/* Step content */}
          {step === 0 && (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                Was für ein Wort ist das?
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {POS_OPTIONS.map(opt => (
                  <button key={opt.id} onClick={() => { checkStep('type', opt.id); nextStep() }} style={{
                    flex: 1, padding: '12px', borderRadius: 'var(--radius)', cursor: 'pointer',
                    background: answers.type === opt.id ? 'var(--accent-teal-bg)' : 'var(--bg-input)',
                    border: answers.type === opt.id ? '1px solid var(--accent-teal)' : '1px solid var(--border)',
                    color: answers.type === opt.id ? 'var(--accent-teal)' : 'var(--text-primary)',
                    fontWeight: 500,
                  }}>{opt.label}</button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                Welche Wurzel hat dieses Wort? (3 Konsonanten, z.B. كتب)
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={rootInput}
                  onChange={e => setRootInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { checkStep('root', rootInput); nextStep() } }}
                  placeholder="Wurzel eingeben..."
                  dir="rtl" className="arabic"
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 'var(--radius)',
                    background: 'var(--bg-input)', border: '1px solid var(--border)',
                    color: 'var(--text-primary)', fontSize: '1.2rem', textAlign: 'right',
                  }}
                />
                <button onClick={() => { checkStep('root', rootInput); nextStep() }} style={{
                  padding: '10px 16px', borderRadius: 'var(--radius)', cursor: 'pointer',
                  background: 'var(--accent-teal-bg)', border: '1px solid var(--accent-teal)',
                  color: 'var(--accent-teal)', fontWeight: 600,
                }}>Weiter</button>
                <button onClick={nextStep} style={{
                  padding: '10px 16px', borderRadius: 'var(--radius)', cursor: 'pointer',
                  background: 'var(--bg-input)', border: '1px solid var(--border)',
                  color: 'var(--text-muted)', fontSize: '0.85rem',
                }}>Überspringen</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                Welche Form/Muster hat das Wort? (z.B. Form I, Form IV, Faʿil-Partizip, Fiʿal-Muster)
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  placeholder="Form eingeben (optional)..."
                  onKeyDown={e => { if (e.key === 'Enter') nextStep() }}
                  onChange={e => setAnswers(a => ({ ...a, form: e.target.value }))}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 'var(--radius)',
                    background: 'var(--bg-input)', border: '1px solid var(--border)',
                    color: 'var(--text-primary)', fontSize: '0.95rem',
                  }}
                />
                <button onClick={nextStep} style={{
                  padding: '10px 16px', borderRadius: 'var(--radius)', cursor: 'pointer',
                  background: 'var(--accent-teal-bg)', border: '1px solid var(--accent-teal)',
                  color: 'var(--accent-teal)', fontWeight: 600,
                }}>Weiter</button>
              </div>
              {morphEntry?.morphology && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Referenz: {morphEntry.morphology}
                </p>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                Welche syntaktische Rolle spielt dieses Wort?
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {ROLE_OPTIONS.map(opt => (
                  <button key={opt.id} onClick={() => { setAnswers(a => ({ ...a, role: opt.id })); nextStep() }} style={{
                    padding: '8px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    background: 'var(--bg-input)', border: '1px solid var(--border)',
                    color: 'var(--text-primary)', fontSize: '0.8rem',
                  }}>{opt.label}</button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                Wie lautet die vokalisierte Form dieses Wortes?
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={vocalInput}
                  onChange={e => setVocalInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') checkStep('vocalize', vocalInput) }}
                  placeholder="Vokalisierte Form..."
                  dir="rtl" className="arabic"
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 'var(--radius)',
                    background: 'var(--bg-input)', border: '1px solid var(--border)',
                    color: 'var(--text-primary)', fontSize: '1.3rem', textAlign: 'right',
                  }}
                />
                <button onClick={() => checkStep('vocalize', vocalInput)} style={{
                  padding: '10px 16px', borderRadius: 'var(--radius)', cursor: 'pointer',
                  background: 'var(--accent-teal-bg)', border: '1px solid var(--accent-teal)',
                  color: 'var(--accent-teal)', fontWeight: 600,
                }}>Prüfen</button>
              </div>
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <div style={{
              marginTop: '12px', padding: '12px', borderRadius: 'var(--radius)',
              background: feedback.correct ? 'rgba(0,200,150,0.08)' : 'rgba(255,100,100,0.08)',
              border: `1px solid ${feedback.correct ? 'var(--correct)' : 'var(--wrong)'}`,
              color: feedback.correct ? 'var(--correct)' : 'var(--wrong)',
              fontSize: '0.9rem',
            }}>
              {feedback.message}
              {morphEntry?.vocalized && step === 4 && (
                <span className="arabic" dir="rtl" style={{
                  marginLeft: '12px', fontSize: '1.2rem', color: 'var(--accent-gold)',
                }}>
                  {morphEntry.vocalized}
                </span>
              )}
              {morphEntry?.meaning_de && step === 4 && (
                <span style={{ marginLeft: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  — {morphEntry.meaning_de}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
