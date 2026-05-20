# 财务设置交互矩阵

## 取证范围

- 真实页默认态证据：
  - `artifacts/style-dumps/shezhi--tongyong-shezhi--caiwu-shezhi/default-target-20260519T194500-facts.json`
  - `artifacts/network/shezhi--tongyong-shezhi--caiwu-shezhi/default-target-20260519T194500-responses.json`
- 真实页主交互态证据：
  - `artifacts/style-dumps/shezhi--tongyong-shezhi--caiwu-shezhi/primary-action-target-20260519T195300-facts.json`
  - `artifacts/network/shezhi--tongyong-shezhi--caiwu-shezhi/primary-action-target-20260519T195300-responses.json`
- 本地 clone 默认态证据：
  - `artifacts/style-dumps/shezhi--tongyong-shezhi--caiwu-shezhi/default-clone-20260520-local-default-facts.json`
- 本地 clone 主交互态证据：
  - `artifacts/style-dumps/shezhi--tongyong-shezhi--caiwu-shezhi/primary-action-clone-20260520-local-primary-facts.json`
- 本地 clone 空态/错误态证据：
  - `artifacts/style-dumps/shezhi--tongyong-shezhi--caiwu-shezhi/empty-clone-20260520-local-empty-facts.json`
  - `artifacts/style-dumps/shezhi--tongyong-shezhi--caiwu-shezhi/error-clone-20260520-local-error-facts.json`

## 页面骨架

| 区域 | 真实页观察 | 本地 clone 承接 | 结论 |
| --- | --- | --- | --- |
| 页面标题 | 默认态 `bodyTextSample` 可见“财务设置”，默认态 facts 控件区出现“夜审设置 / 分摊设置 / 可售设置 / 编辑” | 默认态 contract + 文案区同样呈现三段结构与“编辑”入口 | 页面主结构对齐真实页 |
| 默认操作按钮 | 真实页默认态只有“编辑” | clone 默认态只有“编辑”，进入编辑后才出现“取消 / 保存” | 按真实页的两段态承接 |
| 主交互态按钮 | 主交互态 facts 显示点击“编辑”后出现“取消 / 保存” | clone 主交互态 facts 同步出现“取消 / 保存” | 主交互切换对齐 |

## 逐项交互

| 交互项 | 触发 | 真实页证据 | 本地 clone 行为 | 备注 |
| --- | --- | --- | --- | --- |
| 夜审开关 | 点击“夜审”开关 | target chunk 明确存在夜审开关、确认弹窗与保存逻辑；默认态 facts 控件为 `role="switch"` | 默认关闭；首次开启先弹确认框；确认后切换为开启 | 真实页保存成功 toast 为“设置成功！” |
| 夜审权限弹窗 | 开启夜审时触发 | target chunk 含按钮“去设置权限”“确认开启” | 弹窗标题为“是否确认开启夜审？”，提供“去设置权限”“确认开启”“取消” | 先做权限提示，再允许直接开启 |
| 去设置权限 | 在权限弹窗点击“去设置权限” | target chunk 明确跳转 `/setting/role` | clone 直接 `navigate('/setting/role')` | 路径与真实页一致 |
| 确认开启 | 在权限弹窗点击“确认开启” | target chunk 存在直接保存夜审逻辑 | clone 直接提交夜审开启并更新状态反馈 | 本地反馈文字比真实 toast 更长，便于测试 |
| 关闭夜审 | 已开启后再次点击开关 | target chunk 存在 `isNightAudit` 保存字段 | clone 不再弹窗，直接保存关闭 | 关闭不要求二次确认 |
| 自动夜审时间 | 下拉选择 `00:00` 到 `12:00` | 默认态 facts 已取到默认值 `06:00`，chunk 明确字段 `autoNightAuditTime` | clone 提供 `00:00` 到 `12:00` 全量选项，修改即保存 | 默认值对齐为 `06:00` |
| 分摊单选 | 选择“按日历价分摊”或“平均分摊” | 真实页默认态文案显示两个单选项；chunk 字段 `orderAmortizeStrategy` | clone 默认选“按日历价分摊”，切换时弹确认框，确认后保存 | `1=按日历价分摊`，`2=平均分摊` |
| 分摊日锁 | 当天重复修改分摊 | target chunk 写入 `${campId}_isChangeOrderAmortizeStrategy` | clone 读写同名 localStorage 锁，命中后拒绝再次修改 | 只做显式提示，不做静默 fallback |
| 可售编辑入口 | 点击“编辑” | 真实页主交互态才出现“取消 / 保存” | clone 点击“编辑”后解锁多选框并显示“取消 / 保存” | 与真实页操作层级一致 |
| 可售多选项 | 普通关房 / 维修房 / 保留房 / 屏蔽关房 / 联动关房 | 默认态 facts 与 chunk 均可确认这 5 个选项 | clone 默认全选 5 项；编辑态可勾选/取消 | 与真实页选项集合一致 |
| 可售保存确认 | 编辑后点击“保存” | target chunk 有“是否确认操作？”确认弹窗文案 | clone 弹确认框，确认后提交 `vendibleTypes` | 历史数据不回刷，仅更新当天及未来 |
| 可售取消 | 编辑后点击“取消” | 真实页主交互态有“取消” | clone 放弃草稿并恢复当前生效值 | 不触发保存请求 |
| 可售日锁 | 当天重复修改可售规则 | target chunk 写入 `${campId}_isChangeOrderStrategy` | clone 读写同名 localStorage 锁，命中后拒绝再次保存 | 与真实页同口径 |

## 状态矩阵

| 状态 | 触发方式 | 本地 clone 承接 | 证据 |
| --- | --- | --- | --- |
| loading | 首屏请求未完成 | 状态条显示“财务设置数据加载中”，操作区禁用 | `src/pages/FinanceSettingPage.tsx` 首屏 `isLoading` 分支；专项用例已覆盖正常加载完成 |
| success/default | `financeSettingMockState=success` | 展示默认规则、夜审默认关闭、时间默认 `06:00`、分摊默认日历价、可售默认 5 项 | `default-clone-20260520-local-default-facts.json` |
| primary-action | 默认态点击“编辑” | 进入可售编辑态，按钮变为“取消 / 保存” | `primary-action-clone-20260520-local-primary-facts.json` |
| empty | `financeSettingMockState=empty` | 显示“初始化默认规则”提示卡，点击后落默认方案 | `empty-clone-20260520-local-empty-facts.json` |
| error | `financeSettingMockState=error` | 显示错误卡与“重新加载”按钮 | `error-clone-20260520-local-error-facts.json` |
| retry | 错误态点击“重新加载” | 重新执行 `loadFinanceSettingViewModel`，不做静默兜底 | `src/pages/FinanceSettingPage.tsx` 的 `reload()` 分支；专项用例覆盖错误态按钮存在 |

## 差异与取舍

- 真实页保存成功使用 toast “设置成功！”，本地 clone 额外在页内状态条展示反馈，便于自动化验证。
- 真实 save 接口路径尚未从 fixed Chrome 抓包中精确锁定；本地先按字段语义拆成 3 个 save endpoint，并把请求体显式写进 contract 区。
- 真实页默认态只暴露“编辑”，clone 保持同策略，不提前暴露可售保存按钮。
