/**
 * Tests for exercise scoring / answer-checking logic across all drill components.
 * Since scoring functions are inline in components (not exported), we replicate
 * the core logic here and test it thoroughly.
 */
import { describe, it, expect } from 'vitest'
import { cleanArabicText, containsArabic } from '../arabic.js'

// ═══════════════════════════════════════════════════════
// RootExtractionDrill scoring logic (from RootExtractionDrill.jsx)
// ═══════════════════════════════════════════════════════
describe('RootExtractionDrill scoring', () => {
  const strip = s => s.replace(/[\u064B-\u065F\u0670\-\s]/g, '').trim()

  function checkRoot(userInput, expectedRoot) {
    return strip(userInput) === strip(expectedRoot.replace(/-/g, '')) ||
      userInput.replace(/[-\s]/g, '') === expectedRoot.replace(/-/g, '')
  }

  function checkAffix(userInput, expected) {
    const noAffix = expected === '\u2014' || expected === '-'
    const userClean = strip(userInput)
    if (noAffix) return userClean === '' || userClean === '\u2014' || userClean === '-'
    return strip(expected.replace(/[\s\u0640]/g, '')) === userClean
  }

  it('exact root match', () => {
    expect(checkRoot('كتب', 'ك-ت-ب')).toBe(true)
  })

  it('root with dashes matches', () => {
    expect(checkRoot('ك-ت-ب', 'ك-ت-ب')).toBe(true)
  })

  it('wrong root', () => {
    expect(checkRoot('كلم', 'ك-ت-ب')).toBe(false)
  })

  it('no affix when expected is dash', () => {
    expect(checkAffix('', '\u2014')).toBe(true)
    expect(checkAffix('\u2014', '\u2014')).toBe(true)
  })

  it('affix match', () => {
    expect(checkAffix('ال', 'ال\u0640')).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════
// IrabExercise scoring (from IrabExercise.jsx)
// ═══════════════════════════════════════════════════════
describe('IrabExercise scoring', () => {
  // From irab-exercises-extension.json, each exercise has expectedCase
  const CASE_ALIASES = {
    "marfu'": 'nominativ',
    "mansub": 'akkusativ',
    "majrur": 'genitiv',
    "rafa'": 'nominativ',
    "nasb": 'akkusativ',
    "jarr": 'genitiv',
  }

  function normalizeCase(input) {
    const lower = input.toLowerCase().trim()
    return CASE_ALIASES[lower] || lower
  }

  function checkCase(userInput, expected) {
    const normalized = normalizeCase(userInput)
    const expectedNorm = normalizeCase(expected)
    return normalized === expectedNorm
  }

  it('direct match nominativ', () => {
    expect(checkCase('nominativ', 'nominativ')).toBe(true)
  })

  it("alias marfu' → nominativ", () => {
    expect(checkCase("marfu'", 'nominativ')).toBe(true)
  })

  it('alias mansub → akkusativ', () => {
    expect(checkCase('mansub', 'akkusativ')).toBe(true)
  })

  it('alias majrur → genitiv', () => {
    expect(checkCase('majrur', 'genitiv')).toBe(true)
  })

  it('wrong case', () => {
    expect(checkCase('nominativ', 'akkusativ')).toBe(false)
  })

  it('case insensitive', () => {
    expect(checkCase('Nominativ', 'nominativ')).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════
// CaseDerivationExercise scoring
// ═══════════════════════════════════════════════════════
describe('CaseDerivationExercise scoring', () => {
  const CASE_KEYWORDS = ['nominativ', 'akkusativ', 'genitiv', "marfu'", "mansub", "majrur",
    'damma', 'fatha', 'kasra', 'tanwin']

  function checkAnswer(userInput, expectedCase) {
    const lower = userInput.toLowerCase().trim()
    const userKeyword = CASE_KEYWORDS.find(k => lower === k || lower.startsWith(k))
    const expected = expectedCase.toLowerCase()
    return userKeyword != null && expected.includes(userKeyword)
  }

  it('matches nominativ', () => {
    expect(checkAnswer('nominativ', 'nominativ (marfu\')')).toBe(true)
  })

  it('matches akkusativ', () => {
    expect(checkAnswer('akkusativ', 'akkusativ (mansub)')).toBe(true)
  })

  it('matches genitiv', () => {
    expect(checkAnswer('genitiv', 'genitiv (majrur)')).toBe(true)
  })

  it('wrong case', () => {
    expect(checkAnswer('nominativ', 'akkusativ (mansub)')).toBe(false)
  })

  it('empty input', () => {
    expect(checkAnswer('', 'nominativ')).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════
// VerbModeDrill scoring
// ═══════════════════════════════════════════════════════
describe('VerbModeDrill scoring', () => {
  function checkMood(selected, correct) {
    return selected === correct
  }

  it('correct mood match', () => {
    expect(checkMood('indicative', 'indicative')).toBe(true)
  })

  it('wrong mood', () => {
    expect(checkMood('subjunctive', 'jussive')).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════
// NegationDrill scoring
// ═══════════════════════════════════════════════════════
describe('NegationDrill scoring', () => {
  function checkNegation(selectedParticle, correctParticle) {
    return selectedParticle === correctParticle
  }

  it('correct particle match', () => {
    expect(checkNegation('لا', 'لا')).toBe(true)
  })

  it('wrong particle', () => {
    expect(checkNegation('ما', 'لم')).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════
// CongruenceDrill scoring
// ═══════════════════════════════════════════════════════
describe('CongruenceDrill scoring', () => {
  // The drill checks if user's free-text answer matches the full congruence rule
  function normalize(s) {
    return cleanArabicText(s).replace(/[\s\-_.,;:!?()[\]{}'"]/g, '').toLowerCase()
  }

  function checkCongruenceAnswer(userInput, correctFull, correctShort) {
    const userNorm = normalize(userInput)
    const fullNorm = normalize(correctFull)
    const answerNorm = normalize(correctShort || '')
    return !!(userNorm && (userNorm === fullNorm || userNorm === answerNorm || (fullNorm && fullNorm.includes(userNorm))))
  }

  it('exact match', () => {
    expect(checkCongruenceAnswer('Genus und Numerus', 'Genus und Numerus', 'Genus+Numerus')).toBe(true)
  })

  it('partial match (substring)', () => {
    expect(checkCongruenceAnswer('Genus', 'Genus und Numerus', '')).toBe(true)
  })

  it('no match', () => {
    expect(checkCongruenceAnswer('Kasus', 'Genus und Numerus', '')).toBe(false)
  })

  it('empty input returns false or matches empty fullNorm', () => {
    // normalize('') === '' which is falsy, so the function returns false
    const result = checkCongruenceAnswer('', 'Genus', '')
    // Empty userNorm is falsy → short-circuit to false
    expect(result).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════
// MasdarDrill scoring
// ═══════════════════════════════════════════════════════
describe('MasdarDrill scoring', () => {
  function getCorrectLabel(exercise) {
    if (exercise.isMasdar) {
      let label = `Masdar${exercise.form && exercise.form !== '\u2014' ? ' Form ' + exercise.form : ''}`
      if (exercise.masdarPattern) label += ` (${exercise.masdarPattern})`
      return label
    }
    return `Kein Masdar: ${exercise.actualType}`
  }

  it('masdar with form and pattern', () => {
    const label = getCorrectLabel({ isMasdar: true, form: 'I', masdarPattern: "fa'l" })
    expect(label).toBe("Masdar Form I (fa'l)")
  })

  it('masdar without form', () => {
    const label = getCorrectLabel({ isMasdar: true, form: '\u2014', masdarPattern: null })
    expect(label).toBe('Masdar')
  })

  it('non-masdar', () => {
    const label = getCorrectLabel({ isMasdar: false, actualType: 'Verb' })
    expect(label).toBe('Kein Masdar: Verb')
  })
})

// ═══════════════════════════════════════════════════════
// PronounSuffixDrill scoring
// ═══════════════════════════════════════════════════════
describe('PronounSuffixDrill scoring', () => {
  function checkPronounAnswer(answers, exercise) {
    let correct = 0
    if (answers.person === exercise.person) correct++
    if (answers.number === exercise.number) correct++
    if (answers.gender === exercise.gender) correct++
    return correct
  }

  it('all correct', () => {
    const score = checkPronounAnswer(
      { person: '3', number: 'sg', gender: 'm' },
      { person: '3', number: 'sg', gender: 'm' }
    )
    expect(score).toBe(3)
  })

  it('partial correct', () => {
    const score = checkPronounAnswer(
      { person: '3', number: 'pl', gender: 'm' },
      { person: '3', number: 'sg', gender: 'm' }
    )
    expect(score).toBe(2)
  })

  it('all wrong', () => {
    const score = checkPronounAnswer(
      { person: '1', number: 'du', gender: 'f' },
      { person: '3', number: 'sg', gender: 'm' }
    )
    expect(score).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════
// AmbiguityExercise scoring
// ═══════════════════════════════════════════════════════
describe('AmbiguityExercise scoring', () => {
  function checkAmbiguityGuess(userInput, options) {
    const cleaned = cleanArabicText(userInput.trim())
    return options.some(opt => cleanArabicText(opt.vocalized) === cleaned)
  }

  it('matches vocalized option', () => {
    const options = [
      { vocalized: 'مَلِكِ' },
      { vocalized: 'مَالِكِ' },
    ]
    expect(checkAmbiguityGuess('ملك', options)).toBe(true)
  })

  it('does not match unknown', () => {
    const options = [{ vocalized: 'مَلِكِ' }]
    expect(checkAmbiguityGuess('كتب', options)).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════
// VocalizationExercise scoring
// ═══════════════════════════════════════════════════════
describe('VocalizationExercise scoring', () => {
  function checkVocalization(userInput, expected) {
    // Normalize: strip spaces, compare
    const userClean = userInput.replace(/\s+/g, '').trim()
    const expClean = expected.replace(/\s+/g, '').trim()
    return userClean === expClean
  }

  it('exact vocalization match', () => {
    expect(checkVocalization('بِسْمِ', 'بِسْمِ')).toBe(true)
  })

  it('wrong vocalization', () => {
    expect(checkVocalization('بَسْمِ', 'بِسْمِ')).toBe(false)
  })

  it('ignores spaces', () => {
    expect(checkVocalization('بِسْمِ اللَّهِ', 'بِسْمِاللَّهِ')).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════
// DictationExercise scoring
// ═══════════════════════════════════════════════════════
describe('DictationExercise scoring', () => {
  function checkDictation(userInput, expected) {
    const userClean = cleanArabicText(userInput.trim())
    const expClean = cleanArabicText(expected.trim())
    return userClean === expClean
  }

  it('consonantal match after stripping', () => {
    expect(checkDictation('بسم الله', 'بسم الله')).toBe(true)
  })

  it('match despite vowel differences', () => {
    expect(checkDictation('بِسْمِ اللَّهِ', 'بسم الله')).toBe(true)
  })

  it('mismatch', () => {
    expect(checkDictation('الحمد', 'بسم')).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════
// ThematicFieldDrill scoring
// ═══════════════════════════════════════════════════════
describe('ThematicFieldDrill scoring', () => {
  function checkFieldAssignment(selectedFieldId, correctFieldId) {
    return selectedFieldId === correctFieldId
  }

  it('correct field', () => {
    expect(checkFieldAssignment('nature', 'nature')).toBe(true)
  })

  it('wrong field', () => {
    expect(checkFieldAssignment('war', 'nature')).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════
// SynonymContrastDrill scoring
// ═══════════════════════════════════════════════════════
describe('SynonymContrastDrill scoring', () => {
  function checkSynonymChoice(selectedIdx, correctIdx) {
    return selectedIdx === correctIdx
  }

  it('correct choice', () => {
    expect(checkSynonymChoice(2, 2)).toBe(true)
  })

  it('wrong choice', () => {
    expect(checkSynonymChoice(0, 2)).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════
// PolysemyDrill scoring
// ═══════════════════════════════════════════════════════
describe('PolysemyDrill scoring', () => {
  function checkPolysemyAnswer(selectedIdx, correctIdx) {
    return selectedIdx === correctIdx
  }

  it('correct answer', () => {
    expect(checkPolysemyAnswer(1, 1)).toBe(true)
  })

  it('wrong answer', () => {
    expect(checkPolysemyAnswer(3, 1)).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════
// VerbFormSemanticDrill scoring
// ═══════════════════════════════════════════════════════
describe('VerbFormSemanticDrill scoring', () => {
  function checkFormChoice(selectedForm, correctForm) {
    return selectedForm === correctForm
  }

  it('correct form', () => {
    expect(checkFormChoice('IV', 'IV')).toBe(true)
  })

  it('wrong form', () => {
    expect(checkFormChoice('II', 'IV')).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════
// VerbRectionDrill scoring
// ═══════════════════════════════════════════════════════
describe('VerbRectionDrill scoring', () => {
  function checkRection(selectedPrep, correctPrep) {
    return cleanArabicText(selectedPrep) === cleanArabicText(correctPrep)
  }

  it('correct preposition', () => {
    expect(checkRection('على', 'على')).toBe(true)
  })

  it('wrong preposition', () => {
    expect(checkRection('في', 'على')).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════
// HamzaExercise scoring
// ═══════════════════════════════════════════════════════
describe('HamzaExercise scoring', () => {
  function checkHamzaSeat(selectedSeat, correctSeat) {
    return selectedSeat === correctSeat
  }

  it('correct seat', () => {
    expect(checkHamzaSeat('alif', 'alif')).toBe(true)
  })

  it('wrong seat', () => {
    expect(checkHamzaSeat('waw', 'ya')).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════
// PatternRecognitionDrill scoring
// ═══════════════════════════════════════════════════════
describe('PatternRecognitionDrill scoring', () => {
  function checkPattern(selectedPattern, correctPattern) {
    return selectedPattern === correctPattern
  }

  it('correct pattern', () => {
    expect(checkPattern("fa'il", "fa'il")).toBe(true)
  })

  it('wrong pattern', () => {
    expect(checkPattern("maf'ul", "fa'il")).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════
// General: containsArabic used in multiple drills
// ═══════════════════════════════════════════════════════
describe('containsArabic utility used by drills', () => {
  it('Arabic text detected', () => {
    expect(containsArabic('كتب')).toBe(true)
  })

  it('Latin text not detected', () => {
    expect(containsArabic('hello')).toBe(false)
  })

  it('mixed text detected', () => {
    expect(containsArabic('root: كتب')).toBe(true)
  })

  it('empty string', () => {
    expect(containsArabic('')).toBe(false)
  })
})
