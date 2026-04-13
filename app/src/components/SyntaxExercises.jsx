import { useState, useCallback, useMemo } from 'react'
import { splitIntoWords } from '../utils/arabic.js'

/**
 * SyntaxExercises — Strukturierte Syntax-Übungen am echten Qurantext
 * Laedt Übungen aus syntax-exercises.json und prüft Antworten automatisch.
 */

import syntaxBase from '../data/syntax-exercises.json'
import syntaxExt1 from '../data/syntax-exercises-extended.json'
import syntaxExt2 from '../data/syntax-exercises-extended-2.json'
import syntaxExt3 from '../data/syntax-exercises-extended-3.json'
import syntaxExt4 from '../data/syntax-exercises-extended-4.json'
import syntaxExt5 from '../data/syntax-exercises-extended-5.json'

const allExts = [syntaxExt1, syntaxExt2, syntaxExt3, syntaxExt4, syntaxExt5]
const allCats = new Set(syntaxBase.meta?.categories || [])
allExts.forEach(ext => (ext.meta?.categories || []).forEach(c => allCats.add(c)))
const exerciseData = {
  ...syntaxBase,
  meta: {
    ...syntaxBase.meta,
    totalExercises: (syntaxBase.exercises?.length || 0) + allExts.reduce((sum, e) => sum + (e.exercises?.length || 0), 0),
    categories: [...allCats],
  },
  exercises: [
    ...(syntaxBase.exercises || []),
    ...allExts.flatMap(e => e.exercises || []),
  ],
}

const CATEGORIES = [
  { id: 'all', label: 'Alle' },
  { id: 'mubtada_khabar', label: 'Mubtada/Khabar' },
  { id: 'fail', label: 'Fa\'il (Subjekt)' },
  { id: 'maf3ul', label: 'Maf\'ul (Objekt)' },
  { id: 'sentence_type', label: 'Satztyp' },
  { id: 'role', label: 'Syntakt. Rolle' },
  { id: 'case', label: 'Kasus' },
  { id: 'iḍāfa', label: 'Iḍāfa' },
  // Extended categories (syn_31–syn_120)
  { id: 'conditional', label: 'Konditionalsatz' },
  { id: 'relative_clause', label: 'Relativsatz' },
  { id: 'oath', label: 'Schwur' },
  { id: 'hal', label: 'Hal (Zustandsakkusativ)' },
  { id: 'tamyiz', label: 'Tamyiz' },
  { id: 'maful_mutlaq', label: 'Maf\'ul mutlaq' },
  { id: 'exception', label: 'Ausnahme (Istithna\')' },
  { id: 'vocative', label: 'Vokativ (Nida\')' },
  { id: 'negation', label: 'Negation' },
  { id: 'kana_sisters', label: 'Kana und Schwestern' },
  { id: 'inna_sisters', label: 'Inna und Schwestern' },
  { id: 'passive', label: 'Passiv' },
  { id: 'verb_mood', label: 'Verbmodus' },
  { id: 'coordination', label: 'Koordination' },
  { id: 'zarf', label: 'Ẓarf (Adverbial)' },
  // Extended categories part 2 (syn_121–syn_210)
  { id: 'taqdim', label: 'Taqdim (Voranstellung)' },
  { id: 'badal', label: 'Badal (Apposition)' },
  { id: 'sifa', label: 'Sifa (Attribut)' },
  { id: 'anaphora', label: 'Anapher' },
  { id: 'ellipsis', label: 'Ellipse' },
  { id: 'double_object', label: 'Doppeltes Objekt' },
  { id: 'clause_boundary', label: 'Satzgrenze' },
  { id: 'topicalization', label: 'Topikalisierung' },
  { id: 'maful_li_ajlihi', label: 'Maf\'ul li-Ajlihi' },
  { id: "maful_maʿahu", label: 'Maf\'ul Ma\'ahu' },
  { id: 'khabar_types', label: 'Khabar-Typen' },
  { id: 'complex_analysis', label: 'Gesamtanalyse' },
]

export default function SyntaxExercises({ onClose }) {
  const [category, setCategory] = useState('all')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedWords, setSelectedWords] = useState(new Set())
  const [selectedOption, setSelectedOption] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  const exercises = useMemo(() => {
    if (!exerciseData?.exercises) return []
    if (category === 'all') return exerciseData.exercises
    return exerciseData.exercises.filter(e => e.category === category)
  }, [category])

  const current = exercises[currentIdx]
  const isFinished = currentIdx >= exercises.length

  const words = useMemo(() => {
    if (!current?.verse?.text) return []
    return splitIntoWords(current.verse.text)
  }, [current])

  const handleWordClick = useCallback((idx) => {
    if (feedback) return
    setSelectedWords(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }, [feedback])

  const checkAnswer = useCallback(() => {
    if (!current) return

    let isCorrect = false
    if (current.type === 'find_element' && current.correctAnswer?.wordIndices) {
      const expected = new Set(current.correctAnswer.wordIndices)
      isCorrect = expected.size === selectedWords.size &&
        [...expected].every(i => selectedWords.has(i))
    } else if (current.type === 'multiple_choice' && selectedOption !== null) {
      isCorrect = selectedOption === current.correctAnswer?.index
    } else if (current.type === 'sentence_type' && selectedOption !== null) {
      isCorrect = selectedOption === current.correctAnswer?.index
    }

    setFeedback({
      correct: isCorrect,
      explanation: current.correctAnswer?.explanation || '',
    })
    setScore(s => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }))
  }, [current, selectedWords, selectedOption])

  const next = useCallback(() => {
    setCurrentIdx(i => i + 1)
    setSelectedWords(new Set())
    setSelectedOption(null)
    setFeedback(null)
  }, [])

  if (!exerciseData?.exercises || exerciseData.exercises.length === 0) {
    return (
      <div style={{ padding: '20px', color: 'var(--text-muted)', textAlign: 'center' }}>
        Syntax-Übungsdaten werden geladen...
      </div>
    )
  }

  if (isFinished) {
    const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>Ergebnis — Syntax-Übungen</h3>
        <div style={{ fontSize: '2.5rem', fontWeight: 700, color: pct >= 80 ? 'var(--correct)' : 'var(--accent-gold)', margin: '16px 0' }}>
          {score.correct} / {score.total} ({pct}%)
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
          {pct >= 80 ? 'Sehr gut! Du erkennst syntaktische Strukturen zuverlässig.' :
           pct >= 50 ? 'Guter Anfang. Wiederhole die Syntax-Lektionen zu den Themen die dir schwergefallen sind.' :
           'Arbeite die Syntax-Lektionen (3.1-3.38) in Modul 2 durch und versuche es erneut.'}
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={() => { setCurrentIdx(0); setScore({ correct: 0, total: 0 }); setFeedback(null) }}
            style={{ padding: '8px 20px', borderRadius: 'var(--radius)', background: 'var(--accent-teal)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Erneut
          </button>
          {onClose && <button onClick={onClose}
            style={{ padding: '8px 20px', borderRadius: 'var(--radius)', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)', cursor: 'pointer' }}>
            Schließen
          </button>}
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-heading)' }}>Syntax-Übung am Text</h3>
        {onClose && <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '4px 10px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Schließen</button>}
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => { setCategory(c.id); setCurrentIdx(0); setFeedback(null); setSelectedWords(new Set()); setSelectedOption(null); setScore({ correct: 0, total: 0 }) }}
            style={{
              padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', cursor: 'pointer',
              background: category === c.id ? 'var(--accent-teal-bg)' : 'var(--bg-input)',
              color: category === c.id ? 'var(--accent-teal)' : 'var(--text-secondary)',
              border: `1px solid ${category === c.id ? 'var(--accent-teal)' : 'var(--border)'}`,
            }}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Progress */}
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', textAlign: 'right' }}>
        {currentIdx + 1} / {exercises.length}
      </div>

      {/* Verse reference */}
      <div style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', marginBottom: '4px' }}>
        Sure {current.verse.surah}:{current.verse.ayah}
      </div>

      {/* Verse display */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', direction: 'rtl', padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius)', marginBottom: '12px', justifyContent: 'center' }}>
        {words.map((word, i) => {
          const isSelected = selectedWords.has(i)
          const isCorrect = feedback && current.correctAnswer?.wordIndices?.includes(i)
          return (
            <span key={i} className="arabic"
              onClick={() => current.type === 'find_element' && handleWordClick(i)}
              style={{
                fontSize: '1.5rem', padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                cursor: current.type === 'find_element' ? 'pointer' : 'default',
                background: feedback
                  ? (isCorrect ? 'var(--correct-bg)' : isSelected ? 'var(--incorrect-bg)' : 'transparent')
                  : (isSelected ? 'var(--accent-teal-bg)' : 'transparent'),
                border: `2px solid ${feedback
                  ? (isCorrect ? 'var(--correct)' : isSelected ? 'var(--incorrect)' : 'transparent')
                  : (isSelected ? 'var(--accent-teal)' : 'transparent')}`,
                color: 'var(--arabic-text)',
              }}>
              {word}
            </span>
          )
        })}
      </div>

      {/* Question */}
      <p style={{ fontWeight: 600, marginBottom: '12px', fontSize: '0.95rem' }}>{current.question}</p>

      {/* Multiple choice options */}
      {(current.type === 'multiple_choice' || current.type === 'sentence_type') && current.options && !feedback && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
          {current.options.map((opt, i) => (
            <button key={i} onClick={() => setSelectedOption(i)}
              style={{
                padding: '8px 14px', textAlign: 'left', borderRadius: 'var(--radius)',
                background: selectedOption === i ? 'var(--accent-teal-bg)' : 'var(--bg-input)',
                border: `1px solid ${selectedOption === i ? 'var(--accent-teal)' : 'var(--border)'}`,
                cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)',
              }}>
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* Check / Next buttons */}
      {!feedback ? (
        <button onClick={checkAnswer}
          disabled={current.type === 'find_element' ? selectedWords.size === 0 : selectedOption === null}
          style={{
            padding: '8px 20px', borderRadius: 'var(--radius)', fontWeight: 600,
            background: (current.type === 'find_element' ? selectedWords.size > 0 : selectedOption !== null) ? 'var(--accent-teal)' : 'var(--bg-input)',
            color: (current.type === 'find_element' ? selectedWords.size > 0 : selectedOption !== null) ? '#fff' : 'var(--text-muted)',
            border: 'none', cursor: 'pointer',
          }}>
          Prüfen
        </button>
      ) : (
        <div style={{
          padding: '12px 16px', borderRadius: 'var(--radius)',
          background: feedback.correct ? 'var(--correct-bg)' : 'var(--incorrect-bg)',
          border: `1px solid ${feedback.correct ? 'var(--correct)' : 'var(--incorrect)'}`,
          marginBottom: '12px',
        }}>
          <p style={{ fontWeight: 600, marginBottom: '4px' }}>{feedback.correct ? 'Richtig!' : 'Nicht ganz.'}</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{feedback.explanation}</p>
          <button onClick={next} style={{
            marginTop: '8px', padding: '6px 16px', borderRadius: 'var(--radius)',
            background: 'var(--accent-teal)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600,
          }}>Weiter</button>
        </div>
      )}
    </div>
  )
}
