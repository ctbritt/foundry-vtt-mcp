# ComfyUI Remote Configuration Examples

This document provides configuration examples for integrating remote ComfyUI services like comfyai.run with your Foundry MCP server.

## Environment Variables

Set these environment variables to configure remote ComfyUI providers:

### Basic Remote Configuration

```bash
# Use a single remote ComfyUI instance
export COMFYUI_MODE=remote
export COMFYUI_REMOTE_URL=https://your-comfyui-instance.com:8188
```

### Auto Mode with Multiple Providers

```bash
# Auto mode with fallback to local
export COMFYUI_MODE=auto
export COMFYUI_FALLBACK_TO_LOCAL=true

# Configure multiple providers via JSON
export COMFYUI_PROVIDERS='[
  {
    "name": "comfyai-run",
    "url": "https://comfyai.run/api/v1",
    "apiKey": "your-api-key-here",
    "priority": 10,
    "enabled": true,
    "timeout": 120000,
    "retryAttempts": 2
  },
  {
    "name": "runpod",
    "url": "https://your-runpod-endpoint.runpod.net",
    "apiKey": "your-runpod-api-key",
    "priority": 8,
    "enabled": true,
    "timeout": 180000,
    "retryAttempts": 3
  },
  {
    "name": "custom-server",
    "url": "http://192.168.1.100:8188",
    "priority": 5,
    "enabled": true,
    "timeout": 60000,
    "retryAttempts": 1
  }
]'
```

### Disabled Mode

```bash
# Disable ComfyUI entirely
export COMFYUI_MODE=disabled
```

## Configuration File Examples

### 1. comfyai.run Integration

```json
{
  "comfyui": {
    "mode": "auto",
    "providers": [
      {
        "name": "comfyai-run",
        "url": "https://comfyai.run/api/v1",
        "apiKey": "your-comfyai-run-api-key",
        "priority": 10,
        "enabled": true,
        "timeout": 120000,
        "retryAttempts": 2
      }
    ],
    "fallbackToLocal": true,
    "healthCheckInterval": 30000
  }
}
```

### 2. Multiple Provider Setup

```json
{
  "comfyui": {
    "mode": "auto",
    "providers": [
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
      },
      {
        "name": "local-fallback",
        "url": "http://127.0.0.1:8188",
        "priority": 1,
        "enabled": true,
        "timeout": 60000,
        "retryAttempts": 1
      }
    ],
    "fallbackToLocal": true,
    "healthCheckInterval": 30000
  }
}
```

### 3. RunPod Integration

```json
{
  "comfyui": {
    "mode": "remote",
    "providers": [
      {
        "name": "runpod-comfyui",
        "url": "https://your-endpoint-1234567890abcdef-5000.proxy.runpod.net",
        "apiKey": "your-runpod-api-key",
        "priority": 10,
        "enabled": true,
        "timeout": 300000,
        "retryAttempts": 3
      }
    ],
    "fallbackToLocal": false,
    "healthCheckInterval": 60000
  }
}
```

### 4. Custom Remote Server

```json
{
  "comfyui": {
    "mode": "remote",
    "providers": [
      {
        "name": "custom-server",
        "url": "http://192.168.1.100:8188",
        "priority": 10,
        "enabled": true,
        "timeout": 60000,
        "retryAttempts": 2
      }
    ],
    "fallbackToLocal": true,
    "healthCheckInterval": 30000
  }
}
```

## Provider Configuration Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `name` | string | Unique identifier for the provider | Required |
| `url` | string | Base URL of the ComfyUI instance | Required |
| `apiKey` | string | API key for authentication (optional) | undefined |
| `priority` | number | Priority (1-10, higher = more preferred) | 5 |
| `enabled` | boolean | Whether this provider is active | true |
| `timeout` | number | Request timeout in milliseconds | 60000 |
| `retryAttempts` | number | Number of retry attempts on failure | 2 |

## Health Check Behavior

- Providers are checked every 30 seconds by default
- The highest priority available provider is selected
- If a provider fails, the system automatically switches to the next available provider
- In `auto` mode with `fallbackToLocal: true`, local ComfyUI is used as a last resort

## Authentication

For services requiring API keys (like comfyai.run), include the `apiKey` field in your provider configuration. The system will automatically include the API key in request headers.

## Error Handling

- Network timeouts are handled gracefully
- Failed providers are temporarily marked as unavailable
- Automatic retry logic with exponential backoff
- Comprehensive logging for debugging

## Performance Considerations

- Remote providers may have higher latency than local instances
- Consider timeout values based on your network conditions
- Monitor provider health status through logs
- Use priority settings to prefer faster/more reliable providers