# 批量加好友交互矩阵

任务：`scrm--zengzhang-huoke--piliang-jiahaoyou`

目标页：`https://minsubao.localhome.cn/customer/addBatch`

取证批次：

- 默认态：`artifacts/screenshots/scrm--zengzhang-huoke--piliang-jiahaoyou/default-target-20260518153000-viewport.png`
- 开通入口：`artifacts/screenshots/scrm--zengzhang-huoke--piliang-jiahaoyou/primary-target-20260518153100-viewport.png`
- 网络摘要：`artifacts/network/scrm--zengzhang-huoke--piliang-jiahaoyou/default-target-20260518153000-responses.json`

## 目标站结论

目标站当前账号可访问业务页，未触发登录或滑块。页面主体是 `企微SCRM-批量加好友` 未开通宣传态，可见主按钮为 `立即开通`，点击后跳转到 `/version/applicationPayment/detail`。首屏加载同时触发 PMS 公共请求与 SCRM/订阅相关请求，和本页直接相关的取证请求包括：

- `POST https://hudson-prod.localhome.cn/edition/resource/get`，用于应用资源和开通态信息。
- `POST https://hudson-prod.localhome.cn/paymentTypes/get/v2`，订阅详情页购买信息。
- 静态资源：`brandScrmLogo.png`、`brandPromotionScrm1136.png`、`brandPromotionScrm1136-2.png`、`brandPromotionScrm1136-3.png`。

目标站没有暴露批量加好友任务列表、筛选、导出、空态或失败态的业务接口。为满足 95 分任务，本地以显式 `mock` provider 补齐业务可用态，并把新增契约沉淀为后端接口草案。

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口与导航 | SCRM > 增长获客 > 批量加好友 | 侧栏高亮，URL 为 `/customer/addBatch`，页面标题为 `企微SCRM-批量加好友` | PMS 路由和菜单状态 | 已有路由和静态页面 | 保持现有 AppShell、侧栏高亮和隐藏页头布局 | Playwright 断言 URL、菜单 active、标题可见 |
| 订阅卡片 | 立即开通 | 跳转 `/version/applicationPayment/detail` | `POST /edition/resource/get`、订阅详情 `paymentTypes/get/v2` | 已能跳转 | 保留跳转，同时在业务区给出开通态摘要 | Playwright 点击后断言订阅详情页 |
| 顶部筛选 | 门店 | 目标站未提供本页筛选 | `POST /customer/addBatch/dashboard/get` 请求体 `storeId` | 无 | 接入服务层筛选参数并刷新列表 | Playwright 选择后断言 data-request-store 与 UI 更新 |
| 顶部筛选 | 日期范围 | 目标站未提供本页筛选 | `dateStart/dateEnd` | 无 | 用输入控件驱动 provider 请求体 | Playwright 填写日期后查询并断言请求参数 |
| 顶部筛选 | 渠道 | 目标站未提供本页筛选 | `channel` 枚举：全部、途家、美团民宿、小猪、携程 | 无 | 下拉选择后刷新候选客户和指标 | Playwright 点击选项后断言选中态 |
| 顶部筛选 | 加好友状态 | 目标站未提供本页筛选 | `friendStatus` 枚举：全部、待添加、短信已发送、已添加、已跳过 | 无 | 下拉选择后刷新列表 | Playwright 点击选项后断言列表变化 |
| 操作区 | 查询 | 目标站无 | 同 dashboard 请求体 | 无 | 显示 loading，成功后更新状态提示和更新时间 | Playwright 点击后断言 loading/反馈/数据 |
| 操作区 | 重置 | 目标站无 | 恢复默认请求体 | 无 | 清空筛选并刷新 | Playwright 断言筛选和 data-request-* 归零 |
| 操作区 | 刷新 | 目标站无 | 复用当前请求体 | 无 | 禁用重复点击，成功后更新时间 | Playwright 断言按钮禁用态和反馈 |
| 操作区 | 导出 | 目标站无 | `POST /customer/addBatch/export/create` | 无 | 生成导出任务反馈，不写真实文件 | Playwright 点击后断言 status |
| 指标卡片 | 指标点击 | 目标站无 | 本地打开详情抽屉，无额外请求 | 无 | 展示指标口径和样例明细 | Playwright 点击后断言弹层 |
| 图表区域 | 批量转化趋势 | 目标站无 | dashboard `trend` | 无 | 用服务层数据渲染柱状趋势，hover 使用 title 文本 | Playwright hover/可见文本断言 |
| 待办列表 | 客户行查看 | 目标站无 | dashboard `candidates.list` | 无 | 打开客户详情抽屉，展示手机号脱敏、订单、推荐话术 | Playwright 点击详情后断言抽屉 |
| 待办列表 | 下发短信 | 目标站无 | `POST /customer/addBatch/sms/send` | 无 | 按钮进入 loading，成功后反馈 | Playwright 点击后断言 status |
| 待办列表 | 标记已添加 | 目标站无 | `POST /customer/addBatch/friend/mark` | 无 | 更新行状态并反馈 | Playwright 点击后断言状态文本 |
| 批量任务 | 查看任务 | 目标站无 | dashboard `tasks.list` | 无 | 打开任务详情抽屉 | Playwright 点击后断言任务详情 |
| 快捷入口 | 客户列表 | 项目已有 `/customer/list` | 路由跳转 | 无 | 使用已有路由承接 | Playwright 点击后断言 URL |
| 快捷入口 | 企微员工列表 | 项目已有 `/customer/staffList` | 路由跳转 | 无 | 使用已有路由承接 | Playwright 点击后断言 URL |
| 快捷入口 | 客户标签 | 项目已有 `/customer/tag` | 路由跳转 | 无 | 使用已有路由承接 | Playwright 点击后断言 URL |
| 空态 | 无候选客户 | 目标站未取证 | dashboard 统一响应包 `data.candidates.list=[]` | 无 | 展示业务空态和重置入口 | Playwright `customerAddBatchMockState=empty` |
| 错误态 | 接口失败 | 目标站未取证 | 统一响应包 `code!=0` | 无 | 暴露错误 alert 和重试入口 | Playwright `customerAddBatchMockState=error` |
| 详情层 | 关闭 | 目标站无 | 无请求 | 无 | 支持关闭抽屉/弹层 | Playwright 点击关闭后断言消失 |

## 待后端确认

- 批量加好友真实业务接口 path 是否按 `POST /customer/addBatch/dashboard/get` 拆分或合并。
- `friendStatus`、`smsStatus`、`sourceChannel` 枚举是否与客户列表、订单列表共用。
- 短信下发、标记已添加、导出任务是否需要幂等键和异步任务轮询。
- 真实开通态是否由 `edition/resource/get` 判断，还是由专门的 SCRM 权益接口返回。
