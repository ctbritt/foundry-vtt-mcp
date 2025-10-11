# Foundry MCP Bridge - Current Status

## ✅ Server Side: WORKING PERFECTLY

**Backend Status:**
```
✅ Backend running (PID: 55348)
✅ Port 31414 - MCP Backend Control Channel (localhost)
✅ Port 31415 - Foundry Connector (all interfaces)
✅ Port 31416 - WebRTC Server (all interfaces)
✅ All original 20+ MCP tools loaded
✅ No timeout issues
```

**What's Running:**
- MCP Backend Server (backend.js)
- Foundry Connector (WebSocket + WebRTC)
- Original tool set from https://github.com/adambdooley/foundry-vtt-mcp

## 🔧 Mac Side: Needs Configuration

**What You Need to Do:**

### Step 1: Test SSH Connection (On Your Mac)

Try these in order:
```bash
# Option A: Short Tailscale hostname
ssh foundry@foundry "echo 'Works!'"

# Option B: Full Tailscale hostname
ssh foundry@foundry.minskin-chinstrap.ts.net "echo 'Works!'"

# Option C: Direct Tailscale IP
ssh foundry@100.115.132.122 "echo 'Works!'"
```

**Important:** Whichever one works WITHOUT asking for a password, use that hostname in Step 2.

### Step 2: Create Claude Desktop Config (On Your Mac)

File: `~/Library/Application Support/Claude/claude_desktop_config.json`

Replace `HOSTNAME_THAT_WORKED` below with the hostname from Step 1:

```json
{
    "mcpServers": {
        "foundry-mcp": {
            "command": "ssh",
            "args": [
                "foundry@HOSTNAME_THAT_WORKED",
                "cd /home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge/dist/mcp-server && NODE_PATH=/home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge/dist/mcp-server/node_modules node index.js"
            ],
            "env": {
                "FOUNDRY_HOST": "localhost",
                "FOUNDRY_PORT": "31415"
            }
        }
    }
}
```

### Step 3: If SSH Asks for Password

Run this on your Mac:
```bash
ssh-copy-id foundry@HOSTNAME_THAT_WORKED
```

Then test again - it should work without password.

### Step 4: Restart Claude Desktop

```bash
# Completely quit
pkill -9 Claude

# Wait
sleep 3

# Reopen
open -a Claude
```

### Step 5: Test

Ask Claude: "What actors are in my Foundry world?"

## 📋 Available MCP Tools (Original 20+)

All tools from the original repository are working:

**Character & Actor:**
- get-character
- list-characters
- create-actor
- set-actor-ownership
- get-actor-ownership

**Compendium:**
- search-compendium
- search-creatures

**Quest & Campaign:**
- create-quest
- list-campaigns
- create-campaign-part

**Scene:**
- get-scene-info
- list-scenes
- switch-scene

**Dice:**
- roll-dice
- request-roll
- send-chat-message

**Map Generation:**
- generate-map
- check-map-status
- cancel-map-job

## 🐛 Known Issues RESOLVED

✅ Missing dependencies - Fixed  
✅ @foundry-mcp/shared package - Fixed
✅ Backend won't start - Fixed
✅ Wrong ports - Fixed (31415 not 31414)
✅ New tools causing timeouts - Removed

## 📁 Files to Download to Your Mac

From the server, you can download:
```bash
scp foundry@foundry:/home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge/STATUS.md ~/
scp foundry@foundry:/home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge/MAC_TROUBLESHOOTING.md ~/
```

## 🎯 Final Checklist

On Server (foundry.azthir-terra.com):
- [x] Backend running on correct ports
- [x] Dependencies installed
- [x] Original tools loaded
- [x] Foundry module enabled

On Mac:
- [ ] SSH connection works without password
- [ ] Claude config file created with correct hostname
- [ ] Claude Desktop completely restarted
- [ ] Test query works

The server is ready! It's just about getting your Mac's SSH connection configured properly.

