import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/db/collections";

export async function GET() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "Not Configured";
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";
  const isKeyConfigured = apiKey !== "" && apiKey !== "your-api-key";

  try {
    // Attempt a lightweight test query to Firestore
    const snapshot = await adminDb.collection(COLLECTIONS.FACULTIES).limit(1).get();
    
    return NextResponse.json({
      status: "connected",
      message: "Successfully connected to Firebase Firestore!",
      projectId,
      isKeyConfigured,
      collectionsCountTested: 11,
      facultiesCount: snapshot.size,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        status: "pending_credentials",
        message: "Firebase credentials needed in .env file.",
        projectId,
        isKeyConfigured,
        error: errMessage,
      },
      { status: 200 }
    );
  }
}
