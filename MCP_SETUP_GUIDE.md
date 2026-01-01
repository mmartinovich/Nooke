# Supabase MCP Setup Guide

## What is MCP?

Model Context Protocol (MCP) allows Claude to directly interact with Supabase to:
- Run SQL migrations
- Query databases
- Manage tables
- Configure settings

## Setup Steps

### 1. Install Supabase MCP Server

```bash
# Install the Supabase MCP server
npx -y @modelcontextprotocol/server-supabase
```

### 2. Get Your Supabase Credentials

You need two pieces of information:

**Supabase URL:** (You already have this in `.env`)
```
https://ezbamrqoewrbvdvbypyd.supabase.co
```

**Service Role Key:** (This is DIFFERENT from your anon key!)

1. Go to: https://supabase.com/dashboard/project/ezbamrqoewrbvdvbypyd/settings/api
2. Find the **"service_role"** key (it's the secret one)
3. Copy it

⚠️ **IMPORTANT:** This key has full admin access. Keep it secret!

### 3. Configure MCP Server

#### For Cursor IDE (Using Supabase Hosted MCP - Recommended):

1. Open Cursor Settings (Cmd+, on Mac, Ctrl+, on Windows/Linux)
2. Search for "MCP" or "Model Context Protocol"
3. Click on "MCP Servers" or "Edit MCP Config"
4. Add this configuration:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=ezbamrqoewrbvdvbypyd"
    }
  }
}
```

**Note:** This uses Supabase's hosted MCP service. The `project_ref` is the part of your Supabase URL (ezbamrqoewrbvdvbypyd).

5. Restart Cursor IDE

#### Alternative: Local MCP Server (If hosted doesn't work)

If you prefer to run the MCP server locally, use:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-supabase",
        "https://ezbamrqoewrbvdvbypyd.supabase.co",
        "YOUR_SERVICE_ROLE_KEY_HERE"
      ]
    }
  }
}
```

#### For Claude Desktop:

1. Open Claude Desktop settings
2. Go to "Developer" → "Edit Config"
3. Add the same configuration as above
4. Restart Claude Desktop

### 4. Verify MCP is Working

In Claude, ask:
```
Can you list my Supabase tables?
```

If MCP is working, Claude will be able to query your database directly.

## Troubleshooting

### If Hosted MCP Doesn't Work

If the hosted MCP URL approach doesn't work, you can try the local server approach with a shell script wrapper:

1. **Add service role key to your `.env` file:**

Add this line to `nooke/.env`:
```bash
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

2. **Use the wrapper script:**

A wrapper script is already created at `.supabase-mcp.sh` in your project root. Update your Cursor MCP config to:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "/Users/crax/DEVELOPMENT/Nooke/.supabase-mcp.sh",
      "args": [
        "https://ezbamrqoewrbvdvbypyd.supabase.co",
        "YOUR_SERVICE_ROLE_KEY_HERE"
      ]
    }
  }
}
```

3. **Restart Cursor IDE**

## What Claude Can Do With MCP

Once configured, Claude can:

✅ Run SQL migrations directly
✅ Create/modify tables
✅ Set up RLS policies
✅ Query data
✅ Enable Realtime
✅ Configure auth providers
✅ Manage database settings

## Next Steps After Setup

Once MCP is configured, tell Claude:

```
Deploy the Nooke database schema to Supabase
```

Claude will then:
1. Run the migration SQL file
2. Verify tables were created
3. Enable necessary features
4. Confirm everything is ready

---

**Need Help?**

- Supabase API Docs: https://supabase.com/docs/guides/api
- MCP Documentation: https://modelcontextprotocol.io/
- Your Supabase Project: https://supabase.com/dashboard/project/ezbamrqoewrbvdvbypyd
