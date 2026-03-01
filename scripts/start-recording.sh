#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_ROOT="$(dirname "$SCRIPT_DIR")"

# Ensure dependencies are installed
if [ ! -d "$PLUGIN_ROOT/node_modules" ]; then
  echo "Installing dependencies..."
  cd "$PLUGIN_ROOT" && npm install --silent
fi

# Check for ffmpeg
if ! command -v ffmpeg &>/dev/null; then
  echo "Error: ffmpeg is required but not installed."
  echo "Install with: brew install ffmpeg"
  exit 1
fi

# Pass all arguments through
exec node "$SCRIPT_DIR/recorder.js" start "$@"
