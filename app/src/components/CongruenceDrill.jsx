import { useState } from 'react'
import data from '../data/congruence-drill.json'

const rules = data.rules
const exercises = data.exercises

function normalize(s) {
  return s.replace(/[\u0610-\u065f\u0670\u06D6-\u06ED]/g, '').replace(/\s+/g, '').toLowerCase()
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getExerciseOptions(ex) {
  if (ex.type === 'fill_blank') return null

  // For non-fill_blank: generate multiple choice from rules (minimum 4 options)
  const correctRule = ex.rule
  const allRuleIds = rules.map(r => r.id)
  let distractors = shuffle(allRuleIds.filter(r => r !== correctRule)).slice(0, 3)
  // Ensure at least 3 distractors — pad with generic labels if too few rules
  while (distractors.length < 3) {
    const pad = `option_${distractors.length + 2}`
    if (!distractors.includes(pad) && pad !== correctRule) distractors.push(pad)
  }
  return shuffle([correctRule, ...distractors])
}

export default function CongruenceDrill() {
  const [mode, setMode] = useState('learn')
  const [exIdx, setExIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [userText, setUserText] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [options, setOptions] = useState(() => exercises.length > 0 ? getExerciseOptions(exercises[0]) : null)

  const ex = exercises[exIdx]
  if (!ex) return null

  function startDrill() {
    if (exercises.length === 0) return
    setExIdx(0)
    setSelected(null)
    setUserText('')
    setRevealed(false)
    setOptions(getExerciseOptions(exercises[0]))
    setMode('drill')
  }

  function check() {
    setRevealed(true)
    let isCorrect = false

    if (ex.type === 'fill_blank') {
      // Lenient comparison: normalize both sides
      const userNorm = normalize(userText)
      const answerNorm = normalize(ex.answer)
      // Check if the user's text matches the core answer (before parenthetical notes)
      const answerParts = ex.answer.split('(')[0].trim()
      const answerPartsNorm = normalize(answerParts)
      isCorrect = userNorm === answerNorm || userNorm === answerPartsNorm
    } else {
      isCorrect = selected === ex.rule
    }

    setScore(s => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1
    }))
  }

  function next() {
    const nextIdx = (exIdx + 1) % exercises.length
    setExIdx(nextIdx)
    setSelected(null)
    setUserText('')
    setRevealed(false)
    setOptions(getExerciseOptions(exercises[nextIdx]))
  }

  function resetScore() {
    setScore({ correct: 0, total: 0 })
  }

  const ruleMap = {}
  rules.forEach(r => { ruleMap[r.id] = r })

  const btnActive = { padding: '6px 16px', borderRadius: 6, border: '2px solid var(--accent-teal)', background: 'rgba(45,212,191,0.1)', color: 'var(--accent-teal)', cursor: 'pointer', fontWeight: 600 }
  const btnInactive = { padding: '6px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-secondary)', cursor: 'pointer' }
  const cardStyle = { background: 'var(--card-bg)', borderRadius: 12, padding: 16, marginBottom: 8, border: '1px solid var(--border)' }

  if (mode === 'learn') {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <h3 style={{ color: 'var(--accent-gold)', marginBottom: 4 }}>Kongruenz-Drill</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setMode('learn')} style={btnActive}>Lernen</button>
          <button onClick={startDrill} style={btnInactive}>Drill</button>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>
          {data.meta.description}
        </p>

        <h4 style={{ color: 'var(--text)', marginBottom: 8 }}>7 Kongruenzregeln</h4>

        {rules.map(r => (
          <div key={r.id} style={cardStyle}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontWeight: 700, color: 'var(--accent-teal)', fontSize: '0.9rem' }}>{r.id}</span>
              <span style={{ color: 'var(--text)', fontSize: '0.9rem' }}>{r.rule}</span>
            </div>
            {r.ref && r.ref !== '—' && (
              <div dir="rtl" style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.4rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                {r.ref}
              </div>
            )}
          </div>
        ))}

        <h4 style={{ color: 'var(--text)', marginTop: 20, marginBottom: 8 }}>Beispiele aus dem Quran</h4>
        {exercises.filter(e => e.type !== 'fill_blank').slice(0, 5).map(e => (
          <div key={e.id} style={cardStyle}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{e.ref} | {e.type} | {e.rule}</div>
            <div dir="rtl" style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.4rem', color: 'var(--text)', marginBottom: 6 }}>{e.arabic}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{e.question}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--accent-teal)' }}>{e.answer}</div>
          </div>
        ))}
      </div>
    )
  }

  // Drill mode
  const isFillBlank = ex.type === 'fill_blank'

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h3 style={{ color: 'var(--accent-gold)', marginBottom: 4 }}>Kongruenz-Drill</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setMode('learn')} style={btnInactive}>Lernen</button>
        <button onClick={() => setMode('drill')} style={btnActive}>Drill</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Aufgabe {exIdx + 1}/{exercises.length} | Punkte: {score.correct}/{score.total}
          {score.total > 0 && <span> ({Math.round(score.correct / score.total * 100)}%)</span>}
        </div>
        <button onClick={resetScore} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}>Reset</button>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
          {isFillBlank ? 'Lückentext' : ex.type.replace('_', ' ')}
          {ex.ref && <span> | {ex.ref}</span>}
        </div>

        {/* Arabic text or prompt */}
        {isFillBlank ? (
          <div dir="rtl" style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.4rem', color: 'var(--text)', marginBottom: 12, background: 'var(--bg)', padding: 12, borderRadius: 8 }}>
            {ex.prompt}
          </div>
        ) : (
          <>
            <div dir="rtl" style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.4rem', color: 'var(--text)', marginBottom: 8 }}>{ex.arabic}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text)', marginBottom: 12 }}>{ex.question}</div>
          </>
        )}

        {/* Answer input */}
        {isFillBlank ? (
          <div style={{ marginBottom: 12 }}>
            <input
              type="text"
              value={userText}
              onChange={e => setUserText(e.target.value)}
              disabled={revealed}
              dir="rtl"
              placeholder="Antwort eingeben..."
              onKeyDown={e => { if (e.key === 'Enter' && !revealed && userText.trim()) check() }}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontFamily: 'var(--font-arabic)',
                fontSize: '1.3rem',
                boxSizing: 'border-box'
              }}
            />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            {options && options.map((ruleId, i) => {
              const rule = ruleMap[ruleId]
              let bg = 'var(--bg)'
              let borderColor = 'var(--border)'
              if (revealed) {
                if (ruleId === ex.rule) {
                  bg = 'rgba(34,197,94,0.15)'
                  borderColor = '#22c55e'
                } else if (ruleId === selected) {
                  bg = 'rgba(239,68,68,0.15)'
                  borderColor = '#ef4444'
                }
              } else if (ruleId === selected) {
                bg = 'rgba(45,212,191,0.15)'
                borderColor = 'var(--accent-teal)'
              }

              return (
                <button
                  key={i}
                  onClick={() => !revealed && setSelected(ruleId)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: `2px solid ${borderColor}`,
                    background: bg,
                    color: 'var(--text)',
                    cursor: revealed ? 'default' : 'pointer',
                    fontSize: '0.8rem',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--accent-teal)' }}>{ruleId}</span>{' '}
                  {rule ? rule.rule.substring(0, 60) + (rule.rule.length > 60 ? '...' : '') : ruleId}
                </button>
              )
            })}
          </div>
        )}

        {/* Feedback after answer */}
        {revealed && (
          <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 12, border: '1px solid var(--border)', marginBottom: 8 }}>
            {isFillBlank ? (
              <>
                {(() => {
                  const userNorm = normalize(userText)
                  const answerParts = ex.answer.split('(')[0].trim()
                  const answerNorm = normalize(answerParts)
                  const fullNorm = normalize(ex.answer)
                  const isCorrect = userNorm && (userNorm === fullNorm || userNorm === answerNorm || (fullNorm && fullNorm.includes(userNorm)))
                  return isCorrect
                    ? <div style={{ color: '#22c55e', fontWeight: 600, marginBottom: 6 }}>Richtig!</div>
                    : <div style={{ color: '#ef4444', fontWeight: 600, marginBottom: 6 }}>Nicht ganz.</div>
                })()}
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Antwort: </span>
                  <span dir="rtl" style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.2rem', color: 'var(--accent-gold)' }}>{ex.answer}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{ex.explanation}</div>
              </>
            ) : (
              <>
                {selected === ex.rule
                  ? <div style={{ color: '#22c55e', fontWeight: 600, marginBottom: 6 }}>Richtig!</div>
                  : <div style={{ color: '#ef4444', fontWeight: 600, marginBottom: 6 }}>Falsch. Richtige Regel: {ex.rule}</div>
                }
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{ex.answer}</div>
              </>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          {!revealed
            ? <button
                onClick={check}
                disabled={isFillBlank ? !userText.trim() : selected === null}
                style={{ ...btnActive, opacity: (isFillBlank ? !userText.trim() : selected === null) ? 0.4 : 1 }}
              >Prüfen</button>
            : <button onClick={next} style={btnActive}>Nächste Aufgabe</button>
          }
        </div>
      </div>
    </div>
  )
}
