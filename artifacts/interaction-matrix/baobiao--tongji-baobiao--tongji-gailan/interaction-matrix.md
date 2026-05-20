# 统计概览交互矩阵

- 任务标识：`baobiao--tongji-baobiao--tongji-gailan`
- 目标路由：`https://minsubao.localhome.cn/statistics/report`
- 本地路由：`/statistics/report`
- 目标取证批次：
  - `artifacts/network/baobiao--tongji-baobiao--tongji-gailan/default-target-20260519-190042-responses.json`
  - `tmp/statistics-report-target-contract.json`
  - `tmp/statistics-report-scenario-bodies.json`
- 本地 fresh clone 批次：
  - `artifacts/network/baobiao--tongji-baobiao--tongji-gailan/default-clone-20260519-185951-responses.json`
- 本地验证用例：`tests/statistics-report.spec.ts`

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 页面入口 | 顶部导航 `统计概览` | 从项目导航进入 `/statistics/report`，菜单高亮与页面布局一致 | 无新增请求，沿用项目现有路由与导航状态 | 已可进入页面并高亮导航 | 保留现有路由入口，新增 provider contract 节点辅助回归 | `statistics-report.spec.ts` 第 1 条断言导航高亮、URL 与主体可见 |
| 默认加载 | 页面初始化 | 首屏默认展示昨天统计概览 | `POST /report/accommodation/management/analysis/get`，请求体 `{"campId":"1796067693589061634","startDate":"2026-05-18","endDate":"2026-05-18"}` | 已消费统一服务层并回显合同节点 | 服务层显式建模统一响应包与适配后的业务模型 | target `default-target-20260519-190042` + clone `default-clone-20260519-185951` + `statistics-report.spec.ts` 第 1 条 |
| 日期筛选 | `今天` | 切换到今天统计数据 | 同主接口，请求体改为 `startDate=endDate=2026-05-19` | 已联动合同节点与 UI | 保持 query -> requestBody -> dashboard 单向流 | target “今天” body + `statistics-report.spec.ts` 第 2 条 |
| 日期筛选 | `本月` | 切换到本月统计和预测字段 | 同主接口，并追加 `predictStartDate/predictEndDate` | 已联动合同节点、经营指标与远期分析数据 | 统一在服务层派生本月查询参数 | target “本月” body + `statistics-report.spec.ts` 第 2 条 |
| 日期筛选 | `上周 / 本周 / 上月` | 真实站存在入口，但本轮未采到可核验请求数据 | 暂无可落地合同，不能伪造请求体 | 页面按钮可见但禁用 | 维持禁用态，避免发明未取证数据 | `statistics-report.spec.ts` 第 2 条断言禁用态 |
| 顶部操作 | `刷新看板` | 在当前筛选条件下重新拉取统计概览 | 复用当前 query 重新调用主接口，不改合同内容 | 已刷新并显示状态反馈 | 保留 loading + 成功提示，不重复提交 | `statistics-report.spec.ts` 第 2 条断言刷新反馈与合同不漂移 |
| 模式切换 | `统计总览` / `远期分析` | 在概览和预测视图间切换 | 不新增请求，消费同一份 dashboard 数据 | 已支持双模式切换 | 用统一 dashboard.futureCards 承接预测视图 | target 月度预测字段 + `statistics-report.spec.ts` 第 2 条 |
| 房型筛选 | `房型` -> `观影大床房` | 按房型刷新统计概览 | 主接口请求体追加 `roomCategoryIds:["1796425098965729282"]` | 已展示房型筛选反馈与对应收入 | 服务层只接受已取证房型请求签名 | target 房型筛选 body + `statistics-report.spec.ts` 第 3 条 |
| 渠道筛选 | `渠道` -> `携程` | 按渠道细分房型统计 | 主接口请求体追加 `channelIds:["5"]` | 已展示渠道反馈、收入和来源分布 | 服务层对房型+渠道组合提供强约束 mock | target 房型+渠道 body + `statistics-report.spec.ts` 第 3 条 |
| 房型标签 | `房型标签` | 真实站当前返回空标签列表 | `POST /roomCategoryGroups/get`，响应 `roomCategoryGroups: []` | 已显示 `暂无房型标签` 和反馈条 | 不做静默 fallback，不伪造标签数据 | target 空标签响应 + `statistics-report.spec.ts` 第 3 条 |
| 趋势分析 | `营业收入 / 入住率OCC / 平均房费ADR / RevPAR / 已售房间数` tab | 切换趋势图系列与纵轴格式 | 不新增请求，切换当前 dashboard.trendMetrics | 已切换图例、纵轴和反馈文案 | 趋势图组件只消费适配后的 trendMetrics | `statistics-report.spec.ts` 第 2 条断言 `入住率OCC` 切换；截图 `occ-chart-tab-*` |
| 指标卡片 | 营收卡片、经营指标卡片 | 目标站当前未取证到点击后新路由或弹层 | 无新增合同可依赖 | 当前保持只读展示 | 不发明详情跳转，先把卡片数据闭环做实 | target / clone 截图与 DOM 取证均未显示可点击详情入口 |
| 来源分析 | 订单来源列表与环图 | 展示来源占比；本轮未取证到独立点击动作 | 无新增请求 | 当前为只读展示 | 维持业务展示，不伪造钻取详情 | `statistics-report.spec.ts` 第 1/3 条 + `channel-filter-*` 截图 |
| 空态 | 空场景 `scenario=empty` | 页面结构保持稳定并提示刷新 | 主合同仍返回统一响应包，`overviewSnapshot.businessIncome=0` | 已显示空态文案和刷新入口 | 空态通过 provider scenario 显式模拟 | `statistics-report.spec.ts` 第 4 条 |
| 错误态 | 错误场景 `scenario=error` | 清晰提示失败并提供重试入口 | 服务层抛出显式业务错误，消息包含主接口路径 | 已显示错误区域和重试按钮 | 去掉页面正文中的开发态措辞，保留清晰失败信号 | `statistics-report.spec.ts` 第 5 条 |
| 错误恢复 | `重试` | 失败后按同一默认合同重新加载 | 重新请求默认昨天合同 | 已恢复到默认统计数据 | 重试重建 query，确保反馈条与合同同步 | `statistics-report.spec.ts` 第 5 条 |

## 说明

- 本地 clone 明确区分 `provider=mock` 与 `scenario=success|empty|error`，不对未取证请求做静默 fallback。
- 本轮 fixed Chrome 取证没有证明统计概览存在独立的导出、更多、详情跳转、订单列表或待办列表入口，因此当前不伪造这些业务承接。
