# 身份证读卡器交互矩阵

任务 ID：`zhihui-jiudian--zhizhu-yu-yingjian--shenfenzheng-dukaki`

目标路由：`/smartHotel/smartHardware/IDCardReader`

目标站取证批次：`default-target-20260519083310-*`、`interaction-target-20260519231000-*`

本地验证批次：
- `default-clone-20260519193535-*`
- `empty-clone-20260519193535-*`
- `error-clone-20260519193737-*`
- `detail-clone-20260519193737-*`
- `interaction-clone-20260519194040-*`

本地服务层：`src/services/smartIdCardReader.ts`

| 区域 | 元素/按钮 | 目标站行为 | 触发的数据服务 / 契约 | 本地改造动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- |
| 页面入口 | 顶部“智慧酒店”、侧栏“身份证读卡器” | 进入 `/smartHotel/smartHardware/IDCardReader` 后菜单高亮，页面标题正确 | 无新增接口 | 保持现有 `AppShell` 路由与高亮归属，不改导航结构 | Playwright 断言顶部与侧栏高亮 |
| 首屏加载 | 页面首屏 | 真实站展示三步接入流程，不是 CRUD 表格后台 | `fetchSmartIdCardReaderDashboard(filters)` 统一返回 `code/message/data/traceId/timestamp` | 用显式 `mock` provider 驱动首屏，首屏可见 hero、筛选、指标、流程、记录、快捷入口 | `tests/smart-id-card-reader.spec.ts` 首屏用例 |
| 数据范围 | 今日 / 近7天 / 近30天 | 真实站未抓到独立请求，但存在运营时间维度 | 查询参数 `datePreset=today|7d|30d` | 切换按钮时更新草稿状态，点击查询后写回 URL 与服务层参数 | Playwright 断言按钮存在；隐藏契约节点可见 `datePreset` |
| 设备状态筛选 | 设备状态：全部 / 已连接 / 待调试 / 需复核 | 真实站未抓到独立业务接口 | 查询参数 `deviceStatus=all|connected|pending|warning` | 下拉筛选记录列表，契约节点同步 `data-device-status` 与 `data-record-count` | Playwright 筛选“待调试”后只剩李文博 |
| 关键字筛选 | 搜索住客姓名、身份证号、订单号 | 真实站未抓到独立业务接口 | 查询参数 `keyword` | 查询时按住客、证件号、订单号、设备名过滤本地合同草案记录 | 可通过隐藏契约与表格内容复核 |
| 查询 | 查询按钮 | 真实站未抓到可见反馈 | 重新请求统一 dashboard 契约 | 提交当前筛选条件，反馈文案更新，URL query 保留当前筛选 | Playwright 首屏与筛选用例覆盖 |
| 重置 | 重置按钮 | 真实站未抓到可见反馈 | 重置为默认 filters | 清空关键字、设备状态回到全部、日期回到今日 | Playwright 断言重置后恢复 3 条记录 |
| 刷新 | 刷新按钮 | 真实站存在流程页刷新语义 | 同一 dashboard 契约重新拉取 | 提示“数据刷新中”，递增 `reloadSeq` 重新拉取数据 | 可通过反馈状态和脚本取证复核 |
| 导出记录 | 导出记录按钮 | 真实站未取证到导出接口 | 当前阶段仅保留前端业务反馈草案 | 给出明确任务创建反馈，不做假下载成功 | 脚本 / 手动点击后看状态反馈 |
| 指标卡片 | 4 张指标卡 | 真实站未见指标卡，但 95 分页面要求业务闭环 | `metrics[]` 来自统一服务层 | 点击卡片展示数值说明反馈，不伪造跳转 | 可见反馈文案变化 |
| 接入步骤 1 | 请选择读卡器品牌 | 真实站存在品牌选择“华视” | `brandOptions[]` 由 dashboard 返回 | 支持品牌下拉切换 `华视 / 精伦 / 新中新`，并反馈切换结果 | Playwright 切换到“精伦” |
| 接入步骤 2 | PMS助手下载 | 真实站存在“PMS助手下载”按钮 | 当前阶段无真实下载接口证据 | 保留下载动作，反馈“安装包下载任务已创建” | Playwright 点击后断言状态反馈 |
| 接入步骤 3 | 读身份证 | 真实站存在“读身份证”动作入口 | 当前阶段前端合同草案：读卡预览写回 guestPreview | 点击后回填住客姓名、证件号、房型、房号 | Playwright 断言张小雅和证件号回填 |
| 接入步骤 3 | 清空预览 | 真实站未取证到清空按钮，但本地闭环需要 | 清空本地 preview | 预览字段回到空值与默认提示 | 手动可复核，状态反馈明确 |
| 流程底部 | 完成对接 | 真实站存在“完成对接”按钮 | 当前阶段仅前端业务闭环反馈 | 未读卡时阻止完成并提示；已读卡后反馈“已写入 PMS” | Playwright 读卡后点击并断言反馈 |
| 最近读卡记录 | 记录表格 | 真实站未取证到身份证读卡器专属 CRUD 列表接口 | `records[]` 为前端合同草案，统一由服务层返回 | 展示 3 条明确样例记录：张小雅 / 李文博 / 陈嘉欣 | Playwright 首屏、筛选、详情均覆盖 |
| 行操作 | 查看详情 | 真实站未取证到详情页，但有业务承接需求 | 本地 Drawer 展示记录详情 | 点击后打开抽屉，展示订单号、证件号、设备、备注 | Playwright 断言 drawer 打开与关闭 |
| 快捷入口 | 智能门锁 | 真实站可从智慧酒店模块跳转既有页面 | 路由 `/smartHotel/smartHardware/smartLook` | 使用仓库已存在路由承接 | Playwright 点击后断言 URL |
| 快捷入口 | 公安对接 | 真实站侧栏有独立页面 | 路由 `/psb/list` | 使用已存在页面承接 | 可手动验证路由跳转 |
| 快捷入口 | 智能硬件商城 | 真实站侧栏有独立页面 | 路由 `/smartHotel/smartHardware/mall` | 使用已存在页面承接 | 可手动验证路由跳转 |
| 快捷入口 | 全局设置 | 真实站智慧酒店已有页面 | 路由 `/smartHotel/checkInGuide` | 使用已存在页面承接 | 可手动验证路由跳转 |
| 空态 | `?mockState=empty` | 真实站未抓到专属空态，但允许补齐合理业务空态 | 同一 dashboard 契约，`records=[]`，`emptyState` 明确返回 | 保留完整流程与快捷入口，不让页面塌陷 | Playwright 空态用例 + `empty-clone-20260519193535-*` |
| 错误态 | `?mockState=error` | 真实站未抓到显式错误 UI | 同一 dashboard 契约抛错，无静默 fallback | 展示 `role=alert`、失败原因和“重新加载”按钮 | Playwright 错误态用例 + `error-clone-20260519193737-*` |
| 重试 | 重新加载 | 真实站未取证 | 从错误态回到默认 success | 点击后清掉 query，重回正常页面 | Playwright 断言 URL 回到无 query |
| 契约诊断 | 隐藏节点 `smart-id-reader-service-contract` | 真实站无此节点 | 汇总 provider / mockState / filters / traceId | 仅供自动化与接口对账，不在正文暴露“mock” | Playwright 读取 `data-*` 属性 |

## 取证结论

- 真实站默认批次 `default-target-20260519083310-*` 证明截至 `2026-05-19 08:33:10 +08:00` 页面仍是三步接入流程页，未抓到身份证读卡器专属 CRUD 接口。
- 真实站交互批次 `interaction-target-20260519231000-*` 证明截至 `2026-05-19 23:10:00 +08:00` 页面正文仍明确包含“请选择读卡器品牌 / 华视 / PMS助手下载 / 读身份证 / 完成对接”，脚本已成功点击“读身份证”入口。
- 因此本地服务层严格区分“真实站已取证事实”和“前端合同草案补齐”：
  - 流程主线沿用真实站三步语义。
  - 记录表、指标、详情、空态、错误态均明确落在本地统一 provider 契约里。
- 本地交互闭环已覆盖品牌切换、下载反馈、读卡预览、完成对接、筛选、详情、快捷入口、空态、错误态与重试。
