#!/usr/bin/env node
// MCP server that controls an Android device through ADB.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";

const run = promisify(execFile);
const SERIAL = process.env.ANDROID_SERIAL; // optional: pick one device

async function adb(args, opts = {}) {
  const full = SERIAL ? ["-s", SERIAL, ...args] : args;
  const { stdout } = await run("adb", full, { maxBuffer: 50 * 1024 * 1024, ...opts });
  return stdout;
}

const text = (t) => ({ content: [{ type: "text", text: String(t).trim() || "OK" }] });

const server = new McpServer({ name: "android", version: "1.0.0" });

server.tool("list_devices", "List connected Android devices", {}, async () =>
  text(await adb(["devices", "-l"])));

server.tool("screenshot", "Take a screenshot of the phone screen", {}, async () => {
  const buf = await adb(["exec-out", "screencap", "-p"], { encoding: "buffer" });
  return { content: [{ type: "image", data: buf.toString("base64"), mimeType: "image/png" }] };
});

server.tool("tap", "Tap the screen at x,y", { x: z.number(), y: z.number() }, async ({ x, y }) =>
  text(await adb(["shell", "input", "tap", String(x), String(y)])));

server.tool("swipe", "Swipe from (x1,y1) to (x2,y2)",
  { x1: z.number(), y1: z.number(), x2: z.number(), y2: z.number(), ms: z.number().default(300) },
  async ({ x1, y1, x2, y2, ms }) =>
    text(await adb(["shell", "input", "swipe", ...[x1, y1, x2, y2, ms].map(String)])));

server.tool("type_text", "Type text into the focused field", { text: z.string() }, async (a) =>
  text(await adb(["shell", "input", "text", a.text.replace(/ /g, "%s").replace(/(["'`\\$&|;<>()])/g, "\\$1")])));

server.tool("press_key", "Press a key, e.g. HOME, BACK, ENTER, POWER, VOLUME_UP",
  { key: z.string() }, async ({ key }) =>
    text(await adb(["shell", "input", "keyevent", key.startsWith("KEYCODE_") ? key : `KEYCODE_${key.toUpperCase()}`])));

server.tool("open_app", "Launch an app by package name (e.g. com.android.chrome)",
  { package: z.string() }, async (a) =>
    text(await adb(["shell", "monkey", "-p", a.package, "-c", "android.intent.category.LAUNCHER", "1"])));

server.tool("list_apps", "List installed app packages", {}, async () =>
  text(await adb(["shell", "pm", "list", "packages", "-3"])));

server.tool("screen_ui", "Dump the on-screen UI tree (XML) to find buttons and text", {}, async () => {
  await adb(["shell", "uiautomator", "dump", "/sdcard/ui.xml"]);
  return text(await adb(["shell", "cat", "/sdcard/ui.xml"]));
});

server.tool("shell", "Run an adb shell command on the phone", { command: z.string() }, async (a) =>
  text(await adb(["shell", a.command])));

await server.connect(new StdioServerTransport());
