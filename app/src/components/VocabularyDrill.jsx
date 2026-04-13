import { useState, useCallback, useMemo, useEffect } from 'react'
import rootMeaningsData from '../data/root-meanings.json'
import { loadAllRoots } from '../utils/storage.js'

/**
 * VocabularyDrill — Frequenzbasiertes Vokabel-Drilling
 * Nutzt root-meanings.json (Top 300 Wurzeln) für aktives Vokabeltraining.
 * Drei Tiers: Top 50, Top 100, Top 300.
 */

const TIERS = [
  { id: 'tier1', label: 'Tier 1 (Top 50)', description: '29% des Qurantextes', from: 0, to: 50 },
  { id: 'tier2', label: 'Tier 2 (Top 100)', description: '39% des Qurantextes', from: 50, to: 100 },
  { id: 'tier3', label: 'Tier 3 (Top 300)', description: '54% des Qurantextes', from: 100, to: 300 },
]

const S = {
  page: { padding: '24px 32px', maxWidth: 800, margin: '0 auto', fontFamily: 'var(--font-ui)' },
  backBtn: { background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: 16 },
  card: { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '24px', marginBottom: 16, textAlign: 'center' },
  arabic: { fontFamily: 'var(--font-arabic, "Scheherazade New", serif)', fontSize: '2.5rem', direction: 'rtl', margin: '16px 0' },
  btn: { background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 20px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, margin: '4px' },
  btnSecondary: { background: 'var(--bg-tertiary, var(--bg-secondary))', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 20px', cursor: 'pointer', fontSize: '0.95rem', margin: '4px' },
  progress: { color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16, textAlign: 'right' },
  score: { fontSize: '2.5rem', fontWeight: 700, textAlign: 'center', margin: '24px 0', color: 'var(--accent)' },
  tierCard: { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '20px 24px', marginBottom: 12, cursor: 'pointer', transition: 'border-color 0.2s' },
  derivBox: { background: 'var(--bg-tertiary, var(--bg-primary))', borderRadius: 6, padding: '12px 16px', marginTop: 12, textAlign: 'right', direction: 'rtl' },
  tag: { display: 'inline-block', background: 'var(--accent)', color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 600, marginRight: 8 },
}

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function VocabularyDrill({ onBack }) {
  const allRoots = useMemo(() => rootMeaningsData?.roots || [], [])
  const [mode, setMode] = useState('select') // 'select' | 'drill' | 'result'
  const [tier, setTier] = useState(null)
  const [drillRoots, setDrillRoots] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState({ known: 0, unknown: 0 })
  const [knownRootKeys, setKnownRootKeys] = useState(new Set())

  useEffect(() => {
    loadAllRoots().then(roots => {
      if (roots) setKnownRootKeys(new Set(Object.keys(roots)))
    }).catch(() => {})
  }, [])

  const startDrill = useCallback((tierDef) => {
    setTier(tierDef)
    const subset = allRoots.slice(tierDef.from, tierDef.to)
    setDrillRoots(shuffleArray(subset))
    setCurrentIdx(0)
    setRevealed(false)
    setScore({ known: 0, unknown: 0 })
    setMode('drill')
  }, [allRoots])

  const handleRate = useCallback((knew) => {
    setScore(prev => ({
      known: prev.known + (knew ? 1 : 0),
      unknown: prev.unknown + (knew ? 0 : 1),
    }))
    if (currentIdx + 1 >= drillRoots.length) {
      setMode('result')
    } else {
      setCurrentIdx(prev => prev + 1)
      setRevealed(false)
    }
  }, [currentIdx, drillRoots.length])

  if (mode === 'select') {
    return (
      <div style={S.page}>
        {onBack && <button style={S.backBtn} onClick={onBack}>Zurück</button>}
        <h2>Vokabel-Drill</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Frequenzbasiertes Wurzel-Drilling: Wurzel sehen → Bedeutung erinnern → aufdecken → bewerten.
        </p>
        {TIERS.map(t => {
          const subset = allRoots.slice(t.from, t.to)
          const knownCount = subset.filter(r => knownRootKeys.has((r.root || '').replace(/\s/g, ''))).length
          return (
            <div key={t.id} style={S.tierCard}
              onClick={() => startDrill(t)}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{t.label}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>
                {t.description} — {subset.length} Wurzeln
                {knownCount > 0 && ` (${knownCount} im Notizbuch)`}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (mode === 'result') {
    const pct = Math.round((score.known / (score.known + score.unknown)) * 100)
    return (
      <div style={S.page}>
        <h2>Ergebnis — {tier.label}</h2>
        <div style={S.score}>{pct}%</div>
        <p style={{ textAlign: 'center' }}>
          {score.known} gewusst, {score.unknown} nicht gewusst ({score.known + score.unknown} gesamt)
        </p>
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button style={S.btn} onClick={() => startDrill(tier)}>Erneut</button>
          <button style={S.btnSecondary} onClick={() => setMode('select')}>Tier wählen</button>
        </div>
      </div>
    )
  }

  // Drill mode
  const current = drillRoots[currentIdx]
  if (!current) return null

  return (
    <div style={S.page}>
      <button style={S.backBtn} onClick={() => setMode('select')}>Zurück zur Auswahl</button>
      <div style={S.progress}>{currentIdx + 1} / {drillRoots.length}</div>

      <div style={S.card}>
        <span style={S.tag}>{tier.label}</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Frequenz: {current.frequency}x
        </span>
        <div style={S.arabic}>{current.root}</div>

        {!revealed ? (
          <button style={S.btn} onClick={() => setRevealed(true)}>Bedeutung aufdecken</button>
        ) : (
          <>
            <p style={{ fontSize: '1.15rem', fontWeight: 600, margin: '16px 0 4px' }}>
              {current.meaning}
            </p>
            {current.semanticField && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Feld: {current.semanticField}
              </p>
            )}
            {current.keyDerivatives?.length > 0 && (
              <div style={S.derivBox}>
                {current.keyDerivatives.map((d, i) => (
                  <span key={i} style={{ display: 'inline-block', marginLeft: 16, marginBottom: 4 }}>
                    <strong style={{ fontFamily: 'var(--font-arabic, "Scheherazade New", serif)', fontSize: '1.2rem' }}>
                      {d.form}
                    </strong>
                    {' '}
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', direction: 'ltr', unicodeBidi: 'plaintext' }}>
                      {d.meaning}
                    </span>
                  </span>
                ))}
              </div>
            )}
            <div style={{ marginTop: 20 }}>
              <button style={S.btn} onClick={() => handleRate(true)}>Gewusst</button>
              <button style={S.btnSecondary} onClick={() => handleRate(false)}>Nicht gewusst</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
