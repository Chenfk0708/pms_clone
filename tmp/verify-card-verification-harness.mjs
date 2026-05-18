import { chromium, expect } from '@playwright/test'

const browser = await chromium.launch({
  executablePath: process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe',
  headless: true,
})

try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
  })
  await page.goto('http://127.0.0.1:55921/tmp/card-verification-harness.html', { waitUntil: 'load' })
  await page.evaluate(() => {
    window.localStorage.removeItem('pmsCardVerificationMockMode')
    window.localStorage.removeItem('pmsCardVerificationProvider')
  })
  await page.reload({ waitUntil: 'load' })

  await expect(page.getByTestId('card-verification-service-contract')).toHaveAttribute('data-provider', 'mock')
  await expect(page.getByLabel('卡券核销记录表格')).toContainText('LK20260518001')
  await expect(page.getByLabel('卡券核销记录表格')).toContainText('天落大床电竞套间')
  await expect(page.locator('.card-verify-page')).not.toContainText(
    /mock|provider|traceId|未接入|阻塞|后端未就绪|后端接口未完成|mock 数据/i,
  )

  await page.getByRole('button', { name: '核 销' }).click()
  await expect(page.getByRole('alert')).toContainText('请输入卡券码')
  await page.getByPlaceholder('请输入卡券码').fill('LK20260518002')
  await page.getByRole('button', { name: '核 销' }).click()
  await expect(page.getByRole('status', { name: '卡券核销操作反馈' })).toContainText('核销成功')
  await page.getByRole('button', { name: '查看详情 LK20260518002' }).click()
  await expect(page.getByRole('dialog', { name: '卡券核销详情' })).toContainText('相关订单')
  await page.screenshot({
    path: 'artifacts/screenshots/dingdan--yushouquan-dingdan--kaquan-hexiao/harness-clone-20260518-business-provider.png',
    fullPage: true,
  })

  await page.evaluate(() => {
    window.localStorage.setItem('pmsCardVerificationMockMode', 'empty')
  })
  await page.reload({ waitUntil: 'load' })
  await expect(page.getByTestId('card-verification-service-contract')).toHaveAttribute('data-mode', 'empty')
  await expect(page.getByRole('status', { name: '卡券核销空态' })).toContainText('暂无符合条件的核销记录')

  await page.evaluate(() => {
    window.localStorage.setItem('pmsCardVerificationMockMode', 'error')
  })
  await page.getByRole('button', { name: '刷新' }).click()
  await expect(page.getByRole('status', { name: '卡券核销数据状态' }).first()).toContainText('核销记录加载失败')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()

  console.log('card verification harness checks passed')
} finally {
  await browser.close()
}
