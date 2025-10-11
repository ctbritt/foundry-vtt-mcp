# Foundry MCP Bridge - Tailscale Setup Guide

## Network Architecture

Based on your project rules, you have a **Tailscale mesh network** setup:

```
Mac (Claude Desktop) ←→ Tailscale Mesh ←→ Foundry Server
    M1 Mac Studio              ↕              foundry.azthir-terra.com
    M2 MacBook Air       minskin-chinstrap     (Tailscale hostname)
                            .ts.net            
                                              ├── Foundry VTT (port 30000)
                                              ├── MCP Server (port 31415)  
                                              └── MCP Backend (port 31414)
```

## Current Status

✅ **Server Side (Foundry Server)**
- Backend running on port 31414 (PID 46300)
- WebRTC server on port 31416
- Ready for Tailscale connections

## Mac Setup (For Both M1 and M2)

### Step 1: Verify Tailscale Connection

On your Mac, test the Tailscale connection:

```bash
# Test basic connectivity
ping minskin-chinstrap.ts.net

# Test SSH over Tailscale
ssh foundry@minskin-chinstrap.ts.net "echo 'Tailscale SSH works!'"
```

### Step 2: Install Claude Desktop Config

Copy this configuration to your Mac at:
`~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
    "mcpServers": {
        "foundry-mcp": {
            "command": "ssh",
            "args": [
                "foundry@minskin-chinstrap.ts.net",
                "cd /home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge/dist/mcp-server && node index.js"
            ],
            "env": {
                "FOUNDRY_HOST": "localhost",
                "FOUNDRY_PORT": "31415"
            }
        }
    }
}
```

### Step 3: Download Config to Mac

**Option A: Using SCP over Tailscale**
```bash
scp foundry@minskin-chinstrap.ts.net:/home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge/claude_desktop_config_tailscale.json ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Option B: Copy/Paste**
1. Open the JSON above
2. Create the file manually on your Mac
3. Paste the content

### Step 4: Restart Claude Desktop

1. **Quit Claude Desktop completely** (Cmd+Q)
2. **Reopen Claude Desktop**
3. Look for 🔨 hammer icon (MCP tools loaded)

### Step 5: Test Connection

In Claude Desktop, ask:
```
What actors are in my Foundry world?
```

## Architecture Details

### Port Usage

| Port  | Service | Accessibility |
|-------|---------|---------------|
| 30000 | Foundry VTT | Public (via Caddy) |
| 31414 | MCP Backend Control | Localhost only |
| 31415 | MCP Foundry Connector | Localhost only |
| 31416 | WebRTC Server | 0.0.0.0 (Tailscale accessible) |

### Data Flow

```
Claude Desktop (Mac)
    ↓ SSH over Tailscale
MCP Server Wrapper (index.js)
    ↓ TCP (localhost:31414)
MCP Backend (backend.js)
    ↓ WebSocket/WebRTC (localhost:31415)
Foundry MCP Bridge Module
    ↓
Foundry VTT
```

## Security Model

✅ **Tailscale Mesh Network**
- All MCP traffic goes through encrypted Tailscale tunnel
- No public ports exposed for MCP
- Only your authorized devices can connect

✅ **Localhost Binding**
- MCP control ports (31414, 31415) only listen on localhost
- Not accessible from internet

✅ **Player Isolation**
- Players connect to Foundry via public HTTPS (Caddy on port 443)
- Players have no access to MCP server
- MCP layer completely separate from player traffic

## Troubleshooting

### Connection Issues

**1. Test Tailscale connectivity:**
```bash
# From your Mac
ping minskin-chinstrap.ts.net
```

**2. Test SSH over Tailscale:**
```bash
ssh foundry@minskin-chinstrap.ts.net "whoami"
# Should return: foundry
```

**3. Test MCP server manually:**
```bash
ssh foundry@minskin-chinstrap.ts.net "cd /home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge/dist/mcp-server && node index.js"
# Should wait for input, Ctrl+C to exit
```

### Check Server Status

**From your Mac via Tailscale:**
```bash
# Check backend is running
ssh foundry@minskin-chinstrap.ts.net "ss -tlnp | grep 31414"

# Check Foundry connector
ssh foundry@minskin-chinstrap.ts.net "ss -tlnp | grep 31415"

# View logs
ssh foundry@minskin-chinstrap.ts.net "tail -f /tmp/foundry-mcp-server/wrapper.log"
```

### Restart Backend if Needed

```bash
ssh foundry@minskin-chinstrap.ts.net "pkill -f backend.js && cd /home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge/dist/mcp-server && node backend.js &"
```

## SSH Config (Optional)

Add this to `~/.ssh/config` on your Mac for easier access:

```
Host foundry-tailscale
    HostName minskin-chinstrap.ts.net
    User foundry
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

Then simplify Claude config to:
```json
{
    "mcpServers": {
        "foundry-mcp": {
            "command": "ssh",
            "args": [
                "foundry-tailscale",
                "cd /home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge/dist/mcp-server && node index.js"
            ],
            "env": {
                "FOUNDRY_HOST": "localhost",
                "FOUNDRY_PORT": "31415"
            }
        }
    }
}
```

## Notes

- ✅ No SSH tunnels needed (direct Tailscale connection)
- ✅ No exposed public ports (Tailscale handles routing)
- ✅ Works from both M1 Mac Studio and M2 MacBook Air
- ✅ Backend already running (PID 46300)
- ✅ All 35+ MCP tools available

## Success Indicators

When working correctly, you should see:
- ✅ Ping to `minskin-chinstrap.ts.net` succeeds
- ✅ SSH connection works without password prompt
- ✅ Claude Desktop shows 🔨 hammer icon
- ✅ Claude can query your Foundry world
- ✅ All MCP tools respond correctly

