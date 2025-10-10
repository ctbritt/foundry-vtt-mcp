# Ready to Install! 🚀

## Current Status

This directory is now a **clean, production-ready Foundry module**.

## Directory Structure

```
foundry-vtt-mcp/              (The module)
├── module.json               ✅ Foundry manifest
├── dist/                     ✅ Compiled module code
│   ├── main.js               → Module entry (spawns backend)
│   └── backend-manager.js    → Backend lifecycle manager
├── mcp-server/               ✅ Embedded MCP backend
│   ├── backend.js            → The MCP server
│   ├── index.js              → MCP entry point
│   └── package.json          → Server info
├── lang/                     ✅ Translations
├── styles/                   ✅ CSS
├── templates/                ✅ HTML templates
├── scripts/                  ✅ Helper scripts
│   └── mcp-wrapper.js        → 38-line stdio bridge
├── .env                      ✅ Your configuration
├── .env.example              ✅ Example config
├── README.md                 ✅ Documentation
├── INSTALL.md                ✅ Installation guide
├── LICENSE                   ✅ MIT license
└── package.json              ✅ Module metadata
```

**Total size**: ~3 MB (everything included!)

---

## Installation Steps

### 1. Move to Foundry Modules Directory

```bash
# Option A: Move the directory
mv /home/foundry/foundry-vtt-mcp \
   /home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge

# Option B: Create symlink (for development)
ln -s /home/foundry/foundry-vtt-mcp \
      /home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge
```

### 2. Restart Foundry VTT

```bash
# If running via PM2:
pm2 restart foundry

# Or just restart the Foundry process
```

### 3. Enable the Module

1. Load a world in Foundry
2. Go to **Settings → Manage Modules**
3. Find **"Foundry MCP Bridge"**
4. Check the box to enable it
5. Click **Save Module Settings**
6. **Reload the world**

### 4. Verify Backend Started

Open browser console (F12) and look for:

```
[foundry-mcp-bridge] Starting MCP backend server...
[foundry-mcp-bridge] Backend started successfully on port 31414
[foundry-mcp-bridge] Module ready
```

✅ **Backend is running!**

---

## Configure Claude Desktop

When the module loads for the first time, it will show a dialog with Claude Desktop configuration. You can also find it in the browser console.

### On Your Mac

1. **Get the config from the dialog** (or browser console F12)

2. **Save it to Claude Desktop**:
   ```bash
   # Edit this file:
   ~/Library/Application Support/Claude/claude_desktop_config.json
   ```

3. **Paste the config**:
   ```json
   {
     "mcpServers": {
       "foundry-mcp": {
         "command": "ssh",
         "args": [
           "foundry@foundry.azthir-terra.com",
           "node",
           "/home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge/scripts/mcp-wrapper.js"
         ],
         "env": {
           "FOUNDRY_HOST": "100.87.238.120",
           "FOUNDRY_PORT": "31415",
           "FOUNDRY_NAMESPACE": "/foundry-mcp"
         }
       }
     }
   }
   ```

4. **Restart Claude Desktop**

5. **Test it**: Ask Claude "What actors are in my Foundry world?"

---

## What Happens When You Enable the Module

1. **Module initializes** (dist/main.js runs)
2. **Backend manager spawns backend.js** as child process
3. **Backend listens on localhost:31414** (TCP server)
4. **Backend connects to Foundry on :31415** (WebSocket)
5. **Config dialog appears** (first time only)
6. **Module is ready!**

---

## How It Works

```
Claude Desktop (Mac)
    │
    │ SSH over Tailscale
    │ Runs: scripts/mcp-wrapper.js
    ▼
mcp-wrapper.js (38 lines)
    │
    │ Pipes: stdin ↔ TCP
    ▼
mcp-server/backend.js
    │
    │ WebSocket connection
    ▼
Foundry VTT (port 31415)
```

---

## Verification Checklist

After installation, verify:

- [ ] Module appears in Foundry Module Management
- [ ] Enabling module shows no errors
- [ ] Browser console shows "Backend started successfully"
- [ ] Process is running: `ps aux | grep backend.js`
- [ ] Port is listening: `ss -tlnp | grep 31414`
- [ ] Claude Desktop config is installed
- [ ] Claude Desktop can connect and query Foundry

---

## File Sizes

```bash
$ du -sh /home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge/*

492K    .env
12K     .env.example
456K    .git
4.0K    .gitignore
4.0K    INSTALL.md
8.0K    LICENSE
8.0K    README.md
1.2M    dist/
12K     lang/
1.8M    mcp-server/
4.0K    module.json
4.0K    package.json
4.0K    scripts/
44K     styles/
12K     templates/
```

**Total**: ~3 MB

---

## Troubleshooting

### Backend Won't Start

**Check console for errors**:
- Port 31414 in use? Change in `.env`
- Missing files? Re-extract/copy module

### Claude Desktop Won't Connect

**Test SSH**:
```bash
ssh foundry@foundry.azthir-terra.com "echo 'works'"
```

**Test wrapper**:
```bash
ssh foundry@foundry.azthir-terra.com \
  "node /home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge/scripts/mcp-wrapper.js"
# Should wait for input, Ctrl+C to exit
```

**Check backend**:
```bash
ps aux | grep backend.js
ss -tlnp | grep 31414
```

### First-Time Config Dialog Doesn't Appear

The dialog only shows once. To see it again:

```javascript
// In browser console (F12):
game.settings.set('foundry-mcp-bridge', 'claudeConfigsGenerated', false)
// Then reload world
```

---

## Support

- **Documentation**: [README.md](README.md)
- **Installation**: [INSTALL.md](INSTALL.md)
- **Issues**: https://github.com/ctbritt/foundry-vtt-mcp/issues

---

## Summary

✅ **Module is production-ready**
✅ **All unnecessary files removed**
✅ **Standard Foundry structure**
✅ **MCP server embedded**
✅ **Auto-starts with Foundry**
✅ **Just move and enable!**

**You're ready to go!** 🎉
