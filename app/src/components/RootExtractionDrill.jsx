import { useState, useMemo } from 'react'
import rootExtGenerated from '../data/root-extraction-generated.json'

const INLINE_EXERCISES = [
  // Einfach — nackte Wurzel
  { consonantal: '\u0643\u062A\u0628', root: '\u0643-\u062A-\u0628', prefixes: '\u2014', suffixes: '\u2014', hint: 'Drei Konsonanten, keine Affixe', ref: '2:187', difficulty: 1 },
  { consonantal: '\u0639\u0644\u0645', root: '\u0639-\u0644-\u0645', prefixes: '\u2014', suffixes: '\u2014', hint: 'Drei Konsonanten', ref: '96:5', difficulty: 1 },
  { consonantal: '\u062E\u0644\u0642', root: '\u062E-\u0644-\u0642', prefixes: '\u2014', suffixes: '\u2014', hint: 'Drei Konsonanten', ref: '96:1', difficulty: 1 },
  { consonantal: '\u062D\u0645\u062F', root: '\u062D-\u0645-\u062F', prefixes: '\u2014', suffixes: '\u2014', hint: 'Drei Konsonanten', ref: '1:2', difficulty: 1 },
  { consonantal: '\u062E\u062A\u0645', root: '\u062E-\u062A-\u0645', prefixes: '\u2014', suffixes: '\u2014', hint: 'Drei Konsonanten', ref: '2:7', difficulty: 1 },
  // Mit Artikel
  { consonantal: '\u0627\u0644\u0643\u062A\u0628', root: '\u0643-\u062A-\u0628', prefixes: '\u0627\u0644\u0640', suffixes: '\u2014', hint: '\u0627\u0644 ist der Artikel', ref: '2:2', difficulty: 2 },
  { consonantal: '\u0627\u0644\u0631\u062D\u0645\u0646', root: '\u0631-\u062D-\u0645', prefixes: '\u0627\u0644\u0640', suffixes: '\u2014', hint: '\u0627\u0644 ist Artikel. Das \u0646 gehört zum Muster \u0641\u064E\u0639\u0652\u0644\u064E\u0627\u0646', ref: '1:1', difficulty: 2 },
  { consonantal: '\u0627\u0644\u0639\u0644\u0645\u064A\u0646', root: '\u0639-\u0644-\u0645', prefixes: '\u0627\u0644\u0640', suffixes: '\u064A\u0646', hint: '\u0627\u0644 ist Artikel, \u064A\u0646 ist Pluralendung', ref: '1:2', difficulty: 2 },
  { consonantal: '\u0627\u0644\u062F\u064A\u0646', root: '\u062F-\u064A-\u0646', prefixes: '\u0627\u0644\u0640', suffixes: '\u2014', hint: '\u0627\u0644 entfernen. 3 Konsonanten bleiben', ref: '1:4', difficulty: 2 },
  { consonantal: '\u0627\u0644\u0635\u0631\u0637', root: '\u0635-\u0631-\u0637', prefixes: '\u0627\u0644\u0640', suffixes: '\u2014', hint: 'Artikel entfernen', ref: '1:6', difficulty: 2 },
  // Mit Präposition + Artikel
  { consonantal: '\u0628\u0627\u0644\u0644\u0647', root: '\u0627-\u0644-\u0647', prefixes: '\u0628\u0650\u0640', suffixes: '\u2014', hint: '\u0628\u0650 ist Präposition, Rest ist Eigenname', ref: '2:8', difficulty: 2 },
  { consonantal: '\u0641\u064A\u0647', root: '\u2014', prefixes: '\u0641\u064A (Präposition)', suffixes: '\u0647 (Suffix)', hint: 'Partikeln haben keine Wurzel', ref: '2:2', difficulty: 2 },
  { consonantal: '\u0639\u0644\u064A\u0647\u0645', root: '\u2014', prefixes: '\u0639\u0644\u0649 (Präposition)', suffixes: '\u0647\u0645 (Suffix)', hint: 'Präposition + Pronominalsuffix. Keine Wurzel', ref: '1:7', difficulty: 2 },
  // Mit Imperfekt-Präfix
  { consonantal: '\u064A\u0639\u0644\u0645\u0648\u0646', root: '\u0639-\u0644-\u0645', prefixes: '\u064A\u0640', suffixes: '\u0648\u0646', hint: '\u064A ist Imperfekt-Präfix 3. Person. \u0648\u0646 ist mask. Plural', ref: '2:13', difficulty: 3 },
  { consonantal: '\u062A\u0624\u0645\u0646\u0648\u0646', root: '\u0623-\u0645-\u0646', prefixes: '\u062A\u0640', suffixes: '\u0648\u0646', hint: '\u062A ist Imperfekt-Präfix. \u0624 ist Hamza auf Waw (Form IV)', ref: '2:3', difficulty: 3 },
  { consonantal: '\u0646\u0633\u062A\u0639\u064A\u0646', root: '\u0639-\u0648-\u0646', prefixes: '\u0646\u0640 + \u0633\u062A (Form X)', suffixes: '\u2014', hint: '\u0646 = 1pl Präfix. \u0633\u062A = Form X Infix. Wurzel ist schwach (Waw)', ref: '1:5', difficulty: 4 },
  { consonantal: '\u064A\u0646\u0641\u0642\u0648\u0646', root: '\u0646-\u0641-\u0642', prefixes: '\u064A\u0640', suffixes: '\u0648\u0646', hint: 'Form IV (\u0623\u064E\u0646\u0652\u0641\u064E\u0642\u064E). \u064A ist Präfix', ref: '2:3', difficulty: 3 },
  // Mit Suffixen
  { consonantal: '\u0643\u062A\u0628\u0647\u0645', root: '\u0643-\u062A-\u0628', prefixes: '\u2014', suffixes: '\u0647\u0645', hint: '\u0647\u0645 ist Pronominalsuffix (ihr/ihnen)', ref: '98:3', difficulty: 3 },
  { consonantal: '\u0631\u0633\u0648\u0644\u0647', root: '\u0631-\u0633-\u0644', prefixes: '\u2014', suffixes: '\u0647', hint: '\u0647 ist Possessivsuffix. \u0648 in \u0631\u0633\u0648\u0644 ist Teil des Musters', ref: '48:29', difficulty: 3 },
  { consonantal: '\u0627\u0646\u0639\u0645\u062A', root: '\u0646-\u0639-\u0645', prefixes: '\u0623\u064E (Form IV)', suffixes: '\u062A\u064E (2ms)', hint: '\u0623 am Anfang = Form IV. \u062A am Ende = Perfekt 2ms', ref: '1:7', difficulty: 3 },
  // Schwache Wurzeln
  { consonantal: '\u0642\u0627\u0644', root: '\u0642-\u0648-\u0644', prefixes: '\u2014', suffixes: '\u2014', hint: 'Hohles Verb: der mittlere Radikal \u0648 wird zum Langvokal \u0627', ref: '2:30', difficulty: 4 },
  { consonantal: '\u0647\u062F\u0649', root: '\u0647-\u062F-\u064A', prefixes: '\u2014', suffixes: '\u2014', hint: 'Defektes Verb: der letzte Radikal \u064A wird zu Alif maqsura \u0649', ref: '2:2', difficulty: 4 },
  { consonantal: '\u062C\u0627\u0621', root: '\u062C-\u064A-\u0623', prefixes: '\u2014', suffixes: '\u2014', hint: 'Doppelt schwach (medial+final). Hamza am Ende', ref: '2:87', difficulty: 5 },
  { consonantal: '\u0627\u062A\u0642\u0649', root: '\u0648-\u0642-\u064A', prefixes: '\u0627\u062A (Form VIII)', suffixes: '\u2014', hint: 'Form VIII von \u0648-\u0642-\u064A. Waw assimiliert zu Ta (Idgham)', ref: '2:197', difficulty: 5 },
  // Form IV/VII/VIII/X
  { consonantal: '\u0627\u0646\u0632\u0644', root: '\u0646-\u0632-\u0644', prefixes: '\u0623 (Form IV)', suffixes: '\u2014', hint: 'Hamza am Anfang = Form IV (af\u02BFala)', ref: '2:4', difficulty: 3 },
  { consonantal: '\u0627\u0633\u062A\u063A\u0641\u0631', root: '\u063A-\u0641-\u0631', prefixes: '\u0627\u0633\u062A (Form X)', suffixes: '\u2014', hint: '\u0627\u0633\u062A = Form X Präfix (istaf\u02BFala)', ref: '47:19', difficulty: 3 },
  { consonantal: '\u0645\u0633\u0644\u0645\u0648\u0646', root: '\u0633-\u0644-\u0645', prefixes: '\u0645\u0640 (Partizip)', suffixes: '\u0648\u0646 (mask. Plural)', hint: '\u0645 = Partizip-Präfix (Form IV: mu-). \u0648\u0646 = Pluralendung', ref: '2:132', difficulty: 3 },
  { consonantal: '\u0627\u0644\u0645\u0633\u062A\u0642\u064A\u0645', root: '\u0642-\u0648-\u0645', prefixes: '\u0627\u0644 + \u0645\u0640\u0633\u062A (Form X Partizip)', suffixes: '\u2014', hint: 'Artikel + Form X aktives Partizip. Wurzel ist hohl (\u0648)', ref: '1:6', difficulty: 5 },
  { consonantal: '\u0627\u0644\u0645\u062A\u0642\u064A\u0646', root: '\u0648-\u0642-\u064A', prefixes: '\u0627\u0644 + \u0645\u062A (Form VIII Partizip)', suffixes: '\u064A\u0646 (mask. Plural)', hint: 'Artikel + Form VIII Partizip. Doppelt schwach (\u0648 assimiliert)', ref: '2:2', difficulty: 5 },
  { consonantal: '\u064A\u062E\u0627\u062F\u0639\u0648\u0646', root: '\u062E-\u062F-\u0639', prefixes: '\u064A\u0640 (Imperfekt)', suffixes: '\u0648\u0646 (3mp)', hint: 'Form III (yu-faa\u02BFi-lu). Der Langvokal \u0627 nach \u062E ist Form-III-Marker', ref: '2:9', difficulty: 4 },
]

const EXERCISES = [...INLINE_EXERCISES, ...(rootExtGenerated.exercises || [])]

export default function RootExtractionDrill() {
  const [idx, setIdx] = useState(0)
  const [inputs, setInputs] = useState({ root: '', prefixes: '', suffixes: '' })
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [filterDifficulty, setFilterDifficulty] = useState(0) // 0 = all

  const filtered = useMemo(() => {
    if (filterDifficulty === 0) return EXERCISES
    return EXERCISES.filter(e => e.difficulty === filterDifficulty)
  }, [filterDifficulty])

  if (filtered.length === 0) return <div style={{ maxWidth: 700, margin: '0 auto', padding: 24, color: 'var(--text-secondary)' }}>Keine Übungen für diese Schwierigkeitsstufe verfügbar.</div>
  const ex = filtered[idx % filtered.length]
  if (!ex) return null

  const strip = s => s.replace(/[\u064B-\u065F\u0670\-\s]/g, '').trim()

  function check() {
    setRevealed(true)
    const rootOk = strip(inputs.root) === strip(ex.root.replace(/-/g, '')) || inputs.root.replace(/[-\s]/g, '') === ex.root.replace(/-/g, '')
    const noPrefix = ex.prefixes === '\u2014' || ex.prefixes === '-'
    const noSuffix = ex.suffixes === '\u2014' || ex.suffixes === '-'
    const userPrefixClean = strip(inputs.prefixes)
    const userSuffixClean = strip(inputs.suffixes)
    const prefixOk = (noPrefix && (userPrefixClean === '' || userPrefixClean === '\u2014' || userPrefixClean === '-'))
      || (!noPrefix && strip(ex.prefixes.replace(/[\s\u0640]/g, '')) === userPrefixClean)
    const suffixOk = (noSuffix && (userSuffixClean === '' || userSuffixClean === '\u2014' || userSuffixClean === '-'))
      || (!noSuffix && strip(ex.suffixes.replace(/[\s\u0640]/g, '')) === userSuffixClean)
    const allOk = rootOk && prefixOk && suffixOk
    setScore(s => ({ correct: s.correct + (allOk ? 1 : 0), total: s.total + 1 }))
  }

  function next() {
    setIdx(i => (i + 1) % filtered.length)
    setInputs({ root: '', prefixes: '', suffixes: '' })
    setRevealed(false)
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h3 style={{ color: 'var(--accent-gold)', marginBottom: 4 }}>Wurzelextraktion vom Konsonantentext</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>
        Extrahiere die Wurzelkonsonanten aus dem konsonantischen Wort (ohne Vokale).
      </p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {[0, 1, 2, 3, 4, 5].map(d => (
          <button key={d} onClick={() => { setFilterDifficulty(d); setIdx(0); setRevealed(false); setInputs({ root: '', prefixes: '', suffixes: '' }); }} style={{
            padding: '4px 12px', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer',
            background: filterDifficulty === d ? 'var(--accent-teal)' : 'var(--bg)',
            color: filterDifficulty === d ? '#fff' : 'var(--text-secondary)',
            border: `1px solid ${filterDifficulty === d ? 'var(--accent-teal)' : 'var(--border)'}`,
          }}>
            {d === 0 ? 'Alle' : `Stufe ${d}`}
          </button>
        ))}
      </div>

      {score.total > 0 && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>{score.correct}/{score.total} korrekt</div>}

      <div style={{ background: 'var(--card-bg)', borderRadius: 12, padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-arabic)', fontSize: '3rem', color: 'var(--accent-gold)', direction: 'rtl' }}>{ex.consonantal}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{ex.ref} | Stufe {ex.difficulty}</div>
        </div>

        <div style={{ padding: 8, background: 'var(--bg)', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem', color: 'var(--accent-teal)' }}>
          Hinweis: {ex.hint}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Präfix(e) entfernt</label>
            <input value={inputs.prefixes} onChange={e => setInputs({ ...inputs, prefixes: e.target.value })} disabled={revealed}
              placeholder="z.B. \u0627\u0644\u0640 oder \u2014"
              style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-arabic)', direction: 'rtl', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Wurzelkonsonanten</label>
            <input value={inputs.root} onChange={e => setInputs({ ...inputs, root: e.target.value })} disabled={revealed}
              placeholder="z.B. \u0643-\u062A-\u0628"
              style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-arabic)', fontSize: '1.2rem', direction: 'rtl', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Suffix(e) entfernt</label>
            <input value={inputs.suffixes} onChange={e => setInputs({ ...inputs, suffixes: e.target.value })} disabled={revealed}
              placeholder="z.B. \u0648\u0646 oder \u2014"
              style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-arabic)', direction: 'rtl', boxSizing: 'border-box' }} />
          </div>
        </div>

        {!revealed && (
          <button onClick={check} style={{ padding: '10px 28px', borderRadius: 8, border: 'none', background: 'var(--accent-teal)', color: '#fff', cursor: 'pointer', width: '100%' }}>
            Prüfen
          </button>
        )}

        {revealed && (
          <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600, color: '#22c55e', marginBottom: 8, fontSize: '1.1rem' }}>
              Wurzel: <span style={{ fontFamily: 'var(--font-arabic)', direction: 'rtl' }}>{ex.root}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <div>Präfix(e): <span style={{ color: 'var(--accent-teal)', fontFamily: 'var(--font-arabic)' }}>{ex.prefixes}</span></div>
              <div>Wurzel: <span style={{ color: '#22c55e', fontFamily: 'var(--font-arabic)' }}>{ex.root}</span></div>
              <div>Suffix(e): <span style={{ color: 'var(--accent-teal)', fontFamily: 'var(--font-arabic)' }}>{ex.suffixes}</span></div>
            </div>
            <button onClick={next} style={{ marginTop: 12, padding: '8px 24px', borderRadius: 8, border: 'none', background: 'var(--accent-gold)', color: '#000', cursor: 'pointer' }}>
              Nächstes Wort ({(idx + 1) % filtered.length + 1}/{filtered.length})
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
