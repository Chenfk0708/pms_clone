# 打印设置交互矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 页面入口 | 顶部导航、左侧 `通用设置 > 打印设置` | 进入 `/setting/print` 后顶部 `设置` 和侧栏 `打印设置` 高亮，页面头部默认隐藏 | 无页面专属请求；依赖项目既有 layout 与菜单状态 | 已接入路由和侧栏，但页面仍是静态表单 | 保持现有路由承接，专项测试固定校验顶部和侧栏高亮 | Playwright 进入 `/setting/print` 后断言顶部/侧栏高亮和 `.page-header` 隐藏 |
| 页面加载 | 页面首屏 | 展示 `住宿打印`、`收款账单` 两个配置分区，无列表、无图表 | `GET/POST /setting/print/bootstrap`（本轮前端契约草案） | 当前组件直接写死表单初值，无统一服务层 | 新增统一服务层，首屏通过显式 `mock/api` provider 返回配置视图模型 | Playwright 断言 contract 节点、两个分区标题和默认值 |
| 住宿打印 | `打印纸张` 单选组 | 可在 `小票（80mm）/小票（58mm）/A4` 之间切换 | `POST /setting/print/save`，请求体包含 `section=stay`、`paperType` | 仅本地组件状态切换，无保存反馈 | 将切换状态收敛为页面草稿，保存时提交统一请求体并显示成功/失败反馈 | Playwright 切换纸张后点击保存，断言反馈文案与 contract 请求 |
| 住宿打印 | `选择单据` 下拉 | 打开后可见 3 个候选项：`消费明细账单（短租）`、`住宿登记账单（短租）`、`消费明细账单（长租）` | `GET/POST /setting/print/bootstrap` 返回单据选项；保存复用 `POST /setting/print/save` | 当前是静态按钮，不可展开也不可切换选项 | 改为可展开的业务下拉，消费服务层选项数组并更新草稿状态 | Playwright 打开下拉，断言 3 个选项，选择新值后保存并验证更新 |
| 住宿打印 | `自定义提示文案` 输入框 | 支持编辑，默认值为 target 取证文案 | `POST /setting/print/save`，请求体包含 `section=stay`、`customText` | 可输入，但没有保存闭环 | 接入统一保存动作，提交中禁用按钮，保存成功后提示业务反馈 | Playwright 输入新文案并保存，断言 loading/成功反馈 |
| 住宿打印 | `保 存` | 可点击提交当前住宿打印配置 | `POST /setting/print/save` | 仅展示按钮，无真实反馈 | 增加保存中的 disabled/loading、成功 toast/状态条、失败重试入口 | Playwright 点击后断言按钮禁用与反馈文本 |
| 收款账单 | `选择单据` | 默认显示 `收款账单`，未取证到更多候选项 | `GET/POST /setting/print/bootstrap` 返回收款账单配置；若后端存在多选项待确认 | 当前是静态按钮 | 先按单选项配置建模；接口文档标注“候选项待后端确认” | Playwright 断言默认值与保存请求体 |
| 收款账单 | `打印纸张` 单选组 | 默认可选 `小票（80mm）/小票（58mm）/A4`，target 默认选中 `A4` | `POST /setting/print/save`，请求体包含 `section=receipt`、`paperType` | 仅本地组件状态切换 | 与住宿打印共享服务层模型，但分区独立保存 | Playwright 切换到 `小票（58mm）` 后保存，断言请求和反馈 |
| 收款账单 | `自定义提示文案` 输入框 | 默认空值，可输入提示文案 | `POST /setting/print/save`，请求体包含 `section=receipt`、`customText` | 可输入，无反馈 | 接入统一草稿状态和保存反馈 | Playwright 输入文案并保存，断言成功反馈 |
| 收款账单 | `保 存` | 可点击提交当前收款账单配置 | `POST /setting/print/save` | 仅展示按钮，无提交状态 | 增加 loading、成功、失败和禁用态闭环 | Playwright 点击后断言按钮禁用与反馈文本 |
| 页面异常 | 首屏错误态 | target 未取证到；按前端契约需清晰暴露错误并允许重试 | `GET/POST /setting/print/bootstrap` 返回统一错误响应包 | 当前没有错误态 | 增加业务错误卡片和 `重新加载` 入口，不做静默 fallback | Playwright 通过 `mockState=error` 断言错误态和重试 |
| 页面异常 | 空态 | target 未取证到；按业务语境可展示“尚未配置打印模板” | `GET/POST /setting/print/bootstrap` 返回空态响应包 | 当前没有空态 | 增加空态卡片和 `应用默认模板` 承接，接口文档标注待后端确认 | Playwright 通过 `mockState=empty` 断言空态与恢复默认动作 |
| 取证脚本 | clone 采集入口 | 应明确连接当前本地验证实例，不得默认回落历史 `:4173` | `PMS_LOCAL_URL` 或 `PMS_TEST_BASE_URL` | 当前脚本默认回落 `http://127.0.0.1:4173/setting/print` | 改为必须显式提供本地 URL，避免生成错误 clone 证据 | 负向命令不传本地 URL 时显式失败；传入 preview URL 时成功采集 |
