import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/mallManagement/goodsManagement matches captured presale goods list and edit entry', async ({ page }) => {
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
  await expect(page.getByRole('button', { name: '重 置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '搜 索' })).toBeVisible()

  await expect(page.getByRole('tab', { name: '全部' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tab', { name: '销售中' })).toBeVisible()
  await expect(page.getByRole('tab', { name: '已售罄' })).toBeVisible()
  await expect(page.getByRole('tab', { name: '仓库中' })).toBeVisible()
  await expect(page.getByRole('button', { name: '门店管理' })).toBeVisible()
  await expect(page.getByRole('button', { name: '新增预售券' })).toBeVisible()
  await expect(page.getByRole('button', { name: '全部展开' })).toBeVisible()

  await expect(page.getByLabel('预售券商品表格').locator('.presale-goods-table__head > div')).toHaveText([
    '全部展开',
    '商品名称',
    '商品类目',
    '商品类型',
    '关联渠道',
    '库存',
    '售价（元）',
    '原价（元）',
    '创建时间',
    '更新时间',
    '操作',
  ])
  await expect(page.getByText('暂无数据')).toBeVisible()

  await page.getByRole('button', { name: '渠道 请选择渠道' }).click()
  await expect(page.getByRole('listbox', { name: '渠道选项' })).toContainText('路客云聚合')
  await page.getByRole('option', { name: '路客云聚合' }).click()
  await expect(page.getByRole('button', { name: '渠道 路客云聚合' })).toBeVisible()
  await page.getByPlaceholder('请输入商品编号/商品名称').fill('券')
  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByRole('button', { name: '渠道 请选择渠道' })).toBeVisible()
  await expect(page.getByPlaceholder('请输入商品编号/商品名称')).toHaveValue('')

  await page.getByRole('tab', { name: '仓库中' }).click()
  await expect(page.getByRole('tab', { name: '仓库中' })).toHaveAttribute('aria-selected', 'true')

  await page.getByRole('button', { name: '新增预售券' }).click()
  await expect(page).toHaveURL(/\/mallManagement\/goodsManagement\/edit$/)
  await expect(page.getByText('1编辑基础信息')).toBeVisible()
  await expect(page.getByText('2编辑产品介绍')).toBeVisible()
  await expect(page.getByText('商品类型')).toBeVisible()
  await expect(page.getByLabel('商品类型 虚拟商品')).toBeChecked()
  await expect(page.getByText('虚拟商品(无需物流)')).toBeVisible()
  await expect(page.getByText('实物商品(物流发货)')).toBeVisible()
  await expect(page.getByText('电子卡券(无需物流)')).toBeVisible()
  await expect(page.getByText('基本信息')).toBeVisible()
  await expect(page.getByLabel('商品名称')).toBeVisible()
  await expect(page.getByText('商品图片')).toBeVisible()
  await expect(page.getByRole('button', { name: '上传' })).toBeVisible()
  await expect(page.getByText('卡券类型首次上架后将无法修改，请谨慎选择。')).toBeVisible()
  await expect(page.getByRole('button', { name: '下一步' })).toBeVisible()
  await page.getByRole('button', { name: '返回列表' }).click()
  await expect(page).toHaveURL(/\/mallManagement\/goodsManagement$/)
})
