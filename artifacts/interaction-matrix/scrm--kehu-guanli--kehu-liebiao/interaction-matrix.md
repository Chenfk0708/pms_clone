# 客户列表交互矩阵

- 任务 ID：`scrm--kehu-guanli--kehu-liebiao`
- 页面：客户列表
- 目标 URL：`https://minsubao.localhome.cn/customer/list`
- 本地入口：`/customer/list`
- 当前本地取证批次：`20260519-95-local-final`
- 目标站关键接口：`POST https://hudson-prod.localhome.cn/member/page/get`
- 目标站默认请求体：`campId/pageNum/pageSize/current/memberSearchType/breakTemp/memberTagIds`
- 目标站响应包：`success/errorCode/errorMsg/errorDetail/data`
- 本地服务层：`src/services/customerList.ts`

| 区域 | 元素/按钮 | 目标站行为 | 本地当前结果 | 数据服务 / 契约 | 验收方式 |
| --- | --- | --- | --- | --- | --- |
| 入口与导航 | `SCRM` 顶部高亮、`客户管理 > 客户列表` 侧栏高亮 | 从项目导航进入客户列表 | 已接入 `/customer/list`，顶部与侧栏高亮保持一致 | 路由定义在 `src/App.tsx`，页面组件为 `CustomerListPage` | Playwright 首屏断言导航高亮；页面截图 `default-clone-20260519-95-local-final.png` |
| 顶部筛选 | 搜索类型下拉 + 关键字输入 | 按手机号/姓名/客户编号查询列表 | 查询提交后触发统一服务层，`memberSearchType/keyword` 进入请求体并刷新列表 | `createCustomerListRequestBody()` -> `fetchCustomerListDashboard()` | `tests/customer-list.spec.ts` 断言契约节点包含 `memberSearchType/keyword` |
| 顶部筛选 | 客户状态 | 作为列表筛选条件 | 已接入 `memberStatus`；`NORMAL/FROZEN/BLACKLIST` 由 mock provider 消费并返回不同结果 | `CustomerListQuery.status` -> `requestBody.memberStatus` | Playwright 查询后断言契约字段变化 |
| 顶部筛选 | 客户身份 | 作为列表筛选条件 | 已接入 `memberIdentity`；`MEMBER/WECHAT/CHANNEL` 由 mock provider 消费 | `CustomerListQuery.identity` -> `requestBody.memberIdentity` | 源码 + 契约节点验证 |
| 高级筛选 | 展开/收起 | 显示更多筛选条件 | 已实现展开/收起，展示会员等级、企微、性别、年龄、日期、金额区间 | 页面草稿态 `draft` 完整映射到 `CustomerListQuery` | 本地截图 `expanded-clone-20260519-95-local-final.png` |
| 高级筛选 | 会员等级 | 作为列表筛选条件 | 已接入 `memberCardId` 并消费 | `requestBody.memberCardId` | Playwright 查询后断言契约字段变化 |
| 高级筛选 | 是否添加企微 | 作为列表筛选条件 | 已接入 `isJoinWxCp`，`JOINED/NOT_JOINED` 会过滤列表 | `wechatState` -> `isJoinWxCp` | Playwright 断言 `isJoinWxCp:1` 且列表排除不匹配客户 |
| 高级筛选 | 性别 / 年龄 | 作为列表筛选条件 | 已接入 mock provider 过滤逻辑 | `gender/ageRange` 进入请求体并被 provider 消费 | 源码审计 `filterCustomers()` |
| 高级筛选 | 成为客户/会员/最近跟进/最近消费时间 | 时间范围筛选 | 已接入时间区间过滤逻辑 | `firstMember* / firstMemberCard* / lastFollow* / lastConsume*` | 源码审计 `matchesDateRange()` |
| 高级筛选 | 最近消费金额 / 累计消费金额 / 客单价 | 金额区间筛选 | 已接入金额过滤；非数字参数会清晰暴露错误 | `lastConsume* / totalConsume* / avgConsume*` | Playwright 非法参数断言错误提示 |
| 查询动作 | `查询` | 按当前筛选刷新列表 | 查询期间按钮 disabled，页面显示 loading，成功后列表刷新 | `fetchCustomerListDashboard(query)` | Playwright 覆盖查询、loading 和契约变更 |
| 查询动作 | `重置` | 恢复默认筛选并刷新 | 已恢复默认查询参数，显示状态提示 | `createDefaultCustomerListQuery()` | Playwright 查询后重置断言可补充；当前由源码与页面提示证明 |
| 工具栏 | `客户标签` | 跳转客户标签页 | 已跳转 `/customer/tag` | 项目既有路由承接 | Playwright 断言 URL 跳转 |
| 工具栏 | `批量加好友` | 跳转批量加好友页 | 已跳转 `/customer/addBatch` | 项目既有路由承接 | Playwright 断言 URL 跳转 |
| 工具栏 | `导出数据` | 创建导出任务 | 已给出任务创建反馈，不静默成功 | `createCustomerListExport()`，契约 path：`/member/export/create` | Playwright 断言状态提示 |
| 工具栏 | `添加客户` | 打开新增客户弹窗 | 已打开弹窗，支持校验、保存成功、关闭 | `saveCustomer()`，契约 path：`/member/save` | 截图 `add-customer-clone-20260519-95-local-final.png` + Playwright |
| 表格 | 全选 / 行选择 | 选择客户用于批量操作 | 已反馈已选客户数量 | 仅更新页面选择态，不引入假接口 | Playwright 勾选后断言 `role=status` |
| 表格 | 详情 | 打开客户详情 | 已使用详情抽屉承接，无伪造不存在路由 | 消费适配后的 `CustomerRecord` | Playwright 断言抽屉内容 |
| 表格 | 更多 | 打开更多操作菜单 | 已提供打标签、记录跟进、重点关注反馈 | 页面级业务反馈闭环 | Playwright 断言菜单与状态提示 |
| 表格 | 分页 / 下一页 / 页容量展示 | 切换页码刷新列表 | 已接入 `pageNum/pageSize/current`，页码切换触发服务层 | `pagination` 由统一数据层返回 | 契约节点与页面分页文案 |
| 状态反馈 | loading | 首屏或查询中显示加载态 | 已实现 | `loading` state | `tests/customer-list.spec.ts` |
| 状态反馈 | empty | 空数据场景 | 已实现，不塌陷表格结构 | `scenario=empty` | `tests/customer-list.spec.ts` |
| 状态反馈 | error / retry | 接口失败与重试 | 已实现错误提示与重试入口 | `scenario=error` | `tests/customer-list.spec.ts` |
| 状态反馈 | 非法参数 | 参数不合法时清晰暴露 | 已实现金额参数校验错误 | `validateCustomerListQuery()` | `tests/customer-list.spec.ts` |

## 取证产物

- 本地截图：`artifacts/screenshots/scrm--kehu-guanli--kehu-liebiao/`
- 本地 DOM：`artifacts/dom-snapshots/scrm--kehu-guanli--kehu-liebiao/default-clone-20260519-95-local-final.html`
- 本地样式 / 事实：`artifacts/style-dumps/scrm--kehu-guanli--kehu-liebiao/default-clone-20260519-95-local-final.json`
- 本地网络：`artifacts/network/scrm--kehu-guanli--kehu-liebiao/default-clone-20260519-95-local-final.json`
- 目标站契约：`artifacts/network/scrm--kehu-guanli--kehu-liebiao/contract-target-20260518-95-contract-target.json`
- 目标站完整样本：`artifacts/network/scrm--kehu-guanli--kehu-liebiao/member-page-full-target-20260518-95-contract.json`

## 后端待确认

- `member/page/get` 中 `memberStatus/memberIdentity/gender/ageRange` 的正式枚举值。
- 金额筛选字段是否按“元”透传还是需要换算为“分”。
- 导出任务正式 path、异步任务中心规则与错误码。
- 新增客户正式 path、必填字段、手机号去重规则。
