# 收支明细交互矩阵

任务 ID：`baobiao--shouzhi-mingxibiao--shouzhi-mingxi`

页面路由：`/statistics/orderLedger`

目标站：`https://minsubao.localhome.cn/statistics/orderLedger`

目标站取证批次：

- `default-target-20260519083818-*`
- `detail-target-20260519084047-*`
- `select-0-target-20260519084120-*`
- `date-picker-target-20260519084156-*`

本地 fresh clone 取证批次：

- `default-clone-20260519103643-*`
- `interaction-clone-20260519103643-*`
- `detail-clone-20260519103643-*`
- `empty-clone-20260519103643-*`
- `error-clone-20260519103643-*`

本地服务层：`src/services/orderLedger.ts`

默认 provider：`mock`

三态切换：

- 默认成功态：`/statistics/orderLedger`
- 空态：`/statistics/orderLedger?mockState=empty`
- 错误态：`/statistics/orderLedger?mockState=error`

| 区域 | 元素/按钮 | 目标站行为 | 触发的数据服务/未来契约 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 页面入口 | 顶部“报表”、侧栏“收支明细” | 进入 `/statistics/orderLedger` 后顶栏归属在“报表”，侧栏高亮“收支明细” | 无新增请求 | 已接入统一路由壳层 | 保持现有路由、布局和导航归属，不新增孤立页面壳 | `default-clone-20260519103643-facts.json` 断言 `topnav:/statistics/report + sidebar:/statistics/orderLedger` |
| 首屏加载 | 页面初始化 | 目标站首屏展示筛选区、账本概括、2 行列表，默认日期 `2026-05-18` 到 `2026-05-19` | 主接口 `POST /accountBookCostPrice/pages/v2`，辅助接口 `POST /select/poi/page/get`、`/paymentTypes/get`、`/paymentWays/get`、`/rooms/get` | 已接统一服务层，组件只消费适配后的 `OrderLedgerDashboard` | 服务层先收口请求体与 Hudson 响应，再向页面暴露业务模型 | `default-target-20260519083818-facts.json` 对照 `default-clone-20260519103643-facts.json` |
| 门店筛选 | “全部门店”、门店按钮 | 目标站展示全部门店和当前门店按钮，可切换门店范围 | 请求体 `poiIds[]` | 本地已映射 `poiIds` | 保持单选门店切换，默认空数组代表全部门店 | 读取 `#order-ledger-diagnostics[data-request]` 校验 `poiIds` |
| 日期快捷项 | 昨天/今天/上周/本周/上月/本月 | 目标站可切换快捷日期，日期输入同步变化 | 请求体 `beginTime`、`endTime` | 本地已实现快捷切换 | 用固定日期区间驱动 mock 数据，不在组件内散落日期逻辑 | 目标站 `date-picker-target-20260519084156-*` + 本地 diagnostics 请求体 |
| 日期输入区 | 开始日期/结束日期 | 目标站展示日期区间输入框 | 请求体 `beginTime`、`endTime` | 本地当前为只读输入，跟随快捷项变化 | 保持字段显式可见，便于后续对接真实日期面板 | 截图对比日期输入存在性，断言 diagnostics 日期字段变化 |
| 类型筛选 | “全部类型 / 收入 / 支出” | 目标站首个下拉含 `全部类型`、`收入`、`支出` | 请求体 `isIncome` | 本地已映射 `all -> null`、`income -> 1`、`expense -> 0` | 选择“支出”后触发空态，明确暴露当前范围下无数据 | `select-0-target-20260519084120-facts.json` + `interaction-clone-20260519103643-facts.json` 断言 `isIncome=0` |
| 来源筛选 | “全部来源 / 住宿订单 / 记一笔” | 目标站展示来源筛选 | 请求体 `type` | 本地已映射 `住宿订单 -> 1`、`记一笔 -> 2` | 保持来源与主接口 `type` 一一对应 | `interaction-clone-20260519103643-facts.json` 断言 `type=1` |
| 项目筛选 | “请选择项目” | 目标站展示项目下拉，需依赖类型过滤 | 请求体 `paymentTypeIds[]` | 本地已实现项目面板和复选提交 | 先选类型，再根据 `isIncome` 过滤项目选项；未选类型时给出业务提示 | `interaction-clone-20260519103643-facts.json` 断言 `paymentTypeIds=["1"]` |
| 支付方式筛选 | “请选择支付方式” | 目标站展示支付方式下拉 | 请求体 `paymentWayIds[]` | 本地已映射单选支付方式 | 保持支付方式来源于服务层，不在组件内硬编码列表 | `interaction-clone-20260519103643-facts.json` 断言 `paymentWayIds=["2"]` |
| 房间筛选 | “关联房间” | 目标站展示房间筛选入口 | 请求体 `roomIds[]`，辅助接口先取房型再取房间 | 本地已实现房间弹窗和树状勾选 | 使用服务层房间树，提交后把选中房间写入 `roomIds` | `interaction-clone-20260519103643-facts.json` 断言 `roomIds=["1796425099544543234"]` |
| 搜索 | 搜索框 | 目标站展示搜索输入 | 请求体 `keyword` | 本地已接 `keyword`，当前专项验证未单独输入搜索词 | 保持搜索字段透传，等待后续真实搜索样本扩展 | diagnostics 可读 `keyword`；当前默认批次为空字符串 |
| 重置 | “重置” | 目标站有重置按钮 | 恢复默认请求体 | 本地已恢复默认日期、筛选和弹层状态 | 重置时同时清理 notice、error、项目面板、房间弹窗和详情态 | `interaction-clone-20260519103643-facts.json` 断言 `isIncome/type` 复位 |
| 导出 | “导出” | 目标站有导出按钮，未抓到真实导出请求 | 本地导出任务契约 `createOrderLedgerExportTask()` | 本地已返回显式 mock taskId | 用统一响应包返回导出任务，不做静默成功 | `interaction-clone-20260519103643-facts.json` 断言 `order-ledger-export-20260519-001` |
| 账本概括 | 净收入/总收入/总支出 | 目标站展示 3 个概括指标 | 主接口 `data.extraInfo.totalInfo` | 本地已适配为 `summary` | 服务层负责从 Hudson `totalInfo` 收口到业务汇总模型 | `default-target-20260519083818-facts.json` 与本地默认态均显示 `1002.54/1002.54/0.00` |
| 明细表格 | 14 列列表 | 目标站默认展示 2 行收入记录 | 主接口 `data.list[]` | 本地已按适配后的 `records` 渲染 | 保留真实表头和默认两行数据，移除组件内散落假数据 | `default-clone-20260519103643-facts.json` 断言订单号和表头 |
| 详情入口 | 行内“查看详情” | 目标站打开订单详情抽屉，同时右侧存在“收款记录/空空如也” | 目标站详情由列表行数据和订单侧栏承接，未发现独立详情接口 | 本地已用 `detail` 字段驱动详情抽屉与收款记录层 | 无现成独立详情页时，使用本地 mock 详情抽屉承接业务细节 | `detail-target-20260519084047-facts.json` 对照 `detail-clone-20260519103643-facts.json` |
| 详情底部 | “更多操作” | 目标站详情底部有“更多操作”与“收款” | 目标站实际下钻操作未在本轮继续抓包 | 本地以项目现有路由承接更多操作 | 通过“查看订单页”和“查看房态页”把本页与已有业务页连接起来 | `detail-clone-20260519103643-facts.json` 断言跳转到 `/order/house-order/list` 与 `/statistics/roomSituation` |
| 收款记录层 | “收款款项 / 收款记录” | 目标站详情右侧展示收款切页，当前样本为“空空如也” | 详情记录中的 `paymentRecords[]` | 本地已与详情抽屉同时显示 | 保持可见交互反馈，即使当前记录为空也明确展示空态 | `detail-target-20260519084047-facts.json` 与本地 detail 批次均出现“空空如也” |
| 空态 | `mockState=empty` | 目标站未取证到空态 UI | 主接口成功包但 `list=[]`、汇总为 0 | 本地已显式空态 | 用统一结构展示“当前筛选条件下暂无收支流水”，不静默塌陷 | `empty-clone-20260519103643-*` |
| 错误态 | `mockState=error` | 目标站未取证到错误 UI | 主接口失败包 | 本地已显式错误态 | 展示失败文案和“重新加载”，禁止静默 fallback | `error-clone-20260519103643-*` |
| 数据诊断 | 隐藏节点 `#order-ledger-diagnostics` | 目标站无此节点 | provider/state/request diagnostics | 本地已保留隐藏诊断节点 | 仅给自动化和审计读，不在正文暴露开发态文案 | 所有本地 clone facts 读取 `data-provider`、`data-state`、`data-request` |

## 已验证筛选映射

| 可见交互 | 目标/本地契约结果 | 证据 |
| --- | --- | --- |
| 类型 = 支出 | `{ "isIncome": 0 }` | `interaction-clone-20260519103643-facts.json` |
| 来源 = 住宿订单 | `{ "type": 1 }` | `interaction-clone-20260519103643-facts.json` |
| 类型 = 收入 + 项目 = 房费 | `{ "isIncome": 1, "paymentTypeIds": ["1"] }` | `interaction-clone-20260519103643-facts.json` |
| 支付方式 = 微信 | `{ "paymentWayIds": ["2"] }` | `interaction-clone-20260519103643-facts.json` |
| 房间 = 总裁套间（桑拿浴缸露台电竞麻将）房间1 | `{ "roomIds": ["1796425099544543234"] }` | `interaction-clone-20260519103643-facts.json` |

## 补充说明

- 目标站真实页面右侧长期挂载聊天会话侧栏，本地 clone 沿用了项目壳层的 ChatDock；自动化验证中会主动折叠，避免遮挡本页证据。
- 目标站订单详情抽屉比本地 clone 更重，但本轮 prompt 的重点是统一数据层、显式 mock provider、接口契约和交互闭环；因此本地优先保留收支明细主流程和可回归承接。
