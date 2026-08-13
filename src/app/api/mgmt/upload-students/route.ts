import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const session = await getSession("management");
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { students } = await req.json();

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: "No student data provided" }, { status: 400 });
    }

    // Pre-fetch departments to resolve department names to IDs if needed
    const { data: departments } = await supabaseAdmin.from("departments").select("id, name");
    const deptMap = new Map<string, string>();
    (departments || []).forEach((d) => {
      deptMap.set(d.name.toLowerCase().trim(), d.id);
      deptMap.set(d.id, d.id);
    });

    let uploaded = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const item of students) {
      const matric = String(item.matric_number || "").trim();
      const fullName = String(item.full_name || "").trim();
      const level = parseInt(String(item.level || 100), 10);
      const rawDept = String(item.department_id || item.department || "").trim();

      if (!matric || !fullName) {
        skipped++;
        errors.push(`Skipped row: Missing matric number or full name.`);
        continue;
      }

      const deptId = deptMap.get(rawDept.toLowerCase()) || deptMap.get(rawDept);
      if (!deptId) {
        skipped++;
        errors.push(`Skipped ${matric}: Department "${rawDept}" not found.`);
        continue;
      }

      // Upsert preloaded_matrics
      const { error: upsertError } = await supabaseAdmin
        .from("preloaded_matrics")
        .upsert(
          {
            matric_number: matric,
            full_name: fullName,
            department_id: deptId,
            level: level,
          },
          { onConflict: "matric_number" }
        );

      if (upsertError) {
        skipped++;
        errors.push(`Error for ${matric}: ${upsertError.message}`);
      } else {
        uploaded++;
      }
    }

    return NextResponse.json({
      success: true,
      uploaded,
      skipped,
      errors,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
