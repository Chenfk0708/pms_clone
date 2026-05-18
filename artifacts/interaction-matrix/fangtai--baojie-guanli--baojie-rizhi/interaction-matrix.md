# 保洁日志交互矩阵

任务：`fangtai--baojie-guanli--baojie-rizhi`  
页面：保洁日志  
目标路径：`/cleanManage/cleanLog`  
目标接口取证：`POST https://hudson-prod.localhome.cn/cleanLog/page/get`

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 顶部导航 | 房态 > 保洁管理 > 保洁日志 | 进入 `/cleanManage/cleanLog`，侧栏展开保洁管理并高亮保洁日志 | 无接口 | 已有路由和菜单入口 | 沿用项目 AppShell 与现有路由 | `tests/routes.spec.ts --grep cleanLog`，以及专项首屏测试 |
| 门店筛选 | 全部门店 / 天落会宿公寓 | 切换门店后按 `poiId` 请求日志列表 | `fetchCleanLogs({ campId, poiId, pageNum, pageSize })` | 本地默认使用显式 mock provider，保留同契约 api provider | 服务层统一构造请求体，组件只保存当前筛选状态 | 专项测试断言默认 mock 不请求 Hudson，api 切换后请求体包含 `campId/pageNum/pageSize` |
| 房型房间 | 请选择房间 | 打开选择房间弹窗，选择后以 `roomId` 数组刷新 | `roomId: string[]` | 弹窗可打开、选择、确认；房间选项来自服务层字典 | 选项进入 `filterOptions.rooms`，不硬编码在组件深处 | 专项测试选择“观影大床房 房间1（脏）”后断言诊断请求含 `roomId` |
| 操作日期 | 开始日期 / 结束日期 | 日期范围作为毫秒时间戳参与请求 | `operatorStartTime/operatorEndTime` | 输入日期后查询刷新 | 日期转换集中在页面边界，服务层只接收请求参数 | 专项测试断言查询后的诊断请求含两个时间戳 |
| 操作人 | 请选择操作人 | 下拉选择操作人，作为 `operatorId` 参与请求 | `operatorId` | 下拉可打开选择 | 操作人选项来自服务层字典 | 专项测试选择“路客云6TS5”后断言诊断请求含 `operatorId` |
| 操作按钮 | 查询 | 按当前筛选条件刷新列表 | `fetchCleanLogs` | 已有 loading/成功/失败反馈 | 使用统一服务层，成功显示列表或空态，失败显示 alert | 专项测试覆盖筛选请求参数与 UI 更新 |
| 操作按钮 | 重置 | 清空筛选并刷新 | `fetchCleanLogs` 默认参数 | 已可点击 | 清空房间、日期、操作人并重新加载 | 专项测试断言按钮与输入恢复初始值 |
| 操作按钮 | 刷新 | 重新拉取当前条件 | `fetchCleanLogs(lastQuery)` | 已可点击 | role=status 显示“已刷新” | 专项测试点击刷新断言状态反馈 |
| 操作按钮 | 导出 | 目标站无本轮独立导出请求取证；本地按业务动作创建导出任务反馈 | `createCleanLogExportTask`，未来可映射 `/cleanManage/cleanLog/export` | 已可点击，有业务反馈 | 不在正文出现开发态文案 | 专项测试点击导出断言“导出任务已创建” |
| 表格 | 保洁日志列表 | 列为操作时间、操作人、操作类型、操作内容 | 列表响应 `data.list` + `pagination` | 数据来自 mock provider 统一响应包 | 列表只消费适配后的 `CleanLogRow` | 专项测试断言列头和业务行展示 |
| 表格操作 | 查看 | 目标站当前空态未取证到详情跳转；本地用详情抽屉承接 | 无新增请求 | 已打开详情抽屉 | 保持业务态详情，不硬编码不存在路由 | 专项测试打开并关闭“保洁日志详情” |
| 空态 | 暂无保洁日志 | 目标站当前账号为空态显示暂无数据 | mock provider `state=empty` | 已支持统一空态响应 | 显示“暂无保洁日志”，页面结构不崩溃 | 专项测试设置 `pms.cleanLogMockState=empty` |
| 错误态 | 接口失败 | 失败时清晰暴露错误并可重试 | 统一响应包 `code != 0` | 已支持 mock error | role=alert 显示“保洁日志加载失败，请重试” | 专项测试设置 `pms.cleanLogMockState=error` |
