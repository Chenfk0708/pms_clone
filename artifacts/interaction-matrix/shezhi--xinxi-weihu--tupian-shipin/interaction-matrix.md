# 图片视频交互矩阵

- 任务 ID：`shezhi--xinxi-weihu--tupian-shipin`
- 页面路由：`/setting/picturesAndVideos`
- 菜单路径：`设置 > 信息维护 > 图片视频`
- 真实目标页：`https://minsubao.localhome.cn/setting/picturesAndVideos`
- 本地页面：[src/pages/PicturesVideosPage.tsx](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/src/pages/PicturesVideosPage.tsx)
- 本地服务：[src/services/picturesVideos.ts](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/src/services/picturesVideos.ts)
- 自动化验证：[tests/pictures-videos.spec.ts](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/tests/pictures-videos.spec.ts)
- 专项 harness：
  - [tmp/pictures-videos-harness/main.tsx](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/tmp/pictures-videos-harness/main.tsx)
  - [tmp/pictures-videos.vite.config.ts](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/tmp/pictures-videos.vite.config.ts)
  - [tmp/pictures-videos.playwright.config.ts](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/tmp/pictures-videos.playwright.config.ts)
- 真实取证：
  - [artifacts/interaction-matrix/shezhi--xinxi-weihu--tupian-shipin/target-probe.json](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/artifacts/interaction-matrix/shezhi--xinxi-weihu--tupian-shipin/target-probe.json)
  - [artifacts/network/shezhi--xinxi-weihu--tupian-shipin/target-contract-20260519T221500.json](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/artifacts/network/shezhi--xinxi-weihu--tupian-shipin/target-contract-20260519T221500.json)
- provider 开关：
  - `localStorage["pms.picturesVideosProvider"] = "mock" | "api"`
  - `localStorage["pms.picturesVideosMockState"] = "success" | "empty" | "error"`

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口与导航 | 顶部“设置”、左侧“图片视频” | 进入 `/setting/picturesAndVideos` 后顶部与侧栏同步高亮 | 无新增请求 | 已实现 | 专项 harness 复刻页面壳层，避免被整仓入口脏改动阻塞 | Playwright 断言顶部“设置”和侧栏“图片视频”均为激活态 |
| 首屏加载 | 默认图片管理页签 | 默认选中“图片管理”，展示搜索栏、上传、新建文件夹、返回上一级 | `POST /medias/page/get` | 已实现 | 页面首屏只消费服务层 view model，不再内嵌静态数组 | Playwright 断言 `data-provider="mock"`、`data-response-state="success"`、页签和工具栏出现 |
| 数据契约 | 默认目录列表 | 默认请求体 `campId/pageNum/pageSize/path/orderBy/name/bizTypes`，返回 1 条目录 `新建文件夹` | `POST https://hudson-prod.localhome.cn/medias/page/get` | 已实现 | 服务层记录最后一次请求到 `localStorage["pms.picturesVideos.lastRequest"]`，并输出隐藏 contract 节点 | Playwright 断言 contract 节点包含 `"path":"/"`、`"bizTypes":[1]`，并校验 localStorage 诊断对象 |
| 搜索 | 搜索框 + 搜索按钮 | 输入 `bed` 后返回 `共 0 条` | `POST /medias/page/get`，仅 `name` 变为 `bed` | 已实现 | 查询只更新服务层请求参数和操作反馈，不在组件里手写过滤常量 | Playwright 断言反馈文案、`data-request-name="bed"`、`共 0 条`、诊断请求体 `name: "bed"` |
| 上传 | 上传按钮 | 打开上传弹层，显示上传目标和上传指引 | 当前无额外已取证上传请求，先承接为页面内弹层 | 已实现 | 用 dialog 承接“上传到：全部附件”“上传附件”“上传文件夹” | Playwright 断言上传弹层、上传指引和关闭按钮可见 |
| 新建目录 | 新建文件夹按钮 | 目标站为页内 inline input，不是新页面 | 当前无新增请求，先保留待命名态 | 已实现 | 在列表区插入只读命名输入 `文件夹名称=新建文件夹`，保留后续保存接口扩展点 | Playwright 断言点击后出现内联输入框 |
| 空目录承接 | 空结果下新建文件夹 | 搜索结果为空时仍可继续新建文件夹 | 复用当前查询上下文，无新增请求 | 已实现 | 在 empty 分支继续渲染待命名目录输入，避免“空态锁死” | Playwright 先搜索 `bed` 再点“新建文件夹”，断言输入框出现 |
| 附件页签 | “附件管理” | 切到附件管理后搜索框消失，保留上传承接提示 | 不触发新请求，沿用上次图片请求参数 | 已实现 | 切页签时不重置最后一次查询，不静默发新请求 | Playwright 断言附件页签激活、搜索框隐藏、提示文案可见、`data-active-tab="attachment"` |
| 空态 | 空目录提示 | 当前目录无内容时应有清晰空态和重置入口 | `mockState=empty` | 已实现 | 统一服务层空态，显式显示“当前目录下暂无图片或视频素材” | Playwright 断言空态文案、重置按钮和 `data-response-state="empty"` |
| 错误态 | 加载失败与重试 | 失败时需暴露错误，不允许静默 fallback | `mockState=error` | 已实现 | 服务层抛错，页面显示 alert 和重试；重试读取最新 mock state | Playwright 断言错误 alert、切回 `success` 后点击“重试”恢复成功态 |

## 已确认的目标站事实

- 默认选中“图片管理”，旁边可切到“附件管理”。
- 默认请求：
  - `campId: "1796067693589061634"`
  - `pageNum: 1`
  - `pageSize: 50`
  - `path: "/"`
  - `orderBy: "create_time desc"`
  - `name: ""`
  - `bizTypes: [1]`
- 默认返回 1 条目录：`新建文件夹`
- 搜索 `bed` 后总数为 `0`
- “上传”打开弹层
- “新建文件夹”是页内 inline input
- 切到“附件管理”后搜索框消失

## 本地验证记录

- `npx eslint src/pages/PicturesVideosPage.tsx src/services/picturesVideos.ts tests/pictures-videos.spec.ts --no-cache`
- `npx eslint tmp/pictures-videos-harness/main.tsx tmp/pictures-videos.playwright.config.ts tmp/pictures-videos.vite.config.ts --no-cache --no-ignore`
- `npx tsc --noEmit --ignoreConfig --jsx react-jsx --moduleResolution bundler --module esnext --target es2022 --lib dom,dom.iterable,es2022 --types vite/client,node src/pages/PicturesVideosPage.tsx src/services/picturesVideos.ts tests/pictures-videos.spec.ts tmp/pictures-videos-harness/main.tsx tmp/pictures-videos.playwright.config.ts tmp/pictures-videos.vite.config.ts`
- `npx vite build --config tmp/pictures-videos.vite.config.ts --outDir ../pictures-videos-build --emptyOutDir true`
- `npx playwright test tests/pictures-videos.spec.ts --config tmp/pictures-videos.playwright.config.ts --reporter=line --timeout=60000 --workers=1`
- 结果：`3 passed`

## 当前剩余风险

- 仓库整仓入口仍存在无关页面的并发改动和编译阻塞，因此本轮只对图片视频专项 harness 做了构建与自动化闭环，不宣称 `src/App.tsx` 全量入口已恢复。
- 真实站目前只明确了列表查询接口；上传、新建目录的正式后端 path、请求体和错误码仍待后端确认。
