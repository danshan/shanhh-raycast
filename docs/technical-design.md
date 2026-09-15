# Technical Design

## 1. 当前技术方案

| Area | Choice | Current version or mode |
| --- | --- | --- |
| Runtime | Raycast Extension runtime | Managed by Raycast CLI |
| Language | TypeScript | `^5.2.2` to `^5.8.2`, strict mode |
| UI | React and `@raycast/api` | Raycast API `^1.94.0` |
| Async UI | React hooks and `@raycast/utils` | `usePromise` in NSFW |
| HTTP | `got` | My IP and NSFW |
| Local data | Node.js `fs`, `ip`, `otpauth` | TOTP file and local IP |
| Parsing | `node-html-parser` and local Parser | JavBus HTML |
| Quality gates | Raycast CLI lint and build | `ray lint`, `ray build` |

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

Preference 是用户配置入口. 用户选择的 TOTP 文件是现有的本地数据入口. 不新增 `.env` 作为第二套配置来源. Secret 只在生成 TOTP 时读取, 不进入 UI, Clipboard 或日志, 除非用户明确触发复制 OTP 或 URI 的 Action.

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

只有可复现故障证明需要时, 才按 Domain 增加 timeout, 取消处理或带 TTL 的缓存. 不引入通用任务队列.

## 5. 安全设计

### 5.1 敏感材料

以下数据必须视为敏感信息:

- `authFile` 中的 TOTP Secret 和生成的 OTP.
- 用户 IP, 搜索内容, 详情 URL 和磁力链接.

### 5.2 日志规则

日志只允许记录 operation, 安全错误摘要和必要的非敏感状态. 禁止记录:

- Preference 完整值或本地认证文件路径.
- Cookie, TOTP Secret 或 OTP.
- IP 查询响应或用户查询内容.
- 带查询词或磁力数据的完整 URL.

### 5.3 Clipboard, Paste 和 Browser Action

TOTP, IP 和磁力链接支持用户触发的 Clipboard, Paste 或 Browser Action. 这些操作是显式数据外发边界. 新增字段前必须确认内容适合离开 Extension.

## 6. 已确认的问题与处理顺序

以下内容是当前源码状态, 不是已完成的改动:

| Priority | Finding | Impact | Recommended minimum change |
| --- | --- | --- | --- |
| P1 | TOTP 文件在模块加载时同步解析, 生成结果不会随 30 秒窗口主动刷新 | 文件错误会阻止 Command 启动, OTP 可能过期 | 将读取和生成放入可刷新状态, 增加最小输入检查 |
| P1 | My IP 的 Remote Request 和日志位于 Component | UI, 协议和个人数据边界耦合 | 提取最小 Client, 删除 IP 和参数日志 |
| P1 | `ai.yaml` 使用额外的 `ai` 根节点 | 需要确认当前 Raycast 是否能加载 Instructions 和 Evals | 在开发模式确认后, 再按当前官方格式对齐 |
| P2 | JavBus 依赖外部 HTML 结构且没有 Parser 回归检查 | 页面变化会导致静默缺字段或解析失败 | 使用脱敏的最小 HTML fixture 覆盖 3 个 Parser |
| P2 | 当前 3 个 Extension 都没有自动化测试和 `test` script | TOTP 和 Parser 回归只能人工发现 | 优先使用 Node.js 内置测试覆盖纯逻辑 |

修复顺序建议为 Runtime correctness, AI manifest consistency, Tests. 不把这些修复与目录重构合并.

## 7. 演进方案

### Phase 1: Correctness baseline

- 让 TOTP 在有效时间窗口刷新, 并对本地文件给出明确错误.
- 将 My IP Remote Request 收敛到最小 Client, 删除个人数据日志.
- 确认 `ai.yaml` 被 Raycast 正确加载.

### Phase 2: Small executable checks

- 使用 Node.js 内置测试能力覆盖 TOTP 配置和 HTML Parser.
- 为 AI Tool 输入规范化保留最小用例.
- 不为 UI 展示细节创建大规模 snapshot suite.

### Phase 3: Boundary hardening

仅在实际故障证明有需要时增加 Remote Request timeout, response guard 和取消处理. 修改保持在对应 Client, Parser 或本地文件读取函数, 不创建通用网络框架.

## 8. Raycast 契约参考

- [Manifest](https://developers.raycast.com/information/manifest)
- [Publish an Extension](https://developers.raycast.com/basics/publish-an-extension)
- [AI Extension Core Concepts](https://developers.raycast.com/ai/learn-core-concepts-of-ai-extensions)
- [Write Evals for an AI Extension](https://developers.raycast.com/ai/write-evals-for-your-ai-extension)
