import { useState, useCallback, useMemo } from 'react'
import ArabicKeyboard from './ArabicKeyboard.jsx'
import clozeData from '../data/cloze-exercises.json'

/**
 * ClozeExercise — Lückentexte für arabische Sprachproduktion
 * Quranverse mit einer Lücke: der Lernende füllt das fehlende Wort ein.
 */

const CATEGORIES = [
  { id: 'all', label: 'Alle' },
  { id: 'preposition', label: 'Präpositionen' },
  { id: 'verb', label: 'Verben' },
  { id: 'subject', label: 'Subjekte' },
  { id: 'object', label: 'Objekte' },
  { id: 'particle', label: 'Partikeln' },
  { id: 'pronoun', label: 'Pronomen' },
  { id: 'adjective', label: 'Adjektive' },
  { id: 'root_form', label: 'Verbformen' },
]

const S = {
  page: { padding: '24px 32px', maxWidth: 800, margin: '0 auto', fontFamily: 'var(--font-ui)' },
  backBtn: { background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: 16 },
  card: { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '24px', marginBottom: 16 },
  arabic: { fontFamily: 'var(--font-arabic, "Scheherazade New", serif)', fontSize: '1.6rem', direction: 'rtl', lineHeight: 2, textAlign: 'right' },
  blank: { display: 'inline-block', borderBottom: '3px solid var(--accent)', minWidth: 80, textAlign: 'center', margin: '0 4px' },
  btn: { background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 20px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, margin: '4px' },
  btnSecondary: { background: 'var(--bg-tertiary, var(--bg-secondary))', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 20px', cursor: 'pointer', fontSize: '0.95rem', margin: '4px' },
  progress: { color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16, textAlign: 'right' },
  score: { fontSize: '2.5rem', fontWeight: 700, textAlign: 'center', margin: '24px 0', color: 'var(--accent)' },
  correct: { background: 'var(--success-bg, #e8f5e9)', border: '1px solid var(--success, #4caf50)', borderRadius: 8, padding: '16px 20px', marginTop: 12 },
  wrong: { background: 'var(--error-bg, #fce4ec)', border: '1px solid var(--error, #e53935)', borderRadius: 8, padding: '16px 20px', marginTop: 12 },
  filterBar: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
  filterBtn: { padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-primary)' },
  filterBtnActive: { padding: '6px 14px', borderRadius: 6, border: '1px solid var(--accent)', background: 'var(--accent)', cursor: 'pointer', fontSize: '0.8rem', color: '#fff', fontWeight: 600 },
  input: { fontFamily: 'var(--font-arabic, "Scheherazade New", serif)', fontSize: '1.3rem', direction: 'rtl', textAlign: 'right', padding: '8px 12px', borderRadius: 6, border: '2px solid var(--border)', width: '100%', maxWidth: 300 },
}

function stripDiacriticsForCompare(text) {
  return text
    .replace(/[\u064B-\u0652\u0670\u0657\u0656]/g, '')
    .replace(/\u0671/g, '\u0627') // Alif Wasla → normal Alif
    .trim()
}

export default function ClozeExercise({ onBack }) {
  const allExercises = useMemo(() => clozeData?.exercises || [], [])
  const [category, setCategory] = useState('all')
  const [exerciseIdx, setExerciseIdx] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [showKeyboard, setShowKeyboard] = useState(false)

  const filtered = useMemo(() => {
    if (category === 'all') return allExercises
    return allExercises.filter(e => e.category === category)
  }, [allExercises, category])

  const current = filtered[exerciseIdx]

  const handleCheck = useCallback(() => {
    if (!current || !userInput.trim()) return
    const cleanInput = stripDiacriticsForCompare(userInput)
    const cleanAnswer = stripDiacriticsForCompare(current.missingWord)
    const isCorrect = cleanInput === cleanAnswer
    setFeedback({ correct: isCorrect })
    setScore(prev => ({ correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 }))
  }, [current, userInput])

  const handleNext = useCallback(() => {
    if (exerciseIdx + 1 >= filtered.length) {
      setExerciseIdx(0)
    } else {
      setExerciseIdx(prev => prev + 1)
    }
    setUserInput('')
    setFeedback(null)
  }, [exerciseIdx, filtered.length])

  const handleCategoryChange = useCallback((cat) => {
    setCategory(cat)
    setExerciseIdx(0)
    setUserInput('')
    setFeedback(null)
    setScore({ correct: 0, total: 0 })
  }, [])

  if (!current || !filtered.length) {
    return (
      <div style={S.page}>
        {onBack && <button style={S.backBtn} onClick={onBack}>Zurück</button>}
        <p>Keine Übungen in dieser Kategorie.</p>
      </div>
    )
  }

  return (
    <div style={S.page}>
      {onBack && <button style={S.backBtn} onClick={onBack}>Zurück</button>}
      <h2>Lückentexte</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
        Füge das fehlende Wort ein. Konsonanten genügen — Vokalisierung ist optional.
      </p>

      <div style={S.filterBar}>
        {CATEGORIES.map(c => (
          <button key={c.id}
            style={category === c.id ? S.filterBtnActive : S.filterBtn}
            onClick={() => handleCategoryChange(c.id)}>
            {c.label}
          </button>
        ))}
      </div>

      <div style={S.progress}>{exerciseIdx + 1} / {filtered.length} | Richtig: {score.correct}/{score.total}</div>

      {current && (
        <div style={S.card}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
            {current.ref} — {current.hint}
          </div>
          <div style={S.arabic}>
            {current.blankedVerse}
          </div>

          {!feedback ? (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <input
                  style={S.input}
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  placeholder="Fehlendes Wort..."
                  onKeyDown={e => e.key === 'Enter' && handleCheck()}
                />
                <button style={S.btn} onClick={handleCheck}>Prüfen</button>
              </div>
              <button
                style={{ ...S.btnSecondary, fontSize: '0.8rem' }}
                onClick={() => setShowKeyboard(!showKeyboard)}>
                {showKeyboard ? 'Tastatur ausblenden' : 'Arabische Tastatur'}
              </button>
              {showKeyboard && (
                <div style={{ marginTop: 8 }}>
                  <ArabicKeyboard onInput={(char) => setUserInput(prev => prev + char)} />
                </div>
              )}
            </div>
          ) : (
            <div style={feedback.correct ? S.correct : S.wrong}>
              {feedback.correct ? (
                <p><strong>Richtig!</strong></p>
              ) : (
                <p>
                  <strong>Nicht ganz.</strong> Die richtige Antwort ist:{' '}
                  <span style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.3rem' }}>{current.missingWord}</span>
                </p>
              )}
              <div style={{ marginTop: 12 }}>
                <div style={{ ...S.arabic, fontSize: '1.3rem', color: 'var(--text-secondary)' }}>
                  {current.fullVerse}
                </div>
              </div>
              <button style={{ ...S.btn, marginTop: 12 }} onClick={handleNext}>Weiter</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
