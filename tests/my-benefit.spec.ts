import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL
const pagePath = '/version/myBenefit'
const forbiddenDevelopmentCopy = /mock 数据|mock provider|provider=mock|未接入|待接入|阻塞|后端未就绪|后端接口未完成/

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test.beforeAll(async () => {
  await warmMyBenefitRoute()
})

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.myBenefitProvider', 'mock')
    window.localStorage.removeItem('pms.myBenefitMockState')
    window.localStorage.removeItem('pms.myBenefit.lastRequest')
  })
})

test('/version/myBenefit loads provider-driven benefit dashboard', async ({ page }) => {
  await page.goto(appUrl(pagePath))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '我的权益' })).toHaveClass(/is-active/)
  await expect(page.locator('.my-benefit-page')).toHaveAttribute('data-provider', 'mock')
  await expect(page.locator('.my-benefit-page')).toHaveAttribute('data-response-state', 'success')
  await expect(page.locator('.my-benefit-page')).toHaveAttribute('data-active-tab', 'resources')
  await expect(page.locator('body')).not.toContainText(forbiddenDevelopmentCopy)

  await expect(page.getByRole('region', { name: '当前版本' })).toContainText('当前版本：畅享版')
  await expect(page.getByRole('region', { name: '当前版本' })).toContainText('有效期到：2027-09-28')
  await expect(page.getByRole('table', { name: '版本资源表' })).toContainText('门店')
  await expect(page.getByRole('table', { name: '版本资源表' })).toContainText('成员账号')
  await expect(page.getByRole('table', { name: '版本资源表' })).toContainText('抖音直连')
  await expect(page.getByLabel('权益快览')).toContainText('当前版本')
  await expect(page.getByLabel('权益快览')).toContainText('资源项')

  const diagnostics = await readDiagnostics(page)
  expect(diagnostics).toMatchObject({
    provider: 'mock',
    endpoint: '/edition/resource/get',
    request: {
      campId: '1796067693589061634',
    },
  })
})

test('/version/myBenefit supports tab switching, detail feedback, and route coordination', async ({ page }) => {
  await page.goto(appUrl(pagePath))

  await page.getByRole('button', { name: '开通记录' }).click()
  await expect(page.locator('.my-benefit-page')).toHaveAttribute('data-active-tab', 'records')
  await expect(page.getByLabel('开通记录列表')).toContainText('畅享版首购')

  await page.getByRole('button', { name: '查看详情 畅享版首购' }).click()
  await expect(page.getByRole('dialog', { name: '记录详情' })).toContainText('订单号')
  await page.getByRole('button', { name: '关闭记录详情' }).click()

  await page.getByRole('tab', { name: '功能服务' }).click()
  await expect(page.locator('.my-benefit-page')).toHaveAttribute('data-active-tab', 'services')
  await expect(page.getByLabel('功能服务分组')).toContainText('专业住宿管理')
  await expect(page.getByRole('button', { name: '打开 智能房态房价' })).toBeVisible()
  await page.getByRole('button', { name: '打开 智能房态房价' }).click()
  await expect(page).toHaveURL(/\/houseManage\/houseCale$/)

  await page.goto(appUrl(pagePath))
  await page.getByRole('button', { name: '版本升级' }).click()
  await expect(page.locator('.my-benefit-page')).toHaveAttribute('data-upgrade-open', 'true')
  await expect(page.getByRole('region', { name: '版本订阅功能明细' })).toContainText('专业住宿管理')
  await page.getByRole('button', { name: '查看版本订阅' }).click()
  await expect(page).toHaveURL(/\/version\/subscriptionCenter$/)
})

test('/version/myBenefit supports refresh, export, empty state, and error recovery', async ({ page }) => {
  await page.goto(appUrl(pagePath))

  await page.getByRole('button', { name: '刷新权益' }).click()
  await expect(page.getByRole('status', { name: '我的权益操作反馈' })).toContainText('权益数据已刷新')

  await page.getByRole('button', { name: '导出记录' }).click()
  await expect(page.getByRole('status', { name: '我的权益操作反馈' })).toContainText('导出任务已创建')

  let diagnostics = await readDiagnostics(page)
  expect(diagnostics).toMatchObject({
    endpoint: '/version/myBenefit/export',
    request: {
      campId: '1796067693589061634',
    },
  })

  await page.goto(appUrl(`${pagePath}?myBenefitMockState=empty`))
  await expect(page.locator('.my-benefit-page')).toHaveAttribute('data-response-state', 'empty')
  await expect(page.getByLabel('权益空态')).toContainText('当前权益资源为空')
  await expect(page.locator('body')).not.toContainText(forbiddenDevelopmentCopy)

  await page.goto(appUrl(`${pagePath}?myBenefitMockState=error`))
  await expect(page.locator('.my-benefit-page')).toHaveAttribute('data-response-state', 'error')
  await expect(page.getByRole('alert', { name: '我的权益数据错误' })).toContainText('我的权益加载失败，请稍后重试')
  await page.getByRole('button', { name: '重试' }).click()
  await expect(page.locator('.my-benefit-page')).toHaveAttribute('data-response-state', 'success')

  diagnostics = await readDiagnostics(page)
  expect(diagnostics).toMatchObject({
    endpoint: '/edition/resource/get',
    request: {
      campId: '1796067693589061634',
    },
  })
})

async function readDiagnostics(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const rawValue = window.localStorage.getItem('pms.myBenefit.lastRequest')
    return rawValue ? JSON.parse(rawValue) : null
  })
}

async function warmMyBenefitRoute() {
  const targetUrl = appBaseURL ? `${appBaseURL}${pagePath}` : `http://127.0.0.1:4173${pagePath}`

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(targetUrl)
      if (response.ok) {
        await response.text()
        return
      }
    } catch {
      // Ignore warm-up failures and retry shortly.
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}
