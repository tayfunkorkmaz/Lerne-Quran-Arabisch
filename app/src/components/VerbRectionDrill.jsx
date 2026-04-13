import { useState } from 'react'
import data from '../data/verb-rection.json'

const verbs = data.verbs

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickRandom(arr, n, exclude) {
  const filtered = arr.filter(x => x !== exclude)
  const shuffled = shuffle(filtered)
  return shuffled.slice(0, n)
}

const verbsWithMultipleRections = verbs.filter(v => v.rections && v.rections.length >= 2)

function generateDrillItem() {
  const pool = verbsWithMultipleRections.length > 0 ? verbsWithMultipleRections : verbs
  const verb = pool[Math.floor(Math.random() * pool.length)]
  if (!verb.rections || verb.rections.length < 1) {
    return { verb: verbs[0], correctRection: verbs[0].rections[0], options: [verbs[0].rections[0].prep] }
  }
  const correctRection = verb.rections[Math.floor(Math.random() * verb.rections.length)]

  // Collect all unique preps from the entire dataset for distractors
  const allPreps = [...new Set(verbs.flatMap(v => v.rections.map(r => r.prep)))]
  const distractors = pickRandom(allPreps, 3, correctRection.prep)
  const options = shuffle([correctRection.prep, ...distractors])

  return { verb, correctRection, options }
}

export default function VerbRectionDrill() {
  const [mode, setMode] = useState('learn')
  const [learnIdx, setLearnIdx] = useState(0)
  const [learnSearch, setLearnSearch] = useState('')
  const [drill, setDrill] = useState(() => generateDrillItem())
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  const filteredVerbs = learnSearch
    ? verbs.filter(v =>
        v.verb.includes(learnSearch) ||
        v.root.includes(learnSearch) ||
        v.rections.some(r => r.meaning.toLowerCase().includes(learnSearch.toLowerCase()))
      )
    : verbs

  // Clamp index to filtered array bounds
  const clampedIdx = Math.min(learnIdx, Math.max(0, filteredVerbs.length - 1))
  const currentVerb = filteredVerbs.length > 0 ? (filteredVerbs[clampedIdx] || filteredVerbs[0]) : null

  function check() {
    if (selected === null) return
    setRevealed(true)
    setScore(s => ({
      correct: s.correct + (selected === drill.correctRection.prep ? 1 : 0),
      total: s.total + 1
    }))
  }

  function next() {
    setDrill(generateDrillItem())
    setSelected(null)
    setRevealed(false)
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
        <h3 style={{ color: 'var(--accent-gold)', marginBottom: 4 }}>Verb-Rektion</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setMode('learn')} style={btnActive}>Lernen</button>
          <button onClick={() => setMode('drill')} style={btnInactive}>Drill</button>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 12 }}>
          {data.meta.description}
        </p>

        <input
          type="text"
          placeholder="Suche (Verb, Wurzel, Bedeutung)..."
          value={learnSearch}
          onChange={e => { setLearnSearch(e.target.value); setLearnIdx(0) }}
          style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginBottom: 12, fontSize: '0.95rem', boxSizing: 'border-box' }}
        />

        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
          {filteredVerbs.length} Verben gefunden — Verb {Math.min(learnIdx + 1, filteredVerbs.length)} von {filteredVerbs.length}
        </div>

        {currentVerb && (
          <div style={cardStyle}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', marginBottom: 12 }}>
              <span dir="rtl" style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.6rem', color: 'var(--accent-gold)' }}>{currentVerb.verb}</span>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{currentVerb.root}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Form {currentVerb.form}</span>
            </div>

            {currentVerb.rections.map((r, i) => (
              <div key={i} style={{ background: 'var(--bg)', borderRadius: 8, padding: 12, marginBottom: 6, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 4 }}>
                  <span dir="rtl" style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.2rem', color: 'var(--accent-teal)', fontWeight: 600 }}>
                    {r.prep === '—' ? '(transitiv / direkt)' : r.prep}
                  </span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{r.meaning}</span>
                </div>
                <div dir="rtl" style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.4rem', color: 'var(--text)', marginBottom: 4 }}>{r.example}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.ref}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={() => setLearnIdx(Math.max(0, learnIdx - 1))} disabled={learnIdx === 0} style={{ ...btnInactive, opacity: learnIdx === 0 ? 0.4 : 1 }}>Zurück</button>
          <button onClick={() => setLearnIdx(Math.min(filteredVerbs.length - 1, learnIdx + 1))} disabled={learnIdx >= filteredVerbs.length - 1} style={{ ...btnInactive, opacity: learnIdx >= filteredVerbs.length - 1 ? 0.4 : 1 }}>Weiter</button>
        </div>
      </div>
    )
  }

  // Drill mode
  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h3 style={{ color: 'var(--accent-gold)', marginBottom: 4 }}>Verb-Rektion — Drill</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setMode('learn')} style={btnInactive}>Lernen</button>
        <button onClick={() => setMode('drill')} style={btnActive}>Drill</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Punkte: {score.correct}/{score.total}
          {score.total > 0 && <span> ({Math.round(score.correct / score.total * 100)}%)</span>}
        </div>
        <button onClick={resetScore} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}>Reset</button>
      </div>

      <div style={cardStyle}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Welche Präposition regiert dieses Verb in folgender Bedeutung?</div>
          <div dir="rtl" style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.6rem', color: 'var(--accent-gold)', marginBottom: 4 }}>{drill.verb.verb}</div>
          <div style={{ fontSize: '0.95rem', color: 'var(--text)', marginBottom: 8 }}>
            Bedeutung: <strong>{drill.correctRection.meaning}</strong>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          {drill.options.map((opt, i) => {
            let bg = 'var(--bg)'
            let borderColor = 'var(--border)'
            if (revealed) {
              if (opt === drill.correctRection.prep) {
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
                dir="rtl"
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: `2px solid ${borderColor}`,
                  background: bg,
                  color: 'var(--text)',
                  cursor: revealed ? 'default' : 'pointer',
                  fontFamily: 'var(--font-arabic)',
                  fontSize: '1.3rem',
                  textAlign: 'center'
                }}
              >
                {opt === '—' ? '(direkt/transitiv)' : opt}
              </button>
            )
          })}
        </div>

        {revealed && (
          <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 12, border: '1px solid var(--border)', marginBottom: 8 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
              {selected === drill.correctRection.prep
                ? <span style={{ color: '#22c55e', fontWeight: 600 }}>Richtig!</span>
                : <span style={{ color: '#ef4444', fontWeight: 600 }}>Falsch. Richtig: {drill.correctRection.prep === '—' ? '(direkt/transitiv)' : drill.correctRection.prep}</span>
              }
            </div>
            <div dir="rtl" style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.4rem', color: 'var(--text)', marginBottom: 4 }}>
              {drill.correctRection.example}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{drill.correctRection.ref}</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          {!revealed
            ? <button onClick={check} disabled={selected === null} style={{ ...btnActive, opacity: selected === null ? 0.4 : 1 }}>Prüfen</button>
            : <button onClick={next} style={btnActive}>Nächste Frage</button>
          }
        </div>
      </div>
    </div>
  )
}
