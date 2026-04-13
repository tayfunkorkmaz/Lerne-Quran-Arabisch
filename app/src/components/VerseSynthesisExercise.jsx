import { useState, useMemo } from 'react'
import externalVersesData from '../data/verse-synthesis-exercises.json'

const externalVerses = externalVersesData.exercises || externalVersesData

const INLINE_VERSES = [
  {
    ref: '1:1', arabic: '\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u064E\u0647\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0670\u0646\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650',
    wordAnalysis: [
      { word: '\u0628\u0650\u0633\u0652\u0645\u0650', analysis: '\u0628\u0650 (Präposition, Genitiv) + \u0627\u0633\u0652\u0645 (Nomen, Wurzel \u0633-\u0645-\u0648, Muster \u0627\u0650\u0641\u0652\u0639\u0650\u0644)' },
      { word: '\u0627\u0644\u0644\u0651\u064E\u0647\u0650', analysis: 'Eigenname, Genitiv (Mudaf ilayhi)' },
      { word: '\u0627\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0670\u0646\u0650', analysis: 'Sifa, Wurzel \u0631-\u062D-\u0645, Muster \u0641\u064E\u0639\u0652\u0644\u064E\u0627\u0646 (Intensivform), Genitiv' },
      { word: '\u0627\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650', analysis: 'Sifa, Wurzel \u0631-\u062D-\u0645, Muster \u0641\u064E\u0639\u0650\u064A\u0644 (dauerhafte Eigenschaft), Genitiv' }
    ],
    structure: 'Jarr wa-Majrur (\u0628\u0650\u0633\u0652\u0645\u0650) + Iḍāfa (\u0627\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u064E\u0647\u0650) + zwei Sifat (\u0627\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0670\u0646\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650)',
    synthesis: 'Mit/Im Namen Gottes, des intensiv Barmherzigen, des dauerhaft Barmherzigen.'
  },
  {
    ref: '1:2', arabic: '\u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F \u0644\u0650\u0644\u0651\u064E\u0647\u0650 \u0631\u064E\u0628\u0651\u0650 \u0627\u0644\u0652\u0639\u064E\u0627\u0644\u064E\u0645\u0650\u064A\u0646\u064E',
    wordAnalysis: [
      { word: '\u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F', analysis: 'Mubtada (Nominativ), Wurzel \u062D-\u0645-\u062F, Masdar (Lob/Preis), definit' },
      { word: '\u0644\u0650\u0644\u0651\u064E\u0647\u0650', analysis: 'Khabar (Jarr wa-Majrur), \u0644\u0650 + \u0627\u0644\u0644\u0651\u064E\u0647 im Genitiv' },
      { word: '\u0631\u064E\u0628\u0651\u0650', analysis: 'Badal/Sifa zu \u0627\u0644\u0644\u0651\u064E\u0647, Genitiv, Wurzel \u0631-\u0628-\u0628' },
      { word: '\u0627\u0644\u0652\u0639\u064E\u0627\u0644\u064E\u0645\u0650\u064A\u0646\u064E', analysis: 'Mudaf ilayhi, Genitiv (gesunder mask. Plural mit -\u064A\u0646), Wurzel \u0639-\u0644-\u0645' }
    ],
    structure: 'Nominalsatz: Mubtada (\u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F) + Khabar (\u0644\u0650\u0644\u0651\u064E\u0647\u0650) + Apposition (\u0631\u064E\u0628\u0651\u0650 \u0627\u0644\u0652\u0639\u064E\u0627\u0644\u064E\u0645\u0650\u064A\u0646\u064E)',
    synthesis: 'Das Lob gehört Gott, dem Herrn der Welten/Geschöpfe.'
  },
  {
    ref: '1:5', arabic: '\u0625\u0650\u064A\u0651\u064E\u0627\u0643\u064E \u0646\u064E\u0639\u0652\u0628\u064F\u062F\u064F \u0648\u064E\u0625\u0650\u064A\u0651\u064E\u0627\u0643\u064E \u0646\u064E\u0633\u0652\u062A\u064E\u0639\u0650\u064A\u0646\u064F',
    wordAnalysis: [
      { word: '\u0625\u0650\u064A\u0651\u064E\u0627\u0643\u064E', analysis: 'Maf\u2019ul bihi (vorangestellt), Pronomen 2ms Akkusativ' },
      { word: '\u0646\u064E\u0639\u0652\u0628\u064F\u062F\u064F', analysis: 'Imperfekt 1pl, Wurzel \u0639-\u0628-\u062F, Form I, Indikativ' },
      { word: '\u0648\u064E\u0625\u0650\u064A\u0651\u064E\u0627\u0643\u064E', analysis: '\u0648\u064E (Konjunktion) + \u0625\u0650\u064A\u0651\u064E\u0627\u0643\u064E (Maf\u2019ul bihi vorangestellt)' },
      { word: '\u0646\u064E\u0633\u0652\u062A\u064E\u0639\u0650\u064A\u0646\u064F', analysis: 'Imperfekt 1pl, Wurzel \u0639-\u0648-\u0646, Form X, Indikativ' }
    ],
    structure: 'Zwei parallele Verbalsätze mit vorangestelltem Objekt (Taqdim al-Maf\u2019ul): Objekt + Verb || \u0648 + Objekt + Verb',
    synthesis: 'Dich dienen wir und Dich bitten wir um Hilfe.'
  },
  {
    ref: '112:1-4', arabic: '\u0642\u064F\u0644\u0652 \u0647\u064F\u0648\u064E \u0627\u0644\u0644\u0651\u064E\u0647\u064F \u0623\u064E\u062D\u064E\u062F\u064C \u0627\u0644\u0644\u0651\u064E\u0647\u064F \u0627\u0644\u0635\u0651\u064E\u0645\u064E\u062F\u064F \u0644\u064E\u0645\u0652 \u064A\u064E\u0644\u0650\u062F\u0652 \u0648\u064E\u0644\u064E\u0645\u0652 \u064A\u064F\u0648\u0644\u064E\u062F\u0652 \u0648\u064E\u0644\u064E\u0645\u0652 \u064A\u064E\u0643\u064F\u0646 \u0644\u0651\u064E\u0647\u064F \u0643\u064F\u0641\u064F\u0648\u064B\u0627 \u0623\u064E\u062D\u064E\u062F\u064C',
    wordAnalysis: [
      { word: '\u0642\u064F\u0644\u0652', analysis: 'Imperativ, Wurzel \u0642-\u0648-\u0644, Form I, 2ms' },
      { word: '\u0647\u064F\u0648\u064E', analysis: 'Pronomen 3ms, Mubtada oder Damir ash-Sha\u2019n' },
      { word: '\u0627\u0644\u0644\u0651\u064E\u0647\u064F', analysis: 'Mubtada (Nominativ) oder Khabar' },
      { word: '\u0623\u064E\u062D\u064E\u062F\u064C', analysis: 'Khabar (Nominativ + Tanwin), Wurzel \u0648-\u062D-\u062F' },
      { word: '\u0627\u0644\u0635\u0651\u064E\u0645\u064E\u062F\u064F', analysis: 'Khabar (Nominativ), Wurzel \u0635-\u0645-\u062F, der Beständige' },
      { word: '\u0644\u064E\u0645\u0652 \u064A\u064E\u0644\u0650\u062F\u0652', analysis: '\u0644\u064E\u0645\u0652 + Jussiv, Wurzel \u0648-\u0644-\u062F, er zeugte nicht' },
      { word: '\u0643\u064F\u0641\u064F\u0648\u064B\u0627', analysis: 'Khabar muqaddam von \u064A\u064E\u0643\u064F\u0646 (Akkusativ), Wurzel \u0643-\u0641-\u0621' },
      { word: '\u0623\u064E\u062D\u064E\u062F\u064C', analysis: 'Ism von \u064A\u064E\u0643\u064F\u0646 (Nominativ)' }
    ],
    structure: 'Imperativ + Nominalsatz + Nominalsatz + 2x negierter Verbalsatz + negierter Kana-Satz',
    synthesis: 'Sprich: Er ist Gott, Einer. Gott, der Beständige. Er zeugte nicht und wurde nicht gezeugt. Und keiner ist ihm ebenbuertig.'
  }
]

export default function VerseSynthesisExercise() {
  const VERSES = useMemo(() => {
    if (externalVerses && Array.isArray(externalVerses) && externalVerses.length > 0) return externalVerses
    return INLINE_VERSES
  }, [])
  const [idx, setIdx] = useState(0)
  const [showWords, setShowWords] = useState(false)
  const [showStructure, setShowStructure] = useState(false)
  const [userSynthesis, setUserSynthesis] = useState('')
  const [showSample, setShowSample] = useState(false)

  const v = VERSES[idx]
  if (!v) return null
  const words = v.wordAnalysis ? (v.wordAnalysis[0]?.analysis ? v.wordAnalysis : v.wordAnalysis.map(w => ({ word: w.word, analysis: `${w.role}: ${w.form}, Wurzel ${w.root} — ${w.meaning}` }))) : []

  function goTo(newIdx) {
    setIdx(newIdx)
    setShowWords(false)
    setShowStructure(false)
    setUserSynthesis('')
    setShowSample(false)
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h3 style={{ color: 'var(--accent-gold)', marginBottom: 4 }}>Vers-Synthese</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>
        Analysiere die Einzelwörter, erkenne die Satzstruktur, und formuliere die Gesamtbedeutung des Verses.
      </p>
      <div style={{ background: 'var(--card-bg)', borderRadius: 12, padding: 24 }}>
        <div style={{ textAlign: 'center', fontFamily: 'var(--font-arabic)', fontSize: '1.8rem', direction: 'rtl', lineHeight: 2.2, marginBottom: 8, color: 'var(--accent-gold)' }}>{v.arabic}</div>
        <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 20 }}>{v.ref}</div>
        <button onClick={() => setShowWords(!showWords)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer', marginBottom: 8 }}>
          {showWords ? 'Wortanalyse verbergen' : 'Wortanalyse anzeigen'}
        </button>
        {showWords && (
          <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, marginBottom: 12 }}>
            {words.map((w, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 8, alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.2rem', color: 'var(--accent-teal)', minWidth: 80, textAlign: 'right' }}>{w.word}</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{w.analysis}</span>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => setShowStructure(!showStructure)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer', marginBottom: 12 }}>
          {showStructure ? 'Struktur verbergen' : 'Satzstruktur anzeigen'}
        </button>
        {showStructure && (
          <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, marginBottom: 12, fontSize: '0.85rem', color: 'var(--accent-teal)' }}>{v.structure}</div>
        )}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Deine Synthese (Gesamtbedeutung):</label>
          <textarea value={userSynthesis} onChange={e => setUserSynthesis(e.target.value)} rows={3}
            placeholder="Formuliere die Bedeutung des Verses basierend auf deiner Analyse..."
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.95rem', resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>
        <button onClick={() => setShowSample(!showSample)} style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: 'var(--accent-teal)', color: '#fff', cursor: 'pointer', marginBottom: 8 }}>
          {showSample ? 'Beispielsynthese verbergen' : 'Beispielsynthese anzeigen'}
        </button>
        {showSample && (
          <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, marginBottom: 12, fontSize: '0.9rem', color: 'var(--correct)', fontStyle: 'italic' }}>{v.synthesis || v.sampleSynthesis}</div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={() => goTo((idx - 1 + VERSES.length) % VERSES.length)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer' }}>Vorheriger</button>
          <button onClick={() => goTo((idx + 1) % VERSES.length)} style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: 'var(--accent-gold)', color: '#000', cursor: 'pointer' }}>Nächster</button>
        </div>
      </div>
    </div>
  )
}
