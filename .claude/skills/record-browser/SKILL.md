---
name: record-browser
description: "Record browser interactions as MP4 video by orchestrating Chrome DevTools MCP screencast, navigation, and input tools."
user-invocable: true
args: "[url] [--output <path.mp4>] [--actions <description>]"
---

# Record Browser — Capture Browser Interactions as MP4

You are orchestrating a browser recording session using the Chrome DevTools MCP tools. You will start a screencast, perform browser interactions, and stop the screencast to produce an MP4 video.

## Parse Arguments

Parse arguments from `$ARGUMENTS`:
- First positional argument (optional): URL to navigate to before recording
- `--output <path>`: output MP4 file path (default: `recording.mp4` in the current working directory)
- `--actions <description>`: natural language description of interactions to perform during recording

If no arguments are provided, start recording the current browser state and wait for the user to tell you when to stop.

## Phase 1: Setup

1. **Verify Chrome is connected.** Call `mcp__chrome-devtools__list_pages` to confirm the MCP can reach the browser. If this fails, tell the user:
   - Chrome must be running with `--remote-debugging-port=9222`
   - On macOS: `/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222`
   - The Chrome DevTools MCP server must be running with the `--experimentalScreencast` flag

2. **Select the target page.** If multiple pages are open, use `mcp__chrome-devtools__list_pages` and either:
   - Use the page matching the requested URL
   - Ask the user which page to record
   - Default to the currently selected page

3. **Navigate if a URL was provided.** Use `mcp__chrome-devtools__navigate_page` to go to the target URL. Wait for the page to load.

4. **Set viewport if needed.** Use `mcp__chrome-devtools__resize_page` to ensure a clean recording resolution (1280x720 is a good default if the user hasn't specified).

## Phase 2: Record

1. **Start the screencast.** Call `mcp__chrome-devtools__screencast_start` with the output path. Note the file path returned — this is where the MP4 will be saved.

2. **Perform interactions.** If `--actions` was provided or the user described what to do, execute the interactions using MCP tools:
   - `mcp__chrome-devtools__navigate_page` — go to URLs
   - `mcp__chrome-devtools__click` — click elements (use `take_snapshot` first to get UIDs)
   - `mcp__chrome-devtools__fill` — type into form fields
   - `mcp__chrome-devtools__type_text` — type with keyboard
   - `mcp__chrome-devtools__press_key` — press keyboard shortcuts
   - `mcp__chrome-devtools__hover` — hover over elements
   - `mcp__chrome-devtools__drag` — drag and drop
   - `mcp__chrome-devtools__upload_file` — upload files
   - `mcp__chrome-devtools__handle_dialog` — handle alerts/confirms/prompts
   - `mcp__chrome-devtools__evaluate_script` — run JavaScript

   Before interacting with elements, always call `mcp__chrome-devtools__take_snapshot` to get the current page structure and element UIDs.

   Add brief pauses between interactions (1-2 seconds) so the recording captures each step clearly.

3. **If no actions were specified**, tell the user the recording is active and they can:
   - Interact with the browser manually
   - Tell you specific actions to perform
   - Say "stop" or use `/stop-recording` when done

## Phase 3: Finalize

1. **Stop the screencast.** Call `mcp__chrome-devtools__screencast_stop`. This compiles the video and saves the MP4.

2. **Verify the output.** Check the file exists and report its path using Bash:
   ```bash
   ls -lh <output-path>
   ```

3. **Report to the user:**
   - Where the MP4 was saved
   - The file size
   - What interactions were captured
   - Suggest they can play it with `open <path>` (macOS) or `xdg-open <path>` (Linux)

## Important Rules

- Always call `take_snapshot` before clicking or interacting with elements to get fresh UIDs.
- Add 1-2 second pauses between interactions so each step is visible in the recording.
- If any MCP tool call fails, stop the screencast immediately to preserve what was captured so far.
- Never leave a screencast running without telling the user — always confirm recording state.
- If the user says "stop" at any point, immediately call `screencast_stop`.
- Do not navigate away from pages or close tabs unless explicitly asked.
