# 微信客服交互矩阵

任务 ID：`scrm--kehu-goutong--weixin-kefu`

目标站取证批次：`20260518-95-target`

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 导航入口 | SCRM > 客户沟通 > 微信客服 | `/scrm/wechatService/manage` 可访问，SCRM 顶栏与微信客服侧栏高亮 | `GET /scrm/wechatService/manage`，页面加载后触发 `wxCp/authInfo/get`、`wxcp/kfAccount/page/get`、`wxcp/kfAccount/report/get` | 路由已存在，但主体是未开通介绍页 | 保留项目入口与高亮，主体改为业务可用看板 | Playwright 进入路由后断言菜单高亮、标题和核心业务区 |
| 顶部筛选 | 日期范围 | 目标主体未展示日期筛选；会话浮层展示会话列表，业务上需要按日期统计客服数据 | `POST /wxcp/kfAccount/report/get`，请求体含 `campId/startDate/endDate/channel/status` | 无筛选控件 | 接入服务层请求参数，查询后刷新指标、会话与待办 | 点击查询后读取 `localStorage.pms.wechatService.lastRequest` 断言请求体和 UI 更新 |
| 顶部筛选 | 门店/渠道/状态 | 目标主体未展示；Network 有 `camps/get`、`channels/get` 支撑，全局会话里有途家/美团/小猪等渠道与咨询状态 | `POST /wxcp/kfAccount/report/get` 与 `POST /wxcp/kfAccount/page/get` 共用筛选参数 | 无筛选控件 | 用 mock provider 提供门店、渠道、会话状态枚举并驱动数据 | Playwright 选择渠道/状态后断言列表收敛 |
| 顶部操作 | 查询 | 目标主体无查询；业务上应重新拉取当前条件数据 | `fetchWechatServiceDashboard(query)` | 无 | 显示加载态，成功后更新数据和刷新时间 | Playwright 点击后断言 loading/status 与诊断请求 |
| 顶部操作 | 重置 | 目标主体无重置；业务上应恢复默认条件 | 同查询接口，默认参数 | 无 | 清空渠道/状态/关键词，恢复默认日期和第一页 | Playwright 点击后断言表单和数据恢复 |
| 顶部操作 | 刷新 | 目标主体无刷新；全局会话可实时刷新 | 同查询接口 | 无 | 禁止重复提交，完成后显示业务状态反馈 | Playwright 点击后断言按钮 disabled 与成功提示 |
| 顶部操作 | 导出 | 目标主体无导出；业务上需要客服报表导出 | `POST /wxcp/kfAccount/report/export` 草案 | 无 | 创建导出任务并显示任务号 | Playwright 点击后断言 status 文案和导出诊断 |
| 指标卡片 | 客服账号、会话量、响应率、待处理 | 目标主体无指标；取证接口 `wxcp/kfAccount/report/get` 表明存在报表能力 | `POST /wxcp/kfAccount/report/get` | 无 | 指标来自统一响应包，点击打开指标详情抽屉 | Playwright 点击指标卡断言抽屉内容 |
| 客服账号列表 | 查看账号详情 | 目标 Network 有 `wxcp/kfAccount/page/get` | `POST /wxcp/kfAccount/page/get` | 无列表 | 展示账号、接待状态、今日会话、响应时长、转化线索 | Playwright 点击查看断言账号详情弹窗 |
| 会话列表 | 会话项点击 | 目标右侧全局会话浮层展示真实会话项，点击会话进入 IM 对话 | 未来 `POST /wxcp/conversation/page/get` 或 IM SDK 会话详情 | AppShell 全局浮层已有会话视觉；本页主体无承接 | 本页用会话详情抽屉承接，展示订单/房源/消息摘要和快捷动作 | Playwright 点击会话行断言详情抽屉 |
| 会话列表 | 分页/排序 | 目标右侧浮层为滚动列表；无主体分页 | `page/pageSize/sortBy` | 无 | 本页列表支持分页和按最近消息排序 | Playwright 点击分页断言请求参数 |
| 快捷入口 | 接待配置 | 目标侧栏有接待配置，真实路由为 `/scrm/wechatService/receptionConfig` | 路由跳转 | 旧页只有开通跳转 | 使用现有路由跳转接待配置 | Playwright 点击断言 URL |
| 快捷入口 | 聊天工具栏 | 目标侧栏有聊天工具栏 | 已有路由 `/scrm/sidebar/preview` | 无 | 使用现有路由承接 | Playwright 点击断言 URL 或页面标题 |
| 待办列表 | 分配客服/查看订单/处理超时 | 目标会话浮层展示咨询中、待入住、入住中、已取消等状态 | 同会话列表和订单详情草案 | 无 | 用业务抽屉承接，不硬编码不存在路由 | Playwright 点击断言抽屉和反馈 |
| 错误态 | 重试 | 目标站接口失败未在主体展示；新版要求清晰暴露 | 统一响应包 `code != 0` | 无 | mock provider 支持 error，页面显示错误与重试入口 | Playwright 设置 error 状态，断言 alert 和重试 |
| 空态 | 暂无会话/暂无账号 | 目标当前有大量会话，未取证主体空态 | 统一响应包 `data.list=[]` | 无 | mock provider 支持 empty，页面结构不崩溃 | Playwright 设置 empty 状态，断言空态 |
| 禁用态 | 加载中按钮 | 目标主体开通按钮无重复提交约束取证 | 本地服务请求状态 | 无 | 查询/刷新时禁用相关按钮 | Playwright 点击刷新后断言 disabled |

待后端确认：正式客服会话列表接口 path、会话详情接口 path、导出任务接口 path、写操作权限、`wxcp/kfAccount/report/get` 响应字段是否统一到 `code/message/data/traceId/timestamp`。
