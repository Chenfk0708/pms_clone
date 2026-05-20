# Global Setting Continue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 收口 `/channels/globalRadar/globalSetting` 的配置中心页面，使其重新可构建、可渲染、可通过页面专项验证，并补齐本轮要求的文档与取证链路。

**Architecture:** 先修复导致页面无法渲染的样式文件缺失，再以现有 `src/services/globalSetting.ts` 契约和 `tests/global-setting.spec.ts` 行为断言为准补齐页面实现。最后补跑构建、专项测试和取证脚本，按完成标准核对记录文件、交互矩阵与接口文档。

**Tech Stack:** React, TypeScript, Vite, Playwright, PowerShell

---

### Task 1: 修复页面无法渲染的阻塞项

**Files:**
- Create: `src/pages/GlobalSettingPage.css`
- Verify: `src/pages/GlobalSettingPage.tsx`
- Verify: `src/pages/StaffListPage.css`
- Test: `tests/global-setting.spec.ts`

- [ ] **Step 1: 用现有失败用例锁定阻塞问题**

Run: `npx playwright test tests/global-setting.spec.ts --reporter=line --timeout=60000 --workers=1`
Expected: FAIL，且页面主结构未出现。

- [ ] **Step 2: 用构建失败确认缺失文件**

Run: `npx vite build --outDir tmp/global-setting-build --emptyOutDir true`
Expected: FAIL，报 `./GlobalSettingPage.css` 无法解析。

- [ ] **Step 3: 新增 `src/pages/GlobalSettingPage.css`，覆盖工作台、筛选栏、表格、卡片、弹层和状态样式**

Implementation target:

```css
.page-content:has(.global-setting-workbench) > .page-header { display: none; }
.global-setting-workbench { min-height: calc(100vh - 60px); }
.global-setting-toolbar,
.global-setting-filter-bar,
.global-setting-summary,
.global-setting-main-grid,
.global-setting-modal,
.global-setting-state-card,
.global-setting-table { /* 以当前 DOM 结构补齐布局与交互状态 */ }
```

- [ ] **Step 4: 重新跑构建确认页面入口恢复**

Run: `npx vite build --outDir tmp/global-setting-build --emptyOutDir true`
Expected: PASS 或仅保留非阻塞 warning。

### Task 2: 用专项测试收敛配置中心页面行为

**Files:**
- Modify: `src/pages/GlobalSettingPage.tsx`
- Modify: `src/services/globalSetting.ts`
- Test: `tests/global-setting.spec.ts`

- [ ] **Step 1: 重新运行专项测试，记录剩余失败项**

Run: `npx playwright test tests/global-setting.spec.ts --reporter=line --timeout=60000 --workers=1`
Expected: 若仍失败，失败点应缩小为具体交互或文案问题。

- [ ] **Step 2: 只修失败项对应的最小实现**

Implementation target:

```ts
// 只修测试直接暴露的行为缺口：
// - 状态栏反馈
// - 弹层打开/关闭
// - 选择门店上限
// - 配置保存后的状态同步
// - 快捷入口路由承接
```

- [ ] **Step 3: 重新运行同一专项测试直到通过**

Run: `npx playwright test tests/global-setting.spec.ts --reporter=line --timeout=60000 --workers=1`
Expected: PASS，3/3 通过。

### Task 3: 收尾文档与取证

**Files:**
- Verify: `scripts/capture-global-setting.mjs`
- Verify: `artifacts/interaction-matrix/ai-quanyu-leida--shuju-yu-peizhi--peizhi-zhongxin/interaction-matrix.md`
- Verify: `D:\pms_ui\95prompt\接口文档\ai-quanyu-leida--shuju-yu-peizhi--peizhi-zhongxin-配置中心接口文档.md`
- Modify: `C:\Users\Administrator\Desktop\work\xxxxx\clone_pms_prd.md`

- [ ] **Step 1: 运行取证脚本生成本地页面产物**

Run: `node scripts/capture-global-setting.mjs --clone`
Expected: 生成 screenshots / dom / style / network 产物。

- [ ] **Step 2: 把本轮完成证据追加到实时记录文件**

Append content:

```md
- 构建验证命令、退出码与结果
- Playwright 专项验证命令、退出码与结果
- 本地取证产物路径
- 仍待后端确认的接口点
```

- [ ] **Step 3: 最终核对完成标准并准备交付说明**

Run:
- `npx vite build --outDir tmp/global-setting-build --emptyOutDir true`
- `npx playwright test tests/global-setting.spec.ts --reporter=line --timeout=60000 --workers=1`

Expected: 两条命令均提供新鲜成功证据。
