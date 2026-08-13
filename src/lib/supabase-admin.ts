import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gorqigcafcdguwznglnb.supabase.co";

const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvcnFpZ2NhZmNkZ3V3em5nbG5iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjYzODY4MSwiZXhwIjoyMTAyMjE0NjgxfQ.TiOsODXiuzxIg74Fa2bup8gVPxWGFa2RvbXctXxcMQc";

// Server-side Supabase Admin Client (Bypasses Row Level Security for administrative queries)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
