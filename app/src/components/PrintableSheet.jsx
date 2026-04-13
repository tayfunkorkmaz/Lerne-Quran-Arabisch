import { useState, useCallback, useRef } from 'react'
import morphologyTables from '../data/morphology-tables.json'
import particles from '../data/particles.json'
import pronouns from '../data/pronouns.json'

import weakVerbTablesData from '../data/weak-verb-tables.json'

const weakVerbTables = weakVerbTablesData

/**
 * PrintableSheet — Druckbare Zusammenfassungen / Cheat-Sheets
 * Generiert druckbare Referenzblätter für Konjugation, Partikeln, Pronomen etc.
 */

const SHEET_TYPES = [
  { id: 'conjugation', title: 'Konjugationstabelle', desc: 'Verbformen I-X mit allen Personen/Genera' },
  { id: 'particles', title: 'Partikelliste', desc: 'Alle 72 Partikeln mit Bedeutung und Funktion' },
  { id: 'pronouns', title: 'Pronomen-Übersicht', desc: 'Unabhängige, angehängte, Demonstrativ-, Relativ- und Fragepronomen' },
  { id: 'noun_patterns', title: 'Nomenmuster', desc: 'Häufige Nomenmuster (Awzan) mit Beispielen' },
  { id: 'case_rules', title: 'Kasusregeln', desc: 'Wann Nominativ, Akkusativ, Genitiv' },
  ...(weakVerbTables ? [{ id: 'weak_verbs', title: 'Schwache Verben', desc: 'Konjugation aller schwachen Verbtypen (hohl, defektiv, assimiliert, verdoppelt, hamziert)' }] : []),
]

const PRINT_STYLE = `
@media print {
  body * { visibility: hidden; }
  .printable-sheet, .printable-sheet * { visibility: visible; }
  .printable-sheet { position: absolute; left: 0; top: 0; width: 100%; }
  .no-print { display: none !important; }
  table { border-collapse: collapse; width: 100%; page-break-inside: auto; }
  th, td { border: 1px solid #ccc; padding: 4px 8px; font-size: 11px; }
  th { background: #f0f0f0; }
  .arabic { font-family: "Scheherazade New", "Amiri", serif; font-size: 14px; }
  h1 { font-size: 16px; margin-bottom: 8px; }
  h2 { font-size: 13px; margin: 12px 0 4px; }
}
`

const PERSON_LABELS = {
  '3ms': '3. Pers. m. Sg.', '3fs': '3. Pers. f. Sg.', '3md': '3. Pers. m. Du.',
  '3fd': '3. Pers. f. Du.', '3mp': '3. Pers. m. Pl.', '3fp': '3. Pers. f. Pl.',
  '2ms': '2. Pers. m. Sg.', '2fs': '2. Pers. f. Sg.', '2md': '2. Pers. Du.',
  '2mp': '2. Pers. m. Pl.', '2fp': '2. Pers. f. Pl.',
  '1s': '1. Pers. Sg.', '1p': '1. Pers. Pl.',
}
const PERSON_ORDER = morphologyTables?.meta?.conjugationPersonOrder ||
  ['3ms','3fs','3md','3fd','3mp','3fp','2ms','2fs','2md','2mp','2fp','1s','1p']

function ConjugationSheet() {
  const forms = morphologyTables?.verbForms || []
  return (
    <div>
      <h1>Konjugationstabellen — Verbformen I-X</h1>
      {forms.map(form => {
        const hasImperative = form.imperative && typeof form.imperative === 'object' && Object.keys(form.imperative).length > 0
        return (
          <div key={form.form} style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
            <h2>Form {form.form}: {form.pattern?.arabic || ''} ({form.formArabic || ''})</h2>
            {form.meaningShiftGerman && <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '4px' }}>{form.meaningShiftGerman}</div>}
            <table>
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Perfekt</th>
                  <th>Imperfekt</th>
                  {hasImperative && <th>Imperativ</th>}
                </tr>
              </thead>
              <tbody>
                {PERSON_ORDER.map(key => (
                  <tr key={key}>
                    <td>{PERSON_LABELS[key] || key}</td>
                    <td className="arabic" dir="rtl">{form.perfect?.[key] || ''}</td>
                    <td className="arabic" dir="rtl">{form.imperfect?.[key] || ''}</td>
                    {hasImperative && (
                      <td className="arabic" dir="rtl">{form.imperative?.[key] || ''}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
              Aktiv-Partizip: <span className="arabic" dir="rtl">{form.activeParticiple?.arabic || '-'}</span>
              {' | '}Passiv-Partizip: <span className="arabic" dir="rtl">{form.passiveParticiple?.arabic || '-'}</span>
              {' | '}Masdar: <span className="arabic" dir="rtl">{form.masdar?.commonPatterns?.[0]?.arabic || form.masdar?.arabic || '-'}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ParticleSheet() {
  const particleList = particles?.particles || []
  return (
    <div>
      <h1>Partikeln des quranischen Arabisch ({particleList.length})</h1>
      <table>
        <thead>
          <tr><th>Arabisch</th><th>Konsonantal</th><th>Transliteration</th><th>Bedeutung</th><th>Funktion</th><th>Kategorie</th></tr>
        </thead>
        <tbody>
          {particleList.map(p => (
            <tr key={p.id}>
              <td className="arabic" dir="rtl">{p.arabic}</td>
              <td className="arabic" dir="rtl">{p.consonantal}</td>
              <td>{p.transliteration}</td>
              <td>{p.german}</td>
              <td>{p.function}</td>
              <td>{p.category}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PronounSheet() {
  const sections = [
    { title: 'Unabhängige Pronomen', data: pronouns?.independent?.pronouns || [] },
    { title: 'Suffix-Pronomen (angehängt)', data: pronouns?.suffix?.pronouns || [] },
    { title: 'Demonstrativpronomen (nah)', data: pronouns?.demonstrative?.near?.pronouns || [] },
    { title: 'Demonstrativpronomen (fern)', data: pronouns?.demonstrative?.far?.pronouns || [] },
    { title: 'Relativpronomen', data: pronouns?.relative?.pronouns || [] },
    { title: 'Fragepronomen', data: pronouns?.interrogative?.pronouns || [] },
  ]
  return (
    <div>
      <h1>Pronomen-Übersicht</h1>
      {sections.map(sec => sec.data.length > 0 && (
        <div key={sec.title} style={{ marginBottom: '16px', pageBreakInside: 'avoid' }}>
          <h2>{sec.title}</h2>
          <table>
            <thead>
              <tr><th>Arabisch</th><th>Transliteration</th><th>Person/Genus/Numerus</th><th>Bedeutung</th></tr>
            </thead>
            <tbody>
              {sec.data.map((p, i) => (
                <tr key={i}>
                  <td className="arabic" dir="rtl">{p.arabic}</td>
                  <td>{p.transliteration}</td>
                  <td>{[p.person, p.gender, p.number].filter(Boolean).join(', ')}</td>
                  <td>{p.german || p.meaning || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

function NounPatternSheet() {
  const patterns = morphologyTables?.nounPatterns || []
  return (
    <div>
      <h1>Nomenmuster (Awzan)</h1>
      <table>
        <thead>
          <tr><th>Muster</th><th>Transliteration</th><th>Typ</th><th>Beispiel</th><th>Bedeutung</th></tr>
        </thead>
        <tbody>
          {patterns.map((p, i) => (
            <tr key={i}>
              <td className="arabic" dir="rtl">{p.pattern || p.arabic}</td>
              <td>{p.transliteration || ''}</td>
              <td>{p.type || p.category || ''}</td>
              <td className="arabic" dir="rtl">{p.example || ''}</td>
              <td>{p.meaning || p.german || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CaseRuleSheet() {
  return (
    <div>
      <h1>Kasusregeln — Nominativ, Akkusativ, Genitiv</h1>
      <h2>Nominativ (Marfu' — Damma)</h2>
      <table>
        <tbody>
          <tr><td><strong>Faʿil</strong></td><td>Subjekt des Verbalsatzes</td><td className="arabic" dir="rtl">كَتَبَ الرَّجُلُ</td></tr>
          <tr><td><strong>Mubtada'</strong></td><td>Thema des Nominalsatzes</td><td className="arabic" dir="rtl">الرَّجُلُ كَاتِبٌ</td></tr>
          <tr><td><strong>Khabar</strong></td><td>Prädikat des Nominalsatzes</td><td className="arabic" dir="rtl">الرَّجُلُ كَاتِبٌ</td></tr>
          <tr><td><strong>Naʿib al-Faʿil</strong></td><td>Stellvertreter-Subjekt (Passiv)</td><td className="arabic" dir="rtl">كُتِبَ الكِتَابُ</td></tr>
          <tr><td><strong>Ism Kana</strong></td><td>Subjekt von kana und Schwestern</td><td className="arabic" dir="rtl">كَانَ الرَّجُلُ</td></tr>
          <tr><td><strong>Khabar Inna</strong></td><td>Prädikat von inna und Schwestern</td><td className="arabic" dir="rtl">إِنَّ الرَّجُلَ كَاتِبٌ</td></tr>
        </tbody>
      </table>
      <h2>Akkusativ (Mansub — Fatha)</h2>
      <table>
        <tbody>
          <tr><td><strong>Mafʿul bihi</strong></td><td>Direktes Objekt</td><td className="arabic" dir="rtl">كَتَبَ الكِتَابَ</td></tr>
          <tr><td><strong>Hal</strong></td><td>Zustandsbestimmung</td><td className="arabic" dir="rtl">جَاءَ رَاكِبًا</td></tr>
          <tr><td><strong>Tamyiz</strong></td><td>Spezifikation</td><td className="arabic" dir="rtl">عِشْرُونَ رَجُلًا</td></tr>
          <tr><td><strong>Mafʿul mutlaq</strong></td><td>Absolutes Objekt</td><td className="arabic" dir="rtl">ضَرَبَ ضَرْبًا</td></tr>
          <tr><td><strong>Mafʿul lahu</strong></td><td>Kausalobjekt</td><td className="arabic" dir="rtl">جَاءَ طَلَبًا لِلْعِلْمِ</td></tr>
          <tr><td><strong>Mafʿul fihi</strong></td><td>Zeitadverb (Ẓarf)</td><td className="arabic" dir="rtl">جَاءَ يَوْمَ الجُمُعَةِ</td></tr>
          <tr><td><strong>Ism Inna</strong></td><td>Subjekt von inna und Schwestern</td><td className="arabic" dir="rtl">إِنَّ الرَّجُلَ</td></tr>
          <tr><td><strong>Khabar Kana</strong></td><td>Prädikat von kana und Schwestern</td><td className="arabic" dir="rtl">كَانَ كَاتِبًا</td></tr>
          <tr><td><strong>Munada</strong></td><td>Angerufener (Vokativ)</td><td className="arabic" dir="rtl">يَا رَجُلًا</td></tr>
          <tr><td><strong>Mustathna</strong></td><td>Ausnahme (mit illa)</td><td className="arabic" dir="rtl">جَاءُوا إِلَّا زَيْدًا</td></tr>
        </tbody>
      </table>
      <h2>Genitiv (Majrur — Kasra)</h2>
      <table>
        <tbody>
          <tr><td><strong>Nach Präposition</strong></td><td>Jedes Nomen nach min, fi, 'ala, ila, bi, li, etc.</td><td className="arabic" dir="rtl">فِي الكِتَابِ</td></tr>
          <tr><td><strong>Mudaf ilayhi</strong></td><td>Zweiter Teil einer Iḍāfa (Genitivverbindung)</td><td className="arabic" dir="rtl">كِتَابُ اللَّهِ</td></tr>
          <tr><td><strong>Tabi'</strong></td><td>Adjektiv/Apposition zu einem Genitiv</td><td className="arabic" dir="rtl">مِنَ الكِتَابِ الكَرِيمِ</td></tr>
        </tbody>
      </table>
      <h2>Diptote Deklination (Mamnu' min as-Sarf)</h2>
      <table>
        <tbody>
          <tr><td>Im Genitiv</td><td>Fatha statt Kasra, kein Tanwin</td><td className="arabic" dir="rtl">مِنْ إِبْرَاهِيمَ</td></tr>
          <tr><td>Mit Artikel</td><td>Wird wieder triptot (Kasra)</td><td className="arabic" dir="rtl">فِي الْمَسَاجِدِ</td></tr>
        </tbody>
      </table>
    </div>
  )
}

function WeakVerbSheet() {
  if (!weakVerbTables) return <p>Keine schwache-Verben-Daten geladen.</p>
  const categories = weakVerbTables.categories || []
  return (
    <div>
      <h1>Schwache Verben — Konjugationstabellen</h1>
      {categories.map(cat => (
        <div key={cat.id}>
          <h2 style={{ marginTop: 16, color: '#333', borderBottom: '1px solid #ccc', paddingBottom: 4 }}>{cat.title}</h2>
          <p style={{ fontSize: 10, color: '#666', marginBottom: 6 }}>{cat.description}</p>
          {(cat.subcategories || []).map(sub => (
            <div key={sub.id} style={{ marginBottom: 12 }}>
              <h3 style={{ fontSize: 12, margin: '8px 0 4px' }}>{sub.title} — <span className="arabic" dir="rtl">{sub.exampleRoot}</span> ({sub.exampleMeaning})</h3>
              <table>
                <thead><tr><th>Person</th><th className="arabic" dir="rtl">Perfekt</th><th className="arabic" dir="rtl">Imperfekt</th>{sub.imperative ? <th className="arabic" dir="rtl">Imperativ</th> : null}</tr></thead>
                <tbody>
                  {['3ms','3fs','3mp','3fp','2ms','2fs','2mp','2fp','1s','1p'].filter(p => sub.perfect?.[p]).map(p => (
                    <tr key={p}>
                      <td>{p}</td>
                      <td className="arabic" dir="rtl">{sub.perfect?.[p]}</td>
                      <td className="arabic" dir="rtl">{sub.imperfect?.[p]}</td>
                      {sub.imperative ? <td className="arabic" dir="rtl">{sub.imperative?.[p] || ''}</td> : null}
                    </tr>
                  ))}
                </tbody>
              </table>
              {sub.activeParticiple && <div style={{ fontSize: 10, marginTop: 2 }}>Akt. Partizip: <span className="arabic" dir="rtl">{sub.activeParticiple}</span> | Pass. Partizip: <span className="arabic" dir="rtl">{sub.passiveParticiple}</span> | Masdar: <span className="arabic" dir="rtl">{sub.masdar}</span></div>}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

const SHEET_COMPONENTS = {
  conjugation: ConjugationSheet,
  particles: ParticleSheet,
  pronouns: PronounSheet,
  noun_patterns: NounPatternSheet,
  case_rules: CaseRuleSheet,
  weak_verbs: WeakVerbSheet,
}

export default function PrintableSheet({ onBack }) {
  const [selectedSheet, setSelectedSheet] = useState(null)
  const printRef = useRef(null)

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  if (!selectedSheet) {
    return (
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        {onBack && (
          <button onClick={onBack} style={{
            background: 'none', border: 'none', color: 'var(--text-secondary)',
            cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: '16px',
          }}>Zurück</button>
        )}
        <h2 style={{ marginBottom: '8px' }}>Druckbare Referenzblätter</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
          Wähle ein Referenzblatt zum Anzeigen und Drucken.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {SHEET_TYPES.map(s => (
            <button key={s.id} onClick={() => setSelectedSheet(s.id)} style={{
              padding: '16px 20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer',
              color: 'var(--text-primary)',
            }}>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>{s.title}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.desc}</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const SheetComponent = SHEET_COMPONENTS[selectedSheet]

  return (
    <div>
      <style>{PRINT_STYLE}</style>
      <div className="no-print" style={{
        display: 'flex', gap: '10px', padding: '12px 20px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)', alignItems: 'center',
      }}>
        <button onClick={() => setSelectedSheet(null)} style={{
          padding: '6px 14px', borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-input)', border: '1px solid var(--border)',
          color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.85rem',
        }}>Zurück</button>
        <button onClick={handlePrint} style={{
          padding: '6px 14px', borderRadius: 'var(--radius-sm)',
          background: 'var(--accent-teal)', border: 'none',
          color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
        }}>Drucken</button>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {SHEET_TYPES.find(s => s.id === selectedSheet)?.title}
        </span>
      </div>
      <div ref={printRef} className="printable-sheet" style={{
        padding: '24px', maxWidth: '900px', margin: '0 auto',
        fontFamily: 'var(--font-ui)', fontSize: '0.9rem',
        color: 'var(--text-primary)',
      }}>
        {SheetComponent && <SheetComponent />}
      </div>
    </div>
  )
}
