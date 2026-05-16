import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/psb/list matches captured PSB police default state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/psb/list'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '智慧酒店' })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: 'PSB公安对接' })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '上报日志' })).toBeVisible()

  await expect(page.getByRole('heading', { name: 'PSB公安对接', level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name: '公安登记' })).toBeVisible()
  await expect(page.getByText('入住客人登记的信息同步到当地合法监管部门')).toBeVisible()
  await expect(page.getByRole('button', { name: '新 增' })).toBeVisible()

  const headers = [
    '登记系统/机构',
    '酒店旅业编码/ID',
    '类型',
    '商户名称',
    '关联门店',
    '关联房间数',
    '操作',
  ]
  for (const header of headers) {
    await expect(page.getByRole('columnheader', { name: header })).toBeVisible()
  }
  await expect(page.getByText('暂无数据')).toBeVisible()
  await expect(page.locator('.chat-dock')).toContainText('全部会话')
})

test('/psb/list supports captured add registration modal', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/psb/list'))

  await page.getByRole('button', { name: '新 增' }).click()

  const dialog = page.getByRole('dialog', { name: '新增' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('登记系统/机构')).toBeVisible()
  await expect(dialog.getByRole('button', { name: '广东旅业系统' })).toBeVisible()
  await expect(dialog.getByPlaceholder('请输入商户名称')).toBeVisible()
  await expect(dialog.getByRole('button', { name: '请选择门店' })).toBeVisible()
  await expect(dialog.getByPlaceholder('请输入旅业经营名称')).toBeVisible()
  await expect(dialog.getByPlaceholder('请输入旅业编码')).toBeVisible()
  await expect(dialog.getByPlaceholder('请输入社会信用代码')).toBeVisible()
  await expect(dialog.getByPlaceholder('请输入行政区划码')).toBeVisible()
  await expect(dialog.getByPlaceholder('请输入accessKeyId')).toBeVisible()
  await expect(dialog.getByPlaceholder('请输入设备处理业务公钥')).toBeVisible()
  await expect(dialog.getByPlaceholder('请输入设备处理业务私钥')).toBeVisible()
  await expect(dialog.getByPlaceholder('请输入登记人姓名')).toBeVisible()
  await expect(dialog.getByPlaceholder('请输入登记人证件号码')).toBeVisible()

  await dialog.getByPlaceholder('请输入商户名称').fill('测试商户')
  await expect(dialog.getByPlaceholder('请输入商户名称')).toHaveValue('测试商户')

  await dialog.getByRole('button', { name: '确 定' }).click()
  await expect(dialog.getByRole('status')).toHaveText('请完善必填信息后提交')

  await dialog.getByRole('button', { name: '取 消' }).click()
  await expect(dialog).toBeHidden()
})
