# 智能硬件商城交互矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 顶部导航 | `智慧酒店` 顶部导航高亮 | 进入智慧酒店模块后顶部导航保持高亮 | 无新增请求，依赖项目现有 `AppShell` 路由状态 | 已完成 | 沿用项目路由与侧栏分组，不新增独立导航逻辑 | `tests/smart-hardware-mall.spec.ts` 默认页断言顶部与侧栏高亮 |
| 列表页 Hero | `最近同步 / 智慧酒店一站式部署` | 展示商城首页业务说明与最近同步时间 | `fetchSmartHardwareMallOverview` -> 统一响应包 | 已完成 | 用 mock provider 输出 `requestedAtLabel`、标题和说明，不再写死在组件数组外侧 | `tests/smart-hardware-mall.spec.ts` 默认页断言标题、说明、provider 属性 |
| 商品卡片 | `立即购买` | 从默认页进入 `/smartHotel/smartHardware/mall/detail` | `fetchSmartHardwareMallDetail` | 已完成 | 购买按钮改为带 `productId` 的路由跳转，详情页按契约加载 | Playwright 用例与 `first-primary-clone-20260519190001-*` 产物 |
| 商品卡片 | `联系客服` | 目标站无可见新路由/弹层，需提供真实业务反馈 | mock 咨询任务，后续建议 `POST /smartHardware/mall/contact-task` | 已完成 | 打开咨询弹层，确认后创建 mock 咨询任务并给出 toast | `tests/smart-hardware-mall.spec.ts` 咨询流程断言 |
| 详情页 | `查看适用房型` | 根据已购商品查看适用房型与房间列表 | `fetchSmartHardwareApplicableRooms`，来源契约 `POST /rooms/get` | 已完成 | 以抽屉/弹层承接，展示 4 个房型与房间列表 | `tests/smart-hardware-mall.spec.ts` 详情页房型弹层断言 |
| 详情页 | `查看支付方式` | 根据业务类型查看可用支付分组 | `fetchSmartHardwarePaymentGroups`，来源契约 `POST /paymentTypes/get/v2` | 已完成 | 以抽屉/弹层承接，展示住宿分组与支付项 | `tests/smart-hardware-mall.spec.ts` 详情页支付方式弹层断言 |
| 详情页 | `购买协议` 复选框 | 未勾选前禁止成功提交 | `submit purchase` 前置校验 | 已完成 | 提交前显式校验协议勾选，失败走状态反馈，不做静默提交 | `tests/smart-hardware-mall.spec.ts` 详情页先失败再成功断言 |
| 详情页 | `提交购买申请` | 提交采购申请，后续进入硬件配置/专家跟进流程 | 后续建议 `POST /smartHardware/mall/purchase-submit` | 已完成 | 提交成功后打开结果弹层，并承接到 `智能门锁` 页面 | `tests/smart-hardware-mall.spec.ts` 提交成功与跳转断言 |
| 快捷入口 | `智能门锁` | 跳转到项目已有门锁页面 | 项目现有路由 `/smartHotel/smartHardware/smartLook` | 已完成 | 作为商城后续配置承接入口保留 | `tests/smart-hardware-mall.spec.ts` 提交成功后跳转断言 |
| 快捷入口 | `自助入住` | 跳转到项目已有自助入住页面 | 项目现有路由 `/smartHotel/smartHome` | 已完成 | 从商城承接到智慧酒店联动场景 | 默认页渲染断言 + 手动路由检查 |
| 快捷入口 | `全局设置` | 跳转到项目已有全局设置页面 | 项目现有路由 `/smartHotel/checkInGuide` | 已完成 | 空态和默认态都提供回到配置入口的承接 | `tests/smart-hardware-mall.spec.ts` 空态断言 |
| 空态 | `前往全局设置` | 当商城无可采购商品时提供明确承接 | `fetchSmartHardwareMallOverview(mockState=empty)` | 已完成 | 提供业务空态文案与跳转按钮，不展示开发态提示 | `tests/smart-hardware-mall.spec.ts` 空态断言 |
| 错误态 | `重新加载` | 当商城契约失败时允许用户重试 | `fetchSmartHardwareMallOverview(mockState=error)` / `fetchSmartHardwareMallDetail` | 已完成 | 显示 alert，重试后回到默认路由重新拉取 | `tests/smart-hardware-mall.spec.ts` 错误态断言 |

## 取证来源

- 目标站默认页：`artifacts/style-dumps/zhihui-jiudian--zhizhu-yu-yingjian--zhineng-yingjian-shangcheng/default-target-20260519-95-target-default-facts.json`
- 目标站详情页：`artifacts/style-dumps/zhihui-jiudian--zhizhu-yu-yingjian--zhineng-yingjian-shangcheng/first-primary-target-20260519-95-target-first-primary-facts.json`
- 目标站契约汇总：`artifacts/network/zhihui-jiudian--zhizhu-yu-yingjian--zhineng-yingjian-shangcheng/target-contract-20260519.json`
- 本地默认页：`artifacts/style-dumps/zhihui-jiudian--zhizhu-yu-yingjian--zhineng-yingjian-shangcheng/default-clone-20260519190000-facts.json`
- 本地详情页：`artifacts/style-dumps/zhihui-jiudian--zhizhu-yu-yingjian--zhineng-yingjian-shangcheng/first-primary-clone-20260519190001-facts.json`
