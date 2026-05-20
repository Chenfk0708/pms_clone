# 利润报表交互矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 顶部筛选 | 门店单选 | 切换门店后作为查询条件保留 | `POST /select/poi/page/get`，查询体含 `campId/pageNum/pageSize/channelId/isAvailability` | 已实现 | 统一通过 `src/services/profitReport.ts` 返回门店列表，门店切换仅更新筛选态，不做静默请求 | Playwright 断言门店按钮可切换、状态提示可见 |
| 顶部筛选 | 日期范围 | 默认当月，可输入开始/结束日期后参与查询 | 目标核心请求 `POST /report/profit/get/v2`，请求体含 `startDate/endDate` | 已实现 | 页面消费统一请求体 `createProfitReportRequestBody` | 读取 `data-profit-request`，断言日期字段存在 |
| 顶部筛选 | 房型下拉 | 可打开并选择真实房型文案 | `POST /select/roomCategory/page/get`，关键字段 `channelRoomCategoryId/name/parentRoomCategoryName/poiId` | 已实现 | mock 选项对齐真实抓取的 4 个房型，选择后回写筛选态 | Playwright 选择 `观影大床房` 并断言按钮文案更新 |
| 顶部筛选 | 渠道下拉 | 可打开并选择真实渠道文案 | `POST /select/calChannel4Order/get`，关键字段 `channelId/channelName` | 已实现 | mock 选项对齐真实抓取的 9 个渠道，元数据同时记录 `channelCode` 与中文 `channelId` | Playwright 选择 `携程` 并校验 `data-profit-filters` |
| 顶部筛选 | 房型分组下拉 | 目标站当前返回空数组 | `POST /roomCategoryGroups/get`，当前 `roomCategoryGroups=[]` | 已实现 | 保留空选项态，显式显示“暂无房型分组” | 手动展开下拉，确认空态文案 |
| 顶部筛选 | 包含保洁费用 | 勾选后影响利润与支出口径 | 目标核心请求 `isCleanCost` 由 `0/1` 控制 | 已实现 | 勾选只更新筛选态，查询时进入统一请求体 | Playwright 勾选后断言 `includeCleanCost: true` |
| 操作区 | 查询 | 按当前条件刷新报表 | `fetchProfitReportDashboard(filters)`，mock/api 共用统一服务入口 | 已实现 | 状态提示显示“已按当前条件更新利润报表” | Playwright 点击后断言状态提示 |
| 操作区 | 重置 | 恢复默认当月、清空高级筛选、回到第一页 | 重置为 `getDefaultProfitReportFilters()` | 已实现 | 同步清空导出任务与当前分页 | Playwright 点击后断言房型恢复“请选择”、复选框取消、分页回 1 |
| 操作区 | 导出 | 目标站触发导出任务 | 目标请求仍走 `POST /report/profit/get/v2`，导出体额外带 `pageSize=9999/exportExcelMenuId` | 已实现 | 本地生成显式导出任务对象并暴露到 `data-profit-export` | Playwright 点击后断言“导出任务已创建” |
| 操作区 | 说明 | 打开字段说明弹层 | 无额外请求 | 已实现 | 使用真实字段口径说明“房费(减佣)/利润率”等 | Playwright 打开弹层并断言字段文案 |
| 操作区 | 收起/展开 | 折叠或展开高级筛选 | 无额外请求 | 已实现 | 显式 `aria-label` 解决按钮命中歧义 | Playwright 收起后断言房型按钮消失，展开后恢复 |
| 表格 | 利润报表表格 | 首屏展示真实口径示例，默认包含合计与 20 条分页数据 | 目标响应外层 `success/errorCode/errorMsg/errorDetail/data`，`data.list` 包含 `date/isTotal/roomFeeMinusCommission/.../profitRate` | 已实现 | 组件只消费适配后的业务行数据，不内嵌散落常量 | Playwright 断言默认表格含 `11362.58`、`2026-05-19` |
| 分页 | 页码 1/2 | 切页后请求新页并刷新列表 | `pageNum/current/pageSize` | 已实现 | mock 第二页返回 2026-04-30 起的历史行 | Playwright 点击第 2 页后断言表格出现 `2026-04-30` |
| 分页 | 20 条/页 | 目标站可打开页大小选择器 | 当前本地以状态提示承接 | 已实现 | 保留按钮与反馈，不新增无依据的伪分页逻辑 | Playwright 点击后断言“当前每页显示 20 条” |
| 异常态 | empty | 空列表时结构不塌陷 | 统一 mock envelope `code=0/data.rows=[]` | 已实现 | 表格区显示“暂无利润报表数据” | Playwright 访问 `?profitMockState=empty` |
| 异常态 | error + retry | 错误时显示警报和重试入口，表格区仍保留空态 | 统一 mock envelope `code=5001/message=利润报表数据加载失败，请稍后重试` | 已实现 | 错误不吞掉，显式暴露；重试复用同一加载逻辑 | Playwright 访问 `?profitMockState=error` 并断言警报、重试按钮、空表格 |
