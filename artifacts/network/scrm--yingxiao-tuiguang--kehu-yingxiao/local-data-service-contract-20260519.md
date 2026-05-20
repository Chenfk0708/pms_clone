# 客户营销本地数据服务清单

任务：`scrm--yingxiao-tuiguang--kehu-yingxiao`

## 服务位置

- 前端服务层：`src/services/customerMarketing.ts`
- 页面消费位置：`src/pages/CustomerMarketingPage.tsx`
- provider 开关：`localStorage.pms.customerMarketingProvider` 或 `VITE_CUSTOMER_MARKETING_PROVIDER`
- mock 状态开关：`localStorage.pms.customerMarketingMockMode` 或 `VITE_CUSTOMER_MARKETING_MOCK_MODE`

## Provider

| provider | 行为 |
| --- | --- |
| `mock` | 当前正式展示数据源，返回统一响应包并支持 success/empty/error 三态 |
| `real` | 调用 `https://hudson-prod.localhome.cn/scrm/marketing/customer/overview`，复用同一统一响应包和 adapter |

## 请求体

```json
{
  "bizDate": "2026-05-18",
  "storeId": null,
  "channel": null,
  "stage": null,
  "keyword": null,
  "page": 1,
  "pageSize": 20
}
```

## 统一响应包

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "filters": {},
    "metrics": [],
    "campaigns": [],
    "funnel": [],
    "todos": [],
    "leads": {
      "list": [],
      "pagination": {
        "page": 1,
        "pageSize": 20,
        "total": 0
      }
    },
    "quickLinks": [],
    "updatedAt": "2026-05-18 10:00"
  },
  "traceId": "mock-scrm--yingxiao-tuiguang--kehu-yingxiao-overview-001",
  "timestamp": "2026-05-18T10:00:00+08:00"
}
```

## 验证覆盖

- `tests/scrm-customer-marketing.spec.ts` 覆盖 mock 首屏、筛选刷新、空态、错误态、可见按钮反馈、快捷路由和 real provider 请求契约。
- 固定 Chrome target 取证：`artifacts/screenshots/scrm--yingxiao-tuiguang--kehu-yingxiao/default-target-20260518T072939.png`
- 本地 clone 取证：`artifacts/screenshots/scrm--yingxiao-tuiguang--kehu-yingxiao/default-clone-20260519T025620.png`
