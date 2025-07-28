# Foundry MCP Server

An external MCP (Model Context Protocol) server that connects Claude Desktop to Foundry VTT, enabling natural language interactions with game data.

## Features

### Core MCP Tools
- **get-character** - Retrieve detailed character information by name or ID
- **list-characters** - List all available characters with filtering options
- **search-compendium** - Search across compendium packs for items, spells, monsters
- **get-compendium-item** - Get detailed information about specific compendium items
- **list-compendium-packs** - List all available compendium packs
- **get-current-scene** - Get active scene information with tokens and layout
- **get-world-info** - Get world and system information

### Technical Features
- **Socket.io Connection** - Reliable connection to Foundry VTT via the bridge module
- **Automatic Reconnection** - Exponential backoff reconnection logic
- **Structured Logging** - Winston-based logging with configurable levels
- **Input Validation** - Zod schema validation for all tool parameters
- **Error Handling** - Graceful error handling with informative messages
- **Claude Integration** - StdioServerTransport for Claude Desktop communication

## Architecture

```
Claude Desktop ↔ MCP Protocol ↔ MCP Server ↔ Socket.io ↔ Foundry Module ↔ Foundry VTT
```

The MCP server acts as a bridge between Claude Desktop and Foundry VTT:

1. **Claude Desktop** sends MCP tool requests
2. **MCP Server** receives requests and validates parameters
3. **Socket.io connection** forwards queries to Foundry module
4. **Foundry Module** executes queries and returns sanitized data
5. **MCP Server** formats responses for Claude Desktop

## Installation & Setup

### 1. Build the Server

```bash
cd packages/mcp-server
npm run build
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Foundry settings:

```env
LOG_LEVEL=info
FOUNDRY_HOST=localhost
FOUNDRY_PORT=30000
FOUNDRY_NAMESPACE=/foundry-mcp
```

### 3. Configure Claude Desktop

See [CLAUDE_DESKTOP_SETUP.md](./CLAUDE_DESKTOP_SETUP.md) for complete Claude Desktop configuration instructions.

### 4. Start Foundry VTT

1. Launch Foundry VTT and load a world
2. Enable the "Foundry MCP Bridge" module
3. Configure module settings to allow data access
4. Verify the bridge is connected

## Usage Examples

Once configured, you can interact with your Foundry data through natural language:

### Character Queries
```
"Show me the stats for Aragorn"
"List all the wizards in my party"
"What spells does my character know?"
```

### Compendium Searches
```
"Find all fire spells"
"Search for magic weapons in the compendiums"
"Show me available dragon stat blocks"
```

### Scene Information
```
"What's happening in the current scene?"
"List all tokens on the battlefield"
"Tell me about the active world"
```

## Tool Reference

### Character Tools

#### `get-character`
Retrieve detailed character information including stats, items, and effects.

**Parameters:**
- `identifier` (string) - Character name or ID

**Example Response:**
```json
{
  "id": "actor123",
  "name": "Aragorn",
  "type": "character",
  "basicInfo": {
    "level": 5,
    "class": "Ranger",
    "hitPoints": {"current": 45, "max": 52}
  },
  "stats": {
    "abilities": {
      "str": {"score": 16, "modifier": 3}
    }
  },
  "items": [...],
  "effects": [...]
}
```

#### `list-characters`
List all characters with optional type filtering.

**Parameters:**
- `type` (string, optional) - Filter by character type

### Compendium Tools

#### `search-compendium`
Search through compendium packs for content.

**Parameters:**
- `query` (string) - Search query (minimum 2 characters)
- `packType` (string, optional) - Filter by pack type
- `limit` (number, optional) - Max results (1-50, default 20)

#### `get-compendium-item`
Get detailed information about a specific compendium item.

**Parameters:**
- `packId` (string) - ID of the compendium pack
- `itemId` (string) - ID of the specific item

#### `list-compendium-packs`
List all available compendium packs.

**Parameters:**
- `type` (string, optional) - Filter by pack type

### Scene Tools

#### `get-current-scene`
Get information about the currently active scene.

**Parameters:**
- `includeTokens` (boolean, default true) - Include token information
- `includeHidden` (boolean, default false) - Include hidden elements

#### `get-world-info`
Get basic world and system information.

**Parameters:** None

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Logging level (error, warn, info, debug) |
| `LOG_FORMAT` | `simple` | Log format (simple, json) |
| `FOUNDRY_HOST` | `localhost` | Foundry VTT host |
| `FOUNDRY_PORT` | `30000` | Foundry VTT port |
| `FOUNDRY_NAMESPACE` | `/foundry-mcp` | Socket.io namespace |
| `FOUNDRY_CONNECTION_TIMEOUT` | `10000` | Connection timeout (ms) |
| `FOUNDRY_RECONNECT_ATTEMPTS` | `5` | Max reconnection attempts |
| `FOUNDRY_RECONNECT_DELAY` | `1000` | Base reconnection delay (ms) |

### Development Configuration

For development and debugging:

```env
LOG_LEVEL=debug
LOG_FORMAT=json
ENABLE_FILE_LOGGING=true
LOG_FILE_PATH=./logs/debug.log
```

## Development

### Building
```bash
npm run build      # Compile TypeScript
npm run dev        # Watch mode compilation
npm run typecheck  # Type checking only
```

### Testing
```bash
npm test           # Run tests
npm run test:watch # Watch mode testing
```

### Linting
```bash
npm run lint       # Check code style
npm run lint:fix   # Fix auto-fixable issues
```

### Running Standalone
```bash
# For testing without Claude Desktop
npm start
```

## Logging

The server uses structured logging with Winston. Log levels:

- **error** - Critical errors and failures
- **warn** - Non-critical issues and warnings  
- **info** - General operational information
- **debug** - Detailed debugging information

### Log Output Examples

```
2025-01-27T10:30:15.123Z [info]: Starting Foundry MCP Server {"version":"1.0.0","foundryHost":"localhost"}
2025-01-27T10:30:15.456Z [info]: Successfully connected to Foundry VTT
2025-01-27T10:30:15.789Z [info]: MCP server started successfully {"toolsAvailable":7,"foundryConnected":true}
```

## Error Handling

The server provides comprehensive error handling:

### Connection Errors
- Automatic reconnection with exponential backoff
- Clear error messages when Foundry is unavailable
- Graceful degradation when features are disabled

### Tool Execution Errors
- Parameter validation with helpful error messages
- Safe handling of missing data
- Proper error formatting for Claude Desktop

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Not connected to Foundry VTT" | Foundry not running or module disabled | Start Foundry and enable MCP Bridge module |
| "Character 'X' not found" | Character doesn't exist | Check character name spelling |
| "Access denied - feature is disabled" | Permission not granted in module | Enable data access in Foundry module settings |
| "Search query must be at least 2 characters" | Query too short | Use longer search terms |

## Security

### Data Sanitization
- Removes sensitive fields (passwords, tokens, secrets)
- Limits response sizes to prevent overwhelming Claude
- Ensures all data is JSON-serializable

### Access Control
- Read-only access to Foundry data
- Permission-based access control via Foundry module settings
- No external credentials required

### Network Security
- Local connections only by default
- Uses Foundry's existing session authentication
- No direct database access

## Performance

### Optimization Features
- Connection pooling and reuse
- Response size limits (20 items max for lists)
- Efficient query routing
- Automatic reconnection management

### Performance Tips
- Use specific character names instead of listing all characters
- Filter compendium searches by pack type when possible
- Enable only necessary data access permissions
- Use appropriate log levels in production

## Troubleshooting

### Connection Issues

**Symptom:** "Not connected to Foundry VTT"
```bash
# Check if Foundry is running
curl http://localhost:30000

# Check module settings in Foundry
# Verify MCP Bridge module is enabled and configured
```

**Symptom:** Connection timeouts
```env
# Increase timeout in .env
FOUNDRY_CONNECTION_TIMEOUT=15000
```

### Tool Errors

**Symptom:** "Unknown tool" errors
```bash
# Verify server build is up to date
npm run build

# Check Claude Desktop configuration
# Restart Claude Desktop after config changes
```

### Debug Mode

Enable comprehensive debugging:

```env
LOG_LEVEL=debug
ENABLE_FILE_LOGGING=true
LOG_FILE_PATH=./logs/debug.log
```

Then check logs:
```bash
tail -f logs/debug.log
```

## Contributing

1. Follow the existing TypeScript patterns
2. Add proper error handling and logging
3. Include input validation with Zod schemas
4. Update documentation for new features
5. Test with both successful and error scenarios

## License

MIT License - See root project LICENSE file for details.