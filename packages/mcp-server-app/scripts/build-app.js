import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

console.log('Building MCP Server App...');

// Ensure dist directory exists
const distDir = path.join(process.cwd(), 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy the MCP server distribution files
const serverDistPath = path.join(process.cwd(), '../mcp-server/dist');
const appServerPath = path.join(distDir, 'mcp-server');

if (fs.existsSync(serverDistPath)) {
  console.log('Copying MCP server files...');
  
  // Create mcp-server directory in app dist
  if (!fs.existsSync(appServerPath)) {
    fs.mkdirSync(appServerPath, { recursive: true });
  }
  
  // Copy all files from mcp-server/dist to app/dist/mcp-server
  execSync(`cp -r "${serverDistPath}"/* "${appServerPath}"/`, { stdio: 'inherit' });
  
  // Also copy package.json and node_modules if they exist
  const serverPackageJson = path.join(process.cwd(), '../mcp-server/package.json');
  if (fs.existsSync(serverPackageJson)) {
    fs.copyFileSync(serverPackageJson, path.join(appServerPath, 'package.json'));
  }
  
  const serverNodeModules = path.join(process.cwd(), '../mcp-server/node_modules');
  if (fs.existsSync(serverNodeModules)) {
    console.log('Copying server node_modules...');
    execSync(`cp -r "${serverNodeModules}" "${appServerPath}"/`, { stdio: 'inherit' });
  }
} else {
  console.error('MCP server dist not found. Please build the MCP server first.');
  process.exit(1);
}

// Build the Electron preload script with CommonJS
console.log('Building preload script...');
execSync('tsc src/preload.ts --outDir dist --module CommonJS --target ES2020', { stdio: 'inherit' });

console.log('App build complete!');