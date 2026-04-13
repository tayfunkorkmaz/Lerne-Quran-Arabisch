/**
 * Tests for src/utils/audio.js
 * Tests the pure/testable functions. Browser-dependent functions
 * (playVerseAudio, tryPlayUrl, speakArabic) require a real browser environment.
 */
import { describe, it, expect } from 'vitest'
import {
  buildAudioUrl,
  getDefaultReciterFolder,
  stopAudio,
} from '../audio.js'

// ===== buildAudioUrl =====
describe('buildAudioUrl', () => {
  it('builds a valid everyayah URL with surah and verse', () => {
    const url = buildAudioUrl(1, 1, 'Husary_128kbps')
    expect(url).toBe('https://everyayah.com/data/Husary_128kbps/001001.mp3')
  })

  it('pads surah and verse numbers to 3 digits', () => {
    const url = buildAudioUrl(2, 5, 'Husary_128kbps')
    expect(url).toBe('https://everyayah.com/data/Husary_128kbps/002005.mp3')
  })

  it('handles large surah/verse numbers', () => {
    const url = buildAudioUrl(114, 6, 'Husary_128kbps')
    expect(url).toBe('https://everyayah.com/data/Husary_128kbps/114006.mp3')
  })

  it('uses default reciter when folder is null', () => {
    const url = buildAudioUrl(1, 1, null)
    expect(url).toContain('https://everyayah.com/data/')
    expect(url).toContain('/001001.mp3')
  })

  it('resolves reciter ID to folder name', () => {
    // husary is a known reciter ID in audio-config.json
    const url = buildAudioUrl(1, 1, 'husary')
    expect(url).toContain('https://everyayah.com/data/')
    expect(url).toContain('/001001.mp3')
  })
})

// ===== getDefaultReciterFolder =====
describe('getDefaultReciterFolder', () => {
  it('returns a non-empty string', () => {
    const folder = getDefaultReciterFolder()
    expect(typeof folder).toBe('string')
    expect(folder.length).toBeGreaterThan(0)
  })

  it('returns a folder that contains underscore (naming convention)', () => {
    const folder = getDefaultReciterFolder()
    expect(folder).toContain('_')
  })
})

// ===== stopAudio =====
describe('stopAudio', () => {
  it('does not throw when called with nothing playing', () => {
    expect(() => stopAudio()).not.toThrow()
  })

  it('can be called multiple times safely', () => {
    stopAudio()
    stopAudio()
    stopAudio()
  })
})
