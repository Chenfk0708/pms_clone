# 中央价格交互矩阵

取证批次：`20260516-115133`  
目标页：`https://minsubao.localhome.cn/houseManage/houseCale`  
本地页：`http://127.0.0.1:4173/houseManage/houseCale`

| 区域 | 元素/按钮 | 目标站行为 | 触发请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口导航 | 顶部 `房价`、侧栏 `房价管理 > 中央价` | 进入 `/houseManage/houseCale`，房价顶部导航和中央价侧栏高亮 | 首屏加载 `roomCategoryStatuses/central/get` 等请求 | 路由存在，菜单可进入；业务数据来自静态数组 | 保留现有路由，增加中央价真实请求状态和阻塞暴露 | Playwright 断言 URL、菜单、数据来源状态 |
| 首屏数据 | 中央价价格矩阵 | 请求 `roomCategoryStatuses/central/get`，body 含 `date/days/pageNum/pageSize/channelIds/roomCategoryIds/poiIds`，响应 `data.roomStatusViews[]` | `POST https://hudson-prod.localhome.cn/roomCategoryStatuses/central/get` | 只加载本地静态资源，无业务 API | 新增中央价请求服务和响应适配；失败时显示阻塞，不静默回退 | Playwright route 断言请求 body 与 UI 数据 |
| 顶部筛选 | 门店、渠道、房型、房型标签 | 下拉/切换后刷新数据；渠道筛选改变 `channelIds` | `roomCategoryStatuses/central/get` 参数变化；目标还调用 `select/calChannel4RoomCategory/get` 等选项接口 | 本地只改按钮文字或展开静态选项 | 至少将渠道筛选接入请求参数；其余筛选若缺真实 ID，作为阻塞/未接入反馈 | Playwright 点击 `渠道 > 途家` 后断言请求 `channelIds=["2"]` |
| 顶部操作 | 同步至渠道 | 真实站触发业务同步或后续确认流程 | 取证到价格页相关 `actionExec/get`、`actionExec/express`、`roomCategoryStatuses/central/get`，同步提交接口未完整确认 | 本地显示“已发起同步至渠道”假成功 | 改为明确“真实提交接口未接入”阻塞反馈 | Playwright 点击后断言 status 中不出现假成功 |
| 顶部操作 | 价格设置 | 打开右侧价格设置抽屉，保存会提交真实配置 | 目标取证有设置抽屉；保存接口未完整确认 | 本地能打开抽屉，保存直接关闭 | 保留打开/关闭；保存改为未接入反馈，不假成功 | Playwright 点击后断言弹层和反馈 |
| 顶部操作 | 价格规划 | 打开规划抽屉；当前目标为空态，可新增规划入口 | 目标取证显示空态 `暂无数据`；保存接口未完整确认 | 本地新增规划后显示“已新增”假成功 | 保存规划改为未接入阻塞反馈 | Playwright 点击 `保存规划` 后断言阻塞反馈 |
| 顶部操作 | 批量改价、智能调价 | 打开改价/智能调价弹层；实际提交需写价格接口 | 目标取证有智能调价提醒、批量改价入口；提交接口未完整确认 | 本地打开弹层，确定显示假成功 | 提交改为未接入阻塞反馈；保留打开/取消 | Playwright 点击后断言 dialog 和 status |
| 主表格 | 价格单元格 | 点击可打开 `设置渠道系数` 或改价抽屉，目标有弹层反馈 | 点击单元格未触发 URL，弹出设置类 dialog | 本地点击打开改价弹层 | 保留弹层；提交不假成功 | Playwright 点击价格单元格断言 dialog |
| 错误态 | API 403/登录失效/CORS/后端不可达 | 真实阻塞应暴露 | `roomCategoryStatuses/central/get` 失败 | 本地无业务请求，因此无错误态 | 新增 `中央价接口阻塞` alert 与重试按钮 | Playwright 模拟 403 断言阻塞 |
| 空态 | `roomStatusViews=[]` | 目标空态需显示暂无数据，不崩溃 | `roomCategoryStatuses/central/get` 返回空数组 | 本地静态数据永远不空 | 新增 `中央价空状态` | Playwright 模拟空数组 |
