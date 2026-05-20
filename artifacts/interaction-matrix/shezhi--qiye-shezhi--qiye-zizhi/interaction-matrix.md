# 企业资质交互矩阵

| 区域 | 元素/按钮 | 目标站行为 | 触发数据服务/未来请求 | 本地现状 | 改善动作 | 验收方式 |
| --- | --- | --- | --- | --- | --- | --- |
| 页面框架 | 左侧 `企业资质` 菜单 | 进入 `/InformationMaintenance/qualification`，左侧菜单高亮，顶层 `设置` 高亮 | 未观察到专属接口；首屏伴随壳层初始化请求 | 已完成 | 复用现有设置壳层与企业设置菜单高亮 | Playwright 断言 URL、`设置`/`企业资质` 激活态 |
| 顶部页签 | `企业信息` / `营业资质` / `法人证件` | 三个页签切换内容区；默认激活 `企业信息` | 无独立请求，属于前端页内切换 | 已完成 | 用页签状态驱动三块业务内容，切换时给出操作反馈 | Playwright 断言 `aria-selected` 与对应区块标题 |
| 企业信息 | `编 辑` | 进入编辑态，出现 `取 消` / `保 存`、城市占位和图片上传位 | 推荐契约：`POST /company/qualification/get` 读取详情，编辑态不额外请求 | 已完成 | 用显式草稿态承接编辑，避免组件内静态常量 | Playwright 点击 `编 辑` 后断言按钮与表单字段出现 |
| 企业信息 | `取 消` | 退出编辑态，恢复原始展示值 | 前端回滚草稿，不应提交保存请求 | 已完成 | 取消时恢复最近一次已保存快照，并给出反馈文案 | Playwright 修改名称后取消，断言详情区未被污染 |
| 企业信息 | `保 存` | 目标站存在保存入口；真实提交接口未在本轮 target 中单独捕获 | 推荐契约：`POST /company/qualification/save` | 已完成 | 统一经服务层保存，返回更新后的 profile + contract | Playwright 填写表单保存后断言详情区与反馈文案 |
| 企业信息 | `上传` 企业图片 | 编辑态可上传企业图片 | 推荐契约：`POST /company/qualification/upload`，`target=companyImage` 或并入保存 | 已完成 | 当前先做草稿图片上传，保存后生效 | Playwright 点击 `上传 企业图片` 后断言图片列表出现 |
| 营业资质 | `营业资质` 页签 | 展示 4 组资质区：营业执照、行业资质、补充资质、授权承诺函 | 推荐契约：`POST /company/qualification/get` 返回 `businessLicenses[]` | 已完成 | 将四组上传区收口为统一 section 模型 | Playwright 断言四组标题、说明文案与上传按钮 |
| 营业资质 | `查看示例` / `公共场所许可证查看示例` 等 | 目标站可点击示例链接；本轮取证确认其为可见交互 | 无明确网络；适合前端弹层或跳转静态资源 | 已完成 | 本地用说明弹窗承接示例，避免无反馈点击 | Playwright 点击示例后断言 dialog 文案 |
| 营业资质 | `下载授权承诺函模板` | 目标站存在下载入口 | 可能为静态文件下载；本轮未捕获专属 API | 已完成 | 本地先返回“下载任务已创建”反馈，接口文档标记待后端确认 | Playwright 点击后断言状态反馈 |
| 营业资质 | `上传` / `上传文件` | 目标站展示上传位与格式提示 | 推荐契约：`POST /company/qualification/upload`，`target=businessLicense/industryLicense/supplementLicense/authorizationLetter` | 已完成 | 上传统一走服务层，按 section 回填文件列表 | Playwright 上传营业执照后断言文件卡片 |
| 法人证件 | `法人证件` 页签 | 展示证件类型、证件号码、三张证件照片上传位 | 推荐契约：`POST /company/qualification/get` 返回 `legalIdentity` | 已完成 | 统一 legal photo 模型，避免三块重复静态代码 | Playwright 断言 `居民身份证` 与三张照片位 |
| 法人证件 | 三个 `上传` 按钮 | 目标站存在三张照片上传位 | 推荐契约：`POST /company/qualification/upload`，`target=legalFront/legalBack/legalHandheld` | 已完成 | 上传后回填文件列表并反馈成功文案 | Playwright 上传人像面后断言反馈与文件列表 |
| 空态 | `立即完善` | 本轮 target 默认态非空；空态未直接观测 | 推荐契约：`mockState=empty` / 空响应 `profile=null` | 已完成 | 明确空态说明与进入编辑入口 | Playwright `mockMode=empty` 断言空态与 CTA |
| 错误态 | `重新加载` | 本轮 target 未直接观测错误态 | 推荐契约：错误响应包 / `mockState=error` | 已完成 | 暴露错误信息和重试入口，不做静默 fallback | Playwright `mockMode=error` 后点击 `重新加载` 恢复成功 |
| 跨页协调 | 左侧 `企业信息` / `权限设置` / `API keys` | target 取证确认企业设置子菜单间存在可用跳转；其中点击 `企业信息` 会跳至 `/CompanySetting/CompanyInfo` | 沿用现有项目路由 | 已完成 | 保持企业设置组内路由协同，不新增假路由 | Playwright 从企业资质跳到 `权限设置` 与 `API keys` 断言 URL |

## target 取证备注

- 默认页签为 `企业信息`。
- 已明确取证到 `编 辑` 进入编辑态；编辑态出现 `取 消`、`保 存`、`请选择所在城市`、`上传`。
- 已明确取证到 `营业资质` 页签下 4 组上传区与 `下载授权承诺函模板`。
- 已明确取证到 `法人证件` 页签下 `居民身份证` 与 3 个上传位。
- 本轮未捕获到企业资质专属后端接口，请求层以壳层初始化为主，因此接口文档以下方推荐契约草案为准。
