import { expect, test } from '@playwright/test'

test('hash routes keep the deep link after reload', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto('/#/workspace')

  await expect(page).toHaveURL(/\/#\/workspace$/)
  await expect(page.getByText('首页数据已刷新')).toBeVisible()

  await page.reload()

  await expect(page).toHaveURL(/\/#\/workspace$/)
  await expect(page.getByText('首页数据已刷新')).toBeVisible()
})
