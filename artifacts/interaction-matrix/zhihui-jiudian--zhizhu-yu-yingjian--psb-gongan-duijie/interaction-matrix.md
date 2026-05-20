# PSB 公安对接交互矩阵

任务 ID：`zhihui-jiudian--zhizhu-yu-yingjian--psb-gongan-duijie`

目标路径：`/psb/list`

目标站取证批次：`default-target-20260519083243-*`、`primary-action-target-20260519083243-*`

本地服务层：`src/services/psbPolice.ts`，默认 `mock` provider，通过 query `mockState=success|empty|error` 或本地 provider 配置切换三态。

| 区域 | 元素/按钮 | 目标站行为 | 触发的数据服务/契约 | 本地改造要求 | 验收方式 |
| --- | --- | --- | --- | --- | --- |
| 页面入口 | 顶栏“智慧酒店”、侧栏“PSB公安对接” | 进入 `/psb/list` 后保持高亮 | 无新增请求 | 维持现有壳层路由和高亮，不改导航归属 | Playwright 断言顶部和侧栏高亮 |
| 首屏加载 | 页面初始化 | 目标站首屏为空表，未出现搜索区和额外筛选 | `POST /account/roomPoliceSubmission/page/get` | 首屏通过服务层加载列表，加载中要有明确状态文本，不伪装成已有数据 | 断言 `role=status` 和加载完成后的表格 |
| 列表表头 | 7 列表头 | 显示：`登记系统/机构`、`酒店旅业编码/ID`、`类型`、`商户名称`、`关联门店`、`关联房间数`、`操作` | 列表契约字段适配 | 表头文案和结构保持与目标站一致 | Playwright 逐列断言 |
| 默认空态 | 表格空态 | 目标站列表为空，正文显示空态 | 列表接口返回 `total=0,list=[]` | 默认 `success` 也允许返回真实贴近的空态；文案不出现“mock 数据” | 断言空态文案和无数据行 |
| 错误态 | 列表加载失败 | 目标站未显式取证到错误 UI | 本地 mock `error` | 明确展示 `role=alert`、失败原因和“重新加载”按钮；不静默 fallback | `?mockState=error` 后断言错误块和重试 |
| 重试 | “重新加载” | 目标站未取证 | 再次请求列表接口 | 清空错误并重新进入默认成功态 | 点击后 URL/DOM 回到正常表格 |
| 新增入口 | “新增” | 打开新增弹窗 | 无请求或仅打开弹窗 | 保持主按钮位置和文案，打开弹窗前不预填无关提示 | 点击后断言 dialog 可见 |
| 新增弹窗 | 标题“新增” | 展示表单弹窗 | 打开后拉取门店选项；房型可并行预取供本地扩展校验 | 弹窗结构、字段顺序、文案与目标站一致 | 断言标题、字段、底部按钮 |
| 默认字段 | `登记系统/机构` | 默认显示 `广东旅业系统` | 本地常量字段 | 固定展示且不可编辑 | 断言按钮文案 |
| 门店下拉 | `选择门店` | 目标站弹窗有门店选择 | `POST /select/poi/page/get` | 打开弹窗时加载门店列表；有 loading 和失败反馈 | 打开下拉后断言门店选项出现 |
| 门店选项 | 门店列表项 | 可选择门店 | 门店选项契约 `poiId/poiName` | 选择后回填按钮文案并写入提交参数 | 选择后断言按钮文案变更 |
| 房型数据 | 关联房型辅助数据 | 目标站当前弹窗未直接展示房型控件 | `POST /roomCategories/page/get` | 服务层保留房型请求，用于 success 示例数据和“关联房间数”扩展，不强行出现在当前表单 UI | 服务层契约和测试覆盖请求摘要 |
| 必填校验 | “确定”前校验 | 目标站未抓到提交结果 | 本地表单校验 | 缺字段时逐项暴露校验，不吞错，不假成功 | 不填提交后断言校验消息 |
| 提交成功 | “确定” | 目标站未抓到真实提交接口 | 本地统一响应包 success | 成功后关闭弹窗、提示成功、刷新列表；success 场景允许插入 1 条本地示例记录以验证非空态 | 填完整表单后断言成功反馈和新行 |
| 提交失败 | “确定” | 目标站未抓到真实提交接口 | 本地统一响应包 error | 明确展示失败状态，保留表单内容，允许重试 | 失败模式下断言错误提示 |
| 取消关闭 | “取消”/关闭图标 | 关闭弹窗 | 无请求 | 关闭时清理临时提示和校验状态，不污染下一次打开 | 打开后关闭再重开，断言状态已重置 |
| 成功列表态 | 新增后的表格 | 目标站默认无真实数据行 | 本地 success 示例 | 在不改变默认空态贴近性的前提下，支持通过成功提交流程得到至少 1 行业务数据 | 断言新行展示商户名称、门店、房间数 |
| 行操作 | 表格“操作”列 | 目标站默认空表未取证 | 本地草案：查看/删除 | 仅在本地 success 行出现；查看展示摘要，删除给出显式确认、取消和确认删除反馈 | Playwright 覆盖 success 行查看、删除确认、取消删除和确认删除 |
| 数据服务诊断 | 隐藏契约摘要节点 | 目标站无此节点 | 列表/门店/房型/provider/traceId/requestSummary | 页面保留视觉隐藏的诊断节点供自动化断言，不在正文暴露开发态文案 | 通过 `aria-label` 读取契约摘要 |

## 验收补充

- 目标站真实取证文件：
  - `artifacts/network/zhihui-jiudian--zhizhu-yu-yingjian--psb-gongan-duijie/default-target-20260519083243-responses.json`
  - `artifacts/network/zhihui-jiudian--zhizhu-yu-yingjian--psb-gongan-duijie/20260519-contract-target-contract-details.json`
  - `artifacts/dom-snapshots/zhihui-jiudian--zhizhu-yu-yingjian--psb-gongan-duijie/primary-action-target-20260519083243-page.html`
  - `artifacts/style-dumps/zhihui-jiudian--zhizhu-yu-yingjian--psb-gongan-duijie/primary-action-target-20260519083243-facts.json`
- 本地专项测试目标：
  - 默认加载
  - 新增弹窗打开/关闭
  - 必填校验
  - 成功提交流程
  - success 行查看详情与删除确认
  - 空态
  - 错误态与重试
- 本地 fresh clone 取证批次：
  - `default-clone-20260519-local-audit-*`
  - `primary-action-clone-20260519-local-audit-*`
  - `default-clone-20260520-preview-audit-*`
  - `primary-action-clone-20260520-preview-audit-*`
