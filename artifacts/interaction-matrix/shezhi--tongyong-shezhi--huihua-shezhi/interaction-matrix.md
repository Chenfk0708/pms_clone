# 会话设置交互矩阵

任务 ID：`shezhi--tongyong-shezhi--huihua-shezhi`

页面路由：`/setting/imSetting`

| 区域 | 元素/按钮 | 目标站行为/取证 | 本地实现 | 触发服务/请求 | 验收方式 |
| --- | --- | --- | --- | --- | --- |
| 侧边导航 | `会话设置` | 位于“设置 > 通用设置”下，当前页高亮 | 复用 `AppShell` 导航高亮 | 无额外请求 | Playwright 首条断言检查 `.sidebar-link.is-active` |
| 页面头部 | `微信客服运营台` | 跳到客服运营页 | 保留协同跳转 | 路由跳转 `/scrm/wechatService/manage` | Playwright 断言 URL |
| 页面头部 | `聊天工具栏` | 跳到聊天工具栏页 | 保留协同跳转 | 路由跳转 `/scrm/sidebarPreview` | 人工点检 |
| 页面头部 | `接待配置` | 跳到接待配置页 | 保留协同跳转 | 路由跳转 `/scrm/wechatService/receptionConfig` | 人工点检 |
| 页签 | `常用语 / 自动回复设置 / 页面设置 / 标签设置 / 快捷键设置 / 版本设置` | 真实页存在 6 个主页签 | 受控切换，默认 `常用语` | 本地状态 `currentTab` 写入 diagnostics | Playwright 检查按钮与 `aria-pressed` |
| 常用语管理 | 分类按钮 `全部分类 / 入住前沟通 / 深夜入住 / 退房追评` | 目标站真实接口返回空分类树，但契约已取到 | mock 下提供业务可用分类；api 下按接口适配 | `POST /imWordsGroup/tree/get` | Playwright 点击分类并读取 diagnostics.requestSummary.groupId |
| 常用语管理 | 输入框 `常用语关键词` + `查询` | 目标站契约：`keyword`、`imWordsGroupId`、`pageNum/pageSize` | 支持组合筛选 | `POST /imWords/page/get` | Playwright 搜索“停车”并断言列表收敛 |
| 常用语管理 | `重置` | 重置筛选条件 | 清空关键字与分类并重新拉数 | `POST /imWords/page/get` | 人工点检 |
| 常用语管理 | `刷新` | 重新拉当前条件数据 | 重新按 provider/state 加载 | `POST /imWords/page/get` | Playwright 从 empty 切到 error 后点击刷新 |
| 常用语管理 | `新增常用语` | 目标站未取到写接口，但页面应具备录入闭环 | 弹窗录入标题/内容并落本地列表 | 本地保存，同时写 `lastAction=/imWords/save` | Playwright 新增“自助入住提醒”并断言状态反馈 |
| 常用语管理 | `导出常用语` | 目标站无明确取证 | 目前保留按钮位，不触发假成功 | 暂无 | 人工点检 |
| 常用语管理 | `查看` | 查看单条话术详情 | 打开 `常用语详情` 弹窗 | 本地状态 | Playwright 检查“停车场位于 3 层” |
| 快捷键设置 | 快捷键列表 | 目标站取到 `userShortcuts[]` 契约 | 渲染 win/mac 与开关状态 | `POST /systemConfigs/user/shortcut/get` | Playwright 检查“推荐房源”与快捷键文案 |
| 快捷键设置 | `启用/停用` + `保存快捷键` | 目标站取到 get 契约，save 路径按前端约定沉淀 | 支持本地切换并写 save diagnostics | `POST /systemConfigs/user/shortcut/save` | Playwright 断言 `lastAction.endpoint` |
| 版本设置 | 版本卡片 | 目标站取到 `edition/resource/get` + `menu/optionJsons/get` | 显示版本、弹窗标题、按钮配置 | `POST /edition/resource/get`、`POST /menu/optionJsons/get` | Playwright 在 api provider 下检查版本标题 |
| 页面设置 | 发图渠道 / 云信账号 | 目标站取到 `commons/get`、`imYunxinUser/get` | 显示支持渠道与账号信息 | `POST /commons/get`、`POST /imYunxinUser/get` | 人工点检 |
| 异常态 | `empty` | 目标站真实页常用语为空 | mock 支持显式 empty | 本地 provider `mockState=empty` | Playwright 检查“当前分类下暂无常用语” |
| 异常态 | `error` + `重试` | 需要清晰暴露失败 | mock 支持显式 error，页面显示 `role=alert` | 本地 provider `mockState=error` | Playwright 检查错误提示与重试按钮 |

补充说明：

- mock provider 明确不触发后端请求，但会把真实契约请求体写入 `localStorage.pms.imSetting.diagnostics`。
- api provider 只对接本页已取证到的 7 个接口，不新增静默 fallback。
- 本轮为避免整仓无关页面阻塞，`App.tsx` 收敛为会话设置链路的最小稳定路由集。
