# 短信设置交互矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 页面入口 | 顶部导航、左侧 `通用设置 > 短信设置` | 进入 `/setting/balanceAndTemplate` 后顶部 `设置` 与侧栏 `短信设置` 高亮，页面头部默认隐藏 | 依赖 AppShell 与侧栏路由，不额外发请求 | 已接入路由，页面仍是静态实现 | 接入统一服务层，专项测试固定校验顶部和侧栏高亮 | Playwright 进入 `/setting/balanceAndTemplate` 后断言顶部/侧栏高亮和 `.page-header` 隐藏 |
| 页面加载 | 页面首屏 | 展示剩余短信、充值、充值记录、启用渠道、签名和 6 个模板模块 | `POST /smsAccount/get`、`POST /smsTemplateMsgConfig/channel/get`、`POST /smsTemplateMsgConfig/signName/get`、`POST /smsTemplateMsgConfig/page/get` | 当前页面内硬编码模板数组 | 新增统一服务层，首屏通过显式 `mock/api` provider 返回视图模型 | Playwright 断言 contract 节点、余额、渠道、签名和模板模块 |
| 充值操作 | `充值` | 打开短信充值弹窗，可选 6 个套餐 | 未来 `sms package` / `payProcess` 承接 | 旧实现仅有静态弹窗 | 改为套餐按钮可选，选择后在状态条给出明确反馈 | Playwright 打开弹窗，断言 100/500/1000/2000/5000/15000 条套餐 |
| 充值记录 | `充值记录` | 打开最近充值记录弹窗，展示记录列表 | 未来 `recharge record` 列表接口 | 旧实现没有充值记录承接 | 补充值记录弹窗，先用服务层 mock 数据闭环 | Playwright 打开弹窗，断言最近充值记录和日期 |
| 渠道修改 | `修改`（启用渠道） | 打开启用渠道弹窗，允许切换当前短信渠道 | `POST /smsTemplateMsgConfig/channel/get` 为来源 | 旧实现无渠道弹窗 | 增加单选弹窗和保存动作，保存后更新当前渠道 | Playwright 切换到腾讯云短信并保存，断言反馈和页面状态更新 |
| 签名修改 | `修改`（签名） | 打开签名说明弹窗，仅展示当前签名与说明 | `POST /smsTemplateMsgConfig/signName/get` 为来源 | 旧实现只静态展示签名 | 增加签名弹窗，明确可编辑与说明内容 | Playwright 打开签名弹窗，断言签名和说明可见 |
| 模板模块 | 6 个短信模块 | 展示订单状态、长租、商城、自助入住、门锁密码、其他短信 | `POST /smsTemplateMsgConfig/page/get` | 当前模板内容写死在组件内 | 由服务层统一提供 section 与 template 数据 | Playwright 断言 6 个模块和关键模板文案 |
| 自助入住跳转 | `去设置` | 跳转到 `/smartHotel/smartHome` | 前端路由跳转，不新增接口 | 旧实现跳 `/smartHotel/checkInGuide` | 修正为真实承接页 `/smartHotel/smartHome` | Playwright 点击后断言 URL |
| 空态 | `mockState=empty` | 显示空状态卡片与主按钮 | 服务层返回空态 envelope | 旧实现无空态 | 增加空态卡片与承接按钮 | Playwright 断言空态标题与按钮 |
| 错误态 | `mockState=error` | 显示错误卡片与重新加载 | 服务层返回错误 envelope | 旧实现无错误态 | 增加错误卡片与显式重试 | Playwright 断言错误态和重新加载按钮 |
| 诊断节点 | `#sms-setting-service-contract` | 暴露 provider、state、request、traceId | 统一 contract snapshot | 旧实现没有统一契约节点 | 增加隐藏诊断节点，便于联调和取证 | Playwright 读取 contract 节点并校验字段 |
