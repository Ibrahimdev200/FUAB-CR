import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf-8");
    envConfig.split("\n").forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*"(.*)"\s*$/) || line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2];
        if (value.endsWith("\r")) value = value.slice(0, -1);
        process.env[key] = value;
      }
    });
  }
}

async function seedManagementAdmin() {
  loadEnv();

  const email = process.argv[2] || "admin@fuab.edu.ng";
  const rawPassword = process.argv[3] || "AdminPass123!";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes("your-project-id")) {
    console.error("Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env file.");
    process.exit(1);
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`Seeding Management Admin account: ${email}...`);

  const passwordHash = await bcrypt.hash(rawPassword, 10);

  // Check if admin already exists
  const { data: existingAdmin, error: checkError } = await supabaseAdmin
    .from("management_admins")
    .select("id")
    .eq("email", email)
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    console.error("Error checking existing admin:", checkError.message);
    process.exit(1);
  }

  if (existingAdmin) {
    // Update existing password
    const { error: updateError } = await supabaseAdmin
      .from("management_admins")
      .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
      .eq("email", email);

    if (updateError) {
      console.error("Failed to update management admin password:", updateError.message);
      process.exit(1);
    }
    console.log(`✓ Successfully updated password for Management Admin: ${email}`);
  } else {
    // Insert new admin
    const { error: insertError } = await supabaseAdmin
      .from("management_admins")
      .insert({
        email,
        password_hash: passwordHash,
      });

    if (insertError) {
      console.error("Failed to create management admin:", insertError.message);
      process.exit(1);
    }
    console.log(`✓ Successfully created Management Admin account: ${email}`);
  }
}

seedManagementAdmin().catch((err) => {
  console.error("Uncaught seed error:", err);
  process.exit(1);
});
