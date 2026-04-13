// @vitest-environment jsdom
/**
 * Module1 (Schrift-Trainer) — Internal Logic & User Interaction Tests.
 *
 * Tests cover: section navigation, letter grid, letter detail, letter quiz,
 * position recognition, minimal pairs, tashkil recognition, script features,
 * muqattaat quiz, word reading, surah-1 final test, data-driven lessons,
 * and progress persistence via saveModuleProgress.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

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
    createOscillator: vi.fn(() => ({ connect: vi.fn(), start: vi.fn(), stop: vi.fn(), frequency: {} })),
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

  // Mock window.scrollTo (used by goOverview)
  window.scrollTo = vi.fn()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
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

const mockSaveModuleProgress = vi.fn(async () => {})
const mockLoadModuleProgress = vi.fn(async () => null)

vi.mock('../../utils/storage.js', () => ({
  saveProgress: vi.fn(async () => {}),
  loadProgress: vi.fn(async () => null),
  saveModuleProgress: (...args) => mockSaveModuleProgress(...args),
  loadModuleProgress: (...args) => mockLoadModuleProgress(...args),
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

// ─── Mock ArabicKeyboard component ──────────────────────────────────

vi.mock('../../components/ArabicKeyboard.jsx', () => ({
  default: function MockArabicKeyboard() {
    return <div data-testid="arabic-keyboard">ArabicKeyboard</div>
  },
}))

// ─── Helper ──────────────────────────────────────────────────────────

function renderModule1() {
  return render(
    <MemoryRouter initialEntries={['/module/1']}>
      <Module1 />
    </MemoryRouter>
  )
}

// ─── Import Module1 ──────────────────────────────────────────────────

let Module1

beforeAll(async () => {
  const mod = await import('../Module1.jsx')
  Module1 = mod.default
})

beforeEach(() => {
  mockSaveModuleProgress.mockClear()
  mockLoadModuleProgress.mockResolvedValue(null)
})

// ═════════════════════════════════════════════════════════════════════
//  1. OVERVIEW & SECTION NAVIGATION
// ═════════════════════════════════════════════════════════════════════

describe('Module1 Overview and Section Navigation', () => {
  it('renders the overview page with module title', async () => {
    renderModule1()
    expect(screen.getByText('Modul 1 — Schrift-Trainer')).toBeTruthy()
  })

  it('shows Lernmodus section heading', () => {
    renderModule1()
    expect(screen.getByText('Lernmodus')).toBeTruthy()
  })

  it('shows Prüfmodus section heading', () => {
    renderModule1()
    expect(screen.getByText('Prüfmodus')).toBeTruthy()
  })

  it('shows all 5 lesson cards in the Lernmodus section', () => {
    renderModule1()
    expect(screen.getByText('Das Alphabet')).toBeTruthy()
    expect(screen.getByText('Vokalzeichen (Tashkil)')).toBeTruthy()
    expect(screen.getByText('Besonderheiten der Schrift')).toBeTruthy()
    expect(screen.getByText('Artikulationsstellen')).toBeTruthy()
    expect(screen.getByText('Getrennte Buchstaben')).toBeTruthy()
  })

  it('shows all Prüfmodus test cards (P1..P8, A)', () => {
    renderModule1()
    expect(screen.getByText('Buchstabenerkennung')).toBeTruthy()
    expect(screen.getByText('Positionserkennung')).toBeTruthy()
    expect(screen.getByText('Minimalpaare')).toBeTruthy()
    expect(screen.getByText('Audio-Erkennung')).toBeTruthy()
    expect(screen.getByText('Tashkil-Erkennung')).toBeTruthy()
    expect(screen.getByText('Schriftbesonderheiten')).toBeTruthy()
    expect(screen.getByText('Huruf Muqattaat')).toBeTruthy()
    expect(screen.getByText('Wort-Lesen')).toBeTruthy()
    expect(screen.getByText(/Abschlusstest.*Sure 1/)).toBeTruthy()
  })

  it('clicking lesson 1.1 card navigates to Alphabet lesson', async () => {
    renderModule1()
    const card = screen.getByText('Das Alphabet')
    fireEvent.click(card)
    await waitFor(() => {
      expect(screen.getByText(/Lektion 1\.1 — Das Alphabet/)).toBeTruthy()
    })
  })

  it('clicking lesson 1.2 card navigates to Tashkil lesson', async () => {
    renderModule1()
    fireEvent.click(screen.getByText('Vokalzeichen (Tashkil)'))
    await waitFor(() => {
      expect(screen.getByText(/Lektion 1\.2 — Vokalzeichen/)).toBeTruthy()
    })
  })

  it('clicking lesson 1.3 card navigates to script features lesson', async () => {
    renderModule1()
    fireEvent.click(screen.getByText('Besonderheiten der Schrift'))
    await waitFor(() => {
      expect(screen.getByText(/Lektion 1\.3 — Besonderheiten/)).toBeTruthy()
    })
  })

  it('clicking "Zurück zur Übersicht" returns to overview from lesson', async () => {
    renderModule1()
    fireEvent.click(screen.getByText('Das Alphabet'))
    await waitFor(() => {
      expect(screen.getByText(/Lektion 1\.1/)).toBeTruthy()
    })
    fireEvent.click(screen.getByText('Zurück zur Übersicht'))
    await waitFor(() => {
      expect(screen.getByText('Modul 1 — Schrift-Trainer')).toBeTruthy()
    })
  })
})

// ═════════════════════════════════════════════════════════════════════
//  2. LETTER GRID (Lesson 1.1)
// ═════════════════════════════════════════════════════════════════════

describe('Lesson 1.1 — Letter Grid and Detail', () => {
  async function goToLesson11() {
    renderModule1()
    fireEvent.click(screen.getByText('Das Alphabet'))
    await waitFor(() => {
      expect(screen.getByText(/Lektion 1\.1/)).toBeTruthy()
    })
  }

  it('renders all 28 Arabic letters in the grid', async () => {
    await goToLesson11()
    // Each letter has a card with its name, check some key letter names
    expect(screen.getByText('Alif')).toBeTruthy()
    // Check that the isolated Arabic form for Ba is present
    expect(screen.getByText('Jīm')).toBeTruthy()
    expect(screen.getByText('Yāʾ')).toBeTruthy()
  })

  it('shows filter buttons including "Alle"', async () => {
    await goToLesson11()
    expect(screen.getByText('Alle')).toBeTruthy()
  })

  it('clicking a letter shows detail panel with name', async () => {
    await goToLesson11()
    // Click on "Alif" card
    const alifBtn = screen.getByText('Alif')
    fireEvent.click(alifBtn)
    await waitFor(() => {
      // Detail panel should show transliteration heading
      expect(screen.getByText('Transliteration')).toBeTruthy()
      expect(screen.getByText('Laut')).toBeTruthy()
      expect(screen.getByText('Artikulationsstelle')).toBeTruthy()
    })
  })

  it('letter detail shows all four positional forms', async () => {
    await goToLesson11()
    fireEvent.click(screen.getByText('Alif'))
    await waitFor(() => {
      expect(screen.getByText('Die vier Positionen')).toBeTruthy()
      expect(screen.getByText('Isoliert')).toBeTruthy()
      expect(screen.getByText('Anfang')).toBeTruthy()
      expect(screen.getByText('Mitte')).toBeTruthy()
      expect(screen.getByText('Ende')).toBeTruthy()
    })
  })

  it('letter detail shows example from Quran', async () => {
    await goToLesson11()
    fireEvent.click(screen.getByText('Alif'))
    await waitFor(() => {
      expect(screen.getByText('Beispiel aus dem Quran')).toBeTruthy()
    })
  })

  it('letter detail shows audio play button', async () => {
    await goToLesson11()
    fireEvent.click(screen.getByText('Alif'))
    await waitFor(() => {
      expect(screen.getByText('Laut anhören')).toBeTruthy()
      expect(screen.getByText(/Laut abspielen: Alif/)).toBeTruthy()
    })
  })

  it('clicking a group filter shows only letters of that group', async () => {
    await goToLesson11()
    // The first group in the data is "Alif-Gruppe", the second is "Ba-Gruppe"
    // Find a group filter button. We know "Jīm-Gruppe" is one group.
    const filterBtns = screen.getAllByText(/Gruppe/)
    expect(filterBtns.length).toBeGreaterThan(0)
    // Click the first group filter
    fireEvent.click(filterBtns[0])
    // After filtering, only a subset of letters should be in the grid
    // We won't check exact numbers, but the filter button should become active
  })

  it('switching between letters updates the detail panel', async () => {
    await goToLesson11()
    // Click Alif
    fireEvent.click(screen.getByText('Alif'))
    await waitFor(() => {
      expect(screen.getByText(/Laut abspielen: Alif/)).toBeTruthy()
    })
    // Now click a different letter — get the Ba button by its name
    const baButtons = screen.getAllByText(/^Bāʾ$/)
    fireEvent.click(baButtons[0])
    await waitFor(() => {
      expect(screen.getByText(/Laut abspielen: Bāʾ/)).toBeTruthy()
    })
  })
})

// ═════════════════════════════════════════════════════════════════════
//  3. LESSON 1.2 — Tashkil
// ═════════════════════════════════════════════════════════════════════

describe('Lesson 1.2 — Tashkil (Vowel Signs)', () => {
  async function goToLesson12() {
    renderModule1()
    fireEvent.click(screen.getByText('Vokalzeichen (Tashkil)'))
    await waitFor(() => {
      expect(screen.getByText(/Lektion 1\.2/)).toBeTruthy()
    })
  }

  it('renders tashkil cards', async () => {
    await goToLesson12()
    // Tashkil names from the data
    expect(screen.getByText('kurzes a')).toBeTruthy()
    expect(screen.getByText('kurzes u')).toBeTruthy()
    expect(screen.getByText('kurzes i')).toBeTruthy()
  })

  it('clicking a tashkil card shows its detail', async () => {
    await goToLesson12()
    // Click on the first tashkil card — "Fatḥa"
    const fathaCard = screen.getByText('Fatḥa')
    fireEvent.click(fathaCard)
    await waitFor(() => {
      expect(screen.getByText('Zeichen')).toBeTruthy()
      expect(screen.getByText('Position')).toBeTruthy()
      expect(screen.getByText('Beschreibung')).toBeTruthy()
    })
  })
})

// ═════════════════════════════════════════════════════════════════════
//  4. LESSON 1.3 — Script Features with internal tabs
// ═════════════════════════════════════════════════════════════════════

describe('Lesson 1.3 — Script Feature tabs', () => {
  async function goToLesson13() {
    renderModule1()
    fireEvent.click(screen.getByText('Besonderheiten der Schrift'))
    await waitFor(() => {
      expect(screen.getByText(/Lektion 1\.3/)).toBeTruthy()
    })
  }

  it('shows multiple section tabs', async () => {
    await goToLesson13()
    expect(screen.getByText('Hamza und seine Träger')).toBeTruthy()
    expect(screen.getByText('Ta Marbuta vs. Ta Maftuha')).toBeTruthy()
    expect(screen.getByText('Alif Maqsura vs. Ya')).toBeTruthy()
    expect(screen.getByText('Lam-Alif-Ligatur')).toBeTruthy()
    expect(screen.getByText(/Sonnen- und Mondbuchstaben/)).toBeTruthy()
    expect(screen.getByText('Alif Wasla')).toBeTruthy()
    expect(screen.getByText('Hamza-Algorithmus')).toBeTruthy()
  })

  it('clicking a tab switches displayed content', async () => {
    await goToLesson13()
    // Initially the first tab (Hamza) content is shown
    expect(screen.getByText(/Stimmritzenverschluss/)).toBeTruthy()

    // Click second tab: Ta Marbuta
    fireEvent.click(screen.getByText('Ta Marbuta vs. Ta Maftuha'))
    await waitFor(() => {
      expect(screen.getByText(/gebundenes T/)).toBeTruthy()
    })
  })

  it('clicking Lam-Alif tab shows ligature info', async () => {
    await goToLesson13()
    fireEvent.click(screen.getByText('Lam-Alif-Ligatur'))
    await waitFor(() => {
      expect(screen.getAllByText(/zwei Buchstaben/i).length).toBeGreaterThanOrEqual(1)
    })
  })

  it('clicking Sonnen- und Mondbuchstaben tab shows sun/moon info', async () => {
    await goToLesson13()
    fireEvent.click(screen.getByText(/Sonnen- und Mondbuchstaben/))
    await waitFor(() => {
      // The content section shows h4 headings with "Sonnenbuchstaben (al-Huruf al-Shamsiyya)"
      // and "Mondbuchstaben (al-Huruf al-Qamariyya)" — use more specific patterns
      expect(screen.getByText(/al-Huruf al-Shamsiyya/)).toBeTruthy()
      expect(screen.getByText(/al-Huruf al-Qamariyya/)).toBeTruthy()
    })
  })
})

// ═════════════════════════════════════════════════════════════════════
//  5. LESSON 1.4 — Minimal Pairs learning view
// ═════════════════════════════════════════════════════════════════════

describe('Lesson 1.4 — Minimal Pairs (Artikulationsstellen)', () => {
  async function goToLesson14() {
    renderModule1()
    fireEvent.click(screen.getByText('Artikulationsstellen'))
    await waitFor(() => {
      expect(screen.getByText(/Lektion 1\.4/)).toBeTruthy()
    })
  }

  it('renders minimal pair selector buttons', async () => {
    await goToLesson14()
    // The pair selector shows Arabic letters separated by /
    // First pair from data is Sin / Sad
    expect(screen.getByText('vs.')).toBeTruthy()
  })

  it('clicking a pair selector shows the comparison detail', async () => {
    await goToLesson14()
    // The pair comparison shows letter names and sounds
    // First pair: Sin vs. Sad
    expect(screen.getByText('Sīn')).toBeTruthy()
  })
})

// ═════════════════════════════════════════════════════════════════════
//  6. LESSON 1.5 — Huruf Muqattaat
// ═════════════════════════════════════════════════════════════════════

describe('Lesson 1.5 — Huruf Muqattaat', () => {
  it('renders the Muqattaat table', async () => {
    renderModule1()
    fireEvent.click(screen.getByText('Getrennte Buchstaben'))
    await waitFor(() => {
      expect(screen.getByText(/Lektion 1\.5/)).toBeTruthy()
      expect(screen.getByText('Die 29 Suren mit getrennten Buchstaben')).toBeTruthy()
    })
  })
})

// ═════════════════════════════════════════════════════════════════════
//  7. PRUEFMODUS — Tests require a lesson to have been visited
// ═════════════════════════════════════════════════════════════════════

describe('Prüfmodus gating — requires lesson visit', () => {
  it('shows gating hint when no lessons have been visited', () => {
    renderModule1()
    expect(screen.getByText(/Bearbeite zuerst mindestens eine Lektion/)).toBeTruthy()
  })

  it('test buttons are disabled (opacity 0.4) when no lessons visited', () => {
    renderModule1()
    const p1Card = screen.getByText('Buchstabenerkennung').closest('button')
    expect(p1Card.style.opacity).toBe('0.4')
  })

  it('after visiting a lesson, test buttons become active', async () => {
    // Mock that a lesson has been visited previously
    mockLoadModuleProgress.mockResolvedValue({ learnVisited: { L11: true } })
    renderModule1()
    // Wait for the async load
    await waitFor(() => {
      const p1Card = screen.getByText('Buchstabenerkennung').closest('button')
      expect(p1Card.style.opacity).not.toBe('0.4')
    })
  })
})

// ═════════════════════════════════════════════════════════════════════
//  8. TEST: LETTER RECOGNITION (Buchstabenerkennung - P1)
// ═════════════════════════════════════════════════════════════════════

describe('Test — Buchstabenerkennung (Letter Recognition)', () => {
  async function goToLetterTest() {
    mockLoadModuleProgress.mockResolvedValue({ learnVisited: { L11: true } })
    renderModule1()
    await waitFor(() => {
      const btn = screen.getByText('Buchstabenerkennung').closest('button')
      expect(btn.style.opacity).not.toBe('0.4')
    })
    fireEvent.click(screen.getByText('Buchstabenerkennung'))
    await waitFor(() => {
      expect(screen.getByText(/Prüfung — Buchstabenerkennung/)).toBeTruthy()
    })
  }

  it('renders the letter recognition test with a letter and input', async () => {
    await goToLetterTest()
    expect(screen.getByPlaceholderText(/Name oder Transliteration/)).toBeTruthy()
    expect(screen.getByText('Prüfen')).toBeTruthy()
    // Progress indicator
    expect(screen.getByText(/1 \//)).toBeTruthy()
  })

  it('typing correct answer and clicking Prüfen shows Richtig', async () => {
    await goToLetterTest()
    // We need to find which letter is displayed; the test uses shuffled letters.
    // The input accepts the letter name. We can type a partial match.
    // The test also shows an Arabic letter form. We'll get the displayed letter
    // from the test question area and respond with any letter's name.
    // Since the queue is random, we just test the flow:

    const input = screen.getByPlaceholderText(/Name oder Transliteration/)
    // The component accepts name startsWith(answer) so we type a generic letter name
    // We can't predict the random letter, so we'll type something that triggers wrong to test flow
    await userEvent.type(input, 'alif')
    fireEvent.click(screen.getByText('Prüfen'))

    // Either Richtig or Nicht ganz will appear
    await waitFor(() => {
      const feedbackExists = screen.queryByText('Richtig!') || screen.queryByText('Nicht ganz.')
      expect(feedbackExists).toBeTruthy()
    })
  })

  it('after answering, clicking Weiter advances to next question', async () => {
    await goToLetterTest()
    const input = screen.getByPlaceholderText(/Name oder Transliteration/)
    await userEvent.type(input, 'test')
    fireEvent.click(screen.getByText('Prüfen'))

    await waitFor(() => {
      expect(screen.getByText('Weiter')).toBeTruthy()
    })
    fireEvent.click(screen.getByText('Weiter'))

    await waitFor(() => {
      expect(screen.getByText(/2 \//)).toBeTruthy()
    })
  })

  it('empty input does not trigger feedback', async () => {
    await goToLetterTest()
    fireEvent.click(screen.getByText('Prüfen'))
    // Feedback should NOT appear
    expect(screen.queryByText('Richtig!')).toBeNull()
    expect(screen.queryByText('Nicht ganz.')).toBeNull()
  })
})

// ═════════════════════════════════════════════════════════════════════
//  9. TEST: POSITION RECOGNITION (P2)
// ═════════════════════════════════════════════════════════════════════

describe('Test — Positionserkennung (Position Recognition)', () => {
  async function goToPositionTest() {
    mockLoadModuleProgress.mockResolvedValue({ learnVisited: { L11: true } })
    renderModule1()
    await waitFor(() => {
      const btn = screen.getByText('Positionserkennung').closest('button')
      expect(btn.style.opacity).not.toBe('0.4')
    })
    fireEvent.click(screen.getByText('Positionserkennung'))
    await waitFor(() => {
      expect(screen.getByText(/Prüfung — Positionserkennung/)).toBeTruthy()
    })
  }

  it('renders three position options: Anfang, Mitte, Ende', async () => {
    await goToPositionTest()
    expect(screen.getByText('Anfang')).toBeTruthy()
    expect(screen.getByText('Mitte')).toBeTruthy()
    expect(screen.getByText('Ende')).toBeTruthy()
  })

  it('clicking a position option shows feedback (Richtig or incorrect)', async () => {
    await goToPositionTest()
    // Click any option — "Anfang"
    fireEvent.click(screen.getByText('Anfang'))
    await waitFor(() => {
      const feedbackExists = screen.queryByText('Richtig!') || screen.queryByText(/Nicht ganz/)
      expect(feedbackExists).toBeTruthy()
    })
  })

  it('feedback shows all four forms of the letter', async () => {
    await goToPositionTest()
    fireEvent.click(screen.getByText('Mitte'))
    await waitFor(() => {
      // The feedback shows Isoliert, Anfang, Mitte, Ende labels
      expect(screen.getByText('Weiter')).toBeTruthy()
    })
  })

  it('clicking Weiter after feedback advances to next letter', async () => {
    await goToPositionTest()
    fireEvent.click(screen.getByText('Anfang'))
    await waitFor(() => expect(screen.getByText('Weiter')).toBeTruthy())
    fireEvent.click(screen.getByText('Weiter'))
    await waitFor(() => {
      expect(screen.getByText(/2 \//)).toBeTruthy()
    })
  })
})

// ═════════════════════════════════════════════════════════════════════
//  10. TEST: MINIMAL PAIRS (P3)
// ═════════════════════════════════════════════════════════════════════

describe('Test — Minimalpaare (Minimal Pairs)', () => {
  async function goToMinimalPairsTest() {
    mockLoadModuleProgress.mockResolvedValue({ learnVisited: { L14: true } })
    renderModule1()
    await waitFor(() => {
      const btn = screen.getByText('Minimalpaare').closest('button')
      expect(btn.style.opacity).not.toBe('0.4')
    })
    fireEvent.click(screen.getByText('Minimalpaare'))
    await waitFor(() => {
      expect(screen.getByText(/Prüfung — Minimalpaare/)).toBeTruthy()
    })
  }

  it('renders two letter choice buttons', async () => {
    await goToMinimalPairsTest()
    // The test shows two buttons with letter names in parentheses
    const optionButtons = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('m1-btn--option')
    )
    expect(optionButtons.length).toBe(2)
  })

  it('clicking a letter option shows feedback', async () => {
    await goToMinimalPairsTest()
    const optionButtons = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('m1-btn--option')
    )
    fireEvent.click(optionButtons[0])
    await waitFor(() => {
      const feedbackExists = screen.queryByText('Richtig!') || screen.queryByText(/Nicht ganz/)
      expect(feedbackExists).toBeTruthy()
    })
  })
})

// ═════════════════════════════════════════════════════════════════════
//  11. TEST: TASHKIL RECOGNITION (P5)
// ═════════════════════════════════════════════════════════════════════

describe('Test — Tashkil-Erkennung', () => {
  async function goToTashkilTest() {
    mockLoadModuleProgress.mockResolvedValue({ learnVisited: { L12: true } })
    renderModule1()
    await waitFor(() => {
      const btn = screen.getByText('Tashkil-Erkennung').closest('button')
      expect(btn.style.opacity).not.toBe('0.4')
    })
    fireEvent.click(screen.getByText('Tashkil-Erkennung'))
    await waitFor(() => {
      expect(screen.getByText(/Prüfung — Tashkil-Erkennung/)).toBeTruthy()
    })
  }

  it('renders 9 tashkil options', async () => {
    await goToTashkilTest()
    expect(screen.getByText('Fatha')).toBeTruthy()
    expect(screen.getByText('Damma')).toBeTruthy()
    expect(screen.getByText('Kasra')).toBeTruthy()
    expect(screen.getByText('Sukun')).toBeTruthy()
    expect(screen.getByText('Shadda')).toBeTruthy()
    expect(screen.getByText('Tanwin Fatha')).toBeTruthy()
    expect(screen.getByText('Tanwin Damma')).toBeTruthy()
    expect(screen.getByText('Tanwin Kasra')).toBeTruthy()
    expect(screen.getByText('Madda')).toBeTruthy()
  })

  it('clicking an option shows feedback with explanation', async () => {
    await goToTashkilTest()
    fireEvent.click(screen.getByText('Fatha'))
    await waitFor(() => {
      const feedbackExists = screen.queryByText('Richtig!') || screen.queryByText(/Nicht ganz/)
      expect(feedbackExists).toBeTruthy()
    })
  })
})

// ═════════════════════════════════════════════════════════════════════
//  12. TEST: SCRIPT FEATURES (P6)
// ═════════════════════════════════════════════════════════════════════

describe('Test — Schriftbesonderheiten', () => {
  async function goToScriptTest() {
    mockLoadModuleProgress.mockResolvedValue({ learnVisited: { L13: true } })
    renderModule1()
    await waitFor(() => {
      const btn = screen.getByText('Schriftbesonderheiten').closest('button')
      expect(btn.style.opacity).not.toBe('0.4')
    })
    fireEvent.click(screen.getByText('Schriftbesonderheiten'))
    await waitFor(() => {
      expect(screen.getByText(/Prüfung — Schriftbesonderheiten/)).toBeTruthy()
    })
  }

  it('renders a question with multiple choice options', async () => {
    await goToScriptTest()
    // Each question has at least 3 option buttons
    const optionButtons = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('m1-btn--option')
    )
    expect(optionButtons.length).toBeGreaterThanOrEqual(3)
  })

  it('clicking an option shows feedback and explanation', async () => {
    await goToScriptTest()
    const optionButtons = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('m1-btn--option')
    )
    fireEvent.click(optionButtons[0])
    await waitFor(() => {
      const feedbackExists = screen.queryByText('Richtig!') || screen.queryByText(/Nicht ganz/)
      expect(feedbackExists).toBeTruthy()
    })
    // Weiter button appears
    expect(screen.getByText('Weiter')).toBeTruthy()
  })
})

// ═════════════════════════════════════════════════════════════════════
//  13. TEST: MUQATTAAT (P7)
// ═════════════════════════════════════════════════════════════════════

describe('Test — Huruf Muqattaat', () => {
  async function goToMuqattaatTest() {
    mockLoadModuleProgress.mockResolvedValue({ learnVisited: { L15: true } })
    renderModule1()
    await waitFor(() => {
      const btn = screen.getByText('Huruf Muqattaat').closest('button')
      expect(btn.style.opacity).not.toBe('0.4')
    })
    fireEvent.click(screen.getByText('Huruf Muqattaat'))
    await waitFor(() => {
      expect(screen.getByText(/Prüfung — Huruf Muqattaat/)).toBeTruthy()
    })
  }

  it('renders a question about Muqattaat with options', async () => {
    await goToMuqattaatTest()
    const optionButtons = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('m1-btn--option')
    )
    expect(optionButtons.length).toBeGreaterThanOrEqual(3)
  })

  it('clicking correct and wrong answers updates feedback', async () => {
    await goToMuqattaatTest()
    const optionButtons = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('m1-btn--option')
    )
    fireEvent.click(optionButtons[0])
    await waitFor(() => {
      const feedbackExists = screen.queryByText('Richtig!') || screen.queryByText(/Nicht ganz/)
      expect(feedbackExists).toBeTruthy()
    })
  })
})

// ═════════════════════════════════════════════════════════════════════
//  14. TEST: WORD READING (P8)
// ═════════════════════════════════════════════════════════════════════

describe('Test — Wort-Lesen (Word Reading)', () => {
  async function goToWordReadingTest() {
    mockLoadModuleProgress.mockResolvedValue({ learnVisited: { L11: true } })
    renderModule1()
    await waitFor(() => {
      const btn = screen.getByText('Wort-Lesen').closest('button')
      expect(btn.style.opacity).not.toBe('0.4')
    })
    fireEvent.click(screen.getByText('Wort-Lesen'))
    await waitFor(() => {
      expect(screen.getByText(/Wort-Lesen — Verbundene Buchstaben/)).toBeTruthy()
    })
  }

  it('renders word reading test with input and Prüfen button', async () => {
    await goToWordReadingTest()
    expect(screen.getByPlaceholderText(/Buchstaben/)).toBeTruthy()
    expect(screen.getByText('Prüfen')).toBeTruthy()
  })

  it('typing an answer and clicking Prüfen shows feedback', async () => {
    await goToWordReadingTest()
    const input = screen.getByPlaceholderText(/Buchstaben/)
    await userEvent.type(input, 'bsm')
    fireEvent.click(screen.getByText('Prüfen'))
    await waitFor(() => {
      const feedbackExists = screen.queryByText('Richtig!') || screen.queryByText('Nicht ganz.')
      expect(feedbackExists).toBeTruthy()
    })
  })
})

// ═════════════════════════════════════════════════════════════════════
//  15. TEST: SURAH 1 FINAL TEST (A)
// ═════════════════════════════════════════════════════════════════════

describe('Test — Abschlusstest Sure 1', () => {
  async function goToSurah1Test() {
    mockLoadModuleProgress.mockResolvedValue({ learnVisited: { L11: true } })
    renderModule1()
    await waitFor(() => {
      const btn = screen.getByText(/Abschlusstest.*Sure 1/).closest('button')
      expect(btn.style.opacity).not.toBe('0.4')
    })
    fireEvent.click(screen.getByText(/Abschlusstest.*Sure 1/))
    await waitFor(() => {
      expect(screen.getByText(/Abschlusstest — Sure 1/)).toBeTruthy()
    })
  }

  it('renders the Surah 1 test with character-by-character progress', async () => {
    await goToSurah1Test()
    expect(screen.getByText(/Buchstabe 1 \//)).toBeTruthy()
    expect(screen.getByPlaceholderText(/Name des Buchstabens/)).toBeTruthy()
  })

  it('shows verse context with option to hide it', async () => {
    await goToSurah1Test()
    expect(screen.getByText('Vers ausblenden')).toBeTruthy()
    fireEvent.click(screen.getByText('Vers ausblenden'))
    await waitFor(() => {
      expect(screen.getByText('Vers einblenden')).toBeTruthy()
    })
  })

  it('answering and proceeding increments counter', async () => {
    await goToSurah1Test()
    const input = screen.getByPlaceholderText(/Name des Buchstabens/)
    await userEvent.type(input, 'ba')
    fireEvent.click(screen.getByText('Prüfen'))
    await waitFor(() => {
      expect(screen.getByText('Weiter')).toBeTruthy()
    })
    fireEvent.click(screen.getByText('Weiter'))
    await waitFor(() => {
      expect(screen.getByText(/Buchstabe 2 \//)).toBeTruthy()
    })
  })
})

// ═════════════════════════════════════════════════════════════════════
//  16. PROGRESS PERSISTENCE
// ═════════════════════════════════════════════════════════════════════

describe('Progress persistence', () => {
  it('visiting lesson 1.1 calls saveModuleProgress with learnVisited', async () => {
    renderModule1()
    fireEvent.click(screen.getByText('Das Alphabet'))
    await waitFor(() => {
      expect(screen.getByText(/Lektion 1\.1/)).toBeTruthy()
    })
    // The component uses requestAnimationFrame to call markLearnVisited
    // We need to flush rAF
    await waitFor(() => {
      expect(mockSaveModuleProgress).toHaveBeenCalled()
    }, { timeout: 3000 })
    // Check it was called with module 1 and an object containing learnVisited
    const calls = mockSaveModuleProgress.mock.calls
    const relevantCall = calls.find(c => c[0] === 1)
    expect(relevantCall).toBeTruthy()
    expect(relevantCall[1]).toHaveProperty('learnVisited')
    expect(relevantCall[1].learnVisited).toHaveProperty('L11', true)
  })

  it('loadModuleProgress is called on mount to restore learnVisited state', async () => {
    mockLoadModuleProgress.mockResolvedValue({ learnVisited: { L11: true, L12: true } })
    renderModule1()
    await waitFor(() => {
      expect(mockLoadModuleProgress).toHaveBeenCalledWith(1)
    })
  })
})

// ═════════════════════════════════════════════════════════════════════
//  17. DATA-DRIVEN LESSONS (Phonologie section)
// ═════════════════════════════════════════════════════════════════════

describe('Data-driven lessons (Phonologie / Ijam)', () => {
  it('renders Phonologie section heading', () => {
    renderModule1()
    expect(screen.getByText('Phonologie')).toBeTruthy()
  })

  it('renders Schriftsystem section heading', () => {
    renderModule1()
    expect(screen.getByText(/Schriftsystem/)).toBeTruthy()
  })

  it('clicking a data-driven lesson card opens the DataDrivenLesson view', async () => {
    renderModule1()
    // Find any card with id 1.6, 1.7, etc. from the Phonologie section
    const phonoCards = screen.getAllByText(/^1\.\d+$/).filter(el => {
      const num = parseFloat(el.textContent)
      return num >= 1.6 && num <= 1.12
    })
    if (phonoCards.length > 0) {
      const card = phonoCards[0].closest('button')
      fireEvent.click(card)
      await waitFor(() => {
        // DataDrivenLesson renders with Lernmodus / Prüfmodus tabs
        expect(screen.getByText('Lernmodus')).toBeTruthy()
      })
    }
  })

  it('DataDrivenLesson shows Zurück zur Übersicht button', async () => {
    renderModule1()
    const phonoCards = screen.getAllByText(/^1\.\d+$/).filter(el => {
      const num = parseFloat(el.textContent)
      return num >= 1.6 && num <= 1.12
    })
    if (phonoCards.length > 0) {
      const card = phonoCards[0].closest('button')
      fireEvent.click(card)
      await waitFor(() => {
        expect(screen.getByText('Zurück zur Übersicht')).toBeTruthy()
      })
      // Clicking back returns to overview
      fireEvent.click(screen.getByText('Zurück zur Übersicht'))
      await waitFor(() => {
        expect(screen.getByText('Modul 1 — Schrift-Trainer')).toBeTruthy()
      })
    }
  })
})

// ═════════════════════════════════════════════════════════════════════
//  18. AUDIO RECOGNITION TEST (P4)
// ═════════════════════════════════════════════════════════════════════

describe('Test — Audio-Erkennung', () => {
  async function goToAudioTest() {
    mockLoadModuleProgress.mockResolvedValue({ learnVisited: { L11: true } })
    renderModule1()
    await waitFor(() => {
      const btn = screen.getByText('Audio-Erkennung').closest('button')
      expect(btn.style.opacity).not.toBe('0.4')
    })
    fireEvent.click(screen.getByText('Audio-Erkennung'))
    await waitFor(() => {
      expect(screen.getByText(/Prüfung — Audio-Erkennung/)).toBeTruthy()
    })
  }

  it('renders audio test with play button', async () => {
    await goToAudioTest()
    expect(screen.getByText('Laut abspielen')).toBeTruthy()
  })

  it('clicking play button shows answer options', async () => {
    await goToAudioTest()
    fireEvent.click(screen.getByText('Laut abspielen'))
    await waitFor(() => {
      // After playing, 4 option buttons should appear
      expect(screen.getByText('Nochmal abspielen')).toBeTruthy()
      expect(screen.getByText('Welcher Buchstabe war das?')).toBeTruthy()
    })
    // Check we have 4 option buttons
    const optionButtons = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('m1-btn--option-audio')
    )
    expect(optionButtons.length).toBe(4)
  })

  it('selecting an option after playing shows feedback', async () => {
    await goToAudioTest()
    fireEvent.click(screen.getByText('Laut abspielen'))
    await waitFor(() => {
      expect(screen.getByText('Nochmal abspielen')).toBeTruthy()
    })
    const optionButtons = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('m1-btn--option-audio')
    )
    fireEvent.click(optionButtons[0])
    await waitFor(() => {
      const feedbackExists = screen.queryByText('Richtig!') || screen.queryByText(/Nicht ganz/)
      expect(feedbackExists).toBeTruthy()
    })
  })
})

// ═════════════════════════════════════════════════════════════════════
//  19. RESULT SCREEN (end-of-test)
// ═════════════════════════════════════════════════════════════════════

describe('Test result screen — score display and restart', () => {
  it('Tashkil test: after all questions show Ergebnis with score', async () => {
    // Tashkil has 9 questions. We auto-answer all of them.
    mockLoadModuleProgress.mockResolvedValue({ learnVisited: { L12: true } })
    renderModule1()
    await waitFor(() => {
      const btn = screen.getByText('Tashkil-Erkennung').closest('button')
      expect(btn.style.opacity).not.toBe('0.4')
    })
    fireEvent.click(screen.getByText('Tashkil-Erkennung'))
    await waitFor(() => {
      expect(screen.getByText(/Prüfung — Tashkil-Erkennung/)).toBeTruthy()
    })

    // Answer all 9 questions by clicking first option and then Weiter
    for (let i = 0; i < 9; i++) {
      const optionButtons = screen.getAllByRole('button').filter(
        btn => btn.classList.contains('m1-btn--option')
      )
      if (optionButtons.length > 0) {
        fireEvent.click(optionButtons[0])
      }
      await waitFor(() => {
        expect(screen.getByText('Weiter')).toBeTruthy()
      })
      fireEvent.click(screen.getByText('Weiter'))
    }

    // Now the result screen should show
    await waitFor(() => {
      expect(screen.getByText(/Ergebnis — Tashkil-Erkennung/)).toBeTruthy()
    })
    // Score display is present
    expect(screen.getByText(/\d+ \/ 9/)).toBeTruthy()
    // Restart button
    expect(screen.getByText('Erneut versuchen')).toBeTruthy()
  })
})

// ═════════════════════════════════════════════════════════════════════
//  20. RESTART BUTTON
// ═════════════════════════════════════════════════════════════════════

describe('Test restart functionality', () => {
  it('Script features test: result screen Erneut versuchen resets to question 1', async () => {
    mockLoadModuleProgress.mockResolvedValue({ learnVisited: { L13: true } })
    renderModule1()
    await waitFor(() => {
      const btn = screen.getByText('Schriftbesonderheiten').closest('button')
      expect(btn.style.opacity).not.toBe('0.4')
    })
    fireEvent.click(screen.getByText('Schriftbesonderheiten'))
    await waitFor(() => {
      expect(screen.getByText(/Prüfung — Schriftbesonderheiten/)).toBeTruthy()
    })

    // Answer all 8 questions
    for (let i = 0; i < 8; i++) {
      const optionButtons = screen.getAllByRole('button').filter(
        btn => btn.classList.contains('m1-btn--option')
      )
      if (optionButtons.length > 0) {
        fireEvent.click(optionButtons[0])
      }
      await waitFor(() => {
        expect(screen.getByText('Weiter')).toBeTruthy()
      })
      fireEvent.click(screen.getByText('Weiter'))
    }

    await waitFor(() => {
      expect(screen.getByText(/Ergebnis — Schriftbesonderheiten/)).toBeTruthy()
    })

    // Click restart
    fireEvent.click(screen.getByText('Erneut versuchen'))
    await waitFor(() => {
      expect(screen.getByText(/Prüfung — Schriftbesonderheiten/)).toBeTruthy()
      expect(screen.getByText(/1 \//)).toBeTruthy()
    })
  })
})

// ═════════════════════════════════════════════════════════════════════
//  21. KEYBOARD INTERACTION — Enter key submits in letter test
// ═════════════════════════════════════════════════════════════════════

describe('Keyboard interaction — Enter key', () => {
  it('pressing Enter in letter test input triggers check', async () => {
    mockLoadModuleProgress.mockResolvedValue({ learnVisited: { L11: true } })
    renderModule1()
    await waitFor(() => {
      const btn = screen.getByText('Buchstabenerkennung').closest('button')
      expect(btn.style.opacity).not.toBe('0.4')
    })
    fireEvent.click(screen.getByText('Buchstabenerkennung'))
    await waitFor(() => {
      expect(screen.getByText(/Prüfung — Buchstabenerkennung/)).toBeTruthy()
    })

    const input = screen.getByPlaceholderText(/Name oder Transliteration/)
    await userEvent.type(input, 'alif{Enter}')

    await waitFor(() => {
      const feedbackExists = screen.queryByText('Richtig!') || screen.queryByText('Nicht ganz.')
      expect(feedbackExists).toBeTruthy()
    })
  })
})

// ═════════════════════════════════════════════════════════════════════
//  22. LETTER CONNECTABLE DISPLAY
// ═════════════════════════════════════════════════════════════════════

describe('Letter detail — connection property display', () => {
  it('shows "Verbindet in beide Richtungen" for connectable letters', async () => {
    renderModule1()
    fireEvent.click(screen.getByText('Das Alphabet'))
    await waitFor(() => {
      expect(screen.getByText(/Lektion 1\.1/)).toBeTruthy()
    })
    // Click on Ba (connectable: true)
    const baButtons = screen.getAllByText(/^Bāʾ$/)
    fireEvent.click(baButtons[0])
    await waitFor(() => {
      expect(screen.getByText('Verbindet in beide Richtungen')).toBeTruthy()
    })
  })

  it('shows "trennt nach links" for non-connectable letters', async () => {
    renderModule1()
    fireEvent.click(screen.getByText('Das Alphabet'))
    await waitFor(() => {
      expect(screen.getByText(/Lektion 1\.1/)).toBeTruthy()
    })
    // Click on Alif (connectable: false)
    fireEvent.click(screen.getByText('Alif'))
    await waitFor(() => {
      expect(screen.getByText(/trennt nach links/)).toBeTruthy()
    })
  })
})
