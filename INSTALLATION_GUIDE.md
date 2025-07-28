# Foundry MCP Integration - Installation Guide

Complete step-by-step guide to install and test the Foundry VTT MCP integration with Claude Desktop.

## Prerequisites

1. **Foundry VTT** (v11+) installed and running
2. **Claude Desktop** installed with active subscription
3. **Node.js** (v18+) installed
4. **Active Foundry world** loaded

## Installation Steps

### Step 1: Install the Foundry Module

1. **Copy the compiled module to Foundry:**
   ```bash
   # From the project root directory
   cp -r packages/foundry-module/ /path/to/foundry/Data/modules/foundry-mcp-bridge/
   ```

   **Windows Example:**
   ```bash
   cp -r packages/foundry-module/ "C:/Users/YourName/AppData/Local/FoundryVTT/Data/modules/foundry-mcp-bridge/"
   ```

   **macOS Example:**
   ```bash
   cp -r packages/foundry-module/ "~/Library/Application Support/FoundryVTT/Data/modules/foundry-mcp-bridge/"
   ```

2. **Restart Foundry VTT**

3. **Enable the module:**
   - Go to **Game Settings** → **Manage Modules**
   - Find "Foundry MCP Bridge" and enable it
   - Click **Save Module Settings**

4. **Configure module settings:**
   - Go to **Game Settings** → **Configure Settings** → **Module Settings**
   - Find "Foundry MCP Bridge" section
   - Configure the following:
     - ✅ **Enable MCP Bridge**: True
     - **MCP Server Host**: `localhost`
     - **MCP Server Port**: `30000`
     - **Socket Namespace**: `/foundry-mcp`
     - ✅ **Allow Character Access**: True
     - ✅ **Allow Compendium Access**: True
     - **Allow Scene Access**: True (optional)
     - **Debug Logging**: True (for testing)

### Step 2: Configure the MCP Server

1. **Set up environment:**
   ```bash
   cd packages/mcp-server
   cp .env.example .env
   ```

2. **Edit .env file** (optional, defaults should work):
   ```env
   LOG_LEVEL=info
   FOUNDRY_HOST=localhost
   FOUNDRY_PORT=30000
   FOUNDRY_NAMESPACE=/foundry-mcp
   ```

3. **Test the server** (optional):
   ```bash
   npm start
   ```
   Press Ctrl+C to stop after testing.

### Step 3: Configure Claude Desktop

1. **Find Claude Desktop config file:**
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. **Edit the configuration file:**
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

   **Important:** Replace `/absolute/path/to/foundry-mcp-integration` with your actual project path.

   **Windows Example:**
   ```json
   "args": ["C:/Projects/FVTTMCP/packages/mcp-server/dist/index.js"]
   ```

3. **Restart Claude Desktop** to load the new configuration.

## Testing the Integration

### Test 1: Basic Connection

1. **Start Foundry VTT** with your world loaded
2. **Verify module is active** - check console for "MCP Bridge" messages
3. **Open Claude Desktop**
4. **Test connection** by asking:
   ```
   Can you connect to my Foundry VTT world?
   ```

### Test 2: Character Information

If you have characters in your world:
```
Show me information about [character name]
```
or
```
List all characters in my world
```

### Test 3: Compendium Search

```
Search for fire spells in the compendiums
```
or
```
Find magic weapons in the compendium packs
```

### Test 4: Scene Information

```
What's in the current scene?
```
or
```
Tell me about the active world
```

## Troubleshooting

### Common Issues

**1. "Not connected to Foundry VTT" error**
- ✅ Check Foundry VTT is running
- ✅ Verify MCP Bridge module is enabled
- ✅ Check module settings match server configuration
- ✅ Look for connection errors in Foundry console (F12)

**2. "Unknown tool" errors in Claude**
- ✅ Restart Claude Desktop after configuration changes
- ✅ Verify the path to index.js is correct and absolute
- ✅ Check that the MCP server built successfully (`npm run build`)

**3. Module not appearing in Foundry**
- ✅ Check the module was copied to the correct directory
- ✅ Verify the module.json file is present
- ✅ Restart Foundry VTT completely

**4. Connection timeouts**
- ✅ Increase connection timeout in module settings
- ✅ Check firewall/antivirus settings
- ✅ Verify port 30000 is available

### Debug Mode

**Enable debug logging in Foundry module:**
- Module Settings → Debug Logging: True
- Open browser console (F12) to see detailed logs

**Enable debug logging in MCP server:**
Edit `.env` file:
```env
LOG_LEVEL=debug
```

**Check Claude Desktop logs:**
- Look for MCP server startup messages
- Check for connection and tool execution logs

### Manual Testing

**Test MCP server directly:**
```bash
cd packages/mcp-server
npm start
```
Look for:
- "Starting Foundry MCP Server"
- "Connecting to Foundry VTT"
- Connection success/failure messages

**Test Foundry module directly:**
1. Open browser console in Foundry (F12)
2. Look for "MCP Bridge" initialization messages
3. Check for socket connection status

## Expected Behavior

### Successful Setup
When everything is working correctly, you should see:

**In Foundry Console:**
```
[foundry-mcp-bridge] Module initialized successfully
[foundry-mcp-bridge] Bridge started successfully
[foundry-mcp-bridge] Socket Bridge: Connected to MCP server
```

**In Claude Desktop:**
- Ability to ask questions about your Foundry data
- Responses with actual character information
- Working compendium searches

### Sample Conversation

```
User: "List my characters"
Claude: "Here are the characters in your Foundry world:
1. Aragorn (Human Ranger, Level 5)
2. Legolas (Elf Ranger, Level 5)  
3. Gimli (Dwarf Fighter, Level 5)
..."

User: "Tell me about Aragorn's stats"
Claude: "Aragorn is a Level 5 Human Ranger with the following stats:
- Hit Points: 45/52
- Armor Class: 15
- Strength: 16 (+3)
- Notable items: Longbow, Studded Leather Armor
..."
```

## Security Notes

- The integration only provides **read-only** access to Foundry data
- No write operations are supported for safety
- All data is sanitized before being sent to Claude
- Uses Foundry's existing session authentication
- No external credentials or API keys required

## Next Steps

Once the basic integration is working:

1. **Explore different queries** to understand capabilities
2. **Adjust permissions** in module settings as needed
3. **Configure logging levels** for production use
4. **Test with different game systems** and data types
5. **Provide feedback** on functionality and improvements

## Getting Help

If you encounter issues:

1. **Check the troubleshooting section** above
2. **Enable debug logging** for detailed information
3. **Check browser console** for Foundry module errors
4. **Verify file paths** in Claude Desktop configuration
5. **Test components individually** (Foundry module, MCP server)

The integration provides a powerful way to interact with your Foundry VTT data through natural language with Claude Desktop!