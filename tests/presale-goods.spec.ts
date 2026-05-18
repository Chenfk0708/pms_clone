import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/mallManagement/goodsManagement loads business data through the presale goods service', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/mallManagement/goodsManagement'))

  await expect(page.getByRole('heading', { name: '预售券', level: 1 })).toBeVisible()
  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '预售券' })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '酒店套餐' })).toBeVisible()

  await expect(page.getByLabel('预售券商品筛选')).toContainText('全部门店')
  await expect(page.getByText('天落会宿公寓(前海壹方城宝安中心店)')).toBeVisible()
  await expect(page.getByRole('button', { name: '渠道 请选择渠道' })).toBeVisible()
  await expect(page.getByRole('button', { name: '卡券类型 全部' })).toBeVisible()
  await expect(page.getByRole('button', { name: '商品类目 请选择商品类目' })).toBeVisible()
  await expect(page.getByRole('button', { name: '上架状态 全部' })).toBeVisible()
  await expect(page.getByPlaceholder('请输入商品编号/商品名称')).toBeVisible()

  await expect(page.locator('[data-testid="presale-goods-request"]')).toContainText(
    '"path":"/mallManagement/goodsManagement"',
  )
  await expect(page.getByLabel('预售券商品表格').locator('.presale-goods-row')).toHaveCount(3)
  await expect(page.getByText('顶层套房双人下午茶预售券')).toBeVisible()
  await expect(page.getByText('观影大床房周末通兑券')).toBeVisible()
  await expect(page.getByText('总裁套间生日布置套餐券')).toBeVisible()

  await page.getByRole('button', { name: '渠道 请选择渠道' }).click()
  await expect(page.getByRole('listbox', { name: '渠道选项' })).toContainText('路客云聚合')
  await page.getByRole('option', { name: '路客云聚合' }).click()
  await page.getByRole('button', { name: '搜 索' }).click()
  await expect(page.locator('[data-testid="presale-goods-request"]')).toContainText('"channelIds":[17]')
  await expect(page.getByText('已按当前条件更新预售券列表')).toBeVisible()

  await page.getByRole('button', { name: '刷新', exact: true }).click()
  await expect(page.getByText(/数据已刷新/)).toBeVisible()

  await page.getByRole('button', { name: '导出', exact: true }).click()
  await expect(page.getByText('已生成预售券导出任务')).toBeVisible()

  await page.getByRole('button', { name: '查看 顶层套房双人下午茶预售券' }).click()
  await expect(page.getByRole('dialog', { name: '预售券详情' })).toContainText('顶层套房双人下午茶预售券')
  await expect(page.getByRole('dialog', { name: '预售券详情' })).toContainText('核销前随时退')
  await page.getByRole('button', { name: '关闭详情' }).click()
  await expect(page.getByRole('dialog', { name: '预售券详情' })).toBeHidden()

  await page.getByRole('button', { name: '全部展开' }).click()
  await expect(page.getByText(/已展开 \d+ 个预售券规格/)).toBeVisible()
  await expect(page.getByText('双人下午茶', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: '新增预售券' }).click()
  await expect(page).toHaveURL(/\/mallManagement\/goodsManagement\/edit$/)
  await expect(page.getByText('1编辑基础信息')).toBeVisible()
  await expect(page.getByLabel('商品类型 虚拟商品')).toBeChecked()
  await page.getByRole('button', { name: '上传' }).click()
  await expect(page.getByText('商品图片已加入上传队列')).toBeVisible()
  await page.getByText('规格库存').scrollIntoViewIfNeeded()
  await page.getByRole('button', { name: /添加规格/ }).click()
  await expect(page.getByText('已添加默认规格')).toBeVisible()
  await page.getByRole('button', { name: '下一步' }).click()
  await expect(page.getByRole('heading', { name: '产品介绍' })).toBeVisible()
  await page.getByRole('button', { name: '预览' }).click()
  await expect(page.getByText('预览已打开')).toBeVisible()
  await page.getByRole('button', { name: '关闭预览' }).click()
  await page.getByRole('button', { name: '发 布' }).click()
  await expect(page.getByText('预售券发布成功')).toBeVisible()
  await page.getByRole('button', { name: '返回列表' }).click()
  await expect(page).toHaveURL(/\/mallManagement\/goodsManagement$/)
})

test('/mallManagement/goodsManagement exposes empty and error states without silent fallback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(appUrl('/mallManagement/goodsManagement?scenario=empty'))
  await expect(page.getByText('暂无符合条件的预售券')).toBeVisible()
  await expect(page.locator('[data-testid="presale-goods-request"]')).toContainText('"scenario":"empty"')

  await page.goto(appUrl('/mallManagement/goodsManagement?scenario=error'))
  await expect(page.getByRole('alert')).toContainText('预售券商品列表加载失败')
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
  await page.getByRole('button', { name: '重试' }).click()
  await expect(page.getByRole('alert')).toContainText('预售券商品列表加载失败')
})
