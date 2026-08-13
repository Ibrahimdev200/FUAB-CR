import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fuab_cr_secret_key_change_in_production_2026"
);

async function getVerifiedRole(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return (verified.payload as { role?: string }).role || null;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Management Protected Routes (/mgmt-portal-x9k2/dashboard)
  if (pathname.startsWith("/mgmt-portal-x9k2/dashboard")) {
    const token = req.cookies.get("fuab_mgmt_token")?.value;
    const role = await getVerifiedRole(token);
    if (role !== "management") {
      const loginUrl = new URL("/mgmt-portal-x9k2/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Lecturer Protected Routes (/lecturer/dashboard)
  if (pathname.startsWith("/lecturer/dashboard")) {
    const token = req.cookies.get("fuab_lecturer_token")?.value;
    const role = await getVerifiedRole(token);
    if (role !== "lecturer") {
      const loginUrl = new URL("/lecturer/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Student Protected Routes (/student/dashboard)
  if (pathname.startsWith("/student/dashboard")) {
    const token = req.cookies.get("fuab_student_token")?.value;
    const role = await getVerifiedRole(token);
    if (role !== "student") {
      const loginUrl = new URL("/student/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 4. API Route Protection for Management endpoints
  if (pathname.startsWith("/api/mgmt/") && !pathname.startsWith("/api/mgmt/auth/login")) {
    const token = req.cookies.get("fuab_mgmt_token")?.value;
    const role = await getVerifiedRole(token);
    if (role !== "management") {
      return NextResponse.json({ error: "Unauthorized management session" }, { status: 401 });
    }
  }

  // 5. API Route Protection for Lecturer endpoints
  if (pathname.startsWith("/api/lecturer/") && !pathname.startsWith("/api/lecturer/auth/login")) {
    const token = req.cookies.get("fuab_lecturer_token")?.value;
    const role = await getVerifiedRole(token);
    if (role !== "lecturer") {
      return NextResponse.json({ error: "Unauthorized lecturer session" }, { status: 401 });
    }
  }

  // 6. API Route Protection for Student endpoints
  if (pathname.startsWith("/api/student/") && !pathname.startsWith("/api/student/auth/")) {
    const token = req.cookies.get("fuab_student_token")?.value;
    const role = await getVerifiedRole(token);
    if (role !== "student") {
      return NextResponse.json({ error: "Unauthorized student session" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/mgmt-portal-x9k2/dashboard/:path*",
    "/lecturer/dashboard/:path*",
    "/student/dashboard/:path*",
    "/api/mgmt/:path*",
    "/api/lecturer/:path*",
    "/api/student/:path*",
  ],
};
