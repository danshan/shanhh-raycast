# Documentation

本目录描述 `shanhh-raycast` 的当前实现和可执行的演进边界. 各 Extension 的源码和 `package.json` 是运行事实来源, 文档用于解释结构, 决策和开发流程.

## 文档索引

- [architecture.md](./architecture.md): 当前框架, Extension 边界, 数据流和外部系统集成.
- [directory-structure.md](./directory-structure.md): 当前目录职责, 文件命名和新增功能的落位规则.
- [technical-design.md](./technical-design.md): 技术方案, 安全边界, 已知问题和演进顺序.
- [development.md](./development.md): 本地配置, 开发, 验证和发布流程.

## 阅读顺序

首次参与开发时, 先读 `architecture.md` 和 `development.md`. 修改模块边界或新增功能时, 再读 `directory-structure.md` 和 `technical-design.md`.

## 维护原则

- 文档只描述已存在的能力或已明确的演进约束, 不把设想写成已实现事实.
- Extension, manifest, AI Tool 或 Preference 变化时, 同步更新本文档索引关联的内容和对应 Extension README.
- 架构图保持在 Extension 和模块级, 不复制每个类型和字段.
- 真实 TOTP Secret, OTP, 查询内容和个人数据不得进入文档.
