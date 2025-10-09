# Security & Privacy

This document explains how sensitive information is protected in this repository.

## Files That Are NOT Committed

The following files contain sensitive information and are excluded via `.gitignore`:

### Credentials & Configuration
- `.env` - Your actual environment variables with API keys and credentials
- `.env.*` - Any environment-specific config files
- `runpod_info.md` - RunPod endpoint details with API keys
- `*-credentials.json` - Any credential files
- `*.pem`, `*.key`, `*.crt` - SSL/TLS certificates and keys

### Debug Logs (May Contain Sensitive Data)
- `*-debug.log` - Debug logs that might contain API calls
- `process-*.log` - Process logs
- `backend-handler-debug.log` - Backend debugging
- `foundry-mcp-upload-debug.log` - Upload process logs

### Build Artifacts
- `node_modules/` - Dependencies
- `dist/` - Compiled code
- `*.tsbuildinfo` - TypeScript build info

## Files That ARE Committed (Safe)

These files contain only placeholders and examples:

### Template Files
- `env.template` - Environment variable template with placeholders
- `claude_desktop_config.example.json` - Claude Desktop config examples
- `Caddyfile.example` - Caddy reverse proxy example

### Documentation
- `REMOTE_SETUP.md` - Setup guide with placeholder values
- `RUNPOD_IMPLEMENTATION_SUMMARY.md` - Implementation details
- `README.md` - Project documentation

### Test Scripts
- `test-runpod-workflow.js` - Reads credentials from `.env`
- `validate-remote-setup.sh` - Validation script
- `check-secrets.sh` - Security verification script

## Placeholders Used

In documentation and templates, we use these placeholder formats:

```bash
# RunPod
RUNPOD_API_KEY=rpa_YOUR_API_KEY_HERE
RUNPOD_ENDPOINT_ID=your_endpoint_id

# S3
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
```

## Security Checklist

Before committing to GitHub, run:

```bash
./check-secrets.sh
```

This script verifies:
- ✅ `.env` is not tracked by git
- ✅ `runpod_info.md` is not tracked by git  
- ✅ No API keys in tracked files
- ✅ No hardcoded credentials

## If You Accidentally Commit Secrets

If you accidentally commit sensitive data:

### 1. Remove from Git History

```bash
# Remove file from git but keep it locally
git rm --cached .env

# Commit the removal
git commit -m "Remove sensitive file"

# If already pushed, you'll need to rewrite history
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env' \
  --prune-empty --tag-name-filter cat -- --all

# Force push (WARNING: This rewrites history)
git push origin --force --all
```

### 2. Rotate All Credentials

If secrets were exposed:
- **RunPod**: Generate new API key in dashboard
- **AWS S3**: Create new access key, delete old one
- **Foundry**: Change any exposed passwords

### 3. Verify Cleanup

```bash
# Check git history for the secret
git log --all --full-history --source --oneline -- .env

# Search all git objects for a secret string
git grep 'rpa_' $(git rev-list --all)
```

## Environment-Specific Configuration

For different environments, create separate files (all ignored):

- `.env.local` - Local development
- `.env.production` - Production (on remote server)
- `.env.test` - Testing

Never commit these files.

## Best Practices

1. **Never hardcode credentials** in source files
2. **Always use environment variables** for secrets
3. **Run `./check-secrets.sh`** before every commit
4. **Keep `runpod_info.md` private** - it's in `.gitignore`
5. **Rotate credentials** if you suspect exposure
6. **Use different credentials** for dev/staging/production
7. **Enable 2FA** on RunPod, AWS, and GitHub accounts

## What Gets Stored Where

| Data Type | Storage Location | Committed? |
|-----------|-----------------|------------|
| API Keys | `.env` file | ❌ No |
| Code | Git repository | ✅ Yes |
| Templates | Git repository | ✅ Yes |
| Documentation | Git repository | ✅ Yes |
| Build artifacts | `dist/` | ❌ No |
| Debug logs | `/tmp/` | ❌ No |
| Your credentials | Local `.env` | ❌ No |

## Questions?

If you're unsure whether something is safe to commit:

1. Run `./check-secrets.sh`
2. Check if it's in `.gitignore`
3. Ask: "Would I share this publicly?"
4. When in doubt, DON'T commit it

## Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** open a public GitHub issue
2. Contact the repository maintainer privately
3. Provide details about the vulnerability
4. Wait for confirmation before disclosing publicly

---

Last Updated: 2025-10-09

