import { useState } from 'react'
import data from '../data/polysemy-drill.json'

const entries = data.entries

export default function PolysemyDrill() {
  const [mode, setMode] = useState('learn')
  const [learnIdx, setLearnIdx] = useState(0)
  const [drillEntry, setDrillEntry] = useState(null)
  const [drillExIdx, setDrillExIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  function pickRandom() {
    if (!entries || entries.length === 0) return
    const entry = entries[Math.floor(Math.random() * entries.length)]
    if (!entry || !entry.exercises || entry.exercises.length === 0) return
    const exIdx = Math.floor(Math.random() * entry.exercises.length)
    setDrillEntry(entry)
    setDrillExIdx(exIdx)
    setSelected(null)
    setRevealed(false)
  }

  function startDrill() {
    setMode('drill')
    pickRandom()
  }

  function check(meaning) {
    setSelected(meaning)
    setRevealed(true)
    const ex = drillEntry.exercises[drillExIdx]
    setScore(s => ({
      correct: s.correct + (meaning === ex.correctMeaning ? 1 : 0),
      total: s.total + 1
    }))
  }

  const activeBtn = { padding: '6px 16px', borderRadius: 6, border: '2px solid var(--accent-teal)', background: 'rgba(45,212,191,0.1)', color: 'var(--accent-teal)', cursor: 'pointer', fontWeight: 600 }
  const inactiveBtn = { padding: '6px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-secondary)', cursor: 'pointer' }
  const cardStyle = { background: 'var(--card-bg)', borderRadius: 12, padding: 16, marginBottom: 10, border: '1px solid var(--border)' }
  const arabicStyle = { fontFamily: 'var(--font-arabic)', fontSize: '1.4rem', direction: 'rtl', unicodeBidi: 'bidi-override' }

  if (mode === 'learn') {
    const entry = entries[learnIdx]
    if (!entry) return null
    return (
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <h3 style={{ color: 'var(--accent-gold)', marginBottom: 4 }}>Polysemie-Drill</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setMode('learn')} style={activeBtn}>Lernen</button>
          <button onClick={startDrill} style={inactiveBtn}>Drill</button>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>
          Polyseme Wörter im Quran: ein Wort, mehrere Bedeutungen je nach Kontext.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          <button onClick={() => setLearnIdx(Math.max(0, learnIdx - 1))} disabled={learnIdx === 0} style={{ ...inactiveBtn, opacity: learnIdx === 0 ? 0.4 : 1 }}>&#8592;</button>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{learnIdx + 1} / {entries.length}</span>
          <button onClick={() => setLearnIdx(Math.min(entries.length - 1, learnIdx + 1))} disabled={learnIdx === entries.length - 1} style={{ ...inactiveBtn, opacity: learnIdx === entries.length - 1 ? 0.4 : 1 }}>&#8594;</button>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', marginBottom: 8 }}>
            <span dir="rtl" style={{ ...arabicStyle, color: 'var(--accent-gold)' }}>{entry.word}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>({entry.root})</span>
          </div>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Mögliche Bedeutungen:</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {entry.meanings.map((m, i) => (
                <span key={i} style={{ background: 'rgba(45,212,191,0.1)', color: 'var(--accent-teal)', padding: '2px 10px', borderRadius: 12, fontSize: '0.85rem' }}>{m}</span>
              ))}
            </div>
          </div>
        </div>

        {entry.exercises.map((ex, i) => (
          <div key={i} style={{ ...cardStyle, borderLeft: '3px solid var(--accent-teal)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{ex.ref}</div>
            <div dir="rtl" style={{ ...arabicStyle, color: 'var(--text)', marginBottom: 8, lineHeight: 2 }}>{ex.arabic}</div>
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: 'var(--accent-gold)', fontSize: '0.9rem' }}>Bedeutung hier: </span>
              <span style={{ color: 'var(--text)' }}>{ex.correctMeaning}</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{ex.context}</div>
          </div>
        ))}
      </div>
    )
  }

  // Drill mode — guard against missing data without calling pickRandom in render
  if (!drillEntry || !drillEntry.exercises?.[drillExIdx]) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ marginBottom: 12 }}>Keine Übung geladen.</div>
        <button onClick={pickRandom} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--accent-teal)', color: '#fff', cursor: 'pointer' }}>Neue Übung laden</button>
      </div>
    )
  }
  const ex = drillEntry.exercises[drillExIdx]
  const isCorrect = selected === ex.correctMeaning

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h3 style={{ color: 'var(--accent-gold)', marginBottom: 4 }}>Polysemie-Drill</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setMode('learn')} style={inactiveBtn}>Lernen</button>
        <button onClick={startDrill} style={activeBtn}>Drill</button>
        <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          {score.correct}/{score.total} richtig
        </span>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', marginBottom: 12 }}>
          <span dir="rtl" style={{ ...arabicStyle, color: 'var(--accent-gold)' }}>{drillEntry.word}</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>({drillEntry.root})</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginLeft: 'auto' }}>{ex.ref}</span>
        </div>
        <div dir="rtl" style={{ ...arabicStyle, color: 'var(--text)', marginBottom: 16, lineHeight: 2, background: 'rgba(0,0,0,0.15)', padding: 12, borderRadius: 8 }}>
          {ex.arabic}
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--text)', marginBottom: 12 }}>Welche Bedeutung hat <span dir="rtl" style={{ fontFamily: 'var(--font-arabic)', color: 'var(--accent-gold)' }}>{drillEntry.word}</span> in diesem Vers?</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {drillEntry.meanings.map((m, i) => {
            let bg = 'var(--card-bg)'
            let border = '1px solid var(--border)'
            let color = 'var(--text)'
            if (revealed) {
              if (m === ex.correctMeaning) { bg = 'rgba(16,185,129,0.15)'; border = '2px solid #10b981'; color = '#10b981' }
              else if (m === selected) { bg = 'rgba(239,68,68,0.15)'; border = '2px solid #ef4444'; color = '#ef4444' }
            } else if (m === selected) {
              border = '2px solid var(--accent-teal)'
            }
            return (
              <button key={i} onClick={() => !revealed && check(m)} disabled={revealed} style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 8, border, background: bg, color, cursor: revealed ? 'default' : 'pointer', fontSize: '0.95rem' }}>
                {m}
              </button>
            )
          })}
        </div>

        {revealed && (
          <div style={{ marginTop: 14, padding: 12, borderRadius: 8, background: isCorrect ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${isCorrect ? '#10b981' : '#ef4444'}` }}>
            <div style={{ fontWeight: 600, color: isCorrect ? '#10b981' : '#ef4444', marginBottom: 4 }}>
              {isCorrect ? 'Richtig!' : 'Falsch.'}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{ex.context}</div>
          </div>
        )}
      </div>

      {revealed && (
        <button onClick={pickRandom} style={{ ...activeBtn, marginTop: 8, width: '100%' }}>
          Nächste Frage
        </button>
      )}
    </div>
  )
}
