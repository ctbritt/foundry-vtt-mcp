# ComfyUI Configuration for SSH Tunnel Setup

## Overview

This guide explains how to configure the Foundry MCP Server to work with ComfyUI when using SSH tunnels to connect Claude Desktop to a remote MCP server.

## The Problem

When using SSH tunnels, the MCP server runs on one machine (the remote server) while Claude Desktop runs on another (your local machine). ComfyUI must run on the same machine as the MCP server, but the hardcoded `127.0.0.1` localhost binding prevented proper configuration.

## The Solution

The MCP server now supports environment variables to configure ComfyUI connection and installation path.

## Environment Variables

### Required Variables

- **`COMFYUI_PATH`**: Full path to your ComfyUI installation directory
  - Example: `/home/foundry/ComfyUI`
  - This overrides automatic path detection

### Optional Variables

- **`COMFYUI_HOST`**: Host where ComfyUI API is accessible (default: `127.0.0.1`)
  - For local ComfyUI: `127.0.0.1`
  - For remote ComfyUI: IP address or hostname

- **`COMFYUI_PORT`**: Port for ComfyUI API (default: `31411`)
  - Change if port 31411 is already in use

- **`COMFYUI_LISTEN`**: Address ComfyUI should listen on (default: `127.0.0.1`)
  - `127.0.0.1`: Only accessible from localhost (recommended)
  - `0.0.0.0`: Accessible from any network interface (use with caution)

## Setup Instructions

### Option 1: Using the Startup Script (Recommended)

Use the provided startup script with pre-configured environment variables:

```bash
# Make it executable (first time only)
chmod +x /home/foundry/foundry-vtt-mcp/start-mcp-with-comfyui.sh

# Start the MCP server with ComfyUI configured
/home/foundry/foundry-vtt-mcp/start-mcp-with-comfyui.sh
```

### Option 2: Manual Environment Variables

Set environment variables before starting the MCP server:

```bash
export COMFYUI_PATH="/home/foundry/ComfyUI"
export COMFYUI_HOST="127.0.0.1"
export COMFYUI_PORT="31411"

node /home/foundry/foundry-vtt-mcp/packages/mcp-server/dist/index.js
```

### Option 3: Claude Desktop Configuration

Update your Claude Desktop config to include environment variables:

**Location**: `~/.config/Claude/claude_desktop_config.json` (Linux) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows)

```json
{
  "mcpServers": {
    "foundry-mcp": {
      "command": "/home/foundry/foundry-vtt-mcp/start-mcp-with-comfyui.sh",
      "env": {
        "COMFYUI_PATH": "/home/foundry/ComfyUI",
        "COMFYUI_HOST": "127.0.0.1",
        "COMFYUI_PORT": "31411"
      }
    }
  }
}
```

## Verification

### 1. Check ComfyUI Installation Detection

After starting the MCP server, check the logs:

```bash
tail -f /tmp/foundry-mcp-server/mcp-server.log
```

Look for:
```
ComfyUI client initialized { baseUrl: 'http://127.0.0.1:31411', installPath: '/home/foundry/ComfyUI', ... }
ComfyUI found { path: '/home/foundry/ComfyUI' }
Using ComfyUI virtual environment Python { pythonPath: '/home/foundry/ComfyUI/venv/bin/python' }
```

### 2. Test ComfyUI Connection

Once the server starts, ComfyUI should auto-start. Verify with:

```bash
curl http://127.0.0.1:31411/system_stats
```

You should see a JSON response with system statistics.

### 3. Test Map Generation

In Claude Desktop, try generating a map:

```
Generate a fantasy tavern battlemap
```

Claude should use the `generate-map` tool and create a scene in Foundry.

## Troubleshooting

### ComfyUI Not Starting

**Problem**: Logs show "ComfyUI installation not found"

**Solution**:
1. Verify ComfyUI path: `ls /home/foundry/ComfyUI/main.py`
2. Set `COMFYUI_PATH` explicitly
3. Check file permissions

### Connection Refused

**Problem**: "Connection refused" when accessing ComfyUI

**Solution**:
1. Check if ComfyUI process is running: `ps aux | grep main.py`
2. Verify port is not in use: `netstat -tuln | grep 31411`
3. Check firewall rules if using remote access

### Python Issues

**Problem**: "Python not found" or "ModuleNotFoundError"

**Solution**:
1. Ensure ComfyUI venv exists: `ls /home/foundry/ComfyUI/venv/bin/python`
2. Install missing dependencies: `cd /home/foundry/ComfyUI && ./venv/bin/pip install -r requirements.txt`

### SSH Tunnel Specific Issues

**Problem**: ComfyUI works locally but not through SSH tunnel

**Solution**:
1. Verify SSH tunnel is forwarding the correct ports
2. Ensure `COMFYUI_HOST` matches your SSH tunnel configuration
3. Check that Foundry WebSocket is also tunneled (port 31415)

## Architecture Notes

```
┌─────────────────┐         SSH Tunnel        ┌──────────────────┐
│ Claude Desktop  │◄──────────────────────────►│  MCP Server      │
│ (Local Machine) │                            │  (Remote Server) │
└─────────────────┘                            │                  │
                                               │  ┌────────────┐  │
                                               │  │  ComfyUI   │  │
                                               │  │  :31411    │  │
                                               │  └────────────┘  │
                                               │                  │
                                               │  ┌────────────┐  │
                                               │  │  Foundry   │  │
                                               │  │  :31415    │  │
                                               │  └────────────┘  │
                                               └──────────────────┘
```

- **MCP Server** and **ComfyUI** must be on the same machine
- **Claude Desktop** communicates via SSH tunnel
- **Foundry VTT** WebSocket connection also tunneled

## Security Considerations

### Localhost Binding (Default)

ComfyUI listens on `127.0.0.1` by default, which means:
- ✅ Only accessible from the same machine
- ✅ Cannot be accessed from the network
- ✅ Safe for SSH tunnel configurations

### Network Binding (Advanced)

If you set `COMFYUI_LISTEN="0.0.0.0"`:
- ⚠️ ComfyUI becomes accessible from any network interface
- ⚠️ Potential security risk if exposed to internet
- ⚠️ Use firewall rules to restrict access
- ⚠️ Consider using authentication proxy

**Recommendation**: Keep default `127.0.0.1` binding and use SSH tunnels for remote access.

## Additional Resources

- [ComfyUI Documentation](https://github.com/comfyanonymous/ComfyUI)
- [SSH Tunnel Guide](https://www.ssh.com/academy/ssh/tunneling)
- [Foundry MCP Bridge README](./README.md)
