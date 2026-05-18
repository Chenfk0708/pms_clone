# 保洁统计交互矩阵

任务：`fangtai--baojie-guanli--baojie-tongji`  
目标页：`https://minsubao.localhome.cn/cleanManage/cleanStatistics`  
本地页：`/cleanManage/cleanStatistics`

## 取证结论

- 历史 target artifacts 已包含固定 Chrome + `playwright/.auth/pms-user.json` 的默认态和订阅跳转态证据：`target-default-headless-final-20260515-134800.*`、`target-subscribe-headless-final-20260515-134800.*`。
- 目标站首屏接口参考：`cleanTask/statistics`、`cleaner/list/get`、`roomCategories/page/get`、`rooms/get`。
- 本轮新要求后，本地默认改为显式 `mock` provider 正式驱动页面，不再把缺少 `campId` 展示为页面正文阻塞；后续通过 `VITE_PMS_CLEAN_STATISTICS_PROVIDER=api` 集中切换到接口 provider。
- 本地新鲜 artifacts：`local-provider-20260518-verified.*`，覆盖截图、DOM、样式摘要和 provider/network 记录。

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口导航 | 房态 > 保洁管理 > 保洁统计 | URL 为 `/cleanManage/cleanStatistics`，保洁统计页可进入 | 看板数据加载 | 已接入路由 | 保持项目现有 AppShell/路由，页面内显示业务标题 | `routes.spec.ts --grep cleanStatistics` |
| 数据来源 | 首屏加载 | 加载统计、保洁员、房型房间 | `POST /api/clean/statistics/dashboard`，参考目标站 `cleanTask/statistics` 等接口 | 旧版直连真实接口且缺上下文时阻断 | 改为显式 provider，统一响应包后适配业务模型 | `clean-statistics.spec.ts` 断言核心指标、汇总表、`data-clean-request` |
| 顶部筛选 | 门店切换 | 切换门店上下文后刷新统计 | `storeId` 进入请求体 | 可点击但旧状态会被首屏加载覆盖 | 切换后显示“已切换门店”业务反馈 | Playwright 点击并断言 status |
| 顶部筛选 | 本月/上月/日期范围 | 改变统计日期范围 | `cleanStartTime/cleanEndTime` | 旧版可改日期但依赖真实上下文 | 查询时按当前日期生成上海时区时间戳 | Playwright 填日期并断言请求参数 |
| 顶部筛选 | 房型房间下拉 | 展示房型房间选项 | `roomIds` | 旧版选项来自真实接口或空态 | mock provider 返回稳定房间选项，选择后按钮显示选中项 | Playwright 打开 listbox 并选择 |
| 顶部筛选 | 保洁员下拉 | 展示保洁员选项 | `cleanerIds` | 旧版选项来自真实接口或空态 | mock provider 返回稳定保洁员选项，选择后按钮显示选中项 | Playwright 打开 listbox 并选择 |
| 顶部操作 | 查询 | 按当前筛选刷新 | 看板接口 | 旧版依赖 `campId`，按钮可能禁用 | 默认可查，loading 时禁用防重复提交 | Playwright 点击后断言业务反馈和请求体 |
| 顶部操作 | 重置 | 恢复默认筛选并刷新 | 看板接口 | 旧版重置后可能继续阻断 | 恢复默认门店、日期、房间、保洁员并刷新 | Playwright 断言按钮恢复默认 |
| 顶部操作 | 导出 | 创建导出任务 | `POST /api/clean/statistics/export` | 旧版显示“导出接口未取证” | 改为业务态“导出任务已创建”反馈，接口文档沉淀导出契约 | Playwright 点击并断言 status |
| 说明入口 | `?` | 展示统计口径说明 | 无请求 | 旧版显示开发态说明 | 改为业务口径弹窗 | Playwright 断言 dialog |
| 指标卡片 | 本月保洁/费用/通过率/待处理 | 查看指标含义 | 无请求 | 旧版无指标卡片 | 打开指标详情弹窗 | Playwright 点击并关闭 |
| 汇总表 | 统计汇总 | 显示扫尘、续住、退房、深度和合计 | 看板接口 `statistics.list` | 旧版直连接口或空态 | 组件消费服务层适配后的 `CleanSummaryRow` | Playwright 断言 2026-05-16 和金额 |
| 明细表 | 统计明细页签 | 显示任务明细 | 看板接口 `statistics.detailList`，后端可拆分页 | 旧版显示“明细接口未取证” | 改为业务明细表和查看弹窗 | Playwright 点击 `CL20260516001` |
| 待办入口 | 今日退房保洁/待验收/排班 | 跳转或切换业务承接 | 已有路由 `/houseManage/days`、`/cleanManage/cleanStaff` 或明细页签 | 旧版无待办区 | 使用现有路由与明细页签承接 | Playwright 断言待办可见，专项覆盖主要动作 |
| 订阅入口 | 订阅开通 | 跳转智能保洁购买详情 | `/version/applicationPayment/detail` | 已对齐目标站跳转 | 保持跳转，校验购买详情页 | Playwright 断言 URL 和购买页内容 |
| 空态 | `cleanMockState=empty` | 无数据时表结构保持 | 统一响应包 `code=0,data.list=[]` | 旧版空态依赖接口 | 显示业务空态，不崩溃 | Playwright 空态测试 |
| 错误态 | `cleanMockState=error` | 请求失败时暴露错误与重试 | 统一响应包 `code!=0` | 旧版错误可显示但文案偏开发态 | 显示“数据加载失败，请稍后重试”和重试按钮 | Playwright 错误态测试 |

## 待后端确认

1. 目标站当前 Hudson 包是否可收敛为统一响应包。
2. 明细列表是否与汇总同接口返回。
3. 导出任务是否需要轮询进度。
