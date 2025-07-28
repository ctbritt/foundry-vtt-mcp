# MCP Server Startup Order & Connection Guide

## Architecture Overview

The MCP server acts as a bridge between **TWO DIFFERENT connection types**:

```
Claude Desktop ←--stdin/stdout JSON-RPC--→ MCP Server ←--WebSocket--→ Foundry VTT Module
```

### Connection Types:

1. **Claude Desktop ↔ MCP Server**: 
   - Protocol: Model Context Protocol over stdio (JSON-RPC)
   - Transport: `StdioServerTransport`
   - Who starts: Claude Desktop starts MCP server as child process

2. **MCP Server ↔ Foundry VTT**: 
   - Protocol: Custom WebSocket messages  
   - Transport: Native WebSocket Server/Client
   - Who starts: MCP server starts WebSocket server, Foundry module connects

## Correct Startup Order

### 1. Initial Setup (One Time)
1. Install Foundry MCP Bridge module in Foundry VTT
2. Configure Claude Desktop MCP settings to point to the server
3. Set Foundry module port to 31415 in Module Settings

### 2. Daily Usage Order

**✅ CORRECT ORDER:**
1. **Start Foundry VTT** (anytime)
2. **Start Claude Desktop** (anytime)  
3. **Ask Claude a question** → This triggers the connection chain:
   - Claude Desktop launches MCP server
   - MCP server starts WebSocket server on port 31415
   - Foundry module connects to WebSocket server
   - Tools become available

**❌ WRONG - Don't try to run MCP server manually!**
- The MCP server uses `StdioServerTransport` which only works when launched by Claude Desktop
- Running it manually will hang because it's waiting for Claude Desktop's stdio

## Connection States & Error Messages

### Expected Log Messages:

**In MCP Server logs (`packages/mcp-server/logs/mcp-server.log`):**
```
Starting Foundry MCP Server
MCP server started successfully 
Starting WebSocket server for Foundry VTT connections...
WebSocket server started, waiting for Foundry VTT module to connect
Foundry module connected via WebSocket
```

**In Foundry VTT console:**
```
[foundry-mcp-bridge] Module initialized successfully
[foundry-mcp-bridge] Starting MCP bridge...
[foundry-mcp-bridge] Socket Bridge: Connected to MCP server
```

### Common Error Scenarios:

#### ❌ "ERR_CONNECTION_REFUSED on port 31415"
**Cause**: MCP server not running (Claude Desktop hasn't started it yet)
**Fix**: Ask Claude Desktop a question to trigger MCP server startup

#### ❌ "EADDRINUSE: address already in use :::31415" 
**Cause**: Port conflict or old server still running
**Fix**: Check for other processes using port 31415, restart Foundry VTT

#### ❌ MCP server hangs when run manually
**Cause**: StdioServerTransport expects to be launched by Claude Desktop
**Fix**: Don't run manually - let Claude Desktop launch it

## Testing the Connection

### Step 1: Check Foundry Module Status
In Foundry VTT console (F12), look for:
```javascript
// Check module status
foundryMCPDebug.getStatus()

// Should show:
{
  initialized: true,
  enabled: true, 
  connected: false, // Will be true once MCP server starts
  connectionState: "disconnected" // Will change to "connected"
}
```

### Step 2: Trigger MCP Server Startup
In Claude Desktop, ask:
> "List my characters"

This should trigger the connection chain.

### Step 3: Verify Connection
Check Foundry console again:
```javascript
foundryMCPDebug.getStatus()
// Should now show connected: true
```

## Troubleshooting Connection Issues

### 1. Check MCP Server Logs
```bash
tail -f packages/mcp-server/logs/mcp-server.log
```

### 2. Check Port Usage
```bash
netstat -an | grep 31415
# Should show LISTENING when MCP server is running
```

### 3. Reset Everything
1. Close Claude Desktop
2. Restart Foundry VTT 
3. Start Claude Desktop
4. Ask Claude a question

### 4. Enable Debug Logging
In Foundry module settings:
- Enable "Debug Logging" 
- Set port to 31415
- Check console for detailed connection messages

## Architecture Benefits

This design ensures:
- **Clean separation**: MCP protocol handling separate from game data access
- **Resilient startup**: Components can start in any order
- **Automatic recovery**: Connections re-establish when components restart
- **No manual server management**: Claude Desktop handles MCP server lifecycle