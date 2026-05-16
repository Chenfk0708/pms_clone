import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/mallManagement/weapp/decorate matches captured brand website template market', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/mallManagement/weapp/decorate'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('heading', { name: '品牌官网', level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: '品牌官网' })).toHaveClass(/is-active/)
  await expect(page.getByText('页面导航')).toBeVisible()
  await expect(page.getByRole('button', { name: '模板市场' })).toHaveClass(/is-active/)

  await expect(page.getByText('露营地主题模板')).toBeVisible()
  await expect(page.getByText('酒店主题模板')).toBeVisible()
  await expect(page.getByText('民宿主题模板')).toBeVisible()
  await expect(page.getByText('默认模板')).toBeVisible()
  await expect(page.getByRole('button', { name: '一键使用' })).toHaveCount(4)
  await expect(page.locator('.brand-template__swatch')).toHaveCount(12)
  await expect(page.locator('.brand-template-phone')).toHaveCount(8)
  await expect(page.getByText('预览')).toHaveCount(8)
  await expect(page.locator('.chat-dock')).toContainText('全部会话')
  await expect(page.locator('.chat-dock__collapse')).toBeVisible()
})

test('/mallManagement/weapp/decorate supports captured page navigation states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/mallManagement/weapp/decorate'))

  await page.getByRole('button', { name: '店铺主页' }).click()
  await expect(page.getByRole('button', { name: '店铺主页' })).toHaveClass(/is-active/)
  await expect(page.getByText('路客云6TS5的店铺')).toBeVisible()
  await expect(page.getByRole('button', { name: '前往装修' })).toBeVisible()
  await expect(page.getByText('热门套餐')).toBeVisible()

  await page.getByRole('button', { name: '个人中心' }).click()
  await expect(page.getByText('用户昵称')).toBeVisible()
  await expect(page.getByText('我的订单')).toBeVisible()
  await expect(page.getByText('微商城订单')).toBeVisible()

  await page.getByRole('button', { name: '领券活动' }).click()
  await expect(page.getByPlaceholder('请输入领券活动名称')).toBeVisible()
  await expect(page.getByRole('button', { name: '新建活动' })).toBeVisible()
  await expect(page.getByText('暂无数据')).toBeVisible()

  await page.getByRole('button', { name: '通用导航' }).click()
  await expect(page.getByRole('heading', { name: '底部导航' })).toBeVisible()
  await expect(page.getByText('品牌小程序暂未开通，请尽快开通。')).toBeVisible()
  await expect(page.getByRole('button', { name: '保存并发布' })).toBeVisible()

  await page.getByRole('button', { name: '悬浮框' }).click()
  await expect(page.getByText('是否开启:')).toBeVisible()
  await expect(page.getByText('图片上传:')).toBeVisible()
  await expect(page.getByPlaceholder('开头为https://')).toBeVisible()

  await page.getByRole('button', { name: '首页弹窗' }).click()
  await expect(page.getByText('建议上传宽度280*350的图片')).toBeVisible()

  await page.getByRole('button', { name: '全局风格' }).click()
  await expect(page.getByText('当前小程序展示')).toBeVisible()
  await expect(page.getByText('选择颜色')).toBeVisible()
})
