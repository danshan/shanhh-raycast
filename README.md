# Shanhh Raycast Extensions

Personal [Raycast](https://www.raycast.com/) extensions by [@danshan](https://github.com/danshan).

## Extensions

### shanhh-toolbox

General-purpose productivity toolbox.

| Feature | Description |
|---------|-------------|
| **TOTP** | Generate 2FA codes from a local auth file. Supports search, copy OTP code, and copy OTP URI. |
| **My IP** | Show local / public Chinese / global IP addresses with IP lookup details. |

**Preferences:**

- `TOTP Auth File` - Path to a JSON file containing OTP configurations (`account`, `website`, `secret` fields).

### shanhh-feishu

Feishu (Lark) integration toolkit.

| Feature | Description |
|---------|-------------|
| **Search Docs** | Search Feishu documents. |
| **Send Message** | Send text messages via Feishu API (supports `open_id` and `user_id`). |
| **Get Contact** | Query Feishu user info (name, email, phone, department, etc.). |
| **Get Department** | Query Feishu department info (name, parent, leader, member count, etc.). |

**Preferences:**

- `App Id` - Feishu application ID.
- `App Secret` - Feishu application secret.
- `Token File` - Local file path for caching Feishu access tokens.

### shanhh-nsfw

NSFW content search toolbox.

| Feature | Description |
|---------|-------------|
| **Btsow Search** | Search magnet links via Btsow. |
| **Javbus Search** | Search and browse JAV content, view details and magnet links. |

**Preferences:**

- `Btsow Site` - Btsow mirror site URL (e.g. `https://btsow.motorcycles`).
- `JavBus Site` - JavBus mirror site URL (e.g. `https://www.javbus.com`).

## Development

Each extension is a standalone Raycast extension. To develop:

```bash
# Install dependencies for an extension
cd shanhh-toolbox && npm install

# Start development mode
npm run dev

# Build for distribution
npm run build

# Lint
npm run lint
npm run fix-lint
```

## License

MIT
