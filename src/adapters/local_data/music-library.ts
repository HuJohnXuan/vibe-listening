import type { Track } from "../../types/track.ts";
import type { AudioFeatures } from "../../core/vibe/audio-features.ts";

export interface SavedSong {
  id: string; title: string; artist: string; album: string; duration: number;
  file: Blob; fileName: string; cover?: Blob; genre: string; mood: string;
  preferredRoom?: Track["preferredRoom"]; features?: AudioFeatures; addedAt: number;
}
const DB_NAME = "vibe-listening-music";
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("songs", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("请关闭其他 Vibe Listening 页面后重试。"));
  });
}
async function operation<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("songs", mode);
    const request = action(tx.objectStore("songs"));
    tx.oncomplete = () => { db.close(); resolve(request.result); };
    tx.onabort = () => { db.close(); reject(tx.error ?? request.error ?? new Error("本地保存失败")); };
    tx.onerror = () => { /* onabort reports transaction failure; never report success early. */ };
  });
}
export const readSongs = () => operation<SavedSong[]>("readonly", store => store.getAll());
export const addSong = (song: SavedSong) => operation("readwrite", store => store.add(song));
export const saveSong = (song: SavedSong) => operation("readwrite", store => store.put(song));
export const removeSong = (id: string) => operation("readwrite", store => store.delete(id));

export function asTrack(song: SavedSong, audioUrl: string, coverUrl: string): Track {
  return { id: song.id, title: song.title, artist: song.artist || "未知歌手", album: song.album || "本地音乐",
    previewAudioUrl: audioUrl, coverUrl, previewDurationSeconds: song.duration,
    lyricsExcerpt: "", listeningNote: "来自你的本地音乐库。选择情绪或房间，让空间更贴近这首歌。",
    tags: { genres: song.genre ? [song.genre] : [], moods: song.mood ? [song.mood] : [], voices: [], production: [] },
    preferredRoom: song.preferredRoom, local: true };
}
export function libraryError(error: unknown): string {
  if (error instanceof DOMException && error.name === "QuotaExceededError") return "浏览器存储空间不足。请移除不需要的曲目后重试。";
  if (error instanceof DOMException && error.name === "ConstraintError") return "已在曲库，跳过重复文件。";
  return error instanceof Error ? error.message : "本地操作失败，请重试。";
}
