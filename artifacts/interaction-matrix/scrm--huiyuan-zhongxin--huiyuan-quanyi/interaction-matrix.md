# 会员权益交互矩阵

任务 ID：`scrm--huiyuan-zhongxin--huiyuan-quanyi`

目标 URL：`https://minsubao.localhome.cn/scrm/memberCenter/equity`

取证批次：`20260518-95-target`

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口与侧栏 | SCRM > 会员中心 > 会员权益 | URL 为 `/scrm/memberCenter/equity`，SCRM 顶栏和会员中心侧栏高亮，页面标题为权益列表 | 页面加载触发 `POST /memberCard/page/get` 与 `POST /memberBenefit/page/get` | 路由已存在，页面仍为静态空表 | 保留现有路由，页面加载改为统一数据服务调用 | Playwright 进入路由后断言会员权益页面、菜单上下文和服务诊断 |
| 列表数据 | 会员权益表格 | 表头为展示名称、权益图标、权益简介、操作；当前目标响应 list 为空，展示暂无数据 | `POST /memberBenefit/page/get`，请求体 `campId/pageNum/pageSize`，响应 `data.total/size/current/pageNum/hasNextPage/pages/list` | 组件硬编码空表 | 新增显式 mock provider、统一响应包、adapter，支持 success/empty/error | Playwright 断言表格数据来自服务层，empty/error 路径可见 |
| 添加弹窗 | 添 加 | 打开 `新增权益` 弹窗 | JS action 为 `CustomerDva/addMemberBenefit`，正式 path 待确认 | 可打开本地弹窗，但无数据服务 | 接入表单状态、校验、上传占位、提交创建业务行 | Playwright 点击后断言弹窗、字段、校验、创建成功反馈 |
| 添加弹窗 | 权益名称 | 必填，最多 8 个字符，空提交显示请输入权益名称 | 新增请求字段 `name` | 本地输入无校验 | 在表单提交前校验并阻止重复提交 | Playwright 空提交和超长输入断言错误文案 |
| 添加弹窗 | 权益图标 | 必传，入口为 `+ 添加图标`，空提交显示请上传权益图标 | 新增请求字段 `logoMediaId/logoMediaUrl` | 只有静态按钮 | 点击后用业务态图标选择反馈承接，保存示例图标字段 | Playwright 点击添加图标后断言图标已选择 |
| 添加弹窗 | 权益简介 | 可选 textarea，占位 `请输入权益简介` | 新增请求字段 `description` | 可输入但不提交 | 提交时写入 mock provider 并刷新表格 | Playwright 创建后断言表格展示简介 |
| 添加弹窗 | 取 消 / 关闭 / Esc | 关闭弹窗并清空表单 | 无请求 | Esc 可关闭，取消可关闭 | 保持关闭并清理错误/提交态 | Playwright 断言弹窗关闭且状态清理 |
| 添加弹窗 | 提 交 | 空提交只显示表单校验；有效提交目标 action 为新增权益 | `POST /memberBenefit/add` 为前端建议 path，正式 path 待后端确认 | 旧按钮无反馈 | 调用 mock provider 创建统一响应包，成功后关闭并刷新列表 | Playwright 创建成功后断言 toast/status 和表格新增行 |
| 表格行 | 编辑 | JS chunk 中行操作为编辑，打开同一弹窗 `编辑权益` | `PUT /memberBenefit/edit` 为前端建议 path，正式 path 待后端确认 | 旧页面无数据行 | success mock 数据下提供编辑入口，保存后更新行 | Playwright 点击编辑、保存并断言行更新 |
| 表格行 | 删除 | JS chunk 中行操作为删除，目标有确认框，失败时提示无法删除 | `DELETE /memberBenefit/delete` 为前端建议 path，正式 path 待后端确认 | 旧页面无数据行 | 提供确认框、取消/确认、删除成功反馈 | Playwright 点击删除、取消、确认并断言反馈 |
| 排序 | 排 序 | 切换为排序态，按钮变为 `保存排序`，显示 `拖动列表项排序` | 无立即请求 | 可切换但无真实列表 | 列表有数据时启用上移/下移排序控制；空列表仍可保存并暴露后端同款错误 | Playwright 点击排序后断言提示、排序控制和保存按钮 |
| 排序 | 保存排序 | 空列表请求 `PUT /memberBenefit/seqs`，请求体 `memberBenefitSeqs: []`，返回 `memberBenefitSeqs:不能为空` | `PUT /memberBenefit/seqs` | 旧实现直接本地 notice | 调用 mock provider，空列表显示明确错误；有数据时保存排序成功 | Playwright empty 与 success 两态断言错误/成功反馈 |
| 状态 | loading | 目标站由 AntD spin 承接加载 | 所有服务调用 | 旧页面无加载态 | 页面加载、提交、排序保存期间显示明确加载和禁用按钮 | Playwright 通过状态断言按钮 disabled 和反馈 |
| 状态 | empty | 目标站显示 AntD `暂无数据` | `memberBenefit/page/get` list 为空 | 旧页面硬编码空态 | empty 来自服务层响应，不在组件硬编码数据 | Playwright `?mockState=empty` 断言空态 |
| 状态 | error | 目标站业务错误通过 message 暴露，排序空数组返回 `memberBenefitSeqs:不能为空` | 统一响应包 code 非 0 或 Hudson success false | 旧页面只有排序错误 notice | 页面展示 alert、重试入口，排序错误保留后端同款文案 | Playwright `?mockState=error` 和空排序断言 |
| 回归 | 浏览器刷新 | 刷新后回到合理初始状态并重新请求数据 | `GET route` + 数据服务 | 旧页面仍可打开 | 从 URL query 初始化 mockState/page/pageSize | Playwright 刷新后断言核心区域存在 |

## 目标站接口摘要

- `POST https://hudson-prod.localhome.cn/memberBenefit/page/get`
  - 请求体：`campId`, `pageNum`, `pageSize`
  - 响应：`success/errorCode/errorMsg/errorDetail/data`
  - `data`：`total`, `size`, `current`, `extraInfo`, `pageNum`, `hasNextPage`, `pages`, `list`
- `PUT https://hudson-prod.localhome.cn/memberBenefit/seqs`
  - 请求体：`campId`, `memberBenefitSeqs: [{ memberBenefitId, seq }]`
  - 空数组响应：`success=false`, `errorCode=COMMON_CONSTRAINT_VIOLATION_ERR`, `errorMsg=memberBenefitSeqs:不能为空`
- `POST https://hudson-prod.localhome.cn/memberCard/page/get`
  - 用于会员卡关联信息，本页目标数据中普通会员 `memberBenefitViews` 为空。

## 后端待确认

- 新增、编辑、删除会员权益的正式 method/path，当前仅从 JS chunk 确认可见 action 名：`addMemberBenefit`、`editMemberBenefit`、`deleteMemberBenefits`。
- 图片上传选择器返回字段是否固定为 `logoMediaId/logoMediaUrl`。
- 删除失败的业务规则与错误码枚举。
