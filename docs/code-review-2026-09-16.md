# Code Review Report

## 1. Review Baseline

- Date: 2026-09-16.
- Branch: `main`.
- HEAD: `439553e`.
- Worktree: Clean.
- Scope: 3 个 Extension 的源码, manifest, lockfile root metadata, AI 配置, 安装脚本与现有架构文档.
- Review axes: 架构边界, 设计一致性, 实现正确性, 安全性, 错误处理, 可维护性与验证能力.

本报告审查当前仓库快照, 不是相对某个 fixed point 的 diff review. 未执行发布操作, 未修改任何 Extension 源码.

### 1.1 Remediation Status

- Implementation branch: `codex/code-review-remediation`.
- Status: CR-001 至 CR-011 已按报告中的分阶段方案完成代码整改.
- Automated validation: 3 个 Extension 的 `npm test`, `npm run lint` 和 `npm run build` 均以 0 退出, 共 10 个测试通过.
- Tooling note: NSFW manifest 保留 5 条 Title Case warning, 因为公开名称需要保持 `NSFW`, `JavBus` 和 `URL` 的规范大小写.
- Residual validation: Raycast UI 导航, Clipboard, Paste, Browser Action 和 AI Tool Eval 仍需在本机 Raycast 中人工验收.

本节记录整改后的状态. 下文 Evidence 与验证观察仍对应 `main` 分支的 `439553e` 基线, 用于保留审查时的可追溯证据.

## 2. Executive Summary

当前架构方向基本正确. 3 个 Extension 保持独立, 没有跨 Extension 源码依赖, `package.json` 与 `package-lock.json` 的 root dependencies 一致. 以当前规模看, 不需要引入根级 workspace, shared package, IoC, Repository 或统一 HTTP framework.

当前主要问题不在宏观架构, 而在运行时正确性和边界约束:

1. JavBus 公开 AI Tool 可将模型输入的任意 URL 交给 `got`, 形成 SSRF 风险.
2. TOTP 只在模块加载时生成一次, Command 打开超过一个时间窗口后会展示和复制过期验证码.
3. JavBus 默认搜索类型初始化错误, 首次搜索会走错误的数据源.
4. Magnet AI Tool 颠倒了请求 URL 与 Referer, 现有 Eval 也提供了错误的 magnet endpoint.
5. 详情请求失败时多个 Hook 不会结束 loading 状态.

建议采用小步修复, 先关闭安全和正确性问题, 再收敛边界, 最后补最小测试与质量门. 不建议借此重写整个仓库.

## 3. Findings

### CR-001. P0. JavBus AI Tool 存在 SSRF 边界

**Evidence**

- `shanhh-nsfw/src/tools/get-javbus-detail.ts:34` 将 `input.url` 直接传给 Client.
- `shanhh-nsfw/src/tools/search-javbus-magnet-list.ts:23` 将 Tool 输入直接传给 Client.
- `shanhh-nsfw/src/clients/javbus-client.ts:34` 和 `:43` 对传入 URL 直接执行 `got.get`.

**Impact**

公开 AI Tool 的参数由模型调用生成. 攻击性输入可以尝试访问 loopback, LAN 或其他非 JavBus Host. 即使响应随后经过 HTML Parser, 仍然可以用于探测本机或内网服务, 并可能从结构相似的 HTML 中提取数据.

**Recommendation**

在 `javbus-client.ts` 的共享请求入口增加一个最小 URL validator. 使用标准库 `URL`, 只允许 `https:`, 且 `candidate.origin === new URL(getHost()).origin`. 所有详情, 分类, magnet 请求都经过同一入口. Tool 层不重复校验.

**Verification**

- 允许 configured JavBus origin 的合法详情和 magnet URL.
- 拒绝 `http://127.0.0.1`, `http://localhost`, private network IP, credentials URL 和不同 origin.
- 拒绝测试必须在发起网络请求前完成.

### CR-002. P1. TOTP 在 30 秒后必然过期

**Evidence**

- `shanhh-totp/src/components/totp-list.tsx:8` 在模块加载时同步读取并解析配置.
- `shanhh-totp/src/components/totp-list.tsx:10` 到 `:17` 只生成一次 OTP entry.
- `shanhh-totp/src/components/totp-list.tsx:39` 只在 React 发生其他 render 时重新计算标题, 没有 timer 驱动.

**Impact**

Command 保持打开超过一个 TOTP window 后, UI 中的 code, Paste 和 Clipboard 内容全部过期. 标题倒计时也会停止变化. 文件不存在, JSON 非法或 Secret 非法时, 模块初始化直接失败, UI 没有可恢复错误状态.

**Recommendation**

将配置读取与校验放入一个最小纯函数. Component 持有当前时间 tick, 每秒更新倒计时, 并在 window 变化时重新生成 code. `OtpConfig` 仅表示输入字段, 另建 `TotpEntry` 表示派生的 `code` 和 `uri`, 不再使用 global class declaration.

**Verification**

- Command 保持打开 65 秒, code 至少变化两次, Copy 和 Paste 始终使用当前 code.
- 覆盖空文件, 非数组 JSON, 缺失字段, 非法 Base32 和重复 Secret.

### CR-003. P1. JavBus 默认搜索类型初始化错误

**Evidence**

- `shanhh-nsfw/src/components/javbus-search-list.tsx:11` 使用 `props.searchText` 初始化 `type`.
- `shanhh-nsfw/src/clients/javbus-client.ts:16` 仅当 `type === "有码"` 时选择 censored endpoint, 其他值全部走 uncensored endpoint.

**Impact**

初次进入搜索页时, controlled Dropdown 的 value 不是任何合法 option, 且第一次请求通常错误地进入 uncensored endpoint.

**Recommendation**

使用字面量 union `"有码" | "无码"`, 默认值固定为 `"有码"`. 不增加新的状态抽象.

### CR-004. P1. Magnet AI Tool 的参数顺序和 Eval 契约错误

**Evidence**

- `shanhh-nsfw/src/clients/javbus-client.ts:41` 的签名是 `(url, referer)`.
- `shanhh-nsfw/src/hooks/use-javbus-search.ts:157` 的 UI 调用顺序正确, 即 `(magnetSearchUrl, detailUrl)`.
- `shanhh-nsfw/src/tools/search-javbus-magnet-list.ts:23` 传入 `(detailUrl, magnetSearchUrl)`, 顺序相反.
- `shanhh-nsfw/ai.yaml:61` 到 `:67` 将普通 search URL 当成 magnet AJAX URL.
- `shanhh-nsfw/ai.yaml:5` 声称详情 Tool 返回磁力链接和文件信息, 但 `JavbusDetailData` 只返回 `magnetSearchUrl`.

**Impact**

AI magnet 查询会请求详情页, 再把详情页中的 table 当成 magnet 表解析. 即使没有抛错, 返回结果也可能是空数据或伪数据. Eval 当前会把错误行为固化为预期.

**Recommendation**

先修正 Tool 调用顺序. AI workflow 应为 list -> detail -> magnet, magnet URL 必须来自 `parseJavbusDetail`. 同步改写 Instructions 和 Eval, 不允许模型根据番号猜 endpoint.

### CR-005. P2. 详情请求失败后 UI 永久 loading

**Evidence**

- `shanhh-nsfw/src/hooks/use-btsow-search.ts:69` 的 catch 未执行 `setIsLoading(false)`.
- `shanhh-nsfw/src/hooks/use-javbus-search.ts:138` 和 `:161` 存在相同行为.
- `useJarbusMagnets` 的 effect dependency 在 `:165` 只包含 `url`, 遗漏 `referer`.

**Impact**

请求失败后 Toast 出现, 但 Detail 或 List 会持续显示 loading. Referer 变化时 magnet 请求可能继续使用旧值.

**Recommendation**

将 loading 收尾放入 `finally`. dependency 同时包含 `url` 和 `referer`. 在观察到 unmount state update 问题前, 不引入通用 cancellation framework.

### CR-006. P2. `btsowHost` Preference 完全未生效

**Evidence**

- `shanhh-nsfw/package.json:40` 到 `:47` 声明 `btsowHost`, README 和 docs 也将其描述为 browser host.
- `shanhh-nsfw/src/clients/btsow-client.ts:3` 到 `:4` 固定使用 `btsow.pics` API.
- `shanhh-nsfw/src/hooks/use-btsow-search.ts:62` 和 `src/components/btsow-search-detail.tsx:67` 固定生成 `btsow.pics` browser URL.

**Impact**

用户修改 Preference 不会影响任何行为, manifest 与运行事实不一致.

**Recommendation**

如果 Preference 只控制 Browser Action, 在 Btsow Client 中规范化一次 host 并用于详情 link. API Host 保持固定. 如果该配置已无业务价值, 删除 Preference, 类型字段和相关文档. 两条路径二选一, 不保留无效配置.

### CR-007. P2. 日志违反仓库的数据安全规则

**Evidence**

- `shanhh-myip/src/components/my-ip-list.tsx:21` 和 `:33` 记录完整 IP response.
- `shanhh-myip/src/components/my-ip-detail.tsx:33` 和 `:43` 记录查询参数.
- `shanhh-nsfw/src/clients/javbus-client.ts:23`, `:33`, `:42` 记录查询或详情 URL.
- `shanhh-nsfw/src/utils/javbus-utils.ts:149` 和 `:175` 记录详情与 magnet 数据.
- `console.error(error)` 可能携带完整请求 URL.

**Impact**

IP, 搜索内容, 详情 URL 和 magnet 数据会进入本地日志, 与 `AGENTS.md` 和 `docs/technical-design.md` 的显式安全规则冲突.

**Recommendation**

删除调试日志. 必须保留错误日志时, 只记录稳定 operation id 和不包含 URL, query 或 response body 的错误摘要.

### CR-008. P2. JavBus Parser 会静默制造无效数据

**Evidence**

- `shanhh-nsfw/src/utils/javbus-utils.ts:15` 和 `:41` 将 Host 与可能为 `undefined` 的 attribute 直接拼接, 可能产生 `https://hostundefined`.
- `:23` 在缺少第二个 `date` 节点时可能访问 `undefined.text`.
- `:131` 在 `gid`, `img`, `uc` 缺失时仍生成包含 `undefined` 的 magnet URL.
- `:155` 到 `:177` 映射所有 `tr`, 包括 header 或没有 magnet link 的 row.
- Parser 依赖 Client 的 `getHost`, 因而不是纯函数.

**Impact**

上游 HTML 变化后, Parser 可能抛错, 返回伪 URL, 或生成空 magnet item. 当前没有 fixture test 捕获这些回归.

**Recommendation**

使用 `new URL(relative, baseUrl)` 解析 URL, 缺失关键字段时返回明确空值或跳过 item. 只有存在 `magnet:` href 的 row 才进入结果. Parser 显式接收 `baseUrl`, 不 import Client.

### CR-009. P2. My IP 的数据模型和 UI 状态不完整

**Evidence**

- `shanhh-myip/src/components/my-ip-detail.tsx:27` 的 value type 不包含 API 实际可能返回的 boolean 和 null.
- `:60` 使用 truthy check, 会丢弃 `false`, `0` 和空字符串等合法值.
- `shanhh-myip/src/components/my-ip-list.tsx:48` 只用 global request 控制整个 List loading, Chinese request 的状态没有参与.
- Remote Request, JSON 解包和 UI 状态全部位于 Component.

**Impact**

例如 `in_eu: false` 不会展示. 两个公网请求的 loading 和 failure 状态不一致. 网络协议变化会直接扩散到 UI.

**Recommendation**

新增一个最小 `clients/ip-client.ts`, 只放 3 个 request 和响应解包. Component 保留展示状态. 字段展示用 nullish check, 不使用 truthy check. `LoadingStatus` 移出 Component 间的反向 import.

### CR-010. P2. 仓库质量门当前不通过, 且没有可执行测试

**Observed validation**

| Extension | `npm run build` | `npm run lint` | Test script |
| --- | --- | --- | --- |
| `shanhh-totp` | Pass | Fail, 3 warnings and Prettier failure | Missing |
| `shanhh-myip` | Pass | Fail, 1 ESLint error, 2 warnings and Prettier failure | Missing |
| `shanhh-nsfw` | Pass | Fail, 7 ESLint errors, 1 source warning, manifest warnings and Prettier failure | Missing |

所有 Extension 可以编译并通过 TypeScript check, 但都未达到仓库定义的 lint gate. 仓库中没有 test file. `ray build` 没有证明 `ai.yaml` Instructions 和 Evals 已被实际加载.

**Recommendation**

行为修复完成后统一执行已有 `fix-lint` script, 再人工 review 格式 diff. 只为 TOTP 纯函数, URL validator 和 3 个 HTML Parser 增加最小可执行测试. 不添加 UI snapshot suite.

### CR-011. P3. 可删除的复杂度和命名债务

**Evidence**

- `shanhh-nsfw/src/components/javbus-search-list.tsx:100` 使用 `uuidv4()` 作为 React key, 每次 render 都会制造新 key.
- `crypto-js` 及其 types 没有源码调用方.
- `search-javbus-magnet-list.ts:1` 到 `:3` 有 3 个未使用 import.
- `extractKeywords` 先计算 extension count, 但只使用 key.
- `Jarbus`, `Magent`, `Preps`, `.dt.tsx` 等命名不准确.
- 类型与 Tool 文件包含中文代码注释, 与仓库 English-only code rule 冲突.

**Recommendation**

删除 `uuid` 和 `crypto-js` 依赖, 使用稳定业务 key. 删除未使用 import 和无意义 count. 命名修复放在对应功能修改中完成, 不单独做全仓 rename PR.

## 4. Architecture Assessment

### Strengths

- Extension 物理隔离清晰, 没有跨目录源码 import.
- 每个 Extension 独立维护 manifest, lockfile 和发布生命周期.
- NSFW 已具备 Component -> Hook -> Client -> external system 的基本结构.
- HTML Parser 已独立于 UI, 具备补纯函数测试的基础.
- 根目录没有承担运行时职责, 当前无需升级为 monorepo workspace.
- `scripts/install-all.sh` 使用 `npm ci`, `set -euo pipefail` 和进程清理, 与当前规模匹配.

### Boundary Drift

- My IP 的网络协议位于 Component.
- JavBus Parser 反向依赖 Client config.
- JavBus 本地 image proxy 位于 UI Hook, 同时承担 Server lifecycle 和 upstream protocol.
- Btsow manifest configuration 与 Client runtime 分离.
- TOTP 在 module scope 执行文件 IO 和时效性计算, 隐藏了生命周期.

总体判断: 现有目录无需推倒重来. 只需要把副作用移回已有边界, 并让 Parser 保持纯净.

## 5. Recommended Refactor Plan

### Phase 0. Security And Runtime Correctness

1. 在 JavBus Client 增加同源 HTTPS URL validator, 覆盖所有 URL request.
2. 修正 JavBus 默认 `type`, magnet Tool 参数顺序和 AI workflow.
3. 将 TOTP 文件解析提取为纯函数, 用一个 timer 驱动 code 和 countdown 刷新.
4. 为 Btsow 和 JavBus detail hooks 增加 `finally` loading 收尾.
5. 删除敏感日志.

这一阶段应拆成按 Extension 的小 commit. 风险最低, 价值最高.

### Phase 1. Boundary Alignment

1. 新增 `shanhh-myip/src/clients/ip-client.ts`, 收敛 3 个 Remote Request.
2. 让 JavBus Parser 显式接收 `baseUrl`, 使用标准 `URL` 解析相对地址.
3. 将 image proxy 移入现有 JavBus Client 边界. 只有文件明显过大时再拆独立 Client 文件.
4. 明确 `btsowHost` 的唯一语义, 选择实现或删除, 并同步 README 和 docs.

不新增通用 HTTP wrapper, service, repository, factory 或 shared package.

### Phase 2. Executable Checks And Cleanup

1. 为 TOTP config/window, JavBus URL validator 和 HTML Parser 增加最小测试.
2. 修正 `ai.yaml` Instructions 和 Evals, 在 Raycast 开发模式验证 Tool loading 和调用链.
3. 删除无调用方依赖, 不稳定 React key, 未使用 import 和多余中间数据结构.
4. 使 3 个 Extension 的 lint 和 build 全部通过.
5. 对 TOTP Clipboard/Paste, My IP navigation 和 NSFW Browser Action 做 Raycast 人工验证.

## 6. Alternative Considered

可以建立根级 workspace, shared HTTP client 和共享类型 package, 但当前只有 3 个小型且独立发布的 Extension, 重复逻辑不足以抵消发布耦合和工具链复杂度. 本次不建议采用该方案. 当至少两个 Extension 需要长期同步演进同一实现, 且重复已造成实际缺陷时再评估.

## 7. Acceptance Criteria

- 3 个 Extension 的 `npm run lint` 和 `npm run build` 全部通过.
- TOTP 打开 65 秒后仍可复制当前 window 的正确 code.
- JavBus AI Tools 在发出请求前拒绝非 configured origin.
- Magnet Tool 只使用 detail Parser 返回的 AJAX URL, 并通过更新后的 Eval.
- 所有 detail request 失败后退出 loading 并展示可理解的失败状态.
- Parser fixtures 覆盖正常 HTML, 缺失字段, 空列表和 header row.
- `btsowHost` 不再是无效 Preference.
- 日志不包含 IP, query, full URL, magnet 或 response body.
- Raycast 中完成人工 UI 和 AI Tool 验证.

## 8. Residual Risk

- 外部 Btsow API 和 JavBus HTML 属于不受控依赖, 即使有 fixture test, 上游协议变化仍需运行时观察.
- 本次没有在 Raycast UI 中执行人工导航, Clipboard, Paste 或 Browser Action 验证.
- 本次没有执行 AI Eval, 因此 `ai.yaml` 的当前加载行为仍需在 Phase 2 明确验证.
- 本次没有进行在线 dependency vulnerability audit, 不对当前依赖的 CVE 状态作结论.
