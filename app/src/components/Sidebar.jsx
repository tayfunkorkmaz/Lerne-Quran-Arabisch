import { NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { loadModuleProgress, loadModule2Progress } from '../utils/storage.js'
import './Sidebar.css'

const MODULES = [
  {
    id: 1,
    path: '/module/1',
    icon: '\u{270D}\uFE0F',  // writing hand — pen/letter
    label: 'Schrift',
    description: 'Schrift-Trainer',
    phase: 1,
  },
  {
    id: 2,
    path: '/module/2',
    icon: '\u{1F9F1}',  // brick — building blocks
    label: 'Morphologie',
    description: 'Morphologie-Dojo',
    phase: 1,
  },
  {
    id: 3,
    path: '/module/3',
    icon: '\u{1F4D6}',  // open book — book/magnifier
    label: 'Vers-Werkstatt',
    description: 'Qurantext analysieren',
    phase: 2,
  },
  {
    id: 4,
    path: '/module/4',
    icon: '\u{1F333}',  // tree — tree/root
    label: 'Wurzeln',
    description: 'Wurzel-Notizbuch',
    phase: 2,
  },
  {
    id: 5,
    path: '/module/5',
    icon: '\u{1F504}',  // counterclockwise arrows — refresh/cards
    label: 'SRS',
    description: 'Wiederholung',
    phase: 3,
  },
  {
    id: 6,
    path: '/module/6',
    icon: '\u{1F4CA}',  // bar chart
    label: 'Dashboard',
    description: 'Fortschritt',
    phase: 1,
  },
  {
    id: 7,
    path: '/module/7',
    icon: '\u{1F3AF}',  // direct hit / target
    label: 'Vertiefung',
    description: 'Stufen 5-12',
    phase: 3,
  },
  {
    id: 8,
    path: '/module/8',
    icon: '\u{1F527}',  // wrench — tools
    label: 'Werkzeuge',
    description: 'Lesen, Schreiben, Rasm',
    phase: 3,
  },
]

const PHASE_LABELS = {
  1: 'Grundlagen',
  2: 'Analyse',
  3: 'Textkontakt',
  4: 'Syntax',
  5: 'Vertiefung',
}

export default function Sidebar({ collapsed, onToggleCollapse, streakCount, currentPhase }) {
  const location = useLocation()
  const [hoveredModule, setHoveredModule] = useState(null)
  const [unlockedPhase, setUnlockedPhase] = useState(1)

  useEffect(() => {
    Promise.all([
      loadModuleProgress(1),
      loadModule2Progress('morphology', '2.1'),
    ]).then(([m1, m2morph]) => {
      const m1Done = Object.keys(m1?.learnVisited || {}).length >= 3
      const m2Done = (m2morph?.unlocked?.length || 0) >= 5
      if (m1Done && m2Done) setUnlockedPhase(3)
      else if (m1Done) setUnlockedPhase(2)
    }).catch(() => {})
  }, [location.pathname])

  return (
    <nav className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar__header">
        <button
          className="sidebar__toggle"
          onClick={onToggleCollapse}
          title={collapsed ? 'Seitenleiste erweitern' : 'Seitenleiste einklappen'}
          aria-label={collapsed ? 'Seitenleiste erweitern' : 'Seitenleiste einklappen'}
        >
          {collapsed ? '\u{25B6}' : '\u{25C0}'}
        </button>
        {!collapsed && (
          <span className="sidebar__title">QA</span>
        )}
      </div>

      {/* Module Navigation */}
      <div className="sidebar__modules">
        {MODULES.map(mod => {
          const locked = mod.phase > unlockedPhase && mod.id !== 6
          return locked ? (
            <div
              key={mod.id}
              className="sidebar__item sidebar__item--locked"
              onMouseEnter={() => setHoveredModule(mod.id)}
              onMouseLeave={() => setHoveredModule(null)}
              title={collapsed ? `${mod.label} — gesperrt (erst Phase ${mod.phase})` : ''}
            >
              <span className="sidebar__icon" style={{ opacity: 0.35 }}>{mod.icon}</span>
              {!collapsed && (
                <div className="sidebar__item-text">
                  <span className="sidebar__label" style={{ opacity: 0.4 }}>{mod.label}</span>
                  <span className="sidebar__description" style={{ opacity: 0.35, fontSize: '0.7rem' }}>Schliesse Phase {mod.phase - 1} ab</span>
                </div>
              )}
              {collapsed && hoveredModule === mod.id && (
                <div className="sidebar__tooltip">
                  <strong>{mod.label}</strong>
                  <span>Gesperrt — Phase {mod.phase - 1} abschließen</span>
                </div>
              )}
            </div>
          ) : (
            <NavLink
              key={mod.id}
              to={mod.path}
              className={({ isActive }) =>
                `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`
              }
              onMouseEnter={() => setHoveredModule(mod.id)}
              onMouseLeave={() => setHoveredModule(null)}
              title={collapsed ? `${mod.label} - ${mod.description}` : ''}
            >
              <span className="sidebar__icon">{mod.icon}</span>
              {!collapsed && (
                <div className="sidebar__item-text">
                  <span className="sidebar__label">{mod.label}</span>
                  <span className="sidebar__description">{mod.description}</span>
                </div>
              )}
              {collapsed && hoveredModule === mod.id && (
                <div className="sidebar__tooltip">
                  <strong>{mod.label}</strong>
                  <span>{mod.description}</span>
                </div>
              )}
            </NavLink>
          )
        })}
      </div>

      {/* Tools section */}
      <div className="sidebar__modules" style={{ borderTop: '1px solid var(--border)', paddingTop: 4 }}>
        {!collapsed && (
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '6px 12px 2px' }}>
            Werkzeuge
          </div>
        )}
        <NavLink
          to="/analyse"
          className={({ isActive }) => `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`}
          onMouseEnter={() => setHoveredModule('analyse')}
          onMouseLeave={() => setHoveredModule(null)}
          title={collapsed ? 'Vers-Analyse — Wort-für-Wort Morphologie' : ''}
        >
          <span className="sidebar__icon">{'\u{1F50D}'}</span>
          {!collapsed && (
            <div className="sidebar__item-text">
              <span className="sidebar__label">Vers-Analyse</span>
              <span className="sidebar__description">Wort-für-Wort Morphologie</span>
            </div>
          )}
          {collapsed && hoveredModule === 'analyse' && (
            <div className="sidebar__tooltip">
              <strong>Vers-Analyse</strong>
              <span>Wort-für-Wort Morphologie</span>
            </div>
          )}
        </NavLink>
      </div>

      {/* Footer with phase and streak */}
      <div className="sidebar__footer">
        {/* Streak counter */}
        <div className="sidebar__streak" title={`${streakCount} Tage Serie`}>
          <span className="sidebar__streak-icon">{'\u{1F525}'}</span>
          {!collapsed && (
            <span className="sidebar__streak-count">{streakCount}</span>
          )}
        </div>

        {/* Phase indicator */}
        {!collapsed && (
          <div className="sidebar__phase">
            <span className="sidebar__phase-label">Phase {currentPhase}</span>
            <span className="sidebar__phase-name">
              {PHASE_LABELS[currentPhase] || ''}
            </span>
          </div>
        )}

        {/* Settings link */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `sidebar__item sidebar__item--settings ${isActive ? 'sidebar__item--active' : ''}`
          }
          title={collapsed ? 'Einstellungen' : ''}
        >
          <span className="sidebar__icon">{'\u2699\uFE0F'}</span>
          {!collapsed && <span className="sidebar__label">Einstellungen</span>}
        </NavLink>
      </div>
    </nav>
  )
}
