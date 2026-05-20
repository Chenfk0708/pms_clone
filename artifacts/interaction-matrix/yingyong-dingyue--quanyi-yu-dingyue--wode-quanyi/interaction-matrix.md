# 我的权益交互矩阵

任务 ID：`yingyong-dingyue--quanyi-yu-dingyue--wode-quanyi`

目标 URL：`https://minsubao.localhome.cn/version/myBenefit`

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口与侧栏 | 我的权益 | 从应用订阅进入后高亮当前菜单，维持页面壳层一致 | 页面首屏请求 `POST /edition/resource/get` | 路由已接入，菜单高亮可见 | 保持现有项目路由，首屏改为统一数据服务驱动 | Playwright 进入页面后断言 URL、菜单高亮、页面标题与主体渲染 |
| 顶部标签 | 版本资源 / 功能服务 / 开通记录 | 切换内容区展示资源表、快捷入口或记录列表 | 读取同一份权益看板数据，切换仅改 URL query `tab` | 已支持 URL 驱动切换 | 继续保留 query 作为唯一状态源，避免组件内散落状态 | 点击后断言 `data-active-tab` 与对应内容区域出现 |
| 顶部工具栏 | 刷新权益 | 重新拉取权益看板并给出操作反馈 | 重新请求 `POST /edition/resource/get` | 已支持 loading 与 status 反馈 | 刷新时清理 mock 状态并重新触发取数 | 断言 loading、状态提示与 `lastRequest` 诊断更新 |
| 顶部工具栏 | 导出记录 | 生成导出任务并反馈给用户 | 记录任务 `POST /version/myBenefit/export` | 已有本地任务记录，但未接真实后端 | 后续若接后端，只复用同一任务名和参数契约 | 断言 status 文案与诊断 endpoint |
| 版本卡片 | 开通记录 | 跳到记录列表，方便回看开通历史 | 同页切换 `tab=records` | 已支持 | 保持按钮直达记录列表 | 点击后断言进入记录 tab |
| 版本卡片 | 续费 | 生成续费任务并给出反馈 | 记录任务 `POST /version/myBenefit/renew` | 已有本地任务记录 | 后续接后端时保留同一动作入口 | 断言状态反馈出现 |
| 版本卡片 | 版本升级 | 打开升级面板，展示套餐与能力 | URL query `upgrade=1` | 已支持弹层状态 | 保留 query 驱动，避免组件内硬切换 | 断言 `data-upgrade-open=true` 与升级面板出现 |
| 资源表 | 扩容 | 对版本类资源打开资源详情，并生成扩容单 | 记录任务 `POST /version/myBenefit/expand` | 已支持资源详情弹窗 | 保留 goodsType=2 才显示按钮的规则 | 点击后断言详情弹窗和 status |
| 记录列表 | 查看详情 | 打开记录详情弹窗，展示订单号、来源与有效期 | 无新增请求，读取同页看板数据 | 已支持 | 保持弹窗为可回溯详情入口 | 断言 `role=dialog` 与详情字段 |
| 功能服务 | 打开 | 跳到项目内既有页面，如房态房价、订单、会员中心、报表等 | 复用项目已有路由 | 已支持 | 严禁硬写不存在路由，优先复用现有承接页 | 点击后断言 URL 已跳转 |
| 空态 | 权益空态 | 数据为空时保留壳层，不崩布局 | 仍请求 `POST /edition/resource/get`，但 mockState=empty | 已支持 | empty 状态必须显式呈现，不做静默兜底 | 断言空态文本与页面结构仍完整 |
| 错误态 | 重试 | 数据失败时显示 alert，并允许重试 | 重新请求 `POST /edition/resource/get` | 已支持 | 重试必须重新触发取数，不吞错 | 断言 alert、重试后状态恢复成功 |
| 升级面板 | 查看版本订阅 / 返回资源 | 查看订阅中心或关闭面板回到资源页 | 跳转到 `/version/subscriptionCenter` | 已支持 | 保持与项目现有订阅中心一致 | 断言 URL 与面板开关状态 |

## 说明

- 本页核心数据源为 `POST /edition/resource/get`。
- 目标站真实响应为 Hudson 风格 `success/errorCode/errorMsg/errorDetail/data`。
- 本地页面通过服务层适配为页面模型，再由 UI 消费。
