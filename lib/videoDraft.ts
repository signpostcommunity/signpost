/**
 * Video draft persistence via IndexedDB.
 *
 * When an interpreter records or uploads an intro video, we keep the raw
 * Blob in IndexedDB so a failed Supabase upload (or a "Save as Draft"
 * action) does not lose the recording.
 */

const DB_NAME = 'signpost-video-drafts'
const STORE_NAME = 'drafts'
const DB_VERSION = 1

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof indexedDB !== 'undefined'
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveDraftVideo(userId: string, blob: Blob): Promise<void> {
  if (!isBrowser()) return
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(blob, userId)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getDraftVideo(userId: string): Promise<Blob | null> {
  if (!isBrowser()) return null
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).get(userId)
    request.onsuccess = () => resolve((request.result as Blob | undefined) ?? null)
    request.onerror = () => reject(request.error)
  })
}

export async function deleteDraftVideo(userId: string): Promise<void> {
  if (!isBrowser()) return
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(userId)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
