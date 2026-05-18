# 其他价格交互矩阵

任务：`fangtai--fangjia-guanli--qita-jiage`

取证来源：

- 目标站：固定 Chrome + `playwright/.auth/pms-user.json` 访问 `https://minsubao.localhome.cn/houseManage/otherPrice`，历史新鲜批次 `20260516-062858`，未登录阻塞为 false。
- 本地页：固定 Chrome 访问 `http://127.0.0.1:4173/houseManage/otherPrice`，本轮批次 `20260518-business-mock`，覆盖 success / empty / error 三种 mock provider 状态。

页面正文约束：当前页面正文不展示 `mock`、`未接入`、`阻塞`、`后端` 等开发态文案；provider、traceId、请求摘要仅写入隐藏契约节点、接口文档和取证产物。

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 项目入口 | 房态 > 房价管理 > 其他价格 | URL 为 `/houseManage/otherPrice`，房态/房价管理/其他价格高亮，进入其他价格页 | 目标站首屏涉及 `/camps/get`、`/select/calChannel4RoomCategory/get`、`/roomCategories/page/get`、`/roomCategoryPricings/get`、`/roomCategoryRules/get` | 路由和菜单已接入 `PricePage` | 保留现有路由，页面由 `src/services/otherPrice.ts` 显式 provider 驱动 | `tests/other-price.spec.ts` 首屏断言页面业务数据、无 Hudson 请求、隐藏契约 provider 为 `mock` |
| 顶部页签 | 杂费设置 / 活动设置 | 切换同页表格；活动设置显示 `+新增设置`、连住折扣和甩卖阶段列 | 读接口数据已在统一服务返回，页签切换不另发请求 | 可切换，数据来自服务层适配后的 `feeRows/activityRows` | 移除组件内静态兜底行，页签仅消费业务模型 | Playwright 点击页签后断言表格出现且无开发态文案 |
| 顶部筛选 | 渠道下拉 | 展开渠道选项，选择后按渠道过滤 | mock 契约参数 `channelId`；real 契约映射为 `channelIds` | 选项来自 `OtherPriceData.channels` | 选择后重新调用 `loadOtherPriceData({ channelId })`，隐藏契约节点记录请求摘要 | 专项测试选择筛选后断言 UI 刷新和 `data-request-summary` |
| 顶部筛选 | 房型下拉 | 展开房型选项，选择后按房型过滤 | mock 契约参数 `roomCategoryId`；real 契约映射为 `roomCategoryIds` | 选项来自 `OtherPriceData.rooms` | 选择后重新调用数据服务，不在组件内过滤静态数组 | 专项测试选择 `星河露台套房` 后只显示对应房型，隐藏契约记录 `roomCategoryId=room-mock-b` |
| 顶部操作 | 刷新 | 重新拉取当前条件数据 | `loadOtherPriceData(currentQuery)` | 可点击，loading 期间禁用 | 显示“正在刷新当前筛选数据”和 loading，成功后恢复业务数据 | 专项测试覆盖刷新触发 error mode 并显示重试 |
| 顶部操作 | 重置 | 恢复全部平台/全部房型 | `loadOtherPriceData({})` | 已新增 | 重置筛选并给出“筛选条件已重置”反馈 | 路由/专项可扩展断言 |
| 顶部操作 | 导出 | 目标站可见导出类动作按业务导出任务承接 | 未来 `POST /api/houseManage/otherPrice/export` | 已新增业务反馈 | 显示“导出任务已创建，可在消息中心查看进度” | 专项测试点击导出断言业务反馈 |
| 杂费表格 | 押金/可加客人数/加人费/餐食数量/佣金率 设置 | 点击 `设置` 打开改价抽屉，输入金额后提交 | 未来保存契约待后端确认，本阶段按 mock 保存成功沉淀 | 抽屉可打开、输入、关闭 | 保存显示“杂费设置已保存”，不展示开发态未接入文案 | 专项测试点击设置、输入、保存后断言业务反馈 |
| 活动表格 | +新增设置 | 打开活动设置抽屉，展示连住天数说明和添加按钮 | 未来 `POST /api/houseManage/otherPrice/activity` | 抽屉可打开 | 添加显示“连住活动时段已添加”，保存显示“活动设置已保存” | Playwright 可点击验证，无静默按钮 |
| 活动表格 | 甩卖阶段设置 | 点击设置打开改折扣抽屉，含阶段时间与折扣输入 | 未来活动更新契约待后端确认 | 抽屉可打开 | 保存显示“活动折扣已保存” | Playwright 可点击验证，无开发态正文 |
| 状态反馈 | loading / empty / error / disabled | 加载、空态、失败和禁用必须可见 | 统一响应包 `code/message/data/traceId/timestamp` | 已覆盖 | 页面正文显示业务态：数据已更新、暂无记录、数据加载失败；开发 trace 写入隐藏契约与文档 | 专项测试覆盖 success、empty、error |
| 跨页入口 | 房价管理页签导航 | 门市价、电子房价牌等跳转到已有路由 | 无额外接口 | 由 `PriceTabs` / 项目侧栏承接 | 保留项目已有路径，不硬编码不存在路由 | `tests/routes.spec.ts` 覆盖 `/houseManage/otherPrice` 入口 |

待用户确认项：保存杂费、保存活动、导出任务三个写操作的生产接口 path、请求体和权限规则仍需后端确认；当前页面按业务态 mock 成功闭环，接口文档已列为待确认。
