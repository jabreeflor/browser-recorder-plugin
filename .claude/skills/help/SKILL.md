---
name: browser-recorder-help
description: "Explain how the browser recorder plugin works and list available commands."
user-invocable: true
hide-from-slash-command-tool: "true"
---

# Browser Recorder — Help

Explain the browser recorder plugin to the user:

## Overview

The **Browser Recorder** plugin orchestrates Chrome DevTools MCP tools to record browser interactions as MP4 video. It wraps the MCP's `screencast_start`/`screencast_stop` tools with browser automation (`click`, `fill`, `navigate`, etc.) to capture full interaction workflows in a single command.

## Available Commands

| Command | Description |
|---------|-------------|
| `/record-browser [url] [--output path.mp4] [--actions "..."]` | Start recording and optionally automate interactions |
| `/stop-recording` | Stop recording and save the MP4 |

## How It Works

1. **Connect** — Verifies Chrome is reachable via the DevTools MCP
2. **Navigate** — Opens the target URL if provided
3. **Record** — Starts `screencast_start` to capture video via ffmpeg
4. **Interact** — Automates clicks, typing, navigation using MCP tools, or waits for manual interaction
5. **Stop** — Calls `screencast_stop` to finalize the MP4

## Prerequisites

- **Chrome/Chromium** running with `--remote-debugging-port=9222`
- **Chrome DevTools MCP** configured with the `--screencast` flag
- **ffmpeg** installed and in PATH (`brew install ffmpeg`)

## Examples

**Record a manual browsing session:**
```
/record-browser
# interact with Chrome manually...
/stop-recording
```

**Record a specific page:**
```
/record-browser https://example.com --output demo.mp4
```

**Record with automated interactions:**
```
/record-browser https://example.com --actions "click the login button, fill in username 'admin', fill in password 'test', submit the form"
```

## Troubleshooting

- **"list_pages failed"** — Chrome isn't running with `--remote-debugging-port=9222`
- **"screencast_start failed"** — The MCP server needs `--screencast` flag. Check your MCP config.
- **"ffmpeg not found"** — Install with `brew install ffmpeg`
