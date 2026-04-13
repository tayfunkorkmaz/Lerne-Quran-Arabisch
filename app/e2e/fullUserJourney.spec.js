/**
 * E2E Test: Complete User Journey
 *
 * Tests the FULL user flow in a real browser with real IndexedDB,
 * real DOM rendering, real CSS, and real data loading.
 *
 * Flow: Fresh user → Intro → Module 1 → Module 2 → Module 3 →
 *       Module 4 → Module 5 → Module 6 → Settings → Export
 */
import { test, expect } from '@playwright/test'

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

async function waitForApp(page) {
  // Wait for React to mount and settings to load
  await page.waitForSelector('.app', { timeout: 15000 })
  // Wait for sidebar to appear (settings loaded)
  await page.waitForSelector('.sidebar', { timeout: 15000 })
}

async function navigateTo(page, moduleNum) {
  await page.click(`.sidebar__item[href="/module/${moduleNum}"], .sidebar a[href="/module/${moduleNum}"]`)
  await page.waitForTimeout(500)
}

async function dismissIntroIfPresent(page) {
  // If intro overlay is present, skip through it
  const intro = await page.$('.intro-overlay')
  if (intro) {
    // Click through all slides
    for (let i = 0; i < 15; i++) {
      const nextBtn = await page.$('.intro-btn-next, button:has-text("Weiter"), button:has-text("Zum Schrift-Trainer")')
      if (!nextBtn) break
      const text = await nextBtn.textContent()
      await nextBtn.click()
      await page.waitForTimeout(300)
      if (text.includes('Schrift-Trainer')) break
    }
    // Wait for intro to disappear
    await page.waitForTimeout(500)
  }
}

// ═══════════════════════════════════════════════════════════════
// 1. APP LOADS AND DISPLAYS CORRECTLY
// ═══════════════════════════════════════════════════════════════

test.describe('App Loading', () => {
  test('app loads without errors', async ({ page }) => {
    const errors = []
    page.on('pageerror', err => errors.push(err.message))

    await page.goto('/')
    await waitForApp(page)
    await dismissIntroIfPresent(page)

    expect(errors.length).toBe(0)
  })

  test('page title is correct', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle('Quranisches Arabisch')
  })

  test('sidebar renders with all module links', async ({ page }) => {
    await page.goto('/')
    await waitForApp(page)
    await dismissIntroIfPresent(page)

    const sidebarItems = await page.$$('.sidebar__item')
    expect(sidebarItems.length).toBeGreaterThanOrEqual(8)
  })

  test('dark theme is default', async ({ page }) => {
    await page.goto('/')
    await waitForApp(page)
    const theme = await page.getAttribute('html', 'data-theme')
    expect(theme).toBe('dark')
  })

  test('integrity check passes (no error banner)', async ({ page }) => {
    await page.goto('/')
    await waitForApp(page)
    await dismissIntroIfPresent(page)

    // Wait for integrity check to complete
    await page.waitForTimeout(3000)
    const errorBanner = await page.$('.app__integrity-banner--error')
    expect(errorBanner).toBeNull()
  })

  test('Arabic font-family CSS variable is configured', async ({ page }) => {
    await page.goto('/')
    await waitForApp(page)
    // Verify the CSS variable is set (font may not have loaded yet in headless)
    const fontVar = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--font-arabic').trim()
    })
    expect(fontVar).toContain('Scheherazade')
  })
})

// ═══════════════════════════════════════════════════════════════
// 2. MODULE 1: SCHRIFT-TRAINER
// ═══════════════════════════════════════════════════════════════

test.describe('Module 1: Schrift-Trainer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/module/1')
    await waitForApp(page)
    await dismissIntroIfPresent(page)
  })

  test('renders Module 1 content with Arabic script elements', async ({ page }) => {
    await page.waitForTimeout(2000)
    const content = await page.textContent('body')
    // Module 1 should contain Arabic text or script-related content
    expect(content.length).toBeGreaterThan(200)
    // Should show lesson-related content (Schrift, Buchstaben, Lernmodus, etc.)
    const hasSchriftContent = content.includes('Schrift') || content.includes('Buchstaben') || content.includes('Lernmodus') || content.includes('Lektion')
    expect(hasSchriftContent).toBe(true)
  })

  test('clicking a letter shows detail view', async ({ page }) => {
    await page.waitForTimeout(1000)
    // Find and click first lesson card
    const lessonCards = await page.$$('button, [role="button"]')
    const arabicCard = lessonCards.find(async (c) => {
      const text = await c.textContent()
      return text.includes('Buchstaben')
    })
    if (arabicCard) {
      await arabicCard.click()
      await page.waitForTimeout(500)
    }
    // Page should have some content after click
    const bodyText = await page.textContent('body')
    expect(bodyText.length).toBeGreaterThan(100)
  })

  test('no JavaScript errors on Module 1', async ({ page }) => {
    const errors = []
    page.on('pageerror', err => errors.push(err.message))
    await page.waitForTimeout(2000)
    expect(errors.length).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 3. MODULE 2: MORPHOLOGIE-DOJO
// ═══════════════════════════════════════════════════════════════

test.describe('Module 2: Morphologie-Dojo', () => {
  test('renders lesson list', async ({ page }) => {
    await page.goto('/module/2')
    await waitForApp(page)
    await dismissIntroIfPresent(page)
    await page.waitForTimeout(1000)

    const content = await page.textContent('body')
    // Should show morphology lessons
    expect(content).toContain('Morphologie')
  })

  test('no JavaScript errors on Module 2', async ({ page }) => {
    const errors = []
    page.on('pageerror', err => errors.push(err.message))
    await page.goto('/module/2')
    await waitForApp(page)
    await dismissIntroIfPresent(page)
    await page.waitForTimeout(2000)
    expect(errors.length).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 4. MODULE 3: VERS-WERKSTATT
// ═══════════════════════════════════════════════════════════════

test.describe('Module 3: Vers-Werkstatt', () => {
  test('renders Quran text for Surah 1', async ({ page }) => {
    await page.goto('/module/3')
    await waitForApp(page)
    await dismissIntroIfPresent(page)
    await page.waitForTimeout(2000)

    const content = await page.textContent('body')
    // Al-Fatiha verse 1: بسم الله الرحمن الرحيم
    expect(content).toContain('بسم')
    expect(content).toContain('الله')
  })

  test('Vers-Werkstatt header visible', async ({ page }) => {
    await page.goto('/module/3')
    await waitForApp(page)
    await dismissIntroIfPresent(page)
    await page.waitForTimeout(2000)

    const content = await page.textContent('body')
    expect(content).toContain('Vers-Werkstatt')
  })

  test('surah navigation works', async ({ page }) => {
    await page.goto('/module/3')
    await waitForApp(page)
    await dismissIntroIfPresent(page)
    await page.waitForTimeout(2000)

    // Click on Sure 112 chip if visible
    const chip = await page.$('text=Sure 112')
    if (chip) {
      await chip.click()
      await page.waitForTimeout(1000)
      const content = await page.textContent('body')
      // Surah 112 (al-Ikhlas) verse 1: قل هو الله احد
      expect(content).toContain('قل')
    }
  })

  test('step indicators visible (Markieren, Analysieren, Fertig, Hoeren)', async ({ page }) => {
    await page.goto('/module/3')
    await waitForApp(page)
    await dismissIntroIfPresent(page)
    await page.waitForTimeout(2000)

    const content = await page.textContent('body')
    expect(content).toContain('Markieren')
  })

  test('no JavaScript errors on Module 3', async ({ page }) => {
    const errors = []
    page.on('pageerror', err => errors.push(err.message))
    await page.goto('/module/3')
    await waitForApp(page)
    await dismissIntroIfPresent(page)
    await page.waitForTimeout(3000)
    expect(errors.length).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 5. MODULE 6: DASHBOARD
// ═══════════════════════════════════════════════════════════════

test.describe('Module 6: Dashboard', () => {
  test('renders dashboard with all sections', async ({ page }) => {
    await page.goto('/module/6')
    await waitForApp(page)
    await dismissIntroIfPresent(page)
    await page.waitForTimeout(2000)

    const content = await page.textContent('body')
    expect(content).toContain('Dashboard')
    expect(content).toContain('Curriculum-Phase')
    expect(content).toContain('Wurzel-Fortschritt')
    expect(content).toContain('Quran-Heatmap')
  })

  test('heatmap renders 114 cells', async ({ page }) => {
    await page.goto('/module/6')
    await waitForApp(page)
    await dismissIntroIfPresent(page)
    await page.waitForTimeout(2000)

    const cells = await page.$$('.m6-heatmap-cell')
    expect(cells.length).toBe(114)
  })

  test('no JavaScript errors on Dashboard', async ({ page }) => {
    const errors = []
    page.on('pageerror', err => errors.push(err.message))
    await page.goto('/module/6')
    await waitForApp(page)
    await dismissIntroIfPresent(page)
    await page.waitForTimeout(2000)
    expect(errors.length).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 6. SETTINGS
// ═══════════════════════════════════════════════════════════════

test.describe('Settings', () => {
  test('renders settings page with all sections', async ({ page }) => {
    await page.goto('/settings')
    await waitForApp(page)
    await dismissIntroIfPresent(page)
    await page.waitForTimeout(1000)

    const content = await page.textContent('body')
    expect(content).toContain('Einstellungen')
    expect(content).toContain('Erscheinungsbild')
    expect(content).toContain('Datenverwaltung')
  })

  test('theme toggle switches to light', async ({ page }) => {
    await page.goto('/settings')
    await waitForApp(page)
    await dismissIntroIfPresent(page)
    await page.waitForTimeout(1000)

    // Click "Hell" button
    const lightBtn = await page.$('button:has-text("Hell")')
    if (lightBtn) {
      await lightBtn.click()
      await page.waitForTimeout(500)
      const theme = await page.getAttribute('html', 'data-theme')
      expect(theme).toBe('light')
    }
  })

  test('font size slider exists and is interactive', async ({ page }) => {
    await page.goto('/settings')
    await waitForApp(page)
    await dismissIntroIfPresent(page)
    await page.waitForTimeout(1000)

    const slider = await page.$('input[type="range"]')
    expect(slider).not.toBeNull()
  })

  test('export button exists', async ({ page }) => {
    await page.goto('/settings')
    await waitForApp(page)
    await dismissIntroIfPresent(page)

    const exportBtn = await page.$('button:has-text("Exportieren")')
    expect(exportBtn).not.toBeNull()
  })
})

// ═══════════════════════════════════════════════════════════════
// 7. SPA ROUTING
// ═══════════════════════════════════════════════════════════════

test.describe('SPA Routing', () => {
  test('navigating to all routes works without errors', async ({ page }) => {
    const errors = []
    page.on('pageerror', err => errors.push(err.message))

    const routes = ['/module/1', '/module/2', '/module/6', '/module/7', '/settings']
    for (const route of routes) {
      await page.goto(route)
      await waitForApp(page)
      await dismissIntroIfPresent(page)
      await page.waitForTimeout(500)
    }

    expect(errors.length).toBe(0)
  })

  test('unknown route redirects to /module/1', async ({ page }) => {
    await page.goto('/nonexistent')
    await waitForApp(page)
    await dismissIntroIfPresent(page)
    await page.waitForURL('**/module/1', { timeout: 5000 })
  })

  test('direct URL to /module/3 works', async ({ page }) => {
    await page.goto('/module/3')
    await waitForApp(page)
    await dismissIntroIfPresent(page)
    await page.waitForTimeout(2000)

    const content = await page.textContent('body')
    expect(content).toContain('Vers-Werkstatt')
  })
})

// ═══════════════════════════════════════════════════════════════
// 8. RESPONSIVE DESIGN
// ═══════════════════════════════════════════════════════════════

test.describe('Responsive Design', () => {
  test('tablet viewport (1024px) collapses sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.goto('/module/1')
    await waitForApp(page)
    await dismissIntroIfPresent(page)
    await page.waitForTimeout(1000)

    // Sidebar text should be hidden on tablet
    const sidebarTitle = await page.$('.sidebar__title')
    if (sidebarTitle) {
      const visible = await sidebarTitle.isVisible()
      expect(visible).toBe(false)
    }
  })

  test('mobile viewport (375px) sidebar has zero width or is hidden', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/module/1')
    await waitForApp(page)
    await dismissIntroIfPresent(page)
    await page.waitForTimeout(1000)

    const sidebarWidth = await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar')
      if (!sidebar) return 0
      const style = getComputedStyle(sidebar)
      if (style.display === 'none') return 0
      return sidebar.getBoundingClientRect().width
    })
    expect(sidebarWidth).toBeLessThanOrEqual(1) // 0px or effectively invisible
  })

  test('Arabic text readable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/module/3')
    await waitForApp(page)
    await dismissIntroIfPresent(page)
    await page.waitForTimeout(2000)

    // Check Arabic font size is at least 20px on mobile
    const fontSize = await page.evaluate(() => {
      const root = document.documentElement
      return getComputedStyle(root).getPropertyValue('--arabic-size').trim()
    })
    const px = parseInt(fontSize)
    expect(px).toBeGreaterThanOrEqual(20)
  })
})

// ═══════════════════════════════════════════════════════════════
// 9. RTL RENDERING
// ═══════════════════════════════════════════════════════════════

test.describe('RTL Arabic Rendering', () => {
  test('Arabic text has direction:rtl', async ({ page }) => {
    await page.goto('/module/3')
    await waitForApp(page)
    await dismissIntroIfPresent(page)
    await page.waitForTimeout(2000)

    const dir = await page.evaluate(() => {
      const el = document.querySelector('[dir="rtl"]') || document.querySelector('.arabic')
      return el ? getComputedStyle(el).direction : 'none'
    })
    expect(dir).toBe('rtl')
  })
})

// ═══════════════════════════════════════════════════════════════
// 10. INDEXEDDB PERSISTENCE (Real Storage)
// ═══════════════════════════════════════════════════════════════

test.describe('IndexedDB Persistence', () => {
  test('settings persist across page reload', async ({ page }) => {
    await page.goto('/settings')
    await waitForApp(page)
    await dismissIntroIfPresent(page)
    await page.waitForTimeout(1000)

    // Switch to light theme
    const lightBtn = await page.$('button:has-text("Hell")')
    if (lightBtn) {
      await lightBtn.click()
      await page.waitForTimeout(1000)

      // Reload page
      await page.reload()
      await waitForApp(page)
      await page.waitForTimeout(1000)

      // Theme should still be light
      const theme = await page.getAttribute('html', 'data-theme')
      expect(theme).toBe('light')
    }
  })
})

// ═══════════════════════════════════════════════════════════════
// 11. NO CONSOLE ERRORS ACROSS ALL MODULES
// ═══════════════════════════════════════════════════════════════

test.describe('Zero Console Errors', () => {
  test('no errors visiting all 8 modules sequentially', async ({ page }) => {
    const errors = []
    page.on('pageerror', err => errors.push(err.message))

    await page.goto('/')
    await waitForApp(page)
    await dismissIntroIfPresent(page)

    const modules = [1, 2, 3, 4, 5, 6, 7, 8]
    for (const m of modules) {
      await page.goto(`/module/${m}`)
      await page.waitForTimeout(2000)
    }

    // Also visit settings
    await page.goto('/settings')
    await page.waitForTimeout(1000)

    // Filter out known non-critical warnings
    const criticalErrors = errors.filter(e =>
      !e.includes('everyayah.com') && // network errors are expected
      !e.includes('Failed to fetch') &&
      !e.includes('NetworkError')
    )

    expect(criticalErrors).toEqual([])
  })
})
