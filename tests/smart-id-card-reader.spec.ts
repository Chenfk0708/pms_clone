import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/smartHotel/smartHardware/IDCardReader renders the provider-backed dashboard shell', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/smartHardware/IDCardReader'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '智慧酒店' })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '身份证读卡器' })).toHaveClass(/is-active/)

  await expect(page.locator('.smart-id-reader-page')).toHaveAttribute('data-provider', 'mock')
  await expect(page.getByRole('heading', { name: '身份证读卡器', level: 1 })).toBeVisible()
  await expect(
    page.getByText('接入身份证读卡器后，可直接读取住客信息，自动匹配订单并联动入住与公安上报流程。'),
  ).toBeVisible()
  await expect(page.getByText('版本号：v4.10.7')).toBeVisible()
  await expect(page.getByRole('button', { name: '查询' })).toBeVisible()
  await expect(page.getByRole('button', { name: '重置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '刷新' })).toBeVisible()
  await expect(page.getByRole('button', { name: '导出记录' })).toBeVisible()

  const metrics = page.locator('.smart-id-reader-metric')
  await expect(metrics).toHaveCount(4)
  await expect(metrics.nth(0)).toContainText('已接入设备')
  await expect(metrics.nth(1)).toContainText('今日读卡成功率')
  await expect(metrics.nth(2)).toContainText('待处理异常')
  await expect(metrics.nth(3)).toContainText('待读卡入住')

  await expect(page.getByRole('heading', { name: '接入流程' })).toBeVisible()
  await expect(page.getByText('请选择读卡器品牌')).toBeVisible()
  await expect(page.getByRole('button', { name: '华视' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'PMS助手下载' })).toBeVisible()
  await expect(page.getByRole('button', { name: '读身份证' })).toBeVisible()
  await expect(page.getByRole('button', { name: '完成对接' })).toBeVisible()

  await expect(page.getByRole('heading', { name: '最近读卡记录' })).toBeVisible()
  await expect(page.getByRole('table', { name: '身份证读卡记录表格' })).toContainText('张小雅')
  await expect(page.getByRole('table', { name: '身份证读卡记录表格' })).toContainText('华视 CRD-3000')

  await expect(page.getByRole('heading', { name: '快捷入口' })).toBeVisible()
  const quickLinks = page.locator('.smart-id-reader-quick-links')
  await expect(quickLinks.getByRole('button', { name: '智能门锁' })).toBeVisible()
  await expect(quickLinks.getByRole('button', { name: /公安对接/ })).toBeVisible()
  await expect(quickLinks.getByRole('button', { name: /智能硬件商城/ })).toBeVisible()
  await expect(quickLinks.getByRole('button', { name: /全局设置/ })).toBeVisible()

  const contract = page.getByTestId('smart-id-reader-service-contract')
  await expect(contract).toHaveAttribute('data-provider', 'mock')
  await expect(contract).toHaveAttribute('data-mock-state', 'success')
  await expect(contract).toHaveAttribute('data-device-status', 'all')
  await expect(contract).toHaveAttribute('data-record-count', '3')
})

test('/smartHotel/smartHardware/IDCardReader supports brand, read-card, detail, and route actions', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/smartHardware/IDCardReader'))

  await page.getByRole('button', { name: '华视' }).click()
  await expect(page.getByRole('option', { name: '精伦' })).toBeVisible()
  await page.getByRole('option', { name: '精伦' }).click()
  await expect(page.getByRole('button', { name: '精伦' })).toBeVisible()

  await page.getByRole('button', { name: 'PMS助手下载' }).click()
  await expect(page.getByRole('status', { name: '身份证读卡器操作反馈' })).toContainText(
    'PMS 助手安装包下载任务已创建',
  )

  await page.getByRole('button', { name: '读身份证' }).click()
  await expect(page.getByLabel('住客姓名')).toHaveValue('张小雅')
  await expect(page.getByLabel('身份证号码')).toHaveValue('4401********0621')
  await expect(page.getByRole('status', { name: '身份证读卡器操作反馈' })).toContainText(
    '已读取身份证信息',
  )

  await page.getByRole('button', { name: '完成对接' }).click()
  await expect(page.getByRole('status', { name: '身份证读卡器操作反馈' })).toContainText(
    '身份证读卡器已完成对接',
  )

  await page.getByRole('button', { name: '查看详情 张小雅' }).click()
  const detailDrawer = page.getByRole('dialog', { name: '读卡记录详情' })
  await expect(detailDrawer).toContainText('订单号')
  await expect(detailDrawer).toContainText('华视 CRD-3000')
  await page.getByRole('button', { name: '关闭读卡记录详情' }).click()
  await expect(detailDrawer).toBeHidden()

  await page.getByRole('button', { name: '智能门锁' }).click()
  await expect(page).toHaveURL(/\/smartHotel\/smartHardware\/smartLook$/)
})

test('/smartHotel/smartHardware/IDCardReader filters records and can reset them', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/smartHardware/IDCardReader'))

  await page.getByRole('button', { name: '设备状态：全部' }).click()
  await page.getByRole('option', { name: '待调试' }).click()
  await page.getByRole('button', { name: '查询' }).click()

  const contract = page.getByTestId('smart-id-reader-service-contract')
  await expect(contract).toHaveAttribute('data-device-status', 'pending')
  await expect(contract).toHaveAttribute('data-record-count', '1')
  await expect(page.getByRole('table', { name: '身份证读卡记录表格' })).toContainText('李文博')
  await expect(page.getByRole('table', { name: '身份证读卡记录表格' })).not.toContainText('张小雅')

  await page.getByRole('button', { name: '重置' }).click()
  await expect(contract).toHaveAttribute('data-device-status', 'all')
  await expect(contract).toHaveAttribute('data-record-count', '3')
  await expect(page.getByRole('button', { name: '设备状态：全部' })).toBeVisible()
})

test('/smartHotel/smartHardware/IDCardReader keeps usable empty and error states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(appUrl('/smartHotel/smartHardware/IDCardReader?mockState=empty'))
  await expect(page.getByRole('status', { name: '身份证读卡记录空状态' })).toContainText(
    '当前筛选条件下暂无读卡记录',
  )
  await expect(page.getByRole('heading', { name: '接入流程' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '快捷入口' })).toBeVisible()

  await page.goto(appUrl('/smartHotel/smartHardware/IDCardReader?mockState=error'))
  await expect(page.getByRole('alert', { name: '身份证读卡器加载失败' })).toContainText(
    '身份证读卡器数据加载失败',
  )
  await page.getByRole('button', { name: '重新加载' }).click()
  await expect(page).toHaveURL(/\/smartHotel\/smartHardware\/IDCardReader$/)
  await expect(page.getByRole('heading', { name: '身份证读卡器', level: 1 })).toBeVisible()
})
