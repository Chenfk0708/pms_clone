import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL
const forbiddenBodyTerms = ['mock 数据', 'mock provider', '未接入', '阻塞', '后端未就绪', '后端接口未完成']

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
})

test('/mallManagement/distribution uses unified data provider without development copy', async ({ page }) => {
  await page.goto(appUrl('/mallManagement/distribution'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('heading', { name: '全员营销', level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: '全员营销' })).toHaveClass(/is-active/)
  await expect(page.getByTestId('full-marketing-page')).toHaveAttribute('data-provider', 'mock')
  await expect(page.getByTestId('full-marketing-page')).toHaveAttribute(
    'data-trace-id',
    'mock-scrm--yingxiao-tuiguang--quanyuan-yingxiao-commission-001',
  )
  await expect(page.getByTestId('full-marketing-page')).toHaveAttribute('data-request-body', /"type":"0"/)

  const bodyText = await page.locator('body').innerText()
  for (const term of forbiddenBodyTerms) {
    expect(bodyText).not.toContain(term)
  }

  await expect(page.getByRole('tab', { name: '佣金设置' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('button', { name: '类型 日历房' })).toBeVisible()
  await expect(page.getByPlaceholder('请输入日历房/预售券名称')).toBeVisible()
  await expect(page.getByRole('button', { name: '重 置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '查 询' })).toBeVisible()
  await expect(page.getByRole('button', { name: '邀请分销员' })).toBeVisible()

  await expect(page.getByLabel('全员营销佣金设置表格').locator('.full-marketing-table__head > div')).toHaveText([
    '房型名称',
    '层级',
    '间接佣金(比率)',
    '直接佣金(比率)',
    '是否开启分销',
    '操作',
  ])
  await expect(page.getByLabel('全员营销佣金设置表格')).toContainText('顶层套房（浴缸巨幕电竞麻将）')
  await expect(page.getByLabel('全员营销佣金设置表格')).toContainText('总裁套间（桑拿浴缸露台电竞麻将）')
  await expect(page.getByText('第 1-4 条/总共 4 条')).toBeVisible()
})

test('/mallManagement/distribution filters, refreshes and visible toolbar actions provide feedback', async ({ page }) => {
  await page.goto(appUrl('/mallManagement/distribution'))

  await page.getByRole('button', { name: '类型 日历房' }).click()
  await expect(page.getByRole('listbox', { name: '类型选项' })).toContainText('日历房')
  await expect(page.getByRole('listbox', { name: '类型选项' })).toContainText('预售券')
  await page.getByRole('option', { name: '预售券' }).click()
  await expect(page.getByRole('button', { name: '类型 预售券' })).toBeVisible()
  await expect(page.getByRole('status')).toContainText('已切换为预售券')
  await expect(page.getByTestId('full-marketing-page')).toHaveAttribute('data-request-body', /"type":"1"/)

  await page.getByPlaceholder('请输入日历房/预售券名称').fill('天落')
  await page.getByRole('button', { name: '查 询' }).click()
  await expect(page.getByRole('status')).toContainText('已按当前条件更新')
  await expect(page.getByTestId('full-marketing-page')).toHaveAttribute('data-request-body', /"keyword":"天落"/)

  await page.getByRole('button', { name: '刷 新' }).click()
  await expect(page.getByRole('status')).toContainText('佣金设置已刷新')

  await page.getByRole('button', { name: '导 出' }).click()
  await expect(page.getByRole('status')).toContainText('导出任务已创建')

  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByRole('button', { name: '类型 日历房' })).toBeVisible()
  await expect(page.getByPlaceholder('请输入日历房/预售券名称')).toHaveValue('')
  await expect(page.getByRole('status')).toContainText('筛选条件已重置')
})

test('/mallManagement/distribution data tab and cross-page actions are handled', async ({ page }) => {
  await page.goto(appUrl('/mallManagement/distribution'))

  await page.getByRole('tab', { name: '分销数据' }).click()
  await expect(page.getByRole('tab', { name: '分销数据' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByTestId('full-marketing-page')).toHaveAttribute(
    'data-trace-id',
    'mock-scrm--yingxiao-tuiguang--quanyuan-yingxiao-distribution-001',
  )
  await expect(page.getByLabel('分销数据日期范围').getByPlaceholder('开始日期')).toHaveValue('2026-05-01')
  await expect(page.getByLabel('分销数据日期范围').getByPlaceholder('结束日期')).toHaveValue('2026-05-31')
  await expect(page.getByTestId('full-marketing-page')).toHaveAttribute('data-request-body', /"startDate":"2026-05-01"/)
  await expect(page.getByRole('button', { name: '筛选当月' })).toBeVisible()
  await expect(page.getByText('分销营业额')).toBeVisible()
  await expect(page.getByLabel('分销数据汇总').getByText('提成支出')).toBeVisible()

  await page.getByLabel('分销数据日期范围').getByPlaceholder('开始日期').fill('2026-05-10')
  await page.getByRole('button', { name: '筛选当月' }).click()
  await expect(page.getByRole('status')).toContainText('分销数据已更新')
  await expect(page.getByTestId('full-marketing-page')).toHaveAttribute('data-request-body', /"startDate":"2026-05-10"/)

  await page.getByRole('button', { name: '+生成分销二维码' }).click()
  await expect(page.getByRole('dialog', { name: '生成分销二维码' })).toContainText('全员营销分销二维码')
  await page.getByLabel('关闭生成分销二维码').click()

  await page.getByRole('button', { name: '房价管理' }).click()
  await expect(page).toHaveURL(/\/houseManage\/houseCale$/)
})

test('/mallManagement/distribution dialogs and save interactions update business state', async ({ page }) => {
  await page.goto(appUrl('/mallManagement/distribution'))

  await page.getByRole('button', { name: '邀请分销员' }).click()
  await expect(page.getByRole('dialog', { name: '邀请分销员' })).toContainText('请先开通品牌小程序后再设置分销。')
  await page.getByRole('button', { name: '联系客服' }).click()
  await expect(page.getByRole('status')).toContainText('已为你唤起客服处理分销开通')
  await page.getByRole('button', { name: '前往开通' }).click()
  await expect(page).toHaveURL(/\/version\/applicationPayment\/detail\?app=brandMiniProgram$/)

  await page.goto(appUrl('/mallManagement/distribution'))
  await page.getByRole('button', { name: '编辑 顶层套房（浴缸巨幕电竞麻将）' }).click()
  await expect(page.getByRole('dialog', { name: '编辑分销计划' })).toContainText('商品名称： 顶层套房（浴缸巨幕电竞麻将）')
  await page.getByLabel('一级分销').check()
  await page.getByPlaceholder('输入比例').first().fill('6')
  await page.getByRole('button', { name: '状态开关' }).click()
  await page.getByRole('button', { name: '提 交' }).click()
  await expect(page.getByRole('status')).toContainText('分销计划已保存')
  await expect(page.getByLabel('全员营销佣金设置表格')).toContainText('6%')
})

test('/mallManagement/distribution supports empty and error response states', async ({ page }) => {
  await page.goto(appUrl('/mallManagement/distribution'))
  await page.evaluate(() => window.localStorage.setItem('pms.fullMarketingMockMode', 'empty'))
  await page.reload()
  await expect(page.getByText('暂无符合当前条件的佣金计划')).toBeVisible()

  await page.evaluate(() => window.localStorage.setItem('pms.fullMarketingMockMode', 'error'))
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('全员营销数据加载失败')
  await page.getByRole('button', { name: '重新加载' }).click()
  await expect(page.getByRole('alert')).toContainText('全员营销数据加载失败')
  await page.evaluate(() => window.localStorage.removeItem('pms.fullMarketingMockMode'))
})
