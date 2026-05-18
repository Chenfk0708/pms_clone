# 月房态交互矩阵

- 任务：`fangtai--fangtai-guanli--yuefangtai`
- 页面：月房态
- 本轮复核日期：2026-05-18
- 数据服务：`src/services/houseMonths.ts`
- provider：默认 `mock` 支撑当前页面展示；`real` 仅通过 `pms.houseMonthsProvider=real` / `VITE_HOUSE_MONTHS_PROVIDER=real` 显式切换，组件不直接读取 mock 常量。
- 关键证据：`tests/months.spec.ts`、`scripts/capture-house-months-real.mjs`、`artifacts/screenshots|dom-snapshots|style-dumps|network/fangtai--fangtai-guanli--yuefangtai/`

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口与导航 | 房态 > 房态管理 > 月房态 | URL 为 `/houseManage/months`，房态顶栏和月房态侧栏高亮 | 路由渲染 `HouseMonthsPage` | 已接入项目 layout、侧栏和路由 | 保持现有 AppShell 与路由映射 | `tests/routes.spec.ts --grep "houseManage/months"` |
| 数据源 | 页面首屏数据 | 目标站读取链路可作为后续 real provider 对照；当前阶段需要先用 mock 数据展示房型、房间、库存、订单 | mock provider 默认返回 `{ code, message, data, traceId, timestamp }`；real provider 保留 `/camps/get`、`/roomStatuses/rooms/get`、`/occ/get`、`/inv/get`、`/block/get`、`/dailyMonitor/get`、`/redDot/get`、`/orderDetails/get` | 已由 `fetchHouseMonthsSnapshot()` 统一发起并适配；组件只消费 `MonthRoomGroup` | 默认 mock 展示，real provider 显式切换验证 | `tests/months.spec.ts` 默认 mock 与 real provider 用例 |
| 数据源 | mock provider | 本阶段用集中 mock 数据支撑 UI 和接口文档 | mock provider 返回 `{ code, message, data, traceId, timestamp }` 统一响应包 | 默认启用 mock；支持 `success/empty/error` | 已新增统一响应包解包、空态、失败态 | `tests/months.spec.ts --grep "documented mock provider|centralized mock"` |
| 顶部筛选 | 房型筛选 | 打开房型列表，选择后按房型刷新月房态 | `fetchHouseMonthsSnapshot({ roomCategoryId })`；real/mock provider 都消费参数 | 已有下拉、选中、刷新和空态反馈 | 由服务层参数驱动，不在组件硬编码数据 | Playwright 点击房型筛选并断言 UI 更新 |
| 顶部筛选 | 房型标签 | 目标站存在入口；当前无可用标签数据时显示空态 | 未来标签筛选参数待后端确认 | 本地显示 `暂无数据`，不静默无响应 | 记录后端待确认 | Playwright 点击后断言空态 |
| 顶部筛选 | 搜索房源 | 输入房源/客人/渠道单/备注后刷新 | `fetchHouseMonthsSnapshot({ queryCode })` | 已接入查询按钮和请求参数 | 保持按钮 loading 禁用 | `tests/months.spec.ts` 搜索/空态断言 |
| 顶部筛选 | 清除筛选 | 清空关键词和房型并刷新 | `fetchHouseMonthsSnapshot({ queryCode: undefined, roomCategoryId: undefined })` | 仅有筛选时显示清除按钮 | 已接入重置刷新 | Playwright 筛选后点击清除 |
| 顶部操作 | 刷新/重新加载 | 重新拉取当前条件数据 | `fetchHouseMonthsSnapshot()` | loading 时禁用，失败时显示重试入口 | 已覆盖 loading、成功、失败 | `tests/months.spec.ts` 错误态与刷新用例 |
| 顶部操作 | 读卡 | 目标站依赖本地硬件插件 | 硬件插件生产契约待确认；当前使用统一操作响应 | 显示“读卡已处理”页面反馈 | 当前阶段按业务态反馈展示，页面不出现开发态文案 | Playwright 点击后断言 status |
| 顶部操作 | 房价管理 | 跳到已有中央价/房价页面 | `/houseManage/houseCale` | 已使用项目已有路由 | 无新增路由 | Playwright 点击后断言 URL |
| 顶部操作 | 门店设置 | 跳到门店信息维护 | `/InformationMaintenance/campInfo` | 已使用项目已有路由 | 无新增路由 | 路由点击断言 |
| 更多设置 | 图例说明 | 目标站打开说明入口 | 后续说明接口/弹层待确认 | 显示“图例说明已处理”反馈 | 当前阶段按业务态反馈展示，页面不出现开发态文案 | `tests/months.spec.ts` 菜单用例 |
| 更多设置 | 房态设置 | 目标站打开设置入口 | 后续设置接口/弹层待确认 | 显示“房态设置已处理”反馈 | 当前阶段按业务态反馈展示，页面不出现开发态文案 | `tests/months.spec.ts` 菜单用例 |
| 日历表头 | 日期列点击 | 切换当前高亮日期 | 无新增业务请求 | 已更新 `aria-current` 和标题日期 | 保持本地状态反馈 | `tests/months.spec.ts` 日期点击用例 |
| 日历表头 | 全部收起/展开 | 折叠或展开房间行 | 无新增业务请求 | 已切换房间行显示 | 保持状态反馈 | `tests/months.spec.ts` 展开/收起用例 |
| 房态单元格 | 库存格 | 目标站显示 `余N` 或 `售罄`；日期表头显示 `余N间` | `/roomStatuses/inv/get`、`/roomStatuses/dailyMonitor/get` | 由 adapter 转为 `MonthCell` 和日期列 `remain` | mock 成功态覆盖完整 33 天库存概览，不显示 `未返回` | 服务层适配测试与默认 mock 展示用例 |
| 订单单元格 | hover | 显示订单悬浮信息 | `/roomStatuses/orderDetails/get` | 已显示客人、渠道、金额、备注 | 字段缺失显示 `-` | `tests/months.spec.ts` hover 用例 |
| 订单单元格 | 点击 | 打开右侧订单详情抽屉 | `/roomStatuses/orderDetails/get` | 已打开抽屉并可关闭；抽屉操作按钮显示业务态处理反馈 | 当前阶段按业务态反馈展示，页面不出现开发态文案 | `tests/months.spec.ts` drawer 用例 |
| 批量操作 | 批量设脏/净 | 进入批量选择并提交 | 写操作生产接口待后端确认；当前返回统一操作响应 | 已可选择间夜；提交显示“批量设脏已完成：已设为脏房”类反馈 | 当前阶段按业务态反馈展示，页面不出现开发态文案 | `tests/months.spec.ts` batch 用例 |
| 批量操作 | 批量开/关房 | 进入批量选择并提交 | 写操作生产接口待后端确认；当前返回统一操作响应 | 已可选择/取消；提交显示“批量开房已完成：已设为开放房”类反馈 | 当前阶段按业务态反馈展示，页面不出现开发态文案 | `tests/months.spec.ts` batch 用例 |
| 异常反馈 | real provider 失败 | 显示后端业务失败/HTTP/解析错误 | real provider 抛出明确异常 | 页面显示 `月房态数据加载失败` 和重试按钮 | 不回退静态假数据；默认展示不进入 real provider | `tests/months.spec.ts` real provider 失败用例 |
| 异常反馈 | mock provider 失败 | 统一响应包 `code != 0` 时暴露错误 | mock `error` 包 | 页面显示 `月房态数据加载失败，请稍后重试` 和重试按钮 | 新增错误态测试；页面不出现 mock 字样 | `tests/months.spec.ts --grep "centralized mock"` |
| 空态反馈 | real/mock 空数据 | 保持页面结构并显示空态 | provider 返回空 `list` | 显示 `暂无月房态数据` | 不崩溃；当前阶段按 mock 空态展示 | mock 空态与 real 空态用例 |
| 验收产物 | target/clone artifacts | 固定 Chrome 截图、DOM、style、network、interaction matrix | `scripts/capture-house-months-real.mjs` | 已有 2026-05-16 target/clone 真实数据批次；本轮新增 mock provider 测试验证 | 继续保留专属目录 | `artifacts/.../fangtai--fangtai-guanli--yuefangtai/` |
