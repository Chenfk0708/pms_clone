# 中央价格交互矩阵

取证批次：`20260516-115133`、`20260518-mock-provider`  
目标页：`https://minsubao.localhome.cn/houseManage/houseCale`  
本地页：`http://127.0.0.1:4173/houseManage/houseCale`

| 区域 | 元素/按钮 | 目标站行为 | 触发请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口导航 | 顶部 `房价`、侧栏 `房价管理 > 中央价` | 进入 `/houseManage/houseCale`，房价顶部导航和中央价侧栏高亮 | 首屏加载 `roomCategoryStatuses/central/get` 等请求 | 路由存在，菜单可进入；默认由中央价数据服务的 `mock` provider 渲染 | 保留现有路由，数据来源状态显示当前 provider | Playwright 断言 URL、菜单、`中央价数据来源` |
| 首屏数据 | 中央价价格矩阵 | 请求 `roomCategoryStatuses/central/get`，body 含 `date/days/pageNum/pageSize/channelIds/roomCategoryIds/poiIds`，响应 `data.roomStatusViews[]` | mock 阶段使用统一响应包；real provider 才请求 `POST https://hudson-prod.localhome.cn/roomCategoryStatuses/central/get` | 默认不再请求真实后端；组件消费 `src/services/centralPrice.ts` 适配后的业务模型 | 已新增 `mock`/`real` provider、统一响应包、响应适配；失败时显示阻塞，不静默回退 | Playwright 断言默认 mock 不打后端；real provider 断言请求 body 与 UI 数据 |
| 顶部筛选 | 门店、渠道、房型、房型标签 | 下拉/切换后刷新数据；渠道筛选改变 `channelIds` | mock provider 消费同一请求参数；real provider 中渠道筛选映射到 `channelIds` | 渠道筛选已进入数据服务参数；门店/房型/标签当前作为筛选状态传入，真实 ID 仍待后端选项接口确认 | 保留参数传递，缺真实 ID 的筛选先记录后端待确认 | Playwright 点击 `渠道 > 途家` 后在 real provider 断言 `channelIds=["2"]` |
| 顶部操作 | 同步至渠道 | 真实站触发业务同步或后续确认流程 | 取证到价格页相关 `actionExec/get`、`actionExec/express`、`roomCategoryStatuses/central/get`，同步提交契约待补 | 本地业务态显示“同步任务已创建，渠道价格将按当前中央价更新” | 当前阶段用 mock 业务反馈承接；联调阶段补写入契约 | Playwright 点击后断言页面正文不出现开发态文案 |
| 顶部操作 | 价格设置 | 打开右侧价格设置抽屉，保存会提交真实配置 | 目标取证有设置抽屉；保存契约待补 | 本地能打开抽屉，保存后显示“价格设置已保存” | 保留打开/关闭/保存反馈 | Playwright 点击后断言弹层和业务反馈 |
| 顶部操作 | 价格规划 | 打开规划抽屉；当前目标为空态，可新增规划入口 | 目标取证显示空态 `暂无数据`；保存契约待补 | 本地新增规划后显示“价格规划已保存” | 保存规划改为业务成功反馈，契约写入接口文档待确认项 | Playwright 点击 `保存规划` 后断言业务反馈 |
| 顶部操作 | 批量改价、智能调价 | 打开改价/智能调价弹层；实际提交需写价格契约 | 目标取证有智能调价提醒、批量改价入口；提交契约待补 | 本地打开弹层，确定显示“批量改价任务已提交” | 保留打开/取消/提交业务反馈 | Playwright 点击后断言 dialog 和 status |
| 主表格 | 价格单元格 | 点击可打开 `设置渠道系数` 或改价抽屉，目标有弹层反馈 | 点击单元格未触发 URL，弹出设置类 dialog | 本地点击打开改价弹层，确定后显示“价格调整已保存” | 保留弹层和业务反馈 | Playwright 点击价格单元格断言 dialog |
| 错误态 | API 403/登录失效/CORS/数据服务失败、mock error envelope | 失败应清晰暴露但不显示开发态词 | real provider 失败或 mock `code !== 0` | 本地显示 `中央价格数据加载失败` 与 `重新加载` | 保留显式失败，不做静默 fallback | Playwright 模拟 403 与 mock error envelope |
| 空态 | `roomStatusViews=[]` 或 mock empty envelope | 目标空态需显示暂无数据，不崩溃 | 统一响应包 `data.roomStatusViews=[]` | 本地已显示 `中央价空状态` | 保留空态结构并写入接口文档 | Playwright 模拟 real empty 与 mock empty |

## 数据服务与切换点

- 默认 provider：`mock`，由 `src/services/centralPrice.ts` 返回统一 `code/message/data/traceId/timestamp` 响应包并适配为 `CentralPriceData`；页面正文显示为“中央价格服务”。
- 切换到真实请求：设置 `localStorage.pms.centralPriceProvider=real` 或 `VITE_CENTRAL_PRICE_PROVIDER=real`。
- mock 状态模拟：`localStorage.pms.centralPriceMockMode=success|empty|error`。
- 接口文档：`D:\pms_ui\95prompt\接口文档\fangtai--fangjia-guanli--zhongyang-jiage-中央价格接口文档.md`。
