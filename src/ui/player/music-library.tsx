"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState } from "react";
import type { SavedSong } from "../../adapters/local_data/music-library.ts";
import { libraryError } from "../../adapters/local_data/music-library.ts";
import { estimateAudioFeatures } from "../../core/vibe/audio-features.ts";
import { ROOM_NAMES, suggestedRoom, type RoomType } from "../../core/vibe/room-presets.ts";
import { formatPlaybackTime } from "../../core/player/player-state.ts";
import type { Playlist } from "../../types/local-state.ts";
import type { useMusicLibrary } from "./use-music-library.ts";

type Library = ReturnType<typeof useMusicLibrary>;
interface MusicLibraryProps {
  library: Library;
  favoriteIds: readonly string[];
  playlists: readonly Playlist[];
  onToggleFavorite: (id: string) => void;
  onSavePlaylists: (playlists: readonly Playlist[]) => void;
  onPlay: (id: string, collectionIds?: readonly string[]) => void;
  onAddNext: (id: string) => void;
  onAddQueue: (id: string) => void;
  onRemove: (id: string) => Promise<void>;
}

function SongEditor({ song, library, onClose }: { song: SavedSong; library: Library; onClose: () => void }) {
  const [draft, setDraft] = useState(song); const [analyzing, setAnalyzing] = useState(false); const [error, setError] = useState("");
  async function analyze() {
    if (song.file.size > 30 * 1024 * 1024 || !song.duration || song.duration > 600) { setError("本地估算支持 30 MB 以内、时长已知且不超过 10 分钟的歌曲；仍可正常播放和手动选择氛围。"); return; }
    setAnalyzing(true); setError("");
    try { const decoder = new OfflineAudioContext(1, 1, 16000); const audio = await decoder.decodeAudioData(await song.file.arrayBuffer()); setDraft(current => ({ ...current, features: estimateAudioFeatures(audio.getChannelData(0), audio.sampleRate) })); }
    catch { setError("当前浏览器无法分析这首歌，可以手动选择情绪与房间。"); }
    finally { setAnalyzing(false); }
  }
  return <form className="song-editor" onSubmit={async event => { event.preventDefault(); if (await library.update({ ...draft, title: draft.title.trim() || song.title })) onClose(); }}>
    <h3>编辑歌曲资料</h3><div className="editor-fields">
      {([['title','歌名'],['artist','歌手'],['album','专辑'],['genre','曲风']] as const).map(([key,label]) => <label key={key}>{label}<input maxLength={200} value={draft[key]} onChange={event => setDraft({ ...draft, [key]: event.target.value })} /></label>)}
      <label>情绪<select value={draft.mood} onChange={event => setDraft({ ...draft, mood: event.target.value })}><option value="">未指定</option>{["温暖","舒缓","梦幻","活力","忧郁"].map(mood => <option key={mood}>{mood}</option>)}</select></label>
      <label>歌曲默认房间<select value={draft.preferredRoom ?? ""} onChange={event => setDraft({ ...draft, preferredRoom: (event.target.value || undefined) as RoomType | undefined })}><option value="">随标签匹配</option>{Object.entries(ROOM_NAMES).map(([id,name]) => <option key={id} value={id}>{name}</option>)}</select></label>
    </div><div className="audio-analysis"><button type="button" disabled={analyzing} onClick={analyze}>{analyzing ? "正在本地分析…" : "估算节奏与响度"}</button><small>仅在设备内分析，不识别情绪或曲风。</small>{error && <p role="alert">{error}</p>}</div>
    <div className="library-row-actions"><button type="submit" disabled={analyzing}>保存资料</button><button type="button" onClick={onClose}>取消</button></div>
  </form>;
}

export function MusicLibrary({ library, favoriteIds, playlists, onToggleFavorite, onSavePlaylists, onPlay, onAddNext, onAddQueue, onRemove }: MusicLibraryProps) {
  const [open,setOpen] = useState(false); const [editing,setEditing] = useState<string | null>(null); const [removing,setRemoving] = useState<string | null>(null); const [storage,setStorage] = useState("");
  const [query,setQuery] = useState(""); const [room,setRoom] = useState<RoomType | "all">("all"); const [mood,setMood] = useState("all"); const [favoritesOnly,setFavoritesOnly] = useState(false); const [newPlaylist,setNewPlaylist] = useState(""); const [selectedPlaylistId,setSelectedPlaylistId] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (open) { dialog.current?.showModal(); navigator.storage?.estimate().then(value => setStorage(`当前网站已用约 ${Math.round((value.usage ?? 0) / 1024 / 1024)} MB`)).catch(() => {}); } else dialog.current?.close(); }, [open]);
  const normalized = query.trim().toLocaleLowerCase();
  const visibleSongs = useMemo(() => [...library.songs].filter(song => {
    const track = library.tracks.find(item => item.id === song.id); if (!track) return false;
    return (!normalized || `${song.title} ${song.artist}`.toLocaleLowerCase().includes(normalized)) && (room === "all" || suggestedRoom(track) === room) && (mood === "all" || song.mood === mood) && (!favoritesOnly || favoriteIds.includes(song.id));
  }).sort((a,b) => b.addedAt - a.addedAt), [library.songs, library.tracks, normalized, room, mood, favoritesOnly, favoriteIds]);
  const visibleIds = visibleSongs.map(song => song.id);
  const selectedPlaylist = playlists.find(item => item.id === selectedPlaylistId) ?? playlists[0];
  const clearFilters = () => { setQuery(""); setRoom("all"); setMood("all"); setFavoritesOnly(false); };
  function updatePlaylist(next: Playlist) { onSavePlaylists(playlists.map(item => item.id === next.id ? next : item)); }
  function createPlaylist() { const name = newPlaylist.trim(); if (!name) return; const now = Date.now(); const item: Playlist = { id: crypto.randomUUID(), name: name.slice(0,80), trackIds: [], createdAt: now, updatedAt: now }; onSavePlaylists([...playlists,item]); setSelectedPlaylistId(item.id); setNewPlaylist(""); }
  function addToPlaylist(trackId: string) { if (!selectedPlaylist || selectedPlaylist.trackIds.includes(trackId)) return; updatePlaylist({ ...selectedPlaylist, trackIds: [...selectedPlaylist.trackIds,trackId], updatedAt: Date.now() }); }
  function movePlaylistTrack(index: number, direction: -1 | 1, updatedAt: number) { if (!selectedPlaylist) return; const target=index+direction; if (target<0 || target>=selectedPlaylist.trackIds.length) return; const ids=[...selectedPlaylist.trackIds]; [ids[index],ids[target]]=[ids[target],ids[index]]; updatePlaylist({ ...selectedPlaylist, trackIds:ids, updatedAt }); }
  return <>
    <button className="library-open" type="button" onClick={() => setOpen(true)}>我的音乐{library.songs.length ? ` · ${library.songs.length}` : " · 导入"}</button>
    <dialog className="library-dialog" ref={dialog} aria-labelledby="library-title" onCancel={() => setOpen(false)}>{open && <>
      <header><div><span className="eyebrow">YOUR LOCAL COLLECTION</span><h2 id="library-title">我的音乐</h2></div><button type="button" aria-label="关闭我的音乐" onClick={() => setOpen(false)}>关闭 ×</button></header>
      <p className="library-privacy">音频只保存在此设备的当前浏览器，不上传。清理网站数据会清空曲库，请保留原始文件。{storage && ` ${storage}。`}</p>
      <div className="import-zone" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); void library.importFiles(Array.from(event.dataTransfer.files)); }}><label className="import-label">{library.busy ? "正在导入，请稍候…" : "选择音乐文件，或拖到这里"}<input type="file" aria-label="导入音乐文件" multiple accept=".mp3,.m4a,.aac,.wav,.flac,.ogg,.opus" disabled={!library.ready || library.busy} onChange={event => { void library.importFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }} /></label><small>MP3 / M4A / AAC / WAV / FLAC / Ogg / Opus · 单首最多 100 MB</small></div>
      <p role="status" className="library-message">{library.message || (!library.ready ? "正在读取本地曲库…" : "选择一首自己的歌，让房间开始陪你听。")}</p>
      {library.results.length > 0 && <details className="import-results"><summary>本次导入结果（{library.results.length}）</summary><ul>{library.results.map((result,index) => <li key={index}>{result}</li>)}</ul></details>}
      <section className="library-tools" aria-label="搜索和筛选"><input type="search" value={query} placeholder="搜索歌名或歌手" aria-label="搜索歌名或歌手" onChange={event=>setQuery(event.target.value)} onKeyDown={event=>event.stopPropagation()} /><select value={room} aria-label="按房间筛选" onChange={event=>setRoom(event.target.value as RoomType | "all")}><option value="all">全部房间</option>{Object.entries(ROOM_NAMES).map(([id,name])=><option value={id} key={id}>{name}</option>)}</select><select value={mood} aria-label="按情绪筛选" onChange={event=>setMood(event.target.value)}><option value="all">全部情绪</option>{["温暖","舒缓","梦幻","活力","忧郁"].map(value=><option key={value}>{value}</option>)}</select><button type="button" aria-pressed={favoritesOnly} onClick={()=>setFavoritesOnly(value=>!value)}>只看收藏</button><button type="button" onClick={clearFilters}>清除条件</button></section>
      <section className="playlist-manager" aria-label="我的歌单"><div className="section-heading"><h3>我的歌单</h3><span>LOCAL</span></div><div className="playlist-create"><input value={newPlaylist} maxLength={80} placeholder="新歌单名称" aria-label="新歌单名称" onChange={event=>setNewPlaylist(event.target.value)} /><button type="button" onClick={createPlaylist}>新建</button></div>
        {playlists.length>0 && <><div className="playlist-edit"><select value={selectedPlaylist?.id ?? ""} aria-label="选择歌单" onChange={event=>setSelectedPlaylistId(event.target.value)}>{playlists.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}</select>{selectedPlaylist && <><input value={selectedPlaylist.name} aria-label="歌单名称" onChange={event=>updatePlaylist({ ...selectedPlaylist,name:event.target.value.slice(0,80),updatedAt:Date.now() })} /><button type="button" onClick={()=>onPlay(selectedPlaylist.trackIds[0] ?? "",selectedPlaylist.trackIds)} disabled={!selectedPlaylist.trackIds.length}>播放歌单</button><button type="button" onClick={()=>{onSavePlaylists(playlists.filter(item=>item.id!==selectedPlaylist.id));setSelectedPlaylistId("");}}>删除歌单</button></>}</div>
        {selectedPlaylist && <div className="playlist-tracks">{selectedPlaylist.trackIds.map((id,index)=>{const track=library.playlist.find(item=>item.id===id);return <div key={id}><span>{track ? `${track.title} · ${track.artist}` : "歌曲已从曲库移除"}</span><button type="button" disabled={index===0} onClick={()=>movePlaylistTrack(index,-1,Date.now())}>上移</button><button type="button" disabled={index===selectedPlaylist.trackIds.length-1} onClick={()=>movePlaylistTrack(index,1,Date.now())}>下移</button><button type="button" onClick={()=>updatePlaylist({ ...selectedPlaylist,trackIds:selectedPlaylist.trackIds.filter(value=>value!==id),updatedAt:Date.now() })}>移除</button></div>})}</div>}</>}
      </section>
      <div className="library-list">{visibleSongs.length === 0 && <p className="library-empty">{library.songs.length ? "没有符合条件的歌曲。条件会保留，点击“清除条件”可查看全部。" : "曲库还是空的。导入后可播放完整歌曲，也可以关闭这里先听演示音乐。"}</p>}
        {visibleSongs.map(song => <article className="library-song" key={song.id}><div className="library-song-line"><img src={library.tracks.find(track => track.id === song.id)?.coverUrl ?? "/assets/local-cover.svg"} alt=""/><div className="library-song-copy"><strong>{song.title}</strong><small>{song.artist || "未知歌手"} · {formatPlaybackTime(song.duration)}{song.mood && ` · ${song.mood}`}</small></div><div className="library-row-actions"><button type="button" aria-label={`播放本地歌曲 ${song.title}`} onClick={() => { onPlay(song.id,visibleIds); setOpen(false); }}>播放</button><button type="button" onClick={()=>onAddNext(song.id)}>下一首</button><button type="button" onClick={()=>onAddQueue(song.id)}>队尾</button><button type="button" aria-pressed={favoriteIds.includes(song.id)} onClick={()=>onToggleFavorite(song.id)}>{favoriteIds.includes(song.id)?"已收藏":"收藏"}</button>{selectedPlaylist&&<button type="button" onClick={()=>addToPlaylist(song.id)}>加入歌单</button>}<button type="button" disabled={library.busy} onClick={() => {setEditing(editing === song.id ? null : song.id); setRemoving(null);}}>编辑</button><button type="button" disabled={library.busy} onClick={() => {setRemoving(song.id);setEditing(null);}}>移除</button></div></div>
          {editing === song.id && <SongEditor song={song} library={library} onClose={() => setEditing(null)} />}{removing === song.id && <div className="remove-confirm"><p>移除“{song.title}”的本地曲库副本？设备原文件不会删除。</p><button type="button" onClick={async () => { try { await onRemove(song.id); setRemoving(null); } catch(error) { console.error(libraryError(error)); } }}>确认移除副本</button><button type="button" onClick={() => setRemoving(null)}>保留</button></div>}
        </article>)}</div>
    </>}</dialog>
  </>;
}
