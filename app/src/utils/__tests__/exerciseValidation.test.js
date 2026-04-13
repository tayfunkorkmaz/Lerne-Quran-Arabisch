/**
 * Tests for exercise data integrity.
 * Validates that all exercise JSON files have the required fields
 * and no exercise has empty/null required fields.
 */
import { describe, it, expect } from 'vitest'
import caseDerivationExercises from '../../data/case-derivation-exercises.json'
import errorCorrectionExercises from '../../data/error-correction-exercises.json'
import rasmVocalizationDrill from '../../data/rasm-vocalization-drill.json'
import clozeExercises from '../../data/cloze-exercises.json'

// ===== case-derivation-exercises.json =====
describe('case-derivation-exercises.json', () => {
  const data = caseDerivationExercises
  const exercises = data.exercises || data

  it('has a meta object with sources', () => {
    expect(data.meta).toBeDefined()
    expect(data.meta.title).toBeTruthy()
    expect(Array.isArray(data.meta.sources)).toBe(true)
    expect(data.meta.sources.length).toBeGreaterThan(0)
  })

  it('is a non-empty array', () => {
    expect(Array.isArray(exercises)).toBe(true)
    expect(exercises.length).toBeGreaterThan(0)
  })

  it('every exercise has required fields: verse, ref, word, role, expectedCase, explanation', () => {
    const requiredFields = ['verse', 'ref', 'word', 'role', 'expectedCase', 'explanation']
    for (const exercise of exercises) {
      for (const field of requiredFields) {
        expect(exercise, `Exercise at ref ${exercise.ref} missing field "${field}"`).toHaveProperty(field)
      }
    }
  })

  it('no exercise has empty/null required fields', () => {
    const requiredFields = ['verse', 'ref', 'word', 'role', 'expectedCase', 'explanation']
    for (const exercise of exercises) {
      for (const field of requiredFields) {
        const value = exercise[field]
        expect(value, `Exercise at ref ${exercise.ref} has empty "${field}"`).toBeTruthy()
        expect(typeof value, `Exercise at ref ${exercise.ref} "${field}" is not a string`).toBe('string')
        expect(value.trim().length, `Exercise at ref ${exercise.ref} "${field}" is whitespace-only`).toBeGreaterThan(0)
      }
    }
  })

  it('all refs match surah:verse pattern', () => {
    for (const exercise of exercises) {
      expect(exercise.ref, `Invalid ref: ${exercise.ref}`).toMatch(/^\d+:\d+$/)
    }
  })
})

// ===== error-correction-exercises.json =====
describe('error-correction-exercises.json', () => {
  const data = errorCorrectionExercises
  const exercises = data.exercises || data

  it('has a meta object with sources', () => {
    expect(data.meta).toBeDefined()
    expect(data.meta.title).toBeTruthy()
    expect(Array.isArray(data.meta.sources)).toBe(true)
    expect(data.meta.sources.length).toBeGreaterThan(0)
  })

  it('is a non-empty array', () => {
    expect(Array.isArray(exercises)).toBe(true)
    expect(exercises.length).toBeGreaterThan(0)
  })

  it('every exercise has required fields: ref, verse, wrong, errorWord, correctedWord, explanation', () => {
    const requiredFields = ['ref', 'verse', 'wrong', 'errorWord', 'correctedWord', 'explanation']
    for (const exercise of exercises) {
      for (const field of requiredFields) {
        expect(exercise, `Exercise at ref ${exercise.ref} missing field "${field}"`).toHaveProperty(field)
      }
    }
  })

  it('no exercise has empty/null required fields', () => {
    const requiredFields = ['ref', 'verse', 'wrong', 'errorWord', 'correctedWord', 'explanation']
    for (const exercise of exercises) {
      for (const field of requiredFields) {
        const value = exercise[field]
        expect(value, `Exercise at ref ${exercise.ref} has empty "${field}"`).toBeTruthy()
        expect(typeof value, `Exercise at ref ${exercise.ref} "${field}" is not a string`).toBe('string')
      }
    }
  })

  it('errorWord differs from correctedWord in every exercise', () => {
    for (const exercise of exercises) {
      expect(
        exercise.errorWord,
        `Exercise at ref ${exercise.ref}: errorWord equals correctedWord`
      ).not.toBe(exercise.correctedWord)
    }
  })
})

// ===== rasm-vocalization-drill.json =====
describe('rasm-vocalization-drill.json', () => {
  const data = rasmVocalizationDrill
  const exercises = data.exercises

  it('has a meta object with title', () => {
    expect(data.meta).toBeDefined()
    expect(data.meta.title).toBeTruthy()
  })

  it('has a non-empty exercises array', () => {
    expect(Array.isArray(exercises)).toBe(true)
    expect(exercises.length).toBeGreaterThan(0)
  })

  it('every exercise has required fields: id, rasm, location, steps, explanation', () => {
    const requiredFields = ['id', 'rasm', 'location', 'steps', 'explanation']
    for (const exercise of exercises) {
      for (const field of requiredFields) {
        expect(exercise, `Exercise ${exercise.id} missing field "${field}"`).toHaveProperty(field)
      }
    }
  })

  it('every exercise steps has required sub-fields', () => {
    const requiredStepFields = ['wordType', 'root', 'form', 'syntacticRole', 'vocalization']
    for (const exercise of exercises) {
      for (const field of requiredStepFields) {
        expect(
          exercise.steps,
          `Exercise ${exercise.id} steps missing "${field}"`
        ).toHaveProperty(field)
      }
    }
  })

  it('no exercise has empty rasm or explanation', () => {
    for (const exercise of exercises) {
      expect(exercise.rasm.trim().length, `Exercise ${exercise.id} has empty rasm`).toBeGreaterThan(0)
      expect(exercise.explanation.trim().length, `Exercise ${exercise.id} has empty explanation`).toBeGreaterThan(0)
    }
  })
})

// ===== cloze-exercises.json =====
describe('cloze-exercises.json', () => {
  const data = clozeExercises
  const exercises = data.exercises

  it('has a meta object', () => {
    expect(data.meta).toBeDefined()
    expect(data.meta.title).toBeTruthy()
  })

  it('has a non-empty exercises array', () => {
    expect(Array.isArray(exercises)).toBe(true)
    expect(exercises.length).toBeGreaterThan(0)
  })

  it('every exercise has required fields: id, ref, fullVerse, blankedVerse, missingWord, hint', () => {
    const requiredFields = ['id', 'ref', 'fullVerse', 'blankedVerse', 'missingWord', 'hint']
    for (const exercise of exercises) {
      for (const field of requiredFields) {
        expect(exercise, `Exercise ${exercise.id} missing field "${field}"`).toHaveProperty(field)
      }
    }
  })

  it('no exercise has empty/null required fields', () => {
    const requiredFields = ['id', 'ref', 'fullVerse', 'blankedVerse', 'missingWord', 'hint']
    for (const exercise of exercises) {
      for (const field of requiredFields) {
        const value = exercise[field]
        expect(value, `Exercise ${exercise.id} has empty "${field}"`).toBeTruthy()
      }
    }
  })

  it('blankedVerse contains a blank marker (_____)', () => {
    for (const exercise of exercises) {
      expect(
        exercise.blankedVerse,
        `Exercise ${exercise.id} blankedVerse has no blank marker`
      ).toContain('_____')
    }
  })

  it('missingWord is present in fullVerse', () => {
    for (const exercise of exercises) {
      expect(
        exercise.fullVerse,
        `Exercise ${exercise.id}: missingWord "${exercise.missingWord}" not in fullVerse`
      ).toContain(exercise.missingWord)
    }
  })

  it('meta totalExercises matches actual count', () => {
    if (data.meta.totalExercises !== undefined) {
      expect(exercises.length).toBe(data.meta.totalExercises)
    }
  })
})
