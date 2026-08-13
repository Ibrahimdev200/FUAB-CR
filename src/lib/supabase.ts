import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gorqigcafcdguwznglnb.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvcnFpZ2NhZmNkZ3V3em5nbG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2Mzg2ODEsImV4cCI6MjEwMjIxNDY4MX0.pvKz29YPPg5hGJcCjx5cg2WmdLq-DK6d9TeGFj0YmJU";

// Public Supabase Client (For frontend / client-side queries)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
