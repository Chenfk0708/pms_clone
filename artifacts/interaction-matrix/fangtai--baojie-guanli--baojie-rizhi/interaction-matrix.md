# 保洁日志交互矩阵

任务：`fangtai--baojie-guanli--baojie-rizhi`  
目标页：`https://minsubao.localhome.cn/cleanManage/cleanLog`  
本地页：`/cleanManage/cleanLog`

## 接口契约

真实目标站首屏请求：

```text
POST https://hudson-prod.localhome.cn/cleanLog/page/get
body: {"campId":"1796067693589061634","pageNum":1,"pageSize":10}
response: {"success":true,"data":{"total":0,"pageNum":1,"pageSize/size":10,"list":[]}}
```

目标站筛选参数来自目标 chunk `p__pc__CleanManage__CleanLog__index.*`：

- `poiId`：门店筛选第一个选中项。
- `roomId`：房型房间弹层选中的房间 id 数组。
- `operatorId`：操作人下拉选中的成员 `userId`。
- `operatorStartTime` / `operatorEndTime`：操作日期范围的毫秒时间戳。

## 矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 导航入口 | 侧边栏 `保洁管理 > 保洁日志` | 当前 URL 保持 `/cleanManage/cleanLog`，侧栏保洁日志高亮，主内容为筛选栏 + 空表格 | 首屏调用 `cleanLog/page/get` | 已接入路由和菜单 | 保持项目 `AppShell`/侧栏，不改全局布局 | `tests/routes.spec.ts` cleanLog 冒烟；本页截图 |
| 顶部门店 | `全部门店`、目标门店 tab | 切换当前 POI 筛选，搜索时使用当前门店条件 | 搜索时 body 带 `poiId` 或仅 `campId` | 已可切换并给出状态反馈 | 本地 store 维护 `poiId`，按钮 loading 时禁用 | `tests/clean-log.spec.ts` 初始请求断言 |
| 房型房间 | `请选择房间` | 打开选择房间弹层，列表显示 4 个已取证房间，确认后写入筛选 | 搜索时 body 带 `roomId` 数组 | 已可打开/选择/取消/确认 | 选择项携带本地 roomId，房间搜索支持空态反馈 | `tests/clean-log.spec.ts` 房间弹层与搜索参数断言 |
| 房型标签 | `请选择房型标签` | 目标站当前未返回可用标签选项 | 无明确可用请求 | 旧实现点击无业务结果 | 点击显示“未返回可选项”的不可用反馈 | 手动/Playwright 点击后 role=status |
| 操作日期 | 开始日期、结束日期、双月日期面板 | 点击打开双月日期面板，选择日期后更新范围 | 搜索时 body 带 `operatorStartTime` / `operatorEndTime` | 已可输入和点选日期 | 日期选择器写入开始/结束，搜索转换为毫秒时间戳 | `tests/clean-log.spec.ts` 日期弹层和参数类型断言 |
| 操作人 | `请选择操作人` | 下拉显示 `1796067693261905922`、`路客云6TS5` | 搜索时 body 带 `operatorId` | 已可展开并选择 | 使用成员 userId 作为接口参数，显示 label | `tests/clean-log.spec.ts` 操作人下拉和参数断言 |
| 查询 | `搜 索` | 按当前筛选重新请求，空结果显示 `暂无数据` | `POST /cleanLog/page/get` | 旧实现仅本地 toast，无请求 | 改为真实服务请求，loading 禁用按钮，成功显示总数/空态 | `tests/clean-log.spec.ts` requests[1] 参数断言 |
| 重置 | `重 置` | 清空筛选并请求默认 body | `POST /cleanLog/page/get` | 旧实现只清空状态 | 清空筛选、关闭弹层、重新请求默认数据 | 本地交互验证与 capture clone artifacts |
| 表格 | 操作时间/操作人/操作类型/操作内容 | 目标站当前 `total=0`，表格为空态；有数据时按四列展示 | 首屏/查询请求响应 | 旧实现静态空态 | 响应 list 通过边界过滤后渲染；空态不伪造行 | 空态测试和接口失败测试 |
| 错误态 | 请求失败、登录态/CORS/权限阻塞 | 真实错误不吞掉，提示可重试 | 请求失败时无成功态 | 旧实现无接口失败态 | role=alert 暴露错误原因，提供 `重试` 按钮 | `tests/clean-log.spec.ts` failure-with-retry |
| 截图与取证 | target/clone 默认态和关键交互 | 固定 Chrome + storageState 采集截图/DOM/style/network | network 记录 URL、method、body、响应摘要 | 已有历史 artifacts；本轮补 interaction-matrix | 更新 capture 脚本保存 `requestPostData` 和 `responsePreview` | `node scripts/capture-clean-log.mjs` 与 `--clone` |

## 阻塞与差异

- 目标站当前 `cleanLog/page/get` 返回 `total=0`，无法取证非空行视觉；本地只按已知字段渲染真实响应，不新增假数据。
- 目标站房间弹层的真实 `roomId` 来自运行时房间树，当前本地使用取证房间名称和稳定本地 id 做请求参数验证；如后续项目接入统一房间树，应替换为真实房间 id 来源。
- 本地直接从浏览器请求 `hudson-prod.localhome.cn`，若登录态、CORS 或权限不可用，会显示明确错误和重试入口，不做静默 fallback。
