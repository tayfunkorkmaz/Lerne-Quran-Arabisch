import { useState, useCallback } from 'react'
import data from '../data/synonym-contrast.json'

const pairs = data.pairs

export default function SynonymContrastDrill() {
  const [mode, setMode] = useState('learn')
  const [learnIdx, setLearnIdx] = useState(0)
  const [drillPair, setDrillPair] = useState(null)
  const [drillExIdx, setDrillExIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  const activeBtn = { padding: '6px 16px', borderRadius: 6, border: '2px solid var(--accent-teal)', background: 'rgba(45,212,191,0.1)', color: 'var(--accent-teal)', cursor: 'pointer', fontWeight: 600 }
  const inactiveBtn = { padding: '6px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-secondary)', cursor: 'pointer' }
  const cardStyle = { background: 'var(--card-bg)', borderRadius: 12, padding: 16, marginBottom: 10, border: '1px solid var(--border)' }
  const arabicStyle = { fontFamily: 'var(--font-arabic)', fontSize: '1.4rem', direction: 'rtl', unicodeBidi: 'bidi-override' }

  function getWords(pair) {
    const words = [pair.wordA, pair.wordB]
    if (pair.wordC) words.push(pair.wordC)
    return words
  }

  function findCorrectWord(pair, exercise) {
    const words = getWords(pair)
    const arabicText = exercise.arabic
    for (const w of words) {
      const root = w.arabic.replace(/[\u064E\u064F\u0650\u0651\u0652\u064B\u064C\u064D\u0670]/g, '')
      if (arabicText.includes(root) || arabicText.includes(w.arabic)) {
        return w.arabic
      }
    }
    // Fallback: check root letters in question/answer text
    for (const w of words) {
      if (exercise.answer && exercise.answer.includes(w.arabic)) return w.arabic
      if (exercise.question && exercise.question.includes(w.arabic)) return w.arabic
    }
    // Final fallback: use the word whose meaning best matches the exercise answer
    if (exercise.answer) {
      for (const w of words) {
        if (exercise.answer.includes(w.meaning)) return w.arabic
      }
    }
    return words[0]?.arabic || null
  }

  const pickRandom = useCallback(() => {
    if (!pairs || pairs.length === 0) return
    const pair = pairs[Math.floor(Math.random() * pairs.length)]
    if (!pair || !pair.exercises || pair.exercises.length === 0) return
    const exIdx = Math.floor(Math.random() * pair.exercises.length)
    setDrillPair(pair)
    setDrillExIdx(exIdx)
    setSelected(null)
    setRevealed(false)
  }, [])

  function startDrill() {
    setMode('drill')
    pickRandom()
  }

  function check(wordArabic) {
    setSelected(wordArabic)
    setRevealed(true)
    const correct = findCorrectWord(drillPair, drillPair.exercises[drillExIdx])
    setScore(s => ({
      correct: s.correct + (wordArabic === correct ? 1 : 0),
      total: s.total + 1
    }))
  }

  // Learn mode
  if (mode === 'learn') {
    const pair = pairs[learnIdx]
    if (!pair) return null
    const words = getWords(pair)
    return (
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h3 style={{ color: 'var(--accent-gold)', marginBottom: 4 }}>Synonym-Kontrast</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setMode('learn')} style={activeBtn}>Lernen</button>
          <button onClick={startDrill} style={inactiveBtn}>Drill</button>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>
          Bedeutungsnuancen bei Synonymen im Quran: Warum steht genau dieses Wort und nicht das andere?
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          <button onClick={() => setLearnIdx(Math.max(0, learnIdx - 1))} disabled={learnIdx === 0} style={{ ...inactiveBtn, opacity: learnIdx === 0 ? 0.4 : 1 }}>&#8592;</button>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{learnIdx + 1} / {pairs.length}</span>
          <button onClick={() => setLearnIdx(Math.min(pairs.length - 1, learnIdx + 1))} disabled={learnIdx === pairs.length - 1} style={{ ...inactiveBtn, opacity: learnIdx === pairs.length - 1 ? 0.4 : 1 }}>&#8594;</button>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
            {words.map((w, i) => (
              <div key={i} style={{ flex: 1, minWidth: 140, padding: 10, background: 'rgba(0,0,0,0.1)', borderRadius: 8, textAlign: 'center' }}>
                <div dir="rtl" style={{ ...arabicStyle, color: 'var(--accent-gold)', marginBottom: 4 }}>{w.arabic}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 2 }}>{w.root}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{w.meaning}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: 12, background: 'rgba(45,212,191,0.06)', borderRadius: 8, border: '1px solid rgba(45,212,191,0.2)' }}>
            <div style={{ fontWeight: 600, color: 'var(--accent-teal)', fontSize: '0.85rem', marginBottom: 4 }}>Kontrast:</div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.6 }}>{pair.contrast}</div>
          </div>
        </div>

        {pair.exercises.map((ex, i) => (
          <div key={i} style={{ ...cardStyle, borderLeft: '3px solid var(--accent-teal)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{ex.ref}</div>
            <div dir="rtl" style={{ ...arabicStyle, color: 'var(--text)', marginBottom: 8, lineHeight: 2 }}>{ex.arabic}</div>
            {ex.question && (
              <div style={{ fontSize: '0.9rem', color: 'var(--accent-gold)', fontWeight: 600, marginBottom: 4 }}>{ex.question}</div>
            )}
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ex.answer}</div>
          </div>
        ))}
      </div>
    )
  }

  // Drill mode
  if (!drillPair) { pickRandom(); return null }
  const ex = drillPair.exercises?.[drillExIdx]
  if (!ex) { pickRandom(); return null }
  const words = getWords(drillPair)
  const correct = findCorrectWord(drillPair, ex)
  const isCorrect = selected === correct

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h3 style={{ color: 'var(--accent-gold)', marginBottom: 4 }}>Synonym-Kontrast</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setMode('learn')} style={inactiveBtn}>Lernen</button>
        <button onClick={startDrill} style={activeBtn}>Drill</button>
        <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          {score.correct}/{score.total} richtig
        </span>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{ex.ref}</div>
        <div dir="rtl" style={{ ...arabicStyle, color: 'var(--text)', marginBottom: 16, lineHeight: 2, background: 'rgba(0,0,0,0.15)', padding: 12, borderRadius: 8 }}>
          {ex.arabic}
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--text)', marginBottom: 12 }}>
          Welches Synonym wird in diesem Vers verwendet und warum?
        </p>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {words.map((w, i) => {
            let bg = 'var(--card-bg)'
            let border = '1px solid var(--border)'
            let color = 'var(--text)'
            if (revealed) {
              if (w.arabic === correct) { bg = 'rgba(16,185,129,0.15)'; border = '2px solid #10b981'; color = '#10b981' }
              else if (w.arabic === selected) { bg = 'rgba(239,68,68,0.15)'; border = '2px solid #ef4444'; color = '#ef4444' }
            } else if (w.arabic === selected) {
              border = '2px solid var(--accent-teal)'
            }
            return (
              <button key={i} onClick={() => !revealed && check(w.arabic)} disabled={revealed} style={{ flex: 1, minWidth: 120, textAlign: 'center', padding: '12px 14px', borderRadius: 8, border, background: bg, cursor: revealed ? 'default' : 'pointer' }}>
                <div dir="rtl" style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.3rem', color, marginBottom: 2 }}>{w.arabic}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{w.meaning}</div>
              </button>
            )
          })}
        </div>

        {revealed && (
          <div style={{ marginTop: 10, padding: 12, borderRadius: 8, background: isCorrect ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${isCorrect ? '#10b981' : '#ef4444'}` }}>
            <div style={{ fontWeight: 600, color: isCorrect ? '#10b981' : '#ef4444', marginBottom: 6 }}>
              {isCorrect ? 'Richtig!' : 'Falsch.'}
            </div>
            {ex.question && (
              <div style={{ fontSize: '0.88rem', color: 'var(--text)', fontWeight: 600, marginBottom: 4 }}>{ex.question}</div>
            )}
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ex.answer}</div>
            <div style={{ marginTop: 10, padding: 10, background: 'rgba(0,0,0,0.1)', borderRadius: 6, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <span style={{ fontWeight: 600, color: 'var(--accent-teal)' }}>Kontrast: </span>{drillPair.contrast}
            </div>
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
