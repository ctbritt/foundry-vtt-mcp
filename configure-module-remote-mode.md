# Configure Foundry MCP Bridge for Remote Mode

This guide helps you configure the Foundry MCP Bridge module to use remote RunPod services instead of local ComfyUI.

## Method 1: Using the Configuration Script (Recommended)

1. Open Foundry VTT in your browser
2. Open the browser console (F12 → Console tab)
3. Copy and paste this code:

```javascript
// Configure the module for remote mode
console.log('🔧 Configuring Foundry MCP Bridge for remote mode...');

// Set the service mode to remote
game.settings.set('foundry-mcp-bridge', 'mapGenServiceMode', 'remote');

// Configure RunPod settings
game.settings.set('foundry-mcp-bridge', 'mapGenRunPodApiKey', 'YOUR_RUNPOD_API_KEY');
game.settings.set('foundry-mcp-bridge', 'mapGenRunPodEndpointId', 'YOUR_ENDPOINT_ID');
game.settings.set('foundry-mcp-bridge', 'mapGenRunPodApiUrl', 'https://api.runpod.ai/v2/YOUR_ENDPOINT_ID');

// Configure S3 settings (optional but recommended)
game.settings.set('foundry-mcp-bridge', 'mapGenS3Bucket', 'YOUR_S3_BUCKET');
game.settings.set('foundry-mcp-bridge', 'mapGenS3Region', 'us-east-1');
game.settings.set('foundry-mcp-bridge', 'mapGenS3AccessKeyId', 'YOUR_S3_ACCESS_KEY');
game.settings.set('foundry-mcp-bridge', 'mapGenS3SecretAccessKey', 'YOUR_S3_SECRET_KEY');

console.log('✅ Remote mode configuration complete!');
console.log('🔄 Please refresh the page to see the changes.');
```

4. Replace the placeholder values with your actual credentials
5. Press Enter to run the script
6. Refresh the Foundry VTT page

## Method 2: Using the Module Settings UI

1. In Foundry VTT, go to **Module Settings**
2. Click **"Configure Map Generation"** under Foundry MCP Bridge
3. Select **"Remote Service (RunPod/Cloud)"**
4. Fill in your RunPod API Key, Endpoint ID, and S3 settings
5. Click **"Apply Settings"**
6. Restart Foundry VTT

## Verification

After configuration, you should see this message in the browser console:
```
[foundry-mcp-bridge] Remote service mode enabled, skipping local ComfyUI monitoring
```

The repeated ComfyUI status check messages should stop appearing.

## Troubleshooting

If you still see ComfyUI status checks:
1. Ensure the module is properly configured for remote mode
2. Restart Foundry VTT completely
3. Check that the MCP server is running with RunPod enabled
4. Verify your RunPod endpoint workers are not throttled

## Next Steps

1. Configure Claude Desktop to connect to your MCP server
2. Test battlemap generation with a prompt like:
   ```
   Generate a 1536x1536 desert oasis battlemap
   ```
