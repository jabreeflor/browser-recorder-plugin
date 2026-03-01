#!/usr/bin/env node

/**
 * Browser Recorder — Connects to a Chrome/Chromium instance via CDP,
 * captures screencast frames, and compiles them into an MP4 using ffmpeg.
 *
 * Usage:
 *   node recorder.js start --port <CDP_PORT> --output <path.mp4> [--fps <N>] [--quality <1-100>]
 *   node recorder.js stop --pid-file <path>
 */

const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");
const { spawn, execSync } = require("child_process");

const ARGS = process.argv.slice(2);
const CMD = ARGS[0];

function parseFlags(args) {
  const flags = {};
  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith("--") && i + 1 < args.length) {
      flags[args[i].slice(2)] = args[i + 1];
      i++;
    }
  }
  return flags;
}

function ensureFfmpeg() {
  try {
    execSync("which ffmpeg", { stdio: "ignore" });
  } catch {
    console.error(
      "Error: ffmpeg is not installed. Install it with: brew install ffmpeg"
    );
    process.exit(1);
  }
}

async function getWsUrl(port) {
  const http = require("http");
  return new Promise((resolve, reject) => {
    http
      .get(`http://127.0.0.1:${port}/json/version`, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const info = JSON.parse(data);
            resolve(info.webSocketDebuggerUrl);
          } catch (e) {
            reject(
              new Error(`Failed to parse CDP response: ${e.message}`)
            );
          }
        });
      })
      .on("error", (e) =>
        reject(
          new Error(
            `Cannot connect to Chrome on port ${port}. Is Chrome running with --remote-debugging-port=${port}? Error: ${e.message}`
          )
        )
      );
  });
}

async function startRecording(flags) {
  ensureFfmpeg();

  const port = flags.port || "9222";
  const outputPath = path.resolve(flags.output || "recording.mp4");
  const fps = parseInt(flags.fps || "10", 10);
  const quality = parseInt(flags.quality || "80", 10);
  const framesDir = path.join(
    path.dirname(outputPath),
    `.browser-recorder-frames-${Date.now()}`
  );
  const pidFile =
    flags["pid-file"] ||
    path.join(path.dirname(outputPath), ".browser-recorder.pid");
  const metaFile = path.join(
    path.dirname(outputPath),
    ".browser-recorder-meta.json"
  );

  fs.mkdirSync(framesDir, { recursive: true });

  console.log(`Connecting to Chrome DevTools on port ${port}...`);
  let wsUrl;
  try {
    wsUrl = await getWsUrl(port);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }

  console.log(`Connected. WebSocket: ${wsUrl}`);

  const ws = new WebSocket(wsUrl);
  let msgId = 1;
  let frameCount = 0;
  const pendingCallbacks = new Map();

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      pendingCallbacks.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.on("message", (raw) => {
    const msg = JSON.parse(raw.toString());

    if (msg.id && pendingCallbacks.has(msg.id)) {
      pendingCallbacks.get(msg.id)(msg.result);
      pendingCallbacks.delete(msg.id);
    }

    if (msg.method === "Page.screencastFrame") {
      const { data, sessionId } = msg.params;
      const framePath = path.join(
        framesDir,
        `frame-${String(frameCount).padStart(8, "0")}.jpg`
      );
      fs.writeFileSync(framePath, Buffer.from(data, "base64"));
      frameCount++;

      // Acknowledge the frame so Chrome keeps sending them
      send("Page.screencastFrameAck", { sessionId });

      if (frameCount % 50 === 0) {
        console.log(`Captured ${frameCount} frames...`);
      }
    }
  });

  await new Promise((resolve) => ws.on("open", resolve));

  // Enable page events and start screencast
  await send("Page.enable");
  await send("Page.startScreencast", {
    format: "jpeg",
    quality: quality,
    maxWidth: 1920,
    maxHeight: 1080,
    everyNthFrame: 1,
  });

  console.log(`Recording started. Saving frames to ${framesDir}`);
  console.log(`Output will be: ${outputPath}`);
  console.log(`FPS: ${fps}, Quality: ${quality}`);

  // Write metadata so the stop script can compile the video
  const meta = {
    pid: process.pid,
    framesDir,
    outputPath,
    fps,
    port,
    startTime: new Date().toISOString(),
  };
  fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));
  fs.writeFileSync(pidFile, String(process.pid));

  console.log(`PID file: ${pidFile}`);
  console.log(`Meta file: ${metaFile}`);
  console.log("Send SIGTERM or run 'node recorder.js stop' to finish.\n");

  // Graceful shutdown — stop screencast, compile frames, clean up
  async function shutdown() {
    console.log("\nStopping screencast...");
    try {
      await send("Page.stopScreencast");
    } catch {}
    ws.close();

    console.log(`Captured ${frameCount} total frames.`);

    if (frameCount === 0) {
      console.error("No frames captured. Nothing to compile.");
      cleanup();
      process.exit(1);
    }

    console.log("Compiling frames to MP4 with ffmpeg...");
    const ffmpegArgs = [
      "-y",
      "-framerate",
      String(fps),
      "-i",
      path.join(framesDir, "frame-%08d.jpg"),
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-preset",
      "fast",
      "-crf",
      "23",
      "-movflags",
      "+faststart",
      outputPath,
    ];

    const ffmpeg = spawn("ffmpeg", ffmpegArgs, { stdio: "inherit" });
    ffmpeg.on("close", (code) => {
      if (code === 0) {
        console.log(`\nVideo saved to: ${outputPath}`);
      } else {
        console.error(`ffmpeg exited with code ${code}`);
      }
      cleanup();
      process.exit(code || 0);
    });
  }

  function cleanup() {
    try {
      fs.rmSync(framesDir, { recursive: true, force: true });
    } catch {}
    try {
      fs.unlinkSync(pidFile);
    } catch {}
    try {
      fs.unlinkSync(metaFile);
    } catch {}
  }

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

async function stopRecording(flags) {
  const pidFile = flags["pid-file"] || ".browser-recorder.pid";
  const metaFile = flags["meta-file"] || ".browser-recorder-meta.json";

  // Try pid file first
  if (fs.existsSync(pidFile)) {
    const pid = parseInt(fs.readFileSync(pidFile, "utf-8").trim(), 10);
    console.log(`Sending SIGTERM to recorder process (PID: ${pid})...`);
    try {
      process.kill(pid, "SIGTERM");
      console.log(
        "Signal sent. The recorder will compile the MP4 and exit."
      );
    } catch (e) {
      console.error(`Failed to signal process ${pid}: ${e.message}`);
      // Try manual compilation if meta exists
      if (fs.existsSync(metaFile)) {
        console.log("Attempting manual compilation from metadata...");
        manualCompile(metaFile);
      }
    }
    return;
  }

  // Fallback: look for meta file
  if (fs.existsSync(metaFile)) {
    console.log("No PID file found. Attempting manual compilation...");
    manualCompile(metaFile);
    return;
  }

  console.error(
    "No active recording found. Checked for PID file and meta file."
  );
  process.exit(1);
}

function manualCompile(metaFilePath) {
  ensureFfmpeg();

  const meta = JSON.parse(fs.readFileSync(metaFilePath, "utf-8"));
  const { framesDir, outputPath, fps } = meta;

  if (!fs.existsSync(framesDir)) {
    console.error(`Frames directory not found: ${framesDir}`);
    process.exit(1);
  }

  const frameFiles = fs
    .readdirSync(framesDir)
    .filter((f) => f.endsWith(".jpg"));
  console.log(`Found ${frameFiles.length} frames. Compiling at ${fps} fps...`);

  const result = execSync(
    `ffmpeg -y -framerate ${fps} -i "${path.join(framesDir, "frame-%08d.jpg")}" -c:v libx264 -pix_fmt yuv420p -preset fast -crf 23 -movflags +faststart "${outputPath}"`,
    { stdio: "inherit" }
  );

  console.log(`Video saved to: ${outputPath}`);

  // Cleanup
  fs.rmSync(framesDir, { recursive: true, force: true });
  try {
    fs.unlinkSync(metaFilePath);
  } catch {}
}

// --- Main ---
if (CMD === "start") {
  startRecording(parseFlags(ARGS)).catch((e) => {
    console.error("Fatal:", e.message);
    process.exit(1);
  });
} else if (CMD === "stop") {
  stopRecording(parseFlags(ARGS));
} else {
  console.log(`
Browser Recorder — Record Chrome interactions as MP4

Usage:
  node recorder.js start --port <CDP_PORT> --output <path.mp4> [--fps <N>] [--quality <1-100>]
  node recorder.js stop [--pid-file <path>] [--meta-file <path>]

Prerequisites:
  - Chrome/Chromium running with: --remote-debugging-port=9222
  - ffmpeg installed (brew install ffmpeg)
  - ws package installed (npm install ws)

Options:
  --port       Chrome DevTools port (default: 9222)
  --output     Output MP4 file path (default: recording.mp4)
  --fps        Frames per second (default: 10)
  --quality    JPEG quality 1-100 (default: 80)
  --pid-file   Custom PID file location
  --meta-file  Custom metadata file location
  `);
}
