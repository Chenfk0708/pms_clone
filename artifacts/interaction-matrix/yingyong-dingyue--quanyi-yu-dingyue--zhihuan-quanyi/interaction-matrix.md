| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 订阅中心侧栏 | `置换权益` 菜单 | 高亮当前页并保持订阅中心左栏语境 | 无新增请求 | 已有静态高亮 | 保留订阅中心侧栏，绑定 `/version/displacementBenefit` | Playwright 断言侧栏文案和激活态 |
| 置换概况 | `待置换金额` / `已置换金额` 卡片 | 展示置换资金概况 | `POST /edition/replace/order/get` | 原本写死为 `-` | 接入 `subscriptionDisplacementBenefit` 服务层 summary | Playwright 断言金额 `¥12,860.00` / `¥8,420.00` |
| 置换概况 | `刷新` | 重新拉取当前条件数据 | 同 `POST /edition/replace/order/get` | 无 | 补 loading、状态反馈和时间戳 | Playwright 点击后断言 `刷新完成` toast |
| 置换概况 | `导出` | 创建导出任务反馈 | 未来复用列表请求契约；当前 mock 导出闭环 | 无 | 服务层补 `export` 动作和结果反馈 | Playwright 点击后断言 `导出任务已创建` |
| 置换概况 | `申请尾房置换` | 打开二维码弹层 | 无新增请求 | 静态弹窗已存在 | 保留目标站主交互，补可关闭反馈 | Playwright 断言弹层、二维码、关闭 |
| 日期筛选 | 开始日期 / 结束日期 | 输入日期后可重新筛选置换订单 | `POST /edition/replace/order/get` 请求体 `receiverStartTime` / `receiverEndTime` | 原本只读占位 | 接入可编辑日期并驱动请求体 | Playwright 断言请求体时间戳变化 |
| 日期筛选 | `查询` | 以当前筛选条件刷新数据 | 同 `POST /edition/replace/order/get` | 无 | 触发服务重新加载并提示 `筛选已更新` | Playwright 点击后断言 toast 和表格更新 |
| 日期筛选 | `重置` | 清空日期并恢复默认条件 | 同 `POST /edition/replace/order/get` | 无 | 恢复默认 filters 并提示 `筛选已重置` | Playwright 断言输入框清空 |
| 置换明细表格 | 列表行 | 真实页默认空态，但契约请求存在 | `POST /edition/replace/order/get` | 原本空表且无数据层 | 用显式 mock provider 输出业务可用列表 | Playwright 断言行文案与分页 |
| 置换明细表格 | `查看` | 当前项目内承接详情查看 | 无新增请求 | 无 | 以抽屉承接订单详情、金额和备注 | Playwright 打开/关闭 `置换明细详情` |
| 页面状态 | 加载 / 空态 / 错误 | 真实页可观测到空态，错误需前端明确暴露 | 同列表请求 | 原本只有静态空态 | 补 loading、空态、错误、重试闭环 | Playwright 覆盖 `mockState=empty/error` |
| 订阅侧辅助请求 | 支付分类摘要 | 目标站首屏伴随 `POST /paymentTypes/get/v2` | `POST /paymentTypes/get/v2` | 本地无承接 | 服务层并行建模请求体并将摘要暴露给页面与 diagnostics | Playwright 通过隐藏 contract 节点断言端点和请求体 |
