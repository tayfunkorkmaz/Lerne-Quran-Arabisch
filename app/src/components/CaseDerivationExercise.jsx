import { useState, useMemo } from 'react'
import externalExercisesData from '../data/case-derivation-exercises.json'
import generatedExercisesData from '../data/case-derivation-generated.json'

const externalExercises = [...(Array.isArray(externalExercisesData) ? externalExercisesData : (externalExercisesData.exercises || [])), ...(Array.isArray(generatedExercisesData) ? generatedExercisesData : (generatedExercisesData.exercises || []))]

const INLINE_EXERCISES = [
  { verse: '\u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F \u0644\u0650\u0644\u0651\u064E\u0647\u0650 \u0631\u064E\u0628\u0651\u0650 \u0627\u0644\u0652\u0639\u064E\u0627\u0644\u064E\u0645\u0650\u064A\u0646\u064E', ref: '1:2', word: '\u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F', role: 'Mubtada (Thema)', expectedCase: 'Nominativ (Marfu\u2019 \u2014 Damma)', explanation: 'Mubtada steht immer im Nominativ. \u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F trägt Damma als Kasuszeichen.' },
  { verse: '\u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F \u0644\u0650\u0644\u0651\u064E\u0647\u0650 \u0631\u064E\u0628\u0651\u0650 \u0627\u0644\u0652\u0639\u064E\u0627\u0644\u064E\u0645\u0650\u064A\u0646\u064E', ref: '1:2', word: '\u0644\u0650\u0644\u0651\u064E\u0647\u0650', role: 'Majrur (nach Präposition \u0644\u0650\u0640)', expectedCase: 'Genitiv (Majrur \u2014 Kasra)', explanation: 'Nach der Präposition \u0644\u0650\u0640 steht das Nomen im Genitiv. \u0627\u0644\u0644\u0651\u064E\u0647\u0650 trägt Kasra.' },
  { verse: '\u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F \u0644\u0650\u0644\u0651\u064E\u0647\u0650 \u0631\u064E\u0628\u0651\u0650 \u0627\u0644\u0652\u0639\u064E\u0627\u0644\u064E\u0645\u0650\u064A\u0646\u064E', ref: '1:2', word: '\u0631\u064E\u0628\u0651\u0650', role: 'Badal (Apposition) zu \u0644\u0650\u0644\u0651\u064E\u0647\u0650', expectedCase: 'Genitiv (Majrur \u2014 Kasra)', explanation: 'Badal kongruiert im Kasus mit seinem Bezugswort. Da \u0644\u0650\u0644\u0651\u064E\u0647\u0650 im Genitiv steht, steht auch \u0631\u064E\u0628\u0651\u0650 im Genitiv.' },
  { verse: '\u0625\u0650\u064A\u0651\u064E\u0627\u0643\u064E \u0646\u064E\u0639\u0652\u0628\u064F\u062F\u064F', ref: '1:5', word: '\u0625\u0650\u064A\u0651\u064E\u0627\u0643\u064E', role: 'Maf\u2019ul bihi (vorangestelltes Objekt)', expectedCase: 'Akkusativ (Mansub)', explanation: 'Das direkte Objekt steht im Akkusativ. \u0625\u0650\u064A\u0651\u064E\u0627\u0643\u064E ist die emphatische Objektform des Pronomens der 2. Person.' },
  { verse: '\u0630\u064E\u0670\u0644\u0650\u0643\u064E \u0627\u0644\u0652\u0643\u0650\u062A\u064E\u0627\u0628\u064F \u0644\u064E\u0627 \u0631\u064E\u064A\u0652\u0628\u064E \u0641\u0650\u064A\u0647\u0650', ref: '2:2', word: '\u0627\u0644\u0652\u0643\u0650\u062A\u064E\u0627\u0628\u064F', role: 'Khabar oder Badal zu \u0630\u064E\u0670\u0644\u0650\u0643\u064E', expectedCase: 'Nominativ (Marfu\u2019 \u2014 Damma)', explanation: 'Als Khabar zu \u0630\u064E\u0670\u0644\u0650\u0643\u064E (Mubtada) steht \u0627\u0644\u0652\u0643\u0650\u062A\u064E\u0627\u0628\u064F im Nominativ.' },
  { verse: '\u0630\u064E\u0670\u0644\u0650\u0643\u064E \u0627\u0644\u0652\u0643\u0650\u062A\u064E\u0627\u0628\u064F \u0644\u064E\u0627 \u0631\u064E\u064A\u0652\u0628\u064E \u0641\u0650\u064A\u0647\u0650', ref: '2:2', word: '\u0631\u064E\u064A\u0652\u0628\u064E', role: 'Ism von \u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0641\u064A\u0629 \u0644\u0644\u062C\u0646\u0633', expectedCase: 'Akkusativ (Mansub \u2014 Fatha, ohne Tanwin)', explanation: 'Nach \u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0641\u064A\u0629 \u0644\u0644\u062C\u0646\u0633 steht das Ism im Akkusativ ohne Tanwin.' },
  { verse: '\u062E\u064E\u062A\u064E\u0645\u064E \u0627\u0644\u0644\u0651\u064E\u0647\u064F \u0639\u064E\u0644\u064E\u0649\u0670 \u0642\u064F\u0644\u064F\u0648\u0628\u0650\u0647\u0650\u0645\u0652', ref: '2:7', word: '\u0627\u0644\u0644\u0651\u064E\u0647\u064F', role: 'Fa\u2019il (Subjekt)', expectedCase: 'Nominativ (Marfu\u2019 \u2014 Damma)', explanation: 'Das Subjekt (Fa\u2019il) des Verbs steht im Nominativ. \u0627\u0644\u0644\u0651\u064E\u0647\u064F trägt Damma.' },
  { verse: '\u062E\u064E\u062A\u064E\u0645\u064E \u0627\u0644\u0644\u0651\u064E\u0647\u064F \u0639\u064E\u0644\u064E\u0649\u0670 \u0642\u064F\u0644\u064F\u0648\u0628\u0650\u0647\u0650\u0645\u0652', ref: '2:7', word: '\u0642\u064F\u0644\u064F\u0648\u0628\u0650\u0647\u0650\u0645\u0652', role: 'Majrur (nach Präposition \u0639\u064E\u0644\u064E\u0649\u0670)', expectedCase: 'Genitiv (Majrur \u2014 Kasra)', explanation: 'Nach \u0639\u064E\u0644\u064E\u0649\u0670 steht das Nomen im Genitiv. \u0642\u064F\u0644\u064F\u0648\u0628\u0650 trägt Kasra.' },
  { verse: '\u0648\u064E\u0644\u064E\u0647\u064F\u0645\u0652 \u0639\u064E\u0630\u064E\u0627\u0628\u064C \u0639\u064E\u0638\u0650\u064A\u0645\u064C', ref: '2:7', word: '\u0639\u064E\u0630\u064E\u0627\u0628\u064C', role: 'Mubtada mu\u2019akhkhar (nachgestelltes Thema)', expectedCase: 'Nominativ (Marfu\u2019 \u2014 Damma + Tanwin)', explanation: '\u0639\u064E\u0630\u064E\u0627\u0628\u064C ist Mubtada (nachgestellt nach dem Khabar \u0644\u064E\u0647\u064F\u0645\u0652). Es steht im Nominativ mit Tanwin.' },
  { verse: '\u0648\u064E\u0644\u064E\u0647\u064F\u0645\u0652 \u0639\u064E\u0630\u064E\u0627\u0628\u064C \u0639\u064E\u0638\u0650\u064A\u0645\u064C', ref: '2:7', word: '\u0639\u064E\u0638\u0650\u064A\u0645\u064C', role: 'Sifa (Attribut) zu \u0639\u064E\u0630\u064E\u0627\u0628\u064C', expectedCase: 'Nominativ (Marfu\u2019 \u2014 Damma + Tanwin)', explanation: 'Die Sifa kongruiert mit ihrem Bezugswort in Kasus, Genus, Numerus und Definitheit. \u0639\u064E\u0630\u064E\u0627\u0628\u064C ist maskulin, Singular, indefinit, Nominativ \u2014 also auch \u0639\u064E\u0638\u0650\u064A\u0645\u064C.' },
  { verse: '\u0625\u0650\u0646\u0651\u064E \u0627\u0644\u0651\u064E\u0630\u0650\u064A\u0646\u064E \u0643\u064E\u0641\u064E\u0631\u064F\u0648\u0627', ref: '2:6', word: '\u0627\u0644\u0651\u064E\u0630\u0650\u064A\u0646\u064E', role: 'Ism von \u0625\u0650\u0646\u0651\u064E', expectedCase: 'Akkusativ (Mansub)', explanation: 'Das Ism von \u0625\u0650\u0646\u0651\u064E steht im Akkusativ. \u0627\u0644\u0651\u064E\u0630\u0650\u064A\u0646\u064E ist unveränderlich, steht aber syntaktisch im Akkusativ.' }
]

export default function CaseDerivationExercise() {
  const EXERCISES = useMemo(() => {
    if (externalExercises && Array.isArray(externalExercises) && externalExercises.length > 0) return externalExercises
    return INLINE_EXERCISES
  }, [])
  const [idx, setIdx] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  const ex = EXERCISES[idx]
  if (!ex) return null

  function check() {
    setRevealed(true)
    const lower = userAnswer.trim().toLowerCase()
    const expected = ex.expectedCase.toLowerCase()
    // Match if the user typed one of the case keywords and the expected case contains it
    const CASE_KEYWORDS = ['nominativ', 'akkusativ', 'genitiv', 'marfu', 'mansub', 'majrur']
    const userKeyword = CASE_KEYWORDS.find(k => lower === k || lower.startsWith(k))
    const isCorrect = userKeyword != null && expected.includes(userKeyword)
    setScore(s => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }))
  }

  function next() {
    setIdx((idx + 1) % EXERCISES.length)
    setUserAnswer('')
    setRevealed(false)
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h3 style={{ color: 'var(--accent-gold)', marginBottom: 4 }}>Kasusableitung</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>
        Bestimme den Kasus des markierten Wortes aus seiner syntaktischen Rolle.
      </p>
      {score.total > 0 && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>{score.correct}/{score.total} korrekt</div>}
      <div style={{ background: 'var(--card-bg)', borderRadius: 12, padding: 24 }}>
        <div style={{ textAlign: 'center', fontFamily: 'var(--font-arabic)', fontSize: '1.6rem', direction: 'rtl', lineHeight: 2, marginBottom: 12, color: 'var(--text)' }}>{ex.verse}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 16 }}>{ex.ref}</div>
        <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, marginBottom: 16 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Markiertes Wort:</div>
          <div style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.8rem', color: 'var(--accent-gold)', textAlign: 'center' }}>{ex.word}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--accent-teal)', textAlign: 'center', marginTop: 4 }}>Rolle: {ex.role}</div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Welcher Kasus? (Nominativ/Akkusativ/Genitiv)</label>
          <input value={userAnswer} onChange={e => setUserAnswer(e.target.value)} disabled={revealed}
            placeholder="z.B. Nominativ (Marfu')"
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem', boxSizing: 'border-box' }}
          />
        </div>
        {!revealed && <button onClick={check} style={{ padding: '10px 28px', borderRadius: 8, border: 'none', background: 'var(--accent-teal)', color: '#fff', cursor: 'pointer', width: '100%' }}>Prüfen</button>}
        {revealed && (
          <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600, color: 'var(--correct)', marginBottom: 4 }}>{ex.expectedCase}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{ex.explanation}</div>
            <button onClick={next} style={{ marginTop: 12, padding: '8px 24px', borderRadius: 8, border: 'none', background: 'var(--accent-gold)', color: '#000', cursor: 'pointer' }}>Weiter</button>
          </div>
        )}
      </div>
    </div>
  )
}
