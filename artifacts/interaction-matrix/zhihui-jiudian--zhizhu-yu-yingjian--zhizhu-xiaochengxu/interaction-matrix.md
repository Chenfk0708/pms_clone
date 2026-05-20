# 智住小程序交互矩阵

## 取证口径

- 目标站真实取证以 `artifacts/screenshots|dom-snapshots|style-dumps|network/zhihui-jiudian--zhizhu-yu-yingjian--zhizhu-xiaochengxu/` 中 `*20260519-165953*`、`*20260519-170322*` 产物为准。
- 本地闭环取证以同目录下 `default-clone-20260519-170216-*`、`share-clone-20260519-170217-*`、`empty-clone-20260519-170217-*`、`error-clone-20260519-170217-*`、`interaction-clone-20260519-170218-*` 为准。
- 目标站当前稳定可见的是“装修 + 分享 + 按钮配置”页；交互扫面中只有顶部“设置”稳定跳转，其余 `preview/save/qr-code` 等 slug 不能直接当作目标站真实业务行为结论。
- 本地页为了满足 prompt111 的 95 分闭环要求，补齐了装修保存、分享发布、预览承接、空态恢复、错误重试和 diagnostics 契约暴露。

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口与导航 | 路由 `/smartHotel/smartSettings`、左侧菜单高亮 | 真实站点可进入 `https://minsubao.localhome.cn/smartHotel/smartSettings`，菜单归属 `智慧酒店 > 智住与硬件 > 智住小程序` | 无专属接口，请求由页面自身触发 | 已挂接现有壳层与侧栏，`智慧酒店`、`智住小程序` 高亮 | 保持复用现有路由与 layout，不新增平行入口 | `tests/smart-hotel-settings.spec.ts` 首屏断言标题、菜单高亮、URL |
| 服务契约 | diagnostics 节点 `data-testid="smart-hotel-settings-service-contract"` | 目标站无该调试节点 | 本地统一暴露 `provider/state/request`，便于回归与联调 | 已落地，默认 `mock + success` | 保持隐藏式诊断，不污染正文 | Playwright 断言 `data-provider="mock"`、`data-state="success|empty|error"` |
| 页面首屏 | 装修/分享 tabs、版本号、状态反馈 | 目标站默认首屏可见 `装修`、`分享`、7 行按钮配置、保存按钮，版本号为 `v4.10.7` | 目标站未明显暴露单独 dashboard 接口；本地收敛到 `GET /smartHotelSettings/dashboard/get` | 已按统一服务层加载，反馈区显示加载/成功信息 | 用统一 dashboard 服务驱动首屏，不在组件内散落常量 | 首屏用例断言 tabs、版本号、按钮行数、预览区 |
| 装修 tab | 7 行按钮配置列表 | 目标站真实可见 7 行，每行含拖拽、上传、按钮名称、弹框文案、删除 | 本地保存走 `POST /smartHotelSettings/decorate/save`，上传走 `POST /smartHotelSettings/button/icon/upload` | 已支持编辑、上传、删除、添加、保存 | 将按钮配置统一映射为 `buttons[]`，避免组件内硬编码不同结构 | Playwright 断言 7 行、字段 maxlength、上传按钮、删除按钮 |
| 装修 tab | 添加按钮 | 目标站首屏可见“添加按钮”，本轮未稳定抓到点击后的真实增行行为 | 未来建议仍复用装修保存接口的 `buttons[]` 全量提交 | 本地点按后追加 1 行 `custom-*` 按钮 | 用本地增行承接目标站可见入口，形成可保存状态 | 交互用例断言 7 -> 8 行 |
| 装修 tab | 上传图片 | 目标站真实可见“上传图片”入口，但未抓到稳定上传请求 | 本地走 `POST /smartHotelSettings/button/icon/upload`，记录 `buttonId/buttonName` | 已返回上传成功反馈，不做静默假成功 | 显式反馈上传结果并写 diagnostics | 交互用例断言状态区出现“已更新…图标” |
| 装修 tab | 删除按钮 | 目标站真实可见删除图标，但未抓到稳定删除后请求 | 本地仍通过 `buttons[]` 本地变更，统一交由保存接口持久化 | 已支持删除，且至少保留 1 行 | 删除不直接伪造后端请求，避免与保存链路割裂 | 交互用例断言新增后删除回到 7 行 |
| 装修 tab | 保存 | 目标站首屏可见保存按钮，但 interaction sweep 未稳定命中真实保存行为 | 本地走 `POST /smartHotelSettings/decorate/save` | 已支持保存中禁用、保存后反馈与“左侧预览已同步”提示 | 统一收口为显式保存，而不是输入即假持久化 | 交互用例断言点击后反馈“装修配置已保存” |
| 预览区 | 左侧住客服务预览卡 | 目标站有预览区，但未通过 sweep 严谨取到具体预览按钮行为 | 未来若接真接口，仍应由 `previewAction` 描述 route/dialog 行为 | 本地用 `previewButtons` 驱动预览，支持路由与弹窗两类承接 | 用数据驱动预览按钮行为，不把承接逻辑写死在 JSX 分支里 | 首屏用例断言预览区存在；手工与 interaction 产物核对 |
| 预览区 | 路由承接：入住登记/入住指引 | 目标站未稳定抓到预览区点击；interaction sweep 中 `room-guide` 未命中真实目标站元素 | 复用现有项目路由 `/smartHotel/smartHome`、`/smartHotel/checkInGuide` | 本地点击 `入住指引` 预览按钮会跳 `/smartHotel/checkInGuide` | 用已有业务页承接，而不是空路由或无响应按钮 | `interaction-clone-20260519-170218-room-guide.png` 与路由断言 |
| 预览区 | 弹窗承接：入住须知/WIFI/续住/退房/发票 | 目标站 sweep 未稳定取到此类弹窗成立 | 未来如后端需要，可继续沿用 `previewAction.kind='dialog'` | 本地已支持弹窗打开、关闭、主按钮跳转 | 对没有现成页面的场景，用业务弹窗承接而不是占位文案 | 手工回归与源码 `previewAction` 核对 |
| 分享 tab | tab 切换 | 目标站真实可见分享 tab，但未在 target sweep 中自动展开 | 未来分享设置仍建议挂在同一 dashboard/发布链路下 | 本地点按即可切到分享态 | 用显式 tab 状态管理分享编辑态 | Playwright 用例断言 `aria-selected` 切换 |
| 分享 tab | token 插入 | 目标站分享卡标题区可见变量按钮，但未单独扫到真实插入行为 | 本地通过 `shareDraft.titleTemplate` 内联追加占位符 | 已支持插入门店名称、预订人姓名、入住日期、离店日期 | 保持无副作用追加，不重复插入同 token | 分享用例点击“预订人姓名”后可发布 |
| 分享 tab | 分享图片模式 radio | 目标站真实可见默认海报/房源首图/自定义三种模式 | 本地最终发布走 `POST /smartHotelSettings/share/publish` | 已支持三种模式切换 | 统一以 `imageMode` 枚举建模 | 分享用例断言默认选中与切换到 `custom` |
| 分享 tab | 上传图片 | 目标站可见上传图片入口，未抓到稳定真实上传链路 | 当前本地先内聚到分享草稿字段 `customPosterName`，后续可补独立上传接口 | 已支持设置自定义海报文件名 | 当前不额外伪造上传接口，避免超出本轮范围 | 分享用例点击后仍可继续发布 |
| 分享 tab | 二维码/复制链接 | 目标站 interaction 中 `qr-code` slug 未找到稳定对象，不能宣称真实站点已证实该链路 | 未来可拆为二维码下载任务接口和分享链接复制前端动作 | 本地已提供“下载二维码”“复制链接”反馈 | 先形成业务反馈闭环，待后端确认是否需要独立接口 | `share-clone-20260519-170217-*` 产物与手工回归 |
| 分享 tab | 保存并发布 | 目标站 sweep 未严格命中真实保存发布动作 | 本地走 `POST /smartHotelSettings/share/publish` | 已支持发布中禁用、发布后反馈、右侧卡片标题刷新 | 用统一发布接口收口分享配置提交 | 分享用例断言反馈“分享配置已保存并发布” |
| 空态 | `?mockState=empty` | 目标站未取到真实空态 | 本地 dashboard 成功返回 `emptyState` 与空 `buttons[]` | 已展示空态卡、保留 tab 壳层和恢复入口 | 用业务空态承接，不让页面塌陷 | Playwright 空态用例断言恢复默认按钮入口存在 |
| 空态 | 恢复默认按钮 | 目标站未取到该行为 | 本地直接恢复 `createDefaultSmartHotelSettingsButtons()` | 已将空态恢复回可编辑默认 7 按钮 | 保证空态能回到可操作成功态 | 空态用例与手工回归 |
| 错误态 | `?mockState=error` | 目标站未稳定暴露错误页 | 本地 dashboard 返回非 0 code，页面显式报错 | 已展示 alert 与“重新加载”按钮 | 明确暴露错误，不做静默 fallback | Playwright 错误用例断言 alert 与重试按钮 |
| 错误态 | 重新加载 | 目标站无证据 | 本地通过 `navigate('/smartHotel/smartSettings', { replace: true })` 重置查询 | 已可从 error 回到默认成功态 | 使用显式路由重载承接重试 | 手工回归与错误态用例 |

## 关键差异说明

- 目标站 interaction sweep 中 `program-settings` 实际点到了顶部全局“设置”，跳转到 `InformationMaintenance/informationOverview`；这不是本地分享区或装修区内部按钮的等价行为。
- 目标站 current batch 未稳定取到“二维码”“预览”“保存”“开关”等行为成立，因此这些不能写成“目标站已证实”；本地仅将其实现为 prompt111 所需的业务闭环。
- 本地 interaction sweep 的 `program-settings` 也同样命中了顶部全局“设置”，因此该 slug 只能说明探针命中策略过泛，不能用来证明本页业务点位。
- 本地 `preview/save` 两个 slug 受标签模糊匹配影响，分别命中了说明文案或非理想对象；严谨验收仍以专项 Playwright 用例和人工核对为主。

## 关键证据路径

- 目标站默认态：`artifacts/screenshots/zhihui-jiudian--zhizhu-yu-yingjian--zhizhu-xiaochengxu/default-target-20260519-165953-viewport.png`
- 目标站交互态：`artifacts/style-dumps/zhihui-jiudian--zhizhu-yu-yingjian--zhizhu-xiaochengxu/interaction-target-20260519-170322-facts.json`
- 本地默认态：`artifacts/screenshots/zhihui-jiudian--zhizhu-yu-yingjian--zhizhu-xiaochengxu/default-clone-20260519-170216-viewport.png`
- 本地分享态：`artifacts/screenshots/zhihui-jiudian--zhizhu-yu-yingjian--zhizhu-xiaochengxu/share-clone-20260519-170217-viewport.png`
- 本地交互态：`artifacts/style-dumps/zhihui-jiudian--zhizhu-yu-yingjian--zhizhu-xiaochengxu/interaction-clone-20260519-170218-facts.json`
- 本地空态：`artifacts/screenshots/zhihui-jiudian--zhizhu-yu-yingjian--zhizhu-xiaochengxu/empty-clone-20260519-170217-viewport.png`
- 本地错误态：`artifacts/screenshots/zhihui-jiudian--zhizhu-yu-yingjian--zhizhu-xiaochengxu/error-clone-20260519-170217-viewport.png`
