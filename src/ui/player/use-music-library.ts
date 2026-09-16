"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { addSong, asTrack, libraryError, readSongs, removeSong, saveSong, type SavedSong } from "../../adapters/local_data/music-library.ts";
import type { Track } from "../../types/track.ts";

export function useMusicLibrary(demos: readonly Track[]) {
  const [songs, setSongs] = useState<SavedSong[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const locked = useRef(false);
  const urls = useRef(new Map<string, {audio: string; cover: string}>());
  const [tracks, setTracks] = useState<Track[]>([]);
  useEffect(() => {
    let active = true;
    readSongs().then(value => { if (active) { setSongs(value.sort((a,b) => a.addedAt - b.addedAt)); setReady(true); } })
      .catch(error => { if (active) setMessage(`无法读取本地曲库：${libraryError(error)}`); });
    const cache = urls.current;
    return () => { active = false; cache.forEach(value => { URL.revokeObjectURL(value.audio); if (value.cover.startsWith("blob:")) URL.revokeObjectURL(value.cover); }); cache.clear(); };
  }, []);
  useEffect(() => {
    const ids = new Set(songs.map(song => song.id));
    urls.current.forEach((value, id) => { if (!ids.has(id)) { URL.revokeObjectURL(value.audio); if (value.cover.startsWith("blob:")) URL.revokeObjectURL(value.cover); urls.current.delete(id); } });
    setTracks(songs.map(song => {
      if (!urls.current.has(song.id)) urls.current.set(song.id, { audio: URL.createObjectURL(song.file), cover: song.cover ? URL.createObjectURL(song.cover) : "/assets/local-cover.svg" });
      const value = urls.current.get(song.id)!;
      return asTrack(song, value.audio, value.cover);
    }));
  }, [songs]);
  async function importFiles(files: File[]) {
    if (locked.current || !ready) return;
    locked.current = true; setBusy(true); setResults([]);
    const messages: string[] = [];
    const known = new Set(songs.map(song => song.id));
    try {
      const { parseBlob } = await import("music-metadata");
      for (const [index, file] of files.entries()) {
        setMessage(`正在导入 ${index + 1}/${files.length} · ${file.name}`);
        try {
          if (!/\.(mp3|m4a|aac|wav|flac|ogg|opus)$/i.test(file.name)) throw new Error("暂不支持此格式，请使用 MP3、M4A、AAC、WAV、FLAC 或 Ogg/Opus。");
          if (!file.size || file.size > 100 * 1024 * 1024) throw new Error("文件为空或超过单首 100 MB 上限。");
          const hash = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
          const id = `local-${Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2,"0")).join("")}`;
          if (known.has(id)) { messages.push(`${file.name}：已在曲库，跳过。`); setResults([...messages]); continue; }
          const metadata = await parseBlob(file, { duration: true });
          if (!metadata.format.codec || !metadata.format.sampleRate || !(metadata.format.duration && metadata.format.duration > 0)) throw new Error("未读到有效音轨或时长，文件可能损坏，请换一个文件。");
          const picture = metadata.common.picture?.find(p => /image\/(jpeg|png|webp)/i.test(p.format) && p.data.byteLength <= 5 * 1024 * 1024);
          const song: SavedSong = { id, title: metadata.common.title?.slice(0,200) || file.name.replace(/\.[^.]+$/, ""),
            artist: metadata.common.artist?.slice(0,200) || "", album: metadata.common.album?.slice(0,200) || "",
            duration: metadata.format.duration ?? 0, file, fileName: file.name,
            cover: picture ? new Blob([new Uint8Array(picture.data)], {type: picture.format}) : undefined,
            genre: metadata.common.genre?.[0]?.slice(0,100) || "", mood: "", addedAt: Date.now() };
          await addSong(song); known.add(id); setSongs(current => [...current, song]);
          messages.push(`${file.name}：已导入${metadata.common.title ? "" : "，歌名使用文件名"}。`);
        } catch (error) { messages.push(`${file.name}：${libraryError(error)}`); }
        setResults([...messages]);
      }
      setMessage("导入处理完成。音乐只保存在当前浏览器。");
    } catch (error) { setMessage(libraryError(error)); }
    finally { setBusy(false); locked.current = false; }
  }
  async function update(song: SavedSong) {
    try { await saveSong(song); setSongs(current => current.map(old => old.id === song.id ? song : old)); setMessage("资料已保存到本地。"); return true; }
    catch (error) { setMessage(libraryError(error)); return false; }
  }
  async function remove(id: string) {
    try { await removeSong(id); setSongs(current => current.filter(song => song.id !== id)); setMessage("已移除曲库副本，设备原文件不受影响。"); return true; }
    catch (error) { setMessage(libraryError(error)); return false; }
  }
  const playlist = useMemo(() => [...demos, ...tracks], [demos, tracks]);
  return { songs, tracks, playlist, ready, busy, message, results, importFiles, update, remove };
}
