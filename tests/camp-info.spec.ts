import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/InformationMaintenance/campInfo matches captured camp info list', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/InformationMaintenance/campInfo'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('.camp-info-page')).toBeVisible()
  await expect(page.getByText('门店名称:')).toBeVisible()
  await expect(page.getByPlaceholder('请输入')).toBeVisible()
  await expect(page.getByText('当前系统门店：')).toBeVisible()
  await expect(page.getByText('1/1')).toBeVisible()
  await expect(page.getByText('（2025.09.28 至 2027.09.28 ）')).toBeVisible()

  await expect(page.getByRole('button', { name: '新建门店' })).toBeVisible()
  await expect(page.getByRole('button', { name: '一键导入' })).toBeVisible()
  await expect(page.getByRole('button', { name: '门店排序' })).toBeVisible()

  const table = page.getByLabel('门店信息列表')
  await expect(table.locator('.camp-info-table__head > div')).toHaveText([
    '',
    '门店名称',
    '门店类型',
    '图片',
    '地址',
    '上架房型数量',
    '操作',
  ])
  await expect(table.locator('.camp-info-table__row')).toHaveCount(1)
  await expect(table).toContainText('天落会宿公寓(前海壹方城宝安中心店)')
  await expect(table).toContainText('酒店')
  await expect(table).toContainText('深圳宝安区新安街道海裕社区N15幸福海岸花园10栋30楼, 中国')
  await expect(table).toContainText('4')
  await expect(page.getByText('第 1-1 条/总共 1 条')).toBeVisible()
  await expect(page.getByRole('button', { name: '20 条/页' })).toBeVisible()
})

test('/InformationMaintenance/campInfo shows captured new store limit modal', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/InformationMaintenance/campInfo'))

  await page.locator('.camp-info-summary__actions button').first().click()

  await expect(page).toHaveURL(/\/InformationMaintenance\/campInfo$/)
  const dialog = page.getByRole('dialog', { name: '\u95e8\u5e97\u5269\u4f59\u6570\u91cf\u4e0d\u8db3' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('\u60a8\u5f53\u524d\u95e8\u5e97\u6570\u91cf\u5df2\u8fbe\u5230\u4e0a\u9650\uff0c\u65e0\u6cd5\u65b0\u589e\uff0c\u53ef\u6269\u5bb9\u540e\u91cd\u8bd5')
  await expect(dialog.getByRole('button', { name: '\u53d6\u6d88\u64cd\u4f5c' })).toBeVisible()
  await expect(dialog.getByRole('button', { name: '\u524d\u5f80\u6269\u5bb9' })).toBeVisible()
})

test('/InformationMaintenance/campInfo supports captured interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/InformationMaintenance/campInfo'))

  await page.getByRole('button', { name: '展开门店房型' }).click()
  await expect(page.getByLabel('门店房型明细')).toContainText('房型名称: 顶层套房（浴缸巨幕电竞麻将）')
  await expect(page.getByLabel('门店房型明细')).toContainText('房间数量: 1')
  await expect(page.getByLabel('门店房型明细')).toContainText('联动关房')

  await page.getByRole('button', { name: '编辑' }).click()
  await expect(page).toHaveURL(/\/InformationMaintenance\/campInfo\/edit$/)
  await expect(page.getByText('门店信息 /')).toBeVisible()
  await expect(page.getByRole('heading', { name: '编辑', level: 1 })).toBeVisible()
  await expect(page.getByText('基本信息')).toBeVisible()
  await expect(page.getByText('详细介绍')).toBeVisible()
  await expect(page.getByLabel('门店名称')).toHaveValue('天落会宿公寓(前海壹方城宝安中心店)')
  await expect(page.getByLabel('联系电话')).toHaveValue('+86-18123941382')
  await expect(page.getByText('第一张图片将会作为封面')).toBeVisible()
  await expect(page.getByText('若地图自动获取坐标有误，请拖动图标至正确坐标')).toBeVisible()
  await expect(page.getByRole('button', { name: '取 消' })).toBeVisible()
  await expect(page.getByRole('button', { name: '下一步' })).toBeVisible()

  await page.goto(appUrl('/InformationMaintenance/campInfo'))
  await page.getByRole('button', { name: '门店排序' }).click()
  await expect(page).toHaveURL(/\/InformationMaintenance\/campInfo\/sort$/)
  await expect(page.getByRole('tab', { name: '门店排序' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tab', { name: '房型排序' })).toHaveAttribute('aria-selected', 'false')
  await expect(page.getByRole('tab', { name: '商品排序' })).toHaveAttribute('aria-selected', 'false')
  await expect(page.getByText('拖拽即可进行排序，选定排序方式之后，系统将按照下方顺序展示')).toBeVisible()
  await expect(page.getByLabel('门店排序列表')).toContainText('天落会宿公寓(前海壹方城宝安中心店)')
})
