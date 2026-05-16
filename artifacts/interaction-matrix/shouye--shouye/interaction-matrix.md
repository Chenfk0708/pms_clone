# shouye--shouye 首页交互矩阵

记录时间：2026-05-16 11:20 +08:00

## 取证来源

- 原始 prompt：`D:\pms_ui\95prompt\prompts\001-shouye--shouye.md`
- 95 分改善 prompt：`D:\pms_ui\95prompt\prompts111\001-shouye--shouye.md`
- 历史目标站取证：`artifacts/network/shouye--shouye/default-target-20260513-1405.json`、`artifacts/dom-snapshots/shouye--shouye/interactions-target-20260513-1410.json`
- 当前本地实现：`src/pages/WorkspacePage.tsx`、`src/pages/WorkspacePage.css`、`tests/workspace.spec.ts`

## 矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 顶部导航 | 首页入口 | URL 停留 `/workspace`，顶部 `首页` 高亮，无左侧菜单 | `GET /workspace`，加载后触发 `hudson-prod.localhome.cn/*` 多个 POST | 已有 `/workspace` 路由和顶部高亮；无侧栏 | 保持项目现有 AppShell 路由，不新增全局壳层改动 | Playwright 访问 `/workspace` 断言 URL、顶部高亮、页面主体可见 |
| 核心指标 | 预抵/在住/预离/可售/维修房/脏房/异常/总营业收入 | 显示目标站真实指标；部分指标可跳业务页 | `report/homePage/v2`、`orders/get`、`report/accommodation/management/analysis/get` 等 | 已由 `src/services/workspace.ts` 通过真实接口契约适配；缺少 `campId` 或请求失败时显示 alert 和重试 | 保持真实请求层；继续禁止组件内静态假数据回退 | Playwright 拦截真实接口契约，断言请求发生、数据渲染、错误阻塞与按钮反馈 |
| 顶部快捷 | 交接班 | 进入交接班相关页面 | 目标站加载 `shiftWorkConfig/page/get` | 已改为按钮并跳转项目既有路由 `/statistics/shift/record` | 保持路由协调 | 点击后断言 URL |
| 顶部快捷 | 夜审/立即开启夜审 | 展示夜审入口；真实业务能力受权限/配置约束 | 未取证到提交接口，仅页面加载有 `paymentTypes/get`、`commons/get` 等 | 点击显示“夜审接口未接入”阻塞提示，不假成功 | 保持阻塞暴露，待提交契约取证后再接入 | 点击后断言 status 文案 |
| 顶部快捷 | 房情表/收入报表/利润报表 | 跳转已有报表页面 | 跳转后各页面自身请求 | 已用 Link 跳转 | 保持并纳入矩阵验收 | 点击后断言 URL 和对应导航状态 |
| 营收面板 | 昨日/本月 | 切换营收指标与明细 | `report/accommodation/management/analysis/get` | 已由 `fetchWorkspaceAnalysis(campId, period)` 驱动；按钮 loading 禁用并显示刷新反馈 | 保持请求参数来自当前 UI 周期 | 拦截请求/状态，点击后断言 UI 与请求参数 |
| 营收面板 | 查看详情 | 跳转统计概览 | 页面跳转 | 已跳 `/statistics/report` | 保持并纳入验收 | 点击后断言 `/statistics/report` |
| 趋势图 | 本周/上周 | 切换日期轴和图表数据 | `report/accommodation/management/analysis/get` | 已由请求层参数 `range` 驱动；日期适配为 `MM/DD`；失败时展示错误和重试 | 保持参数映射和错误暴露 | 点击后断言请求参数与日期轴 |
| 趋势图 | 指标标签/legend | 目标站展示多个指标标签；图表区域更新 | 同趋势接口 | 已改为可点击按钮，切换 active 指标状态 | 保持 selected 反馈 | 点击每个指标断言 active 状态 |
| 订单列表 | 预抵/在住/预离 tab | 切换列表，目标站预抵有 3 条，在住/预离当前空态 | `orders/get` | 已由 `fetchWorkspaceLists` 返回列表；tab 切换带 loading；空态清晰 | 保持 `orderType` 与 tab 映射 | 拦截 `orders/get`，断言 tab 参数与空态 |
| 订单列表 | 搜索姓名/手机号 | 按关键词刷新订单 | `orders/get` | 输入框受控；Enter 触发 `orders/get`，keyword 来自 UI | 保持请求参数与 UI 状态一致 | 输入关键词断言请求参数和结果/空态 |
| 订单列表 | 查看全部订单 | 跳转住宿订单 | 页面跳转 | 已跳 `/order/house-order/list` | 保持并纳入验收 | 点击后断言 URL |
| 订单列表 | 排/客/看 | 目标站操作按钮存在，实际业务动作需按权限与订单状态 | 未完整取证到提交接口 | `排` 和 `客` 显示明确阻塞提示；`看` 打开订单详情弹层 | 保持阻塞暴露，不执行假写操作 | 逐个点击断言弹层/status/URL |
| 待办/产品动态 | 待办事项/产品动态 tab | 待办为空；产品动态取证缺失 | `backlogs/get`、`systemMessage/page/get` | 已接入 `backlogs/get`；产品动态 tab 可切换并展示请求适配结果或空态 | 记录 `systemMessage/page/get` 未完整接入差异 | 点击后断言空态或列表 |
| 备忘录 | 待处理/已处理/提交 | 目标站显示待处理/已处理空态，提交需真实接口 | `memo/page/get`，提交接口未完成取证 | tab 可切换；空输入校验；非空提交显示未接入阻塞，不假成功 | 待提交契约取证后再接入写接口 | 点击/提交断言校验和阻塞提示 |
| 流量面板 | 点我设置/一键上渠道 | 跳转渠道配置或展示渠道开通 | `campFlow/get`、`channels/get` 等 | `campFlow/get` 已接入；按钮跳转 `/setting/customChannel` 与 `/channels/ota` | 保持路由协调和流量建议展示 | 点击后断言 URL/提示 |
| 顶部工具栏 | 消息/收款/接待/门锁/客服/通知/用户菜单 | 已按目标站交互形成弹层或跳转 | 各自页面/面板请求 | 已有 AppShell 测试覆盖 | 保持，不扩大本页修改 | 现有 workspace 测试继续回归 |

## 当前阻塞

- 项目仍没有全局统一 HTTP 客户端；本页已按当前项目页面级模式新增 `src/services/workspace.ts`，后续如多个页面复用同接口再统一收敛。
- 本地 Vite 站点不持有目标站同域认证上下文，直接调用 `https://hudson-prod.localhome.cn` 可能触发 CORS/认证失败；因此页面必须清楚暴露真实阻塞，测试用 Playwright route 只验证请求契约与 UI 行为，不伪造生产成功路径。
- 夜审提交、备忘录提交、排房/住客资料等写操作未完成目标站提交契约取证，当前仅允许显示阻塞提示，不做假成功。
