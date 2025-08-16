# Foundry MCP Server Portable Installation Guide

## 🎯 Quick Start (5 Minutes)

1. **Download and extract** the portable package
2. **Double-click** `scripts\install.bat`
3. **Restart Claude Desktop** completely
4. **Start chatting** with AI-powered Foundry VTT management!

## 📋 Prerequisites

### Required Software
- ✅ **Windows 10 or Windows 11**
- ✅ **Claude Desktop** ([Download here](https://claude.ai/desktop))
- ✅ **Foundry VTT** with MCP Bridge module installed

### System Requirements
- **Disk Space**: ~200MB free space
- **Memory**: 4GB RAM minimum (8GB recommended)
- **Permissions**: No administrator rights required
- **Internet**: Required for initial setup only

## 🚀 Step-by-Step Installation

### Step 1: Prepare Claude Desktop
1. **Download and install** Claude Desktop from https://claude.ai/desktop
2. **Run Claude Desktop** at least once to create configuration directories
3. **Sign in** with your Claude account
4. **Close Claude Desktop** completely before proceeding

### Step 2: Extract Portable Package
1. **Download** `FoundryMCPServerPortable-v0.4.8.zip`
2. **Extract** to any location (Desktop, Documents, USB drive, etc.)
   - ✅ No special location required
   - ✅ No administrator rights needed
   - ✅ Can be run from portable storage
3. **Navigate** to the extracted folder

### Step 3: Run Installation
1. **Double-click** `scripts\install.bat`
2. **Follow the prompts** - the installer will:
   - ✅ Check for Claude Desktop
   - ✅ Create installation directory (`%LOCALAPPDATA%\FoundryMCPServer`)
   - ✅ Copy portable Node.js runtime
   - ✅ Install MCP server files
   - ✅ Configure Claude Desktop automatically
   - ✅ Create utility shortcuts

### Step 4: Restart Claude Desktop
1. **Completely quit** Claude Desktop if running
2. **Restart** Claude Desktop
3. **Wait** for initialization (may take 10-15 seconds)
4. **Verify** - you should see new tools available in Claude

## 🔧 Verification and Testing

### Quick Test
In Claude Desktop, ask: *"What Foundry VTT tools do you have access to?"*

You should see responses about:
- Character and actor management
- Compendium searching
- Quest and journal creation
- Dice roll coordination
- Campaign management
- And more!

### Detailed Testing
1. **Run** `scripts\test-connection.bat` to verify all components
2. **Check** that all tests pass
3. **Review** any warnings or errors

## 🛠️ Utility Scripts Reference

### Core Scripts
- **`install.bat`** - Main installation script
- **`uninstall.bat`** - Complete removal with config restore

### Testing and Maintenance
- **`test-connection.bat`** - Comprehensive system test
- **`start-server.bat`** - Manual server startup for debugging

### Configuration
- **`configure-claude.bat`** - Reconfigure Claude Desktop (if needed)

## 🔍 Troubleshooting

### Common Issues

#### "Claude Desktop not detected"
**Cause**: Claude Desktop not installed or never run
**Solution**:
1. Install Claude Desktop from https://claude.ai/desktop
2. Run it once and sign in
3. Quit Claude Desktop completely
4. Run installer again

#### "Installation failed" or Permission Errors
**Cause**: Insufficient permissions or disk space
**Solution**:
1. Ensure you have at least 200MB free space
2. Try extracting to a different location (like Documents)
3. Temporarily disable antivirus during installation

#### "Tools not appearing in Claude Desktop"
**Cause**: Claude Desktop not restarted or configuration issue
**Solution**:
1. **Completely quit** Claude Desktop (File → Quit)
2. **Wait 5 seconds**
3. **Restart** Claude Desktop
4. Wait for full initialization (10-15 seconds)
5. If still not working, run `test-connection.bat`

#### "Server connection failed"
**Cause**: Port conflict or server startup issue
**Solution**:
1. Run `test-connection.bat` for detailed diagnosis
2. Check if port 31415 is available
3. Restart your computer if issues persist
4. Try running `start-server.bat` manually to see error messages

### Advanced Troubleshooting

#### Manual Configuration
If automatic configuration fails:

1. **Open Claude Desktop**
2. **Go to**: Settings → Developer → Edit Config
3. **Add this configuration**:
```json
{
  "mcpServers": {
    "foundry-mcp-bridge": {
      "command": "node",
      "args": [
        "C:\\Users\\{YOUR_USERNAME}\\AppData\\Local\\FoundryMCPServer\\packages\\mcp-server\\src\\index.js"
      ],
      "env": {
        "NODE_PATH": "C:\\Users\\{YOUR_USERNAME}\\AppData\\Local\\FoundryMCPServer\\node"
      }
    }
  }
}
```
4. **Replace** `{YOUR_USERNAME}` with your actual Windows username
5. **Save** and restart Claude Desktop

#### Port Configuration
If port 31415 is in use:

1. **Edit** the server configuration file
2. **Change** the port number in `packages\mcp-server\src\index.js`
3. **Update** your Foundry VTT MCP Bridge module settings
4. **Restart** both the MCP server and Claude Desktop

## 📂 Installation Directory Structure

After installation, you'll find:

```
%LOCALAPPDATA%\FoundryMCPServer\
├── node\                          # Portable Node.js runtime
│   ├── node.exe
│   ├── npm\
│   └── node_modules\
├── packages\
│   └── mcp-server\               # MCP server application
│       ├── src\
│       │   └── index.js          # Main server entry point
│       ├── package.json
│       └── node_modules\         # Server dependencies
└── shared\                       # Shared libraries and types
```

## 🔄 Updating

### To Update the MCP Server:
1. **Download** the new portable package
2. **Run** `uninstall.bat` to remove the old version
3. **Run** `install.bat` from the new package
4. **Restart** Claude Desktop

### To Preserve Settings:
- Claude Desktop configuration is automatically backed up during uninstall
- Foundry VTT module settings are preserved separately

## 🗑️ Uninstallation

### Complete Removal:
1. **Run** `scripts\uninstall.bat`
2. **Follow prompts** - this will:
   - ✅ Stop any running server processes
   - ✅ Remove all installation files
   - ✅ Restore Claude Desktop configuration
   - ✅ Remove shortcuts
3. **Restart** Claude Desktop to complete removal

### What's Preserved:
- ✅ Claude Desktop itself remains installed
- ✅ Your Claude account and conversations
- ✅ Other MCP servers (if any)
- ✅ Foundry VTT and your world data

## 📞 Support and Community

### Getting Help
- **GitHub Issues**: https://github.com/adambdooley/foundry-vtt-mcp/issues
- **Documentation**: https://github.com/adambdooley/foundry-vtt-mcp
- **Foundry VTT Community**: https://foundryvtt.com/community

### Reporting Issues
When reporting problems, please include:
1. **Windows version** (Windows 10/11)
2. **Output from** `test-connection.bat`
3. **Error messages** or screenshots
4. **Steps to reproduce** the issue

### Contributing
This is an open-source project! Contributions welcome:
- **Bug reports** and feature requests
- **Documentation** improvements
- **Code contributions** via pull requests

## 🎉 What's Next?

Once installation is complete, you can:

### Foundry VTT Integration
- **Create characters** with natural language
- **Search compendiums** instantly
- **Generate quests** with AI assistance
- **Manage campaigns** with multi-part structures
- **Coordinate dice rolls** between Claude and players

### Advanced Features
- **Actor ownership** management
- **Journal organization** and updating
- **Campaign progress** tracking
- **Enhanced creature** search and filtering

### Community Resources
- **Example campaigns** and templates
- **Best practices** guides
- **Video tutorials** and walkthroughs
- **Community-created** content and extensions

---

**Enjoy your AI-powered Foundry VTT campaigns! 🎲🎭🗡️**