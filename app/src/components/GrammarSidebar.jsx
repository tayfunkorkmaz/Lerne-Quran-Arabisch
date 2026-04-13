import { useState, useMemo, useEffect, useRef } from 'react'
import morphologyData from '../data/morphology-tables.json'
import particlesData from '../data/particles.json'
import pronounsData from '../data/pronouns.json'
import verbRectionData from '../data/verb-rection.json'
import glossaryData from '../data/grammar-glossary.json'

const { verbForms } = morphologyData
const { particles } = particlesData

const TABS = [
  { key: 'konjugation', label: 'Konjugation' },
  { key: 'kasus', label: 'Kasus' },
  { key: 'rektion', label: 'Rektion' },
  { key: 'verb_rektion', label: 'Verb-Rektion' },
  { key: 'partikeln', label: 'Partikeln' },
  { key: 'pronomen', label: 'Pronomen' },
  { key: 'glossar', label: 'Glossar' },
]

const PERSON_LABELS = {
  '3ms': '3. P. Sg. m.',
  '3fs': '3. P. Sg. f.',
  '3md': '3. P. Du. m.',
  '3fd': '3. P. Du. f.',
  '3mp': '3. P. Pl. m.',
  '3fp': '3. P. Pl. f.',
  '2ms': '2. P. Sg. m.',
  '2fs': '2. P. Sg. f.',
  '2md': '2. P. Du.',
  '2mp': '2. P. Pl. m.',
  '2fp': '2. P. Pl. f.',
  '1s': '1. P. Sg.',
  '1p': '1. P. Pl.',
}

const PERSON_ORDER = [
  '3ms', '3fs', '3md', '3fd', '3mp', '3fp',
  '2ms', '2fs', '2md', '2mp', '2fp',
  '1s', '1p',
]

const IMPERATIVE_ORDER = ['2ms', '2fs', '2md', '2mp', '2fp']

const CASE_RULES = [
  {
    case: 'Nominativ',
    caseArabic: 'مَرْفُوع',
    marker: '-u / -un (Damma)',
    color: 'var(--correct)',
    rules: [
      { label: 'Subjekt (Faa\'il)', arabic: 'فَاعِل', example: 'كَتَبَ الْوَلَدُ', exampleGerman: 'Der Junge schrieb' },
      { label: 'Stellvertreter-Subjekt (Naa\'ib al-Faa\'il)', arabic: 'نَائِبُ الْفَاعِل', example: 'كُتِبَ الْكِتَابُ', exampleGerman: 'Das Buch wurde geschrieben' },
      { label: 'Inchoativ (Mubtada\')', arabic: 'مُبْتَدَأ', example: 'الْوَلَدُ كَبِيرٌ', exampleGerman: 'Der Junge ist groß' },
      { label: 'Prädikat (Khabar)', arabic: 'خَبَر', example: 'الْوَلَدُ كَبِيرٌ', exampleGerman: 'Der Junge ist groß' },
      { label: 'Prädikat von inna und Schwestern', arabic: 'خَبَرُ إِنَّ', example: 'إِنَّ اللَّهَ عَلِيمٌ', exampleGerman: 'Gewiss, Gott ist wissend' },
    ],
  },
  {
    case: 'Akkusativ',
    caseArabic: 'مَنْصُوب',
    marker: '-a / -an (Fatha)',
    color: 'var(--accent-gold)',
    rules: [
      { label: 'Direktes Objekt (Maf\'ul bihi)', arabic: 'مَفْعُولٌ بِهِ', example: 'قَرَأْتُ الْكِتَابَ', exampleGerman: 'Ich las das Buch' },
      { label: 'Zustandsakkusativ (Hal)', arabic: 'حَال', example: 'جَاءَ رَاكِبًا', exampleGerman: 'Er kam reitend' },
      { label: 'Adverbiale Bestimmung (Ẓarf)', arabic: 'ظَرْف', example: 'صُمْتُ يَوْمًا', exampleGerman: 'Ich fastete einen Tag' },
      { label: 'Absolutes Objekt (Maf\'ul mutlaq)', arabic: 'مَفْعُولٌ مُطْلَق', example: 'ضَرَبَ ضَرْبًا', exampleGerman: 'Er schlug ein Schlagen' },
      { label: 'Spezifikation (Tamyiz)', arabic: 'تَمْيِيز', example: 'عِشْرُونَ كِتَابًا', exampleGerman: 'Zwanzig Bücher' },
      { label: 'Ausnahme (Mustathna)', arabic: 'مُسْتَثْنَى', example: 'جَاءُوا إِلَّا زَيْدًا', exampleGerman: 'Sie kamen außer Zaid' },
      { label: 'Subjekt von inna und Schwestern', arabic: 'اِسْمُ إِنَّ', example: 'إِنَّ اللَّهَ عَلِيمٌ', exampleGerman: 'Gewiss, Gott ist wissend' },
      { label: 'Prädikat von kaana und Schwestern', arabic: 'خَبَرُ كَانَ', example: 'كَانَ الْجَوُّ جَمِيلًا', exampleGerman: 'Das Wetter war schön' },
    ],
  },
  {
    case: 'Genitiv',
    caseArabic: 'مَجْرُور',
    marker: '-i / -in (Kasra)',
    color: 'var(--accent-teal)',
    rules: [
      { label: 'Nach Präpositionen', arabic: 'مَجْرُورٌ بِحَرْفِ جَرّ', example: 'فِي الْبَيْتِ', exampleGerman: 'Im Haus' },
      { label: 'Iḍāfa: zweites Glied (Mudaf ilayhi)', arabic: 'مُضَافٌ إِلَيْهِ', example: 'كِتَابُ الطَّالِبِ', exampleGerman: 'Das Buch des Studenten' },
      { label: 'Adjektiv folgt Genitiv-Nomen', arabic: 'نَعْتُ الْمَجْرُور', example: 'فِي الْبَيْتِ الْكَبِيرِ', exampleGerman: 'Im großen Haus' },
      { label: 'Apposition zu Genitiv-Nomen', arabic: 'بَدَلٌ مِنَ الْمَجْرُور', example: 'مَرَرْتُ بِزَيْدٍ أَخِيكَ', exampleGerman: 'Ich ging an Zaid, deinem Bruder, vorbei' },
    ],
  },
]

/* ---------- Styles ---------- */

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
    transition: 'opacity 0.3s ease',
  },
  panel: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: 'min(400px, 90vw)',
    maxWidth: '90vw',
    height: '100vh',
    background: 'var(--bg-secondary)',
    borderLeft: '1px solid var(--border)',
    boxShadow: 'var(--shadow-lg)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.3s ease',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px 12px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-card)',
    flexShrink: 0,
  },
  title: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: 'var(--text-heading)',
    margin: 0,
  },
  closeBtn: {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-sm)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: '1.2rem',
    cursor: 'pointer',
    border: 'none',
    transition: 'background 0.2s, color 0.2s',
  },
  tabBar: {
    display: 'flex',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-card)',
    flexShrink: 0,
    overflow: 'hidden',
  },
  tab: (active) => ({
    flex: 1,
    padding: '10px 4px',
    fontSize: '0.8rem',
    fontWeight: active ? 600 : 400,
    color: active ? 'var(--accent-teal)' : 'var(--text-secondary)',
    background: 'transparent',
    border: 'none',
    borderBottom: active ? '2px solid var(--accent-teal)' : '2px solid transparent',
    cursor: 'pointer',
    transition: 'color 0.2s, border-color 0.2s',
    textAlign: 'center',
    whiteSpace: 'nowrap',
  }),
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 20px',
  },
  /* Konjugation tab */
  formSelect: {
    width: '100%',
    padding: '8px 12px',
    marginBottom: 16,
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.95rem',
    cursor: 'pointer',
  },
  formHeader: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 12,
    marginBottom: 8,
  },
  formLabel: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--accent-teal)',
  },
  formPattern: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  meaningBox: {
    padding: '8px 12px',
    marginBottom: 16,
    background: 'var(--accent-teal-bg)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.85rem',
    color: 'var(--text-primary)',
    borderLeft: '3px solid var(--accent-teal)',
  },
  exampleBox: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 16,
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  tableSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-heading)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.85rem',
    marginBottom: 4,
  },
  th: {
    textAlign: 'left',
    padding: '6px 8px',
    borderBottom: '1px solid var(--border)',
    color: 'var(--text-muted)',
    fontWeight: 500,
    fontSize: '0.75rem',
  },
  thRight: {
    textAlign: 'right',
    padding: '6px 8px',
    borderBottom: '1px solid var(--border)',
    color: 'var(--text-muted)',
    fontWeight: 500,
    fontSize: '0.75rem',
  },
  td: {
    padding: '5px 8px',
    borderBottom: '1px solid var(--border)',
    color: 'var(--text-primary)',
    fontSize: '0.8rem',
  },
  tdArabic: {
    padding: '5px 8px',
    borderBottom: '1px solid var(--border)',
    textAlign: 'right',
    fontSize: '1.15rem',
    lineHeight: 1.8,
  },
  /* Participles & Masdar */
  derivedGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginBottom: 16,
  },
  derivedCard: {
    padding: '8px 10px',
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
  },
  derivedLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  derivedArabic: {
    fontSize: '1.1rem',
    lineHeight: 1.6,
  },
  derivedTranslit: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
  /* Kasus tab */
  caseBlock: {
    marginBottom: 24,
  },
  caseHeader: (color) => ({
    display: 'flex',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottom: `2px solid ${color}`,
  }),
  caseName: (color) => ({
    fontSize: '1rem',
    fontWeight: 700,
    color,
  }),
  caseArabicLabel: {
    fontSize: '1.1rem',
    lineHeight: 1.4,
  },
  caseMarker: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginLeft: 'auto',
  },
  ruleRow: {
    padding: '8px 0',
    borderBottom: '1px solid var(--border)',
  },
  ruleLabel: {
    fontWeight: 600,
    fontSize: '0.85rem',
    color: 'var(--text-primary)',
    marginBottom: 2,
  },
  ruleArabicTerm: {
    fontSize: '0.95rem',
    lineHeight: 1.4,
    display: 'inline-block',
    marginLeft: 8,
  },
  ruleExample: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 4,
  },
  ruleExampleArabic: {
    fontSize: '1.05rem',
    lineHeight: 1.6,
  },
  ruleExampleGerman: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
  /* Partikeln tab */
  searchInput: {
    width: '100%',
    padding: '8px 12px',
    marginBottom: 12,
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.9rem',
  },
  particleCard: {
    padding: '10px 12px',
    marginBottom: 8,
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
  },
  particleTop: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  particleArabic: {
    fontSize: '1.3rem',
    lineHeight: 1.4,
  },
  particleTranslit: {
    fontSize: '0.85rem',
    color: 'var(--accent-teal)',
    fontWeight: 500,
  },
  particleGerman: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 2,
  },
  particleFunction: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
  },
  particleEffect: {
    display: 'inline-block',
    marginTop: 4,
    padding: '2px 8px',
    fontSize: '0.7rem',
    fontWeight: 500,
    borderRadius: 10,
    background: 'var(--accent-teal-bg)',
    color: 'var(--accent-teal)',
  },
  noResults: {
    textAlign: 'center',
    color: 'var(--text-muted)',
    padding: '24px 0',
    fontSize: '0.85rem',
  },
  /* Pronomen tab */
  pronounSection: {
    marginBottom: 24,
  },
  pronounSectionTitle: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: 'var(--accent-teal)',
    marginBottom: 4,
  },
  pronounDescription: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    marginBottom: 10,
    lineHeight: 1.4,
  },
  pronounSubSection: {
    marginBottom: 16,
  },
  pronounSubTitle: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: 6,
  },
  notesList: {
    listStyle: 'none',
    padding: 0,
    margin: '8px 0 0',
  },
  noteItem: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    padding: '4px 0 4px 12px',
    borderLeft: '2px solid var(--border)',
    marginBottom: 4,
    lineHeight: 1.4,
  },
}

/* ---------- Grammatical effect labels ---------- */

const EFFECT_LABELS = {
  none: null,
  genitive: 'Genitiv',
  accusative: 'Akkusativ',
  jussive: 'Jussiv (Apokopat)',
  subjunctive: 'Subjunktiv (Konjunktiv)',
  inna_sister: 'Inna-Schwester (Akk. Subj.)',
  nominative: 'Nominativ',
}

/* ---------- Sub-components ---------- */

function KonjugationTab() {
  const [selectedForm, setSelectedForm] = useState('I')

  const form = useMemo(
    () => verbForms.find((f) => f.form === selectedForm),
    [selectedForm]
  )

  if (!form) return null

  const renderConjugationTable = (data, personOrder, title) => {
    if (!data) return null
    return (
      <div style={styles.tableSection}>
        <div style={styles.sectionTitle}>{title}</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Person</th>
              <th style={styles.thRight}>Form</th>
            </tr>
          </thead>
          <tbody>
            {personOrder.map((key) =>
              data[key] ? (
                <tr key={key}>
                  <td style={styles.td}>{PERSON_LABELS[key]}</td>
                  <td style={styles.tdArabic}>
                    <span className="arabic">{data[key]}</span>
                  </td>
                </tr>
              ) : null
            )}
          </tbody>
        </table>
      </div>
    )
  }

  const renderDerived = () => {
    const cards = []
    if (form.activeParticiple) {
      cards.push({ key: 'ap', label: 'Aktivpartizip', data: form.activeParticiple })
    }
    if (form.passiveParticiple) {
      cards.push({ key: 'pp', label: 'Passivpartizip', data: form.passiveParticiple })
    }
    if (cards.length === 0) return null
    return (
      <div style={styles.tableSection}>
        <div style={styles.sectionTitle}>Partizipien</div>
        <div style={styles.derivedGrid}>
          {cards.map((c) => (
            <div key={c.key} style={styles.derivedCard}>
              <div style={styles.derivedLabel}>{c.label}</div>
              <div style={styles.derivedArabic}>
                <span className="arabic">{c.data.arabic}</span>
              </div>
              <div style={styles.derivedTranslit}>{c.data.transliteration}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderMasdar = () => {
    if (!form.masdar) return null
    const { masdar } = form
    const entries = []
    if (masdar.primary) {
      entries.push({ key: 'primary', label: 'Masdar', data: masdar.primary })
    }
    if (masdar.variant) {
      entries.push({ key: 'variant', label: 'Masdar (Variante)', data: masdar.variant })
    }
    if (masdar.commonPatterns) {
      return (
        <div style={styles.tableSection}>
          <div style={styles.sectionTitle}>Masdar (Verbalsubstantiv)</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>
            {masdar.note}
          </div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Muster</th>
                <th style={styles.th}>Transliteration</th>
                <th style={styles.th}>Beispiel</th>
              </tr>
            </thead>
            <tbody>
              {masdar.commonPatterns.map((p, i) => (
                <tr key={i}>
                  <td style={styles.tdArabic}>
                    <span className="arabic" style={{ fontSize: '1rem' }}>{p.arabic}</span>
                  </td>
                  <td style={styles.td}>{p.transliteration}</td>
                  <td style={styles.td}>{p.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
    if (entries.length === 0) return null
    return (
      <div style={styles.tableSection}>
        <div style={styles.sectionTitle}>Masdar (Verbalsubstantiv)</div>
        <div style={styles.derivedGrid}>
          {entries.map((e) => (
            <div key={e.key} style={styles.derivedCard}>
              <div style={styles.derivedLabel}>{e.label}</div>
              <div style={styles.derivedArabic}>
                <span className="arabic">{e.data.arabic}</span>
              </div>
              <div style={styles.derivedTranslit}>{e.data.transliteration}</div>
              {e.data.example && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {e.data.example}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <select
        style={styles.formSelect}
        value={selectedForm}
        onChange={(e) => setSelectedForm(e.target.value)}
        aria-label="Verbform auswählen"
      >
        {verbForms.map((f) => (
          <option key={f.form} value={f.form}>
            Form {f.form} — {f.pattern?.transliteration} ({f.meaningShift})
          </option>
        ))}
      </select>

      <div style={styles.formHeader}>
        <span style={styles.formLabel}>Form {form.form}</span>
        <span className="arabic" style={{ fontSize: '1.3rem', lineHeight: 1.4 }}>
          {form.pattern.arabic}
        </span>
      </div>
      <div style={styles.formPattern}>{form.pattern.transliteration}</div>
      {form.pattern.notes && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2, marginBottom: 8 }}>
          {form.pattern.notes}
        </div>
      )}

      <div style={styles.meaningBox}>
        <strong>Bedeutungsverschiebung:</strong> {form.meaningShiftGerman}
      </div>

      <div style={styles.exampleBox}>
        <span className="arabic" style={{ fontSize: '1.1rem', lineHeight: 1.4 }}>
          {form.exampleWord.arabic}
        </span>
        <span>({form.exampleWord.transliteration})</span>
        <span>= {form.exampleWord.german}</span>
      </div>

      {renderConjugationTable(form.perfect, PERSON_ORDER, 'Perfekt (abgeschlossene Handlung)')}
      {renderConjugationTable(form.imperfect, PERSON_ORDER, 'Imperfekt (unabgeschlossene Handlung)')}
      {renderConjugationTable(form.imperative, IMPERATIVE_ORDER, 'Imperativ (Befehl)')}
      {renderDerived()}
      {renderMasdar()}
    </div>
  )
}

function KasusTab() {
  return (
    <div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
        Das Arabische kennt drei grammatische Fälle (Kasus). Die Kasusendung erscheint am
        Ende des Nomens und zeigt seine syntaktische Funktion im Satz an.
      </div>
      {CASE_RULES.map((caseData) => (
        <div key={caseData.case} style={styles.caseBlock}>
          <div style={styles.caseHeader(caseData.color)}>
            <span style={styles.caseName(caseData.color)}>{caseData.case}</span>
            <span className="arabic" style={styles.caseArabicLabel}>
              {caseData.caseArabic}
            </span>
            <span style={styles.caseMarker}>{caseData.marker}</span>
          </div>
          {caseData.rules.map((rule, i) => (
            <div key={i} style={styles.ruleRow}>
              <div style={styles.ruleLabel}>
                {rule.label}
                <span className="arabic" style={styles.ruleArabicTerm}>
                  {rule.arabic}
                </span>
              </div>
              <div style={styles.ruleExample}>
                <span className="arabic" style={styles.ruleExampleArabic}>
                  {rule.example}
                </span>
                <span style={styles.ruleExampleGerman}>{rule.exampleGerman}</span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function PartikelnTab() {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return particles
    const q = search.trim().toLowerCase()
    return particles.filter(
      (p) =>
        p.arabic.includes(q) ||
        p.transliteration.toLowerCase().includes(q) ||
        p.german.toLowerCase().includes(q) ||
        p.function.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    )
  }, [search])

  return (
    <div>
      <input
        type="text"
        placeholder="Suche: Arabisch, Transliteration, Deutsch..."
        style={styles.searchInput}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Partikel suchen"
      />
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>
        {filtered.length} von {particles.length} Partikeln
      </div>
      {filtered.length === 0 ? (
        <div style={styles.noResults}>Keine Partikeln gefunden.</div>
      ) : (
        filtered.map((p) => (
          <div key={p.id} style={styles.particleCard}>
            <div style={styles.particleTop}>
              <span className="arabic" style={styles.particleArabic}>
                {p.arabic}
              </span>
              <span style={styles.particleTranslit}>{p.transliteration}</span>
            </div>
            <div style={styles.particleGerman}>{p.german}</div>
            <div style={styles.particleFunction}>{p.function}</div>
            {p.grammaticalEffect && p.grammaticalEffect !== 'none' && (
              <span style={styles.particleEffect}>
                {EFFECT_LABELS[p.grammaticalEffect] || p.grammaticalEffect}
              </span>
            )}
          </div>
        ))
      )}
    </div>
  )
}

function PronomenTab() {
  const renderPronounTable = (pronounsList, columns) => {
    if (!pronounsList || pronounsList.length === 0) return null
    return (
      <table style={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={col.arabic ? styles.thRight : styles.th}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pronounsList.map((pr, i) => (
            <tr key={pr.id || i}>
              {columns.map((col) => {
                if (col.arabic) {
                  return (
                    <td key={col.key} style={styles.tdArabic}>
                      <span className="arabic" style={{ fontSize: '1.05rem' }}>
                        {col.accessor(pr)}
                      </span>
                    </td>
                  )
                }
                return (
                  <td key={col.key} style={styles.td}>
                    {col.accessor(pr)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  const independentColumns = [
    { key: 'german', label: 'Deutsch', accessor: (p) => p.german },
    { key: 'arabic', label: 'Arabisch', arabic: true, accessor: (p) => p.arabic },
    { key: 'translit', label: 'Umschrift', accessor: (p) => p.transliteration },
  ]

  const suffixColumns = [
    { key: 'german', label: 'Deutsch', accessor: (p) => p.german },
    { key: 'arabic', label: 'Arabisch', arabic: true, accessor: (p) => p.arabic },
    { key: 'translit', label: 'Umschrift', accessor: (p) => p.transliteration },
  ]

  const demoColumns = [
    { key: 'german', label: 'Deutsch', accessor: (p) => p.german },
    { key: 'arabic', label: 'Arabisch', arabic: true, accessor: (p) => p.arabic },
    { key: 'translit', label: 'Umschrift', accessor: (p) => p.transliteration },
  ]

  const relativeColumns = [
    { key: 'german', label: 'Deutsch', accessor: (p) => p.german },
    { key: 'arabic', label: 'Arabisch', arabic: true, accessor: (p) => p.arabic },
    { key: 'translit', label: 'Umschrift', accessor: (p) => p.transliteration },
  ]

  return (
    <div>
      {/* Independent pronouns */}
      <div style={styles.pronounSection}>
        <div style={styles.pronounSectionTitle}>Unabhängige Personalpronomen</div>
        <div style={styles.pronounDescription}>{pronounsData?.independent?.description}</div>
        {renderPronounTable(pronounsData?.independent?.pronouns, independentColumns)}
      </div>

      {/* Suffix pronouns */}
      <div style={styles.pronounSection}>
        <div style={styles.pronounSectionTitle}>Suffixpronomen (angehängt)</div>
        <div style={styles.pronounDescription}>{pronounsData?.suffix?.description}</div>
        {renderPronounTable(pronounsData?.suffix?.pronouns, suffixColumns)}
      </div>

      {/* Demonstrative pronouns */}
      <div style={styles.pronounSection}>
        <div style={styles.pronounSectionTitle}>Demonstrativpronomen</div>
        <div style={styles.pronounDescription}>{pronounsData?.demonstrative?.description}</div>

        <div style={styles.pronounSubSection}>
          <div style={styles.pronounSubTitle}>
            {pronounsData.demonstrative.near.label}
          </div>
          {renderPronounTable(pronounsData.demonstrative.near.pronouns, demoColumns)}
        </div>

        <div style={styles.pronounSubSection}>
          <div style={styles.pronounSubTitle}>
            {pronounsData.demonstrative.far.label}
          </div>
          {renderPronounTable(pronounsData.demonstrative.far.pronouns, demoColumns)}
        </div>

        {pronounsData.demonstrative.notes && (
          <ul style={styles.notesList}>
            {pronounsData.demonstrative.notes.map((note, i) => (
              <li key={i} style={styles.noteItem}>{note}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Relative pronouns */}
      <div style={styles.pronounSection}>
        <div style={styles.pronounSectionTitle}>Relativpronomen</div>
        <div style={styles.pronounDescription}>{pronounsData.relative.description}</div>
        {renderPronounTable(pronounsData.relative.pronouns, relativeColumns)}

        {pronounsData.relative.notes && (
          <ul style={styles.notesList}>
            {pronounsData.relative.notes.map((note, i) => (
              <li key={i} style={styles.noteItem}>{note}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/* ---------- Rektion Tab ---------- */

const REKTION_CATEGORIES = [
  {
    id: 'jarr',
    title: 'حروف الجر — Jarr-Partikeln → Genitiv',
    description: 'Diese Präpositionen setzen das folgende Nomen in den Genitiv (مجرور).',
    color: '#2196f3',
    items: [
      { arabic: 'مِنْ', translit: 'min', german: 'von/aus', quranRef: '2:127', quranArabic: 'رَبَّنَا تَقَبَّلْ مِنَّا' },
      { arabic: 'إِلَى', translit: 'ilā', german: 'zu/hin', quranRef: '17:1', quranArabic: 'مِنَ الْمَسْجِدِ الْحَرَامِ إِلَى الْمَسْجِدِ الْأَقْصَى' },
      { arabic: 'عَنْ', translit: 'ʿan', german: 'von/weg/über', quranRef: '53:3', quranArabic: 'وَمَا يَنْطِقُ عَنِ الْهَوَىٰ' },
      { arabic: 'عَلَى', translit: 'ʿalā', german: 'auf/über', quranRef: '2:5', quranArabic: 'أُولَٰئِكَ عَلَىٰ هُدًى مِنْ رَبِّهِمْ' },
      { arabic: 'فِي', translit: 'fī', german: 'in', quranRef: '2:10', quranArabic: 'فِي قُلُوبِهِمْ مَرَضٌ' },
      { arabic: 'بِ', translit: 'bi', german: 'mit/durch', quranRef: '1:1', quranArabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' },
      { arabic: 'لِ', translit: 'li', german: 'für/zu', quranRef: '1:2', quranArabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ' },
      { arabic: 'كَ', translit: 'ka', german: 'wie', quranRef: '2:74', quranArabic: 'فَهِيَ كَالْحِجَارَةِ' },
    ]
  },
  {
    id: 'inna',
    title: 'إنّ وأخواتها — Inna und Schwestern → Akkusativ des Subjekts',
    description: 'Diese Partikeln setzen das Mubtada\u02BB in den Akkusativ. Das Khabar bleibt im Nominativ.',
    color: '#ff5722',
    items: [
      { arabic: 'إِنَّ', translit: 'inna', german: 'wahrlich/gewiss', quranRef: '2:6', quranArabic: 'إِنَّ الَّذِينَ كَفَرُوا' },
      { arabic: 'أَنَّ', translit: 'anna', german: 'dass', quranRef: '2:26', quranArabic: 'إِنَّ اللَّهَ لَا يَسْتَحْيِي أَنْ يَضْرِبَ' },
      { arabic: 'كَأَنَّ', translit: 'ka-anna', german: 'als ob', quranRef: '7:149', quranArabic: 'كَأَنَّهُمْ لَمْ يَعْبُدُوهُ' },
      { arabic: 'لٰكِنَّ', translit: 'lākinna', german: 'aber/jedoch', quranRef: '2:12', quranArabic: 'أَلَا إِنَّهُمْ هُمُ الْمُفْسِدُونَ وَلٰكِنْ لَا يَشْعُرُونَ' },
      { arabic: 'لَيْتَ', translit: 'layta', german: 'wäre doch (Wunsch)', quranRef: '4:73', quranArabic: 'يَا لَيْتَنِي كُنْتُ مَعَهُمْ' },
      { arabic: 'لَعَلَّ', translit: 'laʿalla', german: 'vielleicht/möglicherweise', quranRef: '2:21', quranArabic: 'لَعَلَّكُمْ تَتَّقُونَ' },
    ]
  },
  {
    id: 'kana',
    title: 'كان وأخواتها — Kana und Schwestern → Akkusativ des Prädikats',
    description: 'Diese Verben setzen das Khabar (Prädikat) in den Akkusativ. Das Ism (Subjekt) bleibt im Nominativ.',
    color: '#795548',
    items: [
      { arabic: 'كَانَ', translit: 'kāna', german: 'war/sein', quranRef: '2:143', quranArabic: 'وَمَا كَانَ اللَّهُ لِيُضِيعَ إِيمَانَكُمْ' },
      { arabic: 'ظَلَّ', translit: 'ẓalla', german: 'bleiben/werden', quranRef: '16:58', quranArabic: 'ظَلَّ وَجْهُهُ مُسْوَدًّا' },
      { arabic: 'أَصْبَحَ', translit: 'aṣbaḥa', german: 'morgens werden/sein', quranRef: '18:42', quranArabic: 'فَأَصْبَحَ يُقَلِّبُ كَفَّيْهِ' },
      { arabic: 'لَيْسَ', translit: 'laysa', german: 'nicht sein', quranRef: '2:177', quranArabic: 'لَيْسَ الْبِرَّ أَنْ تُوَلُّوا وُجُوهَكُمْ' },
      { arabic: 'مَا فَتِئَ', translit: 'mā fatiʾa', german: 'nicht aufhören', quranRef: '12:85', quranArabic: 'تَاللَّهِ تَفْتَأُ تَذْكُرُ يُوسُفَ' },
      { arabic: 'مَا دَامَ', translit: 'mā dāma', german: 'solange', quranRef: '19:31', quranArabic: 'مَا دُمْتُ حَيًّا' },
    ]
  },
  {
    id: 'nasb',
    title: 'حروف النصب — Nasb-Partikeln → Subjunktiv des Verbs',
    description: 'Diese Partikeln setzen das folgende Imperfektverb in den Subjunktiv (منصوب → Fatha statt Damma).',
    color: '#ff9800',
    items: [
      { arabic: 'أَنْ', translit: 'an', german: 'dass/zu', quranRef: '2:26', quranArabic: 'لَا يَسْتَحْيِي أَنْ يَضْرِبَ مَثَلًا' },
      { arabic: 'لَنْ', translit: 'lan', german: 'wird niemals', quranRef: '2:55', quranArabic: 'لَنْ نُؤْمِنَ لَكَ' },
      { arabic: 'كَيْ', translit: 'kay', german: 'damit', quranRef: '3:153', quranArabic: 'لِكَيْلَا تَحْزَنُوا' },
      { arabic: 'لِ', translit: 'li (Lam at-Taʿlīl)', german: 'um zu (Zweck)', quranRef: '48:2', quranArabic: 'لِيَغْفِرَ لَكَ اللَّهُ' },
      { arabic: 'حَتَّى', translit: 'ḥattā', german: 'bis/damit', quranRef: '2:55', quranArabic: 'حَتَّىٰ نَرَى اللَّهَ جَهْرَةً' },
      { arabic: 'فَ', translit: 'fa (Sababiyya)', german: 'so dass (Folge)', quranRef: '6:35', quranArabic: 'فَتَأْتِيَهُمْ بِآيَةٍ' },
    ]
  },
  {
    id: 'jazm',
    title: 'حروف الجزم — Jazm-Partikeln → Jussiv des Verbs',
    description: 'Diese Partikeln setzen das Imperfektverb in den Jussiv (مجزوم → Sukun statt Damma).',
    color: '#4caf50',
    items: [
      { arabic: 'لَمْ', translit: 'lam', german: 'nicht (Vergangenheit)', quranRef: '112:3', quranArabic: 'لَمْ يَلِدْ وَلَمْ يُولَدْ' },
      { arabic: 'لَمَّا', translit: 'lammā', german: 'noch nicht', quranRef: '3:142', quranArabic: 'وَلَمَّا يَعْلَمِ اللَّهُ' },
      { arabic: 'لَا (الناهية)', translit: 'lā (Nahiya)', german: 'nicht! (Verbot)', quranRef: '2:286', quranArabic: 'رَبَّنَا لَا تُؤَاخِذْنَا' },
      { arabic: 'لِ (الأمر)', translit: 'li (Amr)', german: 'soll/möge', quranRef: '65:7', quranArabic: 'لِيُنْفِقْ ذُو سَعَةٍ مِنْ سَعَتِهِ' },
      { arabic: 'إِنْ', translit: 'in', german: 'wenn (Bedingung)', quranRef: '3:139', quranArabic: 'إِنْ تَكُونُوا تَأْلَمُونَ' },
      { arabic: 'مَنْ', translit: 'man', german: 'wer (Bedingung)', quranRef: '2:97', quranArabic: 'مَنْ كَانَ عَدُوًّا لِجِبْرِيلَ' },
    ]
  },
  {
    id: 'la_nafy',
    title: 'لا النافية للجنس — Gattungsnegation → Akkusativ ohne Tanwin',
    description: 'لا + unbestimmtes Nomen → Akkusativ OHNE Tanwin. Negiert die gesamte Gattung.',
    color: '#e91e63',
    items: [
      { arabic: 'لَا إِلٰهَ إِلَّا اللَّهُ', translit: 'lā ilāha illā llāhu', german: 'Kein Gott außer Gott', quranRef: '47:19', quranArabic: 'فَاعْلَمْ أَنَّهُ لَا إِلٰهَ إِلَّا اللَّهُ' },
      { arabic: 'لَا رَيْبَ فِيهِ', translit: 'lā rayba fīhi', german: 'Kein Zweifel darin', quranRef: '2:2', quranArabic: 'ذٰلِكَ الْكِتَابُ لَا رَيْبَ فِيهِ' },
    ]
  }
]

function RektionTab() {
  const [openSections, setOpenSections] = useState({})
  const [search, setSearch] = useState('')

  const toggleSection = (id) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return REKTION_CATEGORIES
    const q = search.toLowerCase()
    return REKTION_CATEGORIES.map(cat => ({
      ...cat,
      items: cat.items.filter(item =>
        item.arabic.includes(search) ||
        item.translit.toLowerCase().includes(q) ||
        item.german.toLowerCase().includes(q)
      )
    })).filter(cat => cat.items.length > 0)
  }, [search])

  return (
    <div style={{ padding: '8px 0' }}>
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Suche (arabisch, deutsch, Transliteration)..."
        style={{
          width: '100%', padding: '8px 12px', marginBottom: '12px',
          background: 'var(--bg-secondary)', color: 'var(--text-primary)',
          border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.85rem',
        }}
      />
      {filteredCategories.map(cat => {
        const isOpen = openSections[cat.id] !== false
        return (
          <div key={cat.id} style={{ marginBottom: '8px', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
            <button
              onClick={() => toggleSection(cat.id)}
              style={{
                width: '100%', padding: '10px 14px', textAlign: 'left', cursor: 'pointer',
                background: 'var(--bg-secondary)', border: 'none', borderLeft: `3px solid ${cat.color}`,
                color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <span>{cat.title}</span>
              <span style={{ fontSize: '0.7rem' }}>{isOpen ? '\u25B2' : '\u25BC'}</span>
            </button>
            {isOpen && (
              <div style={{ padding: '8px 14px', background: 'var(--bg-primary)' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>{cat.description}</p>
                {cat.items.map((item, i) => (
                  <div key={i} style={{ padding: '6px 0', borderBottom: i < cat.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                      <span style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.2rem', direction: 'rtl', color: cat.color, fontWeight: 700 }}>{item.arabic}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.translit}</span>
                      <span style={{ fontSize: '0.8rem' }}>— {item.german}</span>
                    </div>
                    {item.quranArabic && (
                      <div style={{ marginTop: '2px', paddingLeft: '12px', borderLeft: `2px solid ${cat.color}`, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <span style={{ fontFamily: 'var(--font-arabic)', direction: 'rtl', fontSize: '0.95rem' }}>{item.quranArabic}</span>
                        <span style={{ marginLeft: '8px' }}>({item.quranRef})</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function VerbRektionTab() {
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    if (!verbRectionData?.verbs) return []
    if (!search.trim()) return verbRectionData.verbs
    const q = search.toLowerCase()
    return verbRectionData.verbs.filter(v =>
      v.verb.includes(search) ||
      v.root.includes(search) ||
      v.rections.some(r => r.meaning.toLowerCase().includes(q))
    )
  }, [search])

  return (
    <div style={{ padding: '8px 0' }}>
      <input type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Verb, Wurzel oder Bedeutung..."
        style={{ width: '100%', padding: '8px 12px', marginBottom: '12px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.85rem' }} />
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>{filtered.length} Verben</p>
      {filtered.slice(0, 40).map((v, i) => (
        <details key={i} style={{ marginBottom: '6px', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
          <summary style={{ padding: '8px 12px', cursor: 'pointer', background: 'var(--bg-secondary)', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.1rem', color: 'var(--accent-teal)' }}>{v.verb}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({v.root}) Form {v.form}</span>
          </summary>
          <div style={{ padding: '8px 12px', background: 'var(--bg-primary)' }}>
            {v.rections.map((r, j) => (
              <div key={j} style={{ padding: '4px 0', borderBottom: j < v.rections.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 600, color: 'var(--accent-gold)', minWidth: '30px' }}>{r.prep === '\u2014' ? '\u2014' : r.prep}</span>
                  <span style={{ fontSize: '0.85rem' }}>{r.meaning}</span>
                </div>
                {r.example && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '36px', marginTop: '2px' }}>
                    <span style={{ fontFamily: 'var(--font-arabic)', direction: 'rtl' }}>{r.example}</span>
                    {r.ref && <span style={{ marginLeft: '8px', color: 'var(--text-muted)' }}>({r.ref})</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </details>
      ))}
    </div>
  )
}

function GlossarTab() {
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const filtered = useMemo(() => {
    if (!glossaryData?.terms) return []
    let terms = glossaryData.terms
    if (filterCat !== 'all') terms = terms.filter(t => t.category === filterCat)
    if (search.trim()) {
      const q = search.toLowerCase()
      terms = terms.filter(t =>
        t.arabic.includes(search) ||
        t.transliteration.toLowerCase().includes(q) ||
        t.german.toLowerCase().includes(q)
      )
    }
    return terms
  }, [search, filterCat])

  const categories = [
    { id: 'all', label: 'Alle' },
    { id: 'syntax', label: 'Syntax' },
    { id: 'morphology', label: 'Morphologie' },
    { id: 'phonology', label: 'Phonologie' },
    { id: 'script', label: 'Schrift' },
  ]

  return (
    <div style={{ padding: '8px 0' }}>
      <input type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Begriff suchen..."
        style={{ width: '100%', padding: '8px 12px', marginBottom: '8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.85rem' }} />
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {categories.map(c => (
          <button key={c.id} onClick={() => setFilterCat(c.id)} style={{
            padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer',
            background: filterCat === c.id ? 'var(--accent-teal-bg)' : 'var(--bg-input)',
            border: filterCat === c.id ? '1px solid var(--accent-teal)' : '1px solid var(--border)',
            color: filterCat === c.id ? 'var(--accent-teal)' : 'var(--text-secondary)',
          }}>{c.label}</button>
        ))}
      </div>
      {filtered.map((t, i) => (
        <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
            <span style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.1rem', color: 'var(--accent-gold)' }}>{t.arabic}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.transliteration}</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t.german}</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{t.definition}</p>
          {t.lesson && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Lektion {t.lesson}</span>}
        </div>
      ))}
    </div>
  )
}

/* ---------- Main component ---------- */

export default function GrammarSidebar({ visible, onClose, standalone }) {
  const [activeTab, setActiveTab] = useState('konjugation')
  const panelRef = useRef(null)

  useEffect(() => {
    if (!visible || standalone) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [visible, onClose, standalone])

  useEffect(() => {
    if (standalone) return
    if (visible) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [visible, standalone])

  if (!visible && !standalone) return null

  const renderTabContent = () => {
    switch (activeTab) {
      case 'konjugation':
        return <KonjugationTab />
      case 'kasus':
        return <KasusTab />
      case 'partikeln':
        return <PartikelnTab />
      case 'rektion':
        return <RektionTab />
      case 'pronomen':
        return <PronomenTab />
      case 'verb_rektion':
        return <VerbRektionTab />
      case 'glossar':
        return <GlossarTab />
      default:
        return null
    }
  }

  if (standalone) {
    return (
      <div>
        <div style={styles.tabBar} role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              aria-controls={`tabpanel-${tab.key}`}
              style={styles.tab(activeTab === tab.key)}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div
          style={styles.content}
          id={`tabpanel-${activeTab}`}
          role="tabpanel"
          aria-label={TABS.find((t) => t.key === activeTab)?.label}
        >
          {renderTabContent()}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Overlay */}
      <div
        style={styles.overlay}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        ref={panelRef}
        style={{
          ...styles.panel,
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
        }}
        role="dialog"
        aria-label="Grammatik-Referenz"
        aria-modal="true"
      >
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Grammatik-Referenz</h2>
          <button
            style={styles.closeBtn}
            onClick={onClose}
            aria-label="Seitenleiste schließen"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
          >
            &#x2715;
          </button>
        </div>

        {/* Tabs */}
        <div style={styles.tabBar} role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              aria-controls={`tabpanel-${tab.key}`}
              style={styles.tab(activeTab === tab.key)}
              onClick={() => setActiveTab(tab.key)}
              onMouseEnter={(e) => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div
          style={styles.content}
          id={`tabpanel-${activeTab}`}
          role="tabpanel"
          aria-label={TABS.find((t) => t.key === activeTab)?.label}
        >
          {renderTabContent()}
        </div>
      </aside>
    </>
  )
}
