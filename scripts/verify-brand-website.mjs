import { chromium } from '@playwright/test'

const CHROME_PATH =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'
const BASE_URL = process.env.PMS_TEST_BASE_URL ?? 'http://127.0.0.1:4212'
const ROUTE = '/mallManagement/weapp/decorate'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function openPage(context, mode = 'success') {
  console.log(`open:${mode}`)
  const page = await context.newPage()
  await page.addInitScript((mockMode) => {
    window.localStorage.setItem('pms.brandWebsiteProvider', 'mock')
    window.localStorage.setItem('pms.brandWebsiteMockMode', mockMode)
  }, mode)
  await page.goto(`${BASE_URL}${ROUTE}`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await page.waitForSelector('.brand-website-page', { timeout: 15_000 })
  const collapseButton = page.locator('.chat-dock__collapse').first()
  if (await collapseButton.count()) {
    await collapseButton.click()
  }
  return page
}

async function main() {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
  })

  try {
    const page = await openPage(context)
    console.log('check:success surface')
    const bodyText = await page.locator('body').innerText()
    assert(bodyText.includes('品牌官网'), '页面标题未渲染')
    assert(bodyText.includes('今日访问') && bodyText.includes('1,286'), '核心指标未渲染')
    assert(bodyText.includes('露营地主题模板') && bodyText.includes('酒店主题模板'), '模板数据未渲染')
    assert(!/mock|provider|未接入|阻塞|后端未就绪|后端接口未完成|接口契约|未取证/i.test(bodyText), '页面正文包含开发态文案')

    const contract = await page.locator('[data-testid="brand-website-contract"]').innerText()
    assert(contract.includes('mock-ota--siyu--pinpai-guanwang-list-001'), '统一响应包 traceId 未暴露到契约节点')

    await page.locator('select[aria-label="门店"]').selectOption('camp-hotel')
    await page.locator('input[aria-label="运营日期"]').fill('2026-05-19')
    await page.locator('.brand-toolbar button').nth(0).click()
    await page.waitForFunction(() => document.body.innerText.includes('已按当前条件更新品牌官网'), null, { timeout: 10_000 })
    console.log('check:filters')
    const updatedContract = await page.locator('[data-testid="brand-website-contract"]').innerText()
    assert(updatedContract.includes('"campId":"camp-hotel"'), '查询后请求参数未同步 campId')
    assert(updatedContract.includes('"businessDate":"2026-05-19"'), '查询后请求参数未同步 businessDate')

    await page.locator('.brand-toolbar button').nth(2).click()
    await page.waitForFunction(() => document.body.innerText.includes('品牌官网数据已刷新'), null, { timeout: 10_000 })
    await page.locator('.brand-toolbar button').nth(3).click()
    await page.waitForFunction(() => document.body.innerText.includes('导出任务已创建'), null, { timeout: 10_000 })
    console.log('check:toolbar actions')

    await page.locator('.brand-metric-strip button').first().click()
    await page.waitForSelector('[role="dialog"][aria-label="指标详情"]')
    await page.locator('[role="dialog"][aria-label="指标详情"] header button').click()
    console.log('check:metric dialog')

    await page.locator('.brand-template-market .brand-template').nth(1).locator('button').first().click()
    await page.waitForFunction(() => document.body.innerText.includes('已应用酒店主题模板'), null, { timeout: 10_000 })
    await page.locator('.brand-template-market .brand-template').nth(1).locator('.brand-secondary-button').click()
    await page.waitForSelector('[role="dialog"][aria-label="模板详情"]')
    await page.locator('[role="dialog"][aria-label="模板详情"] header button').click()
    console.log('check:template actions')

    await page.locator('.brand-page-nav button').nth(3).click()
    await page.locator('.brand-coupon-filter input').fill('春季')
    await page.locator('.brand-coupon-filter button').first().click()
    await page.waitForFunction(() => document.body.innerText.includes('已筛选领券活动'), null, { timeout: 10_000 })
    await page.locator('.brand-table-toolbar button').first().click()
    await page.waitForSelector('[role="dialog"][aria-label="活动详情"]')
    await page.locator('[role="dialog"][aria-label="活动详情"] header button').click()
    console.log('check:coupon actions')

    await page.locator('.brand-page-nav button').nth(1).click()
    await page.locator('.brand-store-row button').click()
    await page.waitForFunction(() => document.body.innerText.includes('店铺主页配置已保存'), null, { timeout: 10_000 })
    await page.locator('.brand-route-grid button').first().click()
    assert(page.url().endsWith('/houseManage/days'), '店铺主页快捷入口未跳转到房态')
    await page.goto(`${BASE_URL}${ROUTE}`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await page.waitForSelector('.brand-website-page', { timeout: 15_000 })
    const collapseButton = page.locator('.chat-dock__collapse').first()
    if (await collapseButton.count()) {
      await collapseButton.click()
    }
    console.log('check:store route')

    await page.locator('.brand-page-nav button').nth(2).click()
    await page.locator('.brand-store-row button').click()
    await page.waitForFunction(() => document.body.innerText.includes('个人中心配置已保存'), null, { timeout: 10_000 })
    await page.locator('.brand-todo-list button').first().click()
    await page.waitForFunction(() => document.body.innerText.includes('已标记处理'), null, { timeout: 10_000 })

    await page.locator('.brand-page-nav button').nth(4).click()
    await page.locator('.brand-savebar button').click()
    await page.waitForFunction(() => document.body.innerText.includes('配置已保存并发布'), null, { timeout: 10_000 })

    await page.locator('.brand-page-nav button').nth(5).click()
    await page.locator('.brand-upload').click()
    await page.waitForFunction(() => document.body.innerText.includes('悬浮框素材已上传'), null, { timeout: 10_000 })

    await page.locator('.brand-page-nav button').nth(6).click()
    await page.locator('.brand-upload').click()
    await page.waitForFunction(() => document.body.innerText.includes('首页弹窗素材已上传'), null, { timeout: 10_000 })

    await page.locator('.brand-page-nav button').nth(7).click()
    await page.locator('.brand-style-swatches button').first().click()
    await page.waitForFunction(() => document.body.innerText.includes('全局风格颜色已更新'), null, { timeout: 10_000 })
    console.log('check:section actions')

    const emptyPage = await openPage(context, 'empty')
    const emptyText = await emptyPage.locator('body').innerText()
    assert(emptyText.includes('暂无符合当前条件的品牌官网配置'), '空态未渲染')
    console.log('check:empty')

    const errorPage = await openPage(context, 'error')
    const errorText = await errorPage.locator('body').innerText()
    assert(errorText.includes('品牌官网数据加载失败'), '错误态未渲染')
    await errorPage.locator('.brand-state-card button').click()
    await errorPage.waitForFunction(() => document.body.innerText.includes('已重新加载品牌官网'), null, { timeout: 10_000 })
    console.log('check:error retry')

    console.log(
      JSON.stringify(
        {
          route: ROUTE,
          baseUrl: BASE_URL,
          checks: [
            'success data envelope',
            'business copy guard',
            'filter request parameters',
            'toolbar feedback',
            'metric detail dialog',
            'template actions',
            'coupon actions',
            'store route coordination',
            'profile and section feedback',
            'empty state',
            'error retry',
          ],
          status: 'passed',
        },
        null,
        2,
      ),
    )
  } finally {
    await context.close()
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
