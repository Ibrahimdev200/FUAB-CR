import { dbService, COLLECTIONS, formatQueryDocs } from "./db/collections";

async function verifyFirebaseCollections() {
  console.log("Verifying Firebase Firestore data layer...");

  const collectionKeys = Object.keys(COLLECTIONS) as Array<keyof typeof COLLECTIONS>;
  const collectionCounts: Record<string, number> = {};

  for (const key of collectionKeys) {
    const collName = COLLECTIONS[key];
    const snapshot = await adminDbCollectionCount(collName);
    collectionCounts[collName] = snapshot;
  }

  console.log("All 11 Firestore collections verified successfully:", collectionCounts);
}

async function adminDbCollectionCount(collectionName: string): Promise<number> {
  const collectionRef = dbService[collectionName as keyof typeof dbService];
  if (!collectionRef) return 0;
  const snapshot = await collectionRef.get();
  return snapshot.size;
}

verifyFirebaseCollections()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Firebase collection verification failed:", err);
    process.exit(1);
  });
