---
name: stop-recording
description: "Stop an active browser screencast and save the MP4 video."
user-invocable: true
---

# Stop Recording — Finalize Active Screencast

You are stopping an active browser recording session.

## Steps

1. **Stop the screencast.** Call `mcp__chrome-devtools__screencast_stop`. This tells Chrome to stop capturing frames and ffmpeg to finalize the MP4.

2. **Verify the output.** The stop command returns the file path. Check it exists:
   ```bash
   ls -lh <output-path>
   ```

3. **Report to the user:**
   - Confirm the recording has stopped
   - Where the MP4 was saved
   - File size
   - Suggest playback: `open <path>` (macOS) or `xdg-open <path>` (Linux)

## Important Rules

- If no screencast is active, tell the user clearly — do not error silently.
- If the stop command fails, report the error and suggest the user check if Chrome is still connected.
