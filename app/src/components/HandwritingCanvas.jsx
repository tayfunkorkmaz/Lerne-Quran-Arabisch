import { useState, useRef, useEffect, useCallback } from 'react'
import alphabetData from '../data/alphabet.json'

const { letters } = alphabetData

const POSITION_LABELS = {
  isolated: 'Isoliert',
  initial: 'Anfang',
  medial: 'Mitte',
  final: 'Ende',
}

const POSITIONS = Object.keys(POSITION_LABELS)

export default function HandwritingCanvas() {
  const [selectedLetterIndex, setSelectedLetterIndex] = useState(0)
  const [positionForm, setPositionForm] = useState('isolated')
  const [isDrawing, setIsDrawing] = useState(false)
  const [strokeWidth, setStrokeWidth] = useState(3)
  const canvasRef = useRef(null)
  const contextRef = useRef(null)
  const containerRef = useRef(null)
  const lastPointRef = useRef(null)

  const letter = letters[selectedLetterIndex] || letters[0]
  const currentForm = letter?.forms?.[positionForm]

  // Draw ghost/watermark letter
  const drawGhost = useCallback((ctx, size) => {
    if (!ctx) return
    ctx.clearRect(0, 0, size, size)

    ctx.save()
    ctx.fillStyle = 'rgba(0, 0, 0, 0.07)'
    ctx.font = `${size * 0.55}px "Scheherazade New", serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.direction = 'rtl'
    ctx.fillText(currentForm, size / 2, size / 2)
    ctx.restore()
  }, [currentForm])

  // Initialize and resize canvas
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const rect = container.getBoundingClientRect()
    const size = Math.min(rect.width, 400)

    // High-DPI support
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`

    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    contextRef.current = ctx

    drawGhost(ctx, size)
  }, [drawGhost])

  useEffect(() => {
    setupCanvas()
  }, [setupCanvas])

  useEffect(() => {
    const handleResize = () => setupCanvas()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setupCanvas])

  // Get coordinates from mouse or touch event
  const getCoords = useCallback((e) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()

    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }, [])

  const startDrawing = useCallback((e) => {
    e.preventDefault()
    const coords = getCoords(e)
    if (!coords || !contextRef.current) return

    setIsDrawing(true)
    lastPointRef.current = coords

    const ctx = contextRef.current
    ctx.strokeStyle = '#111'
    ctx.lineWidth = strokeWidth
    ctx.beginPath()
    ctx.moveTo(coords.x, coords.y)
  }, [getCoords, strokeWidth])

  const draw = useCallback((e) => {
    e.preventDefault()
    if (!isDrawing || !contextRef.current) return

    const coords = getCoords(e)
    if (!coords) return

    const ctx = contextRef.current
    ctx.strokeStyle = '#111'
    ctx.lineWidth = strokeWidth
    ctx.beginPath()
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y)
    ctx.quadraticCurveTo(
      lastPointRef.current.x, lastPointRef.current.y,
      (lastPointRef.current.x + coords.x) / 2, (lastPointRef.current.y + coords.y) / 2
    )
    ctx.lineTo(coords.x, coords.y)
    ctx.stroke()

    lastPointRef.current = coords
  }, [isDrawing, getCoords, strokeWidth])

  const stopDrawing = useCallback((e) => {
    if (e) e.preventDefault()
    setIsDrawing(false)
    lastPointRef.current = null
  }, [])

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !contextRef.current) return
    const size = parseInt(canvas.style.width) || canvas.width / (window.devicePixelRatio || 1)
    drawGhost(contextRef.current, size)
  }, [drawGhost])

  const nextLetter = useCallback(() => {
    setSelectedLetterIndex((i) => (i + 1) % letters.length)
  }, [])

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '8px' }}>Handschrift-Übung</h2>
      <p style={{
        color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem',
      }}>
        Zeichne den Buchstaben auf der Leinwand nach. Die blasse Vorlage dient als Orientierung.
      </p>

      {/* Letter selector */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '16px',
        padding: '10px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)', justifyContent: 'center',
      }}>
        {letters.map((l, i) => (
          <button
            key={l.id}
            onClick={() => setSelectedLetterIndex(i)}
            style={{
              width: '36px', height: '36px', borderRadius: 'var(--radius)',
              border: i === selectedLetterIndex ? '2px solid var(--accent)' : '1px solid var(--border)',
              background: i === selectedLetterIndex ? 'var(--accent)' : 'var(--bg-primary)',
              color: i === selectedLetterIndex ? '#fff' : 'var(--text-primary)',
              cursor: 'pointer', fontSize: '1rem',
              fontFamily: 'var(--font-arabic, "Scheherazade New", serif)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0,
            }}
            title={l.name}
          >
            {l.forms.isolated}
          </button>
        ))}
      </div>

      {/* Position form toggle */}
      <div style={{
        display: 'flex', gap: '6px', marginBottom: '16px', justifyContent: 'center',
      }}>
        {POSITIONS.map((pos) => (
          <button
            key={pos}
            onClick={() => setPositionForm(pos)}
            style={{
              padding: '6px 14px', borderRadius: 'var(--radius)',
              border: pos === positionForm ? '2px solid var(--accent)' : '1px solid var(--border)',
              background: pos === positionForm ? 'var(--accent)' : 'var(--bg-card)',
              color: pos === positionForm ? '#fff' : 'var(--text-primary)',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
            }}
          >
            {POSITION_LABELS[pos]}
          </button>
        ))}
      </div>

      {/* Reference letter display */}
      <div style={{
        textAlign: 'center', padding: '20px', marginBottom: '16px',
        background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
      }}>
        <div style={{
          fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px',
        }}>
          {letter.name} — {POSITION_LABELS[positionForm]}
        </div>
        <div
          dir="rtl"
          style={{
            fontSize: '5rem', lineHeight: 1.2, color: 'var(--text-primary)',
            fontFamily: 'var(--font-arabic, "Scheherazade New", serif)',
          }}
        >
          {currentForm}
        </div>
        <div style={{
          fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px',
        }}>
          {letter.transliteration}
        </div>
      </div>

      {/* Stroke width control */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px',
        fontSize: '0.85rem', color: 'var(--text-secondary)',
      }}>
        <label htmlFor="stroke-width">Strichstärke:</label>
        <input
          id="stroke-width"
          type="range"
          min="2"
          max="5"
          step="0.5"
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(parseFloat(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--accent)' }}
        />
        <span style={{ minWidth: '28px', textAlign: 'right' }}>{strokeWidth}px</span>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        style={{
          width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '16px',
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
          style={{
            border: '2px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            background: '#fefefe',
            cursor: 'crosshair',
            touchAction: 'none',
          }}
        />
      </div>

      {/* Action buttons */}
      <div style={{
        display: 'flex', gap: '10px', justifyContent: 'center',
      }}>
        <button
          onClick={clearCanvas}
          style={{
            padding: '10px 20px', borderRadius: 'var(--radius)',
            background: 'var(--bg-card)', color: 'var(--text-primary)',
            border: '1px solid var(--border)', cursor: 'pointer',
            fontSize: '0.9rem', fontWeight: 500,
          }}
        >
          Zurücksetzen
        </button>
        <button
          onClick={nextLetter}
          style={{
            padding: '10px 20px', borderRadius: 'var(--radius)',
            background: 'var(--accent)', color: '#fff',
            border: 'none', cursor: 'pointer',
            fontSize: '0.9rem', fontWeight: 600,
          }}
        >
          Nächster Buchstabe
        </button>
      </div>
    </div>
  )
}
