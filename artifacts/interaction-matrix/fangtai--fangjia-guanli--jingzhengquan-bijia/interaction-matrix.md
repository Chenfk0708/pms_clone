# 竞争圈比价交互矩阵

任务 ID：`fangtai--fangjia-guanli--jingzhengquan-bijia`  
目标 URL：`https://minsubao.localhome.cn/houseManage/priceComparison`  
本地 URL：`/houseManage/priceComparison`  
取证结论：当前账号在真实目标站进入本页后呈现未开通 `智能调价` 的订阅入口态；目标站仍会发起权限、配置、房型、比价配置、房态和订阅详情相关真实请求。本地页按该真实阻塞态实现，不脑补已开通后的比价表格。

| 区域 | 元素/按钮 | 目标站行为 | 触发请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 页面入口 | 顶部房价导航与侧栏 `竞争圈比价` | `/houseManage/priceComparison` 可访问，房价管理分组展开，`竞争圈比价` 高亮 | 首屏加载包含 `camps/get`、`menus/project/get`、`edition/resource/get`、`comparePriceConfig/*` 等请求 | 路由已接入 `PricePage` 竞争圈分支，侧栏来自项目现有 `AppShell` 和 `mock.ts` | 保持现有路由和菜单，不新增全局导航结构 | Playwright 访问本地路由，断言 `.price-comparison-page`、菜单文案、订阅入口可见 |
| 房价类型切换 | `中央价` tab | 点击跳转 `/houseManage/houseCale` | 目标站按对应价格页重新加载价格页资源和房价请求 | 本地已用 `PriceTabs` 跳转到 `/houseManage/houseCale` | 保持现有项目路由协调 | `tests/routes.spec.ts` 断言点击后 URL 为 `/houseManage/houseCale` |
| 房价类型切换 | `渠道RP价` tab | 点击跳转 `/houseManage/channelPrice` | 目标站加载渠道 RP 价资源和请求 | 本地 `PriceTabs` 已支持跳转 | 不扩大本页范围，复用相邻页面已有测试 | 相邻 `channel-price.spec.ts` 与路由回归覆盖 |
| 房价类型切换 | `竞争圈比价` tab | 当前页保持高亮 | 当前页首屏请求保持未开通态配置请求 | 本地 active tab 为 `竞争圈比价` | 已保持 | Playwright 断言 `.price-tabs button.is-active` 文案 |
| 主内容区 | 未开通智能调价空态 | 展示 `开通【智能调价】应用，使用【竞争圈比价】功能`、说明文案和开通入口，背景图来自 `price_compare_bg.png`、`COMPARE_UNPAID.png` | `edition/resource/get`、`comparePriceConfig/messageNotify/get`、`comparePriceConfig/roomStatus/get`、`priceAdjustConfig/get`、订阅与房型相关请求 | 本地展示对应未开通态文案和背景；新增可见数据接入状态，说明本地没有已认证 PMS API 代理 | 明确标记为目标站取证快照和实时接口阻塞，不假装实时请求成功 | `tests/routes.spec.ts` 断言空态文案、数据接入状态和阻塞说明可见 |
| 主操作 | `立即开通` | 跳转到应用订阅详情页，展示 `智能调价` 商品详情和购买信息 | 点击后加载 `ApplicationPaymentDetail` chunk，并请求订阅详情相关资源 | 本地点击跳 `/version/applicationPayment/detail?app=smartPricing`，进入已有订阅详情页；购买按钮需勾选协议后启用 | 保持项目已有订阅详情页，避免硬编码不存在弹层 | `tests/routes.spec.ts` 断言 URL、`智能调价` 标题、购买信息、协议勾选和按钮启用 |
| 订阅详情 | 协议 checkbox / `立即购买` | 未勾选协议时购买不可继续；勾选后可进入购买流程或后续支付 | 目标站会继续调用订阅/支付相关接口 | 本地详情页已有协议勾选和按钮启用/禁用反馈 | 真实支付不在本页范围，保留禁用/启用反馈，不造支付成功 | `tests/routes.spec.ts` 断言按钮禁用态和启用态 |
| 全局会话 | 右下角会话 dock | 展示生产会话入口，可收起/展开 | `imYunxinUser/get`、`systemMessage/unReadCount/get`、网易云信相关请求 | 本地使用共享 `ChatDock`，可收起并通过 launcher 展开 | 保持共享会话组件，不复制实现 | `tests/routes.spec.ts` 断言 `.chat-dock` 4 条会话、收起和展开 |
| 已开通后比价表 | 筛选、搜索、房型、渠道、价格表、配置项 | 当前账号未开通，真实目标站默认不展示可操作比价表；仅在网络中可见配置和房型相关请求 | 已捕获 `select/poi/get`、`select/roomCategoryProducts/parentProduct/page/get`、`roomCategoryPrice/salePriceSetting/get`、`comparePriceConfig/roomStatus/get` 等 | 本地不脑补已开通业务表格 | 记录为真实权限/订阅阻塞；后续换已开通账号后再按目标站补齐 | 本矩阵与 `clone_pms_prd.md` 记录阻塞；无虚假表格或 mock 比价数据 |
| 错误/阻塞 | 实时 API 接入 | 目标站同域携带登录态可请求；本地 Vite 没有已认证 PMS API 代理，直接跨域复用凭据不安全且可能 CORS/认证失败 | 不在本地直接携带 cookie/token 调用生产接口 | 旧本地页未暴露该限制；本轮已显示取证快照和阻塞说明 | 明确暴露阻塞，不新增静默 fallback、假成功或 mock 接口 | Playwright 断言 `竞争圈比价数据接入状态` 中含阻塞说明 |
