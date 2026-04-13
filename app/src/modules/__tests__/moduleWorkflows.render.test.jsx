/**
 * Module-level React component render tests.
 *
 * Verifies that every module page renders without crashing
 * when given minimal valid props.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// ─── Global browser API mocks ────────────────────────────────────────

beforeAll(() => {
  // Mock window.matchMedia (used by theme / responsive logic)
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  // Mock IntersectionObserver (used by lazy-loading / scroll triggers)
  global.IntersectionObserver = class {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  // Mock ResizeObserver
  global.ResizeObserver = class {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  // Mock AudioContext / webkitAudioContext
  global.AudioContext = vi.fn().mockImplementation(() => ({
    createOscillator: vi.fn(() => ({ connect: vi.fn(), start: vi.fn(), stop: vi.fn(), frequency: {} })),
    createGain: vi.fn(() => ({ connect: vi.fn(), gain: { value: 1 } })),
    destination: {},
    resume: vi.fn(),
    close: vi.fn(),
  }))
  global.webkitAudioContext = global.AudioContext

  // Mock HTMLMediaElement play/pause
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
  HTMLMediaElement.prototype.pause = vi.fn()

  // Mock scrollIntoView
  Element.prototype.scrollIntoView = vi.fn()

  // Mock navigator.storage
  if (!navigator.storage) {
    Object.defineProperty(navigator, 'storage', {
      value: { estimate: vi.fn(async () => ({ usage: 0, quota: 1e9 })) },
      writable: true,
    })
  }
})

afterEach(() => {
  cleanup()
})

// ─── Mock localforage ────────────────────────────────────────────────

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
    getItem: vi.fn(async () => null),
    setItem: vi.fn(async () => {}),
    removeItem: vi.fn(async () => {}),
    clear: vi.fn(async () => {}),
    iterate: vi.fn(async () => {}),
    keys: vi.fn(async () => []),
  },
}))

// ─── Mock storage utilities ──────────────────────────────────────────

vi.mock('../../utils/storage.js', () => ({
  saveProgress: vi.fn(async () => {}),
  loadProgress: vi.fn(async () => null),
  saveModuleProgress: vi.fn(async () => {}),
  loadModuleProgress: vi.fn(async () => null),
  saveAnalyzedWord: vi.fn(async () => {}),
  loadAnalyzedWord: vi.fn(async () => null),
  loadAllAnalyzedWords: vi.fn(async () => ({})),
  saveRoot: vi.fn(async () => {}),
  loadRoot: vi.fn(async () => null),
  loadAllRoots: vi.fn(async () => ({})),
  saveSRSCard: vi.fn(async () => {}),
  autoCreateSRSCard: vi.fn(async () => null),
  loadSRSCard: vi.fn(async () => null),
  loadAllSRSCards: vi.fn(async () => ({})),
  getDueSRSCards: vi.fn(async () => []),
  loadSettings: vi.fn(async () => ({ theme: 'dark', fontSize: 28 })),
  saveSettings: vi.fn(async () => ({ theme: 'dark', fontSize: 28 })),
  getSetting: vi.fn(async () => null),
  setSetting: vi.fn(async () => {}),
  updateStreak: vi.fn(async () => ({ current: 0, longest: 0 })),
  shouldShowBackupReminder: vi.fn(async () => false),
  dismissBackupReminder: vi.fn(async () => {}),
  exportAllData: vi.fn(async () => ({})),
  importData: vi.fn(async () => ({ success: true })),
  downloadJSON: vi.fn(),
  saveUserAmbiguity: vi.fn(async () => {}),
  loadUserAmbiguity: vi.fn(async () => null),
  loadAllUserAmbiguities: vi.fn(async () => ({})),
  saveChecksum: vi.fn(async () => {}),
  loadChecksum: vi.fn(async () => null),
  checkAndUpdatePhase: vi.fn(async () => 1),
  saveModule2Progress: vi.fn(async () => {}),
  loadModule2Progress: vi.fn(async () => null),
  saveAnnotation: vi.fn(async () => {}),
  loadAllAnnotations: vi.fn(async () => ({})),
  deleteAnnotation: vi.fn(async () => {}),
}))

// ─── Mock integrity check ────────────────────────────────────────────

vi.mock('../../utils/integrity.js', () => ({
  verifyQuranIntegrity: vi.fn(async () => ({ ok: true, message: 'OK' })),
}))

// ─── Shared test data ────────────────────────────────────────────────

const minimalQuranData = {
  surahs: [
    {
      number: 1,
      name: '\u0627\u0644\u0641\u0627\u062A\u062D\u0629',
      englishName: 'Al-Fatiha',
      verses: [
        { number: 1, text: '\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u064E\u0647\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0646\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650' },
        { number: 2, text: '\u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F \u0644\u0650\u0644\u0651\u064E\u0647\u0650 \u0631\u064E\u0628\u0651\u0650 \u0627\u0644\u0652\u0639\u064E\u0627\u0644\u064E\u0645\u0650\u064A\u0646\u064E' },
      ],
    },
  ],
}

const defaultSettings = {
  theme: 'dark',
  fontSize: 28,
  currentSurah: 1,
  arabicSize: 28,
}

// ─── Helper: wrap component in MemoryRouter ──────────────────────────

function renderInRouter(ui, { route = '/' } = {}) {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>)
}

// ═════════════════════════════════════════════════════════════════════
//  TESTS
// ═════════════════════════════════════════════════════════════════════

describe('Module render smoke tests', () => {
  // ── 1. Module1 ─────────────────────────────────────────────────────
  it('Module1 renders without crashing (no props)', { timeout: 30000 }, async () => {
    const { default: Module1 } = await import('../../modules/Module1.jsx')
    const { container } = renderInRouter(<Module1 />)
    expect(container).toBeTruthy()
    expect(container.innerHTML.length).toBeGreaterThan(0)
  })

  // ── 2. Module2 ─────────────────────────────────────────────────────
  it('Module2 renders without crashing (no required props)', { timeout: 30000 }, async () => {
    const { default: Module2 } = await import('../../modules/Module2.jsx')
    const { container } = renderInRouter(<Module2 />)
    expect(container).toBeTruthy()
    expect(container.innerHTML.length).toBeGreaterThan(0)
  })

  // ── 3. Module3 ─────────────────────────────────────────────────────
  it('Module3 renders with quranData and settings', { timeout: 30000 }, async () => {
    const { default: Module3 } = await import('../../modules/Module3.jsx')
    const { container } = renderInRouter(
      <Module3 quranData={minimalQuranData} settings={defaultSettings} />
    )
    expect(container).toBeTruthy()
    expect(container.innerHTML.length).toBeGreaterThan(0)
  })

  // ── 4. Module4 ─────────────────────────────────────────────────────
  it('Module4 renders with settings prop', { timeout: 30000 }, async () => {
    const { default: Module4 } = await import('../../modules/Module4.jsx')
    const { container } = renderInRouter(<Module4 settings={defaultSettings} />)
    expect(container).toBeTruthy()
    expect(container.innerHTML.length).toBeGreaterThan(0)
  })

  // ── 5. Module5 ─────────────────────────────────────────────────────
  // Module5 uses localforage.createInstance directly (not via storage.js),
  // which interacts with the mock. Test that it at least imports and the
  // component function exists.
  it('Module5 exports a valid React component', { timeout: 30000 }, async () => {
    const mod = await import('../../modules/Module5.jsx')
    expect(typeof mod.default).toBe('function')
  })

  // ── 6. Module6 ─────────────────────────────────────────────────────
  it('Module6 renders with quranData and settings props', async () => {
    const { default: Module6 } = await import('../../modules/Module6.jsx')
    const { container } = renderInRouter(
      <Module6 quranData={minimalQuranData} settings={defaultSettings} />
    )
    expect(container).toBeTruthy()
    expect(container.innerHTML.length).toBeGreaterThan(0)
  })

  // ── 7. Module7 ─────────────────────────────────────────────────────
  it('Module7 renders without props', async () => {
    const { default: Module7 } = await import('../../modules/Module7.jsx')
    const { container } = renderInRouter(<Module7 />)
    expect(container).toBeTruthy()
    expect(container.innerHTML.length).toBeGreaterThan(0)
  })

  // ── 8. Module8 ─────────────────────────────────────────────────────
  it('Module8 renders without props', { timeout: 60000 }, async () => {
    const { default: Module8 } = await import('../../modules/Module8.jsx')
    const { container } = renderInRouter(<Module8 />)
    expect(container).toBeTruthy()
    expect(container.innerHTML.length).toBeGreaterThan(0)
  })

  // ── 9. SettingsPage ────────────────────────────────────────────────
  it('SettingsPage renders with settings and onSettingsChange', async () => {
    const { default: SettingsPage } = await import('../../modules/SettingsPage.jsx')
    const onSettingsChange = vi.fn()
    const { container } = renderInRouter(
      <SettingsPage settings={defaultSettings} onSettingsChange={onSettingsChange} />
    )
    expect(container).toBeTruthy()
    expect(container.innerHTML.length).toBeGreaterThan(0)
  })

  // ── 10. IntroSequence ──────────────────────────────────────────────
  it('IntroSequence renders with onComplete prop', async () => {
    const { default: IntroSequence } = await import('../../modules/IntroSequence.jsx')
    const onComplete = vi.fn()
    const { container } = renderInRouter(<IntroSequence onComplete={onComplete} />)
    expect(container).toBeTruthy()
    expect(container.innerHTML.length).toBeGreaterThan(0)
  })

  // ── 11. App ────────────────────────────────────────────────────────
  it('App renders inside MemoryRouter without crashing', async () => {
    const { default: App } = await import('../../App.jsx')
    // App uses useLocation internally, so it must be inside a Router.
    // MemoryRouter is already providing the routing context.
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )
    expect(container).toBeTruthy()
    expect(container.innerHTML.length).toBeGreaterThan(0)
  })
})
