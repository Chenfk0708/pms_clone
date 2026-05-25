import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL
const pagePath = '/setting/balanceAndTemplate'

function appUrl(routePath: string) {
  const hashPath = `/#${routePath}`
  return appBaseURL ? `${appBaseURL}${hashPath}` : hashPath
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.smsSetting.provider', 'mock')
    window.localStorage.removeItem('pms.smsSetting.mockState')
  })
})

test('/setting/balanceAndTemplate 保持在设置体系内并渲染目标页结构', async ({ page }) => {
  await page.goto(appUrl(pagePath), { waitUntil: 'domcontentloaded' })

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '短信设置' })).toHaveClass(/is-active/)

  const root = page.locator('.sms-setting-page')
  await expect(root).toHaveAttribute('data-provider', 'mock')
  await expect(root).toHaveAttribute('data-state', 'success')

  const contract = page.locator('#sms-setting-service-contract')
  await expect(contract).toHaveAttribute('data-provider', 'mock')
  await expect(contract).toHaveAttribute('data-state', 'success')
  await expect(contract).toHaveAttribute('data-trace-id', /mock-shezhi--tongyong-shezhi--duanxin-shezhi-success-001/)
  await expect(contract).toHaveAttribute('data-request', /smsAccount\/get/)
  await expect(contract).toHaveAttribute('data-request', /smsTemplateMsgConfig\/page\/get/)

  const overview = page.getByTestId('sms-setting-overview')
  await expect(overview).toContainText('剩余短信：')
  await expect(overview).toContainText('50')
  await expect(overview).toContainText('启用短信推送模版后，系统将在预设条件下自动向客人发送短信通知')
  await expect(page.getByRole('button', { name: '充值', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '充值记录' })).toBeVisible()

  const channelRow = page.getByTestId('sms-channel-row')
  await expect(channelRow).toContainText('启用渠道:')
  await expect(channelRow.locator('.sms-setting-channel-badge')).toHaveCount(12)
  await expect(channelRow.locator('.sms-setting-channel-badge.is-active')).toHaveCount(1)

  const signRow = page.getByTestId('sms-sign-row')
  await expect(signRow).toContainText('签名:')
  await expect(signRow).toContainText('【路客云】')

  const sections = page.locator('.sms-section-card')
  await expect(sections).toHaveCount(6)
  await expect(page.getByRole('heading', { name: '订单状态通知' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '长租订单费用提醒' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '商城订单提醒' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '自助入住短信' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '门锁密码通知' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '其他短信通知' })).toBeVisible()
  await expect(page.getByText('智住发送入住登记短信(微信公众号)')).toBeVisible()
  await expect(page.getByText('门锁临时密码超时提示')).toBeVisible()

  const rawText = await contract.textContent()
  const parsed = rawText ? JSON.parse(rawText) : null
  expect(parsed).toMatchObject({
    provider: 'mock',
    state: 'success',
    requestBody: {
      campId: '1796067693589061634',
    },
  })
  expect(parsed.requestBody.endpoints).toEqual(
    expect.arrayContaining([
      '/smsAccount/get',
      '/smsTemplateMsgConfig/channel/get',
      '/smsTemplateMsgConfig/signName/get',
      '/smsTemplateMsgConfig/page/get',
    ]),
  )
})

test('/setting/balanceAndTemplate 支持充值、充值记录、渠道切换、签名查看、模板弹窗和去设置跳转', async ({ page }) => {
  await page.goto(appUrl(pagePath), { waitUntil: 'domcontentloaded' })

  await page.getByRole('button', { name: '充值', exact: true }).click()
  const rechargeDialog = page.getByRole('dialog', { name: '短信充值' })
  await expect(rechargeDialog).toBeVisible()
  await expect(rechargeDialog.getByRole('button', { name: '100条', exact: true })).toBeVisible()
  await expect(rechargeDialog.getByRole('button', { name: '5000条', exact: true })).toBeVisible()
  await rechargeDialog.getByRole('button', { name: '5000条', exact: true }).click()
  await expect(page.getByRole('status', { name: '短信设置操作反馈' })).toContainText('已选择 5000条短信套餐')
  await rechargeDialog.getByRole('button', { name: '取消' }).click()
  await expect(rechargeDialog).toHaveCount(0)

  await page.getByRole('button', { name: '充值记录' }).click()
  const rechargeRecordDialog = page.getByRole('dialog', { name: '短信充值记录' })
  await expect(rechargeRecordDialog).toContainText('最近充值记录')
  await expect(rechargeRecordDialog).toContainText('2026-05-18')
  await rechargeRecordDialog.getByRole('button', { name: '关闭充值记录' }).click()
  await expect(rechargeRecordDialog).toHaveCount(0)

  await page.getByTestId('sms-channel-row').getByRole('button', { name: '修改' }).click()
  const channelDialog = page.getByRole('dialog', { name: '启用渠道' })
  await expect(channelDialog).toContainText('阿里云短信')
  await expect(channelDialog).toContainText('腾讯云短信')
  await channelDialog.getByRole('radio', { name: '腾讯云短信' }).check()
  await channelDialog.getByRole('button', { name: '保存渠道设置' }).click()
  await expect(page.getByRole('status', { name: '短信设置操作反馈' })).toContainText('启用渠道已切换为 腾讯云短信')

  await page.getByTestId('sms-sign-row').getByRole('button', { name: '修改' }).click()
  const signDialog = page.getByRole('dialog', { name: '短信签名' })
  await expect(signDialog).toContainText('【路客云】')
  await signDialog.getByRole('button', { name: '关闭签名说明' }).click()
  await expect(signDialog).toHaveCount(0)

  await page.getByRole('button', { name: '编辑预订提醒' }).click()
  const templateDialog = page.getByRole('dialog', { name: '预订提醒模板' })
  await expect(templateDialog).toContainText('【路客云】预订成功')
  await templateDialog.getByRole('button', { name: '关闭', exact: true }).click()
  await expect(templateDialog).toHaveCount(0)

  const reminderSwitch = page.getByRole('switch', { name: '预订提醒开关' })
  await expect(reminderSwitch).toHaveAttribute('aria-checked', 'true')
  await reminderSwitch.click()
  await expect(reminderSwitch).toHaveAttribute('aria-checked', 'false')

  await page.getByRole('button', { name: '去设置' }).click()
  await expect(page).toHaveURL(/\/smartHotel\/smartHome$/)
})

test('/setting/balanceAndTemplate 暴露空态和错误态，不隐藏服务状态', async ({ page }) => {
  await page.goto(appUrl(`${pagePath}?mockState=empty`), { waitUntil: 'domcontentloaded' })
  await expect(page.locator('#sms-setting-service-contract')).toHaveAttribute('data-state', 'empty')
  await expect(page.locator('.sms-setting-page')).toHaveAttribute('data-state', 'empty')
  await expect(page.getByLabel('短信设置空状态')).toContainText('当前暂无短信模板配置')
  await expect(page.getByRole('button', { name: '前往自助入住设置' })).toBeVisible()

  await page.goto(appUrl(`${pagePath}?mockState=error`), { waitUntil: 'domcontentloaded' })
  await expect(page.locator('#sms-setting-service-contract')).toHaveAttribute('data-state', 'error')
  await expect(page.locator('.sms-setting-page')).toHaveAttribute('data-state', 'error')
  await expect(page.getByRole('alert', { name: '短信设置数据错误' })).toContainText('短信设置数据加载失败，请稍后重试')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
})
