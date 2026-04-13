import { useState, useCallback, useRef } from 'react'
import alphabetData from '../data/alphabet.json'

/**
 * WritingExercise — Schreibübung für arabische Buchstaben
 * Der Lernende sieht einen Buchstaben und tippt ihn in allen 4 Positionen.
 * Kombiniert visuelle Erkennung mit aktivem Schreiben.
 */

const { letters } = alphabetData

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const MODES = [
  { id: 'name_to_letter', label: 'Name sehen, Buchstabe schreiben', desc: 'Der Name wird gezeigt — tippe den richtigen arabischen Buchstaben' },
  { id: 'letter_to_name', label: 'Buchstabe sehen, Name schreiben', desc: 'Ein arabischer Buchstabe wird gezeigt — schreibe den Namen' },
  { id: 'forms_drill', label: 'Alle 4 Formen schreiben', desc: 'Ein Buchstabenname wird gezeigt — tippe alle 4 Positionen' },
  { id: 'word_writing', label: 'Wort schreiben', desc: 'Eine Transliteration wird gezeigt — schreibe das arabische Wort' },
]

export default function WritingExercise({ onBack }) {
  const [mode, setMode] = useState(null)
  const [queue, setQueue] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const inputRef = useRef(null)

  const startDrill = useCallback((selectedMode) => {
    setMode(selectedMode)
    setQueue(shuffleArray(letters))
    setCurrentIndex(0)
    setUserInput('')
    setFeedback(null)
    setScore({ correct: 0, total: 0 })
  }, [])

  const current = queue[currentIndex]
  const isFinished = currentIndex >= queue.length

  const normalize = (s) => s.replace(/[\u064B-\u0652\u0670]/g, '').replace(/\s+/g, '').trim()

  const checkAnswer = useCallback(() => {
    if (!userInput.trim() || !current) return

    let isCorrect = false
    const input = normalize(userInput)

    if (mode === 'name_to_letter') {
      // User should type the isolated form of the letter
      isCorrect = input === current.forms.isolated ||
        Object.values(current.forms).some(f => normalize(f) === input)
    } else if (mode === 'letter_to_name') {
      // User should type the name
      const answer = userInput.trim().toLowerCase()
      isCorrect = answer === current.name.toLowerCase() ||
        answer === current.transliteration.toLowerCase() ||
        current.name.toLowerCase().startsWith(answer)
    } else if (mode === 'forms_drill') {
      // User should type all 4 forms separated by spaces
      const parts = userInput.trim().split(/[\s,]+/)
      const expected = [current.forms.isolated, current.forms.initial, current.forms.medial, current.forms.final]
      isCorrect = parts.length === expected.length && parts.every((p, i) => {
        return normalize(p) === normalize(expected[i])
      })
    }

    setFeedback({ correct: isCorrect, letter: current })
    setScore(s => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }))
  }, [userInput, current, mode])

  const next = useCallback(() => {
    setCurrentIndex(i => i + 1)
    setUserInput('')
    setFeedback(null)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  // Mode selection
  if (!mode) {
    return (
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: 'var(--text-secondary)',
          cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: '16px',
        }}>Zurück zur Übersicht</button>
        <h2 style={{ marginBottom: '8px' }}>Schreibübung</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
          Aktives Schreiben festigt die Buchstabenerkennung. Wähle einen Modus.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => startDrill(m.id)} style={{
              padding: '16px 20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              cursor: 'pointer', color: 'var(--text-primary)',
            }}>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>{m.label}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{m.desc}</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Results
  if (isFinished) {
    const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0
    return (
      <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
        <h2>Ergebnis — Schreibübung</h2>
        <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--accent-teal)', margin: '24px 0' }}>
          {score.correct} / {score.total}
        </div>
        <p style={{ fontSize: '1.1rem', marginBottom: '24px' }}>
          {pct >= 90 ? 'Ausgezeichnet! Dein Schriftbild sitzt.' :
           pct >= 70 ? 'Gut! Wiederhole die schwierigen Buchstaben.' :
           'Weiter üben. Gehe zurück in den Lernmodus und wiederhole.'}
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={() => startDrill(mode)} style={{
            padding: '10px 20px', borderRadius: 'var(--radius)', cursor: 'pointer',
            background: 'var(--accent-teal)', color: '#fff', border: 'none', fontWeight: 600,
          }}>Erneut versuchen</button>
          <button onClick={() => setMode(null)} style={{
            padding: '10px 20px', borderRadius: 'var(--radius)', cursor: 'pointer',
            background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)',
          }}>Modus wählen</button>
        </div>
      </div>
    )
  }

  // Drill
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <button onClick={() => setMode(null)} style={{
        background: 'none', border: 'none', color: 'var(--text-secondary)',
        cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: '16px',
      }}>Zurück zur Modusauswahl</button>

      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', textAlign: 'right' }}>
        {currentIndex + 1} / {queue.length}
      </div>

      {/* Question */}
      <div style={{
        textAlign: 'center', padding: '32px', marginBottom: '20px',
        background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)',
      }}>
        {mode === 'name_to_letter' && (
          <>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Schreibe diesen Buchstaben:</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{current.name}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{current.transliteration} — {current.sound}</div>
          </>
        )}
        {mode === 'letter_to_name' && (
          <>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Wie heißt dieser Buchstabe?</div>
            <div className="arabic" dir="rtl" style={{ fontSize: '4rem', color: 'var(--accent-gold)' }}>{current.forms.isolated}</div>
          </>
        )}
        {mode === 'forms_drill' && (
          <>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Schreibe alle 4 Formen (isoliert, Anfang, Mitte, Ende):</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{current.name}</div>
          </>
        )}
        {mode === 'word_writing' && (
          <>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Schreibe dieses Wort auf Arabisch:</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{current.exampleTransliteration}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>= {current.exampleMeaning}</div>
          </>
        )}
      </div>

      {/* Input */}
      {!feedback ? (
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && checkAnswer()}
            dir={mode === 'letter_to_name' ? 'ltr' : 'rtl'}
            className={mode !== 'letter_to_name' ? 'arabic' : ''}
            placeholder={mode === 'forms_drill' ? 'Alle 4 Formen, getrennt durch Leerzeichen' : 'Antwort eingeben...'}
            style={{ flex: 1, padding: '10px 14px', fontSize: mode !== 'letter_to_name' ? '1.3rem' : '1rem' }}
            autoFocus
          />
          <button onClick={checkAnswer} style={{
            padding: '10px 20px', borderRadius: 'var(--radius)', cursor: 'pointer',
            background: 'var(--accent-teal)', color: '#fff', border: 'none', fontWeight: 600,
          }}>Prüfen</button>
        </div>
      ) : (
        <div style={{
          padding: '16px 20px', borderRadius: 'var(--radius-lg)',
          background: feedback.correct ? 'var(--correct-bg)' : 'var(--incorrect-bg)',
          border: `1px solid ${feedback.correct ? 'var(--correct)' : 'var(--incorrect)'}`,
        }}>
          <p style={{ fontWeight: 600, marginBottom: '8px' }}>
            {feedback.correct ? 'Richtig!' : 'Nicht ganz.'}
          </p>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="arabic" dir="rtl" style={{ fontSize: '2rem', color: 'var(--accent-gold)' }}>
              {feedback.letter.forms.isolated}
            </span>
            <span>{feedback.letter.name} ({feedback.letter.transliteration})</span>
            <div className="arabic" dir="rtl" style={{ display: 'flex', gap: '12px', fontSize: '1.3rem' }}>
              <span title="Isoliert">{feedback.letter.forms.isolated}</span>
              <span title="Anfang">{feedback.letter.forms.initial}</span>
              <span title="Mitte">{feedback.letter.forms.medial}</span>
              <span title="Ende">{feedback.letter.forms.final}</span>
            </div>
          </div>
          <button onClick={next} style={{
            marginTop: '12px', padding: '8px 20px', borderRadius: 'var(--radius)',
            background: 'var(--accent-teal)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600,
          }}>Weiter</button>
        </div>
      )}
    </div>
  )
}
