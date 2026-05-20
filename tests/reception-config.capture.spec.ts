import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'

const taskId = 'scrm--kehu-goutong--jiedai-peizhi'
const pagePath = '/scrm/wechatService/receptionConfig'
const outputRoot = process.cwd()

function appUrl(routePath: string) {
  const baseUrl = process.env.PMS_TEST_BASE_URL
  return baseUrl ? `${baseUrl}${routePath}` : routePath
}

test.beforeAll(async () => {
  await warmReceptionConfigRoute()
})

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.receptionConfigProvider', 'mock')
    window.localStorage.removeItem('pms.receptionConfigMockState')
    window.localStorage.removeItem('pms.receptionConfig.lastRequest')
  })
})

test('capture reception config artifacts', async ({ page }) => {
  const states = [
    {
      slug: 'default-clone-20260519-final-success',
      route: pagePath,
      waitFor: async () => {
        await expect(page.locator('.reception-config-page')).toHaveAttribute('data-response-state', 'success')
      },
    },
    {
      slug: 'interaction-clone-20260519-final-interaction',
      route: pagePath,
      waitFor: async () => {
        await page.getByRole('button', { name: '接待分组 全部分组' }).click()
        await page.getByRole('option', { name: '夜班接待组' }).click()
        await page.getByRole('button', { name: '规则状态 全部规则' }).click()
        await page.getByRole('option', { name: '已启用' }).click()
        await page.getByLabel('规则关键词').fill('夜班')
        await page.getByRole('button', { name: '查询' }).click()
        await expect(page.getByRole('status', { name: '接待配置操作反馈' })).toContainText('已按当前条件刷新接待配置')
      },
    },
    {
      slug: 'empty-clone-20260519-final-empty',
      route: `${pagePath}?receptionConfigMockState=empty`,
      waitFor: async () => {
        await expect(page.locator('.reception-config-page')).toHaveAttribute('data-response-state', 'empty')
      },
    },
    {
      slug: 'error-clone-20260519-final-error',
      route: `${pagePath}?receptionConfigMockState=error`,
      waitFor: async () => {
        await expect(page.locator('.reception-config-page')).toHaveAttribute('data-response-state', 'error')
        await expect(page.getByRole('alert', { name: '接待配置数据错误' })).toContainText('接待配置数据加载失败，请重试')
      },
    },
  ] as const

  for (const state of states) {
    const responses: Array<Record<string, unknown>> = []
    const onResponse = (response: import('@playwright/test').Response) => {
      responses.push({
        url: response.url(),
        status: response.status(),
        method: response.request().method(),
        resourceType: response.request().resourceType(),
        contentType: response.headers()['content-type'] || '',
      })
    }

    page.on('response', onResponse)
    await page.goto(appUrl(state.route))
    await expect(page.getByRole('heading', { name: '接待配置中心', level: 1 })).toBeVisible()
    await state.waitFor()

    const screenshotDir = ensureDir('artifacts', 'screenshots', taskId)
    const domDir = ensureDir('artifacts', 'dom-snapshots', taskId)
    const styleDir = ensureDir('artifacts', 'style-dumps', taskId)
    const networkDir = ensureDir('artifacts', 'network', taskId)

    await page.screenshot({ path: path.join(screenshotDir, `${state.slug}-viewport.png`) })
    await page.screenshot({ path: path.join(screenshotDir, `${state.slug}-full.png`), fullPage: true })
    fs.writeFileSync(path.join(domDir, `${state.slug}-page.html`), await page.content(), 'utf8')

    const diagnostics = await page.evaluate(() => {
      const root = document.querySelector('.reception-config-page') as HTMLElement | null
      const rawValue = window.localStorage.getItem('pms.receptionConfig.lastRequest')
      return {
        dataset: root ? { ...root.dataset } : null,
        feedback: document.querySelector('[aria-label="接待配置操作反馈"]')?.textContent?.trim() || '',
        error: document.querySelector('[aria-label="接待配置数据错误"]')?.textContent?.trim() || '',
        lastRequest: rawValue ? JSON.parse(rawValue) : null,
      }
    })
    const bodyText = await page.locator('body').innerText()

    fs.writeFileSync(
      path.join(styleDir, `${state.slug}-facts.json`),
      JSON.stringify(
        {
          slug: state.slug,
          url: page.url(),
          diagnostics,
          bodyTextSample: bodyText.slice(0, 1200),
          bodyLength: bodyText.length,
        },
        null,
        2,
      ),
      'utf8',
    )

    fs.writeFileSync(
      path.join(networkDir, `${state.slug}-responses.json`),
      JSON.stringify(
        {
          slug: state.slug,
          url: page.url(),
          diagnostics,
          responses,
        },
        null,
        2,
      ),
      'utf8',
    )

    page.off('response', onResponse)
  }
})

function ensureDir(...segments: string[]) {
  const dir = path.join(outputRoot, ...segments)
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

async function warmReceptionConfigRoute() {
  const baseUrl = process.env.PMS_TEST_BASE_URL ?? 'http://127.0.0.1:4173'
  const targetUrl = `${baseUrl}${pagePath}`

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(targetUrl)
      if (response.ok) {
        await response.text()
        return
      }
    } catch {
      // Ignore warm-up failures and retry with a short backoff.
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}
