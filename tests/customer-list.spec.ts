import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

async function openCustomerList(page, scenario: 'success' | 'empty' | 'error' = 'success') {
  await page.addInitScript((mode) => {
    window.localStorage.setItem('pms.customerList.scenario', mode)
    window.localStorage.setItem('pms.customerList.provider', 'mock')
  }, scenario)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/customer/list'))
}

test('/customer/list loads through the customer list provider contract', async ({ page }) => {
  await openCustomerList(page)

  await expect(page.getByRole('link', { name: 'SCRM' })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '客户列表' })).toHaveClass(/is-active/)
  await expect(page.locator('.page-content > .page-header')).toBeHidden()

  await expect(page.getByText('客户搜索')).toBeVisible()
  await expect(page.getByRole('button', { name: '客户标签' })).toBeVisible()
  await expect(page.getByRole('button', { name: '导出数据' })).toBeVisible()
  await expect(page.getByRole('button', { name: '添加客户' })).toBeVisible()
  await expect(page.getByLabel('客户列表表格')).toContainText('任清明')
  await expect(page.getByLabel('客户列表表格')).toContainText('1810493396951339010')
  await expect(page.getByLabel('客户列表表格')).toContainText('第 1-20 条 / 共 589 条')

  const contract = page.getByTestId('customer-list-contract')
  await expect(contract).toHaveAttribute('data-provider', 'mock')
  await expect(contract).toHaveAttribute('data-endpoint', '/member/page/get')
  await expect(contract).toContainText('"memberSearchType":"mobile"')
  await expect(contract).toContainText('"pageNum":1')
  await expect(contract).toContainText('"pageSize":20')

  await page.getByRole('button', { name: '客户标签' }).click()
  await expect(page).toHaveURL(/\/customer\/tag$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/customer\/list$/)

  await page.getByRole('button', { name: '批量加好友' }).click()
  await expect(page).toHaveURL(/\/customer\/addBatch$/)
})

test('/customer/list refreshes data from filters and keeps dropdown aligned to its trigger', async ({ page }) => {
  await openCustomerList(page)

  await page.getByPlaceholder('请输入').first().fill('13141204230')
  await page.getByRole('button', { name: '展开' }).click()

  const statusTrigger = page.getByRole('button', { name: '客户状态 请选择' })
  await statusTrigger.click()

  const statusOptions = page.getByRole('listbox', { name: '客户状态选项' })
  const triggerBox = await statusTrigger.boundingBox()
  const optionsBox = await statusOptions.boundingBox()
  expect(triggerBox).not.toBeNull()
  expect(optionsBox).not.toBeNull()
  expect(Math.abs((optionsBox?.x ?? 0) - (triggerBox?.x ?? 0))).toBeLessThan(12)
  expect((optionsBox?.y ?? 0) - ((triggerBox?.y ?? 0) + (triggerBox?.height ?? 0))).toBeGreaterThanOrEqual(0)
  expect((optionsBox?.y ?? 0) - ((triggerBox?.y ?? 0) + (triggerBox?.height ?? 0))).toBeLessThan(20)

  await page.getByRole('option', { name: '正常' }).click()
  await page.getByRole('button', { name: '会员等级 请选择' }).click()
  await page.getByRole('option', { name: '普通会员' }).click()
  await page.getByRole('button', { name: '是否添加企微 请选择' }).click()
  await page.getByRole('option', { name: '已添加' }).click()
  await page.getByLabel('最近消费金额最小值').fill('500')
  await page.getByRole('button', { name: '查询' }).click()

  const contract = page.getByTestId('customer-list-contract')
  await expect(contract).toContainText('"keyword":"13141204230"')
  await expect(contract).toContainText('"memberStatus":"NORMAL"')
  await expect(contract).toContainText('"memberCardId":"1796067693727473665"')
  await expect(contract).toContainText('"isJoinWxCp":1')
  await expect(contract).toContainText('"lastConsumeMin":"500"')
  await expect(page.getByLabel('客户列表表格')).toContainText('任清明')
  await expect(page.getByLabel('客户列表表格')).not.toContainText('路客云6TS5')

  await page.getByRole('checkbox', { name: '选择任清明' }).check()
  await expect(page.getByRole('status')).toContainText('已选择 1 位客户')
  await expect(page.getByLabel('批量操作')).toContainText('已选 1 位客户')
  await expect(page.getByLabel('批量操作').getByRole('button', { name: '送优惠券' })).toBeVisible()
  await expect(page.getByLabel('批量操作').getByRole('button', { name: '修改会员等级' })).toBeVisible()
  await expect(page.getByLabel('批量操作').getByRole('button', { name: '添加标签' })).toBeVisible()
  await page.getByLabel('批量操作').getByRole('button', { name: '取消选择' }).click()
  await expect(page.getByLabel('批量操作')).toBeHidden()
  await page.getByRole('checkbox', { name: '选择任清明' }).check()

  await page.getByRole('button', { name: '导出数据' }).click()
  await expect(page.getByRole('status')).toContainText('客户导出任务已创建')

  await page.getByRole('button', { name: '详情' }).first().evaluate((element: HTMLButtonElement) => element.click())
  await expect(page).toHaveURL(/\/customer\/list\/detail\?id=/)
  await expect(page.locator('.customer-detail-breadcrumb')).toContainText('客户列表')
  await expect(page.getByRole('button', { name: '客户概况' })).toHaveClass(/is-active/)
  await expect(page.getByLabel('基础信息')).toContainText('手机号')
  await expect(page.getByLabel('跟进记录')).toContainText('暂无数据')
  await page.goBack()

  await page.getByRole('button', { name: '更多' }).first().click()
  const moreMenu = page.getByRole('menu', { name: '客户更多操作' })
  await expect(moreMenu).toBeVisible()
  await expect(moreMenu.getByRole('menuitem', { name: '送优惠券' })).toBeVisible()
  await expect(moreMenu.getByRole('menuitem', { name: '修改会员等级' })).toBeVisible()
  await expect(moreMenu.getByRole('menuitem', { name: '修改标签' })).toBeVisible()
  await moreMenu.getByRole('menuitem', { name: '送优惠券' }).click()
  const couponDialog = page.getByRole('dialog', { name: '选择优惠券' })
  await expect(couponDialog).toBeVisible()
  await expect(couponDialog).toContainText('剩余库存')
  await expect(couponDialog).toContainText('生效范围')
  await couponDialog.getByRole('button', { name: '优惠券管理' }).click()
  await expect(page).toHaveURL(/\/mallManagement\/couponMgt$/)
  await page.goBack()

  await page.getByRole('button', { name: '更多' }).first().click()
  const moreMenuAgain = page.getByRole('menu', { name: '客户更多操作' })
  await moreMenuAgain.getByRole('menuitem', { name: '修改标签' }).click()
  const tagDialog = page.getByRole('dialog', { name: '选择标签' })
  await expect(tagDialog).toBeVisible()
  await expect(tagDialog.getByPlaceholder('搜索标签')).toBeVisible()
  await expect(tagDialog.getByRole('button', { name: '+ 添加标签' })).toBeVisible()
  await tagDialog.getByRole('button', { name: '完成' }).click()
  await expect(page.getByRole('status')).toContainText('客户标签已更新')

  await page.getByRole('button', { name: '添加客户' }).click()
  await page.getByRole('button', { name: '保存' }).click()
  await expect(page.getByRole('alert')).toContainText('请输入手机号')
  await page.getByRole('textbox', { name: '手机号' }).fill('13900001111')
  await page.getByRole('textbox', { name: '姓名' }).fill('新客户')
  await page.getByRole('button', { name: '保存' }).click()
  await expect(page.getByRole('status')).toContainText('客户已保存')
})

test('/customer/list exposes invalid filter parameters clearly', async ({ page }) => {
  await openCustomerList(page)

  await page.getByRole('button', { name: '展开' }).click()
  await page.getByLabel('最近消费金额最小值').fill('abc')
  await page.getByRole('button', { name: '查询' }).click()

  await expect(page.getByRole('alert')).toContainText('客户列表查询参数不合法')
  await expect(page.getByRole('alert')).toContainText('最近消费金额下限必须为数字')
})

test('/customer/list uses calendar date inputs for every time picker field', async ({ page }) => {
  await openCustomerList(page)

  await page.getByRole('button', { name: '展开' }).click()

  const queryDateInputs = page.locator('.customer-list-date input')
  await expect(queryDateInputs).toHaveCount(8)
  const queryDateInputTypes = await queryDateInputs.evaluateAll((elements) => elements.map((element) => (element as HTMLInputElement).type))
  expect(queryDateInputTypes).toEqual(['date', 'date', 'date', 'date', 'date', 'date', 'date', 'date'])

  await page.getByRole('button', { name: '添加客户' }).click()
  await expect(page.locator('.customer-list-modal input[type="date"]')).toHaveCount(2)
})

test('/customer/list handles empty provider responses without collapsing the table', async ({ page }) => {
  await openCustomerList(page, 'empty')

  await expect(page.getByLabel('客户列表表格')).toBeVisible()
  await expect(page.getByText('暂无符合条件的客户')).toBeVisible()
  await expect(page.getByTestId('customer-list-contract')).toContainText('"total":0')
  await expect(page.getByRole('button', { name: '添加客户' })).toBeEnabled()
})

test('/customer/list exposes provider errors and retries the same contract', async ({ page }) => {
  await openCustomerList(page, 'error')

  await expect(page.getByRole('alert')).toContainText('客户列表加载失败')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()

  await page.evaluate(() => window.localStorage.setItem('pms.customerList.scenario', 'success'))
  await page.getByRole('button', { name: '重新加载' }).click()

  await expect(page.getByLabel('客户列表表格')).toContainText('任清明')
  await expect(page.getByTestId('customer-list-contract')).toContainText('"pageNum":1')
})

test('/customer/list keeps the action column fixed on the right while horizontally scrolling', async ({ page }) => {
  await openCustomerList(page)

  const table = page.locator('.customer-list-table')
  const actionHeader = page.locator('.customer-list-table__head > div').last()
  const actionCell = page.locator('.customer-list-row .customer-list-actions').first()

  const headerBefore = await actionHeader.boundingBox()
  const cellBefore = await actionCell.boundingBox()
  expect(headerBefore).not.toBeNull()
  expect(cellBefore).not.toBeNull()

  await table.evaluate((node) => {
    node.scrollLeft = node.scrollWidth
  })

  const headerAfter = await actionHeader.boundingBox()
  const cellAfter = await actionCell.boundingBox()
  expect(headerAfter).not.toBeNull()
  expect(cellAfter).not.toBeNull()
  expect(Math.abs((headerAfter?.x ?? 0) - (headerBefore?.x ?? 0))).toBeLessThan(4)
  expect(Math.abs((cellAfter?.x ?? 0) - (cellBefore?.x ?? 0))).toBeLessThan(4)
})

test('/customer/detail replicates the target layout skeleton', async ({ page }) => {
  await page.goto(appUrl('/customer/list/detail?id=1801949727954239490'))

  await expect(page.locator('.customer-detail-breadcrumb')).toContainText('客户列表')
  await expect(page.locator('.customer-detail-breadcrumb')).toContainText('客户详情')
  await expect(page.getByRole('button', { name: '客户概况' })).toHaveClass(/is-active/)
  await expect(page.getByRole('button', { name: '会员信息' })).toBeVisible()
  await expect(page.getByRole('button', { name: '交易订单' })).toBeVisible()
  await expect(page.getByRole('button', { name: '优惠券明细' })).toBeVisible()

  await expect(page.getByLabel('客户摘要')).toContainText('pTu748894801')
  await expect(page.getByLabel('客户摘要')).toContainText('美团民宿')
  await expect(page.getByLabel('客户摘要').getByRole('button', { name: '送优惠券' })).toBeVisible()
  await expect(page.getByLabel('客户摘要').getByRole('button', { name: '修改会员等级' })).toBeVisible()
  await expect(page.getByLabel('客户摘要').getByRole('button', { name: '修改标签' })).toBeVisible()

  await expect(page.getByLabel('基础信息')).toContainText('手机号')
  await expect(page.getByLabel('跟进记录')).toContainText('暂无数据')
  await expect(page.getByLabel('资产信息')).toContainText('优惠券')
  await expect(page.getByLabel('交易信息')).toContainText('最近交易时间')
})

test('/customer/detail opens the target-style modal from edit and add-follow actions', async ({ page }) => {
  await page.goto(appUrl('/customer/list/detail?id=1801949727954239490'))

  await page.getByLabel('基础信息').getByRole('button', { name: '编辑' }).evaluate((element: HTMLButtonElement) => element.click())
  const editDialog = page.getByRole('dialog', { name: '添加跟进' })
  await expect(editDialog).toBeVisible()
  await expect(editDialog.getByText('跟进记录')).toBeVisible()
  await expect(editDialog.getByPlaceholder('请输入跟进记录')).toBeVisible()
  await expect(editDialog.getByRole('button', { name: '取消' })).toBeVisible()
  await expect(editDialog.getByRole('button', { name: '确定' })).toBeVisible()
  await editDialog.getByRole('button', { name: '×' }).click()
  await expect(editDialog).toBeHidden()

  await page.getByLabel('跟进记录').getByRole('button', { name: '添加跟进' }).evaluate((element: HTMLButtonElement) => element.click())
  const followDialog = page.getByRole('dialog', { name: '添加跟进' })
  await expect(followDialog).toBeVisible()
  await expect(followDialog.getByText('跟进记录')).toBeVisible()
  await followDialog.getByRole('button', { name: '取消' }).click()
  await expect(followDialog).toBeHidden()
})
