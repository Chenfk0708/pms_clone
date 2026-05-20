# 销况报表交互矩阵

- 任务 ID：`baobiao--tongji-baobiao--xiaokuang-baobiao`
- 页面路由：`/statistics/sale`
- 目标页面：`https://minsubao.localhome.cn/statistics/sale`
- 本地服务层：[`src/services/salesReport.ts`](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/src/services/salesReport.ts)
- 本地页面：[`src/pages/SalesReportPage.tsx`](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/src/pages/SalesReportPage.tsx)
- 自动化验证：[`tests/sales-report.spec.ts`](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/tests/sales-report.spec.ts)
- 默认 provider：`mock`
- provider 开关：
  - `localStorage["pms.salesReport.provider"] = "mock" | "api"`
  - `localStorage["pms.salesReport.mockState"] = "success" | "empty" | "error"`

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口与导航 | 顶部“报表”、侧栏“销况报表” | 进入 `/statistics/sale` 后顶部与侧栏同步高亮 | 无新增请求 | 已实现 | 沿用现有 `AppShell` 导航与路由，不额外造壳 | Playwright 断言顶部“报表”和侧栏“销况报表”高亮 |
| 维度切换 | `按日` | 默认维度；首屏自动查询 | `POST /report/open/room/get`，`queryType=1` | 已实现 | 首屏通过统一服务层自动加载，并落 `data-response-state`/contract | Playwright 断言默认 `aria-pressed=true`、contract 中 `queryType=1` |
| 维度切换 | `按月` | 切换后不自动查；点击“查询”才发起月维度请求 | `POST /report/open/room/get`，查询时 `queryType=2`，`startDate=2025-11-01`，`endDate=2026-05-31` | 已实现 | 保持和目标站一致，不在 tab 切换时伪造自动请求 | Playwright 断言切到按月后 contract 日期切到月份口径，查询后显示空态 |
| 维度切换 | `按门店` | 点击后切换门店统计 | `POST /report/open/room/get`，`queryType=3` | 已实现 | 通过统一 queryType 映射驱动，不散落组件条件分支 | 读取 contract，断言 `queryType=3` |
| 维度切换 | `按渠道` | 点击后切换渠道统计 | `POST /report/open/room/get`，`queryType=4` | 已实现 | 使用独立渠道列结构渲染占比列 | 读取 contract，断言 `queryType=4`，表头出现渠道列 |
| 维度切换 | `按房型` | 点击后切换房型统计 | `POST /report/open/room/get`，`queryType=5` | 已实现 | 使用房型维度表格 schema | 读取 contract，断言 `queryType=5` |
| 维度切换 | `按房间` | 点击后切换房间统计 | `POST /report/open/room/get`，`queryType=6`，默认 `roomIds=[]` | 已实现 | 切到房间维度后显示“房间”筛选器 | 读取 contract，断言 `queryType=6` 且出现房间下拉 |
| 门店范围 | `全部门店` / 当前门店 | 作为查询条件保留在页面顶端 | 真实页门店上下文来自会话/全局状态；销况主请求未单独抓到门店字段变化 | 已实现 | 本地保留门店范围单选，作为统一 query 的一部分 | 手动切换并观察选中态、contract 中 `storeScope` 变化 |
| 日期筛选 | 开始/结束日期 + `昨天/本周/本月/上月` | 默认 `2026-05-01` 到 `2026-05-19`；真实页日期面板含“昨天/本周/本月/上月”快捷项 | `POST /report/open/room/get`，日维度读取 `startDate/endDate` | 已实现 | 本地快捷项显式回写日期输入值，但不额外自动查询，保持与页面“查询”按钮职责分离 | Playwright 断言默认值、快捷项 `上月` 将日期改为 `2026-04-01` 到 `2026-04-30` |
| 月份筛选 | 开始/结束月份 | 按月维度使用月份范围 | `POST /report/open/room/get`，按查询按钮提交月份请求 | 已实现 | 本地月维度单独使用 `type="month"` 并映射月末日期 | Playwright 断言默认值 `2025-11` / `2026-05`，查询后 contract 日期正确 |
| 房型筛选 | 房型下拉 | 真实页查询时可透传 `roomCategoryIds` | `POST /report/open/room/get`，示例 `roomCategoryIds=["1796425098965729282"]` | 已实现 | 选项对齐真实页抓取到的房型 ID；查询后统一服务层回传过滤结果 | Playwright 断言查询后 contract 含目标 `roomCategoryIds` |
| 渠道筛选 | 渠道下拉 | 真实页可透传渠道筛选 | `POST /report/open/room/get`，`channelIds` | 已实现 | 选项进入统一 query，不在 JSX 硬编码业务判断 | 手动切换渠道后读取 contract |
| 房型分组筛选 | 房型分组下拉 | 真实页可透传房型分组 | `POST /report/open/room/get`，`roomCategoryGroupIds` | 已实现 | 先用 mock lookup 承接，等待后端字段正式确认 | 手动切换房型分组后读取 contract |
| 房间筛选 | 房间下拉 | 仅在“按房间”维度出现；打开选择器会拉房间列表 | `POST /rooms/page/get`，`{"campId":"1796067693589061634","isAvailability":1,"pageNum":1,"pageSize":20,"saleType":null,"checkInDate":"2026-05-19","checkOutDate":"2026-05-20","keyword":""}` | 已实现 mock/api 双路径 | 本地房间列表请求体与真实页保持同口径，默认按结束日+1 天取 checkout | 手动切到按房间，验证房间下拉可见并读取服务契约 |
| 操作区 | `查询` | 按当前筛选条件刷新报表 | 统一入口 `loadSalesReportDashboard(query)` | 已实现 | 查询时显示 loading、禁用关键按钮，不做静默 fallback | Playwright 断言状态提示更新，contract 请求体同步变化 |
| 操作区 | `重置` | 恢复当前维度默认筛选 | 恢复 `getDefaultSalesReportQuery()`，保留当前 `activeTab/provider/mockState` | 已实现 | 重置时同步清空导出任务与旧反馈 | 手动切筛选后点击重置，验证回到默认值 |
| 操作区 | `导出` | 真实页复用主接口；导出时 `pageSize=9999` 且带 `exportExcelMenuId` | `POST /report/open/room/get`，追加 `pageSize=9999`、`exportExcelMenuId=1898993554540892168` | 已实现 | 本地生成显式导出任务 contract，不伪装真实文件下载完成 | Playwright 断言 `data-testid="sales-report-export-contract"` 中两个字段正确 |
| 操作区 | `说明` | 打开字段说明弹窗，不发请求 | 无新增请求 | 已实现 | 文案对齐真实页说明项：`入住率`、`ADR`、`全日房ADR`、`钟点房ADR`、`RevPAR` | Playwright 断言 dialog 打开且包含关键文案 |
| 操作区 | `收起筛选` / `展开筛选` | 折叠/展开高级筛选区 | 无新增请求 | 已实现 | 用显式按钮文案和 `aria-label` 承接状态 | 手动点击并验证筛选区显隐 |
| 表格 | 销况报表表格 | 展示汇总行和分页明细；不同维度列结构不同 | 主请求响应 `data.list` 经服务层适配成统一 `table` | 已实现 | 表格只消费 adapter 后业务模型，不直接依赖散落 mock 常量 | Playwright 断言默认表头、合计行、日期行存在 |
| 分页 | 上一页/当前页/下一页/20条/页 | 真实页默认 20 条/页 | 主请求体默认 `pageSize=20` | 已实现静态承接 | 当前页、上一页、下一页和页容量按钮全部以显式禁用态呈现，不伪造未取证翻页链路 | Playwright 断言分页文案和 4 个分页按钮禁用态 |
| 反馈态 | Loading | 查询中有明确加载反馈 | mock provider 延迟 + API provider 异步请求 | 已实现 | 查询期间禁用 `查询/重置/导出/说明`，避免并发错乱 | 手动触发查询，观察 loading 与按钮禁用 |
| 反馈态 | Empty | 月维度查询可返回空态 | 统一 envelope 成功但 `rows=[]` | 已实现 | 空态不吞结构，保留筛选区和表格容器 | Playwright 断言月维度查询显示“暂无数据” |
| 反馈态 | Error | 请求失败时显示错误和重试入口 | 统一 `SalesReportServiceError` | 已实现 | 错误显式暴露，不做假成功或静默兜底 | Playwright 断言 `mockState=error` 时出现 alert 和“重试” |

## 验收记录

- 真实页关键取证：
  - 默认主请求：`POST /report/open/room/get`，`queryType=1`，`startDate=2026-05-01`，`endDate=2026-05-19`，`pageSize=20`
  - 月维度查询：`queryType=2`，`startDate=2025-11-01`，`endDate=2026-05-31`
  - 房型筛选查询：`roomCategoryIds=["1796425098965729282"]`
  - 导出请求：同主接口，额外 `pageSize=9999`、`exportExcelMenuId=1898993554540892168`
  - 房间筛选 lookup：`POST /rooms/page/get`
- 本地专项验证命令：
  - `npx vite build`
  - `node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4302 --strictPort`
  - `npx playwright test --config tmp/sales-report.local.playwright.config.ts --project=chromium --workers=1 --reporter=line`
  - 结果：`4 passed`
- 剩余风险：
  - 真实页门店/渠道/房型分组更多联动规则尚未完整抓到，当前本地按已取证字段建模。
