# Foundry MCP Integration - Claude Code Session Continuation

## Project Status: 95% Complete MVP (Critical Issue Outstanding)

**Last Updated:** July 27, 2025  
**Session Length:** ~4 hours of development  
**Current State:** MCP integration working, tool execution hanging

## Critical Issue That Needs Fixing

**Problem:** When Claude Desktop calls any tool (tested with `list-characters`), the MCP server receives the call but hangs and then exits unexpectedly.

**Symptoms:**
- ✅ MCP server starts successfully
- ✅ Claude Desktop connects and discovers all 7 tools
- ✅ Tool list is properly registered and visible
- 🔴 Tool execution hangs and server process exits
- 🔴 Debugging `console.error()` statements cause JSON parsing errors in Claude Desktop

**Logs Show:**
```
2025-07-27T15:46:38.959Z [foundry-mcp] [info] Message from client: {"method":"tools/call","params":{"name":"list-characters","arguments":{}},"jsonrpc":"2.0","id":10}
[Then multiple JSON parsing errors and server exit]
```

## What Was Accomplished

### ✅ Complete Development Environment
- Monorepo structure with 3 packages: `foundry-module`, `mcp-server`, `shared`
- TypeScript + ESLint + Prettier configuration
- Build system working (`npm run build`)
- Testing framework setup (Vitest)

### ✅ Foundry VTT Module (Working)
- **Location:** `C:\Users\Adam\AppData\Local\FoundryVTT\Data\modules\foundry-mcp-bridge\`
- **Status:** Successfully installed and enabled in Foundry VTT v13
- **Features:** 7 query handlers, settings system, browser-compatible JavaScript
- **Fixed Issues:** ES6 import compatibility, module.json configuration

### ✅ MCP Server (95% Working)
- **Location:** `D:\Projects\FVTTMCP\packages\mcp-server\`
- **Status:** Connects to Claude Desktop, registers tools, but hangs on execution
- **Features:** 7 tools with mock data, StdioServerTransport, Winston logging

### ✅ Claude Desktop Integration
- **Config:** `C:\Users\Adam\AppData\Roaming\Claude\claude_desktop_config.json`
- **Status:** Successfully connects and discovers tools

## The 7 Implemented Tools

All tools are properly registered and visible in Claude Desktop:

1. **get-character** - Retrieve character details by name/ID
2. **list-characters** - List all characters (this is the one that hangs)
3. **search-compendium** - Search spells, items, monsters
4. **get-compendium-item** - Get specific compendium item details
5. **list-compendium-packs** - List available compendium packs
6. **get-current-scene** - Get active scene information
7. **get-world-info** - Get basic world information

## Architecture Overview

```
Claude Desktop ↔ MCP Protocol ↔ MCP Server (with mock data) ↔ [Future: Real Foundry Connection]
```

**Current Implementation:** MCP Server uses mock data (no real Foundry connection yet)  
**Next Phase:** Connect to actual Foundry VTT data via HTTP API or socket.io

## Files to Focus On for Debugging

### Primary Issue Location
- **`D:\Projects\FVTTMCP\packages\mcp-server\src\index.ts`** - Main server with tool routing
- **`D:\Projects\FVTTMCP\packages\mcp-server\src\foundry-client.ts`** - Mock data implementation

### Debugging Steps Needed

1. **Remove debugging console.error statements** from `index.ts` (lines 217-219, 228-236)
2. **Check tool execution timeout** in tool handlers
3. **Verify Promise resolution** in mock data methods
4. **Test minimal tool** that just returns a string

### Tool Handler Location
In `packages/mcp-server/src/index.ts`, around line 46-83:
```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  // Tool routing happens here - this is where it hangs
});
```

## How to Continue the Session

### Step 1: Start the Environment
```bash
cd D:\Projects\FVTTMCP
npm run build
cd packages\mcp-server
npm start  # This starts the MCP server
```

### Step 2: Test the Issue
1. Open Claude Desktop
2. Ask: "List all characters"  
3. Observe the hang in the terminal and logs

### Step 3: Debug Strategy
1. **Remove debugging output** that causes JSON parsing errors
2. **Simplify tool handler** to return static string first
3. **Add proper error handling** and timeouts
4. **Test with minimal payload**

## File Structure
```
D:\Projects\FVTTMCP\
├── packages/
│   ├── foundry-module/     # Foundry VTT module (WORKING)
│   ├── mcp-server/         # MCP server (95% working)
│   └── shared/             # Shared types
├── CLAUDE.md              # Updated project status
├── package.json           # Root workspace config
└── README_FOR_CLAUDE_CODE.md  # This file
```

## Key Directories
- **MCP Server Source:** `packages/mcp-server/src/`
- **Built MCP Server:** `packages/mcp-server/dist/`
- **Foundry Module:** `C:\Users\Adam\AppData\Local\FoundryVTT\Data\modules\foundry-mcp-bridge\`
- **Claude Config:** `C:\Users\Adam\AppData\Roaming\Claude\claude_desktop_config.json`

## Next Session Goals

1. **🎯 Primary Goal:** Fix tool execution hanging issue
2. **📝 Secondary:** Clean up debugging output
3. **🧪 Testing:** Verify all 7 tools work end-to-end
4. **🚀 Stretch:** Implement real Foundry data connection

## Success Criteria

When fixed, you should be able to:
- Ask Claude Desktop: "List all characters"
- Get response: `[{"id":"actor1","name":"Gandalf the Grey"...}]`
- No hanging, no errors, immediate response

## Technology Stack
- **Node.js** with TypeScript
- **@modelcontextprotocol/sdk** v1.7.0+
- **StdioServerTransport** for Claude Desktop connection
- **Winston** for logging
- **Zod** for validation
- **Socket.io** (future integration with real Foundry)

---

**Note:** This represents approximately 4 hours of successful development work. The core architecture is solid and 95% complete. The remaining issue is likely a small bug in tool execution flow or Promise handling.