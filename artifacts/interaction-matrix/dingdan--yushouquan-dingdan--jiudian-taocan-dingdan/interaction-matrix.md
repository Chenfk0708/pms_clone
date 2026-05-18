# 酒店套餐订单交互矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口导航 | 订单 > 预售券订单 > 酒店套餐订单 | 固定 Chrome 取证显示 URL 为 `/mallManagement/hotelPackageOrder`，侧栏当前项高亮，表格为空态 | 无业务请求，仅路由进入 | 已有路由，但旧实现为静态空表 | 保留项目现有 layout/路由，页面标题与侧栏高亮继续协调 | Playwright 断言 heading 与侧栏 link active |
| 顶部筛选 | 订单状态 | 目标站默认显示“全部” | `POST https://hudson-prod.localhome.cn/orders/page/get`，body.orderStates | 旧实现固定“全部”，不可参与数据服务 | 接入 `HotelPackageOrderFilters.orderState`，服务层生成 `orderStates` | 专项测试覆盖请求体与页面刷新 |
| 顶部筛选 | 订单来源 | 目标站可打开选择器；取证点击“订单来源”生成 dropdown artifacts | `orderChannelIds` | 旧实现仅本地状态，无数据请求 | 选项来自 mock provider 的统一响应包，选择后参与查询 | Playwright 点击“微信商城”后断言 request body |
| 顶部筛选 | 下单时间 | 目标站有开始/结束日期输入 | `bookedStartDate`、`bookedEndDate` 时间戳 | 旧实现只更新组件状态 | 服务层统一转换日期边界并参与请求体 | Playwright 填写日期后搜索 |
| 顶部筛选 | 搜索关键字 | 目标站 placeholder 为“请输入订单编号/买家联系方式” | `keyword` | 旧实现无数据服务 | 关键字传入 provider 并筛选 mock 数据 | Playwright 填写 `138` 后断言 UI 与 request body |
| 顶部筛选 | 售后状态 | 目标站有售后状态选择器 | `refundDisplayState` | 旧实现仅静态选项 | 选项来自响应包，参与查询 | Playwright 下拉可点击，矩阵记录为已接入 |
| 操作区 | 重置 | 目标站重置筛选条件 | 按默认参数重新拉取 | 旧实现只清本地字段 | 重置后调用数据服务并刷新列表 | Playwright 断言选项和输入清空 |
| 操作区 | 刷新 | 目标站无单独刷新按钮，当前业务页补充为可回归操作 | 当前筛选条件重新请求 | 旧实现无刷新 | 新增“刷 新”，loading 禁用并显示完成反馈 | Playwright 断言“刷新完成” |
| 操作区 | 搜索 | 目标站点击后请求订单列表 | `orders/page/get` | 旧实现只关闭下拉 | 调用统一 mock provider，成功/空态/错误均有反馈 | Playwright 断言“搜索完成” |
| 操作区 | 导出明细 | 目标站有导出按钮 | 未来建议 `POST /hotel-package-orders/export`，当前记录当前条件 | 旧实现仅 toast 文案 | 创建导出任务反馈，不显示开发态文案 | Playwright 断言“导出任务已创建” |
| 表格 | 订单详情 | 目标站为空态未取证到详情行 | 当前阶段用详情弹窗承接 | 旧实现无数据行、无详情 | 列表行打开酒店套餐订单详情弹窗 | Playwright 断言 dialog 与关闭 |
| 表格 | 分页 | 目标站空态无分页；本地业务数据需要分页 | `pageNum`、`pageSize` | 旧实现无分页 | 新增上一页/下一页和总数，避免右侧会话浮层遮挡 | Playwright 点击下一页并断言页码 |
| 状态 | 空态 | 目标站显示“暂无数据” | 统一响应包 `code=0,data.list=[]` | 旧实现静态空态 | `?mockState=empty` 返回空列表，页面结构不崩 | Playwright 空态用例 |
| 状态 | 错误态 | 目标站接口失败需暴露 | 统一响应包失败格式或 HTTP error | 旧实现无错误暴露 | `?mockState=error` 显示错误和刷新入口 | Playwright 错误态用例 |
