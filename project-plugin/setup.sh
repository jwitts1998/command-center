#!/bin/bash
#
# Command Center Plugin Setup Script
#
# This script installs the Command Center plugin into your project.
# Run from your project root directory.
#
# Usage:
#   curl -sSL https://your-command-center.vercel.app/install.sh | bash
#   OR
#   ./setup.sh
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "======================================"
echo "  Command Center Plugin Installation  "
echo "======================================"
echo ""

# Check if we're in a project directory
if [ ! -d ".claude" ] && [ ! -f "package.json" ] && [ ! -f "pubspec.yaml" ]; then
    echo -e "${YELLOW}Warning: This doesn't look like a project directory.${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create .claude directory if it doesn't exist
mkdir -p .claude/command-center

# Download or copy plugin files
PLUGIN_DIR=".claude/command-center"

# Check if running from the command-center repo
if [ -f "project-plugin/plugin.ts" ]; then
    echo "Installing from local command-center repository..."
    cp project-plugin/plugin.ts "$PLUGIN_DIR/"
    cp project-plugin/config.example.json "$PLUGIN_DIR/"
else
    echo "Downloading plugin files..."
    COMMAND_CENTER_URL="${COMMAND_CENTER_URL:-http://localhost:3000}"

    # Try to download from Command Center
    if curl -sSf "$COMMAND_CENTER_URL/api/plugin/plugin.ts" -o "$PLUGIN_DIR/plugin.ts" 2>/dev/null; then
        echo -e "${GREEN}Downloaded plugin.ts${NC}"
    else
        echo -e "${YELLOW}Could not download from Command Center.${NC}"
        echo "Please copy plugin files manually or set COMMAND_CENTER_URL."
        exit 1
    fi
fi

# Create initial config from environment or prompt
echo ""
echo "Configuring plugin..."

if [ -n "$COMMAND_CENTER_PROJECT_ID" ] && [ -n "$COMMAND_CENTER_API_KEY" ]; then
    # Use environment variables
    cat > "$PLUGIN_DIR/config.json" << EOF
{
  "projectId": "$COMMAND_CENTER_PROJECT_ID",
  "apiKey": "$COMMAND_CENTER_API_KEY",
  "commandCenterUrl": "${COMMAND_CENTER_URL:-http://localhost:3000}",
  "autoEnrich": true
}
EOF
    echo -e "${GREEN}Configuration created from environment variables.${NC}"
else
    # Interactive setup
    read -p "Command Center URL [http://localhost:3000]: " url
    url=${url:-http://localhost:3000}

    read -p "Project ID (from Command Center dashboard): " project_id
    read -p "API Key (from Command Center dashboard): " api_key
    read -p "Project Name: " project_name

    cat > "$PLUGIN_DIR/config.json" << EOF
{
  "projectId": "$project_id",
  "apiKey": "$api_key",
  "commandCenterUrl": "$url",
  "projectName": "$project_name",
  "autoEnrich": true
}
EOF
    echo -e "${GREEN}Configuration saved.${NC}"
fi

# Add to .gitignore if it exists
if [ -f ".gitignore" ]; then
    if ! grep -q "command-center/config.json" .gitignore; then
        echo "" >> .gitignore
        echo "# Command Center plugin config (contains API key)" >> .gitignore
        echo ".claude/command-center/config.json" >> .gitignore
        echo -e "${GREEN}Added config.json to .gitignore${NC}"
    fi
fi

# Add environment variables template
if [ ! -f ".env.local" ] && [ ! -f ".env" ]; then
    cat > ".env.local.example" << EOF
# Command Center Plugin
COMMAND_CENTER_URL=http://localhost:3000
COMMAND_CENTER_PROJECT_ID=your-project-id
COMMAND_CENTER_API_KEY=your-api-key
EOF
    echo -e "${GREEN}Created .env.local.example${NC}"
fi

echo ""
echo "======================================"
echo -e "${GREEN}  Installation Complete!  ${NC}"
echo "======================================"
echo ""
echo "Plugin installed to: $PLUGIN_DIR/"
echo ""
echo "Next steps:"
echo "  1. Review config: $PLUGIN_DIR/config.json"
echo "  2. Make sure your API key is correct"
echo "  3. Test enrichment: ts-node $PLUGIN_DIR/plugin.ts enrich 'Add dark mode'"
echo ""
echo "For Claude Code integration, add a hook to intercept prompts."
echo "See: $PLUGIN_DIR/README.md"
echo ""
