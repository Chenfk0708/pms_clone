# 房态日志交互矩阵

任务：`fangtai--fangtai-guanli--fangtai-rizhi`  
目标 URL：`https://minsubao.localhome.cn/houseManage/logs/status`  
证据来源：项目 Playwright 固定 Chrome，复用 `playwright/.auth/pms-user.json`；新鲜取证批次 `20260516T035018`，补充点击查询捕获。

| 区域 | 元素/按钮 | 目标站行为 | 触发请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口导航 | 房态 > 房态管理 > 房态日志 | 进入 `/houseManage/logs/status`，房态日志侧栏高亮，页面隐藏独立标题，主体是筛选表格 | 页面脚本与菜单、门店上下文请求 | 已有路由与菜单入口，历史测试只断言静态渲染 | 保持现有路由，补齐真实请求状态 | 路由测试进入页面并断言侧栏/表格存在 |
| 顶部筛选 | 日志关键词 | 输入房型/房间/渠道房源关键词，查询时作为列表参数 | `POST /roomStatusOperationLog/page/get/v2`，字段 `keyword` | 仅本地 state，无请求 | 查询时把当前输入写入请求体 | Playwright route 断言请求体 `keyword` |
| 顶部筛选 | 调整方式 | 下拉可选手动调整/系统调整，查询时作为调整类型参数 | `POST /roomStatusOperationLog/page/get/v2`，字段 `adjustType`，目标行为中 `2` 对应系统调整 | 仅本地 select，无请求 | 下拉值映射为真实接口参数 | Playwright route 断言 `adjustType` |
| 顶部筛选 | 操作渠道 | 下拉可选自来客、路客云聚合、途家等渠道 | 目标站另取 `SelectCalChannel` 渠道选项；列表查询字段 `channelId` | 本地选项静态，但点击无请求 | 保留已取证选项，查询时传真实 `channelId`；未能动态拉选项时记录为差异 | Playwright route 断言 `channelId` |
| 顶部操作 | 查询 | 点击后拉取列表，目标站真实 payload 为 `campId/pageNum/pageSize/current` 加筛选条件 | `POST https://hudson-prod.localhome.cn/roomStatusOperationLog/page/get/v2` | 已接入数据服务，支持 loading/成功/失败 | 默认显式 mock provider 驱动业务可用状态；real provider 仅通过集中开关联调 | Playwright 成功、失败、缺上下文三路径验证 |
| 顶部操作 | 重置 | 清空筛选并恢复默认“手动调整/请选择” | 无强制请求；目标站按钮恢复表单 | 已能清空本地 state | 保留并补状态反馈 | Playwright 点击后断言字段复位和提示 |
| 顶部操作 | 展开/收起 | 展开后出现房态日期、操作日期、操作人；收起隐藏 | 无列表请求 | 已能展开/收起 | 保留，确保不清空已输入值；查询时带高级筛选参数 | Playwright 点击后断言控件存在 |
| 表格 | 房态日志列表 | 成功数据展示房型、房间、房态调整日期、操作内容、调整方式、同步渠道、渠道库存变更、操作人、操作时间 | 列表接口响应 `data.list` | 只显示空态 | 适配接口字段并渲染行；空数据保留目标空态 | Playwright route 返回 1 行和空数据分别验证 |
| 表格状态 | loading / empty / error | 目标站查询时表格加载；空数据为“暂无数据”；失败不应假成功 | 列表接口状态码/响应 success | 缺 loading/error | 增加禁用按钮、加载提示、错误 alert、重试入口 | Playwright 失败路径断言 alert 与重试 |
| 跨页入口 | 行详情/编辑/导出 | 目标房态日志当前取证未发现行级详情、导出、新增按钮 | 无 | 本地无这些按钮 | 记录“不存在”，不脑补新增入口 | 交互矩阵与截图证据记录 |

## 2026-05-18 mock provider 与统一响应包补充

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 数据服务 | 默认数据源 | 目标站使用真实 Hudson 接口 | `POST /roomStatusOperationLog/page/get/v2` | 旧实现默认真实接口，缺 `campId` 时阻塞 | 改为显式默认 `mock provider`，组件统一调用 `fetchHouseStatusLogs(query)` | `tests/house-status-logs.spec.ts` 断言默认查询展示 2 条 mock 数据且真实接口请求数为 0 |
| 数据服务 | provider 切换 | 后端就绪后使用真实接口 | `localStorage.pms.houseStatusLogsProvider="real"` 或 `VITE_HOUSE_STATUS_LOGS_PROVIDER=real` | provider 判断曾不集中 | 在 `src/services/houseStatusLogs.ts` 收敛 `mock` / `real` 切换 | Playwright 初始化 localStorage 后断言请求打到 Hudson URL，body 含 `campId/pageNum/pageSize/current/keyword/adjustType/channelId` |
| 数据契约 | 统一响应包 | 目标站当前为 `success/data`，本轮接口草案要求统一包 | `{ code, message, data, traceId, timestamp }` | 旧服务直接返回列表模型 | mock/real provider 统一进入 adapter；mock 成功、空态、失败均返回同一响应包结构 | 接口文档 `D:\pms_ui\95prompt\接口文档\fangtai--fangtai-guanli--fangtai-rizhi-房态日志接口文档.md` 已沉淀 JSON 示例 |
| 状态覆盖 | mock 空态 | 空数据展示“暂无数据” | `mockScenario=empty` | 旧测试未覆盖 | mock provider 返回 `code=0,data.list=[]`，页面显示业务化空态 `暂无符合条件的房态日志` | Playwright 断言 status 和空态文案 |
| 状态覆盖 | mock 失败 | 失败必须显式暴露，不允许假成功 | `mockScenario=error` | 旧测试未覆盖 | mock provider 返回 `code=500`，adapter 抛错，页面显示业务化 alert 和重试按钮，不泄露 `mock` 文案 | Playwright 断言 `房态日志服务暂不可用，请稍后重试` 与重试按钮 |
| 状态覆盖 | real 缺上下文 | 缺 `campId` 不应发起真实请求 | real provider 参数校验 | 旧页面在组件层提前阻塞 | 校验收敛到服务层，页面显示业务化门店上下文错误 | Playwright 断言 alert 含缺少门店上下文且 Hudson 请求数为 0 |
| 状态覆盖 | real 请求失败 | 认证、CORS、网络失败要显示查询失败 | Hudson fetch / HTTP 状态 | 浏览器 `Failed to fetch` 语义不清晰 | 在真实请求边界保留原始错误，页面映射为业务化查询失败提示 | Playwright route abort 后断言错误 alert 和重试按钮 |

补充验证记录：

- 2026-05-18 重新读取 prompts111 后追加审计：页面正文已移除 `mock 接口返回空数据`、`mock 接口模拟失败` 等开发态文案；开发态信息仅保留在服务层、测试、接口文档和矩阵记录中。
