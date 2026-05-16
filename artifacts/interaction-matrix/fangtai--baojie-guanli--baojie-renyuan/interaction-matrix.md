# 保洁人员交互矩阵

任务：`fangtai--baojie-guanli--baojie-renyuan`  
页面：`保洁人员`  
目标 URL：`https://minsubao.localhome.cn/cleanManage/cleanStaff`  
取证批次：`20260516-95-audit`  
证据来源：项目 Playwright 固定 Chrome，复用 `playwright/.auth/pms-user.json`，未使用 Codex in-app Browser / Edge 作为最终证据。

## 取证结论

- 目标站登录态有效，未出现登录页、滑块或权限阻塞。
- 当前真实业务状态为未开通智能保洁遮罩态，页面仍展示 `保洁人员`、门店筛选、姓名/手机号搜索、`添加成员`、未开通横幅和 `订阅开通`。
- 目标站首屏会请求真实接口，关键请求见 `artifacts/network/fangtai--baojie-guanli--baojie-renyuan/real-request-summary-20260516-95-audit.json`。
- 本地页当前保持同一未开通遮罩态，不渲染保洁人员伪表格或伪成员数据；订阅入口跳转到项目已有 `/version/applicationPayment/detail`。

## 矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 页面入口 | `/cleanManage/cleanStaff` 路由 | 进入房态顶栏下的保洁管理，侧栏展示保洁任务/统计/人员/设置/日志，保洁人员处于当前页 | 首屏加载 `camps/get`、`camp/get`、`menus/project/get`、`edition/resource/get`、`cleaner/page/get`、`select/poi/page/get` 等 | `src/App.tsx` 已注册路由，`src/data/mock.ts` 已有保洁人员菜单，`AppShell` 可高亮保洁管理 | 保持既有路由和菜单，不扩大到全局壳层重构 | `tests/clean-staff.spec.ts` 进入页面断言标题、菜单内容、未开通遮罩；`scripts/capture-clean-staff.mjs --clone` 产出 clone 截图 |
| 顶部筛选 | 全部门店 / 天落会宿公寓 | 点击门店项后目标站选中对应门店，页面仍处于未开通智能保洁遮罩态 | 取证中未观察到额外业务列表刷新成功，首屏已有 `select/poi/page/get` 提供门店上下文 | 本地按钮切换 `aria-pressed` 和 `is-active`，未伪造成员数据 | 保持门店切换为本地状态反馈，未接入假数据；真实请求作为 target 证据记录 | `store-tab-target-20260516-95-audit.*` 与 `store-tab-clone-20260516-95-audit.*`；Playwright 断言按钮 `aria-pressed` |
| 顶部筛选 | 姓名/手机号搜索框 | 目标站允许输入搜索关键字，当前未开通态下不出现成员结果 | 取证中输入 `185` 未观察到额外成功列表渲染；首屏已有 `cleaner/page/get` | 本地输入框可输入并保持值，不伪造搜索结果 | 保持输入反馈，真实搜索结果因当前账号未开通而作为业务阻塞记录 | `keyword-search-target-20260516-95-audit.*` 与 `keyword-search-clone-20260516-95-audit.*`；Playwright 填入值断言 |
| 顶部操作 | 添加成员 | 目标站当前未开通态下点击后无可用成员弹层，仍保留未开通遮罩 | 没有观察到可继续的新增成员提交接口；`cleaner/page/get` 为首屏取证接口 | 本地点击后不打开伪新增成员弹层，不伪造成员保存成功 | 保持和目标一致：未开通态不开放真实新增；阻塞记录为“智能保洁未开通，添加成员业务不可继续” | `add-member-target-20260516-95-audit.*` 与 `add-member-clone-20260516-95-audit.*`；`tests/clean-staff.spec.ts` 断言不出现邀请成员弹层 |
| 主内容 | 未开通智能保洁遮罩 | 显示 `限时钜惠！智能保洁6折开通`、`自动派单 ｜实时提醒 ｜ 报表清晰` 和背景图 | `edition/resource/get`、`cleaner/page/get` 等确认当前业务资源与未开通态 | 本地展示同一未开通横幅和 OSS 背景图，不渲染伪人员表格 | 保持静态资源为目标站取证资源；不新增随机数据或 mock 列表 | 默认 target/clone 截图、DOM、style dump；`tests/clean-staff.spec.ts` 断言无 `保洁人员列表` 表格 |
| 跨页入口 | 订阅开通 | 点击跳转到真实站 `/version/applicationPayment/detail`，显示智能保洁商品详情与购买信息 | 跳转后目标站请求应用订阅详情相关资源和支付类型接口 | 本地跳转到已有 `/version/applicationPayment/detail`，显示智能保洁购买页 | 已按项目现有路由协调，不硬编码不存在页面 | `subscribe-click-target-20260516-95-audit.*` 与 `subscribe-click-clone-20260516-95-audit.*`；Playwright 断言 URL |
| 状态反馈 | loading / error / empty / disabled / blocker | 真实站当前没有成员表格成功态，未开通态本身是业务 blocker；目标未暴露错误页 | 真实接口均以 200 返回，未触发登录/403/验证码/CORS 阻塞 | 本地展示未开通 blocker，不吞掉接口错误，因为本页未伪造实时接口请求 | 将实时接口接入缺口记录为阻塞：本地 SPA 没有已认证 PMS API 代理，不能安全直连写入/保存类接口 | 本矩阵、实时记录和网络摘要；专项测试覆盖未开通态和订阅跳转 |
| 浏览器刷新 | 刷新当前路由 | 目标站刷新后恢复未开通智能保洁遮罩态 | 首屏重新触发同类真实请求 | Vite 预览刷新后恢复同一页面状态 | 保持路由可刷新访问，不依赖内存跳转 | `scripts/capture-clean-staff.mjs --clone` 默认态刷新取证；Playwright `page.goto('/cleanManage/cleanStaff')` |

## 真实请求摘要

见 `artifacts/network/fangtai--baojie-guanli--baojie-renyuan/real-request-summary-20260516-95-audit.json`。本页关键真实接口包括：

- `POST https://hudson-prod.localhome.cn/camps/get`
- `POST https://hudson-prod.localhome.cn/camp/get`
- `POST https://hudson-prod.localhome.cn/select/poi/page/get`
- `POST https://hudson-prod.localhome.cn/edition/resource/get`
- `POST https://hudson-prod.localhome.cn/cleaner/page/get`
- `POST https://hudson-prod.localhome.cn/weiRoomCategories/page/get`
- `POST https://hudson-prod.localhome.cn/rooms/get`
- `POST https://hudson-prod.localhome.cn/paymentTypes/get/v2`

## 阻塞与差异

- 当前本地页没有可安全复用的已认证 PMS API 代理，不能在浏览器中可靠直连写入类保洁人员接口；因此不实现假新增、假保存、假成功。
- 目标站当前业务态是未开通智能保洁，不存在可验证的成员表格成功态；本地不渲染伪成员列表。
- 本地 AppShell 与目标站真实 AntD 壳层、字体图标、右侧会话浮层存在全局差异，非本页局部重构范围。
