# 电子房价牌交互矩阵

记录时间：2026-05-18 14:46 +08:00

任务：`fangtai--fangjia-guanli--dianzi-fangjiapai`  
目标页：`https://minsubao.localhome.cn/houseManage/priceBoard`  
本地页：`/houseManage/priceBoard`

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 页面入口 | 房态 > 房价管理 > 电子房价牌 | 进入 `/houseManage/priceBoard`，左侧房价管理展开，电子房价牌高亮，展示订阅商品卡和商品详情 | 目标站触发 `/camps/get`、`/edition/resource/get`、`/weiRoomCategories/page/get`、`/paymentTypes/get/v2` | 路由和菜单已存在，旧实现默认直连真实 Hudson | 默认改为显式 mock provider，页面正文按业务可用状态展示；provider/traceId/source 写入 DOM data 属性 | `tests/price-board.spec.ts` 默认 provider 用例；`tests/routes.spec.ts --grep priceBoard` |
| 数据服务 | 首屏商品配置 | 读取电子房价牌商品、介绍、价格阶梯、支付方式 | 当前契约建议 `POST /houseManage/priceBoard/overview`，后续可复用目标站四个接口聚合 | 旧数据由真实接口 route mock 驱动，默认无 mock 统一响应包 | `src/services/priceBoard.ts` 定义 `code/message/data/traceId/timestamp` 响应包，适配为 `PriceBoardData` | `data-provider=mock`、`data-trace-id=mock-fangtai--fangjia-guanli--dianzi-fangjiapai-overview-001` |
| 商品卡 | 去开通 | 进入购买详情，展示商品详情图、购买信息、协议勾选和立即购买 | 复用首屏概览数据 | 已可进入详情，但旧失败态显示开发态文案 | 商品配置成功时按钮启用；空态/错误态禁用或显示重试；页面不展示 mock/未接入/阻塞字样 | Playwright 点击后断言购买信息、图片、购买时长和金额 |
| 购买信息 | 购买时长单选 | 切换一年/两年，订单金额联动 | 不新增请求，使用概览 `roomCategoryProductGetViews` | 已有单选与金额切换 | 保留并由数据服务适配后的 `durationOptions` 驱动 | `routes.spec.ts` 选择“两年”后断言金额为 `¥998` |
| 购买信息 | 协议勾选 | 未勾选时提示先同意协议 | 不请求 | 已有校验 | 保留业务校验，不做假支付成功 | `routes.spec.ts` 取消勾选后断言协议提示 |
| 支付弹层 | 立即购买 | 打开微信支付弹层，显示二维码、金额、支付方式和倒计时 | 后续待确认支付下单、二维码、轮询接口 | 旧文案显示“未接入/阻塞”开发态 | 改为业务态“订单已创建，请在有效期内完成支付” | `routes.spec.ts` 点击立即购买后断言弹层、金额、业务态支付提示 |
| 支付弹层 | 关闭 | 关闭弹层返回购买信息 | 不请求 | 已可关闭 | 保留关闭反馈 | Playwright 点击关闭后断言弹层消失 |
| 空态 | 商品为空 | 商品为空时页面结构不崩溃 | 统一空态响应 `product:null,totalProductCount:0` | 旧实现无统一空态 | 显示“暂无电子房价牌商品配置”，主按钮禁用，DOM data-response-state=`empty` | `tests/price-board.spec.ts` empty 用例 |
| 错误态 | 数据服务失败 | 显示错误和重试入口 | 统一失败响应 `code=50001,data:null` | 旧实现显示真实接口阻塞 | 页面显示“数据加载失败”和“重试数据服务”，不展示开发态文案 | `tests/price-board.spec.ts` error 用例 |
| 跨页协调 | 房价页签 | 电子房价牌与中央价、渠道RP价、竞争圈比价、门市价、其他价格互相切换 | 路由跳转，无额外请求 | 已通过 `PricePage` 页签承接 | 保持项目已有路由，不硬编码不存在路径 | `routes.spec.ts --grep priceBoard` 和价格页既有路由回归 |
| 回归截图 | success/empty/error | 需要保留本地关键状态截图和 DOM/network/style | 本地 dev server `http://127.0.0.1:55220/houseManage/priceBoard` | 旧 artifacts 多为像素复刻和真实接口态 | 新增 `local-success/empty/error-20260518-mock-provider-*` 产物 | `artifacts/screenshots|dom-snapshots|style-dumps|network/fangtai--fangjia-guanli--dianzi-fangjiapai/` |
