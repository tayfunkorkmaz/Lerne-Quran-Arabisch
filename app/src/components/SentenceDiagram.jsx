import { useState, useMemo, useCallback } from 'react'

/**
 * SentenceDiagram — Visuelles I'rab-Diagramm
 * Zeigt grammatische Beziehungen in einem Vers als Baumstruktur.
 * Der Lernende kann Wörtern syntaktische Rollen zuweisen.
 */

const SYNTACTIC_ROLES = [
  { id: 'fi3l', label: 'Verb (Fi\'l)', color: 'var(--accent-teal)', case: '-' },
  { id: 'fa3il', label: 'Subjekt (Fa\'il)', color: '#4caf50', case: 'Nominativ' },
  { id: 'mubtada', label: 'Thema (Mubtada\')', color: '#4caf50', case: 'Nominativ' },
  { id: 'khabar', label: 'Prädikat (Khabar)', color: '#8bc34a', case: 'Nominativ' },
  { id: 'maf3ul_bihi', label: 'Objekt (Maf\'ul bihi)', color: '#ff9800', case: 'Akkusativ' },
  { id: 'hal', label: 'Zustand (Hal)', color: '#ff9800', case: 'Akkusativ' },
  { id: 'tamyiz', label: 'Spezifikation (Tamyiz)', color: '#ff9800', case: 'Akkusativ' },
  { id: 'maf3ul_mutlaq', label: 'Absolutes Obj. (Maf\'ul mutlaq)', color: '#ff9800', case: 'Akkusativ' },
  { id: 'zarf', label: 'Zeitadverb (Ẓarf)', color: '#ff9800', case: 'Akkusativ' },
  { id: 'jarr_majrur', label: 'Präposition+Genitiv (Jarr)', color: '#2196f3', case: 'Genitiv' },
  { id: 'mudaf_ilayhi', label: 'Iḍāfa-Genitiv (Mudaf ilayhi)', color: '#2196f3', case: 'Genitiv' },
  { id: 'sifa', label: 'Adjektiv/Attribut (Sifa)', color: '#9c27b0', case: 'folgt Bezugswort' },
  { id: 'badal', label: 'Apposition (Badal)', color: '#9c27b0', case: 'folgt Bezugswort' },
  { id: 'atf', label: 'Koordination (\'Atf)', color: '#9c27b0', case: 'folgt Bezugswort' },
  { id: 'munada', label: 'Vokativ (Munada)', color: '#e91e63', case: 'Akkusativ' },
  { id: 'harf', label: 'Partikel (Harf)', color: 'var(--text-muted)', case: '-' },
  { id: 'damir', label: 'Pronomen (Damir)', color: 'var(--accent-gold)', case: 'kontextabh.' },
  { id: 'na3ib_fa3il', label: 'Passiv-Subjekt (Na\'ib al-Fa\'il)', color: '#4caf50', case: 'Nominativ' },
  { id: 'maf3ul_liajlihi', label: 'Zweckobjekt (Maf\'ul li-Ajlihi)', color: '#ff9800', case: 'Akkusativ' },
  { id: 'maf3ul_maahu', label: 'Begleitobjekt (Maf\'ul Ma\'ahu)', color: '#ff9800', case: 'Akkusativ' },
  { id: 'zarf_zaman', label: 'Zeitadverbiale (Ẓarf Zaman)', color: '#ff9800', case: 'Akkusativ' },
  { id: 'zarf_makan', label: 'Ortsadverbiale (Ẓarf Makan)', color: '#ff9800', case: 'Akkusativ' },
  { id: 'ism_inna', label: 'Subjekt nach Inna (Ism Inna)', color: '#ff5722', case: 'Akkusativ' },
  { id: 'khabar_inna', label: 'Prädikat nach Inna (Khabar Inna)', color: '#ff5722', case: 'Nominativ' },
  { id: 'ism_kana', label: 'Subjekt nach Kana (Ism Kana)', color: '#795548', case: 'Nominativ' },
  { id: 'khabar_kana', label: 'Prädikat nach Kana (Khabar Kana)', color: '#795548', case: 'Akkusativ' },
  { id: 'istithna', label: 'Ausgenommenes (Mustathna)', color: '#ff9800', case: 'Akkusativ' },
]

const ROLE_MAP = Object.fromEntries(SYNTACTIC_ROLES.map(r => [r.id, r]))

const CASE_COLORS = {
  'Nominativ': '#4caf50',
  'Akkusativ': '#ff9800',
  'Genitiv': '#2196f3',
}

// ============================================================================
// Validation Logic
// ============================================================================

function validateAnalysis(assignments, words) {
  const results = [] // { type: 'valid'|'warning'|'info', message: string }
  const roleIds = Object.values(assignments)
  const roleEntries = Object.entries(assignments) // [wordIdx, roleId]

  const hasVerb = roleIds.includes('fi3l')
  const hasFa3il = roleIds.includes('fa3il')
  const hasMubtada = roleIds.includes('mubtada')
  const hasKhabar = roleIds.includes('khabar')
  const hasMaf3ul = roleIds.includes('maf3ul_bihi')
  const hasNa3ibFa3il = roleIds.includes('na3ib_fa3il')

  // 1. Verbal sentence: verb without Faʿil
  if (hasVerb && !hasFa3il && !hasNa3ibFa3il) {
    results.push({
      type: 'warning',
      message: 'Verbalsatz ohne Subjekt (Fa\'il / Na\'ib al-Fa\'il): Ein Verb wurde zugewiesen, aber kein Subjekt.',
    })
  }
  if (hasVerb && hasFa3il) {
    results.push({
      type: 'valid',
      message: 'Verbalsatz: Verb (Fi\'l) und Subjekt (Fa\'il) vorhanden.',
    })
  }

  // 2. Nominal sentence: Mubtada without Khabar or vice versa
  if (hasMubtada && !hasKhabar) {
    results.push({
      type: 'warning',
      message: 'Nominalsatz unvollständig: Mubtada\' ohne Khabar. Ein Nominalsatz benötigt beide.',
    })
  }
  if (hasKhabar && !hasMubtada) {
    results.push({
      type: 'warning',
      message: 'Nominalsatz unvollständig: Khabar ohne Mubtada\'. Ein Nominalsatz benötigt beide.',
    })
  }
  if (hasMubtada && hasKhabar) {
    results.push({
      type: 'valid',
      message: 'Nominalsatz: Mubtada\' und Khabar vorhanden.',
    })
  }

  // 3. Mafʿul bihi requires a verb
  if (hasMaf3ul && !hasVerb) {
    results.push({
      type: 'warning',
      message: 'Maf\'ul bihi ohne Verb: Ein direktes Objekt setzt ein Verb im Satz voraus.',
    })
  }
  if (hasMaf3ul && hasVerb) {
    results.push({
      type: 'valid',
      message: 'Verb mit direktem Objekt (Maf\'ul bihi) korrekt zugewiesen.',
    })
  }

  // 4a. Inna requires Khabar and vice versa
  const hasIsmInna = roleIds.includes('ism_inna')
  const hasKhabarInna = roleIds.includes('khabar_inna')
  if (hasIsmInna && !hasKhabarInna) {
    results.push({ type: 'warning', message: 'Ism Inna ohne Khabar Inna: Nach Inna/Schwestern werden beide benötigt.' })
  }
  if (hasKhabarInna && !hasIsmInna) {
    results.push({ type: 'warning', message: 'Khabar Inna ohne Ism Inna: Das Prädikat nach Inna braucht ein Subjekt.' })
  }
  if (hasIsmInna && hasKhabarInna) {
    results.push({ type: 'valid', message: 'Inna-Satz: Ism Inna (Akkusativ) und Khabar Inna (Nominativ) vorhanden.' })
  }

  // 4b. Kana requires Khabar and vice versa
  const hasIsmKana = roleIds.includes('ism_kana')
  const hasKhabarKana = roleIds.includes('khabar_kana')
  if (hasIsmKana && !hasKhabarKana) {
    results.push({ type: 'warning', message: 'Ism Kana ohne Khabar Kana: Nach Kana/Schwestern werden beide benötigt.' })
  }
  if (hasKhabarKana && !hasIsmKana) {
    results.push({ type: 'warning', message: 'Khabar Kana ohne Ism Kana: Das Prädikat nach Kana braucht ein Subjekt.' })
  }
  if (hasIsmKana && hasKhabarKana) {
    results.push({ type: 'valid', message: 'Kana-Satz: Ism Kana (Nominativ) und Khabar Kana (Akkusativ) vorhanden.' })
  }

  // 4c. Mafʿul Mutlaq requires a verb
  const hasMaf3ulMutlaq = roleIds.includes('maf3ul_mutlaq')
  if (hasMaf3ulMutlaq && !hasVerb) {
    results.push({ type: 'warning', message: 'Maf\'ul Mutlaq ohne Verb: Ein absolutes Objekt setzt ein Verb voraus.' })
  }

  // 4. Sifa adjacency check
  const sifaEntries = roleEntries.filter(([, r]) => r === 'sifa')
  sifaEntries.forEach(([idxStr]) => {
    const idx = parseInt(idxStr)
    const prevIdx = idx - 1
    const prevRole = assignments[prevIdx]
    // In RTL: check if adjacent word has a compatible role (any noun-like role)
    const nounRoles = ['fa3il', 'mubtada', 'khabar', 'maf3ul_bihi', 'mudaf_ilayhi', 'jarr_majrur', 'badal', 'sifa', 'hal', 'tamyiz', 'munada', 'na3ib_fa3il', 'ism_inna', 'khabar_inna', 'ism_kana', 'khabar_kana', 'maf3ul_liajlihi', 'maf3ul_maahu', 'zarf_zaman', 'zarf_makan', 'istithna']
    if (prevRole && nounRoles.includes(prevRole)) {
      results.push({
        type: 'info',
        message: `Sifa (Wort ${idx + 1}: ${words[idx] || ''}) steht neben einem Nomen — Kongruenz prüfen (Genus, Numerus, Definitheit, Kasus).`,
      })
    } else if (!prevRole) {
      results.push({
        type: 'info',
        message: `Sifa (Wort ${idx + 1}: ${words[idx] || ''}) — Bezugswort (davor) hat keine zugewiesene Rolle. Adjazenz nicht prüfbar.`,
      })
    }
  })

  // 5. Mudaf ilayhi must follow a Mudaf (i.e., preceded by a noun that could be Mudaf)
  const mudafIlayhiEntries = roleEntries.filter(([, r]) => r === 'mudaf_ilayhi')
  mudafIlayhiEntries.forEach(([idxStr]) => {
    const idx = parseInt(idxStr)
    const prevIdx = idx - 1
    const prevRole = assignments[prevIdx]
    if (!prevRole) {
      results.push({
        type: 'warning',
        message: `Mudaf ilayhi (Wort ${idx + 1}: ${words[idx] || ''}) ohne vorhergehendes Mudaf. Ein Iḍāfa-Genitiv benötigt ein vorangehendes Bezugsnomen.`,
      })
    } else {
      results.push({
        type: 'valid',
        message: `Mudaf ilayhi (Wort ${idx + 1}) folgt auf ein zugewiesenes Wort — Iḍāfa-Struktur möglich.`,
      })
    }
  })

  // If no specific checks fired, still report
  if (results.length === 0) {
    results.push({
      type: 'info',
      message: 'Keine spezifischen Muster zur Validierung erkannt. Analyse weiter vervollständigen.',
    })
  }

  return results
}

// ============================================================================
// Tree Visualization Builder
// ============================================================================

function buildSyntaxTree(assignments, words) {
  const nodes = [] // top-level groupings
  const used = new Set()

  const entries = Object.entries(assignments).map(([idx, roleId]) => ({
    idx: parseInt(idx),
    roleId,
    word: words[parseInt(idx)] || '',
    role: ROLE_MAP[roleId],
  }))

  // Group: Verb -> Faʿil, Mafʿul bihi, Hal, Tamyiz, Mafʿul mutlaq as children
  const verbs = entries.filter(e => e.roleId === 'fi3l')
  verbs.forEach(verb => {
    used.add(verb.idx)
    const children = []

    // Find Faʿil / Naʿib al-Faʿil
    entries.filter(e => (e.roleId === 'fa3il' || e.roleId === 'na3ib_fa3il') && !used.has(e.idx)).forEach(e => {
      used.add(e.idx)
      children.push(e)
    })

    // Find Mafʿul bihi
    entries.filter(e => e.roleId === 'maf3ul_bihi' && !used.has(e.idx)).forEach(e => {
      used.add(e.idx)
      children.push(e)
    })

    // Find Hal, Tamyiz, Mafʿul mutlaq, Ẓarf
    entries.filter(e => ['hal', 'tamyiz', 'maf3ul_mutlaq', 'zarf'].includes(e.roleId) && !used.has(e.idx)).forEach(e => {
      used.add(e.idx)
      children.push(e)
    })

    nodes.push({ ...verb, children })
  })

  // Group: Mubtada -> Khabar as sibling
  const mubtadas = entries.filter(e => e.roleId === 'mubtada' && !used.has(e.idx))
  mubtadas.forEach(mubtada => {
    used.add(mubtada.idx)
    const siblings = []

    entries.filter(e => e.roleId === 'khabar' && !used.has(e.idx)).forEach(e => {
      used.add(e.idx)
      siblings.push(e)
    })

    nodes.push({ ...mubtada, children: siblings })
  })

  // Group: Preposition -> Majrur
  const jars = entries.filter(e => e.roleId === 'harf' && !used.has(e.idx))
  jars.forEach(jar => {
    // Check if next word is jarr_majrur
    const nextMajrur = entries.find(e => e.roleId === 'jarr_majrur' && e.idx === jar.idx + 1 && !used.has(e.idx))
    if (nextMajrur) {
      used.add(jar.idx)
      used.add(nextMajrur.idx)
      // Also grab mudaf_ilayhi chain
      const majrurChildren = [nextMajrur]
      let checkIdx = nextMajrur.idx + 1
      while (true) {
        const next = entries.find(e => e.idx === checkIdx && e.roleId === 'mudaf_ilayhi' && !used.has(e.idx))
        if (next) {
          used.add(next.idx)
          majrurChildren.push(next)
          checkIdx++
        } else break
      }
      nodes.push({ ...jar, children: majrurChildren })
    }
  })

  // Also group standalone jarr_majrur entries
  entries.filter(e => e.roleId === 'jarr_majrur' && !used.has(e.idx)).forEach(jar => {
    used.add(jar.idx)
    const children = []
    let checkIdx = jar.idx + 1
    while (true) {
      const next = entries.find(e => e.idx === checkIdx && e.roleId === 'mudaf_ilayhi' && !used.has(e.idx))
      if (next) {
        used.add(next.idx)
        children.push(next)
        checkIdx++
      } else break
    }
    nodes.push({ ...jar, children })
  })

  // Remaining unplaced entries
  entries.filter(e => !used.has(e.idx)).forEach(e => {
    used.add(e.idx)
    // Check for mudaf_ilayhi chain
    const children = []
    let checkIdx = e.idx + 1
    while (true) {
      const next = entries.find(n => n.idx === checkIdx && n.roleId === 'mudaf_ilayhi' && !used.has(n.idx))
      if (next) {
        used.add(next.idx)
        children.push(next)
        checkIdx++
      } else break
    }
    nodes.push({ ...e, children })
  })

  return nodes
}

export default function SentenceDiagram({ words, verseRef, onClose }) {
  // words: string[] (the words of the verse)
  const [assignments, setAssignments] = useState({}) // wordIndex -> roleId
  const [activeWord, setActiveWord] = useState(null)
  const [showRoleSelector, setShowRoleSelector] = useState(false)
  const [validationResults, setValidationResults] = useState(null)
  const [showTree, setShowTree] = useState(false)

  const handleAssign = (wordIdx, roleId) => {
    setAssignments(prev => ({ ...prev, [wordIdx]: roleId }))
    setShowRoleSelector(false)
    setActiveWord(null)
  }

  const handleWordClick = (idx) => {
    setActiveWord(idx)
    setShowRoleSelector(true)
  }

  const handleClear = (idx) => {
    setAssignments(prev => {
      const next = { ...prev }
      delete next[idx]
      return next
    })
  }

  const handleClearAll = () => {
    setAssignments({})
    setActiveWord(null)
    setShowRoleSelector(false)
    setValidationResults(null)
    setShowTree(false)
  }

  const handleValidate = useCallback(() => {
    const results = validateAnalysis(assignments, words)
    setValidationResults(results)
    setShowTree(true)
  }, [assignments, words])

  const dismissValidation = useCallback(() => {
    setValidationResults(null)
  }, [])

  // Check if all words have been assigned roles
  const allAssigned = useMemo(() => {
    if (!words || words.length === 0) return false
    return words.every((_, idx) => assignments[idx] !== undefined)
  }, [assignments, words])

  // Build syntax tree (only when shown)
  const syntaxTree = useMemo(() => {
    if (!showTree || Object.keys(assignments).length === 0) return []
    return buildSyntaxTree(assignments, words)
  }, [showTree, assignments, words])

  // Group words by case for summary
  const caseSummary = useMemo(() => {
    const summary = { 'Nominativ': [], 'Akkusativ': [], 'Genitiv': [], 'Andere': [] }
    Object.entries(assignments).forEach(([idx, roleId]) => {
      const role = ROLE_MAP[roleId]
      if (!role) return
      const caseGroup = CASE_COLORS[role.case] ? role.case : 'Andere'
      summary[caseGroup].push({ idx: parseInt(idx), word: words[parseInt(idx)], role: role.label })
    })
    return summary
  }, [assignments, words])

  if (!words || words.length === 0) {
    return <div style={{ color: 'var(--text-muted)', padding: '20px' }}>Kein Vers geladen.</div>
  }

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '20px', position: 'relative',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-heading)' }}>
            Satzdiagramm {verseRef && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({verseRef})</span>}
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Klicke auf ein Wort um seine syntaktische Rolle zuzuweisen.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleClearAll} style={{
            padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem',
            background: 'var(--bg-input)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', cursor: 'pointer',
          }}>Alle löschen</button>
          {onClose && (
            <button onClick={onClose} style={{
              padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem',
              background: 'var(--bg-input)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}>Schließen</button>
          )}
        </div>
      </div>

      {/* Word display */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '8px', direction: 'rtl',
        padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius)',
        marginBottom: '16px', justifyContent: 'center',
      }}>
        {words.map((word, idx) => {
          const roleId = assignments[idx]
          const role = roleId ? ROLE_MAP[roleId] : null
          const isActive = activeWord === idx
          return (
            <div key={idx} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              cursor: 'pointer', position: 'relative',
            }}>
              {/* Role label above */}
              {role && (
                <span style={{
                  fontSize: '0.6rem', color: role.color, fontWeight: 600,
                  maxWidth: '80px', textAlign: 'center', lineHeight: 1.2,
                  direction: 'ltr',
                }}>
                  {role.label.split('(')[0].trim()}
                </span>
              )}
              {/* Case marker */}
              {role && role.case !== '-' && role.case !== 'kontextabh.' && role.case !== 'folgt Bezugswort' && (
                <span style={{
                  fontSize: '0.55rem', padding: '1px 4px', borderRadius: '3px',
                  background: (CASE_COLORS[role.case] || 'var(--text-muted)') + '22',
                  color: CASE_COLORS[role.case] || 'var(--text-muted)',
                  direction: 'ltr',
                }}>
                  {role.case}
                </span>
              )}
              {/* Word */}
              <span
                className="arabic"
                onClick={() => handleWordClick(idx)}
                onContextMenu={(e) => { e.preventDefault(); handleClear(idx) }}
                style={{
                  fontSize: '1.4rem', padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                  background: isActive ? 'var(--accent-teal-bg)' : role ? (role.color + '15') : 'transparent',
                  border: `2px solid ${isActive ? 'var(--accent-teal)' : role ? role.color : 'transparent'}`,
                  color: 'var(--arabic-text)',
                  transition: 'all 0.15s',
                }}
              >
                {word}
              </span>
              {/* Word index */}
              <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', direction: 'ltr' }}>
                {idx + 1}
              </span>
            </div>
          )
        })}
      </div>

      {/* Role selector */}
      {showRoleSelector && activeWord !== null && (
        <div style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '12px',
          marginBottom: '16px',
        }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Rolle für Wort {activeWord + 1}: <span className="arabic" dir="rtl" style={{ fontSize: '1.1rem', color: 'var(--accent-gold)' }}>{words[activeWord]}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {SYNTACTIC_ROLES.map(role => (
              <button
                key={role.id}
                onClick={() => handleAssign(activeWord, role.id)}
                style={{
                  padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem',
                  background: assignments[activeWord] === role.id ? role.color + '30' : 'var(--bg-input)',
                  border: `1px solid ${assignments[activeWord] === role.id ? role.color : 'var(--border)'}`,
                  color: role.color, cursor: 'pointer', fontWeight: 500,
                }}
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Case summary */}
      {Object.values(assignments).length > 0 && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.8rem' }}>
          {Object.entries(caseSummary).map(([caseName, items]) => items.length > 0 && (
            <div key={caseName} style={{
              padding: '8px 12px', borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-input)', flex: '1 1 150px', minWidth: '150px',
            }}>
              <div style={{
                fontWeight: 600, marginBottom: '4px',
                color: CASE_COLORS[caseName] || 'var(--text-muted)',
              }}>
                {caseName} ({items.length})
              </div>
              {items.map((item, i) => (
                <div key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  <span className="arabic" dir="rtl">{item.word}</span> — {item.role}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Validate button — shown when all words have roles assigned */}
      {allAssigned && (
        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleValidate}
            style={{
              padding: '8px 20px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem',
              background: 'var(--accent-teal)', border: 'none',
              color: '#fff', cursor: 'pointer', fontWeight: 600,
            }}
          >
            Prüfe Analyse
          </button>
          {showTree && (
            <button
              onClick={() => setShowTree(false)}
              style={{
                padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem',
                background: 'var(--bg-input)', border: '1px solid var(--border)',
                color: 'var(--text-secondary)', cursor: 'pointer',
              }}
            >
              Baumansicht ausblenden
            </button>
          )}
        </div>
      )}

      {/* Validation results */}
      {validationResults && validationResults.length > 0 && (
        <div style={{
          marginTop: '16px', padding: '16px',
          background: 'var(--bg-input)', borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '12px',
          }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-heading)' }}>
              Validierungsergebnis
            </h4>
            <button
              onClick={dismissValidation}
              style={{
                padding: '2px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.7rem',
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--text-muted)', cursor: 'pointer',
              }}
            >
              Ausblenden
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {validationResults.map((result, i) => {
              const icon = result.type === 'valid' ? '\u2705' : result.type === 'warning' ? '\u26A0\uFE0F' : '\u2139\uFE0F'
              const borderColor = result.type === 'valid' ? '#4caf50' : result.type === 'warning' ? '#ff9800' : '#2196f3'
              const bgColor = result.type === 'valid' ? '#4caf5012' : result.type === 'warning' ? '#ff980012' : '#2196f312'
              return (
                <div key={i} style={{
                  padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                  background: bgColor, borderLeft: `3px solid ${borderColor}`,
                  fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5,
                }}>
                  <span style={{ marginRight: '6px' }}>{icon}</span>
                  {result.message}
                </div>
              )
            })}
          </div>
          <p style={{
            margin: '12px 0 0', fontSize: '0.7rem', color: 'var(--text-muted)',
            fontStyle: 'italic',
          }}>
            Diese Validierung ist beratend — Warnungen können bei bestimmten Konstruktionen erwartet sein.
          </p>
        </div>
      )}

      {/* Syntax tree visualization */}
      {showTree && syntaxTree.length > 0 && (
        <div style={{
          marginTop: '16px', padding: '16px',
          background: 'var(--bg-card)', borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
        }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: 'var(--text-heading)' }}>
            Syntaktische Baumansicht
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {syntaxTree.map((node, i) => {
              const nodeRole = node.role || ROLE_MAP[node.roleId]
              const nodeColor = nodeRole?.color || 'var(--text-muted)'
              return (
                <div key={i} style={{
                  borderLeft: `3px solid ${nodeColor}`,
                  paddingLeft: '12px',
                }}>
                  {/* Parent node */}
                  <div style={{
                    padding: '6px 10px', borderRadius: 'var(--radius-sm)',
                    background: nodeColor + '15', display: 'inline-flex',
                    alignItems: 'center', gap: '8px', marginBottom: node.children?.length ? '4px' : 0,
                  }}>
                    <span style={{ fontSize: '0.7rem', color: nodeColor, fontWeight: 600 }}>
                      {nodeRole?.label?.split('(')[0]?.trim() || node.roleId}
                    </span>
                    <span className="arabic" dir="rtl" style={{
                      fontSize: '1.1rem', color: 'var(--arabic-text, var(--text-primary))',
                    }}>
                      {node.word}
                    </span>
                  </div>
                  {/* Children */}
                  {node.children && node.children.length > 0 && (
                    <div style={{
                      marginLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px',
                    }}>
                      {node.children.map((child, j) => {
                        const childRole = child.role || ROLE_MAP[child.roleId]
                        const childColor = childRole?.color || 'var(--text-muted)'
                        return (
                          <div key={j} style={{
                            padding: '4px 10px', borderRadius: 'var(--radius-sm)',
                            background: childColor + '10', display: 'inline-flex',
                            alignItems: 'center', gap: '8px',
                            borderLeft: `2px solid ${childColor}60`,
                          }}>
                            <span style={{
                              fontSize: '0.65rem', color: childColor, fontWeight: 600,
                              minWidth: '80px',
                            }}>
                              {childRole?.label?.split('(')[0]?.trim() || child.roleId}
                            </span>
                            <span className="arabic" dir="rtl" style={{
                              fontSize: '1rem', color: 'var(--arabic-text, var(--text-primary))',
                            }}>
                              {child.word}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
