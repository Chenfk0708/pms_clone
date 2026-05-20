import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

async function collapseChatDock(page: import('@playwright/test').Page) {
  const collapseButton = page.locator('aside[aria-label="全部会话"] button[aria-label="收起会话"]').first()
  if (await collapseButton.count()) {
    await collapseButton.click()
  }
}

async function openPrintSetting(
  page: import('@playwright/test').Page,
  options: {
    mockState?: 'success' | 'empty' | 'error'
    mutationState?: 'success' | 'error'
  } = {},
) {
  const { mockState = 'success', mutationState = 'success' } = options

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(
    ({ runtimeMockState, runtimeMutationState }) => {
      window.localStorage.setItem('pms.printSettingProvider', 'mock')
      window.localStorage.setItem('pms.printSettingMockState', runtimeMockState)
      window.localStorage.setItem('pms.printSettingMutationState', runtimeMutationState)
    },
    { runtimeMockState: mockState, runtimeMutationState: mutationState },
  )
  await page.goto(appUrl('/setting/print'))
  await collapseChatDock(page)
}

function contractNode(page: import('@playwright/test').Page) {
  return page.getByTestId('print-setting-service-contract')
}

function feedbackBar(page: import('@playwright/test').Page) {
  return page.getByLabel('打印设置操作反馈')
}

test('/setting/print loads through the provider contract and supports stay print save flow', async ({ page }) => {
  await openPrintSetting(page)

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('.topnav').getByRole('link', { name: '设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '打印设置' })).toHaveClass(/is-active/)

  const contract = contractNode(page)
  await expect(contract).toHaveAttribute('data-provider', 'mock', { timeout: 15_000 })
  await expect(contract).toHaveAttribute('data-response-state', 'success')
  await expect(contract).toHaveAttribute('data-endpoint', '/setting/print/bootstrap')

  const stayPanel = page.getByLabel('住宿打印设置')
  await expect(stayPanel.getByRole('heading', { name: '住宿打印' })).toBeVisible()
  await expect(stayPanel.getByLabel('小票（80mm）')).toBeChecked()
  await stayPanel.getByRole('button', { name: '选择住宿打印单据' }).click()
  await expect(page.getByRole('listbox', { name: '住宿打印单据选项' }).getByRole('option')).toHaveText([
    '消费明细账单（短租）',
    '住宿登记账单（短租）',
    '消费明细账单（长租）',
  ])

  await page.getByRole('option', { name: '住宿登记账单（短租）' }).click()
  await stayPanel.getByLabel('自定义提示文案').fill('请先核对住宿押金，退房前完成签字确认。')
  await stayPanel.getByRole('button', { name: '保存住宿打印配置' }).click()

  await expect(feedbackBar(page)).toContainText('住宿打印配置已保存')
  await expect(contract).toHaveAttribute('data-endpoint', '/setting/print/save')
  await expect(contract).toContainText('"section":"stay"')
  await expect(contract).toContainText('"selectedDocument":"stay-register-short"')
})

test('/setting/print supports receipt paper changes and save feedback', async ({ page }) => {
  await openPrintSetting(page)

  const receiptPanel = page.getByLabel('收款账单设置')
  await expect(receiptPanel.getByLabel('A4')).toBeChecked()
  await receiptPanel.getByLabel('小票（58mm）').check()
  await receiptPanel.getByLabel('自定义提示文案').fill('收款完成后请保留凭证，感谢您的配合。')
  await receiptPanel.getByRole('button', { name: '保存收款账单配置' }).click()

  await expect(feedbackBar(page)).toContainText('收款账单配置已保存')
  await expect(contractNode(page)).toContainText('"section":"receipt"')
  await expect(contractNode(page)).toContainText('"paperType":"58mm"')
})

test('/setting/print renders a business empty state and can apply default templates', async ({ page }) => {
  await openPrintSetting(page, { mockState: 'empty' })

  await expect(contractNode(page)).toHaveAttribute('data-response-state', 'empty', { timeout: 15_000 })
  await expect(page.getByLabel('打印设置空状态')).toContainText('当前还没有可用的打印模板配置')
  await page.getByRole('button', { name: '应用默认模板' }).click()

  await expect(contractNode(page)).toHaveAttribute('data-response-state', 'success')
  await expect(page.getByLabel('住宿打印设置')).toBeVisible()
  await expect(feedbackBar(page)).toContainText('已恢复默认打印模板')
})

test('/setting/print exposes a clear error state and can retry the same contract', async ({ page }) => {
  await openPrintSetting(page, { mockState: 'error' })

  await expect(contractNode(page)).toHaveAttribute('data-response-state', 'error', { timeout: 15_000 })
  await expect(page.getByRole('alert', { name: '打印设置错误状态' })).toContainText('打印设置加载失败，请稍后重试')

  await page.evaluate(() => {
    window.localStorage.setItem('pms.printSettingMockState', 'success')
  })
  await page.getByRole('button', { name: '重新加载打印设置' }).click()

  await expect(contractNode(page)).toHaveAttribute('data-response-state', 'success')
  await expect(page.getByLabel('收款账单设置')).toBeVisible()
  await expect(feedbackBar(page)).toContainText('打印设置已更新')
})
