import { expect, test, type Page } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

async function gotoPsbPage(page: Page, routePath: string) {
  await page.goto(appUrl(routePath), { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.psb-page')).toBeVisible({ timeout: 20_000 })
}

async function submitValidPsbMerchant(page: Page) {
  await page.getByRole('button', { name: '新 增' }).click()
  const dialog = page.getByRole('dialog', { name: '新增' })

  await dialog.getByRole('button', { name: '请选择门店' }).click()
  await dialog.getByRole('option', { name: '天落会宿公寓(前海壹方城宝安中心店)' }).click()

  await dialog.getByPlaceholder('请输入商户名称').fill('天落会宿公寓前海店')
  await dialog.getByPlaceholder('请输入旅业经营名称').fill('天落会宿公寓前海店')
  await dialog.getByPlaceholder('请输入旅业编码').fill('GD-LY-20260519-001')
  await dialog.getByPlaceholder('请输入社会信用代码').fill('91440300MA5XXXXXXX')
  await dialog.getByPlaceholder('请输入旅业经营地址').fill('深圳市宝安区新湖路99号')
  await dialog.getByPlaceholder('请输入行政区划码').fill('440306')
  await dialog.getByPlaceholder('请输入旅业申请的注册码').fill('PSB-REG-001')
  await dialog.getByPlaceholder('请输入旅馆编码').fill('HOTEL-001')
  await dialog.getByPlaceholder('请输入accessKeyId').fill('ak-live-001')
  await dialog.getByPlaceholder('请输入设备处理业务公钥').fill('PUBLIC-KEY-001')
  await dialog.getByPlaceholder('请输入设备处理业务私钥').fill('PRIVATE-KEY-001')
  await dialog.getByPlaceholder('请输入登记人姓名').fill('张三')
  await dialog.getByPlaceholder('请输入登记人证件号码').fill('440301199001011234')

  await dialog.getByRole('button', { name: '确 定' }).click()
}

test.describe.configure({ timeout: 60_000 })

test('/psb/list keeps the captured empty shell and exposes service diagnostics', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await gotoPsbPage(page, '/psb/list')

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('.psb-page')).toHaveAttribute('data-provider', 'mock')
  await expect(page.locator('.psb-page')).toHaveAttribute('data-empty', 'true')
  await expect(page.locator(".topnav-link.is-active[href='/smartHotel/smartHome']")).toBeVisible()
  await expect(page.locator(".sidebar-link.is-active[href='/psb/list']")).toBeVisible()
  await expect(page.getByRole('heading', { name: 'PSB公安对接', level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name: '公安登记' })).toBeVisible()
  await expect(page.getByText('入住客人登记的信息同步到当地合法监管部门')).toBeVisible()
  await expect(page.getByText('上报日志')).toBeVisible()
  await expect(page.getByRole('status', { name: 'PSB公安对接操作反馈' })).toContainText(
    '公安登记数据已加载',
  )

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

  const diagnostics = page.getByLabel('PSB公安对接数据服务')
  await expect(diagnostics).toContainText('provider: mock')
  await expect(diagnostics).toContainText('/account/roomPoliceSubmission/page/get')
  await expect(diagnostics).toContainText('/select/poi/page/get')
  await expect(diagnostics).toContainText('/roomCategories/page/get')
  await expect(page.locator('.chat-dock')).toContainText('全部会话')
})

test('/psb/list validates required fields and resets the add dialog on cancel', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await gotoPsbPage(page, '/psb/list')

  await page.getByRole('button', { name: '新 增' }).click()

  const dialog = page.getByRole('dialog', { name: '新增' })
  await expect(dialog).toBeVisible()

  await dialog.getByRole('button', { name: '确 定' }).click()
  await expect(dialog.getByText('商户名称不能为空')).toBeVisible()
  await expect(dialog.locator('.psb-form-error', { hasText: '请选择门店' })).toBeVisible()
  await expect(dialog.getByText('旅业编码不能为空')).toBeVisible()

  await dialog.getByPlaceholder('请输入商户名称').fill('待清理商户')
  await dialog.getByRole('button', { name: '取 消' }).click()
  await expect(dialog).toBeHidden()

  await page.getByRole('button', { name: '新 增' }).click()
  const reopenedDialog = page.getByRole('dialog', { name: '新增' })
  await expect(reopenedDialog.getByPlaceholder('请输入商户名称')).toHaveValue('')
  await expect(reopenedDialog.getByText('商户名称不能为空')).toHaveCount(0)
})

test('/psb/list supports store selection and successful submit feedback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await gotoPsbPage(page, '/psb/list?mockState=success')

  await submitValidPsbMerchant(page)

  await expect(page.getByRole('status', { name: 'PSB公安对接操作反馈' })).toContainText(
    'PSB公安对接商户已新增',
  )
  await expect(page.getByRole('dialog', { name: '新增' })).toBeHidden()
  await expect(page.locator('.psb-page')).toHaveAttribute('data-empty', 'false')
  await expect(page.getByRole('cell', { name: '天落会宿公寓前海店' })).toBeVisible()
  await expect(page.getByRole('cell', { name: '天落会宿公寓(前海壹方城宝安中心店)' })).toBeVisible()
  await expect(page.getByRole('cell', { name: '4' })).toBeVisible()
})

test('/psb/list opens details and requires delete confirmation for success rows', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await gotoPsbPage(page, '/psb/list?mockState=success')

  await submitValidPsbMerchant(page)

  const row = page.locator('.psb-table__row', { hasText: '天落会宿公寓前海店' })
  await row.getByRole('button', { name: '查看' }).click()
  await expect(page.getByRole('dialog', { name: '公安登记详情' })).toBeVisible()
  await page.getByRole('button', { name: '关闭详情' }).click()
  await expect(page.getByRole('dialog', { name: '公安登记详情' })).toBeHidden()

  await row.getByRole('button', { name: '删除' }).click()
  const confirmDialog = page.getByRole('dialog', { name: '删除确认' })
  await expect(confirmDialog).toBeVisible()
  await expect(confirmDialog.getByText('确认删除当前 PSB 公安对接商户吗？')).toBeVisible()

  await confirmDialog.getByRole('button', { name: '取 消' }).click()
  await expect(confirmDialog).toBeHidden()
  await expect(page.getByRole('cell', { name: '天落会宿公寓前海店' })).toBeVisible()

  await row.getByRole('button', { name: '删除' }).click()
  await page.getByRole('dialog', { name: '删除确认' }).getByRole('button', { name: '确 定' }).click()
  await expect(page.getByRole('cell', { name: '天落会宿公寓前海店' })).toHaveCount(0)
  await expect(page.getByRole('status', { name: 'PSB公安对接操作反馈' })).toContainText(
    'PSB公安对接商户已删除',
  )
})

test('/psb/list exposes a retryable error state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await gotoPsbPage(page, '/psb/list?mockState=error')

  const alert = page.getByRole('alert', { name: 'PSB公安对接加载失败' })
  await expect(alert).toContainText('PSB公安对接列表加载失败，请稍后重试')
  await page.getByRole('button', { name: '重新加载' }).click()
  await expect(page).toHaveURL(/\/psb\/list$/)
  await expect(page.locator('.psb-page')).toHaveAttribute('data-empty', 'true')
  await expect(page.getByRole('heading', { name: '公安登记' })).toBeVisible()
})
