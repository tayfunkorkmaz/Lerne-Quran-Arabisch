import { useState, useMemo } from 'react'
import morphologyDB from '../data/quran-morphology-db.json'
import suraIndex from '../data/sura-index.json'
import ambiguitiesData from '../data/ambiguities.json'

// ─────────────────────────────────────────────────────────────────────────────
// Module-level indices — built once when this chunk is first loaded
// ─────────────────────────────────────────────────────────────────────────────

const WORDS_BY_VERSE = {} // "S:V" → word[] sorted by token position
const WORD_BY_LOC    = {} // "S:V:W" → word object

for (const w of morphologyDB.words) {
  WORD_BY_LOC[w.l] = w
  const colon = w.l.lastIndexOf(':')
  const verseKey = w.l.slice(0, colon)
  if (!WORDS_BY_VERSE[verseKey]) WORDS_BY_VERSE[verseKey] = []
  WORDS_BY_VERSE[verseKey].push(w)
}
for (const arr of Object.values(WORDS_BY_VERSE)) {
  arr.sort((a, b) => {
    const wa = parseInt(a.l.split(':')[2], 10)
    const wb = parseInt(b.l.split(':')[2], 10)
    return wa - wb
  })
}

const AMBIG_BY_LOC = {} // "S:V:W" → ambiguity entry
for (const e of (ambiguitiesData.entries || [])) {
  if (e.location) AMBIG_BY_LOC[e.location] = e
}

const SURAHS = suraIndex.surahs || []

// ─────────────────────────────────────────────────────────────────────────────
// POS labels (German) — full QAC tag set
// ─────────────────────────────────────────────────────────────────────────────

const POS_DE = {
  N:    'Substantiv',
  PN:   'Eigenname',
  V:    'Verb',
  ADJ:  'Adjektiv',
  ADV:  'Adverb',
  P:    'Präposition',
  CONJ: 'Konjunktion',
  INTG: 'Fragewort',
  INT:  'Fragewort',
  NEG:  'Negationspartikel',
  DET:  'Artikel (ال)',
  COND: 'Konditionalkonstituente',
  VOC:  'Vokativpartikel (يا)',
  ACC:  'Akkusativpartikel',
  RES:  'Ausnahmepartikel (إلا)',
  ANS:  'Antwortpartikel',
  FUT:  'Futurpartikel (س/سوف)',
  PCL:  'Partikel',
  REL:  'Relativpronomen',
  PRON: 'Pronomen',
  SUB:  'Subjunktion',
  INL:  'Isolierte Buchstaben',
  DEM:  'Demonstrativpronomen',
  SUP:  'Partikel',
  CERT: 'Gewissheitspartikel',
  INC:  'Ingressivpartikel',
  EXP:  'Erläuterungspartikel',
  EXL:  'Ausrufepartikel',
  RET:  'Rücknahmepartikel',
  PREV: 'Präventivpartikel',
  AMD:  'Korrekturpartikel',
  SUR:  'Überraschungspartikel',
  COM:  'Komitativpartikel',
  AVR:  'Abwendungspartikel',
  EMPH: 'Emphase',
}

// ─────────────────────────────────────────────────────────────────────────────
// Morphology decoder
// ─────────────────────────────────────────────────────────────────────────────

function decodePersonGenderNumber(code) {
  // e.g. "3MS" → "3. P. mask. Sg."
  const m = code.match(/^([123])([MF]?)([SPD])$/)
  if (!m) return null
  const [, person, gender, number] = m
  const p = { '1': '1.', '2': '2.', '3': '3.' }[person]
  const g = { M: 'mask.', F: 'fem.', '': '' }[gender]
  const n = { S: 'Sg.', P: 'Pl.', D: 'Du.' }[number]
  return [p, 'P.', g, n].filter(Boolean).join(' ')
}

function decodeMorphology(pos, m) {
  if (!m && !pos) return []
  const features = (m || '').split('|').map(f => f.trim()).filter(Boolean)
  const result = []

  // Verb form in parentheses, e.g. "(IV)"
  const formMatch = (m || '').match(/\(([IVX]+)\)/)
  if (formMatch) result.push({ label: 'Verbform', value: `Form ${formMatch[1]}` })

  // Tense / aspect
  if (features.includes('PERF')) result.push({ label: 'Aspekt', value: 'Perfekt' })
  else if (features.includes('IMPF')) result.push({ label: 'Aspekt', value: 'Imperfekt' })
  else if (features.includes('IMPV')) result.push({ label: 'Modus', value: 'Imperativ' })

  // Voice
  if (features.includes('ACT') && !features.includes('PCPL')) result.push({ label: 'Genus verbi', value: 'Aktiv' })
  if (features.includes('PASS') && !features.includes('PCPL')) result.push({ label: 'Genus verbi', value: 'Passiv' })

  // Mood (imperfect)
  if (features.includes('IND'))  result.push({ label: 'Modus', value: 'Indikativ' })
  if (features.includes('SUBJ')) result.push({ label: 'Modus', value: 'Subjunktiv' })
  if (features.includes('JUS'))  result.push({ label: 'Modus', value: 'Jussiv' })

  // Person/gender/number for verbs
  const pgnCode = features.find(f => /^[123][MF]?[SPD]$/.test(f))
  if (pgnCode) {
    const label = decodePersonGenderNumber(pgnCode)
    if (label) result.push({ label: 'P./Gen./Num.', value: label })
  }

  // Case for nominals
  if (features.includes('NOM')) result.push({ label: 'Kasus', value: 'Nominativ (Marfūʿ)' })
  else if (features.includes('ACC')) result.push({ label: 'Kasus', value: 'Akkusativ (Manṣūb)' })
  else if (features.includes('GEN')) result.push({ label: 'Kasus', value: 'Genitiv (Majrūr)' })

  // Number for nominals (no PGN)
  if (!pgnCode) {
    if (features.includes('SG')) result.push({ label: 'Numerus', value: 'Singular' })
    else if (features.includes('DU')) result.push({ label: 'Numerus', value: 'Dual' })
    else if (features.includes('PL')) result.push({ label: 'Numerus', value: 'Plural' })
    if (features.includes('M')) result.push({ label: 'Genus', value: 'Maskulinum' })
    else if (features.includes('F')) result.push({ label: 'Genus', value: 'Femininum' })
  }

  // Definiteness
  if (features.includes('DEF'))   result.push({ label: 'Definitheit', value: 'Definit' })
  if (features.includes('INDEF')) result.push({ label: 'Definitheit', value: 'Indefinit' })

  // Special nominal types
  if (features.includes('PCPL')) {
    const voice = features.includes('PASS') ? 'Passiv' : 'Aktiv'
    result.push({ label: 'Typ', value: `Partizip (${voice})` })
  }
  if (features.includes('VN')) result.push({ label: 'Typ', value: 'Verbalsubstantiv (Maṣdar)' })

  // Possessive suffix
  if (features.includes('POSS')) result.push({ label: 'Affix', value: 'Possessivsuffix' })

  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// Style helpers
// ─────────────────────────────────────────────────────────────────────────────

const S = {
  page: {
    maxWidth: 960,
    margin: '0 auto',
    padding: '24px 16px',
  },
  heading: {
    fontSize: '1.4rem',
    fontWeight: 700,
    marginBottom: 4,
    color: 'var(--text-primary)',
  },
  subheading: {
    color: 'var(--text-secondary)',
    fontSize: '0.88rem',
    marginBottom: 24,
  },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
  },
  label: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 4,
  },
  select: {
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '7px 10px',
    fontSize: '0.9rem',
  },
  btn: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: '7px 12px',
    cursor: 'pointer',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    lineHeight: 1,
  },
  numInput: {
    width: 64,
    textAlign: 'center',
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '7px 8px',
    fontSize: '0.9rem',
  },
  chip: (selected, hasAmbig) => ({
    display: 'inline-block',
    margin: '4px 3px',
    padding: '4px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: '1.6rem',
    fontFamily: 'var(--font-arabic, "Scheherazade New", serif)',
    lineHeight: 1.8,
    background: selected
      ? 'var(--accent)'
      : hasAmbig
        ? 'rgba(255,195,0,0.1)'
        : 'var(--bg-main)',
    color: selected ? '#fff' : 'var(--text-primary)',
    outline: hasAmbig && !selected ? '1px solid rgba(255,195,0,0.45)' : 'none',
    transition: 'background 0.12s, color 0.12s',
    userSelect: 'none',
  }),
  featureCell: {
    background: 'var(--bg-main)',
    borderRadius: 8,
    padding: '10px 14px',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function VerseBrowser() {
  const [surah, setSurah]           = useState(1)
  const [verse, setVerse]           = useState(1)
  const [selectedLoc, setSelectedLoc] = useState(null)

  // Derived
  const surahMeta  = useMemo(() => SURAHS.find(s => s.number === surah), [surah])
  const verseCount = surahMeta?.verseCount || 1
  const words      = useMemo(() => WORDS_BY_VERSE[`${surah}:${verse}`] || [], [surah, verse])
  const selectedWord = selectedLoc ? WORD_BY_LOC[selectedLoc] : null
  const ambiguity    = selectedLoc ? AMBIG_BY_LOC[selectedLoc] : null
  const morphFeatures = useMemo(
    () => selectedWord ? decodeMorphology(selectedWord.p, selectedWord.m) : [],
    [selectedWord]
  )

  function handleSurahChange(e) {
    setSurah(parseInt(e.target.value, 10))
    setVerse(1)
    setSelectedLoc(null)
  }

  function stepVerse(delta) {
    const next = Math.max(1, Math.min(verseCount, verse + delta))
    if (next !== verse) { setVerse(next); setSelectedLoc(null) }
  }

  function handleVerseInput(e) {
    const n = parseInt(e.target.value, 10)
    if (!isNaN(n) && n >= 1 && n <= verseCount) { setVerse(n); setSelectedLoc(null) }
  }

  function toggleWord(loc) {
    setSelectedLoc(prev => prev === loc ? null : loc)
  }

  // Count ambiguous tokens in this verse
  const ambigCount = words.filter(w => AMBIG_BY_LOC[w.l]).length

  return (
    <div style={S.page}>

      {/* ── Header ── */}
      <h2 style={S.heading}>Vers-Analyse</h2>
      <p style={S.subheading}>
        Morphologische Analyse jedes Tokens — Wort anklicken für Details.
        {ambigCount > 0 && (
          <span style={{ marginLeft: 10, color: 'rgba(255,195,0,0.85)', fontWeight: 600 }}>
            {ambigCount} Rasm-Ambiguität{ambigCount > 1 ? 'en' : ''} in diesem Vers
          </span>
        )}
      </p>

      {/* ── Selector bar ── */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 20 }}>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={S.label}>Sure</span>
          <select value={surah} onChange={handleSurahChange} style={{ ...S.select, minWidth: 240 }}>
            {SURAHS.map(s => (
              <option key={s.number} value={s.number}>
                Sure {s.number}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={S.label}>Vers (1 – {verseCount})</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={() => stepVerse(-1)} disabled={verse <= 1} style={S.btn}>‹</button>
            <input
              type="number" min={1} max={verseCount} value={verse}
              onChange={handleVerseInput}
              style={S.numInput}
            />
            <button onClick={() => stepVerse(1)} disabled={verse >= verseCount} style={S.btn}>›</button>
          </div>
        </label>

        <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)', paddingBottom: 6 }}>
          {words.length} Token{words.length !== 1 ? 's' : ''} · {surah}:{verse}
        </div>
      </div>

      {/* ── Verse reference bar ── */}
      <div style={{
        ...S.card,
        padding: '6px 16px',
        marginBottom: 12,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.82rem',
        color: 'var(--text-secondary)',
      }}>
        <span>Sure {surah}, Vers {verse}</span>
        <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.85rem' }}>
          {surah}:{verse}
        </span>
      </div>

      {/* ── Token display ── */}
      <div style={{
        ...S.card,
        padding: '16px 20px',
        marginBottom: 16,
        direction: 'rtl',
        textAlign: 'right',
        minHeight: 80,
        lineHeight: 2.2,
      }}>
        {words.length === 0 ? (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem', direction: 'ltr' }}>
            Keine Daten für {surah}:{verse}
          </span>
        ) : (
          words.map((w) => {
            const isSelected = selectedLoc === w.l
            const hasAmbig   = !!AMBIG_BY_LOC[w.l]
            return (
              <span
                key={w.l}
                onClick={() => toggleWord(w.l)}
                style={S.chip(isSelected, hasAmbig)}
                title={hasAmbig ? 'Rasm-Ambiguität bekannt' : undefined}
              >
                {w.v || w.c}
              </span>
            )
          })
        )}
      </div>

      {/* ── Analysis panel ── */}
      {selectedWord ? (
        <div style={{ ...S.card, padding: '20px 24px' }}>

          {/* Word header row */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
            <span dir="rtl" style={{ fontFamily: 'var(--font-arabic, serif)', fontSize: '2.4rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
              {selectedWord.v || selectedWord.c}
            </span>
            {selectedWord.c && selectedWord.v && (
              <span dir="rtl" style={{ fontFamily: 'var(--font-arabic, serif)', fontSize: '1.3rem', color: 'var(--text-secondary)' }}>
                ← {selectedWord.c}
              </span>
            )}
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto', fontFamily: 'monospace' }}>
              {selectedLoc}
            </span>
          </div>

          {/* Feature grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 16 }}>

            {/* Root */}
            {selectedWord.r && (
              <div style={S.featureCell}>
                <div style={S.label}>Wurzel</div>
                <div dir="rtl" style={{ fontFamily: 'var(--font-arabic, serif)', fontSize: '1.2rem', color: 'var(--text-primary)', letterSpacing: '0.1em' }}>
                  {selectedWord.r.split(' ').join(' · ')}
                </div>
              </div>
            )}

            {/* POS */}
            {selectedWord.p && (
              <div style={S.featureCell}>
                <div style={S.label}>Wortart</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {POS_DE[selectedWord.p] || selectedWord.p}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>
                  {selectedWord.p}
                </div>
              </div>
            )}

            {/* Decoded morphological features */}
            {morphFeatures.map((f, i) => (
              <div key={i} style={S.featureCell}>
                <div style={S.label}>{f.label}</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {f.value}
                </div>
              </div>
            ))}

          </div>

          {/* Raw morphology string */}
          {(selectedWord.m || selectedWord.p) && (
            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontFamily: 'monospace', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              QAC-Tags: {[selectedWord.p, selectedWord.m].filter(Boolean).join('|')}
            </div>
          )}

          {/* Ambiguity panel */}
          {ambiguity && (
            <div style={{
              marginTop: 16,
              padding: '14px 16px',
              background: 'rgba(255,195,0,0.07)',
              border: '1px solid rgba(255,195,0,0.35)',
              borderRadius: 8,
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Rasm-Ambiguität · {ambiguity.category}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
                Konsonantengerüst: <span dir="rtl" style={{ fontFamily: 'var(--font-arabic, serif)', fontSize: '1rem', color: 'var(--text-primary)' }}>{ambiguity.consonants}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(ambiguity.options || []).map((opt, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 10, alignItems: 'baseline',
                    padding: '8px 10px',
                    background: 'var(--bg-card)',
                    borderRadius: 6,
                    flexWrap: 'wrap',
                  }}>
                    <span dir="rtl" style={{ fontFamily: 'var(--font-arabic, serif)', fontSize: '1.15rem', minWidth: 70, color: 'var(--text-primary)' }}>
                      {opt.vocalized}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', flex: 1 }}>
                      {opt.root && <span style={{ marginRight: 8 }}>Wurzel {opt.root}</span>}
                      {opt.form && <span style={{ marginRight: 8 }}>· {opt.form}</span>}
                      {opt.meaning_de && <span style={{ color: 'var(--text-primary)' }}>— {opt.meaning_de}</span>}
                    </span>
                  </div>
                ))}
              </div>
              {ambiguity._note && (
                <div style={{ marginTop: 8, fontSize: '0.73rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {ambiguity._note}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        words.length > 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem', padding: '20px 0' }}>
            Token anklicken für morphologische Analyse
          </div>
        )
      )}

    </div>
  )
}
