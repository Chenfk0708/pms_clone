# 住宿订单交互矩阵

任务：`dingdan--zhusu-dingdan--zhusu-dingdan`  
目标页：`https://minsubao.localhome.cn/order/house-order/list`  
本地页：`/order/house-order/list`

| 区域 | 元素/按钮 | 目标站行为 | 触发请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口与布局 | 订单 > 住宿订单 > 住宿订单 | 进入住宿订单列表，菜单与面包屑保持订单分组，页面隐藏通用标题区 | 首屏加载 `POST /order/report/get`、`POST /orders/page/get` | 路由已存在，旧实现使用组件内静态订单数组 | 保持既有路由，列表改为通过页面级服务请求真实接口；缺 `campId` 时显示阻塞 | `tests/routes.spec.ts` 断言本页可访问、显示请求状态和缺上下文阻塞 |
| 顶部快捷筛选 | 全部/今日新单/今日预抵/今日在住/今日预离/明日入住/明日退房/待接单/待退款/异常订单 | 点击后切换 radio，按目标站 radio value 请求列表 | `POST /orders/page/get`，body 含 `orderType`：`''/1/11/10/12/4/5/6/7/8` | 旧实现仅本地过滤硬编码数组 | 建立 `orderTypeByFilter`，切换后重新请求真实接口 | `tests/order-house.spec.ts` 断言点击“今日预抵”后最后一次请求 `orderType: '11'` |
| 顶部搜索 | 订单号/渠道订单号/房间号/姓名/手机号输入框 | 输入关键词并触发列表筛选/请求 | `POST /orders/page/get`，body 含 `searchContent` | 旧实现仅前端静态过滤 | 请求参数来自当前输入，同时本地对返回结果做可见筛选 | `tests/order-house.spec.ts` 填“蔡”后只显示匹配行 |
| 顶部操作 | 重置筛选 | 恢复全部筛选并刷新列表 | `POST /orders/page/get` | 旧实现清空本地状态 | 清空关键词、恢复全部、显示反馈并触发重新请求 | Playwright 点击后断言请求状态/反馈可见 |
| 顶部操作 | 导出明细 | 目标站存在导出入口，需后端导出能力 | 目标站未在本次首屏触发导出请求 | 旧实现点击无反馈 | 显示“尚未接入可变更业务接口”的阻塞反馈，不假成功下载 | 页面 `role=status` 操作反馈可见 |
| 顶部操作 | 录入订单 | 目标站打开录入订单业务入口 | 本次未继续提交，避免写操作 | 旧实现点击无反馈 | 显示未接入阻塞反馈，不伪造弹窗或保存成功 | 页面 `role=status` 操作反馈可见 |
| 高级筛选 | 订单状态、渠道、入住日期、离开日期 | 展开筛选区，选择后影响列表参数 | 目标站筛选最终刷新 `POST /orders/page/get` | 旧实现只是静态控件 | 展开/收起可用；尚未接入的高级字段显示明确阻塞反馈 | `tests/order-house.spec.ts` 断言展开/收起，交互反馈由页面状态承载 |
| 表格 | 住宿订单列表 | 24 列，数据来自 `orders/page/get`，分页总数来自响应 `data.total` | `POST /orders/page/get` | 旧实现使用硬编码数组和固定 `共 1680 条` | 新增 `src/services/houseOrders.ts` 适配 `data.list/total/pageNum/pageSize/pages` | `tests/order-house.spec.ts` 断言列表来自 mocked 真实契约，总数为响应值 |
| 表格操作 | 排房 | 未排房订单提供排房入口，真实变更需要业务接口 | 本次取证未执行写请求 | 旧实现按钮无反馈 | 点击显示未接入阻塞反馈，不假装排房成功 | Playwright 断言排房按钮可见；操作反馈可见 |
| 表格操作 | 详情 | 打开订单详情抽屉 | 详情数据复用列表返回的 `orderDetailViews` 字段 | 旧实现基于静态行打开抽屉 | 保留抽屉，数据来自请求适配后的行对象 | `tests/order-house.spec.ts` 断言详情包含订单号、渠道单号、房型房间、房费与总收入 |
| 详情抽屉 | 登记入住人、邀请登记、邀请续住、入住人、延迟退房、换房、取消排房、不占库存、不计入统计、设为续住单、取消房单、保洁、打印 | 目标站存在多业务动作，部分会写入订单状态 | 本次未执行写请求，避免生产写操作 | 旧实现按钮无反馈 | 所有按钮显示未接入阻塞反馈，不吞错、不假成功 | 页面 `role=status` 操作反馈可见 |
| 详情底部 | 更多操作/收款/续住/入住/退房 | 目标站底部操作进入订单变更流程 | 本次未执行写请求，避免生产写操作 | 旧实现按钮无反馈 | 绑定统一阻塞反馈 | 页面 `role=status` 操作反馈可见 |
| 错误态 | 接口失败、认证/CORS/缺上下文 | 目标站登录态失效或后端失败应暴露 | 请求失败时无有效业务数据 | 旧实现继续显示静态假数据 | `fetch + credentials: include`，失败显示 `role=alert` 和“重试” | `tests/order-house.spec.ts` 模拟 503，断言 alert、重试、无旧静态行 |
| 空态 | 接口返回空列表 | 表格结构保留，显示空态 | `POST /orders/page/get` 返回 `data.list=[]` | 旧实现不会真实空态 | 空列表显示“暂无数据”且不崩溃 | `tests/order-house.spec.ts` 点击重试后断言空态 |

## 真实网络取证摘要

- 新鲜固定 Chrome 取证批次：`20260516-95-real-loop`
- 核心列表接口：`POST https://hudson-prod.localhome.cn/orders/page/get`
- 首屏列表请求体：`campId/pageNum/pageSize/orderType/isLt`
- 首屏响应摘要：`data.total=1693`、`data.list.length=20`，首行字段包含 `orderId/outOrderId/guestName/guestMobile/orderState/orderDetailViews/paymentOrders`
- 详情嵌套字段：`orderDetailViews[0]` 含 `poiName/roomCategoryName/roomCategoryProductName/roomName/checkInDate/checkOutDate/duration/isArrangeRoom/isOccupation/isStatistics/orderDetailDisplayState`
