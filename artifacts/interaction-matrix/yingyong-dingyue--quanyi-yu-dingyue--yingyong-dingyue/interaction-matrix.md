## 应用订阅交互矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 左侧订阅中心 | 我的权益 / 置换权益 / 版本订阅 / 应用订阅 / 路客商城 | 左侧侧栏切换；当前页高亮“应用订阅” | 侧栏本身无专属请求，依赖现有路由承接 | 已有侧栏和高亮，但未通过统一服务层暴露当前页合同 | 保留现有侧栏结构，补诊断节点，保证应用订阅页高亮稳定 | Playwright 断言侧栏文本、高亮类名和当前 URL |
| 顶部 tab | 全部 / 渠道直连 / 功能订阅 | 切换卡片分组；默认展示全部，两组卡片同时可见 | 本地 mock provider 需消费 `tab` 过滤；未来复用 `edition/resource/get` 适配结果 | 仅本地 state 切换，没有 provider 审计 | 把 tab 状态纳入服务层过滤参数和诊断属性 | Playwright 点击 tab 后断言分组变化、服务层诊断属性同步更新 |
| 渠道直连卡片 | 去使用 | 目录页存在可用产品直接进入既有业务承接页 | 当前不新增专属后端请求；基于产品路由配置承接 | 按钮没有统一行为，部分按钮无点击反馈 | 为每个“去使用”补明确 route target 和反馈 | Playwright 遍历首批“去使用”按钮并断言 URL 或业务反馈 |
| 渠道直连卡片 | 订阅开通 | 进入 `/version/applicationPayment/detail` 商品详情 | 详情 provider 需复用 `paymentTypes/get/v2`、`weiRoomCategories/page/get`、`rooms/get` 的适配字段 | 仅抖音 detail 有旧静态承接，其余走默认清洁详情 | 把目录页卡片与 detail 目标映射统一收口到服务层 | Playwright 点击“订阅开通”后断言 URL、商品标题、价格、购买时长 |
| 功能订阅卡片 | 智能调价 / 全域雷达 / 智能保洁 / 企微SCRM 等 | 不同卡片进入不同 detail 分支或业务页 | 目录页仍基于统一 provider；detail 由产品 id 决定分支 | 目前 `smartPricing/globalRadar/douyin/scrm/default` 承接分散在页面中，未统一建模 | 服务层输出 `detailTarget` 和 `useTarget`，页面只消费映射结果 | Playwright 分别验证 `app=smartPricing`、`app=globalRadar`、`state.product=scrm`、默认 detail |
| 详情页 | 商品详情 | 显示当前商品名称、卖点和详情内容 | 详情 provider 适配 `paymentTypes/get/v2` 等结果到业务模型 | 旧 detail 文案写死在 `CleanSettingPage` | 抽出统一 detail 视图模型，避免页面内散落硬编码 | Playwright 断言商品名称、详情区标题与关键信息 |
| 详情页 | 购买信息 | 显示商品价格、购买时长、订单金额 | 详情 provider 统一返回价格、原价、时长、订单金额、traceId | 仅旧静态文本，没有 provider 审计 | 增加 detail 合同节点和金额字段适配 | Playwright 断言价格、时长、订单金额和 provider 节点 |
| 详情页 | 协议勾选 / 立即购买 | 目标站存在协议勾选后购买按钮；按钮默认禁用直到勾选 | 当前阶段无真实购买提交；需显式成功反馈，不做假成功 | 旧分支部分支持勾选，部分未统一禁用逻辑 | 统一 detail 页的协议状态、禁用态和点击反馈 | Playwright 断言勾选前禁用、勾选后启用和点击反馈 |
| 页面反馈 | loading | 首屏加载与切换 detail 时有明确加载反馈 | mock provider 支持 `success/empty/error`；未来 api provider 复用相同合同 | 当前目录页没有 loading，detail 也没有统一加载态 | 目录页和 detail 补 loading skeleton/文案与禁用态 | Playwright 断言首屏加载时状态文本和按钮禁用 |
| 页面反馈 | empty | 当 provider 返回空分组或空商品时，页面结构仍稳定 | provider 返回统一 `{ code, message, data, traceId, timestamp }` 包 | 当前无 empty 覆盖 | 增加空目录页和空 detail 业务承接 | Playwright 用 query mockState=empty 断言空态和正文无开发态文案 |
| 页面反馈 | error / retry | 当 provider 失败时暴露错误信息和重试入口 | provider 返回非 0 code 或异常，页面统一转为 error | 当前无 error 闭环 | 增加错误提示、重试按钮和失败诊断 | Playwright 用 query mockState=error 断言 alert 与 retry |
| 浮层风险 | 右下聊天/会话浮层 | 真实站固定悬浮，可能遮挡卡片底部按钮 | 非本页专属请求 | 当前本地页面未显式处理遮挡 | 在本页局部布局中预留底部空间或提升交互区域，不破坏全局壳层 | fixed Chrome clone 截图对比按钮无遮挡，Playwright 实际点击成功 |
| 采集脚本 | clone 模式启动 URL | 必须对准当前本地应用订阅入口，不能盲回落错误端口 | 使用 `PMS_LOCAL_URL` 或 `PMS_TEST_BASE_URL` | 当前脚本错误默认 `4173` | 改为缺失本地 URL 时直接失败并给出明确错误 | 运行 clone capture 时断言无 URL 则失败，有 URL 则正常产物落盘 |

## 当前阻力

- 当前页面核心数据仍写死在组件内，无法沉淀为接口契约。
- detail 承接逻辑散落在 `CleanSettingPage`，产品映射与目录页卡片没有统一模型。
- 当前采集脚本和专项测试仍沿用旧静态页口径，无法覆盖 provider、empty、error 和 route matrix。

## 本轮实现目标

- 用 `src/services/applicationPayment.ts` 收口目录页和 detail 页所需合同、provider、审计字段和路由目标。
- 让 `ApplicationPaymentPage` 只消费服务层业务模型，不再直接依赖硬编码产品常量。
- 让 `tests/application-payment.spec.ts` 覆盖目录页 provider、tab、去使用、订阅开通、empty/error 和 detail 承接。
