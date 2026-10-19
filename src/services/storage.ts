import { BukhariHadithItem, DailyPrayerTimes, LocationProfile, SyncMetadata, TasbihSession } from '../types';

const DB_NAME = 'salah_companion_db';
const DB_VERSION = 3;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (event.oldVersion < 3 && db.objectStoreNames.contains('schedules')) {
        db.deleteObjectStore('schedules');
      }

      if (!db.objectStoreNames.contains('schedules')) {
        const scheduleStore = db.createObjectStore('schedules', { keyPath: 'compositeId' });
        scheduleStore.createIndex('locationId', 'locationId', { unique: false });
        scheduleStore.createIndex('dateString', 'dateString', { unique: false });
      }
      if (!db.objectStoreNames.contains('locations')) {
        db.createObjectStore('locations', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('bookmarks')) {
        db.createObjectStore('bookmarks', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('tasbih_sessions')) {
        db.createObjectStore('tasbih_sessions', { keyPath: 'sessionId' });
      }
      if (!db.objectStoreNames.contains('sync_metadata')) {
        db.createObjectStore('sync_metadata', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('bukhari_hadiths')) {
        const hadithStore = db.createObjectStore('bukhari_hadiths', { keyPath: 'hadithNumber' });
        hadithStore.createIndex('bookNumber', 'bookNumber', { unique: false });
      }
      if (!db.objectStoreNames.contains('bukhari_books_cached')) {
        db.createObjectStore('bukhari_books_cached', { keyPath: 'bookNumber' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

export async function savePrayerSchedule(schedule: DailyPrayerTimes): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('schedules', 'readwrite');
      const store = tx.objectStore('schedules');
      const compositeId = `${schedule.locationId}_${schedule.dateString}`;
      const req = store.put({ ...schedule, compositeId });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('Storage fallback: unable to save schedule to IndexedDB', e);
  }
}

export async function savePrayerSchedulesBatch(schedules: DailyPrayerTimes[]): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('schedules', 'readwrite');
      const store = tx.objectStore('schedules');
      for (const s of schedules) {
        const compositeId = `${s.locationId}_${s.dateString}`;
        store.put({ ...s, compositeId });
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('Storage fallback: unable to batch save schedules to IndexedDB', e);
  }
}

export async function getPrayerSchedule(locationId: string, dateString: string): Promise<DailyPrayerTimes | null> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('schedules', 'readonly');
      const store = tx.objectStore('schedules');
      const req = store.get(`${locationId}_${dateString}`);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

export async function getMonthlySchedules(locationId: string, year: number, month: number): Promise<DailyPrayerTimes[]> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('schedules', 'readonly');
      const store = tx.objectStore('schedules');
      const req = store.getAll();
      req.onsuccess = () => {
        const all: (DailyPrayerTimes & { compositeId?: string })[] = req.result || [];
        const prefix = `${year}-${month.toString().padStart(2, '0')}`;
        const filtered = all.filter((s) => s.locationId === locationId && s.dateString.startsWith(prefix));
        filtered.sort((a, b) => a.dateString.localeCompare(b.dateString));
        resolve(filtered);
      };
      req.onerror = () => resolve([]);
    });
  } catch (e) {
    return [];
  }
}

export async function saveLocation(location: LocationProfile): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('locations', 'readwrite');
      const store = tx.objectStore('locations');
      const req = store.put(location);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('Storage fallback', e);
  }
}

export async function getSavedLocations(): Promise<LocationProfile[]> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('locations', 'readonly');
      const store = tx.objectStore('locations');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (e) {
    return [];
  }
}

export async function toggleBookmark(id: string, type: 'hadith' | 'dua'): Promise<boolean> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('bookmarks', 'readwrite');
      const store = tx.objectStore('bookmarks');
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        if (getReq.result) {
          store.delete(id);
          resolve(false); // removed
        } else {
          store.put({ id, type, savedAt: Date.now() });
          resolve(true); // added
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (e) {
    return false;
  }
}

export async function getBookmarks(): Promise<string[]> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('bookmarks', 'readonly');
      const store = tx.objectStore('bookmarks');
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result || []).map((b: { id: string }) => b.id));
      req.onerror = () => resolve([]);
    });
  } catch (e) {
    return [];
  }
}

export async function saveTasbihSession(session: TasbihSession): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('tasbih_sessions', 'readwrite');
      const store = tx.objectStore('tasbih_sessions');
      const req = store.put(session);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('Storage fallback', e);
  }
}

export async function getActiveTasbihSession(): Promise<TasbihSession | null> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('tasbih_sessions', 'readonly');
      const store = tx.objectStore('tasbih_sessions');
      const req = store.getAll();
      req.onsuccess = () => {
        const sessions: TasbihSession[] = req.result || [];
        const active = sessions.find((s) => s.status === 'in_progress');
        resolve(active || null);
      };
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

export async function saveSyncMetadata(metadata: SyncMetadata): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_metadata', 'readwrite');
      const store = tx.objectStore('sync_metadata');
      const req = store.put(metadata);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('Storage fallback', e);
  }
}

export async function getSyncMetadata(key: string): Promise<SyncMetadata | null> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('sync_metadata', 'readonly');
      const store = tx.objectStore('sync_metadata');
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

export async function clearCache(): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['schedules', 'sync_metadata'], 'readwrite');
      tx.objectStore('schedules').clear();
      tx.objectStore('sync_metadata').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('Clear cache error', e);
  }
}

export async function purgeAllData(): Promise<void> {
  try {
    if (dbPromise) {
      const db = await dbPromise;
      db.close();
      dbPromise = null;
    }
    if (window.indexedDB) {
      await new Promise<void>((resolve, reject) => {
        const req = window.indexedDB.deleteDatabase(DB_NAME);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
        req.onblocked = () => resolve();
      });
    }
    if (window.localStorage) {
      window.localStorage.clear();
    }
  } catch (e) {
    console.warn('Purge data error', e);
  }
}

export async function saveBukhariHadithsBatch(
  hadiths: BukhariHadithItem[],
  bookNumber: number
): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['bukhari_hadiths', 'bukhari_books_cached'], 'readwrite');
      const hadithStore = tx.objectStore('bukhari_hadiths');
      const bookStore = tx.objectStore('bukhari_books_cached');

      for (const item of hadiths) {
        hadithStore.put(item);
      }
      bookStore.put({ bookNumber, cachedAt: Date.now(), count: hadiths.length });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('Unable to save Bukhari hadiths batch', e);
  }
}

export async function getBukhariHadithsByBook(bookNumber: number): Promise<BukhariHadithItem[]> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('bukhari_hadiths', 'readonly');
      const store = tx.objectStore('bukhari_hadiths');
      const index = store.index('bookNumber');
      const req = index.getAll(bookNumber);
      req.onsuccess = () => {
        const results: BukhariHadithItem[] = req.result || [];
        results.sort((a, b) => a.hadithNumber - b.hadithNumber);
        resolve(results);
      };
      req.onerror = () => resolve([]);
    });
  } catch (e) {
    return [];
  }
}

export async function getBukhariHadithByNumber(hadithNumber: number): Promise<BukhariHadithItem | null> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('bukhari_hadiths', 'readonly');
      const store = tx.objectStore('bukhari_hadiths');
      const req = store.get(hadithNumber);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

export async function isBukhariBookCached(bookNumber: number): Promise<boolean> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('bukhari_books_cached', 'readonly');
      const store = tx.objectStore('bukhari_books_cached');
      const req = store.get(bookNumber);
      req.onsuccess = () => resolve(!!req.result);
      req.onerror = () => resolve(false);
    });
  } catch (e) {
    return false;
  }
}

export async function getCachedBukhariBookNumbers(): Promise<number[]> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('bukhari_books_cached', 'readonly');
      const store = tx.objectStore('bukhari_books_cached');
      const req = store.getAll();
      req.onsuccess = () => {
        const records = req.result || [];
        resolve(records.map((r: { bookNumber: number }) => r.bookNumber));
      };
      req.onerror = () => resolve([]);
    });
  } catch (e) {
    return [];
  }
}
