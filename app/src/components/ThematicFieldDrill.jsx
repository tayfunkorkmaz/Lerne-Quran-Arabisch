import { useState } from 'react'
import data from '../data/thematic-fields.json'

const fields = data.fields

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

function generateFieldDrill() {
  if (!fields || fields.length === 0) return { root: null, correctField: null, options: [] }
  // Pick a random field, then a random root from it
  const fieldIdx = Math.floor(Math.random() * fields.length)
  const field = fields[fieldIdx]
  if (!field.roots || field.roots.length === 0) return { root: null, correctField: field, options: [field] }
  const root = field.roots[Math.floor(Math.random() * field.roots.length)]

  // Pick 3 distractor fields
  const otherFields = fields.filter((_, i) => i !== fieldIdx)
  const distractors = shuffle(otherFields).slice(0, 3)
  const options = shuffle([field, ...distractors])

  return { root, correctField: field, options }
}

function generateWriteDrill() {
  const field = fields[Math.floor(Math.random() * fields.length)]
  return { field, expectedRoots: field.roots }
}

export default function ThematicFieldDrill() {
  const [mode, setMode] = useState('learn')
  const [drillType, setDrillType] = useState('identify') // 'identify' | 'write'
  const [learnFieldIdx, setLearnFieldIdx] = useState(0)
  const [drill, setDrill] = useState(() => generateFieldDrill())
  const [writeDrill, setWriteDrill] = useState(() => generateWriteDrill())
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [userInput, setUserInput] = useState('')
  const [writeResults, setWriteResults] = useState(null)

  const currentField = fields[learnFieldIdx]
  if (!currentField) return null

  function check() {
    if (selected === null) return
    setRevealed(true)
    setScore(s => ({
      correct: s.correct + (selected === drill.correctField.id ? 1 : 0),
      total: s.total + 1
    }))
  }

  function next() {
    setDrill(generateFieldDrill())
    setSelected(null)
    setRevealed(false)
  }

  function checkWrite() {
    const userRoots = userInput.split(/[,،\n]+/).map(s => normalize(s.trim())).filter(Boolean)
    const expectedNorm = writeDrill.expectedRoots.map(r => normalize(r.root))
    const matches = userRoots.filter(ur => ur.length >= 2 && expectedNorm.some(er => er === ur || (ur.length >= 3 && er.includes(ur))))
    const uniqueMatches = [...new Set(matches)]

    setWriteResults({
      found: uniqueMatches.length,
      total: writeDrill.expectedRoots.length,
      userCount: userRoots.length
    })
    setRevealed(true)
    setScore(s => ({
      correct: s.correct + (uniqueMatches.length > 0 ? 1 : 0),
      total: s.total + 1
    }))
  }

  function nextWrite() {
    setWriteDrill(generateWriteDrill())
    setUserInput('')
    setWriteResults(null)
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
        <h3 style={{ color: 'var(--accent-gold)', marginBottom: 4 }}>Thematische Wortfelder</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setMode('learn')} style={btnActive}>Lernen</button>
          <button onClick={() => { setMode('drill'); setDrillType('identify') }} style={btnInactive}>Zuordnen</button>
          <button onClick={() => { setMode('drill'); setDrillType('write') }} style={btnInactive}>Schreiben</button>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 12 }}>
          {data.meta.totalFields} Felder mit {data.meta.totalRoots} Wurzeln. Feld {learnFieldIdx + 1} von {fields.length}.
        </p>

        <div style={cardStyle}>
          <h4 style={{ color: 'var(--accent-gold)', marginBottom: 8, fontSize: '1.1rem' }}>{currentField.title}</h4>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 12 }}>{currentField.roots.length} Wurzeln</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 6 }}>
            {currentField.roots.map((r, i) => (
              <div key={i} style={{ background: 'var(--bg)', borderRadius: 8, padding: '8px 12px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                  <span dir="rtl" style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.1rem', color: 'var(--accent-teal)', fontWeight: 600 }}>{r.root}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.transliteration}</span>
                  {r.count && <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{r.count}</span>}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text)' }}>
                  {r.keyWords.map((w, j) => (
                    <span key={j} dir="rtl" style={{ fontFamily: 'var(--font-arabic)', marginRight: 8 }}>{w}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={() => setLearnFieldIdx(Math.max(0, learnFieldIdx - 1))} disabled={learnFieldIdx === 0} style={{ ...btnInactive, opacity: learnFieldIdx === 0 ? 0.4 : 1 }}>Zurück</button>
          <button onClick={() => setLearnFieldIdx(Math.min(fields.length - 1, learnFieldIdx + 1))} disabled={learnFieldIdx >= fields.length - 1} style={{ ...btnInactive, opacity: learnFieldIdx >= fields.length - 1 ? 0.4 : 1 }}>Weiter</button>
        </div>
      </div>
    )
  }

  // Drill mode: identify
  if (drillType === 'identify') {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <h3 style={{ color: 'var(--accent-gold)', marginBottom: 4 }}>Thematische Wortfelder — Zuordnen</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setMode('learn')} style={btnInactive}>Lernen</button>
          <button onClick={() => setDrillType('identify')} style={btnActive}>Zuordnen</button>
          <button onClick={() => { setDrillType('write'); setRevealed(false) }} style={btnInactive}>Schreiben</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Punkte: {score.correct}/{score.total}
            {score.total > 0 && <span> ({Math.round(score.correct / score.total * 100)}%)</span>}
          </div>
          <button onClick={resetScore} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}>Reset</button>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Zu welchem Wortfeld gehört diese Wurzel?</div>

          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <span dir="rtl" style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.8rem', color: 'var(--accent-gold)' }}>{drill.root.root}</span>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>{drill.root.transliteration}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text)', marginTop: 4 }}>
              {drill.root.keyWords.map((w, j) => (
                <span key={j} dir="rtl" style={{ fontFamily: 'var(--font-arabic)', marginRight: 8 }}>{w}</span>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            {drill.options.map((f, i) => {
              let bg = 'var(--bg)'
              let borderColor = 'var(--border)'
              if (revealed) {
                if (f.id === drill.correctField.id) {
                  bg = 'rgba(34,197,94,0.15)'
                  borderColor = '#22c55e'
                } else if (f.id === selected) {
                  bg = 'rgba(239,68,68,0.15)'
                  borderColor = '#ef4444'
                }
              } else if (f.id === selected) {
                bg = 'rgba(45,212,191,0.15)'
                borderColor = 'var(--accent-teal)'
              }

              return (
                <button
                  key={i}
                  onClick={() => !revealed && setSelected(f.id)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 8,
                    border: `2px solid ${borderColor}`,
                    background: bg,
                    color: 'var(--text)',
                    cursor: revealed ? 'default' : 'pointer',
                    fontSize: '0.9rem',
                    textAlign: 'center'
                  }}
                >
                  {f.title}
                </button>
              )
            })}
          </div>

          {revealed && (
            <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 12, border: '1px solid var(--border)', marginBottom: 8 }}>
              {selected === drill.correctField.id
                ? <span style={{ color: '#22c55e', fontWeight: 600 }}>Richtig!</span>
                : <span style={{ color: '#ef4444', fontWeight: 600 }}>Falsch. Richtig: {drill.correctField.title}</span>
              }
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

  // Drill mode: write roots for a given field
  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h3 style={{ color: 'var(--accent-gold)', marginBottom: 4 }}>Thematische Wortfelder — Schreiben</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setMode('learn')} style={btnInactive}>Lernen</button>
        <button onClick={() => { setDrillType('identify'); setRevealed(false) }} style={btnInactive}>Zuordnen</button>
        <button onClick={() => setDrillType('write')} style={btnActive}>Schreiben</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Punkte: {score.correct}/{score.total}
          {score.total > 0 && <span> ({Math.round(score.correct / score.total * 100)}%)</span>}
        </div>
        <button onClick={resetScore} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}>Reset</button>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
          Schreibe Wurzeln, die zu diesem Feld gehören (kommagetrennt):
        </div>
        <h4 style={{ color: 'var(--accent-gold)', marginBottom: 12, fontSize: '1.1rem' }}>{writeDrill.field.title}</h4>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
          {writeDrill.expectedRoots.length} Wurzeln in diesem Feld
        </div>

        <textarea
          value={userInput}
          onChange={e => setUserInput(e.target.value)}
          disabled={revealed}
          dir="rtl"
          placeholder="ع ب د، ص ل و، ..."
          style={{
            width: '100%',
            minHeight: 80,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--text)',
            fontFamily: 'var(--font-arabic)',
            fontSize: '1.2rem',
            resize: 'vertical',
            boxSizing: 'border-box'
          }}
        />

        {revealed && writeResults && (
          <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 12, border: '1px solid var(--border)', marginTop: 8, marginBottom: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, color: writeResults.found > 0 ? '#22c55e' : '#ef4444' }}>
              {writeResults.found} von {writeResults.total} Wurzeln erkannt (du hast {writeResults.userCount} eingegeben)
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Alle Wurzeln in diesem Feld:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {writeDrill.expectedRoots.map((r, i) => (
                <span key={i} dir="rtl" style={{ fontFamily: 'var(--font-arabic)', fontSize: '1rem', background: 'var(--card-bg)', padding: '2px 8px', borderRadius: 6, border: '1px solid var(--border)' }}>
                  {r.root}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {!revealed
            ? <button onClick={checkWrite} disabled={!userInput.trim()} style={{ ...btnActive, opacity: !userInput.trim() ? 0.4 : 1 }}>Prüfen</button>
            : <button onClick={nextWrite} style={btnActive}>Nächstes Feld</button>
          }
        </div>
      </div>
    </div>
  )
}
