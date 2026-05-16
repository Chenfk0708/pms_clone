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
| 顶部操作 | 查询 | 点击后拉取列表，目标站真实 payload 为 `campId/pageNum/pageSize/current` 加筛选条件 | `POST https://hudson-prod.localhome.cn/roomStatusOperationLog/page/get/v2` | `preventDefault()`，无 loading/成功/失败 | 接入真实 fetch；缺 `campId` 或 CORS/认证失败时显示阻塞 | Playwright 成功、失败、缺上下文三路径验证 |
| 顶部操作 | 重置 | 清空筛选并恢复默认“手动调整/请选择” | 无强制请求；目标站按钮恢复表单 | 已能清空本地 state | 保留并补状态反馈 | Playwright 点击后断言字段复位和提示 |
| 顶部操作 | 展开/收起 | 展开后出现房态日期、操作日期、操作人；收起隐藏 | 无列表请求 | 已能展开/收起 | 保留，确保不清空已输入值；查询时带高级筛选参数 | Playwright 点击后断言控件存在 |
| 表格 | 房态日志列表 | 成功数据展示房型、房间、房态调整日期、操作内容、调整方式、同步渠道、渠道库存变更、操作人、操作时间 | 列表接口响应 `data.list` | 只显示空态 | 适配接口字段并渲染行；空数据保留目标空态 | Playwright route 返回 1 行和空数据分别验证 |
| 表格状态 | loading / empty / error | 目标站查询时表格加载；空数据为“暂无数据”；失败不应假成功 | 列表接口状态码/响应 success | 缺 loading/error | 增加禁用按钮、加载提示、错误 alert、重试入口 | Playwright 失败路径断言 alert 与重试 |
| 跨页入口 | 行详情/编辑/导出 | 目标房态日志当前取证未发现行级详情、导出、新增按钮 | 无 | 本地无这些按钮 | 记录“不存在”，不脑补新增入口 | 交互矩阵与截图证据记录 |
