# 会员积分交互矩阵

任务：`scrm--huiyuan-zhongxin--huiyuan-jifen`  
目标页：`https://minsubao.localhome.cn/scrm/memberCenter/integrate`  
本轮目标站取证批次：`20260518072826`

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口与导航 | SCRM > 会员中心 > 会员积分 | 固定 Chrome 可进入目标 URL，侧栏会员积分高亮；目标站主体仍以会员积分占位图、SCRM 顾问二维码和右侧会话浮层为主 | 首屏加载全局 `camps/get`、`menus/project/get`、`edition/resource/get`，未观察到会员积分业务列表接口 | 已有 `/scrm/memberCenter/integrate` 路由，但页面是静态占位 | 保留路由和 AppShell，升级主体为业务可用运营台 | Playwright 断言侧栏 active、页面标题、业务模块可见 |
| 顶部筛选 | 门店、日期范围、积分场景、会员搜索 | 目标站当前无会员积分筛选控件；业务页需要按门店和时间维度查看积分 | 建议 `POST /scrm/memberCenter/integrate/overview` 与 `POST /scrm/memberCenter/integrate/records/page`，请求含 `storeId/startDate/endDate/scene/keyword/page/pageSize` | 无筛选，页面无数据服务 | 新增筛选控件，参数进入 `memberPoints` 数据服务，组件只消费适配后的业务模型 | Playwright 填写筛选后断言诊断参数与 UI 反馈更新 |
| 顶部操作 | 查询、重置、刷新 | 目标站无对应控件；本地需形成真实业务反馈 | 查询/重置/刷新复用概览与流水列表请求；刷新展示 loading 并更新时间 | 无按钮 | 查询应用参数，重置恢复默认，刷新重新拉取当前条件数据 | Playwright 点击后断言 loading、status 文案、数据服务参数 |
| 顶部操作 | 导出 | 目标站未取证到导出入口；业务上应导出当前筛选流水 | 建议 `POST /scrm/memberCenter/integrate/export`，请求复用当前筛选条件 | 无按钮 | 创建导出任务反馈，不在页面正文暴露开发态文案 | Playwright 点击后断言业务态成功反馈 |
| 指标卡片 | 今日发放、今日消耗、净增长、活跃会员 | 目标站当前无指标卡片；按会员积分业务补齐运营概览 | 概览接口返回 `metrics[]`，每张卡含 `key/title/value/unit/trend/detail` | 无指标 | 卡片 hover/点击打开详情抽屉，展示对应业务解释和关联流水 | Playwright 点击卡片后断言详情弹层 |
| 图表区域 | 积分趋势、legend 切换 | 目标站当前无图表；业务上需要发放/消耗趋势 | 概览接口返回 `trend[]`，legend 本地切换不发请求 | 无图表 | 用可访问按钮切换发放/消耗系列，图表随状态更新 | Playwright 点击 legend 后断言 selected 状态与柱图可见 |
| 列表区域 | 积分流水表格 | 目标站当前无表格；业务上需要展示积分变更记录 | 列表接口返回统一分页包 `data.list + data.pagination` | 无表格 | 新增流水表格、分页、详情入口、空态和错误态 | Playwright 断言表格行、分页、详情抽屉、empty/error |
| 快捷入口 | 查看会员等级、会员权益、客户列表、优惠券 | 目标站侧栏已有会员等级/会员权益；其他入口按项目已有路由承接 | 不触发会员积分服务；使用已有本地路由 | 页面无业务入口 | 使用项目已有路由 `/scrm/memberCenter/level`、`/scrm/memberCenter/equity`、`/customer/list`、`/mallManagement/couponMgt` | Playwright 点击后断言 URL |
| 状态反馈 | loading、success、empty、error、disabled | 目标站无积分业务态；本地必须清晰暴露失败/空数据 | mock provider 支持 `success/empty/error`，统一响应包表达 | 无业务状态 | 加载时禁用重复提交，空态保留结构，错误态展示重试入口 | Playwright 使用 `mockState=empty/error` 验证 |
