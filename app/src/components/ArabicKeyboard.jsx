import { useState, useCallback, useRef } from 'react'
import { getVowelMarks, transliterateToArabic } from '../utils/arabic.js'
import './ArabicKeyboard.css'

/**
 * ArabicKeyboard - Virtual Arabic keyboard component.
 *
 * Props:
 * - onInput: (char) => void - called when a character is typed
 * - onBackspace: () => void - called when backspace is pressed
 * - onClear: () => void - called when clear is pressed
 * - visible: boolean - whether the keyboard is shown
 * - onToggle: () => void - toggle keyboard visibility
 * - inputRef: ref to the input element to write into (optional direct mode)
 */

// Keyboard layout: 4 rows matching Arabic keyboard approximately
const LETTER_ROWS = [
  ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج'],
  ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك'],
  ['ئ', 'ء', 'ؤ', 'ر', 'ى', 'ة', 'و', 'ز', 'ظ'],
  ['ذ', 'د', 'إ', 'أ', 'آ', 'ٱ', 'ط'],
]

const COMMON_COMBOS = [
  { label: 'ال', chars: 'ال', title: 'Artikel al-' },
  { label: 'لا', chars: 'لا', title: 'Lam-Alif' },
  { label: 'الله', chars: 'الله', title: 'Allah' },
]

export default function ArabicKeyboard({
  onInput,
  onBackspace,
  onClear,
  visible = true,
  onToggle,
  inputRef,
}) {
  const [showVowels, setShowVowels] = useState(false)
  const [translitMode, setTranslitMode] = useState(false)
  const [translitBuffer, setTranslitBuffer] = useState('')
  const translitInputRef = useRef(null)

  const vowelMarks = getVowelMarks()

  const handleCharClick = useCallback((char) => {
    if (onInput) onInput(char)

    // If we have a direct input reference, insert at cursor
    if (inputRef?.current) {
      const el = inputRef.current
      const start = el.selectionStart
      const end = el.selectionEnd
      const value = el.value
      el.value = value.slice(0, start) + char + value.slice(end)
      const newPos = start + char.length
      el.setSelectionRange(newPos, newPos)
      el.focus()

      // Trigger change event
      const event = new Event('input', { bubbles: true })
      el.dispatchEvent(event)
    }
  }, [onInput, inputRef])

  const handleComboClick = useCallback((chars) => {
    if (onInput) {
      for (const ch of chars) {
        onInput(ch)
      }
    }

    if (inputRef?.current) {
      const el = inputRef.current
      const start = el.selectionStart
      const end = el.selectionEnd
      const value = el.value
      el.value = value.slice(0, start) + chars + value.slice(end)
      const newPos = start + chars.length
      el.setSelectionRange(newPos, newPos)
      el.focus()
      const event = new Event('input', { bubbles: true })
      el.dispatchEvent(event)
    }
  }, [onInput, inputRef])

  const handleBackspace = useCallback(() => {
    if (onBackspace) onBackspace()

    if (inputRef?.current) {
      const el = inputRef.current
      const start = el.selectionStart
      const end = el.selectionEnd
      const value = el.value
      if (start !== end) {
        el.value = value.slice(0, start) + value.slice(end)
        el.setSelectionRange(start, start)
      } else if (start > 0) {
        el.value = value.slice(0, start - 1) + value.slice(start)
        el.setSelectionRange(start - 1, start - 1)
      }
      el.focus()
      const event = new Event('input', { bubbles: true })
      el.dispatchEvent(event)
    }
  }, [onBackspace, inputRef])

  const handleTranslitInput = useCallback((e) => {
    const value = e.target.value
    setTranslitBuffer(value)

    // Convert on space or enter
    if (value.endsWith(' ') || value.endsWith('\n')) {
      const toConvert = value.trim()
      if (toConvert) {
        const arabic = transliterateToArabic(toConvert)
        if (onInput) {
          for (const ch of arabic) {
            onInput(ch)
          }
        }
        if (inputRef?.current) {
          const el = inputRef.current
          const start = el.selectionStart
          const end = el.selectionEnd
          const val = el.value
          el.value = val.slice(0, start) + arabic + val.slice(end)
          const newPos = start + arabic.length
          el.setSelectionRange(newPos, newPos)
          el.focus()
          const event = new Event('input', { bubbles: true })
          el.dispatchEvent(event)
        }
      }
      setTranslitBuffer('')
    }
  }, [onInput, inputRef])

  const handleTranslitKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const toConvert = translitBuffer.trim()
      if (toConvert) {
        const arabic = transliterateToArabic(toConvert)
        if (onInput) {
          for (const ch of arabic) {
            onInput(ch)
          }
        }
        if (inputRef?.current) {
          const el = inputRef.current
          const start = el.selectionStart
          const end = el.selectionEnd
          const val = el.value
          el.value = val.slice(0, start) + arabic + val.slice(end)
          const newPos = start + arabic.length
          el.setSelectionRange(newPos, newPos)
          el.focus()
          const event = new Event('input', { bubbles: true })
          el.dispatchEvent(event)
        }
      }
      setTranslitBuffer('')
    }
  }, [translitBuffer, onInput, inputRef])

  if (!visible) {
    return (
      <button className="arabic-keyboard__show-btn" onClick={onToggle} title="Arabische Tastatur anzeigen">
        {'\u2328\uFE0F'} Tastatur
      </button>
    )
  }

  return (
    <div className="arabic-keyboard">
      {/* Header bar */}
      <div className="arabic-keyboard__header">
        <div className="arabic-keyboard__modes">
          <button
            className={`arabic-keyboard__mode-btn ${!translitMode ? 'arabic-keyboard__mode-btn--active' : ''}`}
            onClick={() => setTranslitMode(false)}
          >
            Direkt
          </button>
          <button
            className={`arabic-keyboard__mode-btn ${translitMode ? 'arabic-keyboard__mode-btn--active' : ''}`}
            onClick={() => {
              setTranslitMode(true)
              setTimeout(() => translitInputRef.current?.focus(), 50)
            }}
          >
            Transliteration
          </button>
          <button
            className={`arabic-keyboard__mode-btn ${showVowels ? 'arabic-keyboard__mode-btn--active' : ''}`}
            onClick={() => setShowVowels(!showVowels)}
          >
            Vokale
          </button>
        </div>

        {onToggle && (
          <button className="arabic-keyboard__close-btn" onClick={onToggle} title="Tastatur ausblenden">
            {'\u2716'}
          </button>
        )}
      </div>

      {/* Transliteration input */}
      {translitMode && (
        <div className="arabic-keyboard__translit">
          <input
            ref={translitInputRef}
            type="text"
            className="arabic-keyboard__translit-input"
            placeholder="Lateinisch eingeben, Enter drücken... (z.B. k-t-b)"
            value={translitBuffer}
            onChange={handleTranslitInput}
            onKeyDown={handleTranslitKeyDown}
          />
          {translitBuffer && (
            <span className="arabic-keyboard__translit-preview arabic" dir="rtl">
              {transliterateToArabic(translitBuffer.trim())}
            </span>
          )}
        </div>
      )}

      {/* Direct keyboard */}
      {!translitMode && (
        <div className="arabic-keyboard__keys" dir="rtl">
          {LETTER_ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className="arabic-keyboard__row">
              {row.map(letter => (
                <button
                  key={letter}
                  className="arabic-keyboard__key"
                  onClick={() => handleCharClick(letter)}
                  title={letter}
                >
                  {letter}
                </button>
              ))}
            </div>
          ))}

          {/* Action row */}
          <div className="arabic-keyboard__row arabic-keyboard__row--actions">
            <button
              className="arabic-keyboard__key arabic-keyboard__key--wide"
              onClick={() => handleCharClick(' ')}
              title="Leerzeichen"
            >
              {'_____'}
            </button>
            <button
              className="arabic-keyboard__key arabic-keyboard__key--action"
              onClick={handleBackspace}
              title="Löschen"
            >
              {'\u232B'}
            </button>
            {onClear && (
              <button
                className="arabic-keyboard__key arabic-keyboard__key--action"
                onClick={onClear}
                title="Alles löschen"
              >
                {'\u{1F5D1}'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Vowel marks panel */}
      {showVowels && (
        <div className="arabic-keyboard__vowels">
          <div className="arabic-keyboard__vowels-label">Vokalzeichen:</div>
          <div className="arabic-keyboard__vowels-row">
            {vowelMarks.map(vm => (
              <button
                key={vm.name}
                className="arabic-keyboard__key arabic-keyboard__key--vowel"
                onClick={() => handleCharClick(vm.char)}
                title={vm.nameDE}
              >
                <span className="arabic-keyboard__vowel-sample arabic">
                  {'\u0640' + vm.char}
                </span>
                <span className="arabic-keyboard__vowel-name">{vm.nameDE}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Common combinations */}
      <div className="arabic-keyboard__combos">
        {COMMON_COMBOS.map(combo => (
          <button
            key={combo.label}
            className="arabic-keyboard__key arabic-keyboard__key--combo"
            onClick={() => handleComboClick(combo.chars)}
            title={combo.title}
          >
            <span className="arabic">{combo.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
