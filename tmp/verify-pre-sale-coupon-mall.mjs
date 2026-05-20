import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const baseURL = process.env.PMS_TEST_BASE_URL ?? 'http://127.0.0.1:43380'
const screenshotDir = path.resolve('artifacts/screenshots/baobiao--yushouquan-shuju--yushouquan-hexiao-mingxi')
const executablePath = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe'

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function textOf(locator) {
  return ((await locator.textContent()) ?? '').trim()
}

async function waitForSuccessReady(page) {
  await page.locator('#pre-sale-coupon-mall-diagnostics').waitFor({ state: 'attached', timeout: 15000 })
  await page.locator('button.presale-coupon-metric').first().waitFor({ state: 'visible', timeout: 15000 })
  await page.locator('table tbody tr').first().waitFor({ state: 'visible', timeout: 15000 })
}

async function verifySuccess(page) {
  await page.goto(`${baseURL}/statistics/preSaleCouponMall`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await waitForSuccessReady(page)

  assert(await page.getByRole('link', { name: '预售券核销明细' }).isVisible(), 'sidebar link not visible')
  assert((await textOf(page.getByLabel('门店'))).includes('天落会宿公寓(前海壹方城宝安中心店)'), 'store text mismatch')
  assert((await page.getByLabel('开始日期').inputValue()) === '2026-05-01', 'start date mismatch')
  assert((await page.getByLabel('结束日期').inputValue()) === '2026-05-31', 'end date mismatch')
  assert(await page.getByRole('button', { name: '渠道 全部渠道' }).isVisible(), 'channel select missing')
  assert(await page.getByRole('button', { name: '预售券类型 全部类型' }).isVisible(), 'category select missing')
  assert((await textOf(page.locator('button.presale-coupon-metric').first())).includes('168'), 'metric 168 missing')
  assert((await textOf(page.locator('button.presale-coupon-metric').nth(3))).includes('25,780'), 'metric 25780 missing')
  assert((await textOf(page.locator('table tbody tr').first().locator('td').first())).includes('天落电竞双人房周末通兑券'), 'first row name mismatch')
  assert((await textOf(page.locator('table tbody tr').first().locator('td').nth(1))).includes('房券'), 'first row category mismatch')
  assert(await page.getByRole('button', { name: '查看详情 天落电竞双人房周末通兑券' }).isVisible(), 'detail button missing')
  assert((await page.locator('#pre-sale-coupon-mall-diagnostics').getAttribute('data-provider')) === 'mock', 'provider mismatch')
  assert((await page.locator('#pre-sale-coupon-mall-diagnostics').getAttribute('data-state')) === 'success', 'state mismatch')

  await fs.mkdir(screenshotDir, { recursive: true })
  await page.screenshot({ path: path.join(screenshotDir, 'success-clone-route.png'), fullPage: true })
}

async function verifyInteractions(page) {
  await page.goto(`${baseURL}/statistics/preSaleCouponMall`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await waitForSuccessReady(page)

  await page.getByRole('button', { name: '渠道 全部渠道' }).click()
  assert((await textOf(page.getByRole('listbox', { name: '渠道选项' }))).includes('路客云聚合'), 'channel options mismatch')
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: '预售券类型 全部类型' }).click()
  assert((await textOf(page.getByRole('listbox', { name: '预售券类型选项' }))).includes('套餐'), 'category options mismatch')
  await page.keyboard.press('Escape')

  await page.getByLabel('开始日期').click()
  assert((await textOf(page.getByRole('dialog', { name: '统计日期面板' }))).includes('2026年5月'), 'date panel mismatch')
  assert(await page.getByRole('button', { name: '本月' }).isVisible(), 'date preset missing')
  await page.keyboard.press('Escape')

  await page.getByPlaceholder('请输入商品编号/商品名称').fill('电竞')
  await page.getByRole('button', { name: '查 询' }).click()
  assert((await textOf(page.getByRole('status'))).includes('已按当前条件刷新核销明细'), 'query notice mismatch')
  assert(((await page.locator('#pre-sale-coupon-mall-diagnostics').getAttribute('data-request')) ?? '').includes('"keyword":"电竞"'), 'keyword missing in diagnostics')

  await page.getByRole('button', { name: '刷 新' }).click()
  assert((await textOf(page.getByRole('status'))).includes('已刷新预售券核销明细'), 'refresh notice mismatch')

  await page.getByRole('button', { name: '导 出' }).click()
  assert((await textOf(page.getByRole('status'))).includes('导出任务已创建'), 'export notice mismatch')

  await page.getByRole('button', { name: '查看详情 天落电竞双人房周末通兑券' }).click()
  assert((await textOf(page.getByRole('dialog', { name: '预售券详情' }))).includes('天落电竞双人房周末通兑券'), 'detail dialog mismatch')
  await page.getByRole('button', { name: '关闭详情' }).click()

  await page.getByRole('button', { name: '重 置' }).click()
  assert((await page.getByPlaceholder('请输入商品编号/商品名称').inputValue()) === '', 'reset keyword mismatch')

  await page.getByRole('button', { name: '说 明' }).click()
  assert((await textOf(page.getByRole('dialog', { name: '字段说明' }))).includes('成交券数'), 'description dialog mismatch')
  await page.getByRole('button', { name: '关闭字段说明' }).click()
}

async function verifyStates(page) {
  await page.goto(`${baseURL}/statistics/preSaleCouponMall?mockState=empty`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await page.locator('#pre-sale-coupon-mall-diagnostics').waitFor({ state: 'attached', timeout: 15000 })
  assert((await page.locator('#pre-sale-coupon-mall-diagnostics').getAttribute('data-state')) === 'empty', 'empty diagnostics mismatch')
  assert(await page.getByText('当前筛选条件下暂无核销明细').isVisible(), 'empty text missing')
  assert((await page.locator('table tbody tr').count()) === 0, 'empty row count mismatch')

  await page.goto(`${baseURL}/statistics/preSaleCouponMall?mockState=error`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await page.locator('#pre-sale-coupon-mall-diagnostics').waitFor({ state: 'attached', timeout: 15000 })
  assert((await page.locator('#pre-sale-coupon-mall-diagnostics').getAttribute('data-state')) === 'error', 'error diagnostics mismatch')
  assert((await textOf(page.getByRole('alert'))).includes('预售券核销明细加载失败'), 'error alert mismatch')
  assert(await page.getByRole('button', { name: '重新加载' }).isVisible(), 'retry button missing')
}

const browser = await chromium.launch({ headless: true, executablePath })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

try {
  await verifySuccess(page)
  await verifyInteractions(page)
  await verifyStates(page)
  console.log('verify-pre-sale-coupon-mall:ok')
} finally {
  await browser.close()
}
