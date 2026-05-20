# 自助入住交互矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口与导航 | 侧栏 `智慧酒店 > 智住管理 > 自助入住` | 进入 `https://minsubao.localhome.cn/smartHotel/smartHome`，左侧显示 `自助入住 / 全局设置 / 智住小程序 / 智能硬件 / 公安对接` 子导航 | 无专属请求，依赖现有路由和菜单状态 | 本地路由为 `/smartHotel/smartHome`，Playwright 已断言 `智慧酒店` 和 `自助入住` 高亮 | 保持复用项目既有 Layout 与菜单，不新增平行入口 | `tests/smart-self-checkin.spec.ts` 首屏用例断言 URL、高亮和页壳状态 |
| 首屏加载 | 页面初始化 | 目标站首屏展示 `云端入住登记`、4 种方案、`场景流程`、`前台数字化（扫码）`、`自助机入住`；本页为多接口拼装而非单接口页 | 真实取证到 `/edition/resource/get`、`/order/report/get`、`/poi/digitization/process/get`、`/orders/strongReminder/page/get`、`/select/poi/page/get`、`/roomCategories/page/get`、`/paymentTypes/get`、`/paymentTypes/get/v2`、`/systemConfigs/get`、`/roomStatusesToday/get`、`/menu/optionJsons/get` | 本地已改为 `src/services/smartSelfCheckin.ts` 统一 mock provider，页面只消费适配后的业务模型 | 用显式 `mock/api` provider 承接页面，不在组件内散落常量和兼容逻辑 | Playwright 首屏用例断言 provider、标题、方案数量、关键卡片与入口 |
| 服务层 | `fetchSmartSelfCheckinDashboard` | 目标站没有单一 dashboard 请求，真实页由多接口组合 | 当前本地统一收敛为一个页面级服务，后续可在 adapter 内拆接真实接口 | 已支持 `mock` 默认、`api` 失败直出、`success/empty/error` 三态 | 继续把 provider 切换点集中在 `localStorage['pms.smartSelfCheckinProvider']`，避免组件 fallback | 单测/Playwright 通过默认态、empty、error 覆盖统一契约 |
| 顶部状态 | `云端入住登记开关` | 本轮 fixed Chrome 交互扫描未捕获到目标站可直接点击的开关控件，页面正文也未提取到“开启/关闭”按钮文本 | 未来若接真接口，建议复用统一 dashboard 更新接口或补独立 toggle 接口 | 本地开关可点击，反馈文案在 `已开启` 与 `已关闭` 间切换 | 以本地业务反馈承接开关操作，不伪装成已取证的目标站真实提交接口 | Playwright 点击 `云端入住登记开关`，断言 `aria-pressed=false` 与反馈文案包含 `云端入住登记已关闭` |
| 顶部状态 | `前往全局设置` | 目标站点击 `全局设置` 后跳转 `/smartHotel/checkInGuide` | 无新增请求；承接到已存在全局设置页 | 本地状态栏按钮跳转到 `/smartHotel/checkInGuide` | 保持直接复用已有全局设置路由 | interaction facts 记录 URL 变化；Playwright 断言跳转成功 |
| 方案卡片 | `未开通` | 目标站点击后原地打开 `付费购买` 弹层，文案为“此功能需要付费使用，请前往购买”，不发生路由变化 | 未来如接真接口，建议补订阅/购买线索接口；当前无需请求即可承接弹层 | 本地点击 `未开通` 打开 `付费购买` 弹窗，支持取消和联系专家 | 用业务弹层承接订阅动作，避免无反馈按钮 | target/local interaction facts 均证明原地开弹层；Playwright 继续覆盖本地弹层链路 |
| 方案卡片 | `查看规则` | 目标站本轮未捕获到 `查看规则` 按钮；现有页面文本只体现“仅发送门锁密码(直接入住)”方案描述 | 未来仍可复用全局设置页配置规则 | 本地首个方案提供 `查看规则`，点击后跳 `/smartHotel/checkInGuide` | 作为本地业务承接保留，保持与方案语义一致 | local interaction facts 记录从 `/smartHotel/smartHome` 跳到 `/smartHotel/checkInGuide` |
| 方案卡片 | `装修小程序` / `查看小程序` | 目标站本轮只捕获到 `下载二维码`，未捕获 `查看小程序` 按钮 | 未来应承接到智住小程序配置页 | 本地第二方案按钮文本为 `装修小程序`，扫码卡片次按钮为 `查看小程序`，都可跳 `/smartHotel/smartSettings` | 暂沿用现有路由承接；后续若文案要改成 `查看小程序`，只改展示文案不改跳转协议 | 专项 Playwright 已覆盖页面存在；后续可补按钮级断言 |
| 场景流程 | `编辑短信内容` | 目标站存在 `编辑短信内容` 按钮 | 未来如接真接口，建议补短信模板保存接口；当前由本地状态更新承接 | 本地点击后打开编辑弹窗，支持修改模板并保存 | 用弹窗 + 内存态更新承接短信模板编辑，成功后给出明确反馈 | Playwright 用例断言弹窗打开、修改 textarea、保存后反馈为 `短信模板已更新` |
| 方案卡片 | `复制短信模板` | 目标站正文可见短信模板，但本轮未单独取证复制行为 | 无需后端请求，属前端本地动作 | 本地调用 `navigator.clipboard.writeText`，失败则提示手动复制 | 保持显式成功/失败提示，不吞掉剪贴板异常 | 可通过手工回归或后续补测试验证反馈文案 |
| 扫码卡片 | `下载二维码` | 目标站存在可点击主按钮 `下载二维码` | 未来可接二维码生成/下载任务接口；当前未在目标站网络中明确捕获专属请求 | 本地点击后反馈“前台二维码下载任务已创建，可前往下载中心查看。” | 用业务态反馈承接下载任务创建，不展示开发占位词 | Playwright 用例断言反馈包含 `二维码下载任务已创建` |
| 扫码卡片 | `查看小程序` | 目标站本轮未捕获该次按钮 | 未来承接 `/smartHotel/smartSettings` | 本地次按钮跳智住小程序页 | 复用现有智住小程序路由 | 可补专项路由断言；当前首屏结构已覆盖 |
| 自助机卡片 | `联系智慧酒店专家` | 目标站存在可点击按钮 `联系智慧酒店专家`，本轮未继续下钻到后续弹层或外呼链路 | 未来可补咨询线索接口；当前无明确真实请求 | 本地点击后打开专家联系弹窗，显示服务时间、电话与跟进方式 | 用专家弹窗承接咨询动作，避免无反馈 CTA | Playwright 已断言弹窗可打开并关闭 |
| 自助机卡片 | `智能硬件商城` | 目标站正文未出现该次按钮；本地作为跨页承接 | 无新增请求；承接到项目现有路由 | 本地跳转 `/smartHotel/smartHardware/mall` | 保持与智慧酒店硬件链路一致 | 可在后续联动测试中补 URL 断言 |
| 相关入口 | `全局设置 / 智住小程序 / 智能门锁 / PSB 公安对接` | 目标站左侧菜单已存在这些入口；本页正文未额外提供同名按钮区块 | 无新增请求；全部优先复用项目已有路由 | 本地提供 4 个按钮，分别跳 `/smartHotel/checkInGuide`、`/smartHotel/smartSettings`、`/smartHotel/smartHardware/smartLook`、`/psb/list` | 用现有路由承接跨页闭环，不新增不存在的目标路径 | 首屏 Playwright 已断言 4 个入口可见；`全局设置` 跳转已被按钮用例覆盖 |
| 空态 | `?mockState=empty` | 目标站本轮未取证到该账号空态 | 建议沿用统一 dashboard 空态结构 `{ title, description, actionLabel, actionPath }` | 本地显示 `当前暂无可发布的自助入住方案`，并保留扫码卡片和相关入口 | 空态下仍保留页面壳和跨页入口，避免结构塌陷 | Playwright empty 用例断言空态区块、扫码卡片和相关入口同时存在 |
| 错误态 | `?mockState=error` | 目标站本轮未稳定暴露错误页 | 统一响应包失败态：`code != 0`，组件不做假成功 fallback | 本地显示 `自助入住加载失败` 与 `重新加载` 按钮 | 明确暴露错误并允许重试，不吞错 | Playwright error 用例断言 alert、点击 `重新加载` 后恢复正常页 |
| 诊断与配置 | provider 切换 | 目标站无该能力；仅用于本地联调切换 | `localStorage['pms.smartSelfCheckinProvider'] = 'api'` 时当前服务显式抛错 | 本地默认 `mock`，`api` 分支会直接暴露失败 | 保持显式失败，避免静默 fallback 掩盖未接接口状态 | 手工联调时可切 provider 验证；页面正文不展示开发态文案 |

## 目标站取证结论

- fixed Chrome 目标站产物位于 `artifacts/screenshots|dom-snapshots|style-dumps|network/zhihui-jiudian--zhizhu-yu-yingjian--zizhu-ruzhu/`。
- 目标站当前页是多接口拼装页面，核心可见结构与本地业务页方向一致，但未在本轮取证到可点击的 `查看规则` 和 `云端入住登记开关`。
- `未开通` 在目标站与本地都表现为原地打开购买弹层，不是跳新路由。
- `全局设置` 在目标站与本地都承接到 `/smartHotel/checkInGuide`。
- 本地补充了目标站未稳定取证到的按钮反馈、空态、错误态和跨页入口，用于满足 prompt111 要求的页面级闭环。
