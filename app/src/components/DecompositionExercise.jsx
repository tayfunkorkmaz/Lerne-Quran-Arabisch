import { useState, useMemo } from 'react'
import { stripVowelMarks } from '../utils/arabic.js'

import externalWordsData from '../data/decomposition-exercises.json'

const externalWords = externalWordsData.exercises || externalWordsData

const INLINE_WORDS = [
  { word: '\u064A\u064E\u0639\u0652\u0644\u064E\u0645\u064F\u0648\u0646\u064E', root: '\u0639-\u0644-\u0645', prefixes: '\u064A\u064E\u0640', pattern: '\u064A\u064E\u0641\u0652\u0639\u064E\u0644\u064F (I)', suffixes: '\u0648\u0646\u064E', meaning: 'sie wissen', ref: '2:13' },
  { word: '\u0628\u0650\u0633\u0652\u0645\u0650', root: '\u0633-\u0645-\u0648', prefixes: '\u0628\u0650\u0640', pattern: '\u0627\u0633\u0652\u0645 (\u0641\u0650\u0639\u0652\u0644)', suffixes: '\u2014', meaning: 'im Namen', ref: '1:1' },
  { word: '\u0627\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650', root: '\u0631-\u062D-\u0645', prefixes: '\u0627\u0644\u0640', pattern: '\u0641\u064E\u0639\u0650\u064A\u0644', suffixes: '\u2014', meaning: 'der Barmherzige', ref: '1:1' },
  { word: '\u064A\u064F\u0624\u0652\u0645\u0650\u0646\u064F\u0648\u0646\u064E', root: '\u0621-\u0645-\u0646', prefixes: '\u064A\u064F\u0640', pattern: '\u064A\u064F\u0641\u0652\u0639\u0650\u0644\u064F (IV)', suffixes: '\u0648\u0646\u064E', meaning: 'sie glauben', ref: '2:3' },
  { word: '\u0623\u064E\u0646\u0652\u0639\u064E\u0645\u0652\u062A\u064E', root: '\u0646-\u0639-\u0645', prefixes: '\u0623\u064E', pattern: '\u0623\u064E\u0641\u0652\u0639\u064E\u0644\u064E (IV)', suffixes: '\u0640\u062A\u064E', meaning: 'du hast begnadet', ref: '1:7' },
  { word: '\u0627\u0644\u0652\u0645\u064F\u062A\u0651\u064E\u0642\u0650\u064A\u0646\u064E', root: '\u0648-\u0642-\u064A', prefixes: '\u0627\u0644\u0640 \u0645\u064F\u0640', pattern: '\u0645\u064F\u0641\u0652\u062A\u064E\u0639\u0650\u0644 (VIII)', suffixes: '\u064A\u0646\u064E', meaning: 'die sich Hütenden', ref: '2:2' },
  { word: '\u064A\u064F\u0646\u0641\u0650\u0642\u064F\u0648\u0646\u064E', root: '\u0646-\u0641-\u0642', prefixes: '\u064A\u064F\u0640', pattern: '\u064A\u064F\u0641\u0652\u0639\u0650\u0644\u064F (IV)', suffixes: '\u0648\u0646\u064E', meaning: 'sie spenden', ref: '2:3' },
  { word: '\u062E\u064E\u062A\u064E\u0645\u064E', root: '\u062E-\u062A-\u0645', prefixes: '\u2014', pattern: '\u0641\u064E\u0639\u064E\u0644\u064E (I)', suffixes: '\u2014', meaning: 'er versiegelte', ref: '2:7' },
  { word: '\u0639\u064E\u0630\u064E\u0627\u0628\u064C', root: '\u0639-\u0630-\u0628', prefixes: '\u2014', pattern: '\u0641\u064E\u0639\u064E\u0627\u0644', suffixes: '\u2014', meaning: 'Strafe', ref: '2:7' },
  { word: '\u064A\u064F\u062E\u064E\u0627\u062F\u0650\u0639\u064F\u0648\u0646\u064E', root: '\u062E-\u062F-\u0639', prefixes: '\u064A\u064F\u0640', pattern: '\u064A\u064F\u0641\u064E\u0627\u0639\u0650\u0644\u064F (III)', suffixes: '\u0648\u0646\u064E', meaning: 'sie versuchen zu täuschen', ref: '2:9' },
  { word: '\u0627\u0633\u0652\u062A\u064E\u063A\u0652\u0641\u0650\u0631\u0652', root: '\u063A-\u0641-\u0631', prefixes: '\u0627\u0633\u0652\u062A\u064E\u0640', pattern: '\u0627\u0633\u0652\u062A\u064E\u0641\u0652\u0639\u0650\u0644\u0652 (X)', suffixes: '\u2014', meaning: 'bitte um Vergebung!', ref: '47:19' },
  { word: '\u0645\u064F\u0633\u0652\u0644\u0650\u0645\u064F\u0648\u0646\u064E', root: '\u0633-\u0644-\u0645', prefixes: '\u0645\u064F\u0640', pattern: '\u0645\u064F\u0641\u0652\u0639\u0650\u0644 (IV)', suffixes: '\u0648\u0646\u064E', meaning: 'Ergebene/Muslime', ref: '2:132' }
]

export default function DecompositionExercise() {
  const PRESET_WORDS = useMemo(() => {
    if (externalWords && Array.isArray(externalWords) && externalWords.length > 0) return externalWords
    return INLINE_WORDS
  }, [])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [inputs, setInputs] = useState({ root: '', prefixes: '', pattern: '', suffixes: '' })
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  const current = PRESET_WORDS[currentIdx]
  if (!current) return null

  function handleReveal() {
    setRevealed(true)
    const userRoot = stripVowelMarks(inputs.root.replace(/[-\s]/g, ''))
    const expectedRoot = stripVowelMarks(current.root.replace(/[-\s]/g, ''))
    const rootOk = userRoot === expectedRoot
    const expectedPattern = current.pattern.split(' ')[0].toLowerCase()
    const patternOk = inputs.pattern.length > 1 && (
      inputs.pattern.toLowerCase().replace(/\s*\(.*\)/, '').trim() === expectedPattern ||
      stripVowelMarks(inputs.pattern) === stripVowelMarks(current.pattern.split(' ')[0])
    )
    const allOk = rootOk && patternOk
    setScore(s => ({ correct: s.correct + (allOk ? 1 : 0), total: s.total + 1 }))
  }

  function handleNext() {
    setCurrentIdx((currentIdx + 1) % PRESET_WORDS.length)
    setInputs({ root: '', prefixes: '', pattern: '', suffixes: '' })
    setRevealed(false)
  }

  const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h3 style={{ color: 'var(--accent-gold)', marginBottom: 4 }}>Morphologische Dekomposition</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>
        Zerlege das Wort in seine Bestandteile: Präfix(e) + Wurzel + Muster + Suffix(e).
      </p>
      {score.total > 0 && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
          {score.correct}/{score.total} korrekt ({pct}%)
        </div>
      )}
      <div style={{ background: 'var(--card-bg)', borderRadius: 12, padding: 24, marginBottom: 16 }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: '2.5rem', fontFamily: 'var(--font-arabic)', color: 'var(--accent-gold)' }}>
            {current.word}
          </span>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {current.ref} — {current.meaning}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {['prefixes', 'root', 'pattern', 'suffixes'].map(field => (
            <div key={field}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                {field === 'prefixes' ? 'Präfix(e)' : field === 'root' ? 'Wurzel' : field === 'pattern' ? 'Muster (Wazn)' : 'Suffix(e)'}
              </label>
              <input
                value={inputs[field]}
                onChange={e => setInputs({ ...inputs, [field]: e.target.value })}
                disabled={revealed}
                placeholder={field === 'root' ? 'z.B. ع-ل-م' : field === 'pattern' ? 'z.B. فَعَلَ' : '— wenn keine'}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--bg)',
                  color: 'var(--text)', fontFamily: 'var(--font-arabic)', fontSize: '1.1rem',
                  direction: 'rtl', boxSizing: 'border-box'
                }}
              />
            </div>
          ))}
        </div>
        {!revealed && (
          <button onClick={handleReveal} style={{
            marginTop: 16, padding: '10px 28px', borderRadius: 8, border: 'none',
            background: 'var(--accent-teal)', color: '#fff', cursor: 'pointer', fontSize: '0.95rem', width: '100%'
          }}>Prüfen</button>
        )}
        {revealed && (
          <div style={{ marginTop: 16, padding: 16, background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>Korrekte Zerlegung:</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.9rem' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Präfix(e):</span> <span style={{ color: 'var(--accent-teal)', fontFamily: 'var(--font-arabic)' }}>{current.prefixes}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Wurzel:</span> <span style={{ color: 'var(--correct)', fontFamily: 'var(--font-arabic)' }}>{current.root}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Muster:</span> <span style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-arabic)' }}>{current.pattern}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Suffix(e):</span> <span style={{ color: 'var(--accent-teal)', fontFamily: 'var(--font-arabic)' }}>{current.suffixes}</span></div>
            </div>
            <button onClick={handleNext} style={{
              marginTop: 12, padding: '8px 24px', borderRadius: 8, border: 'none',
              background: 'var(--accent-gold)', color: '#000', cursor: 'pointer', fontSize: '0.9rem'
            }}>Nächstes Wort</button>
          </div>
        )}
      </div>
    </div>
  )
}
