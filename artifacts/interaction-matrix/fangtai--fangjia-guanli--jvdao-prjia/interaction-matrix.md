# 聚到PR价交互矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口与导航 | 房态 > 房价管理 > 渠道RP价 | URL 为 `/houseManage/channelPrice`，房价菜单高亮，页签选中渠道RP价 | 页面首屏加载触发房价、渠道、房型、设置类请求 | 已有路由和页签，数据仍主要来自本地硬编码数组 | 保留现有入口，补真实请求状态和阻塞暴露 | Playwright 进入本页断言菜单/页签/请求状态 |
| 顶部筛选 | 门店切换 | 切换门店后按当前门店刷新渠道、房型和价格 | `/select/poi/get`、`/select/channel/switching/get`、`/roomCategoryStatuses/otaPmsPriceChange/channel/get` | 只切换 chip，高亮但不刷新数据 | 筛选状态进入请求参数，显示 loading/失败/空态 | 点击门店后断言请求 body 和 UI 反馈 |
| 顶部筛选 | 渠道下拉 | 展开渠道选项，选择后刷新价格矩阵 | `/select/channel/switching/get`、价格矩阵接口 | 有下拉和选中态，未接真实请求参数 | 选择渠道后刷新请求，失败时暴露阻塞 | Playwright route 断言渠道参数变化 |
| 顶部筛选 | 房型/房型标签 | 展开目标选项，选择后刷新价格矩阵 | `/select/roomCategoryProducts/parentProduct/page/get`、`/roomCategoryGroups/get` | 仅显示 popover 或静态按钮 | 选择后刷新请求，缺目标选项时显示未接入提示 | 点击后断言 popover/请求/反馈 |
| 顶部操作 | 同步至渠道 | 触发同步或展示权限/未接入反馈 | 目标需继续取证，历史有 `/actionExec/express` | 当前只 toast 假成功 | 改为未接入阻塞提示，不假成功 | 点击后断言阻塞提示 |
| 顶部操作 | RP设置 | 跳转日历房设置页 | 目标跳 `/setting/localRoomTypeProductionSetting` | 已可跳转 | 保留并回归 | Playwright 断言 URL 和标题 |
| 顶部操作 | 价格设置 | 打开价格设置抽屉，支持关闭/保存 | 目标涉及销售价关系设置，历史请求包含 `salePriceSetting/get` | 已有抽屉，保存直接关闭 | 保存给明确“未接入真实提交”反馈 | 点击保存断言反馈 |
| 顶部操作 | 价格规划 | 打开价格规划抽屉，支持筛选和新增规划入口 | `/select/roomCategoryProducts/parentProduct/page/get` | 已有抽屉，部分按钮无反馈 | 对新增/筛选给请求或未接入反馈 | Playwright 点击逐项断言反馈 |
| 顶部操作 | 批量改价 | 打开批量修改抽屉，支持日期/产品/价格输入 | 目标提交接口需继续取证 | 已有抽屉，保存直接关闭 | 保存给未接入真实提交提示，防止假成功 | Playwright 断言校验/反馈 |
| 顶部操作 | 预览与覆盖/暂不处理 | 打开预览弹窗/确认弹窗 | 目标预览与覆盖逻辑需继续取证 | 已有弹窗，确认有 toast | 保留打开/关闭，确认提示为本地未提交或阻塞 | Playwright 断言弹窗和提示 |
| 主表格 | 日期切换/今日/收起展开 | 切换日期窗口或展开状态，刷新当前区间价格 | 价格矩阵接口 body 携带日期范围 | 本地只改静态日期偏移 | 日期状态进入请求参数，loading 与错误可见 | Playwright 点击后断言请求 body |
| 主表格 | 价格单元格 | 点击打开改价浮层 | 目标打开改价表单，提交接口需继续取证 | 已有改价浮层，确认直接关闭 | 确认前校验，确认给未接入真实提交提示 | Playwright 点击单元格和确认断言反馈 |
| 状态反馈 | loading/empty/error/disabled | 真实请求中展示加载、空态、错误、禁用或权限提示 | 所有核心数据接口 | 当前缺真实请求状态 | 新增请求状态视图，不用静默 fallback | Playwright mock success/empty/error 三态 |

