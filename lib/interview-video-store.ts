/**
 * Store and retrieve per-question video recordings in IndexedDB (browser storage).
 * Key format: interviewId + questionNumber
 */

const DB_NAME = "mockaai_interview_videos"
const STORE_NAME = "question_videos"
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: ["interviewId", "questionNumber"] })
      }
    }
  })
}

export async function saveQuestionVideo(
  interviewId: string,
  questionNumber: number,
  blob: Blob
): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const request = store.put({
      interviewId,
      questionNumber,
      blob,
      savedAt: Date.now(),
    })
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

export async function getQuestionVideo(
  interviewId: string,
  questionNumber: number
): Promise<Blob | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const store = tx.objectStore(STORE_NAME)
    const request = store.get([interviewId, questionNumber])
    request.onsuccess = () => {
      const row = request.result
      resolve(row?.blob ?? null)
    }
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

export async function clearInterviewVideos(interviewId: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const request = store.openCursor()

    request.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result
      if (cursor) {
        const key = cursor.key as [string, number]
        if (key[0] === interviewId) cursor.delete()
        cursor.continue()
      } else {
        resolve()
      }
    }
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}
