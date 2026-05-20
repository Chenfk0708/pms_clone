# 记一笔明细交互矩阵

任务 ID：`baobiao--shouzhi-mingxibiao--jiyibi-mingxi`

目标路由：`/statistics/ledger`

目标站取证批次：`default-target-20260519-ledger95-*`、`dropdown-target-20260519-ledger95-*`、`date-target-20260519-ledger95-*`

本地 fixed Chrome 批次：`default|dropdown|date|empty|error-clone-20260519-95-local-*`

数据服务：`src/services/ledgerEntry.ts`

默认 provider：`mock`

provider 切换：
- `localStorage.setItem('pms.ledgerEntryProvider', 'api')`
- `VITE_LEDGER_ENTRY_PROVIDER=api`

状态切换：
- `?mockState=success`
- `?mockState=empty`
- `?mockState=error`

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口与导航 | 顶部“报表”、侧栏“记一笔明细” | 进入 `statistics/ledger` 后菜单高亮 | 无新增请求 | 已承接 | 保持报表导航与侧栏高亮一致 | Playwright 断言顶部导航与侧栏链接 `is-active` |
| 门店筛选 | “全部门店”“天落会宿公寓(前海壹方城宝安中心店)” | 目标站展示门店切换入口 | 未来复用 `POST /select/poi/page/get` | 已可点击并刷新查询态 | 门店名来自服务层，切换后重置到第一页 | 断言 diagnostics 中 `storeId/storeName` 变化 |
| 门店设置 | 齿轮按钮 | 目标站存在门店相关操作区 | 当前不新增请求 | 已有业务承接弹层 | 用门店设置弹层承接到 `/statistics/orderLedger`、`/statistics/totalLedger` | 点击后断言 dialog 和承接链接存在 |
| 日期快捷筛选 | 昨天/今天/上周/本周/上月/本月 | 目标站可直接切换日期范围 | 未来映射 `POST /accountBookCostPrice/pages` 的 `beginTime/endTime` | 已实现 | 快捷按钮直接刷新 query，并给出状态反馈 | 断言按钮高亮与 diagnostics 日期变化 |
| 日期范围 | 开始日期、结束日期 | 目标站可打开日期面板 | 同上 | 已实现 | 修复为“两次点击完成一段区间”，首次点击重置起点，第二次点击收尾 | Playwright 断言 `2026-05-16` 到 `2026-05-18` 写入 diagnostics |
| 类型筛选 | “类型 全部类型” 下拉 | 目标站下拉包含 `全部类型/收入/支出` | 未来映射 `isIncome` 或支付类型筛选 | 已实现 | 下拉列表与 mock/filter 保持一致 | fixed Chrome dropdown 产物 + Playwright 断言 |
| 房型筛选 | “房型 请选择房型” 下拉 | 目标站加载房型列表 | 未来复用 `POST /roomCategories/page/get`、`POST /rooms/get` | 已实现 | 房型列表来自服务层，选中后重置到第一页 | 断言 diagnostics 中 `roomCategoryId` 变化 |
| 重置 | “重置筛选” | 恢复默认筛选 | 恢复默认查询对象 | 已实现 | 重置门店、日期、类型、房型、分页和提示文案 | 断言 diagnostics 回到 `"type":"all"` |
| 导出 | “报表导出” | 目标站有导出入口 | 未来可扩展为导出任务接口 | 已实现 mock 导出任务 | 返回固定 taskId，并用状态栏反馈 | 断言状态栏出现“已生成记一笔明细导出任务” |
| 概括卡片 | 收入卡、支出卡 | 目标站展示账本概括 | 来自 `POST /accountBookCostPrice/pages` 聚合结果 | 已实现 | 卡片金额与趋势由服务层聚合，点击打开详情弹层 | 断言卡片详情弹层内容与承接链接 |
| 表格 | 明细表格 | 目标站显示账本行项目 | 核心接口 `POST /accountBookCostPrice/pages` | 已实现 | 明细由服务层 adapter 驱动，字段覆盖类型、项目、金额、支付方式、时间、房型、备注、操作人 | 断言表头与关键业务文本 |
| 行详情 | “详情”按钮 | 目标站未取证到明确独立路由 | 当前无新增请求 | 已实现本地详情弹层 | 用本地详情弹层承接，不伪造目标站未取证到的详情路由 | 断言弹层字段与关闭行为 |
| 分页 | 上一页、下一页 | 目标站核心接口带 `pageNum/pageSize` | `POST /accountBookCostPrice/pages` | 已实现 | 翻页刷新 `page` 并保留筛选条件 | 断言分页文案与 diagnostics 中 `page` |
| 空态 | 空表格 | 目标站默认账号为空账本时显示空表 | mock `empty` | 已实现 | 保留表头与分页结构，正文显示“暂无数据” | `?mockState=empty` + Playwright 断言 |
| 错误态 | 错误告警、重新加载 | 目标站异常时应显式暴露失败 | mock `error` / API 错误 | 已实现 | 服务层抛 `LedgerEntryServiceError`，页面显示 alert 和重试入口 | `?mockState=error` + Playwright 断言 |
| 路由承接 | “查看收支明细”“前往收支汇总” | 目标站存在账本相关页面簇 | 无新增请求 | 已实现 | 使用现有 `/statistics/orderLedger`、`/statistics/totalLedger` 路由承接 | Playwright 断言 URL 跳转成功 |

## 验收记录

- 目标站核心账本接口已取证为 `POST https://hudson-prod.localhome.cn/accountBookCostPrice/pages`。
- 目标站首屏请求体已取证字段：`campId/pageNum/pageSize/beginTime/endTime/paymentTypeIds/roomCategoryIds/channelIds/accountIds/roomCategoryGroupIds/orderRentType/poiIds/currency/type`。
- 本地专项验证：
  - `npx eslint src/pages/LedgerEntryPage.tsx src/services/ledgerEntry.ts tests/ledger-entry.spec.ts --no-cache`
  - `npx tsc --noEmit --ignoreConfig --jsx react-jsx --moduleResolution bundler --module esnext --target es2022 --lib dom,dom.iterable,es2022 --types vite/client,node src/pages/LedgerEntryPage.tsx src/services/ledgerEntry.ts tests/ledger-entry.spec.ts`
  - `PMS_TEST_BASE_URL=http://127.0.0.1:4346 npx playwright test tests/ledger-entry.spec.ts --config=tmp/ledger-entry.playwright.config.ts --timeout=60000 --global-timeout=300000 --workers=1 --reporter=line`
