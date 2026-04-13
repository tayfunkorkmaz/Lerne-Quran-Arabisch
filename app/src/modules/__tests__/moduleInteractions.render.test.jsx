// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'

// ─── Mock localforage ────────────────────────────────────────────
vi.mock('localforage', () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
    keys: vi.fn().mockResolvedValue([]),
    iterate: vi.fn().mockResolvedValue(undefined),
    createInstance: vi.fn().mockReturnThis(),
    config: vi.fn(),
  },
}))

// ─── Mock storage.js ─────────────────────────────────────────────
vi.mock('../../utils/storage.js', () => ({
  saveModuleProgress: vi.fn().mockResolvedValue({}),
  loadModuleProgress: vi.fn().mockResolvedValue({}),
  loadModule2Progress: vi.fn().mockResolvedValue({}),
  saveSettings: vi.fn().mockImplementation(async (s) => s),
  loadSettings: vi.fn().mockResolvedValue({}),
  exportAllData: vi.fn().mockResolvedValue({ settings: {}, progress: {} }),
  importData: vi.fn().mockResolvedValue(undefined),
  downloadJSON: vi.fn(),
  dismissBackupReminder: vi.fn().mockResolvedValue(undefined),
  saveAnnotation: vi.fn().mockResolvedValue(undefined),
  loadAllAnnotations: vi.fn().mockResolvedValue([]),
  deleteAnnotation: vi.fn().mockResolvedValue(undefined),
  loadAnnotation: vi.fn().mockResolvedValue(null),
  loadBookmarks: vi.fn().mockResolvedValue([]),
  loadProgress: vi.fn().mockResolvedValue({}),
  saveProgress: vi.fn().mockResolvedValue(undefined),
  updateStreak: vi.fn().mockResolvedValue({}),
  shouldShowBackupReminder: vi.fn().mockResolvedValue(false),
  loadAllAnalyzedWords: vi.fn().mockResolvedValue({}),
  loadAllRoots: vi.fn().mockResolvedValue({}),
  loadAllSRSCards: vi.fn().mockResolvedValue([]),
  getDueSRSCards: vi.fn().mockResolvedValue([]),
  loadAllUserAmbiguities: vi.fn().mockResolvedValue([]),
  saveUserAmbiguity: vi.fn().mockResolvedValue(undefined),
  loadUserAmbiguity: vi.fn().mockResolvedValue(null),
  saveChecksum: vi.fn().mockResolvedValue(undefined),
  loadChecksum: vi.fn().mockResolvedValue(null),
  checkAndUpdatePhase: vi.fn().mockResolvedValue(1),
  saveModule2Progress: vi.fn().mockResolvedValue(undefined),
}))

// ─── Mock audio.js ───────────────────────────────────────────────
vi.mock('../../utils/audio.js', () => ({
  buildAudioUrl: vi.fn(() => ''),
  getDefaultReciterFolder: vi.fn(() => 'Alafasy_128kbps'),
  playVerseAudio: vi.fn().mockResolvedValue(undefined),
  stopAudio: vi.fn(),
  isOnline: vi.fn(() => true),
  getCurrentAudio: vi.fn(() => null),
}))

// ─── Mock lazyData.js ────────────────────────────────────────────
vi.mock('../../utils/lazyData.js', () => ({
  loadMorphologyDB: vi.fn().mockResolvedValue({ surahs: [] }),
  loadQuranRasm: vi.fn().mockResolvedValue({ surahs: [] }),
  loadQuranUthmani: vi.fn().mockResolvedValue({ surahs: [] }),
  loadQuranVocalized: vi.fn().mockResolvedValue({ surahs: [] }),
  loadRootFrequencyComplete: vi.fn().mockResolvedValue({}),
}))

// ─── Mock arabic utility (used by Module8) ───────────────────────
vi.mock('../../utils/arabic.js', () => ({
  stripEmbeddedBasmala: vi.fn((text) => text || ''),
}))

// ─── Mock all JSON data imports with minimal valid structures ────
// Module7 data
vi.mock('../../data/advanced-stages.json', () => ({
  default: {
    stages: [
      {
        id: 5,
        title: 'Semantische Felder',
        description: 'Wortbedeutung in semantischen Gruppen',
        learnContent: {
          sections: [
            { type: 'explanation', title: 'Methode', content: 'Lanes Lexikon öffnen...' },
            { type: 'explanation', title: 'Das Wurzel-Notizbuch', content: 'Lege dir ein Notizbuch an...' },
            { type: 'example', title: 'Beispiel-Wurzeln', examples: [{ root: 'k-f-r', lanesSummary: 'bedecken' }] },
            { type: 'explanation', title: 'Warum eine Übersetzung nie reicht', content: 'Jede Übersetzung reduziert...' },
          ],
        },
        exercises: [
          { type: 'root_field', prompt: 'Schlage die Wurzel h-d-y nach.' },
          { type: 'root_field', prompt: 'Untersuche die Wurzel z-l-m.' },
          { type: 'root_field', prompt: 'Vergleiche die Wurzeln ayn-b-d und ayn-b-r.' },
          { type: 'journal', prompt: 'Lege eine Root-Journal-Seite an.' },
          { type: 'analysis', prompt: 'Lies 2:255 und extrahiere alle Wurzeln.' },
          { type: 'comparison', prompt: 'Vergleiche die Wurzel ayn-l-m in 2:255 mit 55:2.' },
          { type: 'verse_group', prompt: 'Finde alle Verse mit der Wurzel n-w-r.' },
        ],
        testContent: {
          exercises: [
            { question: 'Grundbedeutung k-f-r?', options: ['Bedecken', 'Leugnen', 'Suendigen', 'Vergessen'], correct: 0 },
            { question: 'Warum Bauer = kaafir?', options: ['Unglaube', 'Samen bedecken', 'Feldarbeit', 'Ernte'], correct: 1 },
            { question: 'Wurzeln zuordnen s-l-m, t-l-q, z-l-m', options: ['Korrekt', 'Falsch A', 'Falsch B', 'Falsch C'], correct: 0 },
            { question: 'Welches Wörterbuch?', options: ['Wehr', 'Wasit', 'Lanes', 'Lisan'], correct: 2 },
            { question: 'Grundbedeutung s-l-m + Muster islam?', options: ['Korrekt', 'Falsch A', 'Falsch B', 'Falsch C'], correct: 0 },
            { question: 'Form von al-hayy?', options: ['Adj', 'Mit Artikel', 'Verb', 'Nomen'], correct: 1 },
            { question: 'Unterschied n-w-r in 24:35 vs 14:1?', options: ['Eigenschaft vs Ziel', 'Identisch', 'Wörtlich vs Name', 'Kein'], correct: 0 },
          ],
        },
      },
      {
        id: 6,
        title: 'Kontextuelle Analyse',
        description: 'Wortbedeutung aus dem Kontext',
        learnContent: { sections: [] },
        exercises: [],
        testContent: { exercises: [] },
      },
    ],
  },
}))

vi.mock('../../data/balagha-lessons.json', () => ({ default: { lessons: [] } }))
vi.mock('../../data/disambiguation-lesson.json', () => ({ default: { stages: [], meta: {} } }))
vi.mock('../../data/discourse-structure.json', () => ({ default: { stages: [], meta: {} } }))
vi.mock('../../data/number-system.json', () => ({ default: { lessons: [] } }))
vi.mock('../../data/tawkid-lesson.json', () => ({ default: { lessons: [] } }))
vi.mock('../../data/nisba-lesson.json', () => ({ default: { lessons: [] } }))
vi.mock('../../data/lanes-reading-guide.json', () => ({ default: { lessons: [] } }))
vi.mock('../../data/conditional-syntax.json', () => ({ default: { lessons: [] } }))
vi.mock('../../data/interrogative-syntax.json', () => ({ default: { lessons: [] } }))
vi.mock('../../data/istithna-syntax.json', () => ({ default: { lessons: [] } }))
vi.mock('../../data/qasam-syntax.json', () => ({ default: { lessons: [] } }))
vi.mock('../../data/nida-syntax.json', () => ({ default: { lessons: [] } }))
vi.mock('../../data/taqdim-takhir.json', () => ({ default: { lessons: [] } }))
vi.mock('../../data/relative-clause-syntax.json', () => ({ default: { lessons: [] } }))
vi.mock('../../data/preposition-semantics.json', () => ({ default: { lessons: [] } }))

// Module8 data
vi.mock('../../data/rasm-orthography.json', () => ({
  default: {
    meta: { description: 'Rasm-Orthographie' },
    categories: [{ id: 'alif', title: 'Alif-Waw', description: 'Alif und Waw', examples: [] }],
  },
}))
vi.mock('../../data/hapax-legomena.json', () => ({ default: { meta: { hapaxByVocalizedForm: 500 }, entries: [] } }))
vi.mock('../../data/lehnwoerter.json', () => ({ default: { meta: {}, entries: [] } }))
vi.mock('../../data/collocations.json', () => ({ default: { meta: {}, entries: [] } }))
vi.mock('../../data/rasm-vocalization-drill.json', () => ({ default: { exercises: [] } }))
vi.mock('../../data/pausal-forms-drill.json', () => ({ default: { exercises: [] } }))
vi.mock('../../data/rasm-vocalization-drill-ext.json', () => ({ default: { exercises: [] } }))
vi.mock('../../data/rasm-vocalization-drill-generated.json', () => ({ default: { exercises: [] } }))
vi.mock('../../data/pausal-forms-drill-ext.json', () => ({ default: { exercises: [] } }))
vi.mock('../../data/alif-wasla-drill.json', () => ({ default: { categories: [] } }))
vi.mock('../../data/alif-wasla-generated.json', () => ({ default: { categories: [] } }))
vi.mock('../../data/weak-root-transformation-drill.json', () => ({ default: { exercises: [] } }))
vi.mock('../../data/weak-root-generated.json', () => ({ default: { exercises: [] } }))
vi.mock('../../data/ring-composition-drill.json', () => ({ default: { exercises: [] } }))
vi.mock('../../data/speech-act-drill.json', () => ({ default: { exercises: [] } }))
vi.mock('../../data/mushaf-notation.json', () => ({ default: { categories: [] } }))
vi.mock('../../data/alphabet.json', () => ({ default: { letters: [] } }))
vi.mock('../../data/solar-lunar-letters.json', () => ({ default: {} }))
vi.mock('../../data/alif-inventory.json', () => ({ default: {} }))
vi.mock('../../data/reverse-rasm-drill.json', () => ({ default: { exercises: [] } }))
vi.mock('../../data/sura-index.json', () => ({ default: { surahs: [] } }))
vi.mock('../../data/proper-names.json', () => ({ default: { entries: [] } }))
vi.mock('../../data/frequency-learning-path.json', () => ({ default: {} }))
vi.mock('../../data/verb-form-frequency.json', () => ({ default: {} }))
vi.mock('../../data/nominal-pattern-inventory.json', () => ({ default: {} }))
vi.mock('../../data/rasm-decoding-drill.json', () => ({ default: { exercises: [] } }))
vi.mock('../../data/rasm-glyph-mapping.json', () => ({ default: {} }))
vi.mock('../../data/energetikus-paradigm.json', () => ({ default: {} }))
vi.mock('../../data/script-history-lesson.json', () => ({ default: { sections: [] } }))
vi.mock('../../data/elativ-drill.json', () => ({ default: { exercises: [] } }))
vi.mock('../../data/quadriliteral-lesson.json', () => ({ default: {} }))
vi.mock('../../data/phonology-supplementary.json', () => ({ default: {} }))
vi.mock('../../data/quran-simple-clean.json', () => ({
  default: {
    surahs: [{ number: 1, name: 'Al-Fatiha', verses: [{ number: 1, text: 'test' }] }],
  },
}))
vi.mock('../../data/layer-buildup-drill.json', () => ({ default: { exercises: [] } }))
vi.mock('../../data/particles.json', () => ({ default: {} }))

// Mock all lazy-loaded components used by Module8
vi.mock('../../components/ContinuousReader.jsx', () => ({
  default: ({ onClose }) => <div data-testid="continuous-reader"><button onClick={onClose}>Schließen</button></div>,
}))
vi.mock('../../components/DictationExercise.jsx', () => ({
  default: ({ onBack }) => <div data-testid="dictation"><button onClick={onBack}>Zurück</button></div>,
}))
vi.mock('../../components/PrintableSheet.jsx', () => ({
  default: ({ onBack }) => <div data-testid="print-sheet"><button onClick={onBack}>Zurück</button></div>,
}))
vi.mock('../../components/WritingExercise.jsx', () => ({
  default: ({ onBack }) => <div data-testid="writing-exercise"><button onClick={onBack}>Zurück</button></div>,
}))
vi.mock('../../components/VocalizationExercise.jsx', () => ({
  default: ({ onBack }) => <div data-testid="vocalization"><button onClick={onBack}>Zurück</button></div>,
}))
vi.mock('../../components/AmbiguityExercise.jsx', () => ({
  default: ({ onBack }) => <div data-testid="ambiguity"><button onClick={onBack}>Zurück</button></div>,
}))
vi.mock('../../components/CrossReference.jsx', () => ({
  default: () => <div data-testid="cross-ref">Konkordanz</div>,
}))
vi.mock('../../components/GrammarSidebar.jsx', () => ({
  default: () => <div data-testid="grammar-sidebar">Grammatik</div>,
}))
vi.mock('../../components/DecompositionExercise.jsx', () => ({
  default: () => <div data-testid="decomposition">Decomposition</div>,
}))
vi.mock('../../components/CaseDerivationExercise.jsx', () => ({
  default: () => <div data-testid="case-derivation">CaseDerivation</div>,
}))
vi.mock('../../components/VerseSynthesisExercise.jsx', () => ({
  default: () => <div data-testid="verse-synthesis">VerseSynthesis</div>,
}))
vi.mock('../../components/ErrorCorrectionExercise.jsx', () => ({
  default: () => <div data-testid="error-correction">ErrorCorrection</div>,
}))
vi.mock('../../components/ContextDisambiguationExercise.jsx', () => ({
  default: () => <div data-testid="context-disambig">ContextDisambig</div>,
}))
vi.mock('../../components/PolysemyDrill.jsx', () => ({
  default: () => <div data-testid="polysemy">Polysemy</div>,
}))
vi.mock('../../components/VerbFormSemanticDrill.jsx', () => ({
  default: () => <div data-testid="verb-form-semantic">VerbFormSemantic</div>,
}))
vi.mock('../../components/SynonymContrastDrill.jsx', () => ({
  default: () => <div data-testid="synonym-contrast">SynonymContrast</div>,
}))
vi.mock('../../components/SurahMacrostructureDrill.jsx', () => ({
  default: () => <div data-testid="surah-macro">SurahMacro</div>,
}))
vi.mock('../../components/VerbRectionDrill.jsx', () => ({
  default: () => <div data-testid="verb-rection">VerbRection</div>,
}))
vi.mock('../../components/ThematicFieldDrill.jsx', () => ({
  default: () => <div data-testid="thematic-field">ThematicField</div>,
}))
vi.mock('../../components/CongruenceDrill.jsx', () => ({
  default: () => <div data-testid="congruence">Congruence</div>,
}))
vi.mock('../../components/MasdarDrill.jsx', () => ({
  default: () => <div data-testid="masdar">Masdar</div>,
}))
vi.mock('../../components/VocabularyDrill.jsx', () => ({
  default: ({ onBack }) => <div data-testid="vocab-drill"><button onClick={onBack}>Zurück</button></div>,
}))
vi.mock('../../components/HandwritingCanvas.jsx', () => ({
  default: () => <div data-testid="handwriting">Handwriting</div>,
}))
vi.mock('../../components/ClozeExercise.jsx', () => ({
  default: ({ onBack }) => <div data-testid="cloze"><button onClick={onBack}>Zurück</button></div>,
}))
vi.mock('../../components/IrabExercise.jsx', () => ({
  default: () => <div data-testid="irab">Irab</div>,
}))
vi.mock('../../components/RootExtractionDrill.jsx', () => ({
  default: () => <div data-testid="root-extraction">RootExtraction</div>,
}))
vi.mock('../../components/PatternRecognitionDrill.jsx', () => ({
  default: () => <div data-testid="pattern-recognition">PatternRecognition</div>,
}))
vi.mock('../../components/PronounSuffixDrill.jsx', () => ({
  default: () => <div data-testid="pronoun-suffix">PronounSuffix</div>,
}))
vi.mock('../../components/VerbModeDrill.jsx', () => ({
  default: () => <div data-testid="verb-mode">VerbMode</div>,
}))
vi.mock('../../components/NegationDrill.jsx', () => ({
  default: () => <div data-testid="negation">Negation</div>,
}))
vi.mock('../../components/HamzaExercise.jsx', () => ({
  default: () => <div data-testid="hamza">Hamza</div>,
}))

// ─── Imports under test ──────────────────────────────────────────
import Module7 from '../Module7.jsx'
import Module8 from '../Module8.jsx'
import SettingsPage from '../SettingsPage.jsx'
import IntroSequence from '../IntroSequence.jsx'
import Sidebar from '../../components/Sidebar.jsx'

import {
  saveModuleProgress,
  saveSettings,
  exportAllData,
  downloadJSON,
  dismissBackupReminder,
} from '../../utils/storage.js'

// ─── Helpers ─────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks()
  // Provide scrollTo for IntroSequence
  window.scrollTo = vi.fn()
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ═════════════════════════════════════════════════════════════════
// Module7 Tests
// ═════════════════════════════════════════════════════════════════
describe('Module7 — Fortgeschrittene Stufen', () => {
  it('renders the stage list with all stages from data', async () => {
    render(<Module7 />)
    await waitFor(() => {
      expect(screen.getByText('Fortgeschrittene Stufen (5–12)')).toBeInTheDocument()
    })
    // Both mock stages should be visible
    expect(screen.getByText('Semantische Felder')).toBeInTheDocument()
    expect(screen.getByText('Kontextuelle Analyse')).toBeInTheDocument()
  })

  it('shows stage card metadata (sections, exercises, test count)', async () => {
    render(<Module7 />)
    await waitFor(() => {
      expect(screen.getByText('Semantische Felder')).toBeInTheDocument()
    })
    // Stage 5 (Semantische Felder) — counts match real data: 4 sections, 7 exercises, 7 test questions
    expect(screen.getByText(/4 Sektionen · 7 Aufgaben · 7 Prüfungsfragen/)).toBeInTheDocument()
  })

  it('clicking a stage opens the detail view', async () => {
    render(<Module7 />)
    await waitFor(() => {
      expect(screen.getByText('Semantische Felder')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Semantische Felder'))
    // Detail view shows stage title + learn mode sections
    expect(screen.getByText(/Stufe 5 — Semantische Felder/)).toBeInTheDocument()
    expect(screen.getByText('Lernmodus')).toBeInTheDocument()
  })

  it('learn mode shows sections from learnContent', async () => {
    render(<Module7 />)
    await waitFor(() => {
      expect(screen.getByText('Semantische Felder')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Semantische Felder'))
    // The learn mode is default — sections should render
    expect(screen.getByText('Methode')).toBeInTheDocument()
    expect(screen.getByText('Das Wurzel-Notizbuch')).toBeInTheDocument()
    expect(screen.getByText('Warum eine Übersetzung nie reicht')).toBeInTheDocument()
  })

  it('exercises tab shows exercise cards', async () => {
    render(<Module7 />)
    await waitFor(() => {
      expect(screen.getByText('Semantische Felder')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Semantische Felder'))
    // Click exercises tab
    fireEvent.click(screen.getByText(/Aufgaben \(7\)/))
    expect(screen.getByText('Schlage die Wurzel h-d-y nach.')).toBeInTheDocument()
  })

  it('test mode shows questions with options', async () => {
    render(<Module7 />)
    await waitFor(() => {
      expect(screen.getByText('Semantische Felder')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Semantische Felder'))
    // Click test tab
    fireEvent.click(screen.getByText(/Prüfmodus \(7\)/))
    expect(screen.getByText(/Prüfung — Stufe 5/)).toBeInTheDocument()
    expect(screen.getByText('Grundbedeutung k-f-r?')).toBeInTheDocument()
    expect(screen.getByText('Bedecken')).toBeInTheDocument()
    expect(screen.getByText('Leugnen')).toBeInTheDocument()
  })

  it('answering correctly shows "Richtig!" feedback', async () => {
    render(<Module7 />)
    await waitFor(() => {
      expect(screen.getByText('Semantische Felder')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Semantische Felder'))
    fireEvent.click(screen.getByText(/Prüfmodus \(7\)/))
    // Question 1 correct answer is index 0 = "Bedecken"
    fireEvent.click(screen.getByText('Bedecken'))
    expect(screen.getByText('Richtig!')).toBeInTheDocument()
  })

  it('answering wrong shows the correct answer', async () => {
    render(<Module7 />)
    await waitFor(() => {
      expect(screen.getByText('Semantische Felder')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Semantische Felder'))
    fireEvent.click(screen.getByText(/Prüfmodus \(7\)/))
    // Question 1 correct answer is index 0, pick wrong one (index 2)
    fireEvent.click(screen.getByText('Suendigen'))
    expect(screen.getByText(/Nicht ganz. Die richtige Antwort ist: Bedecken/)).toBeInTheDocument()
  })

  it('passing test (>=80%) triggers onPass and persists progress', async () => {
    render(<Module7 />)
    await waitFor(() => {
      expect(screen.getByText('Semantische Felder')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Semantische Felder'))
    fireEvent.click(screen.getByText(/Prüfmodus \(7\)/))

    // Answer all 7 questions correctly: indices 0, 1, 0, 2, 0, 1, 0
    // Q1: correct=0 => "Bedecken"
    fireEvent.click(screen.getByText('Bedecken'))
    fireEvent.click(screen.getByText('Weiter'))

    // Q2: correct=1 => "Samen bedecken"
    fireEvent.click(screen.getByText('Samen bedecken'))
    fireEvent.click(screen.getByText('Weiter'))

    // Q3: correct=0 => "Korrekt"
    fireEvent.click(screen.getByText('Korrekt'))
    fireEvent.click(screen.getByText('Weiter'))

    // Q4: correct=2 => "Lanes"
    fireEvent.click(screen.getByText('Lanes'))
    fireEvent.click(screen.getByText('Weiter'))

    // Q5: correct=0 => "Korrekt"
    fireEvent.click(screen.getByText('Korrekt'))
    fireEvent.click(screen.getByText('Weiter'))

    // Q6: correct=1 => "Mit Artikel"
    fireEvent.click(screen.getByText('Mit Artikel'))
    fireEvent.click(screen.getByText('Weiter'))

    // Q7: correct=0 => "Eigenschaft vs Ziel"
    fireEvent.click(screen.getByText('Eigenschaft vs Ziel'))
    fireEvent.click(screen.getByText('Weiter'))

    // Should show results: 7/7 = 100%
    await waitFor(() => {
      expect(screen.getByText('7 / 7')).toBeInTheDocument()
      expect(screen.getByText(/Gut! Du hast diese Stufe bestanden/)).toBeInTheDocument()
    })

    // Progress should have been saved
    expect(saveModuleProgress).toHaveBeenCalledWith(7, expect.objectContaining({
      passed: expect.objectContaining({
        5: expect.objectContaining({ passedAt: expect.any(String) }),
      }),
    }))
  })

  it('failing test (<80%) shows retry message', async () => {
    render(<Module7 />)
    await waitFor(() => {
      expect(screen.getByText('Semantische Felder')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Semantische Felder'))
    fireEvent.click(screen.getByText(/Prüfmodus \(7\)/))

    // Answer all 7 wrong: pick incorrect answers
    // Q1: correct=0 (Bedecken), pick "Leugnen" (index 1)
    fireEvent.click(screen.getByText('Leugnen'))
    fireEvent.click(screen.getByText('Weiter'))

    // Q2: correct=1 (Samen bedecken), pick "Unglaube" (index 0)
    fireEvent.click(screen.getByText('Unglaube'))
    fireEvent.click(screen.getByText('Weiter'))

    // Q3: correct=0 (Korrekt), pick "Falsch A" (index 1)
    fireEvent.click(screen.getByText('Falsch A'))
    fireEvent.click(screen.getByText('Weiter'))

    // Q4: correct=2 (Lanes), pick "Wehr" (index 0)
    fireEvent.click(screen.getByText('Wehr'))
    fireEvent.click(screen.getByText('Weiter'))

    // Q5: correct=0 (Korrekt), pick "Falsch B" (index 1)
    fireEvent.click(screen.getByText('Falsch B'))
    fireEvent.click(screen.getByText('Weiter'))

    // Q6: correct=1 (Mit Artikel), pick "Adj" (index 0)
    fireEvent.click(screen.getByText('Adj'))
    fireEvent.click(screen.getByText('Weiter'))

    // Q7: correct=0 (Eigenschaft vs Ziel), pick "Identisch" (index 1)
    fireEvent.click(screen.getByText('Identisch'))
    fireEvent.click(screen.getByText('Weiter'))

    // Should show results: 0/7 = 0%
    await waitFor(() => {
      expect(screen.getByText('0 / 7')).toBeInTheDocument()
      expect(screen.getByText(/Wiederhole den Lernmodus/)).toBeInTheDocument()
    })
  })

  it('back navigation from detail view returns to stage list', async () => {
    render(<Module7 />)
    await waitFor(() => {
      expect(screen.getByText('Semantische Felder')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Semantische Felder'))
    expect(screen.getByText(/Stufe 5 — Semantische Felder/)).toBeInTheDocument()

    // Click back button
    fireEvent.click(screen.getByText('Zurück zur Übersicht'))
    expect(screen.getByText('Fortgeschrittene Stufen (5–12)')).toBeInTheDocument()
  })

  it('back navigation from test mode returns to learn mode', async () => {
    render(<Module7 />)
    await waitFor(() => {
      expect(screen.getByText('Semantische Felder')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Semantische Felder'))
    fireEvent.click(screen.getByText(/Prüfmodus \(7\)/))
    expect(screen.getByText(/Prüfung — Stufe 5/)).toBeInTheDocument()

    // Back from test mode returns to stage detail (learn mode)
    fireEvent.click(screen.getByText('Zurück'))
    expect(screen.getByText('Lernmodus')).toBeInTheDocument()
  })
})

// ═════════════════════════════════════════════════════════════════
// Module8 Tests
// ═════════════════════════════════════════════════════════════════
describe('Module8 — Werkzeuge und Vertiefung', () => {
  it('renders the tool list home view', async () => {
    render(<Module8 />)
    await waitFor(() => {
      expect(screen.getByText('Werkzeuge und Vertiefung')).toBeInTheDocument()
    })
  })

  it('shows tool section headers', async () => {
    render(<Module8 />)
    await waitFor(() => {
      expect(screen.getByText('Einstieg und Anleitungen')).toBeInTheDocument()
      expect(screen.getByText('Schriftkundliche Analyse')).toBeInTheDocument()
      expect(screen.getByText('Textanalyse')).toBeInTheDocument()
      expect(screen.getByText('Nachschlagewerke')).toBeInTheDocument()
    })
  })

  it('shows tool cards with titles', async () => {
    render(<Module8 />)
    await waitFor(() => {
      expect(screen.getByText('Orthographie des Konsonantentextes')).toBeInTheDocument()
      expect(screen.getByText('Vokalisierungsübung')).toBeInTheDocument()
      expect(screen.getByText('Konkordanz')).toBeInTheDocument()
    })
  })

  it('clicking a tool opens the tool view', async () => {
    render(<Module8 />)
    await waitFor(() => {
      expect(screen.getByText('Orthographie des Konsonantentextes')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Orthographie des Konsonantentextes'))
    // Should now render the Rasm lesson view
    await waitFor(() => {
      expect(screen.getByText(/Orthographie des Konsonantentextes/)).toBeInTheDocument()
      // The Zurück button should be present
      expect(screen.getByText('Zurück zur Übersicht')).toBeInTheDocument()
    })
  })

  it('back from tool view returns to home', async () => {
    render(<Module8 />)
    await waitFor(() => {
      expect(screen.getByText('Orthographie des Konsonantentextes')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Orthographie des Konsonantentextes'))
    await waitFor(() => {
      expect(screen.getByText('Zurück zur Übersicht')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Zurück zur Übersicht'))
    await waitFor(() => {
      expect(screen.getByText('Werkzeuge und Vertiefung')).toBeInTheDocument()
    })
  })

  it('tracks view visits and persists progress', async () => {
    render(<Module8 />)
    await waitFor(() => {
      expect(screen.getByText('Orthographie des Konsonantentextes')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Orthographie des Konsonantentextes'))
    await waitFor(() => {
      expect(saveModuleProgress).toHaveBeenCalledWith(8, expect.objectContaining({
        visitedViews: expect.any(Object),
        totalVisited: expect.any(Number),
      }))
    })
  })
})

// ═════════════════════════════════════════════════════════════════
// SettingsPage Tests
// ═════════════════════════════════════════════════════════════════
describe('SettingsPage — Einstellungen', () => {
  const defaultSettings = {
    theme: 'dark',
    arabicFontSize: 28,
    phase: 2,
    streakCount: 5,
  }

  it('renders the settings page with all sections', () => {
    render(<SettingsPage settings={defaultSettings} onSettingsChange={vi.fn()} />)
    expect(screen.getByText('Einstellungen')).toBeInTheDocument()
    expect(screen.getByText('Erscheinungsbild')).toBeInTheDocument()
    expect(screen.getByText('Datenverwaltung')).toBeInTheDocument()
    expect(screen.getByText('Sonstiges')).toBeInTheDocument()
  })

  it('theme toggle buttons call saveSettings with correct theme', async () => {
    const onSettingsChange = vi.fn()
    saveSettings.mockResolvedValue({ theme: 'light' })
    render(<SettingsPage settings={defaultSettings} onSettingsChange={onSettingsChange} />)

    fireEvent.click(screen.getByText('Hell'))
    await waitFor(() => {
      expect(saveSettings).toHaveBeenCalledWith({ theme: 'light' })
      expect(onSettingsChange).toHaveBeenCalledWith({ theme: 'light' })
    })
  })

  it('dark theme button has primary class when active', () => {
    render(<SettingsPage settings={{ ...defaultSettings, theme: 'dark' }} onSettingsChange={vi.fn()} />)
    const darkBtn = screen.getByText('Dunkel')
    expect(darkBtn.className).toContain('settings-btn--primary')
  })

  it('font size slider changes value and calls saveSettings', async () => {
    const onSettingsChange = vi.fn()
    saveSettings.mockResolvedValue({ arabicFontSize: 36 })
    render(<SettingsPage settings={defaultSettings} onSettingsChange={onSettingsChange} />)

    const slider = screen.getByRole('slider')
    expect(slider.value).toBe('28')
    fireEvent.change(slider, { target: { value: '36' } })

    await waitFor(() => {
      expect(saveSettings).toHaveBeenCalledWith({ arabicFontSize: 36 })
    })
  })

  it('export button calls exportAllData and downloadJSON', async () => {
    const mockData = { settings: { theme: 'dark' }, progress: {} }
    exportAllData.mockResolvedValue(mockData)

    render(<SettingsPage settings={defaultSettings} onSettingsChange={vi.fn()} />)
    fireEvent.click(screen.getByText('Exportieren'))

    await waitFor(() => {
      expect(exportAllData).toHaveBeenCalled()
      expect(downloadJSON).toHaveBeenCalledWith(mockData, expect.stringContaining('quran-arabisch-backup-'))
      expect(dismissBackupReminder).toHaveBeenCalled()
    })
  })

  it('import button sets merge mode and triggers file input', () => {
    render(<SettingsPage settings={defaultSettings} onSettingsChange={vi.fn()} />)
    const importBtn = screen.getByText('Importieren')
    // Clicking should not throw — it triggers the hidden file input via ref
    fireEvent.click(importBtn)
    // The file input should exist (hidden)
    const fileInput = document.querySelector('input[type="file"]')
    expect(fileInput).toBeTruthy()
    expect(fileInput.accept).toBe('.json')
  })

  it('reset intro calls saveSettings with firstRun: true', async () => {
    const onSettingsChange = vi.fn()
    saveSettings.mockResolvedValue({ firstRun: true, completedIntro: false })
    render(<SettingsPage settings={defaultSettings} onSettingsChange={onSettingsChange} />)

    fireEvent.click(screen.getByText('Zurücksetzen'))
    await waitFor(() => {
      expect(saveSettings).toHaveBeenCalledWith({ firstRun: true, completedIntro: false })
      expect(onSettingsChange).toHaveBeenCalled()
    })
  })

  it('displays the correct phase', () => {
    render(<SettingsPage settings={{ ...defaultSettings, phase: 2 }} onSettingsChange={vi.fn()} />)
    expect(screen.getByText('Phase 2: Morphologie')).toBeInTheDocument()
  })

  it('displays streak count', () => {
    render(<SettingsPage settings={{ ...defaultSettings, streakCount: 5 }} onSettingsChange={vi.fn()} />)
    expect(screen.getByText('5 Tage')).toBeInTheDocument()
  })
})

// ═════════════════════════════════════════════════════════════════
// IntroSequence Tests
// ═════════════════════════════════════════════════════════════════
describe('IntroSequence — Einführungssequenz', () => {
  it('renders the intro overlay with first step', () => {
    render(<IntroSequence onComplete={vi.fn()} />)
    expect(screen.getByText('Willkommen')).toBeInTheDocument()
    expect(screen.getByText(/1 \//)).toBeInTheDocument()
  })

  it('next button advances to next slide', () => {
    render(<IntroSequence onComplete={vi.fn()} />)
    expect(screen.getByText('Willkommen')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Weiter'))
    // Second step
    expect(screen.getByText('Die vier Schichten des Textes')).toBeInTheDocument()
    expect(screen.getByText(/2 \//)).toBeInTheDocument()
  })

  it('back button goes to previous slide', () => {
    render(<IntroSequence onComplete={vi.fn()} />)
    fireEvent.click(screen.getByText('Weiter'))
    expect(screen.getByText('Die vier Schichten des Textes')).toBeInTheDocument()
    // The back button text is "Zurück" (with umlaut u)
    const backBtn = screen.getByText(/Zur\u00FCck/)
    fireEvent.click(backBtn)
    expect(screen.getByText('Willkommen')).toBeInTheDocument()
  })

  it('back button is disabled on first slide', () => {
    render(<IntroSequence onComplete={vi.fn()} />)
    const backBtn = screen.getByText(/Zur\u00FCck/)
    expect(backBtn).toBeDisabled()
  })

  it('final slide shows completion button and calls onComplete', () => {
    const onComplete = vi.fn()
    render(<IntroSequence onComplete={onComplete} />)

    // Navigate to the last step by clicking through all steps
    // The STEPS array has multiple items; we use the dot navigation to jump
    // Instead, let's find how many steps and click Weiter repeatedly
    const stepCountText = screen.getByText(/1 \//).textContent
    const totalSteps = parseInt(stepCountText.split('/')[1].trim())

    // Click "Weiter" for all but the last step
    for (let i = 0; i < totalSteps - 1; i++) {
      fireEvent.click(screen.getByText('Weiter'))
    }

    // Now on the last step — button text should be "Zum Schrift-Trainer"
    expect(screen.getByText('Zum Schrift-Trainer')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Zum Schrift-Trainer'))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('step indicator dots allow jumping to a specific step', () => {
    render(<IntroSequence onComplete={vi.fn()} />)
    // Find all dot buttons — they have aria-labels like "Schritt N: ..."
    const dotButtons = screen.getAllByRole('button', { name: /Schritt \d+/ })
    expect(dotButtons.length).toBeGreaterThan(2)

    // Jump to step 3 (index 2)
    fireEvent.click(dotButtons[2])
    expect(screen.getByText(/3 \//)).toBeInTheDocument()
  })
})

// ═════════════════════════════════════════════════════════════════
// Sidebar Tests
// ═════════════════════════════════════════════════════════════════
describe('Sidebar — Navigation', () => {
  const renderSidebar = (props = {}) => {
    const defaults = {
      collapsed: false,
      onToggleCollapse: vi.fn(),
      streakCount: 7,
      currentPhase: 2,
    }
    return render(
      <MemoryRouter initialEntries={['/module/1']}>
        <Sidebar {...defaults} {...props} />
      </MemoryRouter>
    )
  }

  it('renders all module links', () => {
    renderSidebar()
    expect(screen.getByText('Schrift')).toBeInTheDocument()
    expect(screen.getByText('Morphologie')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('shows module descriptions', () => {
    renderSidebar()
    expect(screen.getByText('Schrift-Trainer')).toBeInTheDocument()
    expect(screen.getByText('Morphologie-Dojo')).toBeInTheDocument()
    expect(screen.getByText('Fortschritt')).toBeInTheDocument()
  })

  it('locked modules show lock message instead of link', async () => {
    // With unlockedPhase=1 (default from loadModuleProgress mocking),
    // modules with phase > 1 (except Dashboard/module 6) should be locked.
    // loadModuleProgress returns {} so m1Done=false, unlockedPhase stays 1
    renderSidebar()
    await waitFor(() => {
      // Vers-Werkstatt is phase 2 — should be locked
      const lockedItems = document.querySelectorAll('.sidebar__item--locked')
      expect(lockedItems.length).toBeGreaterThan(0)
    })
  })

  it('collapse toggle button works and calls onToggleCollapse', () => {
    const onToggleCollapse = vi.fn()
    renderSidebar({ onToggleCollapse })
    // The toggle button should exist with label
    const toggleBtn = screen.getByRole('button', { name: /Seitenleiste einklappen/ })
    fireEvent.click(toggleBtn)
    expect(onToggleCollapse).toHaveBeenCalledTimes(1)
  })

  it('collapsed mode hides labels and descriptions', () => {
    renderSidebar({ collapsed: true })
    // When collapsed, module labels should not be rendered
    // The sidebar__title "QA" should not be present
    expect(screen.queryByText('QA')).not.toBeInTheDocument()
  })

  it('phase label shows correctly', () => {
    renderSidebar({ currentPhase: 2 })
    expect(screen.getByText('Phase 2')).toBeInTheDocument()
    expect(screen.getByText('Analyse')).toBeInTheDocument()
  })

  it('streak counter displays the count', () => {
    renderSidebar({ streakCount: 7 })
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('settings link renders and navigates', () => {
    renderSidebar()
    expect(screen.getByText('Einstellungen')).toBeInTheDocument()
    // It should be a NavLink to /settings
    const settingsLink = screen.getByText('Einstellungen').closest('a')
    expect(settingsLink).toHaveAttribute('href', '/settings')
  })
})
