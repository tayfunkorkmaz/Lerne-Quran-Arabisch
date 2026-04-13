/**
 * Tests for src/utils/storage.js
 * Covers: Settings, Streak, Phase Progression, SRS Cards, Annotations,
 * Export/Import, Backup Reminder, Module2 Progress, User Ambiguities.
 *
 * Uses a minimal localforage mock (in-memory Map per store instance).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ──────────────── localforage mock ────────────────
const storeInstances = new Map()

function createMockStore() {
  const data = new Map()
  return {
    getItem: vi.fn(async (key) => data.get(key) ?? null),
    setItem: vi.fn(async (key, value) => { data.set(key, value) }),
    removeItem: vi.fn(async (key) => { data.delete(key) }),
    clear: vi.fn(async () => { data.clear() }),
    iterate: vi.fn(async (cb) => {
      for (const [key, value] of data.entries()) {
        const result = cb(value, key)
        if (result !== undefined) return result
      }
    }),
    _data: data,
  }
}

vi.mock('localforage', () => ({
  default: {
    createInstance: vi.fn(({ storeName }) => {
      if (!storeInstances.has(storeName)) {
        storeInstances.set(storeName, createMockStore())
      }
      return storeInstances.get(storeName)
    }),
  },
}))

// ──────────────── mock window/localStorage ────────────────
const localStorageMock = (() => {
  const store = {}
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = String(value) }),
    removeItem: vi.fn((key) => { delete store[key] }),
  }
})()

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })
}

if (typeof globalThis.window === 'undefined') {
  globalThis.window = { dispatchEvent: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() }
}
if (typeof globalThis.document === 'undefined') {
  globalThis.document = { createElement: vi.fn(() => ({ click: vi.fn(), href: '', download: '' })), body: { appendChild: vi.fn(), removeChild: vi.fn() } }
}
if (typeof globalThis.URL === 'undefined') {
  globalThis.URL = { createObjectURL: vi.fn(() => 'blob:mock'), revokeObjectURL: vi.fn() }
}
if (typeof globalThis.Blob === 'undefined') {
  globalThis.Blob = class Blob { constructor(parts, opts) { this.parts = parts; this.type = opts?.type } }
}
if (typeof globalThis.CustomEvent === 'undefined') {
  globalThis.CustomEvent = class CustomEvent { constructor(name, opts) { this.type = name; this.detail = opts?.detail } }
}

// ──────────────── Reset stores between tests ────────────────
beforeEach(() => {
  storeInstances.forEach((store) => store._data.clear())
  vi.clearAllMocks()
})

// ──────────────── Import after mocks ────────────────
const {
  loadSettings,
  saveSettings,
  getSetting,
  setSetting,
  updateStreak,
  shouldShowBackupReminder,
  dismissBackupReminder,
  saveProgress,
  loadProgress,
  saveModuleProgress,
  loadModuleProgress,
  saveAnalyzedWord,
  loadAnalyzedWord,
  loadAllAnalyzedWords,
  saveRoot,
  loadRoot,
  loadAllRoots,
  saveSRSCard,
  loadSRSCard,
  loadAllSRSCards,
  getDueSRSCards,
  autoCreateSRSCard,
  exportAllData,
  importData,
  downloadJSON,
  saveUserAmbiguity,
  loadUserAmbiguity,
  loadAllUserAmbiguities,
  saveChecksum,
  loadChecksum,
  saveModule2Progress,
  loadModule2Progress,
  checkAndUpdatePhase,
  saveAnnotation,
  loadAnnotation,
  loadAllAnnotations,
  loadBookmarks,
  deleteAnnotation,
} = await import('../storage.js')

// ═══════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════
describe('Settings', () => {
  it('loadSettings returns defaults on first call', async () => {
    const s = await loadSettings()
    expect(s.theme).toBe('dark')
    expect(s.firstRun).toBe(true)
    expect(s.arabicFontSize).toBe(28)
    expect(s.phase).toBe(1)
    expect(s.streakCount).toBe(0)
  })

  it('saveSettings merges with existing', async () => {
    await saveSettings({ theme: 'light' })
    const s = await loadSettings()
    expect(s.theme).toBe('light')
    expect(s.arabicFontSize).toBe(28) // default preserved
  })

  it('getSetting returns a single setting', async () => {
    await saveSettings({ arabicFontSize: 32 })
    const size = await getSetting('arabicFontSize')
    expect(size).toBe(32)
  })

  it('setSetting updates a single key', async () => {
    await setSetting('displayMode', 'reading')
    const mode = await getSetting('displayMode')
    expect(mode).toBe('reading')
  })
})

// ═══════════════════════════════════════════════════════
// STREAK
// ═══════════════════════════════════════════════════════
describe('Streak', () => {
  it('first call sets streak to 1', async () => {
    const s = await updateStreak()
    expect(s.streakCount).toBe(1)
    expect(s.lastActiveDate).toBeTruthy()
  })

  it('same day call does not increment', async () => {
    await updateStreak()
    const s = await updateStreak()
    expect(s.streakCount).toBe(1)
  })

  it('consecutive day increments streak', async () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toLocaleDateString('en-CA')
    await saveSettings({ streakCount: 5, lastActiveDate: yesterdayStr })
    const s = await updateStreak()
    expect(s.streakCount).toBe(6)
  })

  it('gap of 2+ days resets streak to 1', async () => {
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 3)
    const str = twoDaysAgo.toLocaleDateString('en-CA')
    await saveSettings({ streakCount: 10, lastActiveDate: str })
    const s = await updateStreak()
    expect(s.streakCount).toBe(1)
  })
})

// ═══════════════════════════════════════════════════════
// BACKUP REMINDER
// ═══════════════════════════════════════════════════════
describe('Backup Reminder', () => {
  it('returns true when no lastBackupReminder', async () => {
    expect(await shouldShowBackupReminder()).toBe(true)
  })

  it('returns false right after dismissal', async () => {
    await dismissBackupReminder()
    expect(await shouldShowBackupReminder()).toBe(false)
  })

  it('returns true after interval days pass', async () => {
    const old = new Date()
    old.setDate(old.getDate() - 8)
    await saveSettings({ lastBackupReminder: old.toISOString(), backupReminderIntervalDays: 7 })
    expect(await shouldShowBackupReminder()).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════
// PROGRESS
// ═══════════════════════════════════════════════════════
describe('Progress', () => {
  it('saveProgress / loadProgress round-trip', async () => {
    await saveProgress({ currentSurah: 2, currentVerse: 5 })
    const p = await loadProgress()
    expect(p.currentSurah).toBe(2)
    expect(p.currentVerse).toBe(5)
    expect(p.updatedAt).toBeTruthy()
  })

  it('saveModuleProgress / loadModuleProgress', async () => {
    await saveModuleProgress(1, { learnVisited: { a: true, b: true } })
    const p = await loadModuleProgress(1)
    expect(p.learnVisited.a).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════
// ANALYZED WORDS
// ═══════════════════════════════════════════════════════
describe('Analyzed Words', () => {
  it('save and load a single word', async () => {
    await saveAnalyzedWord('2:3:1', { root: 'ك ت ب', word: 'كتب' })
    const w = await loadAnalyzedWord('2:3:1')
    expect(w.root).toBe('ك ت ب')
    expect(w.analyzedAt).toBeTruthy()
  })

  it('loadAllAnalyzedWords returns all', async () => {
    await saveAnalyzedWord('1:1:1', { word: 'بسم' })
    await saveAnalyzedWord('1:1:2', { word: 'الله' })
    const all = await loadAllAnalyzedWords()
    expect(Object.keys(all).length).toBe(2)
  })
})

// ═══════════════════════════════════════════════════════
// ROOT NOTEBOOK
// ═══════════════════════════════════════════════════════
describe('Root Notebook', () => {
  it('save and load root', async () => {
    await saveRoot('كتب', { meaning: 'schreiben', notes: '' })
    const r = await loadRoot('كتب')
    expect(r.meaning).toBe('schreiben')
  })

  it('loadAllRoots returns all', async () => {
    await saveRoot('كتب', { meaning: 'schreiben' })
    await saveRoot('علم', { meaning: 'wissen' })
    const all = await loadAllRoots()
    expect(Object.keys(all).length).toBe(2)
  })
})

// ═══════════════════════════════════════════════════════
// SRS CARDS
// ═══════════════════════════════════════════════════════
describe('SRS Cards', () => {
  it('save and load card', async () => {
    await saveSRSCard('card1', { front: 'ك', back: 'Kaf', interval: 1, ease: 2.5 })
    const c = await loadSRSCard('card1')
    expect(c.front).toBe('ك')
  })

  it('loadAllSRSCards returns all', async () => {
    await saveSRSCard('a', { front: 'a' })
    await saveSRSCard('b', { front: 'b' })
    const all = await loadAllSRSCards()
    expect(Object.keys(all).length).toBe(2)
  })

  it('getDueSRSCards returns cards where nextReview <= now', async () => {
    await saveSRSCard('due', { nextReview: '2020-01-01T00:00:00Z' })
    await saveSRSCard('future', { nextReview: '2099-01-01T00:00:00Z' })
    await saveSRSCard('null', { nextReview: null })
    const due = await getDueSRSCards()
    const ids = due.map(c => c.id)
    expect(ids).toContain('due')
    expect(ids).toContain('null') // null nextReview → due
    expect(ids).not.toContain('future')
  })

  it('autoCreateSRSCard creates card with SM-2 defaults', async () => {
    const id = await autoCreateSRSCard({ root: 'ك ت ب', vocalized: 'كَتَبَ', form: 'I', meaning: 'schrieb' })
    expect(id).toBeTruthy()
    const card = await loadSRSCard(id)
    expect(card.interval).toBe(1)
    expect(card.ease).toBe(2.5)
    expect(card.autoGenerated).toBe(true)
  })

  it('autoCreateSRSCard does not overwrite existing', async () => {
    await autoCreateSRSCard({ root: 'ك ت ب', vocalized: 'كَتَبَ' })
    const id2 = await autoCreateSRSCard({ root: 'ك ت ب', vocalized: 'كَتَبَ' })
    expect(id2).toBeNull()
  })

  it('autoCreateSRSCard returns null for missing root', async () => {
    const id = await autoCreateSRSCard({ vocalized: 'test' })
    expect(id).toBeNull()
  })
})

// ═══════════════════════════════════════════════════════
// ANNOTATIONS / BOOKMARKS
// ═══════════════════════════════════════════════════════
describe('Annotations', () => {
  it('save and load annotation', async () => {
    await saveAnnotation(2, 255, { note: 'Ayat al-Kursi', bookmarked: true })
    const a = await loadAnnotation(2, 255)
    expect(a.note).toBe('Ayat al-Kursi')
    expect(a.bookmarked).toBe(true)
    expect(a.surah).toBe(2)
    expect(a.verse).toBe(255)
  })

  it('loadAllAnnotations sorted by surah:verse', async () => {
    await saveAnnotation(2, 255, { note: 'b' })
    await saveAnnotation(1, 1, { note: 'a' })
    const all = await loadAllAnnotations()
    expect(all.length).toBe(2)
    expect(all[0].surah).toBe(1)
    expect(all[1].surah).toBe(2)
  })

  it('loadBookmarks returns only bookmarked', async () => {
    await saveAnnotation(1, 1, { bookmarked: true })
    await saveAnnotation(1, 2, { bookmarked: false })
    const bm = await loadBookmarks()
    expect(bm.length).toBe(1)
    expect(bm[0].verse).toBe(1)
  })

  it('deleteAnnotation removes it', async () => {
    await saveAnnotation(1, 1, { note: 'test' })
    await deleteAnnotation(1, 1)
    const a = await loadAnnotation(1, 1)
    expect(a).toBeNull()
  })
})

// ═══════════════════════════════════════════════════════
// USER AMBIGUITIES
// ═══════════════════════════════════════════════════════
describe('User Ambiguities', () => {
  it('save and load user ambiguity', async () => {
    await saveUserAmbiguity('ملك', { root: 'م ل ك', vocalized: 'مَلِكِ' })
    const a = await loadUserAmbiguity('ملك')
    expect(a.alternatives.length).toBe(1)
    expect(a.alternatives[0].root).toBe('م ل ك')
    expect(a.userFlagged).toBe(true)
  })

  it('avoids duplicate alternatives', async () => {
    await saveUserAmbiguity('ملك', { root: 'م ل ك', vocalized: 'مَلِكِ' })
    await saveUserAmbiguity('ملك', { root: 'م ل ك', vocalized: 'مَلِكِ' })
    const a = await loadUserAmbiguity('ملك')
    expect(a.alternatives.length).toBe(1)
  })

  it('adds different alternatives', async () => {
    await saveUserAmbiguity('ملك', { root: 'م ل ك', vocalized: 'مَلِكِ' })
    await saveUserAmbiguity('ملك', { root: 'م ل ك', vocalized: 'مَالِكِ' })
    const a = await loadUserAmbiguity('ملك')
    expect(a.alternatives.length).toBe(2)
  })

  it('loadAllUserAmbiguities returns all', async () => {
    await saveUserAmbiguity('ملك', { root: 'م ل ك', vocalized: 'مَلِكِ' })
    await saveUserAmbiguity('يوم', { root: 'ي و م', vocalized: 'يَوْمِ' })
    const all = await loadAllUserAmbiguities()
    expect(Object.keys(all).length).toBe(2)
  })
})

// ═══════════════════════════════════════════════════════
// CHECKSUM
// ═══════════════════════════════════════════════════════
describe('Checksum', () => {
  it('save and load checksum', async () => {
    await saveChecksum('abc123')
    const c = await loadChecksum()
    expect(c).toBe('abc123')
  })

  it('returns null when no checksum saved', async () => {
    const c = await loadChecksum()
    expect(c).toBeNull()
  })
})

// ═══════════════════════════════════════════════════════
// MODULE 2 PROGRESS
// ═══════════════════════════════════════════════════════
describe('Module2 Progress', () => {
  it('returns default with firstLessonId when no data', async () => {
    const p = await loadModule2Progress('morphology', '2.1')
    expect(p.unlocked).toEqual(['2.1'])
    expect(p.scores).toEqual({})
    expect(p.learnVisited).toEqual({})
  })

  it('saves and loads morphology progress', async () => {
    await saveModule2Progress('morphology', { unlocked: ['2.1', '2.2'], scores: { '2.1': 80 }, learnVisited: { '2.1': true } })
    const p = await loadModule2Progress('morphology', '2.1')
    expect(p.unlocked).toEqual(['2.1', '2.2'])
    expect(p.scores['2.1']).toBe(80)
  })

  it('saves and loads syntax progress', async () => {
    await saveModule2Progress('syntax', { unlocked: ['3.1'], scores: {}, learnVisited: {} })
    const p = await loadModule2Progress('syntax', '3.1')
    expect(p.unlocked).toEqual(['3.1'])
  })
})

// ═══════════════════════════════════════════════════════
// PHASE PROGRESSION
// ═══════════════════════════════════════════════════════
describe('Phase Progression', () => {
  it('starts at phase 1', async () => {
    const phase = await checkAndUpdatePhase()
    expect(phase).toBe(1)
  })

  it('advances to phase 2 when module1 has 3+ learnVisited', async () => {
    await saveModuleProgress(1, { learnVisited: { a: true, b: true, c: true } })
    const phase = await checkAndUpdatePhase()
    expect(phase).toBeGreaterThanOrEqual(2)
  })

  it('advances to phase 2 when morphology has 2+ unlocked', async () => {
    await saveModule2Progress('morphology', { unlocked: ['2.1', '2.2'], scores: {}, learnVisited: {} })
    const phase = await checkAndUpdatePhase()
    expect(phase).toBeGreaterThanOrEqual(2)
  })
})

// ═══════════════════════════════════════════════════════
// EXPORT / IMPORT
// ═══════════════════════════════════════════════════════
describe('Export / Import', () => {
  it('exportAllData returns valid structure', async () => {
    await saveSettings({ theme: 'light' })
    await saveRoot('كتب', { meaning: 'schreiben' })
    await saveSRSCard('card1', { front: 'test' })
    await saveAnnotation(1, 1, { note: 'hi' })

    const data = await exportAllData()
    expect(data.exportVersion).toBe(2)
    expect(data.exportedAt).toBeTruthy()
    expect(data.settings.theme).toBe('light')
    expect(data.roots['كتب']).toBeTruthy()
    expect(data.srs['card1']).toBeTruthy()
    expect(data.annotations['1:1']).toBeTruthy()
  })

  it('importData merge mode adds new entries without overwriting newer', async () => {
    await saveRoot('كتب', { meaning: 'schreiben', updatedAt: '2099-01-01T00:00:00Z' })

    const importedData = {
      exportVersion: 2,
      roots: {
        'كتب': { meaning: 'OVERWRITE', updatedAt: '2020-01-01T00:00:00Z' },
        'علم': { meaning: 'wissen', updatedAt: '2020-01-01T00:00:00Z' },
      },
      progress: {},
      words: {},
      srs: {},
      settings: {},
    }

    await importData(importedData, 'merge')
    const root1 = await loadRoot('كتب')
    expect(root1.meaning).toBe('schreiben') // NOT overwritten (newer local)
    const root2 = await loadRoot('علم')
    expect(root2.meaning).toBe('wissen') // new entry added
  })

  it('importData overwrite mode replaces everything', async () => {
    await saveRoot('كتب', { meaning: 'schreiben' })

    const importedData = {
      exportVersion: 2,
      roots: {
        'علم': { meaning: 'wissen' },
      },
      progress: {},
      words: {},
      srs: {},
      settings: { theme: 'light' },
    }

    await importData(importedData, 'overwrite')
    const root1 = await loadRoot('كتب')
    expect(root1).toBeNull() // cleared
    const root2 = await loadRoot('علم')
    expect(root2.meaning).toBe('wissen')
  })

  it('importData rejects invalid data', async () => {
    await expect(importData(null)).rejects.toThrow('Ungultige Importdatei')
    await expect(importData({})).rejects.toThrow('Ungultige Importdatei')
  })

  it('full export/import round-trip preserves data', async () => {
    await saveSettings({ theme: 'light', arabicFontSize: 32 })
    await saveRoot('كتب', { meaning: 'schreiben' })
    await saveSRSCard('c1', { front: 'test', interval: 3 })
    await saveAnnotation(2, 255, { note: 'important', bookmarked: true })
    await saveUserAmbiguity('ملك', { root: 'م ل ك', vocalized: 'مَلِكِ' })

    const exported = await exportAllData()

    // Clear everything
    storeInstances.forEach((store) => store._data.clear())

    // Import
    await importData(exported, 'overwrite')

    // Verify
    const settings = await loadSettings()
    expect(settings.theme).toBe('light')
    expect(settings.arabicFontSize).toBe(32)

    const root = await loadRoot('كتب')
    expect(root.meaning).toBe('schreiben')

    const card = await loadSRSCard('c1')
    expect(card.front).toBe('test')

    const ann = await loadAnnotation(2, 255)
    expect(ann.note).toBe('important')
    expect(ann.bookmarked).toBe(true)

    const amb = await loadUserAmbiguity('ملك')
    expect(amb.alternatives.length).toBe(1)
  })
})

// ═══════════════════════════════════════════════════════
// downloadJSON
// ═══════════════════════════════════════════════════════
describe('downloadJSON', () => {
  it('creates and clicks a download link', () => {
    const mockA = { click: vi.fn(), href: '', download: '' }
    document.createElement = vi.fn(() => mockA)
    document.body.appendChild = vi.fn()
    document.body.removeChild = vi.fn()

    downloadJSON({ test: true }, 'backup.json')

    expect(document.createElement).toHaveBeenCalledWith('a')
    expect(mockA.download).toBe('backup.json')
    expect(mockA.click).toHaveBeenCalled()
    expect(document.body.removeChild).toHaveBeenCalledWith(mockA)
  })
})
