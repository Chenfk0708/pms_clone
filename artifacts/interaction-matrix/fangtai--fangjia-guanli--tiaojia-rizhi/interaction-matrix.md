# 调价日志交互矩阵

- TASK_ID: `fangtai--fangjia-guanli--tiaojia-rizhi`
- PAGE_NAME: 调价日志
- TARGET_URL: `https://minsubao.localhome.cn/houseManage/logs/price`
- 本地入口: `/houseManage/logs/price`
- 更新批次: `2026-05-18-business-provider`

## 目标站取证摘要

目标站首屏和交互取证目录已存在于：

- `artifacts/screenshots/fangtai--fangjia-guanli--tiaojia-rizhi/`
- `artifacts/dom-snapshots/fangtai--fangjia-guanli--tiaojia-rizhi/`
- `artifacts/style-dumps/fangtai--fangjia-guanli--tiaojia-rizhi/`
- `artifacts/network/fangtai--fangjia-guanli--tiaojia-rizhi/`

已取证到的目标站上下文请求包括：`POST /channels/get`、`POST /roomCategories/page/get`、`POST /actionExecs/get`、`POST /traceLog`、`POST /menus/project/get`。调价日志列表字段按目标站筛选区、表头和已取证上下文请求沉淀为当前 mock 契约：请求参数包含 `campId`、`keyword`、`adjustType`、`channelId`、调整时间、操作日期、操作人、分页参数；响应包为 `code/message/data/traceId/timestamp`，分页列表位于 `data.list` 与 `data.pagination`。

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口与布局 | 房态 > 房价管理 > 调价日志 | URL 为 `/houseManage/logs/price`，房价管理菜单下调价日志高亮，页面标题和隐藏头部与房价页一致 | 路由进入后加载调价日志列表契约 | 已接入项目 `AppShell`、路由和菜单 | 保持现有 layout，不新增全局结构 | `tests/routes.spec.ts -g "logs/price"` 渲染用例 |
| 顶部筛选 | 日志关键词 | 输入房型、房间号或渠道房源名称后查询列表 | `POST /houseManage/logs/price/list`，body.keyword | 已接入数据服务查询参数 | 查询按钮提交后刷新业务列表 | `tests/price-log.spec.ts` 断言 localStorage 诊断中的 `keyword` 和 UI 行 |
| 顶部筛选 | 调整方式下拉 | 切换手动调整、系统调整 | `body.adjustType=manual/system` | 自定义 listbox，可切换并刷新列表 | 选中后只展示对应调整方式数据 | Playwright 点击 `系统调整` 后断言 `系统同步` 行 |
| 顶部筛选 | 渠道下拉 | 选择渠道后筛选列表 | `body.channelId`，渠道枚举来自字典 | 自定义 listbox，包含目标站渠道枚举 | 选择飞猪淘酒店后只展示对应渠道行 | Playwright 点击渠道后断言请求诊断和表格 |
| 顶部筛选 | 展开/收起 | 展开高级筛选，显示调整时间、操作日期、操作人 | 不立即请求；查询时带入高级筛选字段 | 已实现展开/收起和输入控件 | 收起时保留输入状态，重置时清空 | `tests/routes.spec.ts` 二级交互用例 |
| 顶部筛选 | 查询 | 按当前条件刷新列表 | `POST /houseManage/logs/price/list` | 已接入显式 provider 和统一响应包解析 | 显示查询完成反馈，按钮加载中禁用 | `tests/price-log.spec.ts` 查询用例 |
| 顶部筛选 | 重置 | 清空筛选并恢复默认列表 | `POST /houseManage/logs/price/list` 默认 body | 已接入 | 清空关键词、渠道、高级筛选并刷新列表 | Playwright 断言输入为空、渠道为请选择、列表恢复 |
| 顶部筛选 | 刷新 | 重新拉取当前条件数据 | `POST /houseManage/logs/price/list` 当前 body | 已接入 | 显示“已刷新”业务反馈 | Playwright 点击刷新断言反馈 |
| 顶部筛选 | 导出 | 创建当前条件导出任务 | `POST /houseManage/logs/price/export` 当前 body | 已接入本地导出请求记录 | 显示“导出任务已创建”业务反馈 | Playwright 点击导出断言反馈 |
| 表格 | 列表展示 | 展示房型、价格日期、操作内容、调整方式、同步渠道、渠道价格、操作人、操作时间 | `data.list[]` 字段适配 | 已由服务层适配后渲染 | 组件不直接消费响应包 | Playwright 首屏断言业务行 |
| 表格 | 查看详情 | 查看单条调价记录 | 当前行数据 | 已用详情弹窗承接 | 弹窗展示日志编号、房型、操作内容、渠道 | Playwright 点击详情并关闭 |
| 状态 | loading | 请求期间禁用提交类按钮，表格显示正在加载 | provider 延迟模拟 | 已接入 | 防止重复提交 | Playwright 通过按钮禁用和加载文案覆盖 |
| 状态 | empty | 返回空列表时页面结构不崩溃 | `priceLogMockState=empty` | 已接入 | 显示业务空态“暂无数据” | `tests/price-log.spec.ts` 空态用例 |
| 状态 | error | 返回业务失败时显示错误和重试入口 | `priceLogMockState=error` | 已接入 | 显示“调价日志数据加载失败，请稍后重试” | `tests/price-log.spec.ts` 错误态用例 |
| 开发态文案控制 | 页面正文 | 不出现 mock、未接入、阻塞、后端未就绪等开发态文案 | 诊断写入 `localStorage.pms.priceLog.lastRequest` | 已接入 | 页面正文保持业务态 | `tests/price-log.spec.ts` 正则反向断言 |
