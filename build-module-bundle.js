#!/usr/bin/env node

/**
 * Build script for self-contained Foundry module
 * Bundles MCP server into the module directory
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = __dirname;
const MODULE_DIR = path.join(ROOT_DIR, 'packages', 'foundry-module');
const MCP_SERVER_DIR = path.join(ROOT_DIR, 'packages', 'mcp-server');
const MODULE_DIST_DIR = path.join(MODULE_DIR, 'dist');
const MCP_BUNDLE_DIR = path.join(MODULE_DIST_DIR, 'mcp-server');

console.log('📦 Building Self-Contained Foundry Module');
console.log('==========================================\n');

async function cleanBundleDir() {
  console.log('🧹 Cleaning bundle directory...');
  if (await fs.pathExists(MCP_BUNDLE_DIR)) {
    await fs.remove(MCP_BUNDLE_DIR);
  }
  await fs.ensureDir(MCP_BUNDLE_DIR);
  console.log('✅ Bundle directory cleaned\n');
}

async function copyMCPServer() {
  console.log('📋 Copying MCP server files...');
  
  // Copy dist files
  const mcpDist = path.join(MCP_SERVER_DIR, 'dist');
  if (await fs.pathExists(mcpDist)) {
    await fs.copy(mcpDist, MCP_BUNDLE_DIR, {
      filter: (src) => {
        // Exclude test files and source maps if you want smaller bundle
        return !src.includes('.test.') && !src.includes('.map');
      }
    });
    console.log('  ✓ Copied dist files');
  } else {
    throw new Error('MCP server dist not found. Run `npm run build` first.');
  }
  
  // Copy node_modules (only production dependencies)
  const mcpNodeModules = path.join(MCP_SERVER_DIR, 'node_modules');
  const bundleNodeModules = path.join(MCP_BUNDLE_DIR, 'node_modules');
  
  if (await fs.pathExists(mcpNodeModules)) {
    await fs.copy(mcpNodeModules, bundleNodeModules);
    console.log('  ✓ Copied node_modules');
  }
  
  // Copy package.json (for runtime info)
  const mcpPackageJson = path.join(MCP_SERVER_DIR, 'package.json');
  await fs.copy(mcpPackageJson, path.join(MCP_BUNDLE_DIR, 'package.json'));
  console.log('  ✓ Copied package.json');
  
  // Copy .env.example
  const envExample = path.join(MCP_SERVER_DIR, '.env.example');
  if (await fs.pathExists(envExample)) {
    await fs.copy(envExample, path.join(MCP_BUNDLE_DIR, '.env.example'));
    console.log('  ✓ Copied .env.example');
  }
  
  console.log('✅ MCP server copied\n');
}

async function createHelperScripts() {
  console.log('📝 Creating helper scripts...');
  
  const scriptsDir = path.join(MODULE_DIR, 'scripts');
  await fs.ensureDir(scriptsDir);
  
  // Create start-server.sh for Unix-like systems
  const startScriptUnix = `#!/bin/bash
# Start the bundled MCP server
# This script should be run from your Foundry Data/modules/foundry-mcp-bridge directory

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
MODULE_DIR="$(dirname "$SCRIPT_DIR")"
SERVER_DIR="$MODULE_DIR/dist/mcp-server"

echo "🚀 Starting Foundry MCP Server"
echo "=============================="
echo "Module: $MODULE_DIR"
echo "Server: $SERVER_DIR"
echo ""

# Check if .env exists, if not copy from example
if [ ! -f "$SERVER_DIR/.env" ]; then
  if [ -f "$SERVER_DIR/.env.example" ]; then
    echo "📝 Creating .env from .env.example..."
    cp "$SERVER_DIR/.env.example" "$SERVER_DIR/.env"
    echo "⚠️  Please edit $SERVER_DIR/.env with your configuration"
    echo ""
  fi
fi

# Start the server
cd "$SERVER_DIR"
node index.js
`;

  await fs.writeFile(path.join(scriptsDir, 'start-server.sh'), startScriptUnix, { mode: 0o755 });
  console.log('  ✓ Created start-server.sh');
  
  // Create start-server.bat for Windows
  const startScriptWindows = `@echo off
REM Start the bundled MCP server
REM This script should be run from your Foundry Data\\modules\\foundry-mcp-bridge directory

setlocal
set SCRIPT_DIR=%~dp0
set MODULE_DIR=%SCRIPT_DIR%..
set SERVER_DIR=%MODULE_DIR%\\dist\\mcp-server

echo Starting Foundry MCP Server
echo ==============================
echo Module: %MODULE_DIR%
echo Server: %SERVER_DIR%
echo.

REM Check if .env exists, if not copy from example
if not exist "%SERVER_DIR%\\.env" (
  if exist "%SERVER_DIR%\\.env.example" (
    echo Creating .env from .env.example...
    copy "%SERVER_DIR%\\.env.example" "%SERVER_DIR%\\.env"
    echo Please edit %SERVER_DIR%\\.env with your configuration
    echo.
  )
)

REM Start the server
cd /d "%SERVER_DIR%"
node index.js
`;

  await fs.writeFile(path.join(scriptsDir, 'start-server.bat'), startScriptWindows);
  console.log('  ✓ Created start-server.bat');
  
  console.log('✅ Helper scripts created\n');
}

async function createREADME() {
  console.log('📚 Creating module README...');
  
  const readmeContent = `# Foundry MCP Bridge - Self-Contained Module

This Foundry module includes an integrated MCP server for AI-powered campaign management through Claude Desktop.

## Quick Start

### 1. Enable the Module
Enable "Foundry MCP Bridge" in Foundry VTT's Module Management.

### 2. Start the MCP Server

The MCP server is bundled inside this module. You need to start it separately:

**On macOS/Linux:**
\`\`\`bash
cd "path/to/FoundryVTT/Data/modules/foundry-mcp-bridge"
./scripts/start-server.sh
\`\`\`

**On Windows:**
\`\`\`cmd
cd "path\\to\\FoundryVTT\\Data\\modules\\foundry-mcp-bridge"
scripts\\start-server.bat
\`\`\`

Or run directly:
\`\`\`bash
node dist/mcp-server/index.js
\`\`\`

### 3. Configure Claude Desktop

Edit your Claude Desktop configuration file:
- **macOS**: \`~/Library/Application Support/Claude/claude_desktop_config.json\`
- **Windows**: \`%APPDATA%\\Claude\\claude_desktop_config.json\`

Add this configuration:
\`\`\`json
{
  "mcpServers": {
    "foundry-mcp": {
      "command": "node",
      "args": ["path/to/FoundryVTT/Data/modules/foundry-mcp-bridge/dist/mcp-server/index.js"],
      "env": {
        "FOUNDRY_HOST": "localhost",
        "FOUNDRY_PORT": "31415"
      }
    }
  }
}
\`\`\`

Replace \`path/to/FoundryVTT/Data\` with your actual Foundry data path.

### 4. Configure Environment (Optional)

For RunPod/S3 integration, create a \`.env\` file in \`dist/mcp-server/\`:

\`\`\`bash
cp dist/mcp-server/.env.example dist/mcp-server/.env
\`\`\`

Then edit \`dist/mcp-server/.env\` with your credentials.

Alternatively, configure via the module UI in Foundry under Module Settings → Map Generation Service.

## Features

- **Core MCP Bridge**: AI-powered actor creation, quest generation, compendium search
- **AI Battlemap Generation**: RunPod serverless ComfyUI integration
- **S3 Storage**: Cloud storage for generated maps
- **Auto-Scene Creation**: Maps automatically attach to Foundry scenes

## Support

- **Documentation**: https://github.com/ctbritt/foundry-vtt-mcp
- **Issues**: https://github.com/ctbritt/foundry-vtt-mcp/issues
- **Original Project**: https://github.com/adambdooley/foundry-vtt-mcp

## Credits

Based on [Foundry VTT MCP Bridge](https://github.com/adambdooley/foundry-vtt-mcp) by Adam Dooley.
Extended with RunPod serverless integration and AI battlemap generation.

## License

MIT License
`;

  await fs.writeFile(path.join(MODULE_DIR, 'README.md'), readmeContent);
  console.log('✅ README created\n');
}

async function build() {
  try {
    await cleanBundleDir();
    await copyMCPServer();
    await createHelperScripts();
    await createREADME();
    
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║              ✅ BUILD SUCCESSFUL! ✅                           ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('📦 Self-contained module built at:');
    console.log('   ' + MODULE_DIR);
    console.log('');
    console.log('🚀 Next steps:');
    console.log('   1. Test the module locally');
    console.log('   2. Create a release with the packaged module');
    console.log('   3. Users can install via manifest URL');
    console.log('');
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();

