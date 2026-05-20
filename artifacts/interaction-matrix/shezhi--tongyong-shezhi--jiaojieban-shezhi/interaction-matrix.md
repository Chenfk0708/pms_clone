# 交接班设置交互矩阵

## 页面信息

- 任务编号：`shezhi--tongyong-shezhi--jiaojieban-shezhi`
- 页面路由：`/setting/shiftSetting`
- 服务层文件：`src/services/shiftSetting.ts`
- 页面文件：`src/pages/ShiftSettingPage.tsx`
- 专项测试：`tests/shift-setting.spec.ts`

## 默认成功态

| 触发 | 输入 | 页面反馈 | 服务契约 |
| --- | --- | --- | --- |
| 打开页面 | 无 | 展示班次设置、交班物品、操作反馈、设置班次与添加物品按钮 | `provider=mock`，`configPath=/shiftWorkConfig/page/get`，`goodsPath=/shiftWorkGoods/page/get`，`memberPath=/campRoles/get`，`campId=1796067693589061634`，`shiftCount=2`，`goodsCount=2`，`memberCount=4` |

## 保存与编辑

| 触发 | 输入 | 页面反馈 | 服务契约变更 |
| --- | --- | --- | --- |
| 点击 `班次设置` | 进入班次弹窗 | 打开 `设置班次` 弹窗，可新增班次行、填写名称/时间/成员并确认 | mock 下本地闭环保存，成功后更新页面内班次列表与操作反馈 |
| 点击 `添加物品` | 进入物品弹窗 | 打开 `添加物品` 弹窗，可新增物品行并确认 | mock 下本地闭环保存，成功后更新页面内物品列表与操作反馈 |

## 空态与错误态

| 场景 | 触发方式 | 页面反馈 | 服务契约 |
| --- | --- | --- | --- |
| 空态 | `?mockState=empty` | 显示 `暂无班次， 点击新增` 与 `暂无交班物品， 点击新增` | `shiftCount=0`，`goodsCount=0` |
| 错误态 | `?mockState=error` | 显示 `交接班设置加载失败，请稍后重试`，可重试 | `code=50310`，`message=交接班设置加载失败，请稍后重试` |

## 真实体接口结论

| 接口 | 方法 | 已确认请求 | 已确认响应 |
| --- | --- | --- | --- |
| `https://hudson-prod.localhome.cn/shiftWorkConfig/page/get` | `POST` | `{"campId":"1796067693589061634","pageNum":1,"pageSize":999}` | `success / errorCode / errorMsg / errorDetail / data`，`data` 内含班次列表 |
| `https://hudson-prod.localhome.cn/shiftWorkGoods/page/get` | `POST` | `{"campId":"1796067693589061634","pageNum":1,"pageSize":999}` | `success / errorCode / errorMsg / errorDetail / data`，`data` 内含交班物品列表 |
| `https://hudson-prod.localhome.cn/campRoles/get` | `POST` | `{"campId":"1796067693589061634"}` | `success / errorCode / errorMsg / errorDetail / data`，`data` 内含成员列表 |

## 备注

- 保存班次与保存物品当前是本地 mock 闭环，不伪造后端成功接口。
- 页面必须显式暴露 `provider` 与 `mockState`，不做静默 fallback。
