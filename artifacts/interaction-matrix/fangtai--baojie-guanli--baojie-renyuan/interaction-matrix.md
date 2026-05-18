# 保洁人员交互矩阵

任务：`fangtai--baojie-guanli--baojie-renyuan`  
页面：`保洁人员`  
目标 URL：`https://minsubao.localhome.cn/cleanManage/cleanStaff`  
本次改善时间：2026-05-18  
数据策略：目标站网络取证字段 + 本地显式 `mock` provider 业务契约草案。

## 取证与实现结论

- 目标站取证批次 `20260516-95-audit` 显示真实页会请求 `camps/get`、`camp/get`、`select/poi/page/get`、`edition/resource/get`、`cleaner/page/get`、`roomCategories/page/get`、`rooms/get`、`paymentTypes/get/v2` 等接口。
- 目标站当前账号下 `cleaner/page/get` 返回空列表，无法取证真实列表行字段；本地按统一响应包补齐可用业务契约，并在接口文档标记后端待确认。
- 本地页已从未开通遮罩态升级为业务可用态：指标、筛选、列表、详情、新增、导出、空态、错误态和跨页入口均由 `src/services/cleanStaff.ts` 驱动。
- 页面正文未展示“mock 数据”“未接入”“后端未就绪”等开发态文案；provider 和请求参数只通过测试用隐藏 `output` 暴露。

## 交互矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 页面入口 | `/cleanManage/cleanStaff` | 从房态 > 保洁管理 > 保洁人员进入，侧边菜单显示保洁管理组 | 首屏 `cleaner/page/get`、`select/poi/page/get` | `App.tsx` 和菜单已有路由 | 沿用现有 layout、路由和菜单，不改全局壳层 | `tests/clean-staff.spec.ts` 首屏用例断言标题、列表和请求参数 |
| 顶部门店 | 全部门店、具体门店 | 目标站可按门店切换上下文 | `/select/poi/page/get` 提供门店；`/cleaner/page/get` body 带 `poiId` | 原页面只切换按钮状态 | provider 返回 stores，点击后刷新列表和指标 | Playwright 断言 `data-testid=clean-staff-request` 中 `poiId` |
| 顶部筛选 | 日期 | 目标站保洁相关接口使用业务日期上下文 | `/cleaner/page/get` body 带 `serviceDate` | 原页面无日期 | 接入 date input，变更后触发 provider | Playwright 首屏和参数断言 |
| 顶部筛选 | 保洁状态 | 目标站未取证到列表成功态；契约草案补齐状态筛选 | `/cleaner/page/get` body 带 `status` | 原页面无状态筛选 | 支持 `onDuty/offDuty/leave` | `filters, refreshes and resets` 用例断言 `status=onDuty` |
| 顶部筛选 | 姓名/手机号 | 目标站可输入关键字，当前账号未出成员结果 | `/cleaner/page/get` body 带 `keyword` | 原页面只保存输入 | 查询按钮提交关键词，provider 返回过滤后的列表 | Playwright 填 `李` 后断言 2 行 |
| 顶部操作 | 查询 | 刷新当前筛选数据 | `/cleaner/page/get` | 原页面无查询按钮 | 设置 loading，完成后更新指标和表格 | Playwright 断言请求参数和行数 |
| 顶部操作 | 重置 | 恢复初始筛选 | `/cleaner/page/get` 默认参数 | 原页面无重置 | 清空 keyword、状态、门店和页码 | Playwright 断言 `keyword=` 且恢复 6 行 |
| 顶部操作 | 刷新 | 重新拉取当前条件数据 | `/cleaner/page/get` 当前参数 | 原页面无刷新 | 显示处理态，完成后展示“已刷新”反馈 | Playwright 断言 status 文案 |
| 顶部操作 | 导出 | 目标站未取证到当前页导出；按业务补齐 | `/cleaner/export/create` | 原页面无导出 | provider 创建导出任务并给业务反馈 | Playwright 点击导出断言反馈 |
| 顶部操作 | 新增保洁员 | 目标站未开通态点击添加成员无可继续弹层 | `/cleaner/save` | 原页面按钮无反馈 | 本地以新增弹窗承接，保存走 provider | Playwright 打开弹窗并保存断言反馈 |
| 指标卡片 | 在岗、今日任务、逾期、休息/请假 | 目标站成功态未取证；按保洁运营语境补齐 | 读取 `/cleaner/page/get` summary | 原页面无指标 | 指标来自 adapter 后业务模型，点击有反馈或跳转 | Playwright 首屏断言指标 |
| 表格 | 保洁人员列表 | 目标站 `cleaner/page/get` 当前为空 | `/cleaner/page/get` 分页响应 | 原页面不渲染表格 | 渲染姓名、手机号、门店、状态、房源、任务、评分、操作 | Playwright 断言 6 行 |
| 表格操作 | 查看详情 | 目标站当前没有可验证详情 | 无新增请求，消费当前行业务模型 | 原页面无详情 | 弹窗展示任务、评分和房源范围 | Playwright 点击首行详情并关闭 |
| 快捷入口 | 查看保洁任务 | 跳转保洁任务页 | 已有 `/cleanManage/cleanTask` | 原页面无入口 | 使用现有路由承接 | Playwright 断言 URL |
| 快捷入口 | 查看保洁统计 | 跳转保洁统计页 | 已有 `/cleanManage/cleanStatistics` | 原页面无入口 | 使用现有路由承接 | 页面按钮可点击，专项测试覆盖任务入口 |
| 状态 | loading | 目标站请求时有加载态 | provider promise pending | 原页面无数据加载态 | 按钮禁用并显示处理反馈 | Playwright 间接覆盖按钮禁用和反馈 |
| 状态 | empty | 目标站当前接口空列表，但 UI 被未开通态覆盖 | 统一响应包 `list=[]` | 原页面无业务空态 | `scenario=empty` 展示空态，不崩溃 | Playwright 空态用例 |
| 状态 | error | 目标站取证未触发错误 | 统一响应包错误或 provider throw | 原页面无错误态 | `scenario=error` 展示 alert 和重试 | Playwright 错误态用例 |
| 浏览器刷新 | 当前路由刷新 | 恢复当前页面 | 默认 query 参数 | 原页面可恢复旧遮罩 | 业务可用态可恢复，场景由 URL query 控制 | Playwright `page.goto` 覆盖 |

## 后端待确认

- `cleaner/page/get` 成功列表字段需后端确认；当前目标账号只返回空列表。
- 新增、导出接口 path 和权限规则需后端确认。
- `status` 枚举是否采用 `onDuty/offDuty/leave` 需后端确认。
