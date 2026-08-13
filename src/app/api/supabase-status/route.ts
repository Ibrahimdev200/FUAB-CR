import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const isUrlConfigured = supabaseUrl !== "" && !supabaseUrl.includes("your-project-id");

  if (!isUrlConfigured) {
    return NextResponse.json({
      status: "pending_credentials",
      message: "Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.",
      supabaseUrl,
      isConfigured: false,
    });
  }

  try {
    // Perform test query against the faculties table
    const { data, error, count } = await supabaseAdmin
      .from("faculties")
      .select("*", { count: "exact", head: true });

    if (error) {
      return NextResponse.json({
        status: "table_not_found_or_error",
        message: "Connected to Supabase project, but tables need to be created using schema.sql.",
        supabaseUrl,
        isConfigured: true,
        error: error.message,
      });
    }

    return NextResponse.json({
      status: "connected",
      message: "Successfully connected to Supabase PostgreSQL database!",
      supabaseUrl,
      isConfigured: true,
      facultiesCount: count ?? 0,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      status: "error",
      message: "Failed to connect to Supabase database.",
      supabaseUrl,
      isConfigured: true,
      error: errorMsg,
    });
  }
}
