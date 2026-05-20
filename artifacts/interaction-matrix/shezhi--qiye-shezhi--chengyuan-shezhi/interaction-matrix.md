# 成员设置交互矩阵

## 取证基线

- 目标页：`https://minsubao.localhome.cn/setting/member`
- fresh target 取证批次：
  - `artifacts/screenshots/shezhi--qiye-shezhi--chengyuan-shezhi/default-target-20260519-fresh-default-viewport.png`
  - `artifacts/screenshots/shezhi--qiye-shezhi--chengyuan-shezhi/role-dropdown-target-20260519-fresh-role-viewport.png`
  - `artifacts/screenshots/shezhi--qiye-shezhi--chengyuan-shezhi/search-target-20260519-fresh-search-viewport.png`
  - `artifacts/screenshots/shezhi--qiye-shezhi--chengyuan-shezhi/add-target-20260519-fresh-add-viewport.png`
  - `artifacts/network/shezhi--qiye-shezhi--chengyuan-shezhi/default-target-20260519-contract-target-contract-details.json`
  - `artifacts/network/shezhi--qiye-shezhi--chengyuan-shezhi/add-target-20260519-contract-target-contract-details.json`

## 实际交互矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 顶部导航 | 设置一级导航 | 顶部 `设置` 高亮，左侧展开 `企业设置` | 无新增请求 | 已接入 | 保持现有 AppShell 路由高亮与侧栏状态 | Playwright 断言顶部/侧栏高亮 |
| 筛选区 | 搜索输入框 | 输入 `成员` 后列表切为空态 | 列表查询参数 `keyword`，当前目标站未观察到额外请求 | 旧页本地 `useState` 直接切空，无统一契约 | 改为统一 query + provider 过滤，保留即时筛选行为 | Playwright 输入后断言空态和服务契约请求参数 |
| 筛选区 | 角色下拉 | 打开下拉，选项为 `全部/管理员/管家/投资人/保洁员/智住管家/业主/localsAI` | 角色列表源自 `POST /role/camp/get` | 旧页硬编码下拉项 | 用服务层角色数据驱动下拉，组件不再写死选项 | Playwright 打开下拉并断言选项文本 |
| 概览区 | 成员账号数 | 展示 `成员账号数：1/3` | 源自 `POST /campRoles/get` 的 `usedEmployeeNum/employeeNum` | 旧页写死 `1/3` | 从服务层摘要字段渲染，并在新增成员后联动更新 | Playwright 断言默认值和新增后变化 |
| 列表区 | 成员列表表头 | 表头固定为 `姓名/手机号/角色/企微/邮箱/操作` | 源自成员列表契约 | 已有静态表头 | 保持表头，但改为 provider 结果驱动 | Playwright 断言表头 |
| 列表区 | 默认成员行 | 默认仅 1 行：`路客云6TS5 / 18123941382 / - / 点击绑定 / - / 编辑` | 源自 `POST /campRoles/get` | 旧页硬编码单行 | 用服务层成员数组驱动，保留目标站默认首行值 | Playwright 断言默认首行 |
| 列表区 | 企微绑定 | 点击 `点击绑定`，目标站未继续公开承接 | 后续建议 `POST /setting/member/wecom/bind` | 旧页按钮无反馈 | 用 mock 绑定弹层承接，确认后更新为 `已绑定` | Playwright 点击后断言弹层和成功反馈 |
| 列表区 | 编辑 | 点击 `编辑`，目标站未公开二级弹层；任务允许 mock 承接 | 后续建议 `POST /setting/member/upsert` | 旧页按钮无反馈 | 导航到 `/setting/member/actions?mode=edit&userId=...`，表单带默认值 | Playwright 点击后断言 URL 和表单预填 |
| 列表区 | 空态 | 搜索无结果时显示表格空态 `暂无数据` | 过滤后的列表结果 | 旧页只有一行纯文本空态 | 补目标风格空态图标和文案，不展示开发态文案 | Playwright 输入后断言空态 |
| 分页区 | 页码/页尺寸 | 默认显示 `第 1-1 条/共 1 条`、页码 `1`、`20 条/页` | 列表分页结构 | 旧页静态分页 | 服务层输出统一 pagination | Playwright 断言分页文本 |
| 右上主操作 | 添加成员 | 跳转到 `/setting/member/actions` | 添加页 bootstrap 数据来自房型/房间接口 | 已有跳转，但无服务层 | 保持跳转并把 add/edit 共用到统一表单页 | Playwright 点击后断言路由 |
| 添加页 | 成员姓名 | 必填输入框 | 提交参数 `name` | 旧页仅静态输入框 | 增加校验、禁用态和提交反馈 | Playwright 校验必填与成功提交流程 |
| 添加页 | 手机号 | 必填输入框 | 提交参数 `phone` | 旧页仅静态输入框 | 增加手机号校验和提交反馈 | Playwright 校验必填与成功提交流程 |
| 添加页 | 角色下拉 | 打开角色下拉并选择角色 | 角色源自 `POST /role/camp/get` | 旧页未接数据 | 用角色服务数据驱动 | Playwright 打开并选择角色 |
| 添加页 | 房型搜索 | 输入房型关键词过滤房型标签 | 房型源自 `POST /roomCategories/page/get` | 旧页无过滤能力 | 增加即时筛选 | Playwright 输入后断言房型标签过滤 |
| 添加页 | 全选房型 | 全选/取消所有房型 | 房型和房间映射源自 `POST /rooms/get` | 旧页 checkbox 无业务状态 | 改为真实表单状态管理 | Playwright 切换全选并断言选中数量 |
| 添加页 | 房型勾选 | 勾选/取消单个房型 | 同上 | 旧页默认全勾选且无反馈 | 增加表单状态与选中摘要 | Playwright 断言单个切换 |
| 添加页 | 提交 | 目标站未公开完成态；允许 mock 成功承接 | 建议 `POST /setting/member/upsert` | 旧页按钮无反馈 | 提交后返回列表，更新成员行并显示成功反馈 | Playwright 提交后断言列表更新 |
| 添加页 | 取消 | 返回成员列表 | 无请求 | 已有返回 | 保持返回并清理编辑态 | Playwright 点击后断言回到列表 |

## 当前结论

- 目标站结构稳定，当前真实业务主要由成员列表、角色列表、账号配额、房型列表和房间映射组成。
- 本地旧实现主要问题不是布局，而是数据和交互全写死在组件里，没有统一 provider、没有契约节点、没有成功/错误/空态闭环。
- 后续实现以单页统一服务层聚合这些真实接口事实，同时用显式 mock provider 承接未公开的绑定和提交动作。
