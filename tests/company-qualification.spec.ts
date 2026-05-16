import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/InformationMaintenance/qualification matches captured enterprise qualification default state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/InformationMaintenance/qualification'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '企业资质' })).toHaveClass(/is-active/)
  await expect(page.getByRole('button', { name: '企业信息' })).toBeVisible()
  await expect(page.getByRole('button', { name: '营业资质' })).toBeVisible()
  await expect(page.getByRole('button', { name: '法人证件' })).toBeVisible()

  await expect(page.getByRole('heading', { name: '企业信息', level: 2 })).toBeVisible()
  await expect(page.getByRole('button', { name: '编 辑' })).toBeVisible()
  await expect(page.getByText('企业名称：')).toBeVisible()
  await expect(page.getByText('路客云6TS5的店铺')).toBeVisible()
  await expect(page.getByText('企业类型：')).toBeVisible()
  await expect(page.locator('.company-info-row').filter({ hasText: '企业类型：' }).getByText('民宿', { exact: true })).toBeVisible()
  await expect(page.getByText('联系电话：')).toBeVisible()
  await expect(page.getByText('暂无联系电话')).toBeVisible()
  await expect(page.getByText('所在城市：')).toBeVisible()
  await expect(page.getByText('暂无所在城市')).toBeVisible()
  await expect(page.getByText('详细地址：')).toBeVisible()
  await expect(page.getByText('暂无详细地址')).toBeVisible()
  await expect(page.getByText('图片：')).toBeVisible()
  await expect(page.getByText('暂无图片数据')).toBeVisible()
})

test('/InformationMaintenance/qualification supports captured tabs and edit state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/InformationMaintenance/qualification'))

  await page.getByRole('button', { name: '营业资质' }).click()
  await expect(page.getByRole('heading', { name: '营业资质', level: 2 })).toBeVisible()
  await expect(page.locator('.license-index').filter({ hasText: /^1$/ })).toBeVisible()
  await expect(page.getByText('营业执照')).toBeVisible()
  await expect(page.getByText('小于4MB，最多上传1张，支持jpeg、jpg、png格式')).toBeVisible()
  await expect(page.getByText('商铺行业资质（涉及餐饮相关内容的商家请上传《食品经营许可证》）')).toBeVisible()
  await expect(page.getByText('公共场所许可证查看示例')).toBeVisible()
  await expect(page.getByText('特种行业许可证查看示例')).toBeVisible()
  await expect(page.getByText('食品经营许可证查看示例')).toBeVisible()
  await expect(page.getByText('补充资质 (如商铺行业资质信息不全时，需要上传补充资质)')).toBeVisible()
  await expect(page.getByText('行业补充资质说明')).toBeVisible()
  await expect(page.getByText('商家授权承诺函（开通抖音必传）')).toBeVisible()
  await expect(page.getByText('下载授权承诺函模板')).toBeVisible()
  await expect(page.getByText('小于4MB，仅支持PDF格式')).toBeVisible()

  await page.getByRole('button', { name: '法人证件' }).click()
  await expect(page.getByRole('heading', { name: '法人证件', level: 2 })).toBeVisible()
  await expect(page.getByText('证件类型：')).toBeVisible()
  await expect(page.getByText('居民身份证')).toBeVisible()
  await expect(page.getByText('证件号码：')).toBeVisible()
  await expect(page.getByText('证件人像面照片')).toBeVisible()
  await expect(page.getByText('证件国徽面照片')).toBeVisible()
  await expect(page.getByText('法人手持证件照')).toBeVisible()

  await page.getByRole('button', { name: '企业信息' }).click()
  await page.getByRole('button', { name: '编 辑' }).click()
  await expect(page.getByRole('button', { name: '取 消' })).toBeVisible()
  await expect(page.getByRole('button', { name: '保 存' })).toBeVisible()
  await expect(page.getByLabel('企业名称')).toHaveValue('路客云6TS5的店铺')
  await expect(page.getByLabel('企业类型')).toHaveValue('民宿')
  await expect(page.getByLabel('联系电话')).toBeVisible()
  await expect(page.getByText('请选择所在城市')).toBeVisible()
  await expect(page.getByLabel('详细地址')).toBeVisible()
  await expect(page.getByRole('button', { name: '上传' })).toBeVisible()
})
