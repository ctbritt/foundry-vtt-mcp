# Foundry MCP Bridge Module

A TypeScript-based Foundry VTT module that acts as an authenticated bridge to external MCP servers, enabling AI-powered interactions with game data through Claude Desktop.

## Features

### Core Functionality
- **Socket.io Bridge**: Secure connection to external MCP server
- **Authenticated Data Access**: Uses Foundry's session-based authentication
- **Query Handlers**: Comprehensive data access for characters, compendiums, and scenes
- **Permission System**: Granular control over data access permissions
- **Reconnection Logic**: Automatic reconnection with exponential backoff

### Data Access Capabilities
- **Character Information**: Complete actor data including stats, items, and effects
- **Compendium Search**: Search across all compendium packs with filtering
- **Scene Data**: Current scene information with tokens and notes
- **World Information**: Basic world and system metadata
- **Actor Listing**: List all actors with type identification

### Configuration Options
- Connection settings (host, port, timeout)
- Data access permissions per category
- Debug logging and troubleshooting
- Automatic reconnection parameters

## Module Structure

```
packages/foundry-module/
├── src/
│   ├── main.ts              # Module entry point and lifecycle
│   ├── socket-bridge.ts     # Socket.io connection management
│   ├── queries.ts           # Query handler registration and routing
│   ├── data-access.ts       # Foundry data access and sanitization
│   └── settings.ts          # Module settings and configuration
├── dist/                    # Compiled JavaScript output
├── types/                   # TypeScript definitions
├── lang/                    # Localization files
├── styles/                  # CSS styling
└── module.json              # Foundry module manifest
```

## Installation

1. **Build the module:**
   ```bash
   npm run build
   ```

2. **Copy to Foundry:**
   Copy the entire `packages/foundry-module/` directory to your Foundry `Data/modules/` folder

3. **Enable in Foundry:**
   - Go to Module Management in Foundry VTT
   - Enable "Foundry MCP Bridge"

4. **Configure settings:**
   - Go to Module Settings
   - Configure MCP server connection details
   - Set data access permissions
   - Enable the bridge

## Configuration

### Connection Settings
- **MCP Server Host**: IP/hostname of external MCP server (default: localhost)
- **MCP Server Port**: Port number for MCP server (default: 30000)
- **Socket Namespace**: Socket.io namespace (default: /foundry-mcp)
- **Connection Timeout**: Maximum connection wait time (5-60 seconds)

### Data Access Permissions
- **Character Access**: Allow reading character/actor data
- **Compendium Access**: Allow searching compendium packs
- **Scene Access**: Allow reading current scene information

### Advanced Options
- **Reconnection Attempts**: Number of retry attempts (1-10)
- **Reconnection Delay**: Base delay between attempts (100-10000ms)
- **Debug Logging**: Enable detailed console logging

## Query Handlers

The module registers the following query handlers in `CONFIG.queries`:

### Character Queries
- `foundry-mcp-bridge.getCharacterInfo` - Get character data by name/ID
- `foundry-mcp-bridge.listActors` - List all actors with optional type filter

### Compendium Queries
- `foundry-mcp-bridge.searchCompendium` - Search compendium packs
- `foundry-mcp-bridge.getAvailablePacks` - List available compendium packs

### Scene Queries
- `foundry-mcp-bridge.getActiveScene` - Get current scene information

### Utility Queries
- `foundry-mcp-bridge.getWorldInfo` - Get world and system information
- `foundry-mcp-bridge.ping` - Health check and connectivity test

## Security Features

### Data Sanitization
- Removes sensitive fields (passwords, tokens, secrets)
- Ensures JSON-serializable output
- Recursive cleaning of nested objects

### Permission Validation
- Per-feature access control
- Settings-based permission enforcement
- Graceful error handling for denied access

### Session Authentication
- Uses Foundry's built-in session management
- No external tokens or credentials required
- Automatic authentication through game session

## Error Handling

### Connection Management
- Automatic reconnection with exponential backoff
- Connection state tracking and reporting
- Graceful degradation when server unavailable

### Query Error Handling
- Validation of query parameters
- Comprehensive error messages
- Safe fallbacks for missing data

### Logging and Debugging
- Configurable debug logging levels
- Structured error reporting
- Console-based troubleshooting information

## API Integration

### Socket.io Events
- **Incoming**: `mcp-query` - Receive queries from MCP server
- **Outgoing**: Configurable events for server communication
- **Health Check**: `ping`/`pong` connectivity verification

### Foundry Integration
- **Hooks**: `init`, `ready`, `canvasReady`, `closeSettingsConfig`
- **Settings API**: Full integration with Foundry's settings system
- **Collections**: Direct access to `game.actors`, `game.scenes`, `game.packs`

## Development

### Building
```bash
npm run build      # Compile TypeScript
npm run dev        # Watch mode compilation
npm run typecheck  # Type checking only
```

### Linting
```bash
npm run lint       # Check code style
npm run lint:fix   # Fix auto-fixable issues
```

### Debugging
- Enable "Debug Logging" in module settings
- Check browser console for detailed logs
- Use `window.foundryMCPDebug` for runtime inspection

## Troubleshooting

### Common Issues
1. **Connection Failed**: Check MCP server is running and accessible
2. **Permission Denied**: Verify data access permissions in settings
3. **Query Timeouts**: Increase connection timeout in settings
4. **Module Not Loading**: Check browser console for initialization errors

### Debug Commands
```javascript
// Check bridge status
window.foundryMCPDebug.getStatus();

// Manual connection control
window.foundryMCPDebug.start();
window.foundryMCPDebug.stop();
window.foundryMCPDebug.restart();
```

## Compatibility

- **Foundry VTT**: v11+ (verified with v12)
- **Node.js**: 18+ for development
- **TypeScript**: 5.0+
- **Socket.io**: 4.7+

## License

MIT License - See root project LICENSE file for details.