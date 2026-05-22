import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL
const uploadFixturePath = fileURLToPath(new URL('./fixtures/guide-upload.svg', import.meta.url))

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/smartHotel/checkInGuide 加载规则页并支持弹层与跳转', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/checkInGuide'))

  const diagnostics = page.locator('#smart-hotel-global-setting-diagnostics')
  await expect(diagnostics).toHaveAttribute('data-provider', 'mock')
  await expect(diagnostics).toHaveAttribute('data-state', 'success')
  await expect(diagnostics).toHaveAttribute('data-request', /1796067693589061634/)

  await expect(page.getByRole('tab', { name: '入住规则' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('heading', { name: '门锁密码有效时间' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '入住身份认证与登记' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '短信与押金设置' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '场景流程' })).toBeVisible()
  await expect(page.locator('.smart-global-footer button')).toBeDisabled()

  await page.getByRole('button', { name: '充值' }).click()
  const identityDialog = page.getByRole('dialog', { name: '认证与短信余额详情' })
  await expect(identityDialog).toBeVisible()
  await expect(identityDialog.getByText('实名认证剩余 5 次', { exact: true })).toBeVisible()
  await expect(identityDialog.getByText('短信剩余 50 条', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '关闭认证与短信余额详情' }).click()

  await page.getByRole('button', { name: '查看短信模板' }).click()
  const smsDialog = page.getByRole('dialog', { name: '短信发送模板' })
  await expect(smsDialog).toBeVisible()
  await expect(smsDialog.getByText('获得密码（智能入住）')).toBeVisible()
  await expect(smsDialog.locator('.smart-global-template-list article')).toHaveCount(3)
  await page.getByRole('button', { name: '关闭短信发送模板' }).click()

  await page.getByRole('button', { name: '查看支付方式' }).click()
  const paymentDialog = page.getByRole('dialog', { name: '押金与收款方式' })
  await expect(paymentDialog).toBeVisible()
  await expect(paymentDialog.getByText('微信', { exact: true })).toBeVisible()
  await expect(paymentDialog.getByText('支付宝', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '关闭押金与收款方式' }).click()

  await page.getByRole('button', { name: '前往房型信息' }).click()
  await expect(page).toHaveURL(/\/setting\/roomTypeInfo$/)

  await page.goto(appUrl('/smartHotel/checkInGuide'))
  await page.getByRole('button', { name: '编辑短信内容' }).first().click()
  await expect(page).toHaveURL(/\/setting\/balanceAndTemplate$/)
})

test('/smartHotel/checkInGuide 的入住指引规则默认未选中，勾选后短暂提示保存成功', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/checkInGuide'))

  await page.getByRole('tab', { name: '入住指引' }).click()

  const identityCheckbox = page.getByRole('checkbox', { name: '完成身份登记要求' })
  const depositCheckbox = page.getByRole('checkbox', { name: '完成押金要求' })

  await expect(identityCheckbox).not.toBeChecked()
  await expect(depositCheckbox).not.toBeChecked()

  await identityCheckbox.check()
  await expect(identityCheckbox).toBeChecked()
  const saveToast = page.getByRole('status', { name: '保存成功提示' })
  await expect(saveToast).toContainText('保存成功')
  await expect(saveToast).toHaveCount(0, { timeout: 2500 })
})

test('/smartHotel/checkInGuide 的新增入住指引弹窗支持滚动、输入和上传图片', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/checkInGuide'))

  await page.getByRole('tab', { name: '入住指引' }).click()
  await page.getByRole('button', { name: '新增入住指引' }).click()

  const dialog = page.getByRole('dialog', { name: '新增入住指引' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByLabel('入住指引名称')).toBeVisible()
  await expect(dialog.getByLabel('到达房源路线')).toBeVisible()
  await expect(dialog.getByLabel('入住流程说明')).toBeVisible()
  await expect(dialog.getByLabel('入住须知')).toBeVisible()

  const scrollable = page.getByTestId('guide-create-scrollable')
  await expect(scrollable).toBeVisible()
  await expect(scrollable).toHaveJSProperty('scrollTop', 0)

  await dialog.getByLabel('入住指引名称').fill('A栋入住指引')
  await dialog.getByLabel('到达房源路线').fill('从地铁站B口步行200米到小区北门')
  await dialog.getByLabel('入住流程说明').fill('到达房门后输入门锁密码并推门入住')
  await dialog.getByLabel('入住须知').fill('禁止黄赌毒，不可举办聚会，不可商业拍摄')

  await dialog.locator('input[type="file"]').nth(0).setInputFiles(uploadFixturePath)
  await dialog.locator('input[type="file"]').nth(1).setInputFiles(uploadFixturePath)
  await dialog.locator('input[type="file"]').nth(2).setInputFiles(uploadFixturePath)
  await expect(dialog.getByText('guide-upload.svg')).toHaveCount(3)

  await scrollable.evaluate((node) => {
    node.scrollTop = node.scrollHeight
    node.dispatchEvent(new Event('scroll'))
  })
  await expect(dialog.getByText('3.入住须知')).toBeVisible()

  await dialog.getByRole('button', { name: '确定' }).evaluate((element: HTMLButtonElement) => element.click())
  await expect(page.getByRole('dialog', { name: '新增入住指引' })).toHaveCount(0)
  await expect(page.getByRole('status', { name: '保存成功提示' })).toContainText('保存成功')
})

test('/smartHotel/checkInGuide 的 WIFI 页支持开关、新增弹窗和表单交互', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/checkInGuide'))

  await page.getByRole('tab', { name: 'WIFI上网' }).click()

  const wifiSwitch = page.getByRole('button', { name: '开启WIFI' })
  await expect(wifiSwitch).toHaveAttribute('aria-pressed', 'false')
  await wifiSwitch.click()
  await expect(wifiSwitch).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('status', { name: '保存成功提示' })).toContainText('保存成功')

  await page.getByRole('button', { name: '新增WIFI' }).click()
  const dialog = page.getByRole('dialog', { name: '新增WIFI' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByLabel('WIFI名称')).toBeVisible()
  await expect(dialog.getByLabel('WIFI密码')).toBeVisible()

  await dialog.getByLabel('WIFI名称').fill('Locals Guest')
  await dialog.getByLabel('WIFI密码').fill('locals8888')
  await dialog.getByRole('button', { name: '确定' }).evaluate((element: HTMLButtonElement) => element.click())
  await expect(page.getByRole('dialog', { name: '新增WIFI' })).toHaveCount(0)
  await expect(page.getByRole('status', { name: '保存成功提示' })).toContainText('保存成功')
})

test('/smartHotel/checkInGuide 的入住指引和 WIFI 上网页签对齐目标结构', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/checkInGuide'))

  await page.getByRole('tab', { name: '入住指引' }).click()
  await expect(page.getByRole('tab', { name: '入住指引' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('heading', { name: '入住指引查看规则' })).toBeVisible()
  await expect(page.getByText('完成身份登记要求')).toBeVisible()
  await expect(page.getByText('完成押金要求')).toBeVisible()
  await expect(page.getByRole('button', { name: '新增入住指引' })).toBeVisible()
  await expect(page.getByPlaceholder('请输入入住指引名称/房型名称')).toBeVisible()
  await expect(page.getByRole('columnheader', { name: '入住指引名称' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: '应用房型' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: '操作' })).toBeVisible()
  await expect(page.getByRole('button', { name: '编辑短信内容' })).toHaveCount(0)

  const guideSearch = page.getByLabel('入住指引搜索')
  await guideSearch.fill('豪华大床房')
  await page.getByRole('button', { name: '重置' }).first().click()
  await expect(guideSearch).toHaveValue('')

  await page.getByRole('button', { name: '前往智住小程序' }).click()
  await expect(page).toHaveURL(/\/smartHotel\/smartSettings$/)

  await page.goto(appUrl('/smartHotel/checkInGuide'))
  await page.getByRole('tab', { name: 'WIFI上网' }).click()
  await expect(page.getByRole('heading', { name: 'WIFI查看规则' })).toBeVisible()
  await expect(page.getByText('开启WIFI：')).toBeVisible()
  await expect(page.getByText('不限制')).toBeVisible()
  await expect(page.getByRole('button', { name: '新增WIFI' })).toBeVisible()
  const wifiSearch = page.getByLabel('WIFI搜索')
  await wifiSearch.fill('guest')
  await page.getByRole('button', { name: '重置' }).first().click()
  await expect(wifiSearch).toHaveValue('')
  await expect(page.getByRole('columnheader', { name: 'WIFI名称' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'WIFI密码' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: '应用房间' })).toBeVisible()
})

test('/smartHotel/checkInGuide 暴露空态和错误态', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(appUrl('/smartHotel/checkInGuide?mockState=empty'))
  await expect(page.locator('#smart-hotel-global-setting-diagnostics')).toHaveAttribute('data-state', 'empty')
  await expect(page.getByText('当前门店暂未同步可配置房型', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '前往房型信息' })).toBeVisible()

  await page.goto(appUrl('/smartHotel/checkInGuide?mockState=error'))
  await expect(page.locator('#smart-hotel-global-setting-diagnostics')).toHaveAttribute('data-state', 'error')
  await expect(page.getByRole('alert')).toContainText('全局设置数据加载失败')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
})
