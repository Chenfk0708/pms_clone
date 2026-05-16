# 保洁统计交互矩阵

任务：`fangtai--baojie-guanli--baojie-tongji`  
目标页：`https://minsubao.localhome.cn/cleanManage/cleanStatistics`  
本地页：`/cleanManage/cleanStatistics`

## 真实取证结论

- 固定 Chrome + `playwright/.auth/pms-user.json` 可进入目标页，未触发登录页阻塞。
- 首屏专属接口包括：
  - `POST https://hudson-prod.localhome.cn/cleanTask/statistics`
  - `POST https://hudson-prod.localhome.cn/cleaner/list/get`
  - `POST https://hudson-prod.localhome.cn/roomCategories/page/get`
  - `POST https://hudson-prod.localhome.cn/rooms/get`
- 统计请求参数来自当前门店和日期：`campId/pageNum/pageSize/cleanStartTime/cleanEndTime`。
- 本地旧实现把汇总表和明细表写死在组件数组中，查询、导出和重置只显示本地假成功提示。

| 区域 | 元素/按钮 | 目标站行为 | 触发请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口导航 | 房态 > 保洁管理 > 保洁统计 | URL 为 `/cleanManage/cleanStatistics`，房态顶部导航和保洁管理侧栏高亮 | 首屏加载壳层和页面专属接口 | 路由和高亮已存在 | 保持现有 AppShell 路由和菜单 | Playwright 断言标题、侧栏链接、核心页面可见 |
| 数据来源 | 页面首屏 | 读取当前门店、房型、房间、保洁员和统计汇总 | `cleanTask/statistics`、`cleaner/list/get`、`roomCategories/page/get`、`rooms/get` | 组件内硬编码静态表格 | 新增页面服务，按 URL/localStorage/env 提供的 `campId` 请求真实接口；缺少上下文时暴露阻塞 | Playwright route 断言请求 body，页面渲染响应数据 |
| 顶部筛选 | 门店切换 | 目标站按门店上下文切换后刷新统计 | `cleanTask/statistics` 携带当前 `campId` | 只切换本地按钮状态 | 当前项目无全局门店上下文，先使用 `campId` 来源；无上下文时禁用真实查询并显示阻塞 | 缺 `campId` 测试显示 alert，不出现假数据 |
| 顶部筛选 | 本月/上月/日期范围 | 更新日期范围并重新查询 | `cleanStartTime/cleanEndTime` 随 UI 日期变化 | 只改本地日期 | 日期变化后查询使用当前日期范围，loading 时禁用按钮 | Playwright 点击查询后断言时间戳参数 |
| 顶部操作 | 查询 | 按当前筛选刷新统计 | `cleanTask/statistics` | 假成功 toast | 调用真实服务，成功显示数据和更新时间，失败显示错误 | Playwright 断言请求和 UI 更新 |
| 顶部操作 | 重置 | 恢复本月筛选并重新查询 | `cleanTask/statistics` | 清空本地筛选并假成功 | 恢复默认范围，重新请求；缺上下文时只保留阻塞 | Playwright 断言重置后的日期和请求 |
| 顶部操作 | 导出 | 目标站存在导出按钮，本轮未捕获到明确导出文件接口 | 未取证到导出接口 | 假成功“已生成导出任务” | 不伪装成功，改为明确未接入阻塞提示 | Playwright 点击后断言阻塞提示 |
| 下拉控件 | 房型房间 | 从房型/房间接口渲染选项 | `roomCategories/page/get`、`rooms/get` | 写死房间名 | 由真实接口适配房型房间选项，选中后作为本地筛选反馈 | Playwright 断言选项来自 route 响应 |
| 下拉控件 | 保洁员 | 从保洁员接口渲染选项 | `cleaner/list/get` | 写死保洁员 | 由接口响应适配；空数据时显示“暂无保洁员” | Playwright 断言空态或选项 |
| 表格 | 统计汇总 | 显示 `cleanTask/statistics.data.list`，列为扫尘/续住/退房/深度/合计数量和费用 | `cleanTask/statistics` | 写死旧数据 | 删除静态假数据，按响应字段适配 | Playwright 断言响应中的日期和金额 |
| 明细页签 | 统计明细 | 目标站存在页签；本轮未捕获到独立明细接口，当前首屏只确认统计汇总接口 | 未确认独立明细接口 | 写死任务编号明细 | 删除假明细，显示“明细接口未取证”阻塞 | Playwright 断言不再出现静态任务编号 |
| 错误态 | 接口失败/登录失效 | 后端失败、未登录或无权限需暴露 | 对应 HTTP/业务错误 | 无真实错误态 | 显示 `role=alert` 错误和重试按钮，不吞错 | Playwright 模拟 500/业务失败 |
| 跨页入口 | 订阅开通 | 跳转智能保洁订阅详情 | 项目路由 | 已可跳转 | 保持跳转到 `/version/applicationPayment/detail` | Playwright 断言 URL 和订阅页内容 |

## 阻塞

- 当前本地 SPA 无全局已认证 PMS API 代理。真实接口直连依赖浏览器同源 Cookie/CORS，若本地运行时失败，页面必须暴露错误，不添加静默 fallback。
- 导出接口和统计明细独立接口本轮未取证到，不能伪造成成功。
