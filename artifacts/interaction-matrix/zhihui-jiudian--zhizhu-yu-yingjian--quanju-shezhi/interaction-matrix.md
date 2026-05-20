# 全局设置交互矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 页面入口 | 左侧菜单 `全局设置` | 进入 `/smartHotel/checkInGuide`，菜单高亮，智慧酒店主导航高亮 | 页面聚合加载：`/systemConfigs/get`、`/smsAccount/get`、`/smsTemplateMsgConfig/page/get`、`/roomCategories/page/get`、`/weiRoomCategories/page/get`、`/paymentTypes/get/v2`、`/paymentWays/get`、`/systemConfig/checkInGuideShowStrategy/get` | 已接入 | 页面改为 `smartHotelGlobalSetting` 服务层驱动，并输出 diagnostics | `tests/smart-hotel-global-setting.spec.ts` 首屏断言；`default-target-20260519075620-*` 与 `default-clone-20260519-local-success-*` |
| 页签 | `入住规则 / 入住指引 / WIFI上网` | 切换不同配置面板 | 无新增请求，消费同一聚合响应包 | 已接入 | 页签切换改为消费服务模型，切换时给出状态反馈 | Playwright 点击 `入住指引` 后断言 `aria-selected=true` |
| 身份验证 | `充值` | 查看实名认证与短信余量详情 | 未来复用 `smsAccount/get`、`paymentTypes/get/v2` 聚合结果 | 已接入 | 新增 `认证与短信余量详情` 弹窗，展示实名认证余量、短信余量、支付通道 | Playwright 点击 `充值` 后断言弹窗、文案与关闭 |
| 押金 | `查看支付方式` | 查看押金与收款通道 | 未来复用 `paymentWays/get`、`paymentTypes/get/v2` | 已接入 | 新增 `押金与收款方式` 弹窗，展示微信/支付宝/银行卡 | Playwright 点击 `查看支付方式` 后断言弹窗与关闭 |
| 门锁密码 | `前往房型信息` | 跳转房型设置页以承接时间策略配置 | 未来复用 `roomCategories/page/get`、`weiRoomCategories/page/get` | 已接入 | 以按钮路由跳转 `/setting/roomTypeInfo`，不在当前页做假保存 | Playwright 点击后断言路由 |
| 短信发送密码 | `查看短信模板` | 查看短信模板明细 | 未来复用 `smsTemplateMsgConfig/page/get` | 已接入 | 新增短信模板弹窗，展示 `获得密码（智能入住）`、`实名登记（智能入住）` 等模板 | Playwright 点击后断言模板弹窗与关闭 |
| 指南页 | `前往智住小程序` | 跳到智住小程序配置页 | 复用项目既有路由 `/smartHotel/smartSettings` | 已接入 | 使用 `<Link>` 承接路由，不造新页 | Playwright 点击后断言路由 |
| 开关控件 | 自动邀请、收押金、入住状态、脏房限制、提前入住密码 | 当前目标站大多为禁用/统一策略控制 | 未来复用 `/systemConfigs/get` 与 `checkInGuideShowStrategy/get` | 已接入 | 所有开关保留禁用态并给出统一策略反馈，不做静默点击 | 本地 success 取证 DOM 与状态栏反馈；按钮不再无响应 |
| 底部保存 | `保 存` | 当前模式下禁用，不允许误提交 | 未来保存将复用聚合配置保存接口 | 已接入 | 保存按钮显式 disabled，并提示当前模式无需保存配置 | Playwright 断言按钮 disabled |
| 空态 | `当前门店暂未同步可配置房型` + `前往房型信息` | 缺少房型绑定时提示并引导去配置 | 未来复用 `roomCategories/page/get` 空响应 | 已接入 | 新增 empty provider 分支与引导按钮 | Playwright `mockState=empty` 断言 |
| 错误态 | `全局设置数据加载失败` + `重新加载` | 加载失败时显示错误与重试入口 | 未来适配统一响应包错误码 | 已接入 | 新增 error provider 分支；重试移除 `mockState=error` 恢复 success | Playwright `mockState=error` 断言 |
