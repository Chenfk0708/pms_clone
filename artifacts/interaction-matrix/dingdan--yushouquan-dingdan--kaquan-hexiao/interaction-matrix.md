# 卡券核销交互矩阵

任务：`dingdan--yushouquan-dingdan--kaquan-hexiao`  
页面：卡券核销  
目标 URL：`https://minsubao.localhome.cn/mallManagement/verificationManagement`  
本地路由：`/mallManagement/verificationManagement`

## 取证结论

- 固定 Chrome + `playwright/.auth/pms-user.json` 可进入真实业务页，未被登录页或滑块阻断。
- 目标页首屏结构为：卡券码输入框、`核 销` 按钮、核销记录标题、`导出明细` 按钮、11 列核销记录表格，当前返回空态“暂无数据”。
- 目标关键接口：
  - `POST https://hudson-prod.localhome.cn/ticket/page/get`
  - 请求体：`{ campId, pageNum: 1, pageSize: 20, current: 1, ticketItemVerifyState: 1 }`
  - 响应包：`{ success, errorCode, errorMsg, errorDetail, data }`，`data` 内含 `total/size/current/pageNum/hasNextPage/pages/list`。
  - `POST https://hudson-prod.localhome.cn/ticket/check`
  - 请求体：`{ campId, ticketNo }`，无效券返回 `success:false,errorMsg:"该卡券不可使用"`。
- 本地实现按 95 分要求使用统一 `code/message/data/traceId/timestamp` 响应包作为当前阶段正式数据源，目标站 Hudson 响应字段通过服务层 adapter 转为页面业务模型。

## 交互矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口导航 | 订单 > 预售券订单 > 卡券核销 | 进入 `/mallManagement/verificationManagement`，左侧“卡券核销”高亮 | 无页面专属请求，进入后加载核销记录 | 已有路由和菜单入口 | 保持现有路由，页面标题与 aria heading 使用“卡券核销” | Playwright 断言 heading 与 active link |
| 核销入口 | 卡券码输入框 | 输入券码后点击核销 | `POST /ticket/check`，body `{ campId, ticketNo }` | 旧实现只显示输入文案 | 接入 `checkCardVerificationTicket`，空输入显示 alert，有效输入生成业务反馈并刷新列表 | Playwright 点击空输入、有值输入断言 alert/status/table |
| 核销入口 | 核 销按钮 | 提交券码核销，失败时显示错误 | `POST /ticket/check` | 旧实现无服务层 | loading 时禁用，成功显示“核销成功”，失败暴露明确错误 | Playwright 断言按钮反馈与重复提交禁用态 |
| 工具栏 | 刷新 | 重新拉取当前页核销记录 | `POST /ticket/page/get`，body `{ campId,pageNum,pageSize,current,ticketItemVerifyState }` | 旧实现无刷新 | 接入 `loadCardVerificationData`，显示 loading 和“核销记录已更新” | Playwright 点击刷新断言 status |
| 工具栏 | 导出明细 | 导出当前筛选下核销明细 | 后续建议 `POST /ticket/export` 同请求体 | 旧实现只写提示 | 当前阶段创建业务态导出任务反馈，空列表时禁用 | Playwright 点击断言“导出任务已创建” |
| 表格 | 核销记录表 | 展示卡券码、类目、商品名称、卡券名称、用户、价格、核销人、核销时间、订单、状态 | `POST /ticket/page/get` | 旧实现只有空表头 | 使用 provider rows 渲染业务数据，空态显示业务文案 | Playwright 断言表格含 `LK20260518001` 和商品名 |
| 表格 | 查看详情 | 目标站首屏未提供独立详情入口；本地按业务承接补齐 | 当前阶段无后端请求，后续可 `GET /ticket/detail` | 旧实现无详情 | 用右侧抽屉承接，展示卡券码、商品、订单、核销人/时间 | Playwright 点击断言 dialog 内容并可关闭 |
| 分页 | 下一页 | 目标接口支持分页字段 | `POST /ticket/page/get` 更新 `pageNum/current` | 旧实现无分页 | 当前 mock 总数 3 条，最后页点击给业务反馈 | Playwright 点击断言“已经是最后一页” |
| 空态 | 空记录 | 目标站显示“暂无数据” | `ticket/page/get` 返回空 list/total=0 | 旧实现只有静态暂无数据 | 使用 empty envelope 显示“暂无符合条件的核销记录”和 `共 0 条` | Playwright 设置 `pmsCardVerificationMockMode=empty` |
| 错误态 | 加载失败 | 目标 Hudson 失败会返回 `success:false/errorMsg` | 统一服务层抛出 `CardVerificationRequestError` | 旧实现无错误态 | 显示“核销记录加载失败”和重新加载按钮，不静默吞错 | Playwright 设置 `pmsCardVerificationMockMode=error` |

## 待后端确认

- `/ticket/page/get` 真实 list 非空时各字段的完整命名和枚举值。
- `/ticket/check` 成功响应是否直接返回核销记录，还是只返回布尔结果后需重新请求列表。
- 导出明细是否已有接口，建议复用列表筛选请求体新增导出任务接口。
- 卡券详情是否需要独立接口；当前本地由列表行数据承接详情抽屉。
