import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import morphologyData from '../data/morphology-lessons.json';
import syntaxData from '../data/syntax-lessons.js';
import brokenPluralDataBase from '../data/broken-plural-drill.json';
import brokenPluralGenerated from '../data/broken-plural-generated.json';
const brokenPluralData = {
  ...brokenPluralDataBase,
  exercises: [...(brokenPluralDataBase.exercises || []), ...(brokenPluralGenerated.exercises || [])],
};
import nominalDeclensionData from '../data/nominal-declension.json';
import ArabicKeyboard from '../components/ArabicKeyboard.jsx';
import ParadigmDrill from '../components/ParadigmDrill.jsx';
import { saveModule2Progress, loadModule2Progress } from '../utils/storage.js';

/* ================================================================
   Modul 2 — Morphologie-Dojo (Sarf) + Syntax (Nahw) & Partikeln
   Lektionen mit Lernmodus und Prüfmodus.
   >80% im Prüfmodus nötig um die nächste Lektion freizuschalten.
   ================================================================ */

// ───────────────────────────── Stufe config ─────────────────────────
const STUFE_CONFIG = {
  morphology: {
    key: 'module2_morphology_progress',
    data: morphologyData,
    label: 'Stufe 2: Morphologie',
    firstLessonId: '2.1',
  },
  syntax: {
    key: 'module2_syntax_progress',
    data: syntaxData,
    label: 'Stufe 3-4: Syntax und Partikeln',
    firstLessonId: '3.1',
  },
};

// ───────────────────────────── helpers ─────────────────────────────

// Storage key → stufe mapping for the new async storage
const KEY_TO_STUFE = {
  [STUFE_CONFIG.morphology.key]: 'morphology',
  [STUFE_CONFIG.syntax.key]: 'syntax',
};

// Async progress loading/saving using IndexedDB (via storage.js)
// The old localStorage data is automatically migrated on first load.
async function loadProgressAsync(storageKey, firstId) {
  const stufe = KEY_TO_STUFE[storageKey] || 'morphology';
  return await loadModule2Progress(stufe, firstId);
}

async function saveProgressAsync(storageKey, progress) {
  const stufe = KEY_TO_STUFE[storageKey] || 'morphology';
  await saveModule2Progress(stufe, progress);
}

function nextLessonId(currentId, lessons) {
  const idx = lessons.findIndex((l) => l.id === currentId);
  if (idx < 0 || idx >= lessons.length - 1) return null;
  return lessons[idx + 1].id;
}

// Strip optional diacritics for comparison
const normalize = (s) =>
  s
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/\s+/g, '')
    .trim();

// ───────────────────────────── styles ──────────────────────────────

const S = {
  /* ─── Page shell ─── */
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
  },
  headerTitle: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: 'var(--text-heading)',
    marginBottom: 4,
  },
  headerSub: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
  },

  /* ─── Warning banner ─── */
  warning: {
    margin: '24px 32px',
    padding: '20px 24px',
    background: 'var(--accent-gold-bg)',
    border: '1px solid var(--accent-gold)',
    borderRadius: 'var(--radius-lg)',
    color: 'var(--text-primary)',
    lineHeight: 1.7,
  },
  warningTitle: {
    fontWeight: 700,
    color: 'var(--accent-gold)',
    marginBottom: 8,
    fontSize: '1.1rem',
  },

  /* ─── Lesson grid ─── */
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 16,
    padding: '24px 32px',
  },
  card: (locked) => ({
    background: locked ? 'var(--bg-secondary)' : 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px',
    cursor: locked ? 'not-allowed' : 'pointer',
    opacity: locked ? 0.55 : 1,
    transition: 'box-shadow var(--transition), transform var(--transition)',
  }),
  cardTitle: {
    fontWeight: 600,
    fontSize: '1.05rem',
    color: 'var(--text-heading)',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  badge: (passed) => ({
    display: 'inline-block',
    marginTop: 10,
    padding: '2px 10px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.8rem',
    fontWeight: 600,
    background: passed ? 'var(--correct-bg)' : 'var(--accent-teal-bg)',
    color: passed ? 'var(--correct)' : 'var(--accent-teal)',
  }),

  /* ─── Lesson view ─── */
  lessonHeader: {
    padding: '20px 32px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    background: 'var(--bg-secondary)',
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
  tabRow: {
    display: 'flex',
    gap: 0,
    borderBottom: '2px solid var(--border)',
    padding: '0 32px',
    background: 'var(--bg-secondary)',
  },
  tab: (active) => ({
    padding: '12px 24px',
    fontWeight: 600,
    fontSize: '0.95rem',
    color: active ? 'var(--accent-teal)' : 'var(--text-secondary)',
    borderBottom: active
      ? '2px solid var(--accent-teal)'
      : '2px solid transparent',
    marginBottom: -2,
    cursor: 'pointer',
    transition: 'color var(--transition)',
    background: 'none',
  }),
  content: {
    padding: '28px 32px',
    maxWidth: 900,
    width: '100%',
    margin: '0 auto',
  },

  /* ─── Section renderers ─── */
  sectionBox: { marginBottom: 36 },
  sectionTitle: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: 'var(--accent-teal)',
    marginBottom: 14,
  },
  prose: {
    lineHeight: 1.8,
    color: 'var(--text-primary)',
    fontSize: '0.98rem',
    whiteSpace: 'pre-wrap',
  },
  exampleRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'baseline',
    padding: '10px 16px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-input)',
    marginBottom: 8,
  },
  exArabic: {
    fontFamily: 'var(--font-arabic)',
    direction: 'rtl',
    fontSize: '1.55rem',
    lineHeight: 2,
    color: 'var(--arabic-text)',
    minWidth: 120,
  },
  exTranslit: {
    fontStyle: 'italic',
    color: 'var(--text-secondary)',
    fontSize: '0.92rem',
    minWidth: 100,
  },
  exMeaning: { color: 'var(--text-primary)', fontSize: '0.92rem' },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: 8,
    fontSize: '0.92rem',
  },
  th: {
    textAlign: 'left',
    padding: '8px 12px',
    borderBottom: '2px solid var(--border)',
    color: 'var(--accent-teal)',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '8px 12px',
    borderBottom: '1px solid var(--border)',
    verticalAlign: 'top',
  },
  tdArabic: {
    fontFamily: 'var(--font-arabic)',
    direction: 'rtl',
    fontSize: '1.35rem',
    lineHeight: 1.8,
    color: 'var(--arabic-text)',
  },
  step: {
    padding: '8px 0 8px 20px',
    borderLeft: '3px solid var(--accent-gold)',
    marginBottom: 6,
    fontSize: '0.94rem',
    lineHeight: 1.6,
  },
  quranBox: {
    padding: '12px 16px',
    borderRadius: 'var(--radius)',
    background: 'var(--accent-gold-bg)',
    border: '1px solid var(--accent-gold)',
    marginBottom: 10,
  },
  quranLoc: {
    fontWeight: 700,
    color: 'var(--accent-gold)',
    fontSize: '0.85rem',
    marginBottom: 2,
  },
  quranWord: {
    fontFamily: 'var(--font-arabic)',
    direction: 'rtl',
    fontSize: '1.6rem',
    lineHeight: 2,
    color: 'var(--arabic-text)',
  },
  quranAnalysis: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    marginTop: 4,
  },

  /* ─── Test mode ─── */
  exerciseBox: {
    marginBottom: 28,
    padding: '20px 24px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
  },
  prompt: {
    fontWeight: 600,
    marginBottom: 10,
    fontSize: '1rem',
    color: 'var(--text-heading)',
  },
  promptArabic: {
    fontFamily: 'var(--font-arabic)',
    direction: 'rtl',
    fontSize: '1.6rem',
    lineHeight: 2,
    color: 'var(--arabic-text)',
    textAlign: 'right',
    marginBottom: 12,
  },
  inputRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  arabicInput: {
    fontFamily: 'var(--font-arabic)',
    direction: 'rtl',
    textAlign: 'right',
    fontSize: '1.25rem',
    padding: '8px 12px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-input)',
    color: 'var(--arabic-text)',
    width: '100%',
    maxWidth: 320,
  },
  optionBtn: (selected, correct, revealed) => {
    let bg = 'var(--bg-input)';
    let border = 'var(--border)';
    let color = 'var(--text-primary)';
    if (revealed && selected && correct) {
      bg = 'var(--correct-bg)';
      border = 'var(--correct)';
      color = 'var(--correct)';
    } else if (revealed && selected && !correct) {
      bg = 'var(--incorrect-bg)';
      border = 'var(--incorrect)';
      color = 'var(--incorrect)';
    } else if (revealed && correct) {
      bg = 'var(--correct-bg)';
      border = 'var(--correct)';
      color = 'var(--correct)';
    } else if (selected) {
      bg = 'var(--accent-teal-bg)';
      border = 'var(--accent-teal)';
      color = 'var(--accent-teal)';
    }
    return {
      display: 'block',
      width: '100%',
      textAlign: 'left',
      padding: '10px 16px',
      marginBottom: 6,
      borderRadius: 'var(--radius-sm)',
      background: bg,
      border: `1px solid ${border}`,
      color,
      fontSize: '0.95rem',
      cursor: revealed ? 'default' : 'pointer',
      transition: 'all var(--transition)',
    };
  },
  checkBtn: {
    padding: '10px 28px',
    borderRadius: 'var(--radius)',
    background: 'var(--accent-teal)',
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.95rem',
    marginTop: 10,
    border: 'none',
    cursor: 'pointer',
  },
  resultBar: {
    margin: '24px 0',
    padding: '16px 24px',
    borderRadius: 'var(--radius)',
    textAlign: 'center',
    fontWeight: 700,
    fontSize: '1.1rem',
  },
  feedback: (correct) => ({
    marginTop: 8,
    padding: '8px 12px',
    borderRadius: 'var(--radius-sm)',
    background: correct ? 'var(--correct-bg)' : 'var(--incorrect-bg)',
    color: correct ? 'var(--correct)' : 'var(--incorrect)',
    fontSize: '0.9rem',
    lineHeight: 1.5,
  }),
};

// ═══════════════════════ SECTION RENDERERS ═══════════════════════

function RenderExplanation({ section }) {
  return (
    <div style={S.sectionBox}>
      <h3 style={S.sectionTitle}>{section.title}</h3>
      <p style={S.prose}>{section.content}</p>
      {section.arabicExamples && section.arabicExamples.length > 0 && (
        <div style={{ marginTop: 14 }}>
          {section.arabicExamples.map((ex, i) => (
            <div key={i} style={S.exampleRow}>
              <span style={S.exArabic}>{ex.arabic}</span>
              {ex.transliteration && (
                <span style={S.exTranslit}>{ex.transliteration}</span>
              )}
              <span style={S.exMeaning}>{ex.meaning}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RenderWalkthrough({ section }) {
  return (
    <div style={S.sectionBox}>
      <h3 style={S.sectionTitle}>{section.title}</h3>
      {section.steps.map((step, i) => (
        <div key={i} style={S.step}>
          <strong style={{ color: 'var(--accent-gold)', marginRight: 6 }}>
            {i + 1}.
          </strong>{' '}
          {step}
        </div>
      ))}
    </div>
  );
}

function RenderComparison({ section }) {
  return (
    <div style={S.sectionBox}>
      {section.title && <h3 style={S.sectionTitle}>{section.title}</h3>}
      {section.items.map((item, i) => (
        <div key={i} style={S.exampleRow}>
          {item.form && (
            <span
              style={{
                fontWeight: 700,
                color: 'var(--accent-teal)',
                minWidth: 50,
              }}
            >
              {item.form}
            </span>
          )}
          {item.root && (
            <span
              style={{
                fontFamily: 'var(--font-arabic)',
                direction: 'rtl',
                fontSize: '1.1rem',
                color: 'var(--text-secondary)',
                minWidth: 60,
              }}
            >
              {item.root}
            </span>
          )}
          <span style={S.exArabic}>{item.arabic}</span>
          {item.transliteration && (
            <span style={S.exTranslit}>{item.transliteration}</span>
          )}
          <span style={S.exMeaning}>{item.meaning}</span>
        </div>
      ))}
    </div>
  );
}

function RenderTable({ section }) {
  if (!section.headers || !section.rows) return null;
  // Detect which columns contain Arabic text
  const arabicCols = new Set();
  section.rows.forEach((row) => {
    row.forEach((cell, ci) => {
      if (/[\u0600-\u06FF]/.test(cell)) arabicCols.add(ci);
    });
  });
  return (
    <div style={S.sectionBox}>
      {section.title && <h3 style={S.sectionTitle}>{section.title}</h3>}
      <div style={{ overflowX: 'auto' }}>
        <table style={S.table}>
          <thead>
            <tr>
              {section.headers.map((h, i) => (
                <th key={i} style={S.th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    style={
                      arabicCols.has(ci)
                        ? { ...S.td, ...S.tdArabic }
                        : S.td
                    }
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RenderQuranExamples({ section }) {
  return (
    <div style={S.sectionBox}>
      {section.title && <h3 style={S.sectionTitle}>{section.title}</h3>}
      {section.examples.map((ex, i) => (
        <div key={i} style={S.quranBox}>
          <div style={S.quranLoc}>
            {ex.location} | Wurzel: {ex.root}
          </div>
          <div style={S.quranWord}>{ex.word}</div>
          <div style={S.quranAnalysis}>{ex.analysis}</div>
        </div>
      ))}
    </div>
  );
}

function SectionRenderer({ section }) {
  switch (section.type) {
    case 'explanation':
      return <RenderExplanation section={section} />;
    case 'walkthrough':
      return <RenderWalkthrough section={section} />;
    case 'comparison':
      return <RenderComparison section={section} />;
    case 'table':
      return <RenderTable section={section} />;
    case 'quranExamples':
      return <RenderQuranExamples section={section} />;
    default:
      return null;
  }
}

// ═══════════════════════ LEARN MODE ═══════════════════════════════

function LearnMode({ lesson }) {
  return (
    <div style={S.content} className="fade-in">
      {lesson.learnContent?.sections?.map((sec, i) => (
        <SectionRenderer key={i} section={sec} />
      )) || <div style={{ padding: 20, color: 'var(--text-muted)' }}>Kein Lerninhalt verfügbar.</div>}
    </div>
  );
}

// ═══════════════════════ EXERCISE COMPONENTS ═════════════════════

/* ─── Multiple Choice ─── */
function ExMultipleChoice({ exercise, onResult }) {
  const [selected, setSelected] = useState([]);
  const [revealed, setRevealed] = useState(false);

  const isMulti =
    Array.isArray(exercise.answer) && exercise.answer.length > 1;
  const correctSet = new Set(
    Array.isArray(exercise.answer) ? exercise.answer : [exercise.answer]
  );

  function toggle(opt) {
    if (revealed) return;
    if (isMulti) {
      setSelected((prev) =>
        prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
      );
    } else {
      setSelected([opt]);
    }
  }

  function check() {
    setRevealed(true);
    const correct =
      selected.length === correctSet.size &&
      selected.every((s) => correctSet.has(s));
    onResult(correct);
  }

  const isCorrect =
    selected.length === correctSet.size &&
    selected.every((s) => correctSet.has(s));

  return (
    <div>
      {exercise.options.map((opt, i) => (
        <button
          key={i}
          style={S.optionBtn(
            selected.includes(opt),
            correctSet.has(opt),
            revealed
          )}
          onClick={() => toggle(opt)}
        >
          {opt}
        </button>
      ))}
      {!revealed && (
        <button
          style={S.checkBtn}
          onClick={check}
          disabled={selected.length === 0}
        >
          Prüfen
        </button>
      )}
      {revealed && (
        <div style={S.feedback(isCorrect)}>
          {isCorrect
            ? 'Richtig!'
            : `Falsch. Richtige Antwort: ${Array.from(correctSet).join(', ')}`}
          {exercise.explanation && (
            <div style={{ marginTop: 4 }}>{exercise.explanation}</div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Free Text ─── */
function ExFreeText({ exercise, onResult }) {
  const [value, setValue] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [kbVisible, setKbVisible] = useState(false);
  const inputRef = useRef(null);

  // Detect if input expects Arabic (answer contains Arabic characters)
  const expectsArabic = typeof exercise.answer === 'string'
    ? /[\u0600-\u06FF]/.test(exercise.answer)
    : false;

  function check() {
    const answer =
      typeof exercise.answer === 'string'
        ? exercise.answer
        : JSON.stringify(exercise.answer);
    const isCorrect = normalize(value) === normalize(answer);
    setCorrect(isCorrect);
    setRevealed(true);
    onResult(isCorrect);
  }

  return (
    <div>
      <div style={S.inputRow}>
        <input
          ref={inputRef}
          style={S.arabicInput}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => { if (expectsArabic) setKbVisible(true); }}
          placeholder="Antwort eingeben..."
          dir="rtl"
          disabled={revealed}
        />
      </div>
      {expectsArabic && !revealed && (
        <ArabicKeyboard
          visible={kbVisible}
          onToggle={() => setKbVisible((v) => !v)}
          inputRef={inputRef}
          onInput={(char) => setValue((prev) => prev + char)}
          onBackspace={() => setValue((prev) => prev.slice(0, -1))}
          onClear={() => setValue('')}
        />
      )}
      {exercise.hint && !revealed && (
        <div
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            marginBottom: 8,
          }}
        >
          Hinweis: {exercise.hint}
        </div>
      )}
      {!revealed && (
        <button
          style={S.checkBtn}
          onClick={check}
          disabled={!value.trim()}
        >
          Prüfen
        </button>
      )}
      {revealed && (
        <div style={S.feedback(correct)}>
          {correct
            ? 'Richtig!'
            : `Falsch. Richtige Antwort: ${typeof exercise.answer === 'string' ? exercise.answer : Array.isArray(exercise.answer) ? exercise.answer.join(', ') : JSON.stringify(exercise.answer)}`}
          {exercise.explanation && (
            <div style={{ marginTop: 4 }}>{exercise.explanation}</div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Matching ─── */
function ExMatching({ exercise, onResult }) {
  const [assignments, setAssignments] = useState({});
  const [revealed, setRevealed] = useState(false);
  const [dragItem, setDragItem] = useState(null);

  const pairs = exercise.pairs || [];
  // Derive left/right keys from the first pair (guarded against empty pairs)
  const allKeys = pairs.length > 0 ? Object.keys(pairs[0]) : [];
  const leftCandidates = [
    'word',
    'suffix',
    'singular',
    'form',
    'collective',
    'uthmani',
    'particle',
    'masculine',
  ];
  const leftKey =
    allKeys.find((k) => leftCandidates.includes(k)) || allKeys[0];
  const rightKey = allKeys.find((k) => k !== leftKey) || allKeys[1];

  const lefts = pairs.map((p) => p[leftKey]);
  const rights = pairs.map((p) => p[rightKey]);
  const [shuffledRights] = useState(() =>
    [...rights].sort(() => Math.random() - 0.5)
  );
  if (pairs.length === 0) return null;

  function assign(left, right) {
    if (revealed) return;
    setAssignments((prev) => ({ ...prev, [left]: right }));
  }

  function check() {
    setRevealed(true);
    const correct = pairs.every(
      (p) => assignments[p[leftKey]] === p[rightKey]
    );
    onResult(correct);
  }

  const allAssigned = Object.keys(assignments).length === pairs.length;
  const allCorrect = pairs.every(
    (p) => assignments[p[leftKey]] === p[rightKey]
  );

  return (
    <div>
      <div
        style={{
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          marginBottom: 10,
        }}
      >
        Klicke links auf ein Element, dann rechts auf die Zuordnung.
      </div>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {/* Left column */}
        <div style={{ flex: '1 1 180px' }}>
          {lefts.map((l, i) => (
            <div
              key={i}
              style={{
                ...S.exampleRow,
                cursor: revealed ? 'default' : 'pointer',
                border:
                  dragItem === l
                    ? '2px solid var(--accent-teal)'
                    : '2px solid transparent',
              }}
              onClick={() => !revealed && setDragItem(l)}
            >
              <span style={{ fontWeight: 600, fontSize: '1rem' }}>{l}</span>
              {assignments[l] && (
                <span
                  style={{ color: 'var(--accent-gold)', marginLeft: 8 }}
                >
                  {' '}
                  → {assignments[l]}
                </span>
              )}
            </div>
          ))}
        </div>
        {/* Right column */}
        <div style={{ flex: '1 1 180px' }}>
          {shuffledRights.map((r, i) => {
            const used = Object.values(assignments).includes(r);
            return (
              <button
                key={i}
                style={{
                  ...S.optionBtn(false, false, false),
                  opacity: used ? 0.4 : 1,
                }}
                onClick={() => {
                  if (dragItem && !used && !revealed) {
                    assign(dragItem, r);
                    setDragItem(null);
                  }
                }}
                disabled={revealed || used}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>
      {!revealed && (
        <button
          style={S.checkBtn}
          onClick={check}
          disabled={!allAssigned}
        >
          Prüfen
        </button>
      )}
      {revealed && (
        <div style={S.feedback(allCorrect)}>
          {allCorrect
            ? 'Alle richtig!'
            : 'Nicht alle Zuordnungen waren korrekt. Richtige Zuordnungen:'}
          {!allCorrect && (
            <ul style={{ marginTop: 4, paddingLeft: 16 }}>
              {pairs.map((p, i) => (
                <li key={i}>
                  {p[leftKey]} → {p[rightKey]}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Conjugation Drill ─── */
function ExConjugationDrill({ exercise, onResult }) {
  const items = exercise.items || [];
  const [answers, setAnswers] = useState(() => items.map(() => ''));
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState([]);

  function updateAnswer(idx, val) {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  }

  function check() {
    const res = items.map(
      (item, i) => normalize(answers[i]) === normalize(item.answer)
    );
    setResults(res);
    setRevealed(true);
    // Count as correct if >= half of sub-items correct
    const score = res.length > 0 ? res.filter(Boolean).length / res.length : 0;
    onResult(score >= 0.5);
  }

  return (
    <div>
      {items.map((item, i) => (
        <div key={i} style={{ ...S.inputRow, marginBottom: 10 }}>
          <span
            style={{
              minWidth: 90,
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            {item.person}:
          </span>
          <input
            style={S.arabicInput}
            value={answers[i]}
            onChange={(e) => updateAnswer(i, e.target.value)}
            dir="rtl"
            disabled={revealed}
          />
          {revealed && (
            <span
              style={{
                color: results[i] ? 'var(--correct)' : 'var(--incorrect)',
                fontWeight: 600,
                fontSize: '0.9rem',
                whiteSpace: 'nowrap',
              }}
            >
              {results[i] ? 'Richtig' : item.answer}
            </span>
          )}
        </div>
      ))}
      {!revealed && (
        <button style={S.checkBtn} onClick={check}>
          Prüfen
        </button>
      )}
    </div>
  );
}

/* ─── Exercise Router ─── */
function ExerciseRenderer({ exercise, onResult }) {
  const { type, prompt, word } = exercise;

  return (
    <div style={S.exerciseBox}>
      <div style={S.prompt}>{prompt}</div>
      {word && <div style={S.promptArabic}>{word}</div>}

      {type === 'multiple_choice' && (
        <ExMultipleChoice exercise={exercise} onResult={onResult} />
      )}

      {(type === 'root_extraction' ||
        type === 'reverse' ||
        type === 'pattern_recognition') &&
        (exercise.options ? (
          <ExMultipleChoice exercise={exercise} onResult={onResult} />
        ) : (
          <ExFreeText exercise={exercise} onResult={onResult} />
        ))}

      {type === 'matching' && exercise.pairs && (
        <ExMatching exercise={exercise} onResult={onResult} />
      )}
      {type === 'matching' && !exercise.pairs && exercise.options && (
        <ExMultipleChoice exercise={exercise} onResult={onResult} />
      )}

      {type === 'conjugation_drill' && (
        <ExConjugationDrill exercise={exercise} onResult={onResult} />
      )}

      {(type === 'case_determination' ||
        type === 'identification' ||
        type === 'fill_in' ||
        type === 'sentence_analysis' ||
        type === 'particle_function' ||
        type === 'disambiguation') &&
        (exercise.options ? (
          <ExMultipleChoice exercise={exercise} onResult={onResult} />
        ) : (
          <ExFreeText exercise={exercise} onResult={onResult} />
        ))}
    </div>
  );
}

// ═══════════════════════ TEST MODE ════════════════════════════════

// Helper: detect if an exercise is a Quran word analysis exercise
// (exercises that have an Arabic 'word' field for the user to analyze)
function isQuranWordExercise(exercise) {
  return exercise.word && /[\u0600-\u06FF]/.test(exercise.word);
}

function TestMode({ lesson, onComplete, activeMeta }) {
  const exercises = lesson.testContent?.exercises || [];
  const [results, setResults] = useState(() =>
    exercises.map(() => null)
  );
  const [submitted, setSubmitted] = useState(false);

  function handleResult(idx, correct) {
    setResults((prev) => {
      const next = [...prev];
      next[idx] = correct;
      return next;
    });
  }

  const allAnswered = results.every((r) => r !== null);
  const score = results.filter(Boolean).length;
  const total = results.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const scorePass = pct >= activeMeta.passingScore;

  // Count correctly answered Quran word analysis exercises
  const quranWordsCorrect = exercises.reduce((count, ex, i) => {
    if (isQuranWordExercise(ex) && results[i] === true) return count + 1;
    return count;
  }, 0);
  const quranWordsTotal = exercises.filter(isQuranWordExercise).length;
  const QURAN_WORDS_REQUIRED = 3;
  const quranPass = quranWordsCorrect >= QURAN_WORDS_REQUIRED;
  const passed = scorePass && quranPass;

  function submit() {
    setSubmitted(true);
    onComplete(pct, quranWordsCorrect);
  }

  return (
    <div style={S.content} className="fade-in">
      <div
        style={{
          marginBottom: 20,
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
        }}
      >
        Beantworte alle Aufgaben und klicke dann auf &quot;Auswerten&quot;.
        Mindestens {activeMeta.passingScore}% nötig zum Bestehen,
        plus mindestens {QURAN_WORDS_REQUIRED} Quran-Wörter korrekt analysiert.
      </div>

      {exercises.map((ex, i) => (
        <ExerciseRenderer
          key={`${lesson.id}-ex-${i}`}
          exercise={ex}
          onResult={(correct) => handleResult(i, correct)}
        />
      ))}

      {!submitted && (
        <button
          style={{
            ...S.checkBtn,
            fontSize: '1.1rem',
            padding: '14px 36px',
          }}
          onClick={submit}
          disabled={!allAnswered}
        >
          Auswerten
        </button>
      )}

      {submitted && (
        <div
          style={{
            ...S.resultBar,
            background: passed
              ? 'var(--correct-bg)'
              : 'var(--incorrect-bg)',
            color: passed ? 'var(--correct)' : 'var(--incorrect)',
            border: `1px solid ${passed ? 'var(--correct)' : 'var(--incorrect)'}`,
          }}
        >
          <div>
            Ergebnis: {score} / {total} ({pct}%) —{' '}
            {scorePass ? 'Punktzahl erreicht' : 'Punktzahl nicht erreicht'}
          </div>
          <div style={{ marginTop: 6, fontSize: '0.95rem' }}>
            Quran-Wörter korrekt: {quranWordsCorrect} / {quranWordsTotal}
            {' '}(mindestens {QURAN_WORDS_REQUIRED} benötigt) —{' '}
            {quranPass ? 'Erfüllt' : 'Nicht erfüllt'}
          </div>
          <div style={{ marginTop: 10, fontWeight: 700 }}>
            {passed
              ? 'Bestanden! Nächste Lektion freigeschaltet.'
              : 'Nicht bestanden. Wiederhole den Lernmodus und versuche es erneut.'}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════ LESSON VIEW ═════════════════════════════

function LessonView({ lesson, progress, setProgress, onBack, activeData, storageKey }) {
  const [activeTab, setActiveTab] = useState('learn');
  const learnVisited = !!(progress.learnVisited && progress.learnVisited[lesson.id]);

  // Mark learn mode as visited when the learn tab is active
  useEffect(() => {
    if (activeTab === 'learn' && !learnVisited) {
      setProgress((prev) => {
        const updated = {
          ...prev,
          learnVisited: {
            ...prev.learnVisited,
            [lesson.id]: true,
          },
        };
        saveProgressAsync(storageKey, updated);
        return updated;
      });
    }
  }, [activeTab, lesson.id, learnVisited, setProgress, storageKey]);

  const QURAN_WORDS_REQUIRED = 3;

  function handleTestComplete(pct, quranWordsCorrect) {
    const next = nextLessonId(lesson.id, activeData.lessons);
    const scorePass = pct >= activeData.meta.passingScore;
    const quranPass = quranWordsCorrect >= QURAN_WORDS_REQUIRED;
    const passed = scorePass && quranPass;
    setProgress((prev) => {
      const updated = {
        ...prev,
        scores: {
          ...prev.scores,
          [lesson.id]: Math.max(pct, prev.scores[lesson.id] || 0),
        },
      };
      if (passed && next && !updated.unlocked.includes(next)) {
        updated.unlocked = [...updated.unlocked, next];
      }
      saveProgressAsync(storageKey, updated);
      return updated;
    });
  }

  const bestScore = progress.scores[lesson.id];

  function handleTabClick(tab) {
    if (tab === 'test' && !learnVisited) return; // blocked
    setActiveTab(tab);
  }

  return (
    <div>
      <div style={S.lessonHeader}>
        <button style={S.backBtn} onClick={onBack}>
          Zurück
        </button>
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: '1.15rem',
              color: 'var(--text-heading)',
            }}
          >
            {lesson.id} — {lesson.title}
          </div>
          <div
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
            }}
          >
            {lesson.description}
            {bestScore != null && (
              <span
                style={{
                  marginLeft: 12,
                  color:
                    bestScore >= 80
                      ? 'var(--correct)'
                      : 'var(--incorrect)',
                  fontWeight: 600,
                }}
              >
                Bestes Ergebnis: {bestScore}%
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={S.tabRow}>
        <button
          style={S.tab(activeTab === 'learn')}
          onClick={() => handleTabClick('learn')}
        >
          Lernmodus
        </button>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button
            style={{
              ...S.tab(activeTab === 'test'),
              ...(learnVisited ? {} : { opacity: 0.4, cursor: 'not-allowed' }),
            }}
            onClick={() => handleTabClick('test')}
            disabled={!learnVisited}
            title={learnVisited ? '' : 'Bitte zuerst den Lernmodus durcharbeiten'}
          >
            Prüfmodus
          </button>
          {!learnVisited && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 4,
              padding: '6px 12px',
              background: 'var(--bg-card)',
              border: '1px solid var(--accent-gold)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent-gold)',
              fontSize: '0.78rem',
              whiteSpace: 'nowrap',
              zIndex: 10,
              pointerEvents: 'none',
            }}>
              Bitte zuerst den Lernmodus durcharbeiten
            </div>
          )}
        </div>
      </div>

      {activeTab === 'learn' ? (
        <LearnMode lesson={lesson} />
      ) : (
        <TestMode
          key={`test-${lesson.id}`}
          lesson={lesson}
          onComplete={handleTestComplete}
          activeMeta={activeData.meta}
        />
      )}
    </div>
  );
}

// ═══════════════════════ BROKEN PLURAL DRILL ═════════════════════

function BrokenPluralDrill({ onBack }) {
  const patterns = useMemo(() => brokenPluralData.patterns || [], []);
  const assignmentRules = brokenPluralData.assignmentRules || [];
  const assignmentExercises = brokenPluralData.assignmentExercises || [];
  const [mode, setMode] = useState('learn'); // 'learn' | 'quiz' | 'rules' | 'predict'
  const [activePattern, setActivePattern] = useState(0);
  // Predict state
  const [predictIdx, setPredictIdx] = useState(0);
  const [predictSelected, setPredictSelected] = useState(null);
  const [predictRevealed, setPredictRevealed] = useState(false);
  const [predictScore, setPredictScore] = useState({ correct: 0, total: 0 });
  // Quiz state
  const [quizItems, setQuizItems] = useState([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizInput, setQuizInput] = useState('');
  const [quizFeedback, setQuizFeedback] = useState(null);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });

  const buildQuiz = useCallback(() => {
    const items = [];
    patterns.forEach(p => {
      (p.examples || []).forEach(ex => {
        items.push({ singular: ex.singular, plural: ex.plural, meaning: ex.meaning, pattern: p.pluralPattern, patternId: p.id });
      });
    });
    // Shuffle
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }, [patterns]);

  const startQuiz = () => {
    setQuizItems(buildQuiz());
    setQuizIdx(0); setQuizInput(''); setQuizFeedback(null);
    setQuizScore({ correct: 0, total: 0 });
    setMode('quiz');
  };

  const strip = s => s.replace(/[\u064B-\u065F\u0670]/g, '').replace(/\s+/g, '').trim();
  const checkQuiz = useCallback(() => {
    const item = quizItems[quizIdx];
    if (!item) return;
    const correct = strip(quizInput) === strip(item.plural);
    setQuizFeedback({ correct, answer: item.plural, pattern: item.pattern });
    setQuizScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
  }, [quizItems, quizIdx, quizInput]);

  const nextQuiz = () => {
    setQuizIdx(i => i + 1); setQuizInput(''); setQuizFeedback(null);
  };

  const pat = patterns[activePattern];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: '16px' }}>
        Zurück zur Übersicht
      </button>
      <h2 style={{ marginBottom: '4px' }}>Gebrochene Plurale — Drill</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
        {brokenPluralData.meta?.description || 'Gebrochene Pluralmuster des klassischen Arabisch mit koranischen Belegen.'}
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button onClick={() => setMode('learn')} style={{
          padding: '8px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
          background: mode === 'learn' ? 'var(--accent-teal-bg)' : 'var(--bg-hover)',
          color: mode === 'learn' ? 'var(--accent-teal)' : 'var(--text-secondary)',
          border: mode === 'learn' ? '2px solid var(--accent-teal)' : '1px solid var(--border)',
        }}>Lernen</button>
        <button onClick={startQuiz} style={{
          padding: '8px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
          background: mode === 'quiz' ? 'var(--accent-gold-bg)' : 'var(--bg-hover)',
          color: mode === 'quiz' ? 'var(--accent-gold)' : 'var(--text-secondary)',
          border: mode === 'quiz' ? '2px solid var(--accent-gold)' : '1px solid var(--border)',
        }}>Quiz</button>
        {assignmentRules.length > 0 && (
          <button onClick={() => setMode('rules')} style={{
            padding: '8px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
            background: mode === 'rules' ? 'rgba(168,85,247,0.15)' : 'var(--bg-hover)',
            color: mode === 'rules' ? '#a855f7' : 'var(--text-secondary)',
            border: mode === 'rules' ? '2px solid #a855f7' : '1px solid var(--border)',
          }}>Zuordnungsregeln</button>
        )}
        {assignmentExercises.length > 0 && (
          <button onClick={() => { setMode('predict'); }} style={{
            padding: '8px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
            background: mode === 'predict' ? 'rgba(244,63,94,0.15)' : 'var(--bg-hover)',
            color: mode === 'predict' ? '#f43f5e' : 'var(--text-secondary)',
            border: mode === 'predict' ? '2px solid #f43f5e' : '1px solid var(--border)',
          }}>Vorhersage</button>
        )}
      </div>

      {mode === 'rules' && (
        <div>
          <h3 style={{ color: '#a855f7', marginBottom: '12px' }}>Welcher Singular nimmt welchen Plural?</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
            Gebrochene Plurale sind nicht völlig unvorhersagbar. Es gibt Heuristiken die in der Mehrheit der Fälle zutreffen.
          </p>
          {assignmentRules.map(rule => (
            <div key={rule.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'baseline', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.2rem', color: 'var(--accent-gold)', direction: 'rtl' }}>{rule.singularPattern}</span>
                <span style={{ color: 'var(--text-muted)' }}>{'\u2192'}</span>
                {rule.typicalPlurals.map((tp, i) => (
                  <span key={i} style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.1rem', color: 'var(--accent-teal)', direction: 'rtl' }}>{tp}</span>
                ))}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', fontStyle: 'italic' }}>{rule.heuristic}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {rule.examples.map((ex, i) => (
                  <span key={i} style={{ padding: '4px 10px', borderRadius: '6px', background: 'var(--bg)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span style={{ fontFamily: 'var(--font-arabic)', direction: 'rtl' }}>{ex.singular}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginLeft: '6px' }}>{ex.note}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {mode === 'predict' && (() => {
        const pe = assignmentExercises[predictIdx];
        if (!pe) return <div style={{ color: 'var(--text-muted)' }}>Keine Vorhersage-Übungen vorhanden.</div>;
        return (
          <div>
            <h3 style={{ color: '#f43f5e', marginBottom: '4px' }}>Plural-Muster vorhersagen</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>Welches Pluralmuster passt zum gegebenen Singular?</p>
            {predictScore.total > 0 && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>{predictScore.correct}/{predictScore.total} korrekt</div>}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontFamily: 'var(--font-arabic)', fontSize: '2rem', color: 'var(--accent-gold)', direction: 'rtl' }}>{pe.given.split(' ')[0]}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{pe.given}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {pe.options.map((opt, i) => (
                  <button key={i} onClick={() => !predictRevealed && setPredictSelected(i)} style={{
                    padding: '12px 16px', borderRadius: '8px', textAlign: 'right', cursor: predictRevealed ? 'default' : 'pointer',
                    border: predictSelected === i ? '2px solid var(--accent-teal)' : '1px solid var(--border)',
                    background: predictRevealed ? (i === pe.correct ? 'rgba(34,197,94,0.15)' : predictSelected === i ? 'rgba(239,68,68,0.15)' : 'var(--bg)') : (predictSelected === i ? 'rgba(45,212,191,0.1)' : 'var(--bg)'),
                    color: 'var(--text)', fontFamily: 'var(--font-arabic)', fontSize: '1.1rem', direction: 'rtl'
                  }}>{opt}</button>
                ))}
              </div>
              {!predictRevealed && <button onClick={() => { if (predictSelected === null) return; setPredictRevealed(true); setPredictScore(s => ({ correct: s.correct + (predictSelected === pe.correct ? 1 : 0), total: s.total + 1 })); }} disabled={predictSelected === null} style={{ padding: '10px 28px', borderRadius: '8px', border: 'none', background: predictSelected !== null ? 'var(--accent-teal)' : 'var(--text-muted)', color: '#fff', cursor: predictSelected !== null ? 'pointer' : 'default', width: '100%' }}>Prüfen</button>}
              {predictRevealed && (
                <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '8px' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{pe.explanation}</div>
                  <button onClick={() => { setPredictIdx((predictIdx + 1) % assignmentExercises.length); setPredictSelected(null); setPredictRevealed(false); }} style={{ marginTop: '12px', padding: '8px 24px', borderRadius: '8px', border: 'none', background: 'var(--accent-gold)', color: '#000', cursor: 'pointer' }}>Weiter</button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {mode === 'learn' && (
        <>
          {/* Pattern tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '16px', padding: '8px', background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            {patterns.map((p, i) => (
              <button key={p.id} onClick={() => setActivePattern(i)} style={{
                padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', cursor: 'pointer',
                background: activePattern === i ? 'var(--accent-teal-bg)' : 'transparent',
                color: activePattern === i ? 'var(--accent-teal)' : 'var(--text-secondary)',
                border: activePattern === i ? '1px solid var(--accent-teal)' : '1px solid transparent',
              }}>
                <span className="arabic" dir="rtl">{p.pluralPattern}</span>
              </button>
            ))}
          </div>

          {pat && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'baseline', marginBottom: '12px', flexWrap: 'wrap' }}>
                <span className="arabic" dir="rtl" style={{ fontSize: '1.8rem', color: 'var(--accent-gold)' }}>{pat.singularPattern}</span>
                <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>→</span>
                <span className="arabic" dir="rtl" style={{ fontSize: '1.8rem', color: 'var(--accent-teal)' }}>{pat.pluralPattern}</span>
                <span style={{ padding: '2px 8px', borderRadius: '10px', background: 'var(--bg-input)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {pat.frequency}
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px', lineHeight: 1.6 }}>{pat.description}</p>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'right', padding: '8px 12px', borderBottom: '2px solid var(--border)', color: 'var(--accent-teal)', fontWeight: 600 }}>Singular</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px', borderBottom: '2px solid var(--border)', color: 'var(--accent-gold)', fontWeight: 600 }}>Plural</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '2px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 600 }}>Bedeutung</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', fontWeight: 600 }}>Stelle</th>
                  </tr>
                </thead>
                <tbody>
                  {(pat.examples || []).map((ex, i) => (
                    <tr key={i}>
                      <td className="arabic" dir="rtl" style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: '1.3rem', color: 'var(--arabic-text)' }}>{ex.singular}</td>
                      <td className="arabic" dir="rtl" style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: '1.3rem', color: 'var(--accent-gold)' }}>{ex.plural}</td>
                      <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>{ex.meaning}</td>
                      <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ex.quranicLocation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {mode === 'quiz' && (
        <>
          {quizIdx >= quizItems.length ? (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <h3>Ergebnis</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: quizScore.total > 0 && quizScore.correct / quizScore.total >= 0.8 ? 'var(--correct)' : 'var(--accent-gold)', margin: '16px 0' }}>
                {quizScore.correct} / {quizScore.total} ({quizScore.total > 0 ? Math.round(quizScore.correct / quizScore.total * 100) : 0}%)
              </div>
              <button onClick={startQuiz} style={{ padding: '8px 20px', borderRadius: 'var(--radius)', background: 'var(--accent-teal)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Erneut</button>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', textAlign: 'right' }}>{quizIdx + 1} / {quizItems.length}</div>
              <p style={{ fontWeight: 600, marginBottom: '8px' }}>Wie lautet der gebrochene Plural?</p>
              <div className="arabic" dir="rtl" style={{ fontSize: '2rem', color: 'var(--accent-gold)', marginBottom: '4px' }}>{quizItems[quizIdx].singular}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>{quizItems[quizIdx].meaning}</div>
              {!quizFeedback ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input className="arabic" dir="rtl" value={quizInput} onChange={e => setQuizInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && quizInput.trim() && checkQuiz()}
                    placeholder="Plural eingeben..."
                    style={{ flex: 1, padding: '8px 12px', fontSize: '1.3rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--arabic-text)' }}
                    autoFocus />
                  <button onClick={checkQuiz} disabled={!quizInput.trim()} style={{
                    padding: '8px 16px', borderRadius: 'var(--radius)', background: 'var(--accent-teal)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, opacity: quizInput.trim() ? 1 : 0.5,
                  }}>Prüfen</button>
                </div>
              ) : (
                <div style={{
                  padding: '12px', borderRadius: 'var(--radius)',
                  background: quizFeedback.correct ? 'var(--correct-bg)' : 'var(--incorrect-bg)',
                  border: `1px solid ${quizFeedback.correct ? 'var(--correct)' : 'var(--incorrect)'}`,
                }}>
                  <p style={{ fontWeight: 600 }}>{quizFeedback.correct ? 'Richtig!' : 'Nicht ganz.'}</p>
                  <p className="arabic" dir="rtl" style={{ fontSize: '1.3rem', color: 'var(--accent-gold)' }}>{quizFeedback.answer}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Muster: <span className="arabic" dir="rtl">{quizFeedback.pattern}</span></p>
                  <button onClick={nextQuiz} style={{ marginTop: '8px', padding: '6px 16px', borderRadius: 'var(--radius)', background: 'var(--accent-teal)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Weiter</button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════ NOMINAL DECLENSION DRILL ════════════════

function NominalDeclensionDrill({ onBack }) {
  const paradigms = useMemo(() => nominalDeclensionData.paradigms || [], []);
  const [activeParadigm, setActiveParadigm] = useState(0);
  const [mode, setMode] = useState('learn'); // 'learn' | 'quiz'
  const [quizItems, setQuizItems] = useState([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState(null);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });

  const buildQuiz = useCallback(() => {
    const items = [];
    paradigms.forEach(p => {
      (p.quranicExamples || []).forEach(ex => {
        const caseLabel = ex.case === 'nominative' ? 'Nominativ (Rafa\')' : ex.case === 'accusative' ? 'Akkusativ (Nasb)' : ex.case === 'genitive' ? 'Genitiv (Jarr)' : ex.case;
        items.push({ word: ex.word, location: ex.location, correctCase: ex.case, caseLabel, explanation: ex.explanation, paradigmTitle: p.title });
      });
    });
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }, [paradigms]);

  const startQuiz = useCallback(() => {
    setQuizItems(buildQuiz()); setQuizIdx(0); setQuizFeedback(null);
    setQuizScore({ correct: 0, total: 0 }); setMode('quiz');
  }, [buildQuiz]);

  const checkQuizCase = useCallback((chosen) => {
    const item = quizItems[quizIdx];
    if (!item) return;
    const correct = chosen === item.correctCase;
    setQuizFeedback({ correct, correctCase: item.caseLabel, explanation: item.explanation });
    setQuizScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
  }, [quizItems, quizIdx]);

  const nextQuiz = useCallback(() => {
    setQuizIdx(i => i + 1); setQuizFeedback(null);
  }, []);

  const par = paradigms[activeParadigm];
  const CASE_OPTIONS = [
    { id: 'nominative', label: 'Nominativ (Rafa\')' },
    { id: 'accusative', label: 'Akkusativ (Nasb)' },
    { id: 'genitive', label: 'Genitiv (Jarr)' },
  ];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: '16px' }}>
        Zurück zur Übersicht
      </button>
      <h2 style={{ marginBottom: '4px' }}>Nominalflexion — Drill</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
        {nominalDeclensionData.meta?.description || 'Deklinationsparadigmen des klassischen Arabisch.'}
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button onClick={() => setMode('learn')} style={{
          padding: '8px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
          background: mode === 'learn' ? 'var(--accent-teal-bg)' : 'var(--bg-hover)',
          color: mode === 'learn' ? 'var(--accent-teal)' : 'var(--text-secondary)',
          border: mode === 'learn' ? '2px solid var(--accent-teal)' : '1px solid var(--border)',
        }}>Lernen</button>
        <button onClick={startQuiz} style={{
          padding: '8px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
          background: mode === 'quiz' ? 'var(--accent-gold-bg)' : 'var(--bg-hover)',
          color: mode === 'quiz' ? 'var(--accent-gold)' : 'var(--text-secondary)',
          border: mode === 'quiz' ? '2px solid var(--accent-gold)' : '1px solid var(--border)',
        }}>Quiz</button>
      </div>

      {mode === 'learn' && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '16px', padding: '8px', background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            {paradigms.map((p, i) => (
              <button key={p.id} onClick={() => setActiveParadigm(i)} style={{
                padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', cursor: 'pointer',
                background: activeParadigm === i ? 'var(--accent-teal-bg)' : 'transparent',
                color: activeParadigm === i ? 'var(--accent-teal)' : 'var(--text-secondary)',
                border: activeParadigm === i ? '1px solid var(--accent-teal)' : '1px solid transparent',
              }}>
                {p.title.length > 30 ? p.title.slice(0, 30) + '...' : p.title}
              </button>
            ))}
          </div>

          {par && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
              <h3 style={{ color: 'var(--accent-gold)', marginBottom: '8px' }}>{par.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px', lineHeight: 1.6 }}>{par.description}</p>

              {par.table && (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '2px solid var(--border)', color: 'var(--accent-teal)', fontWeight: 600 }}>Kasus</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '2px solid var(--border)', color: 'var(--accent-teal)', fontWeight: 600 }}>Endung</th>
                      <th style={{ textAlign: 'right', padding: '8px 12px', borderBottom: '2px solid var(--border)', color: 'var(--accent-gold)', fontWeight: 600 }}>Beispiel</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '2px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 600 }}>Funktion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(par.table).map(([caseKey, data]) => (
                      <tr key={caseKey}>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
                          {caseKey === 'nominative' ? 'Nominativ' : caseKey === 'accusative' ? 'Akkusativ' : 'Genitiv'}
                        </td>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'monospace' }}>{data.ending}</td>
                        <td className="arabic" dir="rtl" style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: '1.3rem', color: 'var(--arabic-text)' }}>{data.example}</td>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{data.function}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {par.diptoteConditions && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-teal)', marginBottom: '8px' }}>Diptotische Bedingungen</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', lineHeight: 1.7 }}>
                    {par.diptoteConditions.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              )}

              {par.quranicExamples && par.quranicExamples.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-teal)', marginBottom: '8px' }}>Koranische Belege</h4>
                  {par.quranicExamples.map((ex, i) => (
                    <div key={i} style={{ padding: '8px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', marginBottom: '6px', display: 'flex', gap: '12px', alignItems: 'baseline', flexWrap: 'wrap' }}>
                      <span className="arabic" dir="rtl" style={{ fontSize: '1.3rem', color: 'var(--arabic-text)' }}>{ex.word}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)' }}>{ex.location}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flex: 1 }}>{ex.explanation}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {mode === 'quiz' && (
        <>
          {quizIdx >= quizItems.length ? (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <h3>Ergebnis — Kasusbestimmung</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: quizScore.total > 0 && quizScore.correct / quizScore.total >= 0.8 ? 'var(--correct)' : 'var(--accent-gold)', margin: '16px 0' }}>
                {quizScore.correct} / {quizScore.total} ({quizScore.total > 0 ? Math.round(quizScore.correct / quizScore.total * 100) : 0}%)
              </div>
              <button onClick={startQuiz} style={{ padding: '8px 20px', borderRadius: 'var(--radius)', background: 'var(--accent-teal)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Erneut</button>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', textAlign: 'right' }}>{quizIdx + 1} / {quizItems.length}</div>
              <p style={{ fontWeight: 600, marginBottom: '8px' }}>In welchem Kasus steht dieses Wort?</p>
              <div className="arabic" dir="rtl" style={{ fontSize: '2rem', color: 'var(--accent-gold)', marginBottom: '4px' }}>{quizItems[quizIdx].word}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                {quizItems[quizIdx].location} — {quizItems[quizIdx].paradigmTitle}
              </div>
              {!quizFeedback ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {CASE_OPTIONS.map(opt => (
                    <button key={opt.id} onClick={() => checkQuizCase(opt.id)} style={{
                      padding: '10px 16px', textAlign: 'left', borderRadius: 'var(--radius)',
                      background: 'var(--bg-input)', border: '1px solid var(--border)',
                      cursor: 'pointer', fontSize: '0.95rem', color: 'var(--text-primary)',
                    }}
                      onMouseEnter={e => e.target.style.borderColor = 'var(--accent-teal)'}
                      onMouseLeave={e => e.target.style.borderColor = 'var(--border)'}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '12px', borderRadius: 'var(--radius)',
                  background: quizFeedback.correct ? 'var(--correct-bg)' : 'var(--incorrect-bg)',
                  border: `1px solid ${quizFeedback.correct ? 'var(--correct)' : 'var(--incorrect)'}`,
                }}>
                  <p style={{ fontWeight: 600 }}>{quizFeedback.correct ? 'Richtig!' : `Nicht ganz. Richtige Antwort: ${quizFeedback.correctCase}`}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>{quizFeedback.explanation}</p>
                  <button onClick={nextQuiz} style={{ marginTop: '8px', padding: '6px 16px', borderRadius: 'var(--radius)', background: 'var(--accent-teal)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Weiter</button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════ MAIN COMPONENT ══════════════════════════

export default function Module2() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Determine initial state from query params (e.g. ?lesson=2.10&stufe=morphology)
  const initialLessonParam = searchParams.get('lesson');
  const initialStufeParam = searchParams.get('stufe');
  const initialStufe = initialStufeParam && STUFE_CONFIG[initialStufeParam]
    ? initialStufeParam
    : initialLessonParam && (initialLessonParam.startsWith('3.') || initialLessonParam.startsWith('4.'))
      ? 'syntax'
      : 'morphology';

  const [activeStufe, setActiveStufe] = useState(initialStufe);
  const cfg = STUFE_CONFIG[activeStufe];
  const activeData = cfg.data;

  const [progress, setProgress] = useState(
    { unlocked: [cfg.firstLessonId], scores: {}, learnVisited: {} }
  );
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(initialLessonParam || null);
  const [showParadigmDrill, setShowParadigmDrill] = useState(false);
  const [showBrokenPluralDrill, setShowBrokenPluralDrill] = useState(false);
  const [showDeclensionDrill, setShowDeclensionDrill] = useState(false);
  const [warningDismissed, setWarningDismissed] = useState(false);

  // Clear query params after initial read so they don't persist in the URL
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (searchParams.get('lesson')) {
      setSearchParams({}, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load progress async on mount and when Stufe changes
  useEffect(() => {
    let cancelled = false;
    const c = STUFE_CONFIG[activeStufe];
    loadProgressAsync(c.key, c.firstLessonId).then(data => {
      if (!cancelled) {
        setProgress(data);
        setProgressLoaded(true);
        if (!isFirstRender.current) {
          setSelectedLesson(null);
          setWarningDismissed(false);
        }
        isFirstRender.current = false;
      }
    });
    return () => { cancelled = true; };
  }, [activeStufe]);

  // Persist on every change (async)
  useEffect(() => {
    if (progressLoaded) {
      saveProgressAsync(cfg.key, progress);
    }
  }, [progress, cfg.key, progressLoaded]);

  const lessons = activeData.lessons;

  /* ─── Paradigm Drill view ─── */
  if (showParadigmDrill) {
    return (
      <div style={S.page}>
        <ParadigmDrill onBack={() => setShowParadigmDrill(false)} />
      </div>
    );
  }

  /* ─── Broken Plural Drill view ─── */
  if (showBrokenPluralDrill) {
    return (
      <div style={S.page}>
        <BrokenPluralDrill onBack={() => setShowBrokenPluralDrill(false)} />
      </div>
    );
  }

  /* ─── Nominal Declension Drill view ─── */
  if (showDeclensionDrill) {
    return (
      <div style={S.page}>
        <NominalDeclensionDrill onBack={() => setShowDeclensionDrill(false)} />
      </div>
    );
  }

  /* ─── Lesson detail view ─── */
  if (selectedLesson) {
    const lesson = lessons.find((l) => l.id === selectedLesson);
    if (!lesson) {
      setSelectedLesson(null);
      return null;
    }
    return (
      <div style={S.page}>
        <LessonView
          lesson={lesson}
          progress={progress}
          setProgress={setProgress}
          onBack={() => setSelectedLesson(null)}
          activeData={activeData}
          storageKey={cfg.key}
        />
      </div>
    );
  }

  /* ─── Lesson overview grid ─── */
  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.headerTitle}>
          Modul 2 — {activeData.meta.title}
        </div>
        <div style={S.headerSub}>
          {lessons.length} Lektionen — {cfg.label}
        </div>

        {/* Stufe selector */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          {Object.entries(STUFE_CONFIG).map(([key, c]) => (
            <button
              key={key}
              onClick={() => setActiveStufe(key)}
              style={{
                padding: '8px 18px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: '0.9rem',
                border: activeStufe === key
                  ? '2px solid var(--accent-teal)'
                  : '1px solid var(--border)',
                background: activeStufe === key
                  ? 'var(--accent-teal-bg)'
                  : 'var(--bg-hover)',
                color: activeStufe === key
                  ? 'var(--accent-teal)'
                  : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all var(--transition)',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Drill Buttons */}
      {activeStufe === 'morphology' && (
        <div style={{ padding: '0 32px', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => setShowParadigmDrill(true)}
            style={{
              padding: '10px 20px', borderRadius: 'var(--radius-lg)',
              background: 'var(--accent-gold-bg)', border: '1px solid var(--accent-gold)',
              color: 'var(--accent-gold)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
              width: '100%',
            }}
          >
            Paradigmen-Drill — Konjugationstabellen ausfüllen
          </button>
          <button
            onClick={() => setShowBrokenPluralDrill(true)}
            style={{
              padding: '10px 20px', borderRadius: 'var(--radius-lg)',
              background: 'var(--accent-gold-bg)', border: '1px solid var(--accent-gold)',
              color: 'var(--accent-gold)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
              width: '100%',
            }}
          >
            Gebrochene Plurale — Muster lernen und überprüfen
          </button>
        </div>
      )}
      {activeStufe === 'syntax' && (
        <div style={{ padding: '0 32px', marginBottom: 12 }}>
          <button
            onClick={() => setShowDeclensionDrill(true)}
            style={{
              padding: '10px 20px', borderRadius: 'var(--radius-lg)',
              background: 'var(--accent-gold-bg)', border: '1px solid var(--accent-gold)',
              color: 'var(--accent-gold)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
              width: '100%',
            }}
          >
            Nominalflexion — Deklinationsparadigmen und Kasusbestimmung
          </button>
        </div>
      )}

      {/* Psychological warning */}
      {!warningDismissed && (
        <div style={S.warning}>
          <div style={S.warningTitle}>Bevor du beginnst</div>
          <div>{activeData.meta.warningMessage}</div>
          <button
            style={{
              ...S.checkBtn,
              background: 'var(--accent-gold)',
              marginTop: 14,
            }}
            onClick={() => setWarningDismissed(true)}
          >
            Verstanden — ich bin bereit
          </button>
        </div>
      )}

      {/* Phase gate hint after morphology basics */}
      {activeStufe === 'morphology' && progress.scores['2.11'] != null && progress.scores['2.11'] >= 80 && (
        <div style={{ margin: '0 32px 16px', padding: '16px 20px', background: 'var(--correct-bg)', border: '1px solid var(--correct)', borderRadius: 'var(--radius-lg)', lineHeight: 1.7 }}>
          <div style={{ fontWeight: 700, color: 'var(--correct)', marginBottom: 6, fontSize: '1rem' }}>
            Morphologie-Grundlagen abgeschlossen
          </div>
          <p style={{ fontSize: '0.9rem', margin: 0 }}>
            Du hast die Morphologie-Grundlagen (2.1-2.11) gelernt. <strong>Wechsle jetzt zu Modul 3 (Vers-Werkstatt)</strong> um dein Wissen am echten Qurantext anzuwenden. Die Lektionen ab 2.12 sind Vertiefungen — du kannst sie parallel zur Textarbeit bearbeiten wenn du in Modul 3 auf bestimmte Themen stößt.
          </p>
          <p style={{ fontSize: '0.85rem', margin: '8px 0 0', color: 'var(--text-secondary)' }}>
            Wichtig: Bevor du Modul 3 startest, lerne die Partikeln (wechsle oben zu "Syntax und Partikeln", Lektionen 4.1-4.7). Modul 3 setzt Partikelwissen voraus.
          </p>
        </div>
      )}

      {/* Lesson cards */}
      <div style={S.grid}>
        {lessons.map((lesson) => {
          const unlocked = progress.unlocked.includes(lesson.id);
          const score = progress.scores[lesson.id];
          const passed =
            score != null && score >= activeData.meta.passingScore;
          return (
            <div
              key={lesson.id}
              style={S.card(!unlocked)}
              onClick={() => unlocked && setSelectedLesson(lesson.id)}
              onMouseEnter={(e) => {
                if (unlocked)
                  e.currentTarget.style.boxShadow = 'var(--shadow)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    color: 'var(--accent-teal)',
                    fontSize: '0.85rem',
                  }}
                >
                  {lesson.id}
                </span>
                {!unlocked && (
                  <span
                    style={{
                      fontSize: '1rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    &#x1F512;
                  </span>
                )}
                {passed && (
                  <span
                    style={{
                      fontSize: '1rem',
                      color: 'var(--correct)',
                    }}
                  >
                    &#x2713;
                  </span>
                )}
              </div>
              <div style={S.cardTitle}>{lesson.title}</div>
              <div style={S.cardDesc}>{lesson.description}</div>
              {score != null && (
                <div style={S.badge(passed)}>
                  {passed
                    ? `Bestanden (${score}%)`
                    : `${score}% — nicht bestanden`}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
