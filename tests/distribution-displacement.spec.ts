import { expect, test } from '@playwright/test'

const baseURL = process.env.PMS_TEST_BASE_URL

function appUrl(path: string) {
  return baseURL ? `${baseURL}${path}` : path
}

test('/channels/distribution/distributiondisplacement matches captured displacement benefits state', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/channels/distribution/distributiondisplacement'))

  await expect(page.getByRole('heading', { name: '置换权益', level: 1 })).toBeVisible()
  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '置换权益' })).toHaveClass(/is-active/)

  await expect(page.getByRole('region', { name: '置换概况' })).toContainText('待置换金额:')
  await expect(page.getByRole('region', { name: '置换概况' })).toContainText('已置换金额:')
  await expect(page.getByRole('button', { name: '申请尾房置换' })).toBeVisible()

  await expect(page.getByRole('region', { name: '置换明细' })).toContainText('日期筛选:')
  await expect(page.getByRole('button', { name: '日期筛选 全部' })).toBeVisible()
  await expect(page.getByPlaceholder('开始日期')).toBeVisible()
  await expect(page.getByPlaceholder('结束日期')).toBeVisible()
  await expect(page.getByLabel('置换明细表格').locator('.distribution-displacement-table__head > div')).toHaveText([
    '序号',
    '订单号/渠道单号',
    '置换月份',
    '渠道',
    '房型',
    '房间',
    '联系人',
    '手机号',
    '入住状态',
    '结算状态',
    '入离日期',
    '结算日期',
    '结算金额',
    '置换金额',
  ])
  await expect(page.getByText('暂无数据')).toBeVisible()
})

test('/channels/distribution/distributiondisplacement opens captured tail-room replacement dialog', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/channels/distribution/distributiondisplacement'))

  await page.getByRole('button', { name: '申请尾房置换' }).click()

  await expect(page.getByRole('dialog', { name: '尾房置换' })).toBeVisible()
  await expect(page.getByLabel('尾房置换二维码')).toBeVisible()
  await expect(page.getByText('联系业务经理，进行尾房置换')).toBeVisible()
  await page.getByRole('button', { name: '我知道了' }).click()
  await expect(page.getByRole('dialog', { name: '尾房置换' })).toHaveCount(0)
})
