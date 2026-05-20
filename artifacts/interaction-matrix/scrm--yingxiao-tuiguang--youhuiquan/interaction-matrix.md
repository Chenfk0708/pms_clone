# 优惠券交互矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 入口与导航 | SCRM > 营销推广 > 优惠券 | 进入 `/mallManagement/couponMgt`，顶部高亮 SCRM，侧栏展开营销推广并高亮优惠券 | 首屏触发 `POST /coupons/page/get`，请求体含 `campId/pageNum/pageSize/current` | 已有路由和侧栏入口 | 保留现有入口，页面数据改由 `src/services/coupon.ts` 统一服务提供 | Playwright 断言 URL、优惠券侧栏 active、页面标题可见 |
| 顶部页签 | 优惠券管理 | 展示优惠券列表、上架状态筛选、重置、查询、派发任务、新建 | `POST /coupons/page/get` | 旧实现只有静态空表 | 接入显式 mock provider，展示业务行、分页、服务诊断 | `tests/coupon.spec.ts` 断言 `coupons/page/get`、业务行和请求体 |
| 顶部页签 | 派发任务 | 切换为派发任务表格，展示全部记录与新建任务 | 目标站取证到 `POST /couponSendConfigs/page/get` | 旧实现只有静态空表 | 新增派发任务数据服务、业务行、分页和新建任务弹窗 | Playwright 点击页签后断言 endpoint、表头、业务行 |
| 筛选区 | 上架状态 | 目标站为下拉选择，选项包括已上架、已下架 | `POST /coupons/page/get`，本地契约字段 `shelfStatus: 1/0/null` | 旧实现只切换文字 | 下拉选项驱动服务请求参数，查询后刷新业务行 | Playwright 选择已上架后断言 request body 含 `"shelfStatus":1` |
| 筛选区 | 查询 | 按当前条件重新请求优惠券列表 | `POST /coupons/page/get` | 旧实现只显示简单 notice | 保留业务反馈，并由服务层刷新数据 | Playwright 点击后断言 status 文案和请求体 |
| 筛选区 | 重置 | 清空上架状态并回到默认分页 | `POST /coupons/page/get`，`shelfStatus:null/pageNum:1` | 旧实现清空本地状态 | 重置筛选、页码和提示 | Playwright 基础流程覆盖 |
| 筛选区 | 刷新 | 重新拉取当前条件数据 | 同当前 tab 的列表接口 | 旧实现缺少刷新 | 增加刷新按钮、禁用加载中的重复点击、成功提示 | Playwright 点击后断言“已刷新” |
| 筛选区 | 导出 | 目标站当前首屏未展示导出；本地按业务动作承接 | 后续建议 `POST /coupons/export/create` | 旧实现缺少导出 | 用“导出优惠券”业务弹窗承接导出任务创建反馈 | Playwright 点击后断言导出弹窗 |
| 列表表格 | 查看 | 目标站空数据未取证到行内操作；按优惠券业务需要承接详情 | 后续建议 `POST /coupons/detail/get` | 旧实现无数据行 | 用优惠券详情弹窗承接 | Playwright 点击“查看 春季连住满减券”后断言详情弹窗 |
| 派发任务 | 新建任务 | 打开新建派发任务流程 | 后续建议 `POST /couponSendConfigs/create` | 旧实现只 notice | 用新建派发任务弹窗承接，说明选择优惠券和会员标签 | Playwright 点击后断言弹窗内容 |
| 派发任务 | 下一页 | 切换分页参数 | `POST /couponSendConfigs/page/get`，`pageNum` 增加 | 旧实现无分页 | 分页按钮更新 `pageNum` 并刷新服务诊断 | Playwright 点击后断言 request body 含 `"pageNum":2` |
| 新建页 | 新建 | 目标站跳转 `/mallManagement/couponMgt/edit` | 编辑页加载字典：`holidays/get`、`channelRoomCategories/page/get/v2` 等 | 已有路由但交互弱 | 保留路由，补房型选择、节假日弹窗、提交反馈 | Playwright 断言编辑页字段和弹窗 |
| 新建页 | 选择商品/房型 | 目标站打开商品/房型选择组件 | 取证到 `POST /channelRoomCategories/page/get/v2` | 旧实现按钮无反馈 | 用选择商品/房型弹窗承接并写回已选范围 | Playwright 点击确认后断言状态 |
| 新建页 | 查看默认节假日列表 | 目标站读取节假日数据 | 取证到 `POST /holidays/get` | 旧实现无反馈 | 用默认节假日列表弹窗承接 | Playwright 断言春节等节假日可见 |
| 新建页 | 提交 | 目标站保存优惠券 | 后续建议 `POST /coupons/save` | 旧实现无反馈 | 显示“优惠券已保存”业务反馈 | Playwright 点击后断言 status |
| 状态反馈 | success/empty/error | 目标站当前空表；接口响应为 `success/errorCode/errorMsg/data` | 本地统一为 `code/message/data/traceId/timestamp` 并兼容目标站成功包 | 旧实现只有静态空态 | mock provider 支持 success、empty、error，错误清晰暴露并有重试 | Playwright 覆盖 success/empty/error 三态 |
