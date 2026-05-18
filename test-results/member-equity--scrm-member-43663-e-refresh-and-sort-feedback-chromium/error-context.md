# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: member-equity.spec.ts >> /scrm/memberCenter/equity supports add edit delete refresh and sort feedback
- Location: tests\member-equity.spec.ts:48:1

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: '+ 添加图标' })

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
    - complementary "会员权益侧边导航" [ref=e65]:
      - button "SCRM" [ref=e67] [cursor=pointer]:
        - img [ref=e68]
        - heading "SCRM" [level=2] [ref=e72]
        - img [ref=e73]
      - button "客户管理" [ref=e76] [cursor=pointer]:
        - img [ref=e77]
        - heading "客户管理" [level=2] [ref=e81]
        - img [ref=e82]
      - generic [ref=e84]:
        - button "会员中心" [expanded] [ref=e85] [cursor=pointer]:
          - img [ref=e86]
          - heading "会员中心" [level=2] [ref=e90]
          - img [ref=e91]
        - generic [ref=e93]:
          - link "会员等级" [ref=e94] [cursor=pointer]:
            - /url: /scrm/memberCenter/level
          - link "会员权益" [ref=e95] [cursor=pointer]:
            - /url: /scrm/memberCenter/equity
          - link "会员积分" [ref=e96] [cursor=pointer]:
            - /url: /scrm/memberCenter/integrate
      - button "增长获客" [ref=e98] [cursor=pointer]:
        - img [ref=e99]
        - heading "增长获客" [level=2] [ref=e103]
        - img [ref=e104]
      - button "营销推广" [ref=e107] [cursor=pointer]:
        - img [ref=e108]
        - heading "营销推广" [level=2] [ref=e111]
        - img [ref=e112]
      - button "客户沟通" [ref=e115] [cursor=pointer]:
        - img [ref=e116]
        - heading "客户沟通" [level=2] [ref=e120]
        - img [ref=e121]
      - button "企微员工管理" [ref=e124] [cursor=pointer]:
        - img [ref=e125]
        - heading "企微员工管理" [level=2] [ref=e129]
        - img [ref=e130]
    - main [ref=e132]:
      - generic [ref=e133]:
        - region "会员权益管理" [ref=e134]:
          - generic [ref=e135]:
            - generic [ref=e136]:
              - heading "权益列表" [level=1] [ref=e137]
              - paragraph [ref=e138]: 可以在此处配置所需的会员权益
            - generic [ref=e139]:
              - button "添 加" [ref=e140] [cursor=pointer]
              - button "排 序" [ref=e141] [cursor=pointer]
              - button "刷新" [ref=e142] [cursor=pointer]
          - generic [ref=e143]:
            - generic [ref=e144]: 当前权益 3 项
            - status "会员权益操作反馈" [ref=e145]: 请输入权益名称；请上传权益图标
          - table "会员权益列表" [ref=e146]:
            - rowgroup [ref=e147]:
              - row "展示名称 权益图标 权益简介 操作" [ref=e148]:
                - columnheader "展示名称" [ref=e149]
                - columnheader "权益图标" [ref=e150]
                - columnheader "权益简介" [ref=e151]
                - columnheader "操作" [ref=e152]
            - rowgroup [ref=e153]:
              - row "延迟退房 序号 1 会员可申请 14:00 前延迟退房，需以前台房态确认为准。 编辑 延迟退房 删除 延迟退房" [ref=e154]:
                - cell "延迟退房 序号 1" [ref=e155]:
                  - strong [ref=e156]: 延迟退房
                  - emphasis [ref=e157]: 序号 1
                - cell [ref=e158]
                - cell "会员可申请 14:00 前延迟退房，需以前台房态确认为准。" [ref=e159]
                - cell "编辑 延迟退房 删除 延迟退房" [ref=e160]:
                  - generic [ref=e161]:
                    - button "编辑 延迟退房" [ref=e162] [cursor=pointer]
                    - button "删除 延迟退房" [ref=e163] [cursor=pointer]
              - row "房型升级 序号 2 入住当天有空房时可优先升级到同价位以上房型。 编辑 房型升级 删除 房型升级" [ref=e164]:
                - cell "房型升级 序号 2" [ref=e165]:
                  - strong [ref=e166]: 房型升级
                  - emphasis [ref=e167]: 序号 2
                - cell [ref=e168]
                - cell "入住当天有空房时可优先升级到同价位以上房型。" [ref=e169]
                - cell "编辑 房型升级 删除 房型升级" [ref=e170]:
                  - generic [ref=e171]:
                    - button "编辑 房型升级" [ref=e172] [cursor=pointer]
                    - button "删除 房型升级" [ref=e173] [cursor=pointer]
              - row "欢迎礼遇 序号 3 入住时提供饮品、一次性用品补给或门店运营配置的礼遇。 编辑 欢迎礼遇 删除 欢迎礼遇" [ref=e174]:
                - cell "欢迎礼遇 序号 3" [ref=e175]:
                  - strong [ref=e176]: 欢迎礼遇
                  - emphasis [ref=e177]: 序号 3
                - cell [ref=e178]
                - cell "入住时提供饮品、一次性用品补给或门店运营配置的礼遇。" [ref=e179]
                - cell "编辑 欢迎礼遇 删除 欢迎礼遇" [ref=e180]:
                  - generic [ref=e181]:
                    - button "编辑 欢迎礼遇" [ref=e182] [cursor=pointer]
                    - button "删除 欢迎礼遇" [ref=e183] [cursor=pointer]
        - dialog "新增权益" [ref=e184]:
          - generic [ref=e185]:
            - heading "新增权益" [level=2] [ref=e186]
            - button "关闭权益弹窗" [ref=e187] [cursor=pointer]: ×
          - generic [ref=e188]:
            - generic [ref=e189]:
              - generic [ref=e190]: 权益名称
              - textbox "权益名称" [active] [ref=e191]:
                - /placeholder: 请输入权益名称
                - text: 早餐券
            - generic [ref=e192]:
              - generic [ref=e193]: 权益图标
              - button "权益图标" [ref=e194] [cursor=pointer]: + 添加图标
            - generic [ref=e195]:
              - generic [ref=e196]: 权益简介
              - textbox "权益简介" [ref=e197]:
                - /placeholder: 请输入权益简介
            - generic [ref=e198]:
              - button "取 消" [ref=e199] [cursor=pointer]
              - button "提 交" [ref=e200] [cursor=pointer]
  - complementary "全部会话" [ref=e201]:
    - generic [ref=e202]:
      - strong [ref=e203]: 全部会话
      - generic [ref=e204]:
        - button "刷新会话" [ref=e205] [cursor=pointer]: ↻
        - button "收起会话" [ref=e206] [cursor=pointer]: 收起
    - generic [ref=e207]:
      - article [ref=e208]:
        - generic [ref=e210]:
          - generic [ref=e211]:
            - strong [ref=e212]: 携程民宿-【M335275070】
            - generic [ref=e213]: 咨询中
          - paragraph [ref=e214]:
            - emphasis [ref=e215]: 途家
            - text: 顶层套房（淞缇巨幕电竞麻将）
          - generic [ref=e216]: 我 加了
      - article [ref=e217]:
        - generic [ref=e219]:
          - generic [ref=e220]:
            - strong [ref=e221]: 携程民宿-【M566739056】
            - generic [ref=e222]: 咨询中
          - paragraph [ref=e223]:
            - emphasis [ref=e224]: 途家
            - text: 总裁套间（桦拿淞缇露台电竞麻将）
          - generic [ref=e225]: 我 已办理退房
      - article [ref=e226]:
        - generic [ref=e228]:
          - generic [ref=e229]:
            - strong [ref=e230]: 去哪民宿-【去哪儿用户】
            - generic [ref=e231]: 咨询中
          - paragraph [ref=e232]:
            - emphasis [ref=e233]: 途家 02.19-02.21（2晚）
            - text: 总裁套间（桦拿淞缇露台电竞麻将）
          - generic [ref=e234]: 我 人 有的
      - article [ref=e235]:
        - generic [ref=e237]:
          - generic [ref=e238]:
            - strong [ref=e239]: 携程民宿-【M614718025】
            - generic [ref=e240]: 咨询中
          - paragraph [ref=e241]:
            - emphasis [ref=e242]: 途家
            - text: 顶层套房（淞缇巨幕电竞麻将）
          - generic [ref=e243]: 我 什么时间段呢几号到几...
    - button "收起" [ref=e244] [cursor=pointer]
```

# Test source

```ts
  1   | import path from 'node:path'
  2   | import { fileURLToPath } from 'node:url'
  3   | import { expect, test } from '@playwright/test'
  4   | 
  5   | const __dirname = path.dirname(fileURLToPath(import.meta.url))
  6   | const appBaseURL = process.env.PMS_TEST_BASE_URL
  7   | 
  8   | function appUrl(routePath: string) {
  9   |   return appBaseURL ? `${appBaseURL}${routePath}` : routePath
  10  | }
  11  | 
  12  | test('/scrm/memberCenter/equity renders service-backed member benefit data', async ({ page }) => {
  13  |   await page.setViewportSize({ width: 1440, height: 900 })
  14  |   await page.goto(appUrl('/scrm/memberCenter/equity'))
  15  | 
  16  |   const pageRoot = page.locator('.member-equity-page')
  17  |   await expect(page.locator('.page-content > .page-header')).toBeHidden()
  18  |   await expect(pageRoot).toBeVisible()
  19  |   await expect(pageRoot).toHaveAttribute('data-provider', 'mock')
  20  |   await expect(pageRoot).toHaveAttribute('data-request-page', '1')
  21  |   await expect(pageRoot).toHaveAttribute('data-request-page-size', '999')
  22  |   await expect(page.getByRole('heading', { name: '权益列表', level: 1 })).toBeVisible()
  23  |   await expect(page.getByText('可以在此处配置所需的会员权益')).toBeVisible()
  24  |   await expect(page.getByRole('button', { name: '添 加' })).toBeVisible()
  25  |   await expect(page.getByRole('button', { name: '排 序' })).toBeVisible()
  26  |   await expect(page.getByRole('button', { name: '刷新' })).toBeVisible()
  27  |   await expect(page.getByRole('status', { name: '会员权益操作反馈' })).toContainText('会员权益已更新')
  28  | 
  29  |   await expect(page.getByRole('table', { name: '会员权益列表' }).locator('thead th')).toHaveText([
  30  |     '展示名称',
  31  |     '权益图标',
  32  |     '权益简介',
  33  |     '操作',
  34  |   ])
  35  |   await expect(page.getByRole('table', { name: '会员权益列表' })).toContainText('延迟退房')
  36  |   await expect(page.getByRole('table', { name: '会员权益列表' })).toContainText('房型升级')
  37  |   await expect(pageRoot).not.toContainText(/mock 数据|mock provider|未接入|阻塞|后端未就绪|后端接口未完成/i)
  38  | 
  39  |   await page.screenshot({
  40  |     path: path.resolve(
  41  |       __dirname,
  42  |       '../artifacts/screenshots/scrm--huiyuan-zhongxin--huiyuan-quanyi/default-clone-route.png',
  43  |     ),
  44  |     fullPage: true,
  45  |   })
  46  | })
  47  | 
  48  | test('/scrm/memberCenter/equity supports add edit delete refresh and sort feedback', async ({ page }) => {
  49  |   await page.setViewportSize({ width: 1440, height: 900 })
  50  |   await page.goto(appUrl('/scrm/memberCenter/equity'))
  51  | 
  52  |   await page.getByRole('button', { name: '添 加' }).click()
  53  |   await expect(page.getByRole('dialog', { name: '新增权益' })).toBeVisible()
  54  |   await page.getByRole('button', { name: '提 交' }).click()
  55  |   await expect(page.getByRole('alert')).toContainText('请输入权益名称')
  56  |   await expect(page.getByRole('alert')).toContainText('请上传权益图标')
  57  |   await page.getByPlaceholder('请输入权益名称').fill('早餐券')
> 58  |   await page.getByRole('button', { name: '+ 添加图标' }).click()
      |                                                      ^ Error: locator.click: Test timeout of 60000ms exceeded.
  59  |   await page.getByPlaceholder('请输入权益简介').fill('入住会员可领取门店早餐券一张')
  60  |   await page.getByRole('button', { name: '提 交' }).click()
  61  |   await expect(page.getByRole('status', { name: '会员权益操作反馈' })).toContainText('权益已创建')
  62  |   await expect(page.getByRole('table', { name: '会员权益列表' })).toContainText('早餐券')
  63  | 
  64  |   await page.getByRole('button', { name: '编辑 早餐券' }).click()
  65  |   await expect(page.getByRole('dialog', { name: '编辑权益' })).toBeVisible()
  66  |   await page.getByPlaceholder('请输入权益名称').fill('早餐礼')
  67  |   await page.getByRole('button', { name: '提 交' }).click()
  68  |   await expect(page.getByRole('status', { name: '会员权益操作反馈' })).toContainText('权益已保存')
  69  |   await expect(page.getByRole('table', { name: '会员权益列表' })).toContainText('早餐礼')
  70  | 
  71  |   await page.getByRole('button', { name: '排 序' }).click()
  72  |   await expect(page.getByText('拖动列表项排序')).toBeVisible()
  73  |   await page.getByRole('button', { name: '下移 延迟退房' }).click()
  74  |   await expect(page.getByRole('status', { name: '会员权益操作反馈' })).toContainText('排序已调整')
  75  |   await page.getByRole('button', { name: '保存排序' }).click()
  76  |   await expect(page.getByRole('status', { name: '会员权益操作反馈' })).toContainText('排序已保存')
  77  | 
  78  |   await page.getByRole('button', { name: '删除 早餐礼' }).click()
  79  |   await expect(page.getByRole('dialog', { name: '删除权益' })).toContainText('早餐礼')
  80  |   await page.getByRole('button', { name: '取 消' }).click()
  81  |   await expect(page.getByRole('table', { name: '会员权益列表' })).toContainText('早餐礼')
  82  |   await page.getByRole('button', { name: '删除 早餐礼' }).click()
  83  |   await page.getByRole('button', { name: '确 定' }).click()
  84  |   await expect(page.getByRole('status', { name: '会员权益操作反馈' })).toContainText('权益已删除')
  85  |   await expect(page.getByRole('table', { name: '会员权益列表' })).not.toContainText('早餐礼')
  86  | 
  87  |   await page.getByRole('button', { name: '刷新' }).click()
  88  |   await expect(page.getByRole('status', { name: '会员权益操作反馈' })).toContainText('会员权益已刷新')
  89  | })
  90  | 
  91  | test('/scrm/memberCenter/equity exposes empty and error states', async ({ page }) => {
  92  |   await page.setViewportSize({ width: 1440, height: 900 })
  93  | 
  94  |   await page.goto(appUrl('/scrm/memberCenter/equity?mockState=empty'))
  95  |   await expect(page.getByRole('status', { name: '会员权益操作反馈' })).toContainText('暂无会员权益')
  96  |   await expect(page.getByRole('table', { name: '会员权益列表' })).toContainText('暂无数据')
  97  |   await page.getByRole('button', { name: '排 序' }).click()
  98  |   await page.getByRole('button', { name: '保存排序' }).click()
  99  |   await expect(page.getByRole('status', { name: '会员权益操作反馈' })).toContainText('memberBenefitSeqs:不能为空')
  100 | 
  101 |   await page.goto(appUrl('/scrm/memberCenter/equity?mockState=error'))
  102 |   await expect(page.getByRole('alert', { name: '会员权益数据错误' })).toContainText('会员权益加载失败')
  103 |   await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
  104 |   await expect(page.locator('.member-equity-page')).not.toContainText(/mock 数据|mock provider|未接入|阻塞|后端未就绪|后端接口未完成/i)
  105 | })
  106 | 
```