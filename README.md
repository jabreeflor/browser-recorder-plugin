# Browser Recorder — Claude Code Plugin

Record browser interactions as MP4 video directly from Claude Code.

This plugin connects to Chrome's DevTools Protocol, captures screencast frames in real-time, and compiles them into an H.264 MP4 using ffmpeg.

## Installation

```bash
claude plugin link /path/to/browser-recorder-plugin
```

Or install from GitHub:

```bash
claude plugin install browser-recorder
```

## Prerequisites

- **Node.js** v18+
- **ffmpeg** — `brew install ffmpeg` (macOS) or `apt install ffmpeg` (Linux)
- **Chrome/Chromium** launched with remote debugging:
  ```bash
  google-chrome --remote-debugging-port=9222
  # or on macOS:
  /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
  ```

## Usage

### Start Recording

```
/record-browser output.mp4
```

Options:
- `--port 9222` — Chrome DevTools port (default: 9222)
- `--fps 15` — Output video FPS (default: 10)
- `--quality 90` — JPEG capture quality 1-100 (default: 80)

### Stop Recording

```
/stop-recording
```

The recorder will compile all captured frames into the MP4 and clean up temporary files.

## How It Works

1. Connects to Chrome via WebSocket using the Chrome DevTools Protocol
2. Calls `Page.startScreencast` to stream JPEG frames from the browser
3. Saves frames sequentially to a temporary directory
4. On stop, runs ffmpeg to compile frames into H.264 MP4 (yuv420p, CRF 23)
5. Cleans up temporary frame files

## Project Structure

```
browser-recorder-plugin/
├── .claude/
│   ├── settings.json          # Plugin metadata
│   └── skills/
│       ├── record-browser/    # /record-browser skill
│       │   └── SKILL.md
│       ├── stop-recording/    # /stop-recording skill
│       │   └── SKILL.md
│       └── help/              # Help documentation
│           └── SKILL.md
├── .claude-plugin/
│   └── plugin.json            # Plugin identity
├── scripts/
│   ├── recorder.js            # Core recording engine
│   ├── start-recording.sh     # Start wrapper script
│   └── stop-recording.sh      # Stop wrapper script
├── package.json
└── README.md
```

## License

MIT
