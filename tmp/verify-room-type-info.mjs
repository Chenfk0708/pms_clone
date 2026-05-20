import path from 'node:path'
import { spawn } from 'node:child_process'
import { chromium, expect } from '@playwright/test'

const baseUrl = process.env.PMS_TEST_BASE_URL

if (!baseUrl) {
  throw new Error('PMS_TEST_BASE_URL is required')
}

const chromePath =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForCdpEndpoint(port, chromeProcess) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`)
      if (!response.ok) throw new Error(`status=${response.status}`)
      const payload = await response.json()
      if (payload.webSocketDebuggerUrl) return payload.webSocketDebuggerUrl
    } catch {
      await wait(500)
    }
  }

  chromeProcess.kill('SIGKILL')
  throw new Error(`CDP endpoint not ready on port ${port}`)
}

async function launchPage() {
  const port = 9600 + Math.floor(Math.random() * 200)
  const userDataDir = path.resolve('.tmp', `verify-room-type-info-${Date.now()}-${port}`)
  const chromeProcess = spawn(
    chromePath,
    [
      `--remote-debugging-port=${port}`,
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--lang=zh-CN',
      `--user-data-dir=${userDataDir}`,
      'about:blank',
    ],
    { stdio: ['ignore', 'ignore', 'ignore'] },
  )

  const wsEndpoint = await waitForCdpEndpoint(port, chromeProcess)
  const browser = await chromium.connectOverCDP(wsEndpoint)
  const context = browser.contexts()[0]
  const page = await context.newPage()
  await page.setViewportSize({ width: 1440, height: 900 })

  return { browser, context, page, chromeProcess }
}

async function verifyDefault(page) {
  await page.goto(`${baseUrl}/setting/roomTypeInfo`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await expect(page.getByTestId('room-type-info-contract')).toHaveAttribute('data-provider', 'mock')
  await expect(page.getByTestId('room-type-info-contract')).toHaveAttribute('data-endpoint', /roomCategories\/page\/get/)
  await expect(page.getByTestId('room-type-info-row')).toHaveCount(4)

  await page.getByPlaceholder('请输入房型名称').fill('观影')
  await page.getByRole('button', { name: '查 询' }).click()
  await expect(page.getByTestId('room-type-info-row')).toHaveCount(1)
  await expect(page.getByTestId('room-type-info-row').first()).toContainText('观影大床房')

  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByTestId('room-type-info-row')).toHaveCount(4)

  await page.getByRole('button', { name: '标签管理' }).click()
  await expect(page.getByRole('dialog', { name: '标签管理' })).toContainText('电竞')
  await page.getByRole('dialog', { name: '标签管理' }).getByRole('button', { name: '关闭' }).click()

  await page.getByRole('button', { name: '楼层管理' }).click()
  await expect(page.getByRole('dialog', { name: '楼层管理' })).toContainText('顶层露台')
  await page.getByRole('dialog', { name: '楼层管理' }).getByRole('button', { name: '关闭' }).click()
}

async function verifyRowInteractions(page) {
  await page.goto(`${baseUrl}/setting/roomTypeInfo`, { waitUntil: 'domcontentloaded', timeout: 45_000 })

  await page.getByRole('button', { name: '添加房型' }).click()
  await expect(page).toHaveURL(/\/setting\/roomTypeInfo\/edit/)
  await expect(page.getByRole('heading', { name: '新增房型' })).toBeVisible()
  await expect(page.getByLabel('房型名称')).toHaveValue('')

  await page.goto(`${baseUrl}/setting/roomTypeInfo`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await page.getByTestId('room-type-info-row').first().getByRole('button', { name: '详情' }).click()
  await expect(page.getByRole('heading', { name: '详细信息' })).toBeVisible()
  await expect(page.getByLabel('房型名称')).toHaveValue('顶层套房（浴缸巨幕电竞麻将）')

  await page.goto(`${baseUrl}/setting/roomTypeInfo`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await page.getByTestId('room-type-info-row').first().getByRole('button', { name: '房间' }).click()
  await expect(page.getByRole('dialog', { name: '房间列表' })).toContainText('未绑定')
  await page.getByRole('dialog', { name: '房间列表' }).getByRole('button', { name: '关闭' }).click()

  await page.getByTestId('room-type-info-row').first().getByRole('button', { name: '联动关房' }).click()
  const linkageDialog = page.getByRole('dialog', { name: '联动关房' })
  await linkageDialog.getByRole('checkbox', { name: '总裁套间（桑拿浴缸露台电竞麻将）' }).check()
  await linkageDialog.getByRole('button', { name: '确 定' }).click()
  await expect(page.getByRole('status')).toContainText('联动关房已更新')

  await page.getByTestId('room-type-info-row').first().getByRole('button', { name: '删除' }).click()
  const deleteDialog = page.getByRole('dialog', { name: '确认删除房型' })
  await expect(deleteDialog).toContainText('删除房型后将无法恢复')
  await deleteDialog.getByRole('button', { name: '删 除' }).click()
  await expect(page.getByTestId('room-type-info-row')).toHaveCount(3)
  await expect(page.getByRole('status')).toContainText('房型已删除')
}

async function verifyStates(page) {
  await page.goto(`${baseUrl}/setting/roomTypeInfo?roomTypeInfoMockState=empty`, {
    waitUntil: 'domcontentloaded',
    timeout: 45_000,
  })
  await expect(page.getByText('暂无房型数据')).toBeVisible()

  await page.goto(`${baseUrl}/setting/roomTypeInfo?roomTypeInfoMockState=error`, {
    waitUntil: 'domcontentloaded',
    timeout: 45_000,
  })
  const errorPanel = page.locator('.room-type-info-state')
  await expect(errorPanel).toContainText('房型信息加载失败')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
}

const { browser, page, chromeProcess } = await launchPage()

try {
  await verifyDefault(page)
  await verifyRowInteractions(page)
  await verifyStates(page)
  console.log('room-type-info verification passed')
} finally {
  await browser.close()
  chromeProcess.kill('SIGKILL')
}
