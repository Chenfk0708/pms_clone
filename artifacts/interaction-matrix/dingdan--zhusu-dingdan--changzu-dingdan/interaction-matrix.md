# 长租订单交互矩阵

任务：`dingdan--zhusu-dingdan--changzu-dingdan`

目标页：`https://minsubao.localhome.cn/order/house-longRental-order/list`

取证批次：`20260518T062619`

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口与布局 | 订单 > 住宿订单 > 长租订单 | 进入 `/order/house-longRental-order/list`，订单菜单展开，长租订单高亮，页面隐藏通用标题区 | 首屏加载 `POST /orders/page/get`，body 含 `campId/pageNum/pageSize/orderType/isLt` | 路由已存在，长租分支复用 `OrdersPage`，但核心数据仍有组件内静态数组 | 保持现有路由和布局，数据迁移到显式 mock provider | Playwright 断言路由、菜单高亮、长租表格出现 |
| 顶部快捷筛选 | 全部/今日新单/今日预抵/今日在住/今日预离/明日入住/明日退房/待接单/待退款/异常订单 | 点击切换 radio，按 `orderType` 刷新列表 | `POST /orders/page/get`，`orderType` 为 `''/1/11/10/12/4/5/6/7/8`，`isLt=1` | 旧实现仅本地过滤，未走统一数据服务 | 将筛选参数传入 `fetchLongRentalOrders`，mock provider 返回对应响应包 | Playwright 点击快筛后断言状态反馈和列表更新 |
| 顶部搜索 | 订单号/姓名/手机号输入 | 输入关键词后查询列表 | `POST /orders/page/get`，body 含 `keyword/searchCode` | 旧实现在组件内过滤当前数组 | 查询按钮触发统一数据服务，mock provider 消费 keyword | Playwright 填写关键词并点击查询，断言请求参数摘要和 UI |
| 顶部操作 | 查询 | 按当前筛选条件刷新列表 | `POST /orders/page/get` | 旧实现没有独立查询按钮 | 新增查询按钮，显示 loading/成功反馈 | Playwright 点击后断言 loading 结束与反馈 |
| 顶部操作 | 重置筛选 | 恢复默认筛选并刷新列表 | `POST /orders/page/get` 默认 body | 旧实现只重置前端状态 | 调用数据服务刷新默认数据 | Playwright 断言输入清空、radio 回到全部、列表恢复 |
| 顶部操作 | 刷新 | 重新拉取当前条件数据 | `POST /orders/page/get` 当前 body | 旧实现无刷新按钮 | 新增刷新按钮，防重复提交 | Playwright 断言按钮 disabled/loading 与刷新反馈 |
| 顶部操作 | 导出明细 | 生成导出任务或进入导出反馈 | 未来 `POST /orders/export/create`，复用当前筛选 body | 旧实现显示开发态“真实接口未取证” | 显示业务态“导出任务已创建”，不写开发态文案 | Playwright 点击断言 toast/status |
| 顶部操作 | 录入订单 | 打开长租订单录入入口 | 当前无已存在录入页，先用业务弹窗承接 | 旧实现显示开发态“未接入” | 打开“录入长租订单”业务弹窗，支持取消/保存反馈 | Playwright 点击、保存、关闭断言 |
| 高级筛选 | 日期类型、订单状态、订单渠道、订单房型、入住状态、平台账号、订单门店、订单标签、排房情况、库存情况、统计情况、房型标签 | 展开后呈现筛选项，选择后影响列表参数 | `POST /orders/page/get` 加筛选字段；选项来自 `systemConfigs/user/orderFilter/get`、`select/calChannel4Order/get`、`roomCategories/page/get`、`select/poi/page/get` | 旧实现是 button 样式占位，点击显示开发态配置缺失 | 使用本地业务选项，选择后传入服务参数并刷新 | Playwright 展开、选择日期类型/状态/门店并断言列表状态 |
| 表格 | 24 列长租订单列表 | 数据来自 `orders/page/get`，分页来自 `data.total/size/current/pageNum/pages/list` | mock provider 统一响应包包裹目标站 `success/errorMsg/data` 字段形态，并适配为业务模型 | 旧实现默认使用组件内静态 `longRentalOrders` | 将列表、分页、空态、错误态全部由服务返回的 view model 驱动 | Playwright 断言表格数据、分页总数、空态与错误态 |
| 表格操作 | 详情 | 打开长租订单详情抽屉 | 详情字段复用列表行和 `orderDetailViews` | 旧详情可打开，但底部按钮无反馈 | 详情抽屉消费适配后的行数据；所有按钮显示业务态反馈 | Playwright 点击详情、关闭、底部按钮断言 |
| 详情抽屉 | 合同信息/缴费记录标签 | 标签切换展示合同和缴费信息 | 无额外请求，字段来自列表行 | 旧标签不可切换 | 补齐 tabs 状态 | Playwright 点击标签断言内容变化 |
| 详情底部 | 更多操作/收款/续租/退租 | 进入对应业务流程 | 未来写接口待确认 | 旧按钮无处理 | 弹出业务确认或提示，不出现开发态文本 | Playwright 逐项点击断言反馈 |
| 分页 | 上一页/下一页/页码/20 条/页 | 根据 pageNum/pageSize 请求列表 | `POST /orders/page/get` | 旧下一页禁用且无总数 | 接入分页 view model，边界禁用，下一页触发服务 | Playwright 断言当前页、总数、禁用态 |
| 错误态 | 接口失败 | 页面显示明确错误和重试入口 | 统一响应包 `code/message/data/traceId/timestamp` | 旧实现显示“接口阻塞/真实接口请求失败”开发态 | query `longRentalMockState=error` 触发业务错误态 | Playwright error 场景断言 alert 和重试 |
| 空态 | 无数据 | 表格结构保留并显示暂无数据 | 统一响应包 `data.list=[]/pagination.total=0` | 旧实现仅前端过滤空 | query `longRentalMockState=empty` 触发空响应 | Playwright empty 场景断言无旧静态行 |

