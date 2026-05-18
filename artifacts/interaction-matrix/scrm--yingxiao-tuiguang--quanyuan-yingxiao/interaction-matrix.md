# 全员营销交互矩阵

任务 ID：`scrm--yingxiao-tuiguang--quanyuan-yingxiao`  
目标页：`https://minsubao.localhome.cn/mallManagement/distribution`  
取证批次：`20260518-95-target`、`20260518-95-target-contract`

## 目标站网络请求摘要

| 场景 | method | URL | 请求体字段 | 响应字段摘要 | 取证文件 |
| --- | --- | --- | --- | --- | --- |
| 佣金设置列表 | POST | `https://hudson-prod.localhome.cn/promotionPlanProducts/page/get` | `campId`, `pageNum`, `pageSize`, `current`, `type` | `success`, `errorCode`, `errorMsg`, `data.total`, `data.size`, `data.current`, `data.pageNum`, `data.hasNextPage`, `data.pages`, `data.list[].productId`, `data.list[].campId`, `data.list[].promotionPlanProductId`, `data.list[].name`, `data.list[].mainPhotoMediaUrl`, `data.list[].directRatio`, `data.list[].parentRatio`, `data.list[].type`, `data.list[].state` | `artifacts/network/scrm--yingxiao-tuiguang--quanyuan-yingxiao/default-target-20260518-95-target-contract-responses.json` |
| 房型选项 | POST | `https://hudson-prod.localhome.cn/roomCategories/page/get` | `campId`, `pageSize`, `pageNum`, `roomCategoryName`, `keyword`, `cityIds`, `channelId` | `success`, `data.total`, `data.list[].roomCategoryId`, `data.list[].mainPhotoMediaUrl`, `data.list[].basePrice`, `data.list[].roomViews` | 同上 |
| 预售券/日历房来源 | POST | `https://hudson-prod.localhome.cn/weiRoomCategories/page/get` | `campId`, `buyCampId`, `roomCategoryTypes`, `goodsTypes` | `success`, `data.total`, `data.size`, `data.current`, `data.list[].channelRoomCategoryId`, `data.list[].channelRoomCategoryName`, `data.list[].goodsType`, `data.list[].roomCategoryType`, `data.list[].lowestSellingPrice`, `data.list[].totalStock` | 同上 |
| 分销营业额指标 | POST | `https://hudson-prod.localhome.cn/report/promotion/get` | `campId`, `startDate`, `endDate`, `type` | `success`, `data.turnover`, `data.commission` | `artifacts/network/scrm--yingxiao-tuiguang--quanyuan-yingxiao/data-tab-target-20260518-95-target-contract-responses.json` |
| 商品销售汇总 | POST | `https://hudson-prod.localhome.cn/report/promotion/productSale/page/get` | `campId`, `pageNum`, `pageSize`, `startDate`, `endDate`, `type` | `success`, `data.total`, `data.size`, `data.current`, `data.pageNum`, `data.hasNextPage`, `data.pages`, `data.list[]` | 同上 |

## 可见交互矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 导航入口 | 顶栏 SCRM、侧栏营销推广 > 全员营销 | URL 为 `/mallManagement/distribution`，SCRM 顶栏高亮，侧栏展开营销推广并高亮全员营销 | 无业务请求，仅路由状态 | 已接入路由和高亮 | 保持现有路由，不改共享壳层 | Playwright 断言 URL、SCRM 顶栏、全员营销侧栏 active |
| 页签 | 佣金设置 | 默认选中，展示类型、搜索、查询、重置、邀请分销员和佣金表 | `promotionPlanProducts/page/get` | 已静态展示，数据硬编码在组件 | 接入 `fetchFullMarketingCommission`，组件消费 adapter 后列表 | Playwright 断言 `data-provider=mock`、`data-request-body`、表格数据 |
| 页签 | 分销数据 | 点击切换到数据页，展示日期范围、筛选当月、营业额/提成指标、两个汇总表 | `report/promotion/get`、`report/promotion/productSale/page/get` | 已静态展示，指标和空表写死 | 接入 `fetchFullMarketingDistribution`，支持成功/空态 | Playwright 点击页签后断言请求体日期、指标、空态 |
| 顶部筛选 | 类型下拉 | 展开选项：日历房、预售券；选择后刷新佣金列表 | `promotionPlanProducts/page/get` 中 `type`：日历房 `0`，预售券 `1` | 下拉可选，但不触发数据服务 | 选择类型后重新请求 provider，并反馈已更新 | Playwright 点击选项后断言 `data-request-body` 含 `"type":"1"` |
| 顶部筛选 | 搜索输入 | 输入日历房/预售券名称后查询 | 目标请求未见 keyword 字段，当前契约保留 `keyword` 供后端确认 | 输入只改本地 state | 查询时把 keyword 传入服务并过滤本地 mock 结果，接口文档标注后端待确认 | Playwright 填入关键字后断言列表变更和状态提示 |
| 顶部筛选 | 查询 | 按当前类型和 keyword 刷新列表 | `promotionPlanProducts/page/get` | 按钮无反馈 | 显示 loading，完成后状态提示 | Playwright 断言 loading/状态提示/请求体 |
| 顶部筛选 | 重置 | 恢复日历房和空搜索，再刷新列表 | `promotionPlanProducts/page/get` | 只清理 state，无业务反馈 | 重置并重新请求 provider，状态提示 | Playwright 断言类型、搜索框和提示 |
| 工具栏 | 邀请分销员 | 打开弹窗：请先开通品牌小程序后再设置分销；按钮为联系客服、前往开通 | 无列表请求，可能跳转订阅/客服 | 可打开弹窗 | 保持弹窗，并补齐按钮反馈/路由承接 | Playwright 点击联系客服显示业务提示；前往开通跳转应用订阅详情 |
| 佣金表 | 编辑 | 打开编辑分销计划弹窗，包含商品名称、一级/多级分销比例、分销人群、状态、取消、提交 | 未来保存接口，当前用统一 provider 中 `saveCommissionPlan` | 可打开弹窗，提交无反馈 | 表单可输入比例、切换状态，提交更新列表并提示成功 | Playwright 断言输入、状态开关、提交提示和列表更新 |
| 佣金表 | 分页 | 目标当前仅 1 页，展示第 1-4 条/总共 4 条、20 条/页 | `promotionPlanProducts/page/get` 中 `pageNum/pageSize` | 静态按钮 | 上一页/下一页禁用；页大小按钮打开说明 popover | Playwright 断言禁用态和 popover |
| 分销数据 | 日期范围 | 默认 2026-05-01 至 2026-05-31，目标请求结束日期为 2026-06-01 | `report/promotion/get`、`report/promotion/productSale/page/get` | 输入只读，筛选按钮无数据服务 | 日期可编辑，筛选当月重新请求并反馈 | Playwright 修改日期后断言请求体和指标刷新 |
| 分销数据 | 生成分销二维码 | 目标按钮可见，当前未深入到二维码弹层 | 未来分销员二维码接口 | 静态按钮 | 用业务弹窗承接，展示生成结果和关闭 | Playwright 点击断言二维码弹窗 |
| 状态反馈 | error/empty/loading | 目标列表/报告接口均用 `success/errorCode/errorMsg/data`，数据页当前为空表 | 统一响应包 mock provider | 未覆盖错误态 | mock provider 支持 `success/empty/error`，页面显示 alert、重试和空态 | Playwright 设置 localStorage 模拟 empty/error |

## 待后端确认

- `promotionPlanProducts/page/get` 是否正式接收 `keyword`。目标默认请求未携带搜索关键字，本地契约暂保留并在 mock provider 中消费。
- 编辑分销计划保存接口路径和请求体。当前本地按 `POST /promotionPlanProducts/save` 草案建模。
- 分销员汇总接口路径。目标数据页本轮仅捕获商品销售汇总和指标请求，分销员汇总当前为空态，接口文档中按草案列出。
