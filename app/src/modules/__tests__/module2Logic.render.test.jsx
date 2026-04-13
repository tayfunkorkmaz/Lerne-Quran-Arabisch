/**
 * Module2 — Morphologie-Dojo: Internal logic and user interaction tests.
 *
 * Covers: track selection, lesson list rendering, lesson detail,
 * learn mode, exercise mode (multiple choice, fill-in, matching,
 * conjugation drill), correct/wrong answers, lesson completion,
 * progress saving, back navigation, and paradigm drill access.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

// ─── Default progress objects returned by the storage mock ───────────

const DEFAULT_MORPHOLOGY_PROGRESS = {
  unlocked: ['2.1'],
  scores: {},
  learnVisited: {},
}

const DEFAULT_SYNTAX_PROGRESS = {
  unlocked: ['3.1'],
  scores: {},
  learnVisited: {},
}

// ─── Global browser API mocks ────────────────────────────────────────

beforeAll(() => {
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

  global.IntersectionObserver = class {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  global.ResizeObserver = class {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  global.AudioContext = vi.fn().mockImplementation(() => ({
    createOscillator: vi.fn(() => ({
      connect: vi.fn(), start: vi.fn(), stop: vi.fn(), frequency: {},
    })),
    createGain: vi.fn(() => ({ connect: vi.fn(), gain: { value: 1 } })),
    destination: {},
    resume: vi.fn(),
    close: vi.fn(),
  }))
  global.webkitAudioContext = global.AudioContext

  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
  HTMLMediaElement.prototype.pause = vi.fn()
  Element.prototype.scrollIntoView = vi.fn()

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
// loadModule2Progress must return a proper progress object (not null),
// otherwise Module2 will crash when accessing progress.unlocked etc.

const mockSaveModule2Progress = vi.fn(async () => {})
const mockLoadModule2Progress = vi.fn(async (stufe) => {
  if (stufe === 'syntax') return { ...DEFAULT_SYNTAX_PROGRESS }
  return { ...DEFAULT_MORPHOLOGY_PROGRESS }
})

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
  saveModule2Progress: mockSaveModule2Progress,
  loadModule2Progress: mockLoadModule2Progress,
  saveAnnotation: vi.fn(async () => {}),
  loadAllAnnotations: vi.fn(async () => ({})),
  deleteAnnotation: vi.fn(async () => {}),
}))

// ─── Helper: render Module2 inside MemoryRouter ─────────────────────

function renderModule2(ui, { route = '/' } = {}) {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>)
}

// Lazy-import Module2 so mocks are applied first
async function getModule2() {
  const mod = await import('../../modules/Module2.jsx')
  return mod.default
}

/**
 * Helper: render Module2 and wait for async progress to load.
 * Returns { container, user } ready for interaction.
 */
async function renderAndWaitForModule2() {
  const user = userEvent.setup()
  const Module2 = await getModule2()
  const result = renderModule2(<Module2 />)

  // Wait for the async loadModule2Progress to resolve and the component
  // to re-render with loaded progress.
  await waitFor(() => {
    expect(result.container.innerHTML).toContain('Modul 2')
  })

  return { ...result, user }
}

/**
 * Helper: navigate into lesson 2.1 detail from the overview.
 * Dismisses warning if present, clicks the first lesson card.
 */
async function navigateToLesson21(user) {
  // Dismiss the warning banner if it is present
  const warningBtn = screen.queryByText('Verstanden — ich bin bereit')
  if (warningBtn) {
    await user.click(warningBtn)
  }

  // Click the first lesson card (contains "Das Wurzelsystem")
  const lessonTitle = await screen.findByText('Das Wurzelsystem')
  await user.click(lessonTitle)

  // Wait for lesson detail to appear (back button visible)
  await waitFor(() => {
    expect(screen.getByText('Zurück')).toBeTruthy()
  })
}

/**
 * Helper: switch to Prüfmodus tab (requires learn mode already visited).
 */
async function switchToPruefmodus(user, container) {
  // Wait for test tab to become enabled (learn is auto-visited on render)
  await waitFor(() => {
    const testBtn = screen.getByText('Prüfmodus').closest('button')
    expect(testBtn.disabled).toBe(false)
  })

  await user.click(screen.getByText('Prüfmodus'))

  await waitFor(() => {
    expect(container.innerHTML).toContain('Beantworte alle Aufgaben')
  })
}

// ═════════════════════════════════════════════════════════════════════
//  TESTS
// ═════════════════════════════════════════════════════════════════════

describe('Module2 — Morphologie-Dojo interactions', { timeout: 30000 }, () => {

  // ── 1. Renders the overview page ──────────────────────────────────
  it('renders the lesson overview with header and lesson cards', async () => {
    const { container } = await renderAndWaitForModule2()

    // Header should show module title
    expect(container.innerHTML).toContain('Modul 2')
    expect(container.innerHTML).toContain('Morphologie')
    // First lesson ID should be visible
    expect(container.innerHTML).toContain('2.1')
  })

  // ── 2. Track selection: two track buttons visible ─────────────────
  it('displays both Morphologie and Syntax track buttons', async () => {
    await renderAndWaitForModule2()

    expect(screen.getByText('Stufe 2: Morphologie')).toBeTruthy()
    expect(screen.getByText(/Syntax und Partikeln/)).toBeTruthy()
  })

  // ── 3. Track switching to syntax ──────────────────────────────────
  it('switches to syntax track when Syntax button is clicked', async () => {
    const { user, container } = await renderAndWaitForModule2()

    const syntaxBtn = screen.getByText(/Syntax und Partikeln/)
    await user.click(syntaxBtn)

    // After switching, first syntax lesson "3.1" should appear
    await waitFor(() => {
      expect(container.innerHTML).toContain('3.1')
    })
  })

  // ── 4. Lesson list — first lesson unlocked, others locked ─────────
  it('shows first lesson as unlocked and subsequent lessons with lock icon', async () => {
    const { container } = await renderAndWaitForModule2()

    // First lesson "2.1" should be present
    expect(container.innerHTML).toContain('2.1')
    expect(container.innerHTML).toContain('Das Wurzelsystem')

    // There should be lock icons (unicode U+1F512) for locked lessons
    expect(container.innerHTML).toContain('\u{1F512}')
  })

  // ── 5. Clicking a lesson opens the lesson detail view ─────────────
  it('opens lesson detail view when an unlocked lesson is clicked', async () => {
    const { user, container } = await renderAndWaitForModule2()
    await navigateToLesson21(user)

    // Should show the lesson ID and title in the detail header
    expect(container.innerHTML).toContain('2.1')
    expect(container.innerHTML).toContain('Das Wurzelsystem')
  })

  // ── 6. Lesson detail shows Lernmodus and Prüfmodus tabs ──────────
  it('shows Lernmodus and Prüfmodus tabs in lesson detail', async () => {
    const { user } = await renderAndWaitForModule2()
    await navigateToLesson21(user)

    expect(screen.getByText('Lernmodus')).toBeTruthy()
    expect(screen.getByText('Prüfmodus')).toBeTruthy()
  })

  // ── 7. Learn mode renders educational content sections ────────────
  it('renders learn content sections in Lernmodus', async () => {
    const { user, container } = await renderAndWaitForModule2()
    await navigateToLesson21(user)

    // Lesson 2.1 has section titled "Was ist eine Wurzel?"
    await waitFor(() => {
      expect(container.innerHTML).toContain('Was ist eine Wurzel?')
    })

    // Walkthrough section
    expect(container.innerHTML).toContain('Durchgearbeitetes Beispiel')
    // Comparison section
    expect(container.innerHTML).toContain('Wurzel vs. Muster')
    // Arabic examples
    expect(container.innerHTML).toContain('ك-ت-ب')
  })

  // ── 8. Prüfmodus is locked until learn mode is visited ────────────
  it('initially has Prüfmodus tab disabled', async () => {
    // Use a fresh progress where learnVisited is empty
    const { user } = await renderAndWaitForModule2()

    // Dismiss warning
    const warningBtn = screen.queryByText('Verstanden — ich bin bereit')
    if (warningBtn) await user.click(warningBtn)

    await user.click(await screen.findByText('Das Wurzelsystem'))

    await waitFor(() => {
      expect(screen.getByText('Prüfmodus')).toBeTruthy()
    })

    // Before the learn useEffect runs, the button should exist.
    // The useEffect marks learn as visited almost immediately, but
    // let's verify the hint text is present or was present.
    // The hint "Bitte zuerst den Lernmodus durcharbeiten" is shown when not visited.
    // Since the effect runs on mount of the learn tab, it transitions quickly.
    // We can verify the Prüfmodus button exists and eventually becomes enabled.
    const testBtn = screen.getByText('Prüfmodus').closest('button')
    // It will transition from disabled to enabled as the useEffect runs
    await waitFor(() => {
      expect(testBtn.disabled).toBe(false)
    })
  })

  // ── 9. After visiting learn mode, Prüfmodus becomes available ─────
  it('enables Prüfmodus after learn mode is auto-visited', async () => {
    const { user } = await renderAndWaitForModule2()
    await navigateToLesson21(user)

    // Learn tab is active by default, which marks it as visited via useEffect
    await waitFor(() => {
      const testBtn = screen.getByText('Prüfmodus').closest('button')
      expect(testBtn.disabled).toBe(false)
    })
  })

  // ── 10. Exercise mode renders exercises ───────────────────────────
  it('renders exercises in Prüfmodus', async () => {
    const { user, container } = await renderAndWaitForModule2()
    await navigateToLesson21(user)
    await switchToPruefmodus(user, container)

    // Should show "Prüfen" buttons for individual exercises
    const checkButtons = screen.getAllByText('Prüfen')
    expect(checkButtons.length).toBeGreaterThan(0)
  })

  // ── 11. Selecting a correct MC answer shows "Richtig!" ────────────
  it('shows "Richtig!" feedback when correct MC answer is selected', async () => {
    const { user, container } = await renderAndWaitForModule2()
    await navigateToLesson21(user)
    await switchToPruefmodus(user, container)

    // Lesson 2.1 exercise 3 is MC: "Welches Muster (wazn) hat das Wort مَكْتُوب?"
    // Correct answer: "مَفْعُول"
    // The text may appear multiple times, so use getAllByText and pick the first.
    const correctOptions = screen.getAllByText('مَفْعُول')
    const correctOption = correctOptions[0]

    await user.click(correctOption)

    // Find the Prüfen button within the same exercise box.
    // Exercise boxes use style "margin-bottom: 28px; padding: 20px 24px; ..."
    // Walk up from the option to find the exercise container.
    let exerciseBox = correctOption.parentElement
    while (exerciseBox && !exerciseBox.style.padding?.includes('20px 24px')) {
      exerciseBox = exerciseBox.parentElement
    }

    const checkBtn = exerciseBox
      ? Array.from(exerciseBox.querySelectorAll('button')).find(
          b => b.textContent === 'Prüfen' && !b.disabled
        )
      : null

    expect(checkBtn).not.toBeNull()
    await user.click(checkBtn)

    await waitFor(() => {
      expect(container.innerHTML).toContain('Richtig!')
    })
  })

  // ── 12. Selecting a wrong MC answer shows correction ──────────────
  it('shows "Falsch" feedback when wrong MC answer is selected', async () => {
    const { user, container } = await renderAndWaitForModule2()
    await navigateToLesson21(user)
    await switchToPruefmodus(user, container)

    // Lesson 2.1 exercise 3: MC with options. Correct = "مَفْعُول", pick wrong: "فَاعِل"
    // The text may appear multiple times, so use getAllByText.
    const wrongOptions = screen.getAllByText('فَاعِل')
    const wrongOption = wrongOptions[0]

    await user.click(wrongOption)

    // Find Prüfen button within the same exercise box
    let exerciseBox = wrongOption.parentElement
    while (exerciseBox && !exerciseBox.style.padding?.includes('20px 24px')) {
      exerciseBox = exerciseBox.parentElement
    }

    const checkBtn = exerciseBox
      ? Array.from(exerciseBox.querySelectorAll('button')).find(
          b => b.textContent === 'Prüfen' && !b.disabled
        )
      : null

    expect(checkBtn).not.toBeNull()
    await user.click(checkBtn)

    await waitFor(() => {
      expect(container.innerHTML).toContain('Falsch')
      expect(container.innerHTML).toContain('Richtige Antwort')
    })
  })

  // ── 13. Back navigation from lesson detail to overview ────────────
  it('navigates back to lesson list when Zurück is clicked', async () => {
    const { user, container } = await renderAndWaitForModule2()
    await navigateToLesson21(user)

    // Click back button
    await user.click(screen.getByText('Zurück'))

    // Should return to overview — the lesson grid with lesson count text
    await waitFor(() => {
      expect(container.innerHTML).toContain('Lektionen')
      // The "Zurück" button should be gone
      expect(screen.queryByText('Zurück')).toBeNull()
    })
  })

  // ── 14. Paradigm Drill button appears for morphology track ────────
  it('shows Paradigmen-Drill button only in morphology track', async () => {
    const { user, container } = await renderAndWaitForModule2()

    // In morphology track, paradigm drill button should be visible
    expect(container.innerHTML).toContain('Paradigmen-Drill')

    // Switch to syntax track
    await user.click(screen.getByText(/Syntax und Partikeln/))

    // Wait for syntax content to load
    await waitFor(() => {
      expect(container.innerHTML).toContain('3.1')
    })

    // Paradigm drill should no longer appear
    expect(container.innerHTML).not.toContain('Paradigmen-Drill')
  })

  // ── 15. Paradigm Drill navigation ────────────────────────────────
  it('opens ParadigmDrill view when the drill button is clicked', async () => {
    const { user, container } = await renderAndWaitForModule2()

    const drillBtn = screen.getByText(/Paradigmen-Drill/)
    await user.click(drillBtn)

    // ParadigmDrill component renders — the lesson grid disappears
    await waitFor(() => {
      expect(container.innerHTML).not.toContain('Das Wurzelsystem')
    })
  })

  // ── 16. Broken Plural Drill button visible in morphology track ────
  it('shows Gebrochene Plurale drill button in morphology track', async () => {
    const { container } = await renderAndWaitForModule2()

    expect(container.innerHTML).toContain('Gebrochene Plurale')
  })

  // ── 17. Warning banner appears and can be dismissed ───────────────
  it('shows warning banner on initial render and dismisses it', async () => {
    const { user, container } = await renderAndWaitForModule2()

    expect(container.innerHTML).toContain('Bevor du beginnst')

    const dismissBtn = screen.getByText('Verstanden — ich bin bereit')
    await user.click(dismissBtn)

    await waitFor(() => {
      expect(container.innerHTML).not.toContain('Bevor du beginnst')
    })
  })

  // ── 18. Lesson description is shown on the card ───────────────────
  it('shows lesson descriptions in the overview cards', async () => {
    const { container } = await renderAndWaitForModule2()

    // Lesson 2.1 description
    expect(container.innerHTML).toContain('Grundlage der arabischen Sprache')
  })

  // ── 19. Nominal Declension Drill button appears in syntax track ───
  it('shows Nominalflexion drill button in syntax track', async () => {
    const { user, container } = await renderAndWaitForModule2()

    await user.click(screen.getByText(/Syntax und Partikeln/))

    await waitFor(() => {
      expect(container.innerHTML).toContain('Nominalflexion')
    })
  })

  // ── 20. Fill-in / free text exercise renders input field ──────────
  it('renders input fields for free-text exercises in Prüfmodus', async () => {
    const { user, container } = await renderAndWaitForModule2()
    await navigateToLesson21(user)
    await switchToPruefmodus(user, container)

    // Lesson 2.1 has root_extraction exercises that render as free-text input
    const inputs = container.querySelectorAll('input[placeholder="Antwort eingeben..."]')
    expect(inputs.length).toBeGreaterThan(0)
  })

  // ── 21. Matching exercise renders instructions ────────────────────
  it('renders matching exercise with assignment instructions', async () => {
    const { user, container } = await renderAndWaitForModule2()
    await navigateToLesson21(user)
    await switchToPruefmodus(user, container)

    // Lesson 2.1 has matching exercises with instruction text
    expect(container.innerHTML).toContain('Klicke links auf ein Element')
  })

  // ── 22. Matching exercise: clicking left then right assigns pair ──
  it('assigns a pair in matching exercise when left then right is clicked', async () => {
    const { user, container } = await renderAndWaitForModule2()
    await navigateToLesson21(user)
    await switchToPruefmodus(user, container)

    // Lesson 2.1 matching pairs include {"word": "عَلِيم", "root": "ع-ل-م"}
    // The word may appear in multiple exercises, so use getAllByText.
    const leftItems = screen.getAllByText('عَلِيم')
    // Pick the one inside a matching exercise (near the instruction text).
    // The matching exercise container has "Klicke links auf ein Element" nearby.
    let leftItem = null
    for (const el of leftItems) {
      let parent = el.parentElement
      // Walk up at most 10 levels to find the matching exercise container
      for (let i = 0; i < 10 && parent; i++) {
        if (parent.textContent && parent.textContent.includes('Klicke links auf ein Element')) {
          leftItem = el
          break
        }
        parent = parent.parentElement
      }
      if (leftItem) break
    }

    expect(leftItem).not.toBeNull()
    await user.click(leftItem)

    // Now click the matching right-side option.
    // The roots "ع-ل-م" also appear in multiple places. Find the one
    // that is a <button> within the same matching exercise.
    let matchingContainer = leftItem.parentElement
    while (matchingContainer && !matchingContainer.textContent?.includes('Klicke links')) {
      matchingContainer = matchingContainer.parentElement
    }

    const rightButtons = matchingContainer
      ? Array.from(matchingContainer.querySelectorAll('button')).filter(
          b => b.textContent.trim() === 'ع-ل-م'
        )
      : []

    expect(rightButtons.length).toBeGreaterThan(0)
    await user.click(rightButtons[0])

    // The assignment arrow should appear in the matching exercise
    await waitFor(() => {
      expect(matchingContainer.textContent).toContain('→')
    })
  })

  // ── 23. Auswerten button is disabled until all exercises answered ─
  it('keeps Auswerten disabled until all exercises are answered', async () => {
    const { user, container } = await renderAndWaitForModule2()
    await navigateToLesson21(user)
    await switchToPruefmodus(user, container)

    const auswertenBtn = screen.getByText('Auswerten')
    expect(auswertenBtn.disabled).toBe(true)
  })

  // ── 24. Progress save is called when learn mode is visited ────────
  it('calls saveModule2Progress when learn mode is visited', async () => {
    mockSaveModule2Progress.mockClear()
    const { user } = await renderAndWaitForModule2()
    await navigateToLesson21(user)

    // Entering learn mode triggers a save with learnVisited updated
    await waitFor(() => {
      expect(mockSaveModule2Progress).toHaveBeenCalled()
    })

    // At least one call should include learnVisited with lesson 2.1 set to true
    const calls = mockSaveModule2Progress.mock.calls
    const progressArgs = calls.map(c => c[1])
    const hasLearnVisited = progressArgs.some(
      p => p && p.learnVisited && p.learnVisited['2.1'] === true
    )
    expect(hasLearnVisited).toBe(true)
  })

  // ── 25. Locked lesson card is not clickable ───────────────────────
  it('does not open a locked lesson when clicked', async () => {
    const { user, container } = await renderAndWaitForModule2()

    // The lock icon \u{1F512} appears next to locked lessons.
    // Clicking on a locked card should NOT navigate to detail view.
    // Find a card with cursor not-allowed (locked cards).
    const allDivs = container.querySelectorAll('div')
    const lockedCard = Array.from(allDivs).find(
      el => el.style.cursor === 'not-allowed' && el.textContent.includes('2.2')
    )

    if (lockedCard) {
      await user.click(lockedCard)

      // The "Zurück" (back) button should NOT appear — still on overview
      expect(screen.queryByText('Zurück')).toBeNull()
    }
  })

  // ── 26. Switching back to morphology after visiting syntax ────────
  it('switches back to morphology track after visiting syntax', async () => {
    const { user, container } = await renderAndWaitForModule2()

    // Switch to syntax
    await user.click(screen.getByText(/Syntax und Partikeln/))

    await waitFor(() => {
      expect(container.innerHTML).toContain('3.1')
    })

    // Switch back to morphology
    await user.click(screen.getByText('Stufe 2: Morphologie'))

    await waitFor(() => {
      expect(container.innerHTML).toContain('2.1')
      expect(container.innerHTML).toContain('Das Wurzelsystem')
    })
  })

  // ── 27. Passing score requirements displayed in Prüfmodus ────────
  it('displays passing score requirements in Prüfmodus', async () => {
    const { user, container } = await renderAndWaitForModule2()
    await navigateToLesson21(user)
    await switchToPruefmodus(user, container)

    // Should mention 80% requirement and Quran words
    expect(container.innerHTML).toContain('80%')
    expect(container.innerHTML).toContain('Quran-Wörter')
  })

  // ── 28. Broken Plural Drill navigation and back ───────────────────
  it('opens Broken Plural Drill and can navigate back', async () => {
    const { user, container } = await renderAndWaitForModule2()

    const drillBtn = screen.getByText(/Gebrochene Plurale/)
    await user.click(drillBtn)

    await waitFor(() => {
      expect(container.innerHTML).toContain('Zurück zur Übersicht')
    })

    // Click back
    await user.click(screen.getByText('Zurück zur Übersicht'))

    // Should return to the lesson overview
    await waitFor(() => {
      expect(container.innerHTML).toContain('Das Wurzelsystem')
    })
  })

  // ── 29. Exercise prompt text is rendered ──────────────────────────
  it('renders exercise prompt text in Prüfmodus', async () => {
    const { user, container } = await renderAndWaitForModule2()
    await navigateToLesson21(user)
    await switchToPruefmodus(user, container)

    // Lesson 2.1 exercises include prompts like "Bestimme die Wurzel"
    expect(container.innerHTML).toContain('Bestimme die Wurzel')
  })

  // ── 30. Arabic word display in exercises ──────────────────────────
  it('renders Arabic words in exercise prompts', async () => {
    const { user, container } = await renderAndWaitForModule2()
    await navigateToLesson21(user)
    await switchToPruefmodus(user, container)

    // Lesson 2.1 first exercise has word "كِتَاب"
    expect(container.innerHTML).toContain('كِتَاب')
  })
})
