import * as admin from "firebase-admin";

function formatPrivateKey(rawKey?: string): string | undefined {
  if (!rawKey) return undefined;
  
  let key = rawKey.trim();
  // Strip surrounding quotes if present in env
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  
  // Replace escape sequences \n with real newline characters
  key = key.replace(/\\n/g, "\n");
  
  return key;
}

if (!admin.apps.length) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "fuab-cr";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (clientEmail && privateKey && !privateKey.includes("YOUR_PRIVATE_KEY_HERE")) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } catch (e) {
      console.warn("Firebase admin initialization warning:", e);
      admin.initializeApp({ projectId });
    }
  } else {
    admin.initializeApp({ projectId });
  }
}

export const adminDb = admin.firestore();
export { admin };
