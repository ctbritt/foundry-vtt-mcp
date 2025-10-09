#!/bin/bash

# Remote ComfyUI Setup Validation Script
# Checks all components needed for remote RunPod integration

echo "🔍 Foundry MCP Remote Setup Validation"
echo "========================================"
echo ""

ERRORS=0
WARNINGS=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

function check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((ERRORS++))
}

function check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

# Check 1: .env file exists
echo "Checking configuration..."
if [ -f ".env" ]; then
    check_pass ".env file exists"
else
    check_fail ".env file not found (copy env.template to .env)"
fi

# Check 2: RunPod configuration
if [ -f ".env" ]; then
    source .env
    
    if [ -n "$RUNPOD_ENABLED" ] && [ "$RUNPOD_ENABLED" = "true" ]; then
        check_pass "RunPod is enabled"
        
        if [ -n "$RUNPOD_API_KEY" ]; then
            check_pass "RunPod API key is set"
        else
            check_fail "RUNPOD_API_KEY not set in .env"
        fi
        
        if [ -n "$RUNPOD_ENDPOINT_ID" ]; then
            check_pass "RunPod endpoint ID is set ($RUNPOD_ENDPOINT_ID)"
        else
            check_fail "RUNPOD_ENDPOINT_ID not set in .env"
        fi
    else
        check_warn "RunPod not enabled (using local ComfyUI)"
    fi
    
    # Check S3 configuration
    if [ -n "$S3_BUCKET" ]; then
        check_pass "S3 bucket configured ($S3_BUCKET)"
        
        if [ -n "$S3_ACCESS_KEY_ID" ] && [ -n "$S3_SECRET_ACCESS_KEY" ]; then
            check_pass "S3 credentials are set"
        else
            check_fail "S3 credentials incomplete (need ACCESS_KEY_ID and SECRET_ACCESS_KEY)"
        fi
    else
        check_warn "S3 not configured (images will be uploaded to Foundry only)"
    fi
fi

echo ""
echo "Checking dependencies..."

# Check 3: Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    check_pass "Node.js installed ($NODE_VERSION)"
else
    check_fail "Node.js not installed"
fi

# Check 4: npm packages
if [ -f "package.json" ]; then
    if [ -d "node_modules" ]; then
        check_pass "npm packages installed"
        
        # Check for AWS SDK
        if [ -d "node_modules/@aws-sdk" ]; then
            check_pass "AWS SDK installed"
        else
            check_fail "AWS SDK not installed (run: npm install @aws-sdk/client-s3)"
        fi
        
        # Check for axios
        if [ -d "node_modules/axios" ]; then
            check_pass "axios installed"
        else
            check_fail "axios not installed (run: npm install axios)"
        fi
    else
        check_fail "npm packages not installed (run: npm install)"
    fi
fi

echo ""
echo "Checking build..."

# Check 5: Built files
if [ -f "packages/mcp-server/dist/index.js" ]; then
    check_pass "MCP server built"
    
    if [ -f "packages/mcp-server/dist/runpod-client.js" ]; then
        check_pass "RunPod client built"
    else
        check_warn "RunPod client not found (run: npm run build)"
    fi
    
    if [ -f "packages/mcp-server/dist/s3-uploader.js" ]; then
        check_pass "S3 uploader built"
    else
        check_warn "S3 uploader not found (run: npm run build)"
    fi
else
    check_fail "MCP server not built (run: npm run build)"
fi

echo ""
echo "Checking network..."

# Check 6: Tailscale
if command -v tailscale &> /dev/null; then
    if tailscale status &> /dev/null; then
        TAILSCALE_IP=$(tailscale ip -4 2>/dev/null | head -n1)
        check_pass "Tailscale running (IP: $TAILSCALE_IP)"
    else
        check_warn "Tailscale installed but not running"
    fi
else
    check_warn "Tailscale not installed (optional but recommended)"
fi

# Check 7: Foundry VTT port
if nc -z localhost 30000 2>/dev/null; then
    check_pass "Foundry VTT running on port 30000"
else
    check_warn "Foundry VTT not running on port 30000"
fi

# Check 8: MCP server port
if nc -z localhost 31415 2>/dev/null; then
    check_pass "MCP server running on port 31415"
else
    check_warn "MCP server not running on port 31415"
fi

echo ""
echo "Checking connectivity..."

# Check 9: RunPod API
if [ -n "$RUNPOD_API_KEY" ] && [ -n "$RUNPOD_ENDPOINT_ID" ]; then
    RUNPOD_URL="https://api.runpod.ai/v2/$RUNPOD_ENDPOINT_ID/health"
    
    if curl -s -f -H "Authorization: Bearer $RUNPOD_API_KEY" "$RUNPOD_URL" > /dev/null 2>&1; then
        check_pass "RunPod API accessible"
    else
        # Health endpoint may not exist, try status with a fake job ID
        RUNPOD_STATUS_URL="https://api.runpod.ai/v2/$RUNPOD_ENDPOINT_ID/status/test"
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $RUNPOD_API_KEY" "$RUNPOD_STATUS_URL")
        
        if [ "$HTTP_CODE" = "404" ]; then
            check_pass "RunPod API accessible (404 is expected for fake job ID)"
        elif [ "$HTTP_CODE" = "401" ]; then
            check_fail "RunPod API key invalid (401 Unauthorized)"
        else
            check_warn "RunPod API check returned HTTP $HTTP_CODE"
        fi
    fi
fi

# Check 10: S3 access (if AWS CLI is available)
if command -v aws &> /dev/null && [ -n "$S3_BUCKET" ]; then
    if aws s3 ls "s3://$S3_BUCKET" --region "$S3_REGION" > /dev/null 2>&1; then
        check_pass "S3 bucket accessible"
    else
        check_warn "S3 bucket not accessible (check credentials and permissions)"
    fi
fi

echo ""
echo "=========================================="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Your setup is ready. Next steps:"
    echo "1. Start the MCP server: node packages/mcp-server/dist/index.js"
    echo "2. Configure Claude Desktop to connect"
    echo "3. Test with: node test-runpod-workflow.js"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Setup complete with $WARNINGS warning(s)${NC}"
    echo ""
    echo "Review the warnings above and fix if needed."
    exit 0
else
    echo -e "${RED}✗ Setup incomplete: $ERRORS error(s), $WARNINGS warning(s)${NC}"
    echo ""
    echo "Please fix the errors above before proceeding."
    exit 1
fi

