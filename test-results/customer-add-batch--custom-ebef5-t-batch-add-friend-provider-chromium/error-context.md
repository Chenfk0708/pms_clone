# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: customer-add-batch.spec.ts >> /customer/addBatch loads through explicit batch add-friend provider
- Location: tests\customer-add-batch.spec.ts:10:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByLabel('批量加好友核心指标')
Expected substring: "126"
Received string:    "预计可加好友4人近 30 天有订单且未添加企微的客户短信触达2人已下发引导添加企微短信的客户已添加1人已完成企微好友添加的客户转化率41.3%已添加人数 / 预计可加好友人数"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for getByLabel('批量加好友核心指标')
    9 × locator resolved to <section aria-label="批量加好友核心指标" class="customer-add-batch-metrics">…</section>
      - unexpected value "预计可加好友4人近 30 天有订单且未添加企微的客户短信触达2人已下发引导添加企微短信的客户已添加1人已完成企微好友添加的客户转化率41.3%已添加人数 / 预计可加好友人数"

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
          - button "预计可加好友 4人 近 30 天有订单且未添加企微的客户" [ref=e165] [cursor=pointer]:
            - generic [ref=e166]: 预计可加好友
            - strong [ref=e167]:
              - text: "4"
              - emphasis [ref=e168]: 人
            - generic [ref=e169]: 近 30 天有订单且未添加企微的客户
          - button "短信触达 2人 已下发引导添加企微短信的客户" [ref=e170] [cursor=pointer]:
            - generic [ref=e171]: 短信触达
            - strong [ref=e172]:
              - text: "2"
              - emphasis [ref=e173]: 人
            - generic [ref=e174]: 已下发引导添加企微短信的客户
          - button "已添加 1人 已完成企微好友添加的客户" [ref=e175] [cursor=pointer]:
            - generic [ref=e176]: 已添加
            - strong [ref=e177]:
              - text: "1"
              - emphasis [ref=e178]: 人
            - generic [ref=e179]: 已完成企微好友添加的客户
          - button "转化率 41.3% 已添加人数 / 预计可加好友人数" [ref=e180] [cursor=pointer]:
            - generic [ref=e181]: 转化率
            - strong [ref=e182]:
              - text: "41.3"
              - emphasis [ref=e183]: "%"
            - generic [ref=e184]: 已添加人数 / 预计可加好友人数
        - generic [ref=e185]:
          - region "批量转化趋势" [ref=e186]:
            - generic [ref=e187]:
              - heading "批量转化趋势" [level=2] [ref=e188]
              - generic [ref=e189]: 2026-05-18 更新
            - generic [ref=e190]:
              - generic "05-12 触达 18，添加 9" [ref=e191]:
                - generic [ref=e193]: 05-12
              - generic "05-13 触达 20，添加 12" [ref=e194]:
                - generic [ref=e196]: 05-13
              - generic "05-14 触达 15，添加 8" [ref=e197]:
                - generic [ref=e199]: 05-14
              - generic "05-15 触达 21，添加 14" [ref=e200]:
                - generic [ref=e202]: 05-15
              - generic "05-16 触达 16，添加 10" [ref=e203]:
                - generic [ref=e205]: 05-16
              - generic "05-17 触达 24，添加 16" [ref=e206]:
                - generic [ref=e208]: 05-17
              - generic "05-18 触达 22，添加 13" [ref=e209]:
                - generic [ref=e211]: 05-18
          - region "快捷入口" [ref=e212]:
            - heading "快捷入口" [level=2] [ref=e214]
            - button "客户列表" [ref=e215] [cursor=pointer]
            - button "企微员工列表" [ref=e216] [cursor=pointer]
            - button "客户标签" [ref=e217] [cursor=pointer]
        - region "候选客户列表" [ref=e218]:
          - generic [ref=e219]:
            - heading "候选客户列表" [level=2] [ref=e220]
            - generic [ref=e221]: 第 1-4 条/总共 4 条
          - generic [ref=e222]:
            - generic [ref=e223]:
              - generic [ref=e224]: 客户
              - generic [ref=e225]: 来源
              - generic [ref=e226]: 订单/房型
              - generic [ref=e227]: 状态
              - generic [ref=e228]: 最近沟通
              - generic [ref=e229]: 操作
            - generic [ref=e230]:
              - generic [ref=e231]:
                - strong [ref=e232]: 携程民宿-【M335275070】
                - generic [ref=e233]: 136****8277
              - generic [ref=e234]: 携程
              - generic [ref=e235]:
                - generic [ref=e236]: 2026-02-03
                - generic [ref=e237]: 顶层套房（浴缸巨幕电竞麻将）
              - generic [ref=e238]:
                - generic [ref=e239]: 待添加
                - generic [ref=e240]: 未发送
              - generic [ref=e241]: 房:加了
              - generic [ref=e242]:
                - button "详情" [ref=e243] [cursor=pointer]
                - button "下发短信" [ref=e244] [cursor=pointer]
                - button "标记已添加" [ref=e245] [cursor=pointer]
            - generic [ref=e246]:
              - generic [ref=e247]:
                - strong [ref=e248]: 去哪民宿-【dukx6737】
                - generic [ref=e249]: 181****1382
              - generic [ref=e250]: 途家
              - generic [ref=e251]:
                - generic [ref=e252]: 2026-02-05
                - generic [ref=e253]: 顶层套房（浴缸巨幕电竞麻将）
              - generic [ref=e254]:
                - generic [ref=e255]: 短信已发送
                - generic [ref=e256]: 已发送
              - generic [ref=e257]: 房:您留个绿色号加您
              - generic [ref=e258]:
                - button "详情" [ref=e259] [cursor=pointer]
                - button "下发短信" [ref=e260] [cursor=pointer]
                - button "标记已添加" [ref=e261] [cursor=pointer]
            - generic [ref=e262]:
              - generic [ref=e263]:
                - strong [ref=e264]: Ludwig
                - generic [ref=e265]: 159****2908
              - generic [ref=e266]: 美团民宿
              - generic [ref=e267]:
                - generic [ref=e268]: 2025-10-20
                - generic [ref=e269]: 顶层套房（浴缸巨幕电竞麻将）
              - generic [ref=e270]:
                - generic [ref=e271]: 待添加
                - generic [ref=e272]: 未发送
              - generic [ref=e273]: 房:请问有什么可以帮到您
              - generic [ref=e274]:
                - button "详情" [ref=e275] [cursor=pointer]
                - button "下发短信" [ref=e276] [cursor=pointer]
                - button "标记已添加" [ref=e277] [cursor=pointer]
            - generic [ref=e278]:
              - generic [ref=e279]:
                - strong [ref=e280]: 携程民宿-【M362021381】
                - generic [ref=e281]: 138****5369
              - generic [ref=e282]: 携程
              - generic [ref=e283]:
                - generic [ref=e284]: 2025-12-31
                - generic [ref=e285]: 总裁套间（桑拿浴缸露台电竞麻将）
              - generic [ref=e286]:
                - generic [ref=e287]: 已添加
                - generic [ref=e288]: 已确认
              - generic [ref=e289]: 房:您绿色号多少 加发您
              - generic [ref=e290]:
                - button "详情" [ref=e291] [cursor=pointer]
                - button "下发短信" [disabled] [ref=e292]
                - button "标记已添加" [disabled] [ref=e293]
        - region "批量任务列表" [ref=e294]:
          - heading "批量任务列表" [level=2] [ref=e296]
          - generic [ref=e297]:
            - article [ref=e298]:
              - generic [ref=e299]:
                - strong [ref=e300]: 春节前未加企微客户补触达
                - generic [ref=e301]: 近 30 天有效订单客户
              - paragraph [ref=e302]: 进行中，触达 84/126，已添加 52
              - button "查看任务" [ref=e303] [cursor=pointer]
            - article [ref=e304]:
              - generic [ref=e305]:
                - strong [ref=e306]: 高价值客户二次添加
                - generic [ref=e307]: 累计消费大于 500 元客户
              - paragraph [ref=e308]: 待执行，触达 0/38，已添加 0
              - button "查看任务" [ref=e309] [cursor=pointer]
        - region "商品详情" [ref=e310]:
          - heading "商品详情" [level=2] [ref=e311]
          - generic [ref=e312]:
            - img "企微SCRM高效获客留存" [ref=e313]
            - img "全自动留存用户" [ref=e314]
            - img "高效沟通工具" [ref=e315]
  - complementary "全部会话" [ref=e316]:
    - generic [ref=e317]:
      - strong [ref=e318]: 全部会话
      - generic [ref=e319]:
        - button "刷新会话" [ref=e320] [cursor=pointer]: ↻
        - button "收起会话" [ref=e321] [cursor=pointer]: 收起
    - generic [ref=e322]:
      - article [ref=e323]:
        - generic [ref=e325]:
          - generic [ref=e326]:
            - strong [ref=e327]: 携程民宿-【M335275070】
            - generic [ref=e328]: 咨询中
          - paragraph [ref=e329]:
            - emphasis [ref=e330]: 途家
            - text: 顶层套房（淞缇巨幕电竞麻将）
          - generic [ref=e331]: 我 加了
      - article [ref=e332]:
        - generic [ref=e334]:
          - generic [ref=e335]:
            - strong [ref=e336]: 携程民宿-【M566739056】
            - generic [ref=e337]: 咨询中
          - paragraph [ref=e338]:
            - emphasis [ref=e339]: 途家
            - text: 总裁套间（桦拿淞缇露台电竞麻将）
          - generic [ref=e340]: 我 已办理退房
      - article [ref=e341]:
        - generic [ref=e343]:
          - generic [ref=e344]:
            - strong [ref=e345]: 去哪民宿-【去哪儿用户】
            - generic [ref=e346]: 咨询中
          - paragraph [ref=e347]:
            - emphasis [ref=e348]: 途家 02.19-02.21（2晚）
            - text: 总裁套间（桦拿淞缇露台电竞麻将）
          - generic [ref=e349]: 我 人 有的
      - article [ref=e350]:
        - generic [ref=e352]:
          - generic [ref=e353]:
            - strong [ref=e354]: 携程民宿-【M614718025】
            - generic [ref=e355]: 咨询中
          - paragraph [ref=e356]:
            - emphasis [ref=e357]: 途家
            - text: 顶层套房（淞缇巨幕电竞麻将）
          - generic [ref=e358]: 我 什么时间段呢几号到几...
    - button "收起" [ref=e359] [cursor=pointer]
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
> 22 |   await expect(page.getByLabel('批量加好友核心指标')).toContainText('126')
     |                                              ^ Error: expect(locator).toContainText(expected) failed
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
  75 |   await expect(page.getByText('暂无可触达客户')).toBeVisible()
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