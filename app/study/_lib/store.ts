// 문서를 브라우저(IndexedDB)에 저장한다. 서버에는 아무것도 저장하지 않는다.
// 저장소를 쓸 수 없는 환경(시크릿 모드 등)에서는 조용히 실패하고, 앱은 저장 없이 동작한다.
import type { StoredDoc } from "./types";

const DB_NAME = "study";
const STORE = "docs";

function open() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>) {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = run(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export async function listDocs(): Promise<StoredDoc[]> {
  try {
    const docs = await tx("readonly", (s) => s.getAll() as IDBRequest<StoredDoc[]>);
    return docs.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export async function saveDoc(doc: StoredDoc): Promise<boolean> {
  try {
    await tx("readwrite", (s) => s.put(doc));
    return true;
  } catch {
    return false;
  }
}

export async function deleteDoc(id: string): Promise<void> {
  try {
    await tx("readwrite", (s) => s.delete(id));
  } catch {
    // 지우지 못해도 화면에서는 목록에서 뺀다
  }
}
