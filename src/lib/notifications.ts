import { supabaseAdmin } from "@/lib/supabase-admin";
import { Notification } from "@/types/db";

export async function createNotification(
  userId: string,
  userType: "student" | "lecturer" | "management",
  message: string,
  type: Notification["type"]
) {
  try {
    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      user_type: userType,
      message,
      type,
      is_read: false,
    });
  } catch (err) {
    console.error("Failed to create in-app notification:", err);
  }
}
