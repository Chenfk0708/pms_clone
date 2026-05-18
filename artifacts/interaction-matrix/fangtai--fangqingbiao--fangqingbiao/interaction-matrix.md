# 房情表交互矩阵

- 任务 ID：`fangtai--fangqingbiao--fangqingbiao`
- 页面：房情表
- 本地入口：`/statistics/roomSituation`、`/houseManage/houseStatus`
- 目标站：`https://minsubao.localhome.cn/statistics/roomSituation`
- 当前数据源：`src/services/roomSituation.ts` 的显式 mock provider，支持集中切换 `roomSituationProvider=real`

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口 | 顶部导航/侧栏房情表 | 进入房情表，房态菜单与房情表项高亮 | 无新增请求 | `/statistics/roomSituation` 和 `/houseManage/houseStatus` 均渲染房情表 | 复用现有 AppShell、路由和菜单高亮 | Playwright 断言 `.topnav-link.is-active`、`.sidebar-link.is-active` |
| 顶部切换 | 单日房情表 | 显示单日房型指标表 | `POST /report/dailyRoomStatus/get`，body 含 `campId/date/poiIds/pageNum/pageSize` | 已接入 mock provider，组件消费适配后 `DailyRoomSituationRow[]` | 保持业务态展示，provider 信息放入 DOM 属性和文档 | `tests/room-situation-interactions.spec.ts` 断言首行合计数据 |
| 顶部切换 | 远期房情表 | 显示远期可售/占用矩阵 | `POST /report/forwardRoomStatus/get`，body 含 `campId/startDate/endDate/poiIds/pageNum/pageSize` | 已接入 mock provider 和 real provider 契约测试 | 切换后按同一 adapter 渲染 `ForwardRoomSituationRow[]` | Playwright 点击远期房情表并断言矩阵文本 |
| 门店筛选 | 全部门店/当前门店按钮 | 目标站展示门店选择和当前门店 | `POST /select/poi/page/get`，body 含 `campId/pageSize/pageNum/channelId/isAvailability` | mock provider 返回门店列表，点击显示业务 tooltip | 页面正文不显示 provider/阻塞等开发态文案 | Playwright 点击后断言 tooltip 可见 |
| 设置 | 齿轮按钮 | 目标站用于表格列设置 | 当前阶段无新增请求 | 点击后显示“列设置已应用”反馈 | 使用业务反馈承接，不展示未接入提示 | Playwright 可见按钮逐项点击，断言有反馈 |
| 指标说明 | 指标说明按钮 | 打开右侧指标说明抽屉 | 无新增请求 | 已有 drawer，可关闭 | 保留目标站指标说明文本 | Playwright 打开/关闭抽屉并断言说明文本 |
| 表格 | 单日表格行 | 展示房型指标数据 | 单日房情表数据服务 | 数据来自统一 mock 响应包后 adapter，不在组件硬编码 | 保留 sticky 房型列和横向滚动 | Playwright 断言首行指标、截图回归 |
| 表格 | 远期表格行 | 展示日期列可售/占用 | 远期房情表数据服务 | 数据来自统一 mock 响应包后 adapter | 动态日期由页面展示层根据返回天数生成 | Playwright 断言远期首行 |
| 分页 | 每页条数 | 目标站切换分页大小后刷新表格 | 同一列表请求，`pageSize` 改变 | 已接入 pageSize 状态并触发服务调用 | mock/real provider 均消费 `pageSize` | Playwright 选择 `50 条/页` 并断言请求体 |
| 空态 | 空数据场景 | 显示暂无数据 | mock scenario `empty`，统一响应包 `code=0,data.list=[]` | 已显示业务空态，不崩溃 | 空态响应写入接口文档 | Playwright `roomSituationMockScenario=empty` |
| 错误态 | 数据失败场景 | 显示错误和重试 | mock scenario `error`，统一响应包 `code!=0` | 已显示错误和重试入口 | 错误正文为业务文案，traceId 仅在服务异常/文档中保留 | Playwright `roomSituationMockScenario=error` |
| 同契约切换 | real provider | 后续接口联调复用同一 adapter | URL query `roomSituationProvider=real` 或 localStorage key | 已保留 real provider 测试，断言目标站 `success/data` 契约适配 | 集中切换，不在组件散落环境判断 | Playwright route mock 真实接口并断言 request body |

## 取证与差异

- 目标站历史取证已存在：`artifacts/screenshots|dom-snapshots|style-dumps|network/fangtai--fangqingbiao--fangqingbiao/`，最近真实数据批次包括 `realdata-target-*20260516*`。
- 本轮新增本地回归截图：`artifacts/screenshots/fangtai--fangqingbiao--fangqingbiao/mock-default-clone.png`、`mock-error-clone.png`。
- 新要求差异：页面正文不得出现开发态文案，因此 provider、endpoint、traceId 等仅保留在 DOM 属性、测试、接口文档和实时记录中。
