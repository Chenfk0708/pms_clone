# 竞争圈比价交互矩阵

任务 ID：`fangtai--fangjia-guanli--jingzhengquan-bijia`  
目标 URL：`https://minsubao.localhome.cn/houseManage/priceComparison`  
本地 URL：`/houseManage/priceComparison`  
取证结论：当前目标账号仍只展示智能调价未开通态，网络侧可见配置、门店、房型、价格设置等请求。本轮按新增要求用显式 mock provider 作为页面正式数据源，页面正文呈现业务可用状态；目标站未能判断的已开通成功态字段已沉淀到接口文档待后端确认，不在页面正文展示开发态说明。

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 页面入口 | 侧栏 `竞争圈比价` / URL | 目标 URL 可进入，当前账号显示未开通态 | `edition/resource/get`、`comparePriceConfig/*`、`priceAdjustConfig/get` | `/houseManage/priceComparison` 已注册到 `PricePage`，菜单来自 `AppShell` / `mock.ts` | 保持现有 layout、菜单、页签和路由 | Playwright `priceComparison renders` 断言页面根节点和标题 |
| 数据服务 | 看板加载 | 目标站未展示成功态表格，但网络可见配置类请求 | mock provider 契约：`POST /api/houseManage/priceComparison/dashboard`，统一响应包 `code/message/data/traceId/timestamp` | `src/services/priceComparison.ts` 返回指标、趋势、列表、待办、快捷入口，组件只消费适配模型 | 用显式 mock provider 作为当前正式数据源；后续集中切 `api` provider | Playwright 断言核心指标、趋势图、列表和待办出现 |
| 顶部筛选 | 比价日期 | 已开通态预计按日期刷新比价指标 | 请求体 `date` | 本地 `<input type=date>` 传入服务层 | 查询后刷新看板并显示业务反馈 | Playwright 填写日期后点查询，断言“已按筛选条件更新” |
| 顶部筛选 | 门店 | 目标站有门店/项目筛选请求 | 请求体 `storeId`，选项来自 `select/poi/get` 草案 | 本地 select 使用 mock 门店选项 | 查询后按门店刷新 mock 数据 | Playwright `selectOption('qianhai')` 后查询 |
| 顶部筛选 | 房型 | 目标站请求房型/产品列表 | 请求体 `roomTypeId`，选项来自 `select/roomCategoryProducts/parentProduct/page/get` 草案 | 本地 select 使用 mock 房型选项 | 查询后按房型过滤列表 | Playwright `selectOption('suite')` 后列表仍可展示 |
| 顶部筛选 | 渠道 | 目标站未开通态未展示成功筛选，但价格页已有渠道维度 | 请求体 `channelId` | 本地 select 使用 mock 渠道选项 | 查询后按渠道过滤列表 | Playwright 查询路径覆盖 |
| 顶部操作 | 查询 | 提交当前筛选条件 | dashboard 请求体为当前筛选值 | 本地触发 `appliedFilters` 更新 | 显示“已按筛选条件更新” | Playwright 状态断言 |
| 顶部操作 | 重置 | 恢复默认条件 | dashboard 请求体恢复默认值 | 本地重置日期、门店、房型、渠道 | 显示“已恢复默认条件” | routes 专项覆盖基础交互 |
| 顶部操作 | 刷新 | 重新拉取当前条件数据 | 同 dashboard 请求体 | 本地递增刷新 key 并重新请求服务层 | 显示“数据已刷新”，按钮加载时禁用 | Playwright 点击刷新断言反馈 |
| 顶部操作 | 导出 | 目标站未取证到成功态导出接口 | 待后端确认是否独立导出接口 | 本地创建业务反馈，不伪造下载文件 | 显示“导出任务已创建，可在消息中心查看进度” | Playwright 点击导出断言反馈 |
| 顶部操作 | 更多 | 目标站未开通态未展示更多菜单 | 无独立请求 | 本地弹出更多操作 | 复制链接、生成复核任务均给业务反馈 | Playwright 可人工回归 |
| 指标卡片 | 平均价差、竞品覆盖、调价建议 | 已开通态预计展示核心指标 | dashboard `metrics[]` | 本地使用 mock metrics | 展示业务值和变化说明 | Playwright 断言 `平均价差` |
| 图表区域 | 价格趋势 | 已开通态预计展示价格曲线/柱状趋势 | dashboard `trend[]` | 本地用业务条形图展示本店价、竞品价、市场均价 | hover/legend 不新增独立请求，视觉状态由浏览器默认 hover 承接 | Playwright 断言 `本店价` |
| 列表区域 | 竞争圈比价列表 | 已开通态预计展示房型、渠道、价格和建议 | dashboard `rooms.list[]` + `pagination` | 本地表格展示房型、渠道、本店价、竞品价、价差、入住率、建议 | 支持空态和错误态 | Playwright 断言房型和详情入口 |
| 列表操作 | 查看详情 | 目标站成功态未取证到详情承接 | 当前用 mock 详情弹窗承接 | 本地打开 `比价详情` dialog | 展示竞品价明细和建议，支持关闭 | Playwright 点击详情、断言 dialog、关闭 |
| 待办提醒 | 待办项点击 | 目标站未开通态未展示待办 | dashboard `todos[]` | 本地待办按钮给跟进反馈 | 显示“已标记跟进”类业务反馈 | routes 专项覆盖待办可见 |
| 快捷入口 | 去中央价 | 项目已有中央价路由 | `/houseManage/houseCale` | 本地按钮跳转已有路由 | 保持路由协调，不跳不存在路径 | Playwright 断言 URL |
| 快捷入口 | 去订单 | 项目已有住宿订单路由 | `/order/house-order/list` | 本地按钮跳转已有路由 | 保持路由协调 | Playwright 断言 URL |
| 全局会话 | 右下角会话 dock | 目标站有会话入口 | IM 相关目标请求已在历史取证中记录 | 本地共享 `ChatDock` 可收起/展开 | 不复制共享组件 | Playwright 断言 4 条会话、收起、展开 |
| 错误态 | `?mockState=error` | 目标站错误态未取证到成功页错误格式 | 统一失败响应包 `code=503/message/data/traceId/timestamp` | 本地显示 `数据加载失败` 和重试 | 不静默、不吞错 | Playwright 断言 alert 和重试 |
| 空态 | `?mockState=empty` | 成功态空列表未取证 | 统一成功响应包 + `rooms.list=[]/pagination.total=0` | 本地显示“当前条件暂无比价结果，请调整筛选条件。” | 结构不崩溃，保留筛选和快捷入口 | 接口文档已沉淀，后续可加专项 |
