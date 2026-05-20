# 收入报表交互矩阵

任务 ID：`baobiao--tongji-baobiao--shouru-baobiao`

目标路由：`/statistics/stay`

目标站取证批次：`default-target-20260519T171500-*`

本地数据服务：[`src/services/incomeReport.ts`](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/src/services/incomeReport.ts)、[`src/pages/IncomeReportPage.tsx`](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/src/pages/IncomeReportPage.tsx)

默认 provider：`mock`

切换开关：
- `localStorage["pms.incomeReport.provider"] = "mock" | "api"`
- `localStorage["pms.incomeReport.state"] = "success" | "empty" | "error"`

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口与导航 | 顶部“报表”、侧栏“收入报表” | 进入 `/statistics/stay` 后顶部与侧栏同时高亮 | 无新增请求 | 已对齐 AppShell 导航与路由高亮 | 保持项目现有导航结构，不额外造壳 | Playwright 断言顶部“报表”精确高亮、侧栏“收入报表”高亮 |
| 统计维度 | `按日/按月/按门店/按渠道/按房型/按房间/按退房时间` | 单击后切换报表维度并刷新表格 | `POST /report/accommodation/get`，`queryType` 随维度变化 | 已由统一 query 驱动；按钮具备 `aria-pressed` | 维度切换直接驱动服务层请求体，不在组件里散落静态分支 | Playwright 断言维度切换后 contract 中 `dimension/queryType` 变化、表格数据变化 |
| 门店筛选 | 门店按钮组 | 目标站默认“全部门店”，可切换当前门店范围 | 实测伴随主报表请求；门店选项来源 `POST /select/poi/page/get` | 已显示“全部门店”和实测门店 | 保持门店按钮组作为一级筛选，并回写 `storeId/storeName` | Playwright 断言门店按钮可选中，contract 请求体跟随变化 |
| 日期筛选 | 开始日期、结束日期 | 默认 `2026-05-01` 到 `2026-05-19`，查询时刷新报表 | `POST /report/accommodation/get`，请求体带 `startDate/endDate` | 已接入 query，支持参数校验 | 日期非法时直接暴露错误，不做静默 fallback | Playwright 断言非法日期触发 `role=alert`，文案包含“开始日期不能晚于结束日期” |
| 高级筛选 | 房型下拉 | 目标站可按房型过滤 | 目标站选项接口 `POST /select/roomCategory/page/get`；主查询体带 `roomCategoryId` | 已消费统一选项并写入 `roomTypeId/roomTypeName` | 使用统一 `SelectField`，保持占位“请选择” | Playwright 断言选择“观影大床房”后 contract 含 `roomTypeName` |
| 高级筛选 | 渠道下拉 | 目标站可按渠道过滤 | 目标站选项接口 `POST /select/calChannel4Order/get`；主查询体带 `channelId` | 已消费统一选项并写入 `channelId/channelName` | 过滤条件进入服务层 contract，而不是只改 UI 文案 | Playwright 断言选择“携程”后 contract 含 `channelName` |
| 高级筛选 | 房型分组下拉 | 目标站可按房型分组过滤 | 目标站选项接口 `POST /roomCategoryGroups/get`；主查询体预留 `roomCategoryGroupId` | 已有选项与 query 字段 | 先以 mock 契约承接，等待后端确认字段命名与过滤语义 | 组件手工验证下拉可开关；contract 中保留 `roomGroupName` |
| 工具栏 | 查询 | 按当前筛选条件刷新报表 | `fetchIncomeReportDashboard(query)` | 已触发 loading、刷新反馈和 contract 更新 | 查询时清空旧错误与旧反馈，避免状态串味 | Playwright 断言出现“收入报表已刷新”反馈 |
| 工具栏 | 重置 | 恢复默认筛选 | 恢复 `createDefaultIncomeReportQuery()` | 已恢复默认日期、维度、门店和空下拉 | 保留当前 mock state，仅重置业务查询条件 | 组件手工验证重置后字段回到默认值 |
| 工具栏 | 导出 | 目标站有导出入口 | 真实导出接口未取证；本地用 `createIncomeReportExportTask()` 生成任务回执 | 已有业务反馈，不伪装真实下载 | 明确导出为任务创建型交互，等待后端补正式导出接口 | Playwright 断言反馈包含“收入报表导出任务已创建” |
| 工具栏 | 说明 | 打开字段说明 | 无新增请求 | 已以 dialog 承接字段说明 | 字段说明来自统一 descriptions 数据，不再写死在 JSX | Playwright 断言“报表字段说明”弹层可打开/关闭 |
| 工具栏 | 收起/展开 | 控制高级筛选显示 | 无新增请求 | 已支持展开收起 | 收起时关闭当前下拉，避免浮层残留 | 组件手工验证展开区显隐 |
| 表格 | 汇总行与数据行 | 目标站展示收入汇总与分维度明细 | 主接口 `data.list[]` | 已由统一 rows 渲染，默认按日展示 20 行 | 表格只消费适配后业务模型，不直接绑原始响应字段 | Playwright 断言默认值包含 `10228.21/2309.74/12537.95/2026-05-19` |
| 表格 | 按渠道占比列 | 目标站按渠道维度会多出占比列 | 仍来自主接口行字段 | 已在 `dimension === "channel"` 时显示占比列 | 用单一表格组件按维度扩展列，而不是复制多张表 | 组件手工验证切到按渠道时出现占比列 |
| 表格 | 下载订单明细 | 目标站存在行级“下载订单明细” | 真实下载接口未取证 | 已用详情任务 dialog 承接 | 不做假下载，先提供任务摘要和路由承接 | Playwright 断言弹层出现当前行标签与金额 |
| 跨页承接 | 查看收支明细 | 从详情任务进入明细页 | 跳转已有路由 `/statistics/orderLedger` | 已承接到现有页面 | 优先复用项目已有路由，不硬造不存在详情页 | Playwright 断言点击后 URL 变为 `/statistics/orderLedger` |
| 分页 | 页码、每页 20 条 | 目标站首屏为 20 条/页 | 主接口返回 `pageNum/pageSize/total` | 已展示 1 页和每页 20 条 | 当前无多页取证，上一页/下一页保持禁用以避免假行为 | Playwright 断言 contract 含分页对象；组件手工验证禁用态 |
| 状态 | Loading | 请求中应有明确加载态 | 服务层 mock 延迟 160ms | 已显示“正在加载收入报表数据”并禁用关键按钮 | 统一由 effect 请求驱动 loading，不造额外假状态 | Playwright 首屏与查询流程覆盖 |
| 状态 | Empty | 空数据时保留页面骨架 | `state=empty`，`rows=[]` | 已显示空态和表格空行 | 空态不折叠表格和工具栏 | Playwright 断言 `data-state="empty"`、空态文案与 `"total":0` |
| 状态 | Error | 失败时明确暴露错误并可重试 | `state=error` 或参数校验异常 | 已显示 alert 与“重新加载” | 错误态不吞错；重试复用同一 contract | Playwright 断言 `data-state="error"`，切回 success 后重试恢复 |
| 数据契约 | 隐藏 contract 节点 | 页面需保留可回归的服务契约证据 | 本地主契约为统一 JSON；真实后端为 Hudson 风格 | 已输出 `data-testid="income-report-contract"` | 让测试和联调都能直接读到 provider、requestBody、pagination、traceId | Playwright 持续断言 contract 文本 |

## 验收记录

- 目标站关键取证：
  - 默认 URL：`https://minsubao.localhome.cn/statistics/stay`
  - 默认日期：`2026-05-01` 到 `2026-05-19`
  - 默认合计：`房费(减佣)=10228.21`、`佣金=2309.74`、`房费(含佣)=12537.95`
  - 主请求：`POST https://hudson-prod.localhome.cn/report/accommodation/get`
- 本地专项验证：
  - 命令：`$env:PMS_TEST_BASE_URL='http://127.0.0.1:4174'; npx playwright test '^.*income-report\.spec\.ts$' --config tmp/income-report.playwright.config.ts --timeout=60000 --workers=1 --reporter=line`
  - 结果：`5 passed`
- 当前残余风险：
  - 真实导出接口、行级下载接口未在目标站取到正式请求，只能先以业务反馈和现有路由承接。
  - `api` provider 仍为显式阻断状态，等待后端联调后接入真实 Hudson 适配。

## 2026-05-19 4206 最小路由壳复核补记

- 复核背景：
  - 当前共享工作树中的 [`src/App.tsx`](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/src/App.tsx) 已被其他任务收窄，无法把本任务验证口径表述为“整仓入口全量通过”。
  - 本轮采用最小可复现壳：`tmp/income-order-ledger-build` + `node tmp/serve-spa.mjs tmp/income-order-ledger-build 4206`，只承载 `/statistics/stay` 与 `/statistics/orderLedger` 相关链路。
- fresh local 取证：
  - 默认态：`artifacts/screenshots/baobiao--tongji-baobiao--shouru-baobiao/default-clone-20260519-fresh-local-default-viewport.png`
  - 空态：`artifacts/screenshots/baobiao--tongji-baobiao--shouru-baobiao/empty-clone-20260519-fresh-local-empty-viewport.png`
  - 错误态：`artifacts/screenshots/baobiao--tongji-baobiao--shouru-baobiao/error-clone-20260519-fresh-local-error-viewport.png`
  - 详情任务交互：`artifacts/screenshots/baobiao--tongji-baobiao--shouru-baobiao/download-detail-clone-20260519-fresh-local-download-detail-viewport.png`
  - 对应 DOM / style / network 已同步落盘到同 TASK_ID 目录。
- 本轮脚本补丁：
  - [`scripts/capture-income-report.mjs`](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/scripts/capture-income-report.mjs) 新增 clone 场景下的 `localStorage["pms.incomeReport.provider/state"]` 显式写入，确保 `default / empty / error` 证据与页面契约一致。
- fresh 验证：
  - `npx vite build --config tmp/income-order-ledger.vite.config.ts --outDir tmp/income-order-ledger-build --emptyOutDir true` -> `0`
  - `node --check scripts/capture-income-report.mjs` -> `0`
  - `npx tsc --noEmit --pretty false --ignoreConfig --jsx react-jsx --moduleResolution bundler --module esnext --target es2022 --lib dom,dom.iterable,es2022 --types vite/client,node src/App.tsx src/pages/IncomeReportPage.tsx src/services/incomeReport.ts src/pages/OrderLedgerPage.tsx src/services/orderLedger.ts tests/income-report.spec.ts tests/order-ledger.spec.ts` -> `0`
  - `$env:PMS_TEST_BASE_URL='http://127.0.0.1:4206'; npx playwright test tests/income-report.spec.ts --config tmp/income-report.playwright.config.ts --timeout=60000 --workers=1 --reporter=line` -> `5 passed`
  - `$env:PMS_TEST_BASE_URL='http://127.0.0.1:4206'; npx playwright test tests/order-ledger.spec.ts --config tmp/income-report.playwright.config.ts --timeout=60000 --workers=1 --reporter=line` -> `4 passed`
  - `npx eslint scripts/capture-income-report.mjs src/App.tsx src/pages/OrderLedgerPage.css tests/income-report.spec.ts tests/order-ledger.spec.ts --no-cache` -> `0 error, 1 warning`
- lint 说明：
  - 唯一 warning 为 `src/pages/OrderLedgerPage.css` 的 “File ignored because no matching configuration was supplied”，不是功能性错误。
