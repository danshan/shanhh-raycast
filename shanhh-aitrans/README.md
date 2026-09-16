# Shanhh AI Translator

Shanhh AI Translator 使用用户配置的 OpenAI-compatible API 翻译单词, 短语和句子.

## Features

- 自动识别原文语言以及单词, 短语或句子类型.
- 单词和短语返回不同语境下的翻译, 简要用法和示例. 单词额外包含词性和常见变体.
- 句子仅返回翻译结果.
- 每次可选择 1 至 3 种目标语言, 并自动跳过与原文相同的语言.
- Footer 默认复制首选译文. 其他语境候选可从 Actions 单独复制, 复制内容不包含词性, 用法或示例.

## Preferences

在 Raycast Preferences 中配置:

- `apiBaseUrl`: OpenAI-compatible API Base URL, 例如 `https://api.example.com/v1`.
- `apiKey`: 由用户提供的 API Key, 通过 `Authorization: Bearer` 发送.
- `model`: API 暴露的模型名称.
- `targetLanguage1` 至 `targetLanguage3`: 初始化时配置最多 3 个默认目标语言. 后两个可选择 `None`, 重复项会被忽略.

原文会发送给用户配置的 API. Extension 不记录 API Key, 原文, 请求 URL 或翻译结果.

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
