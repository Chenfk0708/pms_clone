import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

const artifactRoot = path.resolve('artifacts')
const screenshotDir = path.join(artifactRoot, 'screenshots', 'fangtai--fangjia-guanli--tiaojia-rizhi')
const domDir = path.join(artifactRoot, 'dom-snapshots', 'fangtai--fangjia-guanli--tiaojia-rizhi')
const networkDir = path.join(artifactRoot, 'network', 'fangtai--fangjia-guanli--tiaojia-rizhi')
const styleDir = path.join(artifactRoot, 'style-dumps', 'fangtai--fangjia-guanli--tiaojia-rizhi')

async function lastPriceLogRequest(page: import('@playwright/test').Page) {
  return page.evaluate(() => window.localStorage.getItem('pms.priceLog.lastRequest') || '')
}

async function savePriceLogArtifact(page: import('@playwright/test').Page, name: string) {
  fs.mkdirSync(screenshotDir, { recursive: true })
  fs.mkdirSync(domDir, { recursive: true })
  fs.mkdirSync(networkDir, { recursive: true })
  fs.mkdirSync(styleDir, { recursive: true })

  await page.screenshot({ path: path.join(screenshotDir, `${name}.png`), fullPage: true })
  fs.writeFileSync(path.join(domDir, `${name}.html`), await page.content(), 'utf8')
  fs.writeFileSync(path.join(networkDir, `${name}.json`), await lastPriceLogRequest(page), 'utf8')
  const styleDump = await page.locator('.price-log-page').evaluate((element) => {
    const style = window.getComputedStyle(element)
    const panel = window.getComputedStyle(element.querySelector('.price-log-panel') ?? element)
    const tableHead = window.getComputedStyle(element.querySelector('.price-log-table__head') ?? element)

    return {
      page: {
        display: style.display,
        background: style.backgroundColor,
      },
      panel: {
        minHeight: panel.minHeight,
        background: panel.backgroundColor,
      },
      tableHead: {
        height: tableHead.height,
        background: tableHead.backgroundColor,
        color: tableHead.color,
        fontSize: tableHead.fontSize,
      },
    }
  })
  fs.writeFileSync(path.join(styleDir, `${name}.json`), JSON.stringify(styleDump, null, 2), 'utf8')
}

test('/houseManage/logs/price displays business data from the price-log data service', async ({ page }) => {
  await page.goto(appUrl('/houseManage/logs/price?campId=1796067693589061634'))

  await expect(page.getByLabel('调价日志筛选')).toContainText('日志关键词')
  await expect(page.getByRole('table', { name: '调价日志列表' })).toContainText('总裁套间（桑拿浴缸露台电竞麻将）')
  await expect(page.getByRole('table', { name: '调价日志列表' })).toContainText('飞猪淘酒店')
  await expect(page.getByRole('button', { name: '查看详情 PL202605180001' })).toBeVisible()
  await expect(page.getByRole('button', { name: '刷新', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '导出', exact: true })).toBeVisible()
  await expect(page.locator('.price-log-page')).not.toContainText(/mock|未接入|阻塞|后端未就绪|后端接口未完成/)

  const request = await lastPriceLogRequest(page)
  expect(request).toContain('"endpoint":"/houseManage/logs/price/list"')
  expect(request).toContain('"traceId":"mock-fangtai--fangjia-guanli--tiaojia-rizhi-list-001"')
  await savePriceLogArtifact(page, 'business-list-clone-20260518')
})

test('/houseManage/logs/price passes filters to data service and supports visible actions', async ({ page }) => {
  await page.goto(appUrl('/houseManage/logs/price?campId=1796067693589061634'))

  await page.getByLabel('日志关键词').fill('总裁')
  await page.getByRole('button', { name: '渠道 请选择' }).click()
  await page.getByRole('option', { name: '飞猪淘酒店' }).click()
  await page.getByRole('button', { name: '查 询' }).click()

  await expect(page.getByRole('button', { name: '查看详情 PL202605180001' })).toBeVisible()
  await expect(page.getByRole('status', { name: '调价日志操作反馈' })).toContainText('查询完成')
  await expect.poll(() => lastPriceLogRequest(page)).toContain('"keyword":"总裁"')
  let request = await lastPriceLogRequest(page)
  expect(request).toContain('"keyword":"总裁"')
  expect(request).toContain('"channelId":"8"')

  await page.getByRole('button', { name: '刷新', exact: true }).click()
  await expect(page.getByRole('status', { name: '调价日志操作反馈' })).toContainText('已刷新')

  await page.getByRole('button', { name: '导出' }).click()
  await expect(page.getByRole('status', { name: '调价日志操作反馈' })).toContainText('导出任务已创建')

  await page.getByRole('button', { name: '查看详情 PL202605180001' }).click()
  await expect(page.getByRole('dialog', { name: '调价日志详情' })).toContainText('PL202605180001')
  await page.getByRole('button', { name: '关闭详情' }).click()
  await expect(page.getByRole('dialog', { name: '调价日志详情' })).toHaveCount(0)

  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByLabel('日志关键词')).toHaveValue('')
  await expect(page.getByRole('button', { name: '渠道 请选择' })).toBeVisible()
  await expect.poll(() => lastPriceLogRequest(page)).toContain('"keyword":""')
  request = await lastPriceLogRequest(page)
  expect(request).toContain('"keyword":""')
})

test('/houseManage/logs/price exposes empty and error states without development copy', async ({ page }) => {
  await page.goto(appUrl('/houseManage/logs/price?campId=1796067693589061634&priceLogMockState=empty'))
  await expect(page.getByText('暂无数据')).toBeVisible()
  await expect(page.getByRole('table', { name: '调价日志列表' })).not.toContainText('PL202605180001')
  await expect(page.locator('.price-log-page')).not.toContainText(/mock|未接入|阻塞|后端未就绪|后端接口未完成/)
  await savePriceLogArtifact(page, 'empty-clone-20260518')

  await page.goto(appUrl('/houseManage/logs/price?campId=1796067693589061634&priceLogMockState=error'))
  await expect(page.getByRole('alert', { name: '调价日志数据错误' })).toContainText('调价日志数据加载失败')
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
  await expect(page.locator('.price-log-page')).not.toContainText(/mock|未接入|阻塞|后端未就绪|后端接口未完成/)
  await savePriceLogArtifact(page, 'error-clone-20260518')
})
