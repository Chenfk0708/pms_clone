# 分销列表交互矩阵

任务：`juhe-fenxiao--fenxiao--fenxiao-liebiao`

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 路由入口 | `/channels/distribution/distributionSecond` | 聚合分销菜单进入分销列表，保留侧边导航与页面布局 | 本地路由加载后调用分销列表 provider | 已接入项目 App 路由 | 保留 AppShell、菜单高亮和页面标题承接 | 断言侧边导航包含“分销列表”，根节点 `data-testid=distribution-list-contract` 出现 |
| 状态切换 | 已分销 | 目标站展示已分销房型列表和快捷操作 | `roomCategories/page/get`，请求体含 `campId/pageSize/pageNum/keyword/channelId` | 已分销数据来自服务层适配结果 | 切换 tab 更新 `filters.tab` 与表格数据 | 点击“已分销”后按钮高亮，表格出现“顶层套房” |
| 状态切换 | 未分销 | 目标站展示待完善房型和上架/导入入口 | `select/roomCategory/page/get`，请求体含 `campId/pageNum/pageSize/current/poiId/filterSyncChannelId/isAvailability/channelId/isFilterAlreadyFlow` | 已接入未分销 mock 列表 | 切换 tab 后展示待完善原因和操作按钮 | 点击“未分销”后表格出现“缺少渠道房型映射” |
| 筛选区 | 门店下拉 | 目标站按门店/项目筛选列表 | `select/poi/page/get` 获取门店，列表请求传 `poiId` | 下拉来自 provider 的 `stores` | 门店变化写入 filters 并刷新列表 | 断言筛选区包含目标门店，`data-request` 中 stores 请求体稳定 |
| 筛选区 | 房型关键字 | 目标站按房型名或关键词筛选 | `roomCategories/page/get.keyword` 与 `roomCategoryName` | 输入框维护草稿，查询时提交 | 查询后更新请求快照与表格 | 输入“观影”后 `data-request` 包含关键字，表格出现“观影大床房” |
| 筛选区 | 查询 | 提交当前筛选条件刷新列表 | 同当前 tab 对应列表请求 | 已有 loading 与 toast 反馈 | 禁用 loading 期间重复提交 | 点击后出现“已按当前条件查询分销列表” |
| 筛选区 | 重置 | 恢复默认筛选条件 | 使用默认 `poiId=ALL/keyword=''` 请求 | 已重置门店、关键字、页码和状态 | 输出明确业务反馈 | 点击后出现“筛选条件已重置” |
| 筛选区 | 刷新 | 重新拉取当前条件数据 | 调用 `fetchDistributionDashboard(filters)` | 已触发 provider 刷新并反馈 | 刷新时展示 loading，完成后 toast | 点击后出现“分销列表已刷新” |
| 筛选区 | 导出 | 创建当前条件导出任务 | 后续可沉淀为导出接口，当前不新增后端契约 | 已给出业务态反馈 | 不写开发态文案 | 点击后出现“导出任务已创建” |
| 指标卡片 | 预计渠道订单 | 目标站来自 `campFlow/get.expectedChannelOrderTotalNum` | `campFlow/get` 请求体 `{ campId }` | 已通过 provider 聚合为指标 | 点击卡片展示字段来源反馈 | 断言卡片包含“预计渠道订单”和数值 60 |
| 指标卡片 | 已分销房型/待完善房型/同步率 | 展示列表聚合结果 | 已分销、未分销列表响应聚合 | 已由 adapter 计算 | 点击卡片展示业务说明 | 点击任一卡片出现 toast |
| 渠道概览 | 渠道按钮 | 目标站展示渠道开通和预计订单 | `campFlow/get.channelInfos[]` | 已渲染路客云聚合、途家、小猪、携程民宿 | 点击渠道展示预计订单反馈 | 断言渠道区包含“路客云聚合” |
| 快捷入口 | 提现教程 | 目标站跳转分销订单/教程相关页面 | 项目已有 `/statistics/distributionOrder` | 已改为真实路由跳转 | 使用 `useNavigate` 承接已有路由 | 点击后 URL 进入聚合分销订单路由 |
| 快捷入口 | 房态管理 | 跳转房态页面 | 项目已有 `/houseManage/months` | 已改为真实路由跳转 | 使用项目已有路由 | 点击后 URL 进入月房态路由 |
| 快捷入口 | 房价管理 | 跳转房价页面 | 项目已有 `/houseManage/houseCale` | 已改为真实路由跳转 | 使用项目已有路由 | 点击后 URL 进入中央价路由 |
| 快捷入口 | 房型管理 | 跳转房型信息页面 | 项目已有 `/setting/roomTypeInfo` | 已改为真实路由跳转 | 使用项目已有路由 | 点击后 URL 进入房型信息路由 |
| 快捷入口 | 分销配置 | 跳转分销置换配置页 | 项目已有 `/channels/distribution/distributiondisplacement` | 已改为真实路由跳转 | 使用项目已有路由 | 点击后 URL 进入置换权益路由 |
| 未分销操作 | 一键上架 | 目标站创建上架/完善任务 | 后续可接入上架任务接口 | 当前按 provider 数据禁用空列表 | 非空时给出创建任务反馈 | 点击后出现“已创建上架任务” |
| 未分销操作 | 渠道导入完善 | 目标站打开导入菜单 | `weiRoomCategories/page/get` 请求体含 `campId/buyCampId/roomCategoryTypes/goodsTypes` | 已实现下拉菜单 | 菜单项触发导入任务反馈 | 点击 OTA/模板项后出现对应任务反馈 |
| 表格 | 详情 | 目标站查看房型分销详情 | 当前使用已适配业务模型 | 已用弹窗承接详情 | 弹窗展示门店、渠道同步、库存价格、处理结果 | 点击“详情”打开 `role=dialog`，关闭按钮可关闭 |
| 空态 | `state=empty` | 目标站无数据时展示空列表 | 统一响应包 `code=0,data.list=[]` | provider 支持 empty 场景 | 表格结构保留，显示业务空态 | 打开 `?state=empty` 断言“当前条件暂无分销房型” |
| 错误态 | `state=error` | 接口失败时明确暴露错误 | 统一响应包 `code!=0,message` | provider 支持 error 场景 | 显示 alert 和重试入口 | 打开 `?state=error` 断言 alert，点击重试恢复 |

