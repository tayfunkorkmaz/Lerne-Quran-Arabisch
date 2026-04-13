import { useState } from 'react'
import data from '../data/masdar-drill.json'

const patterns = data.patterns
const exercises = data.exercises

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateOptions(ex) {
  // Build a correct answer label
  let correctLabel
  if (ex.isMasdar) {
    correctLabel = `Masdar${ex.form && ex.form !== '—' ? ' Form ' + ex.form : ''}`
    if (ex.masdarPattern) correctLabel += ` (${ex.masdarPattern})`
  } else {
    correctLabel = `Kein Masdar: ${ex.actualType}`
  }

  // Build 3 distractors
  const distractorPool = []

  if (ex.isMasdar) {
    // Correct is a Masdar — distractors should be non-masdar types and wrong masdar forms
    distractorPool.push(
      'Kein Masdar: Verb',
      'Kein Masdar: Aktivpartizip',
      'Kein Masdar: Nomen',
      'Kein Masdar: Passivpartizip',
      'Kein Masdar: Intensivadjektiv',
      'Kein Masdar: Elativ'
    )
    // Also add wrong masdar forms
    const otherForms = patterns.filter(p => p.form !== ex.form).map(p =>
      `Masdar Form ${p.form}${p.pattern ? ' (' + p.pattern + ')' : ''}`
    )
    distractorPool.push(...otherForms)
  } else {
    // Correct is not a Masdar — distractors should be masdar forms
    const masdarOptions = patterns.map(p =>
      `Masdar Form ${p.form}${p.pattern ? ' (' + p.pattern + ')' : ''}`
    )
    distractorPool.push(...masdarOptions)
    // Also add other non-masdar types
    const nonMasdarTypes = [
      'Kein Masdar: Verb',
      'Kein Masdar: Aktivpartizip',
      'Kein Masdar: Nomen',
      'Kein Masdar: Passivpartizip',
      'Kein Masdar: Intensivadjektiv',
      'Kein Masdar: Elativ'
    ].filter(t => t !== correctLabel)
    distractorPool.push(...nonMasdarTypes)
  }

  const uniqueDistractors = [...new Set(distractorPool)].filter(d => d !== correctLabel)
  const picked = shuffle(uniqueDistractors).slice(0, 3)
  // Ensure at least 1 distractor even if pool was depleted
  const fallbackDistractors = ['Masdar Form I (Grundform)', 'Kein Masdar: Verb', 'Kein Masdar: Aktivpartizip']
  while (picked.length < 3) {
    const fb = fallbackDistractors.find(d => d !== correctLabel && !picked.includes(d))
    if (fb) picked.push(fb)
    else break
  }
  return shuffle([correctLabel, ...picked])
}

export default function MasdarDrill() {
  const [mode, setMode] = useState('learn')
  const [exIdx, setExIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [options, setOptions] = useState(() => exercises.length > 0 ? generateOptions(exercises[0]) : null)

  const ex = exercises[exIdx]
  if (!ex) return null

  function getCorrectLabel(exercise) {
    if (exercise.isMasdar) {
      let label = `Masdar${exercise.form && exercise.form !== '—' ? ' Form ' + exercise.form : ''}`
      if (exercise.masdarPattern) label += ` (${exercise.masdarPattern})`
      return label
    }
    return `Kein Masdar: ${exercise.actualType}`
  }

  const correctLabel = getCorrectLabel(ex)

  function startDrill() {
    if (exercises.length === 0) return
    setExIdx(0)
    setSelected(null)
    setRevealed(false)
    setOptions(generateOptions(exercises[0]))
    setMode('drill')
  }

  function check() {
    if (selected === null) return
    setRevealed(true)
    setScore(s => ({
      correct: s.correct + (selected === correctLabel ? 1 : 0),
      total: s.total + 1
    }))
  }

  function next() {
    const nextIdx = (exIdx + 1) % exercises.length
    setExIdx(nextIdx)
    setSelected(null)
    setRevealed(false)
    setOptions(generateOptions(exercises[nextIdx]))
  }

  function resetScore() {
    setScore({ correct: 0, total: 0 })
  }

  const btnActive = { padding: '6px 16px', borderRadius: 6, border: '2px solid var(--accent-teal)', background: 'rgba(45,212,191,0.1)', color: 'var(--accent-teal)', cursor: 'pointer', fontWeight: 600 }
  const btnInactive = { padding: '6px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-secondary)', cursor: 'pointer' }
  const cardStyle = { background: 'var(--card-bg)', borderRadius: 12, padding: 16, marginBottom: 8, border: '1px solid var(--border)' }

  if (mode === 'learn') {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <h3 style={{ color: 'var(--accent-gold)', marginBottom: 4 }}>Masdar-Drill</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setMode('learn')} style={btnActive}>Lernen</button>
          <button onClick={startDrill} style={btnInactive}>Drill</button>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>
          {data.meta.description}
        </p>

        <h4 style={{ color: 'var(--text)', marginBottom: 8 }}>Masdar-Muster nach Verbform</h4>

        {patterns.map(p => (
          <div key={p.form} style={cardStyle}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontWeight: 700, color: 'var(--accent-teal)', fontSize: '0.95rem', minWidth: 60 }}>Form {p.form}</span>
              {p.pattern && (
                <span dir="rtl" style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.4rem', color: 'var(--accent-gold)' }}>{p.pattern}</span>
              )}
            </div>

            {p.commonMasdars && (
              <div style={{ marginBottom: 6 }}>
                {p.commonMasdars.map((m, i) => (
                  <span key={i} dir="rtl" style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.1rem', color: 'var(--text)', marginRight: 12, display: 'inline-block', marginBottom: 4 }}>{m}</span>
                ))}
              </div>
            )}

            {p.example && (
              <div dir="rtl" style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.2rem', color: 'var(--text)', marginBottom: 4 }}>{p.example}</div>
            )}

            {p.note && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{p.note}</div>
            )}
          </div>
        ))}
      </div>
    )
  }

  // Drill mode
  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h3 style={{ color: 'var(--accent-gold)', marginBottom: 4 }}>Masdar-Drill</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setMode('learn')} style={btnInactive}>Lernen</button>
        <button onClick={() => setMode('drill')} style={btnActive}>Drill</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Aufgabe {exIdx + 1}/{exercises.length} | Punkte: {score.correct}/{score.total}
          {score.total > 0 && <span> ({Math.round((score.correct / score.total) * 100)}%)</span>}
        </div>
        <button onClick={resetScore} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}>Reset</button>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 6 }}>{ex.ref}</div>

        {/* Quran verse with highlighted target */}
        <div dir="rtl" style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.4rem', color: 'var(--text)', marginBottom: 8, lineHeight: 2, background: 'var(--bg)', padding: 12, borderRadius: 8 }}>
          {(() => {
            const parts = ex.arabic.split(ex.targetWord)
            if (parts.length < 2) return ex.arabic
            return parts.map((part, i) => (
              <span key={i}>
                {part}
                {i < parts.length - 1 && (
                  <span style={{ color: 'var(--accent-gold)', fontWeight: 700, textDecoration: 'underline', textDecorationColor: 'var(--accent-teal)', textUnderlineOffset: 6 }}>
                    {ex.targetWord}
                  </span>
                )}
              </span>
            ))
          })()}
        </div>

        <div style={{ fontSize: '0.9rem', color: 'var(--text)', marginBottom: 4 }}>
          Zielwort: <span dir="rtl" style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.2rem', color: 'var(--accent-gold)', fontWeight: 600 }}>{ex.targetWord}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: 8 }}>({ex.root})</span>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
          Ist es ein Masdar? Wenn ja, welche Form? Wenn nein, was ist es?
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          {options.map((opt, i) => {
            let bg = 'var(--bg)'
            let borderColor = 'var(--border)'
            if (revealed) {
              if (opt === correctLabel) {
                bg = 'rgba(34,197,94,0.15)'
                borderColor = '#22c55e'
              } else if (opt === selected) {
                bg = 'rgba(239,68,68,0.15)'
                borderColor = '#ef4444'
              }
            } else if (opt === selected) {
              bg = 'rgba(45,212,191,0.15)'
              borderColor = 'var(--accent-teal)'
            }

            return (
              <button
                key={i}
                onClick={() => !revealed && setSelected(opt)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `2px solid ${borderColor}`,
                  background: bg,
                  color: 'var(--text)',
                  cursor: revealed ? 'default' : 'pointer',
                  fontSize: '0.85rem',
                  textAlign: 'left'
                }}
              >
                {opt}
              </button>
            )
          })}
        </div>

        {revealed && (
          <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 12, border: '1px solid var(--border)', marginBottom: 8 }}>
            {selected === correctLabel
              ? <div style={{ color: '#22c55e', fontWeight: 600, marginBottom: 6 }}>Richtig!</div>
              : <div style={{ color: '#ef4444', fontWeight: 600, marginBottom: 6 }}>Falsch.</div>
            }
            <div style={{ fontSize: '0.85rem', color: 'var(--text)', marginBottom: 4 }}>
              {ex.isMasdar
                ? <span>Masdar Form {ex.form} — Muster: <span dir="rtl" style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.1rem', color: 'var(--accent-gold)' }}>{ex.masdarPattern}</span></span>
                : <span>{ex.actualType}</span>
              }
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{ex.explanation}</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          {!revealed
            ? <button onClick={check} disabled={selected === null} style={{ ...btnActive, opacity: selected === null ? 0.4 : 1 }}>Prüfen</button>
            : <button onClick={next} style={btnActive}>Nächste Aufgabe</button>
          }
        </div>
      </div>
    </div>
  )
}
