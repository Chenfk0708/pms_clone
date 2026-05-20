# 路客商城交互矩阵

## 任务信息

- 任务 ID：`yingyong-dingyue--quanyi-yu-dingyue--luke-shangcheng`
- 页面路由：
  - `/version/localsMall`
  - `/version/localsMall/detail`
- 目标页：`https://minsubao.localhome.cn/version/localsMall`
- 本地验证页：`http://127.0.0.1:4173/version/localsMall`
- 服务实现：[src/services/localsMall.ts](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/src/services/localsMall.ts)
- 页面实现：[src/pages/LocalsMallPage.tsx](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/src/pages/LocalsMallPage.tsx)
- 测试入口：[tests/locals-mall.spec.ts](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/tests/locals-mall.spec.ts)

## Provider 与契约

- 默认 provider：`mock`
- 可选 provider：`mock | api`
- 本地存储开关：`pms.localsMall.provider`
- URL 状态开关：`mockState=success|empty|error`
- 隐藏契约节点：`data-testid="locals-mall-service-contract"`
- 当前暴露的真实上游请求摘要：
  - `POST /weiRoomCategories/page/get`
  - `POST /youzan/commodity/get`
  - `POST /rooms/get`
  - `POST /paymentTypes/get/v2`
  - `POST /paymentWays/get`

## 目标站取证事实

- 默认页存在订阅中心左侧导航，当前高亮为 `路客商城`，版本号为 `v4.10.7`。
- 默认页正文为 `系统功能 + 智能硬件` 两组商品，共 7 个 `立即购买` 按钮。
- 首个 `立即购买` 进入 `/version/localsMall/detail`。
- 详情页已确认文案：
  - `路客商城/`
  - `详情`
  - `购买时长`
  - `一年`
  - `购买方`
  - `路客云6TS5`
  - `总费用`
  - `¥ 800`
- 真实网络已确认请求：
  - `POST /weiRoomCategories/page/get`
  - `POST /youzan/commodity/get`
  - `POST /rooms/get`
  - `POST /paymentTypes/get/v2`
  - `POST /paymentWays/get`

## 行为矩阵

| 行为 | 目标站 | 本地 clone | 证据 |
| --- | --- | --- | --- |
| 左侧导航高亮 | 已确认 `路客商城` 高亮 | 已实现 | Playwright 用例 1 |
| 默认商品概览 | 已确认 2 个分组、7 个购买入口 | 已实现 | Playwright 用例 1 |
| 服务契约暴露 | 目标站无隐藏节点 | 已实现 | Playwright 用例 1，断言 5 个接口 path |
| 商品详情跳转 | 已确认首个购买按钮进入详情页 | 已实现 | Playwright 用例 2 |
| 适用房型弹层 | 已确认详情页存在该入口 | 已实现 | Playwright 用例 2 |
| 支付方式弹层 | 已确认详情页存在该入口 | 已实现 | Playwright 用例 2 |
| 未勾选协议提交 | 目标站未直接暴露失败反馈文案 | 已实现显式失败反馈 | Playwright 用例 2 |
| 勾选协议后提交 | 已确认购买链路应继续承接后续配置页 | 已实现提交结果弹层和跳转 | Playwright 用例 2 |
| 空态 | 目标站当前未取证到专门空态文案 | 已实现业务空态承接 | Playwright 用例 3 |
| 错误态重试 | 目标站未取证到专门错误文案 | 已实现显式错误卡片与重试 | Playwright 用例 4 |
| 快捷入口跳转 | 目标站存在相关承接语义 | 已实现 `智能门锁/自助入住/全局设置` | Playwright 用例 1 |

## 本地产物

- 交互矩阵：本文
- 专项配置：[tmp/locals-mall.playwright.config.ts](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/tmp/locals-mall.playwright.config.ts)
- 取证脚本：[scripts/capture-locals-mall.mjs](/C:/Users/Administrator/Desktop/work/xxxxx/pms_clone/scripts/capture-locals-mall.mjs)

## 验证命令

```powershell
npx eslint src/services/localsMall.ts src/pages/LocalsMallPage.tsx tests/locals-mall.spec.ts scripts/capture-locals-mall.mjs --no-cache
npx tsc --noEmit --ignoreConfig --jsx react-jsx --moduleResolution bundler --module esnext --target es2022 --lib dom,dom.iterable,es2022 --types vite/client,node src/services/localsMall.ts src/pages/LocalsMallPage.tsx tests/locals-mall.spec.ts
npm run build
npx playwright test tests/locals-mall.spec.ts --config=tmp/locals-mall.playwright.config.ts --reporter=line
```
