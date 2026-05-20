# 客户概况交互矩阵

任务：`scrm--kehu-gaikuang--kehu-gaikuang`

目标站：`https://minsubao.localhome.cn/scrm/general`

本地页：`/scrm/general`

## 取证结论

- 目标站使用固定 Chrome 和 `playwright/.auth/pms-user.json` 取证，未被登录或滑块阻塞。
- 目标站首屏业务信息：客户数 `589`、粉丝总数 `敬请期待`、会员总数 `276`、添加企微人数 `前往设置`，趋势轴包含 `05/27`、`06/03`、`06/10`、`06/18`。
- 目标站相关请求包含 `POST https://hudson-prod.localhome.cn/member/assetsInventory/get`、`POST https://hudson-prod.localhome.cn/member/growthTrend/get`、`POST https://hudson-prod.localhome.cn/wxCp/authInfo/get`，以及门店、房型、支付、菜单和 IM 会话支撑请求。
- 本地实现以 `src/services/scrmGeneral.ts` 为显式 `mock` provider，统一输出 `code/message/data/traceId/timestamp` 响应包，组件只消费适配后的业务模型。
- 本地取证中 `20260519-95-success` 与 `20260519-95-empty` 首次批次遇到并行任务导致的无关 Vite 预转换失败，DOM 为空；已用 `20260519-95-success-rerun` 与 `20260519-95-empty-rerun` 重采集，重采集批次为有效验收证据。

## 矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口与导航 | SCRM 顶栏、侧栏客户概况 | URL 为 `/scrm/general`，SCRM 菜单高亮，页面标题为客户概况 | 无新增页面接口，依赖路由与菜单配置 | 已复用项目 `AppShell`、路由和侧栏高亮 | 保留 `/scrm/general` 路由和页面标题 | Playwright 断言 `.sidebar-link[href="/scrm/general"]` active、H1 可见 |
| 授权提醒 | 前往企业微信授权 | 目标站点击企微授权相关入口可进入企微设置/接入页 | 未来承接 `wxCp/authInfo/get` 与授权配置接口 | 本地按钮跳转 `/channels/private/setting/weComSetting` | 用已有路由承接，不在正文展示开发态说明 | Playwright 可点击；矩阵记录目标 URL |
| 授权提醒 | 知道了 | 目标站按钮存在，点击后提醒仍可能受目标状态影响 | 无 | 本地点击后关闭提醒 | 补齐关闭反馈，避免无响应 | Playwright 断言提醒区域消失 |
| 顶部筛选 | 开始日期、结束日期 | 目标站趋势按日期区间展示，目标轴为 `05/27` 至 `06/18` | `POST /scrm/general/overview/get` 请求体 `startDate/endDate`；目标站已取证 `member/growthTrend/get` | 本地日期 input 可编辑，查询后写入服务请求体 | 从组件状态传入 `buildScrmGeneralRequestBody()` | Playwright 断言隐藏契约节点含 `startDate/endDate` |
| 顶部筛选 | 门店 | 目标站按当前门店展示客户资产和趋势 | 请求体 `poiId`；目标站有 `select/poi/page/get` 支撑 | 本地 select 使用 provider 返回的 stores | 避免组件硬编码散落，保留默认门店兜底仅用于首屏选项 | Playwright 断言 select 可选且请求体含 `poiId` |
| 顶部筛选 | 运营维度 | 目标站未暴露同名控件，本地按客户概况业务补齐 | 请求体 `dimension=all/private/member/wechat` | 本地 select 切换后 provider 返回不同来源统计 | 补齐业务维度，方便后端后续确认枚举 | Playwright 断言 `dimension` 从 `private` 恢复到 `all` |
| 顶部操作 | 查询 | 目标站根据当前条件刷新指标和趋势 | `loadScrmGeneralData(filters, 'success')`，未来同契约请求后端 | 本地显示 loading，完成后反馈“已按当前条件刷新客户概况” | 查询按钮禁用重复提交，服务层统一构造请求体 | Playwright 断言反馈和请求体 |
| 顶部操作 | 重置 | 目标站应恢复默认条件 | 同上，恢复默认 `campId/poiId/startDate/endDate/dimension` | 本地重置筛选并刷新 | 默认条件集中在 `defaultScrmGeneralFilters` | Playwright 断言维度回到 `all` |
| 顶部操作 | 刷新 | 目标站重新拉取当前条件数据 | 同上 | 本地禁用重复点击，成功后显示刷新反馈 | 显式 loading 与反馈闭环 | Playwright 点击精确按钮 `刷新` 并断言 status |
| 顶部操作 | 导出 | 目标站本页未见导出按钮 | 后端待确认导出接口；本地先创建导出任务反馈 | 本地点击后显示“已创建客户概况导出任务” | 用业务态反馈承接，不假装真实文件下载 | Playwright 断言 status 文案 |
| 指标卡片 | 客户数、粉丝总数、会员总数、添加企微人数 | 目标站展示 589、敬请期待、276、前往设置 | `member/assetsInventory/get` 或未来 `overview/get` data.metrics | 本地 metrics 来自 provider，非组件静态数组 | 卡片按钮打开指标详情弹窗 | Playwright 断言指标值并点击客户数详情 |
| 趋势图 | legend 与柱状图 | 目标站显示客户数、会员数、添加企微人数及日期轴 | `member/growthTrend/get` 或未来 `overview/get` data.trends | 本地迷你图按 provider `trends.points` 渲染 | 保留日期轴和空态 0 值 | Playwright 断言 `06/18` 可见 |
| 待办列表 | 待跟进客户、会员成长提醒、企微授权待处理 | 目标站无待办列表，本地按业务概况补齐 | 未来 `data.todos` | 本地 todo 按已有路由跳转 | 客户列表跳 `/customer/list`，会员等级和企微设置用既有路由 | Playwright 断言待办展示；客户列表链接可跳转 |
| 来源排行 | 来源表格 | 目标站未见来源排行，本地补齐渠道经营视角 | 未来 `data.sources` 与 `pagination` | 本地 success 展示来源表，empty 展示“暂无来源数据” | 数据和分页统一在 provider 响应包内 | Playwright 断言 success 来源和 empty 文案 |
| 推荐场景 | 立即体验 | 目标站分别跳转智能入住、聊天工具栏、品牌小程序、会员等级 | 未来 `data.scenes` | 本地打开推荐场景详情弹窗，并在弹窗内保留业务页面链接 | 避免硬跳到不存在路由，已有路由由弹窗承接 | Playwright 点击“体验 智能入住接入企业微信”并断言弹窗 |
| 错误态 | scenario=error、重试 | 目标站请求失败应清晰暴露 | provider 返回 code 503 并抛 `ScrmGeneralServiceError` | 本地显示 alert 和重试入口，重试切回 success | 不吞错、不静默 fallback | Playwright 断言错误文案，点击重试后指标恢复 |
| 空态 | scenario=empty | 目标站未取证到空态 | provider 返回统一包，`todos/sources` 为空、趋势为 0 | 本地展示待办空态和来源空态 | 空态结构不崩溃，保持业务可用 | Playwright 断言“当前条件暂无待办”“暂无来源数据” |
| 隐藏契约 | request-state output | 目标站无该节点 | 本地测试读取 provider、path、body、scenario | 节点 hidden，不进入页面正文 | 供自动化验证服务层调用，不展示开发态文案 | Playwright 断言 hidden 且包含 `provider":"mock"` |

## 验收证据

- 目标站截图：`artifacts/screenshots/scrm--kehu-gaikuang--kehu-gaikuang/default-target-20260518-95-target.png`
- 目标站整页截图：`artifacts/screenshots/scrm--kehu-gaikuang--kehu-gaikuang/full-target-20260518-95-target.png`
- 目标站 DOM：`artifacts/dom-snapshots/scrm--kehu-gaikuang--kehu-gaikuang/default-target-20260518-95-target.html`
- 目标站 style facts：`artifacts/style-dumps/scrm--kehu-gaikuang--kehu-gaikuang/facts-target-20260518-95-target.json`
- 目标站 network：`artifacts/network/scrm--kehu-gaikuang--kehu-gaikuang/responses-target-20260518-95-target.json`
- 目标站交互记录：`artifacts/interaction-matrix/scrm--kehu-gaikuang--kehu-gaikuang/target-interactions-20260518-95.json`
- 本地 success 截图/DOM/style/network：`20260519-95-success-rerun`
- 本地 empty 截图/DOM/style/network：`20260519-95-empty-rerun`
- 本地 error 截图/DOM/style/network：`20260519-95-error`
- 自动化验证：`PMS_TEST_BASE_URL=http://127.0.0.1:43136 npx playwright test scrm-general.spec.ts --config=tmp/playwright-scrm-general.config.ts --timeout=60000 --workers=1 --reporter=line`，4/4 passed。
