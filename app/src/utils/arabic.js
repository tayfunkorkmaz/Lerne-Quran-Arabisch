/**
 * Arabic text utilities for Quranic Arabic learning.
 * Transliteration, root extraction, prefix/suffix handling.
 */

// ===== Transliteration Mappings =====

const LATIN_TO_ARABIC = {
  // Standard consonants
  'ʾ': 'ء', "'": 'ء',  // hamza
  'b': 'ب',
  't': 'ت',
  'ṯ': 'ث', 'th': 'ث',
  'ǧ': 'ج', 'j': 'ج',
  'ḥ': 'ح', 'H': 'ح',
  'ḫ': 'خ', 'kh': 'خ',
  'd': 'د',
  'ḏ': 'ذ', 'dh': 'ذ',
  'r': 'ر',
  'z': 'ز',
  's': 'س',
  'š': 'ش', 'sh': 'ش',
  'ṣ': 'ص', 'S': 'ص',
  'ḍ': 'ض', 'D': 'ض',
  'ṭ': 'ط', 'T': 'ط',
  'ẓ': 'ظ', 'Z': 'ظ',
  'ʿ': 'ع', '`': 'ع',
  'ġ': 'غ', 'gh': 'غ',
  'f': 'ف',
  'q': 'ق',
  'k': 'ك',
  'l': 'ل',
  'm': 'م',
  'n': 'ن',
  'h': 'ه',
  'w': 'و',
  'y': 'ي',

  // Vowels (for vocalization input)
  'a': 'َ',   // fatha
  'u': 'ُ',   // damma
  'i': 'ِ',   // kasra
  'ā': 'ا',   // alif
  'ū': 'و',   // long u
  'ī': 'ي',   // long i
  'an': 'ً',  // tanwin fatha
  'un': 'ٌ',  // tanwin damma
  'in': 'ٍ',  // tanwin kasra
}

const ARABIC_TO_LATIN = {
  'ء': 'ʾ',
  'ب': 'b',
  'ت': 't',
  'ث': 'ṯ',
  'ج': 'ǧ',
  'ح': 'ḥ',
  'خ': 'ḫ',
  'د': 'd',
  'ذ': 'ḏ',
  'ر': 'r',
  'ز': 'z',
  'س': 's',
  'ش': 'š',
  'ص': 'ṣ',
  'ض': 'ḍ',
  'ط': 'ṭ',
  'ظ': 'ẓ',
  'ع': 'ʿ',
  'غ': 'ġ',
  'ف': 'f',
  'ق': 'q',
  'ك': 'k',
  'ل': 'l',
  'م': 'm',
  'ن': 'n',
  'ه': 'h',
  'و': 'w',
  'ي': 'y',
  'ا': 'ā',
  'إ': 'ʾi',
  'أ': 'ʾa',
  'آ': 'ʾā',
  'ؤ': 'ʾu',
  'ئ': 'ʾi',
  'ة': 'h',
  'ى': 'ā',
}

// Root consonant letters (the 28 base letters, no vowels)
const ROOT_CONSONANTS = new Set([
  'ء', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز',
  'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك',
  'ل', 'م', 'ن', 'ه', 'و', 'ي',
])

// ===== Vowel Mark Stripping =====

// Unified tashkil regex: U+064B-0652 (standard tashkil) + U+0656 (subscript alef) + U+0657 (inverted damma)
// KEEPS U+0670 Alif Khanjariyya (orthographic, not a vowel mark)
export const TASHKIL_REGEX_SOURCE = '[\\u064B-\\u0655\\u0657\\u0656\\u06D6-\\u06ED\\u0615-\\u061A]'
const VOWEL_MARKS_REGEX = new RegExp(TASHKIL_REGEX_SOURCE, 'g')
const TATWEEL_REGEX = /\u0640/g  // kashida/tatweel

/**
 * Strip all vowel marks (tashkeel/diacritics) from Arabic text.
 * @param {string} text - Arabic text with possible diacritics.
 * @returns {string} Text with all diacritics removed.
 */
export function stripVowelMarks(text) {
  if (typeof text !== 'string') return ''
  return text.replace(VOWEL_MARKS_REGEX, '')
}

/**
 * Strip tashkil (vowel marks) but KEEP Uthmani orthographic markers:
 * Preserves U+0670 Alif Khanjariyya and U+0671 Alif Wasla.
 * Use for the Uthmani-Konsonantal text layer.
 */
export function stripTashkilKeepUthmani(text) {
  if (typeof text !== 'string') return ''
  return text.replace(VOWEL_MARKS_REGEX, '')
}

/**
 * Strip tatweel (kashida) characters from Arabic text.
 * @param {string} text
 * @returns {string}
 */
export function stripTatweel(text) {
  if (typeof text !== 'string') return ''
  return text.replace(TATWEEL_REGEX, '')
}

/**
 * Clean Arabic text by removing vowels and tatweel.
 * @param {string} text
 * @returns {string}
 */
export function cleanArabicText(text) {
  return stripTatweel(stripVowelMarks(text))
}

// ===== Basmala Normalization =====

// The Basmala patterns in rasm and uthmani layers (embedded in verse 1).
// In these layers, surahs 2-114 (except 9) have the Basmala prepended to verse 1.
// simple-clean and vocalized separate it. This function strips it for alignment.
const BASMALA_RASM = 'ٮسم الله الرحمٮ الرحىم'
const BASMALA_UTHMANI_STRIPPED = 'بسم الله الرحمن الرحيم' // after stripping tashkil

/**
 * Strip the Basmala prefix from verse 1 text in rasm/uthmani layers.
 * In these data files, surahs 2-114 (except 9) embed the Basmala in verse 1.
 * This function removes it so the verse text aligns with simple-clean/vocalized.
 *
 * @param {string} text - The verse text from rasm or uthmani
 * @param {string} layerId - 'rasm' or 'uthmani' (or anything else = no-op)
 * @param {number} surahNum - 1-114
 * @param {number} verseNum - verse number
 * @returns {string} Normalized text without embedded Basmala
 */
export function stripEmbeddedBasmala(text, layerId, surahNum, verseNum) {
  if (!text || verseNum !== 1 || surahNum === 1 || surahNum === 9) return text
  if (layerId !== 'rasm' && layerId !== 'uthmani') return text

  if (layerId === 'rasm') {
    if (text.startsWith(BASMALA_RASM)) {
      const stripped = text.slice(BASMALA_RASM.length).trimStart()
      return stripped || text
    }
  }

  if (layerId === 'uthmani') {
    // Uthmani text has tashkil, so we compare stripped versions
    const textStripped = stripVowelMarks(text)
    if (textStripped.startsWith(BASMALA_UTHMANI_STRIPPED)) {
      // Find where the Basmala ends in the original (tashkil-bearing) text.
      // The Basmala is always 4 words: بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
      const words = text.split(/\s+/)
      if (words.length > 4) {
        const stripped = words.slice(4).join(' ')
        return stripped || text
      }
    }
  }

  return text
}

// ===== Transliteration =====

/**
 * Convert a Latin transliteration root notation to Arabic.
 * Supports dash-separated format: k-t-b -> ك-ت-ب
 * Also supports continuous: ktb -> كتب
 *
 * @param {string} latin - Latin transliteration.
 * @returns {string} Arabic text.
 */
export function transliterateToArabic(latin) {
  if (!latin) return ''

  // Handle dash-separated root notation
  if (latin.includes('-')) {
    const parts = latin.split('-').map(part => transliterateToArabic(part.trim()))
    return parts.join('-')
  }

  let result = ''
  let i = 0

  while (i < latin.length) {
    // Try two-character combinations first (check original case, then lowercase)
    if (i + 1 < latin.length) {
      const twoChar = latin.substring(i, i + 2)
      if (LATIN_TO_ARABIC[twoChar]) {
        result += LATIN_TO_ARABIC[twoChar]
        i += 2
        continue
      }
      const twoCharLower = twoChar.toLowerCase()
      if (twoCharLower !== twoChar && LATIN_TO_ARABIC[twoCharLower]) {
        result += LATIN_TO_ARABIC[twoCharLower]
        i += 2
        continue
      }
    }

    // Try single character (check original case first for emphatics, then lowercase fallback)
    const oneChar = latin[i]
    if (LATIN_TO_ARABIC[oneChar]) {
      result += LATIN_TO_ARABIC[oneChar]
    } else {
      const oneCharLower = oneChar.toLowerCase()
      if (oneCharLower !== oneChar && LATIN_TO_ARABIC[oneCharLower]) {
        result += LATIN_TO_ARABIC[oneCharLower]
      } else {
        result += oneChar  // Keep unknown characters as-is
      }
    }
    i++
  }

  return result
}

/**
 * Convert an Arabic root to Latin transliteration.
 * Supports dash-separated: ك-ت-ب -> k-t-b
 *
 * @param {string} arabic - Arabic text.
 * @returns {string} Latin transliteration.
 */
export function transliterateToLatin(arabic) {
  if (!arabic) return ''

  // Handle dash-separated root notation
  if (arabic.includes('-')) {
    const parts = arabic.split('-').map(part => transliterateToLatin(part.trim()))
    return parts.join('-')
  }

  let result = ''
  const clean = stripVowelMarks(arabic)

  for (const char of clean) {
    if (ARABIC_TO_LATIN[char]) {
      result += ARABIC_TO_LATIN[char]
    } else if (char === ' ') {
      result += ' '
    } else {
      result += char
    }
  }

  return result
}

// ===== Root Extraction Helpers =====

/**
 * Known Arabic prefixes that may appear before the root pattern.
 * Ordered from longest to shortest for greedy matching.
 */
const PREFIXES = [
  'وال', 'فال', 'بال', 'كال', 'لل',   // combinations with al-
  'ال',                                    // definite article
  'وب', 'ول', 'وك', 'فب', 'فل', 'فك',   // conjunction + preposition
  'لي', 'لت', 'لن', 'لأ',                // lam + imperfect prefix
  'سي', 'ست', 'سن', 'سأ',                // sa- (future) + imperfect prefix
  'و', 'ف', 'ب', 'ل', 'ك',              // single-letter particles
  'ي', 'ت', 'ن', 'أ',                    // imperfect prefixes
  'م', 'ا',                               // participial/masdar prefix
]

/**
 * Known Arabic suffixes that may appear after the root pattern.
 * Ordered from longest to shortest for greedy matching.
 */
const SUFFIXES = [
  'كموها', 'كموهم',                               // complex endings
  'وهما', 'تهما',                                   // dual + pronoun
  'تموها', 'تموهم',                                 // 2mp + pronoun
  'ونها', 'ونهم', 'ينها', 'ينهم',                  // plural + pronoun
  'وها', 'وهم', 'اها', 'اهم',                      // verb endings + pronoun
  'تمو', 'كمو',                                     // plural endings
  'هما', 'كما',                                     // dual pronouns
  'ون', 'ين',                                       // masculine plural
  'ات', 'وا',                                       // feminine plural / 3mp
  'ان', 'تا',                                       // dual
  'نا', 'هم', 'هن', 'كم', 'كن',                    // attached pronouns
  'ها', 'هو',                                       // 3fs/3ms pronoun
  'ني', 'ك',                                        // 1s/2s pronouns
  'ت', 'ة',                                         // taa marbuta / verb ending
  'ه', 'ي',                                         // pronoun suffixes
  'ا', 'و', 'ن',                                    // alif/waw/nun endings
]

/**
 * Attempt to strip known prefixes from an Arabic word.
 * Returns the word with prefix removed and the prefix itself.
 *
 * @param {string} word - Arabic word (cleaned of vowels).
 * @returns {{stem: string, prefix: string}}
 */
export function stripPrefixes(word) {
  const clean = cleanArabicText(word)

  for (const prefix of PREFIXES) {
    if (clean.startsWith(prefix) && clean.length > prefix.length + 1) {
      return { stem: clean.slice(prefix.length), prefix }
    }
  }

  return { stem: clean, prefix: '' }
}

/**
 * Attempt to strip known suffixes from an Arabic word.
 * Returns the word with suffix removed and the suffix itself.
 *
 * @param {string} word - Arabic word (cleaned of vowels).
 * @returns {{stem: string, suffix: string}}
 */
export function stripSuffixes(word) {
  const clean = cleanArabicText(word)

  for (const suffix of SUFFIXES) {
    if (clean.endsWith(suffix) && clean.length > suffix.length + 1) {
      return { stem: clean.slice(0, -suffix.length), suffix }
    }
  }

  return { stem: clean, suffix: '' }
}

/**
 * Attempt to extract a root from an Arabic word by stripping
 * known prefixes and suffixes. This is a heuristic aid, not definitive.
 *
 * @param {string} word - Arabic word.
 * @returns {{possibleRoot: string, prefix: string, suffix: string, letters: string[]}}
 */
export function extractRootCandidate(word) {
  const { stem: afterPrefix, prefix } = stripPrefixes(word)
  const { stem, suffix } = stripSuffixes(afterPrefix)

  // Extract only consonant letters (skip alif, waw, ya as weak root letters are complex)
  const letters = [...stem].filter(ch => ROOT_CONSONANTS.has(ch))

  return {
    possibleRoot: letters.join(''),
    prefix,
    suffix,
    letters,
    formatted: letters.join('-'),
  }
}

// ===== Word Boundary Detection =====

/**
 * Split Arabic text into individual words.
 * Handles standard word boundaries (spaces) and special cases.
 *
 * @param {string} text - Arabic text.
 * @returns {string[]} Array of individual words.
 */
export function splitIntoWords(text) {
  if (!text) return []

  // Split on whitespace and filter empty strings
  return text
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0)
}

/**
 * Check if a character is an Arabic letter (not a diacritic or punctuation).
 * @param {string} char
 * @returns {boolean}
 */
export function isArabicLetter(char) {
  const code = char.charCodeAt(0)
  // Arabic block: 0600-06FF, excluding diacritics 064B-0652
  return (code >= 0x0621 && code <= 0x064A) ||
         (code >= 0x0671 && code <= 0x06D3)
}

/**
 * Check if a string contains Arabic characters.
 * @param {string} text
 * @returns {boolean}
 */
export function containsArabic(text) {
  return /[\u0621-\u064A\u066E-\u066F\u0671-\u06D3]/.test(text)
}

/**
 * Format a root as dash-separated Arabic letters.
 * e.g., "كتب" -> "ك-ت-ب"
 *
 * @param {string} root - Consecutive root letters.
 * @returns {string} Dash-separated root.
 */
export function formatRoot(root) {
  if (!root) return ''
  const letters = [...cleanArabicText(root)].filter(ch => ROOT_CONSONANTS.has(ch))
  return letters.join('-')
}

/**
 * Get all 29 Arabic letters (including hamza and alif) in standard order.
 * @returns {string[]}
 */
export function getArabicAlphabet() {
  return [
    'ء', 'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ',
    'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض',
    'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل',
    'م', 'ن', 'ه', 'و', 'ي',
  ]
}

/**
 * Get Arabic vowel marks for vocalization input.
 * @returns {Array<{name: string, nameDE: string, char: string, unicode: string}>}
 */
// ===== I'jam (Dot) Stripping =====

/**
 * Map dotted Arabic letters to their undotted skeletal (rasm) forms.
 * Strips the i'jam dots to reveal the pure consonantal skeleton
 * as it would have appeared in early Quranic manuscripts.
 */
export const IJAM_MAP = {
  // --- I'jam (dot) stripping: dotted → undotted skeletal forms ---
  '\u0628': '\u066E', // ب → ٮ (ba → dotless ba)
  '\u062A': '\u066E', // ت → ٮ (ta → dotless ba)
  '\u062B': '\u066E', // ث → ٮ (tha → dotless ba)
  '\u0646': '\u066E', // ن → ٮ (nun → dotless ba)
  '\u062C': '\u062D', // ج → ح (jim → ha)
  '\u062E': '\u062D', // خ → ح (kha → ha)
  '\u0630': '\u062F', // ذ → د (dhal → dal)
  '\u0632': '\u0631', // ز → ر (zay → ra)
  '\u0634': '\u0633', // ش → س (shin → sin)
  '\u0636': '\u0635', // ض → ص (dad → sad)
  '\u0638': '\u0637', // ظ → ط (za → ta)
  '\u063A': '\u0639', // غ → ع (ghayn → ayn)
  '\u0641': '\u06A1', // ف → ڡ (fa → dotless fa)
  '\u0642': '\u06A1', // ق → ڡ (qaf → dotless fa — in early rasm fa and qaf were identical)
  '\u064A': '\u0649', // ي → ى (ya → alif maqsura / dotless ya)
  // --- Hamza stripping: hamza was not written in early manuscripts ---
  '\u0621': '',        // ء → (remove — standalone hamza did not exist in rasm)
  '\u0623': '\u0627',  // أ → ا (hamza on alif above → plain alif)
  '\u0625': '\u0627',  // إ → ا (hamza on alif below → plain alif)
  '\u0624': '\u0648',  // ؤ → و (hamza on waw → plain waw)
  '\u0626': '\u0649',  // ئ → ى (hamza on ya → dotless ya)
  '\u0622': '\u0627',  // آ → ا (alif madda → plain alif)
}

/**
 * Strip all i'jam (diacritical dots) from Arabic text,
 * reducing it to the pure consonantal skeleton (rasm).
 * @param {string} text - Arabic text
 * @returns {string} Text with dots removed from letters
 */
export function stripIjam(text) {
  let result = ''
  for (const char of text) {
    result += IJAM_MAP[char] || char
  }
  return result
}

export function getVowelMarks() {
  return [
    { name: 'fatha', nameDE: 'Fatha', char: '\u064E', unicode: 'U+064E' },
    { name: 'damma', nameDE: 'Damma', char: '\u064F', unicode: 'U+064F' },
    { name: 'kasra', nameDE: 'Kasra', char: '\u0650', unicode: 'U+0650' },
    { name: 'fathatan', nameDE: 'Tanwin Fatha', char: '\u064B', unicode: 'U+064B' },
    { name: 'dammatan', nameDE: 'Tanwin Damma', char: '\u064C', unicode: 'U+064C' },
    { name: 'kasratan', nameDE: 'Tanwin Kasra', char: '\u064D', unicode: 'U+064D' },
    { name: 'shadda', nameDE: 'Schadda', char: '\u0651', unicode: 'U+0651' },
    { name: 'sukun', nameDE: 'Sukun', char: '\u0652', unicode: 'U+0652' },
  ]
}
