# 预售券订单交互矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 项目入口 | 订单 > 预售券订单 > 预售券订单 | 进入 `/mallManagement/orderManagement`，订单顶栏和左侧 `预售券订单` 高亮 | 首屏加载 `camps/get`、`channels/get`、`paymentTypes/get/v2`、`categories/get`、`orders/page/get` | 已有静态复刻，入口存在 | 保持路由入口，页面加载时接入真实订单接口；失败时显示阻塞 | Playwright 断言标题、侧栏高亮、数据来源状态 |
| 数据请求 | 订单列表 | `POST https://hudson-prod.localhome.cn/orders/page/get`，默认 `roomCategoryTypes=["1","2","3"]` | `orders/page/get` body 包含 `campId/pageNum/pageSize/orderStates/roomCategoryTypes/categoryIds/orderChannelIds/paymentWayIds/bookedStartDate/bookedEndDate/keyword/refundDisplayState` | 旧页面只显示硬编码空态 | 新增 `src/services/presaleOrder.ts`，从 URL 或 `camps/get` 取得 `campId`，用统一 fetch+credentials 请求真实接口 | `tests/presale-order-real.spec.ts` route 捕获 body 并断言默认参数 |
| 顶部筛选 | 订单状态 | 目标站将 UI 值映射为后端 `orderStates` 数组 | `orders/page/get` | 旧页面为固定“全部”按钮 | 增加下拉选择，`全部/待支付/已发货/已完成/已取消` 映射真实后端枚举 | Playwright 点击后检查按钮反馈和请求参数 |
| 顶部筛选 | 商品类型 | 目标站选项为 `虚拟商品/实物商品/电子卡券`，映射 `roomCategoryTypes=1/2/3` | `orders/page/get` | 旧页面仅本地选择，无请求 | 选择后保留 UI 状态，搜索时带入真实 body | Playwright 选择 `虚拟商品` 后断言 `roomCategoryTypes=["1"]` |
| 顶部筛选 | 订单来源 | 目标站来源来自 `channels/get` 或页面静态枚举 | `channels/get`、`orders/page/get` | 旧页面硬编码来源文案 | 先请求 `channels/get`，失败时仍暴露数据来源阻塞；搜索带 `orderChannelIds` | Playwright mock `channels/get`，选择 `微信小程序` 后断言 `orderChannelIds=["34"]` |
| 顶部筛选 | 商品类目 | 目标站通过 `categories/get` 返回级联类目 | `categories/get`、`orders/page/get` | 旧页面硬编码类目 | 请求真实类目并展平显示；无返回时下拉显示“真实选项接口未返回数据” | Playwright mock 类目，断言下拉可显示真实选项 |
| 顶部筛选 | 支付方式 | 目标站通过 `paymentTypes/get/v2` 获取 `bizTypes=[3]` 支付方式 | `paymentTypes/get/v2`、`orders/page/get` | 旧页面硬编码支付方式 | 请求真实支付方式并搜索时带 `paymentWayIds` | Playwright mock 支付方式，专项测试覆盖请求链路 |
| 顶部筛选 | 下单时间 | 目标站将日期转为当天开始与结束次日开始毫秒时间戳 | `orders/page/get` | 旧页面仅输入本地值 | 日期输入进入 `bookedStartDate/bookedEndDate`，请求参数详情面板可审计 | Playwright 可通过请求参数面板和 route body 验证 |
| 顶部筛选 | 搜索输入 | 目标站输入订单编号/买家联系方式后点击搜索刷新列表 | `orders/page/get` | 旧页面只更新本地字符串 | Enter 或点击 `搜 索` 调用真实接口；loading 期间禁用按钮 | Playwright 填 `138` 后断言 `keyword="138"` |
| 顶部操作 | 重置 | 恢复默认筛选并重新请求列表 | `orders/page/get` | 旧页面只重置本地状态 | 重置后重新请求默认 body，保留 loading/成功/失败反馈 | Playwright 可断言输入清空与请求刷新 |
| 顶部操作 | 刷新 | 按当前筛选重新请求 | `orders/page/get` | 旧页面无刷新按钮 | 新增 `刷 新`，失败时显示 `alert` 和阻塞说明 | 错误态专项测试断言 403 文案和刷新入口 |
| 顶部操作 | 导出明细 | 目标站存在按钮，但本轮未取得明确导出接口契约 | 未取证到稳定导出接口 | 旧页面假成功提示 | 改为明确阻塞提示，不伪造导出成功 | Playwright 点击后断言 status 包含 `导出明细` 与 `阻塞` |
| 表格 | 订单行 | 目标站订单行来自 `orders/page/get` 的 `list/orderDetailViews` | `orders/page/get` | 旧页面永远空态 | 适配真实字段，渲染商品、类型、金额、买家、状态和操作 | Playwright mock 1 条订单并断言行内容 |
| 表格 | 订单详情 | 目标站跳转 `/mallManagement/orderManagement/details/:orderId` | 项目尚未注册详情路由 | 旧页面无详情入口 | 本地显示“详情路由未接入”阻塞反馈，不硬跳不存在页面 | Playwright 点击 `订单详情` 断言阻塞 status |
| 表格 | 空态 | 接口返回空 list 显示 `暂无数据` | `orders/page/get` 返回空 `list` | 旧页面硬编码空态 | 保持空态，但区分真实空列表与接口失败 | Playwright 空态专项断言 `共 0 条` |
| 表格 | 错误态 | 无权限、登录失效、CORS、接口失败必须暴露 | 任一真实请求失败 | 旧页面无错误态 | 显示 `role=alert`，说明接口与失败原因，不吞错 | Playwright 403 专项断言错误和重试入口 |
| 分页 | 上一页/下一页 | 按 `pageNum/pageSize` 请求下一页 | `orders/page/get` | 旧页面无分页 | 增加分页控件，无下一页时禁用；切页重新请求 | Playwright 可断言 disabled 和请求 pageNum |
