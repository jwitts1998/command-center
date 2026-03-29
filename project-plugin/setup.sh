#!/bin/bash

# Command Center Plugin Setup Script
# Downloads and configures the plugin for a project

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║         Command Center Plugin Installation                ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check for required tools
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is required but not installed.${NC}"
    exit 1
fi

# Find or create .claude directory
PROJECT_ROOT=$(pwd)
CLAUDE_DIR="$PROJECT_ROOT/.claude"
PLUGIN_DIR="$CLAUDE_DIR/command-center"

if [ ! -d "$CLAUDE_DIR" ]; then
    echo -e "${YELLOW}Creating .claude directory...${NC}"
    mkdir -p "$CLAUDE_DIR"
fi

mkdir -p "$CLAUDE_DIR/hooks"

if [ -d "$PLUGIN_DIR" ]; then
    echo -e "${YELLOW}Plugin directory exists. Updating...${NC}"
else
    echo "Creating plugin directory..."
    mkdir -p "$PLUGIN_DIR"
fi

# Create config template
if [ ! -f "$PLUGIN_DIR/config.json" ]; then
    echo "Creating config template..."
    cat > "$PLUGIN_DIR/config.json" << 'EOF'
{
  "commandCenterUrl": "http://localhost:3000",
  "apiKey": "",
  "projectId": "",
  "autoEnrich": true,
  "skipClarification": false,
  "timeout": 30000,
  "offlineMode": true
}
EOF
fi

# Create hook script
echo "Creating hook script..."
cat > "$CLAUDE_DIR/hooks/command-center-enrich.sh" << 'EOF'
#!/bin/bash
# Command Center Prompt Enrichment Hook

PLUGIN_DIR="$(dirname "$0")/../command-center"
if [ -f "$PLUGIN_DIR/config.json" ]; then
    COMMAND_CENTER_URL=$(grep -o '"commandCenterUrl": *"[^"]*"' "$PLUGIN_DIR/config.json" | cut -d'"' -f4)
    API_KEY=$(grep -o '"apiKey": *"[^"]*"' "$PLUGIN_DIR/config.json" | cut -d'"' -f4)
    PROJECT_ID=$(grep -o '"projectId": *"[^"]*"' "$PLUGIN_DIR/config.json" | cut -d'"' -f4)
fi

if [ -z "$API_KEY" ] || [ -z "$PROJECT_ID" ]; then
    exit 0
fi

USER_PROMPT="$1"
if [ -z "$USER_PROMPT" ]; then
    exit 0
fi

RESPONSE=$(curl -s -X POST "$COMMAND_CENTER_URL/api/enrich-prompt" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $API_KEY" \
    -d "{\"project_id\": \"$PROJECT_ID\", \"user_prompt\": \"$USER_PROMPT\", \"skip_clarification\": true}" \
    --max-time 10 2>/dev/null)

if echo "$RESPONSE" | grep -q '"success":true'; then
    ENRICHED=$(echo "$RESPONSE" | grep -o '"enriched_prompt":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$ENRICHED" ]; then
        echo "$ENRICHED"
        exit 0
    fi
fi

echo "$USER_PROMPT"
EOF

chmod +x "$CLAUDE_DIR/hooks/command-center-enrich.sh"

echo ""
echo -e "${GREEN}✓ Installation complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Edit $PLUGIN_DIR/config.json"
echo "     - Set your Command Center URL"
echo "     - Add your API key"
echo "     - Add your Project ID"
echo ""
echo "  2. Test the connection:"
echo "     npx @command-center/plugin test"
echo ""
