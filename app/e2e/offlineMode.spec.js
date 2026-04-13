/**
 * E2E Test: Offline Mode
 *
 * Verifies the app works completely offline AFTER initial load.
 * Everything except audio (everyayah.com) and Lane's Lexicon (ejtaal.net)
 * should work without network.
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

test.describe('Offline Mode', () => {
  test('app loads fully, then works offline across all modules', async ({ page, context }) => {
    const errors = []
    page.on('pageerror', err => errors.push(err.message))

    // Step 1: Load the app WITH network (initial load needs fonts, JS chunks)
    await page.goto('/module/1')
    await waitForApp(page)
    await dismissIntroIfPresent(page)
    await page.waitForTimeout(2000)

    // Visit Module 3 to pre-load heavy data chunks (morphology-db etc.)
    await page.goto('/module/3')
    await page.waitForTimeout(5000)

    // Visit Module 6 to pre-load dashboard data
    await page.goto('/module/6')
    await page.waitForTimeout(2000)

    // Step 2: Go OFFLINE — block ALL network
    await context.setOffline(true)

    // Step 3: Navigate via SPA sidebar links (always-unlocked modules)
    // Module 1: Schrift-Trainer
    await page.click('a[href="/module/1"]')
    await page.waitForTimeout(2000)
    let content = await page.textContent('body')
    expect(content.length).toBeGreaterThan(100)

    // Module 2: Morphologie
    await page.click('a[href="/module/2"]')
    await page.waitForTimeout(2000)
    content = await page.textContent('body')
    expect(content).toContain('Morphologie')

    // Module 6: Dashboard (always unlocked)
    await page.click('a[href="/module/6"]')
    await page.waitForTimeout(2000)
    content = await page.textContent('body')
    expect(content).toContain('Dashboard')

    // Settings: Should work offline
    await page.click('a[href="/settings"]')
    await page.waitForTimeout(1000)
    content = await page.textContent('body')
    expect(content).toContain('Einstellungen')

    // Step 4: Check no critical errors
    const criticalErrors = errors.filter(e =>
      !e.includes('Failed to fetch') &&
      !e.includes('NetworkError') &&
      !e.includes('net::ERR') &&
      !e.includes('everyayah') &&
      !e.includes('fonts.googleapis') &&
      !e.includes('fonts.gstatic')
    )
    expect(criticalErrors).toEqual([])

    // Step 5: Go back online
    await context.setOffline(false)
  })

  test('settings can be saved offline', async ({ page, context }) => {
    // Load app first
    await page.goto('/settings')
    await waitForApp(page)
    await dismissIntroIfPresent(page)
    await page.waitForTimeout(1000)

    // Go offline
    await context.setOffline(true)

    // Toggle theme — should persist via IndexedDB even offline
    const lightBtn = await page.$('button:has-text("Hell")')
    if (lightBtn) {
      await lightBtn.click()
      await page.waitForTimeout(500)
      const theme = await page.getAttribute('html', 'data-theme')
      expect(theme).toBe('light')
    }

    // Go back online
    await context.setOffline(false)
  })

  test('Module 3 surah navigation works offline', async ({ page, context }) => {
    // Load Module 3 first
    await page.goto('/module/3')
    await waitForApp(page)
    await dismissIntroIfPresent(page)
    await page.waitForTimeout(3000)

    // Go offline
    await context.setOffline(true)

    // Click a surah chip to navigate
    const chip = await page.$('text=Sure 112')
    if (chip) {
      await chip.click()
      await page.waitForTimeout(2000)
      const content = await page.textContent('body')
      // Surah 112 text should be available (bundled data)
      expect(content).toContain('قل')
    }

    // Go back online
    await context.setOffline(false)
  })
})
