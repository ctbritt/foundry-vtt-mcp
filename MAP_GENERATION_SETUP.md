# Map Generation Setup Guide

## Overview

The Foundry MCP Bridge now supports **two map generation modes**:

1. **Local ComfyUI** - Runs ComfyUI on the same machine as the MCP server (your Foundry server)
2. **Remote RunPod** - Uses RunPod serverless GPU instances in the cloud

## Settings Location

In Foundry VTT:
1. Go to **Module Settings** → **Foundry MCP Bridge**
2. Click **"Configure Map Generation"**
3. You'll see radio buttons to choose between Local and Remote

## Option 1: Local ComfyUI Setup

### Prerequisites
- ComfyUI installed on the Foundry server
- Python environment set up
- ComfyUI models downloaded

### Configuration Steps

1. **Select "Local ComfyUI"** radio button
2. **Check "Auto-start Map Generation Service"** (recommended)
3. **Click "Check Status"** to verify ComfyUI is available
4. If stopped, click **"Start Service"**
5. **Save Settings**

### ComfyUI Installation Paths

The module will search for ComfyUI in these locations:
- `~/ComfyUI/`
- `~/comfyui/`
- `~/.local/share/FoundryMCPServer/ComfyUI/`
- `/opt/ComfyUI/`

Or set the environment variable:
```bash
export COMFYUI_PATH=/path/to/ComfyUI
```

### Testing Local ComfyUI

In Claude Desktop:
```
Generate a 1536x1536 tavern battlemap with wooden tables and fireplace
```

## Option 2: Remote RunPod Setup

### Prerequisites

1. **RunPod Account** - Sign up at https://www.runpod.io
2. **Serverless Endpoint** - Deploy a ComfyUI serverless endpoint
3. **S3 Bucket** (optional) - For persistent image storage

### Get RunPod Credentials

1. Go to https://www.runpod.io/console/serverless
2. Create or select a ComfyUI endpoint
3. Note your:
   - API Key (starts with `rpa_...`)
   - Endpoint ID (starts with `pnto...`)

### Create S3 Bucket (Optional but Recommended)

1. Go to AWS S3 Console
2. Create a new bucket (e.g., `my-foundry-maps`)
3. Set bucket policy for public read access
4. Note:
   - Bucket name
   - Region (e.g., `us-east-1`)
   - Access Key ID
   - Secret Access Key

### Configuration Steps in Foundry

1. In Module Settings → Foundry MCP Bridge → Configure Map Generation
2. **Select "Remote Service"** radio button
3. **Enter RunPod Credentials:**
   - RunPod API Key: `rpa_...`
   - RunPod Endpoint ID: `pnto...`
   - RunPod API URL: (leave blank for default)
4. **Enter S3 Configuration:**
   - S3 Bucket: `your-bucket-name`
   - S3 Region: `us-east-1`
   - S3 Access Key ID: `AKIA...`
   - S3 Secret Access Key: `...`
   - S3 Public Base URL: (optional CDN URL)
5. **Save Settings**

### How Remote Mode Works

```
Claude Desktop
    ↓
MCP Server (on Foundry server)
    ↓
RunPod Serverless API
    ↓
ComfyUI (GPU pod spins up)
    ↓
Generated Image
    ↓
S3 Storage (if configured)
    ↓
Foundry VTT Scene
```

### Testing Remote RunPod

In Claude Desktop:
```
Generate a 1536x1536 forest battlemap with ancient ruins
```

The map will:
1. Submit to RunPod (~5 seconds)
2. Generate on GPU (~30-40 seconds)
3. Upload to S3 or return directly
4. Attach to a new Foundry scene automatically

### Cost

RunPod serverless pricing:
- ~$0.02-0.03 per 1536x1536 image
- ~30-40 seconds generation time
- Pay only when generating (no idle costs)

## Environment Variables (Advanced)

Instead of storing credentials in Foundry settings, you can use environment variables in the MCP server:

Create `/home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge/dist/mcp-server/.env`:

```bash
# Remote service mode
RUNPOD_ENABLED=true
RUNPOD_API_KEY=rpa_your_api_key_here
RUNPOD_ENDPOINT_ID=pnto_your_endpoint_id

# S3 storage
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=AKIA...
S3_SECRET_ACCESS_KEY=...
S3_PUBLIC_BASE_URL=https://your-cdn.com
```

Then restart the MCP backend:
```bash
pkill -f backend.js
cd /home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge/dist/mcp-server
NODE_PATH=$PWD/node_modules node backend.js > /tmp/backend.log 2>&1 &
```

The MCP server will use these environment variables instead of Foundry settings.

## Troubleshooting

### Local ComfyUI Won't Start

Check logs:
```bash
tail -f /tmp/foundry-mcp-server/mcp-server.log | grep -i comfy
```

Common issues:
- ComfyUI not installed in expected location
- Python environment not activated
- Port 31411 already in use

### RunPod Jobs Fail

- Verify API key is correct
- Check RunPod account has credits
- Ensure endpoint is active in RunPod dashboard
- Check endpoint ID is correct

### S3 Upload Fails

- Verify bucket permissions (public read)
- Check access key credentials
- Ensure region matches bucket region
- Test bucket access manually

## Example Usage

### Generate Small Map (Local)
```
Generate a small 1024px dungeon map with stone walls and torches
```

### Generate Large Map (Remote recommended)
```
Generate a large 2048px forest battlemap with river and bridge
```

### Check Generation Status
```
Check the status of map generation job [job_id]
```

### Cancel Job
```
Cancel map generation job [job_id]
```

## Security Notes

🔒 **Credentials Storage:**
- Foundry settings are stored in world database
- Environment variables are server-side only
- Never exposed to players or client browsers
- S3 keys should have minimal permissions (S3 write only)

🔒 **Network Security:**
- RunPod API calls go through MCP server
- Direct from Foundry server, not from player browsers
- Uses HTTPS for all external API calls

## Success Indicators

✅ **Local Mode:**
- Service status shows "Running"
- Maps generate in 30-60 seconds
- No external API calls

✅ **Remote Mode:**
- RunPod jobs submit successfully
- Maps generate in 30-40 seconds  
- Images appear in S3 bucket (if configured)
- Scenes auto-create in Foundry

