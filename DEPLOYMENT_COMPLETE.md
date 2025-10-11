# Deployment Complete! 🎉

## ✅ Git Commit Created

**Commit:** `5f5b996`
**Message:** "Add map generation service mode settings with Local ComfyUI and Remote RunPod support"

**Changes:**
- 121 insertions (+)
- 4 deletions (-)
- File: `packages/foundry-module/src/settings.ts`

## ✅ What Was Committed

### Map Generation Settings Enhancement

**Radio Button Selection:**
```typescript
- Local ComfyUI (default)
- Remote RunPod (serverless)
```

**New Settings Registered:**
1. `mapGenServiceMode` - Local or Remote selection
2. `mapGenRunPodApiKey` - RunPod API key
3. `mapGenRunPodEndpointId` - RunPod endpoint identifier
4. `mapGenRunPodApiUrl` - Custom API URL (optional)
5. `mapGenS3Bucket` - S3 bucket name
6. `mapGenS3Region` - AWS region
7. `mapGenS3AccessKeyId` - S3 access key
8. `mapGenS3SecretAccessKey` - S3 secret key
9. `mapGenS3PublicBaseUrl` - CDN URL (optional)

**UI Enhancements:**
- Toggle function to show/hide relevant sections
- getData() populates all remote service fields
- _updateObject() saves settings conditionally based on mode
- Service mode persists across sessions

## ✅ Deployed to Module

Files updated in: `/home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge/dist/`

- settings.js - Map generation settings with radio buttons
- All related .map and .d.ts files

Foundry VTT restarted with updated module.

## 🎯 Next Steps for You

### 1. Enable the Module in Foundry

**CRITICAL:** The module still needs to be enabled!

1. Open https://foundry.azthir-terra.com  
2. Load your world (emerald-dreams)
3. Settings → **Manage Modules**
4. Find **"Foundry MCP Bridge"**
5. **Check the box** to enable it
6. **Save Module Settings**
7. **Reload the world**

### 2. Configure Map Generation

After enabling:

1. Module Settings → Foundry MCP Bridge
2. Click **"Configure Map Generation"**
3. You'll see the radio buttons:
   - **○ Local ComfyUI** — Runs on the same machine
   - **○ Remote Service** — Uses RunPod serverless

**For Local (if ComfyUI installed on server):**
- Select "Local ComfyUI"
- Check "Auto-start Service"
- Click "Check Status"

**For Remote (Recommended):**
- Select "Remote Service"
- Enter RunPod API Key: `rpa_...`
- Enter RunPod Endpoint ID: `pnto...`
- (Optional) Configure S3 bucket
- Click "Apply Settings"

### 3. Test Map Generation

In Claude Desktop:
```
Generate a medium 1536x1536 tavern battlemap with wooden furniture
```

Claude will:
1. Submit to your chosen service
2. Generate the map (~30-40 seconds)
3. Create a Foundry scene with the map
4. Report success!

## 📊 Complete Architecture

```
Claude Desktop (Mac via Tailscale)
    ↓ SSH
MCP Server (index.js)
    ↓
MCP Backend (backend.js)
    ├── 20+ MCP Tools
    ├── Map Generation
    │   ├── Local: → ComfyUI (localhost:31411)
    │   └── Remote: → RunPod API → S3
    └── Foundry Connector (port 31415)
        ↓ WebSocket/WebRTC
Foundry VTT (port 30000)
    └── MCP Bridge Module ← MUST BE ENABLED!
        └── Map Gen Settings (Local/Remote radio)
```

## 🐛 Current Known Issues

1. **Module Not Enabled** - No settings visible, queries timeout
   - **Fix:** Enable in Manage Modules (see Step 1 above)

2. **get-character Timeout** - Specific character data processing issue
   - **Workaround:** Use list-characters instead
   - **Debug:** Test in Foundry console (see TIMEOUT_FIX.md)

## 📁 Repository

**Source:** `/home/foundry/foundry-vtt-mcp-source`
- Latest commit: 5f5b996
- All changes built and deployed

**Module:** `/home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge`
- Updated files deployed
- Ready to enable!

## 🎉 Summary

✅ **Code Changes:** Map generation settings with Local/Remote options
✅ **Git Commit:** Successfully created  
✅ **Build:** Compiled without errors
✅ **Deployment:** Files copied to module directory
✅ **Foundry:** Restarted with updated code

**Remaining:** Enable the module in Foundry to activate all features!

Once enabled, you'll have:
- 20+ working MCP tools
- Map generation with Local/Remote options
- Full Claude Desktop integration
- Complete settings UI

---

**Next:** Enable "Foundry MCP Bridge" in Manage Modules, then configure your preferred map generation service! 🚀

