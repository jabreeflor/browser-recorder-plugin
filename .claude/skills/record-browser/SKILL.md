---
name: record-browser
description: "Record browser interactions as an MP4 video using Chrome DevTools Protocol screencast."
user-invocable: true
args: "<output-path.mp4> [--port <CDP_PORT>] [--fps <N>] [--quality <1-100>]"
---

# Record Browser — Start Capturing Browser Interactions as MP4

You are starting a browser recording session. This captures all visual activity in a Chrome/Chromium browser tab and compiles it into an MP4 video file.

## Parse Arguments

Parse the arguments from `$ARGUMENTS`:
- First positional argument: output file path (default: `recording.mp4` in the current working directory)
- `--port <N>`: Chrome DevTools Protocol port (default: `9222`)
- `--fps <N>`: frames per second for the output video (default: `10`)
- `--quality <N>`: JPEG capture quality 1-100 (default: `80`)

## Prerequisites Check

Before starting, verify these requirements:

1. **ffmpeg** must be installed. Check with `which ffmpeg`. If missing, tell the user to install it (`brew install ffmpeg` on macOS).
2. **Chrome must be running with remote debugging enabled.** Check if port 9222 (or the specified port) is listening:
   ```
   lsof -i :<port> | grep LISTEN
   ```
   If Chrome is not running with debugging, instruct the user to launch it:
   ```
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
   ```
   Or for Chromium:
   ```
   chromium --remote-debugging-port=9222
   ```
3. **Plugin dependencies** must be installed. Run `npm install` in the plugin root if `node_modules/` is missing.

## Start Recording

Once prerequisites are confirmed, start the recorder as a background process:

```bash
nohup "${CLAUDE_PLUGIN_ROOT}/../scripts/start-recording.sh" --port <PORT> --output <OUTPUT_PATH> --fps <FPS> --quality <QUALITY> > /tmp/browser-recorder.log 2>&1 &
```

After launching, confirm the recording is active by:
1. Checking the PID file exists (`.browser-recorder.pid` next to the output path)
2. Tailing the log: `tail -5 /tmp/browser-recorder.log`

## Report to User

Tell the user:
- Recording has started
- Where the output MP4 will be saved
- How to stop: use `/stop-recording` or `kill -TERM $(cat .browser-recorder.pid)`
- The recording captures the active browser tab at the configured FPS
- They should interact with the browser normally — all visual changes are being captured

## Important Rules

- Never start recording without confirming Chrome is reachable on the debugging port.
- Always run the recorder in the background so the user can continue working.
- If the recorder fails to connect, surface the error clearly and suggest fixes.
- Do not modify browser state or navigate pages unless the user explicitly asks.
