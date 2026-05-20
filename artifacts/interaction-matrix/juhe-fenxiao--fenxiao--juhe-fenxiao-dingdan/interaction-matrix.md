# 聚合分销订单交互矩阵

任务 ID：`juhe-fenxiao--fenxiao--juhe-fenxiao-dingdan`

目标路径：`/channels/distribution/distributionOrderSettlement`

目标站取证批次：`default/expanded/dropdown/interaction-target-20260518-95-target-*`

本地数据服务：`src/services/distributionOrder.ts`，默认 `mock` provider，可通过 `pms.distributionOrderProvider=api` 或 `VITE_DISTRIBUTION_ORDER_PROVIDER=api` 集中切换。

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口与导航 | 顶部“聚合分销”、侧栏“聚合分销订单” | 进入 `distributionOrderSettlement` 后菜单保持高亮 | 无新增请求 | 已有路由和菜单 | 保持项目 AppShell、路由和菜单高亮 | Playwright 断言顶部导航、侧栏链接和页面标题 |
| 门店筛选 | “全部门店” | 切换/刷新当前门店范围数据 | `POST /report/flows/get`，请求体带 `campId`、日期和分页 | 旧版无真实反馈 | 点击后重新触发数据加载并显示业务提示 | 点击后断言 `role=status` 出现门店数据更新反馈 |
| 门店筛选 | 当前门店按钮 | 展示当前门店并刷新当前门店数据 | 同上 | 旧版门店名硬编码 | 门店名由服务层数据返回，点击触发刷新反馈 | 断言门店名来自 `DistributionOrderData.campName`，点击有反馈 |
| 门店筛选 | 设置按钮 | 目标站为门店筛选/设置入口 | 后续可能调用门店列表接口，当前页不新增写接口 | 旧版点击无业务闭环 | 点击显示“门店筛选设置已同步”业务反馈 | Playwright 点击按钮并断言状态反馈 |
| 筛选区 | 展开/收起 | 展开高级筛选，显示预订时间、订单搜索、结算筛选 | 无请求，影响后续查询参数 | 旧版可展开但参数未入数据层 | 展开状态稳定；收起关闭下拉 | 断言高级筛选出现/隐藏 |
| 筛选区 | 预订时间 | 目标站首屏请求带 `bookingStartDate=2026-05-01`、`bookingEndDate=2026-05-31` | `POST /report/flows/get` | 旧版仅静态展示 | 日期进入 `DistributionOrderQuery` 和契约摘要 | 断言服务契约节点含日期参数 |
| 筛选区 | 订单搜索输入 | 按订单号、预订人、手机号筛选 | `keyword` 映射到 mock 过滤；api provider 映射到请求体 | 旧版只填值不驱动数据 | 查询时提交 keyword，mock provider 消费参数 | 填 `205` 后点击查询，断言查询反馈和列表保持匹配 |
| 筛选区 | 订单筛选下拉 | 选择结算状态 | `settlementState=pending/settled` | 旧版下拉为静态行为 | 下拉选择写入查询状态并关闭浮层 | Playwright 断言 listbox、option、按钮选中态 |
| 筛选区 | 查询 | 按当前筛选刷新列表 | `loadDistributionOrderData(query)` | 旧版无数据服务 | 触发查询提示，query 驱动服务层 | 断言状态反馈“已查询聚合分销订单” |
| 筛选区 | 重置 | 恢复默认筛选 | 恢复默认日期、清空 keyword 和 settlementState | 旧版只做局部 UI | 重置筛选状态并给出反馈 | 断言输入为空、筛选回到“请选择”、日期恢复 |
| 筛选区 | 导出明细 | 目标站导出当前条件明细 | 后续建议 `POST /report/flows/export`，当前 mock 阶段创建导出任务反馈 | 旧版点击无闭环 | 有数据时可点击，空/loading 时禁用 | 点击断言导出任务反馈；空态断言按钮禁用 |
| 数据服务 | 隐藏契约节点 | 目标站网络请求沉淀为前端契约 | `path=/report/flows/get`、provider、traceId、日期、分页 | 旧版无统一契约节点 | 页面 DOM 保留视觉隐藏契约，正文不显示开发态文案 | Playwright 通过 `[aria-label="聚合分销订单数据服务"]` 读取 |
| 表格 | 汇总行 | 目标站表格展示合计 | 由服务层 summary 聚合 | 旧版组件内硬编码 | mock/api 统一适配后计算展示 | 断言合计、435.00、65.25、369.75 |
| 表格 | 订单行 | 展示订单号、客户、房型、预订时间、金额、状态 | `data.list[]` 字段：`orderId/customerInfo/roomCategoryName/bookedTime/invoicePrice/incomePrice/commission/settledPrice/settledState` | 旧版硬编码在组件内 | 订单数据迁移到 `src/services/distributionOrder.ts` mock provider | 断言列表展示订单号 `2054409001821356034` 和客户信息 |
| 表格 | 订单号详情入口 | 目标站可查看订单详情或跳转订单承接 | 当前 mock 阶段用详情弹窗承接 | 旧版无详情闭环 | 点击订单号打开“聚合分销订单详情”弹窗 | Playwright 点击订单号，断言 dialog 内容和关闭按钮 |
| 分页 | 上一页/下一页 | 按分页请求列表 | `page/pageSize` | 当前取证仅 1 页 | 当前无上一页/下一页，按钮禁用并保持布局 | 断言禁用态不触发错误 |
| 分页 | 每页 20 条 | 目标站展示分页尺寸 | `pageSize=20` | 旧版静态 | 点击给出“每页条数已保持为 20 条”反馈 | Playwright 点击后断言状态提示 |
| 状态 | Loading | 请求中显示加载状态并禁用重复提交 | 服务层 80ms mock latency，api 使用 fetch signal | 旧版缺少稳定 loading | 表格显示“正在刷新聚合分销订单”，按钮禁用 | Playwright/人工取证覆盖首屏加载 |
| 状态 | Empty | 无数据时保留表格结构 | mock envelope `code=0,data.list=[]` | 旧版无统一空态 | 显示“当前条件暂无聚合分销订单”，分页 `0-0/0` | `pms.distributionOrderMockMode=empty` 后断言空态 |
| 状态 | Error | 接口失败清晰暴露 | mock envelope `code=50318,data=null` 抛出错误 | 旧版无错误闭环 | 显示 alert 和“重新加载”按钮 | `pms.distributionOrderMockMode=error` 后断言 alert 与重试入口 |
| 数据切换 | mock/api provider | 默认 mock，后端联调集中切 api | mock 统一响应包；api 适配 Hudson `{ success,data,errorMsg }` | 旧版无 provider | `loadDistributionOrderData` 内集中切换，不在组件散落环境判断 | TypeScript 检查与专项 Playwright 覆盖 |

## 验收记录

- 目标站最新关键接口：`POST https://hudson-prod.localhome.cn/report/flows/get`。
- 目标站请求体取证：`campId/pageNum/pageSize/current/bookingStartDate/bookingEndDate/breakTemp`，默认日期为 `2026-05-01` 至 `2026-05-31`。
- 目标站响应摘要：`success/errorCode/errorMsg/errorDetail/data.total/data.size/data.current/data.pageNum/data.hasNextPage/data.pages/data.list[]`。
- 本地源码验证：`npx tsc --noEmit --ignoreConfig --jsx react-jsx --moduleResolution bundler --module esnext --target es2022 --lib dom,dom.iterable,es2022 --types vite/client,node src/services/distributionOrder.ts src/pages/DistributionOrderPage.tsx` 退出码 0。
- 本轮 Playwright 浏览器验证受同仓库大量并发 Playwright/Chrome 残留进程影响，`distribution-order.spec.ts:79` 在浏览器握手阶段超时；已清理本轮明确启动的卡住进程，未清理其它任务进程。
