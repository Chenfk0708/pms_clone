# 日房态交互矩阵

- TASK_ID：`fangtai--fangtai-guanli--rifangtai`
- 页面：`房态 > 房态管理 > 日房态`
- 目标 URL：`https://minsubao.localhome.cn/houseManage/days`
- 取证批次：`20260516-audit`、`20260518-business-copy`
- 结论：当前目标站取证显示日房态包含 4 个房间卡，其中 `天落大床电竞套间/1` 为 `张祯/携程/¥136.62`，`观影大床房/房间1` 为 `胡志深/美团酒店/¥112.9`；核心接口包括 `roomStatusesToday/get`、`rooms/get`、`roomCategories/page/get`、`cleanTask/status/count`。本地页面以显式数据服务承接，正文保持业务可用文案，不展示 provider、traceId、未接入或阻塞类开发态提示。
- 2026-05-18 补强：新增 `src/services/houseDays.ts`，日房态首屏、刷新、搜索、视图切换、状态/渠道/房型/标签筛选均通过显式 `mock provider` 返回统一响应包，再适配为 `HouseDaysViewModel` 供组件消费；组件不再直接消费 `houseDaysData.ts` 静态数据。当前 provider 切换点为 `VITE_PMS_HOUSE_DAYS_PROVIDER=real`，真实 provider 未接入时集中抛错，不在组件内 fallback。
- 2026-05-18 新增正文约束补强：页面正文不得出现 `mock`、`mock provider`、`未接入`、`阻塞`、`后端未就绪`、`后端接口未完成` 等开发态文案；此类信息仅保留在交互矩阵、接口文档、开发记录和取证产物中。卡片详情、房态设置、读卡、批量操作均改为业务态弹窗或反馈。
- 2026-05-18 本地取证批次：`20260518-business-copy`，路径见 `artifacts/screenshots|dom-snapshots|style-dumps|network/fangtai--fangtai-guanli--rifangtai/`。Playwright 断言已覆盖首屏、错误态、空态和业务弹窗，页面 body 不包含上述开发态文案。

| 区域 | 元素/按钮 | 目标站行为 | 触发请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口导航 | 侧栏 `日房态` | 从房态菜单进入 `/houseManage/days`，侧栏高亮日房态 | 页面初始化请求 `roomStatusesToday/get`、`rooms/get` 等 | 已注册 `/houseManage/days`，侧栏可高亮 | 保持现有路由与菜单状态 | `tests/routes.spec.ts` `/houseManage/days renders` |
| 顶部分段 | `月房态` | 跳转 `/houseManage/months` | 导航后月房态重新请求 | 已补 React Router 跳转 | 点击直接进入已有月房态页面 | `days matches captured navigation interactions` |
| 顶部分段 | `日房态` | 当前页 active | 无新增请求 | 已 active | 保持当前状态 | `/houseManage/days renders` |
| 门店筛选 | `全部门店`、门店 chip | 目标站切换门店后重新取房态 | `roomStatusesToday/get`、`rooms/get`，本地 mock path `/houseManage/days/overview` | 通过 `HouseDaysQuery.storeId` 固定传入取证门店，mock provider 返回统一响应包 | 当前先展示已取证门店；后端就绪后在 provider 层接入门店切换请求 | `house-days.spec.ts` mock provider 首屏用例；`routes.spec.ts` 日房态渲染 |
| 门店设置 | 齿轮按钮 | 跳转 `/InformationMaintenance/campInfo` | 设置页请求门店信息 | 已补跳转 | 使用项目已有门店信息路由 | `days matches captured navigation interactions` |
| 搜索 | 客户/手机/房间/渠道单/备注输入 | 目标站按关键词刷新房态或定位订单 | 与当前筛选一起触发房态请求，本地 mock provider 消费 `keyword` | Enter 后把关键词传入 `fetchHouseDays`，页面反馈“已按关键词更新日房态” | 已接入服务层参数，不做组件内静态筛选假成功 | `routes.spec.ts` 反馈用例；`house-days.spec.ts` 首屏和刷新 |
| 顶部操作 | `读卡` | 依赖读卡器/客户端能力读取证件 | 外设/客户端接口，目标未在本地可复现 | 原无反馈 | 点击反馈“请连接读卡器后重试，或手动搜索住客信息” | `house-days.spec.ts` 业务弹窗/反馈用例 |
| 顶部操作 | `房价管理` | 进入房价管理相关页面 | 导航后请求房价接口 | 原为静态按钮 | 跳转项目已有 `/houseManage/houseCale` | `source blockers` 用例 |
| 顶部操作 | `更多设置` | 展开菜单：图例说明、房态设置 | 菜单本身无请求；房态设置入口需目标复核 | 已可展开 | 图例弹出说明；房态设置打开业务弹窗，保存后显示“房态设置已保存” | `room-status interactions`、`house-days.spec.ts` 业务弹窗用例 |
| 批量操作 | `批量设脏/净` | 展开批量菜单，选择后需先选房并提交 | 目标提交接口未在本轮安全接入 | 已可展开 | 菜单项点击提示“请选择房间后再批量设脏/设净” | `room-status interactions`、`routes.spec.ts` 业务反馈 |
| 批量操作 | `批量开/关房` | 展开批量菜单，选择后需先选房并提交 | 目标提交接口未在本轮安全接入 | 已可展开 | 菜单项点击提示“请选择房间后再批量关房/开房” | `room-status interactions` |
| 顶部操作 | `刷新`、`重新加载` | 重新拉取当前房态 | `roomStatusesToday/get` 等；本地 mock provider 重新生成统一响应包 | 本地清空筛选并递增刷新触发器 | 显示“日房态已刷新，筛选条件已重置” | `house-days.spec.ts` 刷新断言 |
| 主内容 | 房间卡片 | 目标站当前有 2 张订单卡和 2 张普通房卡；点击可能打开房间/订单详情 | 详情接口后续按目标站确认；列表来自 `/houseManage/days/overview` mock 响应 | 已由 `rooms[]` 业务模型渲染，不再从组件静态常量渲染 | 卡片点击打开“房间详情”业务弹窗；空态响应时显示“暂无可展示房间” | `house-days.spec.ts` 成功/空态/错误态；`routes.spec.ts` 卡片弹窗 |
| 右侧视图 | `按房型/按房间号/按楼层` | 切换房态分组视图 | 目标站主要更新前端布局；本地作为 `viewMode` 请求参数 | 已可切换 active、摘要，并重新调用数据服务 | 保持本地状态反馈和服务层参数更新 | `routes.spec.ts` 视图切换；本地取证 `view-room-number-clone-20260518-business-copy.*` |
| 右侧筛选 | 入离、房态、保洁状态、其他标签 checkbox | 目标站筛选当前房态 | 与房态请求参数联动；本地传 `statusFilters` | 已可勾选、显示标签并触发 mock provider | 勾选后显示本地筛选和数据服务反馈 | `routes.spec.ts` 交互用例 |
| 右侧筛选 | 渠道、房型、标签下拉 | 目标站切换选项后刷新当前房态 | 与房态请求参数联动；本地传 `channel`、`roomType`、`tag` | 下拉选项来自服务层 `channelOptions/roomTypeOptions/tagOptions` | 变更后显示反馈并触发服务层参数更新 | `routes.spec.ts` 渠道反馈；`house-days.spec.ts` 空态防静态 fallback |
| 状态 | loading/success/error/empty/disabled | 目标站真实请求时有 loading/空态/错误态 | 真实接口；本地 mock provider 支持 `success/empty/error` | 已新增 `日房态数据服务状态`、`日房态数据错误`、空态区域和重试按钮 | loading、成功、业务失败、空态均有可见反馈；真实 provider 未配置时集中抛错 | `house-days.spec.ts` 3/3；触达文件 ESLint/隔离 tsc |
