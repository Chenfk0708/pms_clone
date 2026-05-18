# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: distribution-displacement.spec.ts >> /channels/distribution/distributiondisplacement renders contract empty state without breaking layout
- Location: tests\distribution-displacement.spec.ts:87:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('暂无置换明细')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('暂无置换明细')

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
    - complementary "置换权益侧边导航" [ref=e65]:
      - generic [ref=e66]:
        - button "聚合分销" [expanded] [ref=e67] [cursor=pointer]:
          - img [ref=e68]
          - heading "聚合分销" [level=2] [ref=e73]
          - img [ref=e74]
        - generic [ref=e76]:
          - link "分销列表" [ref=e77] [cursor=pointer]:
            - /url: /channels/distribution/distributionSecond
          - link "聚合分销订单" [ref=e78] [cursor=pointer]:
            - /url: /channels/distribution/distributionOrderSettlement
          - link "置换权益" [ref=e79] [cursor=pointer]:
            - /url: /channels/distribution/distributiondisplacement
    - main [ref=e80]:
      - generic [ref=e81]:
        - heading "置换权益" [level=1] [ref=e82]
        - region "置换概况" [ref=e83]:
          - generic [ref=e84]:
            - heading "置换概况" [level=2] [ref=e85]
            - button "申请尾房置换" [ref=e86] [cursor=pointer]
          - generic [ref=e87]:
            - article [ref=e88]:
              - text: "待置换金额:"
              - strong [ref=e89]: "-"
            - article [ref=e90]:
              - text: "已置换金额:"
              - strong [ref=e91]: "-"
        - region "置换明细" [ref=e92]:
          - generic [ref=e93]:
            - heading "置换明细" [level=2] [ref=e94]
            - text: "?"
          - group "日期筛选" [ref=e95]:
            - text: "日期筛选:"
            - button "日期筛选 全部" [ref=e96] [cursor=pointer]: 全部
            - group "日期范围" [ref=e97]:
              - textbox "开始日期" [ref=e98]
              - emphasis [ref=e99]: ~
              - textbox "结束日期" [ref=e100]
          - generic "置换明细表格" [ref=e101]:
            - generic [ref=e102]:
              - generic [ref=e103]: 序号
              - generic [ref=e104]: 订单号/渠道单号
              - generic [ref=e105]: 置换月份
              - generic [ref=e106]: 渠道
              - generic [ref=e107]: 房型
              - generic [ref=e108]: 房间
              - generic [ref=e109]: 联系人
              - generic [ref=e110]: 手机号
              - generic [ref=e111]: 入住状态
              - generic [ref=e112]: 结算状态
              - generic [ref=e113]: 入离日期
              - generic [ref=e114]: 结算日期
              - generic [ref=e115]: 结算金额
              - generic [ref=e116]: 置换金额
            - paragraph [ref=e119]: 暂无数据
  - complementary "全部会话" [ref=e120]:
    - generic [ref=e121]:
      - strong [ref=e122]: 全部会话
      - generic [ref=e123]:
        - button "刷新会话" [ref=e124] [cursor=pointer]: ↻
        - button "收起会话" [ref=e125] [cursor=pointer]: 收起
    - generic [ref=e126]:
      - article [ref=e127]:
        - generic [ref=e129]:
          - generic [ref=e130]:
            - strong [ref=e131]: 携程民宿-【M335275070】
            - generic [ref=e132]: 咨询中
          - paragraph [ref=e133]:
            - emphasis [ref=e134]: 途家
            - text: 顶层套房（淞缇巨幕电竞麻将）
          - generic [ref=e135]: 我 加了
      - article [ref=e136]:
        - generic [ref=e138]:
          - generic [ref=e139]:
            - strong [ref=e140]: 携程民宿-【M566739056】
            - generic [ref=e141]: 咨询中
          - paragraph [ref=e142]:
            - emphasis [ref=e143]: 途家
            - text: 总裁套间（桦拿淞缇露台电竞麻将）
          - generic [ref=e144]: 我 已办理退房
      - article [ref=e145]:
        - generic [ref=e147]:
          - generic [ref=e148]:
            - strong [ref=e149]: 去哪民宿-【去哪儿用户】
            - generic [ref=e150]: 咨询中
          - paragraph [ref=e151]:
            - emphasis [ref=e152]: 途家 02.19-02.21（2晚）
            - text: 总裁套间（桦拿淞缇露台电竞麻将）
          - generic [ref=e153]: 我 人 有的
      - article [ref=e154]:
        - generic [ref=e156]:
          - generic [ref=e157]:
            - strong [ref=e158]: 携程民宿-【M614718025】
            - generic [ref=e159]: 咨询中
          - paragraph [ref=e160]:
            - emphasis [ref=e161]: 途家
            - text: 顶层套房（淞缇巨幕电竞麻将）
          - generic [ref=e162]: 我 什么时间段呢几号到几...
    - button "收起" [ref=e163] [cursor=pointer]
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test'
  2  | 
  3  | const baseURL = process.env.PMS_TEST_BASE_URL
  4  | 
  5  | function appUrl(path: string) {
  6  |   return baseURL ? `${baseURL}${path}` : path
  7  | }
  8  | 
  9  | test('/channels/distribution/distributiondisplacement loads business data through the page service', async ({
  10 |   page,
  11 | }) => {
  12 |   await page.setViewportSize({ width: 1440, height: 900 })
  13 |   await page.goto(appUrl('/channels/distribution/distributiondisplacement'))
  14 | 
  15 |   await expect(page.getByRole('heading', { name: '置换权益', level: 1 })).toBeVisible()
  16 |   await expect(page.locator('.page-content > .page-header')).toBeHidden()
  17 |   await expect(page.getByRole('link', { name: '置换权益' })).toHaveClass(/is-active/)
  18 | 
  19 |   await expect(page.getByTestId('distribution-displacement-service-state')).toHaveAttribute('data-provider', 'mock')
  20 |   await expect(page.getByTestId('distribution-displacement-service-state')).toHaveAttribute(
  21 |     'data-endpoint',
  22 |     'https://hudson-prod.localhome.cn/edition/replace/order/get',
  23 |   )
  24 |   await expect(page.getByTestId('distribution-displacement-service-state')).toHaveAttribute(/data-request-body/, /"pageSize":20/)
  25 | 
  26 |   await expect(page.getByRole('region', { name: '置换概况' })).toContainText('待置换金额')
  27 |   await expect(page.getByRole('region', { name: '置换概况' })).toContainText('¥12,860.00')
  28 |   await expect(page.getByRole('region', { name: '置换概况' })).toContainText('¥8,420.00')
  29 |   await expect(page.getByRole('row', { name: /DD-20260518-001/ })).toContainText('美团民宿')
  30 |   await expect(page.getByRole('row', { name: /DD-20260517-006/ })).toContainText('已置换')
  31 |   await expect(page.getByText('共 3 条')).toBeVisible()
  32 | })
  33 | 
  34 | test('/channels/distribution/distributiondisplacement filters, refreshes, exports and opens details with feedback', async ({
  35 |   page,
  36 | }) => {
  37 |   await page.setViewportSize({ width: 1440, height: 900 })
  38 |   await page.goto(appUrl('/channels/distribution/distributiondisplacement'))
  39 | 
  40 |   await page.getByLabel('开始日期').fill('2026-05-17')
  41 |   await page.getByLabel('结束日期').fill('2026-05-18')
  42 |   await page.getByRole('button', { name: '查询' }).click()
  43 |   await expect(page.getByTestId('distribution-displacement-service-state')).toHaveAttribute(/data-request-body/, /1778947200000/)
  44 |   await expect(page.getByText('筛选已更新')).toBeVisible()
  45 | 
  46 |   await page.getByRole('button', { name: '查看 DD-20260518-001 详情' }).click()
  47 |   await expect(page.getByRole('dialog', { name: '置换明细详情' })).toContainText('总裁套间')
  48 |   await page.getByRole('button', { name: '关闭置换明细详情' }).click()
  49 | 
  50 |   await page.getByRole('button', { name: '导出' }).click()
  51 |   await expect(page.getByText('导出任务已创建')).toBeVisible()
  52 | 
  53 |   await page.getByRole('button', { name: '刷新' }).click()
  54 |   await expect(page.getByText(/刷新完成/)).toBeVisible()
  55 | 
  56 |   await page.getByRole('button', { name: '重置' }).click()
  57 |   await expect(page.getByLabel('开始日期')).toHaveValue('')
  58 |   await expect(page.getByText('筛选已重置')).toBeVisible()
  59 | })
  60 | 
  61 | test('/channels/distribution/distributiondisplacement opens captured tail-room replacement dialog', async ({
  62 |   page,
  63 | }) => {
  64 |   await page.setViewportSize({ width: 1440, height: 900 })
  65 |   await page.goto(appUrl('/channels/distribution/distributiondisplacement'))
  66 | 
  67 |   await page.getByRole('button', { name: '申请尾房置换' }).click()
  68 | 
  69 |   await expect(page.getByRole('dialog', { name: '尾房置换' })).toBeVisible()
  70 |   await expect(page.getByLabel('尾房置换二维码')).toBeVisible()
  71 |   await expect(page.getByText('联系业务经理，进行尾房置换')).toBeVisible()
  72 |   await page.getByRole('button', { name: '我知道了' }).click()
  73 |   await expect(page.getByRole('dialog', { name: '尾房置换' })).toHaveCount(0)
  74 | })
  75 | 
  76 | test('/channels/distribution/distributiondisplacement exposes service error and retry feedback', async ({
  77 |   page,
  78 | }) => {
  79 |   await page.setViewportSize({ width: 1440, height: 900 })
  80 |   await page.goto(appUrl('/channels/distribution/distributiondisplacement?mockState=error'))
  81 | 
  82 |   await expect(page.getByRole('alert')).toContainText('置换权益数据加载失败')
  83 |   await page.getByRole('button', { name: '重试' }).click()
  84 |   await expect(page.getByRole('alert')).toContainText('置换权益数据加载失败')
  85 | })
  86 | 
  87 | test('/channels/distribution/distributiondisplacement renders contract empty state without breaking layout', async ({
  88 |   page,
  89 | }) => {
  90 |   await page.setViewportSize({ width: 1440, height: 900 })
  91 |   await page.goto(appUrl('/channels/distribution/distributiondisplacement?mockState=empty'))
  92 | 
> 93 |   await expect(page.getByText('暂无置换明细')).toBeVisible()
     |                                          ^ Error: expect(locator).toBeVisible() failed
  94 |   await expect(page.getByText('共 0 条')).toBeVisible()
  95 |   await expect(page.getByRole('table', { name: '置换明细表格' })).toBeVisible()
  96 | })
  97 | 
```