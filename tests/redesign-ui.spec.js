import { test, expect } from '@playwright/test'

const origin = process.env.UI_ORIGIN || 'http://127.0.0.1:4174'
const user = {
  id: 'visual-system-developer', role: 'admin', username: 'system.developer',
  email: 'developer@example.test', displayName: 'System Developer',
  isSuperAdmin: true, isSystemDeveloper: true, permissions: { usersManage: true },
  // Already finished the first-time guided tour, so it doesn't cover the page.
  tutorialCompletedAt: '2026-01-01T00:00:00Z',
}
const session = {
  access_token: 'visual-test-token', refresh_token: 'visual-test-refresh',
  token_type: 'bearer', expires_in: 3600, expires_at: 4102444800,
  user: { id: user.id, email: user.email, app_metadata: { role: 'system_developer' }, user_metadata: {}, aud: 'authenticated', role: 'authenticated' },
}
const overview = {
  health: { database: 'Operational', authentication: 'Operational', environment: 'production', email: 'Configured', whatsapp: 'Configured' },
  counts: { customers: 248, admins: 4, salesUsers: 7, systemDevelopers: 1, disabled: 2 },
  users: [{ id: user.id, name: user.displayName, email: user.email, role: 'System Developer', active: true, createdAt: '2026-08-20T09:00:00Z', lastLoginAt: '2026-08-22T08:30:00Z', invitationStatus: 'Accepted' }],
  logins: [], audit: [{ id: 'audit-1', action: 'admin_invited', target_type: 'admin_staff', target_id: 'staff-4', metadata: {}, created_at: '2026-08-22T08:15:00Z' }], backups: [],
  testMode: false, testModeChangedAt: null, testIsolationReady: false, managedBackupsAvailable: false,
}

async function prepareSession(page) {
  await page.addInitScript(({ user, session }) => {
    localStorage.setItem('punjab-session-user', JSON.stringify(user))
    localStorage.setItem('punjab-cookie-consent', JSON.stringify({ necessary: true }))
    localStorage.setItem('sb-vqnnlorukpzsftfisjrm-auth-token', JSON.stringify(session))
  }, { user, session })
  await page.route('**/api/admin-security?action=system-mode', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ testMode: false, changedAt: null }) }))
}

for (const viewport of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
  test(`${viewport.name} login layout`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.addInitScript(() => localStorage.setItem('punjab-cookie-consent', JSON.stringify({ necessary: true })))
    await page.goto(origin, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /Hi, Welcome/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Log in', exact: true })).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
    await page.screenshot({ path: `test-results/${viewport.name}-login.png`, fullPage: true })

    await page.getByRole('button', { name: 'Forgot password?' }).click()
    await expect(page.getByRole('heading', { name: 'Forgotten your password?' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
    await page.getByRole('button', { name: /Back to login/ }).click()

    await page.getByRole('button', { name: 'Activate your account with email' }).click()
    await expect(page.getByRole('heading', { name: 'First time here?' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
    await page.getByRole('button', { name: /Back to login/ }).click()

    await page.getByRole('button', { name: 'Customer', exact: true }).click()
    await page.getByRole('button', { name: 'Apply For An Account' }).click()
    await expect(page.getByRole('heading', { name: 'Apply For An Account' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
    await page.screenshot({ path: `test-results/${viewport.name}-signup.png`, fullPage: true })
  })

  test(`${viewport.name} restricted dashboard layout`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await prepareSession(page)
    await page.route('**/api/admin-security?action=system-overview', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(overview) }))
    await page.goto(origin, { waitUntil: 'domcontentloaded' })

    if (viewport.name === 'mobile') await page.getByRole('button', { name: 'Open menu' }).click()
    const menu = page.getByRole('navigation', { name: 'Dashboard sections' })
    await menu.getByRole('button', { name: /^More options/ }).click()
    await menu.getByRole('button', { name: 'System Overview', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'System Overview', level: 2 })).toBeVisible()
    await expect(page.getByText('Production systems operational')).toBeVisible()
    await page.waitForTimeout(350)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
    await page.screenshot({ path: `test-results/${viewport.name}-system-dashboard.png`, fullPage: true })
  })
}

test('password link verification layout is responsive', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => localStorage.setItem('punjab-cookie-consent', JSON.stringify({ necessary: true })))
  await page.goto(`${origin}/?type=recovery`, { waitUntil: 'domcontentloaded' })
  await expect(page.getByText('Verifying secure link')).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
})

test('tablet invoice table controls and responsive layout', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 })
  await prepareSession(page)
  await page.route('**/rest/v1/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]', headers: { 'content-range': '0-0/0' } }))
  await page.goto(origin, { waitUntil: 'domcontentloaded' })
  // Below 1100px the menu slides out from the "Menu" button.
  await page.getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('navigation', { name: 'Dashboard sections' }).getByRole('button', { name: 'Invoices', exact: true }).click()
  await expect(page.locator('.topbar-title')).toHaveText('Invoices')
  await expect(page.getByRole('button', { name: 'Unpaid Invoices (0)' })).toBeVisible()
  await expect(page.getByPlaceholder(/Search customer, account number or invoice number/)).toBeVisible()
  await expect(page.getByText('No unpaid invoices match these filters.')).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
  await page.screenshot({ path: 'test-results/tablet-invoice-table.png', fullPage: true })
})

test('settings centre is responsive and keeps category controls aligned', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 })
  await prepareSession(page)
  await page.route('**/rest/v1/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]', headers: { 'content-range': '0-0/0' } }))
  await page.goto(origin, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Open menu' }).click()
  await page.locator('.snav-tool').filter({ hasText: 'Settings' }).click()
  await expect(page.getByRole('heading', { name: 'Settings Centre' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Settings sections' })).toBeVisible()
  const settingsNav = page.getByRole('navigation', { name: 'Settings sections' })
  await settingsNav.getByRole('button', { name: /Communications/ }).click()
  await expect(page.getByText('notifications@punjabexoticfoods.com')).toBeVisible()
  await expect(page.locator('input[value="info@punjabexoticfoods.co.uk"]')).toBeVisible()
  await page.screenshot({ path: 'test-results/email-settings-centre.png', fullPage: true })
  await settingsNav.getByRole('button', { name: /Files & Backup/ }).click()
  await expect(page.getByText('Full Application Backup')).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
  await page.screenshot({ path: 'test-results/settings-centre.png', fullPage: true })
})
