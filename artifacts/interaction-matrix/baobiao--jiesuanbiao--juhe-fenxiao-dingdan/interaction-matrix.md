# 聚合分销订单交互矩阵

## 1. 取证批次

- 目标站基线：`20260519084740`
- 本地 clone 默认态：`20260519095806`
- 本地 clone 查询态：`20260519095805`

## 2. 交互矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 顶部导航 | `报表` | 高亮当前主导航 | 无新增请求 | 已实现 | 保持高亮状态 | Playwright 首屏断言 `.topnav-link.is-active` |
| 侧栏菜单 | `聚合分销订单` | 高亮当前子菜单 | 无新增请求 | 已实现 | 保持高亮状态 | Playwright 首屏断言 `.sidebar-link.is-active` |
| 门店范围 | `全部门店` | 目标站首屏可见，用于门店范围切换 | 未来仍走 `POST /report/flows/get`，当前本地回显 `storeScope=all` | 先前无反馈 | 接入 `storeScope` 到服务摘要并给出刷新提示 | Playwright 点击后断言 `role=status` 与 `storeScope=all` |
| 门店范围 | 当前门店按钮 | 目标站首屏可见，用于定位当前门店 | 未来仍走 `POST /report/flows/get`，当前本地回显 `storeScope=current` | 先前无反馈 | 接入 `storeScope` 到服务摘要并给出刷新提示 | Playwright 点击后断言 `role=status` 与 `storeScope=current` |
| 门店范围 | `门店设置` | 目标站首屏可见，未取证到独立弹层 | 暂无新增请求 | 先前无反馈 | 提供门店范围同步提示，不伪造未取证配置面板 | Playwright 点击后断言状态提示 |
| 顶部筛选 | `展开/收起` | 展开后显示更多筛选项 | 无新增请求 | 已实现 | 保持展开收起切换 | Playwright 点击后断言按钮文案和筛选区显示 |
| 顶部筛选 | `预订时间` | 默认 `2026-05-01` 到 `2026-05-31`，点击日期控件应有反馈 | `bookingStartDate` / `bookingEndDate` | 已实现 | 回显固定日期并提供日期范围面板，支持关闭与“本月”确认反馈 | Playwright 断言两个日期值、弹出 `预订时间范围` 对话框并点击 `本月` |
| 顶部筛选 | `订单搜索` 输入框 | 支持按订单编号/预订人/手机号查询 | `keyword` | 已实现 | 查询后写入服务诊断摘要 | Playwright 输入 `205` 后断言 `keyword=205` |
| 顶部筛选 | `订单筛选` 下拉 | 目标站可选 `全部/非置换订单/置换订单` | 当前映射到 `settlementState`，未来对接 `breakTemp` | 已实现 | 下拉选择后刷新查询摘要 | Playwright 断言下拉项和 `settlementState=置换订单` |
| 顶部筛选 | `重置` | 清空筛选恢复默认 | 重置当前查询参数 | 已实现 | 清空关键词、筛选和门店范围，提示已重置 | Playwright 可通过按钮可见与后续查询验证 |
| 顶部筛选 | `查询` | 按当前条件刷新列表 | `POST /report/flows/get` | 已实现 | 显示查询提示并重新加载服务 | Playwright 断言 `已查询聚合分销订单` |
| 顶部筛选 | `导出明细` | 目标站有导出按钮 | 未来导出接口待补，当前为业务反馈 | 已实现 | 提供确定性的导出任务提示 | Playwright 断言 `已生成聚合分销订单导出任务` |
| 服务诊断 | 隐藏节点 `聚合分销订单数据服务` | 目标站无此节点，本地用于 provider 验证 | 汇总 provider/path/traceId/query | 已实现 | 保留隐藏诊断节点 | Playwright 断言 `provider=mock`、`/report/flows/get`、日期、关键词、门店范围 |
| 表格 | 合计行 | 真实接口 `list[0]` 为合计行 | 来自 `/report/flows/get` 响应首行 | 已实现 | 在 adapter 中把首行映射为 `summary` | Playwright 断言 `676.05/105.00/595.06/0.00` |
| 表格 | 订单行 | 默认首屏至少两条订单 | 来自 `/report/flows/get` | 已实现 | 保持两条已取证订单数据 | Playwright 断言两条订单号 |
| 表格 | 空态 | 目标站未取证到专门空态文案 | `mockState=empty` | 已实现 | 统一展示 `当前条件暂无聚合分销订单` | Playwright 访问 `?mockState=empty` 断言 |
| 表格 | 错误态 + `重新加载` | 目标站失败时应能重试 | `mockState=error` | 已实现 | 展示错误提醒并提供重试按钮 | Playwright 访问 `?mockState=error` 断言 |
| 分页 | `上一页/下一页` | 当前仅一页，无翻页空间 | 暂无新增请求 | 已实现为禁用 | 保持禁用，避免伪造翻页 | Playwright 首屏可见且禁用 |
| 分页 | 当前页 `1` | 当前页标识 | 无请求 | 先前是无反馈按钮 | 改为当前页标识，不再做空点击按钮 | DOM / 视觉取证 |
| 分页 | `20 条/页` | 目标站首屏可见页尺寸控件 | 当前固定 `pageSize=20` | 先前无反馈 | 点击后提示当前页尺寸 | Playwright 点击后断言状态提示 |

## 3. 与目标站的已知差异

- 订单详情入口：
  - 目标站本轮未取证到稳定详情入口或详情接口。
  - 本地未伪造详情跳转/弹层。
- 门店设置：
  - 目标站只确认到按钮存在，未确认独立弹层或新接口。
  - 本地当前只提供业务反馈，不伪造新的配置面板。

## 4. 本轮自动化验收

```bash
PMS_TEST_BASE_URL=http://127.0.0.1:43423 npx playwright test -c tmp/statistics-distribution-order.playwright.config.ts
```

结果：

- `4 passed (44.6s)`
