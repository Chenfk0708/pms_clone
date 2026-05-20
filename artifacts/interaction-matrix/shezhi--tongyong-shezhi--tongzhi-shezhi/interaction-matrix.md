# 通知设置交互矩阵

## 页面信息

- 任务编号：`shezhi--tongyong-shezhi--tongzhi-shezhi`
- 本地路由：`/setting/wechatPushSetting`
- 目标页面：`https://minsubao.localhome.cn/setting/wechatPushSetting`
- 当前数据源：`mock`
- 服务合同节点：`data-testid="notification-setting-service-contract"`

## 状态矩阵

| 场景 | 触发方式 | 服务合同 | 页面表现 | 用户反馈 |
| --- | --- | --- | --- | --- |
| 加载中 | 初次进入页面 / 重试 | `data-response-state="loading"` | 展示加载状态卡片，不渲染业务行 | `正在加载通知设置...` |
| 成功态 | 默认进入 / 交互后回流 | `data-response-state="success"` | 展示二维码、按钮、9 个开关、通知表格 | `通知设置已同步。` 或具体操作结果 |
| 空态 | `?mockState=empty` | `data-response-state="empty"` | 保留二维码和按钮，隐藏业务通知行，展示空状态卡片 | `当前暂无可配置的通知项` |
| 错态 | `?mockState=error` / `provider=api` | `data-response-state="error"` | 展示错误卡片和重试按钮 | `通知设置加载失败，请稍后重试` 或接口错误文案 |

## 控件交互矩阵

| 控件 | 文案 / 选择器 | 前置条件 | 操作 | 结果 |
| --- | --- | --- | --- | --- |
| 已关注按钮 | `button[我已关注？]` | 任意非 loading 状态 | 点击 | 模拟写入已关注公众号，刷新 `followSummary`，状态提示变为“已刷新关注状态，当前可接收公众号通知。” |
| 刷新按钮 | `button[刷新一下]` | 任意非 loading 状态 | 点击 | 保持当前 mock 数据重新同步，若未关注则提示“当前暂无已关注公众号” |
| 查看公众号按钮 | `button[查看接受微信通知公众号]` | 任意非 loading 状态 | 点击 | 打开 `role="dialog"` 的公众号详情弹层 |
| 关闭公众号详情 | `aria-label="关闭公众号详情"` | 弹层已打开 | 点击 | 关闭弹层 |
| PC\APP 总开关 | `role="switch"[name="PC\\APP推送 总开关"]` | 成功态 | 点击 | 联动切换订单通知、门店预警、门店动态、IM消息通知四个 PC\APP 子开关 |
| 公众号总开关 | `role="switch"[name="公众号推送 总开关"]` | 成功态 | 点击 | 联动切换订单通知、门店预警、门店动态三个公众号子开关 |
| 订单通知 PC\APP 开关 | `role="switch"[name="订单通知 PC\\APP推送"]` | 成功态 | 点击 | 独立切换单项开关，状态反馈包含“订单通知” |
| 订单通知 公众号开关 | `role="switch"[name="订单通知 公众号推送"]` | 成功态 | 点击 | 独立切换单项开关，状态反馈包含“订单通知” |
| 门店预警 PC\APP 开关 | `role="switch"[name="门店预警 PC\\APP推送"]` | 成功态 | 点击 | 独立切换单项开关 |
| 门店预警 公众号开关 | `role="switch"[name="门店预警 公众号推送"]` | 成功态 | 点击 | 独立切换单项开关 |
| 门店动态 PC\APP 开关 | `role="switch"[name="门店动态 PC\\APP推送"]` | 成功态 | 点击 | 独立切换单项开关 |
| 门店动态 公众号开关 | `role="switch"[name="门店动态 公众号推送"]` | 成功态 | 点击 | 独立切换单项开关 |
| IM消息通知 PC\APP 开关 | `role="switch"[name="IM消息通知 PC\\APP推送"]` | 成功态 | 点击 | 独立切换单项开关 |
| 错态重试 | `button[重新加载通知设置]` | 错态 | 点击 | 强制将 mock 状态切回 `success`，恢复通知表格 |

## 开关联动规则

| 规则编号 | 规则说明 |
| --- | --- |
| R1 | 总开关的选中态通过所属子开关 `every(...)` 计算得到，不单独存储。 |
| R2 | PC\APP 总开关影响 4 个子开关；公众号总开关只影响 3 个子开关。 |
| R3 | `IM消息通知` 没有公众号开关，UI 展示占位符 `-`。 |
| R4 | 单个子开关变化后，父级总开关状态会自动重算。 |
| R5 | 任一交互完成后都会回写服务合同节点和 `role="status"` 提示。 |

## 服务合同字段

| 字段 | 示例值 | 说明 |
| --- | --- | --- |
| `data-provider` | `mock` | 当前数据提供者 |
| `data-response-state` | `success` | 当前响应态：`loading / success / empty / error` |
| `data-endpoint` | `/setting/wechatPushSetting/bootstrap` | 页面 bootstrap 接口路径 |
| 文本内容 | JSON 字符串 | 包含 provider、traceId、timestamp、request |

## 已对齐的真实站点事实

- 真实站点通知项为 4 行：订单通知、门店预警、门店动态、IM消息通知。
- 真实站点共有 9 个开关：2 个总开关、4 个 PC\APP 子开关、3 个公众号子开关。
- 真实接口核心来源：
  - `POST /userAuthority/notification/get`
  - `POST /wx/mp/user/get`
  - `POST /wx/mp/user/bind/qrCode`
- 当前 clone 页以 `mock` 服务形式显式承接这些合同，未引入静默 fallback。
