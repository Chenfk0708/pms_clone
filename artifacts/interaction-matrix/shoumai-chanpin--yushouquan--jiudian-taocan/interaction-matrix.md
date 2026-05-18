# 酒店套餐交互矩阵

任务：`shoumai-chanpin--yushouquan--jiudian-taocan`  
页面：售卖/产品 > 预售券 > 酒店套餐  
目标站：`https://minsubao.localhome.cn/mallManagement/hotelProduct`

## 取证结论

- 固定 Chrome + `playwright/.auth/pms-user.json` 可进入目标站，未触发登录页或滑块。
- 目标站默认态为空表，表头为：商品标题、关联房型、关联渠道、库存、售价(元)、加价(元)、创建时间、更新时间、操作。
- 目标站首屏关键请求包括：`/camps/get`、`/camp/get`、`/user/own/get`、`/menus/project/get`、`/channels/get`、`/roomCategories/page/get`、`/select/calChannel4RoomCategory/get`、`/channelRoomCategories/page/get/v2`、`/weiRoomCategories/page/get`、`/paymentTypes/get/v2` 等。
- 目标站房型下拉可见选项：顶层套房（浴缸巨幕电竞麻将）、总裁套间（桑拿浴缸露台电竞麻将）、天落大床电竞套间、观影大床房。
- 目标站渠道下拉可见选项：携程、美团酒店、飞猪淘酒店、美团民宿、途家、木鸟、小猪、路客云聚合。
- 目标站接单策略为弹窗：视频号手动接单，品牌小程序自动接单。
- 本地默认使用显式 `mock` provider，页面正文只展示业务态文案；provider、traceId 和请求摘要仅通过隐藏契约节点供测试审计。

## 矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口 | 售卖/产品 > 预售券 > 酒店套餐 | URL 为 `/mallManagement/hotelProduct`，菜单高亮酒店套餐 | 无业务请求，路由和菜单状态 | 已接入项目路由和 AppShell | 保持现有路由，页面内隐藏默认页头 | `tests/hotel-product.spec.ts` 断言标题、菜单高亮 |
| 顶部筛选 | 门店 tab | 点击后按门店刷新数据 | `GET /api/mallManagement/hotelProduct/list`，参数 `campId` | 本地显示业务反馈并刷新服务 | 通过服务层重新加载当前条件 | Playwright 断言状态提示 |
| 顶部筛选 | 搜索输入 | 输入套餐名称后搜索 | `keyword` | 已接入 `HotelProductListQuery.keyword` | 搜索按钮提交 keyword，服务层消费参数 | Playwright 断言查询反馈 |
| 顶部筛选 | 关联房型下拉 | 目标站显示 4 个房型选项 | `roomCategoryId`，目标站相关请求 `/roomCategories/page/get` | 已接入服务返回的房型选项 | 选择后刷新列表 | Playwright 断言 `roomCategoryId=room-mock-4` 和 UI 更新 |
| 顶部筛选 | 渠道下拉 | 目标站显示 8 个渠道选项 | `channelId`，目标站相关请求 `/select/calChannel4RoomCategory/get` | 已接入服务返回的渠道选项 | 选择后刷新列表 | Playwright 断言 real provider 请求体 `channelId` |
| 顶部筛选 | 重置 | 清空筛选条件 | 同列表接口，空筛选 | 已清空 keyword、房型、渠道并反馈 | 重置后重新加载 | Playwright 断言筛选控件恢复 |
| 顶部筛选 | 搜索 | 应用当前筛选 | 同列表接口 | 已接入服务层刷新 | 显示业务态反馈 | Playwright 断言页面不出现开发态文案 |
| 工具栏 | 刷新 | 重新拉取当前条件数据 | 同列表接口 | 已显示 loading/成功/失败 | 重载服务并保留当前筛选 | Playwright 断言 success/empty/error |
| 工具栏 | 导出 | 目标站未取证到真实导出接口 | 建议 `POST /api/mallManagement/hotelProduct/export` | 本地生成业务态导出反馈 | 不做假下载，不静默 | Playwright 断言导出任务反馈 |
| 工具栏 | 房型管理 | 跳转房型管理 | `/setting/roomTypeInfo` | 已使用现有路由承接 | 不新增不存在路由 | Playwright 断言 URL |
| 工具栏 | 接单策略 | 打开策略弹窗 | 建议 `GET/PUT /api/mallManagement/hotelProduct/orderStrategy` | 已弹窗展示目标站策略并保存反馈 | 确认后业务态提示 | Playwright 断言弹窗和反馈 |
| 工具栏 | 创建酒店套餐 | 跳转创建页 | `/mallManagement/hotelProduct/edit` | 已使用现有路由 | 创建页表单可操作 | Playwright 断言创建页 |
| 列表 | 表格数据 | 目标站当前为空表 | `products.list` + `pagination` | 本地 mock provider 提供 3 条业务数据 | 列表消费适配后业务模型 | Playwright 断言业务数据可见 |
| 列表 | 查看详情 | 目标站空表无可取证操作 | 建议 `GET /api/mallManagement/hotelProduct/detail` | 本地详情弹窗承接 | 展示房型、渠道、电话、说明 | Playwright 断言详情弹窗 |
| 列表 | 更多 | 目标站空表无可取证操作 | 建议操作类接口 | 本地操作弹窗承接库存校验 | 确认后反馈 | Playwright 断言操作反馈 |
| 状态 | 空态 | 目标站显示“暂无数据” | 列表接口返回 `list=[]` | 本地显示业务空态 | 不显示开发态说明 | Playwright 断言空态 |
| 状态 | 错误态 | 目标站未触发错误态 | 统一响应包 `code != 0` | 本地显示错误和重试 | 清晰暴露，不吞错 | Playwright 断言 alert 和重试 |
| 创建页 | 上传 | 目标站按钮为“上传” | 图片上传接口待后端确认 | 本地加入上传队列反馈 | 不写假上传 URL | Playwright 断言反馈 |
| 创建页 | 选择房型 | 目标站打开房型选择流程 | 房型选项接口 | 本地弹窗承接 | 确认后关联房型 | Playwright 断言弹窗 |
| 创建页 | 添加套餐 | 目标站套餐设置表格 | 套餐库存配置接口 | 本地新增一行库存 | 可见新增行 | Playwright 断言套餐行 |
| 创建页 | 保存 | 目标站提交创建表单 | 建议 `POST /api/mallManagement/hotelProduct/save` | 本地业务态保存反馈 | 不暴露开发态文案 | Playwright 断言保存反馈 |

## 取证产物

- 目标站截图：`artifacts/screenshots/shoumai-chanpin--yushouquan--jiudian-taocan/*target-20260518-95-*`
- 目标站 DOM：`artifacts/dom-snapshots/shoumai-chanpin--yushouquan--jiudian-taocan/*target-20260518-95-*`
- 目标站网络：`artifacts/network/shoumai-chanpin--yushouquan--jiudian-taocan/*target-20260518-95-*`
- 本地截图：`artifacts/screenshots/shoumai-chanpin--yushouquan--jiudian-taocan/*clone-20260518-95-local-*`
- 本地 DOM/样式/网络：`artifacts/dom-snapshots|style-dumps|network/shoumai-chanpin--yushouquan--jiudian-taocan/*clone-20260518-95-local-*`
