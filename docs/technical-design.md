# Technical Design

## 1. 当前技术方案

| Area | Choice | Current version or mode |
| --- | --- | --- |
| Runtime | Raycast Extension runtime | Managed by Raycast CLI |
| Language | TypeScript | `^5.2.2` to `^5.8.2`, strict mode |
| UI | React and `@raycast/api` | Raycast API `^1.94.0` |
| Async UI | React hooks and `@raycast/utils` | `usePromise` in NSFW |
| HTTP | Native `fetch` and `got` | AI Translator uses `fetch`; My IP and NSFW use `got` |
| Local process | Node.js `child_process` | Codex Usage uses App Server over stdio |
| Local data | Node.js `fs`, `ip`, `otpauth` | TOTP file and local IP |
| Parsing | `node-html-parser` and local Parser | JavBus HTML |
| Quality gates | Node.js test runner and Raycast CLI | `node --test`, `ray lint`, `ray build` |

这套方案与当前规模匹配. 不需要新增根级 workspace, 路由框架, 状态管理库, IoC 容器或统一 Repository 层.

## 2. 设计原则

### 2.1 Extension 隔离

每个 Extension 独立拥有 manifest, lockfile, 依赖和发布生命周期. 不使用跨目录源码 import. 只有重复实现已稳定且确实需要同步演进时, 才评估共享 package.

### 2.2 单一协议边界

每个 Remote System 应由一个 Client 负责. UI 和 AI Tool 复用同一 Client, 避免参数和响应行为漂移. 简单的本地读取可以保留在单个调用方, 不为形式增加 Client.

### 2.3 Thin Tool, Stateful Hook

AI Tool 是无 UI 状态的薄适配层. Hook 只管理 Raycast 页面需要的 loading, data 和 Toast. 不把 Hook 当作可复用业务服务.

### 2.4 在信任边界验证

TypeScript 类型不会验证本地 JSON, Remote JSON 或 HTML. 不可信输入应在读取它的 Client, Parser 或本地文件边界增加最小检查和明确错误, 不把验证散落到 Component.

当前未安装 schema validation 依赖. 在出现多个复杂响应或验证逻辑重复之前, 不引入新库.

### 2.5 配置由 Raycast 托管

Preference 是用户配置入口. 用户选择的 TOTP 文件是现有的本地数据入口. 不新增 `.env` 作为第二套配置来源. Secret 和 API Key 只在对应操作中读取, 不进入 UI, Clipboard 或日志, 除非用户明确触发复制 OTP 或 URI 的 Action.

## 3. 错误与状态策略

目标行为:

- Client 抛出包含 operation 和安全状态码的 Error, 不包含敏感查询内容或完整 URL.
- Hook 捕获 Error, 结束 loading, 并显示用户可理解的 Toast.
- HTML 或 JSON 解析失败时返回明确错误, 不伪造空的成功结果.
- AI Tool 让错误向 Raycast AI 边界传播.
- 输入为空时, 在最靠近入口的位置短路, 不发送远程请求.

不新增全局错误总线. 当前局部状态, Toast 和 Raycast Tool Error 已足够.

## 4. 性能与缓存

- TOTP 数据量预期较小, 当前使用一次同步文件读取和内存过滤, 不需要数据库或缓存层.
- My IP 的公网地址请求彼此独立, 可以并行加载.
- NSFW 的搜索状态由 Hook 管理, 不增加全局响应缓存.
- JavBus 图片本地代理只服务当前运行实例, 不作为持久缓存.
- AI Translator 每次请求包含全部目标语言, 不缓存原文或结果. AI 内容解析或结构校验失败时最多重试 3 次, 网络, HTTP 和鉴权错误不重试.
- Codex Usage 每次刷新启动用户配置的 Codex CLI App Server, 读取用量后终止进程, 不持久化账号信息或响应.

只有可复现故障证明需要时, 才按 Domain 增加 timeout, 取消处理或带 TTL 的缓存. 不引入通用任务队列.

## 5. 安全设计

### 5.1 敏感材料

以下数据必须视为敏感信息:

- `authFile` 中的 TOTP Secret 和生成的 OTP.
- 用户 IP, 搜索内容, 详情 URL 和磁力链接.
- AI Translator API Key, 原文和翻译结果.
- Codex 账号用量限制和 Token Analytics.

### 5.2 日志规则

日志只允许记录 operation, 安全错误摘要和必要的非敏感状态. 禁止记录:

- Preference 完整值或本地认证文件路径.
- Cookie, TOTP Secret 或 OTP.
- IP 查询响应或用户查询内容.
- 带查询词或磁力数据的完整 URL.
- AI Translator API Key, 原文, 翻译结果或完整请求 URL.
- Codex Bin Path, 账号信息或完整 App Server 响应.

### 5.3 Clipboard, Paste 和 Browser Action

TOTP, IP, 磁力链接和翻译结果支持用户触发的 Clipboard, Paste 或 Browser Action. 这些操作是显式数据外发边界. 新增字段前必须确认内容适合离开 Extension.

## 6. 已完成的 Correctness Baseline

- TOTP 配置在本地文件边界验证, code 按 30 秒窗口刷新, 文件和 Secret 错误进入明确 UI 状态.
- My IP Remote Request 已收敛到最小 Client, Component 不再记录 IP 或查询参数.
- JavBus Client 对公开 Tool URL 执行 configured HTTPS origin 校验.
- JavBus HTML Parser 保持纯函数, 缺失字段不再生成包含 `undefined` 的伪 URL.
- AI Translator Client 校验 API URL, 目标语言数量和模型结构化响应, 并跳过与原文相同的目标语言. 结构化响应异常时, Client 在同一边界内最多重试 3 次.
- Codex Usage Client 仅执行用户配置的绝对路径, 不经过 shell, 校验 App Server 的用量限制和 Token Analytics 响应, 并设置 timeout 与输出上限.
- Codex Usage 使用纯函数生成主限额窗口 SVG 进度条和最近 30 天柱状图并嵌入 Detail, 不引入图表依赖或远程图表服务.
- `ai.yaml` 使用 root-level `instructions` 和 `evals`, Eval 使用 `callsTool` 与 mocks 描述多 Tool 链路.
- 5 个 Extension 均提供 `test` script, 覆盖 TOTP, IP response, URL trust boundary, JavBus Parser, 翻译响应边界和 Codex 用量响应解析.

## 7. 后续演进边界

仅在实际故障证明有需要时增加 Remote Request timeout, retry 或持久缓存. AI Translator 已针对模型结构化响应异常增加固定 3 次重试, 不对传输类错误重试. 修改保持在对应 Client, Parser 或本地文件读取函数, 不创建通用网络框架. UI 行为继续使用 `npm run dev` 人工验证, 不增加大规模 snapshot suite.

## 8. Raycast 契约参考

- [Manifest](https://developers.raycast.com/information/manifest)
- [Publish an Extension](https://developers.raycast.com/basics/publish-an-extension)
- [AI Extension Core Concepts](https://developers.raycast.com/ai/learn-core-concepts-of-ai-extensions)
- [Write Evals for an AI Extension](https://developers.raycast.com/ai/write-evals-for-your-ai-extension)
