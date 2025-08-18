#!/usr/bin/env node

/**
 * Build NSIS Installer for Foundry MCP Server
 * 
 * This script prepares files for NSIS installer:
 * - Downloads portable Node.js runtime
 * - Copies built MCP Server files
 * - Prepares NSIS build directory
 * - Calls NSIS to create installer
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
let version = 'v0.4.8'; // default version

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--version' && i + 1 < args.length) {
        version = args[i + 1];
        break;
    }
}

console.log('🚀 Building Foundry MCP Server NSIS Installer\n');
console.log(`📦 Version: ${version}\n`);

// Configuration
const rootDir = path.join(__dirname, '..');
const config = {
    nodeVersion: 'v20.12.2',
    nodeArchive: 'node-v20.12.2-win-x64.zip',
    nodeUrl: 'https://nodejs.org/dist/v20.12.2/node-v20.12.2-win-x64.zip',
    buildDir: path.join(__dirname, 'build'),
    nsisDir: path.join(__dirname, 'nsis'),
    outputDir: path.join(__dirname, 'build', 'installer-files'),
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

function downloadAndExtractNode() {
    console.log('📦 Preparing Node.js runtime...');
    
    const nodeZipPath = path.join(config.tempDir, config.nodeArchive);
    const nodeExtractPath = path.join(config.tempDir, 'node-extracted');
    
    if (fs.existsSync(nodeZipPath)) {
        console.log('   ✓ Node.js archive already exists, skipping download');
    } else {
        console.log(`   🌐 Downloading: ${config.nodeUrl}`);
        try {
            execSync(`powershell -Command "Invoke-WebRequest -Uri '${config.nodeUrl}' -OutFile '${nodeZipPath}'"`, {
                stdio: 'inherit'
            });
            console.log('   ✓ Node.js download completed');
        } catch (error) {
            console.error('   ❌ Failed to download Node.js:', error.message);
            process.exit(1);
        }
    }
    
    // Extract Node.js
    console.log('   📂 Extracting Node.js...');
    ensureDir(nodeExtractPath);
    
    try {
        execSync(`powershell -Command "Expand-Archive -Path '${nodeZipPath}' -DestinationPath '${nodeExtractPath}' -Force"`, {
            stdio: 'inherit'
        });
        
        const extractedItems = fs.readdirSync(nodeExtractPath);
        const nodeDir = extractedItems.find(item => item.startsWith('node-') && item.includes('win-x64'));
        
        if (!nodeDir) {
            throw new Error('Node.js directory not found after extraction');
        }
        
        const sourceNodePath = path.join(nodeExtractPath, nodeDir);
        const destNodePath = path.join(config.outputDir, 'node');
        
        copyRecursive(sourceNodePath, destNodePath);
        
        // Copy node.exe to root for easy access
        fs.copyFileSync(path.join(destNodePath, 'node.exe'), path.join(config.outputDir, 'node.exe'));
        
        console.log('   ✓ Node.js runtime prepared');
        
    } catch (error) {
        console.error('   ❌ Failed to extract Node.js:', error.message);
        process.exit(1);
    }
}

function copyMcpServerFiles() {
    console.log('📦 Preparing MCP Server files...');
    
    const rootDir = path.join(__dirname, '..');
    const mcpServerSource = path.join(rootDir, 'packages', 'mcp-server');
    const sharedSource = path.join(rootDir, 'shared');
    const mcpServerDest = path.join(config.outputDir, 'foundry-mcp-server');
    
    // Ensure MCP server was built and bundled
    const builtBundlePath = path.join(mcpServerSource, 'dist', 'index.bundle.cjs');
    if (!fs.existsSync(builtBundlePath)) {
        console.error('   ❌ MCP server bundle not found. Run "npm run build:bundle --workspace=packages/mcp-server" first.');
        process.exit(1);
    }
    
    // Create directory structure
    ensureDir(path.join(mcpServerDest, 'packages', 'mcp-server'));
    ensureDir(path.join(mcpServerDest, 'shared'));
    
    // Copy bundled MCP server (single file with all dependencies included)
    console.log('   📦 Copying bundled MCP server...');
    ensureDir(path.join(mcpServerDest, 'packages', 'mcp-server', 'dist'));
    fs.copyFileSync(builtBundlePath, path.join(mcpServerDest, 'packages', 'mcp-server', 'dist', 'index.js'));
    fs.copyFileSync(path.join(mcpServerSource, 'package.json'), path.join(mcpServerDest, 'packages', 'mcp-server', 'package.json'));
    console.log('   ✅ Bundled MCP server copied (no node_modules needed!)');
    
    // Copy shared files (only dist needed for production)
    console.log('   📁 Copying shared files...');
    copyRecursive(path.join(sharedSource, 'dist'), path.join(mcpServerDest, 'shared', 'dist'));
    fs.copyFileSync(path.join(sharedSource, 'package.json'), path.join(mcpServerDest, 'shared', 'package.json'));
    
    console.log('   ✓ MCP server files prepared');
}

function copyInstallerFiles() {
    console.log('📦 Copying installer files...');
    
    // Copy license and readme
    fs.copyFileSync(path.join(config.nsisDir, 'LICENSE.txt'), path.join(config.outputDir, 'LICENSE.txt'));
    fs.copyFileSync(path.join(config.nsisDir, 'README.txt'), path.join(config.outputDir, 'README.txt'));
    
    // Copy icon file
    const iconSource = path.join(config.nsisDir, 'icon.ico');
    const iconDest = path.join(config.outputDir, 'icon.ico');
    if (fs.existsSync(iconSource)) {
        fs.copyFileSync(iconSource, iconDest);
        console.log('   ✓ Icon file copied');
    } else {
        console.error('   ❌ Icon file not found:', iconSource);
        throw new Error('Required icon.ico file missing from nsis directory');
    }
    
    // Copy PowerShell configuration script
    const psSource = path.join(config.nsisDir, 'configure-claude.ps1');
    const psDest = path.join(config.outputDir, 'configure-claude.ps1');
    if (fs.existsSync(psSource)) {
        fs.copyFileSync(psSource, psDest);
        console.log('   ✓ PowerShell script copied');
    } else {
        console.error('   ❌ PowerShell script not found:', psSource);
        throw new Error('Required configure-claude.ps1 file missing from nsis directory');
    }
    
    // Copy batch wrapper script
    const batSource = path.join(config.nsisDir, 'configure-claude-wrapper.bat');
    const batDest = path.join(config.outputDir, 'configure-claude-wrapper.bat');
    if (fs.existsSync(batSource)) {
        fs.copyFileSync(batSource, batDest);
        console.log('   ✓ Batch wrapper script copied');
    } else {
        console.error('   ❌ Batch wrapper script not found:', batSource);
        throw new Error('Required configure-claude-wrapper.bat file missing from nsis directory');
    }
    
    console.log('   ✓ Installer files prepared');
}

function buildInstaller() {
    console.log('🔨 Building NSIS installer...');
    
    try {
        // Check if NSIS is available
        execSync('makensis /VERSION', { stdio: 'pipe' });
        console.log('   ✓ NSIS found and ready');
    } catch (error) {
        console.error('   ❌ NSIS not found. Please install NSIS from https://nsis.sourceforge.io/');
        console.error('   After installation, add NSIS to your PATH or run this script from NSIS directory.');
        return false;
    }
    
    try {
        // Define paths
        const nsisScript = path.join(config.nsisDir, 'foundry-mcp-server.nsi');
        const outputPath = path.join(config.buildDir, `FoundryMCPServer-Setup-${version}.exe`);
        
        console.log(`   📁 NSIS script: ${nsisScript}`);
        console.log(`   📁 Output path: ${outputPath}`);
        console.log(`   📁 Working directory: ${config.outputDir}`);
        
        // List files in output directory before NSIS
        console.log('   📋 Files before NSIS compilation:');
        const beforeFiles = fs.readdirSync(config.outputDir);
        beforeFiles.forEach(file => console.log(`      - ${file}`));
        
        // Copy NSIS script to output directory so relative paths work
        const nsisScriptLocal = path.join(config.outputDir, 'foundry-mcp-server.nsi');
        fs.copyFileSync(nsisScript, nsisScriptLocal);
        console.log(`   📋 Copied NSIS script to working directory`);
        
        // Change to output directory so NSIS can find files
        const originalCwd = process.cwd();
        process.chdir(config.outputDir);
        console.log(`   📂 Changed working directory to: ${process.cwd()}`);
        
        // Run NSIS compiler with verbose output from local script
        console.log(`   🔨 Running NSIS compiler...`);
        execSync(`makensis /V4 /DVERSION=${version} /DOUTFILE="${outputPath}" "foundry-mcp-server.nsi"`, {
            stdio: 'inherit'
        });
        
        // Restore original working directory
        process.chdir(originalCwd);
        
        // List files in output directory after NSIS
        console.log('   📋 Files after NSIS compilation:');
        const afterFiles = fs.readdirSync(config.outputDir);
        afterFiles.forEach(file => console.log(`      - ${file}`));
        
        // Also check build directory
        console.log('   📋 Files in build directory:');
        if (fs.existsSync(config.buildDir)) {
            const buildFiles = fs.readdirSync(config.buildDir);
            buildFiles.forEach(file => console.log(`      - ${file}`));
        }
        
        // Check if installer was created in expected location
        if (fs.existsSync(outputPath)) {
            console.log(`   ✓ Installer created: ${outputPath}`);
            
            // Get file size
            const stats = fs.statSync(outputPath);
            const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(1);
            console.log(`   📊 Installer size: ${fileSizeMB} MB`);
            
            return true;
        } else {
            // Look for the installer in other possible locations
            console.log('   🔍 Installer not found at expected location, searching...');
            
            const possibleLocations = [
                path.join(config.outputDir, 'FoundryMCPServer-Setup.exe'),
                path.join(config.buildDir, 'FoundryMCPServer-Setup.exe'),
                path.join(config.nsisDir, 'FoundryMCPServer-Setup.exe'),
                path.join(__dirname, 'FoundryMCPServer-Setup.exe')
            ];
            
            for (const location of possibleLocations) {
                if (fs.existsSync(location)) {
                    console.log(`   ✓ Found installer at: ${location}`);
                    fs.renameSync(location, outputPath);
                    console.log(`   ✓ Moved to expected location: ${outputPath}`);
                    
                    const stats = fs.statSync(outputPath);
                    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(1);
                    console.log(`   📊 Installer size: ${fileSizeMB} MB`);
                    
                    return true;
                }
            }
            
            console.error('   ❌ Installer not found in any expected location');
            console.error('   📋 Searched locations:');
            possibleLocations.forEach(loc => console.error(`      - ${loc}`));
            return false;
        }
        
    } catch (error) {
        console.error('   ❌ Failed to build installer:', error.message);
        console.error('   📋 Error details:', error);
        return false;
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
        downloadAndExtractNode();
        console.log();
        
        // Copy MCP server files
        copyMcpServerFiles();
        console.log();
        
        // Copy installer files
        copyInstallerFiles();
        console.log();
        
        // Build NSIS installer
        const success = buildInstaller();
        console.log();
        
        if (success) {
            console.log('🎉 Build completed successfully!');
            console.log(`📦 Installer: FoundryMCPServer-Setup-${version}.exe`);
            console.log('📋 Ready for distribution!');
        } else {
            console.log('⚠️  Build completed but installer creation failed.');
            console.log('   Files are prepared in: ' + config.outputDir);
            console.log('   Run NSIS manually to create installer.');
        }
        
    } catch (error) {
        console.error('❌ Build failed:', error.message);
        process.exit(1);
    }
}

// Run the build
build();