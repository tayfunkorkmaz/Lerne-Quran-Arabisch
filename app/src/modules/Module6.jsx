import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  loadSettings,
  loadAllRoots,
  loadAllSRSCards,
  getDueSRSCards,
  loadModuleProgress,
} from '../utils/storage.js'
import morphologyLessons from '../data/morphology-lessons.json'

/**
 * Module 6: Dashboard und Fortschritt
 * Shows learning progress, Quran heatmap, root counter, SRS stats, streak, phase indicator.
 */

// Surah identification by number
function getSurahLabel(num) { return 'Sure ' + num }

// ===== Phase definitions =====
const PHASES = [
  { id: 1, name: 'Schrift', stufe: 'Stufe 1', desc: 'Buchstaben, Formen, Leserichtung und Konsonantentext navigieren.' },
  { id: 2, name: 'Abstrakte Morphologie', stufe: 'Stufe 2', desc: 'Wurzelsystem, Verbformen, Nomen- und Partizipmuster systematisch lernen.' },
  { id: 3, name: 'Erster Textkontakt', stufe: 'Stufe 2-3', desc: 'Analyse realer Quranverse, Wortzerlegung und erste Wurzelidentifikation.' },
  { id: 4, name: 'Syntax und Partikeln', stufe: 'Stufe 3-4', desc: 'Satzstruktur, grammatische Rollen und die wichtigsten Funktionswörter.' },
  { id: 5, name: 'Vertiefung', stufe: 'Stufen 5-12', desc: 'Fortgeschrittene Analyse: Semantik, Rhetorik, Klang und direktes Verstehen.' },
]

// ===== Advanced stages (5-12) =====
const ADVANCED_STAGES = [
  { stufe: 5, name: 'Semantische Felder und Wurzelbedeutungen', desc: 'Wurzeln in Bedeutungsfeldern gruppieren, Bedeutungsverschiebungen zwischen Formen erkennen, Synonyme und Antonyme im Quran kartieren.' },
  { stufe: 6, name: 'Intertextuelle Kohärenz', desc: 'Wiederkehrende Phrasen und Formeln erkennen, parallele Strukturen zwischen Suren identifizieren, thematische Verbindungen nachvollziehen.' },
  { stufe: 7, name: 'Rhetorische Struktur (Balagha)', desc: 'Chiasmus, Inklusion, Ringkomposition und andere rhetorische Figuren im Qurantext erkennen.' },
  { stufe: 8, name: 'Partikel-Sensitivität', desc: 'Feine Bedeutungsunterschiede zwischen ähnlichen Partikeln verstehen, kontextabhängige Funktionen erkennen.' },
  { stufe: 9, name: 'Phonosemantik', desc: 'Klang-Bedeutungs-Korrelationen in Wurzeln und Wörtern wahrnehmen, lautmalerische Muster erkennen.' },
  { stufe: 10, name: 'Prosodie und Klang', desc: 'Rhythmische Muster, Reim, Saj\u02BF und klangliche Strukturen in Versen hören und analysieren.' },
  { stufe: 11, name: 'Pragmatik und Sprechakt', desc: 'Frage, Befehl, Schwur, Bedingung und andere Sprechakte im Qurantext identifizieren und ihre Wirkung verstehen.' },
  { stufe: 12, name: 'Direktes Verstehen', desc: 'Den arabischen Qurantext lesen und seinen Inhalt unmittelbar erfassen - ohne Übersetzung, ohne bewusste Analyse.' },
]

const TOTAL_ROOTS = 1642

export default function Module6({ quranData: _quranData, settings }) {
  const navigate = useNavigate()
  const [roots, setRoots] = useState({})
  const [srsCards, setSrsCards] = useState({})
  const [dueCards, setDueCards] = useState([])
  const [surahProgress, setSurahProgress] = useState({}) // surah# -> 'none'|'started'|'done'
  const [lessonProgress, setLessonProgress] = useState({}) // lessonId -> status
  const [streakCount, setStreakCount] = useState(settings?.streakCount || 0)
  const [currentPhase, setCurrentPhase] = useState(settings?.phase || 1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [rootsData, srsData, dueData, settingsData] = await Promise.all([
          loadAllRoots(),
          loadAllSRSCards(),
          getDueSRSCards(),
          loadSettings(),
        ])

        setRoots(rootsData || {})
        setSrsCards(srsData || {})
        setDueCards(dueData || [])
        setStreakCount(settingsData?.streakCount || 0)
        setCurrentPhase(settingsData?.phase || 1)

        // Load surah progress in parallel (not sequentially)
        const surahProg = {}
        const surahPromises = Array.from({ length: 114 }, (_, i) =>
          loadModuleProgress(`surah_${i + 1}`).then(prog => {
            if (prog) surahProg[i + 1] = prog.status || 'none'
          })
        )
        await Promise.all(surahPromises)
        setSurahProgress(surahProg)

        // Load morphology lesson progress
        const lessonProg = {}
        for (const lesson of morphologyLessons.lessons) {
          const prog = await loadModuleProgress(`lesson_${lesson.id}`)
          if (prog) {
            lessonProg[lesson.id] = prog.status || 'locked'
          }
        }
        setLessonProgress(lessonProg)
      } catch (err) {
        console.error('Dashboard-Daten konnten nicht geladen werden:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // ===== Computed stats =====
  const rootCount = Object.keys(roots).length
  const rootPercent = Math.round((rootCount / TOTAL_ROOTS) * 100)

  const totalSrsCards = Object.keys(srsCards).length
  const dueCount = dueCards.length

  // Average accuracy from SRS cards
  const avgAccuracy = useMemo(() => {
    const cards = Object.values(srsCards)
    if (cards.length === 0) return 0
    const withReviews = cards.filter(c => c.reviewCount > 0)
    if (withReviews.length === 0) return 0
    const totalQuality = withReviews.reduce((sum, c) => sum + (c.lastQuality || 0), 0)
    return Math.round((totalQuality / (withReviews.length * 3)) * 100)
  }, [srsCards])

  // Card type breakdown
  const cardBreakdown = useMemo(() => {
    const types = { root: 0, word: 0, pattern: 0, other: 0 }
    Object.values(srsCards).forEach(card => {
      if (card.root || card.type === 'root') types.root++
      else if (card.word || card.type === 'word') types.word++
      else if (card.pattern || card.type === 'pattern') types.pattern++
      else types.other++
    })
    return types
  }, [srsCards])

  // Morphology lesson stats
  const morphStats = useMemo(() => {
    let completed = 0, inProgress = 0, locked = 0
    morphologyLessons.lessons.forEach(lesson => {
      const status = lessonProgress[lesson.id]
      if (status === 'completed') completed++
      else if (status === 'in_progress' || status === 'started') inProgress++
      else locked++
    })
    return { completed, inProgress, locked, total: morphologyLessons.lessons.length }
  }, [lessonProgress])

  if (loading) {
    return (
      <div className="module-placeholder">
        <div className="module-placeholder__icon">{'\u23F3'}</div>
        <div className="module-placeholder__title">Dashboard wird geladen...</div>
      </div>
    )
  }

  return (
    <div className="m6-dashboard">
      <h2 style={{ marginBottom: '6px' }}>Dashboard</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', fontSize: '0.9rem' }}>
        Dein Lernfortschritt auf einen Blick.
      </p>

      {/* ===== Top Stats Row ===== */}
      <div className="m6-stats-row">
        {/* Streak */}
        <div className="m6-stat-card m6-stat-card--streak">
          <div className="m6-stat-icon">{'\u{1F525}'}</div>
          <div className="m6-stat-value">{streakCount}</div>
          <div className="m6-stat-label">{streakCount === 1 ? 'Tag' : 'Tage'} Serie</div>
        </div>

        {/* Roots */}
        <div className="m6-stat-card">
          <div className="m6-stat-icon">{'\u{1F333}'}</div>
          <div className="m6-stat-value">{rootCount}</div>
          <div className="m6-stat-label">von ~{TOTAL_ROOTS} Wurzeln</div>
        </div>

        {/* SRS Due */}
        <div className="m6-stat-card">
          <div className="m6-stat-icon">{'\u{1F504}'}</div>
          <div className="m6-stat-value">{dueCount}</div>
          <div className="m6-stat-label">Karten fällig</div>
        </div>

        {/* Accuracy */}
        <div className="m6-stat-card">
          <div className="m6-stat-icon">{'\u{1F3AF}'}</div>
          <div className="m6-stat-value">{avgAccuracy}%</div>
          <div className="m6-stat-label">Genauigkeit</div>
        </div>
      </div>

      {/* ===== Phase Indicator ===== */}
      <div className="m6-section">
        <h3 className="m6-section-title">Curriculum-Phase</h3>
        <div className="m6-phase-track">
          {PHASES.map(phase => {
            const isActive = phase.id === currentPhase
            const isDone = phase.id < currentPhase
            const isFuture = phase.id > currentPhase
            return (
              <div
                key={phase.id}
                className={`m6-phase-item ${isActive ? 'm6-phase-item--active' : ''} ${isDone ? 'm6-phase-item--done' : ''} ${isFuture ? 'm6-phase-item--future' : ''}`}
              >
                <div className="m6-phase-number">
                  {isDone ? '\u2713' : phase.id}
                </div>
                <div className="m6-phase-info">
                  <div className="m6-phase-name">{phase.name}</div>
                  <div className="m6-phase-stufe">{phase.stufe}</div>
                </div>
              </div>
            )
          })}
        </div>
        {PHASES[currentPhase - 1] && (
          <div className="m6-phase-desc">
            {PHASES[currentPhase - 1].desc}
          </div>
        )}
      </div>

      {/* ===== Lernpfad ===== */}
      <div className="m6-section">
        <h3 className="m6-section-title">Lernpfad</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { phase: 1, label: 'Schrift & Buchstaben', modules: [{ id: 1, label: 'M1 — Buchstaben' }, { id: 8, label: 'M8 — Schreibübung' }] },
            { phase: 2, label: 'Abstrakte Morphologie', modules: [{ id: 2, label: 'M2 — Morphologie' }] },
            { phase: 3, label: 'Erster Textkontakt', modules: [{ id: 3, label: 'M3 — Vers-Werkstatt' }, { id: 5, label: 'M5 — SRS' }] },
            { phase: 4, label: 'Syntax & Partikeln', modules: [{ id: 4, label: 'M4 — Grammatik' }, { id: 5, label: 'M5 — SRS' }] },
            { phase: 5, label: 'Vertiefung', modules: [{ id: 5, label: 'M5 — SRS' }, { id: 7, label: 'M7 — Analyse' }] },
          ].map(row => {
            const isActive = row.phase === currentPhase
            const isDone = row.phase < currentPhase
            const isFuture = row.phase > currentPhase
            return (
              <div
                key={row.phase}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: isActive ? 'color-mix(in srgb, var(--accent-teal) 10%, transparent)' : 'var(--bg-card)',
                  border: `1px solid ${isActive ? 'var(--accent-teal)' : 'var(--border)'}`,
                  opacity: isFuture && row.phase > currentPhase + 1 ? 0.45 : 1,
                }}
              >
                <div style={{
                  minWidth: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  flexShrink: 0,
                  background: isActive ? 'var(--accent-teal)' : isDone ? 'var(--correct)' : 'var(--border)',
                  color: isActive || isDone ? 'var(--bg-primary)' : 'var(--text-muted)',
                }}>
                  {isDone ? '\u2713' : row.phase}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--accent-teal)' : 'var(--text-primary)', marginBottom: '5px' }}>
                    Phase {row.phase}: {row.label}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {row.modules.map(mod => (
                      <button
                        key={mod.id + '-' + row.phase}
                        onClick={() => navigate(`/module/${mod.id}`)}
                        style={{
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          border: `1px solid ${isActive ? 'var(--accent-teal)' : 'var(--border)'}`,
                          background: 'transparent',
                          color: isActive ? 'var(--accent-teal)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        {mod.label}
                      </button>
                    ))}
                  </div>
                </div>
                {isActive && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-teal)', fontWeight: 600, flexShrink: 0 }}>
                    aktiv
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ===== Wurzel-Zähler ===== */}
      <div className="m6-section">
        <h3 className="m6-section-title">Wurzel-Fortschritt</h3>
        <div className="m6-progress-card">
          <div className="m6-progress-header">
            <span className="m6-progress-text">
              {rootCount} von ~{TOTAL_ROOTS} Wurzeln gelernt
            </span>
            <span className="m6-progress-percent">{rootPercent}%</span>
          </div>
          <div className="m6-progress-bar">
            <div
              className="m6-progress-fill"
              style={{ width: `${Math.min(rootPercent, 100)}%` }}
            />
          </div>
          <div className="m6-progress-sub">
            {rootPercent < 5
              ? 'Beginne mit der Wortanalyse in der Vers-Werkstatt, um Wurzeln zu entdecken.'
              : rootPercent < 25
                ? 'Guter Anfang! Jede neue Wurzel erschließt dir ein ganzes Wortfeld.'
                : rootPercent < 50
                  ? 'Solider Fortschritt. Du erkennst bereits viele Muster.'
                  : 'Hervorragend! Du hast bereits einen großen Teil des quranischen Vokabulars erschlossen.'}
          </div>
        </div>
      </div>

      {/* ===== Quran-Heatmap ===== */}
      <div className="m6-section">
        <h3 className="m6-section-title">Quran-Heatmap</h3>
        <div className="m6-heatmap-legend">
          <span className="m6-legend-item">
            <span className="m6-legend-dot m6-legend-dot--none" /> Unbearbeitet
          </span>
          <span className="m6-legend-item">
            <span className="m6-legend-dot m6-legend-dot--started" /> In Arbeit
          </span>
          <span className="m6-legend-item">
            <span className="m6-legend-dot m6-legend-dot--done" /> Abgeschlossen
          </span>
        </div>
        <div className="m6-heatmap-grid">
          {Array.from({ length: 114 }, (_, i) => {
            const num = i + 1
            const status = surahProgress[num] || 'none'
            return (
              <button
                key={num}
                className={`m6-heatmap-cell m6-heatmap-cell--${status}`}
                title={getSurahLabel(num)}
                onClick={() => navigate('/module/3', { state: { surah: num } })}
              >
                {num}
              </button>
            )
          })}
        </div>
      </div>

      {/* ===== Morphologie-Fortschritt ===== */}
      <div className="m6-section">
        <h3 className="m6-section-title">Morphologie-Fortschritt</h3>
        <div className="m6-morph-summary">
          <span style={{ color: 'var(--correct)' }}>{morphStats.completed} abgeschlossen</span>
          <span style={{ color: 'var(--accent-gold)' }}>{morphStats.inProgress} in Arbeit</span>
          <span style={{ color: 'var(--text-muted)' }}>{morphStats.locked} gesperrt</span>
        </div>
        <div className="m6-morph-progress-bar">
          <div
            className="m6-morph-fill m6-morph-fill--done"
            style={{ width: `${morphStats.total > 0 ? (morphStats.completed / morphStats.total) * 100 : 0}%` }}
          />
          <div
            className="m6-morph-fill m6-morph-fill--progress"
            style={{ width: `${morphStats.total > 0 ? (morphStats.inProgress / morphStats.total) * 100 : 0}%` }}
          />
        </div>
        <div className="m6-morph-grid">
          {morphologyLessons.lessons.map(lesson => {
            const status = lessonProgress[lesson.id] || 'locked'
            return (
              <div
                key={lesson.id}
                className={`m6-morph-item m6-morph-item--${status}`}
                title={`${lesson.id}: ${lesson.title}`}
              >
                <div className="m6-morph-item-id">{lesson.id}</div>
                <div className="m6-morph-item-title">{lesson.title}</div>
                <div className="m6-morph-item-status">
                  {status === 'completed' ? '\u2713' : status === 'in_progress' || status === 'started' ? '\u25CB' : '\u{1F512}'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ===== SRS-Statistik ===== */}
      <div className="m6-section">
        <h3 className="m6-section-title">SRS-Statistik</h3>
        <div className="m6-srs-grid">
          <div className="m6-srs-card">
            <div className="m6-srs-value" style={{ color: 'var(--accent-teal)' }}>{totalSrsCards}</div>
            <div className="m6-srs-label">Karten gesamt</div>
          </div>
          <div className="m6-srs-card">
            <div className="m6-srs-value" style={{ color: 'var(--accent-gold)' }}>{dueCount}</div>
            <div className="m6-srs-label">Heute fällig</div>
          </div>
          <div className="m6-srs-card">
            <div className="m6-srs-value" style={{ color: 'var(--correct)' }}>{avgAccuracy}%</div>
            <div className="m6-srs-label">Genauigkeit</div>
          </div>
        </div>
        {totalSrsCards > 0 && (
          <div className="m6-srs-breakdown">
            <h4>Kartentypen</h4>
            <div className="m6-srs-types">
              {cardBreakdown.root > 0 && (
                <span className="m6-srs-type">
                  <span className="m6-srs-type-dot" style={{ background: 'var(--accent-teal)' }} />
                  Wurzeln: {cardBreakdown.root}
                </span>
              )}
              {cardBreakdown.word > 0 && (
                <span className="m6-srs-type">
                  <span className="m6-srs-type-dot" style={{ background: 'var(--accent-gold)' }} />
                  Wörter: {cardBreakdown.word}
                </span>
              )}
              {cardBreakdown.pattern > 0 && (
                <span className="m6-srs-type">
                  <span className="m6-srs-type-dot" style={{ background: 'var(--ambiguous)' }} />
                  Muster: {cardBreakdown.pattern}
                </span>
              )}
              {cardBreakdown.other > 0 && (
                <span className="m6-srs-type">
                  <span className="m6-srs-type-dot" style={{ background: 'var(--text-muted)' }} />
                  Sonstige: {cardBreakdown.other}
                </span>
              )}
            </div>
          </div>
        )}

        {dueCount > 0 && (
          <button
            className="m6-srs-start-btn"
            onClick={() => navigate('/module/5')}
            style={{
              marginTop: 12,
              padding: '10px 24px',
              background: 'var(--accent-teal)',
              color: 'var(--bg-primary)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            {dueCount} fällige Karten jetzt wiederholen
          </button>
        )}

        {/* Lernaktivität der letzten 7 Tage */}
        {totalSrsCards > 0 && (() => {
          const now = Date.now()
          const dayMs = 86400000
          const last7 = Array.from({ length: 7 }, (_, i) => {
            const dayStart = now - (6 - i) * dayMs
            const dayEnd = dayStart + dayMs
            let count = 0
            Object.values(srsCards).forEach(card => {
              (card.history || []).forEach(h => {
                const ts = typeof h.date === 'number' ? h.date : new Date(h.date).getTime()
                if (ts >= dayStart && ts < dayEnd) count++
              })
            })
            return { day: new Date(dayStart).toLocaleDateString('de-DE', { weekday: 'short' }), count }
          })
          const maxCount = Math.max(...last7.map(d => d.count), 1)
          const totalReviews = last7.reduce((s, d) => s + d.count, 0)
          const avgDaily = Math.round(totalReviews / 7)
          return (
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Lernaktivität (letzte 7 Tage)</h4>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '80px', marginBottom: '8px' }}>
                {last7.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <div style={{ width: '100%', borderRadius: '4px 4px 0 0', background: d.count > 0 ? 'var(--accent-teal)' : 'var(--border)', height: `${Math.max((d.count / maxCount) * 60, 2)}px` }} />
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{d.day}</span>
                    {d.count > 0 && <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{d.count}</span>}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Gesamt: {totalReviews} Reviews</span>
                <span>~{avgDaily}/Tag</span>
                <span>~{Math.round(totalReviews * 15 / 60)} Min.</span>
              </div>
            </div>
          )
        })()}
      </div>

      {/* ===== Werkzeuge (Modul 8) ===== */}
      <div className="m6-section">
        <h3 className="m6-section-title">Werkzeuge (Modul 8)</h3>
        <div className="m6-srs-grid">
          <div className="m6-srs-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/module/8')}>
            <div className="m6-srs-value" style={{ color: 'var(--accent-gold)', fontSize: '1.2rem' }}>{'\u{1F527}'}</div>
            <div className="m6-srs-label">Erster-Vers-Tutorial, Lane's-Anleitung, Rasm-Orthographie, Lesen, Diktat, Schreibübung, Drucksheets</div>
          </div>
        </div>
      </div>

      {/* ===== Stufen 5-12 Übersicht ===== */}
      <div className="m6-section">
        <h3 className="m6-section-title">Fortgeschrittene Stufen (5-12)</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
          Zukünftige Lernpfade, die sich nach Abschluss der Grundstufen öffnen.
        </p>
        <div className="m6-stages-grid">
          {ADVANCED_STAGES.map(stage => {
            const unlocked = currentPhase >= 5 && stage.stufe <= (currentPhase + 3)
            return (
              <div
                key={stage.stufe}
                className={`m6-stage-card ${unlocked ? 'm6-stage-card--unlocked' : 'm6-stage-card--locked'}`}
              >
                <div className="m6-stage-header">
                  <span className="m6-stage-number">Stufe {stage.stufe}</span>
                  {!unlocked && <span className="m6-stage-lock">{'\u{1F512}'}</span>}
                  {unlocked && <span className="m6-stage-unlock">{'\u{1F513}'}</span>}
                </div>
                <div className="m6-stage-name">{stage.name}</div>
                <div className="m6-stage-desc">{stage.desc}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
