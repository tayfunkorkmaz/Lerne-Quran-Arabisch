import { useState, useCallback, useMemo } from 'react'
import ambiguities from '../data/ambiguities.json'
import { cleanArabicText } from '../utils/arabic.js'

/**
 * AmbiguityExercise: Given a consonantal form, find ALL grammatically valid readings.
 * Pure linguistic approach — ambiguity is a structural property of the consonantal text.
 */

const CATEGORY_LABELS = {
  reading_variant: 'Lesevariante',
  active_passive: 'Aktiv/Passiv',
  form_ambiguity: 'Stammform-Ambiguität',
  root_ambiguity: 'Wurzel-Ambiguität',
  case_ambiguity: 'Kasus-Ambiguität',
  pos_ambiguity: 'Wortart-Ambiguität',
}

const CATEGORY_COLORS = {
  reading_variant: 'var(--accent-teal)',
  active_passive: 'var(--accent-gold)',
  form_ambiguity: '#b07aff',
  root_ambiguity: '#ff7a7a',
  case_ambiguity: '#7ac4ff',
  pos_ambiguity: '#7affb0',
}

export default function AmbiguityExercise({ onBack }) {
  const entries = useMemo(() => ambiguities.entries || [], [])
  const [mode, setMode] = useState('guided') // 'guided' | 'free'
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [userInputs, setUserInputs] = useState([])
  const [currentInput, setCurrentInput] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [sessionScore, setSessionScore] = useState({ found: 0, total: 0 })
  const [freeSearch, setFreeSearch] = useState('')
  const [freeEntry, setFreeEntry] = useState(null)
  const [freeNotFound, setFreeNotFound] = useState(false)

  const filtered = useMemo(() => {
    if (categoryFilter === 'all') return entries
    return entries.filter(e => e.category === categoryFilter)
  }, [entries, categoryFilter])

  const current = filtered[currentIdx] || null
  const categories = useMemo(() => {
    const cats = new Set(entries.map(e => e.category))
    return Array.from(cats)
  }, [entries])

  const resetExercise = useCallback(() => {
    setUserInputs([])
    setCurrentInput('')
    setRevealed(false)
  }, [])

  const goTo = useCallback((idx) => {
    setCurrentIdx(Math.max(0, Math.min(idx, filtered.length - 1)))
    resetExercise()
  }, [filtered.length, resetExercise])

  const goRandom = useCallback(() => {
    if (filtered.length <= 1) return
    let r
    do { r = Math.floor(Math.random() * filtered.length) } while (r === currentIdx)
    goTo(r)
  }, [filtered.length, currentIdx, goTo])

  const submitGuess = useCallback(() => {
    if (!currentInput.trim() || !current) return
    const cleaned = cleanArabicText(currentInput.trim())
    const alreadyFound = userInputs.some(u => cleanArabicText(u) === cleaned)
    if (alreadyFound) { setCurrentInput(''); return }

    const isMatch = current.options.some(opt =>
      cleanArabicText(opt.vocalized) === cleaned
    )
    setUserInputs(prev => [...prev, currentInput.trim()])
    if (isMatch) {
      setSessionScore(s => ({ ...s, found: s.found + 1 }))
    }
    setCurrentInput('')
  }, [currentInput, current, userInputs])

  const reveal = useCallback(() => {
    if (!current) return
    const notYetCounted = current.options.length - userInputs.filter(u =>
      current.options.some(opt => cleanArabicText(opt.vocalized) === cleanArabicText(u))
    ).length
    setSessionScore(s => ({ ...s, total: s.total + notYetCounted }))
    setRevealed(true)
  }, [current, userInputs])

  const handleFreeSearch = useCallback(() => {
    if (!freeSearch.trim()) return
    const cleaned = cleanArabicText(freeSearch.trim())
    const found = entries.find(e => cleanArabicText(e.consonants) === cleaned)
    if (found) {
      setFreeEntry(found)
      setFreeNotFound(false)
      setUserInputs([])
      setCurrentInput('')
      setRevealed(false)
    } else {
      setFreeEntry(null)
      setFreeNotFound(true)
    }
  }, [freeSearch, entries])

  const activeEntry = mode === 'guided' ? current : freeEntry

  const matchedOptions = useMemo(() => {
    if (!activeEntry) return new Set()
    const s = new Set()
    for (const u of userInputs) {
      for (const opt of activeEntry.options) {
        if (cleanArabicText(opt.vocalized) === cleanArabicText(u)) {
          s.add(opt.vocalized)
        }
      }
    }
    return s
  }, [activeEntry, userInputs])

  const foundCount = matchedOptions.size
  const totalOptions = activeEntry?.options?.length || 0

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={onBack} style={{
        background: 'none', border: 'none', color: 'var(--text-secondary)',
        cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: '12px',
      }}>Zurück zur Übersicht</button>

      <h2 style={{ marginBottom: '4px' }}>Ambiguitätsübung</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
        Der Konsonantentext lässt an vielen Stellen mehrere grammatisch korrekte Vokalisierungen zu.
        Diese Übung trainiert das Erkennen ALLER möglichen Lesarten.
      </p>

      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
        {[['guided', 'Geführt'], ['free', 'Frei']].map(([m, label]) => (
          <button key={m} onClick={() => { setMode(m); resetExercise() }} style={{
            padding: '8px 20px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
            background: mode === m ? 'var(--accent-teal-bg)' : 'var(--bg-card)',
            color: mode === m ? 'var(--accent-teal)' : 'var(--text-secondary)',
            border: mode === m ? '1px solid var(--accent-teal)' : '1px solid var(--border)',
            fontWeight: mode === m ? 600 : 400,
          }}>{label}</button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
          Gefunden: {sessionScore.found}
        </span>
      </div>

      {/* === GUIDED MODE === */}
      {mode === 'guided' && (
        <>
          {/* Category filter */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '16px',
            padding: '8px', background: 'var(--bg-card)', borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
          }}>
            <button onClick={() => { setCategoryFilter('all'); setCurrentIdx(0); resetExercise() }} style={{
              padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', cursor: 'pointer',
              background: categoryFilter === 'all' ? 'var(--accent-teal-bg)' : 'transparent',
              color: categoryFilter === 'all' ? 'var(--accent-teal)' : 'var(--text-secondary)',
              border: categoryFilter === 'all' ? '1px solid var(--accent-teal)' : '1px solid transparent',
            }}>Alle ({entries.length})</button>
            {categories.map(cat => {
              const count = entries.filter(e => e.category === cat).length
              return (
                <button key={cat} onClick={() => { setCategoryFilter(cat); setCurrentIdx(0); resetExercise() }} style={{
                  padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', cursor: 'pointer',
                  background: categoryFilter === cat ? 'var(--accent-teal-bg)' : 'transparent',
                  color: categoryFilter === cat ? CATEGORY_COLORS[cat] || 'var(--text-secondary)' : 'var(--text-secondary)',
                  border: categoryFilter === cat ? `1px solid ${CATEGORY_COLORS[cat] || 'var(--accent-teal)'}` : '1px solid transparent',
                }}>
                  {CATEGORY_LABELS[cat] || cat} ({count})
                </button>
              )
            })}
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
            <button onClick={() => goTo(currentIdx - 1)} disabled={currentIdx === 0} style={{
              padding: '6px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)',
              opacity: currentIdx === 0 ? 0.4 : 1,
            }}>Zurück</button>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {currentIdx + 1} / {filtered.length}
            </span>
            <button onClick={() => goTo(currentIdx + 1)} disabled={currentIdx >= filtered.length - 1} style={{
              padding: '6px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)',
              opacity: currentIdx >= filtered.length - 1 ? 0.4 : 1,
            }}>Weiter</button>
            <button onClick={goRandom} style={{
              padding: '6px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)',
            }}>Zufällig</button>
          </div>

          {/* Exercise card */}
          {current && <ExerciseCard
            entry={current}
            userInputs={userInputs}
            currentInput={currentInput}
            setCurrentInput={setCurrentInput}
            submitGuess={submitGuess}
            revealed={revealed}
            reveal={reveal}
            foundCount={foundCount}
            totalOptions={totalOptions}
            matchedOptions={matchedOptions}
          />}
        </>
      )}

      {/* === FREE MODE === */}
      {mode === 'free' && (
        <>
          <div style={{
            display: 'flex', gap: '8px', marginBottom: '16px',
            padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <input
              value={freeSearch}
              onChange={e => setFreeSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleFreeSearch()}
              placeholder="Konsonantenform eingeben..."
              dir="rtl"
              className="arabic"
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 'var(--radius)',
                background: 'var(--bg-input)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', fontSize: '1.3rem', textAlign: 'right',
              }}
            />
            <button onClick={handleFreeSearch} style={{
              padding: '10px 20px', borderRadius: 'var(--radius)', cursor: 'pointer',
              background: 'var(--accent-teal-bg)', border: '1px solid var(--accent-teal)',
              color: 'var(--accent-teal)', fontWeight: 600,
            }}>Suchen</button>
          </div>

          {freeNotFound && (
            <div style={{
              padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', color: 'var(--text-secondary)', fontSize: '0.9rem',
            }}>
              Kein bekannter Ambiguitätseintrag für diese Form. Das bedeutet nicht, dass keine
              Ambiguität besteht — nur dass sie nicht in der Datenbank erfasst ist.
            </div>
          )}

          {freeEntry && <ExerciseCard
            entry={freeEntry}
            userInputs={userInputs}
            currentInput={currentInput}
            setCurrentInput={setCurrentInput}
            submitGuess={submitGuess}
            revealed={revealed}
            reveal={reveal}
            foundCount={foundCount}
            totalOptions={totalOptions}
            matchedOptions={matchedOptions}
          />}
        </>
      )}

      {/* Educational note */}
      <div style={{
        marginTop: '24px', padding: '16px', borderRadius: 'var(--radius)',
        background: 'var(--accent-gold-bg)', border: '1px solid var(--accent-gold)',
        fontSize: '0.8rem', lineHeight: 1.7, color: 'var(--text-primary)',
      }}>
        Ambiguität ist kein Defekt des Textes. Sie ist eine strukturelle Eigenschaft des Konsonantentextes.
        In über 95% der Fälle erzwingt der grammatische Kontext eine einzige Lesung. In den
        verbleibenden Fällen sind mehrere Lesungen grammatisch gleich berechtigt.
      </div>
    </div>
  )
}

// ===== Exercise Card Sub-Component =====

function ExerciseCard({ entry, userInputs, currentInput, setCurrentInput, submitGuess, revealed, reveal, foundCount, totalOptions, matchedOptions }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '24px',
    }}>
      {/* Header: consonantal form + location + category */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div className="arabic" dir="rtl" style={{
          fontSize: '2.4rem', color: 'var(--accent-gold)', fontWeight: 600,
        }}>
          {entry.consonants}
        </div>
        <span style={{
          padding: '3px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem',
          background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-muted)',
        }}>
          {entry.location}
        </span>
        <span style={{
          padding: '3px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem',
          background: 'var(--bg-input)', border: `1px solid ${CATEGORY_COLORS[entry.category] || 'var(--border)'}`,
          color: CATEGORY_COLORS[entry.category] || 'var(--text-muted)',
        }}>
          {CATEGORY_LABELS[entry.category] || entry.category}
        </span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {foundCount} von {totalOptions} gefunden
        </span>
      </div>

      {/* Input area */}
      {!revealed && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            value={currentInput}
            onChange={e => setCurrentInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitGuess()}
            placeholder="Vokalisierte Form eingeben..."
            dir="rtl"
            className="arabic"
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 'var(--radius)',
              background: 'var(--bg-input)', border: '1px solid var(--border)',
              color: 'var(--text-primary)', fontSize: '1.2rem', textAlign: 'right',
            }}
          />
          <button onClick={submitGuess} style={{
            padding: '10px 16px', borderRadius: 'var(--radius)', cursor: 'pointer',
            background: 'var(--accent-teal-bg)', border: '1px solid var(--accent-teal)',
            color: 'var(--accent-teal)', fontWeight: 600, fontSize: '0.9rem',
          }}>Prüfen</button>
          <button onClick={reveal} style={{
            padding: '10px 16px', borderRadius: 'var(--radius)', cursor: 'pointer',
            background: 'var(--bg-input)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', fontSize: '0.9rem',
          }}>Auflösung</button>
        </div>
      )}

      {/* User's guesses */}
      {userInputs.length > 0 && !revealed && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
          {userInputs.map((u, i) => {
            const isMatch = entry.options.some(opt => cleanArabicText(opt.vocalized) === cleanArabicText(u))
            return (
              <span key={i} style={{
                padding: '4px 10px', borderRadius: 'var(--radius-sm)',
                background: isMatch ? 'rgba(0,200,150,0.1)' : 'rgba(255,100,100,0.1)',
                border: `1px solid ${isMatch ? 'var(--correct)' : 'var(--wrong)'}`,
                color: isMatch ? 'var(--correct)' : 'var(--wrong)',
                fontSize: '1rem',
              }}>
                <span className="arabic" dir="rtl">{u}</span>
                <span style={{ marginLeft: '6px', fontSize: '0.75rem' }}>{isMatch ? 'Treffer' : 'Nicht in der Liste'}</span>
              </span>
            )
          })}
        </div>
      )}

      {/* Revealed: all options */}
      {revealed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>
            Alle grammatisch möglichen Lesarten ({totalOptions}):
          </h4>
          {entry.options.map((opt, i) => {
            const wasFound = matchedOptions.has(opt.vocalized)
            return (
              <div key={i} style={{
                padding: '12px 16px', background: 'var(--bg-input)',
                borderRadius: 'var(--radius)', border: `1px solid ${wasFound ? 'var(--correct)' : 'var(--border)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  <span className="arabic" dir="rtl" style={{ fontSize: '1.5rem', color: wasFound ? 'var(--correct)' : 'var(--accent-gold)' }}>
                    {opt.vocalized}
                  </span>
                  {wasFound && <span style={{ color: 'var(--correct)', fontSize: '0.8rem', fontWeight: 600 }}>Gefunden</span>}
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-teal)' }}>{opt.form}</span>
                  <span style={{
                    padding: '2px 6px', borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-card)', fontSize: '0.7rem', color: 'var(--text-muted)',
                    border: '1px solid var(--border)',
                  }}>{opt.pos}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                  {opt.root && <span>Wurzel: <span className="arabic" dir="rtl">{opt.root}</span> · </span>}
                  {opt.meaning_de}
                </div>
                {opt.morphology && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{opt.morphology}</div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
