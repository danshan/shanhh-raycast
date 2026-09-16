#!/usr/bin/env bash

set -euo pipefail

readonly repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
readonly npm_cache="${TMPDIR:-/tmp}/shanhh-raycast-npm-cache"
readonly extensions=(shanhh-totp shanhh-myip shanhh-nsfw shanhh-aitrans shanhh-openai-usage)

for extension in "${extensions[@]}"; do
  printf 'Installing %s...\n' "$extension"
  (cd "$repo_root/$extension" && npm ci --no-audit --no-fund --cache "$npm_cache")
done

pids=()
cleanup() {
  local status=$?

  trap - EXIT INT TERM
  if ((${#pids[@]})); then
    kill "${pids[@]}" 2>/dev/null || true
    wait "${pids[@]}" 2>/dev/null || true
  fi
  exit "$status"
}
trap cleanup EXIT INT TERM

for extension in "${extensions[@]}"; do
  printf 'Starting %s...\n' "$extension"
  (cd "$repo_root/$extension" && exec npm run dev) &
  pids+=("$!")
done

printf 'All extensions are running. Press Ctrl-C to stop.\n'
wait
