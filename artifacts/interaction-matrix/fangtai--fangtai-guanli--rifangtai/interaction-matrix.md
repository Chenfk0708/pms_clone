# 日房态交互矩阵

- TASK_ID：`fangtai--fangtai-guanli--rifangtai`
- 页面：`房态 > 房态管理 > 日房态`
- 目标 URL：`https://minsubao.localhome.cn/houseManage/days`
- 取证批次：`20260516-audit`
- 结论：当前目标站取证显示日房态包含 4 个房间卡，其中 `天落大床电竞套间/1` 为 `张祯/携程/¥136.62`，`观影大床房/房间1` 为 `胡志深/美团酒店/¥112.9`；核心接口包括 `roomStatusesToday/get`、`rooms/get`、`roomCategories/page/get`、`cleanTask/status/count`。本地项目未提供可复用已认证 API 代理，因此页面明确暴露“实时接口接入阻塞”，不伪装为实时请求成功。

| 区域 | 元素/按钮 | 目标站行为 | 触发请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口导航 | 侧栏 `日房态` | 从房态菜单进入 `/houseManage/days`，侧栏高亮日房态 | 页面初始化请求 `roomStatusesToday/get`、`rooms/get` 等 | 已注册 `/houseManage/days`，侧栏可高亮 | 保持现有路由与菜单状态 | `tests/routes.spec.ts` `/houseManage/days renders` |
| 顶部分段 | `月房态` | 跳转 `/houseManage/months` | 导航后月房态重新请求 | 已补 React Router 跳转 | 点击直接进入已有月房态页面 | `days matches captured navigation interactions` |
| 顶部分段 | `日房态` | 当前页 active | 无新增请求 | 已 active | 保持当前状态 | `/houseManage/days renders` |
| 门店筛选 | `全部门店`、门店 chip | 目标站切换门店后重新取房态 | `roomStatusesToday/get`、`rooms/get` | 本地仅展示已取证门店状态 | 暂不伪造实时切换，数据来源区暴露阻塞 | `source blockers` 用例检查阻塞提示 |
| 门店设置 | 齿轮按钮 | 跳转 `/InformationMaintenance/campInfo` | 设置页请求门店信息 | 已补跳转 | 使用项目已有门店信息路由 | `days matches captured navigation interactions` |
| 搜索 | 客户/手机/房间/渠道单/备注输入 | 目标站按关键词刷新房态或定位订单 | 与当前筛选一起触发房态请求 | 本地记录搜索条件，无真实请求 | Enter 后显示明确阻塞反馈 | `source blockers` 用例 |
| 顶部操作 | `读卡` | 依赖读卡器/客户端能力读取证件 | 外设/客户端接口，目标未在本地可复现 | 原无反馈 | 点击暴露“读卡器未接入”阻塞 | `source blockers` 用例 |
| 顶部操作 | `房价管理` | 进入房价管理相关页面 | 导航后请求房价接口 | 原为静态按钮 | 跳转项目已有 `/houseManage/houseCale` | `source blockers` 用例 |
| 顶部操作 | `更多设置` | 展开菜单：图例说明、房态设置 | 菜单本身无请求；房态设置入口需目标复核 | 已可展开 | 图例弹出说明；房态设置真实入口未取证则反馈阻塞 | `room-status interactions`、`source blockers` |
| 批量操作 | `批量设脏/净` | 展开批量菜单，选择后需先选房并提交 | 目标提交接口未在本轮安全接入 | 已可展开 | 菜单项点击提示先选择房间，不伪装成功 | `room-status interactions`、`source blockers` |
| 批量操作 | `批量开/关房` | 展开批量菜单，选择后需先选房并提交 | 目标提交接口未在本轮安全接入 | 已可展开 | 菜单项点击提示先选择房间，不伪装成功 | `room-status interactions` |
| 顶部操作 | `刷新`、`重新加载` | 重新拉取当前房态 | `roomStatusesToday/get` 等 | 本地清空筛选 | 显示“实时刷新接口阻塞”反馈 | `source blockers` 覆盖状态反馈 |
| 主内容 | 房间卡片 | 目标站当前有 2 张订单卡和 2 张普通房卡；点击可能打开房间/订单详情 | 详情接口未在本轮安全接入 | 已同步 2026-05-16 订单卡快照，原无反馈 | 卡片点击显示房间详情实时接口未接入 | `source blockers` 用例 |
| 右侧视图 | `按房型/按房间号/按楼层` | 切换房态分组视图 | 目标站主要更新前端布局 | 已可切换 active 和摘要 | 保持本地状态反馈 | `room-status interactions` |
| 右侧筛选 | 入离、房态、保洁状态、其他标签 checkbox | 目标站筛选当前房态 | 与房态请求参数联动 | 已可勾选并显示标签 | 勾选后显示本地筛选和阻塞反馈 | `room-status interactions` |
| 右侧筛选 | 渠道、房型、标签下拉 | 目标站切换选项后刷新当前房态 | 与房态请求参数联动 | 原只有静态下拉 | 增加取证选项和变更反馈，暴露实时请求阻塞 | `source blockers` 用例 |
| 状态 | loading/success/error/empty/disabled | 目标站真实请求时有 loading/空态/错误态 | 真实接口 | 本地无法安全实时请求 | 当前以阻塞提示、空房卡态和不可伪造成功原则处理 | 构建、日房态聚焦测试、取证产物 |
