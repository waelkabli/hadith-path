#!/usr/bin/env bash
# Pixel-diff a single screen between Figma and the running dev server.
#
# Usage:
#   ./scripts/diff-screen.sh <screen-id> <figma-node-id> <browser-url>
#
# Example:
#   ./scripts/diff-screen.sh S09 110-26 "http://localhost:3001/dashboard"
#
# Prerequisites:
#   - imagemagick    (sudo apt-get install imagemagick  OR  brew install imagemagick)
#   - chromium-browser / google-chrome  (sudo apt-get install chromium-browser)
#   - Dev server running on port 3001   (bun run --cwd apps/web dev)
#   - Figma screenshot saved first:
#       Call get_screenshot MCP (fileKey=YEoHvVaOWzsHF9EYUvltmZ, nodeId=<figma-node-id>)
#       and save the result to screenshots/figma-<screen-id>.png

set -euo pipefail

SCREEN="${1:?Usage: $0 <screen-id> <figma-node-id> <url>}"
NODE="${2:?Usage: $0 <screen-id> <figma-node-id> <url>}"
URL="${3:?Usage: $0 <screen-id> <figma-node-id> <url>}"
DIR="screenshots"

mkdir -p "$DIR"

FIGMA_PNG="$DIR/figma-$SCREEN.png"
BROWSER_PNG="$DIR/browser-$SCREEN.png"
DIFF_PNG="$DIR/diff-$SCREEN.png"

# ── 1. Check Figma screenshot exists ─────────────────────────────────────────
if [ ! -f "$FIGMA_PNG" ]; then
  echo "[!] Missing $FIGMA_PNG"
  echo "    Take it via the Figma MCP get_screenshot tool:"
  echo "      fileKey = YEoHvVaOWzsHF9EYUvltmZ"
  echo "      nodeId  = $NODE  (use colons: ${NODE//-/:})"
  echo "    Save the output PNG to $FIGMA_PNG then re-run."
  exit 1
fi

# ── 2. Browser screenshot ─────────────────────────────────────────────────────
echo "→ Taking browser screenshot ($URL) …"
CHROME_BIN=""
for bin in chromium-browser google-chrome chromium; do
  if command -v "$bin" &>/dev/null; then
    CHROME_BIN="$bin"
    break
  fi
done

if [ -z "$CHROME_BIN" ]; then
  echo "[!] No Chrome/Chromium found. Install with:"
  echo "    sudo apt-get install -y chromium-browser   # Debian/WSL"
  echo "    brew install --cask google-chrome          # macOS"
  exit 1
fi

"$CHROME_BIN" \
  --headless \
  --disable-gpu \
  --no-sandbox \
  --disable-dev-shm-usage \
  --screenshot="$BROWSER_PNG" \
  --window-size=1440,900 \
  "$URL" 2>/dev/null

echo "   Saved → $BROWSER_PNG"

# ── 3. Pixel diff ─────────────────────────────────────────────────────────────
echo "→ Diffing …"

# Resize browser screenshot to match Figma screenshot dimensions (in case of
# DPR differences) before comparing.
FIGMA_SIZE=$(magick identify -format "%wx%h" "$FIGMA_PNG")
magick "$BROWSER_PNG" -resize "$FIGMA_SIZE!" "$BROWSER_PNG"

RMSE_RAW=$(magick compare -metric RMSE "$FIGMA_PNG" "$BROWSER_PNG" "$DIFF_PNG" 2>&1 || true)
RMSE=$(echo "$RMSE_RAW" | grep -oE '^[0-9]+(\.[0-9]+)?' | head -1)

echo "   RMSE: $RMSE"
echo "   Diff → $DIFF_PNG"

# ── 4. Result ─────────────────────────────────────────────────────────────────
PASS_THRESHOLD="2.0"
if [ -n "$RMSE" ] && (( $(echo "$RMSE < $PASS_THRESHOLD" | bc -l 2>/dev/null || echo 0) )); then
  echo ""
  echo "   ✓ PASS  ($SCREEN RMSE $RMSE < $PASS_THRESHOLD)"
else
  echo ""
  echo "   ✗ FAIL  ($SCREEN RMSE $RMSE ≥ $PASS_THRESHOLD)"
  echo "   Open $DIFF_PNG to see highlighted discrepancies."
  echo "   Then fix code (Edit tool) or Figma (use_figma MCP) and re-run."
  exit 1
fi
