import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/smartHotel/checkInGuide matches captured global settings rules surface', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/checkInGuide'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '智慧酒店' })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '全局设置' })).toHaveClass(/is-active/)

  await expect(page.getByText('智住管理')).toBeVisible()
  await expect(page.getByRole('link', { name: '自助入住' })).toBeVisible()
  await expect(page.getByRole('link', { name: '智住小程序' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '智能硬件' })).toBeVisible()
  await page.locator('.sidebar').getByRole('button', { name: '智能硬件' }).click()
  await expect(page.getByRole('link', { name: '智能硬件商城' })).toBeVisible()
  await expect(page.getByRole('link', { name: '智能门锁' })).toBeVisible()
  await expect(page.getByRole('link', { name: '身份证读卡器' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '公安对接' })).toBeVisible()
  await page.locator('.sidebar').getByRole('button', { name: '公安对接' }).click()
  await expect(page.getByRole('link', { name: 'PSB公安对接' })).toBeVisible()
  await expect(page.getByRole('link', { name: '上报日志' })).toBeVisible()

  await expect(page.getByRole('tab', { name: '入住规则' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tab', { name: '入住指引' })).toHaveAttribute('aria-selected', 'false')
  await expect(page.getByRole('tab', { name: 'WIFI上网' })).toHaveAttribute('aria-selected', 'false')
  await expect(page.getByText('云端入住登记模式为「仅发送门锁密码」，该模式下无需配置。')).toBeVisible()

  const sectionNames = ['入住登记方式', '身份验证方式', '押金', '入住状态', '门锁密码']
  for (const name of sectionNames) {
    await expect(page.getByRole('heading', { name })).toBeVisible()
  }

  await expect(page.getByText('自动发送入住邀请')).toBeVisible()
  await expect(page.getByText('公安系统实名认证', { exact: true })).toBeVisible()
  await expect(page.getByText('剩余核验次数:')).toBeVisible()
  await expect(page.getByText('登记要求:')).toBeVisible()
  await expect(page.getByText('至少登记1人')).toBeVisible()
  await expect(page.getByText('房客变更入住状态')).toBeVisible()
  await expect(page.getByText('所有房源统一密码有效时间')).toBeVisible()
  await expect(page.getByText('短信发送密码')).toBeVisible()
  await expect(page.getByText('短信示例: 您入住的房间{房源名称}${房间号}，门锁密码:{密码}#')).toBeVisible()

  await expect(page.getByRole('heading', { name: '房客入住流程' })).toBeVisible()
  await expect(page.getByText('步骤1')).toBeVisible()
  await expect(page.getByText('进入智住小程序')).toBeVisible()
  await expect(page.getByText('步骤2')).toBeVisible()
  await expect(page.getByText('办理登记')).toBeVisible()
  await expect(page.getByText('步骤3')).toBeVisible()
  await expect(page.getByText('查看门锁密码')).toBeVisible()
  await expect(page.getByText('步骤4(可选)')).toBeVisible()
  await expect(page.getByText('在线续住')).toBeVisible()
  await expect(page.getByRole('button', { name: '保 存' })).toBeVisible()
})

test('/smartHotel/checkInGuide supports captured tabs, switches, save, and chat collapse', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/checkInGuide'))

  const inviteSwitch = page.getByRole('switch', { name: '自动发送入住邀请' })
  await expect(inviteSwitch).toHaveAttribute('aria-checked', 'false')
  await inviteSwitch.click()
  await expect(inviteSwitch).toHaveAttribute('aria-checked', 'true')

  await page.getByRole('tab', { name: '入住指引' }).click()
  await expect(page.getByRole('tab', { name: '入住指引' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('heading', { name: '入住指引' })).toBeVisible()
  await expect(page.getByText('入住须知')).toBeVisible()

  await page.getByRole('tab', { name: 'WIFI上网' }).click()
  await expect(page.getByRole('tab', { name: 'WIFI上网' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('heading', { name: 'WIFI上网' })).toBeVisible()
  await expect(page.getByLabel('WIFI名称')).toHaveValue('Locals-Guest')
  await expect(page.getByLabel('WIFI密码')).toHaveValue('locals8888')

  await page.getByRole('button', { name: '保 存' }).click()
  await expect(page.getByText('已保存全局设置')).toBeVisible()

  await expect(page.locator('.chat-dock')).toContainText('全部会话')
  await page.locator('.chat-dock__collapse').click()
  await expect(page.locator('.chat-dock')).toHaveCount(0)
})
