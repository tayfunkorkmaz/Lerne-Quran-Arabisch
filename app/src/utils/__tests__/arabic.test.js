/**
 * Tests for src/utils/arabic.js
 */
import { describe, it, expect } from 'vitest'
import {
  cleanArabicText,
  stripVowelMarks,
  stripTashkilKeepUthmani,
  stripEmbeddedBasmala,
  splitIntoWords,
  stripPrefixes,
  stripSuffixes,
  containsArabic,
  TASHKIL_REGEX_SOURCE,
  transliterateToArabic,
  transliterateToLatin,
  formatRoot,
  isArabicLetter,
  stripIjam,
  getVowelMarks,
  getArabicAlphabet,
  extractRootCandidate,
} from '../arabic.js'

// ===== cleanArabicText =====
describe('cleanArabicText', () => {
  it('strips tashkil and tatweel from Arabic text', () => {
    // bismi with vowels -> bsm without vowels
    const input = 'بِسْمِ'
    const result = cleanArabicText(input)
    expect(result).toBe('بسم')
  })

  it('strips tatweel (kashida) characters', () => {
    const input = 'كـــتاب'  // with tatweel
    const result = cleanArabicText(input)
    expect(result).toBe('كتاب')
  })

  it('handles text without diacritics (no-op)', () => {
    const input = 'كتاب'
    expect(cleanArabicText(input)).toBe('كتاب')
  })

  it('handles empty string', () => {
    expect(cleanArabicText('')).toBe('')
  })

  it('strips all standard tashkil marks together', () => {
    // fatha, damma, kasra, shadda, sukun, tanwin
    const input = 'كَتَبُوا'
    const result = cleanArabicText(input)
    // Should have no diacritics remaining
    expect(result).not.toMatch(new RegExp(TASHKIL_REGEX_SOURCE))
  })
})

// ===== stripVowelMarks =====
describe('stripVowelMarks', () => {
  it('removes fatha (U+064E)', () => {
    expect(stripVowelMarks('كَ')).toBe('ك')
  })

  it('removes damma (U+064F)', () => {
    expect(stripVowelMarks('كُ')).toBe('ك')
  })

  it('removes kasra (U+0650)', () => {
    expect(stripVowelMarks('كِ')).toBe('ك')
  })

  it('removes shadda (U+0651)', () => {
    expect(stripVowelMarks('كّ')).toBe('ك')
  })

  it('removes sukun (U+0652)', () => {
    expect(stripVowelMarks('كْ')).toBe('ك')
  })

  it('removes tanwin fatha (U+064B)', () => {
    expect(stripVowelMarks('كً')).toBe('ك')
  })

  it('removes tanwin damma (U+064C)', () => {
    expect(stripVowelMarks('كٌ')).toBe('ك')
  })

  it('removes tanwin kasra (U+064D)', () => {
    expect(stripVowelMarks('كٍ')).toBe('ك')
  })

  it('removes subscript alef (U+0656)', () => {
    expect(stripVowelMarks('ك\u0656')).toBe('ك')
  })

  it('removes inverted damma (U+0657)', () => {
    expect(stripVowelMarks('ك\u0657')).toBe('ك')
  })

  it('removes multiple diacritics from a real word', () => {
    // al-hamdu -> alhamd
    const result = stripVowelMarks('الْحَمْدُ')
    expect(result).toBe('الحمد')
  })

  it('preserves Alif Khanjariyya (U+0670)', () => {
    // The TASHKIL_REGEX_SOURCE explicitly keeps U+0670
    const text = 'رَحْمَٰنِ'  // U+0670 is the superscript alif
    const result = stripVowelMarks(text)
    expect(result).toContain('\u0670')
  })
})

// ===== splitIntoWords =====
describe('splitIntoWords', () => {
  it('splits Arabic text on whitespace', () => {
    const result = splitIntoWords('بسم الله الرحمن الرحيم')
    expect(result).toEqual(['بسم', 'الله', 'الرحمن', 'الرحيم'])
  })

  it('returns empty array for null/undefined input', () => {
    expect(splitIntoWords(null)).toEqual([])
    expect(splitIntoWords(undefined)).toEqual([])
    expect(splitIntoWords('')).toEqual([])
  })

  it('handles single word', () => {
    expect(splitIntoWords('كتاب')).toEqual(['كتاب'])
  })

  it('handles multiple spaces between words', () => {
    const result = splitIntoWords('بسم   الله')
    expect(result).toEqual(['بسم', 'الله'])
  })

  it('trims leading and trailing whitespace', () => {
    const result = splitIntoWords('  بسم الله  ')
    expect(result).toEqual(['بسم', 'الله'])
  })
})

// ===== stripPrefixes =====
describe('stripPrefixes', () => {
  it('strips al- (definite article) from a word', () => {
    const result = stripPrefixes('الكتاب')
    expect(result.prefix).toBe('ال')
    expect(result.stem).toBe('كتاب')
  })

  it('strips wa-al (conjunction + article)', () => {
    const result = stripPrefixes('والكتاب')
    expect(result.prefix).toBe('وال')
    expect(result.stem).toBe('كتاب')
  })

  it('strips bi-al', () => {
    const result = stripPrefixes('بالكتاب')
    expect(result.prefix).toBe('بال')
    expect(result.stem).toBe('كتاب')
  })

  it('strips fa-al', () => {
    const result = stripPrefixes('فالكتاب')
    expect(result.prefix).toBe('فال')
    expect(result.stem).toBe('كتاب')
  })

  it('strips single-letter ba prefix', () => {
    const result = stripPrefixes('بكتاب')
    expect(result.prefix).toBe('ب')
    expect(result.stem).toBe('كتاب')
  })

  it('strips single-letter la prefix', () => {
    const result = stripPrefixes('لكتاب')
    expect(result.prefix).toBe('ل')
    expect(result.stem).toBe('كتاب')
  })

  it('strips wa+ka compound prefix from وكتاب', () => {
    // وك is matched before و because PREFIXES lists compounds first
    const result = stripPrefixes('وكتاب')
    expect(result.prefix).toBe('وك')
    expect(result.stem).toBe('تاب')
  })

  it('strips fa+ka compound prefix from فكتاب', () => {
    const result = stripPrefixes('فكتاب')
    expect(result.prefix).toBe('فك')
    expect(result.stem).toBe('تاب')
  })

  it('strips single wa prefix when no compound matches', () => {
    const result = stripPrefixes('وحمد')
    expect(result.prefix).toBe('و')
    expect(result.stem).toBe('حمد')
  })

  it('returns original word when no prefix matches', () => {
    const result = stripPrefixes('حمد')
    expect(result.prefix).toBe('')
    expect(result.stem).toBe('حمد')
  })

  it('does not strip prefix if it would leave less than 2 characters', () => {
    // Word too short to have a meaningful prefix
    const result = stripPrefixes('اب')
    expect(result.prefix).toBe('')
    expect(result.stem).toBe('اب')
  })
})

// ===== stripSuffixes =====
describe('stripSuffixes', () => {
  it('strips -un/-in (masculine plural) suffix', () => {
    const result = stripSuffixes('مسلمون')
    expect(result.suffix).toBe('ون')
    expect(result.stem).toBe('مسلم')
  })

  it('strips -in suffix', () => {
    const result = stripSuffixes('مسلمين')
    expect(result.suffix).toBe('ين')
    expect(result.stem).toBe('مسلم')
  })

  it('strips -at (feminine plural) suffix', () => {
    const result = stripSuffixes('مسلمات')
    expect(result.suffix).toBe('ات')
    expect(result.stem).toBe('مسلم')
  })

  it('strips -hum suffix', () => {
    const result = stripSuffixes('كتابهم')
    expect(result.suffix).toBe('هم')
    expect(result.stem).toBe('كتاب')
  })

  it('strips -ha suffix', () => {
    const result = stripSuffixes('كتابها')
    expect(result.suffix).toBe('ها')
    expect(result.stem).toBe('كتاب')
  })

  it('strips -na suffix', () => {
    const result = stripSuffixes('كتابنا')
    expect(result.suffix).toBe('نا')
    expect(result.stem).toBe('كتاب')
  })

  it('strips -kum suffix', () => {
    const result = stripSuffixes('كتابكم')
    expect(result.suffix).toBe('كم')
    expect(result.stem).toBe('كتاب')
  })

  it('returns original word when no suffix matches', () => {
    const result = stripSuffixes('كتب')
    expect(result.suffix).toBe('')
    expect(result.stem).toBe('كتب')
  })

  it('does not strip suffix if it would leave less than 2 characters', () => {
    const result = stripSuffixes('هم')
    expect(result.suffix).toBe('')
    expect(result.stem).toBe('هم')
  })
})

// ===== containsArabic =====
describe('containsArabic', () => {
  it('returns true for Arabic text', () => {
    expect(containsArabic('كتاب')).toBe(true)
  })

  it('returns true for mixed Arabic/Latin text', () => {
    expect(containsArabic('hello كتاب world')).toBe(true)
  })

  it('returns false for Latin-only text', () => {
    expect(containsArabic('hello world')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(containsArabic('')).toBe(false)
  })

  it('returns false for numbers only', () => {
    expect(containsArabic('12345')).toBe(false)
  })

  it('returns true for single Arabic letter', () => {
    expect(containsArabic('ب')).toBe(true)
  })
})

// ===== TASHKIL_REGEX_SOURCE =====
describe('TASHKIL_REGEX_SOURCE', () => {
  const regex = new RegExp(TASHKIL_REGEX_SOURCE, 'g')

  it('matches fatha (U+064E)', () => {
    expect('\u064E').toMatch(regex)
  })

  it('matches damma (U+064F)', () => {
    expect('\u064F').toMatch(regex)
  })

  it('matches kasra (U+0650)', () => {
    expect('\u0650').toMatch(regex)
  })

  it('matches shadda (U+0651)', () => {
    expect('\u0651').toMatch(regex)
  })

  it('matches sukun (U+0652)', () => {
    expect('\u0652').toMatch(regex)
  })

  it('matches tanwin fatha (U+064B)', () => {
    expect('\u064B').toMatch(regex)
  })

  it('matches tanwin damma (U+064C)', () => {
    expect('\u064C').toMatch(regex)
  })

  it('matches tanwin kasra (U+064D)', () => {
    expect('\u064D').toMatch(regex)
  })

  it('matches subscript alef (U+0656)', () => {
    expect('\u0656').toMatch(regex)
  })

  it('matches inverted damma (U+0657)', () => {
    expect('\u0657').toMatch(regex)
  })

  it('does NOT match Alif Khanjariyya (U+0670)', () => {
    expect('\u0670').not.toMatch(regex)
  })

  it('does NOT match plain Arabic letters', () => {
    expect('ك').not.toMatch(regex)
    expect('ب').not.toMatch(regex)
  })
})

// ===== transliterateToArabic =====
describe('transliterateToArabic', () => {
  it('transliterates single consonants', () => {
    expect(transliterateToArabic('k')).toBe('ك')
    expect(transliterateToArabic('b')).toBe('ب')
  })

  it('transliterates dash-separated root notation', () => {
    const result = transliterateToArabic('k-t-b')
    expect(result).toBe('ك-ت-ب')
  })

  it('returns empty string for null input', () => {
    expect(transliterateToArabic(null)).toBe('')
    expect(transliterateToArabic('')).toBe('')
  })
})

// ===== transliterateToLatin =====
describe('transliterateToLatin', () => {
  it('transliterates Arabic letters to Latin', () => {
    expect(transliterateToLatin('ك')).toBe('k')
    expect(transliterateToLatin('ب')).toBe('b')
  })

  it('handles dash-separated root notation', () => {
    expect(transliterateToLatin('ك-ت-ب')).toBe('k-t-b')
  })

  it('returns empty string for null input', () => {
    expect(transliterateToLatin(null)).toBe('')
    expect(transliterateToLatin('')).toBe('')
  })
})

// ===== formatRoot =====
describe('formatRoot', () => {
  it('formats consecutive root letters with dashes', () => {
    expect(formatRoot('كتب')).toBe('ك-ت-ب')
  })

  it('returns empty string for null input', () => {
    expect(formatRoot(null)).toBe('')
    expect(formatRoot('')).toBe('')
  })
})

// ===== isArabicLetter =====
describe('isArabicLetter', () => {
  it('returns true for Arabic consonant letters', () => {
    expect(isArabicLetter('ب')).toBe(true)
    expect(isArabicLetter('ك')).toBe(true)
    expect(isArabicLetter('م')).toBe(true)
  })

  it('returns false for Latin letters', () => {
    expect(isArabicLetter('a')).toBe(false)
    expect(isArabicLetter('z')).toBe(false)
  })
})

// ===== stripIjam =====
describe('stripIjam', () => {
  it('strips dots from dotted letters', () => {
    // ba -> dotless ba
    expect(stripIjam('ب')).toBe('\u066E')
    // ta -> dotless ba
    expect(stripIjam('ت')).toBe('\u066E')
    // jim -> ha
    expect(stripIjam('ج')).toBe('ح')
  })

  it('leaves undotted letters unchanged', () => {
    expect(stripIjam('ا')).toBe('ا')
    expect(stripIjam('د')).toBe('د')
    expect(stripIjam('ح')).toBe('ح')
  })

  it('strips hamza carriers to plain forms', () => {
    expect(stripIjam('أ')).toBe('ا')
    expect(stripIjam('إ')).toBe('ا')
    expect(stripIjam('ؤ')).toBe('و')
  })
})

// ===== getVowelMarks =====
describe('getVowelMarks', () => {
  it('returns all 8 standard vowel marks', () => {
    const marks = getVowelMarks()
    expect(marks).toHaveLength(8)
    const names = marks.map(m => m.name)
    expect(names).toContain('fatha')
    expect(names).toContain('damma')
    expect(names).toContain('kasra')
    expect(names).toContain('shadda')
    expect(names).toContain('sukun')
    expect(names).toContain('fathatan')
    expect(names).toContain('dammatan')
    expect(names).toContain('kasratan')
  })
})

// ===== getArabicAlphabet =====
describe('getArabicAlphabet', () => {
  it('returns 29 letters (including hamza and alif)', () => {
    const alphabet = getArabicAlphabet()
    expect(alphabet).toHaveLength(29)
  })

  it('starts with hamza', () => {
    const alphabet = getArabicAlphabet()
    expect(alphabet[0]).toBe('ء')
  })

  it('ends with ya', () => {
    const alphabet = getArabicAlphabet()
    expect(alphabet[alphabet.length - 1]).toBe('ي')
  })
})

// ===== extractRootCandidate =====
describe('extractRootCandidate', () => {
  it('extracts root candidate from a simple word', () => {
    const result = extractRootCandidate('كتاب')
    expect(result.possibleRoot).toBeTruthy()
    expect(result.letters.length).toBeGreaterThan(0)
  })

  it('returns dash-separated formatted root', () => {
    const result = extractRootCandidate('كتاب')
    expect(result.formatted).toContain('-')
  })
})

// ===== stripTashkilKeepUthmani =====
describe('stripTashkilKeepUthmani', () => {
  it('strips standard tashkil marks', () => {
    expect(stripTashkilKeepUthmani('بِسْمِ')).toBe('بسم')
  })

  it('preserves Alif Khanjariyya (U+0670)', () => {
    // الرَّحْمٰنِ — the superscript alif (U+0670) should remain
    const input = '\u0627\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u0670\u0646\u0650'
    const result = stripTashkilKeepUthmani(input)
    expect(result).toContain('\u0670')
    // But tashkil like shadda, fatha, sukun, kasra should be removed
    expect(result).not.toContain('\u0651') // shadda
    expect(result).not.toContain('\u064E') // fatha
    expect(result).not.toContain('\u0652') // sukun
    expect(result).not.toContain('\u0650') // kasra
  })

  it('preserves Alif Wasla (U+0671) character', () => {
    // ٱلرحمن — Alif Wasla should remain (it is a letter, not tashkil)
    const input = '\u0671\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u0670\u0646\u0650'
    const result = stripTashkilKeepUthmani(input)
    expect(result).toContain('\u0671')
  })

  it('handles empty string', () => {
    expect(stripTashkilKeepUthmani('')).toBe('')
  })

  it('handles text without diacritics', () => {
    expect(stripTashkilKeepUthmani('كتب')).toBe('كتب')
  })
})

// ===== stripEmbeddedBasmala =====
describe('stripEmbeddedBasmala', () => {
  it('returns text unchanged for surah 1 (Fatiha)', () => {
    const text = 'some text'
    expect(stripEmbeddedBasmala(text, 'rasm', 1, 1)).toBe(text)
  })

  it('returns text unchanged for surah 9 (Tawba)', () => {
    const text = 'some text'
    expect(stripEmbeddedBasmala(text, 'rasm', 9, 1)).toBe(text)
  })

  it('returns text unchanged for non-verse-1', () => {
    const text = 'some text'
    expect(stripEmbeddedBasmala(text, 'rasm', 2, 5)).toBe(text)
  })

  it('returns text unchanged for non-rasm/uthmani layers', () => {
    const text = 'some text'
    expect(stripEmbeddedBasmala(text, 'vokalisiert', 2, 1)).toBe(text)
    expect(stripEmbeddedBasmala(text, 'konsonanten', 2, 1)).toBe(text)
  })

  it('strips rasm basmala from verse 1 of other surahs', () => {
    const basmalaRasm = '\u066E\u0633\u0645 \u0627\u0644\u0644\u0647 \u0627\u0644\u0631\u062D\u0645\u066E \u0627\u0644\u0631\u062D\u0649\u0645'
    const verseText = basmalaRasm + ' \u0627\u0644\u0645'
    const result = stripEmbeddedBasmala(verseText, 'rasm', 2, 1)
    expect(result).toBe('\u0627\u0644\u0645')
  })

  it('strips uthmani basmala from verse 1 of other surahs', () => {
    // Build a vocalized basmala WITHOUT Alif Khanjariyya (matching BASMALA_UTHMANI_STRIPPED)
    // بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ + verse content
    const basmala = '\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u064E\u0647\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0646\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650'
    const verseContent = '\u0627\u0644\u0645'
    const text = basmala + ' ' + verseContent
    const result = stripEmbeddedBasmala(text, 'uthmani', 2, 1)
    expect(result).toBe(verseContent)
  })

  it('handles null/undefined text', () => {
    expect(stripEmbeddedBasmala(null, 'rasm', 2, 1)).toBe(null)
    expect(stripEmbeddedBasmala(undefined, 'rasm', 2, 1)).toBe(undefined)
  })
})

// ===== containsArabic extended range =====
describe('containsArabic extended range', () => {
  it('detects Alif Wasla (U+0671)', () => {
    expect(containsArabic('\u0671')).toBe(true)
  })

  it('detects extended Arabic letters', () => {
    expect(containsArabic('\u06A1')).toBe(true) // fa without dot (rasm)
    expect(containsArabic('\u066E')).toBe(true) // dotless ba (rasm)
  })
})
