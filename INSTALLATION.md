# Foundry VTT AI Model Integration - Installation Guide

## Overview

This guide covers the complete installation of the Foundry VTT AI Model Integration system, which consists of two components:

1. **Foundry Module**: Installed through Foundry VTT's module manager
2. **MCP Server**: Standalone application that bridges Foundry VTT with AI models

## Prerequisites

- **Foundry VTT**: Version 11 or higher (verified through v13)
- **AI Model Access**: Claude Desktop, local LLM, or compatible MCP client
- **Operating System**: Windows 10+, macOS 10.14+, or Linux (Ubuntu 18+)
- **Node.js**: Version 18+ (for MCP Server)

## Part 1: Install Foundry Module

### Method 1: Via Foundry Module Manager (Recommended)

1. **Open Foundry VTT** and navigate to your world
2. **Go to Settings** → **Manage Modules**
3. **Click "Install Module"**
4. **Paste the manifest URL**:
   ```
   https://github.com/adambdooley/foundry-vtt-mcp/releases/latest/download/module.json
   ```
5. **Click "Install"** and wait for completion
6. **Enable the module** in your world
7. **Reload Foundry VTT** when prompted

### Method 2: Manual Installation

1. **Download the module ZIP** from [GitHub Releases](https://github.com/adambdooley/foundry-vtt-mcp/releases)
2. **Extract to your Foundry modules directory**:
   - **Windows**: `%LOCALAPPDATA%\FoundryVTT\Data\modules\`
   - **macOS**: `~/Library/Application Support/FoundryVTT/Data/modules/`
   - **Linux**: `~/.local/share/FoundryVTT/Data/modules/`
3. **Restart Foundry VTT**
4. **Enable the module** in your world settings

## Part 2: Install MCP Server Application

### Windows Installation

1. **Download** `Foundry-MCP-Server-Setup.exe` from [GitHub Releases](https://github.com/adambdooley/foundry-vtt-mcp/releases)
2. **Run the installer** as Administrator
3. **Follow the installation wizard**:
   - Choose installation directory (default recommended)
   - Create desktop shortcut (optional)
   - Add to Start Menu (recommended)
4. **Launch the application** after installation
5. **Configure Windows Firewall** if prompted (allow network access)

### macOS Installation

1. **Download** `Foundry-MCP-Server.dmg` from [GitHub Releases](https://github.com/adambdooley/foundry-vtt-mcp/releases)
2. **Mount the DMG** by double-clicking
3. **Drag the application** to the Applications folder
4. **First launch**: Right-click → "Open" to bypass Gatekeeper
5. **Grant permissions** for network access when prompted

### Linux Installation

#### AppImage (Recommended)
1. **Download** `Foundry-MCP-Server.AppImage` from [GitHub Releases](https://github.com/adambdooley/foundry-vtt-mcp/releases)
2. **Make executable**:
   ```bash
   chmod +x Foundry-MCP-Server.AppImage
   ```
3. **Run the application**:
   ```bash
   ./Foundry-MCP-Server.AppImage
   ```

#### Debian/Ubuntu Package
1. **Download** `foundry-mcp-server.deb` from [GitHub Releases](https://github.com/adambdooley/foundry-vtt-mcp/releases)
2. **Install the package**:
   ```bash
   sudo dpkg -i foundry-mcp-server.deb
   sudo apt-get install -f  # Fix any dependency issues
   ```
3. **Launch from Applications** or command line:
   ```bash
   foundry-mcp-server
   ```

## Part 3: Configuration

### 1. Configure MCP Server

1. **Launch the MCP Server application**
2. **Verify server status** (should show "Server Running" on port 31415)
3. **Check firewall settings** - ensure port 31415 is accessible
4. **Keep the application running** - it needs to stay active for AI integration

### 2. Configure AI Model Connection

#### Claude Desktop Setup
1. **Open Claude Desktop**
2. **Navigate to Settings** → **Feature Preview** → **Model Context Protocol**
3. **Add MCP Server** configuration:
   ```json
   {
     "mcpServers": {
       "foundry-mcp": {
         "command": "foundry-mcp-server",
         "args": []
       }
     }
   }
   ```
4. **Restart Claude Desktop**
5. **Verify connection** - you should see "foundry-mcp" in the available tools

#### Alternative: Manual MCP Server Configuration
If using the standalone executable instead of the Electron app:
```json
{
  "mcpServers": {
    "foundry-mcp": {
      "command": "node",
      "args": ["path/to/foundry-mcp-server/dist/index.js"]
    }
  }
}
```

### 3. Configure Foundry Module

1. **In Foundry VTT**, go to **Settings** → **Module Settings** → **AI Model Integration Bridge**
2. **Enable MCP Bridge**: Toggle to "Enabled"
3. **Configure connection settings**:
   - **MCP Host**: `localhost` (default)
   - **MCP Port**: `31415` (default)
   - **Connection Timeout**: `10000ms` (default)
4. **Permission Settings**:
   - **Allow Write Operations**: Enable for actor creation and journal management
   - **Enable Enhanced Creature Index**: Enable for faster searches
5. **Save settings** and verify connection

## Part 4: Verification & Testing

### 1. Test MCP Server Connection

1. **Check MCP Server status** in the application dashboard
2. **Verify port 31415** is listening:
   - **Windows**: `netstat -an | findstr 31415`
   - **macOS/Linux**: `netstat -an | grep 31415`
3. **Check server logs** via the "View Logs" button if issues arise

### 2. Test Foundry Module

1. **In Foundry VTT**, check the **Console** (F12) for connection messages
2. **Look for**: `[foundry-mcp-bridge] GM connection established`
3. **Verify settings menu** shows "Connected" status
4. **Test basic functionality** through the Enhanced Creature Index

### 3. Test AI Integration

1. **In Claude Desktop**, verify "foundry-mcp" appears in the MCP connection list
2. **Test basic queries**:
   - "List all characters in my Foundry world"
   - "Search for dragons in the compendium"
   - "What's the current scene in Foundry?"
3. **Verify responses** contain actual data from your Foundry world

## Troubleshooting

### Common Issues

#### "Module not connecting to MCP Server"
- **Check MCP Server is running** (green status in dashboard)
- **Verify port 31415** is not blocked by firewall
- **Restart both applications** in this order: MCP Server → Foundry VTT
- **Check Foundry console** for specific error messages

#### "Claude Desktop doesn't see MCP tools"
- **Verify MCP Server configuration** in Claude Desktop settings
- **Restart Claude Desktop** after configuration changes
- **Check MCP Server logs** for connection attempts
- **Ensure correct file paths** in configuration

#### "Permission denied" or "GM only" errors
- **Verify you are logged in as GM** in Foundry VTT
- **Check module settings** - ensure proper permissions are enabled
- **Restart Foundry world** if switching between GM and player accounts

#### "Enhanced Creature Index not building"
- **Check world directory permissions** for write access
- **Verify Enhanced Index is enabled** in module settings
- **Manually rebuild** through the Enhanced Index settings menu
- **Check available disk space** (index files can be 1-5MB)

### Log Locations

- **MCP Server Logs**: Available via "View Logs" button in app
- **Foundry Module Logs**: Browser Console (F12) in Foundry VTT
- **Claude Desktop Logs**: Claude Desktop → Help → View Logs

### Support Channels

- **GitHub Issues**: [Report bugs and feature requests](https://github.com/adambdooley/foundry-vtt-mcp/issues)
- **Documentation**: [Project README](https://github.com/adambdooley/foundry-vtt-mcp)

## Security Notes

- **GM-Only Access**: All MCP functionality is restricted to Game Master users
- **Local Network Only**: MCP Server only accepts connections from localhost by default
- **No External Data**: No game data is sent to external services without explicit user action
- **Permission Controls**: Write operations can be disabled while maintaining read access

## Performance Tips

- **Enhanced Creature Index**: Enable for instant compendium searches (vs 2+ minute timeouts)
- **Connection Timeout**: Increase if experiencing slow network connections
- **Batch Operations**: Use bulk actor creation features for better performance
- **Resource Usage**: MCP Server uses minimal resources when idle

## Uninstallation

### Remove Foundry Module
1. **Disable module** in Foundry world settings
2. **Remove from modules directory** (see installation paths above)
3. **Restart Foundry VTT**

### Remove MCP Server
- **Windows**: Use "Add or Remove Programs" or run uninstaller
- **macOS**: Move application to Trash from Applications folder  
- **Linux**: `sudo apt remove foundry-mcp-server` (deb) or delete AppImage file

### Remove Configuration
- **Claude Desktop**: Remove MCP server configuration from settings
- **Clean up logs**: Delete log directories if desired (check "View Logs" for locations)