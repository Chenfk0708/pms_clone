# 综合月报交互矩阵

任务 ID：`baobiao--tongji-baobiao--zonghe-yuebao`

前端路由：
- 列表页：`/statistics/Comprehensive`
- 详情页：`/statistics/Comprehensive/Monthly?startDate=...&endDate=...`

目标站取证：
- 默认列表截图：`artifacts/screenshots/baobiao--tongji-baobiao--zonghe-yuebao/default-target-20260519083527-viewport.png`
- 详情入口截图：`artifacts/screenshots/baobiao--tongji-baobiao--zonghe-yuebao/view-report-target-20260519083527-viewport.png`
- 默认列表网络：`artifacts/network/baobiao--tongji-baobiao--zonghe-yuebao/default-target-20260519083527-responses.json`

本地数据服务：`src/services/comprehensiveMonthlyReport.ts`

默认 provider：`mock`

切换方式：
- `localStorage.setItem('pms.comprehensiveMonthlyReportProvider', 'api')`
- `?mockState=success|empty|error`

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口与导航 | 顶部“报表”、侧栏“综合月报” | 进入页面后保持菜单高亮 | 无新增请求 | 已有路由与菜单承接 | 保持 AppShell 菜单分组与当前页高亮 | Playwright 断言顶部与侧栏链接存在 `is-active` |
| 列表主体 | 月报列表表格 | 目标站展示月报列表，无筛选器 | `POST /report/monthly/page/get` | 旧页为组件内静态常量 | 改为统一服务层加载，组件只消费业务模型 | Playwright 断言 diagnostics、请求体、首行金额与 4 条记录 |
| 列表主体 | “查看报表” | 打开对应月份详情 | 未取证到第二个真实接口，沿用列表契约和路由参数派生详情 | 旧页只跳转静态详情 | 保留跳转，详情页复用同一列表契约并按 `startDate/endDate` 选中月份 | Playwright 点击首行进入 `/statistics/Comprehensive/Monthly?...` |
| 分页区 | 每页条数按钮 | 目标站显示 `20 条/页` | 仍走同一列表服务，请求体中的 `pageSize` 变化 | 旧页无反馈 | 在 `20/50` 间切换，显示 toast 并重新加载 | Playwright 断言 `data-request-body` 从 `20` 变 `50`，并出现状态提示 |
| 详情页头部 | “更新报告” | 目标站可见按钮，但未稳定取证到额外网络行为 | 当前不新增第二个真实接口 | 旧页按钮无反馈 | 增加 loading、禁用态与“报告已更新”反馈 | Playwright 点击后断言 `role=status` |
| 详情页头部 | “打印” | 目标站可见按钮，但未稳定取证到额外网络行为 | 当前不新增第二个真实接口 | 旧页按钮无反馈 | 增加“打印任务已创建”反馈 | Playwright 点击后断言 `role=status` |
| 详情页主体 | 固化报告摘要表与明细表 | 目标站显示摘要表与明细表 | 由同一列表契约派生详情视图 | 旧页为空表 | 以月报行数据派生摘要指标和 1 行明细，保留稳定结构 | Playwright 断言详情页出现 `21,843.69`、`29.17%`、摘要表和明细表头 |
| 空态 | `mockState=empty` | 目标站未取证到明确空态，但保留表格结构 | mock envelope：`code=0,data.list=[]` | 旧页无空态闭环 | 显示“暂无月报数据”，保留表头与分页结构 | Playwright 断言空态文案与 `0` 条分页摘要 |
| 错误态 | `mockState=error` | 目标站未取证到明确错误态 | mock envelope：`code=50301,data=null` | 旧页无错误暴露 | 显示告警、错误信息和“重试”入口，不做静默 fallback | Playwright 断言 `role=alert` 与重试按钮 |
| 诊断取证 | 隐藏 diagnostics 节点 | 真实请求体来自 target Network | `data-provider/data-endpoint/data-request-body/data-trace-id/data-response-state` | 旧页无诊断节点 | 增加隐藏 diagnostics，仅供自动化与取证使用 | Playwright 与本地 fixed Chrome 读取 DOM 属性 |

## 验证记录

- 目标站核心接口：`POST https://hudson-prod.localhome.cn/report/monthly/page/get`
- 目标站取证请求体：`{"campId":"1796067693589061634","startDate":"2026-01-01","endDate":"2026-04-30"}`
- 本地默认态取证：`default-clone-20260519092637-*`
- 本地详情态取证：`view-report-clone-20260519092914-*`
- 本地空态取证：`empty-clone-20260519092015-*`
- 本地错态取证：`error-clone-20260519093451-*`
- 专项自动化：`tests/comprehensive-monthly-report.spec.ts`
