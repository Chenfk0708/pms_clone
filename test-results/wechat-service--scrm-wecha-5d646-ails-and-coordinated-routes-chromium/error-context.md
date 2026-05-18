# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: wechat-service.spec.ts >> /scrm/wechatService/manage refreshes filters, export, details, and coordinated routes
- Location: tests\wechat-service.spec.ts:79:1

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByText('携程民宿-【M335275070】')
Expected: 0
Received: 1
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" with timeout 5000ms
  - waiting for getByText('携程民宿-【M335275070】')
    8 × locator resolved to 1 element
      - unexpected value "1"

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
    - complementary "微信客服侧边导航" [ref=e65]:
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
      - button "增长获客" [ref=e94] [cursor=pointer]:
        - img [ref=e95]
        - heading "增长获客" [level=2] [ref=e99]
        - img [ref=e100]
      - button "营销推广" [ref=e103] [cursor=pointer]:
        - img [ref=e104]
        - heading "营销推广" [level=2] [ref=e107]
        - img [ref=e108]
      - generic [ref=e110]:
        - button "客户沟通" [expanded] [ref=e111] [cursor=pointer]:
          - img [ref=e112]
          - heading "客户沟通" [level=2] [ref=e116]
          - img [ref=e117]
        - generic [ref=e119]:
          - link "聊天工具栏" [ref=e120] [cursor=pointer]:
            - /url: /scrm/sidebarPreview
          - link "微信客服" [ref=e121] [cursor=pointer]:
            - /url: /scrm/wechatService/manage
          - link "接待配置" [ref=e122] [cursor=pointer]:
            - /url: /scrm/wechatService/receptionConfig
      - button "企微员工管理" [ref=e124] [cursor=pointer]:
        - img [ref=e125]
        - heading "企微员工管理" [level=2] [ref=e129]
        - img [ref=e130]
    - main [ref=e132]:
      - generic [ref=e133]:
        - generic [ref=e134]:
          - generic [ref=e135]:
            - generic [ref=e136]: SCRM / 客户沟通
            - heading "微信客服运营台" [level=1] [ref=e137]
            - paragraph [ref=e138]: 统一查看企业微信客服账号、渠道咨询、待处理会话和入住沟通状态。
          - generic [ref=e139]:
            - button "接待配置" [ref=e140] [cursor=pointer]
            - button "聊天工具栏" [ref=e141] [cursor=pointer]
        - region "微信客服筛选" [ref=e142]:
          - button "美团民宿" [ref=e144] [cursor=pointer]
          - button "待入住" [ref=e146] [cursor=pointer]
          - generic [ref=e147]:
            - generic [ref=e148]: 关键词
            - textbox "会话关键词" [ref=e149]:
              - /placeholder: 搜索客户、订单或消息
              - text: Abraham160
          - generic [ref=e150]:
            - button "查询" [ref=e151] [cursor=pointer]
            - button "重置" [ref=e152] [cursor=pointer]
            - button "刷新" [ref=e153] [cursor=pointer]
            - button "导出" [ref=e154] [cursor=pointer]
        - status [ref=e155]: 微信客服数据已更新
        - region "微信客服核心指标" [ref=e156]:
          - button "今日会话 128" [ref=e157] [cursor=pointer]:
            - generic [ref=e158]: 今日会话
            - strong [ref=e159]: "128"
          - button "待处理会话 1" [ref=e160] [cursor=pointer]:
            - generic [ref=e161]: 待处理会话
            - strong [ref=e162]: "1"
          - button "平均响应 2分18秒" [ref=e163] [cursor=pointer]:
            - generic [ref=e164]: 平均响应
            - strong [ref=e165]: 2分18秒
          - button "转化线索 23" [ref=e166] [cursor=pointer]:
            - generic [ref=e167]: 转化线索
            - strong [ref=e168]: "23"
        - main [ref=e169]:
          - region "客服账号" [ref=e170]:
            - generic [ref=e171]:
              - heading "客服账号" [level=2] [ref=e172]
              - generic [ref=e173]: 96.8% 响应率
            - generic [ref=e174]:
              - button "天落会宿公寓 在线 今日会话 52 1分14秒 评分 98" [ref=e175] [cursor=pointer]:
                - generic [ref=e176]:
                  - strong [ref=e177]: 天落会宿公寓
                  - emphasis [ref=e178]: 在线
                - generic [ref=e179]: 今日会话 52
                - generic [ref=e180]: 1分14秒
                - generic [ref=e181]: 评分 98
              - button "夜班接待 忙碌 今日会话 43 1分52秒 评分 94" [ref=e182] [cursor=pointer]:
                - generic [ref=e183]:
                  - strong [ref=e184]: 夜班接待
                  - emphasis [ref=e185]: 忙碌
                - generic [ref=e186]: 今日会话 43
                - generic [ref=e187]: 1分52秒
                - generic [ref=e188]: 评分 94
              - button "订单跟进 在线 今日会话 33 2分6秒 评分 96" [ref=e189] [cursor=pointer]:
                - generic [ref=e190]:
                  - strong [ref=e191]: 订单跟进
                  - emphasis [ref=e192]: 在线
                - generic [ref=e193]: 今日会话 33
                - generic [ref=e194]: 2分6秒
                - generic [ref=e195]: 评分 96
          - region "待办提醒" [ref=e196]:
            - generic [ref=e197]:
              - heading "待办提醒" [level=2] [ref=e198]
              - generic [ref=e199]: 2026-05-18
            - generic [ref=e200]:
              - button "1 待回复会话" [ref=e201] [cursor=pointer]:
                - strong [ref=e202]: "1"
                - generic [ref=e203]: 待回复会话
              - button "6 待入住咨询" [ref=e204] [cursor=pointer]:
                - strong [ref=e205]: "6"
                - generic [ref=e206]: 待入住咨询
              - button "3 需转接客服" [ref=e207] [cursor=pointer]:
                - strong [ref=e208]: "3"
                - generic [ref=e209]: 需转接客服
          - region "会话队列" [ref=e210]:
            - generic [ref=e211]:
              - heading "会话队列" [level=2] [ref=e212]
              - generic [ref=e213]: 1 条
            - table "微信客服会话列表" [ref=e214]:
              - row "客户 渠道 状态 房源/入住 最后消息 客服 操作" [ref=e215]:
                - columnheader "客户" [ref=e216]
                - columnheader "渠道" [ref=e217]
                - columnheader "状态" [ref=e218]
                - columnheader "房源/入住" [ref=e219]
                - columnheader "最后消息" [ref=e220]
                - columnheader "客服" [ref=e221]
                - columnheader "操作" [ref=e222]
              - row "Abraham160 3 美团民宿 待入住 顶层套房（浴缸巨幕电竞麻将） 2026-05-18 至 2026-05-19 客:暂不支持房客招呼消息，请发送入住指引 夜班接待 查看会话 WS-CV-006" [ref=e223]:
                - cell "Abraham160 3" [ref=e224]:
                  - strong [ref=e225]: Abraham160
                  - generic [ref=e226]: "3"
                - cell "美团民宿" [ref=e227]
                - cell "待入住" [ref=e228]:
                  - generic [ref=e229]: 待入住
                - cell "顶层套房（浴缸巨幕电竞麻将） 2026-05-18 至 2026-05-19" [ref=e230]:
                  - text: 顶层套房（浴缸巨幕电竞麻将）
                  - generic [ref=e231]: 2026-05-18 至 2026-05-19
                - cell "客:暂不支持房客招呼消息，请发送入住指引" [ref=e232]
                - cell "夜班接待" [ref=e233]
                - cell "查看会话 WS-CV-006" [ref=e234]:
                  - button "查看会话 WS-CV-006" [ref=e235] [cursor=pointer]
  - complementary "全部会话" [ref=e236]:
    - generic [ref=e237]:
      - strong [ref=e238]: 全部会话
      - generic [ref=e239]:
        - button "刷新会话" [ref=e240] [cursor=pointer]: ↻
        - button "收起会话" [ref=e241] [cursor=pointer]: 收起
    - generic [ref=e242]:
      - article [ref=e243]:
        - generic [ref=e245]:
          - generic [ref=e246]:
            - strong [ref=e247]: 携程民宿-【M335275070】
            - generic [ref=e248]: 咨询中
          - paragraph [ref=e249]:
            - emphasis [ref=e250]: 途家
            - text: 顶层套房（淞缇巨幕电竞麻将）
          - generic [ref=e251]: 我 加了
      - article [ref=e252]:
        - generic [ref=e254]:
          - generic [ref=e255]:
            - strong [ref=e256]: 携程民宿-【M566739056】
            - generic [ref=e257]: 咨询中
          - paragraph [ref=e258]:
            - emphasis [ref=e259]: 途家
            - text: 总裁套间（桦拿淞缇露台电竞麻将）
          - generic [ref=e260]: 我 已办理退房
      - article [ref=e261]:
        - generic [ref=e263]:
          - generic [ref=e264]:
            - strong [ref=e265]: 去哪民宿-【去哪儿用户】
            - generic [ref=e266]: 咨询中
          - paragraph [ref=e267]:
            - emphasis [ref=e268]: 途家 02.19-02.21（2晚）
            - text: 总裁套间（桦拿淞缇露台电竞麻将）
          - generic [ref=e269]: 我 人 有的
      - article [ref=e270]:
        - generic [ref=e272]:
          - generic [ref=e273]:
            - strong [ref=e274]: 携程民宿-【M614718025】
            - generic [ref=e275]: 咨询中
          - paragraph [ref=e276]:
            - emphasis [ref=e277]: 途家
            - text: 顶层套房（淞缇巨幕电竞麻将）
          - generic [ref=e278]: 我 什么时间段呢几号到几...
    - button "收起" [ref=e279] [cursor=pointer]
```

# Test source

```ts
  1   | import path from 'node:path'
  2   | import { fileURLToPath } from 'node:url'
  3   | import { expect, test } from '@playwright/test'
  4   | 
  5   | const __dirname = path.dirname(fileURLToPath(import.meta.url))
  6   | const artifactRoot = path.resolve(__dirname, '../artifacts/screenshots/scrm--kehu-goutong--weixin-kefu')
  7   | 
  8   | const reportEndpoint = '**/wxcp/kfAccount/report/get'
  9   | const accountEndpoint = '**/wxcp/kfAccount/page/get'
  10  | const pagePath = '/scrm/wechatService/manage?campId=1796067693589061634'
  11  | const appBaseURL = process.env.PMS_TEST_BASE_URL
  12  | 
  13  | function appUrl(routePath: string) {
  14  |   return appBaseURL ? `${appBaseURL}${routePath}` : routePath
  15  | }
  16  | 
  17  | test.beforeEach(async ({ page }) => {
  18  |   await page.setViewportSize({ width: 1440, height: 900 })
  19  |   await page.addInitScript(() => {
  20  |     window.localStorage.setItem('pms.wechatServiceProvider', 'mock')
  21  |     window.localStorage.removeItem('pms.wechatServiceMockState')
  22  |     window.localStorage.removeItem('pms.wechatService.lastRequest')
  23  |   })
  24  | })
  25  | 
  26  | test('/scrm/wechatService/manage renders provider-driven business dashboard without backend requests', async ({ page }) => {
  27  |   const requestedUrls: string[] = []
  28  |   await page.route(reportEndpoint, async (route) => {
  29  |     requestedUrls.push(route.request().url())
  30  |     await route.fulfill({ status: 500, json: { success: false, errorMsg: 'mock provider must not call report endpoint' } })
  31  |   })
  32  |   await page.route(accountEndpoint, async (route) => {
  33  |     requestedUrls.push(route.request().url())
  34  |     await route.fulfill({ status: 500, json: { success: false, errorMsg: 'mock provider must not call account endpoint' } })
  35  |   })
  36  | 
  37  |   await page.goto(appUrl(pagePath))
  38  | 
  39  |   await expect(page.getByRole('link', { name: '微信客服' })).toHaveClass(/is-active/)
  40  |   await expect(page.getByRole('heading', { name: '微信客服运营台' })).toBeVisible()
  41  |   await expect(page.getByRole('button', { name: '全部渠道' })).toBeVisible()
  42  |   await expect(page.getByRole('button', { name: '全部状态' })).toBeVisible()
  43  |   await expect(page.getByLabel('会话关键词')).toHaveAttribute('placeholder', '搜索客户、订单或消息')
  44  |   await expect(page.getByRole('button', { name: '查询' })).toBeVisible()
  45  |   await expect(page.getByRole('button', { name: '重置' })).toBeVisible()
  46  |   await expect(page.getByRole('button', { name: '刷新', exact: true })).toBeVisible()
  47  |   await expect(page.getByRole('button', { name: '导出' })).toBeVisible()
  48  | 
  49  |   await expect(page.getByLabel('微信客服核心指标')).toContainText('待处理会话')
  50  |   await expect(page.getByText('今日会话 128')).toBeVisible()
  51  |   await expect(page.getByText('平均响应 2分18秒')).toBeVisible()
  52  |   await expect(page.getByText('客服账号')).toBeVisible()
  53  |   await expect(page.getByText('会话队列')).toBeVisible()
  54  |   await expect(page.getByText('携程民宿-【M335275070】')).toBeVisible()
  55  |   await expect(page.getByText('天落会宿公寓')).toBeVisible()
  56  |   await expect(page.locator('.wechat-service-page')).not.toContainText(/mock 数据|mock provider|provider=mock|未接入|阻塞|后端未就绪|后端接口未完成/)
  57  |   expect(requestedUrls).toEqual([])
  58  | 
  59  |   const diagnostics = await readDiagnostics(page)
  60  |   expect(diagnostics).toMatchObject({
  61  |     provider: 'mock',
  62  |     endpoint: '/scrm/wechatService/dashboard',
  63  |     request: {
  64  |       campId: '1796067693589061634',
  65  |       channel: '',
  66  |       status: '',
  67  |       keyword: '',
  68  |       pageNum: 1,
  69  |       pageSize: 8,
  70  |     },
  71  |   })
  72  | 
  73  |   await page.screenshot({
  74  |     path: path.join(artifactRoot, 'business-dashboard-20260518.png'),
  75  |     fullPage: true,
  76  |   })
  77  | })
  78  | 
  79  | test('/scrm/wechatService/manage refreshes filters, export, details, and coordinated routes', async ({ page }) => {
  80  |   await page.goto(appUrl(pagePath))
  81  | 
  82  |   await page.getByRole('button', { name: '全部渠道' }).click()
  83  |   await page.getByRole('option', { name: '美团民宿' }).click()
  84  |   await page.getByRole('button', { name: '全部状态' }).click()
  85  |   await page.getByRole('option', { name: '待入住' }).click()
  86  |   await page.getByLabel('会话关键词').fill('Abraham160')
  87  |   await page.getByRole('button', { name: '查询' }).click()
  88  | 
  89  |   await expect(page.getByText('Abraham160')).toBeVisible()
> 90  |   await expect(page.getByText('携程民宿-【M335275070】')).toHaveCount(0)
      |                                                     ^ Error: expect(locator).toHaveCount(expected) failed
  91  |   let diagnostics = await waitForDiagnostics(page, (nextDiagnostics) =>
  92  |     Boolean(
  93  |       nextDiagnostics?.request?.channel === 'meituan' &&
  94  |         nextDiagnostics.request.status === 'pendingCheckIn' &&
  95  |         nextDiagnostics.request.keyword === 'Abraham160',
  96  |     ),
  97  |   )
  98  |   expect(diagnostics.request).toMatchObject({
  99  |     channel: 'meituan',
  100 |     status: 'pendingCheckIn',
  101 |     keyword: 'Abraham160',
  102 |   })
  103 | 
  104 |   await page.getByRole('button', { name: '刷新', exact: true }).click()
  105 |   await expect(page.getByRole('status')).toContainText('微信客服数据已刷新')
  106 | 
  107 |   await page.getByRole('button', { name: '导出' }).click()
  108 |   await expect(page.getByRole('status')).toContainText('导出任务已创建')
  109 |   diagnostics = await readDiagnostics(page)
  110 |   expect(diagnostics).toMatchObject({
  111 |     endpoint: '/scrm/wechatService/export',
  112 |     request: {
  113 |       channel: 'meituan',
  114 |       status: 'pendingCheckIn',
  115 |       keyword: 'Abraham160',
  116 |     },
  117 |   })
  118 | 
  119 |   await page.getByRole('button', { name: /查看会话 WS-CV-006/ }).click()
  120 |   await expect(page.getByRole('dialog', { name: '会话详情' })).toContainText('Abraham160')
  121 |   await expect(page.getByRole('dialog', { name: '会话详情' })).toContainText('顶层套房')
  122 |   await page.getByRole('button', { name: '标记已跟进' }).click()
  123 |   await expect(page.getByRole('status')).toContainText('会话已标记为已跟进')
  124 |   await page.getByRole('button', { name: '关闭详情' }).click()
  125 | 
  126 |   await page.getByRole('button', { name: '接待配置' }).click()
  127 |   await expect(page).toHaveURL(/\/scrm\/wechatService\/receptionConfig$/)
  128 |   await page.goto(appUrl(pagePath))
  129 |   await page.getByRole('button', { name: '聊天工具栏' }).click()
  130 |   await expect(page).toHaveURL(/\/scrm\/sidebar\/preview$/)
  131 | 
  132 |   await page.goto(appUrl(pagePath))
  133 |   await page.getByLabel('会话关键词').fill('Abraham160')
  134 |   await page.getByRole('button', { name: '重置' }).click()
  135 |   await expect(page.getByLabel('会话关键词')).toHaveValue('')
  136 |   await expect(page.getByRole('button', { name: '全部渠道' })).toBeVisible()
  137 |   await expect(page.getByRole('button', { name: '全部状态' })).toBeVisible()
  138 | })
  139 | 
  140 | test('/scrm/wechatService/manage exposes empty and error envelopes from mock provider', async ({ page }) => {
  141 |   await page.addInitScript(() => {
  142 |     window.localStorage.setItem('pms.wechatServiceMockState', 'empty')
  143 |   })
  144 |   await page.goto(appUrl(pagePath))
  145 | 
  146 |   await expect(page.getByLabel('会话队列').getByText('暂无微信客服会话')).toBeVisible()
  147 |   let diagnostics = await waitForDiagnostics(page)
  148 |   expect(diagnostics).toMatchObject({
  149 |     provider: 'mock',
  150 |     state: 'empty',
  151 |     traceId: 'mock-scrm--kehu-goutong--weixin-kefu-empty-001',
  152 |   })
  153 | 
  154 |   await page.evaluate(() => {
  155 |     window.localStorage.setItem('pms.wechatServiceMockState', 'error')
  156 |   })
  157 |   await page.getByRole('button', { name: '刷新', exact: true }).click()
  158 | 
  159 |   await expect(page.getByRole('alert')).toContainText('微信客服数据加载失败，请重试')
  160 |   await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
  161 |   diagnostics = await waitForDiagnostics(page)
  162 |   expect(diagnostics).toMatchObject({
  163 |     provider: 'mock',
  164 |     state: 'error',
  165 |     traceId: 'mock-scrm--kehu-goutong--weixin-kefu-error-001',
  166 |   })
  167 | })
  168 | 
  169 | test('/scrm/wechatService/manage can switch to captured real request contract', async ({ page }) => {
  170 |   await page.addInitScript(() => {
  171 |     window.localStorage.setItem('pms.wechatServiceProvider', 'api')
  172 |   })
  173 |   let reportPayload: Record<string, unknown> | null = null
  174 |   await page.route(reportEndpoint, async (route) => {
  175 |     reportPayload = route.request().postDataJSON() as Record<string, unknown>
  176 |     await route.fulfill({
  177 |       json: {
  178 |         success: true,
  179 |         errorMsg: null,
  180 |         errorDetail: null,
  181 |         data: {
  182 |           summary: {
  183 |             todaySessions: 7,
  184 |             pendingSessions: 2,
  185 |             averageReplySeconds: 96,
  186 |             conversionLeads: 3,
  187 |           },
  188 |           conversations: [
  189 |             {
  190 |               id: 'api-conv-1',
```