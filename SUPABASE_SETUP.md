# Supabase Setup Guide

## Step 1: Run Database Migration

You have two options:

### Option A: Supabase Dashboard (Recommended - 2 minutes)

1. Open your Supabase SQL Editor:
   https://supabase.com/dashboard/project/ezbamrqoewrbvdvbypyd/sql/new

2. Open this file in your editor:
   `/Users/crax/DEVELOPMENT/Nooke/nooke/supabase/migrations/001_initial_schema.sql`

3. Copy ALL the SQL (Cmd+A, then Cmd+C)

4. Paste into Supabase SQL Editor

5. Click **Run** or press Cmd+Enter

6. Wait for "Success" message

### Option B: Supabase CLI

```bash
cd /Users/crax/DEVELOPMENT/Nooke/nooke
supabase link --project-ref ezbamrqoewrbvdvbypyd
supabase db push
```

## Step 2: Enable Phone Authentication

1. Go to: https://supabase.com/dashboard/project/ezbamrqoewrbvdvbypyd/auth/providers

2. Find **Phone** in the providers list

3. Toggle it **ON**

4. Click **Save**

Note: For testing, the built-in SMS provider works fine. For production, configure Twilio.

## Step 3: Enable Realtime

1. Go to: https://supabase.com/dashboard/project/ezbamrqoewrbvdvbypyd/database/replication

2. Enable realtime for these tables (toggle ON):
   - ✅ users
   - ✅ friendships
   - ✅ room_participants
   - ✅ flares

## Verification

After completing all steps, test by running:

```bash
cd /Users/crax/DEVELOPMENT/Nooke/nooke
npx expo start
```

Then try logging in with your phone number!

## Troubleshooting

- **"Relation users does not exist"** → Step 1 not completed
- **"Phone auth not enabled"** → Step 2 not completed
- **Friends not updating in real-time** → Step 3 not completed
