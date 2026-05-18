# 私域渠道交互矩阵

任务：`ota--siyu--siyu-qudao`  
页面：私域渠道  
目标 URL：`https://minsubao.localhome.cn/channels/private`  
本地路由：`/channels/private`

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 导航入口 | 顶部 `私域`、侧栏 `私域渠道` | 进入 `/channels/private`，私域导航高亮 | `channels/get`、`channelGroups/get`、`campFlow/get` 等首屏依赖 | 已有路由与菜单 | 保持现有路由，新增服务契约摘要 | `private-channel.spec.ts` 默认页断言 |
| 首屏数据 | 未直连渠道卡片 | 展示企业微信、公众号、品牌小程序 | `POST /channels/private/summary/get` 建议接口，当前 mock provider 显式返回统一响应包 | 旧实现直接读取组件外静态数组 | 新增 `src/services/privateChannel.ts`，组件消费适配后业务模型 | `private-channel-contract` 断言 provider、traceId、scenario |
| 卡片操作 | 企业微信 `立即关联` | 跳转 `/channels/private/setting/weComSetting` | 同首屏数据；详情页建议复用 `channelId=wecom` | 已可跳转，但详情页有开发态文案 | 保留跳转，详情文案改为业务态 `待配置`、`立即配置` | Playwright 点击后断言详情标题、按钮和收益列表 |
| 卡片操作 | 公众号 `立即关联` | 跳转 `/channels/private/setting/authorizationSettings` | 同首屏数据；详情页建议复用 `channelId=official-account` | 已可跳转 | 保留跳转，按钮点击给授权流程业务反馈 | Playwright 点击后断言授权页和按钮可见 |
| 卡片操作 | 品牌小程序 `订阅开通` | 目标站保留在私域页并触发订阅入口 | `POST /channels/private/program/subscribe/prepare` 建议接口 | 旧实现点击无业务反馈 | 本地显示 `品牌小程序订阅方案已加入开通清单` | Playwright 点击后断言 status |
| 详情操作 | 企业微信 `立即配置` | 进入配置流程或展示配置反馈 | `POST /channels/private/wecom/config/prepare` 建议接口 | 旧按钮无反馈 | 本地显示 `企业微信配置流程已准备就绪` | Playwright 详情页可点击并显示 status |
| 授权操作 | 公众号授权按钮 | 进入授权流程或开通公众号流程 | `POST /channels/private/official-account/auth/prepare` 建议接口 | 旧按钮无反馈 | 本地显示 `公众号授权流程已准备就绪` | Playwright 可点击并显示 status |
| 会话浮层 | 收起/展开全部会话 | 右侧会话浮层可收起并重新打开 | 项目全局会话组件 | 已由 AppShell 承接 | 保持现有全局行为 | `private-channel.spec.ts` 会话收起/展开断言 |
| 空态 | 私域渠道列表为空 | 显示业务空态 | 统一响应包 `code=0,data.cards=[]` | 旧实现无空态 | `localStorage.pmsPrivateChannelScenario=empty` 返回空态 | Playwright 断言 `私域渠道空态` |
| 错误态 | 私域渠道服务失败 | 显示错误与重试入口 | 统一响应包 `code=50301,message` | 旧实现无错误态 | `localStorage.pmsPrivateChannelScenario=error` 显示错误；重试恢复成功 | Playwright 断言 alert 与重试 feedback |

## 后端待确认

- 目标站目前首屏实际请求分散在 `channels/get`、`wxCp/authInfo/get`、`wxCpOpen/accounts/get`、`tpAuthorizeApps/get`、`channelGroups/get` 等接口；本地建议沉淀为页面聚合接口 `/channels/private/summary/get`，后端可按模块拆分实现但前端保持同一 adapter。
- 企业微信配置、公众号授权、品牌小程序订阅是否需要预创建任务单，待后端确认。
- 空态是否按账号权限返回空卡片列表，还是保留系统支持渠道但标记不可用，待后端确认。
