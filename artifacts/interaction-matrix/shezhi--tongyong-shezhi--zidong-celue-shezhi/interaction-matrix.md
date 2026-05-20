# 自动策略设置交互矩阵

## 页面信息

- 任务编号：`shezhi--tongyong-shezhi--zidong-celue-shezhi`
- 页面名称：`设置 > 通用设置 > 自动策略设置`
- 本地路由：`/setting/IntelligenceSetting`
- 目标页面：`https://minsubao.localhome.cn/setting/IntelligenceSetting`
- 服务契约节点：`data-testid="auto-strategy-setting-service-contract"`

## 状态矩阵

| 场景 | 触发方式 | 契约状态 | 页面表现 | 用户反馈 |
| --- | --- | --- | --- | --- |
| 首屏加载中 | 初次进入页面 / 重试 | `data-response-state="loading"` | 隐藏业务卡片，显示加载状态卡片 | `正在加载自动策略设置...` |
| 首屏成功 | 默认进入页面 | `data-response-state="success"` | 展示 `接单规则 / 房态自动化 / 库存占用规则` 三个页签和对应配置 | `自动策略设置已同步` |
| 空态 | `?mockState=empty` | `data-response-state="empty"` | 显示空态卡片与 `重新加载` 按钮 | 标题 `当前暂无自动策略配置` |
| 错误态 | `?mockState=error` 或 `provider=api` | `data-response-state="error"` | 显示错误卡片与 `重新加载` 按钮 | `自动策略设置加载失败，请稍后重试` |

## 控件交互矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 接单规则 | `接单规则` 页签 | 切换到接单规则面板 | 无新增请求 | 已支持 | 切换 `tabpanel`，保留当前加载数据 | Playwright 点击后断言 `aria-selected="true"` |
| 接单规则 | `住宿订单接单规则` 单选组 | 选择处理策略 | `POST /systemConfigs/get` 首屏加载；保存时当前 mock 闭环写入 `configKey=hudson.basic.orderAutoPendingStrategy`，真实 path 待确认 | 已支持 | 选项变更后立即显示选中态，保存成功后回写 contract 的 `data-last-action/data-last-request-body` | Playwright `check()` 后断言 toast、checked、contract |
| 接单规则 | `信用住自动结账` 开关 | 切换自动结账 | 首屏 `POST /systemConfigs/get`；保存时真实接口 `PUT /systemConfig/orderAutoSettleStrategy` | 已支持 | 点击后同步更新 `aria-checked`，保存成功输出真实请求体 | Playwright 点击后断言 toast、switch、contract |
| 接单规则 | `携程规则外取消订单设置` 单选组 | 选择是否同意取消 | 首屏 `POST /systemConfigs/get`；保存时当前 mock 闭环写入 `configKey=hudson.basic.negotiateRefundAutomaticAcceptStrategy`，真实 path 待确认 | 已支持 | 选项变更后立即显示选中态，保存成功后回写 contract | Playwright `check()` 后断言 toast、checked、contract |
| 房态自动化 | `房态自动化` 页签 | 切换到房态自动化面板 | 无新增请求 | 已支持 | 展示真实取证标题与默认值 | Playwright 点击后断言区域文案与默认选中状态 |
| 房态自动化 | `自动排房设置` / `自动办理入住` / `自动办理退房` / `房间转脏策略` / `房间转净策略` | 查看默认配置 | 仅消费 bootstrap 数据 | 已支持只读展示 | 用受控表单元素呈现真实默认值；因未拿到真实保存契约，当前不开放写入 | Playwright 断言 radio、checkbox、switch、时间值 |
| 库存占用规则 | `库存占用规则` 页签 | 切换到库存占用规则面板 | 无新增请求 | 已支持 | 展示真实取证标题与默认值 | Playwright 点击后断言区域文案与默认选中状态 |
| 库存占用规则 | `待接单占库存设置` / `待支付订单占库存设置` / `钟点房订单占库存设置` | 查看默认配置 | 仅消费 bootstrap 数据 | 已支持只读展示 | 用受控 radio 展示真实默认值；未拿到真实保存契约前保持只读 | Playwright 断言默认 radio 选中态 |
| 空态/错误态 | `重新加载` | 重新拉取当前门店配置 | 重新执行 `POST /systemConfigs/get`，并强制覆盖 `mockState=success` | 已支持 | 恢复到成功态 contract 与页面 | Playwright 断言按钮可见，手动回归点击可恢复 |

## 已对齐的真实页面事实

- 页签真实顺序：`接单规则`、`房态自动化`、`库存占用规则`
- 接单规则默认值：
  - `住宿订单接单规则`：`不操作`
  - `信用住自动结账`：关闭
  - `携程规则外取消订单设置`：`不同意取消`
- 房态自动化默认值：
  - `自动排房设置`：`按房间顺序排房`
  - `当日订单优先排空净`：未勾选
  - `智能排房`：未勾选
  - `自动办理入住`：开启，`15:00:00`
  - `自动办理退房`：开启，`12:00:00`
  - `房间转脏策略`：`手动设置`
  - `房间转净策略`：开启
- 库存占用规则默认值：
  - `待接单不占库存`
  - `待支付订单不占库存`
  - `钟点房订单占库存`

## 取证与验证证据

- 目标页 DOM / 样式取证：
  - `artifacts/dom-snapshots/shezhi--tongyong-shezhi--zidong-celue-shezhi/default-target-20260520-fresh-default2-page.html`
  - `artifacts/style-dumps/shezhi--tongyong-shezhi--zidong-celue-shezhi/default-target-20260520-fresh-default2-facts.json`
- 目标页网络取证：
  - `artifacts/network/shezhi--tongyong-shezhi--zidong-celue-shezhi/default-target-20260520-fresh-default2-responses.json`
  - `artifacts/network/shezhi--tongyong-shezhi--zidong-celue-shezhi/first-toggle-target-20260520-fresh-toggle-responses.json`
- 本地专项验证：
  - `PMS_TEST_BASE_URL=http://127.0.0.1:4313 npx playwright test --config tmp/auto-strategy-setting.playwright.config.ts --reporter=line --workers=1`
  - 结果：`5 passed`
