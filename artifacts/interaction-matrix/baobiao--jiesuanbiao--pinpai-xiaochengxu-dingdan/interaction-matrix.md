# 品牌小程序订单交互矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 顶部筛选 | 全部门店 | 默认选中，点击后配合查询刷新列表 | `POST /report/storer/statement/get`，请求体不带 `poiIds` | 已实现 | 统一走 `loadStatementOrderData('all')`，使用统一审计串记录请求参数 | Playwright 断言 `aria-pressed=true`、隐藏审计串含 `poiIds=all` |
| 顶部筛选 | 当前门店 | 选中后配合查询刷新列表 | `POST /report/storer/statement/get`，请求体新增 `poiIds:["1796425098638573570"]` | 已实现 | 统一走 `loadStatementOrderData('current')`，本地 mock 返回当前门店专属列表 | Playwright 点击后断言隐藏审计串含 `poiIds=1796425098638573570` 且表格变为 2 条 |
| 顶部筛选 | 重置 | 恢复默认筛选条件 | 本地重置后重走 `POST /report/storer/statement/get` 默认参数 | 已实现 | 统一恢复 `selectedScope/submittedScope=all`，显示“已恢复默认筛选条件” | Playwright 点击后断言 `全部门店` 重新选中 |
| 顶部筛选 | 查询 | 按当前门店条件重新拉取列表 | `POST /report/storer/statement/get`，默认 `pageSize=20`、`bookingStartDate=2026-05-01`、`bookingEndDate=2026-05-31` | 已实现 | 引入 loading 态、按钮禁用态、成功提示和统一服务审计 | Playwright 点击后断言按钮短暂 disabled、状态文案更新 |
| 顶部筛选 | 导出明细 | 导出当前条件下的结算表 | `POST /report/storer/statement/get`，请求体改为 `pageSize=9999`，新增 `exportExcelMenuId=1732967098146951178` | 已实现 | 新增 `exportStatementOrderData`，复用同一契约并输出导出审计 | Playwright 点击后断言状态文案与隐藏审计串中的 `exportExcelMenuId` |
| 表格区域 | 默认成功态 | 目标站当前为空；本地需以业务可用态展示 | 本地 mock provider 默认返回 3 条订单 | 已实现 | 用显式 mock/provider 输出正式展示数据，不在组件内写死零散常量 | Playwright 断言订单号 `MP202605010001`、`MP202605010101` 可见 |
| 表格区域 | 空态 | 目标站返回空列表时展示 `暂无数据` | `mockState=empty` -> 统一响应包 `data.list=[]` | 已实现 | 保持表结构稳定，提示“当前条件暂无品牌小程序订单” | Playwright 断言空态文案与 `total=0` |
| 表格区域 | 错误态 | 接口失败时给出明确错误提示与重试入口 | `mockState=error` -> 统一响应包 `code!=0` | 已实现 | 显示 `role=alert` 错误条与 `重新加载` 按钮 | Playwright 断言错误文案和重试按钮存在 |
| 页面壳层 | 会话收起 | 目标站支持右下会话浮层收起 | 全局会话浮层交互，不属于本页业务接口 | 沿用现有实现 | 不重写全局壳层，仅保留与本页共存验证 | target 取证截图 `collapsed-target-20260519084737-*` |

## 取证来源

- target 默认态：`artifacts/screenshots/baobiao--jiesuanbiao--pinpai-xiaochengxu-dingdan/default-target-20260519084737-*.png`
- target 收起态：`artifacts/screenshots/baobiao--jiesuanbiao--pinpai-xiaochengxu-dingdan/collapsed-target-20260519084737-*.png`
- clone 成功态：`artifacts/screenshots/baobiao--jiesuanbiao--pinpai-xiaochengxu-dingdan/default-clone-20260519092315-*.png`
- clone 空态：`artifacts/screenshots/baobiao--jiesuanbiao--pinpai-xiaochengxu-dingdan/default-clone-20260519092723-*.png`
- clone 错误态：`artifacts/screenshots/baobiao--jiesuanbiao--pinpai-xiaochengxu-dingdan/default-clone-20260519092100-*.png`
