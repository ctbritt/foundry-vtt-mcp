#!/bin/bash

# Configuration script for remote ComfyUI on Mac
# This configures the MCP server to connect to ComfyUI running on your Mac via SSH tunnel

echo "═══════════════════════════════════════════════════════════════"
echo "  Configuring MCP Server for Remote ComfyUI"
echo "═══════════════════════════════════════════════════════════════"
echo

# The configuration
COMFYUI_HOST="127.0.0.1"
COMFYUI_PORT="8188"  # Standard ComfyUI port
COMFYUI_PATH=""      # Empty means don't try to auto-start

echo "Configuration:"
echo "  Host: $COMFYUI_HOST"
echo "  Port: $COMFYUI_PORT"
echo "  Auto-start: disabled (remote mode)"
echo

# Check if .env file exists
ENV_FILE="/home/foundry/foundry-vtt-mcp/.env"

if [ -f "$ENV_FILE" ]; then
    echo "Updating existing .env file..."
    # Remove old ComfyUI settings
    sed -i '/COMFYUI_HOST/d' "$ENV_FILE"
    sed -i '/COMFYUI_PORT/d' "$ENV_FILE"
    sed -i '/COMFYUI_PATH/d' "$ENV_FILE"
else
    echo "Creating new .env file..."
    touch "$ENV_FILE"
fi

# Add new settings
cat >> "$ENV_FILE" << EOF

# ComfyUI Configuration (Remote on Mac via SSH tunnel)
COMFYUI_HOST=$COMFYUI_HOST
COMFYUI_PORT=$COMFYUI_PORT
# COMFYUI_PATH is intentionally not set (remote mode)
EOF

echo "✅ Configuration saved to $ENV_FILE"
echo

# Show the configuration
echo "Current .env ComfyUI settings:"
grep "COMFYUI" "$ENV_FILE"
echo

echo "═══════════════════════════════════════════════════════════════"
echo "  Configuration Complete!"
echo "═══════════════════════════════════════════════════════════════"
echo
echo "Next steps:"
echo "1. On your Mac, start ComfyUI:"
echo "   cd ~/ComfyUI && python3 main.py --listen 0.0.0.0 --port 8188"
echo
echo "2. In another terminal on your Mac, create the reverse SSH tunnel:"
echo "   ssh -R 8188:localhost:8188 foundry@foundry.azthir-terra.com -N"
echo
echo "3. Test the connection from this server:"
echo "   curl http://127.0.0.1:8188/system_stats"
echo
echo "4. Restart Claude Desktop to reload the MCP server"
echo