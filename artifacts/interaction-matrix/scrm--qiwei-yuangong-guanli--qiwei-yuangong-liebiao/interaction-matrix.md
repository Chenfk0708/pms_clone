# 企微员工列表交互矩阵

- 任务：`scrm--qiwei-yuangong-guanli--qiwei-yuangong-liebiao`
- 目标页：`https://minsubao.localhome.cn/customer/staffList`
- 本地页：`/customer/staffList`
- 取证时间：`2026-05-19 16:50-17:32 +08:00`
- 关键证据：
  - `artifacts/screenshots/scrm--qiwei-yuangong-guanli--qiwei-yuangong-liebiao/default-target-20260519-continue-target.png`
  - `artifacts/network/scrm--qiwei-yuangong-guanli--qiwei-yuangong-liebiao/default-target-20260519-continue-target.json`
  - `artifacts/screenshots/scrm--qiwei-yuangong-guanli--qiwei-yuangong-liebiao/default-clone-20260519-harness4189-local-success.png`
  - `artifacts/screenshots/scrm--qiwei-yuangong-guanli--qiwei-yuangong-liebiao/empty-clone-20260519-harness4189-local-empty.png`
  - `artifacts/screenshots/scrm--qiwei-yuangong-guanli--qiwei-yuangong-liebiao/error-clone-20260519-harness4189-local-error.png`
  - `artifacts/network/scrm--qiwei-yuangong-guanli--qiwei-yuangong-liebiao/default-clone-20260519-harness4189-local-success.json`
  - `artifacts/network/scrm--qiwei-yuangong-guanli--qiwei-yuangong-liebiao/empty-clone-20260519-harness4189-local-empty.json`
  - `artifacts/network/scrm--qiwei-yuangong-guanli--qiwei-yuangong-liebiao/error-clone-20260519-harness4189-local-error.json`

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 页面入口 | 顶部 `SCRM`、左侧 `企微员工管理 > 企微员工列表` | 进入 `/customer/staffList`，顶部与侧栏高亮同步 | 无新增业务请求，依赖现有路由和导航结构 | 已接入现有 `AppShell` 导航体系 | 保持现有路由与高亮，页面主体替换为服务层驱动的订阅页 | Playwright 进入 `/customer/staffList` 后断言 URL、顶部 `SCRM`、侧栏 `企微员工列表` 均高亮 |
| 订阅主态 | `企微SCRM-员工管理` 主标题、说明文案 | 目标账号当前看到的是未开通订阅页，不是员工表格 | 目标站首屏实际伴随 `POST /edition/resource/get`、`POST /paymentTypes/get/v2` 等订阅相关请求 | 本地默认态已落在订阅门槛页 | 用统一 `staffList` 服务收口成页面级 bootstrap 契约，显式由 `mock` provider 驱动正文 | 断言隐藏契约节点 `data-testid="staff-list-contract"` 存在，且 `data-response-state="success"` |
| 订阅主动作 | `立即开通` | 目标站进入应用订阅详情，当前链路落到 `/version/applicationPayment/detail` | 本地页面路由承接，不额外创建不存在页面 | 已可点击并跳转至现有订阅详情页 | 复用现有 `/version/applicationPayment/detail` 路由，并通过 `state.product='scrm'` 承接 SCRM 购买详情 | 点击后断言 URL 为 `/version/applicationPayment/detail`，并看到 `企微SCRM`、`购买信息`、`￥150.6`、`立即购买` |
| 商品详情 | `商品详情` 区域与三张宣传图 | 目标站正文展示产品说明图，不提供额外业务按钮 | 静态资源展示，无额外写请求 | 已展示三张业务图 | 保持为服务层输出的业务视图模型，不在组件里硬编码散落图片配置 | 断言 `商品详情` 标题可见，三张图片 alt 文案可见 |
| 加载态 | 首屏 loading | 目标站有首屏异步加载过程 | 本地统一从 `loadStaffListViewModel()` 进入 loading，再落 success/empty/error | 已实现 | 显式保留 loading 卡片，避免页面静默空白 | 通过服务延迟与状态断言验证 loading 后进入最终态 |
| 空态 | `暂未配置企微员工管理订阅信息` | 目标站当前账号未直接暴露独立 empty 展示，本地需补齐闭环 | `mockState=empty`，同一 bootstrap 契约返回空态数据 | 已实现 | 空态保留业务文案，不出现 `mock`、`未接入` 等开发态提示 | 断言 `data-response-state="empty"`，并看到空态标题与说明，且无 `立即开通` 按钮 |
| 错误态 | `企微员工管理订阅信息加载失败` | 目标站未直接暴露错误屏，本地需补齐闭环 | `mockState=error` 或未来 `provider=api` 失败 | 已实现 | 错误态显式展示失败信息和重试入口，不做静默 fallback | 断言 `data-response-state="error"`，并看到错误提示与 `重试` |
| 错误恢复 | `重试` | 目标站未取证到重试按钮，本地需提供明确恢复入口 | 重试后重新调用同一 `loadStaffListViewModel()`，并回到 success | 已实现 | 点击后将本地 mockState 重置为 `success`，重新发起一次加载 | 点击 `重试` 后断言契约状态从 `error` 回到 `success`，并重新出现 `立即开通` |
| 数据契约 | 隐藏契约节点 | 目标站没有暴露前端契约节点 | `/customer/staffList/bootstrap`，统一返回 `code/message/data/traceId/timestamp` | 已实现 | 用隐藏节点承载 provider、responseState、endpoint、traceId，便于回归与截图诊断 | Playwright 断言 `data-provider`、`data-response-state`、`data-endpoint` |
| 真实目标对应 | 当前目标账号可见交互 | 当前目标账号下，本页主体是订阅门槛页，核心交互只有 `立即开通` 与订阅详情承接 | 目标站网络中已取证 `edition/resource/get`、`paymentTypes/get/v2`、`wxCpDepartments/get` 等周边请求，但没有独立员工表格写操作 | 本地按“目标真实可见态 + 三态闭环”承接 | 不臆造未取证到的员工列表 CRUD；先把当前账号真实可见页面闭环做实 | 交付时以目标站截图与 network 证据说明“当前账号所见即订阅门槛页” |
