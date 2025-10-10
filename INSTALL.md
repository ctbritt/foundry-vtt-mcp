# Installation Guide

## Quick Install

### Development (Symlink)

```bash
# 1. Clone and build
git clone https://github.com/ctbritt/foundry-vtt-mcp.git
cd foundry-vtt-mcp
npm install
npm run build

# 2. Symlink to Foundry
ln -s $(pwd) /path/to/FoundryData/modules/foundry-mcp-bridge

# 3. Enable in Foundry
# - Load a world
# - Go to Settings → Manage Modules
# - Enable "Foundry MCP Bridge"
# - Reload world
```

### Production (GitHub Release)

```bash
# 1. Download latest release
# https://github.com/ctbritt/foundry-vtt-mcp/releases/latest

# 2. Extract to modules folder
unzip foundry-mcp-bridge-v*.zip -d /path/to/FoundryData/modules/foundry-mcp-bridge/

# 3. Enable in Foundry
# - Load a world
# - Go to Settings → Manage Modules
# - Enable "Foundry MCP Bridge"
# - Reload world
```

## Configure Claude Desktop

When you load Foundry with the module enabled, it will:
1. Auto-start the MCP backend on port 31414
2. Show a config dialog with Claude Desktop setup instructions
3. Display configs in browser console (F12)

Copy the SSH config and install on your Mac:

```bash
# Save the config from the dialog, then:
cp claude_desktop_config_ssh.json ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Restart Claude Desktop
```

## Verify It Works

### Check Backend Started

Open Foundry browser console (F12):

```
[foundry-mcp-bridge] Starting MCP backend server...
[foundry-mcp-bridge] Backend started successfully on port 31414
```

### Check Process

```bash
ps aux | grep backend.js
# Should show: node .../foundry-mcp-bridge/mcp-server/backend.js
```

### Test Claude Desktop

Ask Claude: "What actors are in my Foundry world?"

If configured correctly, Claude will connect and respond with your actor list!

## Troubleshooting

### Backend Won't Start

Check browser console for errors. Common issues:
- Port 31414 already in use
- Module not fully installed
- Missing dependencies

### Claude Desktop Won't Connect

1. **Test SSH**:
   ```bash
   ssh foundry@your-server "echo 'SSH works'"
   ```

2. **Test wrapper**:
   ```bash
   ssh foundry@your-server "node /path/to/foundry-mcp-bridge/scripts/mcp-wrapper.js"
   # Should wait for input, Ctrl+C to exit
   ```

3. **Check backend is running**:
   ```bash
   ssh foundry@your-server "ss -tlnp | grep 31414"
   ```

### Module Won't Enable

- Make sure it's installed at: `FoundryData/modules/foundry-mcp-bridge/`
- Check `module.json` exists in that directory
- Verify Foundry version is v13+

## Architecture

```
foundry-mcp-bridge/       ← The module (this repo)
├── module.json           ← Foundry manifest
├── dist/                 ← Compiled module
│   └── backend-manager.js  (spawns backend on load)
├── mcp-server/           ← MCP backend (embedded)
│   └── backend.js        (auto-starts with Foundry)
├── scripts/
│   └── mcp-wrapper.js    ← 38-line stdio bridge
└── ...standard module files
```

The MCP server runs **inside the module** as a child process. No external services needed!

## More Info

- [REDDIT_WRONG.md](REDDIT_WRONG.md) - Why this architecture works
- [PROOF_OF_CONCEPT.md](PROOF_OF_CONCEPT.md) - Technical proof
- [ARCHITECTURE.md](ARCHITECTURE.md) - How it works
- [README.md](README.md) - Main documentation
