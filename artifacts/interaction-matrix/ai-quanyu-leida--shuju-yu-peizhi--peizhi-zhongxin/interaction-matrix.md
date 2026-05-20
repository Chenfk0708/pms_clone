# 配置中心交互矩阵

- 任务 ID：`ai-quanyu-leida--shuju-yu-peizhi--peizhi-zhongxin`
- 页面路由：`/channels/globalRadar/globalSetting`
- 更新时间：`2026-05-19 18:25:56 +08:00`

## 证据

- 目标站默认态：
  - `artifacts/screenshots/ai-quanyu-leida--shuju-yu-peizhi--peizhi-zhongxin/default-target-20260519-final-viewport.png`
  - `artifacts/screenshots/ai-quanyu-leida--shuju-yu-peizhi--peizhi-zhongxin/default-target-20260519-final-full.png`
  - `artifacts/dom-snapshots/ai-quanyu-leida--shuju-yu-peizhi--peizhi-zhongxin/default-target-20260519-final-page.html`
  - `artifacts/style-dumps/ai-quanyu-leida--shuju-yu-peizhi--peizhi-zhongxin/default-target-20260519-final-facts.json`
  - `artifacts/network/ai-quanyu-leida--shuju-yu-peizhi--peizhi-zhongxin/default-target-20260519-final-responses.json`
- 目标站交互态：
  - `artifacts/screenshots/ai-quanyu-leida--shuju-yu-peizhi--peizhi-zhongxin/interaction-target-20260519-final-viewport.png`
  - `artifacts/screenshots/ai-quanyu-leida--shuju-yu-peizhi--peizhi-zhongxin/interaction-target-20260519-final-full.png`
  - `artifacts/dom-snapshots/ai-quanyu-leida--shuju-yu-peizhi--peizhi-zhongxin/interaction-target-20260519-final-page.html`
  - `artifacts/style-dumps/ai-quanyu-leida--shuju-yu-peizhi--peizhi-zhongxin/interaction-target-20260519-final-facts.json`
  - `artifacts/network/ai-quanyu-leida--shuju-yu-peizhi--peizhi-zhongxin/interaction-target-20260519-final-responses.json`
- 本地 clone 默认态：
  - `artifacts/screenshots/ai-quanyu-leida--shuju-yu-peizhi--peizhi-zhongxin/default-clone-20260519-final-viewport.png`
  - `artifacts/screenshots/ai-quanyu-leida--shuju-yu-peizhi--peizhi-zhongxin/default-clone-20260519-final-full.png`
  - `artifacts/dom-snapshots/ai-quanyu-leida--shuju-yu-peizhi--peizhi-zhongxin/default-clone-20260519-final-page.html`
  - `artifacts/style-dumps/ai-quanyu-leida--shuju-yu-peizhi--peizhi-zhongxin/default-clone-20260519-final-facts.json`
  - `artifacts/network/ai-quanyu-leida--shuju-yu-peizhi--peizhi-zhongxin/default-clone-20260519-final-responses.json`
- 本地 clone 交互态：
  - `artifacts/screenshots/ai-quanyu-leida--shuju-yu-peizhi--peizhi-zhongxin/interaction-clone-20260519-final-viewport.png`
  - `artifacts/screenshots/ai-quanyu-leida--shuju-yu-peizhi--peizhi-zhongxin/interaction-clone-20260519-final-full.png`
  - `artifacts/dom-snapshots/ai-quanyu-leida--shuju-yu-peizhi--peizhi-zhongxin/interaction-clone-20260519-final-page.html`
  - `artifacts/style-dumps/ai-quanyu-leida--shuju-yu-peizhi--peizhi-zhongxin/interaction-clone-20260519-final-facts.json`
  - `artifacts/network/ai-quanyu-leida--shuju-yu-peizhi--peizhi-zhongxin/interaction-clone-20260519-final-responses.json`
- 自动化验证：
  - `npx vite build`
  - `$env:PMS_TEST_BASE_URL='http://127.0.0.1:43421'; npx playwright test tests/global-setting.spec.ts --config tmp/global-setting.playwright.config.ts --reporter=line --timeout=60000 --workers=1`

## 取证结论

- 目标站当前仍然是 `AI全域雷达 > 配置中心` 的订阅态入口，fresh target 证据持续出现 `立即开通`，没有抓到配置中心业务正文，也没有抓到可直接沉淀为正式接口契约的专属返回包。
- 本地 clone 已切换为完整业务页，显式使用 `mock` provider + 统一服务层契约承接概览、筛选、监控门店、授权配置、日志跳转、移除、待办和快捷入口，不再是“立即开通”占位页。
- `interaction-clone-20260519-final-facts.json` 中交互批次为 9 个动作且全部成功；`interaction-target-20260519-final-facts.json` 中交互批次为 0，因为目标站订阅态没有本地业务页那组控件。
- 配置中心专项 Playwright fresh 结果已提升为 `5 passed`，覆盖页面契约、筛选与配置流程、日志与移除分支、loading/disabled、empty/error。

## 交互矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 导航 | 顶部 `AI全域雷达`、侧栏 `配置中心` | 可进入 `/channels/globalRadar/globalSetting`，但正文仍是订阅态 | 无专属业务请求，依赖现有路由和菜单上下文 | 已接入并高亮，正文替换为业务页 | 保留既有导航结构，只替换主内容区 | Playwright 断言路由、菜单高亮、标题与正文同屏出现 |
| 工具栏 | `刷新` | 目标站订阅态无此按钮 | `POST /radarConfig/shop/get` | 已实现 | 重新拉取统一服务层数据并更新状态文案 | Playwright 断言状态栏出现“配置中心数据已刷新” |
| 工具栏 | `导出` | 目标站订阅态无此按钮 | `POST /radarConfig/shop/export` | 已实现 | 创建导出任务并显式反馈 | Playwright 断言状态栏出现“导出任务已创建” |
| 工具栏 | `下载数据连接器` | 目标站订阅态无此按钮 | `POST /radarConfig/connector/download` | 已实现 | 增加说明弹窗、取消路径和启动反馈 | 交互取证覆盖打开/取消；专项测试覆盖成功反馈 |
| 工具栏 | `选择监控门店` | 目标站订阅态无此按钮 | `POST /radarConfig/shop/save` | 已实现 | 候选门店支持勾选、上限校验、确认保存 | Playwright 断言勾选第 3 家后摘要更新为 `3 / 3` |
| 筛选区 | 门店范围/授权状态/连接器状态/关键词 | 目标站订阅态无筛选区 | `POST /radarConfig/shop/get` | 已实现 | 统一由服务层消费筛选条件并输出契约快照 | Playwright 断言 hidden contract 中 `keyword`、`authorizationStatus` 与 UI 一致 |
| 筛选区 | `查询` | 目标站订阅态无此按钮 | `POST /radarConfig/shop/get` | 已实现 | 成功后刷新摘要卡、表格、待办和更新时间 | Playwright 断言状态栏出现“已按当前条件更新配置中心” |
| 筛选区 | `重置` | 目标站订阅态无此按钮 | `POST /radarConfig/shop/get` | 已实现 | 重置 `filters` 与 `query` 到新对象，避免共享默认引用导致卡在 loading | Playwright 覆盖重置后恢复默认值且页面不挂起 |
| 摘要卡 | 已启用门店/已授权门店/异常门店/待处理项 | 目标站订阅态无摘要卡 | `POST /radarConfig/shop/get` | 已实现 | 由服务层统一计算指标，监控门店数和选择结果联动 | Playwright 断言摘要数量与选择后计数变化 |
| 门店表格 | 行内 `配置` | 目标站订阅态无表格 | `POST /radarConfig/shop/config/get` | 已实现 | 打开 Ebooking 授权配置弹窗并读取门店详情 | Playwright 断言弹窗标题、门店名、输入框可填写 |
| 门店表格 | 配置弹窗 `保存配置` | 目标站订阅态无此交互 | `POST /radarConfig/shop/config/save` | 已实现 | 校验必填项，保存后更新表格状态 | Playwright 断言状态栏出现“Ebooking授权配置已保存” |
| 门店表格 | 行内 `查看日志` | 目标站订阅态无此交互 | 当前复用现有路由，未来可扩展日志接口 | 已实现 | 当前跳转 `/channels/globalRadar/globalData`，不造假独立接口 | Playwright 已断言点击后进入日志承接页 |
| 门店表格 | 行内 `移除` | 目标站订阅态无此交互 | `POST /radarConfig/shop/delete` | 已实现 | 增加确认弹窗；确认后移除并更新列表 | Playwright 已覆盖取消和确认移除两条路径 |
| 待办提醒 | 待办按钮 | 目标站订阅态无此模块 | 复用配置接口或现有路由 | 已实现 | 按 `action` 分流到弹窗、反馈或已有路由 | Playwright 覆盖确认待办、打开配置和跳转门店信息 |
| 快捷入口 | `全域数据` `门店信息` `房态` `报表` | 目标站订阅态无此模块 | 复用现有路由 | 已实现 | 不新增不存在路由 | Playwright 已断言四个入口的承接路由 |
| 状态闭环 | `success` / `loading` / `empty` / `error` | 目标站订阅态无可比业务态 | `mockState=success|empty|error`，`localStorage['pms.globalSettingMockLatencyMs']` 控制 loading | 已实现 | 服务层集中模拟四态，不在组件内散落 fallback | Playwright 断言 loading 文案、关键按钮禁用、空态、错误态和重试恢复 |

## 本轮修正记录

1. 恢复了仍被 `App.tsx` 引用但磁盘缺失的页面文件，保证整应用可重新 `vite build`。
2. 修正“选择监控门店”弹窗的初始勾选来源，改为基于 `viewModel.candidates` 中 `currentStatus === 'monitored'` 的门店，而不是被筛选后的 `viewModel.stores`。
3. 修正 `resetFilters()` 同时为 `filters` 和 `query` 设置新的默认对象，避免共享引用导致重置后页面持续 loading。
4. 在 `src/services/globalSetting.ts` 新增 `resolveMockLatencyMs()`，支持通过 `localStorage['pms.globalSettingMockLatencyMs']` 制造可验证的 loading 延迟。
5. 重新构建并 fresh 执行配置中心专项测试，结果为 `5 passed`。
6. 移除了正文中可见的 `global-setting-contract` 开发态契约卡片，仅保留隐藏诊断节点供测试与取证使用，并重新刷新了 `20260519-final` 本地 clone 证据。

## 剩余风险

1. fresh target 仍是订阅态，未抓到配置中心专属正式接口；当前接口文档必须继续按“联调草案”管理。
2. target 与本地 clone 的正文形态仍不一致；目标站更适合作为入口与订阅事实证据，而不是业务正文逐项对照基线。
