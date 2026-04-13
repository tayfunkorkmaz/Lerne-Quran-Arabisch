import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { cleanArabicText } from '../utils/arabic.js'
import { playVerseAudio, stopAudio, getDefaultReciterFolder, isOnline } from '../utils/audio.js'
import quranData from '../data/quran-simple-clean.json'
import ArabicKeyboard from './ArabicKeyboard.jsx'

/**
 * DictationExercise — Diktatübung
 * Audio eines Verses hören, dann den Konsonantentext schreiben.
 * Bindet Hören und Schreiben zusammen.
 */

export default function DictationExercise({ onBack }) {
  const [surah, setSurah] = useState(1)
  const [verse, setVerse] = useState(1)
  const [userText, setUserText] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [audioError, setAudioError] = useState(false)
  const [audioSource, setAudioSource] = useState(null) // 'cache' | 'network' | 'speech' | null
  const [online, setOnline] = useState(isOnline())
  const [kbVisible, setKbVisible] = useState(false)
  const [playCount, setPlayCount] = useState(0)
  const inputRef = useRef(null)

  // Track online/offline status
  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
      stopAudio()
    }
  }, [])

  const surahData = useMemo(() => {
    return quranData?.surahs?.find(s => s.number === surah) || null
  }, [surah])

  const verseData = useMemo(() => {
    return surahData?.verses?.find(v => v.number === verse) || null
  }, [surahData, verse])

  const totalVerses = surahData?.verses?.length || 0

  const playAudio = useCallback(async () => {
    setAudioPlaying(true)
    setAudioError(false)
    setAudioSource(null)

    const verseText = verseData?.text || ''
    const result = await playVerseAudio(
      surah, verse,
      getDefaultReciterFolder(),
      verseText,
      {
        onEnd: () => setAudioPlaying(false),
        onError: () => { setAudioError(true); setAudioPlaying(false) },
      }
    )

    if (result.status === 'error') {
      setAudioError(true)
      setAudioPlaying(false)
      setAudioSource(null)
    } else {
      setPlayCount(c => c + 1)
      setAudioSource(result.source)
      if (result.status === 'fallback') {
        // Speech synthesis — still counts as playing
      }
    }
  }, [surah, verse, verseData])

  const checkAnswer = useCallback(() => {
    if (!verseData || !userText.trim()) return

    const expected = cleanArabicText(verseData.text).replace(/\s+/g, ' ').trim()
    const actual = cleanArabicText(userText).replace(/\s+/g, ' ').trim()

    const expectedWords = expected.split(' ')
    const actualWords = actual.split(' ')

    // Word-by-word comparison
    const maxLen = Math.max(expectedWords.length, actualWords.length)
    const wordResults = []
    let correctCount = 0

    for (let i = 0; i < maxLen; i++) {
      const exp = expectedWords[i] || ''
      const act = actualWords[i] || ''
      const correct = exp === act
      if (correct && exp) correctCount++
      wordResults.push({ expected: exp, actual: act, correct })
    }

    setFeedback({
      wordResults,
      correctCount,
      totalExpected: expectedWords.length,
      percentage: expectedWords.length > 0 ? Math.round((correctCount / expectedWords.length) * 100) : 0,
    })
  }, [verseData, userText])

  const nextVerse = useCallback(() => {
    if (verse < totalVerses) {
      setVerse(v => v + 1)
    } else if (surah < 114) {
      setSurah(s => s + 1)
      setVerse(1)
    }
    setUserText('')
    setFeedback(null)
    setPlayCount(0)
  }, [verse, totalVerses, surah])

  const retry = useCallback(() => {
    setUserText('')
    setFeedback(null)
    setPlayCount(0)
  }, [])

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {onBack && (
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: 'var(--text-secondary)',
          cursor: 'pointer', fontSize: '0.9rem', padding: '8px 0', marginBottom: '16px',
        }}>Zurück</button>
      )}

      <h2 style={{ marginBottom: '8px' }}>Diktatübung</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
        Höre den Vers an und schreibe den Konsonantentext. Keine Vokalzeichen nötig.
      </p>

      {/* Verse selector */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sure</label>
          <input type="number" min={1} max={114} value={surah}
            onChange={e => { setSurah(Math.max(1, Math.min(114, parseInt(e.target.value) || 1))); setVerse(1); setFeedback(null); setUserText('') }}
            style={{ width: '55px', padding: '4px 6px', textAlign: 'center' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Vers</label>
          <input type="number" min={1} max={totalVerses} value={verse}
            onChange={e => { setVerse(Math.max(1, Math.min(totalVerses, parseInt(e.target.value) || 1))); setFeedback(null); setUserText('') }}
            style={{ width: '55px', padding: '4px 6px', textAlign: 'center' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ {totalVerses}</span>
        </div>
      </div>

      {/* Offline banner */}
      {!online && (
        <div style={{
          padding: '8px 16px', marginBottom: '12px', borderRadius: 'var(--radius)',
          background: 'var(--accent-gold-bg)', border: '1px solid var(--accent-gold)',
          fontSize: '0.85rem', color: 'var(--accent-gold)',
        }}>
          Offline — Audio wird per Sprachsynthese abgespielt, falls verfügbar.
        </div>
      )}

      {/* Audio player */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px',
        padding: '16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
      }}>
        <button onClick={playAudio} disabled={audioPlaying} style={{
          padding: '10px 24px', borderRadius: 'var(--radius)', fontSize: '1rem',
          background: audioPlaying ? 'var(--bg-input)' : 'var(--accent-teal)',
          color: audioPlaying ? 'var(--text-muted)' : '#fff',
          border: 'none', cursor: audioPlaying ? 'default' : 'pointer', fontWeight: 600,
        }}>
          {audioPlaying ? 'Wird abgespielt...' : 'Abspielen'}
        </button>
        {audioPlaying && (
          <button onClick={stopAudio} style={{
            padding: '8px 16px', borderRadius: 'var(--radius)', fontSize: '0.85rem',
            background: 'var(--bg-input)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', cursor: 'pointer',
          }}>Stop</button>
        )}
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {playCount > 0 ? `${playCount}x abgespielt` : 'Noch nicht abgespielt'}
        </span>
        {audioSource && (
          <span style={{
            fontSize: '0.7rem', padding: '2px 8px', borderRadius: 'var(--radius-sm)',
            background: audioSource === 'speech' ? 'var(--accent-gold-bg)' : audioSource === 'cache' ? 'var(--correct-bg)' : 'var(--bg-input)',
            border: `1px solid ${audioSource === 'speech' ? 'var(--accent-gold)' : audioSource === 'cache' ? 'var(--correct)' : 'var(--border)'}`,
            color: audioSource === 'speech' ? 'var(--accent-gold)' : audioSource === 'cache' ? 'var(--correct)' : 'var(--text-muted)',
          }}>
            {audioSource === 'cache' ? 'Cache' : audioSource === 'network' ? 'Netzwerk' : audioSource === 'speech' ? 'Sprachsynthese' : ''}
          </span>
        )}
        {audioError && (
          <span style={{ fontSize: '0.8rem', color: 'var(--incorrect)' }}>
            Audio nicht verfügbar
          </span>
        )}
      </div>

      {/* Writing area */}
      {!feedback && (
        <div style={{ marginBottom: '20px' }}>
          <textarea
            ref={inputRef}
            value={userText}
            onChange={e => setUserText(e.target.value)}
            dir="rtl"
            className="arabic"
            placeholder="Schreibe hier den Konsonantentext den du hörst..."
            rows={4}
            style={{
              width: '100%', fontSize: '1.5rem', padding: '16px', lineHeight: 2,
              resize: 'vertical', fontFamily: 'var(--font-arabic)',
            }}
          />
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center' }}>
            <button onClick={checkAnswer} disabled={!userText.trim()} style={{
              padding: '10px 24px', borderRadius: 'var(--radius)',
              background: userText.trim() ? 'var(--accent-teal)' : 'var(--bg-input)',
              color: userText.trim() ? '#fff' : 'var(--text-muted)',
              border: 'none', cursor: userText.trim() ? 'pointer' : 'default', fontWeight: 600,
            }}>Prüfen</button>
            <ArabicKeyboard
              onInput={char => setUserText(prev => prev + char)}
              onBackspace={() => setUserText(prev => prev.slice(0, -1))}
              onClear={() => setUserText('')}
              visible={kbVisible}
              onToggle={() => setKbVisible(!kbVisible)}
            />
          </div>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            padding: '16px', borderRadius: 'var(--radius-lg)',
            background: feedback.percentage >= 80 ? 'var(--correct-bg)' : feedback.percentage >= 50 ? 'var(--accent-gold-bg)' : 'var(--incorrect-bg)',
            border: `1px solid ${feedback.percentage >= 80 ? 'var(--correct)' : feedback.percentage >= 50 ? 'var(--accent-gold)' : 'var(--incorrect)'}`,
            marginBottom: '16px',
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>
              {feedback.correctCount} / {feedback.totalExpected} Wörter korrekt ({feedback.percentage}%)
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {feedback.percentage >= 90 ? 'Ausgezeichnet!' :
               feedback.percentage >= 70 ? 'Gut! Einige Wörter noch überprüfen.' :
               feedback.percentage >= 50 ? 'Teilweise richtig. Höre nochmal genau hin.' :
               'Höre den Vers mehrmals und versuche es erneut.'}
            </p>
          </div>

          {/* Word comparison */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '6px', direction: 'rtl',
            padding: '12px', background: 'var(--bg-card)', borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
          }}>
            {feedback.wordResults.map((wr, i) => (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                background: wr.correct ? 'var(--correct-bg)' : 'var(--incorrect-bg)',
                border: `1px solid ${wr.correct ? 'var(--correct)' : 'var(--incorrect)'}`,
              }}>
                <span className="arabic" style={{ fontSize: '1.2rem', color: 'var(--arabic-text)' }}>
                  {wr.expected || '—'}
                </span>
                {!wr.correct && wr.actual && (
                  <span className="arabic" style={{ fontSize: '0.9rem', color: 'var(--incorrect)', textDecoration: 'line-through' }}>
                    {wr.actual}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Correct verse */}
          <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Korrekt:</div>
            <div className="arabic" dir="rtl" style={{ fontSize: '1.3rem', lineHeight: 2, color: 'var(--arabic-text)' }}>
              {verseData?.text}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button onClick={retry} style={{
              padding: '8px 20px', borderRadius: 'var(--radius)',
              background: 'var(--bg-input)', border: '1px solid var(--border)',
              color: 'var(--text-primary)', cursor: 'pointer',
            }}>Nochmal versuchen</button>
            <button onClick={nextVerse} style={{
              padding: '8px 20px', borderRadius: 'var(--radius)',
              background: 'var(--accent-teal)', border: 'none',
              color: '#fff', cursor: 'pointer', fontWeight: 600,
            }}>Nächster Vers</button>
          </div>
        </div>
      )}
    </div>
  )
}
