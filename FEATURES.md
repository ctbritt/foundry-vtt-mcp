# Extended Features

This fork extends the original [Foundry VTT MCP Bridge](https://github.com/adambdooley/foundry-vtt-mcp) with additional AI-powered map generation capabilities.

## 🗺️ AI Battlemap Generation

Generate high-quality battlemaps using AI through RunPod serverless ComfyUI or local ComfyUI installations.

### Features

- **Remote GPU Processing**: Use RunPod serverless endpoints for AI image generation
- **S3 Storage Integration**: Automatically store generated maps in S3 buckets
- **Auto-Scene Creation**: Generated maps are automatically attached to Foundry VTT scenes
- **Flexible Configuration**: Support for local ComfyUI, remote ComfyUI pods, or serverless endpoints
- **Cost Effective**: Pay-per-use serverless model (~$0.03 per 1536x1536 battlemap)

### Quick Setup

1. **Configure RunPod** (optional for cloud-based generation):
   - Create a RunPod serverless ComfyUI endpoint
   - Set environment variables for RunPod API access
   
2. **Configure S3** (optional for cloud storage):
   - Create an S3 bucket for generated images
   - Set AWS credentials in environment variables

3. **Configure via Foundry Module**:
   - Open Map Generation Service settings
   - Choose between Local or Remote service mode
   - Enter your RunPod and S3 credentials

4. **Generate Maps**:
   ```
   Ask Claude: "Generate a 1536x1536 desert oasis battlemap 
   with palm trees and ancient ruins"
   ```

### Architecture Options

**Local Mode:**
```
Claude Desktop → MCP Server → Local ComfyUI → Foundry VTT
```

**Remote RunPod Mode:**
```
Claude Desktop → MCP Server → RunPod API → S3 Storage → Foundry VTT
```

### Environment Variables

See `QUICKSTART.md` for detailed setup instructions.

Key environment variables:
- `RUNPOD_ENABLED`: Enable RunPod serverless mode
- `RUNPOD_API_KEY`: Your RunPod API key
- `RUNPOD_ENDPOINT_ID`: Your serverless endpoint ID
- `S3_BUCKET`: S3 bucket for image storage
- `S3_REGION`: AWS region
- `S3_ACCESS_KEY_ID`: AWS access key
- `S3_SECRET_ACCESS_KEY`: AWS secret key

### Security

All sensitive configuration (API keys, credentials) is:
- ✅ Stored server-side only
- ✅ Never committed to Git
- ✅ Validated with security checks before commits
- ✅ Hidden from players and client browsers

See `SECURITY.md` for comprehensive security documentation.

## 📚 Additional Documentation

- **QUICKSTART.md**: Step-by-step setup guide
- **SECURITY.md**: Security best practices and configuration
- **INSTALLATION.md**: Detailed installation instructions
- **check-secrets.sh**: Security validation script

## Credits

This fork is based on the excellent work by [Adam Dooley](https://github.com/adambdooley). 

Original features and core functionality remain unchanged. Extended features focus on AI map generation capabilities.

## License

MIT License (same as upstream project)

