# 收支汇总交互矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口与导航 | 侧栏 `报表 > 收支明细表 > 收支汇总` | 进入 `/statistics/totalLedger`，顶部 `报表` 高亮，左侧 `收支汇总` 高亮 | 无独立业务请求；依赖项目现有路由和导航状态 | 已接入 `/statistics/totalLedger` 路由，Playwright 已断言顶部和侧栏高亮 | 保持复用现有 AppShell、标题映射和路由，不新增平行入口 | `tests/total-ledger.spec.ts` 首屏用例断言 URL、标题和高亮状态 |
| 首屏加载 | 页面初始化 | 默认展示门店、日期、快捷范围、`重置`、`导出`、`账本概括`、收入/支出占比和收支汇总表；fixed Chrome 取证到默认净收入 `¥1002.54` | 真实核心接口为 `POST https://hudson-prod.localhome.cn/accountBookPaymentWay/page/get`，默认请求体 `{ campId: "1796067693589061634", beginTime: "2026-05-18", endTime: "2026-05-18", poiIds: [], pageNum: 1, pageSize: 20 }` | 本地已改为 `src/services/totalLedger.ts` 统一 provider，页面只消费业务模型 | 用服务层集中处理 provider、请求体、响应包和 Hudson adapter，组件内不散落常量和兼容逻辑 | Playwright 首屏用例断言隐藏契约节点、默认请求体、`¥1002.54`、表头 `日期/平台代收` |
| 服务层 | `loadTotalLedgerData` | 目标站请求成功后返回 `success/errorCode/errorMsg/data` 包装，页面展示净收入、总收入、总支出、按支付方式汇总和分页 | `POST /accountBookPaymentWay/page/get` | 已支持 `mock` 默认、`api` 显式切换、`success/empty/error` 三态，默认 mock 延迟 `900ms` 便于观察 loading | 保持页面只消费统一后的 `TotalLedgerData`，不在组件内做真假数据分支 | 定向类型检查、Vite build 和专项 Playwright 已通过 |
| 门店筛选 | `全部门店` / `天落会宿公寓(前海壹方城宝安中心店)` | 目标站默认显示 `全部门店` 与当前门店；本轮默认态取证未继续展开门店切换 | 未来仍复用 `POST /accountBookPaymentWay/page/get`，通过 `poiIds` 区分门店范围 | 本地已实现单选门店组，切换后会重发查询并给出操作反馈 | 当前先按已取证门店列表固化两项门店选项；真实门店下拉接口后续再补接 | 可手工切换并检查 `data-request-body` 中 `poiIds` 变化；正文不出现开发态文案 |
| 日期筛选 | `开始日期` / `结束日期` | 目标站默认是 `2026-05-18` 至 `2026-05-18`，点击日期区域可打开日期选择层 | 未来仍复用 `POST /accountBookPaymentWay/page/get`，通过 `beginTime`、`endTime` 控制范围 | 本地使用只读日期输入框 + 简化弹层承接 | 用轻量弹层承接日期选择，避免为了本页引入额外复杂日历依赖 | fixed Chrome `date-picker` 取证 + 本地 date-picker 取证已生成；可手工检查弹层开关 |
| 快捷范围 | `昨天` / `今天` / `上周` / `本周` / `上月` / `本月` | 目标站默认展示 6 个快捷日期按钮，默认激活 `昨天` | 未来仍复用 `POST /accountBookPaymentWay/page/get`；本地 preset 已映射到 `beginTime/endTime` | 本地点击后进入 loading，结束后更新日期、表格和提示文案 | 保持快捷范围配置集中在服务层，避免页面和测试重复硬编码 | Playwright 用例 2/3 已覆盖 `今天` 切换、loading 和日期回写 |
| 顶部操作 | `重置` | 目标站存在 `重置` 按钮，语义上恢复默认筛选条件 | 未来仍复用 `POST /accountBookPaymentWay/page/get` 默认请求体 | 本地已重置门店、日期范围和页码，并给出操作反馈 | 统一重置到 `getDefaultTotalLedgerQuery()`，避免页面散落默认值 | Playwright 用例 2/3 已覆盖重置后回到 `2026-05-18` 和 `昨天` 激活态 |
| 顶部操作 | `导出` | 目标站存在 `导出` 按钮；本轮 fixed Chrome 默认态未继续下钻导出链路 | 当前本地 mock/api 都收口到 `exportTotalLedger()`；`api` 仍复用 `POST /accountBookPaymentWay/page/get` 并追加 `exportExcelMenuId/pageSize=999999` | 本地导出后会给出 `已生成收支汇总导出任务` 反馈 | 用显式反馈承接导出任务创建，不伪装成已下载文件 | Playwright 用例 2/3 已覆盖导出反馈 |
| 账本概括 | `净收入` / `总收入` / `总支出` | 目标站默认值为 `净收入 ¥1002.54`、`总收入 ¥1002.54`、`总支出 ¥0` | 来自 `POST /accountBookPaymentWay/page/get` 响应 `extraInfo.totalInfo` | 本地默认 mock 首屏与取证值对齐 | 继续以服务层适配真实 `totalInfo`，组件只负责格式化 | Playwright 首屏用例已断言 3 个核心金额 |
| 占比卡片 | `收入占比` / `支出占比` | 目标站默认收入占比仅有 `平台代收`，支出占比为空 | 来自响应 `extraInfo.income[]`、`extraInfo.expend[]` | 本地用环形图和 legend 展示占比；支出为空时显示 `暂无数据` | 保持收入/支出两个区域统一渲染逻辑，空态不塌结构 | Playwright 首屏用例已断言 `平台代收`、`100.00%` 和支出空态 |
| 汇总表格 | `收支汇总表` | 目标站默认表头为 `日期 / 平台代收`，默认 2 行：`合计`、`2026-05-18`，值均为 `1002.54` | 来自响应 `list[].date`、`list[].paymentWayPriceDetailViews[]` | 本地已根据 paymentWays 动态生成列，根据 rows 渲染数据行 | 用 paymentWay 动态表头承接真实支付方式扩展，不把列写死在页面 | Playwright 首屏用例已断言表头、行文案和金额 |
| 分页 | `第 1-2 条/总共 2 条` / 当前页 `1` | 目标站默认显示单页分页态 | 来自响应 `total/current/size/pageNum/pages/hasNextPage` | 本地已渲染简化分页摘要和当前页按钮 | 当前只承接单页展示，不新增未取证到的翻页逻辑 | Playwright 首屏用例已断言分页摘要 |
| 空态 | `?mockState=empty` | 目标站当前账号默认态不是空表，但本页需覆盖空态闭环 | mock 统一响应包 `code=0`，`list=[]`，`extraInfo.totalInfo` 为 0 | 本地显示 `当前条件暂无收支汇总数据` 和 `第 0-0 条/总共 0 条` | 空态下保留页面壳、筛选区和分页摘要，不静默 fallback | Playwright 用例 3/3 已覆盖 empty 状态 |
| 错误态 | `?mockState=error` / `重新加载` | 目标站本轮未稳定暴露错误页；新版 prompt 要求必须有失败闭环 | mock 统一失败响应包 `{ code, message, data: null, traceId, timestamp }`，组件显式展示错误 | 本地显示 `收支汇总服务暂不可用，请稍后重试` 与 `重新加载` 按钮 | 明确暴露错误，不做假成功 fallback，也不吞掉失败 | Playwright 用例 3/3 已覆盖 error 和重试入口可见 |
| 诊断与契约 | 隐藏服务契约节点 | 目标站无此节点，仅用于本地自动化验收和取证留痕 | 暴露 `data-provider`、`data-endpoint`、`data-export-endpoint`、`data-mock-state`、`data-request-body` | 本地已接入 `data-testid="total-ledger-service-contract"` | 保持隐藏而不写入正文，避免污染页面体验 | Playwright 首屏和空/错用例均已断言契约节点属性 |

## 目标站取证结论

- fixed Chrome + `playwright/.auth/pms-user.json` 已在 `artifacts/screenshots|dom-snapshots|style-dumps|network/baobiao--shouzhi-mingxibiao--shouzhi-huizong/` 产出默认态、查询态和日期弹层证据。
- 当前账号下目标站默认查询日期为 `2026-05-18` 至 `2026-05-18`，核心值为 `净收入 ¥1002.54`、`总收入 ¥1002.54`、`总支出 ¥0`。
- 已确认真实核心接口为 `POST https://hudson-prod.localhome.cn/accountBookPaymentWay/page/get`，默认请求体包含 `campId/beginTime/endTime/poiIds/pageNum/pageSize`。
- 目标站默认表格列为 `日期 / 平台代收`，数据行只有 `合计` 与 `2026-05-18` 两条，分页摘要为 `第 1-2 条/总共 2 条`。
- 本地补齐了显式 provider、空态、错误态、重试、导出反馈和隐藏契约节点，用于满足 prompt111 的页面级闭环要求。
