#!/bin/bash

# Security Check: Verify no secrets are committed to git
# Run this before pushing to GitHub

echo "🔒 Checking for sensitive data in git-tracked files..."
echo ""

ISSUES=0

# Check if .env is tracked (it shouldn't be)
if git ls-files --error-unmatch .env 2>/dev/null; then
    echo "❌ ERROR: .env file is tracked by git!"
    echo "   Run: git rm --cached .env"
    ((ISSUES++))
else
    echo "✓ .env is not tracked by git"
fi

# Check if runpod_info.md is tracked (it shouldn't be)
if git ls-files --error-unmatch runpod_info.md 2>/dev/null; then
    echo "❌ ERROR: runpod_info.md is tracked by git!"
    echo "   Run: git rm --cached runpod_info.md"
    ((ISSUES++))
else
    echo "✓ runpod_info.md is not tracked by git"
fi

# Check for actual API keys in tracked files
echo ""
echo "Checking for potential secrets in tracked files..."

# Get list of tracked files
TRACKED_FILES=$(git ls-files)

# Patterns that might indicate secrets
PATTERNS=(
    "rpa_[A-Z0-9]{40}"  # RunPod API keys
    "AKIA[A-Z0-9]{16}"  # AWS Access Keys
    "sk-[a-zA-Z0-9]{48}" # OpenAI-style keys
)

for pattern in "${PATTERNS[@]}"; do
    if echo "$TRACKED_FILES" | xargs grep -l -E "$pattern" 2>/dev/null | grep -v "check-secrets.sh"; then
        echo "⚠️  WARNING: Found pattern '$pattern' in tracked files"
        echo "   Review these files carefully before committing"
        ((ISSUES++))
    fi
done

# Check for hardcoded credentials in config files
# NOTE: Check for patterns, not actual credentials to avoid committing secrets
# Exclude package-lock.json (has integrity hashes) and test files
if echo "$TRACKED_FILES" | grep -v "package-lock.json" | grep -v "test-comfyui.js" | xargs grep -l -E "rpa_[A-Z0-9]{40,}|AKIA[A-Z0-9]{16}" 2>/dev/null | grep -v "check-secrets.sh" | grep -v "YOUR_.*_HERE" | grep -v "your_endpoint_id"; then
    echo "❌ ERROR: Found potential hardcoded credential in tracked file!"
    echo "   Review the files above for actual API keys or secrets"
    ((ISSUES++))
fi

echo ""
if [ $ISSUES -eq 0 ]; then
    echo "✅ Security check passed! No sensitive data found in tracked files."
    echo ""
    echo "Safe to commit. Files that ARE ignored (won't be committed):"
    echo "  - .env"
    echo "  - runpod_info.md"
    echo "  - *-debug.log"
    echo "  - *.pem, *.key, *.crt"
    exit 0
else
    echo "❌ Security check FAILED: Found $ISSUES issue(s)"
    echo ""
    echo "DO NOT commit until these issues are resolved!"
    exit 1
fi

