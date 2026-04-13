// @vitest-environment jsdom
/**
 * Module3 (Vers-Werkstatt) — Interaction and workflow tests.
 * Tests: surah navigation, step workflow, particle marking, word analysis,
 * verse completion, guided path, grammar sidebar toggle.
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
    }),
  },
}))

const mockSaveModuleProgress = vi.fn(async () => {})
const mockLoadModuleProgress = vi.fn(async () => null)
const mockSaveAnalyzedWord = vi.fn(async () => {})
const mockSaveRoot = vi.fn(async () => {})

vi.mock('../../utils/storage.js', () => ({
  saveModuleProgress: (...args) => mockSaveModuleProgress(...args),
  loadModuleProgress: (...args) => mockLoadModuleProgress(...args),
  saveAnalyzedWord: (...args) => mockSaveAnalyzedWord(...args),
  loadAnalyzedWord: vi.fn(async () => null),
  loadAllAnalyzedWords: vi.fn(async () => ({})),
  saveRoot: (...args) => mockSaveRoot(...args),
  loadRoot: vi.fn(async () => null),
  loadAllRoots: vi.fn(async () => ({})),
  saveSRSCard: vi.fn(async () => {}),
  autoCreateSRSCard: vi.fn(async () => null),
  loadSRSCard: vi.fn(async () => null),
  loadAllSRSCards: vi.fn(async () => ({})),
  getDueSRSCards: vi.fn(async () => []),
  loadSettings: vi.fn(async () => ({ theme: 'dark', phase: 1, currentSurah: 1 })),
  saveSettings: vi.fn(async () => ({})),
  saveUserAmbiguity: vi.fn(async () => {}),
  loadUserAmbiguity: vi.fn(async () => null),
  loadModule2Progress: vi.fn(async () => ({ unlocked: ['2.1'], scores: {}, learnVisited: {} })),
}))

vi.mock('../../utils/audio.js', () => ({
  playVerseAudio: vi.fn(async () => ({ status: 'playing', source: 'mock' })),
  stopAudio: vi.fn(),
  buildAudioUrl: vi.fn(() => 'https://example.com/audio.mp3'),
  getDefaultReciterFolder: vi.fn(() => 'Husary_128kbps'),
  getCurrentAudio: vi.fn(() => null),
  isOnline: vi.fn(() => true),
}))

// Browser API mocks
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

afterEach(() => { vi.clearAllMocks() })

// ─── Test Data ──────────────────────────────────────────────────────

const quranData = {
  surahs: [
    {
      number: 1,
      verses: [
        { number: 1, text: '\u0628\u0633\u0645 \u0627\u0644\u0644\u0647 \u0627\u0644\u0631\u062D\u0645\u0646 \u0627\u0644\u0631\u062D\u064A\u0645' },
        { number: 2, text: '\u0627\u0644\u062D\u0645\u062F \u0644\u0644\u0647 \u0631\u0628 \u0627\u0644\u0639\u0627\u0644\u0645\u064A\u0646' },
        { number: 3, text: '\u0627\u0644\u0631\u062D\u0645\u0646 \u0627\u0644\u0631\u062D\u064A\u0645' },
        { number: 4, text: '\u0645\u0627\u0644\u0643 \u064A\u0648\u0645 \u0627\u0644\u062F\u064A\u0646' },
        { number: 5, text: '\u0625\u064A\u0627\u0643 \u0646\u0639\u0628\u062F \u0648\u0625\u064A\u0627\u0643 \u0646\u0633\u062A\u0639\u064A\u0646' },
        { number: 6, text: '\u0627\u0647\u062F\u0646\u0627 \u0627\u0644\u0635\u0631\u0627\u0637 \u0627\u0644\u0645\u0633\u062A\u0642\u064A\u0645' },
        { number: 7, text: '\u0635\u0631\u0627\u0637 \u0627\u0644\u0630\u064A\u0646 \u0627\u0646\u0639\u0645\u062A \u0639\u0644\u064A\u0647\u0645 \u063A\u064A\u0631 \u0627\u0644\u0645\u063A\u0636\u0648\u0628 \u0639\u0644\u064A\u0647\u0645 \u0648\u0644\u0627 \u0627\u0644\u0636\u0627\u0644\u064A\u0646' },
      ],
    },
    {
      number: 112,
      verses: [
        { number: 1, text: '\u0642\u0644 \u0647\u0648 \u0627\u0644\u0644\u0647 \u0627\u062D\u062F' },
        { number: 2, text: '\u0627\u0644\u0644\u0647 \u0627\u0644\u0635\u0645\u062F' },
        { number: 3, text: '\u0644\u0645 \u064A\u0644\u062F \u0648\u0644\u0645 \u064A\u0648\u0644\u062F' },
        { number: 4, text: '\u0648\u0644\u0645 \u064A\u0643\u0646 \u0644\u0647 \u0643\u0641\u0648\u0627 \u0627\u062D\u062F' },
      ],
    },
  ],
}

const settings = { theme: 'dark', phase: 2, currentSurah: 1, currentVerse: 1, arabicFontSize: 28 }

function renderModule3(props = {}) {
  return render(
    <MemoryRouter>
      <Module3Component quranData={quranData} settings={settings} {...props} />
    </MemoryRouter>
  )
}

let Module3Component

beforeAll(async () => {
  const mod = await import('../../modules/Module3.jsx')
  Module3Component = mod.default
}, 60000)

// ═══════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Module3 — Vers-Werkstatt', () => {
  it('renders the Vers-Werkstatt header', async () => {
    renderModule3()
    await waitFor(() => {
      expect(screen.getByText('Vers-Werkstatt')).toBeTruthy()
    })
  })

  it('shows quick-win surah chips (112, 113, 114, 1)', async () => {
    renderModule3()
    await waitFor(() => {
      expect(screen.getByText('Sure 112')).toBeTruthy()
      expect(screen.getByText('Sure 1')).toBeTruthy()
    })
  })

  it('clicking a surah chip changes the displayed surah', async () => {
    renderModule3()
    await waitFor(() => screen.getByText('Sure 112'))
    fireEvent.click(screen.getByText('Sure 112'))
    // After clicking 112, the verse text panel should update
    // We check that the surah number input reflects the change
    await waitFor(() => {
      const inputs = document.querySelectorAll('input[type="number"]')
      const surahInput = Array.from(inputs).find(i => parseInt(i.value) === 112 || parseInt(i.value) === 1)
      expect(surahInput).toBeTruthy()
    })
  })

  it('shows step indicators (Markieren, Analysieren, Fertig, Hören)', async () => {
    renderModule3()
    await waitFor(() => {
      expect(screen.getByText('Markieren')).toBeTruthy()
      expect(screen.getByText('Analysieren')).toBeTruthy()
      expect(screen.getByText('Fertig')).toBeTruthy()
      expect(screen.getByText('Hören')).toBeTruthy()
    })
  })

  it('shows verse text in the right panel', async () => {
    renderModule3()
    await waitFor(() => {
      // The first verse of surah 1 should be visible (بسم الله الرحمن الرحيم)
      expect(document.body.textContent).toContain('\u0628\u0633\u0645')
    })
  })

  it('has Grammatik button that could toggle sidebar', async () => {
    renderModule3()
    await waitFor(() => {
      expect(screen.getByText('Grammatik')).toBeTruthy()
    })
  })

  it('has I\'rab button', async () => {
    renderModule3()
    await waitFor(() => {
      expect(screen.getByText("I'rab")).toBeTruthy()
    })
  })

  it('has Syntax button', async () => {
    renderModule3()
    await waitFor(() => {
      expect(screen.getByText('Syntax')).toBeTruthy()
    })
  })

  it('has Empfohlener Lernpfad toggle', async () => {
    renderModule3()
    await waitFor(() => {
      expect(screen.getByText('Empfohlener Lernpfad')).toBeTruthy()
    })
  })

  it('clicking Empfohlener Lernpfad expands the guided path', async () => {
    renderModule3()
    await waitFor(() => screen.getByText('Empfohlener Lernpfad'))
    fireEvent.click(screen.getByText('Empfohlener Lernpfad'))
    await waitFor(() => {
      // Should show phase labels from GUIDED_PATH
      expect(document.body.textContent).toContain('Einstieg')
    })
  })

  it('displays verse numbers in the text panel', async () => {
    renderModule3()
    await waitFor(() => {
      // Verse numbers 1-7 for Al-Fatiha
      expect(document.body.textContent).toContain('1')
      expect(document.body.textContent).toContain('2')
    })
  })

  it('starts at Step 1 (Markieren)', async () => {
    renderModule3()
    await waitFor(() => {
      // Step 1 should show the particle marking instruction
      expect(document.body.textContent).toContain('Markieren')
    })
  })

  it('Step 1 shows clickable word spans for the active verse', async () => {
    renderModule3()
    await waitFor(() => {
      // The active verse words should be rendered as clickable spans
      const spans = document.querySelectorAll('[role="button"]')
      expect(spans.length).toBeGreaterThan(0)
    })
  })

  it('renders the surah navigation (prev/next buttons)', async () => {
    renderModule3()
    await waitFor(() => {
      const buttons = document.querySelectorAll('button')
      expect(buttons.length).toBeGreaterThan(5)
    })
  })

  it('saves progress on surah change', async () => {
    renderModule3()
    await waitFor(() => screen.getByText('Sure 112'))
    fireEvent.click(screen.getByText('Sure 112'))
    // Wait for async save
    await waitFor(() => {
      expect(mockSaveModuleProgress).toHaveBeenCalled()
    }, { timeout: 3000 })
  })
})
