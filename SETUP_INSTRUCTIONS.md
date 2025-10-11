# Foundry MCP Bridge - Setup Instructions

## Quick Setup (5 minutes)

### 1. Module Installation ✅
The module is already installed at:
```
/home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge
```

### 2. Claude Desktop Configuration

Copy this configuration to your Claude Desktop config file:

**Location:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "foundry-mcp": {
      "command": "node",
      "args": ["/home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge/dist/mcp-server/index.js"],
      "env": {
        "FOUNDRY_HOST": "localhost",
        "FOUNDRY_PORT": "31415"
      }
    }
  }
}
```

**Quick Copy Command:**
```bash
cp /home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge/claude_desktop_config.json ~/.config/Claude/claude_desktop_config.json
```

### 3. Start Foundry VTT

1. Start Foundry VTT
2. Load your world
3. Go to **Settings** → **Manage Modules**
4. Enable **"Foundry MCP Bridge"**
5. Click **Save Module Settings**
6. Reload the world

### 4. Start Claude Desktop

1. Close Claude Desktop completely (if open)
2. Start Claude Desktop
3. The MCP server will start automatically
4. Look for the hammer icon 🔨 in Claude's interface

### 5. Test the Connection

Ask Claude Desktop:
```
What actors are in my Foundry world?
```

Claude should respond with your character list!

## Troubleshooting

### Backend Won't Start

**Check logs:**
```bash
tail -f /tmp/foundry-mcp-server/mcp-server.log
tail -f /tmp/foundry-mcp-server/wrapper.log
```

**Common issues:**
- Port 31414 already in use → Kill existing process: `pkill -f backend.js`
- Lock file exists → Remove it: `rm /tmp/foundry-mcp-backend.lock`

### Claude Desktop Won't Connect

1. **Verify config location:**
   ```bash
   cat ~/.config/Claude/claude_desktop_config.json
   ```

2. **Check path is correct:**
   ```bash
   ls -la /home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge/dist/mcp-server/index.js
   ```

3. **Test MCP server manually:**
   ```bash
   node /home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge/dist/mcp-server/index.js
   ```
   (Should wait for input - press Ctrl+C to exit)

### Module Not Showing in Foundry

1. **Verify module.json exists:**
   ```bash
   cat /home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge/module.json
   ```

2. **Check permissions:**
   ```bash
   ls -la /home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge/
   ```

3. **Restart Foundry VTT completely**

## Available MCP Tools

Once connected, Claude has access to 20+ tools:

### Character Management
- `get-character` - Get character stats and info
- `list-characters` - List all characters/NPCs
- `create-actor` - Create new actors/NPCs

### Compendium Search
- `search-compendium` - Find items, spells, creatures
- `search-creatures` - Enhanced creature search with CR filtering

### Quest & Campaign
- `create-quest` - Generate quests
- `list-campaigns` - View campaign structure
- `create-campaign-part` - Add quest parts

### Scene & World
- `get-scene-info` - Current scene details
- `list-scenes` - All available scenes
- `switch-scene` - Change active scene

### Dice & Combat
- `roll-dice` - Roll dice with modifiers
- `request-roll` - Ask players for rolls
- `send-chat-message` - Send messages to chat

### Map Generation (if ComfyUI available)
- `generate-map` - AI battlemap generation
- `check-map-status` - Check generation progress

## Next Steps

### Enable Enhanced Creature Index

1. In Foundry, go to **Module Settings** → **Foundry MCP Bridge**
2. Click **"Configure Enhanced Index"**
3. Check **"Enable Enhanced Creature Index"**
4. Click **"Rebuild Creature Index"**

This enables instant AI searches for creatures by CR, type, and abilities!

### Test Advanced Features

Try asking Claude:
- "Create a quest about investigating a haunted lighthouse"
- "Find all CR 5 undead creatures"
- "Roll a stealth check for my character named [CharacterName]"
- "What's in the current scene?"
- "Generate a 1536x1536 tavern battlemap" (requires ComfyUI)

## Support

- **Module Issues:** Check the Foundry console (F12) for errors
- **MCP Server Issues:** Check logs in `/tmp/foundry-mcp-server/`
- **Claude Issues:** Restart Claude Desktop completely

## Architecture

```
Claude Desktop (MCP Client)
    ↓
MCP Server (index.js) - Port 31414
    ↓
Backend Server (backend.js) - Control channel
    ↓
Foundry Module - Port 31415
    ↓
Foundry VTT
```

The MCP server acts as a bridge between Claude Desktop and your Foundry world!

