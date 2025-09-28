import { openDB, DBSchema, IDBPDatabase } from "idb";

interface PublicKeyDB extends DBSchema {
  publicKeys: {
    key: string; // ACL contract address
    value: {
      publicKey: string;
      publicParams: string;
      timestamp: number;
    };
  };
}

const DB_NAME = "SurveyX_FHEVM_PublicKeys";
const DB_VERSION = 1;
const STORE_NAME = "publicKeys";

let dbPromise: Promise<IDBPDatabase<PublicKeyDB>> | null = null;

function getDB(): Promise<IDBPDatabase<PublicKeyDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PublicKeyDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

export async function publicKeyStorageGet(
  aclAddress: string
): Promise<{ publicKey: string; publicParams: string }> {
  try {
    const db = await getDB();
    const stored = await db.get(STORE_NAME, aclAddress.toLowerCase());
    
    if (stored) {
      console.log(`[PublicKeyStorage] Found cached public key for ${aclAddress}`);
      return {
        publicKey: stored.publicKey,
        publicParams: stored.publicParams,
      };
    }
  } catch (error) {
    console.warn("[PublicKeyStorage] Failed to get from storage:", error);
  }

  // Return empty strings if not found - the SDK will generate new keys
  console.log(`[PublicKeyStorage] No cached public key for ${aclAddress}, will generate new`);
  return {
    publicKey: "",
    publicParams: "",
  };
}

export async function publicKeyStorageSet(
  aclAddress: string,
  publicKey: string,
  publicParams: string
): Promise<void> {
  try {
    const db = await getDB();
    await db.put(STORE_NAME, {
      publicKey,
      publicParams,
      timestamp: Date.now(),
    }, aclAddress.toLowerCase());
    
    console.log(`[PublicKeyStorage] Cached public key for ${aclAddress}`);
  } catch (error) {
    console.warn("[PublicKeyStorage] Failed to save to storage:", error);
  }
}
