/**
 * Stage 2 — Automatische Erkennung (Automatic Ambiguity Detection)
 *
 * Scans the morphology database and Quran text to automatically detect
 * words whose consonantal skeleton (rasm) permits multiple valid analyses.
 *
 * Two detection rules:
 * 1. Same consonantal form appears at different locations with different roots
 * 2. Same consonantal form (after stripping affixes) could match multiple verb
 *    forms (e.g. Form I Perfect Active vs Form I Perfect Passive have identical consonants)
 */

import { stripPrefixes, stripSuffixes, TASHKIL_REGEX_SOURCE } from './arabic.js'
import rootFrequencyData from '../data/root-frequency.json'

// ===== Root meaning lookup (from root-frequency.json) =====
const ROOT_MEANINGS = new Map()
if (rootFrequencyData?.roots) {
  for (const entry of rootFrequencyData.roots) {
    if (entry.rootArabic && entry.meaning) {
      const spaced = entry.rootArabic.split('').join(' ')
      ROOT_MEANINGS.set(spaced, entry.meaning)
      ROOT_MEANINGS.set(entry.rootArabic, entry.meaning)
    }
    if (entry.root && entry.meaning) {
      ROOT_MEANINGS.set(entry.root, entry.meaning)
    }
  }
}

function getRootMeaning(root) {
  if (!root) return ''
  return ROOT_MEANINGS.get(root) || ROOT_MEANINGS.get(root.replace(/\s+/g, '')) || ''
}

// Tashkil regex from arabic.js + U+0670 (Alif Khanjariyya) for consonantal extraction
const VOWEL_MARKS_REGEX = new RegExp(TASHKIL_REGEX_SOURCE + '|\\u0670', 'g')

/**
 * Strip all vowel marks from a vocalized Arabic word to get the consonantal skeleton.
 * Used ONLY for internal grouping in ambiguity detection — not for morph-db c-field lookup.
 * @param {string} text
 * @returns {string}
 */
function toConsonantal(text) {
  if (!text) return ''
  return text
    .replace(VOWEL_MARKS_REGEX, '')
    .replace(/\u0640/g, '')       // tatweel
    .replace(/\u0671/g, '\u0627') // Alif Wasla → plain Alif
}

/**
 * Rule 1: Detect consonantal forms that appear with different roots in the morphology DB.
 *
 * When the same unvowelled word form is assigned to different roots at different
 * locations, the consonantal text is genuinely ambiguous.
 *
 * @param {Object} morphologyDB - The quran-morphology-db.json data ({ words: [...] })
 * @returns {Map<string, Object>} Map of consonantal form -> { roots, locations, ... }
 */
function detectMultiRootForms(morphologyDB) {
  if (!morphologyDB?.words) return new Map()

  // Group words by consonantal form
  const formMap = new Map() // consonantal -> [{ root, location, vocalized, pos }]

  for (const entry of morphologyDB.words) {
    if (!entry.v || !entry.r) continue // skip entries without vocalization or root

    const consonantal = toConsonantal(entry.v)
    if (!consonantal || consonantal.length < 2) continue

    if (!formMap.has(consonantal)) {
      formMap.set(consonantal, [])
    }
    formMap.get(consonantal).push({
      root: entry.r,
      location: entry.l,
      vocalized: entry.v,
      pos: entry.p,
      morph: entry.m || '',
    })
  }

  // Filter: keep only forms that appear with multiple distinct roots
  const ambiguous = new Map()
  for (const [consonantal, entries] of formMap) {
    const uniqueRoots = new Set(entries.map(e => e.root))
    if (uniqueRoots.size >= 2) {
      // Build a summary of root alternatives
      const rootSummaries = {}
      for (const e of entries) {
        if (!rootSummaries[e.root]) {
          rootSummaries[e.root] = {
            root: e.root,
            locations: [],
            vocalizations: new Set(),
            posTypes: new Set(),
          }
        }
        rootSummaries[e.root].locations.push(e.location)
        rootSummaries[e.root].vocalizations.add(e.vocalized)
        rootSummaries[e.root].posTypes.add(e.pos)
      }

      ambiguous.set(consonantal, {
        consonantal,
        roots: Object.values(rootSummaries).map(s => ({
          root: s.root,
          locationCount: s.locations.length,
          sampleLocations: s.locations.slice(0, 3),
          vocalizations: [...s.vocalizations].slice(0, 3),
          posTypes: [...s.posTypes],
        })),
        totalOccurrences: entries.length,
        category: 'root_ambiguity',
        detectionMethod: 'auto_stage2_rule1',
      })
    }
  }

  return ambiguous
}

/**
 * Rule 2: Detect consonantal forms where active/passive voice collapses.
 *
 * For verbs, the active and passive voices of the same form often have
 * identical consonants. If a word's consonantal form is a known verb,
 * flag it as potentially ambiguous between active and passive readings.
 *
 * @param {Object} morphologyDB - The quran-morphology-db.json data
 * @returns {Map<string, Object>} Map of consonantal form -> ambiguity info
 */
function detectActivePassiveAmbiguities(morphologyDB) {
  if (!morphologyDB?.words) return new Map()

  const ambiguous = new Map()

  // Group verb entries by consonantal form
  const verbForms = new Map() // consonantal -> [entries]

  for (const entry of morphologyDB.words) {
    if (entry.p !== 'V' || !entry.v || !entry.r) continue

    const consonantal = toConsonantal(entry.v)
    if (!consonantal || consonantal.length < 2) continue

    if (!verbForms.has(consonantal)) {
      verbForms.set(consonantal, [])
    }
    verbForms.get(consonantal).push({
      root: entry.r,
      location: entry.l,
      vocalized: entry.v,
      morph: entry.m || '',
    })
  }

  // For each verb consonantal form, check if it could be both active and passive
  for (const [consonantal, entries] of verbForms) {
    // Check morphology strings for active/passive indicators
    const hasActive = entries.some(e => e.morph.includes('ACT'))
    const hasPassive = entries.some(e => e.morph.includes('PASS'))

    // If we see both active and passive for the same consonantal form, it is ambiguous
    if (hasActive && hasPassive) {
      const activeEntries = entries.filter(e => e.morph.includes('ACT'))
      const passiveEntries = entries.filter(e => e.morph.includes('PASS'))

      ambiguous.set(consonantal, {
        consonantal,
        options: [
          {
            voice: 'active',
            sampleVocalized: [...new Set(activeEntries.map(e => e.vocalized))].slice(0, 3),
            sampleLocations: activeEntries.slice(0, 3).map(e => e.location),
            root: activeEntries[0]?.root,
          },
          {
            voice: 'passive',
            sampleVocalized: [...new Set(passiveEntries.map(e => e.vocalized))].slice(0, 3),
            sampleLocations: passiveEntries.slice(0, 3).map(e => e.location),
            root: passiveEntries[0]?.root,
          },
        ],
        totalOccurrences: entries.length,
        category: 'active_passive',
        detectionMethod: 'auto_stage2_rule2',
      })
      continue
    }

    // Even if we only see one voice in the DB, if the verb is in a form where
    // active/passive collapse, mark it as potentially ambiguous.
    // Extract stem after stripping prefixes to detect the verb pattern.
    if (entries.length > 0 && consonantal.length >= 3) {
      const { stem } = stripPrefixes(consonantal)
      const { stem: coreStem } = stripSuffixes(stem)

      // If the core stem is 3 consonants (trilateral root shape), active/passive
      // of Form I are always identical in consonantal text.
      if (coreStem.length === 3 && !ambiguous.has(consonantal)) {
        ambiguous.set(consonantal, {
          consonantal,
          options: [
            {
              voice: 'active',
              note: 'Form I fa\'ala / yaf\'alu pattern (identical rasm for passive)',
              root: entries[0]?.root,
              sampleLocations: entries.slice(0, 3).map(e => e.location),
            },
            {
              voice: 'passive',
              note: 'Form I fu\'ila / yuf\'alu pattern (identical rasm for active)',
              root: entries[0]?.root,
              sampleLocations: [],
            },
          ],
          totalOccurrences: entries.length,
          category: 'active_passive',
          detectionMethod: 'auto_stage2_rule2_potential',
        })
      }
    }
  }

  return ambiguous
}

/**
 * Main detection function: Run all Stage-2 automatic ambiguity detection rules.
 *
 * @param {Object} morphologyDB - The quran-morphology-db.json data ({ meta, words: [...] })
 * @returns {Object[]} Array of auto-detected ambiguity entries, ready for merging
 *   with manual ambiguities from ambiguities.json.
 *
 * Each entry has the shape:
 * {
 *   id: string,                  // 'auto_<consonantal>'
 *   consonants: string,          // the consonantal skeleton
 *   category: string,            // 'root_ambiguity' | 'active_passive'
 *   detectionMethod: string,     // which rule detected it
 *   options: Object[],           // possible analyses
 *   locations: string[],         // sample Quran locations
 *   autoDetected: true,          // flag for auto-detected entries
 * }
 */
export function detectAmbiguities(morphologyDB) {
  const results = []
  let autoId = 10000 // start IDs above manual entries

  // Rule 1: multi-root consonantal forms
  const multiRoot = detectMultiRootForms(morphologyDB)
  for (const [consonantal, info] of multiRoot) {
    results.push({
      id: `auto_${autoId++}`,
      consonants: consonantal,
      category: info.category,
      detectionMethod: info.detectionMethod,
      autoDetected: true,
      options: info.roots.map(r => ({
        root: r.root,
        pos: r.posTypes.join('/'),
        vocalized: r.vocalizations[0] || '',
        morphology: `Wurzel ${r.root} (${r.locationCount}x im Quran)`,
        meaning_de: getRootMeaning(r.root),
        meaning_en: '',
      })),
      sampleLocations: info.roots.flatMap(r => r.sampleLocations).slice(0, 5),
      totalOccurrences: info.totalOccurrences,
    })
  }

  // Rule 2: active/passive collapses
  const activePassive = detectActivePassiveAmbiguities(morphologyDB)
  for (const [consonantal, info] of activePassive) {
    // Skip if already covered by Rule 1
    if (multiRoot.has(consonantal)) continue

    results.push({
      id: `auto_${autoId++}`,
      consonants: consonantal,
      category: info.category,
      detectionMethod: info.detectionMethod,
      autoDetected: true,
      options: info.options.map(opt => {
        const baseMeaning = getRootMeaning(opt.root || '')
        const voiceLabel = opt.voice === 'active' ? 'Aktiv' : 'Passiv'
        return {
          root: opt.root || '',
          voice: opt.voice,
          vocalized: opt.sampleVocalized?.[0] || '',
          morphology: `${voiceLabel}${opt.note ? ' - ' + opt.note : ''}`,
          meaning_de: baseMeaning ? `${baseMeaning} (${voiceLabel})` : '',
          meaning_en: '',
        }
      }),
      sampleLocations: info.options.flatMap(o => o.sampleLocations || []).slice(0, 5),
      totalOccurrences: info.totalOccurrences,
    })
  }

  return results
}

/**
 * Merge auto-detected ambiguities with manual ambiguities from ambiguities.json.
 *
 * Manual entries take precedence: if a consonantal form is already in the manual
 * database, the auto-detected entry is skipped (the manual one is more curated).
 *
 * @param {Object} manualAmbiguities - The ambiguities.json data ({ entries: [...] })
 * @param {Object[]} autoDetected - Array from detectAmbiguities()
 * @returns {Object} Merged data in the same format as ambiguities.json
 */
export function mergeAmbiguities(manualAmbiguities, autoDetected) {
  // Build a set of consonantal forms already covered by manual entries
  const manualConsonants = new Set()
  const manualLocations = new Set()
  if (manualAmbiguities?.entries) {
    for (const entry of manualAmbiguities.entries) {
      if (entry.consonants) {
        manualConsonants.add(toConsonantal(entry.consonants))
      }
      if (entry.location) {
        manualLocations.add(entry.location)
      }
    }
  }

  // Filter auto-detected: skip any that are already manually covered
  const newAutoEntries = autoDetected.filter(auto => {
    const autoConsonantal = toConsonantal(auto.consonants)
    if (manualConsonants.has(autoConsonantal)) return false

    // Also skip if all sample locations are already in the manual DB
    if (auto.sampleLocations?.every(loc => manualLocations.has(loc))) return false

    return true
  })

  // Merge
  const merged = {
    _meta: {
      ...(manualAmbiguities?._meta || {}),
      autoDetectedCount: newAutoEntries.length,
      mergedAt: new Date().toISOString(),
    },
    entries: [
      ...(manualAmbiguities?.entries || []),
      ...newAutoEntries,
    ],
  }

  return merged
}

/**
 * Build a location-indexed lookup from merged ambiguities.
 *
 * For auto-detected entries that have sampleLocations, create lookup entries
 * at each location so they can be found during verse analysis.
 *
 * @param {Object} mergedAmbiguities - Output of mergeAmbiguities()
 * @returns {Map<string, Object>} Map of "surah:ayah:wordIndex" -> entry
 */
export function buildAmbiguityLookup(mergedAmbiguities) {
  const lookup = new Map()

  if (!mergedAmbiguities?.entries) return lookup

  for (const entry of mergedAmbiguities.entries) {
    // Manual entries: indexed by location
    if (entry.location) {
      lookup.set(entry.location, entry)
    }

    // Auto-detected entries: indexed by each sample location
    if (entry.autoDetected && entry.sampleLocations) {
      for (const loc of entry.sampleLocations) {
        if (!lookup.has(loc)) {
          lookup.set(loc, entry)
        }
      }
    }
  }

  return lookup
}

/**
 * Build a consonantal-form-indexed lookup from merged ambiguities.
 *
 * This allows checking any word's consonantal form against known ambiguities,
 * even at locations not explicitly listed.
 *
 * @param {Object} mergedAmbiguities - Output of mergeAmbiguities()
 * @returns {Map<string, Object>} Map of consonantal form -> entry
 */
export function buildConsonantalLookup(mergedAmbiguities) {
  const lookup = new Map()

  if (!mergedAmbiguities?.entries) return lookup

  for (const entry of mergedAmbiguities.entries) {
    const key = toConsonantal(entry.consonants)
    if (key && !lookup.has(key)) {
      lookup.set(key, entry)
    }
  }

  return lookup
}
