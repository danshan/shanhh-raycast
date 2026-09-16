---
name: generate-totp-icons
description: Generate consistent local logo assets for the shanhh-totp extension and update its private JSON configuration. Use when TOTP website icons are missing, defaulted, or need regeneration.
---

# Generate TOTP Icons

Generate local `128x128` PNG assets without exposing TOTP accounts, secrets, or the auth file path.

## Workflow

1. Read the repository `AGENTS.md`, `docs/README.md`, `shanhh-totp/README.md`, and `shanhh-totp/package.json`.
2. Obtain the configured TOTP JSON path from the user or the active Raycast preference. Never print the path or file contents.
3. Prepare current source data in a temporary directory:

```bash
git clone --depth 1 https://github.com/simple-icons/simple-icons.git "$TMPDIR/simple-icons"
git clone --depth 1 https://github.com/homarr-labs/dashboard-icons.git "$TMPDIR/dashboard-icons"
npm install --prefix "$TMPDIR/iconify" --cache "$TMPDIR/npm-cache" --no-audit --no-fund @iconify/json@latest
```

4. Run the bundled script without `--apply`. Review only its aggregate counts:

```bash
python3 .agents/skills/generate-totp-icons/scripts/generate_totp_icons.py \
  --config "$TOTP_AUTH_FILE" \
  --assets shanhh-totp/assets \
  --simple-icons "$TMPDIR/simple-icons/icons" \
  --dashboard-icons "$TMPDIR/dashboard-icons/svg" \
  --iconify-json "$TMPDIR/iconify/node_modules/@iconify/json/json"
```

5. Apply exact slug matches or the script's reviewed keyword aliases by rerunning with `--apply`. The matching priority is Simple Icons, Dashboard Icons, then selected Iconify brand collections. Ambiguous or unmatched names remain `default`.
6. Inspect a representative sample of newly generated PNG files. Reject wordmarks, product variants, or visually incorrect matches and restore those entries to `default`.
7. Verify every configured non-default icon exists, then run `npm test`, `npm run lint`, and `npm run build` in `shanhh-totp`.

## Constraints

- Do not use favicons, fuzzy matching, guessed domains, or arbitrary search results. Add a keyword alias only when the brand mapping is explicit and stable.
- Do not add runtime network access. Generated PNG files must be bundled in `shanhh-totp/assets`.
- Keep the existing rounded light container, padding, and aspect-ratio-preserving logo treatment.
- Do not overwrite an existing non-default icon unless regeneration is explicitly requested.
- Do not commit the private TOTP JSON file or include its site names in reports.
- Review upstream licenses and trademark terms before distributing newly sourced assets.
