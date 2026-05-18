# 保洁设置交互矩阵

- TASK_ID: `fangtai--baojie-guanli--baojie-shezhi`
- PAGE_NAME: `保洁设置`
- TARGET_URL: `https://minsubao.localhome.cn/cleanManage/cleanSetting`
- 本地路由: `/cleanManage/cleanSetting`
- 新增要求批次: `20260518-95-provider`
- 固定 Chrome: `C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe`
- 登录态: `playwright/.auth/pms-user.json`

## 差异结论

2026-05-15 固定 Chrome 目标站取证显示，当前账号在目标站保洁设置为未订阅智能保洁状态，默认态和价格设置态均显示订阅引导，仍能观察到 `/cleanConfig/base/get`、`/roomCategories/page/get`、`/rooms/get` 等保洁配置相关请求。2026-05-18 新增要求不再满足于静态未订阅态复刻，页面必须按“请求参数 -> 统一响应包 -> 字段适配 -> UI 展示”升级为业务可用状态。

本地当前实现已新增 `src/services/cleanSetting.ts`，以显式 mock provider 返回统一响应包，组件只消费适配后的业务模型；页面正文显示正常业务态，不展示开发态说明。

## 交互矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口与导航 | 房态 > 保洁管理 > 保洁设置 | 进入 `/cleanManage/cleanSetting`，保洁管理分组展开，保洁设置高亮 | `GET /cleanManage/cleanSetting`、`POST /menus/project/get`、`POST /cleanConfig/base/get` | 路由、菜单已存在 | 保持现有 AppShell/路由，不新增全局路由 | `tests/routes.spec.ts` 和 `tests/clean-setting.spec.ts` 断言页面根节点、标题、核心业务区域 |
| 数据来源 | 首屏加载 | 当前账号目标站显示订阅遮罩，但有保洁配置请求 | `POST /api/clean-setting/overview`，本地对应 `fetchCleanSettingDashboard` | 旧实现只有订阅遮罩静态内容 | 新增 `cleanSetting` 服务，返回统一 `code/message/data/traceId/timestamp` 响应包并适配业务模型 | 专项测试断言策略、价格、指标、待办来自页面服务并能展示 |
| 顶部筛选 | 保洁日期 | 目标站配置态被订阅状态遮挡，日期口径待联调确认 | `businessDate` | 新增日期控件 | 日期传入服务层；格式错误由服务层抛出 | Playwright 填写 `2026-05-20` 后查询并断言当前筛选条件更新 |
| 顶部筛选 | 门店 | 目标站有门店上下文与项目菜单请求 | `storeId` | 新增门店下拉 | 选项由服务层返回；选择 `前海店` 后刷新当前数据 | Playwright `selectOption('qianhai')` 后断言筛选摘要 |
| 顶部筛选 | 项目 | 目标站业务口径待后端确认 | `projectId` | 新增项目下拉 | 选项由服务层返回，默认全部项目 | Playwright 首屏断言项目控件可见 |
| 顶部筛选 | 策略状态 | 目标站配置态未可见 | `status`：`all/enabled/paused` | 新增状态下拉 | 服务层消费状态过滤策略列表 | Playwright 选择 `enabled` 后断言只展示启用策略业务反馈 |
| 顶部操作 | 查询 | 按当前条件刷新设置数据 | `POST /cleanManage/cleanSetting/overview` | 旧实现无查询 | 调用服务层并显示“已按筛选条件更新” | `tests/clean-setting.spec.ts` |
| 顶部操作 | 重置 | 恢复默认条件并刷新 | 同查询接口 | 旧实现无重置 | 重置日期、门店、项目、状态并显示业务反馈 | 专项测试覆盖按钮存在和默认态 |
| 顶部操作 | 刷新 | 重新拉取当前条件数据 | 同查询接口 | 旧实现无刷新 | 显示 loading 和“数据已刷新” | Playwright 点击 `刷新` 精确按钮 |
| 顶部操作 | 导出 | 目标站未取证到导出按钮 | `POST /cleanManage/cleanSetting/export` | 旧实现无导出 | 有数据时可导出，空态禁用，反馈导出任务已创建 | 专项测试断言成功反馈和空态禁用 |
| 指标卡片 | 今日任务、启用策略、平均接单、异常率 | 目标站未订阅态不可见 | 同概览接口 | 新增指标区 | 由服务层 `metrics` 驱动 | 首屏测试断言“今日任务/启用策略” |
| 基础设置 | 策略列表 | 目标站配置态被订阅遮罩阻断 | `policyRules` | 旧实现无策略表 | 展示自动派单、续住提醒、深度保洁复核策略 | Playwright 断言“退房保洁自动派单” |
| 基础设置 | 查看详情 | 目标站配置态不可见；详情承接方式待确认 | 本地打开详情弹窗 | 旧实现无详情 | 用业务详情弹窗承接，不跳不存在路由 | Playwright 点击后断言弹窗与房源范围 |
| 基础设置 | 编辑/保存策略 | 目标站保存接口未稳定取证 | `POST /cleanManage/cleanSetting/rule/save` | 旧实现无编辑 | 打开编辑弹窗，保存后显示“策略已保存” | Playwright 点击编辑和保存 |
| 价格设置 | tab 切换 | 目标站价格设置 tab 仍显示订阅引导 | `priceRules` | 旧实现只是切换订阅遮罩 | 业务态切换后展示价格规则表 | Playwright 点击 `价格设置` 后断言“深度保洁附加费” |
| 待办提醒 | 提醒项点击 | 目标站未订阅态不可见 | `reminders` | 新增提醒入口 | 点击显示业务反馈 | Playwright 可通过按钮点击验证 |
| 快捷入口 | 查看保洁任务 | 目标站侧栏可进入保洁任务 | 项目已有 `/cleanManage/cleanTask` | 新增快捷入口 | 使用已有路由，不硬编码不存在路径 | Playwright 断言 URL |
| 快捷入口 | 查看保洁统计 | 目标站侧栏可进入保洁统计 | 项目已有 `/cleanManage/cleanStatistics` | 新增快捷入口 | 使用已有路由 | Playwright 断言 URL |
| 快捷入口 | 查看保洁日志 | 目标站侧栏可进入保洁日志 | 项目已有 `/cleanManage/cleanLog` | 新增快捷入口 | 使用已有路由 | 取证脚本覆盖按钮清单 |
| 空态 | `?mockState=empty` | 未取证到目标站空配置态 | 统一响应包 `code=0,data.policyRules=[]` | 新增空态 | 表格显示“暂无保洁策略/暂无价格规则”，导出禁用 | 专项测试覆盖 |
| 错误态 | `?mockState=error` | 目标站接口失败需清晰暴露 | 统一响应包 `code=50001` | 新增错误态 | 显示“保洁设置加载失败”和重新加载入口 | 专项测试覆盖 |

## 关键证据路径

- 历史目标默认态：`artifacts/screenshots/fangtai--baojie-guanli--baojie-shezhi/default-target-headless-audit-20260515-134621-viewport.png`
- 历史目标价格态：`artifacts/screenshots/fangtai--baojie-guanli--baojie-shezhi/price-target-headless-audit-20260515-134621-viewport.png`
- 历史目标网络：`artifacts/network/fangtai--baojie-guanli--baojie-shezhi/default-target-headless-audit-20260515-134621-responses.json`
- 新版本地取证脚本：`scripts/capture-clean-setting.mjs`
- 新版专项测试：`tests/clean-setting.spec.ts`
- 接口文档：`D:\pms_ui\95prompt\接口文档\fangtai--baojie-guanli--baojie-shezhi-保洁设置接口文档.md`

## 待确认项

1. 目标账号开通智能保洁后的真实配置表单字段、保存接口和价格设置接口。
2. `cleanConfig/base/get` 的正式响应是否沿用目标站 `success/data`，还是按本轮统一响应包封装。
3. 保洁员、房型、房间选项是否统一从保洁统计页已用接口复用。
4. 导出任务是否异步生成文件，以及任务状态查询接口是否独立。
