# 客户标签目标页面模型

- `TASK_ID`: `scrm--kehu-guanli--kehu-biaoqian`
- `PAGE_NAME`: 客户标签
- `TARGET_URL`: `https://minsubao.localhome.cn/customer/tag`
- 采集批次：`20260514T023340`
- 主控证据：项目 Playwright 固定 Chrome + `playwright/.auth/pms-user.json`
- 登录态：`isLoginBlocked=false`

## 页面骨架

1. 顶部导航：`SCRM` 高亮。
2. 左侧侧栏：
   - `客户概况`
   - `客户管理`：`客户列表`、`客户标签`，其中 `客户标签` 高亮。
   - `会员中心`：会员等级、会员权益、会员积分。
   - `增长获客`：批量加好友。
   - `营销推广`：优惠券、全员营销、客户营销。
   - `客户沟通`：聊天工具栏、微信客服、接待配置。
   - `企微员工管理`：企微员工列表。
3. 主内容区：无本地通用大页头，业务内容贴近页面顶部。
4. 右下角存在真实站会话浮层，视为全局运行时浮层，本页复刻不作为核心结构。

## 默认态业务区

- 筛选表单：
  - label：`标签组`
  - 输入框 placeholder：`请输入`
  - 表单位置约 `x=172 y=68 width=1252 height=32`
- 右上操作：
  - `查 询`：蓝底按钮，约 `64x28`
  - `重 置`：白底蓝边按钮，约 `64x28`
  - `同步企微标签`：蓝底按钮，约 `116x28`
  - `新建标签组`：蓝底按钮，约 `102x28`
- 表格：
  - 位置约 `x=172 y=144 width=1252 height=193`
  - 表头：`标签组`、`标签名称`、`创建人`、`创建时间`、`操作`
  - 空态：`暂无数据`

## 状态矩阵

### 新建标签组

- 触发：点击 `新建标签组`
- 弹层标题：`新建标签组`
- 字段：
  - `标签组名称`，placeholder：`请输入标签组名称`
  - `标签`
  - 链接/按钮：`+ 添加标签`
- 底部按钮：`取消`、`确定`
- 截图：`artifacts/screenshots/scrm--kehu-guanli--kehu-biaoqian/新建标签组-target-20260514T023340.png`

### 同步企微标签

- 触发：点击 `同步企微标签`
- 提示文案：`请先前往授权企微再操作`
- 操作按钮：`我知道了`、`前往授权`
- 截图：`artifacts/screenshots/scrm--kehu-guanli--kehu-biaoqian/同步企微标签-target-20260514T023340.png`

### 查询/重置

- 当前账号为空态，点击 `查 询` 和 `重 置` 后表格仍为空态。
- 输入 `标签组` 后查询应保留输入并展示空态；重置应清空输入。

## 本地接入需求

- 新增页面局部实现：`CustomerTagPage`。
- 必须注册路由：`/customer/tag`。
- 必须让 `/customer/*` 与 `/scrm/*` 一样使用 SCRM 顶部导航和 `scrmSideNav`。
- 页面应隐藏通用 `.page-header`，保留 sr-only 标题。
- 当前阻塞：`src/App.tsx`、`src/data/mock.ts`、`src/components/AppShell.tsx` 仍在看板中由其他任务持锁，不能抢锁接入。
