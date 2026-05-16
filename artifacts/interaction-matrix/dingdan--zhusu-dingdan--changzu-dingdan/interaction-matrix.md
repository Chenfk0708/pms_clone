# 长租订单交互矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 项目入口 | 订单 > 住宿订单 > 长租订单 | 进入 `/order/house-longRental-order/list`，订单顶栏高亮，左侧长租订单高亮 | 首屏加载 `orders/page/get`、`order/report/get`、筛选配置和门店/房型接口 | 路由和菜单已存在 | 保持路由接入，补数据来源状态 | Playwright 断言 URL、菜单高亮和数据来源区域 |
| 数据来源 | 长租订单列表 | 通过 `POST https://hudson-prod.localhome.cn/orders/page/get` 加载长租订单 | `orders/page/get`，参数来自 `campId`、关键词、筛选和分页 | 组件内静态快照，未暴露实时接口阻塞 | 新增页面级服务；有 `campId` 时请求真实接口，无 `campId` 时明确显示取证快照和阻塞 | Playwright route 断言 request body，默认页断言阻塞说明 |
| 顶部快筛 | 全部/今日新单/今日预抵/今日在住/今日预离等 | 切换筛选并刷新订单列表 | `orders/page/get` 参数变化 | 仅本地过滤，缺少请求和反馈 | 快筛变更记录状态；有 `campId` 时触发真实请求 | Playwright 点击后断言状态反馈和请求次数 |
| 搜索 | 订单号/姓名/手机号输入 | 搜索后刷新订单列表 | `orders/page/get` 携带关键词 | 仅本地过滤，缺少 loading/error | 输入 Enter 触发查询；无实时上下文时暴露阻塞 | Playwright 填写后断言请求参数或阻塞反馈 |
| 展开筛选 | 日期类型、订单状态、渠道、房型、入住状态、平台账号、门店、标签、排房、库存、统计、房型标签 | 展开高级筛选，下拉来自目标站筛选配置 | `menu/optionJsons/get`、`select/poi/page/get`、`roomCategories/page/get`、`select/calChannel4Order/get` 等 | 可展开，但按钮点击无反馈 | 点击每个筛选按钮时给出“真实选项未接入/等待上下文”的反馈，不静默 | Playwright 逐项点击断言状态反馈 |
| 顶部操作 | 重置筛选 | 恢复默认条件并刷新列表 | `orders/page/get` | 重置本地状态，无反馈 | 重置后显示状态；有 `campId` 时重新请求 | Playwright 点击后断言状态和输入清空 |
| 顶部操作 | 导出明细 | 目标站发起导出任务或权限校验 | 目标站未在本轮确认导出接口 | 按钮无反馈 | 显示真实导出接口未取证阻塞，不假成功 | Playwright 点击后断言阻塞反馈 |
| 顶部操作 | 录入订单 | 目标站进入长租订单录入或弹层 | 目标站未在本轮确认录入接口 | 按钮无反馈 | 显示录入入口未接入阻塞 | Playwright 点击后断言阻塞反馈 |
| 表格 | 详情 | 打开右侧长租订单详情抽屉 | `order/get`、`orderDetailCostPrices/get/v2`、`order/settleOrders/get`、`tag/group/get` | 已打开详情抽屉，但详情数据仍来自行快照 | 保留抽屉，显示详情接口取证来源；未实时取详情时标注快照 | Playwright 点击详情断言抽屉内容 |
| 表格 | 分页 | 切换分页并刷新列表 | `orders/page/get` 携带 `pageNum/pageSize/current` | 只有第 1 页，上一页 disabled | 保留禁用态，当前无下一页数据时明确显示快照页 | Playwright 断言 disabled 和页码 |
| 错误态 | 接口失败/无权限/CORS/缺 campId | 目标站显示错误或重新登录 | 真实接口失败 | 未覆盖 | 显示 `role=alert` 和重试入口，不吞错 | Playwright 模拟 403 断言错误与重试按钮 |
| 空态 | 搜索无结果或接口空 list | 显示暂无数据 | `orders/page/get` 返回空列表 | 本地过滤可显示暂无数据 | 保持空态，并标明来自真实请求或快照过滤 | Playwright route 空列表断言结构不崩 |
