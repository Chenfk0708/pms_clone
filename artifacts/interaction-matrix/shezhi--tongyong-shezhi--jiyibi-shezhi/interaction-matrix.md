| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 顶部说明区 | `新增` | 打开“新增”弹窗 | 建议 `POST /paymentTypes/custom/create`；当前列表读取已取证 `POST /paymentTypes/get/v2` | 已承接 | 打开弹窗，提交后走统一服务层并把自定义项目回写到当前分组 | Playwright 点击 `新增`，填写名称后断言新卡片出现，隐藏契约切到 `action=create` |
| 顶部说明区 | 操作反馈条 | 目标站无独立反馈文案，但交互后界面发生变化 | 前端消费统一响应包 `traceId/timestamp/state` | 已承接 | 对加载、切 tab、创建成功、创建失败、重试成功给出业务反馈 | Playwright 断言 `role=status` 文案随动作变化 |
| Tab 区 | `收入项` | 默认高亮，展示收入分组与项目 | `POST /paymentTypes/get/v2`，请求体样本 `{"campId":"1796067693589061634","bizTypes":[3]}` | 已承接 | 页面默认从统一服务层读取收入分组，不在组件中硬编码列表 | Playwright 断言 `收入项` 为选中态且 `房费/清洁费/押金` 可见 |
| Tab 区 | `支出项` | 切换到支出分组 | 同上；前端使用同一份契约按 `isIncome` 拆分 | 已承接 | 用 URL query `tab=expense` 保持刷新后仍回到当前 tab | Playwright 点击 `支出项` 后断言 `退款/采购/维修费` 可见 |
| 分组区 | 空分组 `点击新增` | 打开“新增”弹窗，且预选当前业态 | 建议 `POST /paymentTypes/custom/create` | 已承接 | 点击空态按钮时自动带入当前分组名称与 `groupType` | Playwright 在 `餐饮` 空组点击 `点击新增`，断言弹窗内业态为 `餐饮` |
| 分组区 | 默认项目卡片 | 目标站仅展示项目名称、拖拽柄、默认角标 | `POST /paymentTypes/get/v2` 响应字段 `paymentTypeId/paymentTypeName/isCustom/isIncome/isEnable/groupType` | 已承接 | 统一由服务层映射为 `WriteExpendSettingItem`，页面只消费业务模型 | Playwright 断言默认卡片带 `默认` 角标 |
| 分组区 | 自定义项目卡片 | 目标站未取证到现成样本，需由 mock 闭环承接 | 建议 `POST /paymentTypes/custom/create` | 已承接 | 新增成功后显示 `自定义` 角标，不污染默认项 | Playwright 新增项目后断言卡片带 `自定义` |
| 停用区 | `已停用项` | 目标站默认可见该分区，本轮取证未见列表内容 | 后续可复用 `paymentTypes/get/v2` 的 `isEnable=0` 数据 | 已承接 | 先保留空态承接，避免结构塌陷；后续真实返回停用项时直接映射 | Playwright 断言 `已停用项` 与 `暂无停用项目` 可见 |
| 弹窗 | `选择业态` | 选择当前新增项所属业态 | 建议与创建接口同参：`groupType/groupName` | 已承接 | 使用分组选项驱动下拉，切换后同步 `groupType` | Playwright 断言下拉存在 `住宿/餐饮/商超/娱乐/场地` |
| 弹窗 | `名称` 输入框 | 输入新增项目名称 | 建议与创建接口同参：`paymentTypeName` | 已承接 | 提交前做必填与重名校验，错误清晰暴露，不做静默兜底 | Playwright 提交空名称或重名时断言错误提示 |
| 弹窗 | `取消` | 关闭弹窗，不改数据 | 无新增请求 | 已承接 | 直接关闭弹窗并保留当前列表状态 | Playwright 点击 `取消` 后断言弹窗消失 |
| 弹窗 | `完成` | 提交新增 | 建议 `POST /paymentTypes/custom/create` | 已承接 | 使用统一服务层创建并返回最新页面业务模型 | Playwright 点击 `完成` 后断言反馈文案与新卡片 |
| 错误态 | `重试` | 目标站未直接取证到错误态，本地需补齐 | 复用 `POST /paymentTypes/get/v2` | 已承接 | mock provider 支持 `error -> success` 重试，不吞错 | Playwright 先用 `mockState=error`，再切回 `success` 点击 `重试` |
| 加载态 | 骨架屏 + 禁用 `新增` | 目标站加载过程极短，本地需补齐显式反馈 | 统一服务层延迟参数 `mockDelayMs` | 已承接 | 支持延迟模拟，加载中禁用主按钮 | Playwright 设置 `mockDelayMs=800`，断言骨架屏和按钮禁用 |
