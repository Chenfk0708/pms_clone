# 交接班交互矩阵

## 页面信息

- 任务编号：`baobiao--jiaojieban--jiaojieban`
- 页面路由：`/statistics/shift/record`
- 设置页路由：`/setting/shiftSetting`
- 服务层文件：`src/services/shiftRecord.ts`
- 页面文件：`src/pages/ShiftRecordPage.tsx`
- 专项测试：`tests/shift-record.spec.ts`

## 默认成功态

| 触发 | 输入 | 页面反馈 | 服务合同 |
| --- | --- | --- | --- |
| 打开页面 | 无 | 展示筛选区、当前筛选条件、11 列表头、3 条交接班记录 | `provider=mock`、`listPath=/shiftWorkReport/page/get`、`storePath=/select/poi/page/get`、`employeePath=/campRoles/get`、`campId=1796067693589061634`、`pageSize=20`、`total=3` |

## 查询与重置

| 触发 | 输入 | 页面反馈 | 服务合同变化 |
| --- | --- | --- | --- |
| 点击`查询` | `开始日期=2026-05-18`、`结束日期=2026-05-18`、`门店=天落会宿公寓(前海壹方城宝安中心店)`、`交班人=路客云6TS5` | 状态栏显示`已按筛选条件更新交接班记录`，表格收敛到 1 条记录 | `startDate=2026-05-18`、`endDate=2026-05-18`、`poiId=1796425098638573570`、`handoverUserId=1796067693261905922`、`total=1` |
| 点击`重置` | 无 | 状态栏显示`已恢复默认筛选条件`，筛选项恢复默认值 | `startDate=all`、`endDate=all`、`poiId=all`、`handoverUserId=all`、`receiverUserId=all` |

## 导出与详情

| 触发 | 输入 | 页面反馈 | 服务合同变化 |
| --- | --- | --- | --- |
| 点击`导出` | 当前已提交筛选条件 | 状态栏显示`交接班导出任务已创建` | 追加 `exportTaskId=shift-record-export-001`、`exportStoreId=<当前门店>` |
| 点击`查看详情` | 任一记录 | 打开`交接班详情`弹层，展示门店、班次、交班状态、交班时段、净收入、总收入、总支出、收款来源、支付方式、交班物品、交班摘要、交班备注、接班备注 | 无新增请求，复用当前行数据 |

## 设置跳转

| 触发 | 输入 | 页面反馈 |
| --- | --- | --- |
| 点击`设 置` | 无 | 跳转到 `/setting/shiftSetting`，左侧菜单高亮`交接班设置` |

## 空态与错误态

| 场景 | 触发方式 | 页面反馈 | 服务合同 |
| --- | --- | --- | --- |
| 空态 | `/statistics/shift/record?mockState=empty` | 表格空态文案为`暂无数据`，状态栏显示`当前筛选条件暂无交接班记录`，导出按钮禁用 | `total=0` |
| 错误态 | `/statistics/shift/record?mockState=error` | 错误区块显示`交接班记录加载失败，请稍后重试`，可点击`重试` | 保留当前筛选条件，可再次发起加载 |

## 真实接口取证结论

| 接口 | 方法 | 已确认请求 | 已确认响应壳 |
| --- | --- | --- | --- |
| `https://hudson-prod.localhome.cn/shiftWorkReport/page/get` | `POST` | 默认 `{ "campId": "1796067693589061634", "pageNum": 1, "pageSize": 20 }` | `{ success, errorCode, errorMsg, errorDetail, data }`，`data` 包含 `total`、`size`、`current`、`pageNum`、`hasNextPage`、`pages`、`list` |
| `https://hudson-prod.localhome.cn/select/poi/page/get` | `POST` | `{ "campId": "1796067693589061634", "pageSize": 999, "pageNum": 1, "channelId": 0, "isAvailability": "1" }` | `data.list[]` 含 `poiId`、`poiName` |
| `https://hudson-prod.localhome.cn/campRoles/get` | `POST` | `{ "campId": "1796067693589061634" }` | `data.employees[]` 含 `userId`、`displayName`、`roles`、`mobile`、`isCampCreator` |

## 验证命令

```bash
npx eslint src/pages/ShiftRecordPage.tsx src/services/shiftRecord.ts tests/shift-record.spec.ts
npx playwright test tests/shift-record.spec.ts --config=tmp/statement-order.playwright.config.ts --reporter=line
```

## 详情字段补充

| 触发 | 真实字段来源 | 本地展示 |
| --- | --- | --- |
| 点击`查看详情` | 当前行 `workReport` JSON 字符串，字段来自 `workUserStartDate`、`workUserEndDate`、`generalIncome`、`netIncome`、`totalExpenditure`、`workIncomeSourceList`、`paymentTypeList`、`workGoods`、`remark` | 弹层展示交班状态、交班时段、净收入、总收入、总支出、收款来源、支付方式、交班物品、交班摘要、交班备注、接班备注 |

## 取证说明

- 右侧全局 `ChatDock` 会遮挡表格最后一列的风险，当前页通过右侧安全区与表格横向滚动保留最后一列可点击性，专项 Playwright 已覆盖 `查看详情` 与 `设置` 两个末列入口。
- 真实目标站默认 `shiftWorkReport/page/get` 返回空列表，本地详情态由显式 mock provider 提供，但字段命名与枚举已按 `tmp/shift-record-target.chunk.js` 收紧。
