# Shanhh TOTP

Shanhh TOTP 从本地 JSON 文件生成 TOTP, 并提供搜索, Paste, 复制 OTP 和复制 OTP URI 的 Action.

## Preferences

| Name | Purpose |
| --- | --- |
| `authFile` | 包含 TOTP 配置的本地 JSON 文件 |

文件格式:

```json
[
  {
    "account": "user@example.com",
    "website": "Example",
    "secret": "BASE32_PLACEHOLDER"
  }
]
```

该文件包含可生成 OTP 的 Secret. 不要提交, 分享或记录文件内容.

## Development

```bash
npm ci
npm run dev
```

验证命令:

```bash
npm run lint
npm run build
```

发布命令 `npm run publish` 会产生远程影响, 仅在明确确认后执行.

## Documentation

- [Architecture](../docs/architecture.md)
- [Development Guide](../docs/development.md)
