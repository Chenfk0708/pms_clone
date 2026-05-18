# 聚到PR价交互矩阵

任务 ID：`fangtai--fangjia-guanli--jvdao-prjia`

本轮执行依据：`D:\pms_ui\95prompt\prompts111\006-fangtai--fangjia-guanli--jvdao-prjia.md`

## 取证与数据契约摘要

- 目标 URL：`https://minsubao.localhome.cn/houseManage/channelPrice`
- 本地入口：`/houseManage/channelPrice`
- 核心目标站请求：`POST https://hudson-prod.localhome.cn/roomCategoryStatuses/roomCategory/channel/get`
- 关键请求体：`campId/channelIds/roomCategoryGroupIds/roomCategoryProductSaleType/roomCategoryIds/date/days/poiIds/pageNum/pageSize/isFinalChannelRp`
- 当前页面正式数据源：`src/services/channelPrice.ts` 的显式 `mock` provider，返回统一 `code/message/data/traceId/timestamp` 响应包。
- 联调切换点：`channelPriceProvider=real`、`localStorage.pms.channelPriceProvider=real`、`VITE_CHANNEL_PRICE_PROVIDER=real`。
- 页面正文约束：不展示 `mock provider`、`未接入`、`阻塞`、`后端未就绪`、`后端接口未完成` 等开发态文案；开发态信息只保留在本矩阵、接口文档和开发记录中。

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口与导航 | 房态 > 房价管理 > 渠道RP价 | URL 为 `/houseManage/channelPrice`，房价菜单高亮，页签选中渠道RP价 | 首屏加载价格矩阵及渠道/房型相关请求 | 已有路由、页签和侧栏入口 | 保持项目现有 layout、菜单和 route | Playwright 进入页面断言 active tab、标题、价格矩阵 |
| 数据服务 | 首屏价格矩阵 | 展示渠道 RP 价房型、产品、产品系数、基础价、日期价格 | mock provider：统一响应包；real provider：`POST /roomCategoryStatuses/roomCategory/channel/get` | 已由 `fetchChannelPriceRows()` 统一创建请求体、解包、适配 | 默认 mock provider 驱动业务可用状态；real provider 仅联调时切换 | `tests/channel-price.spec.ts` 断言默认不访问 Hudson、展示模拟业务数据 |
| 数据服务 | 渠道筛选参数 | 选择渠道后刷新价格矩阵 | `channelIds` 从 `null` 变为所选渠道 | mock provider 已消费 `channelIds` 并改变产品文案 | 保持筛选状态进入服务层，不在组件内硬编码筛选结果 | Playwright 选择 `携程` 后断言 `携程渠道产品A<无早>` 出现，真实请求数为 0 |
| 顶部筛选 | 门店 chip | 切换门店后按门店上下文刷新 | 后续确认 `poiIds` 或项目全局门店上下文 | 当前保留门店选择 UI 和状态 | 继续传入服务层预留字段；缺上下文时业务提示选择门店 | Playwright 缺 `campId` 时断言“缺少门店上下文” |
| 顶部筛选 | 渠道下拉 | 展开渠道，选择后刷新矩阵 | `channelIds` | 已有 listbox、option、选中态和刷新 | 保持可键鼠操作，筛选后关闭弹层 | Playwright 点击渠道、选择携程、断言 UI 更新 |
| 顶部筛选 | 房型/房型标签 | 展开选项，目标站会按房型或标签筛选 | 未来接入 `roomCategoryIds`、`roomCategoryGroupIds` | 已有 popover 和选中状态 | 当前用业务选项承接，后续按接口字段接入 | Playwright 打开 popover 验证有可见反馈 |
| 顶部操作 | 同步至渠道 | 目标站执行同步或反馈结果 | 未来写接口，历史取证存在动作执行类请求 | 当前展示业务态同步反馈，不在正文写开发态 | 后续确认写接口后接入 provider | Playwright 点击后断言 toast |
| 顶部操作 | RP设置 | 跳转售卖/产品设置页 | `/setting/localRoomTypeProductionSetting` | 已按目标站跳转到项目已有路由 | 保持项目已有页面承接 | Playwright 断言 URL 和“日历房/房型管理/新增售卖产品” |
| 顶部操作 | 价格设置 | 打开价格设置抽屉，支持关闭/保存 | 后续确认销售价关系设置写接口 | 已有抽屉、tab、渠道关系配置 | 当前保存关闭，表现为业务操作完成 | Playwright 打开/关闭抽屉 |
| 顶部操作 | 价格规划 | 打开价格规划抽屉，支持新增规划入口 | 后续接入规划读写接口 | 已有抽屉、筛选、空态和新增入口 | 用业务抽屉承接，不展示开发态说明 | Playwright 打开/关闭抽屉并断言表头 |
| 顶部操作 | 批量改价 | 打开批量修改抽屉 | 后续接入批量改价写接口 | 已有修改类型、产品、日期、价格控件 | 保持业务表单反馈，避免无响应 | Playwright 打开抽屉并断言关键控件 |
| 顶部操作 | 预览与覆盖 | 打开房价修改预览 | 后续接入预览/覆盖写接口 | 已有预览弹窗和覆盖按钮 | 保持弹窗承接 | Playwright 点击预览并关闭 |
| 顶部操作 | 暂不处理 | 打开确认弹窗 | 后续接入忽略或确认接口 | 已有确认框和取消 | 保持业务确认弹窗承接 | Playwright 点击并断言弹窗 |
| 顶部操作 | 新手指引 | 打开步骤式指引 | 通常无数据请求 | 已有 1/5、下一步 | 保持步骤反馈 | Playwright 点击下一步断言 2/5 |
| 主表格 | 全部收起/全部展开 | 折叠或展开产品行 | 无请求 | 已有切换状态 | 保持布局稳定 | Playwright 收起/展开断言产品行可见性 |
| 主表格 | 价格单元格 | 点击打开改价浮层 | 后续写接口待确认 | 已有改价浮层、价格输入、取消/确定 | 当前用业务浮层承接 | Playwright 点击价格按钮并断言“已选1项/百分比改价” |
| 状态 | loading | 数据加载中 | `fetchChannelPriceRows()` | 已有 `渠道RP价加载状态` | 文案为业务态“正在请求渠道RP价数据” | Playwright 间接覆盖刷新路径 |
| 状态 | success | 数据加载完成 | mock/real provider 同一业务模型 | 已有 `渠道RP价数据已更新` | 页面不暴露 provider 名 | Playwright 默认 mock provider 首屏断言 |
| 状态 | empty | 无匹配数据 | 统一响应包 `data.list=[]` | 已有业务空态 | 页面不出现开发态文案 | Playwright 设置 `pms.channelPriceMockMode=empty` |
| 状态 | error | 数据服务失败 | 统一响应包 `code != 0` 或 real provider 失败 | 已有错误区和重新加载按钮 | 页面展示“渠道价格加载失败” | Playwright 设置 `pms.channelPriceMockMode=error` 与 real provider 失败 |

## 待后端确认

1. 聚到PR价最终响应包是否统一为 `code/message/data/traceId/timestamp`。
2. `channel` 字段最终口径：房型名、渠道名或房型分组名。
3. `prices` 和 `comparePrices` 是否按 `date + days` 顺序返回；如返回对象数组，需要确认日期字段。
4. 价格设置、价格规划、批量改价、预览覆盖的写接口契约尚未稳定取证。
