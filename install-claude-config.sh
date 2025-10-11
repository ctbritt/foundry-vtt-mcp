#!/bin/bash
# Install Claude Desktop Configuration for Foundry MCP Bridge

CONFIG_FILE="$HOME/.config/Claude/claude_desktop_config.json"
SOURCE_FILE="$(dirname "$0")/claude_desktop_config.json"

echo "=== Foundry MCP Bridge - Claude Desktop Configuration ===="
echo

# Create directory if it doesn't exist
mkdir -p "$HOME/.config/Claude"

# Backup existing config if present
if [ -f "$CONFIG_FILE" ]; then
    BACKUP_FILE="$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo "📦 Backing up existing config to: $BACKUP_FILE"
    cp "$CONFIG_FILE" "$BACKUP_FILE"
fi

# Install new config
echo "📋 Installing Claude Desktop configuration..."
cp "$SOURCE_FILE" "$CONFIG_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Configuration installed successfully!"
    echo
    echo "📍 Configuration file: $CONFIG_FILE"
    echo
    echo "Next steps:"
    echo "1. Start Foundry VTT and enable the 'Foundry MCP Bridge' module"
    echo "2. Restart Claude Desktop completely"
    echo "3. Ask Claude: 'What actors are in my Foundry world?'"
    echo
    echo "For detailed instructions, see: SETUP_INSTRUCTIONS.md"
else
    echo "❌ Failed to install configuration"
    exit 1
fi

