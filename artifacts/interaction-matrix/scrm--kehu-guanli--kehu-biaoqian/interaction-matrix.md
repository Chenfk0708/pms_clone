# 客户标签交互矩阵

任务：`scrm--kehu-guanli--kehu-biaoqian`  
页面：SCRM > 客户管理 > 客户标签  
本地路由：`/customer/tag`  
取证日期：2026-05-19

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口与导航 | SCRM > 客户管理 > 客户标签 | 目标站可进入 `/customer/tag`，SCRM 与客户标签菜单高亮 | 首屏触发 `memberTagGroup/page/get`，并伴随菜单、门店、企微账号等支撑请求 | 路由 `/customer/tag` 已接入 `CustomerTagPage`，菜单高亮由现有 AppShell 承接 | 复用项目现有路由与菜单，不新增全局壳层 | `tests/customer-tag.spec.ts` 断言 SCRM 与客户标签 link 为 `is-active` |
| 顶部筛选 | 标签组输入框 | 目标站存在标签名称/标签组相关筛选，查询后请求列表接口 | `buildCustomerTagRequestBody()` 生成 `campId/tagGroupName/pageNum/pageSize` | 输入框可编辑，查询后刷新服务层数据并回显 requestEcho | 从组件静态数据改为调用 `loadCustomerTagData()` | Playwright 填写“会员”后断言服务契约包含 `"keyword":"会员"` |
| 顶部筛选 | 查询 | 目标站点击查询重新拉取列表 | `POST /memberTagGroup/page/get` | 点击后显示“查询已更新”，按钮 loading 期间禁用 | 接入服务层筛选参数，重置页码为 1 | Playwright 点击查询并断言状态反馈 |
| 顶部筛选 | 重置 | 目标站点击重置恢复筛选并重新查询 | `POST /memberTagGroup/page/get`，空 `tagGroupName` | 清空输入框，恢复默认 `campId/page/pageSize` | 复用 `defaultCustomerTagFilters` | Playwright 断言输入框清空和“筛选已重置” |
| 指标卡片 | 标签组数、标签数量、覆盖客户、同步中 | 目标站当前真实列表为空，但保留列表和分页结构 | 来自列表响应聚合或后端 summary | 使用 mock provider 业务数据驱动，点击为按钮态 | 服务层 `summary` 聚合，不在组件硬编码 | Playwright 断言“标签组数”和数值 `18` |
| 工具栏 | 刷新 | 目标站刷新当前列表 | `POST /memberTagGroup/page/get` | 点击后按钮短暂禁用，状态显示“数据已刷新” | 使用当前 filters 重新请求服务层 | Playwright 点击刷新并断言按钮 disabled 与状态反馈 |
| 工具栏 | 导出 | 目标站是否有导出接口待确认 | 预留 `memberTagGroup/export` | 点击后创建业务态导出任务反馈 | 不写假下载，不吞错误；文档列为后端待确认 | Playwright 断言“导出任务已创建” |
| 工具栏 | 同步企微标签 | 目标站点击同步企微标签会弹出企微授权/账号相关交互 | 目标站已取证 `POST /wxCpOpen/accounts/get`，请求体含 `campId/isValidKfAndCustomerAuth` | 打开确认弹窗，确认后显示同步任务提交反馈 | 使用 `customerTagSyncEndpoint` 作为契约占位 | Playwright 打开弹窗并确认，断言反馈文本 |
| 工具栏 | 新建标签组 | 目标站点击新建打开新增标签组弹窗 | 正式保存 path 待确认，当前占位 `memberTagGroup/save` | 打开弹窗，标签组名称与标签输入完整，确定按钮有 disabled 状态 | 新增本地可操作弹窗和保存反馈 | Playwright 填写名称、添加标签、提交并断言反馈 |
| 表格 | 标签组列表 | 目标站接口返回空 `list`，表头与空态可见 | `memberTagGroup/page/get` | 展示业务 mock 行：高价值住客、会员关怀、企微同步标签 | mock provider 按后端分页包返回，页面只消费 adapter 模型 | Playwright 断言表头、业务行、分页文案 |
| 表格 | 查看详情 | 目标站详情承接方式未完全明确 | 未来可接详情接口或复用列表行字段 | 点击“查看”打开标签组详情弹窗 | 用 mock 详情弹窗承接跨页不确定性 | Playwright 点击第一行查看并关闭弹窗 |
| 空态 | `customerTagMockState=empty` | 目标站取证列表返回 `total:0/list:[]` | 同一响应包 `code:0` + 空 list | 展示“当前条件下没有客户标签”和“清空筛选” | 服务层支持 empty 状态，不用静默 fallback | Playwright 空态用例断言空态文案；截图 `default-clone-20260519-business-provider-empty-valid.png` |
| 错误态 | `customerTagMockState=error` | 目标站错误格式需后端确认 | 同一响应包 `code:503` | 展示错误 alert 与“重试”，重试恢复成功态 | 明确抛出 `CustomerTagServiceError`，页面显示错误 | Playwright 错误态用例断言 alert、重试后恢复成功；截图 `default-clone-20260519-business-provider-error-valid.png` |
| 快捷入口 | 查看客户列表 | 目标站侧栏存在客户列表入口 | 跳转 `/customer/list` | 点击导航到项目已有路由 | 复用现有路由，不硬编码不存在页面 | Playwright 覆盖按钮可见；人工可从本地页面点击确认 |
| 快捷入口 | 会员等级 | 目标站 SCRM 会员中心存在等级页面 | 跳转 `/scrm/memberCenter/level` | 点击导航到项目已有路由 | 复用现有路由 | Playwright 覆盖按钮可见；路由在 `src/App.tsx` 已存在 |
| 快捷入口 | 客户营销 | 目标站营销推广承接客户运营 | 跳转 `/scrm/marketing/customer` | 点击导航到项目已有路由 | 复用现有路由 | Playwright 覆盖按钮可见；路由在项目内已有承接 |
| 取证 | 目标站网络 | 固定 Chrome + storage state 可访问，未登录阻塞 | 关键请求：`memberTagGroup/page/get`、`wxCpOpen/accounts/get` | 已保存 target DOM、style、network、截图 | 网络产物已脱敏，保留 URL/method/body/响应结构 | `artifacts/network/scrm--kehu-guanli--kehu-biaoqian/default-target-20260519-business-provider-target.json` |
| 取证 | 本地成功/空态/错误态 | 不适用 | mock provider，不请求 Hudson | 成功、空态、错误态均有截图、DOM、style、network 证据 | 修正旧空白 empty/error 取证，新增 `*-valid` 批次 | `artifacts/screenshots/scrm--kehu-guanli--kehu-biaoqian/` 下对应截图 |
