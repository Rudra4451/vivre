/**
 * Vivre Offline Queue: IndexedDB Persistent Storage
 *
 * Manages structured offline queue for task completions and local-only tasks.
 * Strictly avoids localStorage for structured sync operations.
 */

import { completeTask, createTaskAction } from "./actions";
import type { AuthoritativeProgressionState, Task } from "@/types";

export interface PendingOfflineCompletion {
  idempotencyKey: string;
  taskId: string;
  queuedAt: number;
  status: "pending" | "syncing" | "failed";
}

export interface LocalOfflineTask {
  id: string;
  user_id: string;
  title: string;
  category: string;
  is_recurring: boolean;
  archived_at: string | null;
  created_at: string;
  isLocal: boolean;
}

const DB_NAME = "vivre_offline_db";
const DB_VERSION = 1;
const STORE_COMPLETIONS = "pending_completions";
const STORE_LOCAL_TASKS = "local_tasks";

function getIndexedDB(): IDBFactory | null {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return null;
  }
  return window.indexedDB;
}

export function openOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const idb = getIndexedDB();
    if (!idb) {
      reject(new Error("IndexedDB is not supported in this environment"));
      return;
    }

    const request = idb.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_COMPLETIONS)) {
        db.createObjectStore(STORE_COMPLETIONS, { keyPath: "idempotencyKey" });
      }

      if (!db.objectStoreNames.contains(STORE_LOCAL_TASKS)) {
        db.createObjectStore(STORE_LOCAL_TASKS, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Queues an unauthenticated or offline task completion.
 */
export async function queueOfflineCompletion(
  taskId: string,
  idempotencyKey: string
): Promise<void> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_COMPLETIONS, "readwrite");
    const store = tx.objectStore(STORE_COMPLETIONS);

    const record: PendingOfflineCompletion = {
      idempotencyKey,
      taskId,
      queuedAt: Date.now(),
      status: "pending",
    };

    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieves all pending offline completions.
 */
export async function getPendingCompletions(): Promise<PendingOfflineCompletion[]> {
  try {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_COMPLETIONS, "readonly");
      const store = tx.objectStore(STORE_COMPLETIONS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

/**
 * Removes a synced completion from the offline queue.
 */
export async function removePendingCompletion(idempotencyKey: string): Promise<void> {
  try {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_COMPLETIONS, "readwrite");
      const store = tx.objectStore(STORE_COMPLETIONS);
      const req = store.delete(idempotencyKey);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignore deletion error if already cleaned
  }
}

/**
 * Stores a locally created offline task.
 */
export async function saveLocalOfflineTask(task: Task): Promise<void> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_LOCAL_TASKS, "readwrite");
    const store = tx.objectStore(STORE_LOCAL_TASKS);
    const req = store.put({ ...task, isLocal: true });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieves all local offline tasks.
 */
export async function getLocalOfflineTasks(): Promise<Task[]> {
  try {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_LOCAL_TASKS, "readonly");
      const store = tx.objectStore(STORE_LOCAL_TASKS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

/**
 * Removes a synced local task.
 */
export async function removeLocalOfflineTask(taskId: string): Promise<void> {
  try {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_LOCAL_TASKS, "readwrite");
      const store = tx.objectStore(STORE_LOCAL_TASKS);
      const req = store.delete(taskId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignore error
  }
}

let isSyncing = false;

/**
 * Flushes all queued offline actions to the server when network connectivity is restored.
 */
export async function syncOfflineQueue(
  onCompletionSynced?: (res: AuthoritativeProgressionState) => void,
  onTaskSynced?: (oldId: string, newTask: Task) => void
): Promise<{ syncedCompletions: number; syncedTasks: number }> {
  if (isSyncing || typeof navigator !== "undefined" && !navigator.onLine) {
    return { syncedCompletions: 0, syncedTasks: 0 };
  }

  isSyncing = true;
  let syncedCompletions = 0;
  let syncedTasks = 0;

  try {
    // 1. Sync pending local tasks first
    const localTasks = await getLocalOfflineTasks();
    const idMap = new Map<string, string>(); // oldId -> newId

    for (const localTask of localTasks) {
      try {
        const res = await createTaskAction({
          title: localTask.title,
          category: localTask.category as "Body" | "Mind" | "Discipline" | "Craft" | "Spirit",
          isRecurring: localTask.is_recurring,
        });

        if (res.success && res.task) {
          idMap.set(localTask.id, res.task.id);
          await removeLocalOfflineTask(localTask.id);
          onTaskSynced?.(localTask.id, res.task);
          syncedTasks++;
        }
      } catch (err) {
        console.warn("[Offline Sync] Failed to sync local task:", err);
      }
    }

    // 2. Sync pending completions
    const pendingCompletions = await getPendingCompletions();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    for (const item of pendingCompletions) {
      // Evict stale requests queued more than 7 days ago
      if (item.queuedAt && now - item.queuedAt > SEVEN_DAYS_MS) {
        console.warn(`[Offline Sync] Discarding stale completion for task ${item.taskId}`);
        await removePendingCompletion(item.idempotencyKey);
        continue;
      }

      try {
        const actualTaskId = idMap.get(item.taskId) || item.taskId;
        const res = await completeTask({
          taskId: actualTaskId,
          idempotencyKey: item.idempotencyKey,
        });

        if (res.success && res.data) {
          await removePendingCompletion(item.idempotencyKey);
          onCompletionSynced?.(res.data);
          syncedCompletions++;
        } else {
          // If permanent failure (e.g. task not found), remove from queue
          if (res.error && !res.error.includes("slow down")) {
            await removePendingCompletion(item.idempotencyKey);
          }
        }
      } catch (err) {
        console.warn("[Offline Sync] Failed to sync completion:", err);
      }
    }
  } finally {
    isSyncing = false;
  }

  return { syncedCompletions, syncedTasks };
}
