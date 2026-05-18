# 日历房交互矩阵

任务 ID：`shoumai-chanpin--rilifang--rilifang`

更新时间：2026-05-18

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口 | 顶部 `售卖/产品`、左侧 `日历房` | URL 为 `/setting/localRoomTypeProductionSetting`，顶部导航高亮售卖/产品，侧栏日历房高亮 | 无业务请求，仅路由和菜单状态 | 已接入项目 `AppShell` 和日历房路由 | 保持现有路由与侧栏映射 | Playwright 断言 URL、侧栏 active、标题隐藏但 sr-only heading 可用 |
| 顶部筛选 | 全部门店 | 目标站展示门店名称，点击可展开门店选择 | 后续请求体 `poiIds` | 旧实现仅静态文案 | 服务层返回 `storeOptions`，点击给业务态反馈 | Playwright 断言按钮可见、反馈出现 |
| 顶部筛选 | 关键词搜索 | 输入房型名称后刷新列表 | `POST /setting/localRoomTypeProductionSetting/products/page`，参数 `keyword/page/pageSize` | 旧实现不驱动数据 | 查询按钮更新服务层请求参数并刷新列表 | Playwright 断言 `data-request-keyword` 与列表变更 |
| 顶部筛选 | 渠道下拉 | 选择渠道后按渠道刷新产品 | 参数 `channel` | 旧实现只改变本地 select 文案 | mock provider 消费 `channel` 并过滤产品 | Playwright 点击选项后断言参数和 UI |
| 顶部筛选 | 上架状态 | 选择全部/上架/下架 | 参数 `status` | 旧实现只改变本地 select 文案 | mock provider 消费 `status` 并过滤产品 | Playwright 点击选项后断言参数和 UI |
| 顶部按钮 | 房型管理 | 跳转房型管理页 | 路由 `/setting/roomTypeInfo` | 已可跳转 | 路由目标由服务层 `routeTargets.roomTypeList` 提供 | Playwright 断言 URL |
| 顶部按钮 | 新增售卖产品 | 跳转新增产品页 | 路由 `/setting/localRoomTypeProductionSetting/channelGoodsSetting` | 已可跳转 | 路由目标由服务层 `routeTargets.createProduct` 提供 | Playwright 断言 URL |
| 列表 | 展开/收起 | 展开房型下产品明细 | 无请求 | 已有全局展开 | 保留并确保产品明细来自服务层 | Playwright 断言产品字段出现 |
| 列表行 | 编辑房型 | 跳转房型编辑 | 路由 `/setting/roomTypeInfo/edit` | 已可跳转 | 路由目标由服务层提供 | Playwright 断言 URL |
| 列表行 | 房价管理 | 跳转中央价/房价页 | 路由 `/houseManage/houseCale` | 已可跳转 | 路由目标由服务层提供 | Playwright 断言 URL |
| 产品明细 | 预览 | 目标站展示产品详情或预览 | 未来可接详情接口 | 旧实现无反馈 | 打开业务详情弹窗，展示产品名称、渠道、价格计划、上下架状态 | Playwright 断言 `售卖产品详情` dialog |
| 产品明细 | 编辑 | 进入新增/编辑售卖产品承接页 | 路由 `/setting/localRoomTypeProductionSetting/channelGoodsSetting` | 旧实现无反馈 | 绑定路由跳转 | Playwright 断言 URL |
| 产品明细 | 修改价格 | 目标站承接价格设置 | 未来价格保存接口 | 旧实现无反馈 | 打开调整售卖价格弹窗，保存后显示业务反馈 | Playwright 断言 dialog 和 status |
| 产品明细 | 上架/下架 | 目标站调整售卖状态 | 未来上下架接口 | 旧实现无反馈 | 打开确认弹窗，确认后显示业务反馈 | Playwright 断言 dialog 和 status |
| 数据状态 | loading | 查询期间显示加载态，按钮禁用 | 当前请求 Promise | 旧实现无 loading | 表格覆盖层显示加载中，搜索按钮显示查询中 | Playwright 通过专项和截图覆盖 |
| 数据状态 | empty | 空数据保持页面结构并提示业务空态 | 统一响应包 `code=0,data.rows=[]` | 旧实现无空态 | 显示 `暂无售卖产品` | Playwright 断言空态文案且无旧数据 |
| 数据状态 | error | 接口失败清晰暴露并可重试 | 统一响应包 `code!=0` | 旧实现无错误态 | 显示错误 alert 和重试按钮 | Playwright 断言错误态和重试入口 |
| 页面文案 | 正文业务态 | 不出现开发态文案 | 不适用 | 旧实现无 provider 文案，但数据来源静态 | 页面正文不展示 mock/provider/后端等技术词，技术内容仅在文档中 | Playwright 正则断言 body 不含开发态词 |
