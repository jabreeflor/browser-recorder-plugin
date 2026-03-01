# Browser Recorder — Claude Code Plugin

Record browser interactions as MP4 video directly from Claude Code by orchestrating Chrome DevTools MCP tools.

Unlike standalone recording tools, this plugin combines **screencast capture** with **browser automation** — you can describe interactions in plain language and get a video of Claude performing them.

## Installation

```bash
claude plugin link /path/to/browser-recorder-plugin
```

## Prerequisites

- **ffmpeg** — `brew install ffmpeg` (macOS) or `apt install ffmpeg` (Linux)
- **Chrome/Chromium** launched with remote debugging:
  ```bash
  /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
  ```
- **Chrome DevTools MCP** configured with the `--experimentalScreencast` flag:
  ```json
  {
    "chrome-devtools": {
      "type": "stdio",
      "command": "npx",
      "args": ["chrome-devtools-mcp@latest", "--experimentalScreencast"],
      "env": {}
    }
  }
  ```

## Usage

### Record a manual session

```
/record-browser
# interact with Chrome manually...
/stop-recording
```

### Record a specific page

```
/record-browser https://example.com --output demo.mp4
```

### Record with automated interactions

```
/record-browser https://example.com --actions "click login, fill username 'admin', submit the form"
```

Claude will use the MCP's `click`, `fill`, `navigate`, and other tools to perform the actions while recording.

## How It Works

1. Verifies Chrome is reachable via `list_pages`
2. Navigates to the target URL (if provided)
3. Starts recording with `screencast_start` (MCP → Puppeteer → ffmpeg)
4. Performs interactions using MCP automation tools (`click`, `fill`, `type_text`, etc.)
5. Stops recording with `screencast_stop` and saves the MP4

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `screencast_start` | Begin MP4 recording |
| `screencast_stop` | Stop recording and save |
| `list_pages` / `select_page` | Page management |
| `navigate_page` | URL navigation |
| `take_snapshot` | Get element UIDs for interaction |
| `click` / `fill` / `type_text` | Input automation |
| `press_key` / `hover` / `drag` | Advanced interactions |
| `resize_page` | Set viewport for recording |

## Project Structure

```
browser-recorder-plugin/
├── .claude/
│   ├── settings.json
│   └── skills/
│       ├── record-browser/SKILL.md    # /record-browser
│       ├── stop-recording/SKILL.md    # /stop-recording
│       └── help/SKILL.md              # Help docs
├── .claude-plugin/
│   └── plugin.json
├── package.json
└── README.md
```

## License

MIT
