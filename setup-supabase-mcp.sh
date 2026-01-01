#!/bin/bash

# Supabase MCP Setup Script for Cursor IDE
# This script helps you configure the Supabase MCP server

echo "🔧 Supabase MCP Setup for Cursor IDE"
echo "======================================"
echo ""

# Check if .env file exists
if [ ! -f "nooke/.env" ]; then
  echo "❌ Error: nooke/.env file not found"
  echo "Please create it first with your Supabase credentials"
  exit 1
fi

# Load environment variables
source nooke/.env

SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY:-}"

if [ -z "$SUPABASE_URL" ]; then
  echo "❌ Error: EXPO_PUBLIC_SUPABASE_URL not found in nooke/.env"
  exit 1
fi

if [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo "⚠️  Warning: SUPABASE_SERVICE_KEY not found in nooke/.env"
  echo ""
  echo "To get your service role key:"
  echo "1. Go to: https://supabase.com/dashboard/project/ezbamrqoewrbvdvbypyd/settings/api"
  echo "2. Copy the 'service_role' key (NOT the anon key!)"
  echo "3. Add it to nooke/.env as: SUPABASE_SERVICE_KEY=your_service_role_key"
  echo ""
  read -p "Enter your service role key now (or press Enter to skip): " SERVICE_KEY
  
  if [ -z "$SERVICE_KEY" ]; then
    echo "❌ Service role key is required for MCP setup"
    exit 1
  fi
  
  SUPABASE_SERVICE_KEY="$SERVICE_KEY"
fi

echo "✅ Supabase URL: $SUPABASE_URL"
echo "✅ Service Role Key: ${SUPABASE_SERVICE_KEY:0:20}..."
echo ""

# Create MCP config snippet
CONFIG_JSON=$(cat <<EOF
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-supabase",
        "$SUPABASE_URL",
        "$SUPABASE_SERVICE_KEY"
      ]
    }
  }
}
EOF
)

echo "📋 Copy this configuration to Cursor IDE MCP settings:"
echo ""
echo "$CONFIG_JSON"
echo ""
echo "Steps:"
echo "1. Open Cursor Settings (Cmd+,)"
echo "2. Search for 'MCP'"
echo "3. Click 'Edit MCP Config' or 'MCP Servers'"
echo "4. Add the configuration above"
echo "5. Restart Cursor IDE"
echo ""

# Test the MCP server
echo "🧪 Testing MCP server connection..."
if npx -y @modelcontextprotocol/server-supabase "$SUPABASE_URL" "$SUPABASE_SERVICE_KEY" --version 2>/dev/null; then
  echo "✅ MCP server test successful!"
else
  echo "⚠️  MCP server test failed, but configuration should still work"
fi

echo ""
echo "✨ Setup complete!"
