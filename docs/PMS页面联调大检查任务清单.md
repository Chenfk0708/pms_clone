# PMS 页面联调大检查任务清单

更新时间：2026-05-16

## 目标模型

- S0：95 个页面已基本完成单页复刻，但页面之间的路由、侧栏、高亮、按钮跳转和订阅详情等跨页交互仍可能不一致。
- Sg：所有 prompt 对应目标 URL 在本地有可访问路由；主要菜单和按钮跳转到对应页面；差异被记录为可继续推进的任务清单。
- O：读取 `D:\pms_ui\workspace1.md`、`C:\Users\Administrator\Desktop\work\xxxxx\clone_pms_prd.md`、`D:\pms_ui\页面任务看板.md`、`D:\pms_ui\95prompt\prompts`、`D:\pms_ui\pms_url.txt`，并交叉检查 `src/App.tsx`、`src/components/AppShell.tsx`、`src/data/discovery.ts`、`src/data/mock.ts`、`tests/`、`artifacts/`。
- C：不写入 cookie/token/storageState；不伪造目标站行为；不以单页测试通过替代跨页联调；优先修正真实目标 URL 与本地路由不一致的问题。

## 本轮检查结论

- 95 个 prompt 文件均已读取并参与路由覆盖检查。
- 95/95 个 prompt 的目标路径当前都有本地 React route 覆盖。
- 95/95 个 prompt 当前能匹配到对应测试或路由测试证据。
- 95/95 个 prompt 当前能匹配到截图、DOM、style、network 或 diff 类 artifacts 目录证据。
- `clone_pms_prd.md` 实际位置为父目录 `C:\Users\Administrator\Desktop\work\xxxxx\clone_pms_prd.md`，不是当前项目根目录。
- 当前最大阻力不再是“页面是否存在”，而是跨页面跳转、真实目标 URL 别名、侧栏高亮和订阅/详情页复用逻辑的统一。
- 本轮已按遗留失败清单修正测试旧断言和侧栏折叠预期，全量 e2e 更新为 224/224 通过。

## 已发现并处理

| 编号 | 问题 | 根因 | 状态 | 证据 |
| --- | --- | --- | --- | --- |
| P0-01 | 企业信息 prompt 目标是 `/CompanySetting/CompanyInfo`，本地此前主要使用 `/InformationMaintenance/companyInfo` | 多任务复刻期间设置页历史路径未统一到目标站真实 URL | 已修复 | `src/App.tsx` 新增真实路由；`src/data/discovery.ts` 企业信息侧栏改为真实路径；`tests/company-info.spec.ts` 改为真实路径并通过 |
| P0-02 | 信息概览 prompt/URL 清单存在 `/InformationMaintenance/informationOvervie` 拼写历史问题 | 目标资料里的 URL 少了 `w`，后续记录已确认规范业务页为 `/InformationMaintenance/informationOverview` | 已修复 | `src/App.tsx` 新增误拼路径重定向到规范路径；信息概览专项测试通过 |
| P0-03 | pms_url 中“微信客服/接待配置”出现同一 `/scrm/wechatService/manage` 路径 | URL 清单记录重复，实际本地和任务记录已有 `/scrm/wechatService/receptionConfig` | 待复查 | 当前 `src/App.tsx` 已有两个路由，后续应补一条菜单/跳转专项验证 |
| P1-01 | 应用订阅 5 个页面没有进入全局 `sideNavByPath` 统计 | 这些页面使用页面内订阅中心侧栏，不属于全局 `AppShell` 侧栏 | 已确认非缺陷 | `ApplicationPaymentPage`、`MyBenefitPage`、`VersionSubscriptionPage` 等页面内已有 `NavLink` 侧栏 |
| P1-02 | 房情表目标路径是 `/statistics/roomSituation`，房态侧栏里仍有 `/houseManage/houseStatus` 别名 | 为了复刻目标站侧栏归类保留了房态侧栏入口别名 | 已记录 | `App.tsx` 同时支持 `/statistics/roomSituation` 和 `/houseManage/houseStatus` |
| P1-03 | 全量 e2e 曾有 13 个遗留失败，集中在旧 `h1` 断言、同名选择器、侧栏全展开假设和已实现页面仍按占位页判断 | 测试断言没有跟随当前真实页面结构与 AppShell 折叠策略更新 | 已修复 | `tests/routes.spec.ts` 等测试已改为页面根节点、关键业务控件和显式展开侧栏分组断言；`npm run test:e2e -- --timeout=60000 --workers=1 --reporter=line` 为 224/224 通过 |

## 后续联调任务清单

| 优先级 | 任务 | 当前状态 | 验收方式 |
| --- | --- | --- | --- |
| P0 | 跑全量构建与全量 e2e，确认路由修正后没有跨页回归 | 已完成 | `npm run build` 通过；`npm run lint` 通过；全量 e2e 为 224/224 通过 |
| P0 | 增加或复核企业信息真实路径跳转链：设置侧栏 `企业信息` 点击后应到 `/CompanySetting/CompanyInfo` | 已完成 | 企业信息专项 2/2 通过；95 个 prompt 目标路径路由覆盖 95/95 |
| P0 | 复核信息概览误拼入口：访问 `/InformationMaintenance/informationOvervie` 应跳转规范路径 | 已完成 | 信息概览专项含重定向断言 2/2 通过 |
| P1 | 复核顶部工具按钮跳转：接待、门锁、通知、应用订阅 | 待办 | 统一写一组 AppShell 交互测试 |
| P1 | 复核 SCRM 微信客服与接待配置跳转差异 | 待办 | 从侧栏和页面按钮分别点击，确认落到 `manage` / `receptionConfig` |
| P1 | 复核所有“订阅开通/立即开通/购买/详情”按钮是否进入正确订阅详情页，并保留对应产品上下文 | 待办 | 覆盖智能调价、智能保洁、SCRM、全域雷达、路客商城 |
| P2 | 汇总视觉 diff 高差异页面，区分全局壳层差异与页面本体差异 | 待办 | 读取 `artifacts/image-diffs/**.json`，按 changedRatio 排序 |
| P2 | 整理历史路径别名策略，不再让新增页面继续扩散旧路径 | 待办 | 在文档中列出“真实目标路径/兼容旧路径/重定向路径” |

## 全量 e2e 遗留失败清单

最新命令：`npm run test:e2e -- --timeout=60000 --workers=1 --reporter=line`。结果：224 passed，0 failed。

| 分类 | 失败用例 | 初步归因 | 状态 |
| --- | --- | --- | --- |
| 选择器严格性 | `tests/application-payment.spec.ts` 应用订阅 active link | 顶部应用入口和订阅中心侧栏同名，测试未限定作用域 | 已修复：限定到 `应用订阅侧栏` |
| 侧栏折叠预期 | `tests/calendar-room.spec.ts` 找不到预售券/酒店套餐 | 售卖/产品侧栏当前只展开当前组，测试仍要求非当前组链接可见 | 已修复：测试先展开对应侧栏分组 |
| 页面文案/旧断言 | `tests/channel-price.spec.ts` 渠道 RP 价标题 | 房价页当前文案/结构与旧测试断言不同 | 已修复：改为断言当前激活房价 tab |
| 旧 routes 聚合断言 | `tests/routes.spec.ts` 中 cleanSetting、logs/price、priceBoard、priceComparison、otherPrice、informationOverview 等 render 断言 | 聚合路由测试仍按旧 `h1` 或旧文案判断，和多个单页专项已不一致 | 已修复：改为路径级页面根节点和关键业务控件断言 |
| 页面已实现后测试未更新 | `tests/shift-record.spec.ts` 仍期待跳转到占位页 | `/setting/shiftSetting` 已有真实页面，旧测试还检查 `PMS 页面占位` | 已修复：改为断言真实交接班设置页 |
| 智慧酒店侧栏可见性 | `tests/smart-hotel-global-setting.spec.ts`、`tests/smart-self-checkin.spec.ts` 找不到智能硬件商城链接 | 智慧酒店侧栏折叠行为与旧测试的全展开假设不一致 | 已修复：测试先展开智能硬件/公安对接分组 |

## Prompt 到证据检查清单

| 要求 | 证据 | 状态 |
| --- | --- | --- |
| 读取 95 个 prompt 脚本并纳入检查 | `D:\pms_ui\95prompt\prompts` 统计为 95 个 `.md`；脚本抽取每个 `TASK_ID`、`MENU_PATH`、`TARGET_URL` | 已完成 |
| 读取 `workspace1.md` | `D:\pms_ui\workspace1.md` 已读取，确认其为持续优化记录和执行账本 | 已完成 |
| 读取 `clone_pms_prd.md` | `C:\Users\Administrator\Desktop\work\xxxxx\clone_pms_prd.md` 已读取，确认其为实时记录文档 | 已完成 |
| 读取页面任务看板 | `D:\pms_ui\页面任务看板.md` 已读取，确认大部分任务为已完成并带验证记录 | 已完成 |
| 结合目标 URL 差异 | 从 `D:\pms_ui\pms_url.txt` 与 prompt `TARGET_URL` 抽取路径，和 `src/App.tsx` 路由交叉检查 | 已完成 |
| 写任务清单文档 | 当前文档 `docs/PMS页面联调大检查任务清单.md` | 已完成 |
| 根据清单实时更新状态 | 本轮已把全量 e2e 遗留失败从 13 个更新为 0 个，并记录最新构建、lint、e2e 验证结果 | 已完成 |
