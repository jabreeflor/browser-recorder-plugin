---
name: stop-recording
description: "Stop an active browser recording session and compile the captured frames into an MP4 video."
user-invocable: true
args: "[--pid-file <path>] [--meta-file <path>]"
---

# Stop Recording — Finalize Browser Recording to MP4

You are stopping an active browser recording session and compiling the captured frames into a final MP4 video.

## Parse Arguments

Parse the arguments from `$ARGUMENTS`:
- `--pid-file <path>`: custom PID file location (default: `.browser-recorder.pid` in the current directory)
- `--meta-file <path>`: custom metadata file location (default: `.browser-recorder-meta.json` in the current directory)

## Stop the Recording

1. **Find the active recorder process.** Look for the PID file (`.browser-recorder.pid`) in the current directory or the directory where the recording was started:
   ```bash
   cat .browser-recorder.pid 2>/dev/null || cat "${CLAUDE_PLUGIN_ROOT}/../.browser-recorder.pid" 2>/dev/null
   ```

2. **Send SIGTERM to gracefully stop recording:**
   ```bash
   kill -TERM <PID>
   ```
   The recorder process handles SIGTERM by:
   - Stopping the Chrome screencast
   - Compiling all captured JPEG frames into an MP4 using ffmpeg
   - Cleaning up temporary frame files
   - Removing the PID and metadata files

3. **Wait for compilation to finish.** Monitor the log:
   ```bash
   tail -f /tmp/browser-recorder.log
   ```
   Wait until you see "Video saved to:" in the output.

4. **If the PID file is missing or the process is gone**, check for the metadata file (`.browser-recorder-meta.json`) and run manual compilation:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/../scripts/recorder.js" stop --meta-file <META_FILE_PATH>
   ```

## Report to User

Tell the user:
- The recording has been stopped
- The total number of frames captured (from the log)
- Where the MP4 file was saved
- The file size of the output video
- Duration estimate based on frame count and FPS

## Important Rules

- Always verify the recording is actually running before attempting to stop.
- If no active recording is found, tell the user clearly — do not error silently.
- Never delete frame data before the MP4 compilation is confirmed successful.
- If ffmpeg fails, preserve the raw frames directory and inform the user so they can retry manually.
