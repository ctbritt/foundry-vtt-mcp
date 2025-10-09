# Foundry MCP Bridge - Self-Contained Module

This Foundry module includes an integrated MCP server for AI-powered campaign management through Claude Desktop.

## Quick Start

### 1. Enable the Module
Enable "Foundry MCP Bridge" in Foundry VTT's Module Management.

### 2. Start the MCP Server

The MCP server is bundled inside this module. You need to start it separately:

**On macOS/Linux:**
```bash
cd "path/to/FoundryVTT/Data/modules/foundry-mcp-bridge"
./scripts/start-server.sh
```

**On Windows:**
```cmd
cd "path\to\FoundryVTT\Data\modules\foundry-mcp-bridge"
scripts\start-server.bat
```

Or run directly:
```bash
node dist/mcp-server/index.js
```

### 3. Configure Claude Desktop

Edit your Claude Desktop configuration file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add this configuration:
```json
{
  "mcpServers": {
    "foundry-mcp": {
      "command": "node",
      "args": ["path/to/FoundryVTT/Data/modules/foundry-mcp-bridge/dist/mcp-server/index.js"],
      "env": {
        "FOUNDRY_HOST": "localhost",
        "FOUNDRY_PORT": "31415"
      }
    }
  }
}
```

Replace `path/to/FoundryVTT/Data` with your actual Foundry data path.

### 4. Configure Environment (Optional)

For RunPod/S3 integration, create a `.env` file in `dist/mcp-server/`:

```bash
cp dist/mcp-server/.env.example dist/mcp-server/.env
```

Then edit `dist/mcp-server/.env` with your credentials.

Alternatively, configure via the module UI in Foundry under Module Settings → Map Generation Service.

## Features

- **Core MCP Bridge**: AI-powered actor creation, quest generation, compendium search
- **AI Battlemap Generation**: RunPod serverless ComfyUI integration
- **S3 Storage**: Cloud storage for generated maps
- **Auto-Scene Creation**: Maps automatically attach to Foundry scenes

## Support

- **Documentation**: https://github.com/ctbritt/foundry-vtt-mcp
- **Issues**: https://github.com/ctbritt/foundry-vtt-mcp/issues
- **Original Project**: https://github.com/adambdooley/foundry-vtt-mcp

## Credits

Based on [Foundry VTT MCP Bridge](https://github.com/adambdooley/foundry-vtt-mcp) by Adam Dooley.
Extended with RunPod serverless integration and AI battlemap generation.

## License

MIT License
