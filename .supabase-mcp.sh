#!/bin/bash

# Supabase MCP Server Wrapper Script
# This script loads environment variables and starts the MCP server

# Load environment variables from .env file if it exists
if [ -f "nooke/.env" ]; then
  export $(grep -v '^#' nooke/.env | xargs)
fi

# Set Supabase URL and Service Key from environment or use defaults
SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL:-https://ezbamrqoewrbvdvbypyd.supabase.co}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY}"

# If service key is not set, try to get it from command line args
if [ -z "$SUPABASE_SERVICE_KEY" ] && [ $# -ge 2 ]; then
  SUPABASE_URL="$1"
  SUPABASE_SERVICE_KEY="$2"
fi

# Validate that we have both URL and service key
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo "Error: SUPABASE_URL and SUPABASE_SERVICE_KEY are required" >&2
  echo "Usage: $0 [SUPABASE_URL] [SERVICE_KEY]" >&2
  exit 1
fi

# Export for the MCP server
export SUPABASE_URL
export SUPABASE_SERVICE_KEY

# Start the MCP server with arguments
exec npx -y @modelcontextprotocol/server-supabase "$SUPABASE_URL" "$SUPABASE_SERVICE_KEY"
