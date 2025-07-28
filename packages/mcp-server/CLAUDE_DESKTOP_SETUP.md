# Claude Desktop Integration Setup

This guide explains how to configure Claude Desktop to work with the Foundry MCP Server.

## Prerequisites

1. **Claude Desktop installed** and configured with your Anthropic account
2. **Foundry VTT running** with the MCP Bridge module enabled
3. **Foundry MCP Server built** and ready to run

## Configuration Steps

### 1. Build the MCP Server

```bash
cd packages/mcp-server
npm run build
```

### 2. Create Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` to match your Foundry setup:

```env
# Basic configuration
LOG_LEVEL=info
FOUNDRY_HOST=localhost
FOUNDRY_PORT=30000
FOUNDRY_NAMESPACE=/foundry-mcp

# For debugging (optional)
# LOG_LEVEL=debug
# ENABLE_FILE_LOGGING=true
# LOG_FILE_PATH=./logs/debug.log
```

### 3. Configure Claude Desktop

Add the Foundry MCP Server to your Claude Desktop configuration.

**Location of config file:**
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

**Configuration:**

```json
{
  "mcpServers": {
    "foundry-mcp": {
      "command": "node",
      "args": [
        "/absolute/path/to/foundry-mcp-integration/packages/mcp-server/dist/index.js"
      ],
      "env": {
        "LOG_LEVEL": "info",
        "FOUNDRY_HOST": "localhost",
        "FOUNDRY_PORT": "30000",
        "FOUNDRY_NAMESPACE": "/foundry-mcp"
      }
    }
  }
}
```

**Important Notes:**
- Use **absolute paths** for the command arguments
- Replace `/absolute/path/to/foundry-mcp-integration` with your actual project path
- On Windows, use forward slashes in the path or escape backslashes: `"C:/Projects/FVTTMCP/packages/mcp-server/dist/index.js"`

### 4. Test the Configuration

1. **Start Foundry VTT** and load a world
2. **Enable the MCP Bridge module** in Module Management
3. **Configure the module settings**:
   - Enable MCP Bridge: ✅
   - MCP Server Host: `localhost`
   - MCP Server Port: `30000` 
   - Socket Namespace: `/foundry-mcp`
   - Allow Character Access: ✅
   - Allow Compendium Access: ✅
4. **Restart Claude Desktop** to load the new configuration
5. **Test the connection** by asking Claude about your Foundry data

## Available Commands

Once configured, you can ask Claude natural language questions like:

### Character Information
- "Show me the stats for my character Aragorn"
- "List all the characters in my world"
- "What spells does my wizard know?"

### Compendium Search
- "Find all fire spells in the compendiums"
- "Search for magic weapons"
- "Show me available monster stat blocks"

### Scene Information
- "What's happening in the current scene?"
- "List all the tokens on the battlefield"
- "Tell me about the current world"

## Troubleshooting

### Common Issues

**1. "Not connected to Foundry VTT" error**
- Ensure Foundry VTT is running
- Check that the MCP Bridge module is enabled
- Verify the module settings match your server configuration
- Check that Foundry is accessible on the configured host/port

**2. "Unknown tool" error**
- Restart Claude Desktop after changing the configuration
- Verify the path to the MCP server is correct
- Check the server logs for startup errors

**3. Connection timeout**
- Increase `FOUNDRY_CONNECTION_TIMEOUT` in environment variables
- Check firewall settings if using remote Foundry instance
- Verify the socket namespace matches between module and server

**4. Permission denied errors**
- Check data access permissions in the Foundry module settings
- Ensure "Allow Character Access" or "Allow Compendium Access" are enabled

### Debug Mode

Enable detailed logging to troubleshoot issues:

**In .env file:**
```env
LOG_LEVEL=debug
ENABLE_FILE_LOGGING=true
LOG_FILE_PATH=./logs/debug.log
```

**In Claude Desktop config:**
```json
{
  "mcpServers": {
    "foundry-mcp": {
      "command": "node",
      "args": ["path/to/dist/index.js"],
      "env": {
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

### Viewing Logs

**Console logs** (if running manually):
```bash
cd packages/mcp-server
npm start
```

**File logs** (if enabled):
```bash
tail -f packages/mcp-server/logs/debug.log
```

## Security Considerations

- The MCP server only has read access to Foundry data by default
- All data is sanitized to remove sensitive information
- Authentication is handled through Foundry's session management
- No external credentials or API keys are required

## Performance Tips

- Use specific character names instead of browsing all characters
- Limit compendium searches to specific pack types when possible
- The server caches connections but reconnects automatically if needed

## Advanced Configuration

### Custom Socket Namespace

If you need to use a different socket namespace:

**Foundry Module Settings:**
- Socket Namespace: `/my-custom-namespace`

**MCP Server Environment:**
```env
FOUNDRY_NAMESPACE=/my-custom-namespace
```

### Remote Foundry Instance

To connect to a remote Foundry server:

```env
FOUNDRY_HOST=192.168.1.100
FOUNDRY_PORT=30000
FOUNDRY_CONNECTION_TIMEOUT=15000
```

### Multiple Foundry Instances

You can configure multiple MCP servers for different Foundry instances:

```json
{
  "mcpServers": {
    "foundry-game1": {
      "command": "node",
      "args": ["path/to/dist/index.js"],
      "env": {
        "FOUNDRY_HOST": "localhost",
        "FOUNDRY_PORT": "30000"
      }
    },
    "foundry-game2": {
      "command": "node", 
      "args": ["path/to/dist/index.js"],
      "env": {
        "FOUNDRY_HOST": "localhost",
        "FOUNDRY_PORT": "30001"
      }
    }
  }
}
```