import { openDB, DBSchema, IDBPDatabase } from "idb";

interface GenericStringDB extends DBSchema {
  storage: {
    key: string;
    value: string;
  };
}

const DB_NAME = "SurveyX_GenericStringStorage";
const DB_VERSION = 1;
const STORE_NAME = "storage";

let dbPromise: Promise<IDBPDatabase<GenericStringDB>> | null = null;

function getDB(): Promise<IDBPDatabase<GenericStringDB>> {
  if (!dbPromise) {
    dbPromise = openDB<GenericStringDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

export class GenericStringStorage {
  private _prefix: string;

  constructor(prefix: string = "") {
    this._prefix = prefix;
  }

  private _key(key: string): string {
    return this._prefix ? `${this._prefix}:${key}` : key;
  }

  async get(key: string): Promise<string | null> {
    try {
      const db = await getDB();
      const result = await db.get(STORE_NAME, this._key(key));
      return result || null;
    } catch (error) {
      console.warn("GenericStringStorage get failed:", error);
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      const db = await getDB();
      await db.put(STORE_NAME, value, this._key(key));
    } catch (error) {
      console.warn("GenericStringStorage set failed:", error);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const db = await getDB();
      await db.delete(STORE_NAME, this._key(key));
    } catch (error) {
      console.warn("GenericStringStorage remove failed:", error);
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await getDB();
      await db.clear(STORE_NAME);
    } catch (error) {
      console.warn("GenericStringStorage clear failed:", error);
    }
  }
}

