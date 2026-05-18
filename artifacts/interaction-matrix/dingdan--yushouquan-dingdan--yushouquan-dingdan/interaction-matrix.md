# 预售券订单交互矩阵

任务：`dingdan--yushouquan-dingdan--yushouquan-dingdan`  
页面：`/mallManagement/orderManagement`  
目标站：`https://minsubao.localhome.cn/mallManagement/orderManagement`

## 取证结论

- 历史固定 Chrome 目标站取证已存在：`artifacts/network/dingdan--yushouquan-dingdan--yushouquan-dingdan/real-contract-target-20260516062917.json`、`target-interaction-audit-20260516-1642.json`。
- 目标站核心订单请求为 `POST https://hudson-prod.localhome.cn/orders/page/get`，请求体包含 `campId/pageNum/pageSize/orderStates/roomCategoryTypes/categoryIds/orderChannelIds/paymentWayIds/bookedStartDate/bookedEndDate/keyword/refundDisplayState`。
- 目标站选项请求包括 `camps/get`、`channels/get`、`paymentTypes/get/v2`、`categories/get`。
- 本轮新增要求下，本地页面默认使用显式 mock provider 作为当前正式数据源；real provider 仍保留同契约切换点 `localStorage.pmsPresaleOrderProvider=real`。
- 页面正文已改为业务态文案，不展示 `mock/provider/traceId/未接入/阻塞/后端` 等开发态信息；这些信息仅保留在隐藏契约节点、接口文档和本记录中。

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 项目入口 | 订单 > 预售券订单 > 预售券订单 | 进入 `/mallManagement/orderManagement`，订单顶栏和侧栏高亮 | 首屏加载订单列表与筛选选项 | 已有路由和菜单 | 保持项目现有 layout、路由、面包屑和侧栏高亮 | Playwright 断言标题、侧栏 active、页面头隐藏 |
| 数据服务 | 首屏订单数据 | 请求订单列表并展示业务数据 | mock: `/mallManagement/orderManagement/list` envelope；real: `orders/page/get` | 旧版默认真实请求并泄露开发态文案 | 默认显式 mock provider，统一 `code/message/data/traceId/timestamp`，组件只消费适配后模型 | `tests/presale-order-real.spec.ts` 断言默认不请求 Hudson，隐藏节点 `data-provider=mock` |
| 顶部筛选 | 订单状态 | UI 值映射后端 `orderStates` 数组 | `orders/page/get` body: `orderStates` | 已有下拉 | 保持 `全部/待支付/已发货/已完成/已取消`，搜索时传入数据服务 | Playwright 选择后断言请求体和 UI 更新 |
| 顶部筛选 | 商品类型 | 映射 `roomCategoryTypes=1/2/3` | `orders/page/get` body: `roomCategoryTypes` | 已有下拉 | mock provider 消费筛选参数并返回对应业务数据 | Playwright 选择 `虚拟商品` 后断言 `roomCategoryTypes=["1"]` |
| 顶部筛选 | 订单来源 | 来源来自 `channels/get` 或契约选项 | `channels/get`、`orders/page/get` body: `orderChannelIds` | 旧版真实选项失败时显示开发态文案 | mock options 提供微信/抖音/小红书，real provider 复用目标站选项 | Playwright 选择 `微信小程序` 后断言 `orderChannelIds=["34"]` |
| 顶部筛选 | 商品类目 | 来源于 `categories/get` | `categories/get`、`orders/page/get` body: `categoryIds` | 旧版空选项文案带真实接口说明 | 空选项显示业务态 `暂无可选项` | Playwright 断言下拉可见和正文无开发态词 |
| 顶部筛选 | 支付方式 | 来源于 `paymentTypes/get/v2`，`bizTypes=[3]` | `paymentTypes/get/v2`、`orders/page/get` body: `paymentWayIds` | 已有下拉 | mock options 提供微信/支付宝/储值余额 | Playwright 专项覆盖 real provider 请求链路 |
| 顶部筛选 | 下单时间 | 日期转毫秒时间戳 | `bookedStartDate/bookedEndDate` | 已有 date 输入 | 保持日期输入，参数构造在服务层完成 | 隐藏契约节点 `data-request-body` 可审计 |
| 顶部筛选 | 搜索输入 | 输入订单编号/买家联系方式后刷新列表 | `orders/page/get` body: `keyword` | 已有输入 | Enter 或点击搜索调用数据服务，loading 时禁用按钮 | Playwright 填 `138` 后断言 `keyword="138"` |
| 顶部操作 | 重置 | 恢复默认筛选并刷新 | `orders/page/get` 默认 body | 已有按钮 | 重置后触发数据服务并显示业务反馈 | Playwright 断言输入清空、商品类型恢复 |
| 顶部操作 | 刷新 | 按当前条件刷新 | 当前 provider 同契约请求 | 已有按钮 | 显示 loading 和刷新完成/失败反馈 | Playwright 错误态断言刷新入口存在 |
| 指标卡片 | 订单总数/实付金额/待处理/售后中 | 概览当前筛选范围业务状态 | mock provider `data.metrics`，未来后端同字段 | 旧版无指标 | 新增指标卡片点击反馈 | Playwright 可断言 `预售券订单指标` 区域 |
| 快捷入口 | 预售券商品 | 跳转商品管理 | `/mallManagement/goodsManagement` | 旧版无快捷入口 | 使用项目已存在路由承接 | Playwright 可断言 URL |
| 快捷入口 | 卡券核销 | 跳转核销页 | `/mallManagement/verificationManagement` | 旧版无快捷入口 | 使用项目已存在路由承接 | Playwright 可断言 URL |
| 快捷入口 | 销售统计 | 跳转销售统计 | `/statistics/presale` | 旧版无快捷入口 | 使用项目已存在路由承接 | Playwright 可断言 URL |
| 顶部操作 | 导出明细 | 目标站存在导出类操作，写接口待确认 | 未来建议 `POST /mall/presale-orders/export` | 旧版显示阻塞 | 当前创建业务态导出任务反馈，不假装真实文件已生成 | Playwright 断言 `导出任务已创建` |
| 表格 | 订单列表 | 展示 `list/orderDetailViews` | `data.list` + `data.pagination` | 旧版可空态/真实适配 | mock provider 返回可用业务列表，real provider 适配 Hudson 字段 | Playwright 断言 `早鸟预售券/张三` |
| 表格 | 订单详情 | 目标站详情承接方式需继续确认 | 未来建议 `GET /mall/presale-orders/{orderId}` | 旧版阻塞反馈 | 本地用详情弹窗承接订单编号、买家、来源、金额、时间 | Playwright 点击 `订单详情` 断言详情弹窗 |
| 表格 | 空态 | 空列表时显示暂无数据 | 统一 envelope: `data.list=[]` | 已有空态 | `?mockState=empty` 支持空态，结构不崩溃 | Playwright 断言空态与正文无开发态词 |
| 表格 | 错误态 | 请求失败时展示错误和重试 | 统一 envelope: `code!=0` | 旧版显示真实请求阻塞 | `?mockState=error` 和 real 失败均显示业务错误与刷新入口 | Playwright 断言 `预售券订单加载失败`、刷新按钮 |
| 分页 | 上一页/下一页 | 按页码重新请求 | `pageNum/pageSize` | 已有分页 | 保持无下一页禁用，有下一页时重新调用数据服务 | Playwright 可断言分页区域 `共 N 条` |

## 待确认项

1. 导出明细真实接口 path、请求体和任务查询方式。
2. 预售券订单详情真实路由或接口是否为 `/mallManagement/orderManagement/details/:orderId`。
3. 售后状态枚举与 `refundDisplayState` 是否仍保持 `1/2/3`。
4. 商品类目是否继续使用 `categories/get parentId=0`，还是需要专属预售券类目接口。
5. real provider 接入阶段的认证代理、CORS 和 campId 来源。
