# 社媒交互矩阵

任务：`ota--shemei--shemei`  
页面：`OTA > 社媒 > 社媒`  
本轮取证批次：`20260518-business-audit`、`20260518-contract-audit`

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口 | `/channels/social` | 固定 Chrome 取证可进入业务页，侧栏社媒高亮，页面显示已直连/未直连渠道 | 首屏触发 `POST /channels/get`，请求体含 `campId`、`hasAllChannel` | 已接入项目路由和菜单 | 保留现有入口，新增业务态筛选、指标、渠道列表与账号表 | `tests/social.spec.ts` 首屏断言；target/clone 截图 |
| 顶部筛选 | 运营日期 | 目标站默认页暂无日期筛选；本地用于运营视角筛选社媒数据 | `POST /channels/social/overview`：`bizDate` | 新增 | 传入数据服务并刷新统一响应包 | Playwright 断言 `data-request-body` 含日期 |
| 顶部筛选 | 门店 | 目标站 `channels/get` 使用 `campId` 拉取渠道 | `campId`，`all` 映射为 `null` | 新增 | 沿用门店参数进入服务层 | Playwright 选择门店后断言请求摘要 |
| 顶部筛选 | 项目 | 目标站社媒卡片区分日历房、预售券能力 | `projectId`，用于后续后端过滤 | 新增 | 进入 mock provider，后端联调时复用 | Playwright 首屏和查询测试 |
| 顶部筛选 | 渠道状态 | 目标站分为已直连渠道和未直连渠道 | `channelStatus=connected/pending/null` | 新增 | 由 adapter 过滤业务模型 | Playwright 选择已直连后只展示对应数据 |
| 顶部筛选 | 查询/重置 | 目标站查询类按钮会按条件刷新 | `fetchSocialOverview(filters)` | 旧页面无筛选 | 显示业务态反馈，更新请求参数 | `tests/social.spec.ts` |
| 顶部操作 | 刷新 | 目标站重新拉取页面渠道状态 | 同当前查询参数 | 旧页面无刷新 | 显示 loading，成功后提示“社媒数据已刷新” | `tests/social.spec.ts` |
| 顶部操作 | 导出 | 目标站无本页导出；本地按运营视角承接 | 未来 `POST /channels/social/export` | 旧页面无导出 | 创建导出任务反馈 | `tests/social.spec.ts` |
| 顶部操作 | 更多 | 目标站有页面操作入口类行为 | 未来日志/订阅/同步记录接口 | 旧页面无更多 | 打开更多操作弹窗 | `tests/social.spec.ts` |
| 指标卡片 | 核心指标 | 目标站仅渠道卡片；本地按 95 分要求补运营指标 | `metrics[]` | 旧页面无指标 | 展示已直连、待开通、订单、待办 | 首屏测试和截图 |
| 渠道卡片 | 抖音来客 | 目标站显示已直连渠道，按钮“管理渠道” | `channels[].status=connected` | 旧页面按钮只跳详情页 | 点击卡片打开业务详情，按钮可进入管理 | 卡片详情测试 |
| 渠道卡片 | 小红书/视频号/抖音特价酒店 | 目标站显示未直连渠道，按钮“订阅开通” | `channels[].status=pending` | 旧页面无反馈 | 打开订阅方案弹窗，确认后业务反馈 | 订阅测试 |
| 趋势图 | legend/条形趋势 | 目标站未提供趋势图；本地按运营视角补充 | `trend[]` | 新增 | 用显式 mock provider 数据展示 | 首屏测试 |
| 待办 | 待办项点击 | 目标站未提供待办；本地用于承接渠道任务 | `todos[]` | 新增 | 点击后进入今日处理队列反馈 | 手动/截图取证 |
| 快捷入口 | 房价管理 | 应跳转已有业务页 | `/houseManage/houseCale` | 新增 | 使用项目已有路由 | Playwright 断言 URL |
| 快捷入口 | 住宿订单 | 应跳转已有业务页 | `/order/house-order/list` | 新增 | 使用项目已有路由 | 路由测试可扩展 |
| 快捷入口 | 预售券订单 | 应跳转已有业务页 | `/mallManagement/orderManagement` | 新增 | 使用项目已有路由 | 路由测试可扩展 |
| 账号表 | 查看详情 | 目标站管理渠道后进入账号/门店/房型管理 | `accounts.list[]` | 旧详情页静态 | 打开渠道详情弹窗 | `tests/social.spec.ts` |
| 账号表 | 拉取房型/授权日历房 | 目标站为渠道授权和同步动作 | 未来写接口，当前同契约服务层待后端确认 | 旧按钮无反馈 | 显示房型同步业务反馈 | `tests/social.spec.ts` |
| 状态 | loading/empty/error | 目标站无空态取证；本地按统一响应包验证 | `pms.socialMockMode=empty/error` | 旧页面无状态 | 空态、错误态、重试入口 | `tests/social.spec.ts` |

## 目标站网络摘要

- `POST https://hudson-prod.localhome.cn/channels/get`
- 请求体示例：`{"campId":"1796067693589061634","hasAllChannel":1}`
- 响应摘要：`success/errorCode/errorMsg/data.channels[]`；`channels[]` 包含 `channelId`、`channelName`、`imageLogo`、`image2Logo`、`isCustom`、`isLongRent`、`isSupportIcs`、`isEnable`、`seq`、`color`、`isCal`。

## 验收产物

- 目标站截图/DOM/style/network：`artifacts/screenshots|dom-snapshots|style-dumps|network/ota--shemei--shemei/default-target-20260518-contract-audit-*`
- 目标站交互取证：`artifacts/screenshots|dom-snapshots|style-dumps|network/ota--shemei--shemei/interaction-target-20260518-business-audit-*`
- 本地业务态取证：`artifacts/screenshots|dom-snapshots|style-dumps|network/ota--shemei--shemei/default-clone-20260518-business-audit-*`
- 本地交互取证：`artifacts/screenshots|dom-snapshots|style-dumps|network/ota--shemei--shemei/interaction-clone-20260518-business-audit-*`

