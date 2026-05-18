# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: customer-add-batch.spec.ts >> /customer/addBatch renders empty and failure response states
- Location: tests\customer-add-batch.spec.ts:71:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('暂无可触达客户')
Expected: visible
Error: strict mode violation: getByText('暂无可触达客户') resolved to 3 elements:
    1) <strong>暂无可触达客户</strong> aka getByLabel('批量转化趋势').getByText('暂无可触达客户')
    2) <strong>暂无可触达客户</strong> aka getByLabel('候选客户列表').getByText('暂无可触达客户')
    3) <strong>暂无可触达客户</strong> aka getByLabel('批量任务列表').getByText('暂无可触达客户')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('暂无可触达客户')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]: LOCALS
      - generic [ref=e7]:
        - strong [ref=e8]: 路客云 6TS5 的店铺
        - generic [ref=e9]: 畅享版
    - navigation "顶部导航" [ref=e10]:
      - link "首页" [ref=e11] [cursor=pointer]:
        - /url: /workspace
      - link "房态" [ref=e12] [cursor=pointer]:
        - /url: /houseManage/months
      - link "房价" [ref=e13] [cursor=pointer]:
        - /url: /houseManage/houseCale
      - link "订单" [ref=e14] [cursor=pointer]:
        - /url: /order/house-order/list
      - link "售卖/产品" [ref=e15] [cursor=pointer]:
        - /url: /setting/localRoomTypeProductionSetting
      - link "OTA" [ref=e16] [cursor=pointer]:
        - /url: /channels/ota
      - link "社媒" [ref=e17] [cursor=pointer]:
        - /url: /channels/social
      - link "私域" [ref=e18] [cursor=pointer]:
        - /url: /channels/private
      - link "聚合分销 HOT" [ref=e19] [cursor=pointer]:
        - /url: /channels/distribution/distributionSecond
        - text: 聚合分销
        - emphasis [ref=e20]: HOT
      - link "SCRM" [ref=e21] [cursor=pointer]:
        - /url: /scrm/general
      - link "AI全域雷达" [ref=e22] [cursor=pointer]:
        - /url: /channels/globalRadar/globalData
      - link "智慧酒店" [ref=e23] [cursor=pointer]:
        - /url: /smartHotel/smartHome
      - link "报表" [ref=e24] [cursor=pointer]:
        - /url: /statistics/report
      - link "设置" [ref=e25] [cursor=pointer]:
        - /url: /InformationMaintenance/informationOverview
    - generic "顶部工具栏" [ref=e26]:
      - link "应用订阅" [ref=e27] [cursor=pointer]:
        - /url: /version/applicationPayment
        - generic [ref=e30]: 应用订阅
        - emphasis [ref=e31]: 限时试用
      - button "消息" [ref=e32] [cursor=pointer]:
        - img [ref=e33]
      - button "收款" [ref=e35] [cursor=pointer]:
        - img [ref=e36]
      - button "接待" [ref=e39] [cursor=pointer]:
        - img [ref=e40]
      - button "门锁" [ref=e44] [cursor=pointer]:
        - img [ref=e45]
      - button "客服" [ref=e49] [cursor=pointer]:
        - img [ref=e50]
      - button "通知" [ref=e54] [cursor=pointer]:
        - img [ref=e55]
      - button "用户菜单" [ref=e57] [cursor=pointer]:
        - img [ref=e59]
        - img [ref=e62]
  - generic [ref=e64]:
    - complementary "批量加好友侧边导航" [ref=e65]:
      - button "SCRM" [ref=e67] [cursor=pointer]:
        - img [ref=e68]
        - heading "SCRM" [level=2] [ref=e72]
        - img [ref=e73]
      - button "客户管理" [ref=e76] [cursor=pointer]:
        - img [ref=e77]
        - heading "客户管理" [level=2] [ref=e81]
        - img [ref=e82]
      - button "会员中心" [ref=e85] [cursor=pointer]:
        - img [ref=e86]
        - heading "会员中心" [level=2] [ref=e90]
        - img [ref=e91]
      - generic [ref=e93]:
        - button "增长获客" [expanded] [ref=e94] [cursor=pointer]:
          - img [ref=e95]
          - heading "增长获客" [level=2] [ref=e99]
          - img [ref=e100]
        - link "批量加好友" [ref=e103] [cursor=pointer]:
          - /url: /customer/addBatch
      - button "营销推广" [ref=e105] [cursor=pointer]:
        - img [ref=e106]
        - heading "营销推广" [level=2] [ref=e109]
        - img [ref=e110]
      - button "客户沟通" [ref=e113] [cursor=pointer]:
        - img [ref=e114]
        - heading "客户沟通" [level=2] [ref=e118]
        - img [ref=e119]
      - button "企微员工管理" [ref=e122] [cursor=pointer]:
        - img [ref=e123]
        - heading "企微员工管理" [level=2] [ref=e127]
        - img [ref=e128]
    - main [ref=e130]:
      - generic [ref=e132]:
        - generic [ref=e133]:
          - generic [ref=e134]:
            - img [ref=e135]
            - generic [ref=e136]:
              - heading "企微SCRM-批量加好友" [level=1] [ref=e137]
              - paragraph [ref=e138]: 客户下单后获取到客户手机号，若该手机号未添加企业微信客户，则可下发添加好友短信，引导客户通过短信添加企业微信。
          - generic [ref=e139]:
            - generic [ref=e140]: 限时免费
            - button "立即开通" [ref=e141] [cursor=pointer]
        - region "批量加好友筛选" [ref=e142]:
          - generic [ref=e143]:
            - generic [ref=e144]: "门店:"
            - button "门店 天落会宿公寓(前海壹方城宝安中心店)" [ref=e145] [cursor=pointer]
          - generic [ref=e146]:
            - generic [ref=e147]: "开始日期:"
            - textbox "开始日期" [ref=e148]:
              - /placeholder: YYYY-MM-DD
          - generic [ref=e149]:
            - generic [ref=e150]: "结束日期:"
            - textbox "结束日期" [ref=e151]:
              - /placeholder: YYYY-MM-DD
          - generic [ref=e152]:
            - generic [ref=e153]: "渠道:"
            - button "渠道 全部渠道" [ref=e154] [cursor=pointer]
          - generic [ref=e155]:
            - generic [ref=e156]: "加好友状态:"
            - button "加好友状态 全部状态" [ref=e157] [cursor=pointer]
          - generic [ref=e158]:
            - button "查 询" [ref=e159] [cursor=pointer]
            - button "重 置" [ref=e160] [cursor=pointer]
            - button "刷 新" [ref=e161] [cursor=pointer]
            - button "导 出" [ref=e162] [cursor=pointer]
        - status "批量加好友操作反馈" [ref=e163]: 批量加好友看板已加载
        - region "批量加好友核心指标" [ref=e164]:
          - button "预计可加好友 126人 近 30 天有订单且未添加企微的客户" [ref=e165] [cursor=pointer]:
            - generic [ref=e166]: 预计可加好友
            - strong [ref=e167]:
              - text: "126"
              - emphasis [ref=e168]: 人
            - generic [ref=e169]: 近 30 天有订单且未添加企微的客户
          - button "短信触达 84人 已下发引导添加企微短信的客户" [ref=e170] [cursor=pointer]:
            - generic [ref=e171]: 短信触达
            - strong [ref=e172]:
              - text: "84"
              - emphasis [ref=e173]: 人
            - generic [ref=e174]: 已下发引导添加企微短信的客户
          - button "已添加 52人 已完成企微好友添加的客户" [ref=e175] [cursor=pointer]:
            - generic [ref=e176]: 已添加
            - strong [ref=e177]:
              - text: "52"
              - emphasis [ref=e178]: 人
            - generic [ref=e179]: 已完成企微好友添加的客户
          - button "转化率 0% 已添加人数 / 预计可加好友人数" [ref=e180] [cursor=pointer]:
            - generic [ref=e181]: 转化率
            - strong [ref=e182]:
              - text: "0"
              - emphasis [ref=e183]: "%"
            - generic [ref=e184]: 已添加人数 / 预计可加好友人数
        - generic [ref=e185]:
          - region "批量转化趋势" [ref=e186]:
            - generic [ref=e187]:
              - heading "批量转化趋势" [level=2] [ref=e188]
              - generic [ref=e189]: 2026-05-18 更新
            - generic [ref=e190]:
              - strong [ref=e191]: 暂无可触达客户
              - paragraph [ref=e192]: 当前筛选条件下没有待加好友客户，请调整条件后重新查询。
          - region "快捷入口" [ref=e193]:
            - heading "快捷入口" [level=2] [ref=e195]
            - button "客户列表" [ref=e196] [cursor=pointer]
            - button "企微员工列表" [ref=e197] [cursor=pointer]
            - button "客户标签" [ref=e198] [cursor=pointer]
        - region "候选客户列表" [ref=e199]:
          - generic [ref=e200]:
            - heading "候选客户列表" [level=2] [ref=e201]
            - generic [ref=e202]: 第 1-0 条/总共 0 条
          - generic [ref=e203]:
            - strong [ref=e204]: 暂无可触达客户
            - paragraph [ref=e205]: 当前筛选条件下没有待加好友客户，请调整条件后重新查询。
        - region "批量任务列表" [ref=e206]:
          - heading "批量任务列表" [level=2] [ref=e208]
          - generic [ref=e209]:
            - strong [ref=e210]: 暂无可触达客户
            - paragraph [ref=e211]: 当前筛选条件下没有待加好友客户，请调整条件后重新查询。
        - region "商品详情" [ref=e212]:
          - heading "商品详情" [level=2] [ref=e213]
          - generic [ref=e214]:
            - img "企微SCRM高效获客留存" [ref=e215]
            - img "全自动留存用户" [ref=e216]
            - img "高效沟通工具" [ref=e217]
  - complementary "全部会话" [ref=e218]:
    - generic [ref=e219]:
      - strong [ref=e220]: 全部会话
      - generic [ref=e221]:
        - button "刷新会话" [ref=e222] [cursor=pointer]: ↻
        - button "收起会话" [ref=e223] [cursor=pointer]: 收起
    - generic [ref=e224]:
      - article [ref=e225]:
        - generic [ref=e227]:
          - generic [ref=e228]:
            - strong [ref=e229]: 携程民宿-【M335275070】
            - generic [ref=e230]: 咨询中
          - paragraph [ref=e231]:
            - emphasis [ref=e232]: 途家
            - text: 顶层套房（淞缇巨幕电竞麻将）
          - generic [ref=e233]: 我 加了
      - article [ref=e234]:
        - generic [ref=e236]:
          - generic [ref=e237]:
            - strong [ref=e238]: 携程民宿-【M566739056】
            - generic [ref=e239]: 咨询中
          - paragraph [ref=e240]:
            - emphasis [ref=e241]: 途家
            - text: 总裁套间（桦拿淞缇露台电竞麻将）
          - generic [ref=e242]: 我 已办理退房
      - article [ref=e243]:
        - generic [ref=e245]:
          - generic [ref=e246]:
            - strong [ref=e247]: 去哪民宿-【去哪儿用户】
            - generic [ref=e248]: 咨询中
          - paragraph [ref=e249]:
            - emphasis [ref=e250]: 途家 02.19-02.21（2晚）
            - text: 总裁套间（桦拿淞缇露台电竞麻将）
          - generic [ref=e251]: 我 人 有的
      - article [ref=e252]:
        - generic [ref=e254]:
          - generic [ref=e255]:
            - strong [ref=e256]: 携程民宿-【M614718025】
            - generic [ref=e257]: 咨询中
          - paragraph [ref=e258]:
            - emphasis [ref=e259]: 途家
            - text: 顶层套房（淞缇巨幕电竞麻将）
          - generic [ref=e260]: 我 什么时间段呢几号到几...
    - button "收起" [ref=e261] [cursor=pointer]
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test'
  2  | 
  3  | const appBaseURL = process.env.PMS_TEST_BASE_URL
  4  | const forbiddenDevelopmentCopy = /mock 数据|mock provider|provider=mock|未接入|阻塞|后端未就绪|后端接口未完成/
  5  | 
  6  | function appUrl(routePath: string) {
  7  |   return appBaseURL ? `${appBaseURL}${routePath}` : routePath
  8  | }
  9  | 
  10 | test('/customer/addBatch loads through explicit batch add-friend provider', async ({ page }) => {
  11 |   await page.setViewportSize({ width: 1440, height: 900 })
  12 |   await page.goto(appUrl('/customer/addBatch'))
  13 | 
  14 |   await expect(page.locator('.page-content > .page-header')).toBeHidden()
  15 |   await expect(page.getByRole('link', { name: '批量加好友' })).toHaveClass(/is-active/)
  16 |   await expect(page.getByRole('heading', { name: '企微SCRM-批量加好友', level: 1 })).toBeVisible()
  17 |   await expect(page.locator('.customer-add-batch-page')).toHaveAttribute('data-provider', 'mock')
  18 |   await expect(page.locator('.customer-add-batch-page')).toHaveAttribute('data-request-channel', '')
  19 |   await expect(page.locator('body')).not.toContainText(forbiddenDevelopmentCopy)
  20 | 
  21 |   await expect(page.getByLabel('批量加好友核心指标')).toContainText('预计可加好友')
  22 |   await expect(page.getByLabel('批量加好友核心指标')).toContainText('126')
  23 |   await expect(page.getByLabel('批量加好友核心指标')).toContainText('短信触达')
  24 |   await expect(page.getByLabel('批量加好友核心指标')).toContainText('84')
  25 |   await expect(page.getByLabel('候选客户列表')).toContainText('携程民宿-【M335275070】')
  26 |   await expect(page.getByLabel('批量任务列表')).toContainText('春节前未加企微客户补触达')
  27 | 
  28 |   await page.getByLabel('开始日期').fill('2026-05-01')
  29 |   await page.getByLabel('结束日期').fill('2026-05-18')
  30 |   await page.getByRole('button', { name: '渠道 全部渠道' }).click()
  31 |   await page.getByRole('option', { name: '美团民宿' }).click()
  32 |   await page.getByRole('button', { name: '查 询' }).click()
  33 | 
  34 |   await expect(page.getByRole('status', { name: '批量加好友操作反馈' })).toContainText('已按当前条件刷新批量加好友数据')
  35 |   await expect(page.locator('.customer-add-batch-page')).toHaveAttribute('data-request-channel', '美团民宿')
  36 |   await expect(page.locator('.customer-add-batch-page')).toHaveAttribute('data-request-date-start', '2026-05-01')
  37 | })
  38 | 
  39 | test('/customer/addBatch gives feedback for visible actions and route entries', async ({ page }) => {
  40 |   await page.setViewportSize({ width: 1440, height: 900 })
  41 |   await page.goto(appUrl('/customer/addBatch'))
  42 | 
  43 |   await page.getByRole('button', { name: '刷 新' }).click()
  44 |   await expect(page.getByRole('status', { name: '批量加好友操作反馈' })).toContainText('已刷新批量加好友看板')
  45 | 
  46 |   await page.getByRole('button', { name: '导 出' }).click()
  47 |   await expect(page.getByRole('status', { name: '批量加好友操作反馈' })).toContainText('已生成批量加好友导出任务')
  48 | 
  49 |   await page.getByLabel('批量加好友核心指标').getByRole('button', { name: /预计可加好友/ }).click()
  50 |   await expect(page.getByRole('dialog', { name: '指标详情' })).toContainText('客户手机号已脱敏')
  51 |   await page.getByRole('button', { name: '关闭指标详情' }).click()
  52 | 
  53 |   await page.getByLabel('候选客户列表').getByRole('button', { name: '下发短信' }).first().click()
  54 |   await expect(page.getByRole('status', { name: '批量加好友操作反馈' })).toContainText('加好友短信已下发')
  55 | 
  56 |   await page.getByLabel('候选客户列表').getByRole('button', { name: '标记已添加' }).first().click()
  57 |   await expect(page.getByLabel('候选客户列表')).toContainText('已添加')
  58 | 
  59 |   await page.getByLabel('候选客户列表').getByRole('button', { name: '详情' }).first().click()
  60 |   await expect(page.getByRole('dialog', { name: '客户加好友详情' })).toContainText('推荐话术')
  61 |   await page.getByRole('button', { name: '关闭客户加好友详情' }).click()
  62 | 
  63 |   await page.getByLabel('批量任务列表').getByRole('button', { name: '查看任务' }).first().click()
  64 |   await expect(page.getByRole('dialog', { name: '批量任务详情' })).toContainText('任务进度')
  65 |   await page.getByRole('button', { name: '关闭批量任务详情' }).click()
  66 | 
  67 |   await page.getByRole('button', { name: '客户列表' }).click()
  68 |   await expect(page).toHaveURL(/\/customer\/list$/)
  69 | })
  70 | 
  71 | test('/customer/addBatch renders empty and failure response states', async ({ page }) => {
  72 |   await page.setViewportSize({ width: 1440, height: 900 })
  73 | 
  74 |   await page.goto(appUrl('/customer/addBatch?customerAddBatchMockState=empty'))
> 75 |   await expect(page.getByText('暂无可触达客户')).toBeVisible()
     |                                           ^ Error: expect(locator).toBeVisible() failed
  76 |   await expect(page.getByText('当前筛选条件下没有待加好友客户，请调整条件后重新查询。')).toBeVisible()
  77 |   await expect(page.locator('body')).not.toContainText(forbiddenDevelopmentCopy)
  78 | 
  79 |   await page.goto(appUrl('/customer/addBatch?customerAddBatchMockState=error'))
  80 |   await expect(page.getByRole('alert', { name: '批量加好友数据错误' })).toContainText('批量加好友数据加载失败')
  81 |   await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
  82 |   await expect(page.locator('body')).not.toContainText(forbiddenDevelopmentCopy)
  83 | })
  84 | 
  85 | test('/customer/addBatch preserves captured SCRM subscription route', async ({ page }) => {
  86 |   await page.setViewportSize({ width: 1440, height: 900 })
  87 |   await page.goto(appUrl('/customer/addBatch'))
  88 | 
  89 |   await page.getByRole('button', { name: '立即开通' }).click()
  90 | 
  91 |   await expect(page).toHaveURL(/\/version\/applicationPayment\/detail$/)
  92 |   await expect(page.getByRole('heading', { name: '企微SCRM', level: 2 })).toBeVisible()
  93 |   await expect(page.getByText('商品详情')).toBeVisible()
  94 |   await expect(page.getByText('购买信息')).toBeVisible()
  95 |   await expect(page.getByRole('button', { name: '立即购买' })).toBeVisible()
  96 | })
  97 | 
```