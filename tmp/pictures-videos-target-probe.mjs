import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const TARGET_URL = 'https://minsubao.localhome.cn/setting/picturesAndVideos'
const STORAGE_STATE = path.resolve('playwright/.auth/pms-user.json')
const CHROME_PATH = 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'
const OUT_FILE = path.resolve('artifacts/interaction-matrix/shezhi--xinxi-weihu--tupian-shipin/target-probe.json')

async function ensureOutputDir() {
  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true })
}

async function main() {
  await ensureOutputDir()

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  })

  const context = await browser.newContext({
    storageState: STORAGE_STATE,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
  })

  const page = await context.newPage()
  const mediasRequests = []

  page.on('response', async (response) => {
    if (!response.url().includes('/medias/page/get')) return
    const request = response.request()
    let requestBody = null
    let responseJson = null

    try {
      requestBody = request.postDataJSON?.() ?? request.postData() ?? null
    } catch {
      requestBody = request.postData() ?? null
    }

    try {
      responseJson = await response.json()
    } catch {
      responseJson = null
    }

    mediasRequests.push({
      url: response.url(),
      status: response.status(),
      requestBody,
      responseJson,
    })
  })

  await page.goto(TARGET_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 45_000,
  })
  await page.waitForTimeout(5_000)

  const root = page.locator('.picturesAndVideos___29fVd')
  const radioButtons = root.locator('.ant-radio-button-wrapper')
  const actionButtons = root.locator('.buttonGroup___2wtxP .ant-btn')
  const searchInput = root.locator('.searchBox___2nQ0u input.ant-input').first()

  const results = []

  results.push({
    action: 'default',
    tabs: await radioButtons.allTextContents(),
    selectedTab: await root.locator('.ant-radio-button-wrapper-checked').textContent(),
    totalText: await root.locator('.ant-pagination-total-text').textContent(),
    searchVisible: await searchInput.isVisible(),
    requestBody: mediasRequests.at(-1)?.requestBody ?? null,
  })

  await searchInput.fill('bed')
  await root.locator('.ant-input-search-button').click()
  await page.waitForTimeout(2_000)

  results.push({
    action: 'search-image-tab',
    requestBody: mediasRequests.at(-1)?.requestBody ?? null,
    totalText: await root.locator('.ant-pagination-total-text').textContent(),
  })

  await actionButtons.nth(0).click()
  await page.waitForTimeout(1_000)
  const uploadDialog = page.locator('.ant-modal-wrap:visible .ant-modal-content').first()
  results.push({
    action: 'upload-dialog',
    dialogVisible: await uploadDialog.isVisible().catch(() => false),
    dialogTitle: await uploadDialog.locator('.ant-modal-title').textContent().catch(() => null),
    dialogText: await uploadDialog.textContent().catch(() => null),
  })
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(500)

  await actionButtons.nth(1).click()
  await page.waitForTimeout(1_000)
  results.push({
    action: 'new-folder',
    dialogTitles: await page.locator('.ant-modal-wrap:visible .ant-modal-title').allTextContents().catch(() => []),
    inlineInputCount: await root.locator('.pictureContent___16o49 input, .pictureContent___16o49 textarea').count(),
  })

  await radioButtons.nth(1).click()
  await page.waitForTimeout(2_000)
  results.push({
    action: 'switch-tab-attachment',
    selectedTab: await root.locator('.ant-radio-button-wrapper-checked').textContent(),
    searchVisible: await searchInput.isVisible().catch(() => false),
    requestBody: mediasRequests.at(-1)?.requestBody ?? null,
  })

  await fs.writeFile(
    OUT_FILE,
    JSON.stringify(
      {
        results,
        mediasRequests,
      },
      null,
      2,
    ),
    'utf8',
  )

  console.log(
    JSON.stringify(
      {
        outFile: OUT_FILE,
        results,
        requestCount: mediasRequests.length,
      },
      null,
      2,
    ),
  )

  await context.close()
  await browser.close()
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch(async (error) => {
    console.error(error)
    process.exit(1)
  })
