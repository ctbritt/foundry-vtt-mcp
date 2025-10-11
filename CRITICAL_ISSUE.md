# CRITICAL ISSUE IDENTIFIED

## Problem

The logs show: **"Foundry VTT module not connected"**

This means the Foundry MCP Bridge module inside Foundry VTT is NOT connecting to the MCP backend server.

## Current Status

```
✅ MCP Backend Server - RUNNING (port 31414, 31415, 31416)
❌ Foundry Module - NOT CONNECTED to backend
❌ Claude Desktop - Can't connect (needs Mac SSH setup)
```

## What This Means

The flow should be:
```
Claude Desktop (Mac)
    ↓ SSH
MCP Server Wrapper (index.js) - port 31414
    ↓
MCP Backend (backend.js) - port 31415
    ↓
Foundry Module ← NOT CONNECTING
    ↓
Foundry VTT
```

## Root Cause

The **Foundry VTT MCP Bridge module** is either:
1. Not enabled in Foundry VTT
2. Not running / Foundry is not running
3. Can't reach port 31415
4. Module files are corrupt/incomplete

## IMMEDIATE ACTIONS NEEDED

### 1. Is Foundry VTT Running?

Check if Foundry is running:
```bash
ps aux | grep -i foundry | grep -v grep
```

If not, start Foundry VTT.

### 2. Is the Module Enabled?

In Foundry VTT:
1. Go to **Settings** → **Manage Modules**
2. Find **"Foundry MCP Bridge"**
3. Make sure it's **checked/enabled**
4. Click **Save Module Settings**
5. **Reload the world**

### 3. Check Module Files

```bash
# Verify module files exist
ls -la /home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge/dist/main.js

# Check if module.json is valid
cat /home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge/module.json | jq .
```

### 4. Check Foundry Browser Console

Open Foundry in browser, press F12 to open console, look for:
```
[foundry-mcp-bridge] Starting MCP bridge...
[foundry-mcp-bridge] Bridge started successfully
```

If you see errors, that's the problem.

### 5. Verify Module Can Reach Port 31415

The module needs to connect to `localhost:31415`. Check:
```bash
# Is port 31415 listening?
ss -tlnp | grep 31415

# Can we connect to it?
telnet localhost 31415
# Press Ctrl+] then type 'quit' to exit
```

## Log Analysis

The errors show queries are timing out:
```
Query timeout: foundry-mcp-bridge.getCharacterInfo
```

This happens when:
- The Foundry module isn't connected to send the query response
- The module is connected but can't process the query
- The connection exists but is broken/stalled

## Next Steps

1. **START FOUNDRY VTT** (if not running)
2. **ENABLE THE MODULE** in Manage Modules
3. **RELOAD THE WORLD**
4. Watch the browser console for connection messages
5. Check if port 31415 gets a WebSocket connection

Once the Foundry module connects, the timeouts will stop and Claude Desktop will be able to query your world.

## How to Verify Fix

When the module connects properly, you'll see in `/tmp/foundry-mcp-server/mcp-server.log`:
```
Foundry connector started, waiting for module connection...
[WebSocket/WebRTC] Client connected
```

And queries will succeed instead of timing out.

