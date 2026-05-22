# 品牌官网交互矩阵

任务：`ota--siyu--pinpai-guanwang`  
页面：OTA > 私域 > 品牌官网  
本地路由：`/mallManagement/weapp/decorate`  
取证日期：2026-05-18 至 2026-05-19

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口与导航 | OTA > 私域 > 品牌官网 | 固定 Chrome 进入 `/mallManagement/weapp/decorate`，左侧显示 OTA、社媒、私域，品牌官网高亮 | 首屏加载多个 Hudson 请求，包含 `camps/get`、`camp/get`、`menus/project/get`、`uiComponentTemplate/group/page/get`、`uiComponent/admin/get` | 项目路由已进入 `BrandWebsitePage`，本地菜单和页面导航可见 | 保留本地路由，页面内复刻目标站的模块菜单和页面导航 | `scripts/verify-brand-website.mjs` 断言页面标题和品牌官网主体渲染 |
| 顶部筛选 | 运营日期 | 目标站存在日期控件及运营上下文请求 | 同上，`businessDate` 进入服务层请求体 | 日期控件默认 `2026-05-18`，按钮加载期间禁用 | 查询时同步 `businessDate`，不在组件硬编码结果 | 验证脚本填 `2026-05-19` 后断言 contract 包含 `"businessDate":"2026-05-19"` |
| 顶部筛选 | 查询 | 目标站刷新当前页面配置和运营数据 | `loadBrandWebsiteData(query)` | 点击后短暂 loading，成功后状态条显示“已按当前条件更新品牌官网” | 接入显式服务层并把请求 echo 写入隐藏 contract 节点供验收 | `scripts/verify-brand-website.mjs` 覆盖 filter request parameters |
| 顶部筛选 | 重置 | 目标站恢复默认条件并重新查询 | `loadBrandWebsiteData(defaultQuery)` | 恢复默认门店、日期、关键词，状态条反馈 | 不做静默复位，重置后重新走服务层 | Playwright 专项测试覆盖重置按钮可见和空态重置 |
| 顶部筛选 | 刷新 | 目标站重新拉取当前条件数据 | 同当前查询请求体 | 点击后显示“品牌官网数据已刷新”，按钮 loading 期间禁用 | 复用 `loadWithFeedback()`，避免重复提交 | 验证脚本点击刷新并断言反馈 |
| 顶部筛选 | 导出 | 目标站导出接口未在本次取证中确认 | 建议 `POST /mallManagement/weapp/decorate/export/create` | 点击后显示“导出任务已创建，可在下载中心查看” | 先用业务态反馈承接，接口文档列为后端待确认 | 验证脚本点击导出并断言反馈 |
| 核心指标 | 今日访问、官网订单、套餐成交、新增会员 | 目标站原页主要是装修配置页，指标为本地业务化补齐 | 聚合接口 `metrics[]` | 指标由 `src/services/brandWebsite.ts` 返回，点击指标卡会打开详情弹窗并更新状态条反馈 | 用服务层业务模型驱动，补齐按钮闭环，支持门店切换后指标变化 | `tests/brand-website.spec.ts` 覆盖指标详情弹窗；`scripts/verify-brand-website.mjs` 覆盖指标点击、弹窗关闭和状态反馈 |
| 页面导航 | 模板市场 | 目标站展示露营地、酒店、民宿、默认模板，每个模板有一键使用和预览图 | `templates[]`，目标站相关请求 `uiComponentTemplate/group/page/get` | 默认激活模板市场，展示 4 个模板 | 模板列表来自服务层，图片使用目标站 OSS 资源 | 成功态截图 `default-clone-20260519-95-local-success-full.png` |
| 模板市场 | 一键使用 | 目标站按钮文案为“一键使用”，实际写入接口未在取证中确认 | 建议 `POST /mallManagement/weapp/decorate/template/apply` | 点击后状态条显示“已应用{模板名}” | 先提供业务态反馈，不写假请求 | 验证脚本点击“酒店主题模板 一键使用”并断言反馈 |
| 模板市场 | 查看详情 | 目标站点击模板卡主要用于选择/预览 | 不一定触发请求，可复用模板字段 | 本地打开 `role="dialog"` 模板详情弹窗，展示场景和色板 | 用弹窗承接详情，不跳不存在页面 | 验证脚本打开并关闭模板详情 |
| 店铺主页 | 保存配置 | 目标站系统页面含店铺主页配置 | 建议 `POST /mallManagement/weapp/decorate/store/save` | 展示手机首页预览和店铺名称，点击保存给业务反馈 | 组件只读 `pageConfig` 和 `routeTargets` | 交互脚本可点击“店铺主页”截图；专项验证覆盖页面主体 |
| 店铺主页 | 快捷入口：房态、订单、套餐、设置 | 目标站配置页关联既有业务页面 | 路由承接，不新增接口 | 点击跳转项目已有路由 `/houseManage/days`、`/mallManagement/orderManagement`、`/mallManagement/hotelProduct`、`/InformationMaintenance/campInfo` | 优先使用项目现有路由，不硬编码不存在页面 | 人工从本地页面点击可确认；路由写入接口文档 `routeTargets[]` |
| 个人中心 | 保存配置 | 目标站系统页面含个人中心配置 | 建议 `POST /mallManagement/weapp/decorate/profile/save` | 展示个人中心手机预览、待办按钮和保存反馈 | 待办来自 `todos[]`，点击有处理反馈 | 页面专项测试覆盖个人中心入口可点击 |
| 领券活动 | 活动名称搜索 | 目标站品牌官网与优惠券活动关联，具体接口待确认 | 聚合接口请求体 `keyword`；正式可复用优惠券活动接口 | 输入框在领券活动页签展示，搜索后过滤 `coupons[]` | `filterCoupons()` 在服务层处理关键词，不在组件内拼数据 | 验证脚本输入“春季”并点击搜索，断言“已筛选领券活动” |
| 领券活动 | 新建活动 | 目标站写入路径待确认 | 建议复用优惠券/活动保存接口 | 当前打开活动详情弹窗承接，避免无响应 | 没有正式规则时用 mock 详情弹窗承接 | 验证脚本点击“新建活动”并断言活动详情弹窗 |
| 领券活动 | 查看详情 | 目标站详情承接方式待确认 | 可复用 `coupons[]` 行字段或未来详情接口 | 点击行内查看详情打开弹窗 | 给出有效反馈，不跳缺失页面 | 专项测试覆盖活动详情弹窗 |
| 通用导航 | 底部导航输入和保存 | 目标站通用组件含导航配置 | 建议 `POST /mallManagement/weapp/decorate/navigation/save` | 显示底部导航预览，输入框可编辑，保存并发布有反馈 | `bottomNavigation[]` 由服务层返回 | 交互截图脚本可覆盖“通用导航”页签 |
| 悬浮框 | 启用/不启用、上传、保存 | 目标站通用组件含悬浮框 | 建议 `POST /mallManagement/weapp/decorate/floating/save` | 单选框可切换，上传按钮和保存按钮均有反馈 | 以 `floatingButtonEnabled` 初始化状态 | 交互截图脚本可覆盖“悬浮框”页签 |
| 首页弹窗 | 启用/不启用、上传、保存 | 目标站通用组件含首页弹窗 | 建议 `POST /mallManagement/weapp/decorate/popup/save` | 单选框可切换，上传按钮和保存按钮均有反馈 | 以 `popupEnabled` 初始化状态 | 交互截图脚本可覆盖“首页弹窗”页签 |
| 全局风格 | 色板和保存 | 目标站含全局风格配置 | 建议 `POST /mallManagement/weapp/decorate/style/save` | 点击色板显示“全局风格颜色已更新”，保存有反馈 | 色板来自模板颜色，不在组件内写死 | 交互截图脚本可覆盖“全局风格”页签 |
| 空态 | `pms.brandWebsiteMockMode=empty` | 目标站未取证到明确空态，需后端确认细分原因 | 同一响应包 `code:0`，`templates/coupons` 为空 | 展示“暂无符合当前条件的品牌官网配置”和“重置条件” | 服务层支持 empty，不通过 fallback 伪造成功 | 本地取证 `default-clone-20260519-95-local-empty-*`；验证脚本断言空态 |
| 错误态 | `pms.brandWebsiteMockMode=error` | 目标站错误格式待确认 | 同一响应包 `code:50029`，`data:null` | 展示 `role="alert"` 错误态和“重试”，重试切回成功态 | adapter 清晰抛错，不吞错 | 本地取证 `default-clone-20260519-95-local-error-*`；验证脚本断言错误重试 |
| 开发态文案控制 | 页面正文 | 目标站正文不展示开发态提示 | 不触发接口 | 本地正文禁止出现 `mock/provider/未接入/阻塞/后端未就绪/接口契约/未取证` | contract 信息放隐藏测试节点，页面正文不展示 | `scripts/verify-brand-website.mjs` 对 bodyText 做禁词断言；三态 style facts `forbiddenTermsFound: []` |
| 取证 | 目标站首屏 | 固定 Chrome + storageState，未登录阻塞 | 目标 network 保存为 `default-target-20260518-95-target-responses.json` | 已有截图、DOM、style、network | 保留作为目标站证据，不写入凭证内容 | `artifacts/screenshots/ota--siyu--pinpai-guanwang/default-target-20260518-95-target-full.png` |
| 取证 | 本地 success/empty/error | 不适用 | 显式 mock provider | 三态均有截图、DOM、style、network | 固定 Chrome 采集 `20260519-95-local-*` 批次 | `artifacts/screenshots|dom-snapshots|style-dumps|network/ota--siyu--pinpai-guanwang/` |


## 2026-05-21 当前补充验证

- 新增目标站默认态取证：
  - `artifacts/screenshots/ota--siyu--pinpai-guanwang/default-target-20260521-current-target-default-full.png`
  - `artifacts/network/ota--siyu--pinpai-guanwang/default-target-20260521-current-target-default-responses.json`
- 新增目标站交互态取证：
  - `artifacts/screenshots/ota--siyu--pinpai-guanwang/interaction-target-20260521-current-target-interaction-full.png`
  - `artifacts/network/ota--siyu--pinpai-guanwang/interaction-target-20260521-current-target-interaction-responses.json`
- 新增本地默认态取证：
  - `artifacts/screenshots/ota--siyu--pinpai-guanwang/default-clone-20260521-current-local-success-full.png`
  - `artifacts/style-dumps/ota--siyu--pinpai-guanwang/default-clone-20260521-current-local-success-facts.json`
- 新增本地交互态取证：
  - `artifacts/screenshots/ota--siyu--pinpai-guanwang/interaction-clone-20260521-current-local-interaction-full.png`
  - `artifacts/style-dumps/ota--siyu--pinpai-guanwang/interaction-clone-20260521-current-local-interaction-facts.json`
- 当前脚本验证结论：
  - `scripts/verify-brand-website.mjs` 在 `http://127.0.0.1:4173/mallManagement/weapp/decorate` 通过。
  - 本地 interaction 批次记录到 8 个安全交互动作，目标站 interaction 批次完成页面快照与网络记录。