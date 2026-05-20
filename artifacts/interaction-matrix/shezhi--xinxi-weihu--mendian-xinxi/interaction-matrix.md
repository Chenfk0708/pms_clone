# 门店信息交互矩阵

任务 ID：`shezhi--xinxi-weihu--mendian-xinxi`

目标路径：`/InformationMaintenance/campInfo`

目标站取证批次：

- `default-target-20260519-95-refresh-*`
- `new-store-target-20260519-95-refresh-*`
- `sort-target-20260519-95-refresh-*`
- `detail-target-20260515135804-*`
- `expand-row-target-20260519-95-refresh-expand-row-*`

本地服务层：`src/services/campInfo.ts`

- provider：`mock | api`
- mock state：`success | empty | error`
- 运行时开关：`localStorage.pms.campInfoProvider`、`localStorage.pms.campInfoMockMode`、`localStorage.pms.campInfoMockLatencyMs`

本地 clone 取证批次：

- `default-clone-20260519-local-95-*`
- `new-store-clone-20260519-local-95-*`
- `sort-clone-20260519-local-95-*`

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 页面入口 | 顶栏“设置”、侧栏“门店信息” | 进入 `/InformationMaintenance/campInfo` 后保持高亮 | 无新增请求 | 已接入现有壳层，但旧页面只有静态占位或硬编码 | 继续复用 `AppShell` 与 `informationSideNav`，不改导航归属 | Playwright 断言顶部和侧栏高亮；local clone `default-clone-20260519-local-95-*` |
| 首屏加载 | 页面初始化 | 目标站首屏展示筛选区、门店汇总、列表和分页 | 真实网络出现 `POST /camps/get`、`/camp/get`、`/channels/get`、`/edition/resource/get`、`/order/report/get` | 旧版为组件内硬编码，无契约 | 新增统一服务层 `fetchCampInfoOverview`，页面仅读取 view model；隐藏 contract 节点供自动化读取 | `tests/camp-info.spec.ts` 首屏用例 + `data-testid=camp-info-contract` |
| 顶部筛选 | 门店名称输入框 | 可输入关键词并刷新当前列表 | `CampInfoQuery.keyword`，未来可映射 `/camp/get` 请求体 | 旧版输入框只改本地 state | 查询时更新统一 request，并按关键词过滤 mock provider | Playwright 断言输入、点击“查询”后 contract 变化 |
| 顶部筛选 | `查 询` | 刷新当前条件的门店列表 | `fetchCampInfoOverview(query)` | 旧版只弹 toast | 加入 loading、成功状态文案和空态切换 | `tests/camp-info.spec.ts` 第 1 条 |
| 顶部筛选 | `重 置` | 清空筛选并恢复默认列表 | `fetchCampInfoOverview(defaultQuery)` | 旧版只清空 input | 重置 keyword、重新加载默认列表并反馈状态 | Playwright 断言输入清空和列表恢复 |
| 汇总区 | 当前系统门店文案 | 展示 `1/1` 与有效期 | 未来来自 `/edition/resource/get` 或资源接口 | 旧版写死在组件 | 汇总区改由 `summary.activeStoreText`、`summary.effectivePeriod` 驱动 | contract + 首屏断言 |
| 汇总区 | `新建门店` | 目标站不跳转，弹出“门店剩余数量不足” | 当前阶段无提交请求；后续可接扩容入口 | 旧版有弹窗，但无契约上下文 | 保留目标站行为，用容量不足弹层承接，并提供明确业务反馈 | `new-store-target-20260519-95-refresh-*` 对比 `new-store-clone-20260519-local-95-*` |
| 汇总区 | `一键导入` | 目标站可点击，旧取证存在导入态 | 本地草案：`createCampInfoImportTask(optionId)` | 旧版只提示“打开菜单” | 增加导入弹窗、导入项、提交成功反馈 | Playwright 断言导入弹窗和“导入任务已创建” |
| 汇总区 | `门店排序` | 目标站跳转 `/setting/sortSetting` | 本地排序服务 `fetchCampInfoSortData(tab)` | 旧版本地排序页只依赖常量 | 保持本地既有路由 `/InformationMaintenance/campInfo/sort` 承接，列表由 service 返回 | `sort-target-20260519-95-refresh-*` + local sort capture + 测试 |
| 列表区 | 展开按钮 | 展开门店房型明细 | 当前阶段无新增请求；未来可拆房型详情接口 | 旧版由本地常量展开 | 房型明细收敛到 `store.roomTypes` | Playwright 点击“展开门店房型”并断言明细 |
| 列表区 | `详情` | 目标站进入 `/InformationMaintenance/campInfo/detail` 详情页 | 未来建议 `GET/POST /camp/detail`；当前 `fetchCampInfoDetail(storeId)` | 旧版直接跳编辑页 | 采用详情弹层承接，保留门店基础字段和地址信息 | `detail-target-20260515135804-*` 对照本地详情弹层测试 |
| 列表区 | `编辑` | 进入编辑页 | `fetchCampInfoDetail(storeId)` | 旧版表单全是静态 defaultValue | 编辑页读取详情 service，并保留“下一步”业务反馈 | Playwright 断言编辑页、门店名称、联系电话、下一步状态 |
| 列表区 | `下架` | 目标站有按钮反馈 | 未来下架接口待确认 | 旧版只提示“已下架” | 保留为显式业务提示，不做假成功提交 | Playwright 可见性 + 本地状态反馈 |
| 列表区 | `删除` | 目标站有删除入口 | 未来删除接口待确认 | 旧版只提示二次确认 | 维持显式业务反馈，避免静默无响应 | 本地状态栏提示 |
| 房型明细 | `修改` / `房间` / `联动关房` / `删除` | 目标站展开房型后可继续操作 | 未来房型接口待确认 | 旧版按钮无承接 | 用业务态提示承接，明确指出动作已进入相应队列/入口 | 展开后逐项可点击 |
| 空态 | 无匹配结果 / 无门店 | 目标站未直接取证到空态页面 | 统一响应包 `data.list=[]` | 旧版没有空态闭环 | 区分“暂无已创建的门店”和“暂无符合条件的门店” | `tests/camp-info.spec.ts` 空态断言 |
| 错误态 | 接口失败 | 目标站未直取错误 UI | 统一响应包错误或 `CampInfoRequestError` | 旧版无错误暴露 | 显示 `role=alert` 和“重新加载”按钮，不加静默 fallback | `tests/camp-info.spec.ts` error/retry 用例 |
| loading | 首屏/筛选/排序加载中 | 目标站加载期无明确开发态文案 | `pms.campInfoMockLatencyMs` | 旧版无 loading | 加入加载卡片，并禁用关键按钮防止重复触发 | Playwright loading 用例 |
| 排序页 | `门店排序` / `房型排序` / `商品排序` tab | 目标站展示三个排序维度 | `fetchCampInfoSortData(activeTab)` | 旧版 tabs 来自常量 | tabs 和列表都改为 service 输出；保存时统一走 `saveCampInfoSort` | Playwright 切 tab、保存排序 |
| 诊断契约 | 隐藏 contract 节点 | 目标站无此节点 | provider/traceId/request/pagination/endpoint | 旧版无统一可测契约 | 用隐藏 `pre[data-testid]` 供自动化断言，不在正文暴露开发文案 | Playwright 读取 `camp-info-contract` / `camp-info-sort-contract` |

## 验收补充

- 目标站网络取证：
  - `artifacts/network/shezhi--xinxi-weihu--mendian-xinxi/default-target-20260519-95-refresh-responses.json`
  - `artifacts/network/shezhi--xinxi-weihu--mendian-xinxi/new-store-target-20260519-95-refresh-responses.json`
  - `artifacts/network/shezhi--xinxi-weihu--mendian-xinxi/sort-target-20260519-95-refresh-responses.json`
- 本地 clone 取证：
  - `artifacts/network/shezhi--xinxi-weihu--mendian-xinxi/default-clone-20260519-local-95-responses.json`
  - `artifacts/network/shezhi--xinxi-weihu--mendian-xinxi/new-store-clone-20260519-local-95-responses.json`
  - `artifacts/network/shezhi--xinxi-weihu--mendian-xinxi/sort-clone-20260519-local-95-responses.json`
- 本地专项验证：
  - `PMS_TEST_BASE_URL=http://127.0.0.1:4311 npx playwright test tests/camp-info.spec.ts --timeout=60000 --workers=1 --reporter=line`
  - `npx tsc --noEmit --ignoreConfig --jsx react-jsx --moduleResolution bundler --module esnext --target es2022 --lib dom,dom.iterable,es2022 --types vite/client,node src/services/campInfo.ts src/pages/CampInfoPage.tsx tests/camp-info.spec.ts tmp/camp-info-harness/main.tsx`
  - `npx eslint src/pages/CampInfoPage.tsx src/services/campInfo.ts tests/camp-info.spec.ts --no-cache`
