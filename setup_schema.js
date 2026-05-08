
// ============================================================
// Supabase Schema Setup + Admin User Creation Script
// Run: node setup_schema.js
// ============================================================

const SUPABASE_URL = "https://vpsnhpqtnjficdsrafrf.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwc25ocHF0bmpmaWNkc3JhZnJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODIxODUxMSwiZXhwIjoyMDkzNzk0NTExfQ.luCqyM04kofW5hn2vupzs9QlUOTJNKIYlddQXHKGbNY";

const ADMIN_EMAIL = "prashantk@amplior.com";
const ADMIN_PASSWORD = "PrashantADMIN@1234545";

async function runSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  return res;
}

async function executeSQLDirect(sql) {
  // Use the pg REST endpoint via service role
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ query: sql }),
  });
  return res;
}

async function createAdminUser() {
  console.log("👤 Creating admin user via Supabase Auth API...");
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: "Prashant Kumar",
        project_name: "ADMIN",
        admin_level: "super",
        role: "admin"
      }
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("❌ Failed to create user:", JSON.stringify(data, null, 2));
    return null;
  }
  console.log("✅ Admin user created! ID:", data.id);
  return data.id;
}

async function insertUserRecord(userId) {
  console.log("📝 Inserting user into public.users table...");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      id: userId,
      email: ADMIN_EMAIL,
      name: "Prashant Kumar",
      role: "admin",
      project_name: "ADMIN",
      status: "active"
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    console.warn("⚠️ users insert:", txt);
  } else {
    console.log("✅ User record inserted in public.users");
  }
}

async function insertUserProfile(userId) {
  console.log("📝 Inserting user_profiles record...");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      id: userId,
      email: ADMIN_EMAIL,
      full_name: "Prashant Kumar",
      role: "admin",
      project: "ADMIN"
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    console.warn("⚠️ user_profiles insert:", txt);
  } else {
    console.log("✅ User profile inserted");
  }
}

async function createTableViaRPC(sql, label) {
  console.log(`\n🔧 Creating: ${label}`);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql }),
  });
  if (!res.ok) {
    const txt = await res.text();
    // Ignore "already exists" errors
    if (txt.includes('already exists') || txt.includes('42710') || txt.includes('42P07')) {
      console.log(`  ℹ️ Already exists - skipping`);
    } else {
      console.warn(`  ⚠️ ${txt.substring(0, 200)}`);
    }
  } else {
    console.log(`  ✅ Done`);
  }
}

// ============================================================
// MAIN - Run everything
// ============================================================
async function main() {
  console.log("🚀 Starting Supabase schema setup...\n");
  console.log(`📡 Target: ${SUPABASE_URL}\n`);

  // Step 1: Create the admin user via Auth API
  const userId = await createAdminUser();

  if (!userId) {
    console.log("\n💡 User may already exist. Trying to fetch existing user...");
    const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(ADMIN_EMAIL)}`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      }
    });
    const listData = await listRes.json();
    const existingUser = listData?.users?.[0];
    if (existingUser) {
      console.log("✅ Found existing user. ID:", existingUser.id);
      await insertUserRecord(existingUser.id);
      await insertUserProfile(existingUser.id);
    }
  } else {
    // Step 2: Insert into public tables
    await insertUserRecord(userId);
    await insertUserProfile(userId);
  }

  console.log("\n✅ Schema setup complete!");
  console.log("\n📋 SUMMARY:");
  console.log(`   🔑 Admin Email: ${ADMIN_EMAIL}`);
  console.log(`   🔐 Password: ${ADMIN_PASSWORD}`);
  console.log(`   👑 Role: Super Admin`);
  console.log(`   📁 Project: ADMIN`);
  console.log("\n⚠️  IMPORTANT: You still need to run the SQL schema in Supabase SQL Editor.");
  console.log("    See the generated schema.sql file in the project root.\n");
}

main().catch(console.error);
