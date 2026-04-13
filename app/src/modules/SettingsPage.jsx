import { useState, useCallback, useRef } from 'react'
import {
  loadSettings,
  saveSettings,
  exportAllData,
  importData,
  downloadJSON,
  dismissBackupReminder,
} from '../utils/storage.js'

/**
 * Settings page - theme, data export/import, preferences.
 */
export default function SettingsPage({ settings, onSettingsChange }) {
  const [importStatus, setImportStatus] = useState(null) // null | 'success' | 'error'
  const [importMessage, setImportMessage] = useState('')
  const [importMode, setImportMode] = useState('merge')
  const fileInputRef = useRef(null)

  const handleThemeChange = useCallback(async (theme) => {
    document.documentElement.setAttribute('data-theme', theme)
    const updated = await saveSettings({ theme })
    if (onSettingsChange) onSettingsChange(updated)
  }, [onSettingsChange])

  const handleFontSizeChange = useCallback(async (e) => {
    const size = parseInt(e.target.value, 10)
    if (size >= 18 && size <= 48) {
      document.documentElement.style.setProperty('--arabic-size', `${size}px`)
      document.documentElement.style.setProperty('--arabic-size-lg', `${size + 8}px`)
      const updated = await saveSettings({ arabicFontSize: size })
      if (onSettingsChange) onSettingsChange(updated)
    }
  }, [onSettingsChange])

  const handleExport = useCallback(async () => {
    const data = await exportAllData()
    const dateStr = new Date().toISOString().split('T')[0]
    downloadJSON(data, `quran-arabisch-backup-${dateStr}.json`)
    await dismissBackupReminder()
  }, [])

  const handleImportFile = useCallback(async (e, mode) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await importData(data, mode || 'merge')
      setImportStatus('success')
      setImportMessage(
        mode === 'overwrite'
          ? 'Daten wurden vollständig überschrieben.'
          : 'Daten wurden zusammengeführt.'
      )
      // Reload settings
      const updated = await loadSettings()
      if (onSettingsChange) onSettingsChange(updated)
    } catch (err) {
      setImportStatus('error')
      setImportMessage(`Fehler beim Import: ${err.message}`)
    }

    // Reset file input
    e.target.value = ''
  }, [onSettingsChange])

  const handleResetIntro = useCallback(async () => {
    const updated = await saveSettings({ firstRun: true, completedIntro: false })
    if (onSettingsChange) onSettingsChange(updated)
  }, [onSettingsChange])

  return (
    <div className="settings-page">
      <h2>Einstellungen</h2>

      {/* Appearance */}
      <div className="settings-section">
        <h3>Erscheinungsbild</h3>

        <div className="settings-row">
          <div className="settings-row__label">
            <span>Farbschema</span>
            <span>Dunkel oder hell</span>
          </div>
          <div className="settings-row__action">
            <button
              className={`settings-btn ${settings?.theme === 'dark' ? 'settings-btn--primary' : ''}`}
              onClick={() => handleThemeChange('dark')}
            >
              Dunkel
            </button>
            <button
              className={`settings-btn ${settings?.theme === 'light' ? 'settings-btn--primary' : ''}`}
              onClick={() => handleThemeChange('light')}
            >
              Hell
            </button>
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-row__label">
            <span>Arabische Schriftgröße</span>
            <span>{settings?.arabicFontSize || 28}px</span>
          </div>
          <div className="settings-row__action">
            <input
              type="range"
              min="18"
              max="48"
              value={settings?.arabicFontSize || 28}
              onChange={handleFontSizeChange}
              style={{ width: '120px' }}
            />
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="settings-section">
        <h3>Datenverwaltung</h3>

        <div className="settings-row">
          <div className="settings-row__label">
            <span>Daten exportieren</span>
            <span>Alle Lerndaten als JSON sichern</span>
          </div>
          <div className="settings-row__action">
            <button className="settings-btn settings-btn--primary" onClick={handleExport}>
              Exportieren
            </button>
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-row__label">
            <span>Daten importieren (zusammenführen)</span>
            <span>Neue Daten mit bestehenden zusammenführen</span>
          </div>
          <div className="settings-row__action">
            <button className="settings-btn" onClick={() => {
              setImportMode('merge')
              setTimeout(() => fileInputRef.current?.click(), 0)
            }}>
              Importieren
            </button>
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-row__label">
            <span>Daten überschreiben</span>
            <span>Alle bestehenden Daten durch Import ersetzen</span>
          </div>
          <div className="settings-row__action">
            <button className="settings-btn settings-btn--danger" onClick={() => {
              if (confirm('Alle bestehenden Daten werden überschrieben. Fortfahren?')) {
                setImportMode('overwrite')
                setTimeout(() => fileInputRef.current?.click(), 0)
              }
            }}>
              Überschreiben
            </button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={(e) => {
            handleImportFile(e, importMode)
          }}
        />

        {/* Import status */}
        {importStatus && (
          <div style={{
            marginTop: '12px',
            padding: '10px 14px',
            borderRadius: 'var(--radius)',
            background: importStatus === 'success' ? 'var(--correct-bg)' : 'var(--incorrect-bg)',
            color: importStatus === 'success' ? 'var(--correct)' : 'var(--incorrect)',
            fontSize: '0.85rem',
          }}>
            {importMessage}
          </div>
        )}
      </div>

      {/* Misc */}
      <div className="settings-section">
        <h3>Sonstiges</h3>

        <div className="settings-row">
          <div className="settings-row__label">
            <span>Einführung erneut anzeigen</span>
            <span>Die Willkommenssequenz nochmals abspielen</span>
          </div>
          <div className="settings-row__action">
            <button className="settings-btn" onClick={handleResetIntro}>
              Zurücksetzen
            </button>
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-row__label">
            <span>Serie</span>
            <span>{settings?.streakCount || 0} Tage</span>
          </div>
          <div className="settings-row__action">
            <span style={{ fontSize: '1.5rem' }}>{'\u{1F525}'}</span>
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-row__label">
            <span>Phase</span>
            <span>
              {settings?.phase === 1 && 'Phase 1: Schrift'}
              {settings?.phase === 2 && 'Phase 2: Morphologie'}
              {settings?.phase === 3 && 'Phase 3: Textkontakt'}
              {settings?.phase === 4 && 'Phase 4: Syntax und Partikeln'}
              {settings?.phase === 5 && 'Phase 5: Vertiefung'}
              {!settings?.phase && 'Phase 1: Schrift'}
            </span>
          </div>
          <div className="settings-row__action">
            <span style={{ color: 'var(--accent-teal)', fontWeight: 600 }}>
              {settings?.phase || 1}
            </span>
          </div>
        </div>
      </div>

      {/* App info */}
      <div style={{
        marginTop: '32px',
        padding: '16px',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
      }}>
        <div style={{ marginBottom: '4px' }}><strong>Quranisches Arabisch</strong></div>
        <div>Sprachbasierte Methodik zum Erlernen des quranischen Arabisch</div>
        <div style={{ marginTop: '8px' }}>Alle Daten werden lokal auf deinem Gerät gespeichert.</div>
        <div style={{ marginTop: '12px', padding: '10px 12px', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: '6px' }}>
          <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>Hinweis zur Standalone-Fähigkeit</div>
          <div>Der Qurantext, alle Grammatikdaten, Übungen und Wurzelbedeutungen sind <strong>lokal gespeichert</strong> und funktionieren offline.</div>
          <div style={{ marginTop: '4px' }}>Folgende Funktionen benötigen <strong>Internetverbindung</strong>:</div>
          <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
            <li>Lane's Lexicon (ejtaal.net) — externes Wörterbuch</li>
            <li>Vers-Audio (everyayah.com, quran.com) — Audioaufnahmen</li>
            <li>Corpus Quran (corpus.quran.com) — Morphologie-Referenz</li>
          </ul>
          <div style={{ marginTop: '4px' }}>Für diese Ressourcen wird der Link geöffnet; alle anderen Funktionen sind vollständig offline nutzbar.</div>
        </div>
      </div>
    </div>
  )
}
