# 聊天工具栏交互矩阵

任务：`scrm--kehu-goutong--liaotian-gongjulan`  
页面：`/scrm/sidebarPreview`  
目标站：`https://minsubao.localhome.cn/scrm/sidebarPreview`

## 取证结论

- 固定 Chrome + `playwright/.auth/pms-user.json` 已访问目标站，当前账号看到的主体仍偏订阅介绍态，并伴随右侧会话浮层。
- 目标站首屏关键请求包括 `camps/get`、`camp/get`、`edition/resource/get`、`order/report/get`、`imYunxinUser/get`、`orders/strongReminder/page/get`、`roomCategories/page/get`、`rooms/get`。
- 目标站未暴露完整聊天工具栏业务接口，因此本地按新版任务要求沉淀聚合接口草案，并用显式 `mock` provider 作为当前正式数据源。

## 交互矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口导航 | SCRM > 客户沟通 > 聊天工具栏 | 进入 `/scrm/sidebarPreview`，目标站当前呈订阅介绍/会话浮层 | 无新增请求，依赖 SCRM 壳层路由 | 已接入项目路由和菜单 | 保持 `/scrm/sidebarPreview`，菜单高亮 `聊天工具栏` | Playwright 断言链接 `is-active`、页面 H1 可见 |
| 顶部操作 | 会话设置 | 目标站未取证到业务态设置入口 | 已有路由 `/setting/imSetting` | 旧页无业务承接 | 跳转既有设置路由 | Playwright 点击后验证路由或入口存在 |
| 顶部操作 | 刷新 | 目标站业务态未暴露 | `POST /scrm/sidebarPreview/dashboard`，请求体沿用当前筛选 | 旧页静态 | 触发服务层重新拉取，显示 loading/成功反馈 | Playwright 点击 `刷新` 断言状态反馈 `数据已刷新` |
| 筛选栏 | 会话日期 | 目标站未取证到业务态筛选器 | `statDate` | 旧页无筛选 | 日期写入服务层请求参数并刷新列表 | Playwright fill 日期后点击查询 |
| 筛选栏 | 门店 | 目标站支撑请求含 `camps/get`、`camp/get` | `poiId`，`ALL` 转空字符串 | 旧页无筛选 | 下拉使用 dashboard stores，传入请求体 | Playwright `selectOption('qianhai')` |
| 筛选栏 | 渠道 | 目标站右侧会话浮层含平台会话线索 | `channel`，`ALL` 转空字符串 | 旧页无筛选 | 下拉使用 dashboard channels，支持筛选会话 | Playwright 选择 `tujia` 后关键词筛选 |
| 筛选栏 | 关键词 | 目标站未暴露 | `keyword`，trim 后传入 | 旧页无 | 搜索客户昵称、房型、订单号、偏好 | Playwright 断言 hidden contract 的 `data-request-keyword` |
| 筛选栏 | 查询 | 目标站未暴露 | `fetchScrmSidebarDashboard(createScrmSidebarRequestBody(filters))` | 旧页无 | 成功反馈 `已按筛选条件更新聊天工具栏` | Playwright 点击查询断言反馈 |
| 筛选栏 | 重置 | 目标站未暴露 | 重置默认请求体 | 旧页无 | 恢复默认日期、门店、渠道、关键词 | Playwright 空态中点击重置入口 |
| 筛选栏 | 导出 | 目标站未暴露 | 草案 `POST /scrm/sidebarPreview/export` | 旧页无 | 创建导出任务反馈，不在页面展示开发态文案 | Playwright 点击导出断言反馈 |
| 核心指标 | 今日会话/待回复/转化订单/平均响应 | 目标站未暴露业务态指标 | dashboard.metrics | 旧页订阅图片 | 指标来自服务层适配模型，点击切换趋势说明 | Playwright 断言核心指标区域含 `今日会话` |
| 会话处理台 | 会话列表 | 目标站右侧浮层呈现会话线索 | dashboard.conversations + pagination | 旧页无业务表 | 展示客户、房型订单、最近消息、响应 SLA 和操作 | Playwright 断言 `携程民宿-【M335275070】` |
| 会话处理台 | 同步排序 | 目标站未取证 | 当前 mock 阶段无请求，后续可接排序接口 | 旧页无 | 显示业务成功反馈 | 手工/后续测试点击断言反馈 |
| 会话处理台 | 查看详情 | 目标站右侧浮层可查看会话上下文 | 无额外请求；后续可拆 `/detail` | 旧页无 | 打开详情抽屉，展示偏好、订单、最近消息 | Playwright 点击 `查看详情` 断言 `会话详情` |
| 详情抽屉 | 发送续住话术 | 目标站未取证 | 后续可接消息发送接口 | 旧页无 | 显示 `话术已发送` 反馈 | Playwright 点击断言 status |
| 详情抽屉 | 查看订单 | 目标站关联订单线索 | 已有路由 `/order/house-order/list` | 旧页无 | 跳转住宿订单列表 | Playwright 点击 `去订单` 断言 URL |
| 趋势图 | 订单趋势 | 目标站未取证 | 无请求，前端切换系列 | 旧页无 | 切换订单柱状系列显示/隐藏 | Playwright 可通过按钮 `aria-pressed` 扩展验证 |
| 话术库 | 更多/收起 | 目标站未取证 | dashboard.replyTemplates | 旧页无 | 展开更多话术，支持收起 | Playwright 断言话术库含 `续住引导` |
| 话术库 | 发送话术 | 目标站未取证 | 后续可接消息发送接口 | 旧页无 | 发送按钮给出明确反馈 | Playwright 点击详情内发送续住话术覆盖 |
| 房态建议 | 去房态 | 目标站支撑请求含 `roomCategories/page/get`、`rooms/get` | 已有路由 `/statistics/roomSituation` | 旧页无 | 跳转房态页 | 后续路由专项可扩展 |
| 房态建议 | 推荐房源 | 目标站未取证 | dashboard.roomSuggestions | 旧页无 | 点击写入推荐话术反馈 | 手工/后续测试点击断言反馈 |
| 待办提醒 | 待办项 | 目标站请求含 `orders/strongReminder/page/get` | dashboard.pendingItems | 旧页无 | 点击标记跟进反馈 | 手工/后续测试点击断言反馈 |
| 快捷入口 | 去订单/查房态/发优惠券/话术设置 | 目标站业务承接未完整暴露 | 项目已有路由 | 旧页无 | 使用既有路由承接，不硬编码不存在页面 | Playwright 覆盖 `去订单` |
| 空态 | `mockState=empty` | 目标站未取证 | dashboard 返回空 conversations/pendingItems | 旧页无 | 显示 `当前筛选条件下暂无会话` 和重置入口 | Playwright 第 3 条用例覆盖 |
| 错误态 | `mockState=error` | 目标站未取证 | provider 抛出明确错误 | 旧页无 | `role=alert` 显示失败和重试 | Playwright 第 3 条用例覆盖 |
| 服务契约 | hidden `scrm-sidebar-service-contract` | 目标站无 | 暴露 provider、endpoint、request keyword、traceId 给测试 | 旧页无 | 不在正文展示开发态文案，仅 hidden 节点供验收 | Playwright 断言 `data-provider=mock` |

## 待确认项

- 正式后端是否接受聚合接口 `/scrm/sidebarPreview/dashboard`，或需要拆为会话、指标、话术、房态、待办多个接口。
- 发送话术、导出任务、排序同步、会话详情是否需要独立接口及幂等键。
- 渠道枚举、响应 SLA 口径、待办来源和订单/房态跳转携参规则。
