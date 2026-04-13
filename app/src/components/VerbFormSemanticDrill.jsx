import { useState, useCallback } from 'react'
import data from '../data/verb-form-semantics.json'

const roots = data.roots
const semanticPatterns = data.semanticPatterns

export default function VerbFormSemanticDrill() {
  const [mode, setMode] = useState('learn')
  const [learnIdx, setLearnIdx] = useState(0)
  const [drillRoot, setDrillRoot] = useState(null)
  const [drillFormIdx, setDrillFormIdx] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [selfCorrect, setSelfCorrect] = useState(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  const activeBtn = { padding: '6px 16px', borderRadius: 6, border: '2px solid var(--accent-teal)', background: 'rgba(45,212,191,0.1)', color: 'var(--accent-teal)', cursor: 'pointer', fontWeight: 600 }
  const inactiveBtn = { padding: '6px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-secondary)', cursor: 'pointer' }
  const cardStyle = { background: 'var(--card-bg)', borderRadius: 12, padding: 16, marginBottom: 10, border: '1px solid var(--border)' }
  const arabicStyle = { fontFamily: 'var(--font-arabic)', fontSize: '1.4rem', direction: 'rtl', unicodeBidi: 'bidi-override' }

  const pickRandom = useCallback(() => {
    // Filter roots that have derived forms (non-Form-I) to avoid infinite recursion
    const eligibleRoots = roots.filter(r => r.forms.some(f => f.form !== 'I'))
    if (eligibleRoots.length === 0) return
    const r = eligibleRoots[Math.floor(Math.random() * eligibleRoots.length)]
    const validForms = r.forms.filter(f => f.form !== 'I')
    const fIdx = r.forms.indexOf(validForms[Math.floor(Math.random() * validForms.length)])
    setDrillRoot(r)
    setDrillFormIdx(fIdx)
    setUserAnswer('')
    setRevealed(false)
    setSelfCorrect(null)
  }, [])

  function startDrill() {
    setMode('drill')
    pickRandom()
  }

  function handleReveal() {
    setRevealed(true)
  }

  function handleSelfScore(correct) {
    setSelfCorrect(correct)
    setScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }))
  }

  // Learn mode
  if (mode === 'learn') {
    const root = roots[learnIdx]
    return (
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h3 style={{ color: 'var(--accent-gold)', marginBottom: 4 }}>Verbform-Semantik</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setMode('learn')} style={activeBtn}>Lernen</button>
          <button onClick={startDrill} style={inactiveBtn}>Drill</button>
          <button onClick={() => setMode('patterns')} style={inactiveBtn}>Patterns</button>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>
          Wie sich die Bedeutung einer Wurzel systematisch verändert, wenn sie in verschiedenen Verbformen realisiert wird.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          <button onClick={() => setLearnIdx(Math.max(0, learnIdx - 1))} disabled={learnIdx === 0} style={{ ...inactiveBtn, opacity: learnIdx === 0 ? 0.4 : 1 }}>&#8592;</button>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{learnIdx + 1} / {roots.length}</span>
          <button onClick={() => setLearnIdx(Math.min(roots.length - 1, learnIdx + 1))} disabled={learnIdx === roots.length - 1} style={{ ...inactiveBtn, opacity: learnIdx === roots.length - 1 ? 0.4 : 1 }}>&#8594;</button>
        </div>

        <div style={{ ...cardStyle, borderLeft: '3px solid var(--accent-gold)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-gold)' }}>{root.root}</span>
            <span style={{ color: 'var(--text-secondary)' }}>&mdash; {root.baseMeaning}</span>
          </div>
        </div>

        {root.forms.map((f, i) => (
          <div key={i} style={{ ...cardStyle, borderLeft: f.form === 'I' ? '3px solid var(--accent-teal)' : '3px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontWeight: 600, color: 'var(--accent-teal)', fontSize: '0.85rem', minWidth: 40 }}>Form {f.form}</span>
              <span dir="rtl" style={{ ...arabicStyle, color: 'var(--text)' }}>{f.arabic}</span>
              <span style={{ color: 'var(--text)', fontSize: '0.9rem' }}>&mdash; {f.meaning}</span>
            </div>
            {f.example && f.example !== '—' && (
              <div dir="rtl" style={{ ...arabicStyle, fontSize: '1.15rem', color: 'var(--text-secondary)', marginBottom: 4, lineHeight: 1.9, background: 'rgba(0,0,0,0.1)', padding: '6px 10px', borderRadius: 6 }}>
                {f.example}
              </div>
            )}
            {f.ref && f.ref !== '—' && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 2 }}>{f.ref}</div>
            )}
            {f.note && (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: 4 }}>{f.note}</div>
            )}
          </div>
        ))}
      </div>
    )
  }

  // Patterns view
  if (mode === 'patterns') {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h3 style={{ color: 'var(--accent-gold)', marginBottom: 4 }}>Verbform-Semantik</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setMode('learn')} style={inactiveBtn}>Lernen</button>
          <button onClick={startDrill} style={inactiveBtn}>Drill</button>
          <button onClick={() => setMode('patterns')} style={activeBtn}>Patterns</button>
        </div>

        <h4 style={{ color: 'var(--text)', marginBottom: 12 }}>{semanticPatterns.title}</h4>

        {semanticPatterns.patterns.map((p, i) => (
          <div key={i} style={{ ...cardStyle, borderLeft: '3px solid var(--accent-gold)' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', marginBottom: 6 }}>
              <span dir="rtl" style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.2rem', color: 'var(--accent-gold)' }}>{p.form.split(' ')[1] ? p.form.split(' ')[1].replace('(', '').replace(')', '') : ''}</span>
              <span style={{ fontWeight: 600, color: 'var(--accent-teal)', fontSize: '0.9rem' }}>{p.form.split(' ')[0]}</span>
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4, fontSize: '0.95rem' }}>{p.pattern}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{p.example}</div>
          </div>
        ))}
      </div>
    )
  }

  // Drill mode
  if (!drillRoot) { pickRandom(); return null }
  const form = drillRoot.forms?.[drillFormIdx]
  if (!form) return null

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h3 style={{ color: 'var(--accent-gold)', marginBottom: 4 }}>Verbform-Semantik</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setMode('learn')} style={inactiveBtn}>Lernen</button>
        <button onClick={startDrill} style={activeBtn}>Drill</button>
        <button onClick={() => setMode('patterns')} style={inactiveBtn}>Patterns</button>
        <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          {score.correct}/{score.total} richtig
        </span>
      </div>

      <div style={cardStyle}>
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Wurzel: </span>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-gold)' }}>{drillRoot.root}</span>
          <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>({drillRoot.baseMeaning})</span>
        </div>

        <div style={{ marginBottom: 12, padding: 12, background: 'rgba(0,0,0,0.15)', borderRadius: 8 }}>
          <span style={{ fontWeight: 600, color: 'var(--accent-teal)' }}>Form {form.form}</span>
          <span dir="rtl" style={{ ...arabicStyle, color: 'var(--text)', marginLeft: 12 }}>{form.arabic}</span>
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--text)', marginBottom: 8 }}>
          Wie verschiebt sich die Bedeutung von der Grundform (Form I: {drillRoot.baseMeaning}) zu Form {form.form}?
        </p>

        <textarea
          value={userAnswer}
          onChange={e => setUserAnswer(e.target.value)}
          disabled={revealed}
          placeholder="Bedeutungsverschiebung beschreiben..."
          style={{
            width: '100%', minHeight: 70, padding: 10, borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)',
            fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box'
          }}
        />

        {!revealed && (
          <button onClick={handleReveal} style={{ ...activeBtn, marginTop: 8, width: '100%' }}>
            Antwort zeigen
          </button>
        )}

        {revealed && (
          <div style={{ marginTop: 14 }}>
            <div style={{ padding: 12, borderRadius: 8, background: 'rgba(45,212,191,0.08)', border: '1px solid var(--accent-teal)', marginBottom: 10 }}>
              <div style={{ fontWeight: 600, color: 'var(--accent-teal)', marginBottom: 4 }}>Bedeutung Form {form.form}:</div>
              <div style={{ color: 'var(--text)', fontSize: '0.95rem' }}>{form.meaning}</div>
              {form.note && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: 6 }}>{form.note}</div>
              )}
              {form.example && form.example !== '—' && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{form.ref}</div>
                  <div dir="rtl" style={{ ...arabicStyle, fontSize: '1.15rem', color: 'var(--text)', lineHeight: 1.9 }}>{form.example}</div>
                </div>
              )}
            </div>

            {selfCorrect === null ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', alignSelf: 'center' }}>Selbstbewertung:</span>
                <button onClick={() => handleSelfScore(true)} style={{ ...inactiveBtn, borderColor: '#10b981', color: '#10b981' }}>Richtig</button>
                <button onClick={() => handleSelfScore(false)} style={{ ...inactiveBtn, borderColor: '#ef4444', color: '#ef4444' }}>Falsch</button>
              </div>
            ) : (
              <button onClick={pickRandom} style={{ ...activeBtn, width: '100%' }}>
                Nächste Frage
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
