import { useState, useMemo } from 'react'
import externalExercisesData from '../data/context-disambiguation-exercises.json'

const externalExercises = externalExercisesData.exercises || externalExercisesData

const INLINE_EXERCISES = [
  { consonantal: '\u0643\u062A\u0628', context: 'Nach dem Subjekt \u0627\u0644\u0644\u0651\u064E\u0647\u064F in einem Verbalsatz', ref: '2:187', options: [
    { vocalized: '\u0643\u064E\u062A\u064E\u0628\u064E', analysis: 'kataba — Perfekt Aktiv 3ms Form I: er schrieb/bestimmte', correct: true },
    { vocalized: '\u0643\u064F\u062A\u0650\u0628\u064E', analysis: 'kutiba — Perfekt Passiv 3ms Form I: es wurde geschrieben/bestimmt', correct: false },
    { vocalized: '\u0643\u064F\u062A\u064F\u0628', analysis: 'kutub — Plural von \u0643\u0650\u062A\u064E\u0627\u0628: Bücher', correct: false }
  ], explanation: 'Nach \u0627\u0644\u0644\u0651\u064E\u0647\u064F (Fa\u2019il/Subjekt, Nominativ) folgt ein aktives Verb. \u0643\u064E\u062A\u064E\u0628\u064E (Aktiv) ist korrekt, nicht \u0643\u064F\u062A\u0650\u0628\u064E (Passiv), weil das Subjekt explizit genannt ist.' },
  { consonantal: '\u0639\u0644\u0645', context: 'Am Satzanfang, gefolgt von einem Akkusativobjekt', ref: '96:5', options: [
    { vocalized: '\u0639\u064E\u0644\u0650\u0645\u064E', analysis: '\u2018alima — Perfekt Aktiv 3ms: er wusste', correct: false },
    { vocalized: '\u0639\u064E\u0644\u0651\u064E\u0645\u064E', analysis: '\u2018allama — Perfekt Aktiv 3ms Form II: er lehrte', correct: true },
    { vocalized: '\u0639\u0650\u0644\u0652\u0645', analysis: '\u2018ilm — Nomen (Masdar): Wissen', correct: false }
  ], explanation: 'Form II (\u0639\u064E\u0644\u0651\u064E\u0645\u064E) ist transitiv mit doppeltem Objekt. Der Kontext (Akkusativobjekt folgt) zeigt die kausative Form II an: \u0639\u064E\u0644\u0651\u064E\u0645\u064E \u0627\u0644\u0652\u0625\u0650\u0646\u0633\u064E\u0627\u0646\u064E (96:5).' },
  { consonantal: '\u062D\u0633\u0628', context: 'Vor einem Akkusativ-Pronomen und Khabar-Komplement', ref: '2:214', options: [
    { vocalized: '\u062D\u064E\u0633\u0650\u0628\u064E', analysis: 'hasiba — Perfekt 3ms: er meinte/dachte', correct: true },
    { vocalized: '\u062D\u064E\u0633\u0652\u0628', analysis: 'hasb — Nomen: genügend/Genüge', correct: false },
    { vocalized: '\u062D\u064F\u0633\u0650\u0628\u064E', analysis: 'husiba — Perfekt Passiv 3ms: er wurde berechnet', correct: false }
  ], explanation: '\u062D\u064E\u0633\u0650\u0628\u064E ist ein Verb der Meinung und nimmt zwei Akkusativobjekte (Ism + Khabar). Der Kontext \u0623\u064E\u0645\u0652 \u062D\u064E\u0633\u0650\u0628\u0652\u062A\u064F\u0645\u0652 \u0623\u064E\u0646 \u062A\u064E\u062F\u0652\u062E\u064F\u0644\u064F\u0648\u0627 zeigt die Verbbedeutung.' },
  { consonantal: '\u0642\u062F\u0631', context: 'Nach \u0641\u064E mit Bezug auf den Mond in 36:39', ref: '36:39', options: [
    { vocalized: '\u0642\u064E\u062F\u064E\u0631\u064E', analysis: 'qadara — Perfekt Form I: er bestimmte (das Mass)', correct: false },
    { vocalized: '\u0642\u064E\u062F\u0651\u064E\u0631\u064E', analysis: 'qaddara — Perfekt Form II: er bestimmte/mass zu', correct: true },
    { vocalized: '\u0642\u064E\u062F\u0652\u0631', analysis: 'qadr — Nomen: Mass/Wert', correct: false }
  ], explanation: 'Form II (\u0642\u064E\u062F\u0651\u064E\u0631\u064E) mit Shadda zeigt Intensivierung an. \u0648\u064E\u0627\u0644\u0652\u0642\u064E\u0645\u064E\u0631\u064E \u0642\u064E\u062F\u0651\u064E\u0631\u0652\u0646\u064E\u0627\u0647\u064F: Das Suffix \u0646\u064E\u0627\u0647\u064F (wir + ihn) bestätigt die transitive Form II.' },
  { consonantal: '\u0627\u0645\u0631', context: 'Nach Präposition \u0628\u0650 in einem Imperativsatz', ref: '7:29', options: [
    { vocalized: '\u0623\u064E\u0645\u064E\u0631\u064E', analysis: 'amara — Perfekt 3ms: er befahl', correct: false },
    { vocalized: '\u0623\u064E\u0645\u0652\u0631', analysis: 'amr — Nomen: Befehl/Angelegenheit', correct: true },
    { vocalized: '\u0623\u064F\u0645\u0650\u0631\u064E', analysis: 'umira — Perfekt Passiv: ihm wurde befohlen', correct: false }
  ], explanation: 'Nach einer Präposition (\u0628\u0650) muss ein Nomen im Genitiv folgen, kein Verb. \u0623\u064E\u0645\u064E\u0631\u064E \u0631\u064E\u0628\u0651\u0650\u064A \u0628\u0650\u0627\u0644\u0652\u0642\u0650\u0633\u0652\u0637\u0650 — aber hier: \u0642\u064F\u0644\u0652 \u0623\u064E\u0645\u064E\u0631\u064E \u0631\u064E\u0628\u0651\u0650\u064A \u0628\u0650\u0627\u0644\u0652\u0642\u0650\u0633\u0652\u0637\u0650 zeigt \u0623\u064E\u0645\u064E\u0631\u064E als Verb mit \u0628\u0650 als Teil der Rektion.' },
  { consonantal: '\u0639\u0628\u062F', context: 'Als Objekt von \u0625\u0650\u064A\u0651\u064E\u0627\u0643\u064E \u0646\u064E...\u064F in 1:5', ref: '1:5', options: [
    { vocalized: '\u0646\u064E\u0639\u0652\u0628\u064F\u062F\u064F', analysis: 'na\u2018budu — Imperfekt 1pl Aktiv Indikativ: wir dienen', correct: true },
    { vocalized: '\u0646\u064E\u0639\u0652\u0628\u064F\u062F\u064E', analysis: 'na\u2018buda — Imperfekt 1pl Aktiv Subjunktiv: wir dienen (nach Subjunktiv-Auslöser)', correct: false },
    { vocalized: '\u0646\u064F\u0639\u0652\u0628\u064E\u062F\u064F', analysis: 'nu\u2018badu — Imperfekt 1pl Passiv: uns wird gedient', correct: false }
  ], explanation: '\u0646\u064E\u0639\u0652\u0628\u064F\u062F\u064F mit Damma am Ende = Indikativ. Kein Subjunktiv-Auslöser vorhanden (kein \u0623\u064E\u0646\u0652, \u0644\u064E\u0646\u0652, etc.). Aktiv weil \u0625\u0650\u064A\u0651\u064E\u0627\u0643\u064E (Akkusativ-Objekt) vorangestellt ist.' },
  { consonantal: '\u0647\u062F\u064A', context: 'Am Anfang von 2:2 nach \u0641\u0650\u064A\u0647\u0650', ref: '2:2', options: [
    { vocalized: '\u0647\u064F\u062F\u064B\u0649', analysis: 'hudan — Nomen (Masdar): Führung (Akkusativ oder Nominativ mit Tanwin)', correct: true },
    { vocalized: '\u0647\u064E\u062F\u064E\u0649', analysis: 'hada — Perfekt 3ms: er leitete recht', correct: false },
    { vocalized: '\u0647\u064F\u062F\u064E\u0649', analysis: 'huda — Nomen ohne Tanwin', correct: false }
  ], explanation: '\u0647\u064F\u062F\u064B\u0649 ist ein indefinites Nomen (Masdar) und fungiert hier als Hal (Zustandsakkusativ) oder als zweites Khabar. Das Tanwin-Fatha (\u064B) zeigt den indefiniten Status.' },
  { consonantal: '\u0636\u0644', context: 'Mit Präfix \u064A\u064F und Suffix \u0651\u064F in einem Kausativsatz', ref: '14:4', options: [
    { vocalized: '\u064A\u064F\u0636\u0650\u0644\u0651\u064F', analysis: 'yudillu — Imperfekt 3ms Form IV Aktiv: er führt in die Irre', correct: true },
    { vocalized: '\u064A\u064E\u0636\u0650\u0644\u0651\u064F', analysis: 'yadillu — Imperfekt 3ms Form I: er irrt (selbst)', correct: false }
  ], explanation: 'Präfix \u064A\u064F (Damma) signalisiert Form IV (kausativ): \u064A\u064F\u0636\u0650\u0644\u0651\u064F = er LÄSST in die Irre gehen. Präfix \u064A\u064E (Fatha) wäre Form I: er GEHT selbst in die Irre. Im Konsonantentext identisch!' }
]

export default function ContextDisambiguationExercise() {
  const EXERCISES = useMemo(() => {
    if (externalExercises && Array.isArray(externalExercises) && externalExercises.length > 0) return externalExercises
    return INLINE_EXERCISES
  }, [])
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  const ex = EXERCISES[idx]
  if (!ex) return null

  function isCorrect(optionIndex) {
    if (typeof ex.correct === 'number') return optionIndex === ex.correct
    return !!ex.options[optionIndex].correct
  }

  function check() {
    if (selected === null) return
    setRevealed(true)
    setScore(s => ({ correct: s.correct + (isCorrect(selected) ? 1 : 0), total: s.total + 1 }))
  }

  function next() {
    setIdx((idx + 1) % EXERCISES.length)
    setSelected(null)
    setRevealed(false)
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h3 style={{ color: 'var(--accent-gold)', marginBottom: 4 }}>Kontextuelle Disambiguierung</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>
        Derselbe Konsonantentext kann mehrere Lesungen erlauben. Bestimme aus dem Kontext die korrekte Vokalisierung.
      </p>
      {score.total > 0 && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>{score.correct}/{score.total} korrekt</div>}
      <div style={{ background: 'var(--card-bg)', borderRadius: 12, padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>{ex.ref}</div>
          <div style={{ fontFamily: 'var(--font-arabic)', fontSize: '2.5rem', color: 'var(--accent-gold)', direction: 'rtl' }}>{ex.consonantal}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 8 }}>Kontext: {ex.context}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {ex.options.map((opt, i) => (
            <button key={i} onClick={() => !revealed && setSelected(i)}
              style={{
                padding: '12px 16px', borderRadius: 8, textAlign: 'left', cursor: revealed ? 'default' : 'pointer',
                border: selected === i ? '2px solid var(--accent-teal)' : '1px solid var(--border)',
                background: revealed ? (isCorrect(i) ? 'rgba(34,197,94,0.15)' : selected === i ? 'rgba(239,68,68,0.15)' : 'var(--bg)') : (selected === i ? 'rgba(45,212,191,0.1)' : 'var(--bg)'),
                color: 'var(--text)'
              }}>
              <div style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.3rem', direction: 'rtl', marginBottom: 4 }}>{opt.vocalized}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{opt.analysis}</div>
            </button>
          ))}
        </div>
        {!revealed && <button onClick={check} disabled={selected === null} style={{ padding: '10px 28px', borderRadius: 8, border: 'none', background: selected !== null ? 'var(--accent-teal)' : 'var(--text-muted)', color: '#fff', cursor: selected !== null ? 'pointer' : 'default', width: '100%' }}>Prüfen</button>}
        {revealed && (
          <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{ex.explanation}</div>
            <button onClick={next} style={{ marginTop: 12, padding: '8px 24px', borderRadius: 8, border: 'none', background: 'var(--accent-gold)', color: '#000', cursor: 'pointer' }}>Weiter</button>
          </div>
        )}
      </div>
    </div>
  )
}
