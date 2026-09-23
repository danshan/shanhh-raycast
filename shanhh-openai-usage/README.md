# Shanhh Codex Usage

Shanhh Codex Usage 查询当前 ChatGPT 账号的 Codex 套餐用量限制和 Token Analytics.

## Features

- 展示 Codex 主用量窗口和次用量窗口, 剩余比例与重置时间使用独立字段展示. Dashboard 按窗口时长优先选取 7 天额度, 以共用百分比刻度的双进度条比较额度剩余和时间剩余, 时间条按天标注.
- 余量为额度剩余百分比减去时间剩余百分比. 差值大于 2 个百分点显示 Headroom, 小于 -2 显示 Below baseline, 其余显示 Near baseline; 额度用尽时单独提示. 时间按实际时间差计算, 每分钟本地更新; 额度仍通过 Refresh 获取, 可通过 Last Refreshed 判断数据时效.
- 刷新时间缺失, 已到期或超出窗口范围时不显示余量判断. 没有周窗口时保留普通额度条, 没有 Token 历史时仍展示额度对比.
- 在右侧展示当前可用的 Rate Limit Reset Credits 数量, 左侧仅列出每项 Credit 的过期时间.
- 展示 Lifetime Tokens, Peak Daily Tokens, Turn Duration 和 Streak.
- 以本地生成的 GitHub 风格 365 天热力图展示每日 Token 用量. 图表按 API 返回的最新 `startDate` 对齐 UTC 日历, 以周为列, 星期为行, 使用相对展示区间正值峰值的 10 级绿色强度; 明确区分零值与无记录日期, 并显示数据截止日期和图例.
- 支持手动刷新和打开 ChatGPT Codex Usage Dashboard.

## Preferences

在 Raycast Preferences 中配置 `codexBinPath`. 该值必须是已安装并登录当前 ChatGPT 账号的 Codex CLI 可执行文件绝对路径. 可在终端执行以下命令获取:

```bash
command -v codex
```

Extension 直接执行配置的 `<codexBinPath> app-server --stdio`, 通过本地 App Server 读取当前登录账号的用量. Extension 不读取 Codex 认证文件, 不要求 Admin API Key, 也不记录可执行文件路径, 账号信息或完整响应.

Codex App Server 当前属于实验性 CLI 接口. Codex CLI 升级后若协议发生不兼容变化, 需要同步更新 Extension.

## Development

```bash
npm ci
npm run dev
```

验证命令:

```bash
npm test
npm run lint
npm run build
```

发布命令 `npm run publish` 会产生远程影响, 仅在明确确认后执行.

## Documentation

- [Codex Pricing and Usage](https://learn.chatgpt.com/zh-Hans/docs/pricing)
- [Codex CLI](https://developers.openai.com/codex/cli)
- [Architecture](../docs/architecture.md)
- [Development Guide](../docs/development.md)
