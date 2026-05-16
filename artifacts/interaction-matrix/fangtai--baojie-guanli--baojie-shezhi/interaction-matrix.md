# 保洁设置交互矩阵

- TASK_ID: `fangtai--baojie-guanli--baojie-shezhi`
- PAGE_NAME: `保洁设置`
- TARGET_URL: `https://minsubao.localhome.cn/cleanManage/cleanSetting`
- 最近目标站取证批次: `headless-audit-20260515-134621`
- 最近本地修正取证批次: `headless-fixed-20260515-140302`
- 固定 Chrome: `C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe`
- 登录态: `playwright/.auth/pms-user.json`

## 目标站状态结论

固定 Chrome + storageState 可进入真实目标站，`isLoginBlocked=false`。当前账号在 `保洁设置` 下为未开通智能保洁状态，默认态和价格设置态均显示订阅引导，不展示早期取证中的真实配置表单。点击订阅开通进入 `/version/applicationPayment/detail`，展示智能保洁商品详情、购买信息、协议勾选和立即购买按钮。

## 交互矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口与导航 | 侧栏 `房态 > 保洁管理 > 保洁设置` | 进入 `/cleanManage/cleanSetting`，左侧保洁管理分组展开，保洁设置高亮，页面标题为保洁设置 | 首屏加载包含 `GET /cleanManage/cleanSetting`、`POST /menus/project/get`、`POST /cleanConfig/base/get`、`POST /edition/resource/get` 等 | `src/App.tsx` 已注册 `/cleanManage/cleanSetting`，`src/data/mock.ts` 已有菜单项，AppShell 对 `/cleanManage/` 使用房态侧栏 | 保持现有路由和布局，不新增全局路由改动 | `tests/routes.spec.ts` 的 `/cleanManage/cleanSetting renders` 断言页面根节点、tab 和内容可见 |
| 主内容 tab | `基础设置` | 默认选中，显示未订阅智能保洁引导，不展示配置表单 | 同首屏请求；无额外业务请求变化 | `CleanSettingPage` 默认 `activeTab='basic'`，展示订阅引导 | 保持与当前目标站一致；早期配置增强态不再渲染 | Playwright 断言 `基础设置` `aria-selected=true`，且 `创建保洁任务策略`/`设置保洁时段` 不存在 |
| 主内容 tab | `价格设置` | 点击后 tab 选中，仍显示同一未订阅智能保洁引导 | 目标站点击不改变 URL；取证 summary 记录 `click-price-tab`，未发现额外核心配置数据态 | 点击更新 `activeTab='price'`，遮罩仍存在 | 保持本地同页状态切换，避免伪造价格配置 | Playwright 点击 `价格设置` 后断言 `aria-selected=true` 与订阅引导仍可见 |
| 订阅引导 | `订阅开通` | 跳转 `/version/applicationPayment/detail`，进入智能保洁购买详情页 | 目标站加载订阅详情资源和接口，包括 `GET p__pc__VersionMannager__ApplicationPayment__ApplicationPaymentDetail...chunk.js`、`POST /weiRoomCategory/get` 等 | `navigate('/version/applicationPayment/detail')`，复用当前应用订阅详情分支 | 已按 2026-05-15 target 价格更新为 `¥1,232.46` 与 `¥2,194.38 / 年` | Playwright 点击后断言 URL、`智能保洁` 标题、商品详情、购买信息、价格和禁用购买按钮 |
| 购买详情 | 协议勾选框 | 勾选购买协议后，立即购买按钮由禁用变可用 | 无本页业务提交请求，按钮启用属于前端状态反馈 | `agreed` 状态驱动 `立即购买` disabled/enabled | 保持显式禁用态，避免未同意协议时假提交 | Playwright 勾选 `我已阅读并同意...` 后断言 `立即购买` enabled |
| 购买详情 | 返回 | 目标站购买详情可返回上级业务入口；本地提供返回保洁设置 | 本地路由跳转，无网络请求 | `navigate('/cleanManage/cleanSetting')` | 保持可回到本页，避免购买详情成为死路 | 本地手测/专项可从购买详情返回本页 |
| 未开通配置区 | 创建策略、保洁时段、密码权限等旧设置项 | 当前 2026-05-15 目标账号未展示这些设置项，被订阅引导替代 | `POST /cleanConfig/base/get` 有响应，但可见 UI 仍被订阅态阻断 | 本地已移除旧增强态可见内容 | 明确记录为账号订阅状态阻塞，不伪造可编辑配置表单 | Playwright 断言旧设置文案 count 为 0 |
| 错误与阻塞 | 登录态、权限、订阅状态 | 取证时 `isLoginBlocked=false`，未遇到登录表单或滑块；业务深层配置被未订阅状态阻断 | 目标站请求均记录到 `artifacts/network/...`；未订阅为业务状态，不静默降级 | 本地展示订阅引导和购买入口，不伪造成功配置保存 | 阻塞记录写入 PRD/看板；等待账号开通后再追加配置数据态 | summary JSON、网络清单、截图和本矩阵共同覆盖 |

## 关键证据路径

- 目标默认态: `artifacts/screenshots/fangtai--baojie-guanli--baojie-shezhi/default-target-headless-audit-20260515-134621-viewport.png`
- 目标价格态: `artifacts/screenshots/fangtai--baojie-guanli--baojie-shezhi/price-target-headless-audit-20260515-134621-viewport.png`
- 目标订阅态: `artifacts/screenshots/fangtai--baojie-guanli--baojie-shezhi/subscribe-target-headless-audit-20260515-134621-viewport.png`
- 本地修正默认态: `artifacts/screenshots/fangtai--baojie-guanli--baojie-shezhi/default-clone-headless-fixed-20260515-140302-viewport.png`
- 本地修正价格态: `artifacts/screenshots/fangtai--baojie-guanli--baojie-shezhi/price-clone-headless-fixed-20260515-140302-viewport.png`
- 本地修正订阅态: `artifacts/screenshots/fangtai--baojie-guanli--baojie-shezhi/subscribe-clone-headless-fixed-20260515-140302-viewport.png`
- 目标网络清单: `artifacts/network/fangtai--baojie-guanli--baojie-shezhi/default-target-headless-audit-20260515-134621-responses.json`
- 订阅网络清单: `artifacts/network/fangtai--baojie-guanli--baojie-shezhi/subscribe-target-headless-audit-20260515-134621-responses.json`
- 目标/本地汇总: `artifacts/style-dumps/fangtai--baojie-guanli--baojie-shezhi/headless-audit-20260515-134621-summary.json`
- 本地修正汇总: `artifacts/style-dumps/fangtai--baojie-guanli--baojie-shezhi/headless-fixed-20260515-140302-clone-summary.json`
