import type { Page } from '@playwright/test'

export async function seedAuthenticatedUser(page: Page, campId = '1796067693589061634') {
  await page.addInitScript((nextCampId) => {
    window.localStorage.setItem('pms_token', 'clean-playwright-token')
    window.localStorage.setItem('pmsCampId', nextCampId)
    window.localStorage.setItem('pms.currentCampId', nextCampId)
    window.localStorage.setItem(
      'pms_user',
      JSON.stringify({
        id: '1',
        name: 'Playwright Admin',
        mobile: '13800000001',
        roleName: 'Platform Admin',
        campId: nextCampId,
        campName: 'Mock Camp',
      }),
    )
  }, campId)
}

export function hashAppUrl(routePath: string, appBaseURL = process.env.PMS_TEST_BASE_URL) {
  const normalizedBase = appBaseURL?.replace(/\/$/, '') ?? ''
  if (routePath.startsWith('/#/')) return `${normalizedBase}${routePath}`
  return `${normalizedBase}/#${routePath.startsWith('/') ? routePath : `/${routePath}`}`
}
