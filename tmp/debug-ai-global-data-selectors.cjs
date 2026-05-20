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

  await page.goto('http://127.0.0.1:4173/channels/globalRadar/globalData', {
    waitUntil: 'load',
    timeout: 30_000,
  })

  const collapseButton = page.locator('aside[aria-label="全部会话"] button[aria-label="收起会话"]').first()
  if (await collapseButton.count()) {
    await collapseButton.click()
  }

  await page.waitForTimeout(1_500)

  const result = {
    url: page.url(),
    topLinkByRole: await page.getByRole('link', { name: 'AI全域雷达' }).count(),
    sideLinkByRole: await page.getByRole('link', { name: '全域数据' }).count(),
    configLinkByRole: await page.getByRole('link', { name: '配置中心' }).count(),
    campByLabel: await page.getByLabel('门店范围').count(),
    emptyByLabel: await page.getByLabel('全域数据空态').count(),
    openButtonByRole: await page.getByRole('button', { name: '立即开通' }).count(),
    openButtonByText: await page.getByText('立即开通', { exact: true }).count(),
    pageRoot: await page.locator('.ai-global-data-page').count(),
  }

  console.log(JSON.stringify(result, null, 2))

  await browser.close()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
