# 收入/支出设置交互矩阵

- 任务 ID：`shezhi--tongyong-shezhi--shouru-zhichu-shezhi`
- 页面路由：`/setting/expendSetting`
- 目标页面：`https://minsubao.localhome.cn/setting/expendSetting`
- 本地服务层：[src/services/expendSetting.ts](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/src/services/expendSetting.ts)
- 本地页面：[src/pages/ExpendSettingPage.tsx](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/src/pages/ExpendSettingPage.tsx)
- 自动化验证：[tests/expend-setting.spec.ts](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/tests/expend-setting.spec.ts)
- 专项 Playwright 配置：[tmp/expend-setting.playwright.config.ts](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/tmp/expend-setting.playwright.config.ts)
- 目标站 fresh 取证：
  - 默认态截图：[default-target-20260519111250-viewport.png](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/artifacts/screenshots/shezhi--tongyong-shezhi--shouru-zhichu-shezhi/default-target-20260519111250-viewport.png)
  - 主操作截图：[primary-action-target-20260519111250-viewport.png](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/artifacts/screenshots/shezhi--tongyong-shezhi--shouru-zhichu-shezhi/primary-action-target-20260519111250-viewport.png)
  - 支出页签截图：[expense-tab-target-20260519111251-viewport.png](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/artifacts/screenshots/shezhi--tongyong-shezhi--shouru-zhichu-shezhi/expense-tab-target-20260519111251-viewport.png)
  - 默认态网络：[default-target-20260519111250-responses.json](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/artifacts/network/shezhi--tongyong-shezhi--shouru-zhichu-shezhi/default-target-20260519111250-responses.json)
  - 主操作网络：[primary-action-target-20260519111250-responses.json](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/artifacts/network/shezhi--tongyong-shezhi--shouru-zhichu-shezhi/primary-action-target-20260519111250-responses.json)
  - 支出页签网络：[expense-tab-target-20260519111251-responses.json](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/artifacts/network/shezhi--tongyong-shezhi--shouru-zhichu-shezhi/expense-tab-target-20260519111251-responses.json)
- 运行时开关：
  - `localStorage["pms.expendSettingProvider"] = "mock" | "api"`
  - `localStorage["pms.expendSettingMockState"] = "success" | "empty" | "error"`
  - URL query：`?mockState=success|empty|error`

| 区域 | 元素/动作 | 目标站事实 | 本地承接 | 验收方式 |
| --- | --- | --- | --- | --- |
| 页面入口 | 顶部“设置”与侧栏“收入/支出设置” | 进入 `/setting/expendSetting` 后顶部“设置”和左侧二级菜单高亮 | 沿用 `AppShell` 导航数据，不重造壳；`src/App.tsx` 显式挂载该路由 | Playwright 断言顶部“设置”和侧栏“收入/支出设置”均为激活态 |
| 页面提示 | 顶部说明文案 | 文案为“系统默认项目不支持编辑和删除，可直接拖动调整排序。” | 由页面直接展示目标站已取证文案 | Playwright 断言提示文案可见 |
| 页签区 | “收入项” | 默认选中“收入项” | `fetchExpendSettingDashboard({ tab: "income" })` 返回聚合后的统一 view model | Playwright 断言 `aria-selected=true`，并看到收入默认项 |
| 页签区 | “支出项” | 点击后切换到支出项目列表 | 本地通过同一服务层切换 `tab=expense`，不在组件内硬编码两套列表 | Playwright 点击后断言 `data-request.tab="expense"` 且看到“其他支出/退房费/其他佣金支出” |
| 主操作 | “新 增” | 点击后打开新增弹窗 | `openDialog()` 打开模态框；提交走 `createExpendSettingItem()`；`api` provider 下未接真实新增接口时显式报错，不假成功 | Playwright 打开弹窗，填写并提交后断言反馈文案和新增卡片出现 |
| 列表区 | 住宿分组默认项 | 目标站默认可见“加床、加人、损坏赔偿、其他收入、加时(延迟退房)、餐饮、旅游服务” | mock 数据层按 `isIncome`、`groupType` 映射到统一 `ExpendSettingItem` | Playwright 断言住宿组和上述默认项可见 |
| 列表区 | 空分组“餐饮/商超/娱乐/场地” | 目标站显示空组与“暂无项目，点击新增” | 本地保留这些空组，不因空数据而折叠结构 | Playwright 断言空组名和“暂无项目，点击新增”出现 |
| 停用区 | “已停用项” | 目标站默认可见该区块，当前取证未见停用项内容 | 本地先承接为空态“暂无停用项目”，等待真实 `isEnable=0` 数据接入 | Playwright 断言“已停用项/暂无停用项目”可见 |
| 弹窗 | “选择业态” | 目标站新增弹窗含该字段 | 本地使用 `businessTypeOptions` 渲染业态选项：住宿、餐饮、商超、娱乐、场地 | Playwright 打开下拉后断言上述选项存在，并可切到“餐饮” |
| 弹窗 | “名称” | 目标站新增弹窗含必填名称字段 | 本地 `createExpendSettingItem()` 对空名称显式抛错“请输入项目名称” | 可补充手工验证空提交时的显式错误反馈 |
| 弹窗 | “取 消” | 目标站有取消按钮 | 本地直接关闭弹窗，不写入列表 | 可补充手工验证点击后弹窗消失且列表不变 |
| 弹窗 | “完 成” | 目标站有完成按钮 | mock provider 生成自定义项并回写当前分组；`api` provider 当前明确提示“未启用新增接口” | Playwright 断言完成后状态栏出现新增成功反馈 |
| 状态反馈 | 顶部状态文案 | 目标站无明显 toast，但交互后页面状态变化明确 | 本地显式提供 `role=status`，承接加载、切 tab、成功、失败反馈 | Playwright 断言 `已同步收入项目配置`、新增成功反馈文案 |
| 空态 | `?mockState=empty` | 目标站未直接提供该调试入口 | 本地显式开放空态，暴露统一契约，不用静默 fallback | Playwright 断言 `data-state="empty"` 且出现“当前门店暂未配置收入项目” |
| 错误态 | `?mockState=error` + “重新加载” | 目标站未直接提供该调试入口 | 本地显式开放错误态；加载失败时展示 `role=alert` 与重试按钮 | Playwright 断言错误提示与“重新加载”按钮可见 |
| 服务审计 | 隐藏节点 `data-testid="expend-setting-service-contract"` | 目标站无此节点，仅用于本地验收与契约追踪 | 暴露 `provider/state/request/endpoints/timestamp/traceIds`，便于自动化断言真实调用意图 | Playwright 读取 `data-provider/data-state/data-request/data-endpoints` |

## 已确认目标站事实

- 顶部文案：`系统默认项目不支持编辑和删除，可直接拖动调整排序。`
- 页签：`收入项`、`支出项`
- 主按钮：`新 增`
- 默认收入项：`加床`、`加人`、`损坏赔偿`、`其他收入`、`加时(延迟退房)`、`餐饮`、`旅游服务`
- 默认支出项：`其他支出`、`退房费`、`其他佣金支出`
- 空组：`餐饮`、`商超`、`娱乐`、`场地`
- 停用区标题：`已停用项`
- 新增弹窗字段：`选择业态`、`名称`、`取 消`、`完 成`

## 取证到的真实接口

- `POST https://hudson-prod.localhome.cn/paymentTypes/get`
  - `body={"campId":"1796067693589061634"}`
- `POST https://hudson-prod.localhome.cn/paymentTypes/get/v2`
  - `body={"campId":"1796067693589061634","bizTypes":[2]}`
  - `body={"campId":"1796067693589061634","bizTypes":[2],"isEnable":1}`
  - `body={"campId":"1796067693589061634","bizTypes":[3],"isEnable":1}`
- `POST https://hudson-prod.localhome.cn/paymentWays/get`
  - `body={"campId":"1796067693589061634"}`

## 当前判断

- 本页已经从静态复刻切到统一数据层，`mock` 和 `api` provider 行为显式分离。
- 目标站“读取类接口”已完成 fresh 取证；“新增接口”本轮未直接抓到，前端当前不伪造线上真实接口，而是在 `api` provider 下明确报未接入。
- 本地专项自动化已覆盖成功态、新增闭环、空态、错误态四类关键行为。
