# 置换权益交互矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口与导航 | 侧栏 `聚合分销 > 分销 > 置换权益` | 进入 `/channels/distribution/distributiondisplacement`，侧栏高亮 `置换权益`，页面标题与面包屑同步 | 无独立业务请求；依赖项目现有路由与菜单状态 | 已接入路由，专项测试可见菜单高亮 | 保持复用 `src/App.tsx` 与 `src/data/discovery.ts` 的现有入口，不新增平行路由 | Playwright 断言 URL、`置换权益` 链接高亮、页头隐藏状态一致 |
| 首屏加载 | 页面初始化 | 真实站加载后展示 `置换概况`、`置换明细`、`申请尾房置换`，当前账号首屏金额为 `-` 且列表空态；右侧会话浮层会常驻 | 真实站取证到 `POST https://hudson-prod.localhome.cn/edition/replace/order/get`，请求体出现两种形态：`{ campId, pageSize: 100, receiverStartTime: null, receiverEndTime: null }` 与 `{ campId, pageNum: 1, pageSize: 20, current: 1, receiverStartTime: null, receiverEndTime: null }` | 当前本地默认走显式 `mock` provider，页面首屏加载业务数据 | 新增 `src/services/distributionDisplacement.ts`，把请求参数、统一响应包、字段适配和 mock 三态集中到服务层，组件只消费业务模型 | `distribution-displacement-service-state` data 属性断言 provider、endpoint、request body；Playwright 首屏用例 1/5 |
| 顶部操作 | `刷新` | 真实站会重新拉取当前条件下列表；右侧会话浮层也存在“刷新会话”同名文案，容易误命中 | 未来继续使用 `POST /edition/replace/order/get` 复取当前筛选条件 | 当前已提供 loading 和完成 toast | 给操作区加 `aria-label="置换权益操作"`，测试与自动化限定作用域，避免会话浮层干扰 | Playwright 点击 `置换权益操作` 区域内 `刷新`，断言 toast 与 request body 保持当前筛选条件 |
| 顶部操作 | `导出` | 目标站可见导出入口，但当前账号无可导出数据 | 未来建议独立导出任务接口；当前由页面本地反馈承接 | 当前无真实导出请求，走业务态反馈 | 保持页面正文业务态，列表非空时提示“导出任务已创建”，空表时提示当前条件无可导出明细 | Playwright 点击导出，断言成功 toast；空态场景可通过 query 参数补充验证 |
| 顶部操作 | `申请尾房置换` | 打开 `尾房置换` 弹层，展示二维码与“联系业务经理，进行尾房置换” | 无列表请求；属于独立弹层交互 | 当前已完整实现弹层、关闭按钮与确认按钮 | 复刻目标站最核心交互，不在正文暴露开发态占位文案 | Playwright 用例 3/5：打开弹层、检查二维码区域与文案、关闭 |
| 筛选区 | `开始日期` / `结束日期` | 真实站可筛选日期并刷新列表，请求体中的 `receiverStartTime`、`receiverEndTime` 变化 | 复用 `POST /edition/replace/order/get`；本地请求体映射为毫秒时间戳，结束日期转次日零点半开区间 | 当前支持日期输入与参数回传 | 服务层统一构造 request body，页面只维护筛选状态；非法区间在服务层抛错 | Playwright 用例 2/5：填写日期后断言 `data-request-body` 出现 `1778947200000` |
| 筛选区 | `查询` | 触发列表刷新 | 同上 | 当前支持 | 查询前调用 `prepareLoad()`，显示 loading，再刷新业务数据与 toast | Playwright 点击查询，断言 toast 与列表仍可继续操作 |
| 筛选区 | `重置` | 清空日期并回到默认条件 | 同上 | 当前支持 | 重置为 `defaultDistributionDisplacementFilters`，同时重置页码并触发新请求 | Playwright 点击重置，断言开始日期清空与 toast 可见 |
| 表格 | `查看` | 目标站当前列表为空，未取证到独立详情承接；按新版 prompt 需补业务承接 | 无新增请求；优先以本页抽屉承接 | 当前已有详情抽屉 | 以 `置换明细详情` 抽屉承接订单、房型房间、联系人、置换金额、备注，按钮加精确 `aria-label` | Playwright 用例 2/5：打开 `查看 DD-20260518-001 详情`，断言抽屉内容并关闭 |
| 结果反馈 | loading | 真实站请求期间出现列表更新过程 | 同当前列表请求 | 当前支持 `aria-busy` 与 loading 行 | 把 loading 统一放在数据刷新路径，不在组件内散落真假状态 | Playwright 和自定义脚本通过刷新/查询路径覆盖 |
| 结果反馈 | error + `重试` | 真实站未稳定暴露错误文案；新版 prompt 要求必须有失败闭环 | mock provider `error` 返回统一失败响应包 `{ code, message, data, traceId, timestamp }` | 当前支持错误卡片与重试按钮 | 失败态显式显示“置换权益数据加载失败”，重试再次请求同一条件 | Playwright 用例 4/5：`?mockState=error` 场景断言 alert 与重试按钮 |
| 结果反馈 | empty | 目标站当前就是 `暂无数据` 空态 | 真实站返回 `success/errorCode/errorMsg/data`，本地用统一响应包 empty 承接 | 当前支持空态表格与分页信息 | 在不破坏表格结构的前提下展示 `暂无置换明细`，分页显示 `共 0 条` | Playwright 用例 5/5：`?mockState=empty` 场景断言空态、分页与表格仍存在 |
| 诊断与契约 | 隐藏服务状态节点 | 目标站无此节点，本地用于自动化验收和契约取证 | 暴露 provider、endpoint、request body、traceId；不在页面正文展示 | 当前已接入 | 保持隐藏节点，只供测试与文档核验使用 | 自定义脚本 `tmp/verify-distribution-displacement.mjs` 与 Playwright 共同断言 |

## 目标站取证结论

- 固定 Chrome + `playwright/.auth/pms-user.json` 已在 `artifacts/screenshots|dom-snapshots|style-dumps|network/juhe-fenxiao--fenxiao--zhihuan-quanyi/` 产出默认态与交互态证据。
- 真实站核心接口为 `POST https://hudson-prod.localhome.cn/edition/replace/order/get`。
- 真实站响应包格式为 `success/errorCode/errorMsg/data`，不是本地统一的 `code/message/data`；本地通过 adapter 显式收口。
- 当前账号下目标站核心可见交互是空态列表和 `申请尾房置换` 弹层，详情列表未提供可直接取证的业务数据，因此本地以抽屉承接详情闭环。
- 右侧会话浮层会污染全局文本/按钮选择器，自动化与后续回归必须限定到页面业务作用域。
