# 全域数据交互矩阵

- 任务 ID：`ai-quanyu-leida--shuju-yu-peizhi--quanyu-shuju`
- 页面：`AI全域雷达 > 数据与配置 > 全域数据`
- 目标 URL：`https://minsubao.localhome.cn/channels/globalRadar/globalData`
- 本地路由：`/channels/globalRadar/globalData`
- 当前本地取证批次：
  - 成功：`success-clone-20260519095536-*`
  - 空态：`empty-clone-20260519095639-*`
  - 错态：`error-clone-20260519100228-*`
  - 交互：`interaction-clone-20260519100101-*`
- 目标站关键接口：
  - `POST /order/report/get`
  - `POST /orders/strongReminder/page/get`
  - `POST /select/poi/page/get`
  - `POST /roomCategories/page/get`
  - `POST /radarConfig/shop/get`
  - `POST /edition/resource/get`
  - `POST /paymentTypes/get/v2`
- 本地服务层：`src/services/aiGlobalData.ts`

| 区域 | 元素/按钮 | 目标站行为 | 本地当前结果 | 数据服务 / 契约 | 验收方式 |
| --- | --- | --- | --- | --- | --- |
| 入口与导航 | 顶部 `AI全域雷达`、侧栏 `全域数据`/`配置中心` | 从项目导航进入页面，顶部与侧栏保持高亮 | 已接入项目既有布局；顶部与侧栏高亮正确，`配置中心` 可见 | `src/App.tsx` 路由 + `src/components/AppShell.tsx` 导航 | `tests/ai-global-data.spec.ts` 首屏断言；交互批次 body sample 可见 |
| 顶部操作 | `刷新` | 重新拉取当前筛选条件数据 | 已重拉统一服务层，状态条反馈“全域数据已刷新” | `fetchAiGlobalDataDashboard(query)` | Playwright 点击 `data-testid=ai-global-data-refresh` 后断言反馈 |
| 顶部操作 | `导出快照` | 创建导出任务 | 已返回业务反馈，不静默成功；交互批次记录导出诊断请求 | `createAiGlobalDataExportTask()` -> `/globalRadar/export/create` | Playwright 断言反馈；`interaction-clone-20260519100101-facts.json` 中 `diagnostics` |
| 顶部操作 | `立即开通` | 跳转订阅详情 | 已跳转 `/version/applicationPayment/detail?app=globalRadar`，由现有订阅页承接 | 路由承接，无额外 provider | Playwright 断言 URL、标题、购买按钮 |
| 筛选区 | 门店范围 | 变更门店后刷新全页经营数据 | 已消费 `campId`，交互批次最终为 `camp-haizhu` | `createOverviewRequest()`、`createReminderRequest()`、`createRoomRequest()` 等 | Playwright 断言根节点 `data-request-camp` 和 contract request |
| 筛选区 | 渠道视图 | 切换渠道过滤提醒、房型和门店候选 | 已消费 `channel=meituan`，交互批次 contract 中 `channelId: 2` | `createPoiRequest()`、`createRoomRequest()` | `interaction-clone-20260519100101-facts.json` contractText |
| 筛选区 | 关注级别 | 按优先级过滤提醒和房型风险 | 已消费 `attention=high` | `filterReminders()`、`filterRooms()` | Playwright 断言根节点 `data-request-attention=high` |
| 筛选区 | 房型关键字 | 按房型关键字过滤经营看板 | 已消费 `roomKeyword=大床`，只保留命中房型 | `createRoomRequest()` + mock filter | Playwright 断言根节点 `data-request-room-keyword=大床` |
| 筛选区 | `查询` / `重置` | 查询按当前条件刷新；重置回默认值 | 查询已实现；重置恢复默认筛选并重新加载 | `getDefaultAiGlobalDataQuery()` | Playwright 已覆盖查询；重置由页面逻辑与 artifacts 证明 |
| 指标卡片 | 6 张经营指标卡 | 点击查看指标口径 | 已打开指标详情弹层，展示指标口径、门店和取数来源 | `buildViewModel()` -> `summary[]` | Playwright 点击首卡并断言 `指标详情` 弹层 |
| 强提醒列表 | `查看订单` | 跳转承接提醒对应业务页 | `order` 型跳到 `/order/house-order/list`，`status` 型跳到 `/houseManage/months` | `openReminderTarget()` | 代码审计 + 可重复手动验证 |
| 强提醒列表 | `稍后提醒` | 更新提醒状态并给出反馈 | 已把提醒标记为 `postponed`，反馈“已延后提醒并保留在今日待办” | `postponeAiGlobalReminder()` -> `/globalRadar/strongReminder/postpone` | Playwright 覆盖；交互批次按钮状态更新 |
| 强提醒列表 | `标记完成` | 更新提醒状态并给出反馈 | 已把提醒标记为 `resolved`，保持在列表内可复盘 | `resolveAiGlobalReminder()` -> `/globalRadar/strongReminder/resolve` | 页面逻辑可复测 |
| 渠道接入状态 | `查看配置` | 前往配置中心 | 已跳转 `/channels/globalRadar/globalSetting` | 项目既有路由 | 代码审计 + 可重复手动验证 |
| 经营节奏 | 4 个节奏柱卡 | 点击查看对应指标详情 | 已复用指标详情弹层承接，不新增伪路由 | `trend[]` 对应 `summary[]` | 页面逻辑可复测 |
| 快捷入口 | `房态` / `订单` / `报表` / `配置中心` | 跳转既有业务页 | 已全部复用项目现有路由 | `quickLinks[]` | Playwright 已覆盖 `房态`；其余入口可复测 |
| 房型经营看板 | `房态` | 跳转房态页承接 | 已跳转 `/houseManage/months` | 项目既有路由 | 页面逻辑可复测 |
| 房型经营看板 | `查看详情` | 查看房型经营详情 | 已打开房型详情弹层，展示库存、入住率、渠道价格和跟进建议 | `fetchAiGlobalRoomDetail()` | Playwright 覆盖并断言“渠道价格” |
| 订阅卡片 | 底部 `立即开通` | 与顶部 CTA 一致 | 已复用同一跳转逻辑 | `openSubscription()` | 页面逻辑可复测 |
| 状态反馈 | loading | 首屏与查询期间显示加载态 | 已实现状态条 loading 文案 | `isLoading` | Playwright 查询/刷新路径覆盖 |
| 状态反馈 | empty | 无提醒且无房型时展示空态，不塌结构 | 已实现，仍保留快捷入口和订阅卡 | `mockState=empty` | `empty-clone-20260519095639-*` + Playwright |
| 状态反馈 | error / retry | 请求失败显示错误、可重试 | 已实现，重试后按最新 provider 状态恢复 | `mockState=error` | `error-clone-20260519100228-*` + Playwright |

## 取证产物

- 目标站：
  - `artifacts/screenshots/ai-quanyu-leida--shuju-yu-peizhi--quanyu-shuju/default-target-20260519095052-viewport.png`
  - `artifacts/network/ai-quanyu-leida--shuju-yu-peizhi--quanyu-shuju/default-target-20260519095052-responses.json`
- 本地：
  - `artifacts/screenshots/ai-quanyu-leida--shuju-yu-peizhi--quanyu-shuju/success-clone-20260519095536-viewport.png`
  - `artifacts/screenshots/ai-quanyu-leida--shuju-yu-peizhi--quanyu-shuju/empty-clone-20260519095639-viewport.png`
  - `artifacts/screenshots/ai-quanyu-leida--shuju-yu-peizhi--quanyu-shuju/error-clone-20260519100228-viewport.png`
  - `artifacts/screenshots/ai-quanyu-leida--shuju-yu-peizhi--quanyu-shuju/interaction-clone-20260519100101-viewport.png`
  - `artifacts/style-dumps/ai-quanyu-leida--shuju-yu-peizhi--quanyu-shuju/interaction-clone-20260519100101-facts.json`

## 后端待确认

- `order/report/get` 的正式响应字段名是否与当前本地 `OverviewData` 一致，还是需要从 Hudson 包继续适配。
- `orders/strongReminder/page/get` 是否补充分页参数返回规范；当前本地文档使用 `pageNum/pageSize/total`。
- `roomCategories/detail/get` 在真实站未直接抓到，需要后端确认是否已有详情接口，或复用列表字段拼详情。
- `/globalRadar/export/create`、`/globalRadar/strongReminder/postpone`、`/globalRadar/strongReminder/resolve` 当前为前端阶段写入契约，正式 method/path 与错误码仍待确认。
