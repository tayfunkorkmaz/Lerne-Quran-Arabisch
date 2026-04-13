import { useState, useCallback, useEffect, useMemo } from 'react';
import stagesData from '../data/advanced-stages.json';
import balaghaData from '../data/balagha-lessons.json';
import disambiguationData from '../data/disambiguation-lesson.json';
import discourseData from '../data/discourse-structure.json';
import numberData from '../data/number-system.json';
import tawkidData from '../data/tawkid-lesson.json';
import { saveModuleProgress, loadModuleProgress } from '../utils/storage.js';
import nisbaData from '../data/nisba-lesson.json';
import lanesGuideData from '../data/lanes-reading-guide.json';
import conditionalData from '../data/conditional-syntax.json';
import interrogativeData from '../data/interrogative-syntax.json';
import istithnaData from '../data/istithna-syntax.json';
import qasamData from '../data/qasam-syntax.json';
import nidaData from '../data/nida-syntax.json';
import taqdimData from '../data/taqdim-takhir.json';
import relClauseData from '../data/relative-clause-syntax.json';
import prepSemanticsData from '../data/preposition-semantics.json';
import syntaxSupplData from '../data/syntax-supplementary.json';
import halData from '../data/hal-syntax.json';
import tamyizData from '../data/tamyiz-syntax.json';
import masdarClauseData from '../data/masdar-clause.json';
import badalData from '../data/badal-syntax.json';
import zarfData from '../data/zarf-syntax.json';
import mafUlMutlaqData from '../data/maf-ul-mutlaq.json';
import mafUlLiajlihiData from '../data/maf-ul-liajlihi.json';
import wawDisambigData from '../data/waw-disambiguation.json';
import jumlaFiMahallData from '../data/jumla-fi-mahall.json';
import mafUlMaathuData from '../data/maf-ul-maahu.json';
import negationData from '../data/negation-syntax.json';
import syntaxRareData from '../data/syntax-rare.json';
import prosodieData from '../data/prosodie-lessons.json';
import semiticCognatesData from '../data/semitic-cognates.json';

/* ================================================================
   Modul 7 — Fortgeschrittene Stufen (5–12) + Balagha (Rhetorik)
              + Zahlwörter + Tawkid + Disambiguierung + Diskurs
   Rendert learnContent, exercises und testContent aus den jeweiligen
   JSON-Dateien.
   ================================================================ */

const { stages } = stagesData;
const balaghaLessons = balaghaData?.lessons || [];
const disambiguationStages = disambiguationData?.stages || [];
const discourseStages = discourseData?.stages || [];
const numberLessons = numberData?.lessons || [];
const tawkidLessons = tawkidData?.lessons || [];
const nisbaLessons = nisbaData?.lessons || [];
const lanesGuideLessons = lanesGuideData?.lessons || [];
const conditionalLessons = conditionalData?.lessons || [];
const interrogativeLessons = interrogativeData?.lessons || [];
const istithnaLessons = istithnaData?.lessons || [];
const qasamLessons = qasamData?.lessons || [];
const nidaLessons = nidaData?.lessons || [];
const taqdimLessons = taqdimData?.lessons || [];
const relClauseLessons = relClauseData?.lessons || [];
const prepSemanticsLessons = prepSemanticsData?.lessons || [];
const syntaxSupplLessons = Array.isArray(syntaxSupplData) ? syntaxSupplData : [];
const halLessons = halData?.lessons || [];
const tamyizLessons = tamyizData?.lessons || [];
const masdarClauseLessons = masdarClauseData?.lessons || [];
const badalLessons = badalData?.lessons || [];
const zarfLessons = zarfData?.lessons || [];
const mafUlMutlaqLessons = mafUlMutlaqData?.lessons || [];
const mafUlLiajlihiLessons = mafUlLiajlihiData?.lessons || [];
const wawDisambigLessons = wawDisambigData?.lessons || [];
const jumlaFiMahallLessons = jumlaFiMahallData?.lessons || [];
const mafUlMaathuLessons = mafUlMaathuData?.lessons || [];
const negationLessons = negationData?.lessons || [];
const syntaxRareLessons = syntaxRareData?.lessons || [];
const prosodieLessons = prosodieData?.lessons || [];
const semiticCognates = semiticCognatesData?.cognates || [];

// ───────────────────────────── styles ──────────────────────────────

const S = {
  page: {
    display: 'flex', flexDirection: 'column', minHeight: '100vh',
    background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'var(--font-ui)',
  },
  header: {
    padding: '24px 32px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)',
  },
  headerTitle: { fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: 4 },
  headerSub: { color: 'var(--text-secondary)', fontSize: '0.95rem' },
  content: { padding: '24px 32px', maxWidth: 900, margin: '0 auto', width: '100%' },
  backBtn: {
    background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
    fontSize: '0.9rem', padding: '8px 0', marginBottom: 16,
  },
  card: {
    background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8,
    padding: '20px 24px', marginBottom: 12, cursor: 'pointer', transition: 'border-color 0.2s',
  },
  cardNumber: {
    display: 'inline-block', background: 'var(--accent)', color: '#fff', borderRadius: 6,
    padding: '2px 10px', fontSize: '0.85rem', fontWeight: 700, marginRight: 12,
  },
  cardTitle: { fontSize: '1.1rem', fontWeight: 600 },
  cardDesc: { color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 },
  section: {
    background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8,
    padding: '20px 24px', marginBottom: 16,
  },
  sectionTitle: { fontSize: '1.1rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-heading)' },
  sectionContent: { lineHeight: 1.7, whiteSpace: 'pre-line' },
  arabic: { fontFamily: 'var(--font-arabic, "Scheherazade New", serif)', fontSize: '1.3rem', direction: 'rtl' },
  btn: {
    background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6,
    padding: '10px 20px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600,
  },
  btnSecondary: {
    background: 'var(--bg-secondary)', color: 'var(--text-primary)',
    border: '1px solid var(--border)', borderRadius: 6,
    padding: '10px 20px', cursor: 'pointer', fontSize: '0.95rem',
  },
  optionBtn: {
    display: 'block', width: '100%', textAlign: 'left',
    background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6,
    padding: '12px 16px', marginBottom: 8, cursor: 'pointer', fontSize: '0.95rem',
    color: 'var(--text-primary)',
  },
  feedbackCorrect: {
    background: 'var(--correct-bg)', border: '1px solid var(--correct)',
    borderRadius: 8, padding: '16px 20px', marginTop: 12,
  },
  feedbackWrong: {
    background: 'var(--incorrect-bg)', border: '1px solid var(--incorrect)',
    borderRadius: 8, padding: '16px 20px', marginTop: 12,
  },
  progress: { color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16, textAlign: 'right' },
  score: { fontSize: '3rem', fontWeight: 700, textAlign: 'center', margin: '24px 0', color: 'var(--accent)' },
  tabs: { display: 'flex', gap: 8, marginBottom: 24 },
  tab: {
    padding: '8px 20px', borderRadius: 6, border: '1px solid var(--border)',
    background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: '0.9rem',
    color: 'var(--text-primary)',
  },
  tabActive: {
    padding: '8px 20px', borderRadius: 6, border: '1px solid var(--accent)',
    background: 'var(--accent)', cursor: 'pointer', fontSize: '0.9rem', color: '#fff', fontWeight: 600,
  },
};

// ───────────────────────────── Section Renderer ──────────────────

function RenderSection({ section }) {
  if (section.type === 'explanation') {
    return (
      <div style={S.section}>
        <h4 style={S.sectionTitle}>{section.title}</h4>
        <div style={S.sectionContent}>{section.content}</div>
      </div>
    );
  }

  if (section.type === 'example' && section.examples) {
    return (
      <div style={S.section}>
        <h4 style={S.sectionTitle}>{section.title}</h4>
        {section.examples.map((ex, i) => (
          <div key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: i < section.examples.length - 1 ? '1px solid var(--border)' : 'none' }}>
            {ex.root && <p><strong>Wurzel:</strong> <span style={S.arabic}>{ex.root}</span> ({ex.transliteration})</p>}
            {ex.lanesSummary && <p style={{ marginTop: 8 }}>{ex.lanesSummary}</p>}
            {ex.quranOccurrences && <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{ex.quranOccurrences}</p>}
            {ex.keyVerses && ex.keyVerses.map((v, j) => (
              <p key={j} style={{ marginTop: 4, paddingLeft: 16, borderLeft: '2px solid var(--accent)' }}>
                <strong>{v.ref}:</strong> {v.note}
              </p>
            ))}
            {ex.ref && <p><strong>{ex.ref}:</strong> {ex.arabic && <span style={S.arabic}> {ex.arabic}</span>}</p>}
            {/* Support disambiguation/discourse fields */}
            {ex.location && !ex.ref && <p><strong>{ex.location}:</strong> {ex.consonantal && <span style={S.arabic}> {ex.consonantal}</span>}{ex.arabic && <span style={S.arabic}> {ex.arabic}</span>}</p>}
            {ex.transliteration && !ex.root && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 2 }}>{ex.transliteration}</p>}
            {ex.note && <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: '0.9rem' }}>{ex.note}</p>}
            {ex.analysis && <p style={{ marginTop: 4, lineHeight: 1.7 }}>{ex.analysis}</p>}
            {ex.explanation && !ex.analysis && <p style={{ marginTop: 4 }}>{ex.explanation}</p>}
          </div>
        ))}
      </div>
    );
  }

  if (section.type === 'quranExamples' && section.examples) {
    return (
      <div style={S.section}>
        <h4 style={S.sectionTitle}>{section.title || 'Quran-Beispiele'}</h4>
        {section.examples.map((ex, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <p><strong>{ex.ref}:</strong> <span style={S.arabic}>{ex.arabic}</span></p>
            {ex.explanation && <p style={{ color: 'var(--text-secondary)', marginTop: 2 }}>{ex.explanation}</p>}
          </div>
        ))}
      </div>
    );
  }

  // Fallback for unknown types
  return (
    <div style={S.section}>
      {section.title && <h4 style={S.sectionTitle}>{section.title}</h4>}
      {section.content && <div style={S.sectionContent}>{section.content}</div>}
    </div>
  );
}

// ───────────────────────────── Exercise Renderer ─────────────────

function ExerciseCard({ exercise }) {
  return (
    <div style={S.section}>
      <h4 style={S.sectionTitle}>{exercise.type === 'phonosemantic' ? 'Phonosemantik-Aufgabe' : exercise.type === 'verse_group' ? 'Vers-Gruppenarbeit' : 'Aufgabe'}</h4>
      <p style={{ marginBottom: 8 }}>{exercise.prompt}</p>
      {exercise.hint && (
        <details style={{ marginTop: 8 }}>
          <summary style={{ cursor: 'pointer', color: 'var(--accent)' }}>Hinweis anzeigen</summary>
          <p style={{ marginTop: 8, paddingLeft: 16, borderLeft: '2px solid var(--accent)', color: 'var(--text-secondary)' }}>{exercise.hint}</p>
        </details>
      )}
    </div>
  );
}

// ───────────────────────────── Test Mode ──────────────────────────

function TestMode({ stage, onBack, onPass }) {
  const questions = stage.testContent?.exercises || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const current = questions[currentIndex];
  const isFinished = currentIndex >= questions.length;

  const checkAnswer = useCallback((chosenIndex) => {
    const isCorrect = chosenIndex === current.correct;
    setFeedback({ correct: isCorrect, correctIndex: current.correct });
    setScore(s => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
  }, [current]);

  const next = useCallback(() => {
    setCurrentIndex(i => i + 1);
    setFeedback(null);
  }, []);

  useEffect(() => {
    if (isFinished && score.total > 0) {
      const pct = Math.round((score.correct / score.total) * 100);
      if (pct >= 80 && onPass) onPass(stage.id);
    }
  }, [isFinished, score, stage.id, onPass]);

  if (!questions.length) {
    return (
      <div style={S.content}>
        <button style={S.backBtn} onClick={onBack}>Zurück</button>
        <p>Keine Prüfungsfragen für diese Stufe vorhanden.</p>
      </div>
    );
  }

  if (isFinished) {
    const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
    return (
      <div style={S.content}>
        <button style={S.backBtn} onClick={onBack}>Zurück</button>
        <h3>Ergebnis — Stufe {stage.id}: {stage.title}</h3>
        <div style={S.score}>{score.correct} / {score.total}</div>
        <p style={{ textAlign: 'center' }}>
          {pct >= 80
            ? 'Gut! Du hast diese Stufe bestanden.'
            : 'Wiederhole den Lernmodus und versuche es erneut.'}
        </p>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button style={S.btn} onClick={() => { setCurrentIndex(0); setFeedback(null); setScore({ correct: 0, total: 0 }); }}>
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={S.content}>
      <button style={S.backBtn} onClick={onBack}>Zurück</button>
      <h3>Prüfung — Stufe {stage.id}: {stage.title}</h3>
      <div style={S.progress}>{currentIndex + 1} / {questions.length}</div>
      <p style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 16 }}>{current.question}</p>
      {!feedback ? (
        <div>
          {current.options.map((opt, i) => (
            <button key={i} style={S.optionBtn} onClick={() => checkAnswer(i)}
              onMouseEnter={e => e.target.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.target.style.borderColor = 'var(--border)'}>
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <div style={feedback.correct ? S.feedbackCorrect : S.feedbackWrong}>
          <p style={{ fontWeight: 600 }}>
            {feedback.correct ? 'Richtig!' : `Nicht ganz. Die richtige Antwort ist: ${current.options[feedback.correctIndex]}`}
          </p>
          <button style={{ ...S.btn, marginTop: 12 }} onClick={next}>Weiter</button>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────── Stage Detail View ─────────────────

function StageDetail({ stage, onBack, onPass }) {
  const [mode, setMode] = useState('learn'); // 'learn' | 'exercises' | 'test'

  if (mode === 'test') {
    return <TestMode stage={stage} onBack={() => setMode('learn')} onPass={onPass} />;
  }

  const sections = stage.learnContent?.sections || [];
  const exercises = stage.exercises || [];

  return (
    <div style={S.content}>
      <button style={S.backBtn} onClick={onBack}>Zurück zur Übersicht</button>
      <h2 style={{ marginBottom: 4 }}>Stufe {stage.id} — {stage.title}</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>{stage.description}</p>

      <div style={S.tabs}>
        <button style={mode === 'learn' ? S.tabActive : S.tab} onClick={() => setMode('learn')}>Lernmodus</button>
        <button style={mode === 'exercises' ? S.tabActive : S.tab} onClick={() => setMode('exercises')}>
          Aufgaben ({exercises.length})
        </button>
        <button style={S.tab} onClick={() => setMode('test')}>
          Prüfmodus ({(stage.testContent?.exercises || []).length})
        </button>
      </div>

      {mode === 'learn' && (
        <>
          {sections.map((sec, i) => <RenderSection key={i} section={sec} />)}
          {sections.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Kein Lerninhalt vorhanden.</p>}
        </>
      )}

      {mode === 'exercises' && (
        <>
          {exercises.map((ex, i) => <ExerciseCard key={i} exercise={ex} />)}
          {exercises.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Keine Aufgaben vorhanden.</p>}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════ MAIN COMPONENT ══════════════════════

export default function Module7() {
  const [selectedStage, setSelectedStage] = useState(null);
  const [passed, setPassed] = useState({});

  useEffect(() => {
    loadModuleProgress(7).then(data => {
      if (data?.passed) setPassed(data.passed);
    }).catch(() => {});
  }, []);

  const handlePass = useCallback((stageId) => {
    setPassed(prev => {
      const next = { ...prev, [stageId]: { passedAt: new Date().toISOString() } };
      saveModuleProgress(7, { passed: next }).catch(() => {});
      return next;
    });
  }, []);

  if (selectedStage !== null) {
    // Check if it's a number lesson
    if (typeof selectedStage === 'string' && selectedStage.startsWith('num_')) {
      const lessonId = selectedStage.replace('num_', '')
      const lesson = numberLessons.find(l => l.id === lessonId)
      if (lesson) {
        const asStage = {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          learnContent: lesson.learnContent,
          exercises: lesson.exercises || [],
          testContent: lesson.testContent || { exercises: [] },
        }
        return (
          <div style={S.page}>
            <StageDetail stage={asStage} onBack={() => setSelectedStage(null)} onPass={handlePass} />
          </div>
        )
      }
    }
    // Check if it's a tawkid lesson
    if (typeof selectedStage === 'string' && selectedStage.startsWith('tawkid_')) {
      const lessonId = selectedStage.replace('tawkid_', '')
      const lesson = tawkidLessons.find(l => l.id === lessonId)
      if (lesson) {
        const asStage = {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          learnContent: lesson.learnContent,
          exercises: lesson.exercises || [],
          testContent: lesson.testContent || { exercises: [] },
        }
        return (
          <div style={S.page}>
            <StageDetail stage={asStage} onBack={() => setSelectedStage(null)} onPass={handlePass} />
          </div>
        )
      }
    }
    // Generic lesson handler for simple prefix-based lookups
    const prefixSources = [
      { prefix: 'nisba_', lessons: nisbaLessons },
      { prefix: 'lanes_', lessons: lanesGuideLessons },
      { prefix: 'neg_', lessons: negationLessons },
      { prefix: 'cond_', lessons: conditionalLessons },
      { prefix: 'interr_', lessons: interrogativeLessons },
      { prefix: 'istithna_', lessons: istithnaLessons },
      { prefix: 'qasam_', lessons: qasamLessons },
      { prefix: 'nida_', lessons: nidaLessons },
      { prefix: 'taqdim_', lessons: taqdimLessons },
      { prefix: 'relclause_', lessons: relClauseLessons },
      { prefix: 'prep_', lessons: prepSemanticsLessons },
    { prefix: 'supp_', lessons: syntaxSupplLessons },
    { prefix: 'hal_', lessons: halLessons },
    { prefix: 'tamyiz_', lessons: tamyizLessons },
    { prefix: 'masdar_', lessons: masdarClauseLessons },
    { prefix: 'badal_', lessons: badalLessons },
    { prefix: 'zarf_', lessons: zarfLessons },
    { prefix: 'mutlaq_', lessons: mafUlMutlaqLessons },
    { prefix: 'liajlihi_', lessons: mafUlLiajlihiLessons },
    { prefix: 'waw_', lessons: wawDisambigLessons },
    { prefix: 'jfm_', lessons: jumlaFiMahallLessons },
    { prefix: 'maathu_', lessons: mafUlMaathuLessons },
    { prefix: 'rare_', lessons: syntaxRareLessons },
    { prefix: 'prosodie_', lessons: prosodieLessons },
    ];
    for (const { prefix, lessons } of prefixSources) {
      if (typeof selectedStage === 'string' && selectedStage.startsWith(prefix)) {
        const lessonId = selectedStage.replace(prefix, '')
        const lesson = lessons.find(l => l.id === lessonId)
        if (lesson) {
          const asStage = { id: lesson.id, title: lesson.title, description: lesson.description || '', learnContent: lesson.learnContent || { sections: [] }, exercises: lesson.exercises || [], testContent: lesson.testContent || { exercises: [] } }
          return (<div style={S.page}><StageDetail stage={asStage} onBack={() => setSelectedStage(null)} onPass={handlePass} /></div>)
        }
      }
    }
    // Check if it's a balagha lesson
    if (typeof selectedStage === 'string' && selectedStage.startsWith('balagha_')) {
      const lessonId = selectedStage.replace('balagha_', '')
      const lesson = balaghaLessons.find(l => l.id === lessonId)
      if (lesson) {
        const asStage = {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          learnContent: lesson.learnContent,
          exercises: lesson.exercises || [],
          testContent: lesson.testContent || { exercises: [] },
        }
        return (
          <div style={S.page}>
            <StageDetail stage={asStage} onBack={() => setSelectedStage(null)} onPass={handlePass} />
          </div>
        )
      }
    }
    // Check if it's a disambiguation stage
    if (typeof selectedStage === 'string' && selectedStage.startsWith('disam_')) {
      const stageId = selectedStage.replace('disam_', '')
      const dStage = disambiguationStages.find(s => s.id === stageId)
      if (dStage) {
        const asStage = {
          id: dStage.id,
          title: dStage.title,
          description: dStage.description || disambiguationData.meta?.description || '',
          learnContent: dStage.learnContent,
          exercises: dStage.exercises || [],
          testContent: dStage.testContent || { exercises: [] },
        }
        return (
          <div style={S.page}>
            <StageDetail stage={asStage} onBack={() => setSelectedStage(null)} onPass={handlePass} />
          </div>
        )
      }
    }
    // Check if it's a discourse stage
    if (typeof selectedStage === 'string' && selectedStage.startsWith('disc_')) {
      const stageId = selectedStage.replace('disc_', '')
      const matchedStage = discourseStages.find(s => s.id === stageId)
      if (matchedStage) {
        const asStage = {
          id: matchedStage.id,
          title: matchedStage.title,
          description: matchedStage.description || discourseData.meta?.description || '',
          learnContent: matchedStage.learnContent,
          exercises: matchedStage.exercises || [],
          testContent: matchedStage.testContent || { exercises: [] },
        }
        return (
          <div style={S.page}>
            <StageDetail stage={asStage} onBack={() => setSelectedStage(null)} onPass={handlePass} />
          </div>
        )
      }
    }
    const stage = stages.find(s => s.id === selectedStage);
    if (stage) {
      return (
        <div style={S.page}>
          <StageDetail stage={stage} onBack={() => setSelectedStage(null)} onPass={handlePass} />
        </div>
      );
    }
    // Fallback: stage not found — return to home
    return (
      <div style={S.page}>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Stufe nicht gefunden.</p>
          <button style={{ padding: '8px 20px', borderRadius: 8, background: 'var(--accent-teal)', color: '#fff', border: 'none', cursor: 'pointer' }}
            onClick={() => setSelectedStage(null)}>Zurück zur Übersicht</button>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.headerTitle}>Fortgeschrittene Stufen (5–12)</div>
        <div style={S.headerSub}>
          Von semantischen Feldern bis zum direkten Verstehen — acht Vertiefungsstufen.
        </div>
      </div>
      <div style={S.content}>
        {stages.map(stage => (
          <div
            key={stage.id}
            style={{ ...S.card, borderColor: passed[stage.id] ? 'var(--success, #4caf50)' : undefined }}
            onClick={() => setSelectedStage(stage.id)}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = passed[stage.id] ? 'var(--success, #4caf50)' : 'var(--border)'}
          >
            <div>
              <span style={S.cardNumber}>Stufe {stage.id}</span>
              <span style={S.cardTitle}>{stage.title}</span>
              {passed[stage.id] && <span style={{ marginLeft: 8, color: 'var(--success, #4caf50)', fontSize: '0.85rem' }}>bestanden</span>}
            </div>
            <div style={S.cardDesc}>{stage.description}</div>
            <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {stage.learnContent?.sections?.length || 0} Sektionen · {stage.exercises?.length || 0} Aufgaben · {stage.testContent?.exercises?.length || 0} Prüfungsfragen
            </div>
          </div>
        ))}

        {/* Disambiguation Section */}
        {disambiguationStages.length > 0 && (
          <>
            <div style={{ marginTop: 32, marginBottom: 16 }}>
              <div style={{ ...S.headerTitle, fontSize: '1.3rem' }}>Disambiguation — Mehrdeutigkeiten des Konsonantentextes</div>
              <div style={S.headerSub}>
                {disambiguationData.meta?.description || 'Systematische Methode zur Entscheidung zwischen multiplen grammatisch möglichen Lesungen.'}
              </div>
            </div>
            {disambiguationStages.map(dStage => (
              <div
                key={dStage.id}
                style={S.card}
                onClick={() => setSelectedStage(`disam_${dStage.id}`)}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div>
                  <span style={{ ...S.cardNumber, background: '#ff9800' }}>{dStage.id}</span>
                  <span style={S.cardTitle}>{dStage.title}</span>
                </div>
                <div style={S.cardDesc}>{dStage.description || disambiguationData.meta?.description || ''}</div>
                <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {dStage.learnContent?.sections?.length || 0} Sektionen · {dStage.exercises?.length || 0} Aufgaben · {dStage.testContent?.exercises?.length || 0} Prüfungsfragen
                </div>
              </div>
            ))}
          </>
        )}

        {/* Discourse Structure Section */}
        {discourseStages.length > 0 && (
          <>
            <div style={{ marginTop: 32, marginBottom: 16 }}>
              <div style={{ ...S.headerTitle, fontSize: '1.3rem' }}>Diskursstruktur und Textkohärenz</div>
              <div style={S.headerSub}>
                {discourseData.meta?.description || 'Wie Partikel und syntaktische Strukturen den Textfluss organisieren.'}
              </div>
            </div>
            {discourseStages.map(dStage => (
              <div
                key={dStage.id}
                style={S.card}
                onClick={() => setSelectedStage(`disc_${dStage.id}`)}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div>
                  <span style={{ ...S.cardNumber, background: '#00897b' }}>{dStage.id}</span>
                  <span style={S.cardTitle}>{dStage.title}</span>
                </div>
                <div style={S.cardDesc}>{dStage.description || ''}</div>
                <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {dStage.learnContent?.sections?.length || 0} Sektionen · {dStage.exercises?.length || 0} Aufgaben · {dStage.testContent?.exercises?.length || 0} Prüfungsfragen
                </div>
              </div>
            ))}
          </>
        )}

        {/* Balagha / Rhetorik Section */}
        {balaghaLessons.length > 0 && (
          <>
            <div style={{ marginTop: 32, marginBottom: 16 }}>
              <div style={{ ...S.headerTitle, fontSize: '1.3rem' }}>Balagha — Rhetorische Analyse</div>
              <div style={S.headerSub}>
                Sprachwissenschaftliche Analyse rhetorischer Strukturen im Qurantext. {balaghaLessons.length} Lektionen.
              </div>
            </div>
            {balaghaLessons.map(lesson => (
              <div
                key={lesson.id}
                style={S.card}
                onClick={() => setSelectedStage(`balagha_${lesson.id}`)}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div>
                  <span style={{ ...S.cardNumber, background: '#9c27b0' }}>{lesson.id}</span>
                  <span style={S.cardTitle}>{lesson.title}</span>
                </div>
                <div style={S.cardDesc}>{lesson.description}</div>
                <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {lesson.learnContent?.sections?.length || 0} Sektionen · {lesson.exercises?.length || 0} Aufgaben · {lesson.testContent?.exercises?.length || 0} Prüfungsfragen
                </div>
              </div>
            ))}
          </>
        )}

        {/* Zahlwörter Section */}
        {numberLessons.length > 0 && (
          <>
            <div style={{ marginTop: 32, marginBottom: 16 }}>
              <div style={{ ...S.headerTitle, fontSize: '1.3rem' }}>Zahlwörter (العدد)</div>
              <div style={S.headerSub}>
                Kardinal- und Ordinalzahlen, Tamyiz-Regeln, Geschlechtskongruenz. {numberLessons.length} Lektionen.
              </div>
            </div>
            {numberLessons.map(lesson => (
              <div
                key={lesson.id}
                style={{ ...S.card, borderColor: passed[lesson.id] ? 'var(--success, #4caf50)' : undefined }}
                onClick={() => setSelectedStage(`num_${lesson.id}`)}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = passed[lesson.id] ? 'var(--success, #4caf50)' : 'var(--border)'}
              >
                <div>
                  <span style={{ ...S.cardNumber, background: '#e65100' }}>{lesson.id}</span>
                  <span style={S.cardTitle}>{lesson.title}</span>
                  {passed[lesson.id] && <span style={{ marginLeft: 8, color: 'var(--success, #4caf50)', fontSize: '0.85rem' }}>bestanden</span>}
                </div>
                <div style={S.cardDesc}>{lesson.description}</div>
                <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {lesson.learnContent?.sections?.length || 0} Sektionen · {lesson.exercises?.length || 0} Aufgaben · {lesson.testContent?.exercises?.length || 0} Prüfungsfragen
                </div>
              </div>
            ))}
          </>
        )}

        {/* Tawkid Section */}
        {tawkidLessons.length > 0 && (
          <>
            <div style={{ marginTop: 32, marginBottom: 16 }}>
              <div style={{ ...S.headerTitle, fontSize: '1.3rem' }}>Tawkid — Bekräftigung (التوكيد)</div>
              <div style={S.headerSub}>
                Wörtliche und semantische Bekräftigung im Quranischen Arabisch. {tawkidLessons.length} Lektionen.
              </div>
            </div>
            {tawkidLessons.map(lesson => (
              <div
                key={lesson.id}
                style={{ ...S.card, borderColor: passed[lesson.id] ? 'var(--success, #4caf50)' : undefined }}
                onClick={() => setSelectedStage(`tawkid_${lesson.id}`)}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = passed[lesson.id] ? 'var(--success, #4caf50)' : 'var(--border)'}
              >
                <div>
                  <span style={{ ...S.cardNumber, background: '#1565c0' }}>{lesson.id}</span>
                  <span style={S.cardTitle}>{lesson.title}</span>
                  {passed[lesson.id] && <span style={{ marginLeft: 8, color: 'var(--success, #4caf50)', fontSize: '0.85rem' }}>bestanden</span>}
                </div>
                <div style={S.cardDesc}>{lesson.description}</div>
                <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {lesson.learnContent?.sections?.length || 0} Sektionen · {lesson.exercises?.length || 0} Aufgaben · {lesson.testContent?.exercises?.length || 0} Prüfungsfragen
                </div>
              </div>
            ))}
          </>
        )}

        {/* Additional Grammar Sections */}
        {[
          { lessons: negationLessons, prefix: 'neg_', title: 'Negation (النفي)', sub: 'لا, لم, لن, ما, ليس — Wirkung auf Kasus und Modus.', color: '#1b5e20' },
          { lessons: conditionalLessons, prefix: 'cond_', title: 'Konditionalsätze (الشرط)', sub: 'Real vs. irreal, Partikelrektion, Jussiv-Auslössung.', color: '#00695c' },
          { lessons: interrogativeLessons, prefix: 'interr_', title: 'Fragepartikel-System (الاستفهام)', sub: 'أ vs. هل, W-Fragen, rhetorische Frage.', color: '#4527a0' },
          { lessons: istithnaLessons, prefix: 'istithna_', title: 'Ausnahmesyntax (الاستثناء)', sub: 'إلا, غير, سوى — Kasusregeln in positiven und verneinten Sätzen.', color: '#ad1457' },
          { lessons: qasamLessons, prefix: 'qasam_', title: 'Schwursyntax (القسم)', sub: 'Schwurpartikeln و/ت/ب, Jawab-Marker, kosmische Schwurobjekte.', color: '#1565c0' },
          { lessons: nidaLessons, prefix: 'nida_', title: 'Vokativsyntax (النداء)', sub: 'يا + Munada-Kasusregeln, يا أيها, Anredekonstruktionen.', color: '#e65100' },
          { lessons: taqdimLessons, prefix: 'taqdim_', title: 'Wortstellungsvarianten (التقديم والتأخير)', sub: 'Voranstellung von Objekt, Khabar, PP — Fokus und Restriktion.', color: '#2e7d32' },
          { lessons: relClauseLessons, prefix: 'relclause_', title: 'Relativsätze (الجملة الصلة)', sub: 'الذي/التي/ما/من, Wiederaufnahmepronomen, asyndetische Relativsätze.', color: '#6a1b9a' },
          { lessons: prepSemanticsLessons, prefix: 'prep_', title: 'Präpositions-Semantik (حروف الجر)', sub: 'Alle Funktionen von مِن، بِ، فِي، عَلَى، لِ، عَنْ، إِلَى، كَ، حَتَّى — systematisch mit Quranbelegen.', color: '#00838f' },
          { lessons: nisbaLessons, prefix: 'nisba_', title: 'Nisba-Adjektiv (النسبة)', sub: 'Zugehörigkeitsadjektive und analytische Alternativen.', color: '#bf360c' },
          { lessons: lanesGuideLessons, prefix: 'lanes_', title: "Lane's Lexicon — Leseanleitung", sub: 'Wie man einen Wörterbuch-Eintrag liest und versteht.', color: '#33691e' },
          { lessons: syntaxSupplLessons, prefix: 'supp_', title: 'Ergänzende Grammatik (Kada-Verben, Herz-Verben, Fünf-Verben-Regel)', sub: 'Kada-Verben (كَادَ/عَسَى), Zanna-Verben mit doppeltem Akkusativ, und die Fünf-Verben-Regel (الأَفْعَال الْخَمْسَة).', color: '#5d4037' },
          { lessons: halLessons, prefix: 'hal_', title: 'Hal — Zustandsakkusativ (الحال)', sub: 'Hal als Nomen/Partizip, als Verbalsatz (Jumla Haliyya) und Identifikation des Sahib al-Hal.', color: '#00695c' },
          { lessons: tamyizLessons, prefix: 'tamyiz_', title: 'Tamyiz — Spezifikationsakkusativ (التمييز)', sub: 'Tamyiz nach Zahlen (al-Adad) und nach Elativ-Adjektiven (al-Nisbah).', color: '#1565c0' },
          { lessons: masdarClauseLessons, prefix: 'masdar_', title: 'Masdar-Satz — ان und انّ als Nominalisierung', sub: 'ان + Subjunktiv und انّ + Nominalsatz als Subjekt, Objekt oder nach Präposition.', color: '#4527a0' },
          { lessons: badalLessons, prefix: 'badal_', title: 'Badal — Apposition (البدل)', sub: 'Badal kull, Badal ba\'d min kull und Badal al-Ishtimal mit Quranbelegen.', color: '#ad1457' },
          { lessons: zarfLessons, prefix: 'zarf_', title: 'Ẓarf — Adverbialer Akkusativ (الظرف)', sub: 'Ẓarf Zaman und Ẓarf Makan ohne Präposition; يَوْمَ + Satz als Satzzarf.', color: '#e65100' },
          { lessons: mafUlMutlaqLessons, prefix: 'mutlaq_', title: "Mafʿul Mutlaq — Absolutes Objekt (المفعول المطلق)", sub: 'Masdar zur Betonung (توكيد) und zur Typenangabe (نوع); als Verb-Ersatz.', color: '#2e7d32' },
          { lessons: mafUlLiajlihiLessons, prefix: 'liajlihi_', title: "Mafʿul li-Ajlihi — Kausaler Akkusativ (المفعول لأجله)", sub: 'Masdar im Akkusativ als Grund- oder Zweckangabe ohne Präposition.', color: '#6a1b9a' },
          { lessons: wawDisambigLessons, prefix: 'waw_', title: 'Waw-Disambiguierung — die sechs Funktionen von وَ', sub: 'Atf, Hal, Qasam, Ma\'iyya, Ibtida\', Rubba — systematisch mit Erkennungsalgorithmus.', color: '#00838f' },
          { lessons: jumlaFiMahallLessons, prefix: 'jfm_', title: 'Jumla fi Mahall — Satz in Kasusposition (في محل)', sub: 'Sätze in Nominativ-, Akkusativ- und Genitivposition; Silah-Sätze ohne محل.', color: '#bf360c' },
          { lessons: mafUlMaathuLessons, prefix: 'maathu_', title: "Mafʿul Maʿahu — Begleitobjekt (المفعول معه)", sub: 'Akkusativ nach وَ der Gleichzeitigkeit; Abgrenzung von Waw al-\'Atf.', color: '#33691e' },
          { lessons: syntaxRareLessons, prefix: 'rare_', title: 'Seltene syntaktische Phänomene', sub: 'Iltifāt, Ḥāl muʾakkida, Taʿajjub, Qad-Varianten, إِذَا-Typen, كان+Partizip, Mafʿūl muṭlaq Subtypen, Ishtighāl.', color: '#263238' },
          { lessons: prosodieLessons, prefix: 'prosodie_', title: 'Saj\' und Prosodie', sub: 'Reim-Schemata (Fāṣila), Pausalvokale, Reim-Gruppen-Wechsel, Parallelismus, rhythmische Verdichtung.', color: '#3e2723' },
        ].filter(s => s.lessons.length > 0).map(section => (
          <div key={section.prefix} style={{ marginTop: 32, marginBottom: 16 }}>
            <div style={{ ...S.headerTitle, fontSize: '1.3rem' }}>{section.title}</div>
            <div style={S.headerSub}>{section.sub} {section.lessons.length} Lektionen.</div>
            {section.lessons.map(lesson => (
              <div key={lesson.id}
                style={{ ...S.card, borderColor: passed[lesson.id] ? 'var(--success, #4caf50)' : undefined }}
                onClick={() => setSelectedStage(`${section.prefix}${lesson.id}`)}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = passed[lesson.id] ? 'var(--success, #4caf50)' : 'var(--border)'}>
                <div>
                  <span style={{ ...S.cardNumber, background: section.color }}>{lesson.id}</span>
                  <span style={S.cardTitle}>{lesson.title}</span>
                  {passed[lesson.id] && <span style={{ marginLeft: 8, color: 'var(--success, #4caf50)', fontSize: '0.85rem' }}>bestanden</span>}
                </div>
                <div style={S.cardDesc}>{lesson.description || ''}</div>
                <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {lesson.learnContent?.sections?.length || 0} Sektionen · {lesson.exercises?.length || 0} Aufgaben · {lesson.testContent?.exercises?.length || 0} Prüfungsfragen
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Semitische Kognaten — Referenz */}
        {semiticCognates.length > 0 && (
          <SemiticCognatesReference cognates={semiticCognates} meta={semiticCognatesData.meta} />
        )}
      </div>
    </div>
  );
}

// ───────────────────────────── Semitische Kognaten Referenz ──────────────────────────────

function SemiticCognatesReference({ cognates, meta }) {
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const filtered = useMemo(() => {
    if (!query.trim()) return cognates;
    const q = query.trim().toLowerCase();
    return cognates.filter(c =>
      (c.root || '').toLowerCase().includes(q) ||
      (c.arabicRoot || '').includes(q) ||
      (c.arabicMeaning || '').toLowerCase().includes(q) ||
      Object.values(c.cognates || {}).some(v => (v.form || '').toLowerCase().includes(q) || (v.meaning || '').toLowerCase().includes(q))
    );
  }, [cognates, query]);

  const langLabels = {
    hebrew: 'Hebräisch',
    aramaic: 'Aramäisch',
    syriac: 'Syrisch',
    geez: 'Geʿez',
    akkadian: 'Akkadisch',
    ugaritic: 'Ugaritisch',
    sabaean: 'Sabäisch',
    nabataean: 'Nabatäisch',
    greek: 'Griechisch',
    persian: 'Persisch',
    latin: 'Lateinisch',
  };

  return (
    <div style={{ marginTop: 32, marginBottom: 16 }}>
      <div style={{ ...S.headerTitle, fontSize: '1.3rem' }}>Semitische Kognaten — Referenz</div>
      <div style={S.headerSub}>
        {meta?.description || 'Sprachhistorische Parallelen quranischer Wurzeln in Schwestersprachen.'} {cognates.length} Einträge.
      </div>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Suche nach Wurzel, arabischer Bedeutung oder Kognat..."
        style={{ width: '100%', padding: '8px 12px', marginTop: 12, marginBottom: 12, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.95rem' }}
      />
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
        {filtered.length} {filtered.length === 1 ? 'Treffer' : 'Treffer'}
      </div>
      {filtered.map(c => {
        const id = c.root || c.arabicRoot;
        const isOpen = expandedId === id;
        return (
          <div
            key={id}
            style={{ ...S.card, cursor: 'pointer' }}
            onClick={() => setExpandedId(isOpen ? null : id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <div>
                <span style={{ fontFamily: 'var(--font-arabic, serif)', fontSize: '1.25rem', fontWeight: 700, marginRight: 12 }}>
                  {c.arabicRoot || c.root}
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{c.root}</span>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{isOpen ? '−' : '+'}</span>
            </div>
            <div style={{ ...S.cardDesc, marginTop: 6 }}>{c.arabicMeaning}</div>
            {isOpen && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                {Object.entries(c.cognates || {}).map(([lang, entry]) => (
                  <div key={lang} style={{ marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-heading)', marginRight: 8 }}>
                      {langLabels[lang] || lang}:
                    </span>
                    <span style={{ fontStyle: 'italic' }}>{entry.form}</span>
                    <span style={{ color: 'var(--text-secondary)' }}> — {entry.meaning}</span>
                    {entry.source && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: 8 }}>[{entry.source}]</span>}
                  </div>
                ))}
                {c.notes && (
                  <div style={{ marginTop: 10, padding: 10, background: 'var(--bg-secondary)', borderRadius: 4, fontSize: '0.9rem' }}>
                    <strong>Anmerkung:</strong> {c.notes}
                  </div>
                )}
                {c.quranRefs && c.quranRefs.length > 0 && (
                  <div style={{ marginTop: 10, fontSize: '0.85rem' }}>
                    <strong>Quran-Belege:</strong> {c.quranRefs.join(', ')}
                  </div>
                )}
                {c.verifyUrl && (
                  <div style={{ marginTop: 8 }}>
                    <a href={c.verifyUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: '0.85rem' }}>
                      Corpus-Eintrag →
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
