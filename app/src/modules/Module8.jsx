import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import { saveAnnotation, loadAllAnnotations, deleteAnnotation, saveModuleProgress, loadModuleProgress } from '../utils/storage.js'
import { stripEmbeddedBasmala } from '../utils/arabic.js'
import rasmData from '../data/rasm-orthography.json'
import hapaxData from '../data/hapax-legomena.json'
import loanwordData from '../data/lehnwoerter.json'
import collocationData from '../data/collocations.json'
import rasmVocDrillDataBase from '../data/rasm-vocalization-drill.json'
import pausalFormsDrillDataBase from '../data/pausal-forms-drill.json'

// Extension files merged with base data
import rasmVocExt from '../data/rasm-vocalization-drill-ext.json'
import rasmVocGenerated from '../data/rasm-vocalization-drill-generated.json'
import pausalExt from '../data/pausal-forms-drill-ext.json'
const rasmVocDrillData = {
  ...rasmVocDrillDataBase,
  exercises: [...(rasmVocDrillDataBase.exercises || []), ...(rasmVocExt.exercises || []), ...(rasmVocGenerated.exercises || [])],
}
const pausalFormsDrillData = {
  ...pausalFormsDrillDataBase,
  exercises: [...(pausalFormsDrillDataBase.exercises || []), ...(pausalExt.exercises || [])],
}
import alifWaslaDrillDataBase from '../data/alif-wasla-drill.json'
import alifWaslaGenerated from '../data/alif-wasla-generated.json'
const alifWaslaDrillData = {
  ...alifWaslaDrillDataBase,
  categories: [...(alifWaslaDrillDataBase.categories || []), ...(alifWaslaGenerated.categories || []).filter(gc => !alifWaslaDrillDataBase.categories?.some(bc => bc.id === gc.id))],
}
import weakRootDrillDataBase from '../data/weak-root-transformation-drill.json'
import weakRootGenerated from '../data/weak-root-generated.json'
const weakRootDrillData = {
  ...weakRootDrillDataBase,
  exercises: [...(weakRootDrillDataBase.exercises || []), ...(weakRootGenerated.exercises || [])],
}
import ringCompDrillData from '../data/ring-composition-drill.json'
import speechActDrillData from '../data/speech-act-drill.json'
import mushafNotationData from '../data/mushaf-notation.json'
import alphabetData from '../data/alphabet.json'

// P3/P4 data
import solarLunarData from '../data/solar-lunar-letters.json'
import alifInventoryData from '../data/alif-inventory.json'
import reverseRasmDrillData from '../data/reverse-rasm-drill.json'
import suraIndexData from '../data/sura-index.json'
import properNamesData from '../data/proper-names.json'
import freqPathData from '../data/frequency-learning-path.json'
import verbFreqData from '../data/verb-form-frequency.json'
import nominalPatternData from '../data/nominal-pattern-inventory.json'
import rasmDecodingData from '../data/rasm-decoding-drill.json'
import rasmGlyphMapping from '../data/rasm-glyph-mapping.json'
import energetikusData from '../data/energetikus-paradigm.json'
import scriptHistoryData from '../data/script-history-lesson.json'
import elativDrillData from '../data/elativ-drill.json'
import quadriliteralData from '../data/quadriliteral-lesson.json'
import phonologySupplementaryData from '../data/phonology-supplementary.json'
import quranSimpleClean from '../data/quran-simple-clean.json'
import layerBuildupDrill from '../data/layer-buildup-drill.json'
import particlesData from '../data/particles.json'
import caseTriggerData from '../data/case-trigger-reference.json'
import weakVerbsDerivedData from '../data/weak-verbs-derived-forms.json'
import { loadQuranRasm, loadQuranUthmani, loadQuranVocalized, loadRootFrequencyComplete, loadMorphologyDB } from '../utils/lazyData.js'
// Lazy-load all sub-components for code-splitting (reduces initial chunk from 7.6MB)
const ContinuousReader = lazy(() => import('../components/ContinuousReader.jsx'))
const DictationExercise = lazy(() => import('../components/DictationExercise.jsx'))
const PrintableSheet = lazy(() => import('../components/PrintableSheet.jsx'))
const WritingExercise = lazy(() => import('../components/WritingExercise.jsx'))
const VocalizationExercise = lazy(() => import('../components/VocalizationExercise.jsx'))
const AmbiguityExercise = lazy(() => import('../components/AmbiguityExercise.jsx'))
const CrossReference = lazy(() => import('../components/CrossReference.jsx'))
const GrammarSidebar = lazy(() => import('../components/GrammarSidebar.jsx'))
const DecompositionExercise = lazy(() => import('../components/DecompositionExercise.jsx'))
const CaseDerivationExercise = lazy(() => import('../components/CaseDerivationExercise.jsx'))
const VerseSynthesisExercise = lazy(() => import('../components/VerseSynthesisExercise.jsx'))
const ErrorCorrectionExercise = lazy(() => import('../components/ErrorCorrectionExercise.jsx'))
const ContextDisambiguationExercise = lazy(() => import('../components/ContextDisambiguationExercise.jsx'))

// P5: Semantic & Grammar drills (gap-filling components)
const PolysemyDrill = lazy(() => import('../components/PolysemyDrill.jsx'))
const VerbFormSemanticDrill = lazy(() => import('../components/VerbFormSemanticDrill.jsx'))
const SynonymContrastDrill = lazy(() => import('../components/SynonymContrastDrill.jsx'))
const SurahMacrostructureDrill = lazy(() => import('../components/SurahMacrostructureDrill.jsx'))
const VerbRectionDrill = lazy(() => import('../components/VerbRectionDrill.jsx'))
const ThematicFieldDrill = lazy(() => import('../components/ThematicFieldDrill.jsx'))
const CongruenceDrill = lazy(() => import('../components/CongruenceDrill.jsx'))
const MasdarDrill = lazy(() => import('../components/MasdarDrill.jsx'))
const VocabularyDrill = lazy(() => import('../components/VocabularyDrill.jsx'))
const HandwritingCanvas = lazy(() => import('../components/HandwritingCanvas.jsx'))
const ClozeExercise = lazy(() => import('../components/ClozeExercise.jsx'))

// P2 drill components
const IrabExercise = lazy(() => import('../components/IrabExercise.jsx'))
const RootExtractionDrill = lazy(() => import('../components/RootExtractionDrill.jsx'))
const PatternRecognitionDrill = lazy(() => import('../components/PatternRecognitionDrill.jsx'))
const PronounSuffixDrill = lazy(() => import('../components/PronounSuffixDrill.jsx'))
const VerbModeDrill = lazy(() => import('../components/VerbModeDrill.jsx'))
const NegationDrill = lazy(() => import('../components/NegationDrill.jsx'))
const HamzaExercise = lazy(() => import('../components/HamzaExercise.jsx'))

// Error Boundary for lazy-loaded components
import { Component } from 'react'
class LazyErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null } }
  static getDerivedStateFromError(error) { return { hasError: true, error } }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>Komponente konnte nicht geladen werden.</p>
          <p style={{ fontSize: '0.85rem', marginBottom: 16 }}>{this.state.error?.message || 'Netzwerkfehler'}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })} style={{
            padding: '8px 20px', borderRadius: 8, background: 'var(--accent-teal)', color: '#fff', border: 'none', cursor: 'pointer'
          }}>Erneut versuchen</button>
        </div>
      )
    }
    return this.props.children
  }
}

/**
 * Module 8: Werkzeuge und Vertiefung
 *
 * Bündelt Werkzeuge die keinem einzelnen Modul zugeordnet sind:
 * - Rasm-Orthographie (Schriftkundliche Analyse des Konsonantentextes)
 * - Fortlaufendes Lesen (ContinuousReader)
 * - Diktatübung (DictationExercise)
 * - Schreibübung (WritingExercise)
 * - Druckbare Referenzblätter (PrintableSheet)
 * - Vokalisierungsübung (VocalizationExercise)
 * - Ambiguitätsübung (AmbiguityExercise)
 * - Konkordanz (CrossReference)
 * - Grammatik-Nachschlagewerk (GrammarSidebar)
 */

const VIEWS = {
  HOME: 'home',
  RASM: 'rasm',
  RASM_TEST: 'rasm_test',
  READER: 'reader',
  DICTATION: 'dictation',
  WRITING: 'writing',
  PRINT: 'print',
  LANES_GUIDE: 'lanes_guide',
  FIRST_VERSE: 'first_verse',
  VOCALIZATION: 'vocalization',
  AMBIGUITY: 'ambiguity',
  CROSS_REF: 'cross_ref',
  GRAMMAR_REF: 'grammar_ref',
  HAPAX: 'hapax',
  LOANWORDS: 'loanwords',
  COLLOCATIONS: 'collocations',
  DECOMPOSITION: 'decomposition',
  CASE_DERIVATION: 'case_derivation',
  VERSE_SYNTHESIS: 'verse_synthesis',
  ERROR_CORRECTION: 'error_correction',
  CONTEXT_DISAMBIG: 'context_disambig',
  // New drills
  IRAB: 'irab',
  ROOT_EXTRACTION: 'root_extraction',
  PATTERN_RECOGNITION: 'pattern_recognition',
  PRONOUN_SUFFIX: 'pronoun_suffix',
  VERB_MODE: 'verb_mode',
  NEGATION: 'negation',
  HAMZA: 'hamza',
  // P2/P3/P4 new drills
  RASM_VOCALIZATION: 'rasm_vocalization',
  PAUSAL_FORMS: 'pausal_forms',
  ALIF_WASLA: 'alif_wasla',
  WEAK_ROOT_TRANSFORM: 'weak_root_transform',
  RING_COMPOSITION: 'ring_composition',
  SPEECH_ACT: 'speech_act',
  MUSHAF_NOTATION: 'mushaf_notation',
  // P3/P4 new reference pages
  SOLAR_LUNAR: 'solar_lunar',
  ALIF_INVENTORY: 'alif_inventory',
  MUQATTAAT_REF: 'muqattaat_ref',
  REVERSE_RASM: 'reverse_rasm',
  SURA_INDEX: 'sura_index',
  PROPER_NAMES: 'proper_names',
  FREQ_PATH: 'freq_path',
  VERB_FREQ: 'verb_freq',
  NOMINAL_PATTERNS: 'nominal_patterns',
  LEXICON: 'lexicon',
  RASM_DECODING: 'rasm_decoding',
  RASM_GLYPH_MAP: 'rasm_glyph_map',
  ENERGETIKUS: 'energetikus',
  SCRIPT_HISTORY: 'script_history',
  // P5: Semantic & Grammar drills
  POLYSEMY: 'polysemy',
  VERB_FORM_SEMANTICS: 'verb_form_semantics',
  SYNONYM_CONTRAST: 'synonym_contrast',
  SURAH_MACROSTRUCTURE: 'surah_macrostructure',
  VERB_RECTION: 'verb_rection',
  THEMATIC_FIELD: 'thematic_field',
  CONGRUENCE: 'congruence',
  MASDAR: 'masdar',
  VOCAB_DRILL: 'vocab_drill',
  HANDWRITING: 'handwriting',
  CLOZE: 'cloze',
  ELATIV: 'elativ',
  QUADRILITERAL: 'quadriliteral',
  PHONOLOGY_SUPP: 'phonology_supp',
  LAYER_COMPARE: 'layer_compare',
  LAYER_BUILDUP: 'layer_buildup',
  ANNOTATIONS: 'annotations',
  CASE_TRIGGER_REF: 'case_trigger_ref',
  WEAK_VERBS_DERIVED: 'weak_verbs_derived',
}

// ===== Layer Compare View =====
function LayerCompareView({ onBack }) {
  const [surahNum, setSurahNum] = useState(1)
  const [startVerse, setStartVerse] = useState(1)
  const [versesPerPage, setVersesPerPage] = useState(3)
  const [layerData, setLayerData] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([loadQuranRasm(), loadQuranUthmani(), loadQuranVocalized()]).then(([rasm, uthmani, vocalized]) => {
      if (!cancelled) setLayerData({ rasm, uthmani, vocalized })
    })
    return () => { cancelled = true }
  }, [])

  const surah = quranSimpleClean.surahs[surahNum - 1]
  const maxVerse = surah ? surah.verses.length : 7
  const endVerse = Math.min(startVerse + versesPerPage - 1, maxVerse)

  const getVerse = (source, sNum, vNum, layerId) => {
    const s = source?.surahs?.[sNum - 1]
    if (!s) return ''
    const v = s.verses?.find(v => v.number === vNum)
    if (!v) return ''
    return stripEmbeddedBasmala(v.text, layerId, sNum, vNum)
  }

  if (!layerData) {
    return (
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 0', textAlign: 'center' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: 12 }}>Zurück</button>
        <p style={{ color: 'var(--text-secondary)' }}>Textschichten werden geladen...</p>
      </div>
    )
  }

  const layers = [
    { id: 'rasm', label: 'Rasm', desc: 'Konsonantenskelett ohne Punkte und ohne Hamza', source: layerData.rasm, color: '#e74c3c' },
    { id: 'simple', label: 'Konsonantal (I\'jam)', desc: 'Moderne Konsonanten mit Punkten, ohne Vokale', source: quranSimpleClean, color: '#f39c12' },
    { id: 'uthmani', label: 'Uthmani', desc: 'Uthmani-Orthographie mit Vokalisierung', source: layerData.uthmani, color: '#3498db' },
    { id: 'vocalized', label: 'Vokalisiert', desc: 'Volle Vokalisierung mit allen Diakritika', source: layerData.vocalized, color: '#27ae60' },
  ]

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: 12 }}>Zurück</button>
      <h2 style={{ marginBottom: '4px' }}>Schichten-Vergleich</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
        Derselbe Vers in allen 4 historischen Textschichten — von der ältesten Textschicht (Rasm) bis zur vollen Vokalisierung.
      </p>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px', padding: '12px 16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
        <label style={{ fontSize: '0.85rem' }}>
          Sure:
          <input type="number" min={1} max={114} value={surahNum}
            onChange={e => { setSurahNum(Math.max(1, Math.min(114, +e.target.value))); setStartVerse(1) }}
            style={{ width: '60px', marginLeft: '6px', padding: '4px 8px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
          />
        </label>
        <label style={{ fontSize: '0.85rem' }}>
          Ab Vers:
          <input type="number" min={1} max={maxVerse} value={startVerse}
            onChange={e => setStartVerse(Math.max(1, Math.min(maxVerse, +e.target.value)))}
            style={{ width: '60px', marginLeft: '6px', padding: '4px 8px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
          />
        </label>
        <label style={{ fontSize: '0.85rem' }}>
          Verse:
          <select value={versesPerPage} onChange={e => setVersesPerPage(+e.target.value)}
            style={{ marginLeft: '6px', padding: '4px 8px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}>
            <option value={1}>1</option><option value={3}>3</option><option value={5}>5</option><option value={7}>7</option>
          </select>
        </label>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({maxVerse} Verse)</span>
        <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
          <button disabled={startVerse <= 1} onClick={() => setStartVerse(Math.max(1, startVerse - versesPerPage))}
            style={{ padding: '4px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', cursor: startVerse <= 1 ? 'default' : 'pointer', opacity: startVerse <= 1 ? 0.4 : 1 }}>Zurück</button>
          <button disabled={endVerse >= maxVerse} onClick={() => setStartVerse(Math.min(maxVerse, startVerse + versesPerPage))}
            style={{ padding: '4px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', cursor: endVerse >= maxVerse ? 'default' : 'pointer', opacity: endVerse >= maxVerse ? 0.4 : 1 }}>Weiter</button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {layers.map(l => (
          <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: l.color, display: 'inline-block' }} />
            <span style={{ fontWeight: 600 }}>{l.label}</span>
            <span style={{ color: 'var(--text-muted)' }}>— {l.desc}</span>
          </div>
        ))}
      </div>

      {/* Verse comparison */}
      {Array.from({ length: endVerse - startVerse + 1 }, (_, i) => startVerse + i).map(vNum => (
        <div key={vNum} style={{ marginBottom: '24px', padding: '16px 20px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 600 }}>
            {surahNum}:{vNum}
          </div>
          {layers.map(layer => {
            const text = getVerse(layer.source, surahNum, vNum, layer.id)
            return (
              <div key={layer.id} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: layer.color, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {layer.label}
                </div>
                <div style={{
                  fontFamily: 'var(--font-arabic)', fontSize: 'var(--arabic-size)',
                  lineHeight: 'var(--arabic-line-height)', direction: 'rtl', textAlign: 'right',
                  color: 'var(--arabic-text)', padding: '4px 0',
                }}>
                  {text || '—'}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ===== Annotations / Bookmarks View =====
function AnnotationsView({ onBack }) {
  const [annotations, setAnnotations] = useState([])
  const [editKey, setEditKey] = useState(null)
  const [editNote, setEditNote] = useState('')
  const [newSurah, setNewSurah] = useState('')
  const [newVerse, setNewVerse] = useState('')
  const [newNote, setNewNote] = useState('')

  useEffect(() => { loadAllAnnotations().then(setAnnotations) }, [])

  const handleSave = async (surah, verse, note, bookmarked) => {
    await saveAnnotation(surah, verse, { note, bookmarked })
    setAnnotations(await loadAllAnnotations())
    setEditKey(null)
  }

  const handleDelete = async (surah, verse) => {
    await deleteAnnotation(surah, verse)
    setAnnotations(await loadAllAnnotations())
  }

  const handleAdd = async () => {
    const s = parseInt(newSurah), v = parseInt(newVerse)
    if (!isNaN(s) && !isNaN(v) && s >= 1 && s <= 114 && v >= 1 && newNote.trim()) {
      await saveAnnotation(s, v, { note: newNote.trim(), bookmarked: false })
      setAnnotations(await loadAllAnnotations())
      setNewSurah(''); setNewVerse(''); setNewNote('')
    }
  }

  const bookmarked = annotations.filter(a => a.bookmarked)
  const notes = annotations.filter(a => a.note)

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: 12 }}>Zurück</button>
      <h2 style={{ marginBottom: '4px' }}>Vers-Notizen und Lesezeichen</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
        Persönliche Notizen an Quranverse heften. Beobachtungen, Fragen, linguistische Anmerkungen — alles an einem Ort.
      </p>

      {/* Add new */}
      <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Neue Notiz</h3>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <input placeholder="Sure" type="number" min={1} max={114} value={newSurah} onChange={e => setNewSurah(e.target.value)}
            style={{ width: '70px', padding: '6px 8px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }} />
          <input placeholder="Vers" type="number" min={1} value={newVerse} onChange={e => setNewVerse(e.target.value)}
            style={{ width: '70px', padding: '6px 8px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }} />
          <input placeholder="Notiz..." value={newNote} onChange={e => setNewNote(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            style={{ flex: 1, minWidth: '200px', padding: '6px 8px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }} />
          <button onClick={handleAdd}
            style={{ padding: '6px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--accent-teal)', background: 'var(--accent-teal)', color: '#fff', cursor: 'pointer' }}>Speichern</button>
        </div>
      </div>

      {/* Bookmarks */}
      {bookmarked.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--accent-gold)', marginBottom: '8px' }}>Lesezeichen ({bookmarked.length})</h3>
          {bookmarked.map(a => (
            <div key={`${a.surah}:${a.verse}`} style={{ padding: '8px 12px', marginBottom: '4px', background: 'var(--bg-card)', borderRadius: 'var(--radius)', borderLeft: '3px solid var(--accent-gold)', fontSize: '0.85rem' }}>
              <strong>{a.surah}:{a.verse}</strong> {a.note && <span style={{ color: 'var(--text-secondary)' }}>— {a.note}</span>}
            </div>
          ))}
        </div>
      )}

      {/* All notes */}
      <h3 style={{ fontSize: '0.9rem', color: 'var(--accent-teal)', marginBottom: '8px' }}>Alle Notizen ({notes.length})</h3>
      {notes.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Noch keine Notizen. Füge oben eine hinzu.</p>}
      {notes.map(a => {
        const key = `${a.surah}:${a.verse}`
        return (
          <div key={key} style={{ padding: '12px', marginBottom: '8px', background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <strong style={{ fontSize: '0.9rem' }}>{a.surah}:{a.verse}</strong>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => handleSave(a.surah, a.verse, a.note, !a.bookmarked)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: a.bookmarked ? 'var(--accent-gold)' : 'var(--text-muted)' }}
                  title={a.bookmarked ? 'Lesezeichen entfernen' : 'Lesezeichen setzen'}>
                  {a.bookmarked ? '*' : '-'}
                </button>
                <button onClick={() => { setEditKey(key); setEditNote(a.note || '') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Bearbeiten</button>
                <button onClick={() => handleDelete(a.surah, a.verse)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--incorrect)' }}>Löschen</button>
              </div>
            </div>
            {editKey === key ? (
              <div style={{ display: 'flex', gap: '6px' }}>
                <input value={editNote} onChange={e => setEditNote(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave(a.surah, a.verse, editNote, a.bookmarked)}
                  style={{ flex: 1, padding: '4px 8px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }} />
                <button onClick={() => handleSave(a.surah, a.verse, editNote, a.bookmarked)}
                  style={{ padding: '4px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--accent-teal)', background: 'var(--accent-teal)', color: '#fff', cursor: 'pointer' }}>OK</button>
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>{a.note}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ===== Layer Buildup Drill =====
function LayerBuildupDrill({ onBack }) {
  const [idx, setIdx] = useState(0)
  const [step, setStep] = useState(0) // 0=rasm, 1=simple(ijam), 2=uthmani, 3=vocalized
  const [showAnswer, setShowAnswer] = useState(false)
  const exercises = layerBuildupDrill.exercises || []
  const ex = exercises[idx]
  if (!ex) return <div>{onBack && <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>Zurück</button>}<p>Keine Übungen vorhanden.</p></div>

  const steps = [
    { label: 'Rasm', desc: 'Reines Konsonantenskelett ohne Punkte', text: ex.rasm, color: '#e74c3c' },
    { label: 'I\'jam', desc: 'Punkte hinzugefügt — Konsonanten eindeutig', text: ex.simple, color: '#f39c12' },
    { label: 'Uthmani', desc: 'Uthmani-Orthographie mit Vokalisierung', text: ex.uthmani, color: '#3498db' },
    { label: 'Vokalisiert', desc: 'Volle Vokalisierung', text: ex.vocalized, color: '#27ae60' },
  ]

  const nextExercise = () => { setIdx(i => (i + 1) % exercises.length); setStep(0); setShowAnswer(false) }
  const prevExercise = () => { setIdx(i => (i - 1 + exercises.length) % exercises.length); setStep(0); setShowAnswer(false) }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: 12 }}>Zurück</button>
      <h2 style={{ marginBottom: '4px' }}>Progressiver Schichtaufbau</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
        Gegeben ist der Rasm. Baue Schicht für Schicht auf: Punkte (I'jam) → Uthmani → volle Vokalisierung.
      </p>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
        Vers {idx + 1}/{exercises.length} — Sure {ex.surah}:{ex.verse}
      </div>

      {/* Current layer display */}
      <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: `2px solid ${steps[step].color}`, marginBottom: '16px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: steps[step].color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          Schicht {step + 1}/4: {steps[step].label}
        </div>
        <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 'calc(var(--arabic-size) * 1.2)', lineHeight: 2.2, direction: 'rtl', textAlign: 'right', color: 'var(--arabic-text)' }}>
          {steps[step].text}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>{steps[step].desc}</div>
      </div>

      {/* Step controls */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {steps.map((s, i) => (
          <button key={i} onClick={() => { setStep(i); setShowAnswer(false) }}
            style={{ padding: '8px 16px', borderRadius: 'var(--radius)', border: step === i ? `2px solid ${s.color}` : '1px solid var(--border)', background: step === i ? s.color + '20' : 'var(--bg-input)', color: step === i ? s.color : 'var(--text-secondary)', cursor: 'pointer', fontWeight: step === i ? 600 : 400, fontSize: '0.85rem' }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Show next layer as answer */}
      {step < 3 && (
        <div style={{ marginBottom: '16px' }}>
          <button onClick={() => setShowAnswer(!showAnswer)}
            style={{ padding: '8px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.85rem' }}>
            {showAnswer ? 'Nächste Schicht verbergen' : 'Nächste Schicht anzeigen'}
          </button>
          {showAnswer && (
            <div style={{ marginTop: '12px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', borderLeft: `4px solid ${steps[step + 1].color}` }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: steps[step + 1].color, marginBottom: '4px' }}>{steps[step + 1].label}</div>
              <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 'var(--arabic-size)', lineHeight: 2, direction: 'rtl', textAlign: 'right' }}>{steps[step + 1].text}</div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={prevExercise} style={{ padding: '8px 20px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', cursor: 'pointer' }}>Vorheriger Vers</button>
        <button onClick={nextExercise} style={{ padding: '8px 20px', borderRadius: 'var(--radius)', border: '1px solid var(--accent-teal)', background: 'var(--accent-teal)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Nächster Vers</button>
      </div>
    </div>
  )
}

// ===== Rasm Orthography Lesson =====
function RasmLesson({ onBack }) {
  const [activeCategory, setActiveCategory] = useState(0)
  const categories = rasmData.categories || []
  const cat = categories[activeCategory]

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={onBack} style={{
        background: 'none', border: 'none', color: 'var(--text-secondary)',
        cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: '16px',
      }}>Zurück zur Übersicht</button>

      <h2 style={{ marginBottom: '4px' }}>Orthographie des Konsonantentextes</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '12px', fontSize: '0.9rem' }}>
        {rasmData.meta?.description}
      </p>
      <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.8rem', fontStyle: 'italic' }}>
        Siehe auch: Modul 2 → Lektion 2.24 (Uthmani-Orthographie) für die lektionsbasierte Aufbereitung mit Tests.
      </p>

      {/* Category tabs */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '20px',
        padding: '8px', background: 'var(--bg-card)', borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
      }}>
        {categories.map((c, i) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(i)}
            style={{
              padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem',
              background: activeCategory === i ? 'var(--accent-teal-bg)' : 'transparent',
              color: activeCategory === i ? 'var(--accent-teal)' : 'var(--text-secondary)',
              border: activeCategory === i ? '1px solid var(--accent-teal)' : '1px solid transparent',
              cursor: 'pointer', fontWeight: activeCategory === i ? 600 : 400,
            }}
          >
            {c.title}
          </button>
        ))}
      </div>

      {/* Category content */}
      {cat && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '24px',
        }}>
          <h3 style={{ marginBottom: '8px', color: 'var(--accent-gold)' }}>{cat.title}</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem', lineHeight: 1.7 }}>
            {cat.description}
          </p>

          {/* Examples */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(cat.examples || cat.patterns || []).map((ex, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
                padding: '12px 16px', background: 'var(--bg-input)',
                borderRadius: 'var(--radius)', border: '1px solid var(--border)',
              }}>
                {/* Quran orthography */}
                <div style={{ minWidth: '80px', textAlign: 'center' }}>
                  <div className="arabic" dir="rtl" style={{ fontSize: '1.6rem', color: 'var(--accent-gold)' }}>
                    {ex.quranOrtho || ex.example || ex.pattern}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Konsonantentext</div>
                </div>

                {/* Arrow */}
                {ex.modernOrtho && (
                  <>
                    <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>vs.</span>
                    <div style={{ minWidth: '80px', textAlign: 'center' }}>
                      <div className="arabic" dir="rtl" style={{ fontSize: '1.6rem', color: 'var(--text-primary)' }}>
                        {ex.modernOrtho}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Modern</div>
                    </div>
                  </>
                )}

                {/* Info */}
                <div style={{ flex: 1, minWidth: '150px' }}>
                  {ex.transliteration && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--accent-teal)' }}>{ex.transliteration}</div>
                  )}
                  {ex.meaning && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{ex.meaning}</div>
                  )}
                  {ex.note && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{ex.note}</div>
                  )}
                  {ex.locations && ex.locations.length > 0 && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      z.B. {ex.locations.slice(0, 4).join(', ')}{ex.locations.length > 4 ? ` (+${ex.locations.length - 4})` : ''}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Linguistic note */}
      {rasmData.linguisticNote && (
        <div style={{
          marginTop: '20px', padding: '16px', borderRadius: 'var(--radius)',
          background: 'var(--accent-gold-bg)', border: '1px solid var(--accent-gold)',
          fontSize: '0.85rem', lineHeight: 1.7, color: 'var(--text-primary)',
        }}>
          {rasmData.linguisticNote}
        </div>
      )}
    </div>
  )
}

// ===== Rasm Test =====
function RasmTest({ onBack }) {
  const questions = rasmData.testQuestions || []
  const [currentIdx, setCurrentIdx] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  const current = questions[currentIdx]
  const isFinished = currentIdx >= questions.length

  const checkAnswer = useCallback((chosenIdx) => {
    const isCorrect = chosenIdx === current.correct
    setFeedback({ correct: isCorrect, correctIdx: current.correct, explanation: current.explanation })
    setScore(s => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }))
  }, [current])

  const next = useCallback(() => {
    setCurrentIdx(i => i + 1)
    setFeedback(null)
  }, [])

  if (isFinished) {
    const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: 'var(--text-secondary)',
          cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: '16px',
        }}>Zurück</button>
        <h2>Ergebnis — Rasm-Orthographie</h2>
        <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--accent-teal)', margin: '24px 0' }}>
          {score.correct} / {score.total}
        </div>
        <p>{pct >= 80 ? 'Sehr gut! Du kennst die orthographischen Besonderheiten.' : 'Wiederhole die Lektion und versuche es erneut.'}</p>
        <button onClick={() => { setCurrentIdx(0); setScore({ correct: 0, total: 0 }); setFeedback(null) }} style={{
          marginTop: '16px', padding: '10px 24px', borderRadius: 'var(--radius)',
          background: 'var(--accent-teal)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600,
        }}>Erneut versuchen</button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <button onClick={onBack} style={{
        background: 'none', border: 'none', color: 'var(--text-secondary)',
        cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: '16px',
      }}>Zurück</button>
      <h2>Test — Rasm-Orthographie</h2>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', textAlign: 'right' }}>
        {currentIdx + 1} / {questions.length}
      </div>
      <p style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '16px' }}>{current.question}</p>
      {!feedback ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {current.options.map((opt, i) => (
            <button key={i} onClick={() => checkAnswer(i)} style={{
              padding: '12px 16px', textAlign: 'left', borderRadius: 'var(--radius)',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.95rem',
            }}
              onMouseEnter={e => e.target.style.borderColor = 'var(--accent-teal)'}
              onMouseLeave={e => e.target.style.borderColor = 'var(--border)'}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <div style={{
          padding: '16px', borderRadius: 'var(--radius-lg)',
          background: feedback.correct ? 'var(--correct-bg)' : 'var(--incorrect-bg)',
          border: `1px solid ${feedback.correct ? 'var(--correct)' : 'var(--incorrect)'}`,
        }}>
          <p style={{ fontWeight: 600 }}>{feedback.correct ? 'Richtig!' : `Nicht ganz. Richtige Antwort: ${current.options[feedback.correctIdx]}`}</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>{feedback.explanation}</p>
          <button onClick={next} style={{
            marginTop: '12px', padding: '8px 20px', borderRadius: 'var(--radius)',
            background: 'var(--accent-teal)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600,
          }}>Weiter</button>
        </div>
      )}
    </div>
  )
}

// ===== Lane's Lexicon Guide =====
function LanesGuide({ onBack }) {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: '16px' }}>Zurück zur Übersicht</button>
      <h2>Lane's Lexicon — Kurzanleitung</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem', lineHeight: 1.7 }}>
        Lane's Arabic-English Lexicon (Edward William Lane, 1863-1893) ist das gründlichste arabisch-englische Wörterbuch für klassisches Arabisch. Es dokumentiert Wortbedeutungen anhand von Sprachgebrauch und Poesie — die linguistische Rohform. Frei verfügbar auf ejtaal.net.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ color: 'var(--accent-teal)', marginBottom: '8px', fontSize: '1rem' }}>1. Eine Wurzel nachschlagen</h3>
          <p style={{ lineHeight: 1.7, fontSize: '0.9rem' }}>Gehe zu <strong>ejtaal.net/aa/</strong>. Gib die Wurzel in lateinischer Transliteration ein (z.B. <code>ktb</code> für ك-ت-ب). Das System springt zur entsprechenden Seite in Lane's. Die Wurzel steht als Überschrift, darunter alle dokumentierten Ableitungen.</p>
        </div>

        <div style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ color: 'var(--accent-teal)', marginBottom: '8px', fontSize: '1rem' }}>2. Einen Eintrag lesen</h3>
          <p style={{ lineHeight: 1.7, fontSize: '0.9rem' }}>Jeder Eintrag beginnt mit dem arabischen Wort in seiner Grundform. Danach folgen:<br/>
          — <strong>Bedeutungsangaben</strong> auf Englisch, oft mit mehreren Nuancen<br/>
          — <strong>Belegstellen</strong> aus klassischer arabischer Literatur und Poesie<br/>
          — <strong>Grammatische Hinweise</strong>: Verbform, transitiv/intransitiv, Pluralbildung<br/>
          — <strong>Verwandte Wörter</strong> derselben Wurzel mit Bedeutungsverschiebungen</p>
        </div>

        <div style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ color: 'var(--accent-teal)', marginBottom: '8px', fontSize: '1rem' }}>3. Häufige Abkürzungen</h3>
          <p style={{ lineHeight: 1.7, fontSize: '0.9rem' }}>
            <code>inf. n.</code> = Infinitiv (Masdar) | <code>pl.</code> = Plural | <code>fem.</code> = Feminin | <code>sing.</code> = Singular<br/>
            <code>S</code> = Ṣiḥāḥ (Jawharis Wörterbuch الصحاح) | <code>K</code> = Qāmūs al-Muḥīṭ (Fairuzabadis Wörterbuch القاموس المحيط) | <code>TA</code> = Tāj al-ʿArūs<br/>
            <code>trans.</code> = transitiv | <code>intrans.</code> = intransitiv | <code>contr.</code> = konträr
          </p>
        </div>

        <div style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ color: 'var(--accent-teal)', marginBottom: '8px', fontSize: '1rem' }}>4. Praxis-Tipps</h3>
          <p style={{ lineHeight: 1.7, fontSize: '0.9rem' }}>
            — Lies nicht den gesamten Eintrag. Suche die Verbform oder das Nomen das du brauchst.<br/>
            — Achte auf die <strong>Grundbedeutung</strong> der Wurzel (steht meist ganz am Anfang) — sie ist der semantische Kern aller Ableitungen.<br/>
            — Wenn ein Wort mehrere Bedeutungen hat: Der quranische Kontext entscheidet welche zutrifft. Lane's gibt die Möglichkeiten, der Qurantext zeigt welche relevant ist.<br/>
            — Lane's ist auf Englisch. Wenn du Arabisch-Arabisch brauchst: Lisan al-Arab (lisaan.net).
          </p>
        </div>
      </div>
    </div>
  )
}

// ===== First Verse Walkthrough =====
function FirstVerseWalkthrough({ onBack }) {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: '16px' }}>Zurück zur Übersicht</button>
      <h2>Dein erster Vers — Sure 1:1 Schritt für Schritt</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem', lineHeight: 1.7 }}>
        Dieses Tutorial zeigt den kompletten Analyseprozess an einem realen Vers. Danach bist du bereit für die Vers-Werkstatt (Modul 3).
      </p>

      <div className="arabic" dir="rtl" style={{ fontSize: '2rem', textAlign: 'center', padding: '20px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '20px', color: 'var(--accent-gold)' }}>
        بسم الله الرحمن الرحيم
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ color: 'var(--accent-gold)', marginBottom: '8px', fontSize: '1rem' }}>Schritt 1: Partikeln erkennen</h3>
          <p style={{ lineHeight: 1.7, fontSize: '0.9rem' }}>Lies den Konsonantentext: <strong>بسم الله الرحمن الرحيم</strong><br/>
          Partikeln: <span className="arabic" dir="rtl" style={{ color: 'var(--accent-teal)' }}>ب</span> (bi = mit/in/durch) — Präposition, erzwingt Genitiv auf das folgende Wort.<br/>
          <span className="arabic" dir="rtl" style={{ color: 'var(--accent-teal)' }}>ال</span> (al- = der/die/das) — bestimmter Artikel, erscheint dreimal (الله, الرحمن, الرحيم).</p>
        </div>

        <div style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ color: 'var(--accent-gold)', marginBottom: '8px', fontSize: '1rem' }}>Schritt 2a: Wurzeln extrahieren</h3>
          <p style={{ lineHeight: 1.7, fontSize: '0.9rem' }}>
          <strong><span className="arabic" dir="rtl">اسم</span></strong> (nachdem ب als Präfix erkannt): Wurzeletymologie umstritten: <span className="arabic" dir="rtl">س-م-و</span> (s-m-w, Basrische Schule: Erhöhung) vs. <span className="arabic" dir="rtl">و-س-م</span> (w-s-m, Kufische Schule: Kennzeichnung). In Lane's: "name, that by which a thing is known." Muster: اِفْع (Nomen, mit elidiertem Endradikal و).<br/><br/>
          <strong><span className="arabic" dir="rtl">الله</span></strong>: Wurzel <span className="arabic" dir="rtl">ا-ل-ه</span> (ʾ-l-h). Grundbedeutung in Lane's: Gottheit, das Angebetete. الله ist der bestimmte Eigenname.<br/><br/>
          <strong><span className="arabic" dir="rtl">رحمن</span></strong> und <strong><span className="arabic" dir="rtl">رحيم</span></strong>: Beide Wurzel <span className="arabic" dir="rtl">ر-ح-م</span> (r-ḥ-m). Lane's: Barmherzigkeit, Mutterschoß, Zartheit. رحمن ist Muster فَعْلَان (Intensivform). رحيم ist Muster فَعِيل (dauerhafte Eigenschaft).</p>
        </div>

        <div style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ color: 'var(--accent-gold)', marginBottom: '8px', fontSize: '1rem' }}>Schritt 2b-d: Form, Vokalisierung, Bedeutung</h3>
          <p style={{ lineHeight: 1.7, fontSize: '0.9rem' }}>
          <strong>بسم</strong>: Präposition ب + Nomen اسم im Genitiv (wegen ب). Das anlautende Alif von اسم ist ein Hamzat al-Waṣl (Verbindungshamza) — es fällt bei Verbindung mit der Präposition weg: ب + اِسْم → بِسْمِ. Vokalisierung: بِسْمِ (bismi).<br/>
          <strong>الله</strong>: Eigenname, Genitiv (wegen Iḍāfa mit اسم). Vokalisierung: اللَّهِ (allāhi).<br/>
          <strong>الرحمن</strong>: Attribut zu الله, ebenfalls Genitiv. Diptot (Muster فَعْلَان) — hier mit Artikel (ال), daher triptotisch dekliniert (Kasra statt Fatha im Genitiv). Vokalisierung: الرَّحْمَنِ (ar-raḥmāni). Beachte: Im Konsonantentext ohne Alif nach Mim geschrieben (الرحمن statt الرحمان — Rasm-Orthographie!).<br/>
          <strong>الرحيم</strong>: Zweites Attribut, Genitiv. Vokalisierung: الرَّحِيمِ (ar-raḥīmi).</p>
        </div>

        <div style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ color: 'var(--accent-gold)', marginBottom: '8px', fontSize: '1rem' }}>Schritt 2e: Syntaktische Analyse</h3>
          <p style={{ lineHeight: 1.7, fontSize: '0.9rem' }}>
          <strong>بسم</strong>: Jarr wa-Majrur (Präposition + Genitiv). Der Text beginnt mit einer Präpositionalphrase. Syntaktisch muss ein Jarr wa-Majrur an etwas geknüpft sein — hier steht der Kontext: es ist der Anfang des Textes.<br/>
          <strong>الله</strong>: Mudaf ilayhi (zweites Glied der Genitivverbindung اسم الله).<br/>
          <strong>الرحمن</strong>: Sifa (Attribut) zu الله — kongruent in Kasus (Genitiv) und Definitheit (mit Artikel).<br/>
          <strong>الرحيم</strong>: Zweites Sifa — ebenfalls Genitiv, definit, kongruent.</p>
        </div>

        <div style={{ padding: '16px', background: 'var(--accent-gold-bg)', border: '1px solid var(--accent-gold)', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ color: 'var(--accent-gold)', marginBottom: '8px', fontSize: '1rem' }}>Ergebnis</h3>
          <p style={{ lineHeight: 1.7, fontSize: '0.9rem' }}>
          Ein Vers, vier Wörter. Jedes Wort wurde: vom Konsonantentext gelesen, die Wurzel extrahiert, in Lane's nachgeschlagen, die grammatische Form bestimmt, die Vokalisierung aus der Grammatik abgeleitet, die syntaktische Rolle im Satz bestimmt.<br/><br/>
          <strong>Das ist der Prozess.</strong> In Modul 3 machst du genau das — Vers für Vers, Wort für Wort. Mit der Zeit wird es schneller. Die Grammatik wird intuitiv. Die Wurzeln wiederholen sich. Und irgendwann liest du den Text direkt.</p>
        </div>
      </div>
    </div>
  )
}

// ===== Hapax Legomena Browser =====
function HapaxBrowser({ onBack }) {
  const [search, setSearch] = useState('')
  const [filterPOS, setFilterPOS] = useState('all')
  const [filterType, setFilterType] = useState('vocalized') // 'vocalized' | 'consonantal'
  const [visibleCount, setVisibleCount] = useState(50)

  const sourceList = useMemo(() => filterType === 'vocalized'
    ? (hapaxData.byVocalizedForm || [])
    : (hapaxData.byConsonantalForm || []), [filterType])

  const posOptions = useMemo(() => {
    const posSet = new Set()
    sourceList.forEach(h => { if (h.pos) posSet.add(h.pos) })
    return ['all', ...Array.from(posSet).sort()]
  }, [sourceList])

  const filtered = useMemo(() => {
    let items = sourceList
    if (filterPOS !== 'all') items = items.filter(h => h.pos === filterPOS)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      items = items.filter(h =>
        (h.vocalized || '').includes(q) ||
        (h.consonantal || '').includes(q) ||
        (h.root || '').includes(q) ||
        (h.location || '').includes(q)
      )
    }
    return items
  }, [sourceList, filterPOS, search])

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: '12px' }}>
        Zurück zur Übersicht
      </button>
      <h2 style={{ marginBottom: '4px' }}>Hapax Legomena</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
        Wortformen, die in genau dieser Flexionsform nur einmal im Quran vorkommen (Form-Hapax). Viele stammen von häufigen Wurzeln — die Form selbst ist einmalig, nicht die Wurzel.
        Vokalisierte Hapax: {hapaxData.meta?.hapaxByVocalizedForm?.toLocaleString() || '?'} |
        Konsonantale Hapax: {hapaxData.meta?.hapaxByConsonantalForm?.toLocaleString() || '?'}
      </p>

      {/* Type toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        {[['vocalized', `Vokalisiert (${hapaxData.meta?.hapaxByVocalizedForm || '?'})`], ['consonantal', `Konsonantal (${hapaxData.meta?.hapaxByConsonantalForm || '?'})`]].map(([t, label]) => (
          <button key={t} onClick={() => { setFilterType(t); setVisibleCount(50) }} style={{
            padding: '6px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
            background: filterType === t ? 'var(--accent-teal-bg)' : 'var(--bg-card)',
            color: filterType === t ? 'var(--accent-teal)' : 'var(--text-secondary)',
            border: filterType === t ? '1px solid var(--accent-teal)' : '1px solid var(--border)',
          }}>{label}</button>
        ))}
      </div>

      {/* Search + POS filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setVisibleCount(50) }}
          placeholder="Suche (Wort, Wurzel, Stelle)..."
          style={{ flex: 1, minWidth: '200px', padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.9rem' }} />
        <select value={filterPOS} onChange={e => { setFilterPOS(e.target.value); setVisibleCount(50) }}
          style={{ padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
          {posOptions.map(p => <option key={p} value={p}>{p === 'all' ? 'Alle Wortarten' : p}</option>)}
        </select>
      </div>

      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
        {filtered.length} Ergebnisse
      </div>

      {/* Results list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {filtered.slice(0, visibleCount).map((h, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
            padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
          }}>
            <span className="arabic" dir="rtl" style={{ fontSize: '1.4rem', color: 'var(--accent-gold)', minWidth: '80px' }}>
              {h.vocalized || h.consonantal}
            </span>
            {h.vocalized && h.consonantal && (
              <span className="arabic" dir="rtl" style={{ fontSize: '1rem', color: 'var(--text-muted)', minWidth: '60px' }}>
                {h.consonantal}
              </span>
            )}
            {h.root && (
              <span style={{ padding: '2px 8px', borderRadius: '10px', background: 'var(--accent-teal-bg)', color: 'var(--accent-teal)', fontSize: '0.75rem' }}>
                {h.root}
              </span>
            )}
            <span style={{ padding: '2px 8px', borderRadius: '10px', background: 'var(--bg-input)', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
              {h.pos}{h.morphology ? ' | ' + h.morphology : ''}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', marginLeft: 'auto' }}>
              {h.location}
            </span>
          </div>
        ))}
      </div>

      {visibleCount < filtered.length && (
        <button onClick={() => setVisibleCount(c => c + 50)} style={{
          display: 'block', margin: '16px auto', padding: '8px 24px', borderRadius: 'var(--radius)',
          background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer',
          color: 'var(--text-secondary)', fontSize: '0.85rem',
        }}>
          Weitere laden ({filtered.length - visibleCount} verbleibend)
        </button>
      )}
    </div>
  )
}

// ===== Loanword Browser =====
function LoanwordBrowser({ onBack }) {
  const entries = useMemo(() => loanwordData.entries || [], [])
  const [filterLang, setFilterLang] = useState('all')
  const [sortBy, setSortBy] = useState('frequency') // 'frequency' | 'alpha'
  const [search, setSearch] = useState('')

  const languages = useMemo(() => {
    const langSet = new Set()
    entries.forEach(e => { if (e.sourceLanguage) langSet.add(e.sourceLanguage) })
    return ['all', ...Array.from(langSet).sort()]
  }, [entries])

  const filtered = useMemo(() => {
    let items = entries
    if (filterLang !== 'all') items = items.filter(e => e.sourceLanguage === filterLang)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      items = items.filter(e =>
        (e.arabic || '').includes(q) ||
        (e.meaning || '').toLowerCase().includes(q) ||
        (e.sourceWord || '').toLowerCase().includes(q) ||
        (e.transliteration || '').toLowerCase().includes(q)
      )
    }
    if (sortBy === 'frequency') items = [...items].sort((a, b) => (b.frequency || 0) - (a.frequency || 0))
    else items = [...items].sort((a, b) => (a.arabic || '').localeCompare(b.arabic || '', 'ar'))
    return items
  }, [entries, filterLang, search, sortBy])

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: '12px' }}>
        Zurück zur Übersicht
      </button>
      <h2 style={{ marginBottom: '4px' }}>Lehnwörter im Quran</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
        {loanwordData.meta?.description || 'Sprachwissenschaftlich anerkannte Lehnwörter.'} ({loanwordData.meta?.totalEntries || entries.length} Einträge)
      </p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Suche (Arabisch, Bedeutung, Herkunft)..."
          style={{ flex: 1, minWidth: '200px', padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.9rem' }} />
        <select value={filterLang} onChange={e => setFilterLang(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
          {languages.map(l => <option key={l} value={l}>{l === 'all' ? 'Alle Sprachen' : l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
          <option value="frequency">Nach Häufigkeit</option>
          <option value="alpha">Alphabetisch</option>
        </select>
      </div>

      {/* Entries */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map((entry, i) => (
          <div key={i} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              <div>
                <span className="arabic" dir="rtl" style={{ fontSize: '1.6rem', color: 'var(--accent-gold)' }}>{entry.arabic}</span>
                {entry.transliteration && <span style={{ marginLeft: '12px', fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{entry.transliteration}</span>}
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ padding: '2px 10px', borderRadius: '10px', background: 'var(--accent-teal-bg)', color: 'var(--accent-teal)', fontSize: '0.75rem', fontWeight: 600 }}>
                  {entry.sourceLanguage}
                </span>
                {entry.frequency != null && (
                  <span style={{ padding: '2px 10px', borderRadius: '10px', background: 'var(--bg-input)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {entry.frequency}x
                  </span>
                )}
              </div>
            </div>
            <div style={{ fontSize: '0.9rem', marginBottom: '6px' }}>
              <strong>Bedeutung:</strong> {entry.meaning}
            </div>
            {entry.sourceWord && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                <strong>Quellwort:</strong> {entry.sourceWord} {entry.sourceTransliteration ? `(${entry.sourceTransliteration})` : ''}
              </div>
            )}
            {entry.etymologicalNote && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', lineHeight: 1.6, fontStyle: 'italic' }}>
                {entry.etymologicalNote}
              </div>
            )}
            {entry.quranicLocations && entry.quranicLocations.length > 0 && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Stellen: {entry.quranicLocations.slice(0, 10).join(', ')}{entry.quranicLocations.length > 10 ? ` (+${entry.quranicLocations.length - 10})` : ''}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ===== Collocation Browser =====
function CollocationBrowser({ onBack }) {
  const [activeTab, setActiveTab] = useState('roots') // 'roots' | 'bigrams'
  const [search, setSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(50)

  const rootCollocations = useMemo(() => collocationData.rootCollocations || [], [])
  const wordBigrams = useMemo(() => collocationData.wordBigrams || [], [])

  const filteredRoots = useMemo(() => {
    if (!search.trim()) return rootCollocations
    const q = search.trim().toLowerCase()
    return rootCollocations.filter(c =>
      (c.root1 || '').includes(q) || (c.root2 || '').includes(q)
    )
  }, [rootCollocations, search])

  const filteredBigrams = useMemo(() => {
    if (!search.trim()) return wordBigrams
    const q = search.trim()
    return wordBigrams.filter(b =>
      (b.phrase || '').includes(q)
    )
  }, [wordBigrams, search])

  const currentList = activeTab === 'roots' ? filteredRoots : filteredBigrams

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: '12px' }}>
        Zurück zur Übersicht
      </button>
      <h2 style={{ marginBottom: '4px' }}>Kollokationen</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
        Häufig gemeinsam auftretende Wörter und Wurzeln im Quran.
        {collocationData.meta?.totalRootPairs ? ` ${collocationData.meta.totalRootPairs} Wurzelpaare,` : ''}
        {collocationData.meta?.totalBigrams ? ` ${collocationData.meta.totalBigrams} Wort-Bigramme.` : ''}
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        {[['roots', 'Wurzel-Kollokationen'], ['bigrams', 'Wort-Bigramme']].map(([t, label]) => (
          <button key={t} onClick={() => { setActiveTab(t); setSearch(''); setVisibleCount(50) }} style={{
            padding: '8px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
            background: activeTab === t ? 'var(--accent-teal-bg)' : 'var(--bg-card)',
            color: activeTab === t ? 'var(--accent-teal)' : 'var(--text-secondary)',
            border: activeTab === t ? '1px solid var(--accent-teal)' : '1px solid var(--border)',
          }}>{label}</button>
        ))}
      </div>

      {/* Search */}
      <input value={search} onChange={e => { setSearch(e.target.value); setVisibleCount(50) }}
        placeholder={activeTab === 'roots' ? 'Wurzel suchen...' : 'Wort suchen...'}
        className={activeTab === 'roots' ? '' : 'arabic'}
        dir={activeTab === 'roots' ? 'ltr' : 'rtl'}
        style={{ width: '100%', padding: '8px 12px', marginBottom: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.9rem' }} />

      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
        {currentList.length} Ergebnisse
      </div>

      {/* Results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {currentList.slice(0, visibleCount).map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '8px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
          }}>
            <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', minWidth: '30px' }}>
              #{item.rank}
            </span>
            {activeTab === 'roots' ? (
              <>
                <span style={{ fontSize: '0.95rem', color: 'var(--accent-gold)', minWidth: '60px' }}>{item.root1}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>+</span>
                <span style={{ fontSize: '0.95rem', color: 'var(--accent-teal)', minWidth: '60px' }}>{item.root2}</span>
              </>
            ) : (
              <span className="arabic" dir="rtl" style={{ fontSize: '1.2rem', color: 'var(--accent-gold)' }}>{item.phrase}</span>
            )}
            <span style={{ marginLeft: 'auto', padding: '2px 10px', borderRadius: '10px', background: 'var(--bg-input)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              {item.coOccurrences || item.occurrences}x
            </span>
          </div>
        ))}
      </div>

      {visibleCount < currentList.length && (
        <button onClick={() => setVisibleCount(c => c + 50)} style={{
          display: 'block', margin: '16px auto', padding: '8px 24px', borderRadius: 'var(--radius)',
          background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer',
          color: 'var(--text-secondary)', fontSize: '0.85rem',
        }}>
          Weitere laden ({currentList.length - visibleCount} verbleibend)
        </button>
      )}
    </div>
  )
}

// ===== Consolidated Lexicon =====

import rootMeaningsLexicon from '../data/root-meanings.json'
const ROOT_MEANINGS_MAP = new Map()
if (rootMeaningsLexicon?.roots) {
  rootMeaningsLexicon.roots.forEach(r => {
    const key = (r.root || '').replace(/[\s-]/g, '')
    if (key) ROOT_MEANINGS_MAP.set(key, r)
  })
}

// Lazy-built lookups for lexicon (populated on first use)
let _rootLexiconCache = null
let _morphDBCache = null

async function ensureLexiconData() {
  if (_rootLexiconCache && _morphDBCache) return { rootLexicon: _rootLexiconCache, morphDB: _morphDBCache }
  const [rootFreqData, morphData] = await Promise.all([loadRootFrequencyComplete(), loadMorphologyDB()])
  if (!_rootLexiconCache) {
    _rootLexiconCache = new Map()
    if (rootFreqData?.roots) {
      rootFreqData.roots.forEach(r => {
        const key = (r.rootArabic || '').replace(/[\u064B-\u0652\s-]/g, '')
        if (key) {
          const meaningData = ROOT_MEANINGS_MAP.get(key)
          _rootLexiconCache.set(key, {
            ...r,
            meaning: meaningData?.meaning || r.meaning || '',
            semanticField: meaningData?.semanticField || '',
            keyDerivatives: meaningData?.keyDerivatives || [],
          })
        }
      })
    }
  }
  _morphDBCache = morphData
  return { rootLexicon: _rootLexiconCache, morphDB: _morphDBCache }
}

function ConsolidatedLexicon({ onBack }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selectedRoot, setSelectedRoot] = useState(null)
  const [lexiconData, setLexiconData] = useState(null)

  useEffect(() => {
    let cancelled = false
    ensureLexiconData().then(data => { if (!cancelled) setLexiconData(data) })
    return () => { cancelled = true }
  }, [])

  const handleSearch = useCallback((q) => {
    setQuery(q)
    if (!q || q.length < 2 || !lexiconData) { setResults([]); setSelectedRoot(null); return }

    const clean = q.replace(/[\u064B-\u0652\s-]/g, '')
    const matches = []

    // Search roots by consonants
    lexiconData.rootLexicon.forEach((data, key) => {
      if (key.includes(clean) || (data.meaning && data.meaning.toLowerCase().includes(q.toLowerCase()))) {
        matches.push({ type: 'root', key, data })
      }
    })

    // Search particles
    if (particlesData?.particles) {
      particlesData.particles.forEach(p => {
        const pClean = (p.arabic || '').replace(/[\u064B-\u0652]/g, '')
        if (pClean.includes(clean) || (p.meaning && p.meaning.toLowerCase().includes(q.toLowerCase()))) {
          matches.push({ type: 'particle', key: pClean, data: p })
        }
      })
    }

    // Sort: exact root match first, then by frequency
    matches.sort((a, b) => {
      if (a.key === clean && b.key !== clean) return -1
      if (b.key === clean && a.key !== clean) return 1
      return (b.data?.count || 0) - (a.data?.count || 0)
    })

    setResults(matches.slice(0, 50))
    setSelectedRoot(null)
  }, [lexiconData])

  // Get all words for a root from morphology DB
  const getRootDerivatives = useCallback((rootKey) => {
    const derivs = []
    if (lexiconData?.morphDB?.words) {
      lexiconData.morphDB.words.forEach(w => {
        if (w.r) {
          const rClean = w.r.replace(/[\u064B-\u0652\s-]/g, '')
          if (rClean === rootKey) {
            derivs.push(w)
          }
        }
      })
    }
    // Deduplicate by vocalized form
    const seen = new Set()
    return derivs.filter(w => {
      if (seen.has(w.v)) return false
      seen.add(w.v)
      return true
    }).slice(0, 30)
  }, [lexiconData])

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: '16px' }}>
        Zurück zur Übersicht
      </button>
      <h2 style={{ marginBottom: '8px' }}>Lexikon</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
        Konsolidiertes Nachschlagewerk: Wurzeln, Ableitungen, Partikeln, Frequenz und externe Lexika.
      </p>

      {!lexiconData && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>Lexikon-Daten werden geladen...</p>
      )}

      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <input
          type="text"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          placeholder={lexiconData ? "Wurzel, Wort oder Bedeutung eingeben..." : "Daten werden geladen..."}
          dir="auto"
          style={{
            width: '100%', padding: '12px 16px', fontSize: '1.1rem',
            borderRadius: 'var(--radius-lg)', border: '2px solid var(--border)',
            background: 'var(--bg-input)', color: 'var(--text-primary)',
            fontFamily: 'var(--font-arabic)',
          }}
        />
      </div>

      {results.length > 0 && !selectedRoot && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {results.map((r, i) => (
            <button
              key={`${r.type}-${r.key}-${i}`}
              onClick={() => r.type === 'root' ? setSelectedRoot(r) : null}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', borderRadius: 'var(--radius)',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                cursor: r.type === 'root' ? 'pointer' : 'default',
                color: 'var(--text-primary)', textAlign: 'left',
              }}
            >
              <div>
                <span style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.3rem', marginRight: '12px' }}>
                  {r.type === 'root' ? (r.data.rootArabic || r.key) : r.data.arabic}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {r.data.meaning || r.data.function || ''}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{
                  padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600,
                  background: r.type === 'root' ? 'var(--accent-teal-bg)' : 'var(--accent-gold-bg)',
                  color: r.type === 'root' ? 'var(--accent-teal)' : 'var(--accent-gold)',
                }}>
                  {r.type === 'root' ? 'Wurzel' : 'Partikel'}
                </span>
                {r.data.count && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {r.data.count}x
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedRoot && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
          <button onClick={() => setSelectedRoot(null)} style={{
            background: 'none', border: 'none', color: 'var(--accent-teal)',
            cursor: 'pointer', fontSize: '0.85rem', marginBottom: '12px',
          }}>
            Zurück zu Ergebnissen
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-arabic)', fontSize: '2rem' }}>
                {selectedRoot.data.rootArabic || selectedRoot.key}
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginLeft: '16px' }}>
                {selectedRoot.data.meaning}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              {selectedRoot.data.count && (
                <div style={{ fontSize: '0.85rem' }}>{selectedRoot.data.count} Vorkommen</div>
              )}
              {selectedRoot.data.rank && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rang {selectedRoot.data.rank}</div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <a
              href={`https://ejtaal.net/aa/#ll=${encodeURIComponent(selectedRoot.data.transliteration || '')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '6px 14px', borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-teal-bg)', border: '1px solid var(--accent-teal)',
                color: 'var(--accent-teal)', fontSize: '0.85rem', textDecoration: 'none',
              }}
            >
              Lane's Lexicon
            </a>
            <a
              href={`https://corpus.quran.com/qurandictionary.jsp?q=${encodeURIComponent(selectedRoot.data.transliteration || '')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '6px 14px', borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-gold-bg)', border: '1px solid var(--accent-gold)',
                color: 'var(--accent-gold)', fontSize: '0.85rem', textDecoration: 'none',
              }}
            >
              Corpus Quran
            </a>
          </div>
          <h4 style={{ marginBottom: '8px' }}>Ableitungen im Quran</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {getRootDerivatives(selectedRoot.key).map((w, i) => (
              <span key={i} style={{
                padding: '4px 10px', borderRadius: '4px', fontSize: '0.85rem',
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                fontFamily: 'var(--font-arabic)',
              }}>
                {w.v}
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', marginLeft: '4px' }}>
                  {w.p || ''}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {query.length >= 2 && results.length === 0 && (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>
          Keine Ergebnisse für "{query}"
        </p>
      )}
    </div>
  )
}

// ===== Main Module 8 =====
export default function Module8() {
  const [view, setViewRaw] = useState(VIEWS.HOME)
  const [, setVisitedViews] = useState({})

  // Reverse Rasm Drill state (must be top-level, not inside conditional)
  const [rrIdx, setRrIdx] = useState(0)
  const [rrRevealed, setRrRevealed] = useState(false)
  const [rrSelected, setRrSelected] = useState(new Set())

  // Load visited views on mount
  useEffect(() => {
    loadModuleProgress(8).then(p => {
      if (p?.visitedViews) setVisitedViews(p.visitedViews)
    })
  }, [])

  // Track view visits and persist
  const setView = useCallback((v) => {
    setViewRaw(v)
    if (v !== VIEWS.HOME) {
      setVisitedViews(prev => {
        const next = { ...prev, [v]: true }
        saveModuleProgress(8, { visitedViews: next, totalVisited: Object.keys(next).length })
        return next
      })
    }
  }, [])

  // Wrap all view rendering in Suspense + ErrorBoundary for lazy-loaded components
  const lazyFallback = <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>Laden...</div>
  const Lazy = ({ children }) => <LazyErrorBoundary><Suspense fallback={lazyFallback}>{children}</Suspense></LazyErrorBoundary>

  if (view === VIEWS.LANES_GUIDE) return <LanesGuide onBack={() => setView(VIEWS.HOME)} />
  if (view === VIEWS.FIRST_VERSE) return <FirstVerseWalkthrough onBack={() => setView(VIEWS.HOME)} />
  if (view === VIEWS.LEXICON) return <ConsolidatedLexicon onBack={() => setView(VIEWS.HOME)} />
  if (view === VIEWS.RASM) return <RasmLesson onBack={() => setView(VIEWS.HOME)} />
  if (view === VIEWS.RASM_TEST) return <RasmTest onBack={() => setView(VIEWS.HOME)} />
  if (view === VIEWS.READER) return <Lazy><ContinuousReader onClose={() => setView(VIEWS.HOME)} /></Lazy>
  if (view === VIEWS.DICTATION) return <Lazy><DictationExercise onBack={() => setView(VIEWS.HOME)} /></Lazy>
  if (view === VIEWS.WRITING) return <Lazy><WritingExercise onBack={() => setView(VIEWS.HOME)} /></Lazy>
  if (view === VIEWS.PRINT) return <Lazy><PrintableSheet onBack={() => setView(VIEWS.HOME)} /></Lazy>
  if (view === VIEWS.VOCALIZATION) return <Lazy><VocalizationExercise onBack={() => setView(VIEWS.HOME)} /></Lazy>
  if (view === VIEWS.AMBIGUITY) return <Lazy><AmbiguityExercise onBack={() => setView(VIEWS.HOME)} /></Lazy>
  if (view === VIEWS.CROSS_REF) return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={() => setView(VIEWS.HOME)} style={{
        background: 'none', border: 'none', color: 'var(--text-secondary)',
        cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: '12px',
      }}>Zurück zur Übersicht</button>
      <h2 style={{ marginBottom: '12px' }}>Konkordanz</h2>
      <Suspense fallback={lazyFallback}><CrossReference /></Suspense>
    </div>
  )
  if (view === VIEWS.GRAMMAR_REF) return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={() => setView(VIEWS.HOME)} style={{
        background: 'none', border: 'none', color: 'var(--text-secondary)',
        cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: '12px',
      }}>Zurück zur Übersicht</button>
      <h2 style={{ marginBottom: '12px' }}>Grammatik-Nachschlagewerk</h2>
      <Suspense fallback={lazyFallback}><GrammarSidebar standalone={true} /></Suspense>
    </div>
  )
  if (view === VIEWS.HAPAX) return <HapaxBrowser onBack={() => setView(VIEWS.HOME)} />
  if (view === VIEWS.LOANWORDS) return <LoanwordBrowser onBack={() => setView(VIEWS.HOME)} />
  if (view === VIEWS.COLLOCATIONS) return <CollocationBrowser onBack={() => setView(VIEWS.HOME)} />

  if (view === VIEWS.DECOMPOSITION) return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={() => setView(VIEWS.HOME)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: '16px' }}>Zurück zur Übersicht</button>
      <Suspense fallback={lazyFallback}><DecompositionExercise /></Suspense>
    </div>
  )

  if (view === VIEWS.CASE_DERIVATION) return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={() => setView(VIEWS.HOME)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: '16px' }}>Zurück zur Übersicht</button>
      <Suspense fallback={lazyFallback}><CaseDerivationExercise /></Suspense>
    </div>
  )

  if (view === VIEWS.VERSE_SYNTHESIS) return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={() => setView(VIEWS.HOME)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: '16px' }}>Zurück zur Übersicht</button>
      <Suspense fallback={lazyFallback}><VerseSynthesisExercise /></Suspense>
    </div>
  )

  if (view === VIEWS.ERROR_CORRECTION) return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={() => setView(VIEWS.HOME)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: '16px' }}>Zurück zur Übersicht</button>
      <Suspense fallback={lazyFallback}><ErrorCorrectionExercise /></Suspense>
    </div>
  )

  if (view === VIEWS.CONTEXT_DISAMBIG) return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={() => setView(VIEWS.HOME)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: '16px' }}>Zurück zur Übersicht</button>
      <Suspense fallback={lazyFallback}><ContextDisambiguationExercise /></Suspense>
    </div>
  )

  // New drill views
  const newDrillBack = <button onClick={() => setView(VIEWS.HOME)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: '16px' }}>Zurück zur Übersicht</button>

  if (view === VIEWS.IRAB) return (
    <Suspense fallback={lazyFallback}><div style={{ maxWidth: '900px', margin: '0 auto' }}>{newDrillBack}<IrabExercise /></div></Suspense>
  )
  if (view === VIEWS.ROOT_EXTRACTION) return (
    <Suspense fallback={lazyFallback}><div style={{ maxWidth: '900px', margin: '0 auto' }}>{newDrillBack}<RootExtractionDrill /></div></Suspense>
  )
  if (view === VIEWS.PATTERN_RECOGNITION) return (
    <Suspense fallback={lazyFallback}><div style={{ maxWidth: '900px', margin: '0 auto' }}>{newDrillBack}<PatternRecognitionDrill /></div></Suspense>
  )
  if (view === VIEWS.PRONOUN_SUFFIX) return (
    <Suspense fallback={lazyFallback}><div style={{ maxWidth: '900px', margin: '0 auto' }}>{newDrillBack}<PronounSuffixDrill /></div></Suspense>
  )
  if (view === VIEWS.VERB_MODE) return (
    <Suspense fallback={lazyFallback}><div style={{ maxWidth: '900px', margin: '0 auto' }}>{newDrillBack}<VerbModeDrill /></div></Suspense>
  )
  if (view === VIEWS.NEGATION) return (
    <Suspense fallback={lazyFallback}><div style={{ maxWidth: '900px', margin: '0 auto' }}>{newDrillBack}<NegationDrill /></div></Suspense>
  )
  if (view === VIEWS.HAMZA) return (
    <Suspense fallback={lazyFallback}><div style={{ maxWidth: '900px', margin: '0 auto' }}>{newDrillBack}<HamzaExercise /></div></Suspense>
  )

  // ===== NEW P2/P3/P4 DRILL VIEWS =====

  if (view === VIEWS.RASM_VOCALIZATION) return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {newDrillBack}
      <h2 style={{ marginBottom: '8px' }}>Rasm → Vokalisation Drill</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>Vom reinen Konsonantentext zur grammatisch begründeten Vokalisation in 5 Schritten.</p>
      {rasmVocDrillData.exercises.map((ex) => (
        <div key={ex.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px 20px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.8rem', direction: 'rtl' }}>{ex.rasm}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ex.location}</span>
          </div>
          <details>
            <summary style={{ cursor: 'pointer', color: 'var(--accent)', fontSize: '0.85rem' }}>5-Schritte-Analyse zeigen</summary>
            <div style={{ marginTop: '8px', paddingLeft: '12px', borderLeft: '2px solid var(--accent)' }}>
              <p><strong>1. Worttyp:</strong> {ex.steps.wordType}</p>
              <p><strong>2. Wurzel:</strong> {ex.steps.root}</p>
              <p><strong>3. Form:</strong> {ex.steps.form}</p>
              <p><strong>4. Syntaktische Rolle:</strong> {ex.steps.syntacticRole}</p>
              <p><strong>5. Vokalisation:</strong> <span style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.3rem', color: 'var(--correct)' }}>{ex.steps.vocalization}</span></p>
              <p style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{ex.explanation}</p>
            </div>
          </details>
        </div>
      ))}
    </div>
  )

  if (view === VIEWS.PAUSAL_FORMS) return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {newDrillBack}
      <h2 style={{ marginBottom: '8px' }}>Pausalformen-Drill</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>Wie verändert sich die Aussprache am Wortende bei einer Pause?</p>
      {pausalFormsDrillData.rules.map(rule => (
        <div key={rule.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
          <h4 style={{ color: 'var(--accent)', marginBottom: '4px' }}>{rule.rule}</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>{rule.explanation}</p>
          {rule.examples.map((ex, j) => (
            <div key={j} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '4px 0', fontFamily: 'var(--font-arabic)', fontSize: '1.1rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>{ex.context}</span>
              <span>→</span>
              <span style={{ color: 'var(--correct)' }}>{ex.pausal}</span>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-ui)', color: 'var(--text-secondary)' }}>{ex.note}</span>
            </div>
          ))}
        </div>
      ))}
      <h3 style={{ marginTop: '24px', marginBottom: '12px' }}>Übungen</h3>
      {pausalFormsDrillData.exercises.map((ex, i) => (
        <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 16px', marginBottom: '8px' }}>
          <span style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.3rem' }}>{ex.context_form}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>({ex.quranRef})</span>
          <details style={{ marginTop: '4px' }}>
            <summary style={{ cursor: 'pointer', color: 'var(--accent)', fontSize: '0.8rem' }}>Pausalform zeigen</summary>
            <p style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.2rem', color: 'var(--correct)', marginTop: '4px' }}>{ex.expected_pausal}</p>
          </details>
        </div>
      ))}
    </div>
  )

  if (view === VIEWS.ALIF_WASLA) return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {newDrillBack}
      <h2 style={{ marginBottom: '8px' }}>Alif Wasla Drill</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>Systematisches Training: Wo Hamzat al-Wasl erscheint und in Verbindung verschwindet.</p>
      {alifWaslaDrillData.categories.map(cat => (
        <div key={cat.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
          <h4 style={{ color: 'var(--accent)', marginBottom: '4px' }}>{cat.title}</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>{cat.explanation}</p>
          {cat.exercises.map((ex, j) => (
            <div key={j} style={{ padding: '8px 0', borderBottom: j < cat.exercises.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.1rem', direction: 'rtl' }}>
                <span>{ex.word || ex.isolated}</span>
                <span style={{ margin: '0 8px' }}>→</span>
                <span style={{ color: 'var(--correct)' }}>{ex.connected}</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{ex.note} {ex.quranRef && `(${ex.quranRef})`}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  )

  if (view === VIEWS.WEAK_ROOT_TRANSFORM) return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {newDrillBack}
      <h2 style={{ marginBottom: '8px' }}>Schwache-Wurzel-Transformationen</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>Wie و und ي in verschiedenen Formen mutieren, verschmelzen oder verschwinden.</p>
      {weakRootDrillData.transformations.map(tr => (
        <div key={tr.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
          <h4 style={{ color: 'var(--accent)' }}>{tr.title}</h4>
          <p style={{ fontSize: '0.85rem', marginBottom: '8px' }}>Wurzel: <span style={{ fontFamily: 'var(--font-arabic)' }}>{tr.root}</span> — {tr.meaning}</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ borderBottom: '1px solid var(--border)' }}><th style={{ textAlign: 'left', padding: '4px' }}>Form</th><th style={{ textAlign: 'right', padding: '4px' }}>Ergebnis</th><th style={{ textAlign: 'left', padding: '4px' }}>Erklärung</th></tr></thead>
            <tbody>
              {tr.forms.map((f, j) => (
                <tr key={j} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '4px' }}>{f.form}</td>
                  <td style={{ padding: '4px', textAlign: 'right', fontFamily: 'var(--font-arabic)', fontSize: '1.1rem', color: 'var(--correct)' }}>{f.expected}</td>
                  <td style={{ padding: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{f.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {tr.quranExamples && tr.quranExamples.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              {tr.quranExamples.map((ex, k) => (
                <p key={k} style={{ fontSize: '0.8rem', paddingLeft: '8px', borderLeft: '2px solid var(--accent)' }}>
                  <span style={{ fontFamily: 'var(--font-arabic)', direction: 'rtl' }}>{ex.arabic}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>({ex.ref}) — {ex.form}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )

  if (view === VIEWS.RING_COMPOSITION) return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {newDrillBack}
      <h2 style={{ marginBottom: '8px' }}>Ringkomposition und Chiasmus</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem' }}>{ringCompDrillData.explanation}</p>
      {ringCompDrillData.exercises.map(ex => (
        <div key={ex.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
          <h4 style={{ color: 'var(--accent)', marginBottom: '8px' }}>{ex.title}</h4>
          {ex.structure.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 700, color: 'var(--accent)', minWidth: '24px' }}>{s.label}</span>
              <span style={{ fontFamily: 'var(--font-arabic)', direction: 'rtl', fontSize: '1rem', flex: 1 }}>{s.content}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '120px' }}>{s.theme}</span>
            </div>
          ))}
          <details style={{ marginTop: '8px' }}>
            <summary style={{ cursor: 'pointer', color: 'var(--accent)', fontSize: '0.85rem' }}>Analyse zeigen</summary>
            <p style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{ex.analysis}</p>
          </details>
          <p style={{ marginTop: '8px', fontSize: '0.85rem', fontStyle: 'italic' }}>{ex.task}</p>
        </div>
      ))}
    </div>
  )

  if (view === VIEWS.SPEECH_ACT) return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {newDrillBack}
      <h2 style={{ marginBottom: '8px' }}>Sprechakt-Drill (Pragmatik)</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>Identifizieren Sie den Sprechakttyp in Quranversen.</p>
      <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}>
        <h4 style={{ marginBottom: '8px' }}>Sprechakttypen</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {speechActDrillData.speechActTypes.map(t => (
            <span key={t.id} style={{ padding: '2px 8px', fontSize: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '4px' }}>{t.name}</span>
          ))}
        </div>
      </div>
      {speechActDrillData.exercises.map(ex => (
        <div key={ex.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px 18px', marginBottom: '10px' }}>
          <p style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.3rem', direction: 'rtl', marginBottom: '4px' }}>{ex.arabic}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ex.quranRef}</p>
          <details style={{ marginTop: '6px' }}>
            <summary style={{ cursor: 'pointer', color: 'var(--accent)', fontSize: '0.85rem' }}>Sprechakt zeigen</summary>
            <p style={{ marginTop: '4px' }}><strong>{speechActDrillData.speechActTypes.find(t => t.id === ex.correctType)?.name}</strong></p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{ex.explanation}</p>
          </details>
        </div>
      ))}
    </div>
  )

  if (view === VIEWS.MUSHAF_NOTATION) return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {newDrillBack}
      <h2 style={{ marginBottom: '8px' }}>Textelemente und Versmarkierungen</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>Versmarkierungen und Textelemente im Qurantext.</p>
      {mushafNotationData.textElements.map(el => (
        <div key={el.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px 18px', marginBottom: '10px' }}>
          <h4 style={{ color: 'var(--accent)' }}>{el.name} {el.symbol && <span style={{ fontSize: '1.4rem', marginLeft: '8px' }}>{el.symbol}</span>}</h4>
          <p style={{ fontSize: '0.85rem' }}>{el.description}</p>
          {el.note && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{el.note}</p>}
        </div>
      ))}
    </div>
  )

  // ===== P3: Solar/Lunar Letters =====
  if (view === VIEWS.SOLAR_LUNAR && solarLunarData) return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {newDrillBack}
      <h2 style={{ marginBottom: '8px' }}>Sonnen- und Mondbuchstaben</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem' }}>{solarLunarData.principle}</p>
      <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.8rem', fontStyle: 'italic' }}>{solarLunarData.linguisticReason}</p>
      <h3 style={{ color: '#ff9800', marginBottom: '8px' }}>14 Sonnenbuchstaben (assimilieren das Lam)</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px', marginBottom: '20px' }}>
        {(solarLunarData.solar || []).map((l, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px' }}>
            <span className="arabic" style={{ fontSize: '1.6rem', color: '#ff9800' }}>{l.letter}</span>
            <span style={{ marginLeft: '10px', fontSize: '0.85rem' }}>{l.name} [{l.ipa}]</span>
            <span style={{ marginLeft: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.articulation}</span>
            {l.example && <div className="arabic" dir="rtl" style={{ fontSize: '1.1rem', marginTop: '4px' }}>{l.example.with_article} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)', direction: 'ltr' }}>{l.example.meaning} ({l.example.ref})</span></div>}
          </div>
        ))}
      </div>
      <h3 style={{ color: '#2196f3', marginBottom: '8px' }}>14 Mondbuchstaben (Lam bleibt erhalten)</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px' }}>
        {(solarLunarData.lunar || []).map((l, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px' }}>
            <span className="arabic" style={{ fontSize: '1.6rem', color: '#2196f3' }}>{l.letter}</span>
            <span style={{ marginLeft: '10px', fontSize: '0.85rem' }}>{l.name} [{l.ipa}]</span>
            <span style={{ marginLeft: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.articulation}</span>
            {l.example && <div className="arabic" dir="rtl" style={{ fontSize: '1.1rem', marginTop: '4px' }}>{l.example.with_article} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)', direction: 'ltr' }}>{l.example.meaning} ({l.example.ref})</span></div>}
          </div>
        ))}
      </div>
    </div>
  )

  // ===== P3: Alif Inventory =====
  if (view === VIEWS.ALIF_INVENTORY && alifInventoryData) {
    const AlifDrill = () => {
      const [qi, setQi] = useState(0)
      const [ans, setAns] = useState(null)
      const [score, setScore] = useState({ c: 0, t: 0 })
      const exs = alifInventoryData.exercises || []
      const q = exs[qi]
      if (!q) return <p style={{ color: 'var(--text-muted)' }}>Keine Übungen.</p>
      const pick = (oi) => { setAns(oi); setScore(p => ({ c: p.c + (oi === q.correct ? 1 : 0), t: p.t + 1 })) }
      return (
        <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 20, border: '1px solid var(--border)', marginBottom: 16 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>Frage {qi + 1}/{exs.length} {score.t > 0 && `— ${score.c}/${score.t} (${Math.round(100*score.c/score.t)}%)`}</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 14, lineHeight: 1.5 }}>{q.question}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {q.options.map((opt, oi) => {
              const sel = ans === oi, cor = oi === q.correct, show = ans !== null
              let bg = 'var(--bg-secondary)', bd = '1px solid var(--border)'
              if (show && cor) { bg = 'rgba(74,222,128,0.15)'; bd = '2px solid #4ade80' }
              else if (show && sel && !cor) { bg = 'rgba(248,113,113,0.15)'; bd = '2px solid #f87171' }
              return <button key={oi} onClick={() => ans === null && pick(oi)} disabled={ans !== null} style={{ padding: '10px 16px', borderRadius: 8, background: bg, border: bd, cursor: ans !== null ? 'default' : 'pointer', textAlign: 'left', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{opt}</button>
            })}
          </div>
          {ans !== null && <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{q.explanation}</div>}
          {ans !== null && <button onClick={() => { setQi(i => (i+1)%exs.length); setAns(null) }} style={{ marginTop: 10, padding: '8px 18px', borderRadius: 8, background: 'var(--accent-teal)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Nächste</button>}
        </div>
      )
    }
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {newDrillBack}
        <h2 style={{ marginBottom: '8px' }}>Alif-Inventar</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>{alifInventoryData.meta?.description}</p>
        {alifInventoryData.exercises?.length > 0 && <AlifDrill />}
        {(alifInventoryData.variants || []).map((v, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px 18px', marginBottom: '10px' }}>
            <h4 style={{ color: 'var(--accent-gold)' }}>{v.name} <span className="arabic" style={{ fontSize: '1.3rem' }}>{v.nameArabic}</span></h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Unicode: {v.unicode}</p>
            <p style={{ fontSize: '0.85rem', marginBottom: '6px' }}>{v.function}</p>
            {v.examples?.map((ex, ei) => (
              <div key={ei} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '12px' }}>
                <span className="arabic" dir="rtl" style={{ color: 'var(--arabic-text)', fontSize: '1.1rem' }}>{ex.word}</span> ({ex.ref}) — {ex.note}
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  // ===== P3: Huruf Muqattaʿat Reference =====
  if (view === VIEWS.MUQATTAAT_REF) {
    const muqData = alphabetData?.hurufMuqattaat || []
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {newDrillBack}
        <h2 style={{ marginBottom: '8px' }}>Huruf Muqattaʿat — Einzelbuchstaben am Surenanfang</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
          14 der 28 arabischen Buchstaben erscheinen als Einzelbuchstaben am Anfang von 29 Suren.
          Sie werden einzeln ausgesprochen (buchstabiert), nicht als Wort gelesen.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px' }}>
          {muqData.map((entry, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sure {entry.surah}</span>
                <span className="arabic" dir="rtl" style={{ fontSize: '1.8rem', color: 'var(--accent-gold)' }}>{entry.letters}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{entry.spelled}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '20px', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '0.85rem' }}>
          <strong>Statistik:</strong> 14 verschiedene Buchstaben, 29 Suren, Kombinationen von 1 bis 5 Buchstaben.
          Die längste Kombination ist كهيعص (Sure 19). Sure 42 hat als einzige zwei getrennte Gruppen (حم + عسق).
        </div>
      </div>
    )
  }

  // ===== P3: Reverse Rasm Drill =====
  if (view === VIEWS.REVERSE_RASM && reverseRasmDrillData) {
    const exercises = reverseRasmDrillData.exercises || []
    const ex = exercises[rrIdx]
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {newDrillBack}
        <h2 style={{ marginBottom: '8px' }}>Reverse-Rasm-Drill</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>{reverseRasmDrillData.meta?.description}</p>
        {ex && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{ex.surah}:{ex.ayah} — Übung {rrIdx + 1}/{exercises.length}</div>
            <div className="arabic" dir="rtl" style={{ fontSize: '1.6rem', lineHeight: 2, marginBottom: '12px' }}>{ex.vocalizedText}</div>
            <p style={{ fontSize: '0.85rem', marginBottom: '12px' }}>Welche Wörter wären im reinen Rasm mehrdeutig? Klicke sie an.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', direction: 'rtl' }}>
              {ex.vocalizedText.split(' ').map((w, wi) => {
                const isAmbiguous = ex.ambiguousWords.some(aw => aw.word === w)
                const isClicked = rrSelected.has(wi)
                return (
                  <span key={wi} className="arabic" onClick={() => { const ns = new Set(rrSelected); ns.has(wi) ? ns.delete(wi) : ns.add(wi); setRrSelected(ns) }}
                    style={{ padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '1.3rem',
                      background: rrRevealed ? (isAmbiguous ? 'rgba(255,152,0,0.2)' : isClicked ? 'rgba(244,67,54,0.15)' : 'var(--bg-input)') : (isClicked ? 'var(--accent-teal-bg)' : 'var(--bg-input)'),
                      border: rrRevealed ? (isAmbiguous ? '2px solid #ff9800' : '1px solid var(--border)') : (isClicked ? '2px solid var(--accent-teal)' : '1px solid var(--border)'),
                    }}>{w}</span>
                )
              })}
            </div>
            {!rrRevealed && <button onClick={() => setRrRevealed(true)} style={{ padding: '8px 20px', borderRadius: '6px', background: 'var(--accent-teal-bg)', border: '1px solid var(--accent-teal)', color: 'var(--accent-teal)', cursor: 'pointer', fontWeight: 600 }}>Auflösen</button>}
            {rrRevealed && (
              <div>
                <h4 style={{ marginBottom: '8px', color: '#ff9800' }}>Mehrdeutige Wörter:</h4>
                {(ex.ambiguousWords || []).map((aw, ai) => (
                  <div key={ai} style={{ background: 'var(--bg-secondary)', borderRadius: '6px', padding: '10px', marginBottom: '8px' }}>
                    <div className="arabic" dir="rtl" style={{ fontSize: '1.2rem', color: 'var(--accent-gold)' }}>{aw.word} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>({aw.consonantal})</span></div>
                    {aw.alternatives.map((alt, ali) => (
                      <div key={ali} style={{ fontSize: '0.8rem', marginLeft: '12px', marginTop: '3px' }}>
                        <span className="arabic" dir="rtl" style={{ color: 'var(--arabic-text)' }}>{alt.vocalized}</span> — {alt.meaning} <span style={{ color: 'var(--text-muted)' }}>({alt.form})</span>
                      </div>
                    ))}
                  </div>
                ))}
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>{ex.explanation}</p>
                <button onClick={() => { setRrIdx(i => (i + 1) % exercises.length); setRrRevealed(false); setRrSelected(new Set()) }} style={{ marginTop: '12px', padding: '8px 20px', borderRadius: '6px', background: 'var(--accent-teal-bg)', border: '1px solid var(--accent-teal)', color: 'var(--accent-teal)', cursor: 'pointer', fontWeight: 600 }}>Nächste Übung</button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ===== P4: Sura Index =====
  if (view === VIEWS.SURA_INDEX && suraIndexData) return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {newDrillBack}
      <h2 style={{ marginBottom: '16px' }}>Suren-Index</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
              <th style={{ padding: '6px 8px' }}>#</th>
              <th style={{ padding: '6px 8px' }}>Name</th>
              <th style={{ padding: '6px 8px' }} className="arabic">عربي</th>
              <th style={{ padding: '6px 8px' }}>Verse</th>
              <th style={{ padding: '6px 8px' }}>Wörter</th>
              <th style={{ padding: '6px 8px' }}>Wurzeln</th>
            </tr>
          </thead>
          <tbody>
            {(suraIndexData.surahs || []).map(s => (
              <tr key={s.number} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '5px 8px' }}>{s.number}</td>
                <td style={{ padding: '5px 8px' }}>{s.nameGerman}</td>
                <td style={{ padding: '5px 8px' }} className="arabic" dir="rtl">{s.nameArabic}</td>
                <td style={{ padding: '5px 8px' }}>{s.verseCount}</td>
                <td style={{ padding: '5px 8px' }}>{s.wordCount}</td>
                <td style={{ padding: '5px 8px' }}>{s.uniqueRoots}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  // ===== P4: Proper Names =====
  if (view === VIEWS.PROPER_NAMES && properNamesData) return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {newDrillBack}
      <h2 style={{ marginBottom: '16px' }}>Koranische Eigennamen</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
        {(properNamesData.names || []).slice(0, 200).map((n, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px' }}>
            <span className="arabic" dir="rtl" style={{ fontSize: '1.3rem', color: 'var(--accent-gold)' }}>{n.vocalized || n.name}</span>
            <span style={{ marginLeft: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{n.count}x</span>
            {n.root && <div style={{ fontSize: '0.8rem' }}>Wurzel: {n.root}</div>}
          </div>
        ))}
      </div>
    </div>
  )

  // ===== P4: Frequency Path =====
  if (view === VIEWS.FREQ_PATH && freqPathData) return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {newDrillBack}
      <h2 style={{ marginBottom: '16px' }}>Frequenzgestützter Lernpfad</h2>
      {(freqPathData.tiers || []).map((tier, ti) => (
        <div key={ti} style={{ marginBottom: '20px' }}>
          <h3 style={{ color: 'var(--accent-teal)', marginBottom: '8px' }}>{tier.name || `Stufe ${ti + 1}`} — {tier.cumulativeCoverage || '?'}% Abdeckung</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(tier.roots || []).map((r, ri) => (
              <span key={ri} className="arabic" dir="rtl" style={{ padding: '4px 10px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border)', fontSize: '1rem' }} title={`${r.meaning} (${r.count}x)`}>
                {r.rootArabic || r.root}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  // ===== P4: Verb Form Frequency =====
  if (view === VIEWS.VERB_FREQ && verbFreqData) return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {newDrillBack}
      <h2 style={{ marginBottom: '16px' }}>Verbform-Häufigkeit im Quran</h2>
      {verbFreqData.totalVerbs && <p style={{ marginBottom: '12px', fontSize: '0.9rem' }}>Gesamt: {verbFreqData.totalVerbs} Verben</p>}
      <div style={{ display: 'grid', gap: '8px' }}>
        {(verbFreqData.forms || []).map((f, fi) => (
          <div key={fi} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontWeight: 700, fontSize: '1rem', minWidth: '60px' }}>{f.form}</span>
            <div style={{ flex: 1, background: 'var(--bg-input)', borderRadius: '4px', height: '20px', overflow: 'hidden' }}>
              <div style={{ background: 'var(--accent-teal)', height: '100%', width: `${f.percentage || 0}%`, borderRadius: '4px', transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: '0.8rem', minWidth: '80px', textAlign: 'right' }}>{f.count} ({(f.percentage || 0).toFixed(1)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )

  // ===== P4: Nominal Patterns =====
  if (view === VIEWS.NOMINAL_PATTERNS && nominalPatternData) return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {newDrillBack}
      <h2 style={{ marginBottom: '8px' }}>Nominalmuster-Inventar (أَوْزَان الْأَسْمَاء)</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem', lineHeight: 1.6 }}>
        {nominalPatternData.meta?.note || 'Systematisches Inventar aller Nominalbildungsmuster.'}
      </p>
      {(nominalPatternData.categories || []).map((cat, ci) => (
        <div key={ci} style={{ marginBottom: '28px' }}>
          <h3 style={{ color: 'var(--accent-teal)', marginBottom: '4px', fontSize: '1.05rem' }}>{cat.title}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '12px', lineHeight: 1.5 }}>{cat.description}</p>
          {(cat.patterns || []).map((p, pi) => (
            <details key={pi} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 16px', marginBottom: '8px' }}>
              <summary style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="arabic" dir="rtl" style={{ fontSize: '1.4rem', color: 'var(--accent-gold)' }}>{p.pattern}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{p.transliteration}</span>
                </span>
                {p.frequencyNote && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{p.frequencyNote}</span>}
              </summary>
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.6 }}>{p.function}</p>
                {p.formation && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Bildung: {p.formation}</p>}
                {p.note && <p style={{ fontSize: '0.8rem', color: 'var(--accent)', marginBottom: '8px', fontWeight: 600 }}>{p.note}</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {(p.examples || []).map((ex, ei) => (
                    <div key={ei} style={{ display: 'flex', alignItems: 'baseline', gap: '10px', padding: '4px 8px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
                      <span className="arabic" dir="rtl" style={{ fontSize: '1.1rem', color: 'var(--text-primary)', minWidth: '80px' }}>{ex.vocalized}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: '60px' }}>{ex.root}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flex: 1 }}>{ex.meaning}</span>
                      {ex.ref && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ex.ref}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </details>
          ))}
        </div>
      ))}
    </div>
  )

  // ===== Energetikus Paradigm =====
  if (view === VIEWS.ENERGETIKUS && energetikusData) {
    const personOrder = energetikusData.meta?.personOrder || ['3ms','3fs','3md','3fd','3mp','3fp','2ms','2fs','2md','2mp','2fp','1s','1p']
    const personLabels = { '3ms':'3.m.sg','3fs':'3.f.sg','3md':'3.m.du','3fd':'3.f.du','3mp':'3.m.pl','3fp':'3.f.pl','2ms':'2.m.sg','2fs':'2.f.sg','2md':'2.du','2mp':'2.m.pl','2fp':'2.f.pl','1s':'1.sg','1p':'1.pl' }
    const EnergForm = ({ form, title }) => (
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ color: 'var(--accent-teal)', marginBottom: 8 }}>{title}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: '2px', fontSize: '0.85rem' }}>
          <div style={{ fontWeight: 600, padding: '6px 8px', background: 'var(--bg-secondary)' }}>Person</div>
          <div style={{ fontWeight: 600, padding: '6px 8px', background: 'var(--bg-secondary)', direction: 'rtl' }}>Arabisch</div>
          <div style={{ fontWeight: 600, padding: '6px 8px', background: 'var(--bg-secondary)' }}>Transliteration</div>
          {personOrder.map(p => {
            const c = form.conjugation?.[p]
            if (!c) return null
            return [
              <div key={p+'l'} style={{ padding: '6px 8px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{personLabels[p]}</div>,
              <div key={p+'a'} className="arabic" dir="rtl" style={{ padding: '6px 8px', fontSize: '1.15rem', borderBottom: '1px solid var(--border)' }}>{c.arabic}</div>,
              <div key={p+'t'} style={{ padding: '6px 8px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>{c.transliteration}</div>
            ]
          })}
        </div>
      </div>
    )
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {newDrillBack}
        <h2 style={{ marginBottom: '8px' }}>Energetikus-Paradigma (نُون التَّوْكِيد)</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem', lineHeight: 1.6 }}>
          {energetikusData.meta?.description}
        </p>
        {energetikusData.heavyForm && <EnergForm form={energetikusData.heavyForm} title={energetikusData.heavyForm.label} />}
        {energetikusData.lightForm && <EnergForm form={energetikusData.lightForm} title={energetikusData.lightForm.label} />}
        {energetikusData.syntacticContexts?.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ color: 'var(--accent-gold)', marginBottom: 8 }}>Syntaktische Kontexte</h4>
            {energetikusData.syntacticContexts.map((ctx, i) => (
              <div key={i} style={{ padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, marginBottom: 6, fontSize: '0.85rem' }}>
                <strong>{ctx.context || ctx}</strong>{ctx.description && <span style={{ color: 'var(--text-secondary)' }}> — {ctx.description}</span>}
              </div>
            ))}
          </div>
        )}
        {energetikusData.quranicExamples?.length > 0 && (
          <div>
            <h4 style={{ color: 'var(--accent-gold)', marginBottom: 8 }}>Quranbeispiele ({energetikusData.quranicExamples.length})</h4>
            {energetikusData.quranicExamples.map((ex, i) => (
              <div key={i} style={{ padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 8 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{ex.ref} — {ex.person} ({ex.formType})</div>
                <div className="arabic" dir="rtl" style={{ fontSize: '1.2rem', lineHeight: 2, marginBottom: 6 }}>{ex.arabic}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ex.explanation}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ===== Rasm Glyph Mapping =====
  if (view === VIEWS.RASM_GLYPH_MAP && rasmGlyphMapping) return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {newDrillBack}
      <h2 style={{ marginBottom: '8px' }}>Rasm-Glyphen-Mapping</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem', lineHeight: 1.6 }}>
        {rasmGlyphMapping.meta?.note}
      </p>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--accent-teal)', borderRadius: '8px', padding: '14px 18px', marginBottom: '20px' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <strong>{rasmGlyphMapping.summary?.totalAmbiguousLetters}</strong> von 28 Buchstaben sind im Rasm mehrdeutig.
          Nur <strong>{rasmGlyphMapping.summary?.totalUnambiguousLetters}</strong> haben eine eindeutige Grundform:
          {' '}{(rasmGlyphMapping.summary?.unambiguousLetters || []).join(', ')}
        </div>
      </div>
      {(rasmGlyphMapping.groups || []).map((g, gi) => (
        <details key={gi} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px 18px', marginBottom: '10px' }}>
          <summary style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span className="arabic" dir="rtl" style={{ fontSize: '2rem', color: g.letters.length > 1 ? 'var(--accent-gold)' : 'var(--text-muted)', minWidth: '40px', textAlign: 'center' }}>{g.rasmGlyph}</span>
            <span style={{ flex: 1 }}>
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{g.glyphName}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '8px' }}>
                {g.letters.length === 1 ? 'eindeutig' : `${g.letters.length} mögliche Buchstaben`}
              </span>
            </span>
          </summary>
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: 1.6 }}>{g.description}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
              {g.letters.map((l, li) => (
                <div key={li} style={{ padding: '8px 14px', background: 'var(--bg-secondary)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="arabic" style={{ fontSize: '1.5rem', color: 'var(--accent-teal)' }}>{l.letter}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{l.name} ({l.transliteration})</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.dots}</div>
                  </div>
                </div>
              ))}
            </div>
            {g.examples && g.examples.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Beispiele:</div>
                {g.examples.map((ex, ei) => (
                  <div key={ei} style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: '4px', marginBottom: '6px' }}>
                    <span className="arabic" dir="rtl" style={{ fontSize: '1.2rem', color: 'var(--accent-gold)' }}>{ex.rasm}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '12px' }}>{ex.possible.join(' / ')}</span>
                    {ex.note && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{ex.note}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </details>
      ))}
    </div>
  )

  // ===== Rasm Decoding Drill =====
  if (view === VIEWS.RASM_DECODING && rasmDecodingData) return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {newDrillBack}
      <h2 style={{ marginBottom: '8px' }}>Rasm-Dekodierung</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
        Vom punktlosen Konsonantenskelett alle möglichen Lesungen ableiten, dann den Kontext zur Disambiguierung nutzen.
      </p>
      {(rasmDecodingData.exercises || []).map((ex, i) => (
        <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px 20px', marginBottom: '12px' }}>
          <div style={{ fontFamily: 'var(--font-arabic)', fontSize: '2.2rem', direction: 'rtl', textAlign: 'center', padding: '12px 0', color: 'var(--accent-gold)' }}>
            {ex.rasm}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '12px' }}>
            Welche Wörter können sich hinter diesem Rasm verbergen?
          </p>
          <details>
            <summary style={{ cursor: 'pointer', color: 'var(--accent)', fontSize: '0.85rem' }}>Mögliche Lesungen zeigen</summary>
            <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {(ex.possibleReadings || []).map((r, j) => (
                <span key={j} style={{
                  padding: '4px 10px', borderRadius: '4px', fontFamily: 'var(--font-arabic)', fontSize: '1.1rem',
                  background: r === ex.correctReading ? 'var(--correct-bg)' : 'var(--bg-secondary)',
                  color: r === ex.correctReading ? 'var(--correct)' : 'var(--text-primary)',
                  border: r === ex.correctReading ? '1px solid var(--correct)' : '1px solid var(--border)',
                  fontWeight: r === ex.correctReading ? 700 : 400,
                }}>{r}</span>
              ))}
            </div>
            {ex.context && (
              <div style={{ padding: '8px 12px', borderLeft: '2px solid var(--accent)', marginTop: '8px' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Kontext: {ex.context.ref}</p>
                <p style={{ fontFamily: 'var(--font-arabic)', direction: 'rtl', fontSize: '1rem', marginTop: '4px' }}>{ex.context.arabic}</p>
                {ex.context.hint && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{ex.context.hint}</p>}
              </div>
            )}
            {ex.rootInfo && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>{ex.rootInfo}</p>}
          </details>
        </div>
      ))}
    </div>
  )

  // ===== Script History Lesson =====
  if (view === VIEWS.SCRIPT_HISTORY && scriptHistoryData) return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {newDrillBack}
      <h2 style={{ marginBottom: '8px' }}>{scriptHistoryData.meta?.title || 'Schriftgeschichte'}</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
        {scriptHistoryData.meta?.description || ''}
      </p>
      {(scriptHistoryData.sections || []).map((sec, i) => (
        <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px 20px', marginBottom: '14px' }}>
          <h3 style={{ color: 'var(--accent-gold)', marginBottom: '8px', fontSize: '1rem' }}>{sec.title}</h3>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{sec.content}</p>
          {sec.arabicExamples && (
            <div style={{ marginTop: '8px' }}>
              {sec.arabicExamples.map((ex, j) => (
                <div key={j} style={{ display: 'flex', gap: '8px', padding: '4px 0', alignItems: 'baseline' }}>
                  <span style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.1rem', color: 'var(--accent-teal)' }}>{ex.arabic}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{ex.meaning || ex.transliteration || ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      {scriptHistoryData.testContent?.exercises && (
        <>
          <h3 style={{ marginTop: '24px', marginBottom: '12px' }}>Testfragen</h3>
          {scriptHistoryData.testContent.exercises.map((ex, i) => (
            <details key={i} style={{ marginBottom: '8px', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
              <summary style={{ padding: '10px 14px', cursor: 'pointer', background: 'var(--bg-secondary)', fontSize: '0.9rem' }}>{ex.question || ex.prompt}</summary>
              <div style={{ padding: '10px 14px', fontSize: '0.85rem', background: 'var(--bg-primary)' }}>
                <p style={{ color: 'var(--correct)', fontWeight: 600 }}>{ex.answer || ex.options?.[ex.correct]}</p>
                {ex.explanation && <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{ex.explanation}</p>}
              </div>
            </details>
          ))}
        </>
      )}
    </div>
  )

  // ===== P5: Semantic Drills =====
  if (view === VIEWS.POLYSEMY) return (
    <Suspense fallback={lazyFallback}><div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {newDrillBack}
      <PolysemyDrill />
    </div></Suspense>
  )
  if (view === VIEWS.VERB_FORM_SEMANTICS) return (
    <Suspense fallback={lazyFallback}><div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {newDrillBack}
      <VerbFormSemanticDrill />
    </div></Suspense>
  )
  if (view === VIEWS.SYNONYM_CONTRAST) return (
    <Suspense fallback={lazyFallback}><div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {newDrillBack}
      <SynonymContrastDrill />
    </div></Suspense>
  )
  if (view === VIEWS.SURAH_MACROSTRUCTURE) return (
    <Suspense fallback={lazyFallback}><div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {newDrillBack}
      <SurahMacrostructureDrill />
    </div></Suspense>
  )
  if (view === VIEWS.VERB_RECTION) return (
    <Suspense fallback={lazyFallback}><div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {newDrillBack}
      <VerbRectionDrill />
    </div></Suspense>
  )
  if (view === VIEWS.THEMATIC_FIELD) return (
    <Suspense fallback={lazyFallback}><div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {newDrillBack}
      <ThematicFieldDrill />
    </div></Suspense>
  )
  if (view === VIEWS.CONGRUENCE) return (
    <Suspense fallback={lazyFallback}><div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {newDrillBack}
      <CongruenceDrill />
    </div></Suspense>
  )
  if (view === VIEWS.MASDAR) return (
    <Suspense fallback={lazyFallback}><div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {newDrillBack}
      <MasdarDrill />
    </div></Suspense>
  )
  if (view === VIEWS.VOCAB_DRILL) return (
    <Suspense fallback={lazyFallback}><div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <VocabularyDrill onBack={() => setView(VIEWS.HOME)} />
    </div></Suspense>
  )
  if (view === VIEWS.HANDWRITING) return (
    <Suspense fallback={lazyFallback}><div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={() => setView(VIEWS.HOME)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: 16 }}>Zurück</button>
      <HandwritingCanvas />
    </div></Suspense>
  )
  if (view === VIEWS.CLOZE) return (
    <Suspense fallback={lazyFallback}><div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <ClozeExercise onBack={() => setView(VIEWS.HOME)} />
    </div></Suspense>
  )

  // --- Elativ-Drill ---
  if (view === VIEWS.ELATIV) return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {newDrillBack}
      <h2 style={{ marginBottom: '8px' }}>{elativDrillData.meta?.title || 'Elativ-Drill'}</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{elativDrillData.meta?.description}</p>
      {elativDrillData.learnContent?.sections?.map((s, i) => (
        <div key={i} style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <h3 style={{ marginBottom: '8px' }}>{s.title}</h3>
          <p style={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>{s.content}</p>
        </div>
      ))}
      {elativDrillData.exercises?.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ marginBottom: '12px' }}>Übungen ({elativDrillData.exercises.length})</h3>
          {elativDrillData.exercises.map((ex, i) => (
            <div key={i} style={{ padding: '12px 16px', marginBottom: '8px', background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '1.3rem', fontFamily: 'var(--font-arabic)', direction: 'rtl' }}>{ex.word}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Wurzel: {ex.root} | Basis: {ex.base} | {ex.meaning}
                {ex.feminine && <span> | Fem.: {ex.feminine}</span>}
                {ex.quranicLocation && <span> | {ex.quranicLocation}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // --- Quadriliteral Lesson ---
  if (view === VIEWS.QUADRILITERAL) return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {newDrillBack}
      <h2 style={{ marginBottom: '8px' }}>{quadriliteralData.meta?.title || 'Quadriliterale'}</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{quadriliteralData.meta?.description}</p>
      {quadriliteralData.learnContent?.sections?.map((s, i) => (
        <div key={i} style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <h3 style={{ marginBottom: '8px' }}>{s.title}</h3>
          {s.content && <p style={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>{s.content}</p>}
          {s.examples && s.examples.map((ex, j) => (
            <div key={j} style={{ padding: '10px', marginTop: '8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-arabic)', direction: 'rtl', fontSize: '1.2rem' }}>
              {ex.arabic && <span>{ex.arabic}</span>}
              {ex.root && <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', direction: 'ltr', display: 'block' }}>{ex.root}: {ex.meaning}</span>}
            </div>
          ))}
        </div>
      ))}
    </div>
  )

  // --- Phonology Supplementary ---
  if (view === VIEWS.PHONOLOGY_SUPP) {
    const lessons = Array.isArray(phonologySupplementaryData) ? phonologySupplementaryData : (phonologySupplementaryData.lessons || [])
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {newDrillBack}
        <h2 style={{ marginBottom: '8px' }}>Phonologie — Vertiefung</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>Ergänzende Lektionen zur Lautlehre: Silbenstruktur, Betonungsregeln und weitere phonologische Phänomene.</p>
        {lessons.map((lesson, li) => (
          <div key={li} style={{ marginBottom: '24px' }}>
            <h3 style={{ color: 'var(--accent-teal)', marginBottom: '8px' }}>{lesson.title}</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '12px', fontSize: '0.9rem' }}>{lesson.description}</p>
            {lesson.learnContent?.sections?.map((s, si) => (
              <div key={si} style={{ marginBottom: '16px', padding: '16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <h4 style={{ marginBottom: '8px' }}>{s.title}</h4>
                <p style={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>{s.content}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  // --- Layer Compare (Schichten-Vergleich) ---
  if (view === VIEWS.LAYER_COMPARE) return <LayerCompareView onBack={() => setView(VIEWS.HOME)} />

  // --- Layer Buildup Drill ---
  if (view === VIEWS.LAYER_BUILDUP) return <LayerBuildupDrill onBack={() => setView(VIEWS.HOME)} />

  // --- Annotations ---
  if (view === VIEWS.ANNOTATIONS) return <AnnotationsView onBack={() => setView(VIEWS.HOME)} />

  // --- Case Trigger Reference ---
  if (view === VIEWS.CASE_TRIGGER_REF && caseTriggerData) {
    const cases = caseTriggerData.nominalCases || {}
    const moods = caseTriggerData.verbalMoods || {}
    const notes = caseTriggerData.specialNotes || []
    return (
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <button onClick={() => setView(VIEWS.HOME)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: 16 }}>Zurück zur Übersicht</button>
        <h2 style={{ marginBottom: 4 }}>{caseTriggerData.meta?.title || 'Kasusauslöser-Referenz'}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>{caseTriggerData.meta?.description}</p>
        <h3 style={{ color: 'var(--accent-teal)', marginBottom: 12 }}>Nominalkasus</h3>
        {Object.entries(cases).map(([key, c]) => (
          <div key={key} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 20px', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span className="arabic" style={{ fontSize: '1.3rem' }}>{c.arabicTerm}</span>
              <strong style={{ textTransform: 'capitalize' }}>{key}</strong>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c.marker}</span>
            </div>
            {c.triggers?.map((t, i) => (
              <div key={i} style={{ padding: '6px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none', fontSize: '0.9rem' }}>
                <span style={{ fontWeight: 600 }}>{t.function}</span>
                <span className="arabic" style={{ margin: '0 8px', fontSize: '1.1rem' }}>{t.arabicTerm}</span>
                {t.quranExample && <span style={{ color: 'var(--text-secondary)' }}> — {t.quranExample}</span>}
              </div>
            ))}
          </div>
        ))}
        <h3 style={{ color: 'var(--accent-gold)', marginBottom: 12, marginTop: 20 }}>Verbalmodi</h3>
        {Object.entries(moods).map(([key, m]) => (
          <div key={key} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 20px', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span className="arabic" style={{ fontSize: '1.3rem' }}>{m.arabicTerm}</span>
              <strong style={{ textTransform: 'capitalize' }}>{key}</strong>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{m.marker}</span>
            </div>
            {m.triggers?.map((t, i) => (
              <div key={i} style={{ padding: '6px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none', fontSize: '0.9rem' }}>
                <span style={{ fontWeight: 600 }}>{t.particle || t.function}</span>
                {t.arabicTerm && <span className="arabic" style={{ margin: '0 8px', fontSize: '1.1rem' }}>{t.arabicTerm}</span>}
                {t.quranExample && <span style={{ color: 'var(--text-secondary)' }}> — {t.quranExample}</span>}
              </div>
            ))}
          </div>
        ))}
        {notes.length > 0 && (
          <>
            <h3 style={{ color: 'var(--text-muted)', marginBottom: 8, marginTop: 20 }}>Hinweise</h3>
            {notes.map((n, i) => <p key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>{n}</p>)}
          </>
        )}
      </div>
    )
  }

  // --- Weak Verbs Derived Forms ---
  if (view === VIEWS.WEAK_VERBS_DERIVED && weakVerbsDerivedData) {
    const entries = weakVerbsDerivedData.entries || []
    return (
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <button onClick={() => setView(VIEWS.HOME)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: 16 }}>Zurück zur Übersicht</button>
        <h2 style={{ marginBottom: 4 }}>{weakVerbsDerivedData.meta?.title || 'Schwache Verben — Abgeleitete Formen'}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>{weakVerbsDerivedData.meta?.description}</p>
        {entries.map((e, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 20px', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{ background: 'var(--accent-teal-bg)', color: 'var(--accent-teal)', padding: '2px 10px', borderRadius: 6, fontSize: '0.85rem', fontWeight: 600 }}>Form {e.form}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{e.weakType?.replace(/_/g, ' ')}</span>
              <span className="arabic" style={{ fontSize: '1.3rem' }}>{e.root}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{e.meaning}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginBottom: 8 }}>
              {[['Perfekt', e.perfect3ms], ['Imperfekt', e.imperfect3ms], ['Imperativ', e.imperative2ms], ['Akt. Part.', e.activeParticiple], ['Pass. Part.', e.passiveParticiple], ['Masdar', e.masdar]].map(([label, val]) => val && (
                <div key={label} style={{ textAlign: 'center', padding: '6px 4px', background: 'var(--bg-input)', borderRadius: 6 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                  <div className="arabic" style={{ fontSize: '1.1rem' }}>{val}</div>
                </div>
              ))}
            </div>
            {e.quranicExamples?.length > 0 && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {e.quranicExamples.map((ex, j) => (
                  <span key={j} style={{ marginRight: 12 }}>
                    <span className="arabic" style={{ fontSize: '1rem' }}>{ex.word}</span>{' '}
                    <span style={{ color: 'var(--accent-gold)' }}>({ex.location})</span>{' '}
                    {ex.meaning}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="module-page" style={{ maxWidth: '900px' }}>
      <h2 style={{ marginBottom: '6px' }}>Werkzeuge und Vertiefung</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '12px', fontSize: '0.9rem' }}>
        Zusätzliche Lern- und Analysewerkzeuge die das Studium des Konsonantentextes unterstützen.
      </p>
      <div style={{
        padding: '10px 16px', marginBottom: '24px', borderRadius: 'var(--radius)',
        background: 'var(--accent-teal-bg)', border: '1px solid var(--accent-teal)',
        fontSize: '0.85rem', color: 'var(--accent-teal)',
      }}>
        {'{'}Werkzeuge nach Kategorie sortiert: Einstieg → Schrift → Textanalyse → Nachschlagewerke → Übungen → Lesen → Referenz{'}'}
      </div>

      {/* Getting Started Section */}
      <section style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--correct)', marginBottom: '12px' }}>
          Einstieg und Anleitungen
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          <button onClick={() => setView(VIEWS.FIRST_VERSE)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer',
            color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Dein erster Vers — Sure 1:1</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Geführter Walkthrough: Wie analysiert man einen Vers Schritt für Schritt? An بسم الله الرحمن الرحيم gezeigt.
            </div>
          </button>
          <button onClick={() => setView(VIEWS.LANES_GUIDE)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer',
            color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Lane's Lexicon — Kurzanleitung</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Wie navigiert man Lane's? Abkürzungen, Eintragsstruktur, Praxis-Tipps.
            </div>
          </button>
        </div>
      </section>

      {/* Rasm Section */}
      <section style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--accent-gold)', marginBottom: '12px' }}>
          Schriftkundliche Analyse
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          <button onClick={() => setView(VIEWS.LAYER_COMPARE)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '2px solid var(--accent-teal)', cursor: 'pointer',
            color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--accent-teal)' }}>Schichten-Vergleich</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Alle 4 Textschichten nebeneinander: Rasm, Konsonantal, Uthmani, Vokalisiert — der Weg von der ältesten Textschicht zum voll vokalisierten Text.
            </div>
          </button>
          <button onClick={() => setView(VIEWS.LAYER_BUILDUP)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '2px solid var(--accent-teal)', cursor: 'pointer',
            color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--accent-teal)' }}>Schichtaufbau-Drill</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Vom Rasm aufwärts: Punkte hinzufügen, dann Vokale. Der zentrale Weg vom Manuskript zum Lesen. 40 Verse.
            </div>
          </button>
          <button onClick={() => setView(VIEWS.RASM)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer',
            color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Orthographie des Konsonantentextes</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Systematische Unterschiede zur modernen Standardorthographie — Alif-Waw, Alif-Auslassung, Ta-Formen, Sin/Sad u.a.
            </div>
          </button>
          <button onClick={() => setView(VIEWS.RASM_TEST)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer',
            color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Test: Rasm-Orthographie</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Prüfe dein Wissen über die orthographischen Besonderheiten
            </div>
          </button>
          {rasmDecodingData && <button onClick={() => setView(VIEWS.RASM_DECODING)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer',
            color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Rasm-Dekodierung</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Punktlosen Rasm sehen und alle möglichen Lesungen ableiten. Kontext disambiguiert.
            </div>
          </button>}
          {scriptHistoryData && <button onClick={() => setView(VIEWS.SCRIPT_HISTORY)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer',
            color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Schriftgeschichte</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Chronologische Entwicklung: Rasm → I'jam → Tashkil. Sprachwissenschaftliche Fakten.
            </div>
          </button>}
        </div>
      </section>

      {/* Analysis Exercises */}
      <section style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1rem', color: '#ff7a7a', marginBottom: '12px' }}>
          Textanalyse
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          <button onClick={() => setView(VIEWS.VOCALIZATION)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer',
            color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Vokalisierungsübung</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Konsonantentext → grammatisch abgeleitete Vokalisierung. Wortart, Wurzel, Form, Rolle und Vokalisation Schritt für Schritt bestimmen.
            </div>
          </button>
          <button onClick={() => setView(VIEWS.AMBIGUITY)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer',
            color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Ambiguitätsübung</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Alle grammatisch möglichen Lesarten einer Konsonantenform erkennen. Geführter und freier Modus.
            </div>
          </button>
        </div>
      </section>

      {/* Reference Tools */}
      <section style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1rem', color: '#7ac4ff', marginBottom: '12px' }}>
          Nachschlagewerke
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          <button onClick={() => setView(VIEWS.VOCAB_DRILL)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '2px solid var(--accent, #1976d2)', cursor: 'pointer',
            color: 'var(--text-primary)',
          }}>
            <strong>Vokabel-Drill</strong>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              Frequenzbasiertes Wurzel-Drilling: Top 50/100/300 Wurzeln
            </div>
          </button>
          <button onClick={() => setView(VIEWS.LEXICON)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '2px solid var(--accent-teal)', cursor: 'pointer',
            color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Lexikon</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Konsolidiertes Nachschlagewerk: Wurzel eingeben → alle Ableitungen, Frequenz, Stellen, Lane's-Link.
            </div>
          </button>
          <button onClick={() => setView(VIEWS.CROSS_REF)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer',
            color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Konkordanz</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Alle Vorkommen eines Wortes oder einer Wurzel im gesamten Quran finden.
            </div>
          </button>
          <button onClick={() => setView(VIEWS.GRAMMAR_REF)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer',
            color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Grammatik-Referenz</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Konjugationstabellen, Kasusregeln, Partikeln und Pronomen — alles auf einen Blick.
            </div>
          </button>
          {caseTriggerData && <button onClick={() => setView(VIEWS.CASE_TRIGGER_REF)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer',
            color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Kasusauslöser-Referenz</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Welche syntaktischen Funktionen und Partikeln lösen welchen Kasus bzw. Modus aus.
            </div>
          </button>}
          {weakVerbsDerivedData && <button onClick={() => setView(VIEWS.WEAK_VERBS_DERIVED)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer',
            color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Schwache Verben — Abgeleitete Formen</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Konjugation schwacher Verben in Formen II-X mit Partizipien, Masdar und Quran-Beispielen.
            </div>
          </button>}
          <button onClick={() => setView(VIEWS.HAPAX)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer',
            color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Hapax Legomena</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Wortformen, die in genau dieser Flexionsform nur einmal im Quran vorkommen (Form-Hapax). Viele stammen von häufigen Wurzeln — die Form selbst ist einmalig, nicht die Wurzel.
            </div>
          </button>
          <button onClick={() => setView(VIEWS.LOANWORDS)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer',
            color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Lehnwörter-Verzeichnis</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {loanwordData.meta?.totalEntries || '?'} sprachwissenschaftlich anerkannte Lehnwörter mit Herkunftssprache, Etymologie und koranischer Verwendung.
            </div>
          </button>
          <button onClick={() => setView(VIEWS.COLLOCATIONS)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer',
            color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Kollokationen</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Häufig gemeinsam auftretende Wurzeln und Wortpaare im Quran — Wurzel-Kollokationen und Wort-Bigramme.
            </div>
          </button>
        </div>
      </section>

      {/* New: Schriftkundliche Referenzen */}
      <section style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1rem', color: '#e0a0ff', marginBottom: '12px' }}>
          Schrift-Referenzen
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {solarLunarData && <button onClick={() => setView(VIEWS.SOLAR_LUNAR)} style={{ padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Sonnen- und Mondbuchstaben</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>14 Sonnenbuchstaben (Lam assimiliert) vs. 14 Mondbuchstaben (Lam bleibt) — mit IPA und Quran-Beispielen.</div>
          </button>}
          {alifInventoryData && <button onClick={() => setView(VIEWS.ALIF_INVENTORY)} style={{ padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Alif-Inventar</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Alle Alif-Varianten: Regulär, Hamza, Madda, Wasla, Maqsura, Khanjariyya, Wiqaya, Tafriqa.</div>
          </button>}
          <button onClick={() => setView(VIEWS.MUQATTAAT_REF)} style={{ padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Huruf Muqattaʿat</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Alle 14 Einzelbuchstaben in 29 Suren — Referenzübersicht mit Verteilung und Statistik.</div>
          </button>
          <button onClick={() => setView(VIEWS.MUSHAF_NOTATION)} style={{ padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Mushaf-Notation</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Versend-Zeichen und Surentitel.</div>
          </button>
          {reverseRasmDrillData && <button onClick={() => setView(VIEWS.REVERSE_RASM)} style={{ padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Reverse-Rasm-Drill</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Vokalisierter Text → erkenne welche Wörter im reinen Rasm mehrdeutig wären.</div>
          </button>}
          {rasmGlyphMapping && <button onClick={() => setView(VIEWS.RASM_GLYPH_MAP)} style={{ padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)', border: '2px solid var(--accent-teal)', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Rasm-Glyphen-Mapping</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Welche Buchstaben verbergen sich hinter welcher Rasm-Grundform? 22 von 28 Buchstaben sind mehrdeutig.</div>
          </button>}
        </div>
      </section>

      {/* New: Korpus-Analyse */}
      <section style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1rem', color: '#80cbc4', marginBottom: '12px' }}>
          Korpus-Analyse
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {suraIndexData && <button onClick={() => setView(VIEWS.SURA_INDEX)} style={{ padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Suren-Index</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>114 Suren mit Verszahl, Wortanzahl und einzigartigen Wurzeln.</div>
          </button>}
          {freqPathData && <button onClick={() => setView(VIEWS.FREQ_PATH)} style={{ padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Frequenz-Lernpfad</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Top 50/100/200/500 Wurzeln nach Häufigkeit — strukturierter Weg zur maximalen Textabdeckung.</div>
          </button>}
          {verbFreqData && <button onClick={() => setView(VIEWS.VERB_FREQ)} style={{ padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Verbform-Häufigkeit</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Wie oft kommt jede Verbform (I-X) im Quran vor? Statistik mit Prozentanteilen.</div>
          </button>}
          {nominalPatternData && <button onClick={() => setView(VIEWS.NOMINAL_PATTERNS)} style={{ padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Nominalmuster-Inventar</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Alle im Quran vorkommenden Nominalbildungsmuster — durchsuchbar mit Beispielen.</div>
          </button>}
          {properNamesData && <button onClick={() => setView(VIEWS.PROPER_NAMES)} style={{ padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Koranische Eigennamen</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Alle Eigennamen im Quran mit Wurzel, Häufigkeit und Vorkommen.</div>
          </button>}
        </div>
      </section>

      {/* Reading & Listening */}
      <section style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--accent-teal)', marginBottom: '12px' }}>
          Lesen und Hören
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          <button onClick={() => setView(VIEWS.READER)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer',
            color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Fortlaufendes Lesen</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Mehrere Verse am Stück lesen. Wort antippen für Morphologie-Info.
            </div>
          </button>
          <button onClick={() => setView(VIEWS.DICTATION)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer',
            color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Diktatübung</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Audio hören und den Konsonantentext schreiben. Verbindet Hören und Schreiben.
            </div>
          </button>
        </div>
      </section>

      {/* Practice */}
      <section style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1rem', color: '#b07aff', marginBottom: '12px' }}>
          Übung
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          <button onClick={() => setView(VIEWS.WRITING)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer',
            color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Schreibübung</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Arabische Buchstaben aktiv schreiben — Name zu Buchstabe, Buchstabe zu Name, alle 4 Formen.
            </div>
          </button>
          <button onClick={() => setView(VIEWS.CLOZE)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer',
            color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Lückentexte</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Fehlende Wörter in Quranversen einsetzen — aktive Sprachproduktion. 104 Übungen in 8 Kategorien.
            </div>
          </button>
          <button onClick={() => setView(VIEWS.HANDWRITING)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer',
            color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Handschrift-Training</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Arabische Buchstaben auf Canvas nachzeichnen — alle 28 Buchstaben in 4 Formen.
            </div>
          </button>
          <button onClick={() => setView(VIEWS.PRINT)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer',
            color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Druckbare Referenzblätter</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Konjugationstabellen, Partikeln, Pronomen und Kasusregeln zum Ausdrucken.
            </div>
          </button>
          <button onClick={() => setView(VIEWS.ANNOTATIONS)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer',
            color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Vers-Notizen und Lesezeichen</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Persönliche Notizen an Quranverse heften — Beobachtungen, Fragen, linguistische Anmerkungen.
            </div>
          </button>
        </div>
      </section>

      {/* Analyse-Übungen */}
      <section style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--accent-teal)', marginBottom: '12px' }}>
          Analyse-Übungen
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          <button onClick={() => setView(VIEWS.DECOMPOSITION)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer',
            color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Morphologische Dekomposition</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Zerlege quranische Wörter in Präfix, Wurzel, Muster und Suffix.
            </div>
          </button>
          <button onClick={() => setView(VIEWS.CASE_DERIVATION)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer',
            color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Kasusableitung</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Bestimme den Kasus eines Wortes aus seiner syntaktischen Rolle im Vers.
            </div>
          </button>
          <button onClick={() => setView(VIEWS.VERSE_SYNTHESIS)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer',
            color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Vers-Synthese</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Analysiere alle Wörter eines Verses und formuliere die Gesamtbedeutung.
            </div>
          </button>
          <button onClick={() => setView(VIEWS.ERROR_CORRECTION)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer',
            color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Fehlerkorrektur</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Finde und korrigiere falsche Vokalisierungen in Quranversen.
            </div>
          </button>
          <button onClick={() => setView(VIEWS.CONTEXT_DISAMBIG)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer',
            color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Kontextuelle Disambiguierung</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Bestimme aus dem Kontext die korrekte Lesung mehrdeutiger Konsonantenformen.
            </div>
          </button>
        </div>
      </section>

      {/* New Drills Section */}
      <section style={{ marginBottom: '32px' }}>
        <h3 style={{ marginBottom: '12px', color: 'var(--accent-gold)' }}>Grammatik-Drills</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {IrabExercise && <button onClick={() => setView(VIEWS.IRAB)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Vollständiges Irab</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Parse jedes Wort eines Verses — Rolle, Kasus, Begründung.</div>
          </button>}
          {RootExtractionDrill && <button onClick={() => setView(VIEWS.ROOT_EXTRACTION)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Wurzelextraktion</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Extrahiere die Wurzel aus dem konsonantischen Text.</div>
          </button>}
          {PatternRecognitionDrill && <button onClick={() => setView(VIEWS.PATTERN_RECOGNITION)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Muster-Erkennung (Wazn)</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Erkenne Wortmuster und finde Wörter zu Mustern.</div>
          </button>}
          {PronounSuffixDrill && <button onClick={() => setView(VIEWS.PRONOUN_SUFFIX)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Pronominalsuffix-Drill</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Erkenne und dekodiere angehängte Pronomen.</div>
          </button>}
          {VerbModeDrill && <button onClick={() => setView(VIEWS.VERB_MODE)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Verbmodus-Drill</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Indikativ, Subjunktiv oder Jussiv? Bestimme den Modus.</div>
          </button>}
          {NegationDrill && <button onClick={() => setView(VIEWS.NEGATION)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Negations-Drill</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Die 8 Negationspartikeln und ihre syntaktischen Auswirkungen.</div>
          </button>}
          {HamzaExercise && <button onClick={() => setView(VIEWS.HAMZA)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Hamza-Orthographie</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Hamza-Sitz, Wasl vs. Qat, Schreibregeln systematisch üben.</div>
          </button>}
          {energetikusData && <button onClick={() => setView(VIEWS.ENERGETIKUS)} style={{ padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)', border: '2px solid var(--accent-teal)', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Energetikus-Paradigma (نون التوكيد)</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Schwere und leichte Emphase-Form — vollständige Konjugationstabelle mit Quranbeispielen.</div>
          </button>}
        </div>
      </section>

      {/* Erweiterte Drills (P2/P3/P4) */}
      <section style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1rem', color: '#ff9800', marginBottom: '12px' }}>
          Erweiterte Übungen und Referenzen
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          <button onClick={() => setView(VIEWS.RASM_VOCALIZATION)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Rasm → Vokalisation</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Vom Konsonantentext zur grammatisch begründeten Vokalisation in 5 Schritten.</div>
          </button>
          <button onClick={() => setView(VIEWS.PAUSAL_FORMS)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Pausalformen-Drill</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Wie Wortenden sich beim Pausieren verändern: Tanwin, Kasus, Ta Marbuta.</div>
          </button>
          <button onClick={() => setView(VIEWS.ALIF_WASLA)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Alif Wasla Drill</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Alle Positionen von Hamzat al-Wasl: Artikel, Formen VII-X, Nomen, Imperative.</div>
          </button>
          <button onClick={() => setView(VIEWS.WEAK_ROOT_TRANSFORM)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Schwache-Wurzel-Transformationen</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Wie و und ي in verschiedenen Formen mutieren und verschwinden.</div>
          </button>
          <button onClick={() => setView(VIEWS.RING_COMPOSITION)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Ringkomposition und Chiasmus</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Symmetrische Textstrukturen in Suren erkennen.</div>
          </button>
          <button onClick={() => setView(VIEWS.SPEECH_ACT)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Sprechakt-Drill (Pragmatik)</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Befehl, Bitte, Frage, Schwur, Wunsch — Sprechakte in Quranversen identifizieren.</div>
          </button>
          <button onClick={() => setView(VIEWS.MUSHAF_NOTATION)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Mushaf-Notation</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Versend-Zeichen und Surentitel.</div>
          </button>
        </div>
      </section>

      {/* Semantik und Bedeutung */}
      <section style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--accent-gold)', marginBottom: '12px' }}>
          Semantik und Bedeutung
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          <button onClick={() => setView(VIEWS.POLYSEMY)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Polysemie-Drill</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Kontextabhängige Bedeutungsbestimmung — dasselbe Wort, verschiedene Bedeutungen je nach Vers.</div>
          </button>
          <button onClick={() => setView(VIEWS.VERB_FORM_SEMANTICS)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Verbform-Semantik</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Wie sich die Bedeutung einer Wurzel durch Formwechsel (I→X) systematisch verändert.</div>
          </button>
          <button onClick={() => setView(VIEWS.SYNONYM_CONTRAST)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Synonym-Kontrast</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Bedeutungsnuancen zwischen Nah-Synonymen: خَوْف vs. خَشْيَة, قَلْب vs. فُؤَاد, und mehr.</div>
          </button>
          <button onClick={() => setView(VIEWS.THEMATIC_FIELD)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Thematische-Felder-Drill</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>25 semantische Felder mit 501 Wurzeln — ordne Wurzeln ihrem Bedeutungsfeld zu.</div>
          </button>
        </div>
      </section>

      {/* Grammatik-Drills */}
      <section style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--accent-gold)', marginBottom: '12px' }}>
          Grammatik-Drills
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          <button onClick={() => setView(VIEWS.VERB_RECTION)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Verbvalenz-Drill</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Welches Verb regiert welche Präposition? 211 Verben mit ihren Rektionsmustern.</div>
          </button>
          <button onClick={() => setView(VIEWS.CONGRUENCE)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Kongruenz-Drill</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Übereinstimmung in Genus, Numerus und Kasus — Verb-Subjekt, Adjektiv-Nomen, gebrochene Plurale.</div>
          </button>
          <button onClick={() => setView(VIEWS.MASDAR)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Masdar-Drill</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Verbalsubstantive erkennen und von Partizipien, Adjektiven und Verben unterscheiden.</div>
          </button>
          <button onClick={() => setView(VIEWS.ELATIV)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Elativ-Drill</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Komparativ und Superlativ (Muster af'al / fu'la) — Bildung, Verwendung, quranische Belege.</div>
          </button>
          <button onClick={() => setView(VIEWS.QUADRILITERAL)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Vierradikalige Verben</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Verben mit vier Wurzelkonsonanten — Muster, Konjugation, Reduplikation, quranische Belege.</div>
          </button>
          <button onClick={() => setView(VIEWS.PHONOLOGY_SUPP)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Phonologie — Vertiefung</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Silbenstruktur, Betonungsregeln und weitere phonologische Phänomene des klassischen Arabisch.</div>
          </button>
        </div>
      </section>

      {/* Textstruktur */}
      <section style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--accent-gold)', marginBottom: '12px' }}>
          Textstruktur
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          <button onClick={() => setView(VIEWS.SURAH_MACROSTRUCTURE)} style={{
            padding: '20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Suren-Makrostruktur</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Wie sind Suren aufgebaut? Eröffnung, Segmente, Schluss, Ringstrukturen, Refrains — 7 analysierte Suren.</div>
          </button>
        </div>
      </section>
    </div>
  )
}
