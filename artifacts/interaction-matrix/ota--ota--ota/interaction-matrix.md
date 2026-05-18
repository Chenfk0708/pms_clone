# OTA 交互矩阵

任务：`ota--ota--ota`  
目标页：`https://minsubao.localhome.cn/channels/ota`  
本轮目标站取证批次：`20260518063105`  

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 项目入口 | 顶部 OTA 导航、左侧 OTA 菜单 | URL 保持 `/channels/ota`，顶部 OTA 与侧边 OTA 高亮，页面隐藏通用标题，仅显示业务内容 | 无业务请求，依赖路由和菜单配置 | 已可访问，但页面数据来自静态数组 | 保持既有路由，补数据服务状态区和业务态内容 | Playwright 断言 URL、顶部/侧边高亮、OTA 页面业务区可见 |
| 主页面数据 | 已直连渠道卡片 | 展示携程、美团酒店、飞猪淘酒店、美团民宿、途家、木鸟、小猪、路客云聚合，显示关联房型 4/4 | `POST /channels/get`、`POST /campFlow/get`、`POST /weiRoomCategories/page/get` 等目标站请求参与首屏渠道数据与房型关系 | `src/data/mock.ts` 中 `otaConnectedCards` 静态数组驱动 | 新增 `fetchOtaDashboard` 显式 mock provider，统一响应包后适配成业务模型 | Playwright 断言数据服务状态、8 张已直连卡、traceId 状态和业务文案 |
| 主页面数据 | 未直连渠道卡片 | 展示携程玩乐、Booking、携程国际、爱彼迎、同程民宿、58同城、贝壳、腾讯地图，按钮为立即关联 | 同上，关联状态来自渠道能力与授权数据 | `src/data/mock.ts` 静态数组驱动 | 未直连列表进入同一 dashboard payload，支持空态 | Playwright 断言 8 张未直连卡；`mockState=empty` 时空态稳定 |
| 主页面操作 | 新增账号 | 点击后目标站打开新增账号弹窗，包含日期、金额、备注等通用弹层字段或渠道账号提交链路 | 未来 `POST /channels/accounts/create`，请求包含 `channelId`、`campId`、账号信息 | 只显示 notice，无弹窗和提交反馈 | 打开“新增账号”抽屉，支持输入账号、取消、提交、loading、成功反馈 | Playwright 点击新增账号，填写账号，提交后断言抽屉关闭和状态反馈 |
| 主页面操作 | 管理渠道 | 点击后目标站进入渠道管理或打开渠道详情承接 | 未来 `POST /channels/detail/get`，请求包含 `channelId`、`campId` | 只显示 notice，不承接详情 | 打开渠道详情抽屉，显示关联房型、最近同步、快捷入口 | Playwright 点击管理渠道，断言详情抽屉、关闭按钮和快捷入口 |
| 主页面操作 | 立即关联 | 点击后目标站进入授权/关联流程，未直连渠道按钮为主按钮 | 未来 `POST /channels/activation/apply`，请求包含 `channelId`、`campId` | 只显示 notice | 打开关联确认弹窗，确认后通过 mock provider 生成成功反馈 | Playwright 点击立即关联，确认后断言成功状态；取消后关闭 |
| 主页面操作 | 操作日志 | 点击后跳转 `/channels/ota/log` | 无新增请求，路由承接 | 已跳转 | 保持现有路由，日志页接入服务和分页 | Playwright 断言 URL、日志表与分页 |
| 日志筛选 | 渠道选择 | 目标站为选择器，默认“请选择”，可按渠道筛选日志 | 未来 `POST /channels/operationLogs/page`，请求包含 `channelId`、`keyword`、`operator`、分页 | 当前是不可展开按钮 | 改成可选 select，选择后由数据服务刷新日志 | Playwright 选择美团酒店后断言服务参数和表格只含对应渠道 |
| 日志筛选 | 关键词、操作人 | 目标站输入后点击查询刷新日志 | 同 `operationLogs/page` | 当前输入存在，查询只写 notice | 查询接入数据服务，展示 loading、结果数和状态 | Playwright 填关键词查询，断言表格与状态反馈 |
| 日志筛选 | 重置 | 清空渠道、关键词、操作人和高级筛选 | 同 `operationLogs/page` 默认参数 | 当前只清空两个输入 | 清空全部筛选并刷新日志 | Playwright 设置筛选后重置，断言字段和列表恢复 |
| 日志筛选 | 展开/收起 | 展示操作类型、操作状态等高级筛选 | 同 `operationLogs/page`，扩展参数 `operationType`、`operationStatus` | 展开后高级按钮不可选 | 高级筛选改成 select，并参与查询 | Playwright 展开后选择解除渠道房型，断言表格变化 |
| 日志列表 | 分页 1/2/3 | 目标站分页按钮切换日志页 | `operationLogs/page` 请求包含 `page`、`pageSize` | 本地无分页 | 增加分页按钮并接入服务 | Playwright 点击第 2 页，断言当前页和表格更新 |
| 错误/空态 | 数据失败、空数据、非法参数 | 目标站请求失败时不应静默；页面应清晰暴露错误并可重试 | mock provider 支持 `mockState=error/empty` 和日期/分页校验 | 当前无错误态和空态 | dashboard/log 服务支持错误和空态；页面显示 alert、重试入口、空态 | Playwright `?mockState=error`、`?mockState=empty` 覆盖 |
| 顶部工具 | 消息、收款、接待、门锁、客服、通知 | 全局壳层已有真实反馈或路由承接 | 既有 AppShell 处理 | 非 OTA 局部范围 | 不改全局，仅验证不被 OTA 改动破坏 | 路由测试保持原有覆盖 |
