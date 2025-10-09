# Foundry VTT MCP Bridge

Connect Foundry VTT to Claude Desktop for AI-powered campaign management through the Model Context Protocol (MCP).

This fork extends the original [Foundry VTT MCP Bridge](https://github.com/adambdooley/foundry-vtt-mcp) by [Adam Dooley](https://github.com/adambdooley) with AI-powered battlemap generation capabilities using RunPod serverless ComfyUI.

## Features

### Core MCP Bridge Features
- **Quest Creation**: Create quests from prompts that incorporate your world and journals
- **Character Management**: Query character stats, abilities, and information
- **Compendium Search**: Find items, spells, and creatures using natural language
- **Content Creation**: Generate actors, NPCs, and quest journals from prompts
- **Scene Information**: Access current scene data and world details
- **Dice Coordination**: Interactive roll requests with player targeting
- **Campaign Management**: Multi-part quest and campaign tracking
- **20+ MCP Tools** for Claude to interact with Foundry VTT

### Extended: AI Battlemap Generation 🗺️

Generate high-quality battlemaps using AI through RunPod serverless ComfyUI or local ComfyUI installations.

- **Remote GPU Processing**: Use RunPod serverless endpoints for AI image generation
- **S3 Storage Integration**: Automatically store generated maps in S3 buckets  
- **Auto-Scene Creation**: Generated maps automatically attach to Foundry VTT scenes
- **Flexible Configuration**: Support for local ComfyUI, remote ComfyUI pods, or serverless endpoints
- **Cost Effective**: Pay-per-use serverless model (~$0.03 per 1536x1536 battlemap)

**Example:**
```
Ask Claude: "Generate a 1536x1536 desert oasis battlemap with palm trees and ancient ruins"
```

## Installation

### Prerequisites

- **Foundry VTT v13**
- **Claude Desktop** with MCP support (Claude Pro/Max plan required)
- **Node.js 18+** for manual installation

### Quick Start

1. **Clone and Build**
   ```bash
   git clone https://github.com/ctbritt/foundry-vtt-mcp.git
   cd foundry-vtt-mcp
   npm install
   npm run build
   ```

2. **Install Foundry Module**
   - Open Foundry VTT v13
   - Go to Add-on Modules → Install Module
   - Use manifest URL: `https://github.com/ctbritt/foundry-vtt-mcp/blob/master/packages/foundry-module/module.json`
   - Enable "Foundry MCP Bridge" in Module Management

3. **Configure Claude Desktop**
   
   Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or equivalent:
   
   ```json
   {
     "mcpServers": {
       "foundry-mcp": {
         "command": "node",
         "args": ["/path/to/foundry-vtt-mcp/packages/mcp-server/dist/index.js"],
         "env": {
           "FOUNDRY_HOST": "localhost",
           "FOUNDRY_PORT": "31415"
         }
       }
     }
   }
   ```

4. **Start Using**
   - Start Foundry VTT and load your world
   - Open Claude Desktop (MCP server starts automatically)
   - Ask Claude about your Foundry world!

## AI Battlemap Generation Setup (Optional)

### Option 1: RunPod Serverless (Cloud)

1. **Create RunPod Endpoint**
   - Sign up at [RunPod.io](https://www.runpod.io)
   - Deploy a serverless ComfyUI endpoint
   - Note your API key and endpoint ID

2. **Create S3 Bucket** (optional, for persistent storage)
   - Create an S3 bucket in AWS
   - Note bucket name, region, and credentials

3. **Configure Environment**
   
   Create `/path/to/foundry-vtt-mcp/.env`:
   ```bash
   # RunPod Configuration
   RUNPOD_ENABLED=true
   RUNPOD_API_KEY=your_runpod_api_key
   RUNPOD_ENDPOINT_ID=your_endpoint_id
   
   # S3 Storage (optional)
   S3_BUCKET=your-bucket-name
   S3_REGION=us-east-1
   S3_ACCESS_KEY_ID=your_access_key
   S3_SECRET_ACCESS_KEY=your_secret_key
   ```

4. **Configure in Foundry**
   - Open Module Settings → Map Generation Service
   - Select "Remote Service (RunPod/Cloud)"
   - Enter your RunPod and S3 credentials
   - Save settings

### Option 2: Local ComfyUI

1. Install ComfyUI locally
2. Foundry module will auto-detect and use local installation
3. No additional configuration needed

### Architecture

**Local Mode:**
```
Claude Desktop → MCP Server → Local ComfyUI → Foundry VTT
```

**Remote RunPod Mode:**
```
Claude Desktop → MCP Server → RunPod API → S3 Storage → Foundry VTT
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Foundry Connection
FOUNDRY_HOST=localhost
FOUNDRY_PORT=31415
FOUNDRY_NAMESPACE=/foundry-mcp

# Logging
LOG_LEVEL=info
LOG_FORMAT=simple

# RunPod (for AI map generation)
RUNPOD_ENABLED=false
RUNPOD_API_KEY=
RUNPOD_ENDPOINT_ID=

# S3 Storage (for AI map generation)
S3_BUCKET=
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
```

### Foundry Module Settings

Access via Module Settings → Foundry MCP Bridge:

- **Enable MCP Bridge**: Enable/disable connection
- **Server Host/Port**: Connection details (default: localhost:31415)
- **Allow Write Operations**: Let Claude modify world content
- **Map Generation Service**: Configure local vs remote battlemap generation
- **Enhanced Creature Index**: Improved AI search capabilities

## Usage Examples

Once connected, ask Claude Desktop:

- *"Show me my character Clark's stats"*
- *"Find all CR 12 humanoid creatures for an encounter"*
- *"Create a quest about investigating missing villagers"*
- *"Roll a stealth check for Tulkas"*
- *"What's in the current Foundry scene?"*
- *"Generate a 1536x1536 forest battlemap with a river and bridge"*

## Security

All sensitive configuration (API keys, credentials) is:
- ✅ Stored server-side only in `.env` files
- ✅ Never committed to Git (protected by `.gitignore`)
- ✅ Hidden from players and client browsers
- ✅ Validated with `check-secrets.sh` before commits

**Security utilities:**
- `check-secrets.sh` - Run before commits to verify no credentials in tracked files

### Session-Based Authentication
- All functionality restricted to Game Master users
- Uses Foundry's built-in authentication system
- Configurable permissions for data access

## Troubleshooting

### MCP Server Won't Connect
- Verify Foundry VTT is running and world is loaded
- Check `FOUNDRY_PORT` matches your Foundry port (default: 31415)
- Restart Claude Desktop
- Check MCP server logs for errors

### RunPod Jobs Stuck in Queue
- Verify RunPod account has credits
- Check endpoint status in RunPod dashboard
- Ensure workers are not throttled

### S3 Upload Failed
- Verify AWS credentials in `.env`
- Check S3 bucket permissions (public read access)
- Ensure bucket region matches `S3_REGION`

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run in development mode
npm run dev

# Run security check
./check-secrets.sh
```

## System Requirements

- **Foundry VTT**: Version 13
- **Claude Desktop**: Latest version with MCP support
- **Claude Plan**: Pro or Max (required for MCP servers)
- **Node.js**: 18+ (for manual installation)
- **Operating System**: Windows, macOS, or Linux

## Credits & License

**Original Project:** [Foundry VTT MCP Bridge](https://github.com/adambdooley/foundry-vtt-mcp) by [Adam Dooley](https://github.com/adambdooley)

This fork adds RunPod serverless integration and AI battlemap generation. All core functionality and original features remain unchanged.

If you find this project useful:
- ⭐ Star the repository
- 💖 [Support Adam Dooley on Patreon](https://www.patreon.com/c/Adambdooley)
- 📺 [Subscribe to Adam's YouTube channel](https://www.youtube.com/channel/UCVrSC-FzuAk5AgvfboJj0WA)

**License:** MIT License

## Support

- **Issues**: [GitHub Issues](https://github.com/ctbritt/foundry-vtt-mcp/issues)
- **Original Project Issues**: [GitHub Issues](https://github.com/adambdooley/foundry-vtt-mcp/issues)
- **Documentation**: Built with TypeScript, comprehensive inline documentation

---

**Built with Claude Code** 🤖
