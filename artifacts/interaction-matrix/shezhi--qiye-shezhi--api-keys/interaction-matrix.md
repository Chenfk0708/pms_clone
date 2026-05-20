# API keys 交互矩阵

- 任务 ID：`shezhi--qiye-shezhi--api-keys`
- 页面路由：`/CompanySetting/Apikeys`
- 目标页面：`https://minsubao.localhome.cn/CompanySetting/Apikeys`
- 本地服务层：[src/services/apiKeys.ts](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/src/services/apiKeys.ts)
- 本地页面：[src/pages/ApiKeysPage.tsx](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/src/pages/ApiKeysPage.tsx)
- 自动化验证：[tests/api-keys.spec.ts](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/tests/api-keys.spec.ts)
- 专项验证入口：
  - [tmp/api-keys.playwright.config.ts](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/tmp/api-keys.playwright.config.ts)
  - [tmp/api-keys.vite.config.ts](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/tmp/api-keys.vite.config.ts)
- 真实目标站关键取证：
  - 默认态 DOM：[default-target-20260514120519-page.html](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/artifacts/dom-snapshots/shezhi--qiye-shezhi--api-keys/default-target-20260514120519-page.html)
  - fresh 默认态网络：[default-target-20260519-fresh-default-min-responses.json](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/artifacts/network/shezhi--qiye-shezhi--api-keys/default-target-20260519-fresh-default-min-responses.json)
  - fresh 默认态事实：[default-target-20260519-fresh-default-min-facts.json](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/artifacts/style-dumps/shezhi--qiye-shezhi--api-keys/default-target-20260519-fresh-default-min-facts.json)
- 本地回归取证：
  - 空态截图：[empty-clone-20260519111756-viewport.png](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/artifacts/screenshots/shezhi--qiye-shezhi--api-keys/empty-clone-20260519111756-viewport.png)
  - 成功态截图：[success-clone-20260519111756-viewport.png](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/artifacts/screenshots/shezhi--qiye-shezhi--api-keys/success-clone-20260519111756-viewport.png)
  - 错误态截图：[error-clone-20260519111756-viewport.png](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/artifacts/screenshots/shezhi--qiye-shezhi--api-keys/error-clone-20260519111756-viewport.png)
- provider 开关：
  - `localStorage["pms.apiKeys.provider"] = "mock" | "api"`
  - `localStorage["pms.apiKeys.mockState"] = "success" | "empty" | "error"`
  - `localStorage["pms.apiKeys.generateMockState"] = "success" | "error"`

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口与导航 | 顶部“设置”、左侧“企业设置 > API keys” | 进入 `/CompanySetting/Apikeys` 后顶部和侧栏同步高亮 | 无新增请求 | 已实现 | 沿用现有 `AppShell` 路由和高亮规则，不重造导航壳 | Playwright 断言顶部“设置”和侧栏“API keys”均为激活态 |
| 页面首屏 | 页面标题、说明文案、风险提示 | 目标站默认展示空态说明，不直接展示已有密钥列表 | `POST /user/secret/get` | 已实现 | 首屏统一走 `fetchApiKeysPageData()`，不在组件内硬编码空态数据 | Playwright 断言标题、两段说明文案、空态提示文案可见 |
| 页面首屏 | 默认空态 | 目标站默认文案为“暂未生成路客云API keys，点击下方按钮获取API Keys” | `POST https://hudson-prod.localhome.cn/user/secret/get`，已取证 `postData={"campId":"1796067693589061634"}`，空态 `data=""` | 已实现 | 服务层适配 Hudson 响应壳；`data=""` 映射为空态业务模型 | Playwright 断言空态文案、按钮文案、隐藏契约节点中的 `state=empty` |
| 主操作 | 获取API keys | 目标站空态下有“获取API keys”主按钮 | 已确认将进入生成链路；当前仓库仅保留到 `/user/secret/generate` 路径级结论，请求体与成功 `data` 待后端确认 | 已实现 | 本地统一走 `generateApiKeys()`，默认以 `campId` 作为请求参数承接，并给出加载/成功反馈 | Playwright 点击后断言状态反馈切到“API keys 已生成”，契约节点 `action=generate` |
| 顶部辅助 | 查看企业信息 | 按钮存在，可承接到企业信息页 | 无新增请求，路由跳转 `/CompanySetting/CompanyInfo` | 已实现 | 复用项目已有路由，不引入新页面 | Playwright 点击后断言 URL 变为 `/CompanySetting/CompanyInfo` |
| 成功态凭证区 | Access Key ID / Secret Key 展示 | 目标站成功态字段结构尚未取证完整 | 真实成功 payload 待后端确认；本地当前用统一业务模型承接 | 已实现 | 页面只消费 `ApiKeyRecord` 适配模型，不直接依赖散落 mock 常量 | Playwright 在成功态断言字段标题和凭证区出现 |
| 成功态操作 | 复制 Access Key ID | 目标站应提供明确复制反馈 | 无新增请求 | 已实现 | 先以业务反馈文案承接，避免无响应按钮 | Playwright 点击后断言状态区出现“Access Key ID 已复制” |
| 成功态操作 | 复制 Secret Key | 目标站应提供明确复制反馈 | 无新增请求 | 已实现 | 与 Access Key ID 一致给出业务反馈 | Playwright 及手工点击可见状态区文案变化 |
| 成功态操作 | 查看接入说明 | 目标站应能查看接入指引 | 无新增请求 | 已实现 | 用模态框承接接入规则、关闭按钮和遮罩关闭路径 | Playwright 打开后断言 dialog 文案，再关闭并断言消失 |
| 成功态操作 | 重新生成 | 目标站存在重新生成动作，旧密钥将失效 | 未来请求：`POST /user/secret/generate`；路径已确认，请求体与成功 payload 待后端确认 | 已实现 | 先弹确认框，再触发 `generateApiKeys()`，成功后替换当前 key 并给出反馈 | Playwright 记录生成前后 `Access Key ID` 变化，断言不相同 |
| 重新生成确认 | 取消 / 确认重新生成 | 先确认再提交，避免误操作 | `generateApiKeys()` | 已实现 | 补确认弹层和显式按钮禁用态，防止重复提交 | Playwright 打开 dialog 后点击确认，断言状态反馈变更 |
| 错误反馈 | 加载失败提示 | 请求失败时应显示明确错误和重试入口 | `fetchApiKeysPageData()` 抛错；mock 支持 `error` | 已实现 | 不做静默 fallback，错误直接进入 alert 区块 | Playwright 设置 `mockState=error` 后断言 alert 和“重新加载”按钮 |
| 错误恢复 | 重新加载 | 失败后可重试恢复页面 | 再次触发 `POST /user/secret/get` 或 mock get | 已实现 | `loadPageData('retry')` 保留状态反馈和诊断落盘 | Playwright 将 `mockState` 切回 `empty` 后点击重试，断言恢复空态 |
| 加载反馈 | 首屏加载 / 提交加载 | 目标站应有明确加载反馈 | `fetchApiKeysPageData()` / `generateApiKeys()` | 已实现 | 补 skeleton、状态区文案和按钮禁用，不做假成功 | 手工与自动化均可观察状态区和按钮禁用变化 |
| 服务契约审计 | 隐藏契约节点 | 目标站无此节点；用于本地验收和接口核对 | `data-testid="api-keys-service-contract"` | 已实现 | 将 provider、action、endpoint、requestBody、traceId、timestamp 落入隐藏节点和 `localStorage` | Playwright 读取契约节点 JSON 并断言 `endpoint`、`state`、`campId` |

## 真实目标站已确认事实

- 默认页不是列表页，而是空态页。
- 已确认默认文案：
  - `此API keys用于Locals AI使用，请妥善保存。`
  - `不要与他人共享你的 API key，或将其暴露在浏览器中。`
  - `暂未生成路客云API keys，点击下方按钮获取API Keys`
  - 主按钮：`获取API keys`
- 已确认首屏请求：
  - `POST https://hudson-prod.localhome.cn/user/secret/get`
  - 请求体：`{"campId":"1796067693589061634"}`
  - 响应壳字段：`success`、`errorCode`、`errorMsg`、`errorDetail`、`data`
  - 空态时：`data: ""`

## 本地承接口径

- `mock` provider 作为当前正式展示数据源，`api` provider 预留给后续联调。
- 服务层统一把最近一次请求诊断写入 `localStorage["pms.apiKeys.lastRequest"]`。
- 当前成功态展示字段属于本地前端承接草案，不冒充目标站已实锤返回：
  - `appId`
  - `accessKeyId`
  - `secretKeyPreview`
  - `createdAt`
  - `lastUsedAt`
  - `rotationTip`
  - `scopes`
  - `activityLog`

## 验收记录

- 已通过：
  - `npx eslint src/services/apiKeys.ts src/pages/ApiKeysPage.tsx tests/api-keys.spec.ts --no-cache`
  - `npx tsc --noEmit --ignoreConfig --jsx react-jsx --moduleResolution bundler --module esnext --target es2022 --lib dom,dom.iterable,es2022 --types vite/client,node src/services/apiKeys.ts src/pages/ApiKeysPage.tsx tests/api-keys.spec.ts`
  - `$env:PMS_TEST_BASE_URL='http://127.0.0.1:4306'; npx playwright test api-keys.spec.ts --config tmp/api-keys.playwright.config.ts --reporter=line --timeout=60000 --workers=1`
- 结果：`4 passed`

## 剩余风险

- `POST /user/secret/generate` 的请求体和成功响应 `data` 结构未在当前仓库保留的 network 产物中拿到完整证据；本地先按 `campId` + 统一业务模型承接，接口文档中已单列为待后端确认。
- 目标站成功态的真实字段、是否存在额外复制口令或一次性展示规则，目前仍缺 fresh 取证，不应把本地成功态字段误认成线上既有契约。
