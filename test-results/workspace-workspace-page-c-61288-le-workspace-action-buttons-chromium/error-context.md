# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workspace.spec.ts >> workspace page clone >> gives feedback for visible workspace action buttons
- Location: tests\workspace.spec.ts:236:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: '一键上渠道' })
    - locator resolved to <button type="button">一键上渠道</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <header class="chat-dock__header">…</header> from <aside class="chat-dock" aria-label="全部会话">…</aside> subtree intercepts pointer events
  - retrying click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <p>…</p> from <aside class="chat-dock" aria-label="全部会话">…</aside> subtree intercepts pointer events
  - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <header class="chat-dock__header">…</header> from <aside class="chat-dock" aria-label="全部会话">…</aside> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    28 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <header class="chat-dock__header">…</header> from <aside class="chat-dock" aria-label="全部会话">…</aside> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <p>…</p> from <aside class="chat-dock" aria-label="全部会话">…</aside> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <header class="chat-dock__header">…</header> from <aside class="chat-dock" aria-label="全部会话">…</aside> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <header class="chat-dock__header">…</header> from <aside class="chat-dock" aria-label="全部会话">…</aside> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <header class="chat-dock__header">…</header> from <aside class="chat-dock" aria-label="全部会话">…</aside> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms

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
  - main [ref=e65]:
    - generic [ref=e66]:
      - status [ref=e67]: 请输入新的备忘录
      - region "首页核心概览" [ref=e68]:
        - region "房态概览" [ref=e69]:
          - button "预抵 2" [ref=e70] [cursor=pointer]:
            - generic [ref=e71]: 预抵
            - strong [ref=e72]: "2"
          - button "在住 2" [ref=e73] [cursor=pointer]:
            - generic [ref=e74]: 在住
            - strong [ref=e75]: "2"
          - button "预离 2" [ref=e76] [cursor=pointer]:
            - generic [ref=e77]: 预离
            - strong [ref=e78]: "2"
          - button "可售 3" [ref=e79] [cursor=pointer]:
            - generic [ref=e80]: 可售
            - strong [ref=e81]: "3"
        - region "房务概览" [ref=e82]:
          - button "维修房 0" [ref=e83] [cursor=pointer]:
            - generic [ref=e84]: 维修房
            - strong [ref=e85]: "0"
          - button "脏房 1" [ref=e86] [cursor=pointer]:
            - generic [ref=e87]: 脏房
            - strong [ref=e88]: "1"
        - region "异常概览" [ref=e89]:
          - button "异常 920" [ref=e90] [cursor=pointer]:
            - generic [ref=e91]: 异常
            - strong [ref=e92]: "920"
        - region "营收概览" [ref=e93]:
          - button "总营业收入 ￥571.37" [ref=e94] [cursor=pointer]:
            - generic [ref=e95]: 总营业收入
            - strong [ref=e96]: ￥571.37
        - button "班 交接班" [ref=e97] [cursor=pointer]:
          - generic [ref=e98]: 班
          - strong [ref=e99]: 交接班
        - article [ref=e100]:
          - generic [ref=e101]: 夜
          - generic [ref=e102]:
            - strong [ref=e103]: 夜审
            - button "立即开启夜审" [ref=e104] [cursor=pointer]
        - region "首页快捷入口" [ref=e105]:
          - link "房 房情表" [ref=e106] [cursor=pointer]:
            - /url: /statistics/roomSituation
            - generic [ref=e107]: 房
            - strong [ref=e108]: 房情表
          - link "收 收入报表" [ref=e109] [cursor=pointer]:
            - /url: /statistics/stay
            - generic [ref=e110]: 收
            - strong [ref=e111]: 收入报表
          - link "利 利润报表" [ref=e112] [cursor=pointer]:
            - /url: /statistics/profitReport
            - generic [ref=e113]: 利
            - strong [ref=e114]: 利润报表
      - generic [ref=e115]:
        - generic [ref=e116]:
          - generic [ref=e117]:
            - button "昨日" [ref=e118] [cursor=pointer]
            - button "本月" [ref=e119] [cursor=pointer]
          - link "查看详情" [ref=e120] [cursor=pointer]:
            - /url: /statistics/report
        - generic [ref=e121]:
          - article [ref=e122]:
            - generic [ref=e123]: 营业收入
            - strong [ref=e124]: ￥330.72
            - generic [ref=e125]:
              - generic [ref=e126]: 预计总收入 ￥0
              - generic [ref=e127]: 记一笔 ￥0 其他收入/支出 ￥0
          - article [ref=e128]:
            - generic [ref=e129]: 入住率OCC
            - strong [ref=e130]: 50%
            - generic [ref=e131]:
              - generic [ref=e132]: 已售房间数 2
              - generic [ref=e133]: 总房数 4
          - article [ref=e134]:
            - generic [ref=e135]: 平均客房收益RevPAR
            - strong [ref=e136]: ￥82.68
            - generic [ref=e137]:
              - generic [ref=e138]: 全日房 ￥330.72
              - generic [ref=e139]: 钟点房 ￥0
          - article [ref=e140]:
            - generic [ref=e141]: 平均房费ADR
            - strong [ref=e142]: ￥165.36
            - generic [ref=e143]:
              - generic [ref=e144]: 入住率OCC 50%
              - generic [ref=e145]: 平均房费ADR ￥165.36
      - generic [ref=e146]:
        - generic [ref=e147]:
          - generic [ref=e148]:
            - button "本周" [ref=e149] [cursor=pointer]
            - button "上周" [ref=e150] [cursor=pointer]
          - link "查看详情" [ref=e151] [cursor=pointer]:
            - /url: /statistics/report
        - generic [ref=e152]:
          - button "营业收入" [ref=e153] [cursor=pointer]
          - button "入住率OCC" [ref=e154] [cursor=pointer]
          - button "平均房费ADR" [ref=e155] [cursor=pointer]
          - button "平均客房收益RevPAR" [ref=e156] [cursor=pointer]
          - button "已售房间数" [ref=e157] [cursor=pointer]
        - generic [ref=e158]:
          - generic [ref=e159]:
            - generic [ref=e161]: "1200"
            - generic [ref=e164]: "900"
            - generic [ref=e167]: "600"
            - generic [ref=e170]: "300"
            - generic [ref=e173]: "0"
            - generic [ref=e175]:
              - generic [ref=e176]: 2026/05
              - generic [ref=e177]: 2026/05
              - generic [ref=e178]: 2026/05
              - generic [ref=e179]: 2026/05
              - generic [ref=e180]: 2026/05
              - generic [ref=e181]: 2026/05
              - generic [ref=e182]: 2026/05
          - list [ref=e185]:
            - listitem [ref=e186]:
              - generic [ref=e188]: 携程
              - strong [ref=e189]: 33.33%
            - listitem [ref=e190]:
              - generic [ref=e192]: 美团酒店
              - strong [ref=e193]: 33.33%
            - listitem [ref=e194]:
              - generic [ref=e196]: 飞猪淘酒店
              - strong [ref=e197]: 33.33%
      - generic [ref=e198]:
        - generic [ref=e199]:
          - generic [ref=e200]:
            - button "预抵" [ref=e201] [cursor=pointer]
            - button "在住" [ref=e202] [cursor=pointer]
            - button "预离" [ref=e203] [cursor=pointer]
          - textbox [ref=e205]:
            - /placeholder: 请输入姓名/手机号
          - link "查看全部订单" [ref=e206] [cursor=pointer]:
            - /url: /order/house-order/list
        - table [ref=e207]:
          - rowgroup [ref=e208]:
            - row "来源 姓名 手机号 房型 房间 入离时间 房晚 状态 操作" [ref=e209]:
              - columnheader "来源" [ref=e210]
              - columnheader "姓名" [ref=e211]
              - columnheader "手机号" [ref=e212]
              - columnheader "房型" [ref=e213]
              - columnheader "房间" [ref=e214]
              - columnheader "入离时间" [ref=e215]
              - columnheader "房晚" [ref=e216]
              - columnheader "状态" [ref=e217]
              - columnheader "操作" [ref=e218]
          - rowgroup [ref=e219]:
            - row "飞猪淘酒店 黄国辉 +8617328513805 顶层套房（浴缸巨幕电竞麻将） - 05.16 15:00至05.23 12:00 7 待入住 排房 住客资料 查看订单" [ref=e220]:
              - cell "飞猪淘酒店" [ref=e221]
              - cell "黄国辉" [ref=e222]
              - cell "+8617328513805" [ref=e223]
              - cell "顶层套房（浴缸巨幕电竞麻将）" [ref=e224]
              - cell "-" [ref=e225]
              - cell "05.16 15:00至05.23 12:00" [ref=e226]
              - cell "7" [ref=e227]
              - cell "待入住" [ref=e228]
              - cell "排房 住客资料 查看订单" [ref=e229]:
                - button "排房" [ref=e230] [cursor=pointer]: 排
                - button "住客资料" [ref=e231] [cursor=pointer]: 客
                - button "查看订单" [ref=e232] [cursor=pointer]: 看
            - row "携程 闵尊海 - 天落大床电竞套间 1 05.16 15:00至05.17 15:00 1 待入住 排房 住客资料 查看订单" [ref=e233]:
              - cell "携程" [ref=e234]
              - cell "闵尊海" [ref=e235]
              - cell "-" [ref=e236]
              - cell "天落大床电竞套间" [ref=e237]
              - cell "1" [ref=e238]
              - cell "05.16 15:00至05.17 15:00" [ref=e239]
              - cell "1" [ref=e240]
              - cell "待入住" [ref=e241]
              - cell "排房 住客资料 查看订单" [ref=e242]:
                - button "排房" [ref=e243] [cursor=pointer]: 排
                - button "住客资料" [ref=e244] [cursor=pointer]: 客
                - button "查看订单" [ref=e245] [cursor=pointer]: 看
      - generic [ref=e246]:
        - generic [ref=e248]:
          - button "待办事项" [ref=e249] [cursor=pointer]
          - button "产品动态" [ref=e250] [cursor=pointer]
        - generic [ref=e251]: 暂无数据
      - generic [ref=e252]:
        - generic [ref=e254]:
          - button "待处理" [ref=e255] [cursor=pointer]
          - button "已处理" [ref=e256] [cursor=pointer]
        - generic [ref=e257]: 暂无数据
        - generic [ref=e258]:
          - textbox "请输入新的备忘录" [ref=e259]
          - button "提交" [active] [ref=e260] [cursor=pointer]
      - complementary [ref=e261]:
        - generic [ref=e262]:
          - strong [ref=e263]:
            - text: 帮您实现
            - text: 全网同价
          - button "点我设置" [ref=e264] [cursor=pointer]
        - generic [ref=e265]:
          - generic [ref=e266]:
            - paragraph [ref=e267]:
              - text: 门店流量获取能力
              - strong [ref=e268]: 较好
            - button "一键上渠道" [ref=e269] [cursor=pointer]
          - generic [ref=e270]:
            - heading "OTA流量" [level=3] [ref=e271]
            - generic [ref=e272]:
              - generic [ref=e273]: tujia
              - generic [ref=e274]: 美团
              - generic [ref=e275]: 抖音
              - generic [ref=e276]: 携程
              - generic [ref=e277]: 美团
              - generic [ref=e278]: 飞猪
              - generic [ref=e279]: 木鸟
              - generic [ref=e280]: Air
              - generic [ref=e281]: B.
              - generic [ref=e282]: T.
          - generic [ref=e283]:
            - heading "社媒流量" [level=3] [ref=e284]
            - generic [ref=e285]:
              - generic [ref=e286]: 小红书
              - generic [ref=e287]: 抖音
              - generic [ref=e288]: 视频号
          - generic [ref=e289]:
            - heading "私域流量" [level=3] [ref=e290]
            - generic [ref=e291]:
              - generic [ref=e292]: 官网
              - generic [ref=e293]: 小程序
              - generic [ref=e294]: 会员
          - paragraph [ref=e295]: 建议：小红书和抖音渠道暂未开通，渠道每天上亿流量，搭载图文和视频，能够快速吸引用户，促成下单。
  - complementary "全部会话" [ref=e296]:
    - generic [ref=e297]:
      - strong [ref=e298]: 全部会话
      - generic [ref=e299]:
        - button "刷新会话" [ref=e300] [cursor=pointer]: ↻
        - button "收起会话" [ref=e301] [cursor=pointer]: 收起
    - generic [ref=e302]:
      - article [ref=e303]:
        - generic [ref=e305]:
          - generic [ref=e306]:
            - strong [ref=e307]: 携程民宿-【M335275070】
            - generic [ref=e308]: 咨询中
          - paragraph [ref=e309]:
            - emphasis [ref=e310]: 途家
            - text: 顶层套房（淞缇巨幕电竞麻将）
          - generic [ref=e311]: 我 加了
      - article [ref=e312]:
        - generic [ref=e314]:
          - generic [ref=e315]:
            - strong [ref=e316]: 携程民宿-【M566739056】
            - generic [ref=e317]: 咨询中
          - paragraph [ref=e318]:
            - emphasis [ref=e319]: 途家
            - text: 总裁套间（桦拿淞缇露台电竞麻将）
          - generic [ref=e320]: 我 已办理退房
      - article [ref=e321]:
        - generic [ref=e323]:
          - generic [ref=e324]:
            - strong [ref=e325]: 去哪民宿-【去哪儿用户】
            - generic [ref=e326]: 咨询中
          - paragraph [ref=e327]:
            - emphasis [ref=e328]: 途家 02.19-02.21（2晚）
            - text: 总裁套间（桦拿淞缇露台电竞麻将）
          - generic [ref=e329]: 我 人 有的
      - article [ref=e330]:
        - generic [ref=e332]:
          - generic [ref=e333]:
            - strong [ref=e334]: 携程民宿-【M614718025】
            - generic [ref=e335]: 咨询中
          - paragraph [ref=e336]:
            - emphasis [ref=e337]: 途家
            - text: 顶层套房（淞缇巨幕电竞麻将）
          - generic [ref=e338]: 我 什么时间段呢几号到几...
    - button "收起" [ref=e339] [cursor=pointer]
```

# Test source

```ts
  153 |             channelInfos: [
  154 |               { channelName: '路客云聚合', isApplyOpen: 1 },
  155 |               { channelName: '飞猪酒店直连', isApplyOpen: 1 },
  156 |             ],
  157 |           },
  158 |         }),
  159 |       })
  160 |       return
  161 |     }
  162 | 
  163 |     await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) })
  164 |   })
  165 | }
  166 | 
  167 | test.describe('workspace page clone', () => {
  168 |   test.beforeEach(async ({ page }) => {
  169 |     await page.setViewportSize({ width: 1440, height: 900 })
  170 |     await mockWorkspaceApis(page)
  171 |     await page.goto('/workspace')
  172 |   })
  173 | 
  174 |   test('loads captured target data through real endpoint contracts', async ({ page }) => {
  175 |     await expect(page.locator('.page-content:has(.workspace-home) .page-header')).toBeHidden()
  176 | 
  177 |     await expect(page.getByTestId('workspace-metric-arrivals')).toContainText('预抵')
  178 |     await expect(page.getByTestId('workspace-metric-arrivals')).toContainText('2')
  179 |     await expect(page.getByTestId('workspace-metric-staying')).toContainText('在住')
  180 |     await expect(page.getByTestId('workspace-metric-staying')).toContainText('2')
  181 |     await expect(page.getByTestId('workspace-metric-revenue')).toContainText('￥571.37')
  182 |     expect(workspaceApiCalls.some((call) => call.url.endsWith('/report/homePage/v2'))).toBe(true)
  183 |     expect(workspaceApiCalls.some((call) => call.url.endsWith('/orders/get') && call.body.orderType === '11')).toBe(true)
  184 | 
  185 |     await expect(page.getByText('交接班')).toBeVisible()
  186 |     await expect(page.getByText('夜审', { exact: true })).toBeVisible()
  187 |     await expect(page.getByRole('button', { name: '立即开启夜审' })).toBeVisible()
  188 |     await expect(page.getByText('房情表')).toBeVisible()
  189 |     await expect(page.getByText('收入报表')).toBeVisible()
  190 |     await expect(page.getByText('利润报表')).toBeVisible()
  191 | 
  192 |     await expect(page.getByTestId('workspace-order-row')).toHaveCount(2)
  193 |     await expect(page.getByText('黄国辉')).toBeVisible()
  194 |     await expect(page.getByText('闵尊海')).toBeVisible()
  195 | 
  196 |     await expect(page.getByText('门店流量获取能力')).toBeVisible()
  197 |     await expect(page.getByText('一键上渠道')).toBeVisible()
  198 |     await expect(page.getByText('OTA流量')).toBeVisible()
  199 |     await expect(page.getByText('社媒流量')).toBeVisible()
  200 |     await expect(page.getByText('私域流量')).toBeVisible()
  201 |   })
  202 | 
  203 |   test('supports captured workspace interactions', async ({ page }) => {
  204 |     await expect(page.getByTestId('workspace-revenue-card')).toContainText('￥330.72')
  205 |     await page.getByRole('button', { name: '本月' }).first().click()
  206 |     await expect(page.getByTestId('workspace-revenue-card')).toContainText('￥9789.55')
  207 |     await expect(page.getByTestId('workspace-occ-card')).toContainText('54.69%')
  208 | 
  209 |     await page.getByRole('button', { name: '上周' }).click()
  210 |     await expect(page.getByTestId('workspace-chart-dates')).toContainText('05/04')
  211 |     await expect(page.getByTestId('workspace-chart-dates')).toContainText('05/10')
  212 | 
  213 |     await page.getByRole('button', { name: '产品动态' }).click()
  214 |     await expect(page.getByTestId('workspace-todo-panel')).toContainText('绑定微信账号')
  215 | 
  216 |     await page.getByTestId('workspace-metric-staying').click()
  217 |     await expect(page).toHaveURL(/\/statistics\/roomSituation$/)
  218 |   })
  219 | 
  220 |   test('exposes API failures with retry instead of silent fallback', async ({ page }) => {
  221 |     await page.unroute(`${HUDSON_API}/**`)
  222 |     await page.route(`${HUDSON_API}/**`, async (route) => {
  223 |       if (route.request().url().endsWith('/report/homePage/v2')) {
  224 |         await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false, errorMsg: 'server down' }) })
  225 |         return
  226 |       }
  227 | 
  228 |       await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, data: { list: [] } }) })
  229 |     })
  230 | 
  231 |     await page.goto('/workspace')
  232 |     await expect(page.getByRole('alert')).toContainText('首页数据请求失败')
  233 |     await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
  234 |   })
  235 | 
  236 |   test('gives feedback for visible workspace action buttons', async ({ page }) => {
  237 |     await page.getByRole('button', { name: '立即开启夜审' }).click()
  238 |     await expect(page.getByRole('status')).toContainText('夜审接口未接入')
  239 | 
  240 |     await page.getByRole('button', { name: '排' }).first().click()
  241 |     await expect(page.getByRole('status')).toContainText('排房入口')
  242 | 
  243 |     await page.getByRole('button', { name: '住客资料' }).first().click()
  244 |     await expect(page.getByRole('status')).toContainText('住客资料')
  245 | 
  246 |     await page.getByRole('button', { name: '看' }).first().click()
  247 |     await expect(page.getByRole('dialog', { name: '订单详情' })).toContainText('黄国辉')
  248 |     await page.getByRole('button', { name: '关闭订单详情' }).click()
  249 | 
  250 |     await page.getByRole('button', { name: '提交' }).click()
  251 |     await expect(page.getByRole('status')).toContainText('请输入新的备忘录')
  252 | 
> 253 |     await page.getByRole('button', { name: '一键上渠道' }).click()
      |                                                       ^ Error: locator.click: Test timeout of 60000ms exceeded.
  254 |     await expect(page).toHaveURL(/\/channels\/ota$/)
  255 |   })
  256 | 
  257 |   test('navigates from workspace detail links to report and orders pages', async ({ page }) => {
  258 |     await page.getByRole('link', { name: '查看详情' }).first().click()
  259 |     await expect(page).toHaveURL(/\/statistics\/report$/)
  260 |     await expect(page.getByRole('link', { name: '统计概览' })).toHaveClass(/is-active/)
  261 | 
  262 |     await page.goto('/workspace')
  263 |     await page.getByRole('link', { name: '查看全部订单' }).click()
  264 |     await expect(page).toHaveURL(/\/order\/house-order\/list$/)
  265 |     await expect(page.getByRole('link', { name: '住宿订单' })).toHaveClass(/is-active/)
  266 |   })
  267 | 
  268 |   test('matches target topbar action toolbar and dropdown interactions', async ({ page }) => {
  269 |     const toolbar = page.getByLabel('顶部工具栏')
  270 |     const topbarBox = await page.locator('.topbar').boundingBox()
  271 |     const toolbarBox = await page.locator('.topbar-actions').boundingBox()
  272 | 
  273 |     expect(topbarBox?.height).toBe(52)
  274 |     expect(toolbarBox?.x).toBeCloseTo(1118, 0)
  275 |     expect(Math.abs((toolbarBox?.y ?? 0) - 10)).toBeLessThanOrEqual(1)
  276 |     expect(toolbarBox?.width).toBe(314)
  277 |     expect(toolbarBox?.height).toBe(32)
  278 | 
  279 |     await expect(toolbar.getByRole('link', { name: '应用订阅' })).toBeVisible()
  280 |     await expect(toolbar.getByText('限时试用')).toBeVisible()
  281 |     await expect(toolbar.getByRole('button', { name: '消息' })).toBeVisible()
  282 |     await expect(toolbar.getByRole('button', { name: '收款' })).toBeVisible()
  283 |     await expect(toolbar.getByRole('button', { name: '接待' })).toBeVisible()
  284 |     await expect(toolbar.getByRole('button', { name: '门锁' })).toBeVisible()
  285 |     await expect(toolbar.getByRole('button', { name: '客服' })).toBeVisible()
  286 |     await expect(toolbar.getByRole('button', { name: '通知' })).toBeVisible()
  287 |     await expect(toolbar.getByRole('button', { name: '用户菜单' })).toBeVisible()
  288 | 
  289 |     await toolbar.getByRole('button', { name: '消息' }).click()
  290 |     await expect(page.locator('.chat-dock')).toBeVisible()
  291 | 
  292 |     await toolbar.getByRole('button', { name: '收款' }).click()
  293 |     await expect(page.getByRole('dialog', { name: '收款' })).toContainText('收款方式')
  294 |     await page.getByRole('button', { name: '关闭收款' }).click()
  295 | 
  296 |     await toolbar.getByRole('button', { name: '客服' }).click()
  297 |     await expect(page.getByRole('dialog', { name: '路客云AI客服' })).toContainText('如何调整房价?')
  298 |     await page.getByRole('button', { name: '关闭客服' }).click()
  299 | 
  300 |     await toolbar.getByRole('button', { name: '用户菜单' }).click()
  301 |     await expect(page.getByRole('dialog', { name: '用户菜单面板' })).toContainText('路客云 6TS5 的店铺')
  302 |     await expect(page.getByRole('dialog', { name: '用户菜单面板' }).getByRole('link', { name: '门店信息' })).toBeVisible()
  303 | 
  304 |     await toolbar.getByRole('button', { name: '接待' }).click()
  305 |     await expect(page).toHaveURL(/\/statistics\/shift\/record$/)
  306 | 
  307 |     await page.goto('/workspace')
  308 |     await page.getByLabel('顶部工具栏').getByRole('button', { name: '门锁' }).click()
  309 |     await expect(page).toHaveURL(/\/smartHotel\/smartHardware\/smartLook$/)
  310 | 
  311 |     await page.goto('/workspace')
  312 |     await page.getByLabel('顶部工具栏').getByRole('button', { name: '通知' }).click()
  313 |     await expect(page).toHaveURL(/\/setting\/notification$/)
  314 | 
  315 |     await page.goto('/workspace')
  316 |     await toolbar.getByRole('link', { name: '应用订阅' }).click()
  317 |     await expect(page).toHaveURL(/\/version\/applicationPayment$/)
  318 |   })
  319 | 
  320 |   test('aligns dashboard panels by grid rows', async ({ page }) => {
  321 |     const tolerance = 2
  322 | 
  323 |     async function getBox(selector: string) {
  324 |       const box = await page.locator(selector).boundingBox()
  325 |       expect(box, selector).not.toBeNull()
  326 |       return box!
  327 |     }
  328 | 
  329 |     async function expectSameRow(selectors: string[]) {
  330 |       const boxes = await Promise.all(selectors.map(getBox))
  331 |       const tops = boxes.map((box) => box.y)
  332 |       const bottoms = boxes.map((box) => box.y + box.height)
  333 | 
  334 |       expect(Math.max(...tops) - Math.min(...tops), selectors.join(', ')).toBeLessThanOrEqual(tolerance)
  335 |       expect(Math.max(...bottoms) - Math.min(...bottoms), selectors.join(', ')).toBeLessThanOrEqual(tolerance)
  336 |     }
  337 | 
  338 |     await expect(page.locator('.metrics-strip .metric-card')).toHaveCount(4)
  339 |     await expect(page.locator('.workspace-stat-group--housekeeping .metric-card')).toHaveCount(2)
  340 |     await expect(page.locator('.workspace-quick-strip .workspace-quick-card--report')).toHaveCount(3)
  341 | 
  342 |     await expectSameRow([
  343 |       '.metrics-strip',
  344 |       '.workspace-stat-group--housekeeping',
  345 |       '.workspace-stat-group--exception',
  346 |       '.workspace-stat-group--revenue',
  347 |       '.workspace-quick-card--shift',
  348 |       '.workspace-quick-card--night',
  349 |       '.workspace-quick-strip',
  350 |     ])
  351 |     await expectSameRow(['.workspace-revenue', '.chart-panel', '.memo-panel'])
  352 |     await expectSameRow(['.workspace-orders-panel', '[data-testid="workspace-todo-panel"]', '.workspace-traffic-panel'])
  353 | 
```