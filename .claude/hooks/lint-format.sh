#!/usr/bin/env bash
set -euo pipefail

input=$(cat)

file_path=$(printf '%s' "$input" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" 2>/dev/null || true)

if [[ -z "$file_path" ]]; then
  exit 0
fi

case "$file_path" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.json|*.jsonc|*.css)
    ;;
  *)
    exit 0
    ;;
esac

if [[ ! -f "$file_path" ]]; then
  exit 0
fi

monorepo_root="$(cd "$(dirname "$0")/../.." && pwd)"

cd "$monorepo_root"
exec bun biome check --write --no-errors-on-unmatched --files-ignore-unknown=true "$file_path"
