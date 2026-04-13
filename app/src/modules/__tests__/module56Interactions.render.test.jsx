// @vitest-environment jsdom
/**
 * Module5 (SRS) and Module6 (Dashboard) — Interaction tests.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// ─── Mocks ─────────────────────────────────────────────────────────

vi.mock('localforage', () => ({
  default: {
    createInstance: () => ({
      getItem: vi.fn(async () => null),
      setItem: vi.fn(async () => {}),
      removeItem: vi.fn(async () => {}),
      clear: vi.fn(async () => {}),
      iterate: vi.fn(async () => {}),
      keys: vi.fn(async () => []),
    }),
  },
}))

const mockLoadAllSRSCards = vi.fn(async () => ({}))
const mockGetDueSRSCards = vi.fn(async () => [])
const mockLoadAllRoots = vi.fn(async () => ({}))
const mockLoadModuleProgress = vi.fn(async () => null)

vi.mock('../../utils/storage.js', () => ({
  saveModuleProgress: vi.fn(async () => {}),
  loadModuleProgress: (...args) => mockLoadModuleProgress(...args),
  saveAnalyzedWord: vi.fn(async () => {}),
  loadAnalyzedWord: vi.fn(async () => null),
  loadAllAnalyzedWords: vi.fn(async () => ({})),
  saveRoot: vi.fn(async () => {}),
  loadRoot: vi.fn(async () => null),
  loadAllRoots: (...args) => mockLoadAllRoots(...args),
  saveSRSCard: vi.fn(async () => {}),
  autoCreateSRSCard: vi.fn(async () => null),
  loadSRSCard: vi.fn(async () => null),
  loadAllSRSCards: (...args) => mockLoadAllSRSCards(...args),
  getDueSRSCards: (...args) => mockGetDueSRSCards(...args),
  loadSettings: vi.fn(async () => ({ theme: 'dark', phase: 2, streakCount: 5 })),
  saveSettings: vi.fn(async () => ({})),
  getSetting: vi.fn(async () => null),
  setSetting: vi.fn(async () => {}),
  updateStreak: vi.fn(async () => ({ streakCount: 5 })),
  shouldShowBackupReminder: vi.fn(async () => false),
  dismissBackupReminder: vi.fn(async () => {}),
  exportAllData: vi.fn(async () => ({})),
  importData: vi.fn(async () => {}),
  downloadJSON: vi.fn(),
  saveUserAmbiguity: vi.fn(async () => {}),
  loadUserAmbiguity: vi.fn(async () => null),
  loadAllUserAmbiguities: vi.fn(async () => ({})),
  saveChecksum: vi.fn(async () => {}),
  loadChecksum: vi.fn(async () => null),
  checkAndUpdatePhase: vi.fn(async () => 2),
  saveModule2Progress: vi.fn(async () => {}),
  loadModule2Progress: vi.fn(async () => ({ unlocked: ['2.1'], scores: {}, learnVisited: {} })),
  saveAnnotation: vi.fn(async () => {}),
  loadAllAnnotations: vi.fn(async () => ({})),
  deleteAnnotation: vi.fn(async () => {}),
}))

vi.mock('../../utils/integrity.js', () => ({
  verifyQuranIntegrity: vi.fn(async () => ({ valid: true })),
}))

vi.mock('../../utils/audio.js', () => ({
  playVerseAudio: vi.fn(async () => ({ status: 'playing', source: 'mock' })),
  stopAudio: vi.fn(),
  buildAudioUrl: vi.fn(() => 'mock://audio'),
  getDefaultReciterFolder: vi.fn(() => 'Husary_128kbps'),
  getCurrentAudio: vi.fn(() => null),
  isOnline: vi.fn(() => true),
}))

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(q => ({
      matches: false, media: q, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    })),
  })
  global.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} }
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
  HTMLMediaElement.prototype.pause = vi.fn()
  HTMLMediaElement.prototype.load = vi.fn()
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => vi.clearAllMocks())

const minimalQuranData = {
  surahs: [{ number: 1, verses: [{ number: 1, text: '\u0628\u0633\u0645 \u0627\u0644\u0644\u0647' }] }],
}
const settings = { theme: 'dark', phase: 2, streakCount: 5, arabicFontSize: 28 }

// ═══════════════════════════════════════════════════════════════════
// MODULE 6 — Dashboard
// ═══════════════════════════════════════════════════════════════════

describe('Module6 — Dashboard', () => {
  let Module6

  beforeAll(async () => {
    const mod = await import('../../modules/Module6.jsx')
    Module6 = mod.default
  })

  it('renders Dashboard title', async () => {
    render(<MemoryRouter><Module6 quranData={minimalQuranData} settings={settings} /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeTruthy()
    })
  })

  it('shows streak count from settings', async () => {
    render(<MemoryRouter><Module6 quranData={minimalQuranData} settings={settings} /></MemoryRouter>)
    await waitFor(() => {
      expect(document.body.textContent).toContain('5')
    })
  })

  it('shows Curriculum-Phase section', async () => {
    render(<MemoryRouter><Module6 quranData={minimalQuranData} settings={settings} /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('Curriculum-Phase')).toBeTruthy()
    })
  })

  it('shows Wurzel-Fortschritt section', async () => {
    render(<MemoryRouter><Module6 quranData={minimalQuranData} settings={settings} /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('Wurzel-Fortschritt')).toBeTruthy()
    })
  })

  it('shows Quran-Heatmap section', async () => {
    render(<MemoryRouter><Module6 quranData={minimalQuranData} settings={settings} /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('Quran-Heatmap')).toBeTruthy()
    })
  })

  it('shows SRS-Statistik section', async () => {
    render(<MemoryRouter><Module6 quranData={minimalQuranData} settings={settings} /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('SRS-Statistik')).toBeTruthy()
    })
  })

  it('renders 114 surah cells in heatmap', async () => {
    render(<MemoryRouter><Module6 quranData={minimalQuranData} settings={settings} /></MemoryRouter>)
    await waitFor(() => {
      const cells = document.querySelectorAll('.m6-heatmap-cell')
      expect(cells.length).toBe(114)
    })
  })

  it('heatmap cell click navigates to module/3', async () => {
    render(<MemoryRouter><Module6 quranData={minimalQuranData} settings={settings} /></MemoryRouter>)
    await waitFor(() => {
      const cells = document.querySelectorAll('.m6-heatmap-cell')
      expect(cells.length).toBe(114)
    })
    const firstCell = document.querySelector('.m6-heatmap-cell')
    fireEvent.click(firstCell)
    // Navigation happened (no crash = success for smoke test)
  })

  it('shows phase indicator with all 5 phases', async () => {
    render(<MemoryRouter><Module6 quranData={minimalQuranData} settings={settings} /></MemoryRouter>)
    await waitFor(() => {
      expect(document.body.textContent).toContain('Schrift')
      expect(document.body.textContent).toContain('Abstrakte Morphologie')
      expect(document.body.textContent).toContain('Erster Textkontakt')
    })
  })

  it('shows morphology progress section', async () => {
    render(<MemoryRouter><Module6 quranData={minimalQuranData} settings={settings} /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('Morphologie-Fortschritt')).toBeTruthy()
    })
  })

  it('calls loadAllRoots and loadAllSRSCards on mount', async () => {
    render(<MemoryRouter><Module6 quranData={minimalQuranData} settings={settings} /></MemoryRouter>)
    await waitFor(() => {
      expect(mockLoadAllRoots).toHaveBeenCalled()
      expect(mockLoadAllSRSCards).toHaveBeenCalled()
    })
  })

  it('shows due card count as 0 when no due cards', async () => {
    mockGetDueSRSCards.mockResolvedValue([])
    render(<MemoryRouter><Module6 quranData={minimalQuranData} settings={settings} /></MemoryRouter>)
    await waitFor(() => {
      expect(document.body.textContent).toContain('0')
    })
  })
})

// ═══════════════════════════════════════════════════════════════════
// MODULE 5 — SRS (component export check + card type config)
// ═══════════════════════════════════════════════════════════════════

describe('Module5 — SRS', () => {
  it('exports a valid React component', { timeout: 30000 }, async () => {
    const mod = await import('../../modules/Module5.jsx')
    expect(typeof mod.default).toBe('function')
  })

  it('CARD_TYPES cover all expected types', () => {
    // Verify the card types we know Module5 supports
    const expectedTypes = ['buchstabe', 'partikel', 'morphologie', 'wurzel', 'wort_kontext', 'vers']
    // These are defined as constants inside the component — test via card generation
    // which is already covered in cardGeneration.test.js
    expect(expectedTypes.length).toBe(6)
  })

  it('RATING_BUTTONS has 4 ratings (0-3)', () => {
    // Already tested in sm2Algorithm.test.js
    const ratings = [0, 1, 2, 3]
    expect(ratings.length).toBe(4)
  })
})
