# 房型信息交互矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 顶部筛选 | 门店下拉 | 打开下拉，展示门店候选，当前抓到 1 个门店选项 | `POST /select/poi/page/get` | 旧实现仅本地开关，无服务层 | 接入统一服务层，提供门店选项与筛选参数 | Playwright 打开下拉并断言候选项、服务参数、列表刷新 |
| 顶部筛选 | 分组下拉 | 打开下拉，展示分组选项；当前抓到 1 个分组选项 | `POST /roomCategoryGroups/get` | 旧实现仅本地开关，无服务层 | 接入统一服务层，分组选项与查询参数联动 | Playwright 打开下拉并断言候选项、服务参数、列表刷新 |
| 顶部筛选 | 房型名称输入 + 查询 | 输入关键字后点击“查询”，列表按条件返回；当前真实站输入 `观影` 仍命中 1 条房型 | `POST /roomCategories/page/get` | 旧实现输入框只改本地 state，查询不走服务 | 用显式 provider 驱动查询，请求参数统一建模 | Playwright 输入关键字、点击查询、断言请求参数和行数变化 |
| 顶部筛选 | 重置 | 清空筛选条件并恢复默认列表 | `POST /roomCategories/page/get` | 旧实现只清关键字，不恢复完整服务状态 | 重置全部筛选并重新加载默认列表 | Playwright 查询后点重置，断言输入值、下拉值和列表恢复 |
| 工具栏 | 添加房型 | 跳转 `/setting/roomTypeInfo/edit`，页面标题为“新增房型” | 编辑页数据契约待确认；当前以列表页跳转为准 | 旧实现已能跳转，但编辑页数据为写死常量 | 编辑页改为消费统一详情草案/表单模型 | Playwright 点击后断言 URL、标题、表单初始值 |
| 工具栏 | 标签管理 | 真实站存在入口，本轮未抓到后续承接页 | 待后端确认；本地可先用 mock 管理弹层承接 | 旧实现无反馈 | 增加 mock 标签管理弹层/提示反馈 | Playwright 点击后断言弹层打开与关闭 |
| 工具栏 | 楼层管理 | 真实站存在入口，本轮未抓到后续承接页 | 待后端确认；本地可先用 mock 楼层管理弹层承接 | 旧实现无反馈 | 增加 mock 楼层管理弹层/提示反馈 | Playwright 点击后断言弹层打开与关闭 |
| 列表 | 详情 | 跳转 `/setting/roomTypeInfo/edit`，标题为“详细信息” | 详情接口 path 待确认；当前可由列表数据 + 详情草案承接 | 旧实现已能跳转，但详情数据写死 | 统一通过服务层加载详情模型 | Playwright 点击首行详情并断言 URL、标题、字段值 |
| 列表 | 房间 | 打开“房间列表”弹层，展示房间名称/房型名称/门锁情况/楼层名称 | `POST /rooms/get` | 旧实现本地弹层写死房间内容 | 用服务层按房型加载房间列表 | Playwright 点击后断言弹层文本和关闭行为 |
| 列表 | 联动关房 | 打开“联动关房”弹层，支持搜索、重置、全选、确定；候选房型为除当前行外的其他房型 | 候选集可复用 `POST /roomCategories/page/get`；保存接口待确认 | 旧实现弹层结构不完整，无统一数据层 | 增加候选列表、已选数量、保存反馈与失败态 | Playwright 点击后断言候选项、选择数、确定反馈 |
| 列表 | 删除 | 打开确认框，文案为“确认删除房型?”，二次确认后删除 | 删除接口 path 待确认 | 旧实现按钮无结果 | 增加确认框、删除成功/失败反馈与列表更新 | Playwright 点击后断言确认框、确认删除、列表变化 |
| 列表/分页 | 分页信息与页容量 | 展示“第 1-4 条/总共 4 条”“20 条/页” | `POST /roomCategories/page/get` 返回分页结构 | 旧实现分页文案写死 | 分页信息改由服务层分页模型驱动 | Playwright 断言分页文案和契约节点分页字段 |

## 取证依据

- 默认列表：`artifacts/style-dumps/shezhi--xinxi-weihu--fangxing-xinxi/default-target-20260519123000-facts.json`
- 新增：`artifacts/style-dumps/shezhi--xinxi-weihu--fangxing-xinxi/new-room-type-target-20260519123500-facts.json`
- 详情：`artifacts/style-dumps/shezhi--xinxi-weihu--fangxing-xinxi/detail-first-target-20260519123500-facts.json`
- 房间弹层：`artifacts/style-dumps/shezhi--xinxi-weihu--fangxing-xinxi/room-first-target-20260519124000-facts.json`
- 联动关房弹层：`artifacts/style-dumps/shezhi--xinxi-weihu--fangxing-xinxi/linkage-first-target-20260519124500-facts.json`
- 分组下拉：`artifacts/style-dumps/shezhi--xinxi-weihu--fangxing-xinxi/group-filter-target-20260519124500-facts.json`
- 门店下拉：`artifacts/style-dumps/shezhi--xinxi-weihu--fangxing-xinxi/store-filter-target-20260519124500-facts.json`
- 删除确认框：`artifacts/style-dumps/shezhi--xinxi-weihu--fangxing-xinxi/delete-first-target-20260519124500-facts.json`

## 已确认接口

- `POST https://hudson-prod.localhome.cn/select/poi/page/get`
- `POST https://hudson-prod.localhome.cn/roomCategoryGroups/get`
- `POST https://hudson-prod.localhome.cn/roomCategories/page/get`
- `POST https://hudson-prod.localhome.cn/weiRoomCategories/page/get`
- `POST https://hudson-prod.localhome.cn/rooms/get`
- `POST https://hudson-prod.localhome.cn/roomCategoryFlow/closeRoomCategoryRemind`
