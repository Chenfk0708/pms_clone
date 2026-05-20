# 客户营销交互矩阵

任务：`scrm--yingxiao-tuiguang--kehu-yingxiao`

## 取证结论

- 目标站 `https://minsubao.localhome.cn/scrm/marketing/customer` 使用固定 Chrome 与 `playwright/.auth/pms-user.json` 取证，未被登录页阻断。
- 当前账号进入目标页后呈现 SCRM 顾问/订阅引导态，未暴露客户营销业务接口、筛选器、活动列表或表格请求。
- 本地页按 95 分要求升级为业务可用态，使用 `src/services/customerMarketing.ts` 的显式 `mock` provider；`real` provider 复用同一统一响应包契约，可集中切换。

## 矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口导航 | SCRM > 营销推广 > 客户营销 | 侧栏高亮客户营销，主区显示 SCRM 顾问引导 | 无业务接口暴露 | `/scrm/marketing/customer` 已接入 AppShell | 保留路由和菜单高亮，页面标题为客户营销 | Playwright 断言 SCRM 和客户营销链接 active |
| 顶部筛选 | 日期 | 目标站未暴露业务筛选 | `POST /scrm/marketing/customer/overview`，字段 `bizDate` | 新增 date 输入，变更后进入服务查询参数 | 接入 `CustomerMarketingQuery.date`，刷新统一 provider | Playwright 断言服务契约 `date=2026-05-18` |
| 顶部筛选 | 门店 | 目标站仅可见当前店铺名称 | `storeId`，全部门店传 `null` | 新增门店下拉 | 下拉项来自 provider 的 `filters.stores` | Playwright 覆盖首屏加载和查询 |
| 顶部筛选 | 渠道 | 目标站未暴露业务筛选 | `channel`，枚举 `wechat/coupon/order` | 新增渠道下拉 | 下拉项来自 provider 的 `filters.channels` | Playwright real provider 拦截请求体 |
| 顶部筛选 | 营销阶段 | 目标站未暴露业务筛选 | `stage`，枚举 `new/retention/sleeping` | 新增阶段下拉 | 下拉项来自 provider 的 `filters.stages` | Playwright 选择 `retention` 后断言 `stage=retention` |
| 顶部筛选 | 客户关键词 | 目标站未暴露业务搜索 | `keyword`，空值传 `null` | 新增输入框 | 查询按钮提交到服务层，不在组件拼数据 | Playwright 覆盖查询反馈 |
| 顶部筛选 | 查询 | 目标站未暴露业务按钮 | 调用 overview 服务 | 新增可点击按钮 | 显示“查询条件已应用”，服务参数更新 | Playwright 断言反馈和 service contract |
| 顶部筛选 | 重置 | 目标站未暴露业务按钮 | 恢复默认请求参数 | 新增可点击按钮 | 清空关键词和筛选，反馈“筛选条件已重置” | Playwright 覆盖按钮反馈 |
| 工具栏 | 刷新 | 目标站未暴露业务按钮 | 重新调用 overview 服务 | 新增可点击按钮 | 显示 loading/成功反馈 | Playwright 断言“数据已刷新” |
| 工具栏 | 导出 | 目标站未暴露业务按钮 | 未来可接 `POST /scrm/marketing/customer/export` | 新增业务反馈 | 有数据时创建导出任务反馈，无数据禁用 | Playwright 断言“导出任务已创建” |
| 工具栏 | 批量触达 | 目标站未暴露业务按钮 | 未来可接 `POST /scrm/marketing/customer/touch` | 新增业务反馈 | 有名单时加入执行队列，无数据禁用 | 专项测试覆盖禁用/反馈路径 |
| 指标卡片 | 活跃客户/触达客户/转化订单/待跟进 | 目标站未暴露指标 | 来自 overview `metrics[]` | 新增按钮式指标卡 | 点击打开指标详情弹层 | Playwright 点击“活跃客户”断言指标详情 |
| 图表区域 | 漏斗阶段 tab | 目标站未暴露图表 | 来自 overview `funnel[]` | 新增漏斗条形图 | 点击阶段产生选中态和反馈 | Playwright 覆盖 tab/反馈 |
| 活动列表 | 查看详情 | 目标站未暴露列表 | 来自 overview `campaigns[]` | 新增活动卡片 | 打开营销活动详情弹层 | Playwright 点击并断言“转化率” |
| 待跟进 | 跟进 | 目标站右侧会话列表可见，但客户营销业务待办未暴露 | 来自 overview `todos[]` | 新增待跟进行 | 点击记录跟进反馈 | Playwright 断言“跟进任务已记录” |
| 客户名单 | 查看详情 | 目标站未暴露表格 | 来自 overview `leads.list` + `pagination` | 新增名单表格 | 打开客户详情弹层 | Playwright 覆盖详情弹层 |
| 客户名单 | 上一页/下一页 | 目标站未暴露分页 | `page/pageSize` | 新增分页按钮 | 首页上一页禁用；下一页保留当前条件反馈 | Playwright 覆盖可见按钮反馈 |
| 快捷入口 | 客户列表 | 目标站侧栏有客户列表入口 | 路由 `/customer/list` | 新增快捷入口 | 使用项目已有路由跳转 | Playwright 断言 URL 到 `/customer/list` |
| 快捷入口 | 客户标签 | 目标站侧栏有客户标签入口 | 路由 `/customer/tag` | 新增快捷入口 | 使用项目已有路由跳转 | 路由存在，纳入手工矩阵 |
| 快捷入口 | 优惠券 | 目标站营销推广有优惠券入口 | 路由 `/mallManagement/couponMgt` | 新增快捷入口 | 使用项目已有路由跳转 | 路由存在，纳入手工矩阵 |
| 快捷入口 | 住宿订单 | 目标站右侧会话含订单上下文 | 路由 `/order/house-order/list` | 新增快捷入口 | 使用项目已有路由跳转 | 路由存在，纳入手工矩阵 |
| 状态反馈 | loading | 目标站未暴露业务 loading | provider 调用期间显示 | 新增状态 | 首屏与刷新显示“数据加载中” | Playwright 间接覆盖加载状态 |
| 状态反馈 | empty | 目标站未取证到业务空态 | `localStorage.pms.customerMarketingMockMode=empty` | 新增空态 | 结构不崩溃，显示业务空态 | Playwright 空态测试 |
| 状态反馈 | error | 目标站未取证到业务错误态 | `localStorage.pms.customerMarketingMockMode=error` | 新增错误态 | 清晰暴露错误并提供重试 | Playwright 错误态测试 |

## 待确认

1. 目标站当前账号只展示 SCRM 顾问引导，真实客户营销业务接口、字段枚举和分页口径需要后端确认。
2. 本地 `real` provider 暂按统一响应包调用 `POST /scrm/marketing/customer/overview`，路径和字段名为前端契约草案。
3. 导出、批量触达当前为本地业务反馈，后端落地时建议新增独立任务接口并复用同一错误响应包。
