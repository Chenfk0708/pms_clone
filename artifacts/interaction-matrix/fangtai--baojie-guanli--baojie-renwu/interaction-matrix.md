# 保洁任务交互矩阵

## 取证来源

- 目标站固定 Chrome 截图：`artifacts/screenshots/fangtai--baojie-guanli--baojie-renwu/target-20260518-business-provider.png`
- 本地固定 Chrome 截图：`artifacts/screenshots/fangtai--baojie-guanli--baojie-renwu/clone-20260518-business-provider.png`
- 目标站 Network：`artifacts/network/fangtai--baojie-guanli--baojie-renwu/target-20260518-business-provider.json`
- 本地 Network：`artifacts/network/fangtai--baojie-guanli--baojie-renwu/clone-20260518-business-provider.json`
- DOM 快照：`artifacts/dom-snapshots/fangtai--baojie-guanli--baojie-renwu/target-20260518-business-provider.html`、`artifacts/dom-snapshots/fangtai--baojie-guanli--baojie-renwu/clone-20260518-business-provider.html`
- 样式事实：`artifacts/style-dumps/fangtai--baojie-guanli--baojie-renwu/target-20260518-business-provider.json`、`artifacts/style-dumps/fangtai--baojie-guanli--baojie-renwu/clone-20260518-business-provider.json`

## 目标站接口事实

- `POST https://hudson-prod.localhome.cn/cleanTask/page/get`
  - 请求体：`campId/pageNum/pageSize/cleanTime/roomId/cleanerIds`
  - 本轮取证示例：`campId="1796067693589061634"`、`pageNum=1`、`pageSize=20`、`cleanTime="2026-05-18"`、`roomId=null`、`cleanerIds=[]`
- `POST https://hudson-prod.localhome.cn/cleaner/list/get`
  - 请求体：`campId`
- `POST https://hudson-prod.localhome.cn/roomCategories/page/get`
  - 请求体：`campId/pageSize/pageNum/roomCategoryName/keyword/cityIds/channelId`
- `POST https://hudson-prod.localhome.cn/rooms/get`
  - 请求体：`campId/roomCategoryIds/saleType`

## 交互矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 页面入口 | `/cleanManage/cleanTask` 路由 | 进入保洁任务页，侧栏保洁任务高亮 | 首屏加载菜单、房间、保洁员、任务分页请求 | 已接入项目 AppShell 与侧栏 | 保持菜单高亮，移除旧未开通遮罩断言 | `tests/routes.spec.ts --grep "cleanTask"` 断言 URL、菜单和业务数据 |
| 顶部筛选 | 门店切换 | 切换门店上下文并刷新当前页数据 | `cleanTask/page/get`，保留 `poiId` 扩展字段 | 点击后刷新 provider 并显示业务反馈 | 使用服务层参数刷新，不在组件内硬编码任务 | Playwright 点击门店后断言反馈文本 |
| 顶部日期 | 前一天/后一天/日期输入 | 目标站以 `cleanTime` 刷新任务 | `createCleanTaskRequestBody()` 输出 `cleanTime` | 切换日期后重新拉取数据 | 已把本地请求体字段从 `cleanDate` 收口为 `cleanTime` | 状态行显示 `cleanTime=YYYY-MM-DD` |
| 顶部操作 | 刷新 | 重新拉取当前条件数据 | `fetchCleanTaskDashboard(filters)` | 有 loading 与刷新成功反馈 | 保持按钮可点，刷新时清空旧错误 | `tests/clean-task.spec.ts` 断言“数据已刷新” |
| 顶部操作 | 导出 | 目标站应创建导出任务或下载文件 | 建议 `POST /cleanTask/export` | 当前显示导出任务已创建及接口 path | 不做静默下载，先给业务反馈 | Playwright 点击后断言操作反馈 |
| 顶部操作 | 更多 | 展开更多业务入口 | 项目内部路由 | 已展开菜单，跳转保洁统计、保洁日志、保洁设置 | 使用已有路由，不硬编码不存在页面 | Playwright 点击菜单后断言跳转到 `/cleanManage/cleanStatistics` |
| 筛选区 | 房型房间 | 打开房间筛选项，选择后查询 | 目标站关联 `roomCategories/page/get`、`rooms/get`；列表请求传 `roomId` | 已有房间下拉，选中后进入请求体 | 全部房间传 `roomId=null` | Playwright 选择并查询后断言状态行/列表变化 |
| 筛选区 | 保洁类型 | 选择退房/续住/计划/临时保洁 | `cleanType` | 已有下拉和单选反馈 | 服务层过滤列表，组件只消费结果 | Playwright 选择 `CHECKOUT` 后仅显示对应任务 |
| 筛选区 | 保洁状态 | 选择待分配/待保洁/保洁中/已完成/已取消 | `cleanStatus` | 已有下拉和单选反馈 | 服务层过滤列表 | Playwright 选择 `PENDING_CLEAN` 后断言请求状态 |
| 筛选区 | 保洁员 | 选择保洁员 | 目标站 `cleaner/list/get` 初始化，任务请求传 `cleanerIds` | 已有保洁员下拉，任务请求体输出 `cleanerIds` | 与目标站数组字段保持一致 | 状态行显示 `cleanerIds=ALL` 或具体 ID |
| 操作区 | 查询 | 按当前筛选刷新任务 | `POST /cleanTask/page/get` | 有 loading、结果和空态 | 用 provider 统一处理 success/empty/error | Playwright 断言请求状态和列表 |
| 操作区 | 重置 | 恢复默认筛选并刷新 | `fetchCleanTaskDashboard(defaultFilters)` | 已重置日期、类型、状态、人员和页码 | 清空选中任务，避免旧选中污染批量操作 | Playwright 断言状态回到 `status=ALL` |
| 操作区 | 批量通知 | 需先勾选任务；提交通知 | 建议 `POST /cleanTask/notify` | 未勾选时 disabled，勾选后可点击并显示通知数量 | 覆盖 disabled 和 success feedback | Playwright 断言按钮 disabled/enabled/反馈 |
| 操作区 | 创建保洁任务 | 打开创建弹窗，填写备注并确认 | 建议 `POST /cleanTask/create` | 有弹窗、备注输入、取消和确认反馈 | 确认后关闭弹窗并清理输入 | Playwright 断言弹窗打开、填写、确认反馈 |
| 指标卡 | 今日任务/待分配/待保洁/保洁中/已完成 | 目标站呈现任务概览 | 来自统一响应包 `data.summary` | 指标来自服务层 summary | 点击指标给业务态反馈 | Playwright 通过首屏测试断言指标存在 |
| 进度区 | 今日进度条 | 按任务状态显示进度 | 来自 `data.summary` | 按当前列表计算百分比 | 点击进度行反馈筛选意图 | Playwright 首屏截图覆盖 |
| 快捷入口 | 查看日房态 | 跳转房态页 | `/houseManage/days` | 已使用既有路由 | 保持跨页闭环 | Playwright 点击后断言 URL |
| 快捷入口 | 查看关联订单 | 跳转住宿订单页 | `/order/house-order/list` | 已使用既有路由 | 保持跨页闭环 | `routes.spec.ts` 覆盖 |
| 快捷入口 | 调整保洁人员 | 跳转保洁人员页 | `/cleanManage/cleanStaff` | 已使用既有路由 | 保持跨页闭环 | 路由回归覆盖 |
| 表格 | 勾选任务 | 选中任务用于批量通知 | 无额外请求 | 已更新 `selectedIds` | 选中状态驱动批量按钮 | Playwright 勾选后断言按钮可用 |
| 表格 | 查看详情 | 打开任务详情弹窗 | 后续可接详情接口；当前使用列表行数据 | 已展示任务编号、关联订单、住客、备注、进度 | 无现成详情接口时以弹窗承接 | Playwright 断言 `CT20260518001` 出现在弹窗 |
| 状态 | Loading | 请求中展示加载态并禁用重复语义 | provider promise | 表格区域 `aria-busy` 与加载文案 | 避免静默无响应 | 专项测试进入页面等待业务数据 |
| 状态 | Empty | 列表为空时页面结构不崩 | 统一响应包 `data.list=[]` | `?scenario=empty` 可复现 | 保持指标为 0、表格空态 | Playwright 断言空态文案 |
| 状态 | Error | 接口失败时明确暴露错误和重试 | provider 抛错或失败包 | `?scenario=error` 可复现，显示 alert 和重试 | 不吞错，不假成功 | Playwright 断言 alert、重试恢复 |
| 页面正文 | 开发态文案禁用 | 目标态应表现为业务可用页 | 无 | 页面可见区域不展示开发态说明 | 开发信息仅放入文档/矩阵/记录 | 测试断言旧未开通文案不存在 |

## 本轮结论

- 旧矩阵中“未开通智能保洁”为 2026-05-15 之前的状态，本轮已以 2026-05-18 新 prompt 改为业务可用页闭环。
- 本地保洁任务页现在由 `src/services/cleanTask.ts` 的显式 provider 驱动，核心业务数据不再写在页面组件中。
- 目标站真实请求体已沉淀为接口文档和服务层请求体构造依据，仍需后端确认写操作接口和最终响应字段。
