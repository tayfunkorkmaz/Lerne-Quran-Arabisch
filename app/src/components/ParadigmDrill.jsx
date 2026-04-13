import { useState, useEffect, useRef, useCallback } from 'react';
import morphologyTables from '../data/morphology-tables.json';
import weakVerbTables from '../data/weak-verb-tables.json';
import ArabicKeyboard from './ArabicKeyboard.jsx';

/* ================================================================
   ParadigmDrill -- Sarf-Paradigmen-Drill (Modul 2)
   Der Lernende füllt komplette Konjugationstabellen aus dem
   Gedächtnis aus. Unterstützt Voll-Tabellen- und Zufall-Modus.
   Erweitert um schwache Verb-Typen (hohl, schluss-schwach, etc.).
   ================================================================ */

// ───────────────────────── constants ─────────────────────────────

const PERSON_ORDER = morphologyTables.meta.conjugationPersonOrder;
// ["3ms","3fs","3md","3fd","3mp","3fp","2ms","2fs","2md","2mp","2fp","1s","1p"]

const PERSON_LABELS = {
  '3ms': '3. Person maskulin Singular',
  '3fs': '3. Person feminin Singular',
  '3md': '3. Person maskulin Dual',
  '3fd': '3. Person feminin Dual',
  '3mp': '3. Person maskulin Plural',
  '3fp': '3. Person feminin Plural',
  '2ms': '2. Person maskulin Singular',
  '2fs': '2. Person feminin Singular',
  '2md': '2. Person Dual (m/f)',
  '2mp': '2. Person maskulin Plural',
  '2fp': '2. Person feminin Plural',
  '1s':  '1. Person Singular',
  '1p':  '1. Person Plural',
};

const TENSE_LABELS = {
  perfect: 'Perfekt',
  imperfect: 'Imperfekt',
};

const FORM_OPTIONS = morphologyTables.verbForms.map((vf) => ({
  value: vf.form,
  label: `Form ${vf.form}`,
  arabic: vf.pattern.arabic,
}));

const TIMER_OPTIONS = [
  { value: 0, label: 'Aus' },
  { value: 120, label: '2 Minuten' },
  { value: 300, label: '5 Minuten' },
];

// ───────────────────────── Verbtyp (weak verbs) ─────────────────

const VERB_TYPE_OPTIONS = [
  { value: 'regular', label: 'Regulär (Formen I-X)' },
  { value: 'hollow', label: 'Hohle Verben' },
  { value: 'defective', label: 'Schluss-schwache Verben' },
  { value: 'assimilated', label: 'Anfangsschwache Verben' },
  { value: 'geminate', label: 'Verdoppelte Verben' },
  { value: 'hamzated', label: 'Hamza-Verben' },
  { value: 'doubly_weak', label: 'Doppelt schwache' },
];

// Pre-build a lookup: categoryId -> { title, subcategories[] }
const WEAK_VERB_CATEGORIES = {};
if (weakVerbTables?.categories) {
  for (const cat of weakVerbTables.categories) {
    WEAK_VERB_CATEGORIES[cat.id] = cat;
  }
}

// ───────────────────────── helpers ───────────────────────────────

/** Strip diacritics (tashkeel) for lenient comparison. */
function stripDiacritics(s) {
  return s.replace(/[\u064B-\u0652]/g, '').replace(/\s+/g, '').trim();
}

/** Look up a verb form object by Roman numeral string. */
function getFormData(formId) {
  return morphologyTables.verbForms.find((vf) => vf.form === formId) || null;
}

/** Format seconds as mm:ss */
function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Look up a weak verb subcategory by its id. */
function getWeakSubcategory(categoryId, subId) {
  const cat = WEAK_VERB_CATEGORIES[categoryId];
  if (!cat) return null;
  return cat.subcategories?.find((s) => s.id === subId) || null;
}

/** Get available subcategories for a weak verb category. */
function getWeakSubOptions(categoryId) {
  const cat = WEAK_VERB_CATEGORIES[categoryId];
  if (!cat || !cat.subcategories) return [];
  return cat.subcategories.map((s) => ({
    value: s.id,
    label: s.title,
    root: s.exampleRoot || '',
    meaning: s.exampleMeaning || '',
  }));
}

// ───────────────────────── styles ────────────────────────────────

const S = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-ui)',
  },
  header: {
    padding: '24px 32px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  backBtn: {
    padding: '6px 14px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-hover)',
    color: 'var(--text-primary)',
    fontWeight: 600,
    fontSize: '0.9rem',
    border: '1px solid var(--border)',
    cursor: 'pointer',
  },
  headerTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--text-heading)',
  },
  body: {
    padding: '28px 32px',
    maxWidth: 960,
    width: '100%',
    margin: '0 auto',
    flex: 1,
  },

  /* Setup */
  setupCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '28px 32px',
    maxWidth: 560,
    margin: '0 auto',
  },
  setupTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--accent-teal)',
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    display: 'block',
    fontWeight: 600,
    fontSize: '0.92rem',
    color: 'var(--text-secondary)',
    marginBottom: 6,
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
  },
  radioRow: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: '0.93rem',
    cursor: 'pointer',
    color: 'var(--text-primary)',
  },
  startBtnRow: {
    display: 'flex',
    gap: 12,
    marginTop: 24,
  },
  startBtn: {
    padding: '10px 28px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'var(--accent-teal)',
    color: '#fff',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
  },
  startBtnAlt: {
    padding: '10px 28px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--accent-teal)',
    background: 'transparent',
    color: 'var(--accent-teal)',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
  },

  /* Drill */
  drillInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  drillBadge: {
    padding: '4px 14px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--accent-teal-bg)',
    color: 'var(--accent-teal)',
    fontWeight: 600,
    fontSize: '0.88rem',
  },
  timer: (urgent) => ({
    padding: '4px 14px',
    borderRadius: 'var(--radius-sm)',
    background: urgent ? 'var(--incorrect-bg)' : 'var(--bg-secondary)',
    color: urgent ? 'var(--incorrect)' : 'var(--text-secondary)',
    fontWeight: 600,
    fontSize: '0.92rem',
    fontVariantNumeric: 'tabular-nums',
  }),
  tenseSection: {
    marginBottom: 28,
  },
  tenseTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--accent-teal)',
    marginBottom: 12,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    border: '1px solid var(--border)',
  },
  th: {
    padding: '10px 14px',
    textAlign: 'left',
    fontWeight: 600,
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border)',
  },
  thArabic: {
    textAlign: 'right',
    direction: 'rtl',
  },
  td: {
    padding: '6px 10px',
    borderBottom: '1px solid var(--border)',
    fontSize: '0.92rem',
    verticalAlign: 'middle',
  },
  tdLabel: {
    fontWeight: 500,
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap',
    width: '40%',
  },
  cellResult: (correct) => ({
    background: correct ? 'var(--correct-bg)' : 'var(--incorrect-bg)',
  }),
  input: {
    width: '100%',
    padding: '6px 10px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '1.1rem',
    fontFamily: 'var(--font-arabic, "Amiri", "Scheherazade New", serif)',
    direction: 'rtl',
    textAlign: 'right',
  },
  inputChecked: (correct) => ({
    width: '100%',
    padding: '6px 10px',
    borderRadius: 'var(--radius-sm)',
    border: correct ? '2px solid var(--correct)' : '2px solid var(--incorrect)',
    background: correct ? 'var(--correct-bg)' : 'var(--incorrect-bg)',
    color: 'var(--text-primary)',
    fontSize: '1.1rem',
    fontFamily: 'var(--font-arabic, "Amiri", "Scheherazade New", serif)',
    direction: 'rtl',
    textAlign: 'right',
  }),
  correctAnswer: {
    fontSize: '0.88rem',
    color: 'var(--correct)',
    marginTop: 2,
    direction: 'rtl',
    textAlign: 'right',
    fontFamily: 'var(--font-arabic, "Amiri", "Scheherazade New", serif)',
  },
  btnRow: {
    display: 'flex',
    gap: 12,
    marginTop: 20,
    flexWrap: 'wrap',
  },
  primaryBtn: {
    padding: '10px 24px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'var(--accent-teal)',
    color: '#fff',
    fontWeight: 700,
    fontSize: '0.95rem',
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '10px 24px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    background: 'var(--bg-hover)',
    color: 'var(--text-primary)',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
  },

  /* Score */
  scoreBox: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px 28px',
    marginTop: 20,
    textAlign: 'center',
  },
  scoreValue: (pct) => ({
    fontSize: '2.2rem',
    fontWeight: 800,
    color: pct >= 80 ? 'var(--correct)' : pct >= 50 ? 'var(--accent-gold)' : 'var(--incorrect)',
    marginBottom: 4,
  }),
  scoreLabel: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
  },

  /* Random drill */
  randomCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '28px 32px',
    maxWidth: 600,
    margin: '0 auto',
    textAlign: 'center',
  },
  randomPrompt: {
    fontSize: '1.05rem',
    color: 'var(--text-primary)',
    marginBottom: 8,
    lineHeight: 1.6,
  },
  randomPromptArabic: {
    fontSize: '1.5rem',
    color: 'var(--accent-teal)',
    marginBottom: 20,
    fontFamily: 'var(--font-arabic, "Amiri", "Scheherazade New", serif)',
    direction: 'rtl',
  },
  randomInput: {
    width: '100%',
    maxWidth: 340,
    padding: '10px 16px',
    borderRadius: 'var(--radius-sm)',
    border: '2px solid var(--border)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '1.3rem',
    fontFamily: 'var(--font-arabic, "Amiri", "Scheherazade New", serif)',
    direction: 'rtl',
    textAlign: 'center',
    margin: '0 auto',
    display: 'block',
  },
  randomFeedback: (correct) => ({
    marginTop: 16,
    padding: '12px 20px',
    borderRadius: 'var(--radius-sm)',
    background: correct ? 'var(--correct-bg)' : 'var(--incorrect-bg)',
    color: correct ? 'var(--correct)' : 'var(--incorrect)',
    fontWeight: 600,
    fontSize: '1rem',
  }),
  randomScore: {
    marginTop: 16,
    color: 'var(--text-secondary)',
    fontSize: '0.92rem',
  },
  kbToggle: {
    padding: '6px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    background: 'var(--bg-hover)',
    color: 'var(--text-primary)',
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: 'pointer',
    marginTop: 12,
  },
  kbWrap: {
    marginTop: 12,
  },
};

// ═════════════════════════════════════════════════════════════════
//  Component
// ═════════════════════════════════════════════════════════════════

export default function ParadigmDrill({ onBack }) {

  // ─── setup state ───
  const [screen, setScreen] = useState('setup'); // 'setup' | 'table' | 'random' | 'results'
  const [verbType, setVerbType] = useState('regular'); // 'regular' | 'hollow' | 'defective' | etc.
  const [selectedForm, setSelectedForm] = useState('I');
  const [selectedWeakSub, setSelectedWeakSub] = useState(''); // subcategory id for weak verbs
  const [selectedTense, setSelectedTense] = useState('both');   // 'perfect' | 'imperfect' | 'both'
  const [selectedVoice, setSelectedVoice] = useState('active'); // 'active' | 'passive' | 'both'
  const [timerSeconds, setTimerSeconds] = useState(0);

  // ─── drill state (table mode) ───
  const [answers, setAnswers] = useState({});  // { 'perfect_3ms': 'userInput', ... }
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState(null); // { correct, total, details }

  // ─── drill state (random mode) ───
  const [randomQueue, setRandomQueue] = useState([]);
  const [randomIdx, setRandomIdx] = useState(0);
  const [randomInput, setRandomInput] = useState('');
  const [randomFeedback, setRandomFeedback] = useState(null); // { correct, expected }
  const [randomScore, setRandomScore] = useState({ correct: 0, total: 0 });

  // ─── timer ───
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  // ─── keyboard ───
  const [kbVisible, setKbVisible] = useState(false);
  const [activeInputKey, setActiveInputKey] = useState(null);
  const inputRefs = useRef({});
  const randomInputRef = useRef(null);

  // ─── timer logic ───
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          // Auto-check when time runs out
          if (screen === 'table' && !checked) {
            handleCheck();
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft > 0, screen]);

  // ─── resolve which tenses to drill ───
  function getActiveTenses() {
    if (selectedTense === 'both') return ['perfect', 'imperfect'];
    return [selectedTense];
  }

  // ─── resolve reference data for a given form/tense/voice ───
  function getReference(formId, tense) {
    const fd = getFormData(formId);
    if (!fd) return null;
    // Active voice: direct from data
    return fd[tense] || null;
  }

  // ─── build passive conjugation programmatically from the active pattern ───
  // The JSON only stores active conjugations. For passive, we apply the vowel
  // transformation rules documented in passiveTransformation.
  // The passive 3ms pattern for each form is stored in passiveTransformation.formExamples.
  // Since full passive paradigms are not in the data, we derive them by applying
  // the systematic vowel changes to the active pattern consonant skeleton.
  //
  // However, Forms VII and IX have no passive at all.
  function getPassiveReference(formId, tense) {
    const noPassiveForms = ['VII', 'IX'];
    if (noPassiveForms.includes(formId)) return null;

    const fd = getFormData(formId);
    if (!fd || !fd[tense]) return null;

    const active = fd[tense];
    const result = {};

    // For each person, apply the passive vowel transformation.
    // Perfect passive: first radical vowel -> damma, pre-final vowel -> kasra
    // Imperfect passive: prefix vowel -> damma, stem vowel -> fatha
    for (const key of PERSON_ORDER) {
      if (!active[key]) continue;
      result[key] = applyPassiveTransform(active[key], tense, formId);
    }
    return result;
  }

  /** Apply passive vowel transformation to an active Arabic verb form. */
  function applyPassiveTransform(activeForm, tense, formId) {
    const chars = [...activeForm];

    if (tense === 'perfect') {
      return applyPerfectPassive(chars, formId);
    } else {
      return applyImperfectPassive(chars, formId);
    }
  }

  function applyPerfectPassive(chars, formId) {
    const FATHA  = '\u064E';
    const DAMMA  = '\u064F';
    const KASRA  = '\u0650';

    // Strategy: replace fatha on first consonant with damma,
    // replace fatha/damma on pre-final stem vowel with kasra.
    // For forms with prefixes (V, VI: ta-; IV: hamza; VIII: ifta; X: ista):
    // apply rules according to form-specific patterns.

    const result = [...chars];

    // Find positions of all vowel diacritics
    const vowelPositions = [];
    for (let i = 0; i < result.length; i++) {
      if (result[i] === FATHA || result[i] === DAMMA || result[i] === KASRA) {
        vowelPositions.push(i);
      }
    }

    if (formId === 'I') {
      // faʿala -> fuʿila: first fatha->damma, second fatha->kasra
      if (vowelPositions.length >= 2) {
        result[vowelPositions[0]] = DAMMA;
        result[vowelPositions[1]] = KASRA;
      }
    } else if (formId === 'II') {
      // fa''ala -> fu''ila
      if (vowelPositions.length >= 2) {
        result[vowelPositions[0]] = DAMMA;
        // find the vowel after shadda/second radical
        if (vowelPositions.length >= 3) {
          result[vowelPositions[2]] = KASRA;
        } else {
          result[vowelPositions[1]] = KASRA;
        }
      }
    } else if (formId === 'III') {
      // faaʿala -> fuuʿila: first fatha->damma, alif becomes waw conceptually
      // In pattern: فَاعَلَ -> فُوعِلَ
      // Replace first fatha with damma, replace ا with و, change vowel before last radical to kasra
      for (let i = 0; i < result.length; i++) {
        if (result[i] === '\u0627' && i > 0) { // alif (not initial)
          // Check if preceded by a consonant with fatha -> change fatha to damma, alif to waw
          if (i >= 2 && result[i - 1] === FATHA) {
            result[i - 1] = DAMMA;
          } else if (i >= 1 && result[i - 1] === FATHA) {
            result[i - 1] = DAMMA;
          }
          result[i] = '\u0648'; // waw
          break;
        }
      }
      // Change the pre-final fatha to kasra
      const newVowelPositions = [];
      for (let i = 0; i < result.length; i++) {
        if (result[i] === FATHA || result[i] === DAMMA || result[i] === KASRA) {
          newVowelPositions.push(i);
        }
      }
      // The vowel on the 'ayn (second radical) should become kasra
      if (newVowelPositions.length >= 3) {
        result[newVowelPositions[2]] = KASRA;
      }
    } else if (formId === 'IV') {
      // af'ala -> uf'ila: hamza prefix vowel->damma, stem vowel->kasra
      if (vowelPositions.length >= 1) {
        result[vowelPositions[0]] = DAMMA;
      }
      if (vowelPositions.length >= 3) {
        result[vowelPositions[2]] = KASRA;
      } else if (vowelPositions.length >= 2) {
        result[vowelPositions[1]] = KASRA;
      }
    } else if (formId === 'V') {
      // tafa''ala -> tufu''ila
      if (vowelPositions.length >= 1) {
        result[vowelPositions[0]] = DAMMA;
      }
      if (vowelPositions.length >= 2) {
        result[vowelPositions[1]] = DAMMA;
      }
      // kasra on pre-final
      if (vowelPositions.length >= 4) {
        result[vowelPositions[3]] = KASRA;
      } else if (vowelPositions.length >= 3) {
        result[vowelPositions[2]] = KASRA;
      }
    } else if (formId === 'VI') {
      // tafaaʿala -> tufuuʿila
      if (vowelPositions.length >= 1) {
        result[vowelPositions[0]] = DAMMA;
      }
      // Replace alif with waw (same as III but with ta- prefix)
      for (let i = 0; i < result.length; i++) {
        if (result[i] === '\u0627' && i > 2) {
          if (i >= 2 && result[i - 1] === FATHA) {
            result[i - 1] = DAMMA;
          }
          result[i] = '\u0648';
          break;
        }
      }
      const newVP = [];
      for (let i = 0; i < result.length; i++) {
        if (result[i] === FATHA || result[i] === DAMMA || result[i] === KASRA) {
          newVP.push(i);
        }
      }
      if (newVP.length >= 4) {
        result[newVP[3]] = KASRA;
      }
    } else if (formId === 'VIII') {
      // iftaʿala -> uftuʿila
      // Change first vowel (on alif-hamza-wasl) to damma
      if (vowelPositions.length >= 1) {
        result[vowelPositions[0]] = DAMMA;
      }
      // Change second vowel to damma (on ta)
      if (vowelPositions.length >= 2) {
        result[vowelPositions[1]] = DAMMA;
      }
      // Change pre-final to kasra
      if (vowelPositions.length >= 3) {
        result[vowelPositions[2]] = KASRA;
      }
    } else if (formId === 'X') {
      // istaf'ala -> ustuf'ila
      if (vowelPositions.length >= 1) {
        result[vowelPositions[0]] = DAMMA;
      }
      if (vowelPositions.length >= 2) {
        result[vowelPositions[1]] = DAMMA;
      }
      if (vowelPositions.length >= 4) {
        result[vowelPositions[3]] = KASRA;
      } else if (vowelPositions.length >= 3) {
        result[vowelPositions[2]] = KASRA;
      }
    }

    return result.join('');
  }

  function applyImperfectPassive(chars, formId) {
    const FATHA  = '\u064E';
    const DAMMA  = '\u064F';
    const KASRA  = '\u0650';

    const result = [...chars];

    // Find all short vowel positions
    const vowelPositions = [];
    for (let i = 0; i < result.length; i++) {
      if (result[i] === FATHA || result[i] === DAMMA || result[i] === KASRA) {
        vowelPositions.push(i);
      }
    }

    // Imperfect passive rule: prefix vowel -> damma, last stem vowel before final -> fatha
    // For most forms: first vowel (on prefix ya/ta/na/a) -> damma is already there for II-IV,
    // but for I,V,VI it's fatha -> damma. Then the kasra on the stem -> fatha.

    if (vowelPositions.length >= 1) {
      result[vowelPositions[0]] = DAMMA;
    }

    // For Form I: yaf'alu -> yuf'alu (prefix->damma, stem vowel->fatha)
    // For Form V/VI: yatafa''alu -> yutafa''alu (prefix->damma)
    // The last non-final vowel (before endings) should become fatha.

    if (formId === 'I') {
      // yaf'alu -> yuf'alu: first->damma, second stays fatha or ->fatha
      if (vowelPositions.length >= 2) {
        result[vowelPositions[1]] = FATHA;
      }
    } else if (formId === 'II') {
      // yufa''ilu -> yufa''alu: the kasra after shadda -> fatha
      if (vowelPositions.length >= 3) {
        result[vowelPositions[2]] = FATHA;
      }
    } else if (formId === 'III') {
      // yufaaʿilu -> yufaaʿalu
      if (vowelPositions.length >= 3) {
        result[vowelPositions[2]] = FATHA;
      }
    } else if (formId === 'IV') {
      // yuf'ilu -> yuf'alu
      if (vowelPositions.length >= 2) {
        result[vowelPositions[1]] = FATHA;
      }
    } else if (formId === 'V') {
      // yatafa''alu -> yutafa''alu: prefix->damma, rest stays
      // Actually: the active is yatafa''alu, passive is yutafa''alu
      // Just change prefix vowel to damma (already done above)
      // The stem vowel (kasra after shadda in active) should be fatha
      if (vowelPositions.length >= 4) {
        result[vowelPositions[3]] = FATHA;
      }
    } else if (formId === 'VI') {
      // yatafaaʿalu -> yutafaaʿalu
      if (vowelPositions.length >= 4) {
        result[vowelPositions[3]] = FATHA;
      }
    } else if (formId === 'VIII') {
      // yaftaʿilu -> yuftaʿalu
      if (vowelPositions.length >= 3) {
        result[vowelPositions[2]] = FATHA;
      }
    } else if (formId === 'X') {
      // yastaf'ilu -> yustaf'alu
      if (vowelPositions.length >= 1) {
        result[vowelPositions[0]] = DAMMA;
      }
      if (vowelPositions.length >= 3) {
        result[vowelPositions[2]] = FATHA;
      }
    }

    return result.join('');
  }

  // ─── Resolve weak verb conjugation data ───
  function getWeakReference(tense) {
    if (verbType === 'regular') return null;
    const sub = getWeakSubcategory(verbType, selectedWeakSub);
    if (!sub) return null;
    return sub[tense] || null;
  }

  // ─── Build the full reference map for the current drill ───
  function buildReferenceMap() {
    const tenses = getActiveTenses();
    const map = {};

    if (verbType !== 'regular') {
      // Weak verb mode: only active voice (weak verb tables don't include passive)
      for (const tense of tenses) {
        const ref = getWeakReference(tense);
        if (!ref) continue;
        for (const person of PERSON_ORDER) {
          if (!ref[person]) continue;
          const key = `active_${tense}_${person}`;
          map[key] = ref[person];
        }
      }
      return map;
    }

    // Regular verb mode (existing behavior)
    const voices = selectedVoice === 'both' ? ['active', 'passive'] : [selectedVoice];

    for (const tense of tenses) {
      for (const voice of voices) {
        const ref = voice === 'active'
          ? getReference(selectedForm, tense)
          : getPassiveReference(selectedForm, tense);
        if (!ref) continue;
        for (const person of PERSON_ORDER) {
          if (!ref[person]) continue;
          const key = `${voice}_${tense}_${person}`;
          map[key] = ref[person];
        }
      }
    }
    return map;
  }

  // ═════════════════════════════════════════════════════════════════
  //  Start drill (table mode)
  // ═════════════════════════════════════════════════════════════════
  function startTableDrill() {
    setAnswers({});
    setChecked(false);
    setResults(null);
    setKbVisible(false);
    setActiveInputKey(null);
    if (timerSeconds > 0) setTimeLeft(timerSeconds);
    else setTimeLeft(0);
    setScreen('table');
  }

  // ═════════════════════════════════════════════════════════════════
  //  Start drill (random mode)
  // ═════════════════════════════════════════════════════════════════
  function startRandomDrill() {
    const tenses = getActiveTenses();
    const queue = [];

    if (verbType !== 'regular') {
      // Weak verb mode
      const sub = getWeakSubcategory(verbType, selectedWeakSub);
      for (const tense of tenses) {
        const ref = sub?.[tense];
        if (!ref) continue;
        for (const person of PERSON_ORDER) {
          if (!ref[person]) continue;
          queue.push({
            form: sub.title || selectedWeakSub,
            tense,
            voice: 'active',
            person,
            expected: ref[person],
          });
        }
      }
    } else {
      // Regular verb mode (existing behavior)
      const voices = selectedVoice === 'both' ? ['active', 'passive'] : [selectedVoice];
      const noPassiveForms = ['VII', 'IX'];

      for (const tense of tenses) {
        for (const voice of voices) {
          if (voice === 'passive' && noPassiveForms.includes(selectedForm)) continue;
          for (const person of PERSON_ORDER) {
            const ref = voice === 'active'
              ? getReference(selectedForm, tense)
              : getPassiveReference(selectedForm, tense);
            if (!ref || !ref[person]) continue;
            queue.push({
              form: `Form ${selectedForm}`,
              tense,
              voice,
              person,
              expected: ref[person],
            });
          }
        }
      }
    }

    // Shuffle
    for (let i = queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }

    setRandomQueue(queue);
    setRandomIdx(0);
    setRandomInput('');
    setRandomFeedback(null);
    setRandomScore({ correct: 0, total: 0 });
    setKbVisible(false);
    if (timerSeconds > 0) setTimeLeft(timerSeconds);
    else setTimeLeft(0);
    setScreen('random');
  }

  // ═════════════════════════════════════════════════════════════════
  //  Check table answers
  // ═════════════════════════════════════════════════════════════════
  const handleCheck = useCallback(() => {
    const refMap = buildReferenceMap();
    let correct = 0;
    let total = 0;
    const details = {};

    for (const [key, expected] of Object.entries(refMap)) {
      total++;
      const userVal = (answers[key] || '').trim();
      const match = stripDiacritics(userVal) === stripDiacritics(expected);
      if (match) correct++;
      details[key] = { userVal, expected, correct: match };
    }

    setResults({ correct, total, details });
    setChecked(true);
    if (timerRef.current) clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, selectedForm, selectedTense, selectedVoice, verbType, selectedWeakSub]);

  // Re-bind the auto-check on timer expiry
  useEffect(() => {
    // intentionally empty; the timer effect calls handleCheck via ref
  }, [handleCheck]);

  // ─── random mode: check single answer ───
  function handleRandomCheck() {
    if (randomIdx >= randomQueue.length) return;
    const item = randomQueue[randomIdx];
    const userVal = randomInput.trim();
    const match = stripDiacritics(userVal) === stripDiacritics(item.expected);
    setRandomFeedback({ correct: match, expected: item.expected });
    setRandomScore((prev) => ({
      correct: prev.correct + (match ? 1 : 0),
      total: prev.total + 1,
    }));
  }

  function handleRandomNext() {
    setRandomFeedback(null);
    setRandomInput('');
    if (randomIdx + 1 >= randomQueue.length) {
      setScreen('results');
    } else {
      setRandomIdx((i) => i + 1);
    }
  }

  // ─── keyboard integration ───
  function handleKbInput(char) {
    if (screen === 'random') {
      setRandomInput((prev) => prev + char);
      return;
    }
    if (!activeInputKey) return;
    setAnswers((prev) => ({
      ...prev,
      [activeInputKey]: (prev[activeInputKey] || '') + char,
    }));
  }

  function handleKbBackspace() {
    if (screen === 'random') {
      setRandomInput((prev) => prev.slice(0, -1));
      return;
    }
    if (!activeInputKey) return;
    setAnswers((prev) => ({
      ...prev,
      [activeInputKey]: (prev[activeInputKey] || '').slice(0, -1),
    }));
  }

  function handleKbClear() {
    if (screen === 'random') {
      setRandomInput('');
      return;
    }
    if (!activeInputKey) return;
    setAnswers((prev) => ({ ...prev, [activeInputKey]: '' }));
  }

  // ═════════════════════════════════════════════════════════════════
  //  RENDER: Setup screen
  // ═════════════════════════════════════════════════════════════════
  function renderSetup() {
    return (
      <div style={S.body}>
        <div style={S.setupCard}>
          <div style={S.setupTitle}>Paradigmen-Drill konfigurieren</div>

          {/* Verb type selection */}
          <div style={S.fieldGroup}>
            <label style={S.fieldLabel}>Verbtyp</label>
            <select
              style={S.select}
              value={verbType}
              onChange={(e) => {
                const newType = e.target.value;
                setVerbType(newType);
                // Auto-select first subcategory when switching to a weak verb type
                if (newType !== 'regular') {
                  const subs = getWeakSubOptions(newType);
                  setSelectedWeakSub(subs.length > 0 ? subs[0].value : '');
                  setSelectedVoice('active'); // weak verbs only have active voice data
                }
              }}
            >
              {VERB_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Form selection (regular verbs) */}
          {verbType === 'regular' && (
            <div style={S.fieldGroup}>
              <label style={S.fieldLabel}>Verbform</label>
              <select
                style={S.select}
                value={selectedForm}
                onChange={(e) => setSelectedForm(e.target.value)}
              >
                {FORM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ({opt.arabic})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Weak verb subcategory/root selection */}
          {verbType !== 'regular' && (() => {
            const subOptions = getWeakSubOptions(verbType);
            return (
              <div style={S.fieldGroup}>
                <label style={S.fieldLabel}>Beispielwurzel</label>
                <select
                  style={S.select}
                  value={selectedWeakSub}
                  onChange={(e) => setSelectedWeakSub(e.target.value)}
                >
                  {subOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} — {opt.root} ({opt.meaning})
                    </option>
                  ))}
                </select>
                {/* Show quranic examples if available */}
                {(() => {
                  const sub = getWeakSubcategory(verbType, selectedWeakSub);
                  if (!sub?.quranicExamples?.length) return null;
                  return (
                    <div style={{
                      marginTop: 8, padding: '8px 12px',
                      background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)', fontSize: '0.82rem',
                      color: 'var(--text-secondary)',
                    }}>
                      <span style={{ fontWeight: 600 }}>Koranische Belege: </span>
                      {sub.quranicExamples.slice(0, 3).map((ex, i) => (
                        <span key={i} style={{ marginRight: 12 }}>
                          <span className="arabic" dir="rtl" style={{ color: 'var(--accent-teal)' }}>{ex.word}</span>
                          {' '}({ex.location})
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </div>
            );
          })()}

          {/* Tense */}
          <div style={S.fieldGroup}>
            <label style={S.fieldLabel}>Tempus</label>
            <div style={S.radioRow}>
              {[
                { value: 'perfect', label: 'Perfekt' },
                { value: 'imperfect', label: 'Imperfekt' },
                { value: 'both', label: 'Beide' },
              ].map((opt) => (
                <label key={opt.value} style={S.radioLabel}>
                  <input
                    type="radio"
                    name="tense"
                    value={opt.value}
                    checked={selectedTense === opt.value}
                    onChange={() => setSelectedTense(opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Voice (only for regular verbs) */}
          {verbType === 'regular' && (
            <div style={S.fieldGroup}>
              <label style={S.fieldLabel}>Genus Verbi</label>
              <div style={S.radioRow}>
                {[
                  { value: 'active', label: 'Aktiv' },
                  { value: 'passive', label: 'Passiv' },
                  { value: 'both', label: 'Beide' },
                ].map((opt) => (
                  <label key={opt.value} style={S.radioLabel}>
                    <input
                      type="radio"
                      name="voice"
                      value={opt.value}
                      checked={selectedVoice === opt.value}
                      onChange={() => setSelectedVoice(opt.value)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Timer */}
          <div style={S.fieldGroup}>
            <label style={S.fieldLabel}>Zeitlimit</label>
            <div style={S.radioRow}>
              {TIMER_OPTIONS.map((opt) => (
                <label key={opt.value} style={S.radioLabel}>
                  <input
                    type="radio"
                    name="timer"
                    value={opt.value}
                    checked={timerSeconds === opt.value}
                    onChange={() => setTimerSeconds(opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Start buttons */}
          <div style={S.startBtnRow}>
            <button style={S.startBtn} onClick={startTableDrill}>
              Tabelle ausfüllen
            </button>
            <button style={S.startBtnAlt} onClick={startRandomDrill}>
              Zufalls-Modus
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════
  //  RENDER: Table drill
  // ═════════════════════════════════════════════════════════════════
  function renderTableDrill() {
    const formData = getFormData(selectedForm);
    const tenses = getActiveTenses();
    const isWeak = verbType !== 'regular';
    const voices = isWeak ? ['active'] : (selectedVoice === 'both' ? ['active', 'passive'] : [selectedVoice]);
    const noPassiveForms = ['VII', 'IX'];
    const pct = results && results.total > 0 ? Math.round((results.correct / results.total) * 100) : 0;
    const weakSub = isWeak ? getWeakSubcategory(verbType, selectedWeakSub) : null;

    return (
      <div style={S.body}>
        {/* Info bar */}
        <div style={S.drillInfo}>
          <span style={S.drillBadge}>
            {isWeak ? (
              <>
                {weakSub?.title || selectedWeakSub} &mdash;{' '}
                <span className="arabic" dir="rtl">{weakSub?.exampleRoot || ''}</span>
              </>
            ) : (
              <>
                Form {selectedForm} &mdash;{' '}
                <span className="arabic" dir="rtl">{formData?.pattern.arabic}</span>
              </>
            )}
          </span>
          {timeLeft > 0 && !checked && (
            <span style={S.timer(timeLeft < 30)}>{fmtTime(timeLeft)}</span>
          )}
        </div>

        {/* Tables per voice/tense */}
        {voices.map((voice) => {
          if (voice === 'passive' && noPassiveForms.includes(selectedForm)) {
            return (
              <div key={voice} style={S.tenseSection}>
                <div style={S.tenseTitle}>
                  Passiv &mdash; nicht verfügbar für Form {selectedForm}
                </div>
              </div>
            );
          }

          return tenses.map((tense) => {
            const voiceLabel = voice === 'active' ? 'Aktiv' : 'Passiv';

            return (
              <div key={`${voice}_${tense}`} style={S.tenseSection}>
                <div style={S.tenseTitle}>
                  {TENSE_LABELS[tense]} &mdash; {voiceLabel}
                </div>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Person / Numerus</th>
                      <th style={{ ...S.th, ...S.thArabic }}>Antwort</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PERSON_ORDER.map((person) => {
                      const cellKey = `${voice}_${tense}_${person}`;
                      const detail = results?.details?.[cellKey];
                      const rowBg = detail
                        ? S.cellResult(detail.correct)
                        : {};

                      return (
                        <tr key={person} style={rowBg}>
                          <td style={{ ...S.td, ...S.tdLabel }}>
                            {PERSON_LABELS[person]}
                          </td>
                          <td style={S.td}>
                            {!checked ? (
                              <input
                                ref={(el) => { inputRefs.current[cellKey] = el; }}
                                className="arabic"
                                dir="rtl"
                                style={S.input}
                                value={answers[cellKey] || ''}
                                onChange={(e) =>
                                  setAnswers((prev) => ({
                                    ...prev,
                                    [cellKey]: e.target.value,
                                  }))
                                }
                                onFocus={() => setActiveInputKey(cellKey)}
                                placeholder="..."
                              />
                            ) : (
                              <div>
                                <div
                                  className="arabic"
                                  dir="rtl"
                                  style={S.inputChecked(detail?.correct)}
                                >
                                  {answers[cellKey] || '\u2014'}
                                </div>
                                {detail && !detail.correct && (
                                  <div style={S.correctAnswer} className="arabic" dir="rtl">
                                    {detail.expected}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          });
        })}

        {/* Score display */}
        {checked && results && (
          <div style={S.scoreBox}>
            <div style={S.scoreValue(pct)}>
              {results.correct} / {results.total}
            </div>
            <div style={S.scoreLabel}>
              {pct}% korrekt
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={S.btnRow}>
          {!checked ? (
            <>
              <button style={S.primaryBtn} onClick={handleCheck}>
                Prüfen
              </button>
              <button
                style={S.kbToggle}
                onClick={() => setKbVisible((v) => !v)}
              >
                {kbVisible ? 'Tastatur ausblenden' : 'Arabische Tastatur'}
              </button>
            </>
          ) : (
            <>
              <button style={S.primaryBtn} onClick={startTableDrill}>
                Nochmal
              </button>
              <button style={S.secondaryBtn} onClick={() => setScreen('setup')}>
                Einstellungen
              </button>
            </>
          )}
        </div>

        {/* On-screen keyboard */}
        {kbVisible && !checked && (
          <div style={S.kbWrap}>
            <ArabicKeyboard
              visible={kbVisible}
              onToggle={() => setKbVisible((v) => !v)}
              onInput={handleKbInput}
              onBackspace={handleKbBackspace}
              onClear={handleKbClear}
              inputRef={activeInputKey ? { current: inputRefs.current[activeInputKey] } : undefined}
            />
          </div>
        )}
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════
  //  RENDER: Random drill
  // ═════════════════════════════════════════════════════════════════
  function renderRandomDrill() {
    if (randomQueue.length === 0) {
      return (
        <div style={S.body}>
          <div style={S.randomCard}>
            <p style={S.randomPrompt}>Keine Aufgaben verfügbar für diese Auswahl.</p>
            <button style={S.secondaryBtn} onClick={() => setScreen('setup')}>
              Zurück
            </button>
          </div>
        </div>
      );
    }

    const item = randomQueue[randomIdx];
    const voiceLabel = item.voice === 'active' ? 'Aktiv' : 'Passiv';
    const progress = `${randomIdx + 1} / ${randomQueue.length}`;

    return (
      <div style={S.body}>
        <div style={S.randomCard}>
          {/* Progress & timer */}
          <div style={{ ...S.drillInfo, justifyContent: 'center', marginBottom: 16 }}>
            <span style={S.drillBadge}>{progress}</span>
            {timeLeft > 0 && (
              <span style={S.timer(timeLeft < 30)}>{fmtTime(timeLeft)}</span>
            )}
          </div>

          {/* Question */}
          <p style={S.randomPrompt}>
            {item.form}, {TENSE_LABELS[item.tense]}, {voiceLabel}
          </p>
          <p style={S.randomPrompt}>
            <strong>{PERSON_LABELS[item.person]}</strong> = ?
          </p>

          {/* Input */}
          <input
            ref={randomInputRef}
            className="arabic"
            dir="rtl"
            style={S.randomInput}
            value={randomInput}
            onChange={(e) => setRandomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (randomFeedback) handleRandomNext();
                else handleRandomCheck();
              }
            }}
            placeholder="..."
            disabled={!!randomFeedback}
            autoFocus
          />

          {/* Feedback */}
          {randomFeedback && (
            <div style={S.randomFeedback(randomFeedback.correct)}>
              {randomFeedback.correct
                ? 'Richtig!'
                : (
                  <>
                    Falsch. Richtige Antwort:{' '}
                    <span className="arabic" dir="rtl">{randomFeedback.expected}</span>
                  </>
                )}
            </div>
          )}

          {/* Score */}
          <div style={S.randomScore}>
            Punkte: {randomScore.correct} / {randomScore.total}
            {randomScore.total > 0 && (
              <> ({Math.round((randomScore.correct / randomScore.total) * 100)}%)</>
            )}
          </div>

          {/* Buttons */}
          <div style={{ ...S.btnRow, justifyContent: 'center', marginTop: 20 }}>
            {!randomFeedback ? (
              <button style={S.primaryBtn} onClick={handleRandomCheck}>
                Prüfen
              </button>
            ) : (
              <button style={S.primaryBtn} onClick={handleRandomNext}>
                {randomIdx + 1 >= randomQueue.length ? 'Ergebnis anzeigen' : 'Weiter'}
              </button>
            )}
            <button
              style={S.kbToggle}
              onClick={() => setKbVisible((v) => !v)}
            >
              {kbVisible ? 'Tastatur ausblenden' : 'Arabische Tastatur'}
            </button>
          </div>

          {/* On-screen keyboard */}
          {kbVisible && (
            <div style={S.kbWrap}>
              <ArabicKeyboard
                visible={kbVisible}
                onToggle={() => setKbVisible((v) => !v)}
                onInput={handleKbInput}
                onBackspace={handleKbBackspace}
                onClear={handleKbClear}
                inputRef={randomInputRef}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════
  //  RENDER: Results screen (random mode final)
  // ═════════════════════════════════════════════════════════════════
  function renderResults() {
    const pct = randomScore.total > 0
      ? Math.round((randomScore.correct / randomScore.total) * 100)
      : 0;

    return (
      <div style={S.body}>
        <div style={S.scoreBox}>
          <div style={S.scoreValue(pct)}>
            {randomScore.correct} / {randomScore.total}
          </div>
          <div style={S.scoreLabel}>
            {pct}% korrekt
          </div>
        </div>
        <div style={{ ...S.btnRow, justifyContent: 'center', marginTop: 24 }}>
          <button style={S.primaryBtn} onClick={startRandomDrill}>
            Nochmal (Zufall)
          </button>
          <button style={S.secondaryBtn} onClick={startTableDrill}>
            Tabellen-Modus
          </button>
          <button style={S.secondaryBtn} onClick={() => setScreen('setup')}>
            Einstellungen
          </button>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════
  //  RENDER: Main
  // ═════════════════════════════════════════════════════════════════
  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <button style={S.backBtn} onClick={onBack}>
          Zurück
        </button>
        <div style={S.headerTitle}>Paradigmen-Drill (Sarf)</div>
      </div>

      {/* Screen router */}
      {screen === 'setup' && renderSetup()}
      {screen === 'table' && renderTableDrill()}
      {screen === 'random' && renderRandomDrill()}
      {screen === 'results' && renderResults()}
    </div>
  );
}
