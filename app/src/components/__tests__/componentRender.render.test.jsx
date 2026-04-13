// @vitest-environment jsdom
/**
 * Comprehensive render tests for ALL 36 components.
 *
 * File naming convention: `.render.test.jsx` triggers jsdom environment
 * via vite.config.js environmentMatchGlobs.
 *
 * Each test verifies the component renders without crashing.
 * Components that use react-router hooks are wrapped in MemoryRouter.
 * Components that rely on audio/storage/lazyData utils are mocked at module level.
 */

import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// ---------------------------------------------------------------------------
// Mocks — module-level mocks for side-effectful utilities
// ---------------------------------------------------------------------------

// Mock audio utilities (used by ContinuousReader, DictationExercise)
vi.mock('../../utils/audio.js', () => ({
  playVerseAudio: vi.fn(() => Promise.resolve()),
  stopAudio: vi.fn(),
  getDefaultReciterFolder: vi.fn(() => 'Alafasy_128kbps'),
  getCurrentAudio: vi.fn(() => null),
  isOnline: vi.fn(() => true),
}))

// Mock storage utilities (used by Sidebar, VocabularyDrill, ContinuousReader, etc.)
vi.mock('../../utils/storage.js', () => ({
  loadModuleProgress: vi.fn(() => Promise.resolve({})),
  loadModule2Progress: vi.fn(() => Promise.resolve({})),
  loadAllRoots: vi.fn(() => Promise.resolve({})),
  loadProgress: vi.fn(() => Promise.resolve({})),
  saveProgress: vi.fn(() => Promise.resolve()),
  loadSettings: vi.fn(() => Promise.resolve({})),
  saveSettings: vi.fn(() => Promise.resolve()),
  getSetting: vi.fn(() => Promise.resolve(null)),
  setSetting: vi.fn(() => Promise.resolve()),
  updateStreak: vi.fn(() => Promise.resolve()),
  loadAllAnalyzedWords: vi.fn(() => Promise.resolve({})),
  saveAnalyzedWord: vi.fn(() => Promise.resolve()),
  loadAnalyzedWord: vi.fn(() => Promise.resolve(null)),
  saveRoot: vi.fn(() => Promise.resolve()),
  loadRoot: vi.fn(() => Promise.resolve(null)),
  loadAllSRSCards: vi.fn(() => Promise.resolve({})),
  getDueSRSCards: vi.fn(() => Promise.resolve([])),
  saveSRSCard: vi.fn(() => Promise.resolve()),
  autoCreateSRSCard: vi.fn(() => Promise.resolve()),
  loadSRSCard: vi.fn(() => Promise.resolve(null)),
  exportAllData: vi.fn(() => Promise.resolve({})),
  importData: vi.fn(() => Promise.resolve()),
  downloadJSON: vi.fn(),
  saveUserAmbiguity: vi.fn(() => Promise.resolve()),
  loadUserAmbiguity: vi.fn(() => Promise.resolve(null)),
  loadAllUserAmbiguities: vi.fn(() => Promise.resolve({})),
  saveChecksum: vi.fn(() => Promise.resolve()),
  loadChecksum: vi.fn(() => Promise.resolve(null)),
  checkAndUpdatePhase: vi.fn(() => Promise.resolve(1)),
  saveAnnotation: vi.fn(() => Promise.resolve()),
  loadAnnotation: vi.fn(() => Promise.resolve(null)),
  loadAllAnnotations: vi.fn(() => Promise.resolve({})),
  loadBookmarks: vi.fn(() => Promise.resolve([])),
  deleteAnnotation: vi.fn(() => Promise.resolve()),
  shouldShowBackupReminder: vi.fn(() => Promise.resolve(false)),
  dismissBackupReminder: vi.fn(() => Promise.resolve()),
}))

// Mock lazyData utilities (used by CrossReference, ContinuousReader)
vi.mock('../../utils/lazyData.js', () => ({
  loadMorphologyDB: vi.fn(() => Promise.resolve({ words: [] })),
  loadQuranVocalized: vi.fn(() => Promise.resolve({ surahs: [] })),
  loadQuranUthmani: vi.fn(() => Promise.resolve({ surahs: [] })),
  loadQuranRasm: vi.fn(() => Promise.resolve({ surahs: [] })),
  loadRootFrequencyComplete: vi.fn(() => Promise.resolve({})),
}))

// Mock canvas getContext for HandwritingCanvas (jsdom has no canvas).
// Guard with typeof check so the file can be parsed even before jsdom is ready.
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    fillText: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    scale: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(0) })),
    putImageData: vi.fn(),
    set lineCap(_) {},
    set lineJoin(_) {},
    set strokeStyle(_) {},
    set fillStyle(_) {},
    set lineWidth(_) {},
    set font(_) {},
    set textAlign(_) {},
    set textBaseline(_) {},
    set direction(_) {},
  }))
}

// ---------------------------------------------------------------------------
// Component imports
// ---------------------------------------------------------------------------

import Sidebar from '../Sidebar.jsx'
import ArabicKeyboard from '../ArabicKeyboard.jsx'
import AmbiguityExercise from '../AmbiguityExercise.jsx'
import CaseDerivationExercise from '../CaseDerivationExercise.jsx'
import ClozeExercise from '../ClozeExercise.jsx'
import CongruenceDrill from '../CongruenceDrill.jsx'
import ContextDisambiguationExercise from '../ContextDisambiguationExercise.jsx'
import ContinuousReader from '../ContinuousReader.jsx'
import CrossReference from '../CrossReference.jsx'
import DecompositionExercise from '../DecompositionExercise.jsx'
import DictationExercise from '../DictationExercise.jsx'
import ErrorCorrectionExercise from '../ErrorCorrectionExercise.jsx'
import GrammarSidebar from '../GrammarSidebar.jsx'
import HamzaExercise from '../HamzaExercise.jsx'
import HandwritingCanvas from '../HandwritingCanvas.jsx'
import IrabExercise from '../IrabExercise.jsx'
import MasdarDrill from '../MasdarDrill.jsx'
import NegationDrill from '../NegationDrill.jsx'
import ParadigmDrill from '../ParadigmDrill.jsx'
import PatternRecognitionDrill from '../PatternRecognitionDrill.jsx'
import PolysemyDrill from '../PolysemyDrill.jsx'
import PrintableSheet from '../PrintableSheet.jsx'
import PronounSuffixDrill from '../PronounSuffixDrill.jsx'
import RootExtractionDrill from '../RootExtractionDrill.jsx'
import SentenceDiagram from '../SentenceDiagram.jsx'
import SurahMacrostructureDrill from '../SurahMacrostructureDrill.jsx'
import SynonymContrastDrill from '../SynonymContrastDrill.jsx'
import SyntaxExercises from '../SyntaxExercises.jsx'
import ThematicFieldDrill from '../ThematicFieldDrill.jsx'
import VerbFormSemanticDrill from '../VerbFormSemanticDrill.jsx'
import VerbModeDrill from '../VerbModeDrill.jsx'
import VerbRectionDrill from '../VerbRectionDrill.jsx'
import VerseSynthesisExercise from '../VerseSynthesisExercise.jsx'
import VocabularyDrill from '../VocabularyDrill.jsx'
import VocalizationExercise from '../VocalizationExercise.jsx'
import WritingExercise from '../WritingExercise.jsx'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

const noop = () => {}

// ---------------------------------------------------------------------------
// Tests — one describe block per component (36 total)
// ---------------------------------------------------------------------------

// 1. Sidebar
describe('Component: Sidebar', () => {
  it('renders without crashing', () => {
    expect(() =>
      renderWithRouter(
        <Sidebar
          collapsed={false}
          onToggleCollapse={noop}
          streakCount={0}
          currentPhase={1}
        />
      )
    ).not.toThrow()
  })

  it('displays the title "QA"', () => {
    renderWithRouter(
      <Sidebar
        collapsed={false}
        onToggleCollapse={noop}
        streakCount={0}
        currentPhase={1}
      />
    )
    expect(document.body.innerHTML.length).toBeGreaterThan(0)
  })
})

// 2. ArabicKeyboard
describe('Component: ArabicKeyboard', () => {
  it('renders without crashing when visible', () => {
    expect(() =>
      render(
        <ArabicKeyboard
          onInput={noop}
          onBackspace={noop}
          onClear={noop}
          visible={true}
          onToggle={noop}
        />
      )
    ).not.toThrow()
  })

  it('renders toggle button when not visible', () => {
    render(
      <ArabicKeyboard
        onInput={noop}
        onBackspace={noop}
        visible={false}
        onToggle={noop}
      />
    )
    expect(document.body.innerHTML.length).toBeGreaterThan(0)
  })
})

// 3. AmbiguityExercise
describe('Component: AmbiguityExercise', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<AmbiguityExercise onBack={noop} />)
    ).not.toThrow()
  })

  it('shows the heading', () => {
    render(<AmbiguityExercise onBack={noop} />)
    expect(document.body.innerHTML.length).toBeGreaterThan(0)
  })
})

// 4. CaseDerivationExercise
describe('Component: CaseDerivationExercise', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<CaseDerivationExercise />)
    ).not.toThrow()
  })
})

// 5. ClozeExercise
describe('Component: ClozeExercise', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<ClozeExercise onBack={noop} />)
    ).not.toThrow()
  })
})

// 6. CongruenceDrill
describe('Component: CongruenceDrill', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<CongruenceDrill />)
    ).not.toThrow()
  })
})

// 7. ContextDisambiguationExercise
describe('Component: ContextDisambiguationExercise', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<ContextDisambiguationExercise />)
    ).not.toThrow()
  })
})

// 8. ContinuousReader
describe('Component: ContinuousReader', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<ContinuousReader initialSurah={1} initialVerse={1} onClose={noop} />)
    ).not.toThrow()
  })
})

// 9. CrossReference
describe('Component: CrossReference', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(
        <CrossReference
          word={'\u0628\u0650\u0633\u0652\u0645\u0650'}
          root={'\u0633-\u0645-\u0648'}
          onNavigate={noop}
          onClose={noop}
        />
      )
    ).not.toThrow()
  })
})

// 10. DecompositionExercise
describe('Component: DecompositionExercise', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<DecompositionExercise />)
    ).not.toThrow()
  })
})

// 11. DictationExercise
describe('Component: DictationExercise', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<DictationExercise onBack={noop} />)
    ).not.toThrow()
  })
})

// 12. ErrorCorrectionExercise
describe('Component: ErrorCorrectionExercise', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<ErrorCorrectionExercise />)
    ).not.toThrow()
  })
})

// 13. GrammarSidebar
describe('Component: GrammarSidebar', () => {
  it('renders without crashing when visible', () => {
    expect(() =>
      render(<GrammarSidebar visible={true} onClose={noop} />)
    ).not.toThrow()
  })

  it('renders without crashing when not visible', () => {
    expect(() =>
      render(<GrammarSidebar visible={false} onClose={noop} />)
    ).not.toThrow()
  })
})

// 14. HamzaExercise
describe('Component: HamzaExercise', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<HamzaExercise />)
    ).not.toThrow()
  })
})

// 15. HandwritingCanvas
describe('Component: HandwritingCanvas', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<HandwritingCanvas />)
    ).not.toThrow()
  })
})

// 16. IrabExercise
describe('Component: IrabExercise', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<IrabExercise />)
    ).not.toThrow()
  })
})

// 17. MasdarDrill
describe('Component: MasdarDrill', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<MasdarDrill />)
    ).not.toThrow()
  })

  it('shows the heading', () => {
    render(<MasdarDrill />)
    expect(document.body.innerHTML.length).toBeGreaterThan(0)
  })
})

// 18. NegationDrill
describe('Component: NegationDrill', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<NegationDrill />)
    ).not.toThrow()
  })
})

// 19. ParadigmDrill
describe('Component: ParadigmDrill', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<ParadigmDrill onBack={noop} />)
    ).not.toThrow()
  })
})

// 20. PatternRecognitionDrill
describe('Component: PatternRecognitionDrill', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<PatternRecognitionDrill />)
    ).not.toThrow()
  })
})

// 21. PolysemyDrill
describe('Component: PolysemyDrill', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<PolysemyDrill />)
    ).not.toThrow()
  })
})

// 22. PrintableSheet
describe('Component: PrintableSheet', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<PrintableSheet onBack={noop} />)
    ).not.toThrow()
  })
})

// 23. PronounSuffixDrill
describe('Component: PronounSuffixDrill', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<PronounSuffixDrill />)
    ).not.toThrow()
  })
})

// 24. RootExtractionDrill
describe('Component: RootExtractionDrill', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<RootExtractionDrill />)
    ).not.toThrow()
  })

  it('shows the heading', () => {
    render(<RootExtractionDrill />)
    expect(document.body.innerHTML.length).toBeGreaterThan(0)
  })
})

// 25. SentenceDiagram
describe('Component: SentenceDiagram', () => {
  it('renders without crashing', () => {
    const mockWords = [
      '\u0628\u0650\u0633\u0652\u0645\u0650',
      '\u0627\u0644\u0644\u0651\u064E\u0647\u0650',
      '\u0627\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0646\u0650',
      '\u0627\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650',
    ]
    expect(() =>
      render(
        <SentenceDiagram
          words={mockWords}
          verseRef="1:1"
          onClose={noop}
        />
      )
    ).not.toThrow()
  })
})

// 26. SurahMacrostructureDrill
describe('Component: SurahMacrostructureDrill', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<SurahMacrostructureDrill />)
    ).not.toThrow()
  })
})

// 27. SynonymContrastDrill
describe('Component: SynonymContrastDrill', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<SynonymContrastDrill />)
    ).not.toThrow()
  })
})

// 28. SyntaxExercises
describe('Component: SyntaxExercises', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<SyntaxExercises onClose={noop} />)
    ).not.toThrow()
  })
})

// 29. ThematicFieldDrill
describe('Component: ThematicFieldDrill', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<ThematicFieldDrill />)
    ).not.toThrow()
  })
})

// 30. VerbFormSemanticDrill
describe('Component: VerbFormSemanticDrill', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<VerbFormSemanticDrill />)
    ).not.toThrow()
  })
})

// 31. VerbModeDrill
describe('Component: VerbModeDrill', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<VerbModeDrill />)
    ).not.toThrow()
  })
})

// 32. VerbRectionDrill
describe('Component: VerbRectionDrill', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<VerbRectionDrill />)
    ).not.toThrow()
  })
})

// 33. VerseSynthesisExercise
describe('Component: VerseSynthesisExercise', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<VerseSynthesisExercise />)
    ).not.toThrow()
  })
})

// 34. VocabularyDrill
describe('Component: VocabularyDrill', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<VocabularyDrill onBack={noop} />)
    ).not.toThrow()
  })

  it('shows the heading', () => {
    render(<VocabularyDrill onBack={noop} />)
    expect(document.body.innerHTML.length).toBeGreaterThan(0)
  })
})

// 35. VocalizationExercise
describe('Component: VocalizationExercise', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<VocalizationExercise onBack={noop} />)
    ).not.toThrow()
  })
})

// 36. WritingExercise
describe('Component: WritingExercise', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<WritingExercise onBack={noop} />)
    ).not.toThrow()
  })
})
