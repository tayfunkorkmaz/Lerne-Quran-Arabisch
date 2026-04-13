import localforage from 'localforage'
import audioConfig from '../data/audio-config.json'

/**
 * Audio-Hilfsfunktionen mit Fallback-System:
 * 1. Cache (IndexedDB via localforage) prüfen
 * 2. Externe URL (everyayah.com) versuchen
 * 3. Bei Fehler: Web Speech API (SpeechSynthesis) für arabischen Text
 * 4. Wenn alles fehlschlägt: highlight-only Modus
 */

const audioCache = localforage.createInstance({
  name: 'quran-arabic',
  storeName: 'audio_cache',
})

// Track the currently active audio/speech so we can stop it
let currentAudio = null
let currentUtterance = null
let onEndCallback = null

// ===== Public API =====

/**
 * Build the everyayah.com URL for a given surah/verse/reciter.
 */
export function buildAudioUrl(surah, verse, reciterIdOrFolder) {
  let folder = reciterIdOrFolder
  // If it looks like a reciter ID, resolve to folder
  if (reciterIdOrFolder && !reciterIdOrFolder.includes('_') && !reciterIdOrFolder.includes('/')) {
    const reciter = audioConfig.reciters.find(r => r.id === reciterIdOrFolder)
    if (reciter) folder = reciter.folder
  }
  // Also check if reciterIdOrFolder is a known id with underscores (e.g. husary_standard)
  const reciterById = audioConfig.reciters.find(r => r.id === reciterIdOrFolder)
  if (reciterById) folder = reciterById.folder

  if (!folder) {
    const defaultReciter = audioConfig.reciters.find(r => r.id === audioConfig.defaultReciter)
    folder = defaultReciter?.folder || 'Husary_128kbps'
  }

  const surahStr = String(surah).padStart(3, '0')
  const verseStr = String(verse).padStart(3, '0')
  return `https://everyayah.com/data/${folder}/${surahStr}${verseStr}.mp3`
}

/**
 * Get the default reciter folder from audio-config.json.
 */
export function getDefaultReciterFolder() {
  const defaultId = audioConfig.defaultReciter
  const reciter = audioConfig.reciters.find(r => r.id === defaultId)
  return reciter ? reciter.folder : 'Husary_128kbps'
}

/**
 * Play audio for a specific verse with full fallback chain.
 *
 * @param {number} surah - Surah number (1-114)
 * @param {number} verse - Verse number
 * @param {string} reciterFolder - Reciter folder name (e.g. 'Husary_128kbps')
 * @param {string} verseText - Arabic text for speech synthesis fallback
 * @param {object} [callbacks] - Optional callbacks: { onEnd, onError }
 * @returns {Promise<{status: string, source: string}>}
 *   status: 'playing' | 'fallback' | 'error'
 *   source: 'cache' | 'network' | 'speech' | 'none'
 */
export async function playVerseAudio(surah, verse, reciterFolder, verseText, callbacks = {}) {
  // Stop anything currently playing
  stopAudio()

  const cacheKey = `${reciterFolder || getDefaultReciterFolder()}:${surah}:${verse}`
  const folder = reciterFolder || getDefaultReciterFolder()

  // 1. Check cache for a confirmed-working URL
  try {
    const cachedUrl = await audioCache.getItem(cacheKey)
    if (cachedUrl) {
      const success = await tryPlayUrl(cachedUrl, callbacks)
      if (success) {
        return { status: 'playing', source: 'cache' }
      }
      // Cached URL no longer works — remove it
      await audioCache.removeItem(cacheKey).catch(() => {})
    }
  } catch (_) {
    // Cache read failed, proceed to network
  }

  // 2. Try external URL (everyayah.com)
  if (isOnline()) {
    const url = buildAudioUrl(surah, verse, folder)
    const success = await tryPlayUrl(url, callbacks)
    if (success) {
      // Cache this URL for future use
      audioCache.setItem(cacheKey, url).catch(() => {})
      return { status: 'playing', source: 'network' }
    }
  }

  // 3. Fallback to Web Speech API
  if (verseText) {
    const speechOk = speakArabic(verseText, callbacks)
    if (speechOk) {
      return { status: 'fallback', source: 'speech' }
    }
  }

  // 4. Everything failed
  if (callbacks.onError) callbacks.onError()
  return { status: 'error', source: 'none' }
}

/**
 * Stop any currently playing audio or speech synthesis.
 */
export function stopAudio() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.removeEventListener('ended', onEndCallback)
    currentAudio.removeEventListener('error', onEndCallback)
    currentAudio = null
  }
  if (currentUtterance) {
    window.speechSynthesis?.cancel()
    currentUtterance = null
  }
  onEndCallback = null
}

/**
 * Check if the browser appears to be online.
 */
export function isOnline() {
  return navigator.onLine
}

/**
 * Get the current audio element (for external pause/resume control).
 */
export function getCurrentAudio() {
  return currentAudio
}

// ===== Internal helpers =====

/**
 * Try to play an audio URL. Returns a promise that resolves to true
 * if audio starts playing, or false if it fails.
 */
function tryPlayUrl(url, callbacks = {}) {
  return new Promise((resolve) => {
    const audio = new Audio()
    let settled = false

    const cleanup = () => {
      audio.removeEventListener('canplaythrough', onCanPlay)
      audio.removeEventListener('error', onError)
    }

    const onCanPlay = () => {
      if (settled) return
      settled = true
      cleanup()

      currentAudio = audio

      // Set up end/error handlers
      onEndCallback = () => {
        currentAudio = null
        onEndCallback = null
        if (callbacks.onEnd) callbacks.onEnd()
      }
      audio.addEventListener('ended', onEndCallback, { once: true })
      audio.addEventListener('error', () => {
        currentAudio = null
        onEndCallback = null
        if (callbacks.onError) callbacks.onError()
      }, { once: true })

      audio.play()
        .then(() => resolve(true))
        .catch(() => {
          currentAudio = null
          onEndCallback = null
          resolve(false)
        })
    }

    const onError = () => {
      if (settled) return
      settled = true
      cleanup()
      resolve(false)
    }

    audio.addEventListener('canplaythrough', onCanPlay, { once: true })
    audio.addEventListener('error', onError, { once: true })

    // Timeout: if audio doesn't load in 5 seconds, treat as failure
    setTimeout(() => {
      if (!settled) {
        settled = true
        cleanup()
        audio.src = '' // abort loading
        resolve(false)
      }
    }, 5000)

    audio.src = url
    audio.load()
  })
}

/**
 * Speak Arabic text using the Web Speech API.
 * Returns true if speech synthesis started, false if unavailable.
 */
function speakArabic(text, callbacks = {}) {
  if (!('speechSynthesis' in window)) return false
  if (!text || !text.trim()) return false

  try {
    window.speechSynthesis.cancel() // clear any queued speech

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ar'
    utterance.rate = 0.8

    // Try to find an Arabic voice
    const voices = window.speechSynthesis.getVoices()
    const arabicVoice = voices.find(v => v.lang.startsWith('ar'))
    if (arabicVoice) {
      utterance.voice = arabicVoice
    }

    utterance.onend = () => {
      currentUtterance = null
      if (callbacks.onEnd) callbacks.onEnd()
    }
    utterance.onerror = () => {
      currentUtterance = null
      if (callbacks.onError) callbacks.onError()
    }

    currentUtterance = utterance
    window.speechSynthesis.speak(utterance)
    return true
  } catch (_) {
    return false
  }
}
