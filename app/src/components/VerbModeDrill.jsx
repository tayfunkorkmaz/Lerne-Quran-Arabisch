import { useState } from 'react'

const MOODS = ['Indikativ (Marfu\u02BF)', 'Subjunktiv (Mansub)', 'Jussiv (Majzum)']
const TRIGGERS = [
  'Kein Auslöser (Standardmodus)',
  '\u0623\u064E\u0646\u0652 (an)',
  '\u0644\u064E\u0646\u0652 (lan)',
  '\u0644\u0650\u0640 / \u0643\u064E\u064A\u0652 (li/kay)',
  '\u062D\u064E\u062A\u0651\u064E\u0649 (hatta)',
  '\u0641\u064E\u0640 as-sababiyya',
  '\u0644\u064E\u0645\u0652 (lam)',
  '\u0644\u064E\u0645\u0651\u064E\u0627 (lamma)',
  '\u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0647\u064A\u0629 (la an-nahiya)',
  'Bedingungssatz (in/man/ma)',
  '\u0644\u0650\u0640 des Befehls (lam al-amr)',
  '\u0644\u064E\u0640 + Energetikus',
]
const ENDINGS = ['-u (\u0636\u0645\u0629)', '-a (\u0641\u062A\u062D\u0629)', 'Sukun / Nun-Wegfall']

const EXERCISES = [
  { ref: '2:13', verb: '\u064A\u064E\u0639\u0652\u0644\u064E\u0645\u064F\u0648\u0646\u064E', context: 'Kein Auslöser davor', mood: 0, trigger: 0, ending: 0, explanation: 'Indikativ — kein modusauslösender Partikel. Endung: \u0648\u0646\u064E (Nun als Indikativ-Marker bei den fünf Verben)' },
  { ref: '2:3', verb: '\u064A\u064F\u0624\u0652\u0645\u0650\u0646\u064F\u0648\u0646\u064E', context: 'Relativsatz, kein Partikel', mood: 0, trigger: 0, ending: 0, explanation: 'Indikativ im Relativsatz. Keine Moduspartikel. \u0648\u0646\u064E = Indikativ' },
  { ref: '2:26', verb: '\u064A\u064E\u0633\u0652\u062A\u064E\u062D\u0652\u064A\u0650\u064A', context: '\u0644\u064E\u0627 (Negation, NICHT prohibitiv)', mood: 0, trigger: 0, ending: 0, explanation: '\u0644\u064E\u0627 hier ist \u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0641\u064A\u0629 (Negation), nicht \u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0647\u064A\u0629 (Verbot). Indikativ bleibt' },
  { ref: '2:233', verb: '\u064A\u064F\u0636\u064E\u0627\u0631\u0651\u064E', context: 'Nach \u0644\u064E\u0627 (prohibitiv/verbietend)', mood: 2, trigger: 8, ending: 2, explanation: '\u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0647\u064A\u0629 — Verbot. Löst Jussiv aus. Das Verb verliert das Damma' },
  { ref: '112:3', verb: '\u064A\u064E\u0644\u0650\u062F\u0652', context: 'Nach \u0644\u064E\u0645\u0652', mood: 2, trigger: 6, ending: 2, explanation: '\u0644\u064E\u0645\u0652 negiert die Vergangenheit und löst Jussiv aus. Endung: Sukun (\u0652)' },
  { ref: '112:3', verb: '\u064A\u064F\u0648\u0644\u064E\u062F\u0652', context: 'Nach \u0644\u064E\u0645\u0652', mood: 2, trigger: 6, ending: 2, explanation: '\u0644\u064E\u0645\u0652 + Jussiv. Passiv (Präfix \u064A\u064F). Endung: Sukun' },
  { ref: '112:4', verb: '\u064A\u064E\u0643\u064F\u0646', context: 'Nach \u0644\u064E\u0645\u0652', mood: 2, trigger: 6, ending: 2, explanation: '\u0644\u064E\u0645\u0652 \u064A\u064E\u0643\u064F\u0646 — Jussiv von \u0643\u064E\u0627\u0646\u064E (hohles Verb). Kurzform ohne Langvokal' },
  { ref: '2:105', verb: '\u064A\u064F\u0646\u064E\u0632\u0651\u0650\u0644\u064E', context: 'Nach \u0623\u064E\u0646\u0652', mood: 1, trigger: 1, ending: 1, explanation: '\u0623\u064E\u0646\u0652 löst Subjunktiv aus. Endung: Fatha' },
  { ref: '3:167', verb: '\u064A\u064E\u0642\u064F\u0648\u0644\u064F\u0648\u0627', context: 'Nach \u0623\u064E\u0646\u0652', mood: 1, trigger: 1, ending: 1, explanation: '\u0623\u064E\u0646\u0652 + Subjunktiv. Bei den fünf Verben: Nun fällt weg (\u064A\u064E\u0642\u064F\u0648\u0644\u064F\u0648\u0627 statt \u064A\u064E\u0642\u064F\u0648\u0644\u064F\u0648\u0646\u064E)' },
  { ref: '2:150', verb: '\u062A\u064E\u0642\u064F\u0648\u0644\u064F\u0648\u0627', context: 'Nach \u0644\u0650\u0626\u064E\u0644\u0651\u064E\u0627', mood: 1, trigger: 3, ending: 1, explanation: '\u0644\u0650\u0640 als Finalpartikel löst Subjunktiv aus. Nun fällt weg' },
  { ref: '3:200', verb: '\u062A\u064F\u0641\u0652\u0644\u0650\u062D\u064F\u0648\u0646\u064E', context: '\u0644\u064E\u0639\u064E\u0644\u0651\u064E\u0643\u064F\u0645\u0652 (Hoffnungspartikel)', mood: 0, trigger: 0, ending: 0, explanation: '\u0644\u064E\u0639\u064E\u0644\u0651\u064E löst KEINEN Subjunktiv aus. Indikativ mit \u0648\u0646\u064E' },
  { ref: '36:82', verb: '\u064A\u064E\u0643\u064F\u0648\u0646\u064E', context: 'Nach \u0623\u064E\u0646\u0652', mood: 1, trigger: 1, ending: 1, explanation: '\u0623\u064E\u0646\u0652 + Subjunktiv. Fatha am Ende' },
  { ref: '2:24', verb: '\u062A\u064E\u0641\u0652\u0639\u064E\u0644\u064F\u0648\u0627', context: 'Nach \u0644\u064E\u0646\u0652', mood: 1, trigger: 2, ending: 1, explanation: '\u0644\u064E\u0646\u0652 negiert die Zukunft und löst Subjunktiv aus. Nun fällt weg' },
  { ref: '6:151', verb: '\u062A\u064E\u0642\u0652\u0631\u064E\u0628\u064F\u0648\u0627', context: 'Nach \u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0647\u064A\u0629 (Verbot)', mood: 2, trigger: 8, ending: 2, explanation: '\u0644\u064E\u0627 + Jussiv = Verbot (nicht negieren!). Nun fällt weg' },
  { ref: '4:135', verb: '\u062A\u064E\u062A\u0651\u064E\u0628\u0650\u0639\u064F\u0648\u0627', context: 'Nach \u0644\u064E\u0627 (Verbot) + \u0641\u064E\u0640', mood: 2, trigger: 8, ending: 2, explanation: '\u0641\u064E\u0644\u064E\u0627 + Jussiv. Prohibitiv' },
  { ref: '5:95', verb: '\u062A\u064E\u0642\u0652\u062A\u064F\u0644\u064F\u0648\u0627', context: 'Nach \u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0647\u064A\u0629 (Verbot)', mood: 2, trigger: 8, ending: 2, explanation: '\u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0647\u064A\u0629 — Verbot. Löst Jussiv aus. Nun fällt weg' },
  { ref: '5:2', verb: '\u062A\u064E\u0639\u064E\u0627\u0648\u064E\u0646\u064F\u0648\u0627', context: 'Imperativisch: \u0648\u064E\u062A\u064E\u0639\u064E\u0627\u0648\u064E\u0646\u064F\u0648\u0627', mood: 0, trigger: 0, ending: 0, explanation: 'Hier Indikativ! \u0648\u064E + Imperfekt ohne Moduspartikel = Indikativ. Kein Subjunktiv' },
  { ref: '96:15', verb: '\u0644\u064E\u0646\u064E\u0633\u0652\u0641\u064E\u0639\u064E\u0646\u0651', context: 'Nach \u0644\u064E\u0640 (Schwur-Lam) + Energetikus', mood: 0, trigger: 11, ending: 0, explanation: 'Nach Schwur-Lam: Indikativ + Energetisches Nun (\u0646\u0651). Das ist KEIN Subjunktiv. Das Verb steht im Indikativ, verstärkt durch Energetisches Nun' },
  { ref: '2:197', verb: '\u064A\u064E\u0639\u0652\u0644\u064E\u0645\u0652\u0647\u064F', context: 'Jawab ash-Shart (Antwort auf Bedingung)', mood: 2, trigger: 9, ending: 2, explanation: 'Jawab ash-Shart steht im Jussiv. Sukun am Ende' },
  { ref: '17:23', verb: '\u062A\u064E\u0642\u064F\u0644', context: 'Nach \u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0647\u064A\u0629 (\u0641\u064E\u0644\u064E\u0627)', mood: 2, trigger: 8, ending: 2, explanation: '\u0641\u064E\u0644\u064E\u0627 \u062A\u064E\u0642\u064F\u0644 — Verbot. Jussiv mit Sukun' },
  // === NEUE ÜBUNGEN: Indikativ (مرفوع) ===
  { ref: '2:9', verb: '\u064A\u064E\u0634\u0652\u0639\u064F\u0631\u064F\u0648\u0646\u064E', context: 'Kein Auslöser davor', mood: 0, trigger: 0, ending: 0, explanation: 'Indikativ — kein modusauslösender Partikel. \u0648\u0646\u064E = Indikativ bei den fünf Verben' },
  { ref: '2:10', verb: '\u064A\u064E\u0643\u0652\u0630\u0650\u0628\u064F\u0648\u0646\u064E', context: 'Kein Auslöser, Khabar-Satz', mood: 0, trigger: 0, ending: 0, explanation: 'Indikativ. Nun-Endung: \u0648\u0646\u064E. Einfacher Aussagesatz' },
  { ref: '2:14', verb: '\u064A\u064E\u0633\u0652\u062A\u064E\u0647\u0652\u0632\u0650\u0626\u064F\u0648\u0646\u064E', context: 'Kein Moduspartikel', mood: 0, trigger: 0, ending: 0, explanation: 'Form X. Indikativ mit \u0648\u0646\u064E. Kein Auslöser' },
  { ref: '2:16', verb: '\u064A\u064F\u0628\u0652\u0635\u0650\u0631\u064F\u0648\u0646\u064E', context: 'Negation mit \u0645\u064E\u0627 (kein Moduseffekt)', mood: 0, trigger: 0, ending: 0, explanation: '\u0645\u064E\u0627 hat keinen Modus-Effekt. Indikativ mit \u0648\u0646\u064E' },
  { ref: '3:110', verb: '\u062A\u064E\u0623\u0652\u0645\u064F\u0631\u064F\u0648\u0646\u064E', context: 'Kein Moduspartikel', mood: 0, trigger: 0, ending: 0, explanation: 'Indikativ. \u0648\u0646\u064E = Raf\u02BF-Marker bei den fünf Verben' },
  { ref: '2:85', verb: '\u062A\u064F\u0624\u0652\u0645\u0650\u0646\u064F\u0648\u0646\u064E', context: 'Interrogativ: \u0623\u064E\u0641\u064E\u062A\u064F\u0624\u0652\u0645\u0650\u0646\u064F\u0648\u0646\u064E', mood: 0, trigger: 0, ending: 0, explanation: 'Hamza (Interrogativ) hat keinen Modus-Effekt. Indikativ mit \u0648\u0646\u064E' },
  { ref: '6:50', verb: '\u064A\u064E\u0639\u0652\u0644\u064E\u0645\u064F', context: 'Kein Partikel, einfaches Verb', mood: 0, trigger: 0, ending: 0, explanation: 'Indikativ mit Damma (\u064F). Einfaches dreiradikaliges Verb' },
  { ref: '2:29', verb: '\u064A\u064E\u0639\u0652\u0644\u064E\u0645\u064F', context: 'Einfacher Hauptsatz', mood: 0, trigger: 0, ending: 0, explanation: 'Indikativ — Damma als Modus-Marker. Kein Partikel' },
  { ref: '2:33', verb: '\u062A\u064E\u0643\u0652\u062A\u064F\u0645\u064F\u0648\u0646\u064E', context: 'Negation \u0645\u064E\u0627 (ohne Moduseffekt)', mood: 0, trigger: 0, ending: 0, explanation: '\u0645\u064E\u0627 hat keinen Modus-Effekt. Indikativ mit \u0648\u0646\u064E' },
  { ref: '7:188', verb: '\u0623\u064E\u0639\u0652\u0644\u064E\u0645\u064F', context: 'Bedingungssatz-Antwort mit \u0644\u064E\u0640', mood: 0, trigger: 0, ending: 0, explanation: 'Indikativ mit Damma. \u0644\u064E\u0640 hier ist nicht der Subjunktiv-Auslöser, sondern Schwur-/Bekräftigungs-Lam' },
  // === NEUE ÜBUNGEN: Subjunktiv (منصوب) ===
  { ref: '2:26', verb: '\u064A\u064E\u0636\u0652\u0631\u0650\u0628\u064E', context: 'Nach \u0623\u064E\u0646\u0652', mood: 1, trigger: 1, ending: 1, explanation: '\u0623\u064E\u0646\u0652 löst Subjunktiv aus. Fatha am Ende' },
  { ref: '3:142', verb: '\u062A\u064E\u062F\u0652\u062E\u064F\u0644\u064F\u0648\u0627', context: 'Nach \u0623\u064E\u0646\u0652', mood: 1, trigger: 1, ending: 1, explanation: '\u0623\u064E\u0646\u0652 + Subjunktiv. Nun-Wegfall bei den fünf Verben' },
  { ref: '4:141', verb: '\u064A\u064E\u062C\u0652\u0639\u064E\u0644\u064E', context: 'Nach \u0644\u064E\u0646\u0652', mood: 1, trigger: 2, ending: 1, explanation: '\u0644\u064E\u0646\u0652 negiert die Zukunft. Fatha am Ende' },
  { ref: '2:124', verb: '\u064A\u064E\u0646\u064E\u0627\u0644\u064F', context: 'Nach \u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0641\u064A\u0629 (einfache Verneinung, kein Moduswechsel)', mood: 0, trigger: 0, ending: 0, explanation: '\u0644\u064E\u0627 \u064A\u064E\u0646\u064E\u0627\u0644\u064F — \u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0641\u064A\u0629 negiert ohne Modusänderung. Indikativ mit Damma' },
  { ref: '2:222', verb: '\u064A\u064E\u0637\u0652\u0647\u064F\u0631\u0652\u0646\u064E', context: 'Nach \u062D\u064E\u062A\u0651\u064E\u0649', mood: 1, trigger: 4, ending: 1, explanation: '\u062D\u064E\u062A\u0651\u064E\u0649 löst Subjunktiv aus. Die feminine Plural-Endung \u0646\u064E ist unveränderlich — der Subjunktiv wird durch \u062D\u064E\u062A\u0651\u064E\u0649 bestimmt, nicht durch sichtbare Endung' },
  { ref: '12:15', verb: '\u064A\u064E\u062C\u0652\u0639\u064E\u0644\u064F\u0648\u0647\u064F', context: 'Nach \u0623\u064E\u0646\u0652', mood: 1, trigger: 1, ending: 1, explanation: '\u0623\u064E\u0646\u0652 + Subjunktiv. Nun-Wegfall + Objektsuffix' },
  { ref: '2:71', verb: '\u062A\u064F\u062B\u0650\u064A\u0631\u064E', context: 'Nach \u0644\u0650\u0640 (Finalpartikel)', mood: 1, trigger: 3, ending: 1, explanation: '\u0644\u0650\u0640 als Finalpartikel löst Subjunktiv aus. Fatha' },
  { ref: '2:186', verb: '\u064A\u064E\u0631\u0652\u0634\u064F\u062F\u064F\u0648\u0646\u064E', context: '\u0644\u064E\u0639\u064E\u0644\u0651\u064E\u0647\u064F\u0645\u0652 (Hoffnungspartikel)', mood: 0, trigger: 0, ending: 0, explanation: '\u0644\u064E\u0639\u064E\u0644\u0651\u064E löst KEINEN Subjunktiv aus. Indikativ mit \u0648\u0646\u064E' },
  { ref: '18:24', verb: '\u064A\u064E\u0647\u0652\u062F\u0650\u064A\u064E', context: 'Nach \u0623\u064E\u0646\u0652', mood: 1, trigger: 1, ending: 1, explanation: '\u0623\u064E\u0646\u0652 + Subjunktiv. Bei defektem Verb: Fatha auf dem letzten Radikal' },
  { ref: '2:150', verb: '\u064A\u064E\u0643\u064F\u0648\u0646\u064E', context: 'Nach \u0644\u0650\u0626\u064E\u0644\u0651\u064E\u0627', mood: 1, trigger: 3, ending: 1, explanation: '\u0644\u0650\u0640 als Finalpartikel + Subjunktiv. Fatha' },
  // === NEUE ÜBUNGEN: Jussiv (مجزوم) ===
  { ref: '2:284', verb: '\u064A\u064E\u0634\u064E\u0623\u0652', context: 'Bedingungssatz: \u0625\u0650\u0646\u0652', mood: 2, trigger: 9, ending: 2, explanation: 'Bedingungssatz (\u0625\u0650\u0646\u0652) — Shart-Verb im Jussiv. Sukun am Ende' },
  { ref: '5:54', verb: '\u064A\u064E\u0631\u0652\u062A\u064E\u062F\u0651\u064E', context: 'Bedingungssatz: \u0645\u064E\u0646\u0652', mood: 2, trigger: 9, ending: 2, explanation: '\u0645\u064E\u0646\u0652 (Bedingung) — Jussiv. Fatha bei verdoppeltem Endradikal' },
  { ref: '36:45', verb: '\u064A\u064E\u0631\u0652\u062D\u064E\u0645\u064F\u0648\u0646\u064E', context: 'Negation mit \u0644\u064E\u0627 (nicht prohibitiv hier)', mood: 0, trigger: 0, ending: 0, explanation: '\u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0641\u064A\u0629, NICHT \u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0647\u064A\u0629. Indikativ mit \u0648\u0646\u064E' },
  { ref: '2:282', verb: '\u062A\u064E\u0633\u0652\u0623\u064E\u0645\u064F\u0648\u0627', context: 'Nach \u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0647\u064A\u0629 (Verbot)', mood: 2, trigger: 8, ending: 2, explanation: '\u0644\u064E\u0627 + Jussiv = Verbot. Nun-Wegfall' },
  { ref: '2:286', verb: '\u062A\u064F\u0624\u064E\u0627\u062E\u0650\u0630\u0652', context: 'Nach \u0644\u064E\u0627 (bittende Negation)', mood: 2, trigger: 8, ending: 2, explanation: '\u0644\u064E\u0627 hier mit Jussiv — bittende Negation (Dua). Sukun am Ende' },
  { ref: '22:77', verb: '\u064A\u064F\u0641\u0652\u0644\u0650\u062D\u064F\u0648\u0646\u064E', context: '\u0644\u064E\u0639\u064E\u0644\u0651\u064E\u0643\u064F\u0645\u0652', mood: 0, trigger: 0, ending: 0, explanation: '\u0644\u064E\u0639\u064E\u0644\u0651\u064E löst keinen Modus aus. Indikativ mit \u0648\u0646\u064E' },
  { ref: '3:139', verb: '\u062A\u064E\u0647\u0650\u0646\u064F\u0648\u0627', context: 'Nach \u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0647\u064A\u0629', mood: 2, trigger: 8, ending: 2, explanation: '\u0644\u064E\u0627 + Jussiv (Verbot). Nun-Wegfall' },
  { ref: '7:56', verb: '\u062A\u064F\u0641\u0652\u0633\u0650\u062F\u064F\u0648\u0627', context: 'Nach \u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0647\u064A\u0629', mood: 2, trigger: 8, ending: 2, explanation: '\u0644\u064E\u0627 \u062A\u064F\u0641\u0652\u0633\u0650\u062F\u064F\u0648\u0627 — Verbot. Jussiv: Nun fällt weg' },
  { ref: '64:14', verb: '\u062A\u064E\u062D\u0652\u0630\u064E\u0631\u064F\u0648\u0647\u064F\u0645\u0652', context: 'Nach \u0625\u0650\u0646\u0652 (Bedingung)', mood: 2, trigger: 9, ending: 2, explanation: '\u0625\u0650\u0646\u0652 — Bedingungssatz. Verb im Jussiv: Nun-Wegfall' },
]

export default function VerbModeDrill() {
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState({ mood: null, trigger: null, ending: null })
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  const ex = EXERCISES[idx]
  if (!ex) return null

  function check() {
    setRevealed(true)
    let correct = 0
    if (selected.mood === ex.mood) correct++
    if (selected.trigger === ex.trigger) correct++
    if (selected.ending === ex.ending) correct++
    setScore(s => ({ correct: s.correct + correct, total: s.total + 3 }))
  }

  function next() {
    setIdx((idx + 1) % EXERCISES.length)
    setSelected({ mood: null, trigger: null, ending: null })
    setRevealed(false)
  }

  const allSelected = selected.mood !== null && selected.trigger !== null && selected.ending !== null

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h3 style={{ color: 'var(--accent-gold)', marginBottom: 4 }}>Verbmodus-Drill</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>
        Bestimme den Modus des Imperfektverbs, den Auslöser und die erwartete Endung.
      </p>
      {score.total > 0 && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>{score.correct}/{score.total} korrekt ({Math.round(score.correct / score.total * 100)}%)</div>}

      <div style={{ background: 'var(--card-bg)', borderRadius: 12, padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>{ex.ref}</div>
          <div style={{ fontFamily: 'var(--font-arabic)', fontSize: '2.2rem', color: 'var(--accent-gold)', direction: 'rtl' }}>{ex.verb}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 8 }}>Kontext: {ex.context}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>1. Modus</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {MOODS.map((m, i) => (
                <button key={i} onClick={() => !revealed && setSelected(s => ({ ...s, mood: i }))} style={{
                  flex: 1, padding: '8px 12px', borderRadius: 8, cursor: revealed ? 'default' : 'pointer', fontSize: '0.85rem',
                  border: selected.mood === i ? '2px solid var(--accent-teal)' : '1px solid var(--border)',
                  background: revealed ? (i === ex.mood ? 'rgba(34,197,94,0.15)' : selected.mood === i ? 'rgba(239,68,68,0.15)' : 'var(--bg)') : (selected.mood === i ? 'rgba(45,212,191,0.1)' : 'var(--bg)'),
                  color: 'var(--text)'
                }}>{m}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>2. Auslöser</label>
            <select value={selected.trigger === null ? '' : selected.trigger} onChange={e => !revealed && setSelected(s => ({ ...s, trigger: parseInt(e.target.value) }))} disabled={revealed}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem' }}>
              <option value="">-- Wähle Auslöser --</option>
              {TRIGGERS.map((t, i) => <option key={i} value={i}>{t}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>3. Erwartete Endung</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {ENDINGS.map((e, i) => (
                <button key={i} onClick={() => !revealed && setSelected(s => ({ ...s, ending: i }))} style={{
                  flex: 1, padding: '8px 12px', borderRadius: 8, cursor: revealed ? 'default' : 'pointer', fontSize: '0.85rem',
                  border: selected.ending === i ? '2px solid var(--accent-teal)' : '1px solid var(--border)',
                  background: revealed ? (i === ex.ending ? 'rgba(34,197,94,0.15)' : selected.ending === i ? 'rgba(239,68,68,0.15)' : 'var(--bg)') : (selected.ending === i ? 'rgba(45,212,191,0.1)' : 'var(--bg)'),
                  color: 'var(--text)'
                }}>{e}</button>
              ))}
            </div>
          </div>
        </div>

        {!revealed && <button onClick={check} disabled={!allSelected} style={{ padding: '10px 28px', borderRadius: 8, border: 'none', background: allSelected ? 'var(--accent-teal)' : 'var(--text-muted)', color: '#fff', cursor: allSelected ? 'pointer' : 'default', width: '100%' }}>Prüfen</button>}

        {revealed && (
          <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600, color: '#22c55e', marginBottom: 4 }}>{MOODS[ex.mood]} | {TRIGGERS[ex.trigger]} | {ENDINGS[ex.ending]}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{ex.explanation}</div>
            <button onClick={next} style={{ marginTop: 12, padding: '8px 24px', borderRadius: 8, border: 'none', background: 'var(--accent-gold)', color: '#000', cursor: 'pointer' }}>Weiter ({idx + 1}/{EXERCISES.length})</button>
          </div>
        )}
      </div>
    </div>
  )
}
