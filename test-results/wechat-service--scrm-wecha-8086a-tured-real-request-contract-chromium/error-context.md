# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: wechat-service.spec.ts >> /scrm/wechatService/manage can switch to captured real request contract
- Location: tests\wechat-service.spec.ts:169:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('接口客服')
Expected: visible
Error: strict mode violation: getByText('接口客服') resolved to 2 elements:
    1) <strong>接口客服</strong> aka getByRole('button', { name: '接口客服 在线 今日会话 7 1分36秒 评分' })
    2) <div role="cell">接口客服</div> aka getByRole('cell', { name: '接口客服' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('接口客服')

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
          - button "全部渠道" [ref=e144] [cursor=pointer]
          - button "全部状态" [ref=e146] [cursor=pointer]
          - generic [ref=e147]:
            - generic [ref=e148]: 关键词
            - textbox "会话关键词" [ref=e149]:
              - /placeholder: 搜索客户、订单或消息
          - generic [ref=e150]:
            - button "查询" [ref=e151] [cursor=pointer]
            - button "重置" [ref=e152] [cursor=pointer]
            - button "刷新" [ref=e153] [cursor=pointer]
            - button "导出" [ref=e154] [cursor=pointer]
        - region "微信客服核心指标" [ref=e155]:
          - button "今日会话 7" [ref=e156] [cursor=pointer]:
            - generic [ref=e157]: 今日会话
            - strong [ref=e158]: "7"
          - button "待处理会话 2" [ref=e159] [cursor=pointer]:
            - generic [ref=e160]: 待处理会话
            - strong [ref=e161]: "2"
          - button "平均响应 1分36秒" [ref=e162] [cursor=pointer]:
            - generic [ref=e163]: 平均响应
            - strong [ref=e164]: 1分36秒
          - button "转化线索 3" [ref=e165] [cursor=pointer]:
            - generic [ref=e166]: 转化线索
            - strong [ref=e167]: "3"
        - main [ref=e168]:
          - region "客服账号" [ref=e169]:
            - generic [ref=e170]:
              - heading "客服账号" [level=2] [ref=e171]
              - generic [ref=e172]: 0% 响应率
            - button "接口客服 在线 今日会话 7 1分36秒 评分 98" [ref=e174] [cursor=pointer]:
              - generic [ref=e175]:
                - strong [ref=e176]: 接口客服
                - emphasis [ref=e177]: 在线
              - generic [ref=e178]: 今日会话 7
              - generic [ref=e179]: 1分36秒
              - generic [ref=e180]: 评分 98
          - region "待办提醒" [ref=e181]:
            - generic [ref=e182]:
              - heading "待办提醒" [level=2] [ref=e183]
              - generic [ref=e184]: 2026-05-18
            - generic [ref=e185]:
              - button "1 待回复会话" [ref=e186] [cursor=pointer]:
                - strong [ref=e187]: "1"
                - generic [ref=e188]: 待回复会话
              - button "6 待入住咨询" [ref=e189] [cursor=pointer]:
                - strong [ref=e190]: "6"
                - generic [ref=e191]: 待入住咨询
              - button "3 需转接客服" [ref=e192] [cursor=pointer]:
                - strong [ref=e193]: "3"
                - generic [ref=e194]: 需转接客服
          - region "会话队列" [ref=e195]:
            - generic [ref=e196]:
              - heading "会话队列" [level=2] [ref=e197]
              - generic [ref=e198]: 1 条
            - table "微信客服会话列表" [ref=e199]:
              - row "客户 渠道 状态 房源/入住 最后消息 客服 操作" [ref=e200]:
                - columnheader "客户" [ref=e201]
                - columnheader "渠道" [ref=e202]
                - columnheader "状态" [ref=e203]
                - columnheader "房源/入住" [ref=e204]
                - columnheader "最后消息" [ref=e205]
                - columnheader "客服" [ref=e206]
                - columnheader "操作" [ref=e207]
              - row "接口客户 1 美团民宿 咨询中 接口房型 2026-05-20 至 2026-05-21 接口返回的会话消息 接口客服 查看会话 api-conv-1" [ref=e208]:
                - cell "接口客户 1" [ref=e209]:
                  - strong [ref=e210]: 接口客户
                  - generic [ref=e211]: "1"
                - cell "美团民宿" [ref=e212]
                - cell "咨询中" [ref=e213]:
                  - generic [ref=e214]: 咨询中
                - cell "接口房型 2026-05-20 至 2026-05-21" [ref=e215]:
                  - text: 接口房型
                  - generic [ref=e216]: 2026-05-20 至 2026-05-21
                - cell "接口返回的会话消息" [ref=e217]
                - cell "接口客服" [ref=e218]
                - cell "查看会话 api-conv-1" [ref=e219]:
                  - button "查看会话 api-conv-1" [ref=e220] [cursor=pointer]
  - complementary "全部会话" [ref=e221]:
    - generic [ref=e222]:
      - strong [ref=e223]: 全部会话
      - generic [ref=e224]:
        - button "刷新会话" [ref=e225] [cursor=pointer]: ↻
        - button "收起会话" [ref=e226] [cursor=pointer]: 收起
    - generic [ref=e227]:
      - article [ref=e228]:
        - generic [ref=e230]:
          - generic [ref=e231]:
            - strong [ref=e232]: 携程民宿-【M335275070】
            - generic [ref=e233]: 咨询中
          - paragraph [ref=e234]:
            - emphasis [ref=e235]: 途家
            - text: 顶层套房（淞缇巨幕电竞麻将）
          - generic [ref=e236]: 我 加了
      - article [ref=e237]:
        - generic [ref=e239]:
          - generic [ref=e240]:
            - strong [ref=e241]: 携程民宿-【M566739056】
            - generic [ref=e242]: 咨询中
          - paragraph [ref=e243]:
            - emphasis [ref=e244]: 途家
            - text: 总裁套间（桦拿淞缇露台电竞麻将）
          - generic [ref=e245]: 我 已办理退房
      - article [ref=e246]:
        - generic [ref=e248]:
          - generic [ref=e249]:
            - strong [ref=e250]: 去哪民宿-【去哪儿用户】
            - generic [ref=e251]: 咨询中
          - paragraph [ref=e252]:
            - emphasis [ref=e253]: 途家 02.19-02.21（2晚）
            - text: 总裁套间（桦拿淞缇露台电竞麻将）
          - generic [ref=e254]: 我 人 有的
      - article [ref=e255]:
        - generic [ref=e257]:
          - generic [ref=e258]:
            - strong [ref=e259]: 携程民宿-【M614718025】
            - generic [ref=e260]: 咨询中
          - paragraph [ref=e261]:
            - emphasis [ref=e262]: 途家
            - text: 顶层套房（淞缇巨幕电竞麻将）
          - generic [ref=e263]: 我 什么时间段呢几号到几...
    - button "收起" [ref=e264] [cursor=pointer]
```

# Test source

```ts
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
  191 |               customerName: '接口客户',
  192 |               channel: 'meituan',
  193 |               status: 'consulting',
  194 |               orderStatus: 'consulting',
  195 |               stayDate: '2026-05-20 至 2026-05-21',
  196 |               roomType: '接口房型',
  197 |               lastMessage: '接口返回的会话消息',
  198 |               lastMessageAt: '2026-05-18 15:20:00',
  199 |               assignee: '接口客服',
  200 |               unread: 1,
  201 |             },
  202 |           ],
  203 |         },
  204 |       },
  205 |     })
  206 |   })
  207 |   await page.route(accountEndpoint, async (route) => {
  208 |     await route.fulfill({
  209 |       json: {
  210 |         success: true,
  211 |         errorMsg: null,
  212 |         errorDetail: null,
  213 |         data: {
  214 |           total: 1,
  215 |           list: [
  216 |             {
  217 |               id: 'api-account-1',
  218 |               name: '接口客服',
  219 |               status: 'online',
  220 |               todaySessions: 7,
  221 |               averageReplySeconds: 96,
  222 |               serviceScore: 98,
  223 |             },
  224 |           ],
  225 |         },
  226 |       },
  227 |     })
  228 |   })
  229 | 
  230 |   await page.goto(appUrl(pagePath))
  231 | 
  232 |   await expect(page.getByText('接口返回的会话消息')).toBeVisible()
> 233 |   await expect(page.getByText('接口客服')).toBeVisible()
      |                                        ^ Error: expect(locator).toBeVisible() failed
  234 |   expect(reportPayload).toMatchObject({
  235 |     campId: '1796067693589061634',
  236 |     channel: '',
  237 |     status: '',
  238 |     keyword: '',
  239 |     pageNum: 1,
  240 |     pageSize: 8,
  241 |   })
  242 |   const diagnostics = await readDiagnostics(page)
  243 |   expect(diagnostics).toMatchObject({
  244 |     provider: 'api',
  245 |     endpoint: 'https://hudson-prod.localhome.cn/wxcp/kfAccount/report/get',
  246 |   })
  247 | })
  248 | 
  249 | async function readDiagnostics(page: import('@playwright/test').Page) {
  250 |   return page.evaluate(() => {
  251 |     const rawValue = window.localStorage.getItem('pms.wechatService.lastRequest')
  252 |     return rawValue ? JSON.parse(rawValue) : null
  253 |   })
  254 | }
  255 | 
  256 | async function waitForDiagnostics(
  257 |   page: import('@playwright/test').Page,
  258 |   predicate: (diagnostics: Awaited<ReturnType<typeof readDiagnostics>>) => boolean = Boolean,
  259 | ) {
  260 |   await expect.poll(async () => predicate(await readDiagnostics(page))).toBe(true)
  261 |   return readDiagnostics(page)
  262 | }
  263 | 
```