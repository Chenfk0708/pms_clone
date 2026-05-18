# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: coupon.spec.ts >> /mallManagement/couponMgt/edit keeps form interactions and submit feedback local
- Location: tests\coupon.spec.ts:95:1

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: '选择商品/房型' })

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
    - complementary "优惠券侧边导航" [ref=e65]:
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
      - generic [ref=e102]:
        - button "营销推广" [expanded] [ref=e103] [cursor=pointer]:
          - img [ref=e104]
          - heading "营销推广" [level=2] [ref=e107]
          - img [ref=e108]
        - generic [ref=e110]:
          - link "优惠券" [ref=e111] [cursor=pointer]:
            - /url: /mallManagement/couponMgt
          - link "全员营销" [ref=e112] [cursor=pointer]:
            - /url: /mallManagement/distribution
          - link "客户营销" [ref=e113] [cursor=pointer]:
            - /url: /scrm/marketing/customer
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
        - heading "优惠券" [level=1] [ref=e134]
        - region "优惠券表单" [ref=e135]:
          - generic [ref=e136]: 优惠券列表>新增
          - generic [ref=e137]:
            - generic [ref=e138]:
              - generic [ref=e139]: 名称
              - textbox "名称" [ref=e140]: 周末复购券
            - group "类型" [ref=e141]:
              - generic [ref=e142]: 类型
              - generic [ref=e143]:
                - radio "类型 满减券" [checked] [ref=e144]
                - text: 满减券
            - generic [ref=e145]:
              - generic [ref=e146]: 优惠金额
              - generic [ref=e147]:
                - text: 满
                - textbox "满额金额" [ref=e148]: "300"
                - text: 元，减
                - textbox "减免金额" [active] [ref=e149]: "30"
                - text: 元
            - generic [ref=e150]:
              - generic [ref=e151]: 生效范围
              - button "生效范围" [ref=e152] [cursor=pointer]: 选择商品/房型 ⌄
            - group "领券条件" [ref=e153]:
              - generic [ref=e154]: 领券条件
              - generic [ref=e155]:
                - radio "所有人可以领" [checked] [ref=e156]
                - text: 所有人可以领
              - generic [ref=e157]:
                - radio "仅限新用户可领取" [ref=e158]
                - text: 仅限新用户可领取
              - generic [ref=e159]:
                - radio "仅限老用户可领取" [ref=e160]
                - text: 仅限老用户可领取
            - group "使用条件" [ref=e161]:
              - generic [ref=e162]: 使用条件
              - generic [ref=e163]:
                - radio "可以与会员折扣共用" [checked] [ref=e164]
                - text: 可以与会员折扣共用
              - generic [ref=e165]:
                - radio "不可与会员折扣共享" [ref=e166]
                - text: 不可与会员折扣共享
            - generic [ref=e167]:
              - generic [ref=e168]: 派发上限
              - textbox "派发上限" [ref=e169]
              - emphasis [ref=e170]: 张
            - generic [ref=e171]:
              - generic [ref=e172]: 每人可领数
              - textbox "每人可领数" [ref=e173]
              - emphasis [ref=e174]: 张
            - generic [ref=e175]:
              - generic [ref=e176]: 派发时间
              - textbox "派发时间" [ref=e177]:
                - /placeholder: 请选择日期
            - group "时效类型" [ref=e178]:
              - generic [ref=e179]: 时效类型
              - generic [ref=e180]:
                - radio "有效天数" [checked] [ref=e181]
                - text: 有效天数
              - generic [ref=e182]:
                - radio "固定时间" [ref=e183]
                - text: 固定时间
            - generic [ref=e184]:
              - generic [ref=e185]: 有效期
              - generic [ref=e186]:
                - textbox "有效期天数" [ref=e187]
                - text: 天
              - generic [ref=e188]:
                - text: 隔天生效
                - textbox "隔天生效天数" [ref=e189]
                - text: 天
            - group "不可用时间" [ref=e190]:
              - generic [ref=e191]: 不可用时间
              - generic [ref=e192]:
                - checkbox "节假日" [ref=e193]
                - text: 节假日
              - button "查看默认节假日列表" [ref=e194] [cursor=pointer]
              - generic [ref=e195]:
                - checkbox "周末" [ref=e196]
                - text: 周末
              - generic [ref=e197]: 星期五-六不可使用
              - generic [ref=e198]:
                - checkbox "自定义" [ref=e199]
                - text: 自定义
          - generic [ref=e200]:
            - button "返回列表" [ref=e201] [cursor=pointer]
            - button "提 交" [ref=e202] [cursor=pointer]
  - complementary "全部会话" [ref=e203]:
    - generic [ref=e204]:
      - strong [ref=e205]: 全部会话
      - generic [ref=e206]:
        - button "刷新会话" [ref=e207] [cursor=pointer]: ↻
        - button "收起会话" [ref=e208] [cursor=pointer]: 收起
    - generic [ref=e209]:
      - article [ref=e210]:
        - generic [ref=e212]:
          - generic [ref=e213]:
            - strong [ref=e214]: 携程民宿-【M335275070】
            - generic [ref=e215]: 咨询中
          - paragraph [ref=e216]:
            - emphasis [ref=e217]: 途家
            - text: 顶层套房（淞缇巨幕电竞麻将）
          - generic [ref=e218]: 我 加了
      - article [ref=e219]:
        - generic [ref=e221]:
          - generic [ref=e222]:
            - strong [ref=e223]: 携程民宿-【M566739056】
            - generic [ref=e224]: 咨询中
          - paragraph [ref=e225]:
            - emphasis [ref=e226]: 途家
            - text: 总裁套间（桦拿淞缇露台电竞麻将）
          - generic [ref=e227]: 我 已办理退房
      - article [ref=e228]:
        - generic [ref=e230]:
          - generic [ref=e231]:
            - strong [ref=e232]: 去哪民宿-【去哪儿用户】
            - generic [ref=e233]: 咨询中
          - paragraph [ref=e234]:
            - emphasis [ref=e235]: 途家 02.19-02.21（2晚）
            - text: 总裁套间（桦拿淞缇露台电竞麻将）
          - generic [ref=e236]: 我 人 有的
      - article [ref=e237]:
        - generic [ref=e239]:
          - generic [ref=e240]:
            - strong [ref=e241]: 携程民宿-【M614718025】
            - generic [ref=e242]: 咨询中
          - paragraph [ref=e243]:
            - emphasis [ref=e244]: 途家
            - text: 顶层套房（淞缇巨幕电竞麻将）
          - generic [ref=e245]: 我 什么时间段呢几号到几...
    - button "收起" [ref=e246] [cursor=pointer]
```

# Test source

```ts
  11  |   await page.addInitScript((mockMode) => {
  12  |     window.localStorage.setItem('pms.couponProvider', 'mock')
  13  |     window.localStorage.setItem('pms.couponMockMode', mockMode)
  14  |   }, mode)
  15  |   await page.goto(appUrl('/mallManagement/couponMgt'))
  16  | }
  17  | 
  18  | test('/mallManagement/couponMgt renders coupon data through the service contract', async ({ page }) => {
  19  |   await openCouponPage(page)
  20  | 
  21  |   await expect(page.getByRole('heading', { name: '优惠券', level: 1 })).toBeVisible()
  22  |   await expect(page.getByRole('link', { name: '优惠券' })).toHaveClass(/is-active/)
  23  |   await expect(page.locator('.page-content > .page-header')).toBeHidden()
  24  |   await expect(page.getByTestId('coupon-service-endpoint')).toContainText('coupons/page/get')
  25  |   await expect(page.getByTestId('coupon-request-body')).toContainText('"pageNum":1')
  26  | 
  27  |   await expect(page.getByRole('tab', { name: '优惠券管理' })).toHaveAttribute('aria-selected', 'true')
  28  |   await expect(page.getByRole('button', { name: '上架状态 请选择' })).toBeVisible()
  29  |   await expect(page.getByRole('button', { name: '刷新' })).toBeVisible()
  30  |   await expect(page.getByRole('button', { name: '导出' })).toBeVisible()
  31  |   await expect(page.getByLabel('优惠券列表表格').locator('.coupon-table__head > div')).toHaveText([
  32  |     '名称',
  33  |     '类型',
  34  |     '优惠力度',
  35  |     '可用范围',
  36  |     '派发上限',
  37  |     '每人可领数',
  38  |     '派发时间',
  39  |     '时效类型',
  40  |     '生效时间',
  41  |     '领券条件',
  42  |     '状态',
  43  |     '操作',
  44  |   ])
  45  |   await expect(page.getByRole('cell', { name: '春季连住满减券' })).toBeVisible()
  46  |   await expect(page.getByRole('cell', { name: '会员复购专享券' })).toBeVisible()
  47  | 
  48  |   await page.getByRole('button', { name: '上架状态 请选择' }).click()
  49  |   await page.getByRole('option', { name: '已上架' }).click()
  50  |   await page.getByRole('button', { name: '查 询' }).click()
  51  |   await expect(page.getByRole('status')).toContainText('已按当前条件刷新优惠券')
  52  |   await expect(page.getByTestId('coupon-request-body')).toContainText('"shelfStatus":1')
  53  | 
  54  |   await page.getByRole('button', { name: '刷新' }).click()
  55  |   await expect(page.getByRole('status')).toContainText('已刷新')
  56  | 
  57  |   await page.getByRole('button', { name: '导出' }).click()
  58  |   await expect(page.getByRole('dialog', { name: '导出优惠券' })).toContainText('导出任务已创建')
  59  |   await page.getByRole('button', { name: '关闭导出优惠券' }).click()
  60  | 
  61  |   await page.getByRole('button', { name: '查看 春季连住满减券' }).click()
  62  |   await expect(page.getByRole('dialog', { name: '优惠券详情' })).toContainText('春季连住满减券')
  63  |   await page.getByRole('button', { name: '关闭优惠券详情' }).click()
  64  | })
  65  | 
  66  | test('/mallManagement/couponMgt supports task tab, pagination, empty, and error states', async ({ page }) => {
  67  |   await openCouponPage(page)
  68  | 
  69  |   await page.getByRole('tab', { name: '派发任务' }).click()
  70  |   await expect(page.getByTestId('coupon-service-endpoint')).toContainText('couponSendConfigs/page/get')
  71  |   await expect(page.getByLabel('派发任务表格').locator('.coupon-table__head > div')).toHaveText([
  72  |     '派发方式',
  73  |     '优惠券',
  74  |     '已派数量',
  75  |     '创建时间',
  76  |     '记录',
  77  |   ])
  78  |   await expect(page.getByRole('cell', { name: '会员标签定向派发' })).toBeVisible()
  79  | 
  80  |   await page.getByRole('button', { name: '下一页' }).click()
  81  |   await expect(page.getByTestId('coupon-request-body')).toContainText('"pageNum":2')
  82  |   await page.getByRole('button', { name: '新建任务' }).click()
  83  |   await expect(page.getByRole('dialog', { name: '新建派发任务' })).toContainText('选择优惠券后可按会员标签派发')
  84  |   await page.getByRole('button', { name: '取消新建派发任务' }).click()
  85  | 
  86  |   await openCouponPage(page, 'empty')
  87  |   await expect(page.getByText('暂无符合条件的优惠券')).toBeVisible()
  88  | 
  89  |   await openCouponPage(page, 'error')
  90  |   await expect(page.getByRole('alert')).toContainText('优惠券数据加载失败')
  91  |   await page.getByRole('button', { name: '重试' }).click()
  92  |   await expect(page.getByRole('alert')).toContainText('优惠券数据加载失败')
  93  | })
  94  | 
  95  | test('/mallManagement/couponMgt/edit keeps form interactions and submit feedback local', async ({ page }) => {
  96  |   await openCouponPage(page)
  97  | 
  98  |   await page.getByRole('button', { name: '新建' }).click()
  99  |   await expect(page).toHaveURL(/\/mallManagement\/couponMgt\/edit$/)
  100 |   await expect(page.getByRole('heading', { name: '优惠券', level: 1 })).toBeVisible()
  101 |   await expect(page.getByText('优惠券列表>新增')).toBeVisible()
  102 |   await expect(page.getByLabel('优惠券表单')).toContainText('名称')
  103 |   await expect(page.getByLabel('类型 满减券')).toBeChecked()
  104 |   await expect(page.getByLabel('所有人可以领')).toBeChecked()
  105 |   await expect(page.getByLabel('可以与会员折扣共用')).toBeChecked()
  106 |   await expect(page.getByLabel('有效天数')).toBeChecked()
  107 | 
  108 |   await page.getByLabel('名称').fill('周末复购券')
  109 |   await page.getByLabel('满额金额').fill('300')
  110 |   await page.getByLabel('减免金额').fill('30')
> 111 |   await page.getByRole('button', { name: '选择商品/房型' }).click()
      |                                                       ^ Error: locator.click: Test timeout of 60000ms exceeded.
  112 |   await expect(page.getByRole('dialog', { name: '选择商品/房型' })).toContainText('顶层套房')
  113 |   await page.getByRole('button', { name: '确认选择商品/房型' }).click()
  114 |   await page.getByRole('button', { name: '查看默认节假日列表' }).click()
  115 |   await expect(page.getByRole('dialog', { name: '默认节假日列表' })).toContainText('春节')
  116 |   await page.getByRole('button', { name: '关闭默认节假日列表' }).click()
  117 |   await page.getByRole('button', { name: '提 交' }).click()
  118 |   await expect(page.getByRole('status')).toContainText('优惠券已保存')
  119 | 
  120 |   await page.getByRole('button', { name: '返回列表' }).click()
  121 |   await expect(page).toHaveURL(/\/mallManagement\/couponMgt$/)
  122 | })
  123 | 
```