# Shanhh TOTP

Shanhh TOTP 从本地 JSON 文件生成 TOTP, 并提供搜索, Paste, 复制 OTP 和复制 OTP URI 的 Action.

列表图标由可选的 `icon` 字段指定. `icon: "google"` 会读取内置的 `google.png`. 未指定, 名称非法或对应 asset 不存在时使用 `default.png`.

内置站点图标使用可唯一确认的品牌 Logo, 并统一为相同尺寸, 留白和圆角容器. 无法可靠确认对应网站时不生成猜测图标, 配置直接使用 `default`.

图标补齐通过项目 Skill `$generate-totp-icons` 执行. 来源顺序为 Simple Icons, Dashboard Icons 和经过筛选的 Iconify 品牌集合. 该流程只接受精确 slug 或经过审核的关键词 alias, 并生成本地 PNG, 不在 Extension 运行时访问外部图标服务.

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
    "secret": "BASE32_PLACEHOLDER",
    "icon": "example"
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
npm test
npm run lint
npm run build
```

发布命令 `npm run publish` 会产生远程影响, 仅在明确确认后执行.

## Documentation

- [Architecture](../docs/architecture.md)
- [Development Guide](../docs/development.md)
