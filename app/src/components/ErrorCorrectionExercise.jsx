import { useState, useMemo } from 'react'
import externalExercisesData from '../data/error-correction-exercises.json'

const externalExercises = externalExercisesData.exercises || externalExercisesData

const INLINE_EXERCISES = [
  { ref: '1:2', verse: '\u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F \u0644\u0650\u0644\u0651\u064E\u0647\u0650 \u0631\u064E\u0628\u0651\u0650 \u0627\u0644\u0652\u0639\u064E\u0627\u0644\u064E\u0645\u0650\u064A\u0646\u064E', wrong: '\u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064E \u0644\u0650\u0644\u0651\u064E\u0647\u0650 \u0631\u064E\u0628\u0651\u0650 \u0627\u0644\u0652\u0639\u064E\u0627\u0644\u064E\u0645\u0650\u064A\u0646\u064E', errorWord: '\u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064E', correctedWord: '\u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F', explanation: '\u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F ist Mubtada (Thema) und steht im Nominativ mit Damma, nicht Fatha. Fatha würde Akkusativ bedeuten, was hier syntaktisch unmöglich ist.' },
  { ref: '1:4', verse: '\u0645\u064E\u0627\u0644\u0650\u0643\u0650 \u064A\u064E\u0648\u0652\u0645\u0650 \u0627\u0644\u062F\u0651\u0650\u064A\u0646\u0650', wrong: '\u0645\u064E\u0627\u0644\u0650\u0643\u064F \u064A\u064E\u0648\u0652\u0645\u0650 \u0627\u0644\u062F\u0651\u0650\u064A\u0646\u0650', errorWord: '\u0645\u064E\u0627\u0644\u0650\u0643\u064F', correctedWord: '\u0645\u064E\u0627\u0644\u0650\u0643\u0650', explanation: '\u0645\u064E\u0627\u0644\u0650\u0643\u0650 ist Sifa (Attribut) zu \u0627\u0644\u0644\u0651\u064E\u0647\u0650 und steht im Genitiv (Kasra), nicht Nominativ (Damma). Attribute kongruieren im Kasus mit ihrem Bezugswort.' },
  { ref: '2:2', verse: '\u0630\u064E\u0670\u0644\u0650\u0643\u064E \u0627\u0644\u0652\u0643\u0650\u062A\u064E\u0627\u0628\u064F \u0644\u064E\u0627 \u0631\u064E\u064A\u0652\u0628\u064E \u0641\u0650\u064A\u0647\u0650', wrong: '\u0630\u064E\u0670\u0644\u0650\u0643\u064E \u0627\u0644\u0652\u0643\u0650\u062A\u064E\u0627\u0628\u064E \u0644\u064E\u0627 \u0631\u064E\u064A\u0652\u0628\u064E \u0641\u0650\u064A\u0647\u0650', errorWord: '\u0627\u0644\u0652\u0643\u0650\u062A\u064E\u0627\u0628\u064E', correctedWord: '\u0627\u0644\u0652\u0643\u0650\u062A\u064E\u0627\u0628\u064F', explanation: '\u0627\u0644\u0652\u0643\u0650\u062A\u064E\u0627\u0628\u064F ist Khabar oder Badal zu \u0630\u064E\u0670\u0644\u0650\u0643\u064E (Mubtada) und steht im Nominativ (Damma). Fatha würde Akkusativ bedeuten, was hier keine syntaktische Funktion hat.' },
  { ref: '2:7', verse: '\u062E\u064E\u062A\u064E\u0645\u064E \u0627\u0644\u0644\u0651\u064E\u0647\u064F \u0639\u064E\u0644\u064E\u0649\u0670 \u0642\u064F\u0644\u064F\u0648\u0628\u0650\u0647\u0650\u0645\u0652', wrong: '\u062E\u064E\u062A\u064E\u0645\u064E \u0627\u0644\u0644\u0651\u064E\u0647\u064E \u0639\u064E\u0644\u064E\u0649\u0670 \u0642\u064F\u0644\u064F\u0648\u0628\u0650\u0647\u0650\u0645\u0652', errorWord: '\u0627\u0644\u0644\u0651\u064E\u0647\u064E', correctedWord: '\u0627\u0644\u0644\u0651\u064E\u0647\u064F', explanation: '\u0627\u0644\u0644\u0651\u064E\u0647\u064F ist Fa\u2019il (Subjekt) des Verbs \u062E\u064E\u062A\u064E\u0645\u064E und steht im Nominativ (Damma). Fatha würde Akkusativ (Objekt) bedeuten, was die Satzstruktur umkehren würde.' },
  { ref: '2:6', verse: '\u0625\u0650\u0646\u0651\u064E \u0627\u0644\u0651\u064E\u0630\u0650\u064A\u0646\u064E \u0643\u064E\u0641\u064E\u0631\u064F\u0648\u0627', wrong: '\u0625\u0650\u0646\u0651\u064E \u0627\u0644\u0651\u064E\u0630\u0650\u064A\u0646\u064F \u0643\u064E\u0641\u064E\u0631\u064F\u0648\u0627', errorWord: '\u0627\u0644\u0651\u064E\u0630\u0650\u064A\u0646\u064F', correctedWord: '\u0627\u0644\u0651\u064E\u0630\u0650\u064A\u0646\u064E', explanation: '\u0627\u0644\u0651\u064E\u0630\u0650\u064A\u0646\u064E ist Ism von \u0625\u0650\u0646\u0651\u064E und steht im Akkusativ. Das Relativpronomen \u0627\u0644\u0651\u064E\u0630\u0650\u064A\u0646\u064E ist zwar unveränderlich, aber die -\u064A\u0646\u064E Form signalisiert syntaktisch Akkusativ/Genitiv (nicht -\u0648\u0646\u064E für Nominativ).' },
  { ref: '1:6', verse: '\u0627\u0647\u0652\u062F\u0650\u0646\u064E\u0627 \u0627\u0644\u0635\u0651\u0650\u0631\u064E\u0627\u0637\u064E \u0627\u0644\u0652\u0645\u064F\u0633\u0652\u062A\u064E\u0642\u0650\u064A\u0645\u064E', wrong: '\u0627\u0647\u0652\u062F\u0650\u0646\u064E\u0627 \u0627\u0644\u0635\u0651\u0650\u0631\u064E\u0627\u0637\u064F \u0627\u0644\u0652\u0645\u064F\u0633\u0652\u062A\u064E\u0642\u0650\u064A\u0645\u064E', errorWord: '\u0627\u0644\u0635\u0651\u0650\u0631\u064E\u0627\u0637\u064F', correctedWord: '\u0627\u0644\u0635\u0651\u0650\u0631\u064E\u0627\u0637\u064E', explanation: '\u0627\u0644\u0635\u0651\u0650\u0631\u064E\u0627\u0637\u064E ist Maf\u2019ul bihi (direktes Objekt) des Verbs \u0627\u0647\u0652\u062F\u0650 und steht im Akkusativ (Fatha). Damma würde Nominativ bedeuten, was hier nicht passt.' },
  { ref: '2:3', verse: '\u0627\u0644\u0651\u064E\u0630\u0650\u064A\u0646\u064E \u064A\u064F\u0624\u0652\u0645\u0650\u0646\u064F\u0648\u0646\u064E \u0628\u0650\u0627\u0644\u0652\u063A\u064E\u064A\u0652\u0628\u0650', wrong: '\u0627\u0644\u0651\u064E\u0630\u0650\u064A\u0646\u064E \u064A\u064F\u0624\u0652\u0645\u0650\u0646\u064F\u0648\u0646\u064E \u0628\u0650\u0627\u0644\u0652\u063A\u064E\u064A\u0652\u0628\u064E', errorWord: '\u0628\u0650\u0627\u0644\u0652\u063A\u064E\u064A\u0652\u0628\u064E', correctedWord: '\u0628\u0650\u0627\u0644\u0652\u063A\u064E\u064A\u0652\u0628\u0650', explanation: 'Nach der Präposition \u0628\u0650 steht das Nomen im Genitiv (Kasra), nicht im Akkusativ (Fatha). \u0627\u0644\u0652\u063A\u064E\u064A\u0652\u0628\u0650 mit Kasra ist korrekt.' },
  { ref: '2:255', verse: '\u0627\u0644\u0644\u0651\u064E\u0647\u064F \u0644\u064E\u0627 \u0625\u0650\u0644\u064E\u0670\u0647\u064E \u0625\u0650\u0644\u0651\u064E\u0627 \u0647\u064F\u0648\u064E', wrong: '\u0627\u0644\u0644\u0651\u064E\u0647\u064F \u0644\u064E\u0627 \u0625\u0650\u0644\u064E\u0670\u0647\u064C \u0625\u0650\u0644\u0651\u064E\u0627 \u0647\u064F\u0648\u064E', errorWord: '\u0625\u0650\u0644\u064E\u0670\u0647\u064C', correctedWord: '\u0625\u0650\u0644\u064E\u0670\u0647\u064E', explanation: '\u0625\u0650\u0644\u064E\u0670\u0647\u064E ist Ism von \u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0641\u064A\u0629 \u0644\u0644\u062C\u0646\u0633 und steht im Akkusativ OHNE Tanwin (mabni \u2019ala l-fath). Tanwin-Damma würde Nominativ-Indefinit bedeuten, was nach \u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0641\u064A\u0629 falsch ist.' }
]

export default function ErrorCorrectionExercise() {
  const EXERCISES = useMemo(() => {
    if (externalExercises && Array.isArray(externalExercises) && externalExercises.length > 0) return externalExercises
    return INLINE_EXERCISES
  }, [])
  const [idx, setIdx] = useState(0)
  const [userCorrection, setUserCorrection] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  const ex = EXERCISES[idx]
  if (!ex) return null

  function check() {
    setRevealed(true)
    const normalize = s => s.trim().normalize('NFC')
    const isCorrect = normalize(userCorrection) === normalize(ex.correctedWord)
    setScore(s => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }))
  }

  function next() {
    setIdx((idx + 1) % EXERCISES.length)
    setUserCorrection('')
    setRevealed(false)
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h3 style={{ color: 'var(--accent-gold)', marginBottom: 4 }}>Fehlerkorrektur</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>
        Ein Wort im Vers ist falsch vokalisiert. Finde den Fehler und korrigiere die Vokalisierung.
      </p>
      {score.total > 0 && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>{score.correct}/{score.total} korrekt</div>}
      <div style={{ background: 'var(--card-bg)', borderRadius: 12, padding: 24 }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, textAlign: 'center' }}>{ex.ref}</div>
        <div style={{ textAlign: 'center', fontFamily: 'var(--font-arabic)', fontSize: '1.6rem', direction: 'rtl', lineHeight: 2, marginBottom: 8, color: 'var(--text)' }}>
          {ex.wrong}
        </div>
        <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#ef4444', marginBottom: 16 }}>
          Ein Wort ist falsch vokalisiert. Welches, und wie lautet die korrekte Form?
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Korrigiertes Wort:</label>
          <input value={userCorrection} onChange={e => setUserCorrection(e.target.value)} disabled={revealed}
            placeholder="Gib das korrekt vokalisierte Wort ein"
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-arabic)', fontSize: '1.2rem', direction: 'rtl', boxSizing: 'border-box' }}
          />
        </div>
        {!revealed && <button onClick={check} style={{ padding: '10px 28px', borderRadius: 8, border: 'none', background: 'var(--accent-teal)', color: '#fff', cursor: 'pointer', width: '100%' }}>Prüfen</button>}
        {revealed && (
          <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 8 }}>
              <div><span style={{ color: '#ef4444', fontFamily: 'var(--font-arabic)', fontSize: '1.3rem', textDecoration: 'line-through' }}>{ex.errorWord}</span></div>
              <div style={{ color: 'var(--text-muted)' }}>{'\u2192'}</div>
              <div><span style={{ color: 'var(--correct)', fontFamily: 'var(--font-arabic)', fontSize: '1.3rem' }}>{ex.correctedWord}</span></div>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{ex.explanation}</div>
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <div style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.4rem', color: 'var(--correct)', direction: 'rtl' }}>{ex.verse}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Korrekte Vokalisierung</div>
            </div>
            <button onClick={next} style={{ marginTop: 12, padding: '8px 24px', borderRadius: 8, border: 'none', background: 'var(--accent-gold)', color: '#000', cursor: 'pointer' }}>Weiter</button>
          </div>
        )}
      </div>
    </div>
  )
}
