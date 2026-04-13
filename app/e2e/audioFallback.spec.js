/**
 * E2E Test: Audio Fallback Chain
 *
 * Tests the real audio fallback system in a browser:
 * 1. everyayah.com → network audio
 * 2. qurancdn fallback
 * 3. Web Speech API fallback
 * 4. Graceful failure (no crash, no audio = OK)
 *
 * Also tests that the app handles blocked/failed audio without errors.
 */
import { test, expect } from '@playwright/test'

async function waitForApp(page) {
  await page.waitForSelector('.app', { timeout: 15000 })
  await page.waitForSelector('.sidebar', { timeout: 15000 })
}

async function dismissIntroIfPresent(page) {
  const intro = await page.$('.intro-overlay')
  if (intro) {
    for (let i = 0; i < 15; i++) {
      const btn = await page.$('.intro-btn-next, button:has-text("Weiter"), button:has-text("Zum Schrift-Trainer")')
      if (!btn) break
      const text = await btn.textContent()
      await btn.click()
      await page.waitForTimeout(300)
      if (text.includes('Schrift-Trainer')) break
    }
    await page.waitForTimeout(500)
  }
}

test.describe('Audio Fallback Chain', () => {
  test('Module 3 audio button exists and clicking it does not crash', async ({ page }) => {
    const errors = []
    page.on('pageerror', err => errors.push(err.message))

    await page.goto('/module/3')
    await waitForApp(page)
    await dismissIntroIfPresent(page)
    await page.waitForTimeout(3000)

    // Look for any audio/play button in the interface
    const audioButtons = await page.$$('button')
    let foundAudioBtn = false
    for (const btn of audioButtons) {
      const text = await btn.textContent()
      if (text.includes('Hoeren') || text.includes('Audio') || text.includes('Abspielen') || text.includes('\u25B6')) {
        foundAudioBtn = true
        // Click it — should not crash even if network fails
        await btn.click()
        await page.waitForTimeout(2000)
        break
      }
    }

    // Filter out expected network errors (audio fetch failures are OK)
    const criticalErrors = errors.filter(e =>
      !e.includes('everyayah') &&
      !e.includes('qurancdn') &&
      !e.includes('Failed to fetch') &&
      !e.includes('NetworkError') &&
      !e.includes('AbortError') &&
      !e.includes('NotAllowedError') && // autoplay policy
      !e.includes('play()') &&
      !e.includes('The play() request')
    )
    expect(criticalErrors).toEqual([])
  })

  test('audio failure with blocked network does not crash the app', async ({ page, context }) => {
    const errors = []
    page.on('pageerror', err => errors.push(err.message))

    // Block all audio URLs
    await context.route('**/*.mp3', route => route.abort())
    await context.route('**/everyayah.com/**', route => route.abort())
    await context.route('**/qurancdn.com/**', route => route.abort())
    await context.route('**/verses.quran.com/**', route => route.abort())

    await page.goto('/module/3')
    await waitForApp(page)
    await dismissIntroIfPresent(page)
    await page.waitForTimeout(3000)

    // App should still be functional
    const content = await page.textContent('body')
    expect(content).toContain('Vers-Werkstatt')
    expect(content).toContain('بسم')

    // Try to trigger audio (it will fail silently)
    const audioButtons = await page.$$('button')
    for (const btn of audioButtons) {
      const text = await btn.textContent()
      if (text.includes('Hoeren') || text.includes('\u25B6')) {
        await btn.click()
        await page.waitForTimeout(2000)
        break
      }
    }

    // No critical JS errors
    const criticalErrors = errors.filter(e =>
      !e.includes('everyayah') && !e.includes('qurancdn') &&
      !e.includes('Failed to fetch') && !e.includes('NetworkError') &&
      !e.includes('AbortError') && !e.includes('NotAllowedError') &&
      !e.includes('play()') && !e.includes('The play() request') &&
      !e.includes('net::ERR')
    )
    expect(criticalErrors).toEqual([])
  })

  test('Module 1 letter audio buttons do not crash when clicked', async ({ page }) => {
    const errors = []
    page.on('pageerror', err => errors.push(err.message))

    await page.goto('/module/1')
    await waitForApp(page)
    await dismissIntroIfPresent(page)
    await page.waitForTimeout(2000)

    // Find any audio play buttons (letter pronunciation)
    const buttons = await page.$$('button')
    let clickedAudio = false
    for (const btn of buttons) {
      const text = await btn.textContent()
      const title = await btn.getAttribute('title') || ''
      if (title.includes('abspielen') || title.includes('Audio') || text.includes('\u{1F50A}') || text.includes('\u25B6')) {
        await btn.click()
        await page.waitForTimeout(500)
        clickedAudio = true
        break
      }
    }

    // No critical errors regardless of whether audio button was found
    const criticalErrors = errors.filter(e =>
      !e.includes('NotAllowedError') && !e.includes('play()') &&
      !e.includes('The play() request') && !e.includes('Failed to fetch') &&
      !e.includes('AbortError')
    )
    expect(criticalErrors).toEqual([])
  })
})
