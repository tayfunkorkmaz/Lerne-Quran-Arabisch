/**
 * Persistent storage layer using IndexedDB via localforage.
 * All user data is stored locally - no server communication.
 */
import localforage from 'localforage'

// Configure separate stores for different data types
const stores = {
  progress: localforage.createInstance({
    name: 'quran-arabic',
    storeName: 'progress',
    description: 'Lernfortschritt des Benutzers',
  }),
  words: localforage.createInstance({
    name: 'quran-arabic',
    storeName: 'analyzed_words',
    description: 'Analysierte Worter',
  }),
  roots: localforage.createInstance({
    name: 'quran-arabic',
    storeName: 'root_notebook',
    description: 'Wurzel-Notizbuch',
  }),
  srs: localforage.createInstance({
    name: 'quran-arabic',
    storeName: 'srs_cards',
    description: 'SRS-Wiederholungskarten',
  }),
  settings: localforage.createInstance({
    name: 'quran-arabic',
    storeName: 'settings',
    description: 'Benutzereinstellungen',
  }),
  integrity: localforage.createInstance({
    name: 'quran-arabic',
    storeName: 'integrity',
    description: 'Integritatsprufungen',
  }),
  annotations: localforage.createInstance({
    name: 'quran-arabic',
    storeName: 'verse_annotations',
    description: 'Persönliche Vers-Notizen und Lesezeichen',
  }),
}

// User-flagged ambiguities store (declared early for use in export/import)
const userAmbiguityStore = localforage.createInstance({
  name: 'quran-arabic',
  storeName: 'user_ambiguities',
  description: 'Vom Lernenden gemeldete Mehrdeutigkeiten (Stufe 3)',
})

// ===== Quota-safe write wrapper =====

async function safeSetItem(store, key, value) {
  try {
    await store.setItem(key, value)
  } catch (err) {
    if (err.name === 'QuotaExceededError' ||
        (err.message && err.message.toLowerCase().includes('quota'))) {
      console.error('Speicherplatz voll:', err)
      // Dispatch a custom event that the UI can listen to
      window.dispatchEvent(new CustomEvent('storage-quota-exceeded', {
        detail: { message: 'Der Speicherplatz ist voll. Bitte exportiere deine Daten und lösche alte Browser-Daten.' }
      }))
    }
    throw err  // Re-throw so callers know the save failed
  }
}

// ===== Progress =====

export async function saveProgress(progressData) {
  await safeSetItem(stores.progress, 'current', {
    ...progressData,
    updatedAt: new Date().toISOString(),
  })
}

export async function loadProgress() {
  return await stores.progress.getItem('current')
}

export async function saveModuleProgress(moduleId, data) {
  await safeSetItem(stores.progress, `module_${moduleId}`, {
    ...data,
    updatedAt: new Date().toISOString(),
  })
}

export async function loadModuleProgress(moduleId) {
  return await stores.progress.getItem(`module_${moduleId}`)
}

// ===== Analyzed Words =====

export async function saveAnalyzedWord(wordKey, analysis) {
  await safeSetItem(stores.words, wordKey, {
    ...analysis,
    analyzedAt: new Date().toISOString(),
  })
}

export async function loadAnalyzedWord(wordKey) {
  return await stores.words.getItem(wordKey)
}

export async function loadAllAnalyzedWords() {
  const words = {}
  await stores.words.iterate((value, key) => {
    words[key] = value
  })
  return words
}

// ===== Root Notebook =====

export async function saveRoot(rootKey, rootData) {
  await safeSetItem(stores.roots, rootKey, {
    ...rootData,
    updatedAt: new Date().toISOString(),
  })
}

export async function loadRoot(rootKey) {
  return await stores.roots.getItem(rootKey)
}

export async function loadAllRoots() {
  const roots = {}
  await stores.roots.iterate((value, key) => {
    roots[key] = value
  })
  return roots
}

// ===== SRS Cards =====

export async function saveSRSCard(cardId, cardData) {
  await safeSetItem(stores.srs, cardId, {
    ...cardData,
    updatedAt: new Date().toISOString(),
  })
}

/**
 * Auto-create an SRS card from a word analysis (called from Module 3).
 * Only creates the card if one with the same ID doesn't already exist.
 */
export async function autoCreateSRSCard(wordAnalysis) {
  if (!wordAnalysis || !wordAnalysis.root) return null
  const cardId = `auto_${wordAnalysis.root}_${wordAnalysis.vocalized || wordAnalysis.consonantal || ''}`
  const existing = await stores.srs.getItem(cardId)
  if (existing) return null // Don't overwrite
  const card = {
    type: wordAnalysis.form ? 'wort_kontext' : 'wurzel',
    front: wordAnalysis.consonantal || wordAnalysis.vocalized || '',
    back: [
      wordAnalysis.root ? `Wurzel: ${wordAnalysis.root}` : '',
      wordAnalysis.form ? `Form: ${wordAnalysis.form}` : '',
      wordAnalysis.meaning ? `Bedeutung: ${wordAnalysis.meaning}` : '',
      wordAnalysis.syntaxRole ? `Rolle: ${wordAnalysis.syntaxRole}` : '',
      wordAnalysis.vocalized ? `Vokalisiert: ${wordAnalysis.vocalized}` : '',
    ].filter(Boolean).join('\n'),
    root: wordAnalysis.root,
    word: wordAnalysis.vocalized || wordAnalysis.consonantal || '',
    location: wordAnalysis.location || '',
    // SM-2 initial values
    interval: 1,
    ease: 2.5,
    reviewCount: 0,
    nextReview: new Date().toISOString(),
    history: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    autoGenerated: true,
  }
  await safeSetItem(stores.srs, cardId, card)
  return cardId
}

export async function loadSRSCard(cardId) {
  return await stores.srs.getItem(cardId)
}

export async function loadAllSRSCards() {
  const cards = {}
  await stores.srs.iterate((value, key) => {
    cards[key] = value
  })
  return cards
}

export async function getDueSRSCards() {
  const now = new Date().toISOString()
  const dueCards = []
  await stores.srs.iterate((value, key) => {
    if (!value.nextReview || value.nextReview <= now) {
      dueCards.push({ id: key, ...value })
    }
  })
  return dueCards
}

// ===== Settings =====

const DEFAULT_SETTINGS = {
  theme: 'dark',
  firstRun: true,
  arabicFontSize: 28,
  sidebarCollapsed: false,
  lastBackupReminder: null,
  backupReminderIntervalDays: 7,
  currentSurah: 1,
  currentVerse: 1,
  displayMode: 'research', // 'research' | 'reading'
  streakCount: 0,
  lastActiveDate: null,
  phase: 1,
  completedIntro: false,
}

export async function loadSettings() {
  const saved = await stores.settings.getItem('user_settings')
  return { ...DEFAULT_SETTINGS, ...saved }
}

export async function saveSettings(settings) {
  const current = await loadSettings()
  const merged = { ...current, ...settings }
  await safeSetItem(stores.settings, 'user_settings', merged)
  // Mirror theme to localStorage so the inline script in index.html
  // can set data-theme before React hydration and avoid flash-of-wrong-theme.
  if (typeof localStorage !== 'undefined' && merged.theme) {
    try { localStorage.setItem('user_theme', merged.theme) } catch { /* ignore */ }
  }
  return merged
}

export async function getSetting(key) {
  const settings = await loadSettings()
  return settings[key]
}

export async function setSetting(key, value) {
  const settings = await loadSettings()
  settings[key] = value
  await safeSetItem(stores.settings, 'user_settings', settings)
  return settings
}

// ===== Streak Tracking =====

export async function updateStreak() {
  const settings = await loadSettings()
  const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time
  const lastActive = settings.lastActiveDate

  let newStreak = settings.streakCount

  if (!lastActive) {
    newStreak = 1
  } else if (lastActive === today) {
    // Already counted today
    return settings
  } else {
    const lastDate = new Date(lastActive + 'T00:00:00')
    const todayDate = new Date(today + 'T00:00:00')
    const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24))
    if (diffDays === 1) {
      newStreak = settings.streakCount + 1
    } else {
      newStreak = 1
    }
  }

  return await saveSettings({
    streakCount: newStreak,
    lastActiveDate: today,
  })
}

// ===== Backup Reminder =====

export async function shouldShowBackupReminder() {
  const settings = await loadSettings()
  if (!settings.lastBackupReminder) return true

  const lastReminder = new Date(settings.lastBackupReminder)
  const now = new Date()
  const diffDays = Math.floor((now - lastReminder) / (1000 * 60 * 60 * 24))

  return diffDays >= settings.backupReminderIntervalDays
}

export async function dismissBackupReminder() {
  await saveSettings({ lastBackupReminder: new Date().toISOString() })
}

// ===== Export / Import =====

export async function exportAllData() {
  const data = {
    exportVersion: 2,
    exportedAt: new Date().toISOString(),
    progress: {},
    words: {},
    roots: {},
    srs: {},
    userAmbiguities: {},
    annotations: {},
    settings: await loadSettings(),
  }

  await stores.progress.iterate((value, key) => {
    data.progress[key] = value
  })
  await stores.words.iterate((value, key) => {
    data.words[key] = value
  })
  await stores.roots.iterate((value, key) => {
    data.roots[key] = value
  })
  await stores.srs.iterate((value, key) => {
    data.srs[key] = value
  })
  await userAmbiguityStore.iterate((value, key) => {
    data.userAmbiguities[key] = value
  })
  await stores.annotations.iterate((value, key) => {
    data.annotations[key] = value
  })

  // Include Module 2 progress that was previously in localStorage
  // (Now stored in progress store under module2_* keys, so already captured above)
  // Also grab any remaining localStorage data as migration fallback
  try {
    const morphKey = 'module2_morphology_progress'
    const syntaxKey = 'module2_syntax_progress'
    const morphLocal = localStorage.getItem(morphKey)
    const syntaxLocal = localStorage.getItem(syntaxKey)
    if (morphLocal && !data.progress[morphKey]) {
      data.progress[morphKey] = JSON.parse(morphLocal)
    }
    if (syntaxLocal && !data.progress[syntaxKey]) {
      data.progress[syntaxKey] = JSON.parse(syntaxLocal)
    }
  } catch { /* ignore */ }

  return data
}

export async function importData(jsonData, mode = 'merge') {
  if (!jsonData || !jsonData.exportVersion) {
    throw new Error('Ungultige Importdatei')
  }

  if (mode === 'overwrite') {
    await stores.progress.clear()
    await stores.words.clear()
    await stores.roots.clear()
    await stores.srs.clear()
    await stores.settings.clear()
    await stores.annotations.clear()
    await userAmbiguityStore.clear()
  }

  // Import progress
  if (jsonData.progress) {
    for (const [key, value] of Object.entries(jsonData.progress)) {
      if (mode === 'merge') {
        const existing = await stores.progress.getItem(key)
        if (!existing || (value.updatedAt && value.updatedAt > (existing.updatedAt || ''))) {
          await safeSetItem(stores.progress, key, value)
        }
      } else {
        await safeSetItem(stores.progress, key, value)
      }
    }
  }

  // Import words
  if (jsonData.words) {
    for (const [key, value] of Object.entries(jsonData.words)) {
      if (mode === 'merge') {
        const existing = await stores.words.getItem(key)
        if (!existing || (value.analyzedAt && value.analyzedAt > (existing.analyzedAt || ''))) {
          await safeSetItem(stores.words, key, value)
        }
      } else {
        await safeSetItem(stores.words, key, value)
      }
    }
  }

  // Import roots
  if (jsonData.roots) {
    for (const [key, value] of Object.entries(jsonData.roots)) {
      if (mode === 'merge') {
        const existing = await stores.roots.getItem(key)
        if (!existing || (value.updatedAt && value.updatedAt > (existing.updatedAt || ''))) {
          await safeSetItem(stores.roots, key, value)
        }
      } else {
        await safeSetItem(stores.roots, key, value)
      }
    }
  }

  // Import SRS cards
  if (jsonData.srs) {
    for (const [key, value] of Object.entries(jsonData.srs)) {
      if (mode === 'merge') {
        const existing = await stores.srs.getItem(key)
        if (!existing || (value.updatedAt && value.updatedAt > (existing.updatedAt || ''))) {
          await safeSetItem(stores.srs, key, value)
        }
      } else {
        await safeSetItem(stores.srs, key, value)
      }
    }
  }

  // Import settings
  if (jsonData.settings) {
    if (mode === 'merge') {
      await saveSettings(jsonData.settings)
    } else {
      await safeSetItem(stores.settings, 'user_settings', jsonData.settings)
    }
  }

  // Import user-flagged ambiguities
  if (jsonData.userAmbiguities) {
    if (mode === 'overwrite') {
      await userAmbiguityStore.clear()
    }
    for (const [key, value] of Object.entries(jsonData.userAmbiguities)) {
      if (mode === 'merge') {
        const existing = await userAmbiguityStore.getItem(key)
        if (!existing || (value.updatedAt && value.updatedAt > (existing.updatedAt || ''))) {
          await safeSetItem(userAmbiguityStore, key, value)
        }
      } else {
        await safeSetItem(userAmbiguityStore, key, value)
      }
    }
  }

  // Import annotations
  if (jsonData.annotations) {
    if (mode === 'overwrite') {
      await stores.annotations.clear()
    }
    for (const [key, value] of Object.entries(jsonData.annotations)) {
      if (mode === 'merge') {
        const existing = await stores.annotations.getItem(key)
        if (!existing || (value.updatedAt && value.updatedAt > (existing.updatedAt || ''))) {
          await safeSetItem(stores.annotations, key, value)
        }
      } else {
        await safeSetItem(stores.annotations, key, value)
      }
    }
  }
}

export function downloadJSON(data, filename) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ===== User-Flagged Ambiguities (Stage 3) =====

/**
 * Save a user-flagged ambiguity. The key is the consonantal form.
 * Each entry stores an array of alternative analyses the user proposed.
 */
export async function saveUserAmbiguity(consonantal, alternativeAnalysis) {
  const existing = await userAmbiguityStore.getItem(consonantal)
  const alternatives = existing?.alternatives || []

  // Avoid duplicates (same root + same vocalization)
  const isDuplicate = alternatives.some(a =>
    a.root === alternativeAnalysis.root &&
    a.vocalized === alternativeAnalysis.vocalized
  )

  if (!isDuplicate) {
    alternatives.push({
      ...alternativeAnalysis,
      flaggedAt: new Date().toISOString(),
    })
  }

  await safeSetItem(userAmbiguityStore, consonantal, {
    consonantal,
    alternatives,
    updatedAt: new Date().toISOString(),
    userFlagged: true,
  })
}

/**
 * Load a user-flagged ambiguity by consonantal form.
 */
export async function loadUserAmbiguity(consonantal) {
  return await userAmbiguityStore.getItem(consonantal)
}

/**
 * Load all user-flagged ambiguities.
 */
export async function loadAllUserAmbiguities() {
  const ambiguities = {}
  await userAmbiguityStore.iterate((value, key) => {
    ambiguities[key] = value
  })
  return ambiguities
}

// ===== Integrity / Checksum =====

export async function saveChecksum(checksum) {
  await safeSetItem(stores.integrity, 'quran_checksum', {
    checksum,
    verifiedAt: new Date().toISOString(),
  })
}

export async function loadChecksum() {
  const data = await stores.integrity.getItem('quran_checksum')
  return data ? data.checksum : null
}

// ===== Module 2 Progress (migrated from localStorage to IndexedDB) =====

/**
 * Save Module 2 lesson progress (morphology or syntax).
 * @param {'morphology'|'syntax'} stufe
 * @param {object} progress - { unlocked: string[], scores: object, learnVisited: object }
 */
export async function saveModule2Progress(stufe, progress) {
  await safeSetItem(stores.progress, `module2_${stufe}_progress`, {
    ...progress,
    updatedAt: new Date().toISOString(),
  })
}

/**
 * Load Module 2 lesson progress.
 * Migrates from localStorage on first call if data exists there.
 * @param {'morphology'|'syntax'} stufe
 * @param {string} firstLessonId - default first lesson for fresh start
 * @returns {object} progress data
 */
export async function loadModule2Progress(stufe, firstLessonId) {
  const key = `module2_${stufe}_progress`
  let data = await stores.progress.getItem(key)

  // Migration from localStorage (one-time)
  if (!data) {
    try {
      const localKey = stufe === 'morphology' ? 'module2_morphology_progress' : 'module2_syntax_progress'
      const raw = localStorage.getItem(localKey)
      if (raw) {
        data = JSON.parse(raw)
        if (!data.learnVisited) data.learnVisited = {}
        // Save to IndexedDB and remove from localStorage
        await safeSetItem(stores.progress, key, { ...data, updatedAt: new Date().toISOString() })
        localStorage.removeItem(localKey)
        // Also try to remove old single key
        const oldKey = 'module2_progress'
        if (localStorage.getItem(oldKey)) localStorage.removeItem(oldKey)
      }
    } catch { /* ignore migration errors */ }
  }

  if (data) {
    if (!data.learnVisited) data.learnVisited = {}
    return data
  }

  return { unlocked: [firstLessonId], scores: {}, learnVisited: {} }
}

// ===== Auto Phase Progression =====

/**
 * Check learning progress and automatically advance the curriculum phase.
 * Phase 1: Schrift (initial)
 * Phase 2: Abstrakte Morphologie (after Module 1 basics)
 * Phase 3: Erster Textkontakt (after >50% morphology lessons)
 * Phase 4: Syntax und Partikeln (after first surah analysis)
 * Phase 5: Vertiefung (after >50% syntax lessons)
 *
 * @returns {number} the new/current phase
 */
export async function checkAndUpdatePhase() {
  const settings = await loadSettings()
  let phase = settings.phase || 1

  // Phase 1 → 2: Check if Module 1 has basic progress (learnVisited)
  if (phase === 1) {
    const m1Progress = await loadModuleProgress(1)
    if (m1Progress && m1Progress.learnVisited && Object.keys(m1Progress.learnVisited).length >= 3) {
      phase = 2
    }
    // Also check morphology progress as fallback
    const morphProgress = await stores.progress.getItem('module2_morphology_progress')
    if (morphProgress && morphProgress.unlocked && morphProgress.unlocked.length > 1) {
      phase = 2
    }
  }

  // Phase 2 → 3: Check if >50% morphology lessons unlocked
  if (phase === 2) {
    const morphProgress = await stores.progress.getItem('module2_morphology_progress')
    if (morphProgress && morphProgress.unlocked && morphProgress.unlocked.length >= 15) {
      phase = 3
    }
  }

  // Phase 3 → 4: Check if any surah has been analyzed in Module 3
  if (phase === 3) {
    let hasAnalyzedWords = false
    await stores.words.iterate((value) => {
      if (value && value.surah) {
        hasAnalyzedWords = true
        return true // non-undefined return breaks localforage iteration
      }
    })
    if (hasAnalyzedWords) {
      phase = 4
    }
  }

  // Phase 4 → 5: Check if >50% syntax lessons unlocked
  if (phase === 4) {
    const syntaxProgress = await stores.progress.getItem('module2_syntax_progress')
    if (syntaxProgress && syntaxProgress.unlocked && syntaxProgress.unlocked.length >= 20) {
      phase = 5
    }
  }

  // Update settings if phase changed
  if (phase !== (settings.phase || 1)) {
    await saveSettings({ phase })
  }

  return phase
}

// ===== Verse Annotations / Bookmarks =====

/**
 * Save an annotation (personal note + optional bookmark) for a specific verse.
 * @param {number} surah
 * @param {number} verse
 * @param {object} annotation - { note: string, bookmarked: boolean }
 */
export async function saveAnnotation(surah, verse, annotation) {
  const key = `${surah}:${verse}`
  const existing = await stores.annotations.getItem(key) || {}
  await safeSetItem(stores.annotations, key, {
    ...existing,
    ...annotation,
    surah,
    verse,
    updatedAt: new Date().toISOString(),
  })
}

/**
 * Load annotation for a specific verse.
 */
export async function loadAnnotation(surah, verse) {
  return await stores.annotations.getItem(`${surah}:${verse}`)
}

/**
 * Load all annotations (for export/display).
 */
export async function loadAllAnnotations() {
  const all = []
  await stores.annotations.iterate((value) => {
    if (value) all.push(value)
  })
  return all.sort((a, b) => (a.surah * 1000 + a.verse) - (b.surah * 1000 + b.verse))
}

/**
 * Load only bookmarked verses.
 */
export async function loadBookmarks() {
  const all = []
  await stores.annotations.iterate((value) => {
    if (value && value.bookmarked) all.push(value)
  })
  return all.sort((a, b) => (a.surah * 1000 + a.verse) - (b.surah * 1000 + b.verse))
}

/**
 * Delete annotation for a verse.
 */
export async function deleteAnnotation(surah, verse) {
  await stores.annotations.removeItem(`${surah}:${verse}`)
}
