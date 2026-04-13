import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import ArabicKeyboard from '../components/ArabicKeyboard.jsx'
import {
  splitIntoWords,
  extractRootCandidate,
  stripVowelMarks,
  cleanArabicText,
  transliterateToArabic,
  containsArabic,
  stripIjam,
} from '../utils/arabic.js'
import {
  saveAnalyzedWord,
  saveRoot,
  saveSRSCard,
  saveModuleProgress,
  loadModuleProgress,
  saveUserAmbiguity,
  loadUserAmbiguity,
} from '../utils/storage.js'

// I'jam stripping imported from arabic.js (centralized)

import particlesData from '../data/particles.json'
import pronounsData from '../data/pronouns.json'
import morphologyTables from '../data/morphology-tables.json'
import ambiguitiesData from '../data/ambiguities.json'
import audioConfig from '../data/audio-config.json'
import lanesData from '../data/lanes-lexicon-urls.json'
import morphologyDB from '../data/quran-morphology-db.json'
import rootFrequencyData from '../data/root-frequency.json'
import idafaSubtypes from '../data/idafa-subtypes.json'
import ellipsisHints from '../data/ellipsis-hints.json'
import {
  detectAmbiguities,
  mergeAmbiguities,
  buildConsonantalLookup,
} from '../utils/ambiguityDetection.js'
import GrammarSidebar from '../components/GrammarSidebar.jsx'
import CrossReference from '../components/CrossReference.jsx'
import SentenceDiagram from '../components/SentenceDiagram.jsx'
import SyntaxExercises from '../components/SyntaxExercises.jsx'

// ============================================================
// CONSTANTS & HELPERS
// ============================================================

// Build word lookup from corpus morphology database
const MORPHOLOGY_LOOKUP = new Map()
if (morphologyDB && morphologyDB.words) {
  morphologyDB.words.forEach(w => {
    MORPHOLOGY_LOOKUP.set(w.l, w)
  })
}

/**
 * Get the correct corpus morphology entry for a word, handling the "يا" (ya)
 * vocative particle alignment bug.
 *
 * The Quran text has 77,800 whitespace-separated words while the morphology DB
 * has 77,429 entries. In 367 verses the vocative particle "يا" is a separate
 * word in the text but its morphological data is merged with the following word
 * in the DB. This causes all word indices after a "يا" to be off by the number
 * of preceding "يا" particles in that verse.
 *
 * @param {number} surah  - Surah number
 * @param {number} verse  - Verse number
 * @param {number} wordIndex - 0-based index of the word in the verse text
 * @param {string} word   - The actual word string from the verse text
 * @param {string[]} allWordsInVerse - All whitespace-split words of the verse
 * @returns {object|undefined} The correct morphology DB entry, or undefined
 */
function getCorpusEntryAligned(surah, verse, wordIndex, word, allWordsInVerse) {
  // 1. Try direct lookup (1-based index in the DB)
  const directKey = `${surah}:${verse}:${wordIndex + 1}`
  const directEntry = MORPHOLOGY_LOOKUP.get(directKey)

  // If the word itself is "يا", the direct entry (if present) is correct —
  // its morphological data covers the merged vocative phrase.
  if (word === '\u064a\u0627') {
    return directEntry
  }

  // 2. Count how many standalone "يا" vocative particles appear before this
  //    word position in the verse. Each one shifts the DB index by -1.
  let yaOffset = 0
  for (let i = 0; i < wordIndex && i < allWordsInVerse.length; i++) {
    if (allWordsInVerse[i] === '\u064a\u0627') {
      yaOffset++
    }
  }

  // No offset needed — direct lookup is fine
  if (yaOffset === 0) {
    return directEntry
  }

  // 3. Try adjusted lookup
  const adjustedKey = `${surah}:${verse}:${wordIndex + 1 - yaOffset}`
  const adjustedEntry = MORPHOLOGY_LOOKUP.get(adjustedKey)
  if (adjustedEntry) {
    return adjustedEntry
  }

  // 4. Fallback to direct entry if adjusted lookup found nothing
  return directEntry
}

// --- Stage 2: Automatic ambiguity detection ---
// Run auto-detection and merge with manual ambiguities at import time
const autoDetectedAmbiguities = detectAmbiguities(morphologyDB)
const mergedAmbiguitiesData = mergeAmbiguities(ambiguitiesData, autoDetectedAmbiguities)
const CONSONANTAL_AMBIGUITY_LOOKUP = buildConsonantalLookup(mergedAmbiguitiesData)

const ROOT_CONSONANTS = new Set([
  '\u0621','\u0627','\u0628','\u062A','\u062B','\u062C','\u062D','\u062E',
  '\u062F','\u0630','\u0631','\u0632','\u0633','\u0634','\u0635','\u0636',
  '\u0637','\u0638','\u0639','\u063A','\u0641','\u0642','\u0643','\u0644',
  '\u0645','\u0646','\u0647','\u0648','\u064A',
])

// Build flat particle lookup (consonantal -> particle data)
const PARTICLE_LOOKUP = new Map()
particlesData.particles.forEach(p => {
  const clean = cleanArabicText(p.consonantal).replace(/[\u0640~]/g, '')
  PARTICLE_LOOKUP.set(clean, p)
  // Also add the arabic form stripped of vowels
  const stripped = cleanArabicText(p.arabic).replace(/[\u0640~]/g, '')
  if (stripped !== clean) PARTICLE_LOOKUP.set(stripped, p)
})

// Build flat pronoun lookup (consonantal forms)
const PRONOUN_LOOKUP = new Map()
function addPronouns(list, category) {
  if (!list) return
  list.forEach(p => {
    const forms = [p.arabic]
    if (p.consonantal) forms.push(p.consonantal)
    forms.forEach(f => {
      const clean = cleanArabicText(f).replace(/[\u0640~\u0020\u200C\u200D]/gu, '').replace(/\//g, '')
      if (clean.length > 0) PRONOUN_LOOKUP.set(clean, { ...p, category })
    })
  })
}
addPronouns(pronounsData.independent?.pronouns, 'independent')
addPronouns(pronounsData.suffix?.pronouns, 'suffix')
addPronouns(pronounsData.demonstrative?.near?.pronouns, 'demonstrative_near')
addPronouns(pronounsData.demonstrative?.far?.pronouns, 'demonstrative_far')
addPronouns(pronounsData.relative?.pronouns, 'relative')

// Build ambiguity lookup by "surah:ayah:wordIndex" (uses merged manual + auto-detected)
const AMBIGUITY_LOOKUP = new Map()
if (mergedAmbiguitiesData.entries) {
  mergedAmbiguitiesData.entries.forEach(e => {
    if (e.location) {
      AMBIGUITY_LOOKUP.set(e.location, e)
    }
    // Auto-detected entries: index by each sample location
    if (e.autoDetected && e.sampleLocations) {
      e.sampleLocations.forEach(loc => {
        if (!AMBIGUITY_LOOKUP.has(loc)) {
          AMBIGUITY_LOOKUP.set(loc, e)
        }
      })
    }
  })
}

// Root database from lanes data (frequent roots)
// Offline root meanings from frequency data (fallback when Lane's is unavailable)
const OFFLINE_ROOT_MEANINGS = new Map()
if (rootFrequencyData?.roots) {
  rootFrequencyData.roots.forEach(r => {
    if (r.meaning) {
      const key = r.root.trim()
      OFFLINE_ROOT_MEANINGS.set(key, { meaning: r.meaning, count: r.count, rank: r.rank })
    }
  })
}

const KNOWN_ROOTS = new Set()
if (lanesData.frequentRootsWithLaneReferences?.roots) {
  lanesData.frequentRootsWithLaneReferences.roots.forEach(r => {
    // Store root as space-separated consonants
    const letters = r.rootArabic ? [...cleanArabicText(r.rootArabic)].filter(c => ROOT_CONSONANTS.has(c)) : []
    if (letters.length >= 2) {
      KNOWN_ROOTS.add(letters.join(' '))
    }
  })
}

// Extract all roots from ambiguities DB too
if (ambiguitiesData.entries) {
  ambiguitiesData.entries.forEach(e => {
    if (e.options) {
      e.options.forEach(opt => {
        if (opt.root) {
          KNOWN_ROOTS.add(opt.root.trim())
        }
      })
    }
  })
}

// Verb form labels
const VERB_FORMS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
const TENSES = [
  { value: 'perfect', label: 'Perfekt (abgeschlossene Handlung)' },
  { value: 'imperfect', label: 'Imperfekt (unabgeschlossene Handlung)' },
  { value: 'imperative', label: 'Imperativ (Befehl)' },
]
const MOODS = [
  { value: 'indicative', label: 'Indikativ (Marfu\u02BB)' },
  { value: 'subjunctive', label: 'Subjunktiv (Mansub)' },
  { value: 'jussive', label: 'Jussiv (Majzum)' },
  { value: 'energetic', label: 'Energetikus (Modus der Bekräftigung)' },
]
const PERSONS = [
  { value: '1s', label: '1. Person Singular' },
  { value: '1p', label: '1. Person Plural' },
  { value: '2ms', label: '2. Person m. Singular' },
  { value: '2fs', label: '2. Person f. Singular' },
  { value: '2md', label: '2. Person Dual' },
  { value: '2mp', label: '2. Person m. Plural' },
  { value: '2fp', label: '2. Person f. Plural' },
  { value: '3ms', label: '3. Person m. Singular' },
  { value: '3fs', label: '3. Person f. Singular' },
  { value: '3md', label: '3. Person m. Dual' },
  { value: '3fd', label: '3. Person f. Dual' },
  { value: '3mp', label: '3. Person m. Plural' },
  { value: '3fp', label: '3. Person f. Plural' },
]
const VOICES = [
  { value: 'active', label: 'Aktiv' },
  { value: 'passive', label: 'Passiv' },
]
const WORD_TYPES = [
  { value: 'verb', label: 'Verb' },
  { value: 'noun', label: 'Nomen' },
  { value: 'adjective', label: 'Adjektiv' },
  { value: 'participle', label: 'Partizip' },
  { value: 'masdar', label: 'Masdar (Verbalnomen)' },
]
// Error-type → specific lesson mapping for adaptive hints
const ERROR_LESSON_MAP = {
  // Verb form errors → lesson 2.2 (Die 10 Verbformen)
  form_I: { lessonId: '2.2', stufe: 'morphology', label: 'Die 10 Verbformen' },
  form_II: { lessonId: '2.2', stufe: 'morphology', label: 'Die 10 Verbformen' },
  form_III: { lessonId: '2.2', stufe: 'morphology', label: 'Die 10 Verbformen' },
  form_IV: { lessonId: '2.2', stufe: 'morphology', label: 'Die 10 Verbformen' },
  form_V: { lessonId: '2.2', stufe: 'morphology', label: 'Die 10 Verbformen' },
  form_VI: { lessonId: '2.2', stufe: 'morphology', label: 'Die 10 Verbformen' },
  form_VII: { lessonId: '2.2', stufe: 'morphology', label: 'Die 10 Verbformen' },
  form_VIII: { lessonId: '2.2', stufe: 'morphology', label: 'Die 10 Verbformen' },
  form_IX: { lessonId: '2.2', stufe: 'morphology', label: 'Die 10 Verbformen' },
  form_X: { lessonId: '2.2', stufe: 'morphology', label: 'Die 10 Verbformen' },
  // Tense errors
  tense_perfect: { lessonId: '2.3', stufe: 'morphology', label: 'Konjugation: Perfekt' },
  tense_imperfect: { lessonId: '2.4', stufe: 'morphology', label: 'Konjugation: Imperfekt' },
  tense_imperative: { lessonId: '2.5', stufe: 'morphology', label: 'Imperativ' },
  // Mood errors
  mood: { lessonId: '2.6', stufe: 'morphology', label: 'Die drei Verbmodi' },
  // Passive / voice errors
  voice: { lessonId: '2.7', stufe: 'morphology', label: 'Passiv' },
  // Weak verb / root errors
  root_weak: { lessonId: '2.10', stufe: 'morphology', label: 'Schwache Verben' },
  root: { lessonId: '2.1', stufe: 'morphology', label: 'Das Wurzelsystem' },
  // Noun pattern errors
  noun_pattern: { lessonId: '2.11', stufe: 'morphology', label: 'Nomenmuster' },
  // Case / syntax errors
  case: { lessonId: '3.1', stufe: 'syntax', label: 'Das Kasussystem' },
  syntax_role: { lessonId: '3.2', stufe: 'syntax', label: 'Satztypen' },
}

const SYNTACTIC_ROLES = [
  { value: 'fa3il', label: 'Fa\u02BBil (Subjekt des Verbalsatzes)', case: 'nominativ', caseExplanation: 'Das Subjekt (Fa\u02BBil) steht im Nominativ (Marfu\u02BB) — es trägt Damma.' },
  { value: 'mubtada', label: 'Mubtada\u02BB (Thema des Nominalsatzes)', case: 'nominativ', caseExplanation: 'Das Thema (Mubtada\u02BB) steht im Nominativ (Marfu\u02BB).' },
  { value: 'khabar', label: 'Khabar (Prädikat)', case: 'nominativ', caseExplanation: 'Das Prädikat (Khabar) steht im Nominativ (Marfu\u02BB).' },
  { value: 'object', label: 'Maf\u02BBul bihi (direktes Objekt)', case: 'akkusativ', caseExplanation: 'Das direkte Objekt (Maf\u02BBul bihi) steht im Akkusativ (Mansub) — es trägt Fatha.' },
  { value: 'hal', label: 'Hal (Zustandsakkusativ)', case: 'akkusativ', caseExplanation: 'Der Hal steht im Akkusativ (Mansub) — er beschreibt den Zustand des Subjekts oder Objekts während der Handlung.' },
  { value: 'tamyiz', label: 'Tamyiz (Spezifikation)', case: 'akkusativ', caseExplanation: 'Der Tamyiz steht im Akkusativ (Mansub) — er präzisiert eine Mehrdeutigkeit.' },
  { value: 'mudaf_ilayh', label: 'Mudaf ilayh (Iḍāfa-Genitiv)', case: 'genitiv', caseExplanation: 'Das zweite Glied einer Iḍāfa steht im Genitiv (Majrur) — es trägt Kasra.' },
  { value: 'jarr_majrur', label: 'Majrur (nach Präposition)', case: 'genitiv', caseExplanation: 'Nach einer Präposition steht das Nomen im Genitiv (Majrur) — es trägt Kasra.' },
  { value: 'sifa', label: 'Sifa (Attribut)', case: 'folgt_bezugswort', caseExplanation: 'Das Attribut (Sifa) folgt dem Bezugswort in Kasus, Genus, Numerus und Definitheit.' },
  { value: 'badal', label: 'Badal (Apposition)', case: 'folgt_bezugswort', caseExplanation: 'Die Apposition (Badal) folgt dem Bezugswort im Kasus.' },
  { value: 'atf', label: 'Atf (Ma\'tuf — koordiniertes Element)', case: 'folgt_bezugswort', caseExplanation: 'Koordiniertes Element nach Konjunktion (wa, fa, thumma etc.) — folgt dem Bezugswort im Kasus.' },
  { value: 'tawkid', label: 'Tawkid (Bekräftigung)', case: 'folgt_bezugswort', caseExplanation: 'Bekräftigungswort (nafs, \'ayn, kull, jami\', kila/kilta) — folgt dem Bezugswort im Kasus.' },
  { value: 'munada', label: 'Munada (Vokativ)', case: 'akkusativ', caseExplanation: 'Der Angerufene (Munada) steht im Akkusativ — außer bei Mufrad ʿAlam (Eigenname) und Nakira Maqsuda (bestimmte unbestimmte Anrede): diese werden auf Damma aufgebaut (mabniyy ʿala d-damm).' },
  { value: 'na3ib_fa3il', label: 'Na\u02BBib al-Fa\u02BBil (Passiv-Subjekt)', case: 'nominativ', caseExplanation: 'Das Passiv-Subjekt steht im Nominativ (Marfu\u02BB) — es nimmt die Stelle des Fa\u02BBil ein.' },
  { value: 'maf_ul_mutlaq', label: 'Maf\u02BBul Mutlaq (absolutes Objekt)', case: 'akkusativ', caseExplanation: 'Das absolute Objekt (Maf\u02BBul Mutlaq) ist ein Masdar das die Handlung seines Verbs verstärkt oder näher bestimmt. Immer Akkusativ (Mansub).' },
  { value: 'maf_ul_liajlihi', label: 'Maf\u02BBul li-Ajlihi (Zweckobjekt)', case: 'akkusativ', caseExplanation: 'Das Zweckobjekt (Maf\u02BBul li-Ajlihi) ist ein Masdar das den Grund der Handlung angibt. Akkusativ (Mansub).' },
  { value: 'maf_ul_maahu', label: 'Maf\u02BBul Ma\u02BBahu (Begleitobjekt)', case: 'akkusativ', caseExplanation: 'Das Begleitobjekt steht nach و (wa) der Gleichzeitigkeit. Akkusativ (Mansub).' },
  { value: 'zarf_zaman', label: 'Ẓarf Zaman (Zeitadverbiale)', case: 'akkusativ', caseExplanation: 'Die Zeitangabe steht im adverbialen Akkusativ (Mansub).' },
  { value: 'zarf_makan', label: 'Ẓarf Makan (Ortsadverbiale)', case: 'akkusativ', caseExplanation: 'Die Ortsangabe steht im adverbialen Akkusativ (Mansub).' },
  { value: 'ism_inna', label: 'Ism Inna (Subjekt nach Inna)', case: 'akkusativ', caseExplanation: 'Nach إِنَّ und ihren Schwestern (أَنَّ، كَأَنَّ، لٰكِنَّ، لَيْتَ، لَعَلَّ) steht das Subjekt im Akkusativ (Mansub).' },
  { value: 'khabar_inna', label: 'Khabar Inna (Prädikat nach Inna)', case: 'nominativ', caseExplanation: 'Das Prädikat nach إِنَّ und Schwestern bleibt im Nominativ (Marfu\u02BB).' },
  { value: 'ism_kana', label: 'Ism Kana (Subjekt nach Kana)', case: 'nominativ', caseExplanation: 'Nach كَانَ und ihren Schwestern (صَارَ، أَصْبَحَ، لَيْسَ usw.) bleibt das Subjekt im Nominativ (Marfu\u02BB).' },
  { value: 'khabar_kana', label: 'Khabar Kana (Prädikat nach Kana)', case: 'akkusativ', caseExplanation: 'Das Prädikat nach كَانَ und Schwestern steht im Akkusativ (Mansub).' },
  { value: 'istithna', label: 'Mustathna (Ausgenommenes nach Illa)', case: 'akkusativ', caseExplanation: 'Das ausgenommene Element nach إِلَّا steht in den meisten Fällen im Akkusativ (Mansub).' },
  { value: 'harf', label: 'Harf (Partikel)', case: 'keine', caseExplanation: 'Partikeln sind nicht deklinierbar — sie haben keinen Kasus.' },
  { value: 'fi3l', label: 'Fi\u02BBl (Verb)', case: 'keine', caseExplanation: 'Verben werden nicht nach Kasus, sondern nach Modus (Indikativ/Subjunktiv/Jussiv) flektiert.' },
  { value: 'other', label: 'Andere', case: 'keine', caseExplanation: '' },
]

// Suggested surah order for quick wins
const QUICK_WIN_SURAHS = [112, 113, 114, 1]

// Guided learning path — recommended surah order for learners
const GUIDED_PATH = [
  { phase: 'Einstieg — Kurze Suren mit einfacher Struktur', surahs: [
    { surah: 112, name: 'al-Ikhlas', verses: 4, reason: '4 kurze Verse, Mix aus Imperativ, Nominalsatz und negierten Verbalsätzen' },
    { surah: 113, name: 'al-Falaq', verses: 5, reason: 'Imperative, Iḍāfa-Ketten, Relativsätze' },
    { surah: 114, name: 'an-Nas', verses: 6, reason: 'Wiederholungsstruktur, Iḍāfa, Sifa' },
    { surah: 1, name: 'al-Fatiha', verses: 7, reason: 'Nominalsätze, Iḍāfa, Relativsatz, Verbalsatz' },
  ]},
  { phase: 'Grundlagen — Verbale und nominale Strukturen', surahs: [
    { surah: 111, name: 'al-Masad', verses: 5, reason: 'Verbalsätze Perfekt, Nominalsätze, Hal' },
    { surah: 108, name: 'al-Kauthar', verses: 3, reason: 'Kürzeste Sure — Imperativ, Inna-Konstruktion' },
    { surah: 110, name: 'an-Nasr', verses: 3, reason: 'Bedingungssatz (idha), Imperativ, Masdar' },
    { surah: 109, name: 'al-Kafirun', verses: 6, reason: 'Negation, Relativsatz, Wiederholung' },
    { surah: 105, name: 'al-Fil', verses: 5, reason: 'Fragepartikel, Relativsatz, Verbalkette' },
  ]},
  { phase: 'Mittelstufe — Längere Suren mit komplexerer Syntax', surahs: [
    { surah: 96, name: 'al-Alaq', verses: 19, reason: 'Imperativ, Relativsätze, Bedingung, kurze Verse' },
    { surah: 91, name: 'ash-Shams', verses: 15, reason: 'Schwursatz-Kette, Saja-Struktur, Relativsatz' },
    { surah: 55, name: 'ar-Rahman', verses: 78, reason: 'Refrain-Struktur, Dual, Vergleiche, Rhetorik' },
    { surah: 36, name: 'Ya-Sin', verses: 83, reason: 'Huruf Muqattaat, narrative Struktur, Gleichnisse' },
    { surah: 67, name: 'al-Mulk', verses: 30, reason: 'Bedingung, Schwur, Fragen, komplexe Syntax' },
  ]},
  { phase: 'Fortgeschritten — Lange Suren mit vielschichtiger Syntax', surahs: [
    { surah: 2, name: 'al-Baqara', verses: 286, reason: 'Längste Sure — alle syntaktischen Strukturen vertreten' },
    { surah: 3, name: 'Āl ʿImrān', verses: 200, reason: 'Komplexe Argumentation, verschachtelte Strukturen' },
    { surah: 12, name: 'Yusuf', verses: 111, reason: 'Narrativ — Dialog, Zeitformen, indirekte Rede' },
    { surah: 18, name: 'al-Kahf', verses: 110, reason: 'Vier Narrative, Bedingung, Vergleich, Rhetorik' },
  ]},
]

const AUDIO_DISCLAIMER = `Die Audioaufnahme veranschaulicht die Aussprache der Buchstaben und Wörter im Kontext des Verses.`

// ============================================================
// Helper: get ordered list of audio URLs for a verse (primary + fallbacks)
// ============================================================
function getAudioUrls(surah, ayah) {
  const s = String(surah).padStart(3, '0')
  const a = String(ayah).padStart(3, '0')
  // Put the default reciter first, then all others in config order
  const defaultId = audioConfig.defaultReciter
  const defaultReciter = audioConfig.reciters.find(r => r.id === defaultId)
  const others = audioConfig.reciters.filter(r => r.id !== defaultId)
  const ordered = defaultReciter ? [defaultReciter, ...others] : audioConfig.reciters
  const everyayahSources = ordered.map(r => ({
    url: `https://everyayah.com/data/${r.folder}/${s}${a}.mp3`,
    name: r.name,
    id: r.id,
  }))

  // Alternative domain fallbacks (appended AFTER all everyayah.com sources)
  const alternativeSources = [
    {
      url: `https://audio.qurancdn.com/Husary/mp3/${s}${a}.mp3`,
      name: 'Aussprache A (QuranicAudio.com)',
      id: 'husary_qurancdn_fallback',
    },
    {
      url: `https://verses.quran.com/Husary/mp3/${s}${a}.mp3`,
      name: 'Aussprache A (verses.quran.com)',
      id: 'husary_verses_fallback',
    },
  ]

  return [...everyayahSources, ...alternativeSources]
}

// Helper: get Lane's Lexicon URL for a root (via ejtaal.net Arabic Almanac)
// Lane's Lexicon (Edward William Lane, 1863-1893) is the definitive classical Arabic-English lexicon.
// ejtaal.net hosts the complete scanned Lane's Lexicon pages (~3040 pages), searchable by root.
// The #ll= hash parameter selects Lane's Lexicon specifically within Arabic Almanac.
function getLanesLexiconUrl(rootLetters) {
  const translitMap = {
    '\u0627': 'A', '\u0628': 'b', '\u062A': 't', '\u062B': 'v', '\u062C': 'j',
    '\u062D': 'H', '\u062E': 'x', '\u062F': 'd', '\u0630': '*', '\u0631': 'r',
    '\u0632': 'z', '\u0633': 's', '\u0634': '$', '\u0635': 'S', '\u0636': 'D',
    '\u0637': 'T', '\u0638': 'Z', '\u0639': 'E', '\u063A': 'g', '\u0641': 'f',
    '\u0642': 'q', '\u0643': 'k', '\u0644': 'l', '\u0645': 'm', '\u0646': 'n',
    '\u0647': 'h', '\u0648': 'w', '\u064A': 'y', '\u0621': 'O',
  }
  const translit = rootLetters.map(c => translitMap[c] || c).join('')
  return `https://ejtaal.net/aa/#ll=${translit}`
}

// Helper: get Corpus Quran Dictionary URL for a root (morphological analysis, NOT Lane's)
function getCorpusDictUrl(rootLetters) {
  const translitMap = {
    '\u0627': 'A', '\u0628': 'b', '\u062A': 't', '\u062B': 'v', '\u062C': 'j',
    '\u062D': 'H', '\u062E': 'x', '\u062F': 'd', '\u0630': '*', '\u0631': 'r',
    '\u0632': 'z', '\u0633': 's', '\u0634': '$', '\u0635': 'S', '\u0636': 'D',
    '\u0637': 'T', '\u0638': 'Z', '\u0639': 'E', '\u063A': 'g', '\u0641': 'f',
    '\u0642': 'q', '\u0643': 'k', '\u0644': 'l', '\u0645': 'm', '\u0646': 'n',
    '\u0647': 'h', '\u0648': 'w', '\u064A': 'y', '\u0621': 'O',
  }
  const translit = rootLetters.map(c => translitMap[c] || c).join('')
  return `https://corpus.quran.com/qurandictionary.jsp?q=${translit}`
}

// Helper: is a word a known particle?
function isParticle(word) {
  const clean = cleanArabicText(word).replace(/[\u0640~]/g, '')
  return PARTICLE_LOOKUP.has(clean)
}

// Helper: is a word a known pronoun?
function isPronoun(word) {
  const clean = cleanArabicText(word).replace(/[\u0640~]/g, '')
  return PRONOUN_LOOKUP.has(clean)
}

function getParticleInfo(word) {
  const clean = cleanArabicText(word).replace(/[\u0640~]/g, '')
  return PARTICLE_LOOKUP.get(clean)
}

function getPronounInfo(word) {
  const clean = cleanArabicText(word).replace(/[\u0640~]/g, '')
  return PRONOUN_LOOKUP.get(clean)
}

// Helper: validate root input
function parseRootInput(input) {
  if (!input || !input.trim()) return null
  const trimmed = input.trim()
  // If contains Arabic letters, extract them
  if (containsArabic(trimmed)) {
    const letters = [...cleanArabicText(trimmed)].filter(c => ROOT_CONSONANTS.has(c))
    return letters
  }
  // Otherwise treat as transliteration
  const arabic = transliterateToArabic(trimmed.replace(/-/g, ''))
  const letters = [...cleanArabicText(arabic)].filter(c => ROOT_CONSONANTS.has(c))
  return letters
}

function isPlausibleRoot(letters) {
  return letters && letters.length >= 3 && letters.length <= 4 &&
    letters.every(l => ROOT_CONSONANTS.has(l))
}

function isKnownRoot(letters) {
  if (!letters || letters.length < 3) return false
  const key = letters.join(' ')
  return KNOWN_ROOTS.has(key)
}

// Get ambiguity entry for a word at a specific location
// Falls back to consonantal lookup if no location-based match (Stage 2 auto-detection)
function getAmbiguity(surah, ayah, wordIdx, word) {
  // word positions in ambiguities are 1-indexed
  const key = `${surah}:${ayah}:${wordIdx + 1}`
  const byLocation = AMBIGUITY_LOOKUP.get(key)
  if (byLocation) return byLocation

  // Stage 2 fallback: check consonantal form against auto-detected ambiguities
  if (word) {
    const consonantal = cleanArabicText(word)
    const byConsonantal = CONSONANTAL_AMBIGUITY_LOOKUP.get(consonantal)
    if (byConsonantal) return byConsonantal
  }

  return undefined
}

// ============================================================
// STYLES (inline for single-file module)
// ============================================================

const S = {
  container: {
    display: 'flex',
    gap: '0',
    height: '100%',
    minHeight: 'calc(100vh - 120px)',
  },
  // Right side: Quran text
  textPanel: {
    flex: '1 1 55%',
    minWidth: '340px',
    display: 'flex',
    flexDirection: 'column',
    borderLeft: '1px solid var(--border)',
    overflow: 'hidden',
    order: 2,
  },
  textScrollArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 20px',
  },
  // Left side: Work area
  workPanel: {
    flex: '1 1 45%',
    minWidth: '320px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    order: 1,
  },
  workScrollArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
  },
  // Surah/verse nav
  navBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '10px 16px',
    background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border)',
    flexWrap: 'wrap',
  },
  navGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  navBtn: {
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    fontSize: '0.75rem',
    border: '1px solid var(--border)',
    cursor: 'pointer',
  },
  navInput: {
    width: '54px',
    textAlign: 'center',
    padding: '3px 6px',
    fontSize: '0.85rem',
  },
  navLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  // Verse line
  verseLine: (isActive) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '10px 8px',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    transition: 'background 0.2s, opacity 0.2s',
    background: isActive ? 'rgba(45, 212, 191, 0.06)' : 'transparent',
    opacity: isActive ? 1 : 0.45,
  }),
  verseNum: {
    flexShrink: 0,
    width: '42px',
    textAlign: 'right',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    paddingTop: '10px',
    fontFamily: 'var(--font-mono)',
    userSelect: 'none',
  },
  verseText: {
    flex: 1,
    fontFamily: 'var(--font-arabic)',
    direction: 'rtl',
    textAlign: 'right',
    fontSize: 'var(--arabic-size-lg)',
    lineHeight: 'var(--arabic-line-height)',
    color: 'var(--arabic-text)',
  },
  // Word spans
  word: (state) => {
    const base = {
      cursor: 'pointer',
      borderRadius: '4px',
      padding: '2px 2px',
      transition: 'background 0.15s, color 0.15s, outline 0.15s',
      display: 'inline',
    }
    if (state === 'particle') return { ...base, background: 'var(--correct-bg)', color: 'var(--correct)' }
    if (state === 'pronoun') return { ...base, background: 'var(--ambiguous-bg)', color: 'var(--ambiguous)' }
    if (state === 'missed-particle') return { ...base, background: 'var(--incorrect-bg)', outline: '1px dashed var(--correct)' }
    if (state === 'missed-pronoun') return { ...base, background: 'var(--incorrect-bg)', outline: '1px dashed var(--ambiguous)' }
    if (state === 'wrong-mark') return { ...base, background: 'var(--incorrect-bg)', color: 'var(--incorrect)' }
    if (state === 'active') return { ...base, background: 'var(--accent-teal-bg)', color: 'var(--accent-teal)', outline: '1px solid var(--accent-teal)', outlineOffset: '1px' }
    if (state === 'done') return { ...base, background: 'var(--correct-bg)', color: 'var(--correct)', opacity: 0.7 }
    if (state === 'remaining') return { ...base, background: 'var(--accent-gold-bg)', opacity: 0.6 }
    return base
  },
  // Card
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '16px',
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: 'var(--accent-teal)',
    marginBottom: '12px',
  },
  // Step indicator
  stepBadge: (active) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    fontSize: '0.8rem',
    fontWeight: 600,
    background: active ? 'var(--accent-teal)' : 'var(--bg-input)',
    color: active ? '#fff' : 'var(--text-muted)',
    marginRight: '8px',
    flexShrink: 0,
  }),
  stepRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  // Buttons
  btn: (variant) => {
    const base = {
      padding: '8px 16px',
      borderRadius: 'var(--radius)',
      fontSize: '0.85rem',
      fontWeight: 500,
      cursor: 'pointer',
      border: '1px solid var(--border)',
      transition: 'all 0.2s',
    }
    if (variant === 'primary') return { ...base, background: 'var(--accent-teal)', color: '#fff', borderColor: 'var(--accent-teal)' }
    if (variant === 'secondary') return { ...base, background: 'var(--bg-input)', color: 'var(--text-primary)' }
    if (variant === 'gold') return { ...base, background: 'var(--accent-gold-bg)', color: 'var(--accent-gold)', borderColor: 'var(--accent-gold)' }
    if (variant === 'danger') return { ...base, background: 'var(--incorrect-bg)', color: 'var(--incorrect)', borderColor: 'var(--incorrect)' }
    if (variant === 'small') return { ...base, padding: '4px 10px', fontSize: '0.78rem' }
    return base
  },
  // Feedback
  feedback: (type) => ({
    padding: '10px 14px',
    borderRadius: 'var(--radius)',
    fontSize: '0.85rem',
    marginTop: '8px',
    marginBottom: '8px',
    background: type === 'correct' ? 'var(--correct-bg)' : type === 'error' ? 'var(--incorrect-bg)' : type === 'ambiguous' ? 'var(--ambiguous-bg)' : type === 'info' ? 'var(--accent-gold-bg, #fff8e1)' : 'var(--bg-input)',
    color: type === 'correct' ? 'var(--correct)' : type === 'error' ? 'var(--incorrect)' : type === 'ambiguous' ? 'var(--ambiguous)' : type === 'info' ? 'var(--accent-gold, #b8860b)' : 'var(--text-primary)',
    border: `1px solid ${type === 'correct' ? 'var(--correct)' : type === 'error' ? 'var(--incorrect)' : type === 'ambiguous' ? 'var(--ambiguous)' : type === 'info' ? 'var(--accent-gold, #b8860b)' : 'var(--border)'}`,
  }),
  // Label
  label: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    display: 'block',
    marginBottom: '4px',
  },
  select: {
    width: '100%',
    padding: '6px 10px',
    fontSize: '0.85rem',
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    marginBottom: '10px',
  },
  // Arabic display for selected word
  arabicBig: {
    textAlign: 'center',
    padding: '14px',
    background: 'var(--bg-input)',
    borderRadius: 'var(--radius)',
    marginBottom: '14px',
  },
  // Progress bar
  progressBar: (_pct) => ({
    height: '6px',
    borderRadius: '3px',
    background: 'var(--bg-input)',
    overflow: 'hidden',
    marginTop: '6px',
    marginBottom: '6px',
    position: 'relative',
  }),
  progressFill: (pct) => ({
    height: '100%',
    width: `${Math.min(100, Math.max(0, pct))}%`,
    background: 'var(--accent-teal)',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  }),
  // Quick nav chips
  chip: (active) => ({
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '0.78rem',
    cursor: 'pointer',
    border: '1px solid ' + (active ? 'var(--accent-teal)' : 'var(--border)'),
    background: active ? 'var(--accent-teal-bg)' : 'var(--bg-input)',
    color: active ? 'var(--accent-teal)' : 'var(--text-secondary)',
  }),
  flexRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  muted: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  link: {
    color: 'var(--accent-teal)',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: '0.85rem',
  },
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

/** Step 1: Mark particles and pronouns */
function Step1ParticleMarking({ words, onComplete, surah, verse }) {
  const [markedIndices, setMarkedIndices] = useState(new Set())
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState(null)

  // Determine ground truth
  const groundTruth = useMemo(() => {
    const particles = new Set()
    const pronouns = new Set()
    words.forEach((w, i) => {
      if (isParticle(w)) particles.add(i)
      if (isPronoun(w)) pronouns.add(i)
    })
    return { particles, pronouns, all: new Set([...particles, ...pronouns]) }
  }, [words])

  const toggleMark = useCallback((idx) => {
    if (submitted) return
    setMarkedIndices(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }, [submitted])

  const handleSubmit = useCallback(() => {
    const correct = []
    const missed = []
    const wrong = []

    groundTruth.all.forEach(idx => {
      if (markedIndices.has(idx)) correct.push(idx)
      else missed.push(idx)
    })
    markedIndices.forEach(idx => {
      if (!groundTruth.all.has(idx)) wrong.push(idx)
    })

    setResults({ correct, missed, wrong })
    setSubmitted(true)
  }, [markedIndices, groundTruth])

  // Detect Huruf Muqattaʿat (INL = initial letters) among non-particle words
  const inlIndices = useMemo(() => {
    const inl = new Set()
    words.forEach((w, i) => {
      if (groundTruth.all.has(i)) return
      const entry = getCorpusEntryAligned(surah, verse, i, w, words)
      if (entry && entry.p === 'INL') inl.add(i)
    })
    return inl
  }, [words, groundTruth, surah, verse])

  const handleContinue = useCallback(() => {
    // words to analyze = those NOT in groundTruth.all and NOT Huruf Muqattaʿat (INL)
    const remainingIndices = words.map((_, i) => i).filter(i => !groundTruth.all.has(i) && !inlIndices.has(i))
    onComplete({
      particleIndices: groundTruth.particles,
      pronounIndices: groundTruth.pronouns,
      inlIndices,
      remainingIndices,
      step1Score: results ? results.correct.length / Math.max(1, groundTruth.all.size) : 0,
    })
  }, [words, groundTruth, inlIndices, results, onComplete])

  const getWordState = (idx) => {
    if (!submitted) {
      return markedIndices.has(idx) ? 'particle' : 'default'
    }
    if (results.correct.includes(idx)) {
      return groundTruth.particles.has(idx) ? 'particle' : 'pronoun'
    }
    if (results.missed.includes(idx)) {
      return groundTruth.particles.has(idx) ? 'missed-particle' : 'missed-pronoun'
    }
    if (results.wrong.includes(idx)) return 'wrong-mark'
    return 'default'
  }

  return (
    <div style={S.card}>
      <div style={S.cardTitle}>Schritt 1: Partikeln und Pronomen markieren</div>
      <p style={{ ...S.muted, marginBottom: '8px' }}>
        Klicke auf alle Wörter, die du als Partikeln oder Pronomen erkennst.
        So legst du die Satzstruktur frei, bevor du die Vollwörter analysierst.
      </p>
      <p style={{ ...S.muted, fontSize: '0.75rem', marginBottom: '12px', fontStyle: 'italic' }}>
        Tipp: Nutze die Grammatik-Referenz (Tab "Partikeln") für die vollständige Liste.
        Falls du die Partikeln noch nicht gelernt hast: Modul 2 → Syntax-Track → Lektionen 4.1-4.7.
      </p>

      {/* Word display for marking */}
      <div style={{ ...S.arabicBig, direction: 'rtl', textAlign: 'right', display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '6px' }}>
        {words.map((word, i) => (
          <span
            key={i}
            style={{
              ...S.word(getWordState(i)),
              fontFamily: 'var(--font-arabic)',
              fontSize: 'var(--arabic-size)',
              lineHeight: 'var(--arabic-line-height)',
            }}
            onClick={() => toggleMark(i)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMark(i) } }}
          >
            {word}
          </span>
        ))}
      </div>

      {/* Results feedback */}
      {submitted && results && (
        <div>
          {results.correct.length > 0 && (
            <div style={S.feedback('correct')}>
              Richtig erkannt: {results.correct.length} von {groundTruth.all.size}
              {results.correct.map(idx => {
                const info = getParticleInfo(words[idx]) || getPronounInfo(words[idx])
                return info ? (
                  <div key={idx} style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                    <span className="arabic" style={{ fontSize: '1.1rem' }}>{words[idx]}</span>
                    {' '}&mdash; {info.german || info.transliteration || ''}
                    {info.function ? ` (${info.function.substring(0, 60)}...)` : ''}
                  </div>
                ) : null
              })}
            </div>
          )}
          {results.missed.length > 0 && (
            <div style={S.feedback('error')}>
              Übersehen ({results.missed.length}):
              {results.missed.map(idx => {
                const info = getParticleInfo(words[idx]) || getPronounInfo(words[idx])
                return (
                  <div key={idx} style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                    <span className="arabic" style={{ fontSize: '1.1rem' }}>{words[idx]}</span>
                    {info ? ` \u2014 ${info.german || ''} (${info.category || ''})` : ''}
                  </div>
                )
              })}
            </div>
          )}
          {results.wrong.length > 0 && (
            <div style={S.feedback('error')}>
              Falsch markiert ({results.wrong.length}):
              {results.wrong.map(idx => (
                <div key={idx} style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                  <span className="arabic" style={{ fontSize: '1.1rem' }}>{words[idx]}</span>
                  {' '}&mdash; dieses Wort ist keine Partikel / kein Pronomen
                </div>
              ))}
            </div>
          )}
          {results.correct.length === groundTruth.all.size && results.wrong.length === 0 && (
            <div style={S.feedback('correct')}>Perfekt! Alle Partikeln und Pronomen korrekt erkannt.</div>
          )}
          {inlIndices.size > 0 && (
            <div style={{ ...S.feedback('correct'), marginTop: '8px', borderColor: 'var(--accent-gold)', background: 'var(--accent-gold-bg)' }}>
              {'\u0126ur\u016bf Muqa\u1E6D\u1E6Da\u02BFat erkannt \u2014 keine Wurzelanalyse erforderlich:'}
              {[...inlIndices].map(idx => (
                <span key={idx} className="arabic" style={{ fontSize: '1.1rem', marginInlineStart: '8px' }}>{words[idx]}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ ...S.flexRow, marginTop: '12px', justifyContent: 'flex-end' }}>
        {!submitted ? (
          <button style={S.btn('primary')} onClick={handleSubmit}>
            Prüfen
          </button>
        ) : (
          <button style={S.btn('primary')} onClick={handleContinue}>
            Weiter zu Schritt 2
          </button>
        )}
      </div>
    </div>
  )
}

/** Lernmodus display for a word */
function LernmodusPanel({ word, surah, verse, wordIndex, allWordsInVerse }) {
  const candidate = useMemo(() => extractRootCandidate(word), [word])
  const ambiguity = useMemo(() => getAmbiguity(surah, verse, wordIndex, word), [surah, verse, wordIndex, word])
  const corpusEntry = useMemo(() => getCorpusEntryAligned(surah, verse, wordIndex, word, allWordsInVerse || []), [surah, verse, wordIndex, word, allWordsInVerse])

  const rootLetters = corpusEntry?.r ? corpusEntry.r.split(' ') : (candidate.letters || [])
  const lanesUrl = rootLetters.length >= 2 ? getLanesLexiconUrl(rootLetters) : null
  const corpusUrl = rootLetters.length >= 2 ? getCorpusDictUrl(rootLetters) : null

  return (
    <div style={{ ...S.card, border: '1px solid var(--accent-gold)', background: 'var(--accent-gold-bg)' }}>
      <div style={{ ...S.cardTitle, color: 'var(--accent-gold)' }}>Lernmodus: Erklärung</div>

      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.7 }}>
        <p style={{ marginBottom: '8px' }}>
          Die Konsonanten dieses Wortes sind: <span className="arabic" style={{ fontSize: '1.2rem', color: 'var(--accent-gold)' }}>
            {[...cleanArabicText(word)].filter(c => ROOT_CONSONANTS.has(c)).join(' ')}
          </span>
        </p>

        {candidate.prefix && (
          <p style={{ marginBottom: '8px' }}>
            Wenn wir das Präfix <span className="arabic" style={{ color: 'var(--ambiguous)' }}>{candidate.prefix}</span> abstreifen
            {candidate.suffix ? (<> und das Suffix <span className="arabic" style={{ color: 'var(--ambiguous)' }}>{candidate.suffix}</span></>) : null}
            , bleiben die Wurzelkonsonanten:
            <span className="arabic" style={{ fontSize: '1.3rem', color: 'var(--correct)', marginLeft: '6px' }}>
              {candidate.formatted || rootLetters.join('-')}
            </span>
          </p>
        )}

        {!candidate.prefix && !candidate.suffix && (
          <p style={{ marginBottom: '8px' }}>
            Dieses Wort hat kein erkennbares Präfix oder Suffix. Die möglichen Wurzelkonsonanten sind:
            <span className="arabic" style={{ fontSize: '1.3rem', color: 'var(--correct)', marginLeft: '6px' }}>
              {candidate.formatted || rootLetters.join('-')}
            </span>
          </p>
        )}

        {lanesUrl && (
          <p style={{ marginBottom: '8px' }}>
            Nachschlagen:{' '}
            <a href={lanesUrl} target="_blank" rel="noopener noreferrer" style={S.link}>
              Lane&apos;s Lexikon öffnen
            </a>
            {' | '}
            <a href={corpusUrl} target="_blank" rel="noopener noreferrer" style={S.link}>
              Corpus-Wörterbuch
            </a>
            {' | '}
            <span style={{ ...S.link, opacity: 0.6 }} title="Querverweis im Hauptmodus verfügbar">
              Querverweis (alle Vorkommen)
            </span>
          </p>
        )}

        {/* Offline root meaning (fallback for when Lane's is unavailable) */}
        {rootLetters.length >= 2 && (() => {
          const rootKey = rootLetters.join(' ')
          const offlineMeaning = OFFLINE_ROOT_MEANINGS.get(rootKey)
          if (!offlineMeaning) return null
          return (
            <div style={{ marginBottom: '8px', padding: '6px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-gold-bg)', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>Grundbedeutung:</span>{' '}
              <span style={{ color: 'var(--text-primary)' }}>{offlineMeaning.meaning}</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
                (#{offlineMeaning.rank}, {offlineMeaning.count}x im Quran)
              </span>
            </div>
          )
        })()}

        {/* Morphology tables lookup for pattern info */}
        {morphologyTables.verbForms && (
          <p style={{ marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Prüfe: Entspricht das Wortmuster einer der Formen I-X?
            Das Präfix-/Suffix-Muster kann auf die Form hinweisen.
          </p>
        )}

        {/* Ambiguity notice */}
        {ambiguity && ambiguity.options && ambiguity.options.length > 1 && (
          <div style={{ marginTop: '10px', padding: '10px', background: 'var(--ambiguous-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--ambiguous)' }}>
            <p style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--ambiguous)' }}>
              Dieses Wort hat mehrere mögliche Lesungen:
            </p>
            {ambiguity.options.map((opt, i) => (
              <div key={i} style={{ marginBottom: '6px', fontSize: '0.83rem' }}>
                <span className="arabic" style={{ fontSize: '1.1rem', color: 'var(--ambiguous)' }}>{opt.vocalized}</span>
                {' '}&mdash; {opt.meaning_de || opt.meaning_en}
                {opt.morphology ? <span style={{ color: 'var(--text-muted)' }}> ({opt.morphology})</span> : null}
              </div>
            ))}
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Alle genannten Optionen sind grammatisch gültig.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/** Step 2: Word-by-word analysis for a single word */
function WordAnalysisPanel({
  word, wordIndex, surah, verse, onComplete, phase,
  _errorTracker, onErrorTrack, allWordsInVerse,
}) {
  const [mode, setMode] = useState('test') // 'test' | 'learn'
  const [subStep, setSubStep] = useState('root') // root | form | vocalization | meaning | syntax
  const [keyboardVisible, setKeyboardVisible] = useState(false)

  // Inputs
  const [rootInput, setRootInput] = useState('')
  const [wordType, setWordType] = useState('')
  const [verbForm, setVerbForm] = useState('')
  const [tense, setTense] = useState('')
  const [mood, setMood] = useState('')
  const [person, setPerson] = useState('')
  const [voice, setVoice] = useState('')
  const [vocalizationInput, setVocalizationInput] = useState('')
  const [meaningInput, setMeaningInput] = useState('')
  const [syntaxRole, setSyntaxRole] = useState('')

  // Feedback state
  const [rootFeedback, setRootFeedback] = useState(null)
  const [formFeedback, setFormFeedback] = useState(null)
  const [vocFeedback, setVocFeedback] = useState(null)
  const [rootVerified, setRootVerified] = useState(false)
  const [formVerified, setFormVerified] = useState(false)
  const [vocVerified, setVocVerified] = useState(false)
  const [firstTryCorrect, setFirstTryCorrect] = useState({ root: true, form: true, voc: true })

  // Stage 3: User flagging state
  const [showFlagPrompt, setShowFlagPrompt] = useState(false)
  const [flaggedAlternative, setFlaggedAlternative] = useState(null)
  const [flagSaved, setFlagSaved] = useState(false)
  const [userFlaggedOptions, setUserFlaggedOptions] = useState(null)

  // Derived
  const candidate = useMemo(() => extractRootCandidate(word), [word])
  const ambiguity = useMemo(() => getAmbiguity(surah, verse, wordIndex, word), [surah, verse, wordIndex, word])
  const rootLetters = candidate.letters || []
  const lanesUrl = rootLetters.length >= 2 ? getLanesLexiconUrl(rootLetters) : null

  // Stage 3: Load user-flagged alternatives for this word's consonantal form
  useEffect(() => {
    const consonantal = cleanArabicText(word)
    loadUserAmbiguity(consonantal).then(data => {
      if (data && data.alternatives && data.alternatives.length > 0) {
        setUserFlaggedOptions(data.alternatives)
      }
    })
  }, [word])

  // ---- Root verification ----
  const handleCheckRoot = () => {
    const parsed = parseRootInput(rootInput)
    if (!parsed || parsed.length < 3) {
      setRootFeedback({ type: 'error', msg: 'Bitte gib mindestens 3 Wurzelkonsonanten ein.' })
      return
    }

    if (!isPlausibleRoot(parsed)) {
      setRootFeedback({ type: 'error', msg: 'Bitte gib gültige arabische Konsonanten ein (3-4 Buchstaben).' })
      return
    }

    // Check against corpus morphology DB first (primary source)
    const corpusEntry = getCorpusEntryAligned(surah, verse, wordIndex, word, allWordsInVerse || [])
    if (corpusEntry && corpusEntry.r) {
      const inputKey = parsed.join(' ')
      if (corpusEntry.r.trim() === inputKey) {
        setRootFeedback({ type: 'correct', msg: 'Richtig! Diese Wurzel ist durch die Corpus-Datenbank bestätigt.' })
        setRootVerified(true)
        setSubStep('form')
        return
      }
    }

    // Check against ambiguity DB (for words with multiple valid analyses)
    if (ambiguity && ambiguity.options) {
      const inputKey = parsed.join(' ')
      const match = ambiguity.options.find(opt => {
        if (!opt.root) return false
        return opt.root.trim() === inputKey
      })
      if (match) {
        setRootFeedback({ type: 'correct', msg: 'Richtig! Diese Wurzel ist in unserer Datenbank bestätigt.' })
        setRootVerified(true)
        setSubStep('form')
        return
      }
    }

    // Check against candidate extraction
    const candidateKey = rootLetters.join(' ')
    const inputKey = parsed.join(' ')
    if (candidateKey === inputKey) {
      setRootFeedback({ type: 'correct', msg: 'Richtig! Diese Wurzel stimmt mit unserer Analyse überein.' })
      setRootVerified(true)
      setSubStep('form')
      return
    }

    // Check against known roots DB
    if (isKnownRoot(parsed)) {
      // Plausible and known but different from our extraction - could be right
      setRootFeedback({
        type: 'ambiguous',
        msg: `Diese Wurzel (${parsed.join('-')}) ist in unserer Datenbank vorhanden, aber unsere automatische Analyse dieses Wortes ergibt ${rootLetters.join('-')}. Beides ist möglich. Prüfe in Lane's Lexikon.`
      })
      setRootVerified(true)
      setSubStep('form')
      return
    }

    // Check against user-flagged alternatives (Stage 3)
    if (userFlaggedOptions) {
      const userMatch = userFlaggedOptions.find(alt => {
        if (!alt.root) return false
        return alt.root.trim() === inputKey
      })
      if (userMatch) {
        setRootFeedback({
          type: 'ambiguous',
          msg: `Diese Wurzel (${parsed.join('-')}) wurde von dir oder einem anderen Lernenden als Alternative vorgeschlagen. Prüfe in Lane's Lexikon.`,
        })
        setRootVerified(true)
        setSubStep('form')
        return
      }
    }

    // Plausible but not in DB - offer Stage 3 flagging
    if (isPlausibleRoot(parsed)) {
      setFirstTryCorrect(prev => ({ ...prev, root: false }))
      if (onErrorTrack) onErrorTrack('root', parsed.join('-'))
      setFlaggedAlternative({
        root: inputKey,
        rootFormatted: parsed.join('-'),
        word,
        surah,
        verse,
        wordIndex,
      })
      setShowFlagPrompt(true)
      setRootFeedback({
        type: 'info',
        msg: `Diese Wurzel ist nicht in unserer Datenbank. Das kann bedeuten: (a) Deine Extraktion ist fehlerhaft \u2014 prüfe nochmal. (b) Unsere Datenbank hat an dieser Stelle eine andere Zuordnung. Öffne Lane\u2019s Lexikon und prüfe selbst.`
      })
      // Do NOT mark as verified yet - let user try again or proceed
      return
    }

    setFirstTryCorrect(prev => ({ ...prev, root: false }))
    setRootFeedback({ type: 'error', msg: 'Prüfe nochmal. Die eingegebenen Konsonanten ergeben keine gültige Wurzel.' })
  }

  const handleForceAcceptRoot = useCallback(() => {
    setRootVerified(true)
    setSubStep('form')
    setShowFlagPrompt(false)
  }, [])

  // Stage 3: Save user-flagged alternative analysis
  const handleFlagAlternative = useCallback(async () => {
    if (!flaggedAlternative) return
    const consonantal = cleanArabicText(word)
    await saveUserAmbiguity(consonantal, {
      root: flaggedAlternative.root,
      vocalized: '',
      morphology: '',
      meaning_de: '',
      meaning_en: '',
      source: 'user_flagged',
      context: {
        surah: flaggedAlternative.surah,
        verse: flaggedAlternative.verse,
        wordIndex: flaggedAlternative.wordIndex,
        word: flaggedAlternative.word,
      },
    })
    setFlagSaved(true)
    setShowFlagPrompt(false)
    // Also update the local userFlaggedOptions
    setUserFlaggedOptions(prev => [
      ...(prev || []),
      { root: flaggedAlternative.root, flaggedAt: new Date().toISOString() },
    ])
  }, [flaggedAlternative, word])

  const handleDismissFlag = useCallback(() => {
    setShowFlagPrompt(false)
    setFlaggedAlternative(null)
  }, [])

  // ---- Form verification ----
  const handleCheckForm = useCallback(() => {
    if (!wordType) {
      setFormFeedback({ type: 'error', msg: 'Bitte wähle den Worttyp.' })
      return
    }

    // Check against ambiguity data
    if (ambiguity && ambiguity.options) {
      const matches = ambiguity.options.filter(opt => {
        if (wordType === 'verb' && opt.pos === 'V') return true
        if (wordType === 'noun' && opt.pos === 'N') return true
        if (wordType === 'adjective' && opt.pos === 'ADJ') return true
        if (wordType === 'participle' && (opt.form?.includes('participle') || opt.pos === 'N')) return true
        if (wordType === 'masdar' && (opt.form?.includes('masdar') || opt.form?.includes('verbal noun'))) return true
        return false
      })
      if (matches.length > 0) {
        setFormFeedback({
          type: 'correct',
          msg: 'Deine Bestimmung stimmt mit mindestens einer möglichen Analyse überein.',
          matches,
        })
        setFormVerified(true)
        setSubStep('vocalization')
        return
      }

      // No match — track specific errors for adaptive hints
      setFirstTryCorrect(prev => ({ ...prev, form: false }))
      if (onErrorTrack && wordType === 'verb') {
        if (verbForm) onErrorTrack('form', verbForm)
        if (tense) onErrorTrack('tense', tense)
        if (mood) onErrorTrack('mood', mood)
        if (voice === 'passive') onErrorTrack('voice', 'passive')
      }
      if (onErrorTrack && (wordType === 'noun' || wordType === 'adjective' || wordType === 'participle' || wordType === 'masdar')) {
        onErrorTrack('noun_pattern', wordType)
      }
    }

    // Basic acceptance - we cannot fully verify without complete morphology matching
    setFormFeedback({
      type: 'info',
      msg: 'Deine Angabe wurde gespeichert. Eine vollständige Verifikation gegen alle Formen ist nicht möglich. Prüfe in Lane\'s Lexikon.',
    })
    setFormVerified(true)
    setSubStep('vocalization')
  }, [wordType, verbForm, tense, mood, voice, ambiguity, onErrorTrack])

  // ---- Vocalization verification ----
  const handleCheckVocalization = useCallback(() => {
    if (!vocalizationInput.trim()) {
      setVocFeedback({ type: 'error', msg: 'Bitte gib eine Vokalisierung ein.' })
      return
    }

    // Check against ambiguity options
    if (ambiguity && ambiguity.options) {
      const inputClean = vocalizationInput.trim()
      const matches = ambiguity.options.filter(opt =>
        opt.vocalized && (
          opt.vocalized === inputClean ||
          stripVowelMarks(opt.vocalized) === stripVowelMarks(inputClean)
        )
      )
      if (matches.length > 0) {
        setVocFeedback({ type: 'correct', msg: 'Deine Vokalisierung stimmt überein!' })
        setVocVerified(true)
        setSubStep('meaning')
        return
      }

      // Show all valid options for ambiguous words
      if (ambiguity.options.length > 1) {
        setVocFeedback({
          type: 'ambiguous',
          msg: 'Mögliche Vokalisierungen für dieses Wort:',
          options: ambiguity.options,
        })
        setVocVerified(true)
        setSubStep('meaning')
        return
      }
    }

    // Accept and move on
    setVocFeedback({ type: 'info', msg: 'Vokalisierung gespeichert. Prüfe gegen Lane\'s Lexikon.' })
    setVocVerified(true)
    setSubStep('meaning')
  }, [vocalizationInput, ambiguity])

  // ---- Complete word ----
  const handleCompleteWord = () => {
    const wordIsAmbiguous = !!(ambiguity && ambiguity.options && ambiguity.options.length >= 2)
    const analysisData = {
      word,
      surah,
      verse,
      wordIndex,
      rootInput: rootInput,
      rootLetters: parseRootInput(rootInput),
      wordType,
      verbForm: wordType === 'verb' ? verbForm : null,
      tense: wordType === 'verb' ? tense : null,
      mood: wordType === 'verb' ? mood : null,
      person: wordType === 'verb' ? person : null,
      voice: wordType === 'verb' ? voice : null,
      vocalization: vocalizationInput,
      meaning: meaningInput,
      syntaxRole: phase >= 3 ? syntaxRole : null,
      usedLernmodus: mode === 'learn',
      firstTryCorrect,
      isAmbiguous: wordIsAmbiguous,
      ambiguityOptions: wordIsAmbiguous ? ambiguity.options : null,
      ambiguityCategory: wordIsAmbiguous ? ambiguity.category : null,
    }

    // Save to storage
    const wordKey = `${surah}:${verse}:${wordIndex}`
    saveAnalyzedWord(wordKey, analysisData)

    // Save root to root notebook
    const parsed = parseRootInput(rootInput)
    if (parsed && parsed.length >= 3) {
      const rootKey = parsed.join('-')
      saveRoot(rootKey, {
        root: parsed,
        rootFormatted: parsed.join('-'),
        encounters: [{ surah, verse, wordIndex, word }],
      })
    }

    // Add SRS card — include ambiguity metadata so Module 5 can show all options
    const isAmbiguous = !!(ambiguity && ambiguity.options && ambiguity.options.length >= 2)
    saveSRSCard(`${surah}:${verse}:${wordIndex}`, {
      type: 'word_analysis',
      word,
      surah,
      verse,
      wordIndex,
      rootInput,
      wordType,
      isAmbiguous,
      ambiguityOptions: isAmbiguous ? ambiguity.options : null,
      ambiguityCategory: isAmbiguous ? ambiguity.category : null,
      nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // +1 day
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
    })

    onComplete(analysisData)
  }

  // ---- Switch to Lernmodus ----
  if (mode === 'learn') {
    return (
      <div>
        <LernmodusPanel word={word} surah={surah} verse={verse} wordIndex={wordIndex} allWordsInVerse={allWordsInVerse} />
        <div style={{ ...S.flexRow, justifyContent: 'space-between', marginTop: '8px' }}>
          <button style={S.btn('secondary')} onClick={() => setMode('test')}>
            Zurück zum Prüfmodus
          </button>
          <button style={S.btn('primary')} onClick={handleCompleteWord}>
            Wort abschließen (Lernmodus)
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Word display */}
      <div style={S.arabicBig}>
        <div className="arabic" style={{ fontSize: 'var(--arabic-size-lg)', color: 'var(--accent-gold)', marginBottom: '4px' }}>
          {word}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Sure {surah}, Vers {verse}, Wort {wordIndex + 1}
        </div>
      </div>

      {/* Switch to Lernmodus button */}
      <div style={{ textAlign: 'right', marginBottom: '10px' }}>
        <button style={S.btn('gold')} onClick={() => setMode('learn')}>
          Erklär mir dieses Wort
        </button>
      </div>

      {/* Sub-step: Root */}
      <div style={{ ...S.card, opacity: subStep === 'root' || rootVerified ? 1 : 0.5, pointerEvents: subStep === 'root' ? 'auto' : (rootVerified ? 'auto' : 'none') }}>
        <div style={S.stepRow}>
          <span style={S.stepBadge(subStep === 'root')}>a</span>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Wurzelbestimmung</span>
          {rootVerified && <span style={{ color: 'var(--correct)', fontSize: '0.85rem', marginLeft: 'auto' }}>{'\u2713'}</span>}
        </div>

        {!rootVerified && (
          <>
            <div style={{ marginBottom: '8px' }}>
              <label style={S.label}>Wurzelkonsonanten (3-4 Buchstaben, arabisch oder Transliteration):</label>
              <input
                type="text"
                className="arabic-input"
                value={rootInput}
                onChange={(e) => { setRootInput(e.target.value); setRootFeedback(null) }}
                placeholder="z.B. \u0643-\u062A-\u0628 oder k-t-b"
                style={{ width: '100%' }}
                dir="rtl"
              />
            </div>

            <ArabicKeyboard
              onInput={(char) => setRootInput(prev => prev + char)}
              onBackspace={() => setRootInput(prev => prev.slice(0, -1))}
              onClear={() => setRootInput('')}
              visible={keyboardVisible}
              onToggle={() => setKeyboardVisible(!keyboardVisible)}
            />

            {rootFeedback && (
              <div style={S.feedback(rootFeedback.type)}>
                {rootFeedback.msg}
              </div>
            )}

            {/* Stage 3: Flagging prompt — "Möchtest du sie als Alternative vorschlagen?" */}
            {showFlagPrompt && flaggedAlternative && !flagSaved && (
              <div style={{ ...S.feedback('ambiguous'), marginTop: '8px' }}>
                <p style={{ fontWeight: 600, marginBottom: '6px' }}>
                  Möchtest du diese Wurzel ({flaggedAlternative.rootFormatted}) als Alternative vorschlagen?
                </p>
                <p style={{ fontSize: '0.8rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  Wenn du glaubst, dass diese Analyse korrekt sein könnte, speichern wir sie.
                  Sie wird künftig als Option angezeigt, wenn dasselbe Wort wieder vorkommt.
                </p>
                <div style={{ ...S.flexRow, gap: '8px' }}>
                  <button style={S.btn('gold')} onClick={handleFlagAlternative}>
                    Ja, als Alternative speichern
                  </button>
                  <button style={S.btn('secondary')} onClick={handleDismissFlag}>
                    Nein, verwerfen
                  </button>
                </div>
              </div>
            )}
            {flagSaved && (
              <div style={{ ...S.feedback('correct'), marginTop: '8px', fontSize: '0.83rem' }}>
                Alternative gespeichert! Sie wird künftig bei diesem Wort angezeigt.
              </div>
            )}

            {/* Stage 3: Show user-flagged alternatives if any exist */}
            {userFlaggedOptions && userFlaggedOptions.length > 0 && (
              <div style={{ marginTop: '8px', padding: '10px', background: 'var(--ambiguous-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--ambiguous)' }}>
                <p style={{ fontWeight: 600, marginBottom: '4px', fontSize: '0.83rem', color: 'var(--ambiguous)' }}>
                  Von Lernenden vorgeschlagene Alternativen:
                </p>
                {userFlaggedOptions.map((alt, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                    Wurzel: <span className="arabic" style={{ fontSize: '1rem' }}>{alt.root?.replace(/ /g, '-') || '?'}</span>
                    {alt.flaggedAt ? <span style={{ color: 'var(--text-muted)' }}> (gemeldet: {new Date(alt.flaggedAt).toLocaleDateString('de-DE')})</span> : null}
                  </div>
                ))}
              </div>
            )}

            <div style={{ ...S.flexRow, marginTop: '10px', justifyContent: 'space-between' }}>
              <div style={S.flexRow}>
                {lanesUrl && (
                  <a href={lanesUrl} target="_blank" rel="noopener noreferrer" style={S.link}>
                    Lane&apos;s öffnen
                  </a>
                )}
              </div>
              <div style={S.flexRow}>
                {rootFeedback && rootFeedback.type === 'info' && (
                  <button style={S.btn('secondary')} onClick={handleForceAcceptRoot}>
                    Trotzdem weiter
                  </button>
                )}
                <button style={S.btn('primary')} onClick={handleCheckRoot}>
                  Prüfen
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sub-step: Form determination */}
      <div style={{ ...S.card, opacity: subStep === 'form' || formVerified ? 1 : 0.4, pointerEvents: (subStep === 'form' || formVerified) ? 'auto' : 'none' }}>
        <div style={S.stepRow}>
          <span style={S.stepBadge(subStep === 'form')}>b</span>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Formbestimmung</span>
          {formVerified && <span style={{ color: 'var(--correct)', fontSize: '0.85rem', marginLeft: 'auto' }}>{'\u2713'}</span>}
        </div>

        {!formVerified && subStep === 'form' && (
          <>
            <div style={{ marginBottom: '8px' }}>
              <label style={S.label}>Worttyp:</label>
              <select style={S.select} value={wordType} onChange={(e) => setWordType(e.target.value)}>
                <option value="">-- Worttyp wählen --</option>
                {WORD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {wordType === 'verb' && (
              <>
                <div style={{ marginBottom: '8px' }}>
                  <label style={S.label}>Form (I-X):</label>
                  <select style={S.select} value={verbForm} onChange={(e) => setVerbForm(e.target.value)}>
                    <option value="">-- Form wählen --</option>
                    {VERB_FORMS.map(f => {
                      const formData = morphologyTables.verbForms.find(vf => vf.form === f)
                      return (
                        <option key={f} value={f}>
                          Form {f} {formData ? `(${formData.pattern.arabic}) - ${formData.meaningShiftGerman.substring(0, 50)}` : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={S.label}>Tempus:</label>
                  <select style={S.select} value={tense} onChange={(e) => setTense(e.target.value)}>
                    <option value="">-- Tempus wählen --</option>
                    {TENSES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                {tense === 'imperfect' && (
                  <div style={{ marginBottom: '8px' }}>
                    <label style={S.label}>Modus:</label>
                    <select style={S.select} value={mood} onChange={(e) => setMood(e.target.value)}>
                      <option value="">-- Modus wählen --</option>
                      {MOODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                )}
                <div style={{ marginBottom: '8px' }}>
                  <label style={S.label}>Person / Genus / Numerus:</label>
                  <select style={S.select} value={person} onChange={(e) => setPerson(e.target.value)}>
                    <option value="">-- Person wählen --</option>
                    {PERSONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={S.label}>Diathese:</label>
                  <select style={S.select} value={voice} onChange={(e) => setVoice(e.target.value)}>
                    <option value="">-- Diathese wählen --</option>
                    {VOICES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                  </select>
                </div>
              </>
            )}

            {formFeedback && (
              <div style={S.feedback(formFeedback.type)}>
                {formFeedback.msg}
                {formFeedback.matches && formFeedback.matches.length > 0 && (
                  <div style={{ marginTop: '6px' }}>
                    {formFeedback.matches.map((m, i) => (
                      <div key={i} style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                        {m.vocalized && <span className="arabic" style={{ fontSize: '1rem' }}>{m.vocalized}</span>}
                        {m.morphology ? ` \u2014 ${m.morphology}` : ''}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ ...S.flexRow, marginTop: '10px', justifyContent: 'flex-end' }}>
              <button style={S.btn('primary')} onClick={handleCheckForm}>
                Prüfen
              </button>
            </div>
          </>
        )}
      </div>

      {/* Sub-step: Vocalization */}
      <div style={{ ...S.card, opacity: subStep === 'vocalization' || vocVerified ? 1 : 0.4, pointerEvents: (subStep === 'vocalization' || vocVerified) ? 'auto' : 'none' }}>
        <div style={S.stepRow}>
          <span style={S.stepBadge(subStep === 'vocalization')}>c</span>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Vokalisierung</span>
          {vocVerified && <span style={{ color: 'var(--correct)', fontSize: '0.85rem', marginLeft: 'auto' }}>{'\u2713'}</span>}
        </div>

        {!vocVerified && subStep === 'vocalization' && (
          <>
            <div style={{ marginBottom: '8px' }}>
              <label style={S.label}>Deine Vokalisierung (arabisch mit Vokalzeichen oder Transliteration):</label>
              <input
                type="text"
                className="arabic-input"
                value={vocalizationInput}
                onChange={(e) => { setVocalizationInput(e.target.value); setVocFeedback(null) }}
                placeholder="z.B. \u0643\u064E\u062A\u064E\u0628\u064E"
                style={{ width: '100%' }}
                dir="rtl"
              />
            </div>

            {vocFeedback && (
              <div style={S.feedback(vocFeedback.type)}>
                {vocFeedback.msg}
                {vocFeedback.options && (
                  <div style={{ marginTop: '6px' }}>
                    {vocFeedback.options.map((opt, i) => (
                      <div key={i} style={{ fontSize: '0.83rem', marginTop: '4px' }}>
                        <span className="arabic" style={{ fontSize: '1.1rem' }}>{opt.vocalized}</span>
                        {' '}&mdash; {opt.meaning_de || opt.meaning_en}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ ...S.flexRow, marginTop: '10px', justifyContent: 'flex-end' }}>
              <button style={S.btn('primary')} onClick={handleCheckVocalization}>
                Prüfen
              </button>
            </div>
          </>
        )}
      </div>

      {/* Sub-step: Meaning */}
      <div style={{ ...S.card, opacity: (subStep === 'meaning' || subStep === 'syntax') ? 1 : 0.4, pointerEvents: (subStep === 'meaning' || subStep === 'syntax') ? 'auto' : 'none' }}>
        <div style={S.stepRow}>
          <span style={S.stepBadge(subStep === 'meaning')}>d</span>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Bedeutung im Kontext</span>
        </div>

        {subStep === 'meaning' && (
          <>
            <div style={{ marginBottom: '8px' }}>
              <label style={S.label}>Deine Übersetzung / Bedeutung (Freitext):</label>
              <textarea
                value={meaningInput}
                onChange={(e) => setMeaningInput(e.target.value)}
                rows={2}
                style={{ width: '100%', resize: 'vertical', fontFamily: 'var(--font-ui)' }}
                placeholder="Was bedeutet dieses Wort im Kontext dieses Verses?"
              />
            </div>
            <p style={{ ...S.muted, marginBottom: '8px' }}>
              Es gibt hier kein &quot;richtig&quot; oder &quot;falsch&quot; &mdash; vergleiche deine Übersetzung mit Lane&apos;s Lexikon.
            </p>
            {lanesUrl && (
              <div style={{ marginBottom: '10px' }}>
                <a href={lanesUrl} target="_blank" rel="noopener noreferrer" style={S.link}>
                  Lane&apos;s Lexikon öffnen zum Vergleich
                </a>
              </div>
            )}
            <div style={{ ...S.flexRow, justifyContent: 'flex-end' }}>
              <button
                style={S.btn('primary')}
                onClick={() => {
                  if (phase >= 3) setSubStep('syntax')
                  else handleCompleteWord()
                }}
              >
                {phase >= 3 ? 'Weiter zur Syntax' : 'Wort abschließen'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Sub-step: Syntax (Phase 3+) */}
      {phase >= 3 && (
        <div style={{ ...S.card, opacity: subStep === 'syntax' ? 1 : 0.4, pointerEvents: subStep === 'syntax' ? 'auto' : 'none' }}>
          <div style={S.stepRow}>
            <span style={S.stepBadge(subStep === 'syntax')}>e</span>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Syntaktische Rolle</span>
          </div>

          {subStep === 'syntax' && (
            <>
              <div style={{ marginBottom: '8px' }}>
                <label style={S.label}>Syntaktische Funktion im Satz:</label>
                <select style={S.select} value={syntaxRole} onChange={(e) => setSyntaxRole(e.target.value)}>
                  <option value="">-- Rolle wählen --</option>
                  {SYNTACTIC_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              {/* Kasus-Feedback basierend auf gewählter Rolle */}
              {syntaxRole && (() => {
                const role = SYNTACTIC_ROLES.find(r => r.value === syntaxRole)
                if (!role || !role.caseExplanation) return null
                const caseColors = { nominativ: '#4caf50', akkusativ: '#ff9800', genitiv: '#2196f3', folgt_bezugswort: '#9c27b0', keine: 'var(--text-muted)' }
                const caseLabels = { nominativ: 'Nominativ (Marfu\u02BB — Damma)', akkusativ: 'Akkusativ (Mansub — Fatha)', genitiv: 'Genitiv (Majrur — Kasra)', folgt_bezugswort: 'Folgt dem Bezugswort', keine: 'Nicht deklinierbar' }
                return (
                  <div style={{
                    padding: '8px 12px', borderRadius: 'var(--radius-sm)', marginBottom: '10px',
                    background: (caseColors[role.case] || 'var(--text-muted)') + '15',
                    border: '1px solid ' + (caseColors[role.case] || 'var(--border)'),
                    fontSize: '0.8rem',
                  }}>
                    <div style={{ fontWeight: 600, color: caseColors[role.case], marginBottom: '2px' }}>
                      Kasus: {caseLabels[role.case] || '—'}
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      {role.caseExplanation}
                    </div>
                    {/* Iḍāfa-Subtypes: show when mudaf_ilayh is selected */}
                    {role.value === 'mudaf_ilayh' && idafaSubtypes?.subtypes && (
                      <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid var(--border)', fontSize: '0.75rem' }}>
                        <div style={{ fontWeight: 600, marginBottom: '3px', color: 'var(--text-primary)' }}>Iḍāfa-Typen (semantisch):</div>
                        {idafaSubtypes.subtypes.map((st, si) => (
                          <div key={si} style={{ marginBottom: '2px' }}>
                            <span style={{ color: 'var(--accent-gold)' }}>{st.nameArabic || st.id}</span>
                            {' — '}{st.description}
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Ellipsis hints: show when fa3il/verb role selected and word is transitive verb */}
                    {role.value === 'fi3l' && ellipsisHints?.transitiveVerbs && (() => {
                      const cleanW = cleanArabicText(word || '')
                      if (ellipsisHints.transitiveVerbs.includes(cleanW)) {
                        return (
                          <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Hinweis: Dieses Verb ist transitiv. {ellipsisHints.hints?.missing_object || ''}
                          </div>
                        )
                      }
                      return null
                    })()}
                  </div>
                )
              })()}
              <div style={{ ...S.flexRow, justifyContent: 'flex-end' }}>
                <button style={S.btn('primary')} onClick={handleCompleteWord}>
                  Wort abschließen
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================
// MAIN MODULE COMPONENT
// ============================================================
export default function Module3({ quranData, settings }) {
  const location = useLocation()
  // --- Navigation state ---
  // If navigated from Dashboard heatmap with state.surah, use that; otherwise fall back to settings
  const [currentSurah, setCurrentSurah] = useState(location.state?.surah || settings?.currentSurah || 1)
  const [currentVerse, setCurrentVerse] = useState(1)

  // --- Workflow state ---
  const [step, setStep] = useState(1) // 1 = particles, 2 = word analysis, 3 = complete, 4 = listen, 5 = rasm exercise
  const [step1Result, setStep1Result] = useState(null)
  const [analyzedWordIndices, setAnalyzedWordIndices] = useState(new Set())
  const [currentWordIdx, setCurrentWordIdx] = useState(null)
  const [verseCompleted, setVerseCompleted] = useState(false)
  const [_audioPlayed, setAudioPlayed] = useState(false)
  const [audioDisclaimerShown, setAudioDisclaimerShown] = useState(false)
  // --- Rasm exercise state (Step 5) ---
  const [rasmLayer, setRasmLayer] = useState(0) // 0=full consonantal, 1=ijam removed, 2=reconstruct
  const [rasmUserInput, setRasmUserInput] = useState('')
  const [rasmComparison, setRasmComparison] = useState(null)
  const [showAudioDisclaimer, setShowAudioDisclaimer] = useState(false)
  const [audioError, setAudioError] = useState(null)
  const [audioStatus, setAudioStatus] = useState(null) // e.g. "Versuche alternative Audioquelle..."
  const [activeReciterName, setActiveReciterName] = useState(null)

  // --- Stats ---
  const [verseStats, setVerseStats] = useState({ total: 0, firstTryCorrect: 0, lernmodusUsed: 0 })
  const [_wordAnalyses, setWordAnalyses] = useState({})

  // --- Error tracking for adaptive help ---
  const [errorTracker, setErrorTracker] = useState({}) // { formII: 3, ... }
  const [adaptiveHint, setAdaptiveHint] = useState(null)

  // --- SRS save notification ---
  const [srsNotification, setSrsNotification] = useState(null)

  // --- Tool panels ---
  const [showGrammarSidebar, setShowGrammarSidebar] = useState(false)
  const [showCrossRef, setShowCrossRef] = useState(null) // { word, root } or null
  const [showDiagram, setShowDiagram] = useState(false)
  const [showSyntaxExercises, setShowSyntaxExercises] = useState(false)

  // --- Guided learning path ---
  const [showGuidedPath, setShowGuidedPath] = useState(false)
  const [visitedSurahs, setVisitedSurahs] = useState(new Set())

  // --- Audio ---
  const audioRef = useRef(null)

  // --- Get surah data ---
  const surah = useMemo(() => {
    if (!quranData?.surahs) return null
    return quranData.surahs.find(s => s.number === currentSurah) || null
  }, [quranData, currentSurah])

  const verse = useMemo(() => {
    if (!surah) return null
    return surah.verses.find(v => v.number === currentVerse) || null
  }, [surah, currentVerse])

  const words = useMemo(() => {
    if (!verse) return []
    return splitIntoWords(verse.text)
  }, [verse])

  const totalSurahs = quranData?.surahs?.length || 114
  const totalVerses = surah?.verses?.length || 0

  // --- Phase (from settings) ---
  const phase = settings?.phase || 1

  // --- Load saved progress ---
  useEffect(() => {
    async function loadSaved() {
      const saved = await loadModuleProgress(3)
      if (saved) {
        if (saved.currentSurah) setCurrentSurah(saved.currentSurah)
        if (saved.currentVerse) setCurrentVerse(saved.currentVerse)
        if (saved.audioDisclaimerShown) setAudioDisclaimerShown(true)
        if (saved.visitedSurahs) setVisitedSurahs(new Set(saved.visitedSurahs))
      }
    }
    loadSaved()
  }, [])

  // --- Save progress on nav changes ---
  useEffect(() => {
    saveModuleProgress(3, {
      currentSurah,
      currentVerse,
      audioDisclaimerShown,
      visitedSurahs: [...visitedSurahs],
    })
  }, [currentSurah, currentVerse, audioDisclaimerShown, visitedSurahs])

  // --- Reset verse state when verse changes (deferred to avoid cascading renders) ---
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setStep(1)
      setStep1Result(null)
      setAnalyzedWordIndices(new Set())
      setCurrentWordIdx(null)
      setVerseCompleted(false)
      setAudioPlayed(false)
      setVerseStats({ total: 0, firstTryCorrect: 0, lernmodusUsed: 0 })
      setWordAnalyses({})
      setAdaptiveHint(null)
    })
    return () => cancelAnimationFrame(id)
  }, [currentSurah, currentVerse])

  // --- Track visited surahs when verse completed ---
  useEffect(() => {
    if (verseCompleted && !visitedSurahs.has(currentSurah)) {
      const id = requestAnimationFrame(() => {
        setVisitedSurahs(prev => {
          const next = new Set(prev)
          next.add(currentSurah)
          return next
        })
      })
      return () => cancelAnimationFrame(id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verseCompleted, currentSurah])

  // --- Navigation handlers ---
  const handleSurahChange = useCallback((num) => {
    const n = parseInt(num, 10)
    if (n >= 1 && n <= totalSurahs) {
      setCurrentSurah(n)
      setCurrentVerse(1)
    }
  }, [totalSurahs])

  const handleVerseChange = useCallback((num) => {
    const n = parseInt(num, 10)
    if (n >= 1 && n <= totalVerses) {
      setCurrentVerse(n)
    }
  }, [totalVerses])

  const handleVerseClick = useCallback((verseNum) => {
    setCurrentVerse(verseNum)
  }, [])

  const handleNextVerse = useCallback(() => {
    if (currentVerse < totalVerses) {
      setCurrentVerse(currentVerse + 1)
    } else if (currentSurah < totalSurahs) {
      setCurrentSurah(currentSurah + 1)
      setCurrentVerse(1)
    }
  }, [currentVerse, totalVerses, currentSurah, totalSurahs])

  // --- Step 1 Complete ---
  const handleStep1Complete = useCallback((result) => {
    setStep1Result(result)
    setStep(2)
    // Set first remaining word as active
    if (result.remainingIndices.length > 0) {
      setCurrentWordIdx(result.remainingIndices[0])
      setVerseStats(prev => ({
        ...prev,
        total: result.remainingIndices.length,
      }))
    } else {
      // No words to analyze (all particles/pronouns)
      setStep(3)
      setVerseCompleted(true)
    }
  }, [])

  // --- Word analysis complete ---
  const handleWordComplete = useCallback((analysisData) => {
    setWordAnalyses(prev => ({ ...prev, [analysisData.wordIndex]: analysisData }))
    setAnalyzedWordIndices(prev => {
      const next = new Set(prev)
      next.add(analysisData.wordIndex)
      return next
    })

    // Update stats
    setVerseStats(prev => ({
      ...prev,
      firstTryCorrect: prev.firstTryCorrect + (
        analysisData.firstTryCorrect?.root && analysisData.firstTryCorrect?.form && analysisData.firstTryCorrect?.voc ? 1 : 0
      ),
      lernmodusUsed: prev.lernmodusUsed + (analysisData.usedLernmodus ? 1 : 0),
    }))

    // Notify user that an SRS card was saved to Module 5
    setSrsNotification('\u2713 SRS-Karte für Modul 5 gespeichert')
    setTimeout(() => setSrsNotification(null), 2500)

    // Move to next remaining word
    if (step1Result?.remainingIndices) {
      const remaining = step1Result.remainingIndices.filter(
        idx => !analyzedWordIndices.has(idx) && idx !== analysisData.wordIndex
      )
      if (remaining.length > 0) {
        setCurrentWordIdx(remaining[0])
      } else {
        // All words analyzed
        setStep(3)
        setVerseCompleted(true)
        setCurrentWordIdx(null)
      }
    }
  }, [step1Result, analyzedWordIndices])

  // --- Select specific remaining word ---
  const handleSelectWord = useCallback((idx) => {
    if (step === 2 && step1Result?.remainingIndices?.includes(idx) && !analyzedWordIndices.has(idx)) {
      setCurrentWordIdx(idx)
    }
  }, [step, step1Result, analyzedWordIndices])

  // --- Error tracking / adaptive help ---
  const handleErrorTrack = useCallback((category, detail) => {
    setErrorTracker(prev => {
      const key = category + (detail ? `_${detail}` : '')
      const next = { ...prev, [key]: (prev[key] || 0) + 1 }

      // Look up the most specific mapping first (e.g. form_II), then fall back to category (e.g. mood)
      const mapping = ERROR_LESSON_MAP[key] || ERROR_LESSON_MAP[category]
      if (mapping && next[key] >= 3) {
        const queryParam = mapping.stufe === 'syntax' ? `lesson=${mapping.lessonId}&stufe=syntax` : `lesson=${mapping.lessonId}`
        setAdaptiveHint({
          msg: `Du hast wiederholt Schwierigkeiten mit "${mapping.label}". Zurück zur Lektion?`,
          linkTo: `/module/2?${queryParam}`,
          linkLabel: `Zu Lektion ${mapping.lessonId}: ${mapping.label}`,
        })
      }

      return next
    })
  }, [])

  // --- Audio: try sources sequentially with fallback ---
  const tryAudioSources = useCallback(async (surah, ayah) => {
    if (!audioRef.current) return

    const sources = getAudioUrls(surah, ayah)
    setAudioError(null)
    setAudioStatus(null)
    setActiveReciterName(sources[0]?.name || null)

    for (let i = 0; i < sources.length; i++) {
      const source = sources[i]

      if (i > 0) {
        setAudioStatus(`Versuche alternative Audioquelle: ${source.name}...`)
        setActiveReciterName(source.name)
      }

      try {
        audioRef.current.src = source.url
        await audioRef.current.play()
        // Success — clear status and record playback
        setAudioStatus(null)
        setActiveReciterName(source.name)
        setAudioPlayed(true)
        return
      } catch (_) {
        // This source failed — continue to next
      }
    }

    // All sources exhausted
    setAudioStatus(null)
    setAudioError('Audio konnte nicht geladen werden. Alle Audioquellen und alternativen Server (everyayah.com, QuranicAudio, verses.quran.com) wurden versucht. Prüfe deine Internetverbindung.')
  }, [])

  const handlePlayAudio = useCallback(() => {
    if (!verseCompleted) return

    // Show disclaimer first time
    if (!audioDisclaimerShown) {
      setShowAudioDisclaimer(true)
      return
    }

    tryAudioSources(currentSurah, currentVerse)
  }, [verseCompleted, audioDisclaimerShown, currentSurah, currentVerse, tryAudioSources])

  const handleAcceptDisclaimer = useCallback(() => {
    setAudioDisclaimerShown(true)
    setShowAudioDisclaimer(false)
    tryAudioSources(currentSurah, currentVerse)
  }, [currentSurah, currentVerse, tryAudioSources])

  // --- Word state for verse display ---
  const getWordDisplayState = useCallback((idx) => {
    if (step === 1) return 'default'

    if (step1Result) {
      if (step1Result.particleIndices.has(idx)) return 'particle'
      if (step1Result.pronounIndices.has(idx)) return 'pronoun'
    }
    if (analyzedWordIndices.has(idx)) return 'done'
    if (idx === currentWordIdx && step === 2) return 'active'
    if (step1Result?.remainingIndices?.includes(idx) && !analyzedWordIndices.has(idx)) return 'remaining'
    return 'default'
  }, [step, step1Result, analyzedWordIndices, currentWordIdx])

  // --- Verse completion stats ---
  const completionPct = useMemo(() => {
    if (!step1Result || step1Result.remainingIndices.length === 0) return step >= 3 ? 100 : 0
    return Math.round((analyzedWordIndices.size / step1Result.remainingIndices.length) * 100)
  }, [step1Result, analyzedWordIndices, step])

  const scoreText = useMemo(() => {
    if (!verseCompleted || verseStats.total === 0) return ''
    const pct = Math.round((verseStats.firstTryCorrect / verseStats.total) * 100)
    return `${pct}% beim ersten Versuch korrekt. Lernmodus ${verseStats.lernmodusUsed}x verwendet.`
  }, [verseCompleted, verseStats])

  // --- Render ---
  if (!quranData || !surah) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
        <p>Qurantext wird geladen...</p>
      </div>
    )
  }

  return (
    <div className="m3-container" style={S.container}>
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="none" />

      {/* SRS save notification */}
      {srsNotification && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'var(--correct)',
          color: 'var(--bg-primary)',
          padding: '8px 16px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem',
          fontWeight: 600,
          zIndex: 9999,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
          {srsNotification}
        </div>
      )}

      {/* ============ LEFT: Work Area ============ */}
      <div style={S.workPanel}>
        {/* Work area header */}
        <div style={S.navBar}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--accent-teal)' }}>
            Vers-Werkstatt
          </span>
          <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
            <button
              onClick={() => setShowGrammarSidebar(true)}
              title="Grammatik-Referenz öffnen"
              style={{ padding: '3px 8px', borderRadius: '4px', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.7rem' }}
            >Grammatik</button>
            <button
              onClick={() => setShowDiagram(d => !d)}
              title="Satzdiagramm ein/ausblenden"
              style={{ padding: '3px 8px', borderRadius: '4px', background: showDiagram ? 'var(--accent-teal-bg)' : 'var(--bg-input)', border: `1px solid ${showDiagram ? 'var(--accent-teal)' : 'var(--border)'}`, color: showDiagram ? 'var(--accent-teal)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.7rem' }}
            >I'rab</button>
            <button
              onClick={() => setShowSyntaxExercises(s => !s)}
              title="Syntax-Übungen am Text"
              style={{ padding: '3px 8px', borderRadius: '4px', background: showSyntaxExercises ? 'var(--accent-gold-bg)' : 'var(--bg-input)', border: `1px solid ${showSyntaxExercises ? 'var(--accent-gold)' : 'var(--border)'}`, color: showSyntaxExercises ? 'var(--accent-gold)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.7rem' }}
            >Syntax</button>
          </div>
          <div style={S.flexRow}>
            {/* Quick-win surah chips */}
            {QUICK_WIN_SURAHS.map(s => (
              <span
                key={s}
                style={S.chip(currentSurah === s)}
                onClick={() => handleSurahChange(s)}
                role="button"
                tabIndex={0}
              >
                Sure {s}
              </span>
            ))}
          </div>
        </div>

        {/* Guided learning path — collapsible */}
        <div style={{ borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={() => setShowGuidedPath(p => !p)}
            style={{
              width: '100%',
              padding: '6px 16px',
              background: showGuidedPath ? 'var(--accent-teal-bg)' : 'var(--bg-secondary)',
              border: 'none',
              borderTop: '1px solid var(--border)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              color: showGuidedPath ? 'var(--accent-teal)' : 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            <span style={{ fontSize: '0.7rem', transition: 'transform 0.2s', transform: showGuidedPath ? 'rotate(90deg)' : 'rotate(0deg)' }}>&#9654;</span>
            Empfohlener Lernpfad
          </button>
          {showGuidedPath && (
            <div style={{ padding: '8px 16px 12px', background: 'var(--bg-secondary)', maxHeight: '260px', overflowY: 'auto' }}>
              {GUIDED_PATH.map((phase, pi) => (
                <div key={pi} style={{ marginBottom: pi < GUIDED_PATH.length - 1 ? '10px' : 0 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', letterSpacing: '0.02em' }}>
                    {phase.phase}
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {phase.surahs.map(s => {
                      const isActive = currentSurah === s.surah
                      const isVisited = visitedSurahs.has(s.surah)
                      return (
                        <button
                          key={s.surah}
                          onClick={() => handleSurahChange(s.surah)}
                          title={`${s.name} (${s.verses} Verse) — ${s.reason}`}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '10px',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            border: `1px solid ${isActive ? 'var(--accent-teal)' : isVisited ? 'var(--correct)' : 'var(--border)'}`,
                            background: isActive ? 'var(--accent-teal-bg)' : isVisited ? 'var(--correct-bg)' : 'var(--bg-input)',
                            color: isActive ? 'var(--accent-teal)' : isVisited ? 'var(--correct)' : 'var(--text-secondary)',
                            fontWeight: isActive ? 600 : 400,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {isVisited && '\u2713 '}{s.surah} {s.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={S.workScrollArea}>
          {/* Progress bar */}
          {step >= 2 && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ ...S.flexRow, justifyContent: 'space-between' }}>
                <span style={S.muted}>Fortschritt Vers {currentVerse}</span>
                <span style={S.muted}>{completionPct}%</span>
              </div>
              <div style={S.progressBar(completionPct)}>
                <div style={S.progressFill(completionPct)} />
              </div>
            </div>
          )}

          {/* Step indicator row */}
          <div style={{ ...S.flexRow, marginBottom: '16px', justifyContent: 'center' }}>
            {[1, 2, 3, 4].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                <span style={S.stepBadge(step === s)}>{s}</span>
                <span style={{ fontSize: '0.75rem', color: step === s ? 'var(--accent-teal)' : 'var(--text-muted)', marginRight: '12px' }}>
                  {s === 1 ? 'Markieren' : s === 2 ? 'Analysieren' : s === 3 ? 'Fertig' : 'Hören'}
                </span>
              </div>
            ))}
          </div>

          {/* Adaptive hint */}
          {adaptiveHint && (
            <div style={{ ...S.feedback('info'), marginBottom: '14px' }}>
              {adaptiveHint.msg}{' '}
              <button onClick={() => { window.location.href = adaptiveHint.linkTo; }} style={{ ...S.link, background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit', textDecoration: 'underline' }}>
                {adaptiveHint.linkLabel}
              </button>
            </div>
          )}

          {/* === STEP 1: Particle/Pronoun marking === */}
          {step === 1 && words.length > 0 && (
            <Step1ParticleMarking
              words={words}
              surah={currentSurah}
              verse={currentVerse}
              onComplete={handleStep1Complete}
            />
          )}

          {/* === STEP 2: Word-by-word analysis === */}
          {step === 2 && currentWordIdx !== null && words[currentWordIdx] && (
            <div>
              {/* Remaining words selector */}
              <div style={{ ...S.card, padding: '10px 14px' }}>
                <div style={{ ...S.muted, marginBottom: '6px' }}>Verbleibende Wörter (klicke zum Wechseln):</div>
                <div style={{ direction: 'rtl', display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'flex-end' }}>
                  {step1Result?.remainingIndices?.map(idx => (
                    <span
                      key={idx}
                      style={{
                        ...S.word(getWordDisplayState(idx)),
                        fontFamily: 'var(--font-arabic)',
                        fontSize: '1.1rem',
                        cursor: analyzedWordIndices.has(idx) ? 'default' : 'pointer',
                      }}
                      onClick={() => handleSelectWord(idx)}
                    >
                      {words[idx]}
                    </span>
                  ))}
                </div>
              </div>

              <WordAnalysisPanel
                key={`${currentSurah}:${currentVerse}:${currentWordIdx}`}
                word={words[currentWordIdx]}
                wordIndex={currentWordIdx}
                surah={currentSurah}
                verse={currentVerse}
                phase={phase}
                onComplete={handleWordComplete}
                errorTracker={errorTracker}
                onErrorTrack={handleErrorTrack}
                allWordsInVerse={words}
              />
            </div>
          )}

          {/* === STEP 3: Verse complete === */}
          {step === 3 && (
            <div style={S.card}>
              <div style={{ ...S.cardTitle, color: 'var(--correct)' }}>Vers bearbeitet!</div>

              <div style={S.feedback('correct')}>
                Alle Wörter in Vers {currentVerse} von Sure {currentSurah} wurden analysiert.
              </div>

              {scoreText && (
                <div style={{ ...S.muted, marginTop: '8px', marginBottom: '12px' }}>
                  Bewertung: {scoreText}
                </div>
              )}

              <div style={{ ...S.flexRow, gap: '10px', marginTop: '12px' }}>
                <button
                  style={S.btn(verseCompleted ? 'primary' : 'secondary')}
                  onClick={() => { setStep(4); handlePlayAudio() }}
                >
                  Vers anhören
                </button>
                <button style={S.btn('secondary')} onClick={handleNextVerse}>
                  Nächster Vers
                </button>
              </div>
            </div>
          )}

          {/* === STEP 4: Listen === */}
          {step === 4 && (
            <div style={S.card}>
              <div style={S.cardTitle}>Schritt 4: Vers anhören</div>

              {/* Audio disclaimer modal */}
              {showAudioDisclaimer && (
                <div style={{ ...S.feedback('info'), marginBottom: '12px' }}>
                  <p style={{ fontWeight: 600, marginBottom: '6px' }}>Hinweis zur Audioaufnahme:</p>
                  <p>{AUDIO_DISCLAIMER}</p>
                  <div style={{ ...S.flexRow, marginTop: '10px', justifyContent: 'flex-end' }}>
                    <button style={S.btn('primary')} onClick={handleAcceptDisclaimer}>
                      Verstanden
                    </button>
                  </div>
                </div>
              )}

              {!showAudioDisclaimer && (
                <>
                  <div style={{ ...S.flexRow, gap: '10px', marginBottom: '12px' }}>
                    <button style={S.btn('primary')} onClick={handlePlayAudio}>
                      Abspielen
                    </button>
                    <button style={S.btn('secondary')} onClick={() => {
                      if (audioRef.current) audioRef.current.pause()
                    }}>
                      Pause
                    </button>
                  </div>

                  {audioStatus && (
                    <div style={{ ...S.feedback('info'), marginBottom: '10px' }}>
                      {audioStatus}
                    </div>
                  )}

                  {audioError && (
                    <div style={{ ...S.feedback('error'), marginBottom: '10px' }}>
                      {audioError}
                    </div>
                  )}

                  <p style={S.muted}>
                    Quelle: {activeReciterName || audioConfig.reciters.find(r => r.id === audioConfig.defaultReciter)?.name || 'Aussprache A'}
                    {' \u2014 '}
                    {(activeReciterName
                      ? audioConfig.reciters.find(r => r.name === activeReciterName)?.germanDescription
                      : audioConfig.reciters.find(r => r.id === audioConfig.defaultReciter)?.germanDescription) || ''}
                  </p>

                  <div style={{ ...S.flexRow, gap: '10px', marginTop: '16px' }}>
                    <button style={S.btn('secondary')} onClick={() => { setStep(5); setRasmLayer(0); setRasmComparison(null); setRasmUserInput(''); }}>
                      Rasm-Übung (optional)
                    </button>
                    <button style={S.btn('secondary')} onClick={handleNextVerse}>
                      Nächster Vers
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* === STEP 5: Rasm Exercise (optional) === */}
          {step === 5 && verse && (
            <div style={S.card}>
              <div style={S.cardTitle}>Schritt 5: Rasm-Leseübung (optional)</div>
              <p style={S.muted}>
                Übe das Lesen des Konsonantentextes in verschiedenen Schichten — von voll punktiert bis zum reinen Rasm.
              </p>

              {/* Layer 0: Full consonantal text */}
              {rasmLayer === 0 && (
                <div>
                  <div className="arabic" dir="rtl" style={{ fontSize: '1.8rem', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center', marginBottom: '12px', color: 'var(--accent-gold, #e6a817)' }}>
                    {verse.text}
                  </div>
                  <p style={S.muted}>Konsonantentext mit I'jam (Buchstabenpunkte). Lies den Vers und präge ihn dir ein.</p>
                  <div style={{ ...S.flexRow, gap: '10px', marginTop: '12px' }}>
                    <button style={S.btn('primary')} onClick={() => setRasmLayer(1)}>
                      I'jam entfernen
                    </button>
                  </div>
                </div>
              )}

              {/* Layer 1: Dots removed (Rasm) */}
              {rasmLayer === 1 && (
                <div>
                  <div className="arabic" dir="rtl" style={{ fontSize: '1.8rem', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center', marginBottom: '12px', color: 'var(--text-primary)' }}>
                    {stripIjam(verse.text)}
                  </div>
                  <p style={S.muted}>Reiner Rasm — das Konsonantenskelett ohne Buchstabenpunkte. Kannst du die Buchstaben noch erkennen?</p>
                  <div style={{ ...S.flexRow, gap: '10px', marginTop: '12px' }}>
                    <button style={S.btn('secondary')} onClick={() => setRasmLayer(0)}>
                      I'jam anzeigen
                    </button>
                    <button style={S.btn('primary')} onClick={() => { setRasmLayer(2); setRasmUserInput(''); setRasmComparison(null); }}>
                      Rekonstruiere
                    </button>
                  </div>
                </div>
              )}

              {/* Layer 2: Reconstruct */}
              {rasmLayer === 2 && (
                <div>
                  <div className="arabic" dir="rtl" style={{ fontSize: '1.5rem', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center', marginBottom: '12px', color: 'var(--text-muted)' }}>
                    {stripIjam(verse.text)}
                  </div>
                  <p style={S.muted}>Schreibe den Vers mit Buchstabenpunkten (I'jam) zurück. Versuche aus dem Rasm den originalen Konsonantentext zu rekonstruieren.</p>
                  <textarea
                    dir="rtl"
                    value={rasmUserInput}
                    onChange={e => setRasmUserInput(e.target.value)}
                    placeholder="Vers hier eingeben..."
                    style={{ width: '100%', minHeight: '80px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input, var(--bg-secondary))', color: 'var(--text-primary)', fontFamily: 'var(--font-arabic)', fontSize: '1.3rem', resize: 'vertical' }}
                  />
                  <div style={{ ...S.flexRow, gap: '10px', marginTop: '12px' }}>
                    <button style={S.btn('primary')} onClick={() => {
                      const userClean = rasmUserInput.trim().replace(/\s+/g, ' ')
                      const correctClean = verse.text.trim().replace(/\s+/g, ' ')
                      const match = userClean === correctClean
                      setRasmComparison({ match, userText: userClean, correctText: correctClean })
                    }}>
                      Vergleichen
                    </button>
                    <button style={S.btn('secondary')} onClick={() => setRasmLayer(0)}>
                      Zurück
                    </button>
                  </div>

                  {rasmComparison && (
                    <div style={{ marginTop: '12px', padding: '12px', borderRadius: '8px', background: rasmComparison.match ? 'var(--correct-bg, #e8f5e9)' : 'var(--incorrect-bg, #fce4ec)', border: `1px solid ${rasmComparison.match ? 'var(--correct, #4caf50)' : 'var(--incorrect, #e53935)'}` }}>
                      <p style={{ fontWeight: 600, marginBottom: '8px' }}>
                        {rasmComparison.match ? 'Korrekt! Du hast den Vers vollständig rekonstruiert.' : 'Nicht ganz. Vergleiche:'}
                      </p>
                      {!rasmComparison.match && (
                        <div>
                          <div style={{ marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Deine Eingabe:</span>
                            <div className="arabic" dir="rtl" style={{ fontSize: '1.2rem' }}>{rasmComparison.userText || '(leer)'}</div>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Korrekt:</span>
                            <div className="arabic" dir="rtl" style={{ fontSize: '1.2rem', color: 'var(--correct, #4caf50)' }}>{rasmComparison.correctText}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div style={{ ...S.flexRow, gap: '10px', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <button style={S.btn('secondary')} onClick={() => { setStep(4); setRasmLayer(0); setRasmComparison(null); }}>
                  Zurück zu Schritt 4
                </button>
                <button style={S.btn('secondary')} onClick={handleNextVerse}>
                  Nächster Vers
                </button>
              </div>
            </div>
          )}

          {/* No verse selected placeholder */}
          {words.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <p>Wähle eine Sure und einen Vers, um mit der Analyse zu beginnen.</p>
            </div>
          )}
        </div>
      </div>

      {/* ============ RIGHT: Quran Text ============ */}
      <div style={S.textPanel}>
        {/* Surah/verse navigation */}
        <div style={S.navBar}>
          <div style={S.navGroup}>
            <button
              style={S.navBtn}
              onClick={() => handleSurahChange(currentSurah - 1)}
              disabled={currentSurah <= 1}
            >
              {'\u25C0'}
            </button>
            <span style={S.navLabel}>Sure</span>
            <input
              type="number"
              style={S.navInput}
              min={1}
              max={totalSurahs}
              value={currentSurah}
              onChange={(e) => handleSurahChange(e.target.value)}
            />
            <span style={S.navLabel}>/ {totalSurahs}</span>
            <button
              style={S.navBtn}
              onClick={() => handleSurahChange(currentSurah + 1)}
              disabled={currentSurah >= totalSurahs}
            >
              {'\u25B6'}
            </button>
          </div>

          <div style={S.navGroup}>
            <span style={S.navLabel}>Vers</span>
            <button
              style={S.navBtn}
              onClick={() => handleVerseChange(currentVerse - 1)}
              disabled={currentVerse <= 1}
            >
              {'\u25C0'}
            </button>
            <input
              type="number"
              style={S.navInput}
              min={1}
              max={totalVerses}
              value={currentVerse}
              onChange={(e) => handleVerseChange(e.target.value)}
            />
            <span style={S.navLabel}>/ {totalVerses}</span>
            <button
              style={S.navBtn}
              onClick={() => handleVerseChange(currentVerse + 1)}
              disabled={currentVerse >= totalVerses}
            >
              {'\u25B6'}
            </button>
          </div>
        </div>

        {/* Verse display with clickable words */}
        <div style={S.textScrollArea}>
          {surah.verses.map(v => {
            const isActive = v.number === currentVerse
            const vWords = splitIntoWords(v.text)

            return (
              <div
                key={v.number}
                style={S.verseLine(isActive)}
                onClick={() => handleVerseClick(v.number)}
              >
                {/* Surah:Verse annotation */}
                <div style={S.verseNum}>
                  {currentSurah}:{v.number}
                </div>

                {/* Verse text */}
                <div style={{ ...S.verseText, color: isActive ? 'var(--arabic-text)' : 'var(--arabic-dimmed)' }}>
                  {isActive ? (
                    // Active verse: clickable words with state coloring
                    <span dir="rtl" style={{ display: 'inline' }}>
                      {vWords.map((w, i) => (
                        <span key={i}>
                          <span
                            style={{
                              ...S.word(getWordDisplayState(i)),
                              fontFamily: 'var(--font-arabic)',
                              fontSize: 'var(--arabic-size-lg)',
                              lineHeight: 'var(--arabic-line-height)',
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (step === 2) handleSelectWord(i)
                            }}
                            role="button"
                            tabIndex={0}
                          >
                            {w}
                          </span>
                          {i < vWords.length - 1 ? ' ' : ''}
                        </span>
                      ))}
                    </span>
                  ) : (
                    // Inactive verse: plain text
                    v.text
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ============ Syntax Exercises Panel ============ */}
      {showSyntaxExercises && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px', borderTop: '2px solid var(--accent-gold)', background: 'var(--bg-primary)', zIndex: 41, maxHeight: '50vh', overflow: 'auto' }}>
          <SyntaxExercises onClose={() => setShowSyntaxExercises(false)} />
        </div>
      )}

      {/* ============ Sentence Diagram Panel ============ */}
      {showDiagram && verse && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px', borderTop: '2px solid var(--accent-teal)', background: 'var(--bg-primary)', zIndex: 40, maxHeight: '40vh', overflow: 'auto' }}>
          <SentenceDiagram
            words={splitIntoWords(verse.text)}
            verseRef={`${currentSurah}:${currentVerse}`}
            onClose={() => setShowDiagram(false)}
          />
        </div>
      )}

      {/* ============ Cross Reference Panel ============ */}
      {showCrossRef && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxHeight: '50vh', overflow: 'auto', background: 'var(--bg-primary)', borderTop: '2px solid var(--accent-teal)', padding: '16px', zIndex: 50 }}>
          <CrossReference
            word={showCrossRef.word}
            root={showCrossRef.root}
            onNavigate={(s, v) => { handleSurahChange(s); setCurrentVerse(v); setShowCrossRef(null) }}
            onClose={() => setShowCrossRef(null)}
          />
        </div>
      )}

      {/* ============ Grammar Sidebar ============ */}
      <GrammarSidebar visible={showGrammarSidebar} onClose={() => setShowGrammarSidebar(false)} />
    </div>
  )
}
