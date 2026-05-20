# 预售券核销明细交互矩阵

任务 ID：`baobiao--yushouquan-shuju--yushouquan-hexiao-mingxi`  
目标路由：`/statistics/preSaleCouponMall`  
目标站 URL：`https://minsubao.localhome.cn/statistics/preSaleCouponMall`  
当前本地验证 URL：`http://127.0.0.1:43380/statistics/preSaleCouponMall`

当前本地服务：

- 页面：`src/pages/PresaleCouponMallReportPage.tsx`
- 服务：`src/services/preSaleCouponMallReport.ts`
- 专项配置：`tmp/pre-sale-coupon-mall.playwright.config.ts`
- 专项测试：`tests/pre-sale-coupon-mall-report.spec.ts`
- 默认 provider：`mock`
- clone 三态：
  - `?mockState=success`
  - `?mockState=empty`
  - `?mockState=error`

| 区域 | 元素/交互 | 目标站行为 | 本地实现 | 数据契约/状态 | 验收方式 |
| --- | --- | --- | --- | --- | --- |
| 路由与导航 | 侧栏“预售券核销明细”高亮 | 进入 `/statistics/preSaleCouponMall` 后菜单保持高亮 | 保留现有 `AppShell` 路由与菜单结构 | 无新增请求 | Playwright 断言当前路由与侧栏激活项 |
| 门店信息 | 门店展示区 | 真实页默认展示当前门店 | 本地使用门店契约回填 `poiId / poiName` | `stores[]` | 断言 `门店` 区块包含 `天落会宿公寓(前海壹方城宝安中心店)` |
| 日期筛选 | 开始/结束日期 + 双月面板 | 真实页为双月面板，含 `昨天/本周/本月/上月` 快捷项 | 本地复刻双月面板与快捷项文案 | `startDate`、`endDate` | 点击日期输入框，断言面板和快捷项可见 |
| 渠道筛选 | 渠道下拉 | 真实页会拉取渠道列表 | 本地由服务层下发 options | `channels[]` | 点击下拉，断言 `路客云聚合`、`美团民宿` 可见 |
| 预售券类型筛选 | 类型下拉 | 真实页存在 `房券/门票券/餐饮券/套餐` | 本地由服务层下发 options | `categories[]` | 点击下拉，断言 `房券`、`套餐` 可见 |
| 商品搜索 | 关键词输入 + 查询 | 真实页存在 `keyword` 搜索项 | 本地查询后刷新 contract 与列表 | `request.keyword` | 输入 `电竞` 后查询，断言 diagnostics 带 `"keyword":"电竞"` |
| 主操作 | `重置 / 查询 / 刷新 / 导出 / 说明` | 真实页存在同类操作区 | 本地全部接入反馈文案与状态切换 | `notice`、`request` | Playwright 逐项点击并断言状态文案 |
| 指标卡 | 4 张核销指标卡 | 真实页有指标概览，当前账号真实数据为空 | 本地 success 使用契约化业务 mock | `metrics[]` | 断言 `总成交券数=168`、`总核销金额=25,780` |
| 明细表格 | 核销明细表 | 真实主接口当前返回空列表 | 本地 success 渲染 3 行业务化 mock | `rows[]` | 断言首行商品名、类型、详情按钮可见 |
| 详情弹层 | `查看详情` | 真实页存在行级明细入口 | 本地展示商品名、类型、渠道、更新时间、备注 | `selectedRow` | 点击详情按钮，断言弹层内容与关闭逻辑 |
| 说明弹层 | `说明` | 真实页存在字段说明入口 | 本地展示字段与释义表 | `descriptions[]` | 点击说明，断言 `成交券数/核销率/退款金额` |
| 空态 | `mockState=empty` | 目标站当前真实列表为空 | 本地保留结构、指标归零、表格空态 | `state=empty` | 断言 diagnostics=`empty`、空态文案、表格 0 行 |
| 错误态 | `mockState=error` | 真实接口失败时应显式失败 | 本地展示 `role="alert"` 与 `重新加载` | `state=error` | 断言 diagnostics=`error`、错误文案与按钮 |
| 隐藏契约 | `#pre-sale-coupon-mall-diagnostics` | 目标站无此节点 | 本地输出 provider/state/request | `provider`、`state`、`request` | Playwright 断言 `data-provider`、`data-state`、`data-request` |

## 当前验证结论

- 目标站真实主接口当前为空列表，因此本地默认 success 态不能继续做“静态空表复刻”。
- 本地页面已改为“独立服务层 + 契约化 mock + success/empty/error 闭环”。
- 当前专项 Playwright 配置已改为显式解析本机 `ms-playwright` Chromium，避免错误指向系统 Chrome 启动器导致无头启动卡死。

## 当前验证命令

- 本地 dev server：
  - `npm run dev -- --host 127.0.0.1 --port 43380 --strictPort`
- 专项 lint：
  - `npx eslint src/pages/PresaleCouponMallReportPage.tsx src/services/preSaleCouponMallReport.ts tests/pre-sale-coupon-mall-report.spec.ts --no-cache`
- 专项测试：
  - `PMS_TEST_BASE_URL=http://127.0.0.1:43380 npx playwright test pre-sale-coupon-mall-report.spec.ts --config tmp/pre-sale-coupon-mall.playwright.config.ts --workers=1 --timeout=60000`

## 风险备注

- 当前环境下 `playwright test` 标准输出回传不稳定，已通过直连 Playwright 浏览器探针确认页面可加载、指标与表格可渲染；后续建议在稳定终端环境再补一次完整 runner 结果截图。
- `role=cell` 对商品名称的可访问性匹配会误命中“查看详情”列，专项测试已收窄到首行首列断言，避免严格模式假失败。
