# Android MCP Connector

Lets Claude see and control your Android phone over ADB.

## Setup
1. On the phone: Settings → About phone → tap **Build number** 7 times, then turn on **USB debugging** in Developer options.
2. On your computer: install [Android platform-tools](https://developer.android.com/tools/releases/platform-tools) (gives you `adb`) and Node.js 18+.
3. Plug in the phone, run `adb devices`, and accept the prompt on the phone.
4. `cd android-mcp && npm install`

## Add to Claude Code
```
claude mcp add android -- node /full/path/to/android-mcp/index.js
```
Claude Desktop (`claude_desktop_config.json`):
```json
{ "mcpServers": { "android": { "command": "node", "args": ["/full/path/to/android-mcp/index.js"] } } }
```
Multiple devices? Set env `ANDROID_SERIAL=<id from adb devices>`.
Wireless: `adb tcpip 5555` then `adb connect <phone-ip>:5555`.

## Tools
`list_devices`, `screenshot`, `tap`, `swipe`, `type_text`, `press_key`, `open_app`, `list_apps`, `screen_ui`, `shell`
