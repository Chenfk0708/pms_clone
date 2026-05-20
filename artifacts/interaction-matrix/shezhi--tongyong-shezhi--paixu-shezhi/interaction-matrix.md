# 排序设置交互矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 顶部页签 | 门店排序 | 切换到门店排序列表 | `POST /menus/project/get`、`POST /select/poi/page/get` | 已接入 | 默认落到门店排序并展示门店列表 | Playwright 断言默认激活 `门店排序` |
| 顶部页签 | 房型排序 | 切换到房型排序列表 | `POST /roomCategories/page/get`、`POST /rooms/get` | 已接入 | 切换后刷新房型列表与服务契约块 | Playwright 点击 `房型排序` 后断言列表项数量与文案 |
| 顶部页签 | 商品排序 | 切换到商品排序列表 | `POST /weiRoomCategories/page/get` | 已接入 | 切换后刷新商品列表与服务契约块 | Playwright 点击 `商品排序` 后断言列表项数量与文案 |
| 右上提示 | 排序说明文案 | 展示“拖拽即可进行排序”提示 | 无新增请求 | 已接入 | 复刻目标站提示文案，移动端改为文内卡片 | Playwright 断言提示文案可见 |
| 门店列表 | 门店卡片 | 目标站仅展示单门店，无实际排序提交 | 无保存请求 | 已接入 | 保留展示态，不伪造保存逻辑 | Playwright 断言门店列表仅 1 项 |
| 房型列表 | 上移/下移 | 目标站为拖拽排序，变更后提交房型顺序 | `PUT /roomCategory/seqs` | 已接入 | 用上移/下移承载稳定测试交互，并暴露真实提交契约 | Playwright 点击后断言顺序变化与反馈文案 |
| 商品列表 | 上移/下移 | 目标站存在商品排序列表，保存接口本轮未实锤 | 推断 `PUT /channelRoomCategories/seqs` | 已接入 | 更新本地列表顺序并在反馈中明确“待后端最终确认” | Playwright 点击后断言顺序变化与反馈文案 |
| 页面反馈条 | 排序设置操作反馈 | 加载、排序成功、排序失败需有实时反馈 | 依赖当前服务层状态 | 已接入 | 统一通过 `role="status"` 暴露反馈 | Playwright 断言加载/成功/空态反馈 |
| 错误态 | 重新加载排序设置 | 失败后允许重新请求 | 重新调用当前页加载契约 | 已接入 | 暴露错误原因与重试入口，不做静默 fallback | Playwright 访问 `?mockState=error` 后断言错误态与按钮 |
| 空态 | 空状态卡片 | 当前页无数据时展示空态 | 当前页加载契约返回空列表 | 已接入 | 区分空态与错误态，不让页面塌陷 | Playwright 访问 `?mockState=empty&tab=room` 后断言空态 |
| 调试契约 | 隐藏服务契约块 | 目标站无此块，本地用于校验契约一致性 | 汇总当前 tab 的 load/save contract | 已接入 | 通过 `data-testid="sort-setting-service-contract"` 暴露 provider、state、activeTab、contract | Playwright 断言 `data-provider`、`data-state`、`/roomCategory/seqs` |

## 说明

- 目标站真实交互是拖拽排序；本地为了稳定自动化回归，房型和商品改用“上移/下移”按钮承载顺序变更。
- 商品排序保存接口本轮未从目标站网络中直接取证到最终 path，当前仅保留同构契约草案，并在页面反馈中显式提示待后端确认。
- 取证参考：
  - `tmp/sort-setting-target-contract.json`
  - `artifacts/network/shezhi--tongyong-shezhi--paixu-shezhi/`
  - `artifacts/dom-snapshots/shezhi--tongyong-shezhi--paixu-shezhi/`
