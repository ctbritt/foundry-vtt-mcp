# Foundry VTT MCP Integration

A Model Context Protocol (MCP) server that bridges Foundry VTT game data with Claude Desktop, enabling natural AI-powered conversations about your game world.

## 🎯 Project Overview

This project creates a seamless connection between Foundry VTT and Claude Desktop through the MCP protocol, allowing users to:

- Ask Claude about character stats and abilities
- Search through compendium data using natural language
- Get scene information and world details
- Access game data through AI-powered conversations

## 🏗️ Architecture

```
Claude Desktop ↔ MCP Protocol ↔ Foundry MCP Server ↔ WebSocket (31415) ↔ Foundry Module ↔ Foundry VTT Data
```

### Components

- **MCP Server** (`packages/mcp-server/`): External Node.js server that communicates with Claude Desktop
- **Foundry Module** (`packages/foundry-module/`): Foundry VTT module that provides data access
- **Shared Types** (`shared/`): Common TypeScript types and schemas

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Foundry VTT (v11+)
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

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start MCP server in watch mode
npm run build            # Build all packages
npm run test             # Run tests

# Code Quality
npm run lint             # Lint all code
npm run lint:fix         # Fix linting issues
npm run format           # Format code with Prettier
npm run typecheck        # Type check all packages

# Utilities
npm run clean            # Clean build artifacts
```

### Tech Stack

- **MCP Server**: Node.js, TypeScript, @modelcontextprotocol/sdk, Socket.io, Winston, Zod
- **Foundry Module**: JavaScript (ES6), Foundry API, Socket.io client
- **Development**: Vitest, ESLint, Prettier, TypeScript

## 🔧 Configuration

### MCP Server (.env)

```bash
# Foundry connection
FOUNDRY_HOST=localhost
FOUNDRY_PORT=30000

# Logging
LOG_LEVEL=info

# Development
NODE_ENV=development
```

### Foundry Module Settings

Configure through Foundry VTT's Module Settings:

- **Enable MCP Bridge**: Turn the bridge on/off
- **MCP Server Connection**: Host and port settings
- **Data Access Permissions**: Control what data is accessible
- **Debug Logging**: Enable detailed logging

## 🎮 Usage Examples

Once configured, you can ask Claude questions like:

- "Show me my character Aragorn's stats"
- "Find all fire spells in the compendiums"
- "What tokens are in the current scene?"
- "List all available compendium packs"

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and tests
6. Submit a pull request

## 🔒 Security

- All data access is read-only by default
- Permissions can be configured per data type
- No external API keys or tokens required
- Uses Foundry's built-in session authentication

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- Create an issue for bugs or feature requests
- Check the [docs/](docs/) directory for detailed documentation
- Review [CLAUDE.md](CLAUDE.md) for development context

## 🗺️ Roadmap

### Phase 1 (MVP) ✅ COMPLETE & WORKING!
- ✅ Character information retrieval - **DEPLOYED**
- ✅ Compendium search functionality - **DEPLOYED**
- ✅ Basic scene information - **DEPLOYED**
- ✅ World information access - **DEPLOYED**
- ✅ Read-only operations - **DEPLOYED**
- ✅ **END-TO-END INTEGRATION WORKING** - Claude Desktop successfully queries live Foundry campaigns!

### Phase 2 (Enhanced Features)
- [ ] Real-time updates
- [ ] Write operations (with permissions)
- [ ] Advanced query capabilities
- [ ] Combat state information

### Phase 3 (Distribution)
- [ ] Easy installation process
- [ ] Community package distribution
- [ ] Documentation and tutorials