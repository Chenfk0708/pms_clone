# 保洁人员 95 分任务完成审计

审计时间：2026-05-16  
任务：`fangtai--baojie-guanli--baojie-renyuan`  
目标：读取并执行 `D:\pms_ui\95prompt\prompts111\015-fangtai--baojie-guanli--baojie-renyuan.md`，把保洁人员页按真实取证、真实交互、阻塞暴露和可回归验证要求复核到完成态。

## Prompt 到产物检查表

| 要求 | 证据 | 结论 |
| --- | --- | --- |
| 读取 prompts111 全文 | 已用 UTF-8 读取 `D:\pms_ui\95prompt\prompts111\015-fangtai--baojie-guanli--baojie-renyuan.md` | 通过 |
| 读取原始 prompt | 已用 UTF-8 读取 `D:\pms_ui\95prompt\prompts\015-fangtai--baojie-guanli--baojie-renyuan.md` | 通过 |
| 检查已有页面、路由、菜单、请求层、测试 | 确认 `src/App.tsx`、`src/data/mock.ts`、`src/pages/CleanStaffPage.tsx`、`src/pages/CleanStaffPage.css`、`tests/clean-staff.spec.ts`、`scripts/capture-clean-staff.mjs` | 通过 |
| 使用固定 Chrome 和 storage state 取证 | `scripts/capture-clean-staff.mjs` 批次 `20260516-95-audit`，target/clone 截图、DOM、style、network 已生成 | 通过 |
| 目标站真实请求清单 | `artifacts/network/fangtai--baojie-guanli--baojie-renyuan/default-target-20260516-95-audit.json`；`real-request-summary-20260516-95-audit.json` | 通过 |
| 请求字段和响应字段摘要 | `real-request-summary-20260516-95-audit.json` 记录关键接口、request body 字段和 response summary | 通过 |
| 交互矩阵 | `artifacts/interaction-matrix/fangtai--baojie-guanli--baojie-renyuan/interaction-matrix.md` | 通过 |
| 可见按钮和控件有处理结果 | 矩阵覆盖门店、搜索、添加成员、订阅开通、刷新恢复；target/clone 交互态截图和 state dump 已生成 | 通过 |
| 不伪造未开通后的成员数据 | `tests/clean-staff.spec.ts` 断言无 `保洁人员列表` 表格；页面保持未开通遮罩态 | 通过 |
| 跨页入口协调 | `订阅开通` target/clone 均跳转 `/version/applicationPayment/detail` | 通过 |
| 错误/权限/未接入阻塞暴露 | 矩阵和实时记录明确：当前账号未开通智能保洁，本地 SPA 无已认证 PMS API 代理，不实现假新增/假保存 | 通过 |
| 实时记录 | 已追加 `C:\Users\Administrator\Desktop\work\xxxxx\clone_pms_prd.md` 和 `D:\pms_ui\workspace1.md` | 通过 |
| 不写入账号、密码、cookie、token、storage state 内容 | 新增产物仅写 storage state 路径，未写明文凭据或 token 内容；`rg` 检查新增矩阵/网络摘要未命中账号密码 | 通过 |
| 自动化验证 | 保洁人员专项 2/2 通过；保洁相邻路由回归 7/7 通过；触达文件 lint 退出码 0 | 通过 |

## 验证命令

| 命令 | 退出码 | 结果 |
| --- | --- | --- |
| `npx eslint src/pages/CleanStaffPage.tsx tests/clean-staff.spec.ts scripts/capture-clean-staff.mjs` | 0 | 触达文件 lint 通过 |
| `npx playwright test tests/clean-staff.spec.ts --timeout=60000 --workers=1 --reporter=line` | 0 | 2/2 passed |
| `npx playwright test tests/routes.spec.ts --grep "cleanTask|cleanStatistics|cleanStaff|cleanSetting|cleanLog" --timeout=60000 --workers=1 --reporter=line` | 0 | 7/7 passed |
| `npm run build` | 1 | 被当前仓库无关既有问题阻塞：缺失 `src/pages/PresaleOrderPage`、`CleanStatisticsPage.tsx` 未使用类型、`PricePage.tsx` 未使用导入 |
| `npm run lint` | 1 | 被当前仓库无关既有问题阻塞：CleanStatistics/HouseMonths/PricePage Hook lint、多个 services 的 `no-useless-assignment`、workspace irregular whitespace 等 |

## 真实请求清单

关键接口见 `artifacts/network/fangtai--baojie-guanli--baojie-renyuan/real-request-summary-20260516-95-audit.json`：

- `POST https://hudson-prod.localhome.cn/camps/get`
- `POST https://hudson-prod.localhome.cn/camp/get`
- `POST https://hudson-prod.localhome.cn/select/poi/page/get`
- `POST https://hudson-prod.localhome.cn/edition/resource/get`
- `POST https://hudson-prod.localhome.cn/cleaner/page/get`
- `POST https://hudson-prod.localhome.cn/weiRoomCategories/page/get`
- `POST https://hudson-prod.localhome.cn/rooms/get`
- `POST https://hudson-prod.localhome.cn/paymentTypes/get/v2`

## 剩余阻塞

- 全量 build/lint 不是本页触达范围内的绿灯，当前由共享仓库其他页面既有问题阻塞，已记录。
- 当前目标站账号未开通智能保洁，本页不存在可验证的成员列表成功态。本地不补伪成员数据。
- 本地 SPA 没有已认证 PMS API 代理，不能安全实现写入类保洁人员接口；不做假新增、假保存、假成功。
- 全局 AppShell、AntD 字体图标、目标站右侧会话浮层仍有全局视觉差异，非本页局部范围。

## 自评

92/100。扣分项：全量 build/lint 因无关共享问题未绿；本页只能闭环当前真实未开通态，无法验证已开通后的成员表格成功态；实时写入类接口缺少安全代理，只能作为真实阻塞暴露。
