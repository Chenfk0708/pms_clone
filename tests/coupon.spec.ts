import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/mallManagement/couponMgt matches captured coupon list and task states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/mallManagement/couponMgt'))

  await expect(page.getByRole('heading', { name: '优惠券', level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: '优惠券' })).toHaveClass(/is-active/)
  await expect(page.locator('.page-content > .page-header')).toBeHidden()

  await expect(page.getByRole('tab', { name: '优惠券管理' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tab', { name: '派发任务' })).toBeVisible()
  await expect(page.getByRole('button', { name: '上架状态 请选择' })).toBeVisible()
  await expect(page.getByRole('button', { name: '重 置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '查 询' })).toBeVisible()
  await expect(page.getByRole('button', { name: '派发任务' })).toBeVisible()
  await expect(page.getByRole('button', { name: '新建' })).toBeVisible()

  await expect(page.getByLabel('优惠券列表表格').locator('.coupon-table__head > div')).toHaveText([
    '名称',
    '类型',
    '优惠力度',
    '可用范围',
    '派发上限',
    '每人可领数',
    '派发时间',
    '时效类型',
    '生效时间',
    '领券条件',
    '状态',
    '操作',
  ])
  await expect(page.getByText('暂无数据')).toBeVisible()

  await page.getByRole('button', { name: '上架状态 请选择' }).click()
  await expect(page.getByRole('listbox', { name: '上架状态选项' })).toContainText('已上架')
  await page.getByRole('option', { name: '已上架' }).click()
  await expect(page.getByRole('button', { name: '上架状态 已上架' })).toBeVisible()
  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByRole('button', { name: '上架状态 请选择' })).toBeVisible()

  await page.getByRole('tab', { name: '派发任务' }).click()
  await expect(page.getByRole('tab', { name: '派发任务' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText('全部记录')).toBeVisible()
  await expect(page.getByRole('button', { name: '新建任务' })).toBeVisible()
  await expect(page.getByLabel('派发任务表格').locator('.coupon-table__head > div')).toHaveText([
    '派发方式',
    '优惠券',
    '已派数量',
    '创建时间',
    '记录',
  ])
  await expect(page.getByText('暂无数据')).toBeVisible()
})

test('/mallManagement/couponMgt/edit matches captured new coupon form', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/mallManagement/couponMgt'))

  await page.getByRole('button', { name: '新建' }).click()
  await expect(page).toHaveURL(/\/mallManagement\/couponMgt\/edit$/)
  await expect(page.getByRole('heading', { name: '优惠券', level: 1 })).toBeVisible()
  await expect(page.getByText('优惠券列表>新增')).toBeVisible()
  await expect(page.getByLabel('优惠券表单')).toContainText('名称')
  await expect(page.getByLabel('优惠券表单')).toContainText('类型')
  await expect(page.getByLabel('类型 满减券')).toBeChecked()
  await expect(page.getByLabel('优惠券表单')).toContainText('优惠金额')
  await expect(page.getByLabel('优惠券表单')).toContainText('生效范围')
  await expect(page.getByLabel('优惠券表单')).toContainText('领券条件')
  await expect(page.getByLabel('所有人可以领')).toBeChecked()
  await expect(page.getByLabel('可以与会员折扣共用')).toBeChecked()
  await expect(page.getByLabel('优惠券表单')).toContainText('派发上限')
  await expect(page.getByLabel('优惠券表单')).toContainText('每人可领数')
  await expect(page.getByLabel('优惠券表单')).toContainText('派发时间')
  await expect(page.getByLabel('优惠券表单')).toContainText('时效类型')
  await expect(page.getByLabel('有效天数')).toBeChecked()
  await expect(page.getByLabel('优惠券表单')).toContainText('不可用时间')
  await expect(page.getByRole('button', { name: '返回列表' })).toBeVisible()
  await expect(page.getByRole('button', { name: '提 交' })).toBeVisible()

  await page.getByRole('button', { name: '返回列表' }).click()
  await expect(page).toHaveURL(/\/mallManagement\/couponMgt$/)
})
