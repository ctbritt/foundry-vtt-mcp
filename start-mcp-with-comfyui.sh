#!/bin/bash

# Foundry VTT MCP Server Startup Script with ComfyUI Configuration
# This script sets up environment variables for ComfyUI integration

# Set ComfyUI configuration
export COMFYUI_PATH="/home/foundry/ComfyUI"
export COMFYUI_HOST="127.0.0.1"
export COMFYUI_PORT="31411"
export COMFYUI_LISTEN="127.0.0.1"

# Optional: Set logging for debugging
export LOG_LEVEL="info"

echo "Starting Foundry MCP Server with ComfyUI integration..."
echo "ComfyUI Path: $COMFYUI_PATH"
echo "ComfyUI Host: $COMFYUI_HOST"
echo "ComfyUI Port: $COMFYUI_PORT"
echo ""

# Start the MCP server
node /home/foundry/foundry-vtt-mcp/packages/mcp-server/dist/index.js "$@"
