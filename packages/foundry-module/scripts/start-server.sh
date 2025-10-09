#!/bin/bash
# Start the bundled MCP server
# This script should be run from your Foundry Data/modules/foundry-mcp-bridge directory

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
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
