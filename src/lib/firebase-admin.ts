import * as admin from "firebase-admin";

if (!admin.apps.length) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "fuab-cr";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (clientEmail && privateKey && !privateKey.includes("YOUR_PRIVATE_KEY_HERE")) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    // Local dev fallback using project ID config
    admin.initializeApp({
      projectId,
    });
  }
}

export const adminDb = admin.firestore();
export { admin };
