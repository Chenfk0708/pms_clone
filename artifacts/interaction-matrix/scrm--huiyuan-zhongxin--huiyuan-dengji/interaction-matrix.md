# 会员等级交互矩阵

任务 ID：`scrm--huiyuan-zhongxin--huiyuan-dengji`

目标页：`https://minsubao.localhome.cn/scrm/memberCenter/level`

固定 Chrome 取证批次：`20260518072426`

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口与导航 | SCRM > 会员中心 > 会员等级 | URL 为 `/scrm/memberCenter/level`，侧栏高亮会员等级，页面隐藏通用页头，展示会员等级列表 | 首屏加载 `memberCard/page/get`、`memberBenefit/page/get`，同时有全局菜单/门店接口 | 已有路由和静态复刻 | 保留现有路由与布局，页面数据改由 `scrmMemberLevel` 服务层提供 | Playwright 进入路由，断言会员等级链接 active、表格和业务数据可见 |
| 顶部筛选 | 门店、等级状态、关键词 | 目标站当前页面未展示筛选，后台请求受当前门店上下文影响 | `GET /scrm/memberCenter/levels` 建议请求参数：`storeId/status/keyword/page/pageSize` | 无筛选，表格静态写死 | 增加业务筛选控件，参数进入 mock provider 并刷新列表 | Playwright 修改筛选后断言反馈和列表更新 |
| 顶部操作 | 查询 | 目标站无显式查询按钮 | 同列表查询接口 | 无 | 显示 loading，完成后展示筛选反馈 | Playwright 点击后断言状态区文本和表格结果 |
| 顶部操作 | 重置 | 目标站无显式重置按钮 | 同列表查询接口 | 无 | 恢复默认筛选并刷新 | Playwright 点击后断言控件值恢复 |
| 顶部操作 | 刷新 | 目标站无显式刷新按钮 | 同列表查询接口 | 无 | 重新拉取当前条件数据并更新刷新时间 | Playwright 点击后断言刷新反馈 |
| 顶部操作 | 导出 | 目标站未取证到导出入口 | `POST /scrm/memberCenter/levels/export` | 无 | 以业务态创建导出任务反馈，不在页面正文展示开发态文案 | Playwright 点击后断言导出任务反馈 |
| 列表 | 会员等级表格 | 表头为会员等级、等级名称、免费升级条件、会员折扣、会员权益、会员卡面、操作；当前有等级1普通会员 | `memberCard/page/get` 返回列表 | 组件内硬编码一行 | 接入统一响应包和 adapter，支持多等级、分页、空态和错误态 | Playwright 断言表格数据来自服务层、empty/error 路径可见 |
| 列表操作 | 编辑 | 打开编辑会员等级弹窗，表单带已有等级名称和等级号 | `POST /scrm/memberCenter/levels/detail` 建议按等级 id 查询详情 | 已打开静态弹窗 | 弹窗消费所选等级业务模型，提交时给出保存成功反馈 | Playwright 点击编辑、保存、关闭 |
| 顶部操作 | 新建会员等级 | 打开新增会员等级弹窗，默认等级号为 2，包含等级名称、免费升级条件、折扣、卡面、权益 | `POST /scrm/memberCenter/levels/save` | 已打开静态弹窗，提交无反馈 | 弹窗表单支持输入，保存时禁用按钮并显示成功反馈 | Playwright 点击新建、填写、提交 |
| 顶部操作 | 会员升级设置 | 打开右侧抽屉，展示计算累计时间段和三条升级规则，默认第三条选中 | `POST /scrm/memberCenter/upgradeRule/get`、`save` | 已打开静态抽屉 | 抽屉消费服务层规则，切换规则和保存均有反馈 | Playwright 打开抽屉、切换规则、保存 |
| 状态反馈 | loading、empty、error、disabled | 目标站默认成功态；空态/错误态未取证 | mock provider 统一响应包支持 `success/empty/error` | 无 | 使用 `mockState` query 覆盖三态，错误清晰暴露并可重试 | Playwright 覆盖 success、empty、error |
| 跨页入口 | 会员权益、会员积分 | 目标侧栏已有会员权益/会员积分入口 | 项目已有 `/scrm/memberCenter/equity`、`/scrm/memberCenter/integrate` | 侧栏路由已存在 | 页面内增加查看会员权益、查看会员积分业务入口，优先跳已有路由 | Playwright 点击后断言 URL |
