# 客户列表交互矩阵

- 任务 ID：`scrm--kehu-guanli--kehu-liebiao`
- 页面：客户列表
- 目标 URL：`https://minsubao.localhome.cn/customer/list`
- 本地入口：`/customer/list`
- 固定 Chrome 取证批次：`20260518-95-provider-target`、`20260518-95-contract-target`
- 关键目标接口：`POST https://hudson-prod.localhome.cn/member/page/get`
- 目标接口默认请求体：`campId/pageNum/pageSize/current/memberSearchType/breakTemp/memberTagIds`
- 目标接口响应包：`success/errorCode/errorMsg/errorDetail/data`，其中 `data.total/size/current/pageNum/hasNextPage/pages/list`

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口与导航 | 顶部 SCRM、侧栏客户管理/客户列表 | URL 保持 `/customer/list`，SCRM 顶栏高亮，侧栏客户管理展开且客户列表高亮 | 无页面业务请求，依赖项目路由和 AppShell | 已接入 `/customer/list` 与 SCRM 侧栏 | 保持现有路由，不修改 AppShell | Playwright 断言 SCRM 顶栏和客户列表侧栏高亮 |
| 顶部筛选 | 客户搜索：手机号 + 输入框 | 默认以手机号搜索；查询后刷新客户列表 | `member/page/get`，字段 `memberSearchType=mobile`，关键词字段待后端确认，本轮契约使用 `keyword` | 输入只改组件本地 state，不触发数据服务 | 接入 `fetchCustomerListDashboard()`，查询时传入 `keyword/memberSearchType` | Playwright 输入手机号后断言隐藏契约节点和表格刷新 |
| 顶部筛选 | 客户状态 | 下拉选择后作为筛选条件参与查询 | 目标首屏未触发状态字段；本轮契约保留 `memberStatus` 待确认 | 只显示下拉选项，不影响列表 | provider 消费 `status`，支持 success/empty/error | Playwright 选择冻结或黑名单后出现业务空态 |
| 顶部筛选 | 客户身份 | 下拉选择后作为筛选条件参与查询 | 目标首屏未触发身份字段；本轮契约保留 `memberIdentity` 待确认 | 只显示下拉选项，不影响列表 | provider 消费 `identity` 并刷新指标和列表 | Playwright 选择会员客户后断言列表仍由服务层驱动 |
| 高级筛选 | 展开/收起 | 展开显示会员等级、企微、性别、年龄、时间、金额区间等条件；收起隐藏 | 高级字段随查询进入同一列表请求体 | 已可展开，但高级输入未接入数据层 | 将高级条件纳入 `CustomerListQuery` 和请求体构造 | Playwright 展开后断言高级控件存在，查询后契约参数变化 |
| 查询动作 | 查 询 | 显示加载态，按当前筛选刷新列表 | `POST /member/page/get` | 仅关闭下拉，无加载或数据刷新 | 查询时调用服务；按钮 loading/disabled；错误清晰展示 | Playwright 点击后断言 loading、契约请求体、UI 更新 |
| 查询动作 | 重 置 | 清空筛选并重新拉取默认列表 | `POST /member/page/get` 默认请求体 | 清空本地 state，但不重新拉取数据 | 重置后恢复默认 query 并调用服务 | Playwright 断言关键词清空、数据恢复、契约参数恢复 |
| 工具栏 | 导出数据 | 目标站可见导出入口；生成导出任务反馈 | 本轮契约建议 `POST /member/export/create`，请求体复用当前查询 | 只显示静态 notice | 调用 `createCustomerListExport()`，显示业务态任务反馈 | Playwright 点击后断言导出任务提示和当前请求体 |
| 工具栏 | 添加客户 | 打开添加客户弹窗，保存/取消/关闭可操作 | 本轮契约建议 `POST /member/save`；目标站弹窗字段含手机号、姓名、性别、生日、地区、渠道、成为客户时间等 | 弹窗可打开关闭，保存无业务反馈 | 保存走服务层模拟成功，空手机号显示校验错误，取消/关闭可关闭 | Playwright 覆盖打开、校验、保存成功、关闭 |
| 表格 | 全选/行选择 | 勾选客户，用于批量操作 | 无立即请求 | checkbox 无反馈 | 显示已选择数量，并驱动更多批量反馈 | Playwright 勾选后断言已选择数量 |
| 表格 | 分页 | 切换页码刷新列表 | `member/page/get`，字段 `pageNum/pageSize/current` | 页码按钮静态无刷新 | 页码和 pageSize 改为服务层参数 | Playwright 点击下一页后断言页码、契约参数和数据变化 |
| 表格 | 详情 | 打开客户详情或客户资料承接 | 目标取证可见详情按钮；本轮用详情抽屉承接，不硬编码不存在路由 | 只显示 notice | 打开客户详情抽屉，展示来源于适配后业务模型的基础信息、消费指标、标签 | Playwright 点击首行详情后断言抽屉与客户字段 |
| 表格 | 更多 | 打开更多操作菜单 | 后续可承接打标签、跟进记录、加入黑名单等接口 | 只显示 notice | 打开更多菜单，提供打标签、记录跟进、加入黑名单业务反馈 | Playwright 点击更多和菜单项后断言 toast/反馈 |
| 状态反馈 | loading/empty/error/disabled | 目标首屏有接口 loading；空列表展示表格空态；接口失败需暴露 | mock provider 支持 `success/empty/error` 三态 | 旧页面无服务错误态和空态 | 增加场景开关，错误态有重试入口，空态不崩溃 | Playwright 用 localStorage 场景覆盖 success/empty/error/retry |
| 跨页入口 | 客户标签、批量加好友、客户营销快捷入口 | 使用项目已有路由承接 | 已存在 `/customer/tag`、`/customer/addBatch`、`/scrm/marketing/customer` | 客户列表正文无快捷入口 | 在详情/更多中只使用已有路由或抽屉承接，不新增不存在路径 | Playwright 断言快捷入口可到已有路由或打开抽屉 |

## 后端待确认

- `member/page/get` 正式筛选字段中，手机号/姓名/客户编号关键词字段名需后端确认；本轮契约草案使用 `keyword` 与目标已确认的 `memberSearchType=mobile`。
- 客户状态、客户身份、是否加企微、性别、年龄、时间范围和金额范围是否均由同一 `member/page/get` 承接，需要后端确认字段名与枚举。
- 添加客户、导出客户、详情读取、打标签和跟进记录的正式 path、权限、幂等规则和错误码需联调确认。
