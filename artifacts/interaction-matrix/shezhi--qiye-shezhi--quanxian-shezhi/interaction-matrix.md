# 权限设置交互矩阵

- 任务 ID：`shezhi--qiye-shezhi--quanxian-shezhi`
- 页面名称：`权限设置`
- 目标地址：`https://minsubao.localhome.cn/setting/role`
- 本地路由：`/setting/role`
- 取证来源：
  - `artifacts/dom-snapshots/shezhi--qiye-shezhi--quanxian-shezhi/*.html`
  - `artifacts/style-dumps/shezhi--qiye-shezhi--quanxian-shezhi/*-facts.json`
  - `artifacts/network/shezhi--qiye-shezhi--quanxian-shezhi/*-responses.json`

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 页面入口 | 顶部导航 `设置`、侧边栏 `权限设置` | 页面可从项目既有导航进入，菜单高亮正确 | 路由 `/setting/role` | 已存在，但页面内部还是静态壳 | 保持现有路由和导航结构，仅改造页面内容 | Playwright 断言顶部与侧边高亮 |
| 左侧角色区 | 搜索框 `请输入名称` | 按名称过滤角色列表 | `POST /role/camp/get`，请求体至少包含 `campId` 与关键词 | 仅展示输入框，不驱动数据 | 接入角色列表查询参数，输入后点击角色仍基于服务结果渲染 | Playwright 输入关键词后断言角色列表变化与服务摘要变化 |
| 左侧角色区 | 角色按钮 `管理员/管家/投资人/...` | 点击某角色后展示权限详情 | `POST /roleAuthority/camp/get`，请求体至少包含角色标识 | 目前只切换本地静态详情 | 改为按选中角色异步加载详情，包含 loading、成功、失败 | Playwright 点击角色后断言详情标题、矩阵与服务摘要 |
| 左侧角色区 | `新增角色` | 打开新增角色弹窗 | 打开弹窗本身不一定触发远程请求；保存动作需落到统一服务层 | 仅打开静态弹窗，确认后无业务反馈 | 新增 mock CRUD：校验、保存成功提示、列表追加、自动选中新角色 | Playwright 断言校验文案、成功反馈、新角色出现 |
| 弹窗 | `角色名称（必填）`、`描述`、`取 消`、`确 定` | 可录入角色基本信息并关闭/提交 | 本轮本地服务定义 `createRole` 契约，后续可切 `api` provider | 当前无校验、无提交结果 | 增加必填校验、重复名校验、成功提示、取消关闭 | Playwright 覆盖空提交、有效提交、取消 |
| 详情区 | 空态 `请选择角色` | 未选角色时展示空态 | 无详情请求 | 已有空态 | 保留，但由服务驱动列表状态 | Playwright 默认进入页断言空态 |
| 详情区 | 标题 + 副文案 `请为角色设置权限` | 展示当前角色上下文 | `POST /roleAuthority/camp/get` 响应体 | 当前为静态文案 | 改为消费适配后的详情模型 | Playwright 断言标题与副文案 |
| 详情区 | `编辑角色名称` | 打开编辑弹窗并提交角色基本信息 | 本轮本地服务定义 `renameRole` 契约 | 当前按钮无真实行为 | 复用表单弹窗，提交后更新左侧列表与详情标题 | Playwright 断言编辑成功后名称更新 |
| 详情区 | `删除角色` | 打开确认弹窗，确认后移除角色 | 本轮本地服务定义 `deleteRole` 契约 | 当前按钮无真实行为 | 增加确认层、删除成功反馈、回退到空态或下一个角色 | Playwright 断言确认与取消两条路径 |
| 权限矩阵 | 表头 `模块/页面`、`权限` 与权限标签 | 根据选中角色展示权限矩阵 | `POST /roleAuthority/camp/get` 返回的权限结构 | 当前写死在组件中 | 改为由服务层适配出的业务模型渲染 | Playwright 断言核心模块与权限标签存在 |
| 状态反馈 | 列表加载/详情加载 | 页面应有明确 loading | 角色列表与详情查询 | 当前无显式加载态 | 增加列表与详情 loading 占位 | Playwright 断言 loading 文案出现后消失 |
| 状态反馈 | 列表空态 | 当角色列表为空时保留页面结构不崩 | `mockState=empty` | 当前无独立列表空态 | 增加空列表提示与禁用详情区 | Playwright 断言空态列表提示 |
| 状态反馈 | 列表错误/详情错误 | 显示错误原因与重试入口 | `mockState=error` 或 `detailMockState=error` | 当前无错误态 | 增加 alert + retry | Playwright 断言错误提示与重试按钮 |
| 验证锚点 | 服务契约诊断 | 用于断言 provider、endpoint、请求参数、traceId | 角色列表与详情服务摘要 | 当前没有 | 提供测试可读但页面正文不可见的诊断节点 | Playwright 读取 `data-testid` 断言 |

## 已确认的目标证据

- 旧网络证据显示目标页首屏会命中：`POST https://hudson-prod.localhome.cn/role/camp/get`
- 旧网络证据显示点击角色后会追加命中：`POST https://hudson-prod.localhome.cn/roleAuthority/camp/get`
- 旧 DOM/样式证据显示目标页至少包含以下真实文本：
  - `店铺角色`
  - `请输入名称`
  - `新增角色`
  - `请选择角色`
  - `请为角色设置权限`
  - `编辑角色名称`
  - `删除角色`
  - `模块/页面`
  - `权限`

## 当前待确认项

- `POST /role/camp/get` 的完整请求体字段与分页约束
- `POST /roleAuthority/camp/get` 的完整请求体字段命名
- 真实后端对新增、编辑、删除角色是否已有接口，以及接口路径和权限校验要求
- 角色详情是否默认选中首项，还是首屏保持空态

## 本轮落地约束

- 页面正文不直接暴露 `mock`、`未接入后端` 等开发态文案
- 所有可见按钮都必须有真实反馈，不允许静默无响应
- 统一由 `services` 层处理请求体、响应包、字段适配、错误信息与 provider 切换
