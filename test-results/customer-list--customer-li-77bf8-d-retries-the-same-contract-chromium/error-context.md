# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: customer-list.spec.ts >> /customer/list exposes provider errors and retries the same contract
- Location: tests\customer-list.spec.ts:92:1

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/customer/list
Call log:
  - navigating to "http://127.0.0.1:4173/customer/list", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e6]:
    - heading "无法访问此网站" [level=1] [ref=e7]
    - paragraph [ref=e8]:
      - strong [ref=e9]: 127.0.0.1
      - text: 拒绝了我们的连接请求。
    - generic [ref=e10]:
      - paragraph [ref=e11]: 请试试以下办法：
      - list [ref=e12]:
        - listitem [ref=e13]: 检查网络连接
        - listitem [ref=e14]:
          - link "检查代理服务器和防火墙" [ref=e15] [cursor=pointer]:
            - /url: "#buttons"
    - generic [ref=e16]: ERR_CONNECTION_REFUSED
  - generic [ref=e17]:
    - button "重新加载" [ref=e19] [cursor=pointer]
    - button "详情" [ref=e20] [cursor=pointer]
```

# Test source

```ts
  1   | import { expect, test } from '@playwright/test'
  2   | 
  3   | const appBaseURL = process.env.PMS_TEST_BASE_URL
  4   | 
  5   | function appUrl(routePath: string) {
  6   |   return appBaseURL ? `${appBaseURL}${routePath}` : routePath
  7   | }
  8   | 
  9   | async function openCustomerList(page, scenario: 'success' | 'empty' | 'error' = 'success') {
  10  |   await page.addInitScript((mode) => {
  11  |     window.localStorage.setItem('pms.customerList.scenario', mode)
  12  |     window.localStorage.setItem('pms.customerList.provider', 'mock')
  13  |   }, scenario)
  14  |   await page.setViewportSize({ width: 1440, height: 900 })
> 15  |   await page.goto(appUrl('/customer/list'))
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/customer/list
  16  | }
  17  | 
  18  | test('/customer/list loads through the customer list provider contract', async ({ page }) => {
  19  |   await openCustomerList(page)
  20  | 
  21  |   await expect(page.getByRole('link', { name: 'SCRM' })).toHaveClass(/is-active/)
  22  |   await expect(page.getByRole('link', { name: '客户列表' })).toHaveClass(/is-active/)
  23  |   await expect(page.locator('.page-content > .page-header')).toBeHidden()
  24  | 
  25  |   await expect(page.getByText('客户搜索')).toBeVisible()
  26  |   await expect(page.getByRole('button', { name: '手机号' })).toBeVisible()
  27  |   await expect(page.getByRole('button', { name: '导出数据' })).toBeVisible()
  28  |   await expect(page.getByRole('button', { name: '添加客户' })).toBeVisible()
  29  |   await expect(page.getByLabel('客户列表表格')).toContainText('任清明')
  30  |   await expect(page.getByLabel('客户列表表格')).toContainText('1810493396951339010')
  31  |   await expect(page.getByLabel('客户列表表格')).toContainText('第 1-20 条/总共 589 条')
  32  | 
  33  |   const contract = page.getByTestId('customer-list-contract')
  34  |   await expect(contract).toHaveAttribute('data-provider', 'mock')
  35  |   await expect(contract).toHaveAttribute('data-endpoint', '/member/page/get')
  36  |   await expect(contract).toContainText('"memberSearchType":"mobile"')
  37  |   await expect(contract).toContainText('"pageNum":1')
  38  |   await expect(contract).toContainText('"pageSize":20')
  39  | })
  40  | 
  41  | test('/customer/list refreshes data from filters and exposes actionable feedback', async ({ page }) => {
  42  |   await openCustomerList(page)
  43  | 
  44  |   await page.getByPlaceholder('请输入').first().fill('13141204230')
  45  |   await page.getByRole('button', { name: '展开' }).click()
  46  |   await page.getByRole('button', { name: '客户状态 请选择' }).click()
  47  |   await page.getByRole('option', { name: '正常' }).click()
  48  |   await page.getByRole('button', { name: '会员等级 请选择' }).click()
  49  |   await page.getByRole('option', { name: '普通会员' }).click()
  50  |   await page.getByRole('button', { name: '查 询' }).click()
  51  | 
  52  |   const contract = page.getByTestId('customer-list-contract')
  53  |   await expect(contract).toContainText('"keyword":"13141204230"')
  54  |   await expect(contract).toContainText('"status":"NORMAL"')
  55  |   await expect(contract).toContainText('"memberCardId":"1796067693727473665"')
  56  |   await expect(page.getByLabel('客户列表表格')).toContainText('任清明')
  57  | 
  58  |   await page.getByRole('checkbox', { name: '选择任清明' }).check()
  59  |   await expect(page.getByRole('status')).toContainText('已选择 1 位客户')
  60  | 
  61  |   await page.getByRole('button', { name: '导出数据' }).click()
  62  |   await expect(page.getByRole('status')).toContainText('客户导出任务已创建')
  63  | 
  64  |   await page.getByRole('button', { name: '详情' }).first().click()
  65  |   await expect(page.getByRole('dialog', { name: '客户详情' })).toContainText('任清明')
  66  |   await expect(page.getByRole('dialog', { name: '客户详情' })).toContainText('累计消费 637.20')
  67  |   await page.getByRole('button', { name: '关闭客户详情' }).click()
  68  | 
  69  |   await page.getByRole('button', { name: '更多' }).first().click()
  70  |   await expect(page.getByRole('menu', { name: '客户更多操作' })).toBeVisible()
  71  |   await page.getByRole('menuitem', { name: '记录跟进' }).click()
  72  |   await expect(page.getByRole('status')).toContainText('跟进记录已保存')
  73  | 
  74  |   await page.getByRole('button', { name: '添加客户' }).click()
  75  |   await page.getByRole('button', { name: '保 存' }).click()
  76  |   await expect(page.getByRole('alert')).toContainText('请输入手机号')
  77  |   await page.getByLabel('手机号').fill('13900001111')
  78  |   await page.getByLabel('姓名').fill('新客户')
  79  |   await page.getByRole('button', { name: '保 存' }).click()
  80  |   await expect(page.getByRole('status')).toContainText('客户已保存')
  81  | })
  82  | 
  83  | test('/customer/list handles empty provider responses without collapsing the table', async ({ page }) => {
  84  |   await openCustomerList(page, 'empty')
  85  | 
  86  |   await expect(page.getByLabel('客户列表表格')).toBeVisible()
  87  |   await expect(page.getByText('暂无符合条件的客户')).toBeVisible()
  88  |   await expect(page.getByTestId('customer-list-contract')).toContainText('"total":0')
  89  |   await expect(page.getByRole('button', { name: '添加客户' })).toBeEnabled()
  90  | })
  91  | 
  92  | test('/customer/list exposes provider errors and retries the same contract', async ({ page }) => {
  93  |   await openCustomerList(page, 'error')
  94  | 
  95  |   await expect(page.getByRole('alert')).toContainText('客户列表加载失败')
  96  |   await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
  97  | 
  98  |   await page.evaluate(() => window.localStorage.setItem('pms.customerList.scenario', 'success'))
  99  |   await page.getByRole('button', { name: '重新加载' }).click()
  100 | 
  101 |   await expect(page.getByLabel('客户列表表格')).toContainText('任清明')
  102 |   await expect(page.getByTestId('customer-list-contract')).toContainText('"pageNum":1')
  103 | })
  104 | 
```