# Shanhh Raycast Extension Store

这是个人使用的 Raycast Extension Store. 当前仓库包含 3 个彼此独立的 Extension.

| Extension | Capability | AI Tools |
| --- | --- | --- |
| [`shanhh-totp`](./shanhh-totp) | 从本地配置生成, 搜索和复制 TOTP | No |
| [`shanhh-myip`](./shanhh-myip) | 查看本地, 国内出口和全球出口 IP, 并查询 IP 详情 | No |
| [`shanhh-nsfw`](./shanhh-nsfw) | 搜索 Btsow 和 JavBus 内容及磁力链接 | Yes |

## 快速开始

前置条件:

- macOS 上已安装 Raycast.
- 已安装项目要求的 Node.js 和 npm.
- 已准备目标 Extension 所需的本地文件和网络访问条件.

每个 Extension 都有独立的 manifest, lockfile 和依赖目录. 进入目标目录后执行:

```bash
cd shanhh-totp
npm ci
npm run dev
```

安装并启动全部 Extension, 在仓库根目录执行:

```bash
./scripts/install-all.sh
```

首次启动时, 在 Raycast Preferences 中填写对应 Extension 的配置. 不要把 TOTP Secret, 个人数据或敏感查询结果写入仓库, Issue, 日志或截图.

## 常用命令

所有命令都在目标 Extension 目录下执行.

```bash
npm run dev
npm run lint
npm run build
```

`npm run publish` 会触发远程发布流程, 仅在明确确认版本和发布目标后执行.

## 仓库结构

```text
.
├── AGENTS.md
├── docs/
├── scripts/
├── shanhh-myip/
├── shanhh-nsfw/
└── shanhh-totp/
```

详细设计和开发约定见 [`docs/README.md`](./docs/README.md). 各 Extension 的配置与使用方式见其目录下的 `README.md`.

## 当前边界

- 3 个 Extension 独立安装, 开发, 构建和发布, 仓库根目录不提供统一 npm workspace 命令.
- 用户配置由 Raycast Preferences 注入. TOTP 配置通过用户选择的本地文件读取.
- 当前没有自动化测试脚本. 最低验证基线是目标 Extension 的 `npm run lint` 和 `npm run build`.
- 发布不是日常验证步骤, 不应由 Agent 或 CI 自动触发.

## 参考资料

- [Raycast Extension Manifest](https://developers.raycast.com/information/manifest)
- [Raycast Developer Tools](https://developers.raycast.com/information/developer-tools)
- [Raycast AI Extensions](https://developers.raycast.com/ai/learn-core-concepts-of-ai-extensions)

## License

MIT
