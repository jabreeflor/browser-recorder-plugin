---
name: browser-recorder-help
description: "Explain how the browser recorder plugin works and list available commands."
user-invocable: true
hide-from-slash-command-tool: "true"
---

# Browser Recorder — Help

Explain the browser recorder plugin to the user. Present this information clearly:

## Overview

The **Browser Recorder** plugin captures browser interactions as MP4 video by connecting to Chrome's DevTools Protocol. It uses the screencast API to capture frames in real-time, then compiles them with ffmpeg.

## Available Commands

| Command | Description |
|---------|-------------|
| `/record-browser <output.mp4>` | Start recording the active browser tab |
| `/stop-recording` | Stop recording and compile to MP4 |

## How It Works

1. **Connect** — The recorder connects to Chrome via the DevTools Protocol (CDP) on the configured port
2. **Capture** — Chrome's `Page.startScreencast` API streams JPEG frames to the recorder
3. **Store** — Frames are saved to a temporary directory as sequentially numbered JPEGs
4. **Compile** — When stopped, ffmpeg stitches the frames into an H.264 MP4 with yuv420p pixel format
5. **Clean up** — Temporary frames are deleted after successful compilation

## Prerequisites

- **Google Chrome or Chromium** launched with `--remote-debugging-port=9222`
- **ffmpeg** installed (`brew install ffmpeg`)
- **Node.js** (v18+)

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--port` | `9222` | Chrome DevTools Protocol port |
| `--fps` | `10` | Output video frames per second |
| `--quality` | `80` | JPEG capture quality (1-100) |
| `--output` | `recording.mp4` | Output file path |

## Example Workflow

```
1. Launch Chrome: google-chrome --remote-debugging-port=9222
2. Start recording: /record-browser demo.mp4 --fps 15
3. Interact with the browser...
4. Stop recording: /stop-recording
5. Video saved to demo.mp4
```

## Troubleshooting

- **"Cannot connect to Chrome"** — Ensure Chrome is running with `--remote-debugging-port=9222`
- **"ffmpeg not found"** — Install with `brew install ffmpeg` (macOS) or `apt install ffmpeg` (Linux)
- **Low quality video** — Increase `--quality` (up to 100) and `--fps` (up to 30)
- **Large file size** — Decrease `--fps` or `--quality`
