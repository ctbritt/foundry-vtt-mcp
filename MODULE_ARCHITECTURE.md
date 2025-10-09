# Self-Contained Module Architecture

This document describes the self-contained Foundry module approach where the MCP server is bundled directly into the module.

## Architecture Overview

```
foundry-mcp-bridge/ (Foundry module)
├── module.json              # Manifest - single installation URL
├── README.md                # Installation and setup guide
├── dist/
│   ├── main.js              # Module frontend code
│   ├── settings.js          # Settings UI
│   ├── comfyui-manager.js   # ComfyUI integration
│   └── mcp-server/          # ⭐ BUNDLED MCP SERVER
│       ├── index.js         # Server entry point
│       ├── backend.js       # Backend handler
│       ├── config.js        # Configuration
│       ├── runpod-client.js # RunPod integration
│       ├── s3-uploader.js   # S3 storage
│       ├── .env.example     # Config template
│       ├── package.json     # Server dependencies
│       └── node_modules/    # All server dependencies bundled
├── scripts/
│   ├── start-server.sh      # Unix launcher
│   └── start-server.bat     # Windows launcher
├── styles/                  # Module CSS
├── templates/               # Handlebars templates
└── lang/                    # Translations
```

## Installation Flow

### For End Users

1. **Install Module via Foundry**
   ```
   Manifest URL: https://raw.githubusercontent.com/ctbritt/foundry-vtt-mcp/module/packages/foundry-module/module.json
   ```
   - Module downloads and extracts to: `Data/modules/foundry-mcp-bridge/`
   - All files including MCP server are now in one place

2. **Enable Module**
   - Enable in Foundry's Module Management
   - Module UI becomes available

3. **Start MCP Server**
   
   **Option A - Use helper script:**
   ```bash
   cd Data/modules/foundry-mcp-bridge
   ./scripts/start-server.sh
   ```
   
   **Option B - Direct execution:**
   ```bash
   cd Data/modules/foundry-mcp-bridge/dist/mcp-server
   node index.js
   ```

4. **Configure Claude Desktop**
   
   Edit `claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "foundry-mcp": {
         "command": "node",
         "args": [
           "/full/path/to/FoundryVTT/Data/modules/foundry-mcp-bridge/dist/mcp-server/index.js"
         ],
         "env": {
           "FOUNDRY_HOST": "localhost",
           "FOUNDRY_PORT": "31415"
         }
       }
     }
   }
   ```

5. **Optional: Configure RunPod/S3**
   
   **Via Module UI** (recommended):
   - Go to Module Settings → Map Generation Service
   - Select "Remote Service"
   - Enter RunPod API key, endpoint ID
   - Enter S3 bucket details
   
   **Via .env file**:
   ```bash
   cd Data/modules/foundry-mcp-bridge/dist/mcp-server
   cp .env.example .env
   # Edit .env with your credentials
   ```

## Build Process

### For Developers

**Build the self-contained module:**
```bash
npm run build:module
```

This command:
1. Builds shared types (`npm run build:shared`)
2. Builds MCP server (`npm run build:server`)
3. Builds Foundry module frontend (`npm run build:foundry`)
4. Bundles MCP server into module (`npm run bundle:module`)

The `bundle:module` step:
- Copies compiled MCP server (`dist/`) → module (`dist/mcp-server/`)
- Copies server `node_modules/` → module (`dist/mcp-server/node_modules/`)
- Copies `package.json` and `.env.example`
- Creates helper scripts (`start-server.sh`, `start-server.bat`)
- Creates module README with installation instructions

**Create a release:**
1. Build the module: `npm run build:module`
2. Zip the module directory: `packages/foundry-module/` → `foundry-mcp-bridge.zip`
3. Create GitHub release and attach zip
4. Users install from manifest URL

## Benefits

### ✅ Single Installation Point
- Users only need the manifest URL
- No separate repository cloning
- No separate `npm install` steps

### ✅ Version Synchronization
- Module and server are always in sync
- Updating the module updates the server
- No version mismatch issues

### ✅ Simplified Deployment
- All dependencies bundled
- No external configuration needed (until RunPod/S3 setup)
- Helper scripts for easy launch

### ✅ Self-Contained
- Everything in `Data/modules/foundry-mcp-bridge/`
- Easy backup (just copy module folder)
- Easy uninstall (just delete module folder)

## Comparison: Before vs After

### Before (Separate Repositories)

```
Installation:
1. Clone foundry-vtt-mcp repo
2. Run npm install (in root)
3. Run npm run build
4. Install Foundry module separately
5. Configure Claude Desktop with repo path
6. Keep repo and module in sync manually

Directory Structure:
/somewhere/foundry-vtt-mcp/           # Main repo
  └── packages/mcp-server/dist/       # Server
  
/somewhere-else/FoundryVTT/Data/
  └── modules/foundry-mcp-bridge/     # Module
```

### After (Self-Contained Module)

```
Installation:
1. Install module via Foundry manifest URL
2. Start server using helper script
3. Configure Claude Desktop with module path

Directory Structure:
/FoundryVTT/Data/modules/foundry-mcp-bridge/
  ├── dist/
  │   ├── main.js                    # Module
  │   └── mcp-server/                # Server (bundled)
  └── scripts/start-server.sh        # Launcher
```

## Technical Details

### Module Manifest Updates

**Updated URLs to point to your fork:**
```json
{
  "manifest": "https://raw.githubusercontent.com/ctbritt/foundry-vtt-mcp/module/packages/foundry-module/module.json",
  "download": "https://github.com/ctbritt/foundry-vtt-mcp/releases/latest/download/foundry-mcp-bridge.zip",
  "url": "https://github.com/ctbritt/foundry-vtt-mcp"
}
```

### Node Modules Bundling

All MCP server dependencies are copied to `dist/mcp-server/node_modules/`:
- `@modelcontextprotocol/sdk`
- `@aws-sdk/client-s3`
- `axios`
- `dotenv`
- `zod`
- And all transitive dependencies

**Bundle size:** ~50-100 MB (mostly node_modules)

### Helper Scripts

**start-server.sh (Unix):**
- Detects module directory
- Creates `.env` from `.env.example` if needed
- Changes to server directory
- Launches with `node index.js`

**start-server.bat (Windows):**
- Same functionality for Windows
- Uses batch script syntax

## Workflow for Updates

### For Users
1. Update module in Foundry (when new version released)
2. Restart MCP server
3. Done! Server is automatically updated

### For Developers
1. Make changes to source code
2. Run `npm run build:module`
3. Test locally
4. Create GitHub release with new zip
5. Update version in `module.json`
6. Push to GitHub
7. Users auto-update via Foundry

## Future Enhancements

Possible improvements:
- **Auto-start server**: Module could spawn server process on world load
- **Integrated UI**: Control server start/stop from Foundry UI
- **Health monitoring**: Show server status in module UI
- **One-click updates**: Auto-download and restart server
- **Bundled ComfyUI**: Could potentially bundle ComfyUI too (very large)

## Limitations

### Current Limitations
- **Manual server start**: User must start server separately (not automatic)
- **Manual Claude config**: User must edit Claude Desktop config file
- **Bundle size**: ~50-100 MB due to node_modules (acceptable for most users)
- **Node.js required**: Users must have Node.js installed

### Potential Solutions
- Auto-start via Foundry hook or module init
- Provide Claude Desktop config generator/helper
- Use esbuild to bundle into single file (reduces size)
- Bundle Node.js runtime (increases size, removes requirement)

## Security Considerations

### What's Bundled
- ✅ All server code (compiled JS)
- ✅ All dependencies (node_modules)
- ✅ `.env.example` (safe template)

### What's NOT Bundled
- ❌ `.env` (user creates locally)
- ❌ Personal credentials (never in module)
- ❌ ComfyUI (too large, user installs separately)

### User Data
- All credentials stay in `.env` file in module directory
- Module UI settings stored in Foundry world database
- No credentials in module.json or tracked files

## Testing

### Local Testing

1. Build module:
   ```bash
   npm run build:module
   ```

2. Symlink to Foundry:
   ```bash
   ln -s /path/to/foundry-vtt-mcp/packages/foundry-module \
         /path/to/FoundryVTT/Data/modules/foundry-mcp-bridge
   ```

3. Start Foundry and enable module

4. Test server start:
   ```bash
   cd /path/to/FoundryVTT/Data/modules/foundry-mcp-bridge
   ./scripts/start-server.sh
   ```

5. Configure Claude Desktop and test MCP connection

### Release Testing

1. Create release zip
2. Install via manifest URL
3. Verify all files extracted correctly
4. Test server startup
5. Test RunPod/S3 integration
6. Test Claude Desktop connection

## Conclusion

The self-contained module approach provides a much simpler installation and update experience for end users, while maintaining full functionality including RunPod serverless integration and S3 storage support.

**Key Achievement:** One manifest URL gives users everything they need!

