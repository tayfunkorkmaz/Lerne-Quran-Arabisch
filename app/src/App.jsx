import { useState, useEffect, useCallback, lazy, Suspense, Component } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import IntroSequence from './modules/IntroSequence.jsx'
import {
  loadSettings,
  saveSettings,
  updateStreak,
  checkAndUpdatePhase,
  shouldShowBackupReminder,
  dismissBackupReminder,
  exportAllData,
  downloadJSON,
} from './utils/storage.js'
import { verifyQuranIntegrity } from './utils/integrity.js'
import quranData from './data/quran-simple-clean.json'
import './App.css'

// Lazy-load module pages
const Module1 = lazy(() => import('./modules/Module1.jsx'))
const Module2 = lazy(() => import('./modules/Module2.jsx'))
const Module3 = lazy(() => import('./modules/Module3.jsx'))
const Module4 = lazy(() => import('./modules/Module4.jsx'))
const Module5 = lazy(() => import('./modules/Module5.jsx'))
const Module6 = lazy(() => import('./modules/Module6.jsx'))
const Module7 = lazy(() => import('./modules/Module7.jsx'))
const Module8 = lazy(() => import('./modules/Module8.jsx'))
const SettingsPage  = lazy(() => import('./modules/SettingsPage.jsx'))
const VerseBrowser  = lazy(() => import('./modules/VerseBrowser.jsx'))

function LoadingFallback() {
  return (
    <div className="module-placeholder">
      <div className="module-placeholder__icon">{'\u23F3'}</div>
      <div className="module-placeholder__title">Laden...</div>
    </div>
  )
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', maxWidth: 600, margin: '60px auto' }}>
          <div style={{ fontSize: '2rem', marginBottom: 16 }}>Fehler aufgetreten</div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            Ein unerwarteter Fehler ist aufgetreten. Bitte lade die Seite neu.
          </p>
          <pre style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'left', background: 'var(--bg-card)', padding: 12, borderRadius: 8, overflow: 'auto', maxHeight: 120 }}>
            {this.state.error?.message}
          </pre>
          <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }}
            style={{ marginTop: 20, padding: '10px 24px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: '1rem' }}>
            Seite neu laden
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const location = useLocation()

  // Settings state
  const [settings, setSettings] = useState(null)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  // Integrity check state
  const [integrityStatus, setIntegrityStatus] = useState('checking') // 'checking' | 'ok' | 'error'
  const [integrityMessage, setIntegrityMessage] = useState('')

  // Intro state
  const [showIntro, setShowIntro] = useState(false)

  // Backup reminder
  const [showBackupReminder, setShowBackupReminder] = useState(false)

  // Storage quota warning
  const [storageQuotaWarning, setStorageQuotaWarning] = useState(null)

  // Listen for storage-quota-exceeded events
  useEffect(() => {
    function handleQuotaExceeded(e) {
      setStorageQuotaWarning(e.detail?.message || 'Der Speicherplatz ist voll. Bitte exportiere deine Daten und lösche alte Browser-Daten.')
    }
    window.addEventListener('storage-quota-exceeded', handleQuotaExceeded)
    return () => window.removeEventListener('storage-quota-exceeded', handleQuotaExceeded)
  }, [])

  // Load settings on mount
  useEffect(() => {
    async function init() {
      const s = await loadSettings()
      setSettings(s)
      setSettingsLoaded(true)

      // First-run detection
      if (s.firstRun) {
        setShowIntro(true)
      }

      // Apply theme
      document.documentElement.setAttribute('data-theme', s.theme || 'dark')

      // Apply saved Arabic font size
      if (s.arabicFontSize && s.arabicFontSize !== 28) {
        document.documentElement.style.setProperty('--arabic-size', `${s.arabicFontSize}px`)
        document.documentElement.style.setProperty('--arabic-size-lg', `${s.arabicFontSize + 8}px`)
      }

      // Update streak
      await updateStreak()

      // Auto-advance curriculum phase based on progress
      const newPhase = await checkAndUpdatePhase()
      if (newPhase !== s.phase) {
        const updated = await loadSettings()
        setSettings(updated)
      }

      // Check backup reminder
      const shouldRemind = await shouldShowBackupReminder()
      setShowBackupReminder(shouldRemind)
    }
    init()
  }, [])

  // Runtime integrity check on mount
  useEffect(() => {
    let cancelled = false
    async function checkIntegrity() {
      try {
        const result = await verifyQuranIntegrity(quranData)
        if (cancelled) return
        if (result.valid) {
          setIntegrityStatus('ok')
          setIntegrityMessage('Textintegrität verifiziert')
        } else {
          setIntegrityStatus('error')
          setIntegrityMessage(
            `Integritätsprüfung fehlgeschlagen: ${result.details?.error || 'Prüfsumme stimmt nicht überein'}`
          )
        }
      } catch (err) {
        if (cancelled) return
        setIntegrityStatus('error')
        setIntegrityMessage(`Integritätsprüfung fehlgeschlagen: ${err.message}`)
      }
    }
    checkIntegrity()
    return () => { cancelled = true }
  }, [])

  // Theme switching
  const toggleTheme = useCallback(async () => {
    const newTheme = settings?.theme === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', newTheme)
    const updated = await saveSettings({ theme: newTheme })
    setSettings(updated)
  }, [settings])

  // Sidebar collapse
  const toggleSidebar = useCallback(async () => {
    const collapsed = !settings?.sidebarCollapsed
    const updated = await saveSettings({ sidebarCollapsed: collapsed })
    setSettings(updated)
  }, [settings])

  // Intro complete handler
  const handleIntroComplete = useCallback(async () => {
    setShowIntro(false)
    const updated = await saveSettings({ firstRun: false, completedIntro: true })
    setSettings(updated)
  }, [])

  // Backup actions
  const handleExportBackup = useCallback(async () => {
    const data = await exportAllData()
    const dateStr = new Date().toISOString().split('T')[0]
    downloadJSON(data, `quran-arabisch-backup-${dateStr}.json`)
    await dismissBackupReminder()
    setShowBackupReminder(false)
  }, [])

  const handleDismissReminder = useCallback(async () => {
    await dismissBackupReminder()
    setShowBackupReminder(false)
  }, [])

  // Don't render until settings are loaded
  if (!settingsLoaded) {
    return (
      <div className="app">
        <LoadingFallback />
      </div>
    )
  }

  // Current module name for topbar
  const moduleNames = {
    '/module/1': 'Modul 1: Schrift-Trainer',
    '/module/2': 'Modul 2: Morphologie-Dojo',
    '/module/3': 'Modul 3: Vers-Werkstatt',
    '/module/4': 'Modul 4: Wurzel-Notizbuch',
    '/module/5': 'Modul 5: Wiederholung (SRS)',
    '/module/6': 'Modul 6: Dashboard',
    '/module/7': 'Modul 7: Fortgeschrittene Stufen',
    '/module/8': 'Modul 8: Werkzeuge',
    '/settings': 'Einstellungen',
    '/analyse': 'Vers-Analyse',
  }
  const currentModuleName = moduleNames[location.pathname] || 'Quranisches Arabisch'

  return (
    <div className="app">
      {/* Intro Overlay */}
      {showIntro && <IntroSequence onComplete={handleIntroComplete} />}

      {/* Sidebar */}
      <Sidebar
        collapsed={settings?.sidebarCollapsed || false}
        onToggleCollapse={toggleSidebar}
        streakCount={settings?.streakCount || 0}
        currentPhase={settings?.phase || 1}
      />

      {/* Main Content Area */}
      <div className="app__content">
        {/* Top Bar */}
        <div className="app__topbar">
          <span className="app__topbar-title">{currentModuleName}</span>
          <div className="app__topbar-actions">
            <button
              className="app__theme-btn"
              onClick={toggleTheme}
              title={settings?.theme === 'dark' ? 'Helles Design' : 'Dunkles Design'}
            >
              {settings?.theme === 'dark' ? '\u2600\uFE0F' : '\u{1F319}'}
            </button>
          </div>
        </div>

        {/* Integrity Banner (only shown on error) */}
        {integrityStatus === 'error' && (
          <div className="app__integrity-banner app__integrity-banner--error">
            {'\u26A0\uFE0F'} {integrityMessage}
          </div>
        )}
        {integrityStatus === 'checking' && (
          <div className="app__integrity-banner app__integrity-banner--checking">
            {'\u23F3'} Integrität wird geprüft...
          </div>
        )}

        {/* Storage Quota Warning */}
        {storageQuotaWarning && (
          <div className="app__integrity-banner app__integrity-banner--error">
            {'\u26A0\uFE0F'} {storageQuotaWarning}
            <button
              style={{ marginLeft: '12px', padding: '2px 10px', cursor: 'pointer' }}
              onClick={() => setStorageQuotaWarning(null)}
            >
              Schließen
            </button>
          </div>
        )}

        {/* Backup Reminder */}
        {showBackupReminder && (
          <div className="app__backup-reminder">
            <span>
              {'\u{1F4BE}'} Es ist Zeit für eine Sicherungskopie deiner Lerndaten.
            </span>
            <div className="app__backup-actions">
              <button onClick={handleExportBackup}>Jetzt sichern</button>
              <button onClick={handleDismissReminder}>Später</button>
            </div>
          </div>
        )}

        {/* Routes */}
        <main className="app__main">
          <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Navigate to="/module/1" replace />} />
              <Route path="/module/1" element={<Module1 />} />
              <Route path="/module/2" element={<Module2 settings={settings} />} />
              <Route path="/module/3" element={<Module3 quranData={quranData} settings={settings} />} />
              <Route path="/module/4" element={<Module4 settings={settings} />} />
              <Route path="/module/5" element={<Module5 settings={settings} />} />
              <Route path="/module/6" element={<Module6 quranData={quranData} settings={settings} />} />
              <Route path="/module/7" element={<Module7 />} />
              <Route path="/module/8" element={<Module8 />} />
              <Route path="/analyse" element={<VerseBrowser />} />
              <Route path="/settings" element={<SettingsPage settings={settings} onSettingsChange={setSettings} />} />
              <Route path="*" element={<Navigate to="/module/1" replace />} />
            </Routes>
          </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
