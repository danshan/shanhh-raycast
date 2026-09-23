# Shanhh NSFW

Shanhh NSFW 提供 Btsow 和 JavBus 搜索, 详情及磁力链接能力, 并暴露部分 Raycast AI Tools.

## Features

- 搜索 Btsow 内容并查看磁力详情.
- 搜索和浏览 JavBus 列表与详情.
- 获取 JavBus 磁力链接.
- 通过 Raycast AI 调用 JavBus 查询 Tools.

扩展图标使用 `assets/extension-icon-transparent.png`, 为带透明边角的 512 × 512 RGBA PNG. 图标资源更新与缓存处理见开发指南.

## Preferences

| Name | Purpose |
| --- | --- |
| `btsowHost` | Btsow API and browser host |
| `javbusHost` | JavBus request host |

两个 Host 都必须使用 HTTPS 和有效域名. JavBus 详情与磁力请求只允许访问 `javbusHost` 的同源 URL. 使用者负责确认目标站点的访问权限和内容合规性.

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

修改 HTML Parser 时, 使用脱敏的最小 fixture 验证列表, 详情和磁力链接. 修改 AI Tool 时, 同步检查 `package.json`, `src/tools/` 和 `ai.yaml` Evals.

发布命令 `npm run publish` 会产生远程影响, 仅在明确确认后执行.

## Documentation

- [Architecture](../docs/architecture.md)
- [Technical Design](../docs/technical-design.md)
- [Development Guide](../docs/development.md)
