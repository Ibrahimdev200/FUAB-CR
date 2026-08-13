import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get("role") as "student" | "lecturer" | "management" | null;

    if (!roleParam) {
      return NextResponse.json({ error: "Role param required" }, { status: 400 });
    }

    const session = await getSession(roleParam);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: notifications, error } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", session.userId)
      .eq("user_type", roleParam)
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) throw error;

    const unreadCount = (notifications || []).filter((n) => !n.is_read).length;

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { role, markAllRead, notificationId } = await req.json();

    if (!role) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    const session = await getSession(role);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (markAllRead) {
      const { error } = await supabaseAdmin
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", session.userId)
        .eq("user_type", role);
      if (error) throw error;
    } else if (notificationId) {
      const { error } = await supabaseAdmin
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .eq("user_id", session.userId);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
