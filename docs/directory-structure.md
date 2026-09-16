# Directory Structure

## 1. 当前目录

```text
.
├── .agents/
│   └── skills/
│       └── generate-totp-icons/
├── AGENTS.md
├── docs/
│   ├── README.md
│   ├── architecture.md
│   ├── code-review-2026-09-16.md
│   ├── development.md
│   ├── directory-structure.md
│   └── technical-design.md
├── scripts/
│   └── install-all.sh
├── shanhh-aitrans/
├── shanhh-myip/
├── shanhh-nsfw/
├── shanhh-openai-usage/
└── shanhh-totp/
```

每个 Extension 是独立 npm package. 较完整的 Extension 使用以下结构, 简单 Extension 只保留实际需要的目录:

```text
<extension>/
├── ai.yaml
├── assets/
├── CHANGELOG.md
├── package.json
├── package-lock.json
├── README.md
├── test/
├── tsconfig.json
└── src/
    ├── clients/
    ├── components/
    ├── hooks/
    ├── index.tsx
    ├── tools/
    ├── types/
    └── utils/
```

当前目录数量足以支撑项目规模. 不建议引入 workspace, `services/`, `repositories/`, `domain/` 或跨 Extension 的 `shared/`.

## 2. 文件职责

| Path | Responsibility | Must not contain |
| --- | --- | --- |
| `.agents/skills/` | 项目专用的可重复 Agent 工作流和确定性辅助脚本 | 用户凭据, 私有配置副本 |
| `<extension>/package.json` | Raycast manifest, npm scripts and dependencies | Real credentials |
| `scripts/install-all.sh` | 安装依赖并启动全部本地 Extension | 发布命令, 真实凭据 |
| `src/index.tsx` | Command 入口和一级导航 | 认证材料, 大段协议实现 |
| `src/components/` | Raycast UI, 导航和用户 Action | Secret, Cookie, 认证头 |
| `src/hooks/` | UI 异步状态和错误反馈 | 重复的 Host 和协议实现 |
| `src/clients/` | 单个远程系统或本地进程的协议边界 | Raycast UI 组件 |
| `src/tools/` | AI Tool 输入和 Client 适配 | 重复 Client 逻辑, UI 状态 |
| `src/types/` | API DTO 和 Preferences 类型 | 运行时副作用 |
| `src/utils/` | 纯转换, Parser 和局部 trust-boundary helper | 页面状态和导航 |
| `test/` | Node.js 内置测试覆盖纯逻辑 | Raycast UI snapshot |
| `assets/` | manifest 资源和内置图标 | 用户凭据或运行时生成文件 |

## 3. 命名规则

保持目标 Extension 的当前命名方式, 避免无收益的批量重命名:

- Client: `<domain>-client.ts`.
- Hook: `use-<domain>.ts`.
- Component: `<domain>-<purpose>.tsx`.
- AI Tool: 与 manifest 的 `<tool-name>.ts` 完全一致.
- 类型文件使用 `.ts`, 只有包含 JSX 的文件使用 `.tsx`.
- Magnet 相关文件和标识符使用 `magnet`, 不使用 `magent` 或 `Jarbus`.

## 4. 新功能落位

新增一个远程查询能力时, 按需增加文件, 不要求凑齐所有层:

1. 在现有 Domain Client 中增加 API operation. 只有 Remote Host 或协议模型不同才新增 Client.
2. 需要 UI 状态时增加或扩展 Hook.
3. 需要新页面时增加 Component, 否则复用现有 List 或 Detail.
4. 需要 AI 能力时增加 Tool, 并同步 manifest 和 Eval.
5. 仅当外部响应引入新结构时增加类型.

示例目标结构:

```text
src/
├── clients/example-client.ts
├── components/example-list.tsx
├── hooks/use-example.ts
├── tools/search-example.ts
└── types/example.dt.ts
```

如果能力只被 AI Tool 使用, 可以只有 Client, Tool 和类型. 如果能力只做本地格式转换, 可以只有 Utility 和调用方.

## 5. 何时调整目录

只有出现以下事实之一时才引入新的边界:

- 同一业务编排被多个 Hook 和 Tool 重复实现.
- 一个 Client 同时连接多个独立 Host 或协议模型.
- 单个 Component 同时承担查询, 状态机和多个独立页面布局, 已无法局部验证.
- 类型文件因多个版本协议发生明确冲突.
- 两个 Extension 存在稳定且同步演进的重复实现, 并且独立发布边界允许共享 package.

目录调整必须同时更新 `architecture.md`, 本文件和受影响的 import.
