import { useState } from 'react'
import data from '../data/surah-macrostructure.json'

const surahs = data.surahs

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const STRUCTURE_COLORS = [
  'var(--accent-teal)',
  'var(--accent-gold)',
  '#a78bfa',
  '#f472b6',
  '#fb923c',
  '#34d399',
  '#60a5fa',
  '#f87171',
  '#facc15',
  '#c084fc',
]

export default function SurahMacrostructureDrill() {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [mode, setMode] = useState('view') // 'view' or 'drill'
  const [drillIdx, setDrillIdx] = useState(0)
  const [drillAnswer, setDrillAnswer] = useState(null)
  const [drillScore, setDrillScore] = useState({ correct: 0, total: 0 })

  const cardStyle = { background: 'var(--card-bg)', borderRadius: 12, padding: 16, marginBottom: 10, border: '1px solid var(--border)' }

  // Generate drill questions from all surahs (useState initializer runs once and may be impure)
  const [drillQuestions] = useState(() => {
    const qs = []
    surahs.forEach(s => {
      const segments = s.segments
      if (!segments || segments.length === 0) return
      const surahNum = s.surahNumber
      const surahName = s.germanName || s.surahName || ''
      // Q1: How many segments?
      qs.push({
        surah: surahNum, name: surahName,
        question: `Wie viele Segmente hat Sure ${surahNum} (${surahName})?`,
        options: shuffle([...new Set([segments.length, segments.length + 1, Math.max(1, segments.length - 1), segments.length + 2])]).map(String),
        correct: String(segments.length),
        explanation: `Sure ${surahNum} hat ${segments.length} Segmente: ${segments.map(seg => seg.label).join(', ')}.`
      })
      // Q2: Segment function
      if (segments.length >= 3) {
        const seg = segments[Math.floor(segments.length / 2)]
        const otherFns = shuffle(segments.filter(x => x !== seg).map(x => x.function)).slice(0, 3)
        if (otherFns.length >= 2) {
          qs.push({
            surah: surahNum, name: surahName,
            question: `Sure ${surahNum}: Welche Funktion hat das Segment "${seg.label}" (${seg.verseRange})?`,
            options: shuffle([seg.function, ...otherFns]),
            correct: seg.function,
            explanation: `Das Segment "${seg.label}" (${seg.verseRange}) hat die Funktion: ${seg.function}.`
          })
        }
      }
    })
    return shuffle(qs)
  })

  const surah = surahs[selectedIdx]
  const segments = surah?.segments
  const isRing = false // ring composition detection not available in current data format

  const currentQ = drillQuestions[drillIdx]
  if (!surah || !segments) return null
  const handleDrillAnswer = (answer) => {
    setDrillAnswer(answer)
    setDrillScore(prev => ({
      correct: prev.correct + (answer === currentQ.correct ? 1 : 0),
      total: prev.total + 1
    }))
  }
  const nextDrillQ = () => { setDrillIdx(i => (i + 1) % drillQuestions.length); setDrillAnswer(null) }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <h3 style={{ color: 'var(--accent-gold)', marginBottom: 4 }}>Surenstruktur</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 12 }}>
        Makrostruktur quranischer Suren: Diskursmarker, Segmente, Rahmungsstrukturen.
      </p>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setMode('view')} style={{ padding: '8px 20px', borderRadius: 8, border: mode === 'view' ? '2px solid var(--accent-teal)' : '1px solid var(--border)', background: mode === 'view' ? 'rgba(45,212,191,0.1)' : 'var(--bg-card)', color: mode === 'view' ? 'var(--accent-teal)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: mode === 'view' ? 600 : 400 }}>Referenz</button>
        <button onClick={() => setMode('drill')} style={{ padding: '8px 20px', borderRadius: 8, border: mode === 'drill' ? '2px solid var(--accent-gold)' : '1px solid var(--border)', background: mode === 'drill' ? 'rgba(234,179,8,0.1)' : 'var(--bg-card)', color: mode === 'drill' ? 'var(--accent-gold)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: mode === 'drill' ? 600 : 400 }}>Drill</button>
        {drillScore.total > 0 && mode === 'drill' && (
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', alignSelf: 'center', marginLeft: 8 }}>
            {drillScore.correct}/{drillScore.total} ({Math.round(100 * drillScore.correct / drillScore.total)}%)
          </span>
        )}
      </div>

      {mode === 'drill' && currentQ ? (
        <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 20, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>Frage {drillIdx + 1}/{drillQuestions.length}</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16, lineHeight: 1.5 }}>{currentQ.question}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {currentQ.options.map((opt, oi) => {
              const isSelected = drillAnswer === opt
              const isCorrect = opt === currentQ.correct
              const showResult = drillAnswer !== null
              let bg = 'var(--bg-secondary)'
              let border = '1px solid var(--border)'
              if (showResult && isCorrect) { bg = 'rgba(74,222,128,0.15)'; border = '2px solid #4ade80' }
              else if (showResult && isSelected && !isCorrect) { bg = 'rgba(248,113,113,0.15)'; border = '2px solid #f87171' }
              return (
                <button key={oi} onClick={() => !drillAnswer && handleDrillAnswer(opt)}
                  disabled={!!drillAnswer}
                  style={{ padding: '10px 16px', borderRadius: 8, background: bg, border, cursor: drillAnswer ? 'default' : 'pointer', textAlign: 'left', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                  {opt}
                </button>
              )
            })}
          </div>
          {drillAnswer && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {currentQ.explanation}
            </div>
          )}
          {drillAnswer && (
            <button onClick={nextDrillQ} style={{ marginTop: 12, padding: '8px 20px', borderRadius: 8, background: 'var(--accent-teal)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Nächste Frage
            </button>
          )}
        </div>
      ) : mode === 'drill' ? (
        <p style={{ color: 'var(--text-muted)' }}>Keine Fragen verfügbar.</p>
      ) : null}

      {mode === 'view' && <>

      {/* Surah selector */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {surahs.map((s, i) => (
          <button
            key={s.surahNumber}
            onClick={() => setSelectedIdx(i)}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: i === selectedIdx ? '2px solid var(--accent-teal)' : '1px solid var(--border)',
              background: i === selectedIdx ? 'rgba(45,212,191,0.1)' : 'var(--card-bg)',
              color: i === selectedIdx ? 'var(--accent-teal)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: i === selectedIdx ? 600 : 400,
              fontSize: '0.85rem'
            }}
          >
            {s.surahNumber}. {s.germanName || s.surahName}
          </button>
        ))}
      </div>

      {/* Surah header */}
      <div style={{ ...cardStyle, borderLeft: '4px solid var(--accent-gold)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--accent-gold)' }}>Sure {surah.surahNumber}: {surah.germanName || surah.surahName}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginLeft: 10 }}>{surah.totalVerses} Verse</span>
          </div>
        </div>
      </div>

      {/* Verse/segment count */}
      <div style={{
        ...cardStyle,
        background: 'rgba(45,212,191,0.06)',
        border: '1px solid rgba(45,212,191,0.25)',
        padding: 16
      }}>
        <div style={{ fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.6 }}>
          {surah.totalVerses} Verse, {segments.length} Segmente
        </div>
      </div>


      {/* Ring structure indicator */}
      {isRing && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontWeight: 600, padding: '0 8px' }}>
            &#8634; Ringstruktur / Spiegelstruktur
          </span>
          <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
        </div>
      )}

      {/* Visual segment bar */}
      <div style={{ ...cardStyle, padding: 12 }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Segmentübersicht</div>
        <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', height: 28 }}>
          {segments.map((seg, i) => {
            const verseStr = String(seg.verseRange)
            let verseCount = 1
            const rangeMatch = verseStr.match(/(\d+)\s*-\s*(\d+)/)
            if (rangeMatch) {
              const start = parseInt(rangeMatch[1])
              const end = parseInt(rangeMatch[2])
              verseCount = Math.max(end - start + 1, 1)
            }
            return (
              <div
                key={i}
                title={`${seg.label}: ${seg.verseRange}`}
                style={{
                  flex: Math.max(verseCount, 1),
                  background: STRUCTURE_COLORS[i % STRUCTURE_COLORS.length],
                  opacity: 0.7,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: '#000',
                  borderRight: i < segments.length - 1 ? '1px solid rgba(0,0,0,0.3)' : 'none',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  padding: '0 2px'
                }}
              >
                {verseCount > 2 ? seg.label.substring(0, 8) : ''}
              </div>
            )
          })}
        </div>
      </div>

      {/* Segments detail */}
      {segments.map((seg, i) => {
        const color = STRUCTURE_COLORS[i % STRUCTURE_COLORS.length]
        // Mirror indicator for ring structures
        const mirrorIdx = segments.length - 1 - i
        const hasMirror = isRing && mirrorIdx !== i && mirrorIdx >= 0

        return (
          <div key={i} style={{ ...cardStyle, borderLeft: `4px solid ${color}`, position: 'relative' }}>
            {hasMirror && (
              <div style={{
                position: 'absolute', top: 6, right: 10,
                fontSize: '0.7rem', color: 'var(--text-secondary)',
                background: 'rgba(0,0,0,0.15)', padding: '1px 6px', borderRadius: 4
              }}>
                &#8596; Segment {mirrorIdx + 1}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{
                fontSize: '0.75rem', fontWeight: 600, color,
                background: `${color}22`, padding: '1px 8px', borderRadius: 4
              }}>
                {seg.verseRange}
              </span>
              <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem' }}>{seg.label}</span>
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text)', marginBottom: 6 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Funktion: </span>
              {seg.function}
            </div>
            {seg.description && (
              <div style={{
                fontSize: '0.82rem', color: 'var(--text-secondary)',
                padding: '6px 10px', background: 'rgba(0,0,0,0.1)', borderRadius: 6,
              }}>
                {seg.description}
              </div>
            )}
          </div>
        )
      })}
      </>}
    </div>
  )
}
