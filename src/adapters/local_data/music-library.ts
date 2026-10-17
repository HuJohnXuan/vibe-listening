import type { Track } from "../../types/track.ts";
import type { AudioFeatures } from "../../core/vibe/audio-features.ts";
import { DEFAULT_LOCAL_APP_STATE, type LocalAppState } from "../../types/local-state.ts";

export interface SavedSong {
  id: string; title: string; artist: string; album: string; duration: number;
  file: Blob; fileName: string; cover?: Blob; genre: string; mood: string;
  preferredRoom?: Track["preferredRoom"]; features?: AudioFeatures; addedAt: number;
}
const DB_NAME = "vibe-listening-music";
const DB_VERSION = 2;
const SONGS_STORE = "songs";
const STATE_STORE = "app-state";
const STATE_KEY = "current";
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(SONGS_STORE)) request.result.createObjectStore(SONGS_STORE, { keyPath: "id" });
      if (!request.result.objectStoreNames.contains(STATE_STORE)) request.result.createObjectStore(STATE_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("请关闭其他 Vibe Listening 页面后重试。"));
  });
}
async function operation<T>(storeName: string, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const request = action(tx.objectStore(storeName));
    tx.oncomplete = () => { db.close(); resolve(request.result); };
    tx.onabort = () => { db.close(); reject(tx.error ?? request.error ?? new Error("本地保存失败")); };
    tx.onerror = () => { /* onabort reports transaction failure; never report success early. */ };
  });
}
export const readSongs = () => operation<SavedSong[]>(SONGS_STORE, "readonly", store => store.getAll());
export const addSong = (song: SavedSong) => operation(SONGS_STORE, "readwrite", store => store.add(song));
export const saveSong = (song: SavedSong) => operation(SONGS_STORE, "readwrite", store => store.put(song));
export const removeSong = (id: string) => operation(SONGS_STORE, "readwrite", store => store.delete(id));
export async function readAppState(): Promise<LocalAppState> {
  const value = await operation<LocalAppState | undefined>(STATE_STORE, "readonly", store => store.get(STATE_KEY));
  return value?.schemaVersion === 1 ? value : structuredClone(DEFAULT_LOCAL_APP_STATE);
}
export const saveAppState = (state: LocalAppState) =>
  operation<IDBValidKey>(STATE_STORE, "readwrite", store => store.put(state, STATE_KEY));

export function asTrack(song: SavedSong, audioUrl: string, coverUrl: string): Track {
  return { id: song.id, title: song.title, artist: song.artist || "未知歌手", album: song.album || "本地音乐",
    previewAudioUrl: audioUrl, coverUrl, previewDurationSeconds: song.duration,
    lyricsExcerpt: "", listeningNote: "来自你的本地音乐库。选择情绪或房间，让空间更贴近这首歌。",
    tags: { genres: song.genre ? [song.genre] : [], moods: song.mood ? [song.mood] : [], voices: [], production: [] },
    preferredRoom: song.preferredRoom, local: true, addedAt: song.addedAt };
}
export function libraryError(error: unknown): string {
  if (error instanceof DOMException && error.name === "QuotaExceededError") return "浏览器存储空间不足。请移除不需要的曲目后重试。";
  if (error instanceof DOMException && error.name === "ConstraintError") return "已在曲库，跳过重复文件。";
  return error instanceof Error ? error.message : "本地操作失败，请重试。";
}
