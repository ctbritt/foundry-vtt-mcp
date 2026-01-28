# Foundry VTT MCP Bridge v2 - Simplified Architecture

**Status**: Rebuilding for reliability

This is a simplified, more reliable version of the Foundry VTT MCP Bridge. The original WebRTC/WebSocket architecture was overly complex and prone to connection issues. V2 uses simple HTTP REST for reliable connectivity.

## Architecture Changes

### Old (v1)
```
Claude Desktop → stdio → MCP Server → WebSocket/WebRTC → Foundry Module → Foundry VTT
                                ↓
                          Signaling Server (port 31416)
```

**Problems:**
- Complex WebRTC signaling
- Connection type detection (auto/websocket/webrtc)
- localhost-only WebSocket server
- Separate backend process for ComfyUI
- Frequent connection failures

### New (v2)
```
Claude Desktop/mcporter → stdio → MCP Server (with embedded HTTP server)
                                      ↓ HTTP REST
                              Foundry Module → Foundry VTT
```

**Improvements:**
- Single process, dual interface (stdio + HTTP)
- Simple HTTP REST (no WebRTC complexity)
- Works over Tailscale, reverse proxies, localhost
- Auth via Tailscale network boundary (no API keys needed)
- Stateless requests (no connection state to maintain)

## Setup

### 1. Server Setup (Mac)

The MCP server runs on your Mac and is accessible via Tailscale.

**Environment Variables:**
```bash
export FOUNDRY_MCP_PORT=31415          # HTTP server port (default: 31415)
# No API key needed - auth via Tailscale network boundary
```

**Install dependencies:**
```bash
cd ~/clawd/foundry-mcp-v2/packages/mcp-server
npm install
npm run build
```

**Configure mcporter:**
```json
{
  "mcpServers": {
    "foundry-v2": {
      "command": "node",
      "args": [
        "/Users/youruser/clawd/foundry-mcp-v2/packages/mcp-server/dist/index-v2.js"
      ],
      "env": {
        "FOUNDRY_MCP_PORT": "31415"
      }
    }
  }
}
```

**Test the server:**
```bash
# In one terminal, start the server manually
cd ~/clawd/foundry-mcp-v2/packages/mcp-server
FOUNDRY_MCP_PORT=31415 node dist/index-v2.js

# In another terminal, test HTTP endpoint
curl http://localhost:31415/health

# Should return: {"status":"ok","timestamp":"..."}
```

### 2. Foundry Module Setup

**Install the module:**
1. Copy `packages/foundry-module/dist` to your Foundry modules directory as `foundry-mcp-bridge-v2`
2. Or use the manifest URL (once hosted)

**Configure in Foundry:**
1. Enable the module in your world
2. Go to **Settings → Configure Settings → Foundry MCP Bridge**
3. Set:
   - **Enable MCP Bridge**: ✅
   - **MCP Server URL**: `http://your-mac-tailscale-hostname:31415`
   - **Allow Write Operations**: ✅ (or ❌ for read-only)

Note: No API key needed since auth is via Tailscale network boundary.

**Example Tailscale URL:**
```
http://christopher-macbook.minikin-chinstrap.ts.net:31415
```

**For localhost testing:**
```
http://localhost:31415
```

### 3. Finding Your Tailscale Hostname

On your Mac:
```bash
tailscale status
# Look for your Mac's hostname, e.g., "christopher-macbook"
```

Then use: `http://christopher-macbook:31415`

Or use the full Tailscale domain:
```bash
tailscale status --json | jq -r '.Self.DNSName'
# e.g., christopher-macbook.tail-scale.ts.net
```

## Testing

### 1. Test HTTP Server Directly

From Foundry server (or any machine on Tailscale):
```bash
# Health check
curl http://mac-hostname:31415/health

# Tool call
curl -X POST http://mac-hostname:31415/mcp/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "get-world-info",
    "arguments": {}
  }'
```

### 2. Test from mcporter

```bash
mcporter call foundry-v2.get-world-info
```

### 3. Test from Foundry Module

Open Foundry, check browser console for connection messages. Should see:
```
[foundry-mcp-bridge] Connected to MCP server
```

## Firewall / Network

**Mac Firewall:**
- Allow incoming connections on port 31415
- Or disable firewall for Tailscale interface

**Tailscale:**
- No special config needed
- MCP server binds to `0.0.0.0:31415` (all interfaces)
- Accessible via Tailscale network automatically

## Troubleshooting

### "Connection refused"
- Check MCP server is running: `ps aux | grep index-v2.js`
- Check port is listening: `lsof -i :31415` (on Mac)
- Check firewall allows port 31415

### "Network error" or "Can't reach server"
- Check both machines are on same Tailscale network
- Verify Tailscale hostname resolves: `ping mac-hostname.minikin-chinstrap.ts.net`
- Check firewall allows port 31415

### "Module not connected"
- Check Foundry can reach Mac via Tailscale
- Test with `curl http://mac-hostname:31415/health` from Foundry server
- Check Foundry module settings have correct URL

### "Tool call failed"
- Check mcporter is spawning the server correctly
- Check server logs in browser console
- Verify tool name is correct

## Development

### Build Server
```bash
cd packages/mcp-server
npm run build
```

### Build Module
```bash
cd packages/foundry-module
npm run build
```

### Watch Mode
```bash
# Server
cd packages/mcp-server
npm run dev

# Module
cd packages/foundry-module
npm run dev
```

## Migration from V1

1. Disable old `foundry-mcp-bridge` module
2. Install `foundry-mcp-bridge-v2` module
3. Update mcporter config to use `index-v2.js`
4. Set new module settings (Server URL, API Key)
5. Reload Foundry world

All your world data, characters, compendiums, etc. remain unchanged. Only the connection layer changes.

## TODO

- [ ] Build module dist
- [ ] Test all tool implementations
- [ ] Add WebSocket support for real-time updates (optional)
- [ ] Add tool discovery endpoint
- [ ] Create installer for v2
- [ ] Documentation for each tool
- [ ] Error handling improvements
- [ ] Reconnection logic
- [ ] Health monitoring dashboard

## License

MIT - Same as original project
