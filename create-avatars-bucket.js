#!/usr/bin/env node

/**
 * Create Supabase Storage Bucket for Avatars
 * This script creates the 'avatars' bucket via Supabase REST API
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://ezbamrqoewrbvdvbypyd.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error("❌ Error: SUPABASE_SERVICE_KEY not found in environment variables");
  console.error("\nTo get your service role key:");
  console.error("1. Go to: https://supabase.com/dashboard/project/ezbamrqoewrbvdvbypyd/settings/api");
  console.error('2. Copy the "service_role" key (NOT the anon key!)');
  console.error("3. Add it to your .env file as: SUPABASE_SERVICE_KEY=your_service_role_key");
  process.exit(1);
}

async function createBucket() {
  try {
    console.log("🪣 Creating avatars storage bucket...");

    const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        apikey: SUPABASE_SERVICE_KEY,
      },
      body: JSON.stringify({
        name: "avatars",
        public: true,
        file_size_limit: 5242880, // 5MB
        allowed_mime_types: ["image/*"],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      if (error.includes("already exists") || error.includes("duplicate")) {
        console.log('✅ Bucket "avatars" already exists');
        return true;
      }
      throw new Error(`Failed to create bucket: ${response.status} ${error}`);
    }

    const data = await response.json();
    console.log("✅ Successfully created avatars bucket!");
    console.log("   Name:", data.name);
    console.log("   Public:", data.public);
    return true;
  } catch (error) {
    console.error("❌ Error creating bucket:", error.message);
    return false;
  }
}

createBucket().then((success) => {
  if (success) {
    console.log("\n✅ Next step: Run the RLS policies migration");
    console.log("   The migration file is at: nuuky/supabase/migrations/create_avatars_bucket.sql");
  }
  process.exit(success ? 0 : 1);
});
