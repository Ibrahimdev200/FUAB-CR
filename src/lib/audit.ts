import { supabaseAdmin } from "@/lib/supabase-admin";

export async function createAuditLog(
  actorId: string,
  actorEmail: string,
  actorRole: "management" | "lecturer",
  action: string,
  details: string
) {
  try {
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: actorId,
      actor_email: actorEmail,
      actor_role: actorRole,
      action,
      details,
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}
