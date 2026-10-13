import { test, expect } from '@playwright/test'

const origin = process.env.PRODUCTION_ORIGIN
const password = process.env.DEVELOPER_TEST_PASSWORD

for (const viewport of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  test(`${viewport.name} admin dashboard`, async ({ page }) => {
    test.setTimeout(60_000)
    test.skip(!origin || !password, 'Production UI environment is required')
    await page.setViewportSize(viewport)
    await page.goto(origin, { waitUntil: 'domcontentloaded' })
    const consent = page.getByRole('dialog', { name: 'Cookie consent' })
    if (await consent.isVisible()) await consent.getByRole('button', { name: 'Decline all' }).click()
    await page.getByRole('button', { name: 'Admin', exact: true }).click()
    await page.getByPlaceholder('you@punjabexoticfoods.com').fill('info@kavotech.uk')
    await page.locator('input[type="password"]').fill(password)
    await page.getByRole('button', { name: /Log in/i }).click()
    await expect(page.locator('.topbar-title')).toHaveText('Home', { timeout: 45_000 })
    // First sign-in on an account shows the guided tour over the dashboard.
    const skipTour = page.getByRole('button', { name: 'Skip Tutorial' })
    if (await skipTour.isVisible()) await skipTour.click()
    await page.getByRole('tab', { name: 'Money overview' }).click()
    const outstanding = page.locator('.ho-stat').filter({ hasText: 'Outstanding Payments' })
    await expect(outstanding.locator('.ho-stat-value')).toHaveText('£0.00', { timeout: 20_000 })
    await expect(outstanding).toContainText('0 invoices')

    const menu = page.getByRole('navigation', { name: 'Dashboard sections' })
    const menuItem = name => menu.getByRole('button', { name, exact: true })
    if (viewport.name === 'desktop') {
      await menuItem('Customers').click()
      await expect(page.locator('.topbar-title')).toHaveText('Customers')
      await expect(page.getByRole('button', { name: '+ Add Customer', exact: true })).toBeVisible()
      await menuItem('Payments').click()
      await expect(page.locator('.topbar-title')).toHaveText('Payments')
      await expect(page.getByRole('button', { name: '+ Add Customer', exact: true })).toHaveCount(0)
      await menu.getByRole('button', { name: /^More options/ }).click()
      await menuItem('Expenses').click()
      await expect(page.locator('.topbar-title')).toHaveText('Expenses')
      await menu.getByRole('button', { name: 'Fewer options' }).click()
      await expect(menuItem('Expenses')).toHaveCount(0)
      await menuItem('Home').click()
      await expect(page.locator('.topbar-title')).toHaveText('Home')
    } else {
      await page.getByRole('button', { name: 'Open menu' }).click()
      await menuItem('Invoices').click()
      await expect(page.locator('.sidebar-overlay')).toHaveCount(0)
      await expect(page.locator('.topbar-title')).toHaveText('Invoices')
    }

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
    await page.screenshot({ path: `test-results/${viewport.name}-dashboard.png`, fullPage: true })
  })
}
