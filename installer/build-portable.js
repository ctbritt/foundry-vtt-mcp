#!/usr/bin/env node

/**
 * Build Portable Package for Foundry MCP Server
 * 
 * This script creates a portable ZIP package containing:
 * - Portable Node.js runtime
 * - Foundry MCP Server with dependencies
 * - Installation and utility scripts
 * - Documentation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Building Foundry MCP Server Portable Package\n');

// Configuration
const config = {
    nodeVersion: 'v20.12.2', // LTS version
    nodeArchive: 'node-v20.12.2-win-x64.zip',
    nodeUrl: 'https://nodejs.org/dist/v20.12.2/node-v20.12.2-win-x64.zip',
    packageName: 'FoundryMCPServerPortable-v0.4.8',
    buildDir: path.join(__dirname, 'build'),
    outputDir: path.join(__dirname, 'build', 'FoundryMCPServerPortable'),
    tempDir: path.join(__dirname, 'build', 'temp')
};

// Helper functions
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function copyRecursive(src, dest) {
    const stats = fs.statSync(src);
    if (stats.isDirectory()) {
        ensureDir(dest);
        const items = fs.readdirSync(src);
        for (const item of items) {
            copyRecursive(path.join(src, item), path.join(dest, item));
        }
    } else {
        fs.copyFileSync(src, dest);
    }
}

function downloadNodejs() {
    console.log('📦 Downloading portable Node.js...');
    
    const nodeZipPath = path.join(config.tempDir, config.nodeArchive);
    const nodeExtractPath = path.join(config.tempDir, 'node-extracted');
    
    if (fs.existsSync(nodeZipPath)) {
        console.log('   ✓ Node.js archive already exists, skipping download');
    } else {
        console.log(`   🌐 Downloading: ${config.nodeUrl}`);
        try {
            // Use PowerShell to download (available on all Windows systems)
            execSync(`powershell -Command "Invoke-WebRequest -Uri '${config.nodeUrl}' -OutFile '${nodeZipPath}'"`, {
                stdio: 'inherit'
            });
            console.log('   ✓ Node.js download completed');
        } catch (error) {
            console.error('   ❌ Failed to download Node.js');
            console.error('   Please download manually from:', config.nodeUrl);
            console.error('   Save as:', nodeZipPath);
            process.exit(1);
        }
    }
    
    // Extract Node.js
    console.log('   📂 Extracting Node.js...');
    ensureDir(nodeExtractPath);
    
    try {
        // Use PowerShell to extract ZIP
        execSync(`powershell -Command "Expand-Archive -Path '${nodeZipPath}' -DestinationPath '${nodeExtractPath}' -Force"`, {
            stdio: 'inherit'
        });
        
        // Find the extracted node directory (should be node-vX.X.X-win-x64)
        const extractedItems = fs.readdirSync(nodeExtractPath);
        const nodeDir = extractedItems.find(item => item.startsWith('node-') && item.includes('win-x64'));
        
        if (!nodeDir) {
            throw new Error('Node.js directory not found after extraction');
        }
        
        const sourceNodePath = path.join(nodeExtractPath, nodeDir);
        const destNodePath = path.join(config.outputDir, 'portable-node');
        
        console.log(`   📁 Copying from: ${sourceNodePath}`);
        console.log(`   📁 Copying to: ${destNodePath}`);
        
        copyRecursive(sourceNodePath, destNodePath);
        console.log('   ✓ Node.js portable runtime ready');
        
    } catch (error) {
        console.error('   ❌ Failed to extract Node.js:', error.message);
        process.exit(1);
    }
}

function copyMcpServer() {
    console.log('📦 Preparing MCP Server files...');
    
    const rootDir = path.join(__dirname, '..');
    const mcpServerSource = path.join(rootDir, 'packages', 'mcp-server');
    const sharedSource = path.join(rootDir, 'shared');
    const mcpServerDest = path.join(config.outputDir, 'foundry-mcp-server');
    
    console.log('   📁 Root directory:', rootDir);
    console.log('   📁 MCP server source:', mcpServerSource);
    console.log('   📁 Shared source:', sharedSource);
    console.log('   📁 Destination:', mcpServerDest);
    
    // Create directory structure
    ensureDir(path.join(mcpServerDest, 'packages', 'mcp-server'));
    ensureDir(path.join(mcpServerDest, 'shared'));
    
    // Copy MCP server
    if (fs.existsSync(mcpServerSource)) {
        console.log('   📁 Copying MCP server...');
        copyRecursive(mcpServerSource, path.join(mcpServerDest, 'packages', 'mcp-server'));
        console.log('   ✓ MCP server copied');
    } else {
        console.error('   ❌ MCP server source not found:', mcpServerSource);
        process.exit(1);
    }
    
    // Copy shared files
    if (fs.existsSync(sharedSource)) {
        console.log('   📁 Copying shared files...');
        copyRecursive(sharedSource, path.join(mcpServerDest, 'shared'));
        console.log('   ✓ Shared files copied');
    } else {
        console.error('   ❌ Shared source not found:', sharedSource);
        process.exit(1);
    }
    
    // Check if dependencies were already installed in the source (for GitHub Actions)
    const sourceNodeModules = path.join(mcpServerSource, 'node_modules');
    const destNodeModules = path.join(mcpServerDest, 'packages', 'mcp-server', 'node_modules');
    
    if (fs.existsSync(sourceNodeModules)) {
        console.log('   📦 Copying pre-installed dependencies...');
        copyRecursive(sourceNodeModules, destNodeModules);
        console.log('   ✓ Dependencies copied from source');
    } else {
        // Install dependencies if needed
        const packageJsonPath = path.join(mcpServerDest, 'packages', 'mcp-server', 'package.json');
        
        if (fs.existsSync(packageJsonPath)) {
            console.log('   📦 Installing MCP server dependencies...');
            try {
                execSync('npm install --production', {
                    cwd: path.join(mcpServerDest, 'packages', 'mcp-server'),
                    stdio: 'inherit'
                });
                console.log('   ✓ Dependencies installed');
            } catch (error) {
                console.warn('   ⚠️  Failed to install dependencies automatically');
                console.warn('      Error:', error.message);
                console.warn('      Please run "npm install" in the MCP server directory before packaging');
            }
        }
    }
}

function copyInstallerFiles() {
    console.log('📦 Copying installer files...');
    
    const portableSource = path.join(__dirname, 'portable');
    
    // Copy scripts
    const scriptsSource = path.join(portableSource, 'scripts');
    const scriptsDest = path.join(config.outputDir, 'scripts');
    if (fs.existsSync(scriptsSource)) {
        copyRecursive(scriptsSource, scriptsDest);
        console.log('   ✓ Installation scripts copied');
    }
    
    // Copy templates
    const templatesSource = path.join(portableSource, 'templates');
    const templatesDest = path.join(config.outputDir, 'templates');
    if (fs.existsSync(templatesSource)) {
        copyRecursive(templatesSource, templatesDest);
        console.log('   ✓ Configuration templates copied');
    }
    
    // Copy documentation (will be created later)
    const docsSource = path.join(portableSource, 'docs');
    const docsDest = path.join(config.outputDir, 'docs');
    if (fs.existsSync(docsSource)) {
        copyRecursive(docsSource, docsDest);
        console.log('   ✓ Documentation copied');
    }
}

function createPackageInfo() {
    console.log('📋 Creating package information files...');
    
    // Create README.txt
    const readmeContent = `Foundry MCP Server Portable Package v0.4.8
================================================

This portable package contains everything needed to run the Foundry MCP Server
with Claude Desktop on Windows 10/11.

QUICK START:
1. Extract this ZIP file to any location
2. Double-click: scripts\\install.bat
3. Restart Claude Desktop
4. Enjoy AI-powered Foundry VTT campaign management!

WHAT'S INCLUDED:
- Portable Node.js runtime (~70MB)
- Foundry MCP Server with all dependencies (~15MB)
- Automatic Claude Desktop configuration
- Installation and utility scripts
- Complete documentation

SYSTEM REQUIREMENTS:
- Windows 10 or Windows 11
- Claude Desktop (download from: https://claude.ai/desktop)
- Foundry VTT with MCP Bridge module

INSTALLATION:
1. Make sure Claude Desktop is installed and has been run at least once
2. Extract this ZIP file to your desired location
3. Run scripts\\install.bat as a regular user (no admin rights needed)
4. Follow the on-screen instructions
5. Restart Claude Desktop completely

UTILITY SCRIPTS:
- install.bat         - Main installation script
- start-server.bat    - Start MCP server manually for testing
- test-connection.bat - Test installation and connection
- uninstall.bat       - Remove installation completely

TROUBLESHOOTING:
If you encounter issues:
1. Run test-connection.bat to diagnose problems
2. Check that Claude Desktop was restarted after installation
3. Verify Foundry VTT has the MCP Bridge module enabled
4. Visit: https://github.com/adambdooley/foundry-vtt-mcp/issues

SUPPORT:
- Documentation: https://github.com/adambdooley/foundry-vtt-mcp
- Issues: https://github.com/adambdooley/foundry-vtt-mcp/issues
- Foundry VTT Community: https://foundryvtt.com/community

LICENSE:
This software is released under the MIT License.
See LICENSE.txt for full details.

Enjoy your AI-powered Foundry VTT campaigns!
`;
    
    fs.writeFileSync(path.join(config.outputDir, 'README.txt'), readmeContent);
    
    // Create LICENSE.txt
    const licenseContent = `MIT License

Copyright (c) 2024 Foundry MCP Bridge

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;
    
    fs.writeFileSync(path.join(config.outputDir, 'LICENSE.txt'), licenseContent);
    
    console.log('   ✓ Package information files created');
}

function createZipPackage() {
    console.log('📦 Creating ZIP package...');
    
    const zipPath = path.join(config.buildDir, `${config.packageName}.zip`);
    
    try {
        // Use PowerShell to create ZIP
        const powershellCommand = `Compress-Archive -Path '${config.outputDir}\\*' -DestinationPath '${zipPath}' -Force`;
        execSync(`powershell -Command "${powershellCommand}"`, {
            stdio: 'inherit'
        });
        
        // Get file size
        const stats = fs.statSync(zipPath);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(1);
        
        console.log(`   ✓ ZIP package created: ${zipPath}`);
        console.log(`   📊 Package size: ${fileSizeMB} MB`);
        
        return zipPath;
        
    } catch (error) {
        console.error('   ❌ Failed to create ZIP package:', error.message);
        process.exit(1);
    }
}

// Main build process
async function build() {
    try {
        console.log('🔧 Preparing build environment...');
        
        // Clean and create build directories
        if (fs.existsSync(config.buildDir)) {
            console.log('   🧹 Cleaning existing build directory...');
            fs.rmSync(config.buildDir, { recursive: true, force: true });
        }
        
        ensureDir(config.buildDir);
        ensureDir(config.outputDir);
        ensureDir(config.tempDir);
        
        console.log('   ✓ Build environment ready\n');
        
        // Download and extract Node.js
        downloadNodejs();
        console.log();
        
        // Copy MCP server files
        copyMcpServer();
        console.log();
        
        // Copy installer files
        copyInstallerFiles();
        console.log();
        
        // Create documentation
        createPackageInfo();
        console.log();
        
        // Create final ZIP package
        const zipPath = createZipPackage();
        console.log();
        
        console.log('🎉 Build completed successfully!');
        console.log(`📦 Package: ${zipPath}`);
        console.log(`📋 Ready for distribution!`);
        
    } catch (error) {
        console.error('❌ Build failed:', error.message);
        process.exit(1);
    }
}

// Run the build
build();