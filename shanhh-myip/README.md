# Shanhh My IP

Shanhh My IP 展示本地 IPv4, 国内公网出口 IP 和全球公网出口 IP, 并通过 `ipapi.co` 查询 IP 详情.

## Features

- 复制本地和公网 IP.
- 查看城市, 地区, 时区, ASN 和组织等 IP 详情.
- 在浏览器中打开 IP 查询页面.

该 Extension 不需要 Preferences. 网络查询依赖 `api64.ipify.org`, `myip.ipip.net` 和 `ipapi.co` 可访问.

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
