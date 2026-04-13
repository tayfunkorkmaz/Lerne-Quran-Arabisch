import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import ArabicKeyboard from '../components/ArabicKeyboard.jsx'
import {
  saveSRSCard,
  loadAllSRSCards,
  getDueSRSCards,
  loadAllAnalyzedWords,
  loadAllRoots,
} from '../utils/storage.js'
import {
  cleanArabicText,
  containsArabic,
} from '../utils/arabic.js'
import particles from '../data/particles.json'
import morphologyTables from '../data/morphology-tables.json'
import quranData from '../data/quran-simple-clean.json'
import rasmOrthography from '../data/rasm-orthography.json'
import ambiguities from '../data/ambiguities.json'
import rootStarterCards from '../data/root-starter-cards.json'
import localforage from 'localforage'

/**
 * Module 5: SRS - Spaced Repetition System
 *
 * SM-2 algorithm implementation with 6 card types for Quranic Arabic learning.
 * Cards are reviewed on a schedule based on the learner's performance.
 */

// ============================================================================
// SM-2 Algorithm
// ============================================================================

function getToday() {
  return new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00') // noon to avoid DST edge cases
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-CA')
}

function computeNextReview(card, rating) {
  const now = getToday()
  let { interval, ease, history } = card
  const reviewCount = (history || []).length

  // Defaults
  if (typeof interval !== 'number' || interval < 1) interval = 1
  if (typeof ease !== 'number') ease = 2.5

  let newInterval
  let newEase = ease

  // First review: always 1 day
  if (reviewCount === 0) {
    newInterval = 1
  }
  // Second review: 3 days if not a fail
  else if (reviewCount === 1 && rating >= 2) {
    newInterval = 3
  }
  // Otherwise apply the SM-2 algorithm per rating
  else {
    switch (rating) {
      case 0: // Nochmal
        newInterval = 1
        newEase = Math.max(1.3, ease - 0.2)
        break
      case 1: // Schwer
        newInterval = Math.max(1, Math.round(interval * 1.2))
        newEase = Math.max(1.3, ease - 0.15)
        break
      case 2: // Gut
        newInterval = Math.round(interval * ease)
        // ease unchanged
        break
      case 3: // Leicht
        newInterval = Math.round(interval * ease * 1.3)
        newEase = Math.min(3.0, ease + 0.15)
        break
      default:
        newInterval = 1
    }
  }

  // Floor at 1 day
  if (newInterval < 1) newInterval = 1

  const nextReview = addDays(now, newInterval) + 'T00:00:00.000Z'

  return {
    interval: newInterval,
    ease: newEase,
    nextReview,
    history: [
      ...(history || []),
      { date: new Date().toISOString(), rating, interval: newInterval },
    ],
  }
}

// ============================================================================
// Card Types
// ============================================================================

const CARD_TYPES = {
  buchstabe: { label: 'Buchstabe', color: 'var(--accent-teal)' },
  partikel: { label: 'Partikel', color: 'var(--accent-gold)' },
  morphologie: { label: 'Morphologie-Muster', color: '#b07aff' },
  wurzel: { label: 'Wurzel', color: '#ff7a7a' },
  wort_kontext: { label: 'Wort im Kontext', color: '#7ac4ff' },
  vers: { label: 'Vers', color: '#7affa0' },
  rasm: { label: 'Rasm-Orthographie', color: '#ff9f43' },
  disambiguation: { label: 'Disambiguation', color: '#ee5a24' },
  ijam: { label: "I'jam", color: '#6ab04c' },
}

const RATING_BUTTONS = [
  { value: 0, label: 'Nochmal', color: '#ef4444', hint: 'Komplett vergessen' },
  { value: 1, label: 'Schwer', color: '#f97316', hint: 'Mühsam erinnert' },
  { value: 2, label: 'Gut', color: '#22c55e', hint: 'Korrekt erinnert' },
  { value: 3, label: 'Leicht', color: '#3b82f6', hint: 'Ohne Anstrengung' },
]

// ============================================================================
// Leech Detection — cards consistently failed (>= 5 times rated 0 "Nochmal")
// ============================================================================

function isLeech(card) {
  if (!card.history || card.history.length < 5) return false
  const recentFails = card.history.slice(-8).filter(h => h.rating === 0).length
  return recentFails >= 5
}

function getLeechCount(cards) {
  return Object.values(cards).filter(isLeech).length
}

// ============================================================================
// Starter Card Generation
// ============================================================================

const ARABIC_LETTERS = [
  { letter: 'ا', name: 'Alif', sound: 'a / Vokalträger', transliteration: 'ā' },
  { letter: 'ب', name: 'Ba', sound: 'b', transliteration: 'b' },
  { letter: 'ت', name: 'Ta', sound: 't', transliteration: 't' },
  { letter: 'ث', name: 'Tha', sound: 'th (engl. think, stimmlos)', transliteration: 'ṯ' },
  { letter: 'ج', name: 'Dschim', sound: 'dsch', transliteration: 'ǧ' },
  { letter: 'ح', name: 'Ḥā (pharyngal)', sound: 'stimmloser Kehllaut', transliteration: 'ḥ' },
  { letter: 'خ', name: 'Cha', sound: 'ch (wie in Bach)', transliteration: 'ḫ' },
  { letter: 'د', name: 'Dal', sound: 'd', transliteration: 'd' },
  { letter: 'ذ', name: 'Dhal', sound: 'stimmhaftes th', transliteration: 'ḏ' },
  { letter: 'ر', name: 'Ra', sound: 'r (gerollt)', transliteration: 'r' },
  { letter: 'ز', name: 'Zay', sound: 'z', transliteration: 'z' },
  { letter: 'س', name: 'Sin', sound: 's', transliteration: 's' },
  { letter: 'ش', name: 'Schin', sound: 'sch', transliteration: 'š' },
  { letter: 'ص', name: 'Sad', sound: 's (emphatisch)', transliteration: 'ṣ' },
  { letter: 'ض', name: 'Dad', sound: 'd (emphatisch)', transliteration: 'ḍ' },
  { letter: 'ط', name: 'Taa', sound: 't (emphatisch)', transliteration: 'ṭ' },
  { letter: 'ظ', name: 'Dha', sound: 'dh (emphatisch)', transliteration: 'ẓ' },
  { letter: 'ع', name: 'Ain', sound: 'stimmhafter Kehllaut', transliteration: 'ʿ' },
  { letter: 'غ', name: 'Ghain', sound: 'gh (wie fr. r)', transliteration: 'ġ' },
  { letter: 'ف', name: 'Fa', sound: 'f', transliteration: 'f' },
  { letter: 'ق', name: 'Qaf', sound: 'q (tiefer als k)', transliteration: 'q' },
  { letter: 'ك', name: 'Kaf', sound: 'k', transliteration: 'k' },
  { letter: 'ل', name: 'Lam', sound: 'l', transliteration: 'l' },
  { letter: 'م', name: 'Mim', sound: 'm', transliteration: 'm' },
  { letter: 'ن', name: 'Nun', sound: 'n', transliteration: 'n' },
  { letter: 'ه', name: 'Hā (glottal)', sound: 'h', transliteration: 'h' },
  { letter: 'و', name: 'Waw', sound: 'w / u', transliteration: 'w' },
  { letter: 'ي', name: 'Ya', sound: 'y / i', transliteration: 'y' },
  { letter: 'ء', name: 'Hamza', sound: 'Stimmabsatz', transliteration: 'ʾ' },
]

function generateLetterCards() {
  return ARABIC_LETTERS.map((l) => ({
    id: `buchstabe_${l.letter}`,
    type: 'buchstabe',
    front: l.letter,
    back: `Name: ${l.name}\nLaut: ${l.sound}\nTransliteration: ${l.transliteration}`,
    frontLabel: 'Welcher Buchstabe ist das?',
    backLabel: 'Name und Aussprache',
    interval: 1,
    ease: 2.5,
    nextReview: null,
    history: [],
    meta: { name: l.name, sound: l.sound, transliteration: l.transliteration },
  }))
}

function generateParticleCards(count = 20) {
  const particleList = (particles.particles || []).slice(0, count)
  return particleList.map((p) => ({
    id: `partikel_${p.id}`,
    type: 'partikel',
    front: p.consonantal || cleanArabicText(p.arabic),
    back: `Transliteration: ${p.transliteration}\nBedeutung: ${p.german}\nFunktion: ${p.function}\nKategorie: ${p.category}`,
    frontLabel: 'Welche Partikel? Transliteration und Funktion?',
    backLabel: 'Bedeutung und grammatische Funktion',
    interval: 1,
    ease: 2.5,
    nextReview: null,
    history: [],
    meta: {
      arabic: p.arabic,
      consonantal: p.consonantal,
      transliteration: p.transliteration,
      german: p.german,
      function: p.function,
      category: p.category,
      example: p.quranExample,
    },
  }))
}

function generateMorphologyCards() {
  // Create cards for verb forms I-X pattern recognition
  const forms = morphologyTables?.verbForms || []
  const cards = []

  forms.forEach((vf) => {
    // Pattern card
    cards.push({
      id: `morphologie_form_${vf.form}`,
      type: 'morphologie',
      front: `Verbform ${vf.form}: ${vf.pattern?.arabic || ''}`,
      back: `Muster: ${vf.pattern?.transliteration || ''}\nBedeutungsverschiebung: ${vf.meaningShiftGerman || vf.meaningShift}\nBeispiel: ${vf.exampleWord?.arabic || ''} (${vf.exampleWord?.german || ''})`,
      frontLabel: 'Welche Verbform? Nenne die Bedeutungsverschiebung.',
      backLabel: 'Muster und Beispiel',
      interval: 1,
      ease: 2.5,
      nextReview: null,
      history: [],
      meta: {
        form: vf.form,
        pattern: vf.pattern,
        meaningShift: vf.meaningShiftGerman || vf.meaningShift,
        example: vf.exampleWord,
      },
    })

    // Conjugation card: perfect 3ms
    if (vf.perfect?.['3ms']) {
      cards.push({
        id: `morphologie_perf3ms_${vf.form}`,
        type: 'morphologie',
        front: `Form ${vf.form} - Perfekt 3. Person m. Sg.?`,
        back: vf.perfect['3ms'],
        frontLabel: 'Gib die Konjugationsform an.',
        backLabel: 'Korrekte Form',
        interval: 1,
        ease: 2.5,
        nextReview: null,
        history: [],
        meta: { form: vf.form, tense: 'perfect', person: '3ms' },
      })
    }

    // Conjugation card: imperfect 3ms
    if (vf.imperfect?.['3ms']) {
      cards.push({
        id: `morphologie_imperf3ms_${vf.form}`,
        type: 'morphologie',
        front: `Form ${vf.form} - Imperfekt 3. Person m. Sg.?`,
        back: vf.imperfect['3ms'],
        frontLabel: 'Gib die Konjugationsform an.',
        backLabel: 'Korrekte Form',
        interval: 1,
        ease: 2.5,
        nextReview: null,
        history: [],
        meta: { form: vf.form, tense: 'imperfect', person: '3ms' },
      })
    }
  })

  return cards
}

// ============================================================================
// Verse Card Generation
// ============================================================================

const STARTER_VERSES = [
  { surah: 1, verse: 1, analysis: "Jarr wa-majrur (بسم) + Iḍāfa-Kette. Wurzeln: س-م-و (Erhöhung) oder و-س-م (Kennzeichnung) — beide Ableitungen werden diskutiert (اسم), ا-ل-ه (Gott), ر-ح-م (Barmherzigkeit). Zwei Intensivformen: الرحمن (fa'lān) und الرحيم (faʿīl)." },
  { surah: 1, verse: 2, analysis: "Nominalsatz. الحمد (Mubtada') لله (Khabar). رب (Badal/Sifa) + Iḍāfa mit العالمين (Genitiv Plural maskulin gesund)." },
  { surah: 1, verse: 3, analysis: "Fortführung: الرحمن الرحيم als Sifa oder Badal zu الله/رب. Beide Nominativ." },
  { surah: 1, verse: 4, analysis: "ملك/مالك (Ambiguität: Besitzer/König/Herrschaft) + Iḍāfa mit يوم الدين. Genitiv-Kette." },
  { surah: 1, verse: 5, analysis: "Verbalsatz mit vorangestelltem Objekt: إياك (Akkusativ, betont) نعبد (Imperfekt 1.pl). Doppelte Struktur mit و." },
  { surah: 1, verse: 6, analysis: "Imperativ: اهدنا (Form I Imperativ + Suffix 1.pl). الصراط المستقيم (Objekt, Akkusativ + Sifa)." },
  { surah: 1, verse: 7, analysis: "Sifa: صراط الذين (Badal). Relativsatz: أنعمت عليهم. Ausnahme: غير المغضوب عليهم. Koordination: ولا الضالين." },
  { surah: 2, verse: 2, analysis: "ذلك الكتاب: Demonstrativ + Nomen. لا ريب فيه: Genus-Negation. هدى للمتقين: Hal oder zweites Khabar." },
  { surah: 2, verse: 255, analysis: "Komplexer Nominalsatz: الله لا اله الا هو (Genus-Negation + Ausnahme). الحي القيوم (Sifa oder Khabar — beide Analysen syntaktisch möglich). لا تأخذه سنة ولا نوم (Genus-Negation). Mehrere Relativsätze." },
  { surah: 112, verse: 1, analysis: "Imperativ: قل (Form I). هو الله احد: Nominalsatz. هو = Personalpronomen (Rückbezug) oder Damir al-Sha'n (Pronomen der Sache) — beide Analysen sind möglich. الله = Mubtada'. احد = Khabar." },
  { surah: 112, verse: 2, analysis: "الله الصمد: Nominalsatz. Mubtada' + Khabar. الصمد: Muster faʿal (Nomen). Bedeutungsfeld nach Lane's Lexicon: der Undurchdringliche, der Widerständige, derjenige an den man sich wendet (in Bedürfnissen)." },
  { surah: 112, verse: 3, analysis: "لم يلد: Negation + Jussiv (Form I). ولم يولد: Passiv (Form I) im Jussiv. Identische Wurzel و-ل-د in Aktiv und Passiv." },
  { surah: 112, verse: 4, analysis: "ولم يكن: Jussiv von كان (Hohlverb). احد: Ism Kana (Subjekt, Nominativ). كفوا: Khabar Kana (Prädikat, Akkusativ). له: vorangestelltes Jarr wa-Majrur." },
  { surah: 113, verse: 1, analysis: "قل اعوذ: Imperativ + Imperfekt Form I. برب الفلق: Jarr wa-Majrur + Iḍāfa." },
  { surah: 114, verse: 1, analysis: "قل اعوذ برب الناس: Wie 113:1 aber mit الناس statt الفلق. Dreifache Sifa-Kette in 114:1-3." },
  { surah: 2, verse: 1, analysis: "الم: Huruf Muqattaʿat. Keine syntaktische Analyse möglich — getrennte Buchstaben." },
  { surah: 2, verse: 3, analysis: "Relativsatz: الذين يؤمنون بالغيب. Drei koordinierte Prädikate. Verschachtelter Relativsatz: مما رزقناهم." },
  { surah: 2, verse: 21, analysis: "Vokativ + Imperativ: يا ايها الناس اعبدوا ربكم. Relativsatz: الذي خلقكم. Erwartungssatz (لعل): لعلكم تتقون — لعل drückt Hoffnung/Erwartung aus, nicht Zweck." },
  { surah: 2, verse: 22, analysis: "Koordination: الذي جعل... وانزل... فاخرج. Verschachtelte Pronomen: به, لكم. Imperativ am Ende: فلا تجعلوا." },
  { surah: 2, verse: 216, analysis: "كتب عليكم القتال: Passiv Form I. القتال = Naʿib al-Faʿil. وهو كره لكم: Nominalsatz als Hal." },
  { surah: 3, verse: 2, analysis: "الله لا اله الا هو: Wie 2:255. الحي القيوم: Sifa. Wiederholung als intertextuelles Muster." },
  { surah: 36, verse: 1, analysis: "يس: Huruf Muqattaʿat. Isolierte Buchstaben Ya-Sin." },
  { surah: 55, verse: 1, analysis: "الرحمن: Nominalsatz-Beginn (Mubtada'). Intensivform fa'lan von ر-ح-م." },
  { surah: 55, verse: 2, analysis: "علم القران: Verb Form II (lehrte) + Objekt. Kein explizites Subjekt im Vers — grammatisch fortgesetztes Subjekt aus 55:1 (الرحمن)." },
  { surah: 67, verse: 1, analysis: "تبارك الذي بيده الملك: Verb (morphologisch Form VI von ب-ر-ك — jamid (starr): nur Perfekt belegt, kein Imperfekt/Partizip) + Relativsatz. بيده: Jarr wa-Majrur. الملك: Mubtada'. وهو على كل شيء قدير: Nominalsatz." },
  { surah: 96, verse: 1, analysis: "اقرأ: Imperativ Form I (ق-ر-أ). باسم ربك: Jarr wa-Majrur + Iḍāfa-Kette. الذي خلق: Relativsatz." },
  { surah: 96, verse: 2, analysis: "خلق الانسان من علق: Form I + Objekt + Jarr wa-Majrur. Kein Subjekt-Wechsel." },
  { surah: 6, verse: 1, analysis: "الحمد لله الذي خلق: Wie 1:2. Relativsatz mit خلق. وجعل: Koordination. ثم: Sequenzmarker." },
  { surah: 39, verse: 69, analysis: "وقضي بينهم بالحق: Passiv Form I. بينهم: Ẓarf. بالحق: Jarr wa-Majrur als Hal (Zustandsangabe)." },
  { surah: 2, verse: 285, analysis: "وما انزل اليه: Passiv Form IV (انزل). Relativsatz mit ما. ما = Naʿib al-Faʿil." },
]

function generateVerseCards(existingCards) {
  const verseCards = []
  const existingIds = new Set(
    Array.isArray(existingCards)
      ? existingCards.map(c => c.id)
      : Object.keys(existingCards)
  )

  for (const v of STARTER_VERSES) {
    const cardId = `vers_${v.surah}_${v.verse}`
    if (existingIds.has(cardId)) continue

    // Get verse text from quranData
    const surah = quranData.surahs?.find(s => s.number === v.surah)
    const verse = surah?.verses?.find(vr => vr.number === v.verse)
    if (!verse) continue

    verseCards.push({
      id: cardId,
      type: 'vers',
      front: verse.text,
      frontLabel: `Vers ${v.surah}:${v.verse}`,
      back: v.analysis,
      backLabel: 'Syntaktische Analyse',
      interval: 0,
      ease: 2.5,
      nextReview: null,
      history: [],
      meta: { surah: v.surah, verse: v.verse },
    })
  }
  return verseCards
}

// ============================================================================
// Card Type 7: Rasm-Orthographie Cards
// ============================================================================

function generateRasmCards() {
  const cards = []
  const categories = rasmOrthography?.categories || []
  categories.forEach((cat) => {
    (cat.examples || []).forEach((ex, i) => {
      cards.push({
        id: `rasm_${cat.id}_${i}`,
        type: 'rasm',
        front: ex.quranOrtho,
        back: `Moderne Schreibung: ${ex.modernOrtho}\nTransliteration: ${ex.transliteration}\nBedeutung: ${ex.meaning}${ex.note ? '\nAnmerkung: ' + ex.note : ''}`,
        frontLabel: 'Rasm-Orthographie',
        backLabel: 'Moderne Schreibung und Erklärung',
        interval: 1,
        ease: 2.5,
        nextReview: null,
        history: [],
        meta: {
          category: cat.id,
          categoryTitle: cat.title,
          quranOrtho: ex.quranOrtho,
          modernOrtho: ex.modernOrtho,
          locations: ex.locations,
        },
      })
    })
  })
  return cards
}

// ============================================================================
// Card Type 8: Disambiguation Cards
// ============================================================================

function generateDisambiguationCards() {
  const cards = []
  const entries = ambiguities?.entries || []
  entries.forEach((entry) => {
    if (!entry.options || entry.options.length < 2) return
    const optionsText = entry.options.map((opt, i) =>
      `${i + 1}. ${opt.vocalized} — ${opt.meaning_de || opt.meaning_en}${opt.root ? ' (Wurzel: ' + opt.root + ')' : ''}${opt.form ? ' [' + opt.form + ']' : ''}`
    ).join('\n')
    cards.push({
      id: `disambiguation_${entry.id}`,
      type: 'disambiguation',
      front: entry.consonants,
      back: optionsText,
      frontLabel: 'Mehrdeutige Form',
      backLabel: 'Alle gültigen Lesungen',
      interval: 1,
      ease: 2.5,
      nextReview: null,
      history: [],
      meta: {
        location: entry.location,
        consonants: entry.consonants,
        optionCount: entry.options.length,
        options: entry.options,
      },
    })
  })
  return cards
}

// ============================================================================
// Card Type 9: I'jam Cards
// ============================================================================

const IJAM_MAP = [
  { skeleton: '\u066E', label: 'Zahngruppe', letters: [
    { letter: '\u0628', name: 'ba', dots: '1 Punkt unten' },
    { letter: '\u062A', name: 'ta', dots: '2 Punkte oben' },
    { letter: '\u062B', name: 'tha', dots: '3 Punkte oben' },
    { letter: '\u0646', name: 'nun', dots: '1 Punkt oben' },
    { letter: '\u064A', name: 'ya', dots: '2 Punkte unten' },
  ]},
  { skeleton: '\u062D', label: 'Hakengruppe', letters: [
    { letter: '\u062D', name: 'ha', dots: 'kein Punkt' },
    { letter: '\u062C', name: 'jim', dots: '1 Punkt unten' },
    { letter: '\u062E', name: 'kha', dots: '1 Punkt oben' },
  ]},
  { skeleton: '\u062F', label: 'Strichgruppe kurz', letters: [
    { letter: '\u062F', name: 'dal', dots: 'kein Punkt' },
    { letter: '\u0630', name: 'dhal', dots: '1 Punkt oben' },
  ]},
  { skeleton: '\u0631', label: 'Strichgruppe lang', letters: [
    { letter: '\u0631', name: 'ra', dots: 'kein Punkt' },
    { letter: '\u0632', name: 'zay', dots: '1 Punkt oben' },
  ]},
  { skeleton: '\u0633', label: 'Zahnreihe', letters: [
    { letter: '\u0633', name: 'sin', dots: 'kein Punkt' },
    { letter: '\u0634', name: 'shin', dots: '3 Punkte oben' },
  ]},
  { skeleton: '\u0635', label: 'Emphatische Gruppe 1', letters: [
    { letter: '\u0635', name: 'sad', dots: 'kein Punkt' },
    { letter: '\u0636', name: 'dad', dots: '1 Punkt oben' },
  ]},
  { skeleton: '\u0637', label: 'Emphatische Gruppe 2', letters: [
    { letter: '\u0637', name: 'ta (emph.)', dots: 'kein Punkt' },
    { letter: '\u0638', name: 'dha (emph.)', dots: '1 Punkt oben' },
  ]},
  { skeleton: '\u0639', label: 'Ain-Gruppe', letters: [
    { letter: '\u0639', name: 'ain', dots: 'kein Punkt' },
    { letter: '\u063A', name: 'ghain', dots: '1 Punkt oben' },
  ]},
  { skeleton: '\u0641', label: 'Fa-Qaf-Gruppe', letters: [
    { letter: '\u0641', name: 'fa', dots: '1 Punkt oben' },
    { letter: '\u0642', name: 'qaf', dots: '2 Punkte oben' },
  ]},
]

function generateIjamCards() {
  return IJAM_MAP.map((group) => {
    const lettersList = group.letters.map(l =>
      `${l.letter} (${l.name}) — ${l.dots}`
    ).join('\n')
    return {
      id: `ijam_${group.skeleton}`,
      type: 'ijam',
      front: group.skeleton,
      back: `Gruppe: ${group.label}\n${lettersList}`,
      frontLabel: 'Buchstabenskelett',
      backLabel: 'Mögliche Buchstaben',
      interval: 1,
      ease: 2.5,
      nextReview: null,
      history: [],
      meta: {
        skeleton: group.skeleton,
        groupLabel: group.label,
        letters: group.letters,
      },
    }
  })
}


function generateRootStarterCards() {
  if (!rootStarterCards || !Array.isArray(rootStarterCards)) return []
  return rootStarterCards.map((card, idx) => ({
    id: `root_starter_${idx}`,
    type: 'wurzel',
    front: card.front || card.root || '',
    back: card.back || `Wurzel: ${card.root}\nBedeutung: ${card.meaning}\nHäufigkeit: ${card.count}x im Quran`,
    frontLabel: 'Grundbedeutung dieser Wurzel?',
    backLabel: 'Wurzel-Information',
    interval: 1,
    ease: 2.5,
    nextReview: null,
    history: [],
    meta: { root: card.root, meaning: card.meaning, count: card.count },
  }))
}

// ============================================================================
// Sub-view: Review Session
// ============================================================================

function ReviewSession({ cards, onComplete, onRateCard }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [userInput, setUserInput] = useState('')
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [sessionResults, setSessionResults] = useState([])
  const inputRef = useRef(null)

  const currentCard = cards[currentIndex] || null
  const progress = cards.length > 0 ? currentIndex + 1 : 0
  const total = cards.length

  const handleReveal = useCallback(() => {
    setRevealed(true)
  }, [])

  const handleRate = useCallback(
    (rating) => {
      if (!currentCard) return

      const result = { cardId: currentCard.id, rating, type: currentCard.type }
      setSessionResults((prev) => [...prev, result])
      onRateCard(currentCard, rating)

      // Move to next or finish
      if (currentIndex + 1 < cards.length) {
        setCurrentIndex((prev) => prev + 1)
        setRevealed(false)
        setUserInput('')
      } else {
        onComplete([...sessionResults, result])
      }
    },
    [currentCard, currentIndex, cards.length, sessionResults, onRateCard, onComplete],
  )

  const handleKeyboardInput = useCallback((char) => {
    setUserInput((prev) => prev + char)
  }, [])

  const handleKeyboardBackspace = useCallback(() => {
    setUserInput((prev) => prev.slice(0, -1))
  }, [])

  const handleKeyboardClear = useCallback(() => {
    setUserInput('')
  }, [])

  const handleInputKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !revealed) {
        handleReveal()
      }
    },
    [revealed, handleReveal],
  )

  if (!currentCard) {
    return (
      <div className="module-page" style={{ textAlign: 'center', paddingTop: '60px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>
          {'\u2705'}
        </div>
        <h3 style={{ color: 'var(--accent-teal)', marginBottom: '8px' }}>
          Keine Karten zur Wiederholung
        </h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          Alle fälligen Karten wurden bearbeitet.
        </p>
      </div>
    )
  }

  const typeInfo = CARD_TYPES[currentCard.type] || {
    label: currentCard.type,
    color: 'var(--text-secondary)',
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      {/* Progress bar */}
      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '6px',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
          }}
        >
          <span>
            Karte {progress} von {total}
          </span>
          <span
            style={{
              color: typeInfo.color,
              fontWeight: 600,
              padding: '2px 8px',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${typeInfo.color}40`,
            }}
          >
            {typeInfo.label}
          </span>
        </div>
        <div
          style={{
            height: '4px',
            background: 'var(--border)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${(progress / total) * 100}%`,
              height: '100%',
              background: 'var(--accent-teal)',
              transition: 'width 0.3s ease',
              borderRadius: '2px',
            }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
        }}
      >
        {/* Front of card */}
        <div style={{ padding: '32px 24px', textAlign: 'center' }}>
          {currentCard.frontLabel && (
            <div
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {currentCard.frontLabel}
            </div>
          )}
          <div
            className="arabic"
            dir="rtl"
            style={{
              fontSize: currentCard.type === 'vers' ? '1.6rem' : '3rem',
              color: 'var(--arabic-text, var(--text-primary))',
              lineHeight: 1.6,
              marginBottom: '8px',
            }}
          >
            {currentCard.front}
          </div>
        </div>

        {/* Input area */}
        {!revealed && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border)',
              background: 'var(--bg-input, var(--bg-primary))',
            }}
          >
            <div style={{ marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Deine Antwort (optional):
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleInputKeyDown}
                dir="rtl"
                className="arabic"
                placeholder="Antwort eingeben..."
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text-primary)',
                  fontSize: '1.2rem',
                  fontFamily: 'var(--font-arabic, inherit)',
                  outline: 'none',
                }}
              />
              <button
                onClick={() => setShowKeyboard(!showKeyboard)}
                style={{
                  padding: '10px 12px',
                  background: showKeyboard ? 'var(--accent-teal-bg)' : 'var(--bg-card)',
                  border: `1px solid ${showKeyboard ? 'var(--accent-teal)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  color: showKeyboard ? 'var(--accent-teal)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                {'\u2328'} Tastatur
              </button>
            </div>

            {showKeyboard && (
              <div style={{ marginTop: '12px' }}>
                <ArabicKeyboard
                  visible={true}
                  onInput={handleKeyboardInput}
                  onBackspace={handleKeyboardBackspace}
                  onClear={handleKeyboardClear}
                  onToggle={() => setShowKeyboard(false)}
                  inputRef={inputRef}
                />
              </div>
            )}

            <button
              onClick={handleReveal}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '12px',
                background: 'var(--accent-teal)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius)',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Antwort aufdecken
            </button>
          </div>
        )}

        {/* Answer validation (shown after reveal if user typed something) */}
        {revealed && userInput.trim() && (() => {
          const stripDiacritics = s => s.replace(/[\u064B-\u065F\u0670]/g, '').replace(/\s+/g, ' ').trim()
          const userStripped = stripDiacritics(userInput)
          const backStripped = stripDiacritics(currentCard.back || '')
          const match = userStripped.length > 1 && (backStripped.includes(userStripped) || userStripped.includes(backStripped.substring(0, Math.min(backStripped.length, 10))))
          return (
            <div style={{ padding: '8px 24px', background: match ? 'rgba(34,197,94,0.1)' : 'rgba(251,191,36,0.1)', borderTop: '1px solid var(--border)', fontSize: '0.85rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span>{match ? '\u2705' : '\u{1F50D}'}</span>
              <span style={{ color: match ? '#22c55e' : '#fbbf24' }}>
                {match ? 'Deine Antwort scheint korrekt' : 'Überprüfe deine Antwort mit der Rückseite'}
              </span>
            </div>
          )
        })()}

        {/* Back of card (revealed) */}
        {revealed && (
          <div
            style={{
              borderTop: '2px solid var(--accent-teal)',
            }}
          >
            <div
              style={{
                padding: '24px',
                background: 'var(--bg-input, var(--bg-primary))',
              }}
            >
              {currentCard.backLabel && (
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {currentCard.backLabel}
                </div>
              )}

              {/* Render back content with line breaks */}
              <div
                style={{
                  fontSize: '1.05rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.8,
                }}
              >
                {currentCard.back.split('\n').map((line, i) => {
                  const [label, ...rest] = line.split(': ')
                  const value = rest.join(': ')
                  if (value && label) {
                    return (
                      <div key={i} style={{ marginBottom: '6px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {label}:{' '}
                        </span>
                        <span
                          className={containsArabic(value) ? 'arabic' : ''}
                          dir={containsArabic(value) ? 'rtl' : 'ltr'}
                          style={{
                            fontWeight: 500,
                            fontSize: containsArabic(value) ? '1.3rem' : '1rem',
                          }}
                        >
                          {value}
                        </span>
                      </div>
                    )
                  }
                  return (
                    <div key={i} style={{ marginBottom: '6px' }}>
                      {line}
                    </div>
                  )
                })}
              </div>

              {/* Quran example if particle */}
              {currentCard.meta?.example &&
                currentCard.meta.example.surah &&
                currentCard.meta.example.snippet && (
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '12px 16px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      Quran-Beispiel ({currentCard.meta.example.surah}:{currentCard.meta.example.ayah})
                    </div>
                    <div
                      className="arabic"
                      dir="rtl"
                      style={{ fontSize: '1.4rem', color: 'var(--accent-gold)' }}
                    >
                      {currentCard.meta.example.snippet}
                    </div>
                  </div>
                )}

              {/* Ambiguity display: show all valid options for ambiguous words */}
              {currentCard.isAmbiguous && currentCard.ambiguityOptions && currentCard.ambiguityOptions.length >= 2 && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '12px 16px',
                    background: 'rgba(139, 92, 246, 0.08)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: 'var(--radius)',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: '#a78bfa', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Mehrdeutiges Wort — {currentCard.ambiguityOptions.length} gültige Analysen
                  </div>
                  {currentCard.ambiguityOptions.map((opt, i) => (
                    <div key={i} style={{ marginBottom: i < currentCard.ambiguityOptions.length - 1 ? '10px' : 0, paddingBottom: i < currentCard.ambiguityOptions.length - 1 ? '10px' : 0, borderBottom: i < currentCard.ambiguityOptions.length - 1 ? '1px solid rgba(139, 92, 246, 0.15)' : 'none' }}>
                      <div className="arabic" dir="rtl" style={{ fontSize: '1.3rem', color: 'var(--accent-gold)', marginBottom: '4px' }}>
                        {opt.vocalized}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {opt.root && <span>Wurzel: {opt.root} · </span>}
                        {opt.form && <span>{opt.form} · </span>}
                        {opt.meaning_de || opt.meaning_en}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* User input comparison */}
              {userInput.trim() && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '10px 14px',
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Deine Antwort:
                  </div>
                  <div className="arabic" dir="rtl" style={{ fontSize: '1.2rem' }}>
                    {userInput}
                  </div>
                </div>
              )}
            </div>

            {/* Rating buttons */}
            <div
              style={{
                padding: '16px 24px 24px',
                background: 'var(--bg-input, var(--bg-primary))',
              }}
            >
              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  marginBottom: '10px',
                  textAlign: 'center',
                }}
              >
                Wie gut hast du die Antwort gewusst?
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px',
                }}
              >
                {RATING_BUTTONS.map((btn) => {
                  // Calculate preview of next interval
                  const preview = computeNextReview(currentCard, btn.value)
                  const intervalLabel =
                    preview.interval === 1
                      ? '1 Tag'
                      : preview.interval < 30
                        ? `${preview.interval} Tage`
                        : preview.interval < 365
                          ? `${Math.round(preview.interval / 30)} Mon.`
                          : `${(preview.interval / 365).toFixed(1)} J.`
                  return (
                    <button
                      key={btn.value}
                      onClick={() => handleRate(btn.value)}
                      style={{
                        padding: '12px 8px',
                        background: 'var(--bg-card)',
                        border: `2px solid ${btn.color}50`,
                        borderRadius: 'var(--radius)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'border-color 0.2s, background 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = btn.color
                        e.currentTarget.style.background = btn.color + '15'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = btn.color + '50'
                        e.currentTarget.style.background = 'var(--bg-card)'
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          color: btn.color,
                        }}
                      >
                        {btn.label}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {intervalLabel}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Sub-view: Session Summary
// ============================================================================

function SessionSummary({ results, onClose }) {
  if (!results || results.length === 0) {
    return null
  }

  const totalCards = results.length
  const correct = results.filter((r) => r.rating >= 2).length
  const accuracy = Math.round((correct / totalCards) * 100)

  const byType = {}
  results.forEach((r) => {
    if (!byType[r.type]) byType[r.type] = { total: 0, correct: 0 }
    byType[r.type].total++
    if (r.rating >= 2) byType[r.type].correct++
  })

  const ratingDistribution = [0, 0, 0, 0]
  results.forEach((r) => {
    if (typeof r.rating === 'number' && r.rating >= 0 && r.rating <= 3) {
      ratingDistribution[r.rating]++
    }
  })

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '32px 24px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '8px' }}>
          {accuracy >= 80 ? '\u{1F389}' : accuracy >= 50 ? '\u{1F4AA}' : '\u{1F4DA}'}
        </div>
        <h3 style={{ color: 'var(--accent-teal)', marginBottom: '4px' }}>
          Sitzung abgeschlossen!
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          {totalCards} Karten bearbeitet
        </p>

        {/* Accuracy ring */}
        <div
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            border: `6px solid ${accuracy >= 70 ? 'var(--accent-teal)' : accuracy >= 40 ? 'var(--accent-gold)' : '#ef4444'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            flexDirection: 'column',
          }}
        >
          <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {accuracy}%
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Genauigkeit</span>
        </div>

        {/* Rating distribution */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            marginBottom: '24px',
          }}
        >
          {RATING_BUTTONS.map((btn, i) => (
            <div
              key={btn.value}
              style={{
                padding: '10px 8px',
                background: 'var(--bg-input, var(--bg-primary))',
                borderRadius: 'var(--radius)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: btn.color }}>
                {ratingDistribution[i]}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{btn.label}</div>
            </div>
          ))}
        </div>

        {/* By type */}
        {Object.keys(byType).length > 1 && (
          <div style={{ marginBottom: '24px' }}>
            <div
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginBottom: '8px',
                textTransform: 'uppercase',
              }}
            >
              Nach Kartentyp
            </div>
            {Object.entries(byType).map(([type, data]) => {
              const info = CARD_TYPES[type] || { label: type, color: 'gray' }
              const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
              return (
                <div
                  key={type}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 12px',
                    marginBottom: '4px',
                    background: 'var(--bg-input, var(--bg-primary))',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <span style={{ color: info.color, fontSize: '0.85rem', fontWeight: 500 }}>
                    {info.label}
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {data.correct}/{data.total} ({pct}%)
                  </span>
                </div>
              )
            })}
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            padding: '12px 32px',
            background: 'var(--accent-teal)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius)',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Zurück zur Übersicht
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// Sub-view: Browse Cards
// ============================================================================

function BrowseView({ allCards, onDeleteCard }) {
  const [filterType, setFilterType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('nextReview') // 'nextReview' | 'type' | 'ease' | 'created'
  const [expandedCard, setExpandedCard] = useState(null)

  const filteredCards = useMemo(() => {
    let cards = Object.values(allCards)

    if (filterType !== 'all') {
      cards = cards.filter((c) => c.type === filterType)
    }

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase()
      cards = cards.filter(
        (c) =>
          (c.front || '').toLowerCase().includes(lower) ||
          (c.back || '').toLowerCase().includes(lower) ||
          (c.id || '').toLowerCase().includes(lower),
      )
    }

    cards.sort((a, b) => {
      switch (sortBy) {
        case 'nextReview':
          return (a.nextReview || '').localeCompare(b.nextReview || '')
        case 'type':
          return (a.type || '').localeCompare(b.type || '')
        case 'ease':
          return (a.ease || 2.5) - (b.ease || 2.5)
        default:
          return 0
      }
    })

    return cards
  }, [allCards, filterType, searchTerm, sortBy])

  const typeCounts = useMemo(() => {
    const counts = { all: 0 }
    Object.values(allCards).forEach((c) => {
      counts.all++
      counts[c.type] = (counts[c.type] || 0) + 1
    })
    return counts
  }, [allCards])

  return (
    <div>
      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {/* Search */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Karten durchsuchen..."
          style={{
            flex: '1 1 200px',
            padding: '8px 12px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            outline: 'none',
          }}
        />

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: '8px 12px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            outline: 'none',
          }}
        >
          <option value="nextReview">Nächste Wiederholung</option>
          <option value="type">Typ</option>
          <option value="ease">Schwierigkeit</option>
        </select>
      </div>

      {/* Type filter buttons */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '16px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setFilterType('all')}
          style={{
            padding: '5px 12px',
            borderRadius: 'var(--radius-sm)',
            background: filterType === 'all' ? 'var(--accent-teal-bg)' : 'var(--bg-card)',
            color: filterType === 'all' ? 'var(--accent-teal)' : 'var(--text-secondary)',
            border: `1px solid ${filterType === 'all' ? 'var(--accent-teal)' : 'var(--border)'}`,
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          Alle ({typeCounts.all || 0})
        </button>
        {Object.entries(CARD_TYPES).map(([key, info]) => (
          <button
            key={key}
            onClick={() => setFilterType(key)}
            style={{
              padding: '5px 12px',
              borderRadius: 'var(--radius-sm)',
              background: filterType === key ? info.color + '20' : 'var(--bg-card)',
              color: filterType === key ? info.color : 'var(--text-secondary)',
              border: `1px solid ${filterType === key ? info.color : 'var(--border)'}`,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            {info.label} ({typeCounts[key] || 0})
          </button>
        ))}
      </div>

      {/* Card count */}
      <div
        style={{
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          marginBottom: '12px',
        }}
      >
        {filteredCards.length} Karten gefunden
      </div>

      {/* Card list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredCards.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--text-muted)',
            }}
          >
            Keine Karten gefunden.
          </div>
        )}

        {filteredCards.map((card) => {
          const info = CARD_TYPES[card.type] || { label: card.type, color: 'gray' }
          const isExpanded = expandedCard === card.id
          const isDue =
            !card.nextReview || card.nextReview <= new Date().toISOString()
          const reviewCount = (card.history || []).length
          const lastRating =
            reviewCount > 0 ? card.history[reviewCount - 1].rating : null

          return (
            <div
              key={card.id}
              style={{
                background: 'var(--bg-card)',
                border: `1px solid ${isDue ? info.color + '60' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
                borderLeft: `3px solid ${info.color}`,
              }}
            >
              <div
                onClick={() => setExpandedCard(isExpanded ? null : card.id)}
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                }}
              >
                {/* Type badge */}
                <span
                  style={{
                    fontSize: '0.65rem',
                    color: info.color,
                    background: info.color + '15',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {info.label}
                </span>

                {/* Front content */}
                <span
                  className={containsArabic(card.front) ? 'arabic' : ''}
                  dir={containsArabic(card.front) ? 'rtl' : 'ltr'}
                  style={{
                    flex: 1,
                    fontSize: containsArabic(card.front) ? '1.1rem' : '0.9rem',
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {card.front}
                </span>

                {/* Status indicators */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                  {isDue && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        background: '#ef444420',
                        color: '#ef4444',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 600,
                      }}
                    >
                      Fällig
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {card.interval}d / E:{(card.ease || 2.5).toFixed(1)}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {isExpanded ? '\u25B2' : '\u25BC'}
                  </span>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderTop: '1px solid var(--border)',
                    background: 'var(--bg-input, var(--bg-primary))',
                  }}
                >
                  <div style={{ marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Rückseite:
                    </span>
                    <div
                      style={{
                        fontSize: '0.9rem',
                        color: 'var(--text-primary)',
                        lineHeight: 1.6,
                        marginTop: '4px',
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {card.back}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                      gap: '8px',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Intervall: </span>
                      <span style={{ color: 'var(--text-primary)' }}>{card.interval} Tage</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Ease: </span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        {(card.ease || 2.5).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Wiederholungen: </span>
                      <span style={{ color: 'var(--text-primary)' }}>{reviewCount}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Nächste: </span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        {card.nextReview
                          ? new Date(card.nextReview).toLocaleDateString('de-DE')
                          : 'Jetzt'}
                      </span>
                    </div>
                    {lastRating !== null && (
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Letzte Bewertung: </span>
                        <span style={{ color: RATING_BUTTONS[lastRating]?.color || 'inherit' }}>
                          {RATING_BUTTONS[lastRating]?.label || lastRating}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* History timeline */}
                  {reviewCount > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          marginBottom: '6px',
                        }}
                      >
                        Verlauf:
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {(card.history || []).slice(-20).map((h, i) => (
                          <span
                            key={i}
                            title={`${new Date(h.date).toLocaleDateString('de-DE')} - ${RATING_BUTTONS[h.rating]?.label || h.rating}`}
                            style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              background: RATING_BUTTONS[h.rating]?.color || '#888',
                              display: 'inline-block',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Delete button */}
                  <div style={{ marginTop: '12px', textAlign: 'right' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (window.confirm(`Karte "${card.front}" wirklich löschen?`)) {
                          onDeleteCard(card.id)
                        }
                      }}
                      style={{
                        padding: '4px 12px',
                        background: 'transparent',
                        border: '1px solid #ef444450',
                        borderRadius: 'var(--radius-sm)',
                        color: '#ef4444',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// Sub-view: Statistics
// ============================================================================

function StatsView({ allCards }) {
  const cards = Object.values(allCards)
  const total = cards.length
  const now = new Date().toISOString()

  const dueCount = cards.filter((c) => !c.nextReview || c.nextReview <= now).length
  const learnedCount = cards.filter((c) => (c.history || []).length > 0).length
  const newCount = cards.filter((c) => (c.history || []).length === 0).length
  const matureCount = cards.filter((c) => (c.interval || 1) >= 21).length

  // Overall accuracy
  let totalReviews = 0
  let correctReviews = 0
  cards.forEach((c) => {
    ;(c.history || []).forEach((h) => {
      totalReviews++
      if (h.rating >= 2) correctReviews++
    })
  })
  const accuracy = totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 0

  // By type
  const byType = {}
  cards.forEach((c) => {
    if (!byType[c.type]) {
      byType[c.type] = { total: 0, due: 0, reviews: 0, correct: 0, avgEase: 0, totalEase: 0 }
    }
    byType[c.type].total++
    if (!c.nextReview || c.nextReview <= now) byType[c.type].due++
    byType[c.type].totalEase += c.ease || 2.5
    ;(c.history || []).forEach((h) => {
      byType[c.type].reviews++
      if (h.rating >= 2) byType[c.type].correct++
    })
  })
  Object.values(byType).forEach((d) => {
    d.avgEase = d.total > 0 ? (d.totalEase / d.total).toFixed(2) : '2.50'
    d.accuracy = d.reviews > 0 ? Math.round((d.correct / d.reviews) * 100) : 0
  })

  // Average ease
  const avgEase =
    total > 0
      ? (cards.reduce((sum, c) => sum + (c.ease || 2.5), 0) / total).toFixed(2)
      : '2.50'

  // Daily reviews for last 30 days
  const dailyReviews = {}
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toLocaleDateString('en-CA')
    dailyReviews[key] = { total: 0, correct: 0 }
  }
  cards.forEach((c) => {
    ;(c.history || []).forEach((h) => {
      const day = h.date?.split('T')[0]
      if (dailyReviews[day] !== undefined) {
        dailyReviews[day].total++
        if (h.rating >= 2) dailyReviews[day].correct++
      }
    })
  })

  // Streak (consecutive days with at least 1 review)
  let streak = 0
  const daysArr = Object.entries(dailyReviews).reverse()
  for (const [, data] of daysArr) {
    if (data.total > 0) {
      streak++
    } else {
      break
    }
  }

  // Find max reviews in a day for chart scaling
  const maxDailyReview = Math.max(
    1,
    ...Object.values(dailyReviews).map((d) => d.total),
  )

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      {/* Overview cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        {[
          { label: 'Gesamt', value: total, color: 'var(--text-primary)' },
          { label: 'Fällig', value: dueCount, color: '#ef4444' },
          { label: 'Gelernt', value: learnedCount, color: 'var(--accent-teal)' },
          { label: 'Neu', value: newCount, color: 'var(--accent-gold)' },
          { label: 'Reif (21+ Tage)', value: matureCount, color: '#22c55e' },
          { label: 'Genauigkeit', value: `${accuracy}%`, color: '#3b82f6' },
          { label: 'Akt. Streak', value: `${streak} T.`, color: 'var(--accent-gold)' },
          { label: 'Durchschn. Ease', value: avgEase, color: 'var(--text-secondary)' },
          { label: 'Leeches', value: getLeechCount(allCards), color: getLeechCount(allCards) > 0 ? '#ef4444' : 'var(--text-muted)' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '16px 12px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '1.6rem',
                fontWeight: 700,
                color: stat.color,
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Daily review chart (last 30 days) */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '20px',
          marginBottom: '24px',
        }}
      >
        <h4 style={{ color: 'var(--text-primary)', marginBottom: '16px', fontSize: '0.9rem' }}>
          Wiederholungen (letzte 30 Tage)
        </h4>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '2px',
            height: '100px',
          }}
        >
          {Object.entries(dailyReviews).map(([day, data]) => {
            const height = data.total > 0 ? Math.max(4, (data.total / maxDailyReview) * 100) : 2
            const correctPct = data.total > 0 ? data.correct / data.total : 0
            const barColor =
              data.total === 0
                ? 'var(--border)'
                : correctPct >= 0.7
                  ? 'var(--accent-teal)'
                  : correctPct >= 0.4
                    ? 'var(--accent-gold)'
                    : '#ef4444'
            return (
              <div
                key={day}
                title={`${new Date(day).toLocaleDateString('de-DE')}: ${data.total} Wdh., ${data.correct} korrekt`}
                style={{
                  flex: 1,
                  height: `${height}px`,
                  background: barColor,
                  borderRadius: '2px 2px 0 0',
                  minWidth: '3px',
                  transition: 'height 0.3s',
                  cursor: 'default',
                }}
              />
            )
          })}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
            marginTop: '4px',
          }}
        >
          <span>Vor 30 Tagen</span>
          <span>Heute</span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
          Gesamt: {totalReviews} Wiederholungen
        </div>
      </div>

      {/* By type */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '20px',
          marginBottom: '24px',
        }}
      >
        <h4 style={{ color: 'var(--text-primary)', marginBottom: '16px', fontSize: '0.9rem' }}>
          Nach Kartentyp
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Object.entries(byType).map(([type, data]) => {
            const info = CARD_TYPES[type] || { label: type, color: 'gray' }
            return (
              <div key={type}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '4px',
                  }}
                >
                  <span style={{ color: info.color, fontWeight: 500, fontSize: '0.85rem' }}>
                    {info.label}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {data.total} Karten | {data.due} fällig | {data.accuracy}% Genauigkeit
                  </span>
                </div>
                <div
                  style={{
                    height: '6px',
                    background: 'var(--border)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${total > 0 ? (data.total / total) * 100 : 0}%`,
                      height: '100%',
                      background: info.color,
                      borderRadius: '3px',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Ease distribution */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '20px',
        }}
      >
        <h4 style={{ color: 'var(--text-primary)', marginBottom: '16px', fontSize: '0.9rem' }}>
          Ease-Verteilung
        </h4>
        {(() => {
          const buckets = { '1.3-1.7': 0, '1.7-2.1': 0, '2.1-2.5': 0, '2.5-2.9': 0, '2.9-3.0': 0 }
          cards.forEach((c) => {
            const e = c.ease || 2.5
            if (e < 1.7) buckets['1.3-1.7']++
            else if (e < 2.1) buckets['1.7-2.1']++
            else if (e < 2.5) buckets['2.1-2.5']++
            else if (e < 2.9) buckets['2.5-2.9']++
            else buckets['2.9-3.0']++
          })
          const maxBucket = Math.max(1, ...Object.values(buckets))
          const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6']

          return (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '80px' }}>
              {Object.entries(buckets).map(([label, count], i) => (
                <div key={label} style={{ flex: 1, textAlign: 'center' }}>
                  <div
                    style={{
                      height: `${Math.max(4, (count / maxBucket) * 80)}px`,
                      background: colors[i],
                      borderRadius: '3px 3px 0 0',
                      transition: 'height 0.3s',
                    }}
                  />
                  <div
                    style={{
                      fontSize: '0.6rem',
                      color: 'var(--text-muted)',
                      marginTop: '4px',
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-secondary)',
                      fontWeight: 600,
                    }}
                  >
                    {count}
                  </div>
                </div>
              ))}
            </div>
          )
        })()}
      </div>
    </div>
  )
}

// ============================================================================
// Sub-view: Settings
// ============================================================================

function SettingsView({ srsSettings, onUpdateSettings, allCards, onResetAllCards, onAddCard }) {
  const cardCount = Object.keys(allCards).length
  const [showAddCard, setShowAddCard] = useState(false)
  const [newCard, setNewCard] = useState({ type: 'wurzel', front: '', back: '', ref: '' })

  function handleAddCard() {
    if (!newCard.front.trim() || !newCard.back.trim()) return
    if (onAddCard) {
      onAddCard({
        id: `custom_${Date.now()}`,
        type: newCard.type,
        front: newCard.front.trim(),
        back: newCard.back.trim(),
        ref: newCard.ref.trim() || null,
        interval: 0, ease: 2.5, repetitions: 0, nextReview: new Date().toISOString(),
        history: [], created: Date.now(),
      })
    }
    setNewCard({ type: 'wurzel', front: '', back: '', ref: '' })
    setShowAddCard(false)
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '24px',
        }}
      >
        <h4 style={{ color: 'var(--text-primary)', marginBottom: '20px' }}>
          SRS-Einstellungen
        </h4>

        {/* Daily new card limit */}
        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              marginBottom: '8px',
            }}
          >
            Tägliches Limit neuer Karten: {srsSettings.dailyNewLimit}
          </label>
          <input
            type="range"
            min="0"
            max="50"
            step="5"
            value={srsSettings.dailyNewLimit}
            onChange={(e) =>
              onUpdateSettings({ ...srsSettings, dailyNewLimit: parseInt(e.target.value) })
            }
            style={{ width: '100%', accentColor: 'var(--accent-teal)' }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              marginTop: '4px',
            }}
          >
            <span>0</span>
            <span>10</span>
            <span>20</span>
            <span>30</span>
            <span>40</span>
            <span>50</span>
          </div>
        </div>

        {/* Daily review limit */}
        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              marginBottom: '8px',
            }}
          >
            Tägliches Limit Wiederholungen: {srsSettings.dailyReviewLimit}
          </label>
          <input
            type="range"
            min="10"
            max="200"
            step="10"
            value={srsSettings.dailyReviewLimit}
            onChange={(e) =>
              onUpdateSettings({ ...srsSettings, dailyReviewLimit: parseInt(e.target.value) })
            }
            style={{ width: '100%', accentColor: 'var(--accent-teal)' }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              marginTop: '4px',
            }}
          >
            <span>10</span>
            <span>50</span>
            <span>100</span>
            <span>150</span>
            <span>200</span>
          </div>
        </div>

        {/* Auto-generate options */}
        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={srsSettings.autoGenerateFromModules}
              onChange={(e) =>
                onUpdateSettings({
                  ...srsSettings,
                  autoGenerateFromModules: e.target.checked,
                })
              }
              style={{ accentColor: 'var(--accent-teal)' }}
            />
            Karten automatisch aus Modul 2/3-Fortschritt erstellen
          </label>
        </div>

        {/* Card generation actions */}
        <div style={{ marginBottom: '24px' }}>
          <h5 style={{ color: 'var(--text-secondary)', marginBottom: '12px', fontSize: '0.85rem' }}>
            Kartenverwaltung
          </h5>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Aktuell: {cardCount} Karten im Deck
          </div>
          <button onClick={() => setShowAddCard(!showAddCard)} style={{
            padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--accent-teal)',
            background: showAddCard ? 'rgba(45,212,191,0.15)' : 'transparent',
            color: 'var(--accent-teal)', cursor: 'pointer', fontSize: '0.85rem', width: '100%'
          }}>
            {showAddCard ? 'Abbrechen' : 'Eigene Karte erstellen'}
          </button>
          {showAddCard && (
            <div style={{ marginTop: '12px', padding: '16px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Kartentyp</label>
                <select value={newCard.type} onChange={e => setNewCard(c => ({ ...c, type: e.target.value }))} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)' }}>
                  <option value="wurzel">Wurzel</option>
                  <option value="partikel">Partikel</option>
                  <option value="morphologie">Morphologie-Muster</option>
                  <option value="vers">Vers</option>
                  <option value="wort_kontext">Wort im Kontext</option>
                </select>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Vorderseite (Arabisch)</label>
                <input value={newCard.front} onChange={e => setNewCard(c => ({ ...c, front: e.target.value }))} dir="rtl"
                  placeholder="Arabischer Text" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontFamily: 'var(--font-arabic)', fontSize: '1.2rem', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Rückseite (Erklärung)</label>
                <textarea value={newCard.back} onChange={e => setNewCard(c => ({ ...c, back: e.target.value }))} rows={2}
                  placeholder="Deutsche Erklärung / Analyse" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: '0.9rem', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Quranreferenz (optional)</label>
                <input value={newCard.ref} onChange={e => setNewCard(c => ({ ...c, ref: e.target.value }))}
                  placeholder="z.B. 2:255" style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', boxSizing: 'border-box' }} />
              </div>
              <button onClick={handleAddCard} disabled={!newCard.front.trim() || !newCard.back.trim()} style={{
                padding: '8px 16px', borderRadius: '8px', border: 'none', width: '100%',
                background: newCard.front.trim() && newCard.back.trim() ? 'var(--accent-teal)' : 'var(--text-muted)',
                color: '#fff', cursor: newCard.front.trim() && newCard.back.trim() ? 'pointer' : 'default'
              }}>Karte hinzufügen</button>
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div
          style={{
            padding: '16px',
            border: '1px solid #ef444440',
            borderRadius: 'var(--radius)',
            marginTop: '24px',
          }}
        >
          <h5 style={{ color: '#ef4444', marginBottom: '12px', fontSize: '0.85rem' }}>
            Gefahrenzone
          </h5>
          <button
            onClick={() => {
              if (
                window.confirm(
                  'Alle SRS-Karten und den gesamten Lernfortschritt zurücksetzen? Diese Aktion kann nicht rückgängig gemacht werden.',
                )
              ) {
                onResetAllCards()
              }
            }}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid #ef4444',
              borderRadius: 'var(--radius)',
              color: '#ef4444',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Alle Karten zurücksetzen
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Main Module Component
// ============================================================================

const DEFAULT_SRS_SETTINGS = {
  dailyNewLimit: 20,
  dailyReviewLimit: 100,
  autoGenerateFromModules: true,
  initialized: false,
}

export default function Module5({ settings: _settings }) {
  const [view, setView] = useState('dashboard') // 'dashboard' | 'review' | 'browse' | 'stats' | 'settings'
  const [allCards, setAllCards] = useState({})
  const [, setDueCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [srsSettings, setSrsSettings] = useState(DEFAULT_SRS_SETTINGS)
  const [sessionResults, setSessionResults] = useState(null)
  const [reviewQueue, setReviewQueue] = useState([])
  const [newCardsToday, setNewCardsToday] = useState(0)
  const [notification, setNotification] = useState(null)

  // ---- Load all data on mount ----
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        // Load existing cards
        const existingCards = await loadAllSRSCards()
        await getDueSRSCards()

        // Load SRS settings from localStorage
        let savedSettings = DEFAULT_SRS_SETTINGS
        try {
          const raw = localStorage.getItem('srs_settings')
          if (raw) savedSettings = { ...DEFAULT_SRS_SETTINGS, ...JSON.parse(raw) }
        } catch { /* ignore parse errors */ }

        // Count new cards introduced today
        let newToday = 0
        const today = getToday()
        Object.values(existingCards).forEach((c) => {
          if ((c.history || []).length === 1) {
            const firstReview = c.history?.[0]?.date?.split('T')?.[0]
            if (firstReview === today) newToday++
          }
        })

        // Auto-generate starter cards if first run
        if (!savedSettings.initialized || Object.keys(existingCards).length === 0) {
          const cardsBefore = Object.keys(existingCards).length
          const starterCards = [
            ...generateLetterCards(),
            ...generateParticleCards(20),
          ]

          for (const card of starterCards) {
            if (!existingCards[card.id]) {
              existingCards[card.id] = card
              await saveSRSCard(card.id, card)
            }
          }

          // Also generate morphology cards
          try {
            const morphCards = generateMorphologyCards()
            for (const card of morphCards) {
              if (!existingCards[card.id]) {
                existingCards[card.id] = card
                await saveSRSCard(card.id, card)
              }
            }
          } catch (err) {
            console.warn('Morphologie-Karten konnten nicht generiert werden:', err)
          }

          // Also generate verse analysis cards
          try {
            const verseCards = generateVerseCards(existingCards)
            for (const card of verseCards) {
              if (!existingCards[card.id]) {
                existingCards[card.id] = card
                await saveSRSCard(card.id, card)
              }
            }
          } catch (err) {
            console.warn('Vers-Karten konnten nicht generiert werden:', err)
          }

          // Also generate Rasm-Orthographie cards
          try {
            const rasmCards = generateRasmCards()
            for (const card of rasmCards) {
              if (!existingCards[card.id]) {
                existingCards[card.id] = card
                await saveSRSCard(card.id, card)
              }
            }
          } catch (err) {
            console.warn('Rasm-Karten konnten nicht generiert werden:', err)
          }

          // Also generate Disambiguation cards
          try {
            const disambigCards = generateDisambiguationCards()
            for (const card of disambigCards) {
              if (!existingCards[card.id]) {
                existingCards[card.id] = card
                await saveSRSCard(card.id, card)
              }
            }
          } catch (err) {
            console.warn('Disambiguations-Karten konnten nicht generiert werden:', err)
          }

          // Also generate I'jam cards
          try {
            const ijamCards = generateIjamCards()
            for (const card of ijamCards) {
              if (!existingCards[card.id]) {
                existingCards[card.id] = card
                await saveSRSCard(card.id, card)
              }
            }
          } catch (err) {
            console.warn('Ijam-Karten konnten nicht generiert werden:', err)
          }


          // Also generate Root Starter cards (top 50 most frequent roots)
          try {
            const rootCards = generateRootStarterCards()
            for (const card of rootCards) {
              if (!existingCards[card.id]) {
                existingCards[card.id] = card
                await saveSRSCard(card.id, card)
              }
            }
          } catch (err) {
            console.warn('Root-Starter-Karten konnten nicht generiert werden:', err)
          }

          savedSettings.initialized = true
          localStorage.setItem('srs_settings', JSON.stringify(savedSettings))

          const cardsAdded = Object.keys(existingCards).length - cardsBefore
          if (cardsAdded > 0) {
            setNotification(`${cardsAdded} Starter-Karten erstellt \u2014 Buchstaben, Partikeln, Muster, Wurzeln. Los geht\u2019s!`)
            setTimeout(() => setNotification(null), 5000)
          }
        }

        // Auto-generate cards from Module 2/3 if enabled
        if (savedSettings.autoGenerateFromModules) {
          await generateCardsFromModuleProgress(existingCards)
        }

        // Refresh due list
        const freshDue = []
        const now = new Date().toISOString()
        Object.entries(existingCards).forEach(([id, card]) => {
          if (!card.nextReview || card.nextReview <= now) {
            freshDue.push({ ...card, id })
          }
        })

        setAllCards(existingCards)
        setDueCards(freshDue)
        setSrsSettings(savedSettings)
        setNewCardsToday(newToday)
      } catch (err) {
        console.error('SRS-Daten konnten nicht geladen werden:', err)
      }
      setLoading(false)
    }

    loadData()
  }, [])

  // ---- Generate cards from module progress ----
  async function generateCardsFromModuleProgress(existingCards) {
    try {
      // From analyzed words (Module 3 word analysis)
      const analyzedWords = await loadAllAnalyzedWords()
      if (analyzedWords && typeof analyzedWords === 'object') {
        Object.entries(analyzedWords).forEach(([key, word]) => {
          const cardId = `wort_kontext_${key}`
          if (!existingCards[cardId] && word.word) {
            const card = {
              id: cardId,
              type: 'wort_kontext',
              front: word.word || key,
              back: [
                word.root ? `Wurzel: ${word.root}` : null,
                word.form ? `Form: ${word.form}` : null,
                word.meaning ? `Bedeutung: ${word.meaning}` : null,
                word.vocalization ? `Vokalisierung: ${word.vocalization}` : null,
              ]
                .filter(Boolean)
                .join('\n') || `Analysiertes Wort: ${key}`,
              frontLabel: 'Wurzel + Form + Vokalisierung?',
              backLabel: 'Analyse',
              interval: 1,
              ease: 2.5,
              nextReview: null,
              history: [],
              isAmbiguous: !!word.isAmbiguous,
              ambiguityOptions: word.ambiguityOptions || null,
              ambiguityCategory: word.ambiguityCategory || null,
              meta: { source: 'module3', wordKey: key, ...word },
            }
            existingCards[cardId] = card
            saveSRSCard(cardId, card)
          }
        })
      }

      // From root notebook
      const roots = await loadAllRoots()
      if (roots && typeof roots === 'object') {
        Object.entries(roots).forEach(([key, root]) => {
          const cardId = `wurzel_${key}`
          if (!existingCards[cardId]) {
            const rootLetters = root.letters || key
            const card = {
              id: cardId,
              type: 'wurzel',
              front: typeof rootLetters === 'string' ? rootLetters : rootLetters.join('-'),
              back: [
                root.meaning ? `Bedeutung: ${root.meaning}` : null,
                root.words ? `Abgeleitete Wörter: ${root.words.length}` : null,
                root.notes ? `Notizen: ${root.notes}` : null,
              ]
                .filter(Boolean)
                .join('\n') || `Wurzel: ${key}`,
              frontLabel: 'Grundbedeutung dieser Wurzel?',
              backLabel: 'Bedeutung und abgeleitete Wörter',
              interval: 1,
              ease: 2.5,
              nextReview: null,
              history: [],
              meta: { source: 'roots', rootKey: key, ...root },
            }
            existingCards[cardId] = card
            saveSRSCard(cardId, card)
          }
        })
      }
    } catch (err) {
      console.warn('Auto-Generierung fehlgeschlagen:', err)
    }
  }

  // ---- Start review session ----
  const startReview = useCallback(() => {
    const now = new Date().toISOString()

    // Separate due and new cards
    const dueReviews = []
    const newCards = []

    Object.entries(allCards).forEach(([id, card]) => {
      const reviewCount = (card.history || []).length
      if (reviewCount === 0 && !card.nextReview) {
        newCards.push({ ...card, id })
      } else if (!card.nextReview || card.nextReview <= now) {
        dueReviews.push({ ...card, id })
      }
    })

    // ABSOLUTE RULE: Due reviews first, then new cards
    // Sort due cards by urgency (oldest due first)
    dueReviews.sort((a, b) => (a.nextReview || '').localeCompare(b.nextReview || ''))

    // Limit reviews
    const limitedDue = dueReviews.slice(0, srsSettings.dailyReviewLimit)

    // Add new cards up to daily limit
    const newLimit = Math.max(0, srsSettings.dailyNewLimit - newCardsToday)
    const limitedNew = newCards.slice(0, newLimit)

    // Due reviews MUST come before new cards
    const queue = [...limitedDue, ...limitedNew]

    if (queue.length === 0) {
      showNotification('Keine Karten zur Wiederholung oder neue Karten verfügbar.')
      return
    }

    setReviewQueue(queue)
    setSessionResults(null)
    setView('review')
  }, [allCards, srsSettings, newCardsToday, showNotification])

  // ---- Rate a card ----
  const handleRateCard = useCallback(
    async (card, rating) => {
      const updates = computeNextReview(card, rating)
      const updatedCard = { ...card, ...updates }

      // Save to storage
      await saveSRSCard(card.id, updatedCard)

      // Update local state
      setAllCards((prev) => ({
        ...prev,
        [card.id]: updatedCard,
      }))

      // Track new cards today
      if ((card.history || []).length === 0) {
        setNewCardsToday((prev) => prev + 1)
      }
    },
    [],
  )

  // ---- Handle session complete ----
  const handleSessionComplete = useCallback(
    (results) => {
      setSessionResults(results)
      setView('summary')

      // Refresh due count
      const now = new Date().toISOString()
      const freshDue = Object.entries(allCards)
        .filter(([, card]) => !card.nextReview || card.nextReview <= now)
        .map(([id, card]) => ({ ...card, id }))
      setDueCards(freshDue)
    },
    [allCards],
  )

  // ---- Delete a card ----
  // Lazily created store reference for direct operations not covered by storage.js
  const srsStore = useMemo(
    () =>
      localforage.createInstance({
        name: 'quran-arabic',
        storeName: 'srs_cards',
      }),
    [],
  )

  const handleDeleteCard = useCallback(async (cardId) => {
    try {
      await srsStore.removeItem(cardId)
    } catch (err) {
      console.warn('Karte konnte nicht aus dem Speicher gelöscht werden:', err)
    }

    setAllCards((prev) => {
      const next = { ...prev }
      delete next[cardId]
      return next
    })

    setDueCards((prev) => prev.filter((c) => c.id !== cardId))
    showNotification('Karte gelöscht.')
  }, [showNotification, srsStore])

  // ---- Reset all cards ----
  const handleResetAllCards = useCallback(async () => {
    try {
      await srsStore.clear()
    } catch (err) {
      console.warn('Speicher konnte nicht gelöscht werden:', err)
    }

    setAllCards({})
    setDueCards([])
    setNewCardsToday(0)

    const resetSettings = { ...srsSettings, initialized: false }
    setSrsSettings(resetSettings)
    localStorage.setItem('srs_settings', JSON.stringify(resetSettings))

    showNotification('Alle Karten wurden zurückgesetzt. Seite neu laden für Starter-Karten.')
  }, [srsSettings, showNotification, srsStore])

  // ---- Update SRS settings ----
  const handleUpdateSettings = useCallback((newSettings) => {
    setSrsSettings(newSettings)
    localStorage.setItem('srs_settings', JSON.stringify(newSettings))
  }, [])

  // ---- Notification helper ----
  const notificationTimeoutRef = useRef(null)
  const showNotification = useCallback((msg) => {
    setNotification(msg)
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current)
    notificationTimeoutRef.current = setTimeout(() => setNotification(null), 3000)
  }, [])
  useEffect(() => () => {
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current)
  }, [])

  // ---- Computed stats ----
  const totalCards = Object.keys(allCards).length
  const now = new Date().toISOString()
  const dueCount = Object.values(allCards).filter(
    (c) => !c.nextReview || c.nextReview <= now,
  ).length
  const newCount = Object.values(allCards).filter(
    (c) => (c.history || []).length === 0,
  ).length
  const learnedCount = totalCards - newCount

  // Overall accuracy
  let totalReviews = 0
  let correctReviews = 0
  Object.values(allCards).forEach((c) => {
    ;(c.history || []).forEach((h) => {
      totalReviews++
      if (h.rating >= 2) correctReviews++
    })
  })
  const overallAccuracy = totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 0

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="module-page" style={{ textAlign: 'center', paddingTop: '80px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--border)',
            borderTopColor: 'var(--accent-teal)',
            borderRadius: '50%',
            margin: '0 auto 16px',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p style={{ color: 'var(--text-muted)' }}>SRS-Karten werden geladen...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ---- Navigation tabs ----
  const navTabs = [
    { id: 'dashboard', label: 'Übersicht' },
    { id: 'review', label: `Wiederholen${dueCount > 0 ? ` (${dueCount})` : ''}`, highlight: dueCount > 0 },
    { id: 'browse', label: 'Durchsuchen' },
    { id: 'stats', label: 'Statistik' },
    { id: 'settings', label: 'Einstellungen' },
  ]

  return (
    <div className="module-page">
      {/* Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'var(--bg-card)',
            border: '1px solid var(--accent-teal)',
            borderRadius: 'var(--radius)',
            padding: '12px 20px',
            color: 'var(--accent-teal)',
            fontSize: '0.85rem',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          {notification}
        </div>
      )}

      {/* Header */}
      <h2 style={{ marginBottom: '4px' }}>Modul 5: SRS-Wiederholung</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
        Spaced Repetition System - Effizientes Lernen mit dem SM-2-Algorithmus
      </p>

      {/* Due card alert */}
      {dueCount > 0 && view === 'dashboard' && (
        <div
          style={{
            background: '#ef444415',
            border: '1px solid #ef444440',
            borderRadius: 'var(--radius)',
            padding: '12px 20px',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.9rem' }}>
            {dueCount} Karte{dueCount !== 1 ? 'n' : ''} zur Wiederholung fällig
          </span>
          <button
            onClick={startReview}
            style={{
              padding: '8px 20px',
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Jetzt wiederholen
          </button>
        </div>
      )}

      {/* Tab navigation */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '24px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '8px',
          flexWrap: 'wrap',
        }}
      >
        {navTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === 'review') {
                startReview()
              } else {
                setView(tab.id)
                setSessionResults(null)
              }
            }}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius) var(--radius) 0 0',
              background:
                view === tab.id
                  ? 'var(--accent-teal-bg)'
                  : tab.highlight
                    ? '#ef444415'
                    : 'transparent',
              color:
                view === tab.id
                  ? 'var(--accent-teal)'
                  : tab.highlight
                    ? '#ef4444'
                    : 'var(--text-secondary)',
              fontSize: '0.85rem',
              fontWeight: view === tab.id || tab.highlight ? 600 : 400,
              borderBottom:
                view === tab.id
                  ? '2px solid var(--accent-teal)'
                  : '2px solid transparent',
              cursor: 'pointer',
              border: 'none',
              borderBottomWidth: '2px',
              borderBottomStyle: 'solid',
              borderBottomColor: view === tab.id ? 'var(--accent-teal)' : 'transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== DASHBOARD VIEW ===== */}
      {view === 'dashboard' && (
        <div>
          {/* Quick stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '12px',
              marginBottom: '28px',
            }}
          >
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '20px 16px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {totalCards}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Karten gesamt</div>
            </div>
            <div
              style={{
                background: dueCount > 0 ? '#ef444410' : 'var(--bg-card)',
                border: `1px solid ${dueCount > 0 ? '#ef444440' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                padding: '20px 16px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: dueCount > 0 ? '#ef4444' : 'var(--text-primary)',
                }}
              >
                {dueCount}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fällig</div>
            </div>
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '20px 16px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-teal)' }}>
                {learnedCount}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Gelernt</div>
            </div>
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '20px 16px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#3b82f6' }}>
                {overallAccuracy}%
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Genauigkeit</div>
            </div>
          </div>

          {/* Card type breakdown */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '20px',
              marginBottom: '24px',
            }}
          >
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '16px', fontSize: '0.9rem' }}>
              Kartentypen
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {Object.entries(CARD_TYPES).map(([key, info]) => {
                const count = Object.values(allCards).filter((c) => c.type === key).length
                const typeDue = Object.values(allCards).filter(
                  (c) => c.type === key && (!c.nextReview || c.nextReview <= now),
                ).length
                return (
                  <div
                    key={key}
                    style={{
                      padding: '12px 16px',
                      background: 'var(--bg-input, var(--bg-primary))',
                      borderRadius: 'var(--radius)',
                      borderLeft: `3px solid ${info.color}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', color: info.color, fontWeight: 500 }}>
                        {info.label}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {count} Karten
                      </div>
                    </div>
                    {typeDue > 0 && (
                      <span
                        style={{
                          background: '#ef444420',
                          color: '#ef4444',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                        }}
                      >
                        {typeDue} fällig
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={startReview}
              disabled={dueCount === 0 && newCount === 0}
              style={{
                padding: '14px 28px',
                background:
                  dueCount > 0
                    ? 'var(--accent-teal)'
                    : newCount > 0
                      ? 'var(--accent-gold)'
                      : 'var(--border)',
                color: dueCount > 0 || newCount > 0 ? '#fff' : 'var(--text-muted)',
                border: 'none',
                borderRadius: 'var(--radius)',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: dueCount > 0 || newCount > 0 ? 'pointer' : 'not-allowed',
                flex: '1 1 200px',
              }}
            >
              {dueCount > 0
                ? `${dueCount} fällige Karten wiederholen`
                : newCount > 0
                  ? 'Neue Karten lernen'
                  : 'Keine Karten verfügbar'}
            </button>
            <button
              onClick={() => setView('browse')}
              style={{
                padding: '14px 28px',
                background: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontSize: '1rem',
                cursor: 'pointer',
                flex: '0 1 auto',
              }}
            >
              Alle Karten durchsuchen
            </button>
          </div>

          {/* Recent activity hint */}
          {totalReviews > 0 && (
            <div
              style={{
                marginTop: '24px',
                padding: '16px 20px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
              }}
            >
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontSize: '0.85rem' }}>
                Letzter Fortschritt
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                {totalReviews} Wiederholungen insgesamt durchgeführt.{' '}
                {newCardsToday > 0 && `${newCardsToday} neue Karten heute gelernt. `}
                Durchschnittlicher Ease-Faktor:{' '}
                {totalCards > 0
                  ? (
                      Object.values(allCards).reduce((sum, c) => sum + (c.ease || 2.5), 0) /
                      totalCards
                    ).toFixed(2)
                  : '2.50'}
              </p>
            </div>
          )}

          {/* SRS explanation for new users */}
          {totalReviews === 0 && (
            <div
              style={{
                marginTop: '24px',
                padding: '20px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
              }}
            >
              <h4 style={{ color: 'var(--accent-teal)', marginBottom: '12px' }}>
                Wie funktioniert SRS?
              </h4>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                <p style={{ marginBottom: '8px' }}>
                  <strong>Spaced Repetition</strong> ist eine wissenschaftlich belegte Lernmethode.
                  Karten, die du gut kennst, werden seltener gezeigt. Karten, die dir schwer fallen,
                  werden häufiger wiederholt.
                </p>
                <p style={{ marginBottom: '8px' }}>
                  <strong>So funktioniert es:</strong>
                </p>
                <ul style={{ paddingLeft: '20px', margin: '0 0 8px' }}>
                  <li>Dir wird die Vorderseite einer Karte gezeigt</li>
                  <li>Du versuchst die Antwort zu erinnern (optional eintippen)</li>
                  <li>Du deckst die Antwort auf und bewertest dich selbst</li>
                  <li>Der Algorithmus berechnet, wann die Karte erneut gezeigt wird</li>
                </ul>
                <p style={{ marginBottom: '0' }}>
                  <strong>Bewertungen:</strong> Nochmal (vergessen) | Schwer (mühsam) | Gut (korrekt) | Leicht (sofort)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== REVIEW VIEW ===== */}
      {view === 'review' && (
        <ReviewSession
          cards={reviewQueue}
          onComplete={handleSessionComplete}
          onRateCard={handleRateCard}
        />
      )}

      {/* ===== SESSION SUMMARY VIEW ===== */}
      {view === 'summary' && (
        <SessionSummary
          results={sessionResults}
          onClose={() => {
            setView('dashboard')
            setSessionResults(null)
            // Refresh due count
            const now2 = new Date().toISOString()
            const freshDue = Object.entries(allCards)
              .filter(([, card]) => !card.nextReview || card.nextReview <= now2)
              .map(([id, card]) => ({ ...card, id }))
            setDueCards(freshDue)
          }}
        />
      )}

      {/* ===== BROWSE VIEW ===== */}
      {view === 'browse' && (
        <BrowseView allCards={allCards} onDeleteCard={handleDeleteCard} />
      )}

      {/* ===== STATS VIEW ===== */}
      {view === 'stats' && <StatsView allCards={allCards} />}

      {/* ===== SETTINGS VIEW ===== */}
      {view === 'settings' && (
        <SettingsView
          srsSettings={srsSettings}
          onUpdateSettings={handleUpdateSettings}
          allCards={allCards}
          onResetAllCards={handleResetAllCards}
          onAddCard={(card) => {
            setAllCards(prev => ({ ...prev, [card.id]: card }))
          }}
        />
      )}
    </div>
  )
}
