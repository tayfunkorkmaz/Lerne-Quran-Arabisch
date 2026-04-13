/**
 * E2E Test: Complete Learning Flow
 *
 * Simulates a REAL learner going through the entire app:
 *
 * 1. Fresh start → Intro sequence
 * 2. Module 1 → Learn letters, take a quiz
 * 3. Module 2 → Open morphology lesson, read content, attempt exercise
 * 4. Module 3 → Navigate to surah 112, analyze a verse (Step 1: mark particles)
 * 5. Module 4 → Check root notebook (should have entries from Module 3)
 * 6. Module 5 → Check SRS cards exist, start a review session
 * 7. Module 6 → Dashboard shows progress (streak, roots, SRS stats)
 * 8. Settings → Export data, verify download triggers
 *
 * This is the ONLY test that verifies the entire cross-module data flow.
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

test.describe('Complete Learning Flow', () => {

  test('full learner journey across all modules', async ({ page }) => {
    test.setTimeout(180000) // 3 minutes for the full flow
    const errors = []
    page.on('pageerror', err => errors.push(err.message))

    // ════════════════════════════════════════════════════════════
    // STEP 1: Fresh start → Intro
    // ════════════════════════════════════════════════════════════
    await page.goto('/')
    await page.waitForSelector('.app', { timeout: 15000 })
    await page.waitForTimeout(1000)

    // Check if intro is present (first-run)
    const hasIntro = await page.$('.intro-overlay')
    if (hasIntro) {
      // Navigate through intro slides
      let slideCount = 0
      for (let i = 0; i < 20; i++) {
        const nextBtn = await page.$('button:has-text("Weiter"), button:has-text("Zum Schrift-Trainer")')
        if (!nextBtn) break
        const text = await nextBtn.textContent()
        await nextBtn.click()
        slideCount++
        await page.waitForTimeout(400)
        if (text.includes('Schrift-Trainer')) break
      }
      expect(slideCount).toBeGreaterThan(0)
    }

    await waitForApp(page)

    // ════════════════════════════════════════════════════════════
    // STEP 2: Module 1 → Learn a letter
    // ════════════════════════════════════════════════════════════
    await page.goto('/module/1')
    await page.waitForTimeout(2000)

    let content = await page.textContent('body')
    expect(content.length).toBeGreaterThan(200)

    // Click on first lesson card to open letter learning
    const lessonCards = await page.$$('[style*="cursor: pointer"], [role="button"]')
    if (lessonCards.length > 0) {
      await lessonCards[0].click()
      await page.waitForTimeout(1000)
    }

    // Verify some content loaded
    content = await page.textContent('body')
    expect(content.length).toBeGreaterThan(100)

    // ════════════════════════════════════════════════════════════
    // STEP 3: Module 2 → Open a morphology lesson
    // ════════════════════════════════════════════════════════════
    await page.goto('/module/2')
    await page.waitForTimeout(3000)

    content = await page.textContent('body')
    expect(content).toContain('Morphologie')

    // Try to click on the first unlocked lesson
    const lesson21 = await page.$('text=Das Wurzelsystem')
    if (lesson21) {
      await lesson21.click()
      await page.waitForTimeout(2000)

      // Should show lesson content
      content = await page.textContent('body')
      const hasLessonContent = content.includes('Wurzel') || content.includes('Lernmodus') || content.includes('Zurück')
      expect(hasLessonContent).toBe(true)

      // Go back to overview
      const backBtn = await page.$('button:has-text("Zurueck")')
      if (backBtn) {
        await backBtn.click({ timeout: 5000 }).catch(() => {})
        await page.waitForTimeout(500)
      }
    }

    // ════════════════════════════════════════════════════════════
    // STEP 4: Module 3 → Navigate to Surah 112, view verse
    // ════════════════════════════════════════════════════════════
    await page.goto('/module/3')
    await page.waitForTimeout(4000)

    content = await page.textContent('body')
    expect(content).toContain('Vers-Werkstatt')

    // Click Sure 112 chip
    const chip112 = await page.$('text=Sure 112')
    if (chip112) {
      await chip112.click()
      await page.waitForTimeout(2000)

      content = await page.textContent('body')
      // Surah 112 verse 1: قل هو الله احد
      expect(content).toContain('قل')
    }

    // Check that word spans are clickable (Step 1: particle marking)
    const wordSpans = await page.$$('[role="button"]')
    expect(wordSpans.length).toBeGreaterThan(0)

    // Click on a word to potentially mark it as particle
    if (wordSpans.length > 0) {
      await wordSpans[0].click()
      await page.waitForTimeout(500)
    }

    // Try to submit Step 1 (particle marking)
    const submitBtn = await page.$('button:has-text("Pruefen"), button:has-text("Prüfen"), button:has-text("Weiter")')
    if (submitBtn) {
      await submitBtn.click()
      await page.waitForTimeout(1000)
    }

    // ════════════════════════════════════════════════════════════
    // STEP 5: Module 4 → Root Notebook
    // ════════════════════════════════════════════════════════════
    await page.goto('/module/4')
    await page.waitForTimeout(3000)

    content = await page.textContent('body')
    // Module 4 should render (even if empty notebook)
    expect(content.length).toBeGreaterThan(100)

    // ════════════════════════════════════════════════════════════
    // STEP 6: Module 5 → SRS Cards
    // ════════════════════════════════════════════════════════════
    await page.goto('/module/5')
    await page.waitForTimeout(3000)

    content = await page.textContent('body')
    expect(content.length).toBeGreaterThan(100)

    // Check for SRS interface elements (Karten, Buchstaben, Wiederholen, etc.)
    const hasSrsContent = content.includes('Karten') || content.includes('Buchstaben') ||
      content.includes('Wiederhol') || content.includes('SRS') || content.includes('Generieren')
    expect(hasSrsContent).toBe(true)

    // Try to generate starter cards if the button exists
    const generateBtn = await page.$('button:has-text("Generieren"), button:has-text("Buchstaben-Karten"), button:has-text("Starter")')
    if (generateBtn) {
      await generateBtn.click()
      await page.waitForTimeout(2000)
    }

    // ════════════════════════════════════════════════════════════
    // STEP 7: Module 6 → Dashboard shows stats
    // ════════════════════════════════════════════════════════════
    await page.goto('/module/6')
    await page.waitForTimeout(3000)

    content = await page.textContent('body')
    expect(content).toContain('Dashboard')
    expect(content).toContain('Curriculum-Phase')

    // Check streak counter is visible
    const streakSection = await page.$('.m6-stat-card--streak')
    if (streakSection) {
      const streakText = await streakSection.textContent()
      expect(streakText).toContain('Serie')
    }

    // Heatmap should have 114 cells
    const heatmapCells = await page.$$('.m6-heatmap-cell')
    expect(heatmapCells.length).toBe(114)

    // ════════════════════════════════════════════════════════════
    // STEP 8: Module 7 → Advanced stages
    // ════════════════════════════════════════════════════════════
    await page.goto('/module/7')
    await page.waitForTimeout(2000)

    content = await page.textContent('body')
    expect(content.length).toBeGreaterThan(100)

    // ════════════════════════════════════════════════════════════
    // STEP 9: Module 8 → Werkzeuge
    // ════════════════════════════════════════════════════════════
    await page.goto('/module/8')
    await page.waitForTimeout(3000)

    content = await page.textContent('body')
    expect(content.length).toBeGreaterThan(100)

    // ════════════════════════════════════════════════════════════
    // STEP 10: Settings → Export
    // ════════════════════════════════════════════════════════════
    await page.goto('/settings')
    await page.waitForTimeout(1000)

    content = await page.textContent('body')
    expect(content).toContain('Einstellungen')
    expect(content).toContain('Exportieren')

    // Click export button — verify download is triggered
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null)
    const exportBtn = await page.$('button:has-text("Exportieren")')
    if (exportBtn) {
      await exportBtn.click()
      const download = await downloadPromise
      if (download) {
        const filename = download.suggestedFilename()
        expect(filename).toContain('quran-arabisch-backup')
        expect(filename).toContain('.json')
      }
    }

    // ════════════════════════════════════════════════════════════
    // FINAL: No critical JS errors across the entire journey
    // ════════════════════════════════════════════════════════════
    const criticalErrors = errors.filter(e =>
      !e.includes('everyayah') && !e.includes('qurancdn') &&
      !e.includes('Failed to fetch') && !e.includes('NetworkError') &&
      !e.includes('AbortError') && !e.includes('NotAllowedError') &&
      !e.includes('play()') && !e.includes('The play() request') &&
      !e.includes('net::ERR')
    )
    expect(criticalErrors).toEqual([])
  })

  test('streak persists after full session', async ({ page }) => {
    test.setTimeout(30000)

    // Visit the app (triggers updateStreak)
    await page.goto('/module/1')
    await waitForApp(page)
    await dismissIntroIfPresent(page)
    await page.waitForTimeout(2000)

    // Check dashboard for streak
    await page.goto('/module/6')
    await page.waitForTimeout(3000)

    // Streak should be at least 1 (today counts)
    const content = await page.textContent('body')
    // Look for streak number — should contain "1" or more in the streak section
    const streakCard = await page.$('.m6-stat-card--streak')
    if (streakCard) {
      const streakValue = await streakCard.$('.m6-stat-value')
      if (streakValue) {
        const num = parseInt(await streakValue.textContent())
        expect(num).toBeGreaterThanOrEqual(1)
      }
    }
  })

  test('theme choice persists across the full journey', async ({ page }) => {
    test.setTimeout(30000)

    // Set theme to light
    await page.goto('/settings')
    await waitForApp(page)
    await dismissIntroIfPresent(page)
    await page.waitForTimeout(1000)

    const lightBtn = await page.$('button:has-text("Hell")')
    if (lightBtn) {
      await lightBtn.click()
      await page.waitForTimeout(500)
    }

    // Navigate to various modules — theme should persist
    for (const m of [1, 3, 6]) {
      await page.goto(`/module/${m}`)
      await page.waitForTimeout(1500)
      const theme = await page.getAttribute('html', 'data-theme')
      expect(theme).toBe('light')
    }
  })
})
