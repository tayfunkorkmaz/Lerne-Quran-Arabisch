import { useState } from 'react'

const SEATS = ['\u0623 (auf Alif)', '\u0625 (unter Alif)', '\u0624 (auf Waw)', '\u0626 (auf Ya/Nabira)', '\u0621 (auf der Linie)', '\u0622 (Madda)', 'Hamzat al-Wasl (\u0627)']

const EXERCISES = [
  // Hamza am Wortanfang
  { word: '\u0623\u064E\u062E\u064E\u0630\u064E', type: 'seat', answer: 0, ref: '2:255', explanation: 'Hamza mit Fatha am Anfang → auf Alif oben (\u0623). Regel: Anfangs-Hamza mit Fatha oder Damma sitzt auf Alif oben' },
  { word: '\u0625\u0650\u0628\u0652\u0631\u064E\u0627\u0647\u0650\u064A\u0645\u064E', type: 'seat', answer: 1, ref: '2:124', explanation: 'Hamza mit Kasra am Anfang → unter Alif (\u0625). Regel: Anfangs-Hamza mit Kasra sitzt unter Alif' },
  { word: '\u0623\u064F\u0648\u0644\u064E\u0627\u0626\u0650\u0643\u064E', type: 'seat', answer: 0, ref: '2:5', explanation: 'Hamza mit Damma am Anfang → auf Alif oben (\u0623). Regel: Damma am Anfang → Alif oben' },
  { word: '\u0622\u0645\u064E\u0646\u064F\u0648\u0627', type: 'seat', answer: 5, ref: '2:8', explanation: 'Hamza gefolgt von langem a → Madda (\u0622). Hamza + Alif = Alif Madda' },
  // Hamza in der Mitte
  { word: '\u0645\u064F\u0624\u0652\u0645\u0650\u0646', type: 'seat', answer: 2, ref: '2:8', explanation: 'Mittleres Hamza: Vokal davor ist Damma (\u0645\u064F), Hamza hat Sukun → Waw gewinnt. Regel: Damma > Fatha > Kasra > Sukun. Damma = Waw' },
  { word: '\u0633\u064E\u0623\u064E\u0644\u064E', type: 'seat', answer: 0, ref: '2:108', explanation: 'Mittleres Hamza: Vokal davor ist Fatha (\u0633\u064E), Hamza hat Fatha → Alif. Fatha + Fatha = Alif' },
  { word: '\u0631\u064E\u0626\u0650\u064A\u0633', type: 'seat', answer: 3, ref: '—', explanation: 'Mittleres Hamza: Hamza hat Kasra (\u0650) → Kasra ist der stärkste Vokal → Ya/Nabira (\u0626)' },
  { word: '\u0628\u0650\u0626\u0652\u0633\u064E', type: 'seat', answer: 3, ref: '2:177', explanation: 'Mittleres Hamza: Vokal davor ist Kasra (\u0628\u0650), Hamza hat Sukun → Kasra gewinnt → Ya/Nabira (\u0626)' },
  // Hamza am Ende
  { word: '\u0633\u064E\u0645\u064E\u0627\u0621', type: 'seat', answer: 4, ref: '2:19', explanation: 'End-Hamza: Vokal davor ist Langvokal \u0627 → auf der Linie (\u0621). Nach Langvokal/Sukun steht Hamza allein' },
  { word: '\u0634\u064E\u064A\u0652\u0621', type: 'seat', answer: 4, ref: '2:20', explanation: 'End-Hamza: Vokal davor ist Sukun (\u064A\u0652) → auf der Linie (\u0621)' },
  { word: '\u0636\u064E\u0648\u0652\u0621', type: 'seat', answer: 4, ref: '24:35', explanation: 'End-Hamza: Vokal davor ist Sukun (\u0648\u0652) → auf der Linie (\u0621)' },
  { word: '\u0645\u064E\u0644\u0652\u062C\u064E\u0623', type: 'seat', answer: 0, ref: '18:58', explanation: 'End-Hamza: Vokal davor ist Fatha (\u062C\u064E) → auf Alif (\u0623). Fatha = Alif' },
  // Wasl vs. Qat
  { word: '\u0627\u0633\u0652\u0645', type: 'wasl_qat', answer: 6, ref: '1:1', explanation: 'Hamzat al-Wasl. \u0627\u0633\u0652\u0645 (Nomen) beginnt mit Wasl-Hamza — wird nur am Satzanfang gesprochen, nach Vokal fällt sie weg (bi-smi, nicht bi-ismi)' },
  { word: '\u0627\u0628\u0652\u0646', type: 'wasl_qat', answer: 6, ref: '19:34', explanation: 'Hamzat al-Wasl. Eines der 10 Nomen mit Wasl-Hamza' },
  { word: '\u0627\u0647\u0652\u062F\u0650', type: 'wasl_qat', answer: 6, ref: '1:6', explanation: 'Hamzat al-Wasl. Imperativ von Form I (Grundstamm) beginnt immer mit Wasl-Hamza' },
  { word: '\u0627\u0633\u0652\u062A\u064E\u063A\u0652\u0641\u0650\u0631\u0652', type: 'wasl_qat', answer: 6, ref: '47:19', explanation: 'Hamzat al-Wasl. Imperativ von Form X beginnt mit Wasl-Hamza (wie alle Formen VII-X)' },
  { word: '\u0623\u064E\u0646\u0652\u0632\u064E\u0644\u064E', type: 'wasl_qat', answer: 0, ref: '2:4', explanation: 'Hamzat al-Qat (\u0623). Perfekt Form IV beginnt mit Qat-Hamza (af\u02BFala). Wird IMMER gesprochen' },
  { word: '\u0625\u0650\u0646\u0651\u064E', type: 'wasl_qat', answer: 1, ref: '2:6', explanation: 'Hamzat al-Qat (\u0625). Partikel \u0625\u0650\u0646\u0651\u064E beginnt mit Qat-Hamza unter Alif. Wird IMMER gesprochen' },
  { word: '\u0623\u064E\u0646\u064E\u0627', type: 'wasl_qat', answer: 0, ref: '20:14', explanation: 'Hamzat al-Qat (\u0623). Pronomen beginnen mit Qat-Hamza. Wird IMMER gesprochen' },
  { word: '\u0625\u0650\u0641\u0652\u0639\u064E\u0627\u0644', type: 'wasl_qat', answer: 1, ref: '—', explanation: 'Hamzat al-Qat (\u0625). Masdar Form IV beginnt mit Qat-Hamza. Wird IMMER gesprochen' },
  { word: '\u0627\u0646\u0641\u064E\u0639\u064E\u0644\u064E', type: 'wasl_qat', answer: 6, ref: '—', explanation: 'Hamzat al-Wasl. Perfekt Form VII beginnt mit Wasl-Hamza. Fällt nach Vokal weg' },
  { word: '\u0627\u0641\u0652\u062A\u064E\u0639\u064E\u0644\u064E', type: 'wasl_qat', answer: 6, ref: '—', explanation: 'Hamzat al-Wasl. Perfekt Form VIII beginnt mit Wasl-Hamza' },
  { word: '\u0627\u0633\u0652\u062A\u064E\u0641\u0652\u0639\u064E\u0644\u064E', type: 'wasl_qat', answer: 6, ref: '—', explanation: 'Hamzat al-Wasl. Perfekt Form X beginnt mit Wasl-Hamza' },
  // === NEUE ÜBUNGEN: Hamza am Wortanfang ===
  { word: '\u0623\u064E\u0639\u0652\u0637\u064E\u0649', type: 'seat', answer: 0, ref: '92:5', explanation: 'Hamza mit Fatha am Anfang → auf Alif oben (\u0623). Perfekt Form IV (af\u02BFala)' },
  { word: '\u0625\u0650\u064A\u0645\u064E\u0627\u0646', type: 'seat', answer: 1, ref: '49:7', explanation: 'Hamza mit Kasra am Anfang → unter Alif (\u0625). Masdar Form IV' },
  { word: '\u0623\u064F\u0646\u0632\u0650\u0644\u064E', type: 'seat', answer: 0, ref: '2:4', explanation: 'Hamza mit Damma am Anfang → auf Alif oben (\u0623). Passiv Form IV' },
  { word: '\u0622\u064A\u064E\u0627\u062A', type: 'seat', answer: 5, ref: '2:39', explanation: 'Hamza gefolgt von langem a → Madda (\u0622). Hamza + Alif = Alif Madda' },
  { word: '\u0623\u064E\u062D\u064E\u062F', type: 'seat', answer: 0, ref: '112:1', explanation: 'Hamza mit Fatha am Anfang → auf Alif oben (\u0623). Wurzel \u0623-\u062D-\u062F' },
  { word: '\u0625\u0650\u0644\u064E\u0670\u0647', type: 'seat', answer: 1, ref: '2:163', explanation: 'Hamza mit Kasra am Anfang → unter Alif (\u0625). Nomen: Gottheit' },
  { word: '\u0623\u064F\u0645\u0651\u064E\u0629', type: 'seat', answer: 0, ref: '2:128', explanation: 'Hamza mit Damma am Anfang → auf Alif oben (\u0623). Gemeinschaft' },
  { word: '\u0622\u062E\u064E\u0631', type: 'seat', answer: 5, ref: '2:8', explanation: 'Hamza gefolgt von langem a → Madda (\u0622). Alif Madda in \u0622\u062E\u064E\u0631' },
  { word: '\u0625\u0650\u0633\u0652\u0631\u064E\u0627\u0621', type: 'seat', answer: 1, ref: '17:1', explanation: 'Hamza mit Kasra am Anfang → unter Alif (\u0625). Masdar Form IV von \u0633-\u0631-\u064A' },
  // === NEUE ÜBUNGEN: Hamza in der Wortmitte ===
  { word: '\u0633\u064F\u0624\u064E\u0627\u0644', type: 'seat', answer: 2, ref: '70:1', explanation: 'Mittleres Hamza: Vokal davor ist Damma (\u0633\u064F), Hamza hat Fatha → Damma gewinnt → Waw (\u0624)' },
  { word: '\u0631\u064F\u0624\u064F\u0648\u0633', type: 'seat', answer: 2, ref: '14:43', explanation: 'Mittleres Hamza: Vokal davor ist Damma (\u0631\u064F), Hamza hat Damma → Waw (\u0624)' },
  { word: '\u0641\u064F\u0624\u064E\u0627\u062F', type: 'seat', answer: 2, ref: '28:10', explanation: 'Mittleres Hamza: Vokal davor ist Damma (\u0641\u064F), Hamza hat Fatha → Damma gewinnt → Waw (\u0624)' },
  { word: '\u064A\u064E\u0626\u0650\u0633\u064F\u0648\u0627', type: 'seat', answer: 3, ref: '13:31', explanation: 'Mittleres Hamza: Hamza hat Kasra → Kasra ist stärkster Vokal → Ya/Nabira (\u0626)' },
  { word: '\u0633\u064E\u0626\u0650\u0645\u064E\u062A', type: 'seat', answer: 3, ref: '18:69', explanation: 'Mittleres Hamza: Hamza hat Kasra → Kasra gewinnt → Ya/Nabira (\u0626)' },
  { word: '\u0644\u064F\u0624\u0652\u0644\u064F\u0624', type: 'seat', answer: 2, ref: '56:22', explanation: 'Mittleres Hamza: Vokal davor ist Damma (\u0644\u064F), Hamza hat Sukun → Damma gewinnt → Waw (\u0624)' },
  { word: '\u0645\u064E\u0633\u0652\u0623\u064E\u0644\u064E\u0629', type: 'seat', answer: 0, ref: '5:101', explanation: 'Mittleres Hamza: Vokal davor ist Sukun (\u0633\u0652), Hamza hat Fatha → Fatha gewinnt → Alif (\u0623)' },
  { word: '\u064A\u064E\u0634\u064E\u0627\u0621\u064F', type: 'seat', answer: 4, ref: '2:90', explanation: 'Mittleres Hamza: Vokal davor ist Langvokal \u0627 → Hamza steht auf der Linie (\u0621)' },
  { word: '\u0628\u0650\u0626\u0652\u0631', type: 'seat', answer: 3, ref: '22:45', explanation: 'Mittleres Hamza: Vokal davor ist Kasra (\u0628\u0650), Hamza hat Sukun → Kasra gewinnt → Ya/Nabira (\u0626)' },
  // === NEUE ÜBUNGEN: Hamza am Wortende ===
  { word: '\u0646\u064E\u0628\u064E\u0623\u064E', type: 'seat', answer: 0, ref: '6:5', explanation: 'End-Hamza: Vokal davor ist Fatha (\u0628\u064E) → auf Alif (\u0623). Fatha = Alif' },
  { word: '\u064A\u064F\u0646\u0634\u0650\u0626\u064F', type: 'seat', answer: 3, ref: '43:18', explanation: 'End-Hamza: Vokal davor ist Kasra (\u0634\u0650) → auf Ya/Nabira (\u0626). Kasra = Ya' },
  { word: '\u0627\u0645\u0652\u0631\u0650\u0626\u064D', type: 'seat', answer: 3, ref: '4:176', explanation: 'End-Hamza: Vokal davor ist Kasra (\u0631\u0650) → auf Ya/Nabira (\u0626). Kasra gewinnt' },
  { word: '\u062A\u064E\u0628\u064E\u0648\u0651\u064F\u0624\u064F', type: 'seat', answer: 2, ref: '52:45', explanation: 'End-Hamza: Vokal davor ist Damma (\u0648\u0651\u064F) → auf Waw (\u0624). Damma = Waw' },
  { word: '\u0648\u064F\u0636\u064F\u0648\u0621', type: 'seat', answer: 4, ref: '5:6', explanation: 'End-Hamza: Vokal davor ist Langvokal \u0648 → auf der Linie (\u0621)' },
  { word: '\u0645\u064E\u0627\u0621', type: 'seat', answer: 4, ref: '2:22', explanation: 'End-Hamza: Vokal davor ist Langvokal \u0627 → auf der Linie (\u0621)' },
  { word: '\u0643\u064F\u0641\u064F\u0624\u064B\u0627', type: 'seat', answer: 2, ref: '112:4', explanation: 'End-Hamza: Vokal davor ist Damma (\u0641\u064F) → auf Waw (\u0624). Damma = Waw' },
  { word: '\u062F\u0650\u0641\u0652\u0621', type: 'seat', answer: 4, ref: '22:40', explanation: 'End-Hamza: Vokal davor ist Sukun (\u0641\u0652) → auf der Linie (\u0621)' },
  { word: '\u0628\u064E\u0631\u0650\u064A\u0621', type: 'seat', answer: 4, ref: '44:32', explanation: 'End-Hamza: Vokal davor ist Langvokal \u064A → auf der Linie (\u0621)' },
]

export default function HamzaExercise() {
  const [mode, setMode] = useState('seat') // 'seat' | 'wasl_qat'
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  const filtered = EXERCISES.filter(e => e.type === mode)
  if (filtered.length === 0) return <div style={{ maxWidth: 700, margin: '0 auto', padding: 24, color: 'var(--text-secondary)' }}>Keine Übungen für diesen Modus verfügbar.</div>
  const ex = filtered[idx % filtered.length]
  if (!ex) return null

  function check() {
    setRevealed(true)
    setScore(s => ({ correct: s.correct + (selected === ex.answer ? 1 : 0), total: s.total + 1 }))
  }

  function next() {
    setIdx(i => (i + 1) % filtered.length)
    setSelected(null)
    setRevealed(false)
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h3 style={{ color: 'var(--accent-gold)', marginBottom: 4 }}>Hamza-Orthographie</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => { setMode('seat'); setIdx(0); setRevealed(false); setSelected(null); }} style={{
          padding: '6px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
          border: mode === 'seat' ? '2px solid var(--accent-teal)' : '1px solid var(--border)',
          background: mode === 'seat' ? 'rgba(45,212,191,0.1)' : 'var(--bg)',
          color: mode === 'seat' ? 'var(--accent-teal)' : 'var(--text-secondary)',
        }}>Hamza-Sitz bestimmen</button>
        <button onClick={() => { setMode('wasl_qat'); setIdx(0); setRevealed(false); setSelected(null); }} style={{
          padding: '6px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
          border: mode === 'wasl_qat' ? '2px solid var(--accent-teal)' : '1px solid var(--border)',
          background: mode === 'wasl_qat' ? 'rgba(45,212,191,0.1)' : 'var(--bg)',
          color: mode === 'wasl_qat' ? 'var(--accent-teal)' : 'var(--text-secondary)',
        }}>Wasl vs. Qat</button>
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>
        {mode === 'seat'
          ? 'Bestimme wo Hamza sitzt: auf Alif, unter Alif, auf Waw, auf Ya, allein, oder als Madda.'
          : 'Ist es Hamzat al-Wasl (fällt nach Vokal weg) oder Hamzat al-Qat (wird immer gesprochen)?'}
      </p>

      {score.total > 0 && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>{score.correct}/{score.total} korrekt</div>}

      <div style={{ background: 'var(--card-bg)', borderRadius: 12, padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-arabic)', fontSize: '3rem', color: 'var(--accent-gold)', direction: 'rtl' }}>{ex.word}</div>
          {ex.ref !== '\u2014' && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{ex.ref}</div>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {(mode === 'seat' ? SEATS.slice(0, 6) : [SEATS[0], SEATS[1], SEATS[6]]).map((seat, i) => {
            const answerIdx = mode === 'wasl_qat' ? (i === 0 ? 0 : i === 1 ? 1 : 6) : i
            return (
              <button key={i} onClick={() => !revealed && setSelected(answerIdx)} style={{
                padding: '10px 16px', borderRadius: 8, textAlign: 'left', cursor: revealed ? 'default' : 'pointer',
                border: selected === answerIdx ? '2px solid var(--accent-teal)' : '1px solid var(--border)',
                background: revealed ? (answerIdx === ex.answer ? 'rgba(34,197,94,0.15)' : selected === answerIdx ? 'rgba(239,68,68,0.15)' : 'var(--bg)') : (selected === answerIdx ? 'rgba(45,212,191,0.1)' : 'var(--bg)'),
                color: 'var(--text)', fontSize: '0.95rem'
              }}>{seat}</button>
            )
          })}
        </div>

        {!revealed && <button onClick={check} disabled={selected === null} style={{ padding: '10px 28px', borderRadius: 8, border: 'none', background: selected !== null ? 'var(--accent-teal)' : 'var(--text-muted)', color: '#fff', cursor: selected !== null ? 'pointer' : 'default', width: '100%' }}>Prüfen</button>}

        {revealed && (
          <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600, color: '#22c55e', marginBottom: 4 }}>{SEATS[ex.answer]}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{ex.explanation}</div>
            <button onClick={next} style={{ marginTop: 12, padding: '8px 24px', borderRadius: 8, border: 'none', background: 'var(--accent-gold)', color: '#000', cursor: 'pointer' }}>
              Weiter ({(idx % filtered.length) + 1}/{filtered.length})
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
