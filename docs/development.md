# Development

## 1. 前置条件

- macOS 和 Raycast.
- Node.js 与 npm.
- 目标数据源要求的网络访问.
- TOTP Extension 所需的本地认证文件.

项目没有统一的 Node.js 版本文件. 在补充版本约束前, 以各 Extension 当前 Raycast CLI 和 lockfile 可安装的版本为准, 不在文档中虚构版本.

## 2. 安装

选择目标 Extension, 在其目录中安装依赖:

```bash
cd shanhh-totp
npm ci
```

每个 Extension 的 `package-lock.json` 是自身依赖解析来源. 日常安装优先使用 `npm ci`, 只有明确升级依赖时才使用会修改 lockfile 的命令.

## 3. Preferences

在 Raycast 中打开目标 Extension 的 Preferences, 配置对应字段:

| Extension | Name | Purpose | Sensitive |
| --- | --- | --- | --- |
| `shanhh-totp` | `authFile` | TOTP JSON file | Contains secrets |
| `shanhh-nsfw` | `btsowHost` | Btsow browser host | No |
| `shanhh-nsfw` | `javbusHost` | JavBus request host | No |

不要创建包含真实值的 `.env`, fixture 或文档示例. Raycast Preferences 和用户选择的本地文件是当前配置来源.

TOTP 文件是 JSON 数组, 每项包含 `account`, `website` 和 Base32 `secret`:

```json
[
  {
    "account": "user@example.com",
    "website": "Example",
    "secret": "BASE32_PLACEHOLDER"
  }
]
```

## 4. 开发

```bash
npm run dev
```

该命令运行 `ray develop`. 建议按最短路径人工验证:

1. 打开目标 Extension 的 Command.
2. 使用非敏感测试输入触发本次改动涉及的功能.
3. 检查 loading, empty, error 和 success 状态.
4. 检查导航, Clipboard, Paste 或 Browser Action.
5. 对 AI Tool 检查 manifest 声明, 输入规范化, 返回值和 `ai.yaml` Eval.

## 5. 静态验证与构建

在每个受影响的 Extension 目录中执行:

```bash
npm run lint
npm run build
```

- `npm run lint` 执行 `ray lint`.
- `npm run build` 执行该 Extension manifest 中定义的 Raycast build 命令.
- `npm run fix-lint` 会修改文件, 只在已检查 diff 后使用.

当前没有 `test` script. 非平凡纯逻辑改动应优先补充一个最小可运行测试, 再把稳定命令加入目标 `package.json`.

## 6. 发布

在目标 Extension 目录中执行:

```bash
npm run publish
```

该命令会产生远程影响. 发布前需要:

1. 确认工作树只包含目标改动.
2. 如存在 `CHANGELOG.md`, 更新对应变更记录.
3. 完成 lint, build 和相关人工验证.
4. 检查 manifest 的 Commands, Tools, Preferences 和 assets.
5. 明确确认发布目标和权限.

Agent, 本地脚本或 CI 不得在没有明确授权时自动执行发布.

## 7. Troubleshooting

### Extension 无法启动

- 确认命令在目标 Extension 目录下执行.
- 确认 `npm ci` 成功且 Raycast 已安装.
- 确认该 Extension 的 required Preferences 已配置.

### 查询持续 loading 或返回空结果

- 检查目标文件或 Remote System 是否可访问.
- 检查输入为空和异常路径是否结束 loading.
- 检查外部页面结构是否变化, 尤其是 JavBus HTML Parser.
- 检查日志前先确认没有输出 TOTP Secret, OTP, IP 或查询内容.

### AI Tool 不可见

- 检查文件是否位于目标 Extension 的 `src/tools/`.
- 检查文件名是否与 `package.json` 的 `tools[].name` 完全一致.
- 检查 `ai.yaml` 是否使用当前 Raycast 支持的结构.
- 增加或更新对应 Eval.
