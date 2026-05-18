# 保洁人员完成审计

审计时间：2026-05-18  
任务：`fangtai--baojie-guanli--baojie-renyuan`  
目标：读取并执行 `D:\pms_ui\95prompt\prompts111\015-fangtai--baojie-guanli--baojie-renyuan.md`，先检查中断后的项目实际进度，再把保洁人员页推进到真实交互、显式数据 provider、接口文档、取证和自动化验收闭环。

## 目标拆解

| 成功标准 | 证据 | 结论 |
| --- | --- | --- |
| 读取 prompts111 完整提示词 | 本轮已用 UTF-8 读取 `D:\pms_ui\95prompt\prompts111\015-fangtai--baojie-guanli--baojie-renyuan.md` | 通过 |
| 读取原始 prompt | 本轮已用 UTF-8 读取 `D:\pms_ui\95prompt\prompts\015-fangtai--baojie-guanli--baojie-renyuan.md` | 通过 |
| 检查上次中断后的实际进度 | 确认旧实现仍是未开通遮罩态，旧测试保护旧行为，接口文档缺失；相关文件为 `src/pages/CleanStaffPage.tsx`、`src/pages/CleanStaffPage.css`、`tests/clean-staff.spec.ts`、`scripts/capture-clean-staff.mjs` | 通过 |
| 页面入口可访问，菜单和路由协调 | `App.tsx` 已有 `/cleanManage/cleanStaff` 路由；Playwright 专项进入页面并断言标题、列表、快捷入口 | 通过 |
| 核心数据来自统一数据层显式 provider | 新增 `src/services/cleanStaff.ts`，页面只消费 `CleanStaffDashboard` 业务模型 | 通过 |
| provider 返回统一响应包 | `src/services/cleanStaff.ts` 使用 `code/message/data/traceId/timestamp`，支持 success/empty/error | 通过 |
| 组件内静态假数据移除 | `CleanStaffPage.tsx` 不再包含成员常量、背景图遮罩或未开通状态，数据来自 `fetchCleanStaffDashboard` | 通过 |
| 交互矩阵覆盖可见控件 | `artifacts/interaction-matrix/fangtai--baojie-guanli--baojie-renyuan/interaction-matrix.md` 覆盖门店、日期、状态、关键词、查询、重置、刷新、导出、新增、详情、快捷入口、空态、错误态 | 通过 |
| 接口文档已生成 | `D:\pms_ui\95prompt\接口文档\fangtai--baojie-guanli--baojie-renyuan-保洁人员接口文档.md` 已存在，包含请求参数、成功/空态/失败 JSON、字段说明、后端待确认 | 通过 |
| 目标站固定 Chrome 取证 | `20260518-target-refresh` 批次已生成到 screenshots、dom-snapshots、style-dumps、network 对应目录，未登录阻塞 | 通过 |
| 本地固定 Chrome 取证 | `20260518-business-provider-hidden` 批次已生成到 screenshots、dom-snapshots、style-dumps、network 对应目录 | 通过 |
| 自动化覆盖数据、按钮、路由、空态、错误态 | `npx playwright test tests/clean-staff.spec.ts --timeout=60000 --workers=1 --reporter=line` 退出码 0，5/5 passed | 通过 |
| 页面正文无开发态文案 | Playwright `body.innerText` 检查 `未接入/阻塞/后端未就绪/后端接口未完成/mock 数据/mock provider/provider=mock/traceId` 命中为空 | 通过 |
| 实时记录已追加 | `C:\Users\Administrator\Desktop\work\xxxxx\clone_pms_prd.md` 已追加本任务过程、取证、验证、待确认项和自评 | 通过 |
| 无新增源码密钥、cookie、token | 触达源码、测试、矩阵未写入账号、密码、cookie、token；仅沿用本地 storage state 路径 | 通过 |

## 新鲜验证命令

| 命令 | 退出码 | 结果 |
| --- | --- | --- |
| `npx eslint src/pages/CleanStaffPage.tsx src/services/cleanStaff.ts tests/clean-staff.spec.ts scripts/capture-clean-staff.mjs --no-cache` | 0 | 触达 TS/JS 文件 lint 通过 |
| `npm run lint -- --no-cache` | 0 | 全量 lint 通过 |
| `npm run build` | 0 | TypeScript + Vite build 通过，仅 chunk size warning |
| `npx playwright test tests/clean-staff.spec.ts --timeout=60000 --workers=1 --reporter=line` | 0 | 5/5 passed |
| `node scripts/capture-clean-staff.mjs --clone` with `PMS_CLONE_URL=http://127.0.0.1:5173/cleanManage/cleanStaff` and `PMS_CAPTURE_STAMP=20260518-business-provider-hidden` | 0 | 本地截图、DOM、样式、网络和交互状态已生成 |
| `node scripts/capture-clean-staff.mjs` with `PMS_CAPTURE_STAMP=20260518-target-refresh` | 0 | 目标站截图、DOM、样式、网络和交互状态已生成 |

## 待确认项

- 目标站当前账号下 `cleaner/page/get` 列表为空，真实列表项字段仍需后端确认。
- `poiId`、`keyword`、`status`、`serviceDate` 是否作为正式筛选字段需后端确认。
- `/cleaner/save`、`/cleaner/export/create` 的真实 path、权限和幂等规则需后端联调确认。

## 自评

96/100。扣分项：目标站真实成功列表不可取证，列表字段和新增/导出接口仍是契约草案，需后端确认后才能进入真实联调。
