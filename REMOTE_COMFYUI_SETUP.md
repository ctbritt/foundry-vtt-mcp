# Remote ComfyUI Integration Setup Guide

This guide explains how to integrate remote ComfyUI services like comfyai.run with your Foundry MCP server.

## Overview

The enhanced ComfyUI integration supports:
- **Multiple remote providers** with automatic failover
- **Auto mode** that tries remote providers first, falls back to local
- **Health monitoring** with automatic provider switching
- **Authentication** support for API-key based services
- **Graceful fallback** to local ComfyUI when remote services are unavailable

## Quick Start

### 1. Basic Remote Setup

Set environment variables for a single remote ComfyUI instance:

```bash
export COMFYUI_MODE=remote
export COMFYUI_REMOTE_URL=https://your-comfyui-instance.com:8188
```

### 2. Auto Mode with Fallback

Use auto mode to try remote providers first, fall back to local:

```bash
export COMFYUI_MODE=auto
export COMFYUI_FALLBACK_TO_LOCAL=true
```

### 3. Multiple Provider Setup

Configure multiple remote providers with priorities:

```bash
export COMFYUI_PROVIDERS='[
  {
    "name": "comfyai-run",
    "url": "https://comfyai.run/api/v1",
    "apiKey": "your-api-key",
    "priority": 10,
    "enabled": true,
    "timeout": 120000,
    "retryAttempts": 2
  },
  {
    "name": "backup-provider",
    "url": "https://backup.comfyui.com:8188",
    "priority": 8,
    "enabled": true,
    "timeout": 60000,
    "retryAttempts": 1
  }
]'
```

## Supported Remote Services

### comfyai.run

1. Sign up at [comfyai.run](https://comfyai.run)
2. Get your API key from the dashboard
3. Configure as a provider:

```json
{
  "name": "comfyai-run",
  "url": "https://comfyai.run/api/v1",
  "apiKey": "your-api-key-here",
  "priority": 10,
  "enabled": true,
  "timeout": 120000,
  "retryAttempts": 2
}
```

### RunPod

1. Deploy a ComfyUI server on RunPod
2. Get your endpoint URL and API key
3. Configure as a provider:

```json
{
  "name": "runpod-comfyui",
  "url": "https://your-endpoint-1234567890abcdef-5000.proxy.runpod.net",
  "apiKey": "your-runpod-api-key",
  "priority": 8,
  "enabled": true,
  "timeout": 300000,
  "retryAttempts": 3
}
```

### Custom Remote Server

For your own ComfyUI instance:

```json
{
  "name": "custom-server",
  "url": "http://192.168.1.100:8188",
  "priority": 5,
  "enabled": true,
  "timeout": 60000,
  "retryAttempts": 2
}
```

## Configuration Modes

### Local Mode (Default)
```bash
export COMFYUI_MODE=local
```
Uses local ComfyUI installation only.

### Remote Mode
```bash
export COMFYUI_MODE=remote
export COMFYUI_REMOTE_URL=https://your-comfyui.com:8188
```
Uses only remote ComfyUI, no local fallback.

### Auto Mode (Recommended)
```bash
export COMFYUI_MODE=auto
export COMFYUI_FALLBACK_TO_LOCAL=true
```
Tries remote providers first, falls back to local if needed.

### Disabled Mode
```bash
export COMFYUI_MODE=disabled
```
Disables ComfyUI entirely.

## Testing Your Setup

1. Build the project:
   ```bash
   npm run build
   ```

2. Run the remote ComfyUI test:
   ```bash
   npm run test:remote
   ```

3. Check the logs for provider health status and any errors.

## Monitoring and Debugging

### Health Status

The system automatically monitors provider health every 30 seconds. Check logs for:

```
[INFO] Provider health check successful { provider: 'comfyai-run', responseTime: 245 }
[INFO] Active ComfyUI provider changed { newProvider: 'comfyai-run', url: 'https://comfyai.run/api/v1' }
```

### Error Handling

Common issues and solutions:

1. **Authentication Errors**
   - Verify API keys are correct
   - Check if the service requires specific headers

2. **Timeout Errors**
   - Increase timeout values for slower providers
   - Check network connectivity

3. **Provider Unavailable**
   - System automatically switches to next available provider
   - Check provider URLs and status

### Logging

Enable debug logging to see detailed provider information:

```bash
export LOG_LEVEL=debug
```

## Performance Considerations

### Timeout Settings

- **comfyai.run**: 120-180 seconds (can be slower)
- **RunPod**: 300 seconds (cold starts take time)
- **Local**: 60 seconds (usually fast)

### Priority Settings

Set higher priorities (1-10) for faster/more reliable providers:

```json
{
  "name": "fast-provider",
  "priority": 10,  // Highest priority
  "timeout": 60000
},
{
  "name": "backup-provider", 
  "priority": 5,   // Lower priority
  "timeout": 120000
}
```

### Retry Logic

Configure retry attempts based on provider reliability:

```json
{
  "name": "reliable-provider",
  "retryAttempts": 1,  // Few retries for reliable services
  "timeout": 60000
},
{
  "name": "unreliable-provider",
  "retryAttempts": 3,  // More retries for unreliable services
  "timeout": 120000
}
```

## Security Considerations

1. **API Keys**: Store in environment variables, not in code
2. **HTTPS**: Use HTTPS endpoints when possible
3. **Network**: Consider VPN for sensitive deployments
4. **Rate Limiting**: Be aware of provider rate limits

## Troubleshooting

### Provider Not Available

1. Check provider URL and API key
2. Verify network connectivity
3. Check provider service status
4. Review timeout settings

### Fallback Not Working

1. Ensure `COMFYUI_FALLBACK_TO_LOCAL=true`
2. Verify local ComfyUI is installed
3. Check local ComfyUI is running on port 8188

### Performance Issues

1. Check provider response times in logs
2. Adjust timeout values
3. Consider provider priorities
4. Monitor network latency

## Example Complete Setup

Here's a complete example for a production setup:

```bash
# Environment variables
export COMFYUI_MODE=auto
export COMFYUI_FALLBACK_TO_LOCAL=true
export COMFYUI_PROVIDERS='[
  {
    "name": "comfyai-run-primary",
    "url": "https://comfyai.run/api/v1",
    "apiKey": "your-primary-api-key",
    "priority": 10,
    "enabled": true,
    "timeout": 120000,
    "retryAttempts": 2
  },
  {
    "name": "comfyai-run-backup",
    "url": "https://backup.comfyai.run/api/v1", 
    "apiKey": "your-backup-api-key",
    "priority": 8,
    "enabled": true,
    "timeout": 120000,
    "retryAttempts": 2
  },
  {
    "name": "runpod-gpu",
    "url": "https://your-runpod-endpoint.runpod.net",
    "apiKey": "your-runpod-key",
    "priority": 7,
    "enabled": true,
    "timeout": 180000,
    "retryAttempts": 3
  }
]'
export LOG_LEVEL=info
```

This setup provides:
- Primary and backup comfyai.run instances
- RunPod as additional backup
- Automatic failover between providers
- Local ComfyUI as final fallback
- Comprehensive logging for monitoring