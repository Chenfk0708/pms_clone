# 门市价交互矩阵

- 任务 ID：`fangtai--fangjia-guanli--menshijia`
- 页面：门市价
- 本地入口：`/houseManage/retailPrice`
- 目标站：`https://minsubao.localhome.cn/houseManage/retailPrice`
- 目标站证据：`artifacts/network/fangtai--fangjia-guanli--menshijia/target-20260516T035503.json`
- 本地回归证据：`tests/retail-price.spec.ts`

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口与导航 | 房态 > 房价管理 > 门市价 | 进入 `/houseManage/retailPrice`，房价管理展开，门市价高亮 | 无业务请求 | 已注册路由和菜单 | 复用 `AppShell`、`PricePage` 和现有侧栏 | `tests/retail-price.spec.ts` 首屏断言标题、侧栏和布局 |
| 数据服务 | 首屏门市价数据 | 目标站首屏读取门店、房型、门市价设置、门店价格展示、房型状态 | `POST /camps/get`、`/select/poi/page/get`、`/roomCategories/page/get`、`/roomCategoryPrice/salePriceSetting/get`、`/systemConfig/price/storesPriceShow/get`、`/roomCategoryStatuses/roomCategory/get` | 已集中到 `src/services/retailPrice.ts` | 默认显式 mock provider 返回统一响应包；`real` provider 复用同一适配出口 | Playwright 断言默认不请求 Hudson，`data-provider=mock`，真实 provider 切换时请求体含 keyword |
| 数据状态 | 数据加载状态 | 目标站加载后展示业务状态 | 同首屏服务 | 页面正文仅展示业务态文案 | 去除正文中的 mock、provider、traceId、阻塞、后端等开发态词汇；traceId 仅放 DOM 数据属性和文档 | Playwright 断言 `.retail-price-page` 不包含开发态词汇 |
| 顶部操作 | 刷新 | 重新读取当前筛选条件下数据 | 同首屏服务 | 已可点击 | 显示加载态并刷新 `requestRevision` | Playwright 点击刷新并断言数据状态/错误态重试 |
| 顶部操作 | 重置 | 清空筛选条件并恢复全部门店/房型 | 重新按空参数读取数据 | 已可点击 | 清空 keyword、门店、房型筛选，显示业务反馈 | Playwright 点击后断言“已重置门市价筛选条件” |
| 顶部操作 | 导出 | 导出当前门市价结果 | 未来建议 `POST /houseManage/retailPrice/export` | 已可点击 | 生成业务态导出任务反馈，不执行假下载 | Playwright 点击后断言“门市价导出任务已创建” |
| 顶部操作 | 查看详情 | 查看当前门店/房型范围详情 | 当前阶段无额外请求 | 已可点击 | 用门市价详情弹窗承接，展示门店范围、房型范围、数量 | Playwright 断言 `门市价详情` dialog |
| 顶部操作 | 更多 | 展示扩展操作 | 调价日志跳转；同步房价未来建议 `POST /houseManage/retailPrice/sync` | 已可点击 | 下拉菜单提供“查看调价日志”和“同步房价” | Playwright 点击“同步房价”断言业务反馈；“查看调价日志”使用已有 `/houseManage/logs/price` |
| 设置入口 | 钟点房设置 | 跳转钟点房设置 | 无首屏数据请求 | 已可点击 | 复用现有 `/houseManage/retailPrice/hourSetting` 子路由 | Playwright 断言 URL 和钟点房设置表单 |
| 设置入口 | 门市价设置 / 去设置 | 打开设置抽屉 | 未来保存建议 `POST /roomCategoryPrice/salePriceSetting/save` | 已可点击 | 抽屉展示三种门市价关系，保存/取消关闭 | Playwright 断言 dialog、关系选项、保存取消 |
| 设置入口 | 价格规划 | 打开规划抽屉 | 未来建议 `POST /houseManage/retailPrice/plans/page` | 已可点击 | 抽屉展示筛选、空态和新增规划入口 | Playwright 断言 dialog、筛选和空态 |
| 设置入口 | 批量改价 | 打开批量修改抽屉 | 未来建议 `POST /houseManage/retailPrice/batchAdjust` | 已可点击 | 抽屉展示修改类型、房型选择、周期和改价模式 | Playwright 断言 dialog、周一/全选、多段/日历模式 |
| 筛选 | 全部门店 / 单门店 | 切换门店维度刷新数据 | `poiIds` | 已可点击 | mock provider 消费 `poiIds`，页面显示业务反馈 | Playwright 断言门店按钮和服务契约属性 |
| 筛选 | 房型 | 打开房型下拉并选择房型 | `roomCategoryIds` | 已可点击 | mock provider 消费房型参数；选择后关闭下拉并反馈 | Playwright 点击房型下拉断言房型名 |
| 筛选 | 房型标签 | 打开标签下拉 | 目标站可展示标签；当前未取到稳定标签字段 | 已可点击 | 显示业务空态“暂无数据” | Playwright 点击后断言空态 |
| 筛选 | 房源编码/简称/标题搜索 | 按关键字过滤房型 | `keyword`、`roomCategoryName` | 已可提交 | 表单提交传入数据服务；真实 provider 测试断言请求体 | Playwright 填“总裁”后断言 `/roomCategories/page/get` 请求 body.keyword |
| 错误态 | 数据加载失败 | 接口失败时显示错误并可重试 | 统一响应包 `code != 0` 或 HTTP 非 2xx | 已覆盖 | 去除开发态文案，仅显示业务失败和“重新加载” | Playwright 设置 `pmsRetailPriceMockMode=error` 并断言错误态 |
| 空态 | 无门店/房型 | 空响应下页面结构不崩溃 | 统一分页空包 | 已覆盖 | 显示“暂无门店数据”“暂无房型数据” | Playwright 设置 `pmsRetailPriceMockMode=empty` 并断言空态 |
| 截图回归 | 本地页面截图 | 固定 Chrome 采集 | 无 | 已保留 | `tests/retail-price.spec.ts` 首屏保存 `default-clone-route.png` | `artifacts/screenshots/fangtai--fangjia-guanli--menshijia/default-clone-route.png` |
