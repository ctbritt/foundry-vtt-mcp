#!/bin/bash

# Startup script for MCP server with remote ComfyUI (on Mac via SSH tunnel)
# This script does NOT attempt to start ComfyUI - it expects it's already running remotely

# Load .env file if it exists
if [ -f "/home/foundry/foundry-vtt-mcp/.env" ]; then
    export $(grep -v '^#' /home/foundry/foundry-vtt-mcp/.env | xargs)
fi

# Explicitly set ComfyUI configuration for remote mode
export COMFYUI_HOST=${COMFYUI_HOST:-127.0.0.1}
export COMFYUI_PORT=${COMFYUI_PORT:-8188}
export COMFYUI_AUTO_START=false

# Don't set COMFYUI_PATH - this prevents auto-start attempts
unset COMFYUI_PATH

# Start the MCP server
cd /home/foundry/foundry-vtt-mcp
exec node packages/mcp-server/dist/index.js
