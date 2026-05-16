import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/customer/tag matches captured customer tag empty state and dialogs', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/customer/tag'))

  await expect(page.getByRole('link', { name: 'SCRM' })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '客户标签' })).toHaveClass(/is-active/)
  await expect(page.locator('.page-content > .page-header')).toBeHidden()

  const tagGroupInput = page.getByLabel('标签组')
  await expect(tagGroupInput).toHaveAttribute('placeholder', '请输入')
  await expect(page.getByRole('button', { name: '重 置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '查 询' })).toBeVisible()
  await expect(page.getByRole('button', { name: '同步企微标签' })).toBeVisible()
  await expect(page.getByRole('button', { name: '新建标签组' })).toBeVisible()

  await expect(page.getByLabel('客户标签表格').locator('.customer-tag-table__head > div')).toHaveText([
    '标签组',
    '标签名称',
    '创建人',
    '创建时间',
    '操作',
  ])
  await expect(page.getByLabel('客户标签表格')).toContainText('暂无数据')

  await tagGroupInput.fill('会员')
  await page.getByRole('button', { name: '查 询' }).click()
  await expect(tagGroupInput).toHaveValue('会员')
  await expect(page.getByLabel('客户标签表格')).toContainText('暂无数据')
  await page.getByRole('button', { name: '重 置' }).click()
  await expect(tagGroupInput).toHaveValue('')

  await page.getByRole('button', { name: '新建标签组' }).click()
  const createDialog = page.getByRole('dialog', { name: '新建标签组' })
  await expect(createDialog).toBeVisible()
  await expect(createDialog.getByLabel('标签组名称')).toHaveAttribute('placeholder', '请输入标签组名称')
  await expect(createDialog).toContainText('标签')
  await expect(createDialog.getByRole('button', { name: '+ 添加标签' })).toBeVisible()
  await expect(createDialog.getByRole('button', { name: '取消' })).toBeVisible()
  await expect(createDialog.getByRole('button', { name: '确定' })).toBeVisible()
  await createDialog.getByRole('button', { name: '取消' }).click()
  await expect(createDialog).toBeHidden()

  await page.getByRole('button', { name: '同步企微标签' }).click()
  const authDialog = page.getByRole('dialog', { name: '企微授权提示' })
  await expect(authDialog).toContainText('请先前往授权企微再操作')
  await expect(authDialog.getByRole('button', { name: '我知道了' })).toBeVisible()
  await expect(authDialog.getByRole('button', { name: '前往授权' })).toBeVisible()
})
