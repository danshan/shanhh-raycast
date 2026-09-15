# AGENTS.md

## Scope

本文件适用于整个仓库. Extension 实现分别位于 `shanhh-totp/`, `shanhh-myip/` 和 `shanhh-nsfw/`. 除非任务明确要求, 只修改目标 Extension, 不执行发布操作.

## Before Changing Code

1. 先阅读 `docs/README.md` 及任务涉及的专题文档.
2. 从目标 Extension 的 `package.json` 确认 manifest, scripts, Preferences 和公开 Commands 或 Tools.
3. 从真实入口追踪调用链. UI 从 `src/index.tsx` 开始, AI Tool 从对应的 `src/tools/<tool-name>.ts` 开始.
4. 修改共享函数前, 使用 `rg` 查找全部调用方. 修复应落在最小的共享根因位置.
5. 保留用户已有改动. 不清理或覆盖无关 diff, 不跨 Extension 做顺手重构.

## Repository Layout

- `shanhh-totp/`: 本地 TOTP 文件读取, 生成, 搜索和复制.
- `shanhh-myip/`: 本地和公网 IP 查询及详情展示.
- `shanhh-nsfw/`: Btsow 和 JavBus 查询, HTML 解析及 AI Tools.
- `<extension>/src/index.tsx`: Raycast View Command 入口.
- `<extension>/src/components/`: Raycast UI 和 Action 组合.
- `<extension>/src/hooks/`: 异步状态和 Toast 反馈. 仅在复杂度需要时存在.
- `<extension>/src/clients/`: 外部 HTTP API 边界和响应解包. 仅在存在远程协议时使用.
- `<extension>/src/tools/`: Raycast AI Tool 的薄适配层.
- `<extension>/src/utils/`: HTML 解析和格式转换等共享逻辑.
- `<extension>/src/types/` 或 `<extension>/src/types.tsx`: 外部数据契约和 Preferences 类型.
- `<extension>/ai.yaml`: AI Instructions 和 Evals. 仅 AI Extension 存在.
- `docs/`: 当前架构, 目录规划, 技术设计和开发流程.

不要为了单个调用方增加 service, repository, factory 或 interface. 只有当现有分层无法表达真实的重复行为时才新增抽象.

## Implementation Rules

- 使用 TypeScript strict mode 和 React function components.
- 代码, 注释, 标识符和 commit message 使用 English.
- 用户可见文案沿用所在功能的现有语言, 不在无关改动中统一改写.
- 保持 Extension 独立. 不从一个 Extension import 另一个 Extension 的源码或依赖.
- Component 负责展示和导航. Hook 负责 UI 异步状态. Client 负责协议. Tool 仅做输入规范化和 Client 调用.
- 优先复用目标 Extension 内现有的 Client, Hook, Utility 和类型. 不新增 HTTP 封装或状态管理依赖来解决局部问题.
- 新增远程请求时优先放入 Client. 外部响应应在 Client 或专用 Parser 边界解包.
- 新增公开 AI Tool 时, 同时更新 `package.json`, 对应 `src/tools/` 文件和 `ai.yaml` Evals.
- 新增或重命名 Preference 时, 同时更新 `package.json`, 类型和使用方, 以及 `docs/development.md` 和 Extension README.
- 保持每个 Extension 的 `package.json` 与 `package-lock.json` 同步. 不手工编辑 lockfile.

## Security

- 不提交或输出 TOTP Secret, OTP, Cookie, Authorization Header, 本地认证文件内容或完整敏感请求 URL.
- 不记录 `getPreferenceValues()` 返回值或认证文件路径. 错误日志必须先移除个人数据和查询内容.
- 不在文档, 测试或 fixture 中使用真实账号, IP, 内容记录或凭据.
- 外部 API Host 可以记录为架构依赖, 但请求示例必须使用占位值.
- Clipboard, Paste 和 Browser Action 是显式数据外发边界. 新增字段前确认内容适合离开 Extension.
- `npm run publish` 和任何远程发布操作都需要用户明确授权.

## Validation

在目标 Extension 目录下运行最小验证集:

```bash
npm run lint
npm run build
```

涉及纯函数, 配置解析, HTML 解析或参数规范化时, 添加一个最小可运行测试. 当前项目尚未配置测试框架, 不要只为一个简单测试引入大型依赖. 优先使用 Node.js 内置测试能力, 并同步增加明确的 npm script.

涉及 UI 导航, Clipboard, Paste 或浏览器打开行为时, 还需通过 `npm run dev` 在 Raycast 中人工验证. 涉及 AI Tool 时, 同时核对 Tool 是否出现在 manifest 中, 并验证 `ai.yaml` 的相关 Eval.

## Documentation

下列变化必须同步文档:

- manifest, Commands, Tools 或 Preferences 变化.
- Extension 列表, 目录职责或调用方向变化.
- 新增外部系统集成或安全边界.
- 开发, 构建或发布命令变化.

优先修改已有专题文档和对应 Extension README, 不为少量信息新建重复文档.
