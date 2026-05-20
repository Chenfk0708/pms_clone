# 版本订阅交互矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口与导航 | 左侧订阅中心 | 进入 `/version/subscriptionCenter`，左侧高亮 `版本订阅`，页面标题与壳层一致 | 无独立首屏请求；依赖现有路由承接 | 已接入路由与侧栏高亮 | 保持复用现有侧栏与 AppShell，不新增平行入口 | Playwright 断言 URL、侧栏高亮和页头隐藏状态 |
| 首屏加载 | 页面初始态 | 首屏加载版本订阅数据、版本信息、套餐、能力矩阵与底部购买区 | `POST /edition/resource/get`、`POST /weiRoomCategories/page/get` | 已改为 service/provider 驱动 | 统一到 `src/services/versionSubscription.ts`，页面只消费 view model | Playwright 断言 `data-provider`、`data-response-state`、诊断落盘与正文内容 |
| 版本信息 | 当前版本 / 有效期 | 显示当前版本、有效期、门店信息与版本号 | 上述服务返回 `editionName`、`expirationDate`、`campName`、`buildVersion` | 已对齐 | 保持 hero 与服务字段映射稳定 | Playwright 断言 `当前版本：畅享版` 与 `2027-09-28` |
| 套餐区 | 版本套餐卡片 | 展示标准版、畅享版、高级版、专业版、旗舰版、定制版并支持选择 | `POST /weiRoomCategories/page/get` | 已改为可选卡片 | 把套餐选择、价格、原价和摘要集中在服务层模型 | Playwright 点击 `选择 专业版` 并断言 `data-selected-plan` |
| 时长区 | 一年 / 两年 / 无期限 | 切换购买时长并联动总费用 | 本地 view model 计算 | 已支持 | 用 duration multiplier 统一计算，不在组件写魔法数字 | Playwright 断言两年后总费用变化 |
| 比较弹窗 | `版本对比` | 打开版本对比弹层，关闭后返回页面 | 无额外请求 | 已支持 | 保留 dialog 角色与可关闭按钮 | Playwright 打开/关闭弹窗并断言内容 |
| 协议校验 | 协议勾选 + `立即购买` | 未勾选时阻止下单并提示，勾选后允许跳转 | `POST /version/subscription/order/submit`（本地 mock 提交） | 已支持 | 失败态明确暴露，不做静默 fallback | Playwright 覆盖未勾选与勾选两种路径 |
| 路由跳转 | `尾房置换` | 跳转置换权益页 | 前端路由 `/version/displacementBenefit` | 已支持 | 直接复用现有路由，不新增重复承接页 | Playwright 断言最终 URL |
| 空态 | `mockState=empty` | 套餐空、矩阵空，仍保留结构与提示 | 同一套服务层返回空数据 | 已支持 | 空态不崩溃，仍保留 hero、状态条与重试入口 | Playwright 断言空态文案与 `data-response-state=empty` |
| 错误态 | `mockState=error` + `重新加载` | 失败信息清晰暴露，点击重新加载可恢复 | 同一套服务层错误分支 | 已支持 | 错误态不吞错，重试重新加载 success | Playwright 断言 alert 文案与重试后 success |
| 诊断 | localStorage 诊断节点 | 暴露 provider、endpoint、request body 供回归验证 | `pms.versionSubscription.lastRequest` | 已支持 | 诊断仅落请求与 endpoint，不写敏感凭证 | Playwright 读取并比对 diagnostics |

## 当前阻力

- 目标站真实支付详情页未完全接入，本地先以 `/version/applicationPayment/detail` 占位承接购买跳转。
- 全仓默认 lint 仍有历史债，本任务只保证自身文件链路绿灯。

