# Development

## 1. 前置条件

- macOS 和 Raycast.
- Node.js 与 npm.
- 目标数据源要求的网络访问.
- TOTP Extension 所需的本地认证文件.
- AI Translator 所需的 OpenAI-compatible API Base URL, API Key 和模型名称.
- Codex Usage 所需的 Codex CLI, 当前 ChatGPT 账号登录状态和可执行文件绝对路径.

项目没有统一的 Node.js 版本文件. 在补充版本约束前, 以各 Extension 当前 Raycast CLI 和 lockfile 可安装的版本为准, 不在文档中虚构版本.

## 2. 安装

安装并启动全部 Extension, 在仓库根目录执行:

```bash
./scripts/install-all.sh
```

脚本先依次执行每个 Extension 的 `npm ci`, 全部成功后并行运行 `npm run dev`. 进程会持续监听源码变化, 按 `Ctrl-C` 可同时停止.

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
| `shanhh-nsfw` | `btsowHost` | Btsow API and browser host | No |
| `shanhh-nsfw` | `javbusHost` | JavBus request host | No |
| `shanhh-aitrans` | `apiBaseUrl` | OpenAI-compatible API base URL | No |
| `shanhh-aitrans` | `apiKey` | Bearer API key | Yes |
| `shanhh-aitrans` | `model` | Provider model name | No |
| `shanhh-aitrans` | `targetLanguage1` | Primary default target language | No |
| `shanhh-aitrans` | `targetLanguage2` | Additional default target language or `None` | No |
| `shanhh-aitrans` | `targetLanguage3` | Additional default target language or `None` | No |
| `shanhh-openai-usage` | `codexBinPath` | Absolute path to the Codex CLI executable | No |

不要创建包含真实值的 `.env`, fixture 或文档示例. Raycast Preferences 和用户选择的本地文件是当前配置来源.

TOTP 文件是 JSON 数组, 每项包含 `account`, `website`, Base32 `secret` 和可选的 `icon`:

```json
[
  {
    "account": "user@example.com",
    "website": "Example",
    "secret": "BASE32_PLACEHOLDER",
    "icon": "example"
  }
]
```

`icon` 对应 `shanhh-totp/assets/<icon>.png`. 未指定, 名称非法或 asset 不存在时使用 `default.png`.
存量站点图标只使用可唯一确认的品牌 Logo, 并统一尺寸, 留白和圆角容器. 无法确认的网站使用 `icon: "default"`, 不通过名称猜测域名或抓取 favicon.

新增或补齐图标时使用项目 Skill `$generate-totp-icons`. 固定来源顺序为 Simple Icons, Dashboard Icons 和经过筛选的 Iconify 品牌集合. 生成只接受精确 slug 或经过审核的关键词 alias, 产物保存在 Extension 内, 不增加运行时网络请求. Skill 只输出统计信息, 不输出认证文件路径, 网站清单或 Secret.

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
npm test
npm run lint
npm run build
```

- `npm test` 使用 Node.js 内置 test runner, 覆盖该 Extension 已提取的纯逻辑.
- `npm run lint` 执行 `ray lint`.
- `npm run build` 执行该 Extension manifest 中定义的 Raycast build 命令.
- `npm run fix-lint` 会修改文件, 只在已检查 diff 后使用.

5 个 Extension 都提供 `test` script. 新增非平凡纯逻辑时, 在目标 Extension 的 `test/` 中补充最小用例, 不引入 UI snapshot framework.

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
- AI Translator 还需确认 Base URL 包含正确的 API version path, 模型名称存在, 且响应兼容 Chat Completions JSON 结构. 模型内容解析或结构校验失败会自动重试最多 3 次; HTTP, 鉴权和网络错误直接返回.
- Codex Usage 无法启动时, 使用 `command -v codex` 确认 `codexBinPath` 是可执行文件绝对路径.
- Codex Usage 返回登录或协议错误时, 先在终端确认 Codex CLI 已登录当前 ChatGPT 账号, 并升级到支持 `app-server`, `account/rateLimits/read` 和 `account/usage/read` 的版本.

### AI Tool 不可见

- 检查文件是否位于目标 Extension 的 `src/tools/`.
- 检查文件名是否与 `package.json` 的 `tools[].name` 完全一致.
- 检查 `ai.yaml` 是否使用当前 Raycast 支持的结构.
- 增加或更新对应 Eval.

### 扩展图标更新后仍显示旧背景

- My IP 和 NSFW 的 manifest 使用 `extension-icon-transparent.png`, 对应 `assets/` 下的 512 × 512 RGBA PNG.
- Raycast 可能保留同一路径的旧图标缓存. 如果源文件和已安装文件都已透明, 但界面仍显示旧背景, 使用新的图标文件名, 同步修改 `package.json` 的 `icon`, 再执行 `npm run dev` 重新加载.
- 以 Raycast 搜索结果中的实际图标为验证依据. 仅检查 PNG 的 alpha 通道或构建成功不能确认缓存已更新.
