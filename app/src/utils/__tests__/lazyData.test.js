/**
 * Tests for src/utils/lazyData.js
 * Verifies the lazy loading functions exist and return promises.
 * The caching behavior is tested by calling the same loader twice.
 */
import { describe, it, expect } from 'vitest'
import {
  loadMorphologyDB,
  loadQuranRasm,
  loadQuranUthmani,
  loadQuranVocalized,
  loadRootFrequencyComplete,
} from '../lazyData.js'

describe('lazyData loaders', () => {
  it('loadMorphologyDB returns a promise', () => {
    const result = loadMorphologyDB()
    expect(result).toBeInstanceOf(Promise)
  })

  it('loadQuranRasm returns a promise', () => {
    const result = loadQuranRasm()
    expect(result).toBeInstanceOf(Promise)
  })

  it('loadQuranUthmani returns a promise', () => {
    const result = loadQuranUthmani()
    expect(result).toBeInstanceOf(Promise)
  })

  it('loadQuranVocalized returns a promise', () => {
    const result = loadQuranVocalized()
    expect(result).toBeInstanceOf(Promise)
  })

  it('loadRootFrequencyComplete returns a promise', () => {
    const result = loadRootFrequencyComplete()
    expect(result).toBeInstanceOf(Promise)
  })

  it('calling the same loader twice returns the same promise (caching)', () => {
    const p1 = loadMorphologyDB()
    const p2 = loadMorphologyDB()
    expect(p1).toBe(p2)
  })

  it('loadQuranRasm resolves to an object with surahs array', { timeout: 30000 }, async () => {
    const data = await loadQuranRasm()
    expect(data).toBeDefined()
    expect(Array.isArray(data.surahs)).toBe(true)
    expect(data.surahs.length).toBe(114)
  })

  it('loadQuranUthmani resolves to an object with surahs array', { timeout: 30000 }, async () => {
    const data = await loadQuranUthmani()
    expect(data).toBeDefined()
    expect(Array.isArray(data.surahs)).toBe(true)
    expect(data.surahs.length).toBe(114)
  })

  it('loadQuranVocalized resolves to an object with surahs array', async () => {
    const data = await loadQuranVocalized()
    expect(data).toBeDefined()
    expect(Array.isArray(data.surahs)).toBe(true)
    expect(data.surahs.length).toBe(114)
  })
})
