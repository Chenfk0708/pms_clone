# 企业信息页面交互矩阵

## 任务信息

- 任务 ID：`shezhi--qiye-shezhi--qiye-xinxi`
- 页面路由：`/CompanySetting/CompanyInfo`
- 目标站：`https://minsubao.localhome.cn/CompanySetting/CompanyInfo`
- 本地验证页：`http://127.0.0.1:4205/CompanySetting/CompanyInfo`
- 服务实现：[src/services/companyInfo.ts](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/src/services/companyInfo.ts)
- 页面实现：[src/pages/CompanyInfoPage.tsx](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/src/pages/CompanyInfoPage.tsx)
- 样式实现：[src/pages/CompanyInfoPage.css](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/src/pages/CompanyInfoPage.css)
- 测试入口：[tests/company-info.spec.ts](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/tests/company-info.spec.ts)

## Provider 与开关

- 默认 provider：`mock`
- 可选 provider：`mock | api`
- 本地存储开关：`pms.companyInfo.provider`
- mock 状态开关：`pms.companyInfo.mockMode`
- mock 延迟开关：`pms.companyInfo.mockLatencyMs`
- URL 开关：`mockState`、`companyInfoMockMode`
- 推荐读取接口：`POST /company/info/get`
- 推荐保存接口：`POST /company/info/save`

## 目标站取证

### 默认态证据

- 截图：`artifacts/screenshots/shezhi--qiye-shezhi--qiye-xinxi/default-target-20260519-192052-viewport.png`
- DOM：`artifacts/dom-snapshots/shezhi--qiye-shezhi--qiye-xinxi/default-target-20260519-192052-page.html`
- 样式事实：`artifacts/style-dumps/shezhi--qiye-shezhi--qiye-xinxi/default-target-20260519-192052-facts.json`
- 网络：`artifacts/network/shezhi--qiye-shezhi--qiye-xinxi/default-target-20260519-192052-responses.json`

### 精确交互证据

- 事实 JSON：`artifacts/style-dumps/shezhi--qiye-shezhi--qiye-xinxi/interaction-target-20260519-113117-facts.json`
- 编辑态截图：`artifacts/screenshots/shezhi--qiye-shezhi--qiye-xinxi/interaction-target-20260519-113117-edit-viewport.png`
- 权限设置截图：`artifacts/screenshots/shezhi--qiye-shezhi--qiye-xinxi/interaction-target-20260519-113117-permission-route.png`
- 成员设置截图：`artifacts/screenshots/shezhi--qiye-shezhi--qiye-xinxi/interaction-target-20260519-113117-member-route.png`
- 已确认事实：
  - 默认字段：企业名称、企业类型、联系电话、所在城市、详细地址、图片
  - 默认按钮：`编 辑`
  - 编辑态存在：`取 消`、`保 存`、上传入口、城市选择、详细地址输入
  - 侧栏跳转：
    - `权限设置 -> /setting/role`
    - `成员设置 -> /setting/member`

## 本地 clone 取证

- success
  - 截图：`artifacts/screenshots/shezhi--qiye-shezhi--qiye-xinxi/success-clone-20260519-191652-viewport.png`
  - DOM：`artifacts/dom-snapshots/shezhi--qiye-shezhi--qiye-xinxi/success-clone-20260519-191652-page.html`
  - facts：`artifacts/style-dumps/shezhi--qiye-shezhi--qiye-xinxi/success-clone-20260519-191652-facts.json`
  - network：`artifacts/network/shezhi--qiye-shezhi--qiye-xinxi/success-clone-20260519-191652-responses.json`
- empty
  - 截图：`artifacts/screenshots/shezhi--qiye-shezhi--qiye-xinxi/empty-clone-20260519-191926-viewport.png`
  - DOM：`artifacts/dom-snapshots/shezhi--qiye-shezhi--qiye-xinxi/empty-clone-20260519-191926-page.html`
  - facts：`artifacts/style-dumps/shezhi--qiye-shezhi--qiye-xinxi/empty-clone-20260519-191926-facts.json`
  - network：`artifacts/network/shezhi--qiye-shezhi--qiye-xinxi/empty-clone-20260519-191926-responses.json`
- error
  - 截图：`artifacts/screenshots/shezhi--qiye-shezhi--qiye-xinxi/error-clone-20260519-191927-viewport.png`
  - DOM：`artifacts/dom-snapshots/shezhi--qiye-shezhi--qiye-xinxi/error-clone-20260519-191927-page.html`
  - facts：`artifacts/style-dumps/shezhi--qiye-shezhi--qiye-xinxi/error-clone-20260519-191927-facts.json`
  - network：`artifacts/network/shezhi--qiye-shezhi--qiye-xinxi/error-clone-20260519-191927-responses.json`
- interaction
  - 截图：`artifacts/screenshots/shezhi--qiye-shezhi--qiye-xinxi/interaction-clone-20260519-191927-viewport.png`
  - DOM：`artifacts/dom-snapshots/shezhi--qiye-shezhi--qiye-xinxi/interaction-clone-20260519-191927-page.html`
  - facts：`artifacts/style-dumps/shezhi--qiye-shezhi--qiye-xinxi/interaction-clone-20260519-191927-facts.json`
  - network：`artifacts/network/shezhi--qiye-shezhi--qiye-xinxi/interaction-clone-20260519-191927-responses.json`

## 行为矩阵

| 行为 | 目标站 | 本地 clone | 证据 |
| --- | --- | --- | --- |
| 默认查看态 | 已确认 | 已实现 | target default 截图 + success clone 截图 |
| 编辑入口 | 已确认 | 已实现 | target interaction facts 中 `headerButtonCount=2`；测试第 2 条 |
| 保存 | 仅确认存在保存按钮，未抓到专属 save 请求 | 已实现 | target interaction facts；测试第 2 条 |
| 取消 | 已确认 | 已实现 | target interaction facts；测试第 3 条 |
| 上传 | 已确认存在上传入口，真实上传协议未观察到 | 已实现 mock 追加图片 | target interaction facts；测试第 2 条 |
| 空态 | 目标站未直接取证到空态 | 已实现 | empty clone artifacts；测试第 4 条 |
| 错误态重试 | 目标站未直接取证到错误态 | 已实现 | error clone artifacts；测试第 4 条 |
| 权限设置跳转 | 已确认跳到 `/setting/role` | 已实现 | target permission route 截图；测试第 3 条 |
| 成员设置跳转 | 已确认跳到 `/setting/member` | 已实现 | target member route 截图；测试第 3 条 |
| 隐藏契约节点 | 目标站无此节点 | 已实现 | 测试第 1 条断言 `aria-label="企业信息服务契约"` |

## 网络结论

- 目标站默认态取证未观察到企业信息页面专属 CRUD 请求。
- 已观察到的通用请求包括：
  - `POST https://hudson-prod.localhome.cn/camps/get`
  - `POST https://hudson-prod.localhome.cn/camp/get`
  - `POST https://hudson-prod.localhome.cn/actionExec/get`
- 当前不能把这些通用请求直接判定为企业信息读写接口。
- 因此本地服务层先采用推荐契约草案：
  - `POST /company/info/get`
  - `POST /company/info/save`
- 图片上传协议待后端确认。

## 验证命令

```powershell
npx eslint src/pages/CompanyInfoPage.tsx src/services/companyInfo.ts tests/company-info.spec.ts --no-cache
npx tsc --noEmit --ignoreConfig --jsx react-jsx --moduleResolution bundler --module esnext --target es2022 --lib dom,dom.iterable,es2022 --types vite/client,node src/pages/CompanyInfoPage.tsx src/services/companyInfo.ts tests/company-info.spec.ts
npx vite build --outDir tmp/company-info-build --emptyOutDir true
npx playwright test tests/company-info.spec.ts --config tmp/company-info.playwright.config.ts --timeout=60000 --workers=1 --reporter=line
```

## 当前验证状态

- Playwright 专项：`4 passed`
- 定向 eslint：已通过
- 定向 TypeScript 编译：已通过
- 定向 Vite 构建：已通过
