# Foundry VTT MCP Integration

A Model Context Protocol (MCP) server that bridges Foundry VTT game data with Claude Desktop for AI-powered interactions your game world.



These tools create a connection between Foundry VTT and Claude Desktop through the MCP protocol, allowing users to:

- Ask Claude about character stats and abilities
- Search through compendium data using natural language
- Get scene information and world details
- Access game data 

## Architecture

```
Claude Desktop ↔ MCP Protocol ↔ Foundry MCP Server ↔ WebSocket (31415) ↔ Foundry Module ↔ Foundry VTT Data
```

### Components

- **MCP Server** (`packages/mcp-server/`): External Node.js server that communicates with Claude Desktop
- **Foundry Module** (`packages/foundry-module/`): Foundry VTT module that provides data access
- **Shared Types** (`shared/`): Common TypeScript types and schemas

## Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Foundry VTT (v13+)
- Claude Desktop with MCP support

### Installation

1. **Clone and setup the project:**
   ```bash
   git clone https://github.com/yourusername/foundry-mcp-integration.git
   cd foundry-mcp-integration
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Install Foundry module:**
   - Copy `packages/foundry-module/` to your Foundry `Data/modules/` directory
   - Enable "Foundry MCP Bridge" in Module Management

4. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

5. **Start MCP server:**
   ```bash
   npm run dev
   ```

6. **Configure Claude Desktop:**
   Add the MCP server to your Claude Desktop configuration

## 📦 Monorepo Structure

```
foundry-mcp-integration/
├── packages/
│   ├── foundry-module/          # Foundry VTT module
│   │   ├── module.json          # Module manifest
│   │   ├── scripts/             # Module scripts
│   │   ├── styles/              # CSS styling
│   │   └── lang/                # Localization
│   └── mcp-server/              # MCP server package
│       ├── src/                 # TypeScript source
│       ├── dist/                # Compiled output
│       └── package.json         # Dependencies
├── shared/                      # Shared TypeScript types
├── docs/                        # Documentation
├── package.json                 # Root workspace config
├── tsconfig.json                # TypeScript config
└── claude.md                    # Development context
```

### Foundry Module Settings

Configure through Foundry VTT's Module Settings:

- **Enable MCP Bridge**: Turn the bridge on/off
- **MCP Server Connection**: Host and port settings
- **Data Access Permissions**: Control what data is accessible
- **Debug Logging**: Enable detailed logging

## Usage Examples

Once configured, you can ask Claude questions like:

- "Show me my character Aragorn's stats"
- "Find all fire spells in the compendiums"
- "What tokens are in the current scene?"
- "List all available compendium packs"

## Security

- All data access is read-only by default
- Permissions can be configured per data type
- No external API keys or tokens required
- Uses Foundry's built-in session authentication

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- Create an issue for bugs or feature requests


## Roadmap

### Phase 1 (MVP) COMPLETE
- Character information retrieval
- Compendium search functionality
- Basic scene information 
- World information access 
- Read-only operations

### Phase 2 
- Compendium Write operations

### Phase 3 (Distribution)
- [ ] Easy installation process
- [ ] Community package distribution
