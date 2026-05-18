import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/customer/tag loads business data from provider and closes visible interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/customer/tag'))

  await expect(page.getByRole('link', { name: 'SCRM' })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '客户标签' })).toHaveClass(/is-active/)
  await expect(page.locator('.page-content > .page-header')).toBeHidden()

  const tagGroupInput = page.getByLabel('标签组')
  await expect(tagGroupInput).toHaveAttribute('placeholder', '请输入')
  await expect(page.getByLabel('客户标签服务契约')).toContainText('"provider":"mock"')
  await expect(page.getByLabel('客户标签服务契约')).toContainText('"responseCode":0')
  await expect(page.getByRole('button', { name: '重 置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '查 询' })).toBeVisible()
  await expect(page.getByRole('button', { name: '刷 新' })).toBeVisible()
  await expect(page.getByRole('button', { name: '导 出' })).toBeVisible()
  await expect(page.getByRole('button', { name: '同步企微标签' })).toBeVisible()
  await expect(page.getByRole('button', { name: '新建标签组' })).toBeVisible()

  await expect(page.getByLabel('客户标签表格').locator('.customer-tag-table__head > div')).toHaveText([
    '标签组',
    '标签名称',
    '创建人',
    '创建时间',
    '操作',
  ])
  await expect(page.getByLabel('客户标签表格')).toContainText('高价值住客')
  await expect(page.getByLabel('客户标签表格')).toContainText('复购潜力')
  await expect(page.getByLabel('客户标签统计')).toContainText('标签组数')
  await expect(page.getByLabel('客户标签统计')).toContainText('18')

  await tagGroupInput.fill('会员')
  await page.getByRole('button', { name: '查 询' }).click()
  await expect(page.getByRole('status')).toContainText('查询已更新')
  await expect(tagGroupInput).toHaveValue('会员')
  await expect(page.getByLabel('客户标签服务契约')).toContainText('"keyword":"会员"')
  await page.getByRole('button', { name: '重 置' }).click()
  await expect(tagGroupInput).toHaveValue('')
  await expect(page.getByRole('status')).toContainText('筛选已重置')

  await page.getByRole('button', { name: '刷 新' }).click()
  await expect(page.getByRole('button', { name: '刷 新' })).toBeDisabled()
  await expect(page.getByRole('status')).toContainText('数据已刷新')

  await page.getByRole('button', { name: '导 出' }).click()
  await expect(page.getByRole('status')).toContainText('导出任务已创建')

  await page.getByRole('button', { name: '查看 高价值住客' }).click()
  const detailDialog = page.getByRole('dialog', { name: '标签组详情' })
  await expect(detailDialog).toContainText('高价值住客')
  await expect(detailDialog).toContainText('最近 30 天新增')
  await detailDialog.getByRole('button', { name: '关闭' }).click()
  await expect(detailDialog).toBeHidden()

  await page.getByRole('button', { name: '新建标签组' }).click()
  const createDialog = page.getByRole('dialog', { name: '新建标签组' })
  await expect(createDialog).toBeVisible()
  await expect(createDialog.getByLabel('标签组名称')).toHaveAttribute('placeholder', '请输入标签组名称')
  await expect(createDialog).toContainText('标签')
  await expect(createDialog.getByRole('button', { name: '+ 添加标签' })).toBeVisible()
  await expect(createDialog.getByRole('button', { name: '取消' })).toBeVisible()
  await expect(createDialog.getByRole('button', { name: '确定' })).toBeVisible()
  await createDialog.getByLabel('标签组名称').fill('企业客户')
  await createDialog.getByRole('button', { name: '+ 添加标签' }).click()
  await createDialog.getByLabel('标签1').fill('协议客户')
  await createDialog.getByRole('button', { name: '确定' }).click()
  await expect(createDialog).toBeHidden()
  await expect(page.getByRole('status')).toContainText('标签组已保存')

  await page.getByRole('button', { name: '同步企微标签' }).click()
  const syncDialog = page.getByRole('dialog', { name: '企微标签同步' })
  await expect(syncDialog).toContainText('预计同步')
  await syncDialog.getByRole('button', { name: '开始同步' }).click()
  await expect(syncDialog).toBeHidden()
  await expect(page.getByRole('status')).toContainText('企微标签同步任务已提交')
})

test('/customer/tag shows empty and error states from the same response contract', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(appUrl('/customer/tag?customerTagMockState=empty'))
  await expect(page.getByLabel('客户标签服务契约')).toContainText('"state":"empty"')
  await expect(page.getByLabel('客户标签表格')).toContainText('当前条件下没有客户标签')
  await expect(page.getByRole('button', { name: '清空筛选' })).toBeVisible()

  await page.goto(appUrl('/customer/tag?customerTagMockState=error'))
  await expect(page.getByLabel('客户标签服务契约')).toContainText('"state":"error"')
  await expect(page.getByRole('alert')).toContainText('客户标签数据加载失败')
  await page.getByRole('button', { name: '重 试' }).click()
  await expect(page.getByLabel('客户标签服务契约')).toContainText('"responseCode":0')
  await expect(page.getByLabel('客户标签表格')).toContainText('高价值住客')
})
