# 预售券销售统计交互矩阵

任务 ID：`baobiao--yushouquan-shuju--yushouquan-xiaoshou-tongji`  
目标路由：`/statistics/presale`  
目标站取证批次：`default-target-20260519183510`、`detail-link-target-20260519183610`  
本地 clone 取证批次：`success-clone-20260519191010`、`empty-clone-20260519191110`、`error-clone-20260519191210`

当前本地服务：

- 页面：`src/pages/PresaleSalesReportPage.tsx`
- 服务：`src/services/presaleSalesReport.ts`
- 默认 provider：`mock`
- clone 三态：
  - `?mockState=success`
  - `?mockState=empty`
  - `?mockState=error`

| 区域 | 元素/交互 | 目标站行为 | 本地实现 | 数据契约/状态 | 验收方式 |
| --- | --- | --- | --- | --- | --- |
| 入口与导航 | 顶部“报表”、侧栏“预售券销售统计” | 进入 `/statistics/presale` 后左侧菜单保持高亮，默认页头隐藏 | 保留现有 AppShell 路由与菜单高亮 | 无新增请求 | Playwright 断言当前侧栏链接 `is-active` |
| 首屏概览 | `经营指标` 区块 | 展示 5 张预售券指标卡 | 本地按统一服务层渲染 5 张指标卡 | `metricCards[]` | Playwright 断言 `经营指标` 和 `预售券总交易额` 可见 |
| 主操作 | `查看明细数据>` | 点击后跳转 `/statistics/preSaleCouponMall` | 使用 `navigate(detailRoute)` 跳转 | `detailRoute` | Playwright 点击并断言 URL 变化 |
| 趋势分析 | `交易额` tab | 默认选中，展示交易额趋势 | `trendMode === "amount"` | `trendCharts.amount` | Playwright 断言默认 contract 与标题 |
| 趋势分析 | `订单数` tab | 目标站点击后图例文案切换为“预售券总订单数 / 房券订单数 / 门票订单数 / 餐饮券订单数 / 套餐券订单数”，当前账号仍为空图 | `trendMode === "orders"`，按钮 `aria-pressed=true` | `trendCharts.orders` | target `orders-tab-target-20260519183710-*` + Playwright 点击后断言 `订单量趋势` 出现 |
| 趋势分析 | 图例 | 展示 5 类指标图例 | 由当前 chart `series[]` 渲染 | `trendCharts[mode].series` | DOM 取证与页面截图 |
| 来源分析 | `小程序订单来源分析` 区块 | 展示来源概览卡与来源表格 | 本地渲染 3 张 summary 卡 + 表格 | `sourceSummary[]`、`sourceRows[]` | Playwright 断言区块标题；截图核对布局 |
| 成功态 | 默认/`mockState=success` | 目标站当前账号为空；本地 success 使用业务化 mock 填充数据 | 正文不出现开发态文案 | `state=success` | 专项测试、截图、隐藏 contract |
| 空态 | `mockState=empty` | 真实业务空态时页面指标为 0、图表为空 | KPI 区显示空态提示，趋势区和来源区显示空面板 | `state=empty`、`emptyMessage` | Playwright 断言 3 处空态文案与 hidden contract |
| 错误态 | `mockState=error` | 接口失败时应清晰暴露错误，错误上下文下不应继续点击详情或切换趋势 | 显示 `role="alert"`、`重新加载` 按钮，并禁用 `查看明细数据>` / 趋势切换按钮 | `state=error` | Playwright 断言错误提示、禁用态和点击重试 |
| 错误恢复 | `重新加载` | 重新请求当前查询 | 清空错误并重新执行 `fetchPresaleSalesDashboard` | query/state 重建 | Playwright 先切回 `mockState=success` 再点重试 |
| 加载态 | 页面初始化/重试 | 数据加载中有反馈，关键操作按钮临时禁用 | KPI 区 `role="status"`，分析区有 loading 占位，`查看明细数据>` / 趋势切换按钮禁用 | Promise pending | `loading-clone-20260519193110-*` 取证 + 组件截图 |
| 隐藏契约 | `data-testid="presale-sales-service-contract"` | 目标站无此节点，本地用于验收与文档闭环 | 输出 provider/state/requestBodies/activeTrendMode | `serviceRequests[]` | Playwright 断言包含 `/order/report/get`、`/report/store/management/get`、`campId` |
| 配套请求摘要 | 页面契约内 serviceRequests | 目标站存在辅助接口 | 本地 contract 同步输出 8 个请求摘要 | `/select/poi/page/get`、`/roomCategories/page/get`、`/orders/strongReminder/page/get`、`/edition/resource/get`、`/paymentTypes/get`、`/paymentTypes/get/v2` | 文档核对 `src/services/presaleSalesReport.ts` |

## 验收记录

- 专项测试：
  - `PMS_TEST_BASE_URL=http://127.0.0.1:4191 npx playwright test tests/presale-sales-report.spec.ts --timeout=60000 --workers=1 --reporter=line`
  - 结果：`3 passed (21.1s)`
- 目标站取证：
  - `artifacts/network/baobiao--yushouquan-shuju--yushouquan-xiaoshou-tongji/default-target-20260519183510-responses.json`
  - `artifacts/network/baobiao--yushouquan-shuju--yushouquan-xiaoshou-tongji/detail-link-target-20260519183610-responses.json`
  - `artifacts/network/baobiao--yushouquan-shuju--yushouquan-xiaoshou-tongji/orders-tab-target-20260519183710-responses.json`
- 本地 clone 三态取证：
  - `artifacts/network/baobiao--yushouquan-shuju--yushouquan-xiaoshou-tongji/success-clone-20260519191010-responses.json`
  - `artifacts/network/baobiao--yushouquan-shuju--yushouquan-xiaoshou-tongji/empty-clone-20260519191110-responses.json`
  - `artifacts/network/baobiao--yushouquan-shuju--yushouquan-xiaoshou-tongji/error-clone-20260519193210-responses.json`
  - `artifacts/network/baobiao--yushouquan-shuju--yushouquan-xiaoshou-tongji/loading-clone-20260519193110-responses.json`
- 取证约束更新：
  - `scripts/capture-presale-sales-report.mjs` 的 clone 模式现在必须显式传入 `PMS_LOCAL_URL`，避免误连历史 `:4173`/dev server 导致空白 DOM 伪证据。
  - 当前页专项验证已闭环；如需全仓生产构建证据，需另行处理当前工作树中与本页无关的 `HouseMonthsPage.tsx` 类型错误。
