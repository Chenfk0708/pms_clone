const { chromium, devices } = require('@playwright/test')

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe',
  })
  const context = await browser.newContext({
    ...devices['Desktop Chrome'],
  })
  const page = await context.newPage()

  await page.addInitScript(() => {
    window.localStorage.setItem('pms.aiGlobalDataProvider', 'mock')
    window.localStorage.setItem('pms.aiGlobalDataMockState', 'success')
  })

  console.log('1. goto')
  await page.goto('http://127.0.0.1:4173/channels/globalRadar/globalData', {
    waitUntil: 'load',
    timeout: 30_000,
  })

  const collapseButton = page.locator('aside[aria-label="全部会话"] button[aria-label="收起会话"]').first()
  if (await collapseButton.count()) {
    await collapseButton.click()
  }

  console.log('2. select filters')
  await page.locator('#ai-global-data-filter-camp').selectOption('camp-haizhu')
  await page.locator('#ai-global-data-filter-channel').selectOption('meituan')
  await page.locator('#ai-global-data-filter-attention').selectOption('high')
  await page.locator('#ai-global-data-filter-room-keyword').fill('大床')

  console.log('3. query')
  await page.locator('.ai-global-data-filters__actions button').first().click()
  await page.waitForTimeout(1_000)
  console.log('feedback:', await page.locator('.ai-global-data-feedback').innerText())

  console.log('4. open metric dialog')
  await page.locator('.ai-global-data-summary-card').first().click()
  await page.locator('.ai-global-data-modal[aria-label="指标详情"]').waitFor({ state: 'visible', timeout: 5_000 })
  await page.locator('.ai-global-data-modal[aria-label="指标详情"] button[aria-label="关闭指标详情"]').click()

  console.log('5. postpone reminder')
  await page.locator('[aria-label="强提醒列表"] .ai-global-data-reminder').first().locator('button').nth(1).click()
  console.log('feedback:', await page.locator('.ai-global-data-feedback').innerText())

  console.log('6. open room detail dialog')
  await page.locator('[aria-label="房型经营看板"] .ai-global-data-table__row').first().locator('button').nth(1).click()
  await page.locator('.ai-global-data-modal[aria-label="房型经营详情"]').waitFor({ state: 'visible', timeout: 5_000 })
  await page.locator('.ai-global-data-modal[aria-label="房型经营详情"] button[aria-label="关闭房型经营详情"]').click()

  console.log('7. refresh and export')
  await page.getByTestId('ai-global-data-refresh').click()
  await page.waitForTimeout(1_000)
  console.log('feedback:', await page.locator('.ai-global-data-feedback').innerText())
  await page.getByTestId('ai-global-data-export').click()
  console.log('feedback:', await page.locator('.ai-global-data-feedback').innerText())

  console.log('8. quick link')
  await page.locator('.ai-global-data-quick-links button').first().click()
  await page.waitForTimeout(1_000)
  console.log('final url:', page.url())

  await browser.close()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
