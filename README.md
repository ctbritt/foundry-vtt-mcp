# Foundry VTT MCP Integration

A Model Context Protocol (MCP) server that bridges Foundry VTT game data with Claude Desktop for AI-powered interactions.

## What This Does

Transform your Foundry VTT game management with AI-powered conversations:

- **Ask Claude about character stats and abilities**
- **Search through compendium data using natural language** 
- **Create actors, NPCs, and quests from simple prompts**
- **Get scene information and world details**
- **Interactive dice roll coordination**
- **Enhanced creature discovery with instant filtering**

## Quick Start

### Prerequisites

- **Foundry VTT v11+** (tested on v13)
- **Node.js 18+** and npm 9+
- **Claude Desktop** with MCP support
- **Active Claude subscription**

### Installation Steps

#### 1. Install the Foundry Module

**Option A: Manual Installation (Current)**
1. Download the latest release from GitHub
2. Extract to your Foundry `Data/modules/` directory
3. Enable "Foundry MCP Bridge" in Module Management

**Option B: Foundry Package Browser (Coming Soon)**
- Search for "MCP Bridge" in the Foundry package browser

#### 2. Install and Run MCP Server

```bash
# Clone repository
git clone https://github.com/adambdooley/foundry-vtt-mcp-integration.git
cd foundry-vtt-mcp-integration

# Install dependencies and build
npm install
npm run build

# Start MCP server
npm run dev
```

#### 3. Configure Claude Desktop

Add this to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "foundry-mcp": {
      "command": "node",
      "args": ["path/to/foundry-mcp-integration/packages/mcp-server/dist/index.js"],
      "env": {
        "FOUNDRY_HOST": "localhost",
        "FOUNDRY_PORT": "31415"
      }
    }
  }
}
```

#### 4. Connect and Use

1. Start Foundry VTT and load your world
2. Start the MCP server (`npm run dev`)
3. Open Claude Desktop
4. Start chatting with Claude about your game data!

## Example Usage

Once configured, ask Claude Desktop:

- *"Show me my character Aragorn's stats"*
- *"Find all CR 12 humanoid creatures for an encounter"*
- *"Create a quest about an evil tomatomancer named Erin Delly"*
- *"Roll a stealth check for my rogue"*
- *"What tokens are in the current scene?"*

## Features

### ✅ Version 0.4.4 - Current

- **17 MCP Tools** for comprehensive game management
- **Enhanced Creature Index** with instant filtering by CR, type, abilities
- **Professional Settings Interface** with streamlined configuration
- **Interactive Dice Roll System** with player targeting
- **Quest and Journal Creation** from natural language prompts
- **Actor Creation** with intelligent compendium matching
- **GM-Only Security** with granular permissions
- **Production-Ready** architecture with error handling

### 🔄 Roadmap

- **Easy Installation Package** for Foundry Package Browser
- **Automated Setup Wizard** for first-time users
- **Additional Game Systems** beyond D&D 5e
- **Enhanced Integrations** with popular Foundry modules

## Architecture

```
Claude Desktop ↔ MCP Protocol ↔ MCP Server ↔ WebSocket ↔ Foundry Module ↔ Foundry VTT
```

- **Foundry Module**: Provides secure data access within Foundry VTT
- **MCP Server**: External Node.js server handling Claude Desktop communication
- **No API Keys Required**: Uses your existing Claude Desktop subscription

## Security & Permissions

- **GM-Only Access**: All functionality restricted to Game Master users
- **Configurable Permissions**: Control what data Claude can access and modify
- **Session-Based Auth**: Uses Foundry's built-in authentication system
- **Audit Logging**: Optional tracking of all AI-generated changes

## Support & Development

- **Issues**: Report bugs on [GitHub Issues](https://github.com/adambdooley/foundry-vtt-mcp-integration/issues)
- **Development**: Built with TypeScript, tested on Foundry VTT v13
- **License**: MIT License

## Tomorrow's Goals

**Making this installable and user-friendly:**

1. **Package for Foundry Browser** - Create proper distribution package
2. **Simplify MCP Server Setup** - Reduce installation complexity  
3. **Automated Configuration** - Setup wizard for first-time users
4. **Documentation Cleanup** - User-friendly installation guides
5. **Testing & Polish** - Ensure smooth installation experience

---

**Ready to transform your TTRPG sessions with AI?** Get started with the installation steps above!