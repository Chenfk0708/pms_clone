# 接待配置交互矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 侧边导航 | `接待配置` 菜单项 | 高亮当前页，路由停留 `/scrm/wechatService/receptionConfig` | 无新增请求，沿用项目路由与导航状态 | 已实现 | 沿用 `AppShell` 侧栏，确保 `sidebar-link is-active` 暴露 | `tests/reception-config.spec.ts` 首测断言菜单高亮 |
| 顶部动作 | `立即开通` | 跳转订阅详情 | `/version/applicationPayment/detail` | 已实现 | 保留为目标站已取证到的 secondary action | `tests/reception-config.spec.ts` 第 5 条 |
| 顶部动作 | `预览欢迎语` | 目标站未暴露业务交互 | 无请求；本地使用当前规则欢迎语 | 已实现 | 打开欢迎语预览弹窗，展示当前规则模板正文 | `tests/reception-config.spec.ts` 第 2 条；`interaction-clone-20260519-final-interaction-*` |
| 顶部筛选 | `接待分组` 下拉 | 目标站无真实配置筛选 | `POST /scrm/wechatService/receptionConfig/dashboard`，参数 `staffGroup` | 已实现 | 显式传入 `night/vip/retention` 并刷新看板 | `tests/reception-config.spec.ts` 第 2、3 条 |
| 顶部筛选 | `规则状态` 下拉 | 目标站无真实配置筛选 | `POST /scrm/wechatService/receptionConfig/dashboard`，参数 `configStatus` | 已实现 | 显式传入 `enabled/draft/paused` 并刷新看板 | `tests/reception-config.spec.ts` 第 2 条 |
| 顶部筛选 | `规则关键词` 输入框 | 目标站无真实配置筛选 | `POST /scrm/wechatService/receptionConfig/dashboard`，参数 `keyword` | 已实现 | 支持规则名、备注、分组关键词过滤 | `tests/reception-config.spec.ts` 第 2、3 条 |
| 顶部操作 | `查询` | 目标站未暴露业务配置页 | `POST /scrm/wechatService/receptionConfig/dashboard` | 已实现 | 触发统一数据服务，状态条反馈“已按当前条件刷新接待配置” | `tests/reception-config.spec.ts` 第 2 条 |
| 顶部操作 | `重置` | 目标站未暴露业务配置页 | `POST /scrm/wechatService/receptionConfig/dashboard` | 已实现 | 恢复空筛选，状态条反馈“筛选条件已重置” | `tests/reception-config.spec.ts` 第 3 条 |
| 顶部操作 | `刷新` | 目标站正文仍为订阅页 | `POST /scrm/wechatService/receptionConfig/dashboard` | 已实现 | 重新拉取当前条件数据，反馈“接待配置数据已刷新” | `tests/reception-config.spec.ts` 第 2 条 |
| 顶部操作 | `保存配置` | 目标站未取证到保存按钮 | `POST /scrm/wechatService/receptionConfig/save` | 已实现 | 写入 save diagnostics，反馈“接待配置已保存” | `tests/reception-config.spec.ts` 第 2 条 |
| 顶部操作 | `导出配置` | 目标站未取证到导出按钮 | `POST /scrm/wechatService/receptionConfig/export` | 已实现 | 写入 export diagnostics，反馈“接待配置导出任务已创建” | `tests/reception-config.spec.ts` 第 2 条 |
| 指标卡片 | `接待员工 / 欢迎语模板 / 已启用规则 / 覆盖门店` | 目标站未暴露业务卡片 | 无新增请求 | 已实现 | 点击卡片打开详情弹窗，说明指标业务含义 | 人工点检；`interaction-clone-20260519-final-interaction-*` |
| 规则列表 | `新客入住欢迎规则` 等规则卡片 | 目标站未暴露业务列表 | 无新增请求，消费 dashboard 数据 | 已实现 | 点击卡片打开规则详情弹窗，展示触发条件、备注、欢迎语 | 人工点检；`default-clone-20260519-final-success-*` |
| 员工列表 | 接待员工卡片 | 目标站未暴露业务列表 | 无新增请求，消费 dashboard 数据 | 已实现 | 展示员工、分组、班次覆盖、模板说明；空态显示业务提示 | `tests/reception-config.spec.ts` 第 1、4 条 |
| 快捷入口 | `微信客服` | 返回会话运营台 | 路由 `/scrm/wechatService/manage` | 已实现 | 使用项目既有页面承接 | `tests/reception-config.spec.ts` 第 3 条 |
| 快捷入口 | `企微员工列表` | 跳转员工管理 | 路由 `/customer/staffList` | 已实现 | 使用项目既有页面承接 | `tests/reception-config.spec.ts` 第 3 条 |
| 快捷入口 | `客户标签` | 跳转客户标签页 | 路由 `/customer/tag` | 已实现 | 使用项目既有页面承接 | `tests/reception-config.spec.ts` 第 3 条 |
| 异常状态 | `error` 页面 | 目标站未暴露 | dashboard 返回失败响应包 | 已实现 | 明确 `role=alert` 错误提示与 `重试` 按钮 | `tests/reception-config.spec.ts` 第 4 条；`error-clone-20260519-final-error-*` |
| 空态 | `empty` 页面 | 目标站未暴露 | dashboard 返回空数组 | 已实现 | 规则列表和员工列表分别给出空态业务文案 | `tests/reception-config.spec.ts` 第 4 条；`empty-clone-20260519-final-empty-*` |
