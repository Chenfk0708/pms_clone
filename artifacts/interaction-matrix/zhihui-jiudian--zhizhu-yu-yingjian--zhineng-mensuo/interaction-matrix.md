# 智能门锁交互矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 顶部导航 | `智慧酒店` 顶部高亮、`智能门锁` 侧栏高亮 | 进入门锁页后保持智慧酒店主导航与硬件子菜单高亮 | 无新增请求，依赖 `AppShell` 路由态 | 已完成 | 修复入口被其他坏页阻断的问题，保证 `/smartHotel/smartHardware/smartLook` 可真实渲染 | `tests/smart-door-lock.spec.ts` 首屏断言 |
| 页面首屏 | 页面标题、最近同步、诊断节点 | 展示门锁工作台、同步时间和当前 provider/state | `fetchSmartDoorLockDashboard(query)`；未来建议 `POST /smartHotel/smartLock/dashboard` | 已完成 | 新增统一服务层 `src/services/smartDoorLock.ts`，页面只消费适配后的业务模型 | Playwright 首屏断言 `data-provider/data-state/data-active-tab` |
| 顶部操作 | `刷新数据` | 按当前 tab 与 query 重新加载数据 | `fetchSmartDoorLockDashboard` | 已完成 | 刷新前重置局部状态并显示 loading，完成后更新时间与反馈文案 | Playwright error/retry 流程与手动刷新验证 |
| 顶部操作 | `前往路客商城` | 进入路客商城承接页 | 项目现有路由 `/version/localsMall` | 已完成 | 复用既有商城路由，不新造不可访问链接 | Playwright 首屏可见性断言 |
| Tab 切换 | `密码门锁` / `房卡门锁` | 两个门锁类型切换，房卡页先选品牌再决定登录或开通 | 本地状态切换；未来 dashboard query `tab=password/card` | 已完成 | 对齐真实页 JS 契约，显式保留两个 tab 和房卡品牌入口 | Playwright 点击房卡 tab 后断言 `data-active-tab=card` |
| 品牌入口 | 房卡品牌 `慧享佳` | 打开门锁登录弹窗，录入账号和密码后绑定成功 | `submitSmartDoorLockAccount(payload)`；未来建议 `POST /smartHotel/smartLock/account/bind` | 已完成 | 增加登录弹窗、字段校验、提交反馈、成功后回写已绑定账号卡片 | Playwright 登录绑定流程断言 |
| 品牌入口 | 房卡品牌 `门卡管理系统` | 未开通时弹确认框，确认后跳转商城开通 | 无真实接口；未来可接 `POST /smartHotel/smartLock/card-system/precheck` | 已完成 | 明确未开通提示、确认关闭、`立即开通` 跳转 `/version/localsMall` | Playwright 未开通流断言 |
| 账号卡片 | `同步记录` | 已绑定账号可触发同步反馈；禁用账号需暴露不可同步原因 | 本地状态反馈；未来建议 `POST /smartHotel/smartLock/account/sync` | 已完成 | 对不同账号状态输出可见反馈，不做静默点击 | 首屏与房卡绑定后状态栏断言 |
| 账号卡片 | `查看详情` | 打开账号详情弹窗 | 无新增请求；未来可接账号详情接口 | 已完成 | 账号详情统一走弹窗承接，不落到空白链接 | 手动验证弹窗内容 |
| 空态 | 空状态文案、`前往智能硬件商城` | 无已绑定账号时仍能继续去商城采购或配置 | 无新增请求，取自 dashboard `state=empty` | 已完成 | 统一空态结构与业务文案，不展示开发态占位 | Playwright empty 态断言 |
| 错态 | 错误告警、`重新加载` | 请求失败时展示明确错误并允许回到默认路由重试 | `fetchSmartDoorLockDashboard(mockState=error)` | 已完成 | 显式 error state、可重试、重试后恢复默认成功态 | Playwright error/retry 断言 |

## 取证依据

- 真实页 JS 契约：`tmp/smart-look-target.chunk.js`
- 本地实现：`src/pages/SmartDoorLockPage.tsx`
- 本地服务层：`src/services/smartDoorLock.ts`
- 自动化验证：`tests/smart-door-lock.spec.ts`
