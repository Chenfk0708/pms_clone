import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/psb/log matches captured report log default state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/psb/log'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '智慧酒店' })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '上报日志' })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: 'PSB公安对接' })).toBeVisible()

  await expect(page.getByRole('heading', { name: '上报日志', level: 1 })).toBeVisible()
  await expect(page.getByText('版本号：v4.10.7')).toBeVisible()
  await expect(page.getByRole('radio', { name: '全部门店' })).toBeChecked()
  await expect(page.getByRole('radio', { name: '天落会宿公寓(前海壹方城宝安中心店)' })).toBeVisible()
  await expect(page.getByPlaceholder('请输入订单号/手机号/房号')).toBeVisible()
  const toolbar = page.locator('.psb-log-toolbar')
  await expect(toolbar.getByText('上报时间:', { exact: true })).toBeVisible()
  await expect(toolbar.getByText('上报类型:', { exact: true })).toBeVisible()
  await expect(toolbar.getByText('上报状态:', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '查 询' })).toBeVisible()
  await expect(page.getByRole('button', { name: '重 置' })).toBeVisible()

  const headers = [
    '姓名',
    '手机号',
    '证件号码',
    '房间号',
    '订单来源',
    '订单号',
    '路客云订单号',
    '上报时间',
    '上报类型',
    '上报状态',
    '备注',
  ]
  for (const header of headers) {
    await expect(page.getByRole('columnheader', { name: header, exact: true })).toBeVisible()
  }
  await expect(page.getByText('暂无数据')).toBeVisible()
})

test('/psb/log supports captured filter dropdown, date, and empty query interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/psb/log'))

  await page.getByRole('button', { name: '上报类型 请选择' }).click()
  for (const option of ['入住', '续住', '换房', '退房', '未知', '删除入住登记']) {
    await expect(page.getByRole('option', { name: option, exact: true })).toBeVisible()
  }
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: '上报状态 请选择' }).click()
  await expect(page.getByRole('option', { name: '失败' })).toBeVisible()
  await expect(page.getByRole('option', { name: '成功' })).toBeVisible()
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: '上报时间 请选择 请选择' }).click()
  await expect(page.getByText('2026年5月')).toBeVisible()
  await expect(page.getByText('2026年6月')).toBeVisible()
  await page.keyboard.press('Escape')

  await page.getByPlaceholder('请输入订单号/手机号/房号').fill('2053550785075990529')
  await page.getByRole('button', { name: '查 询' }).click()
  await expect(page.getByText('暂无数据')).toBeVisible()

  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByPlaceholder('请输入订单号/手机号/房号')).toHaveValue('')
})
