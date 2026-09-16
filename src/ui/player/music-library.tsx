"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import type { SavedSong } from "../../adapters/local_data/music-library.ts";
import { libraryError } from "../../adapters/local_data/music-library.ts";
import { estimateAudioFeatures } from "../../core/vibe/audio-features.ts";
import { ROOM_NAMES, type RoomType } from "../../core/vibe/room-presets.ts";
import { formatPlaybackTime } from "../../core/player/player-state.ts";
import type { useMusicLibrary } from "./use-music-library.ts";

type Library = ReturnType<typeof useMusicLibrary>;
function SongEditor({ song, library, onClose }: { song: SavedSong; library: Library; onClose: () => void }) {
  const [draft, setDraft] = useState(song);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  async function analyze() {
    if (song.file.size > 30 * 1024 * 1024 || !song.duration || song.duration > 600) { setError("本地估算支持 30 MB 以内、时长已知且不超过 10 分钟的歌曲；仍可正常播放和手动选择氛围。"); return; }
    setAnalyzing(true); setError("");
    try {
      const decoder = new OfflineAudioContext(1, 1, 16000);
      const audio = await decoder.decodeAudioData(await song.file.arrayBuffer());
      const features = estimateAudioFeatures(audio.getChannelData(0), audio.sampleRate);
      setDraft(current => ({...current, features}));
    } catch { setError("当前浏览器无法分析这首歌，可以手动选择情绪与房间。"); }
    finally { setAnalyzing(false); }
  }
  return <form className="song-editor" onSubmit={async event => { event.preventDefault(); if (await library.update({...draft, title: draft.title.trim() || song.title})) onClose(); }}>
    <h3>编辑歌曲资料</h3>
    <div className="editor-fields">
      {([['title','歌名'],['artist','歌手'],['album','专辑'],['genre','曲风']] as const).map(([key,label]) => <label key={key}>{label}<input maxLength={200} value={draft[key]} onChange={event => setDraft({...draft,[key]:event.target.value})} /></label>)}
      <label>情绪<select value={draft.mood} onChange={event => setDraft({...draft,mood:event.target.value})}><option value="">未指定</option>{["温暖","舒缓","梦幻","活力","忧郁"].map(mood => <option key={mood}>{mood}</option>)}</select></label>
      <label>歌曲默认房间<select value={draft.preferredRoom ?? ""} onChange={event => setDraft({...draft,preferredRoom:(event.target.value || undefined) as RoomType | undefined})}><option value="">随标签匹配</option>{Object.entries(ROOM_NAMES).map(([id,name]) => <option key={id} value={id}>{name}</option>)}</select></label>
    </div>
    <div className="audio-analysis"><button type="button" disabled={analyzing} onClick={analyze}>{analyzing ? "正在本地分析…" : "估算节奏与响度"}</button>
      <small>仅在设备内分析最多前 90 秒，不识别情绪或曲风。节奏可能有倍速／半速误差。</small>
      {draft.features && <p>节奏：{draft.features.bpm ? `约 ${draft.features.bpm} BPM` : "未检测到稳定节拍"} · 平均响度：{draft.features.rms > 0 ? `${Math.round(20 * Math.log10(draft.features.rms))} dBFS` : "静音"}（文件幅度参考）</p>}
      {error && <p role="alert">{error}</p>}
    </div>
    <div className="library-row-actions"><button type="submit" disabled={analyzing}>保存资料</button><button type="button" onClick={onClose}>取消</button></div>
  </form>;
}
export function MusicLibrary({ library, onPlay, onRemove }: {library: Library; onPlay: (id:string) => void; onRemove: (id:string) => Promise<void>}) {
  const [open,setOpen] = useState(false);
  const [editing,setEditing] = useState<string | null>(null);
  const [removing,setRemoving] = useState<string | null>(null);
  const [storage,setStorage] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) { dialog.current?.showModal(); navigator.storage?.estimate().then(value => setStorage(`当前网站已用约 ${Math.round((value.usage ?? 0) / 1024 / 1024)} MB`)).catch(() => {}); }
    else dialog.current?.close();
  }, [open]);
  return <>
    <button className="library-open" type="button" onClick={() => setOpen(true)}>我的音乐{library.songs.length ? ` · ${library.songs.length}` : " · 导入"}</button>
    <dialog className="library-dialog" ref={dialog} aria-labelledby="library-title" onCancel={() => setOpen(false)}>
      {open && <>
        <header><div><span className="eyebrow">YOUR LOCAL COLLECTION</span><h2 id="library-title">我的音乐</h2></div><button type="button" aria-label="关闭我的音乐" onClick={() => setOpen(false)}>关闭 ×</button></header>
        <p className="library-privacy">音频只保存在此设备的当前浏览器，不上传。清理网站数据会清空曲库，请保留原始文件。{storage && ` ${storage}。`}</p>
        <div className="import-zone" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); void library.importFiles(Array.from(event.dataTransfer.files)); }}>
          <label className="import-label">{library.busy ? "正在导入，请稍候…" : "选择音乐文件，或拖到这里"}<input type="file" aria-label="导入音乐文件" multiple accept=".mp3,.m4a,.aac,.wav,.flac,.ogg,.opus" disabled={!library.ready || library.busy} onChange={event => { void library.importFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }} /></label>
          <small>MP3 / M4A / AAC / WAV / FLAC / Ogg / Opus · 单首最多 100 MB · 播放支持取决于浏览器</small>
        </div>
        <p role="status" className="library-message">{library.message || (!library.ready ? "正在读取本地曲库…" : "选择一首自己的歌，让房间开始陪你听。")}</p>
        {library.results.length > 0 && <details className="import-results"><summary>本次导入结果（{library.results.length}）</summary><ul>{library.results.map((result,index) => <li key={index}>{result}</li>)}</ul></details>}
        <div className="library-list">
          {library.songs.length === 0 && <p className="library-empty">曲库还是空的。导入后可播放完整歌曲，也可以关闭这里先听演示音乐。</p>}
          {library.songs.map(song => <article className="library-song" key={song.id}>
            <div className="library-song-line"><img src={library.tracks.find(track => track.id === song.id)?.coverUrl ?? "/assets/local-cover.svg"} alt=""/><div className="library-song-copy"><strong>{song.title}</strong><small>{song.artist || "未知歌手"} · {formatPlaybackTime(song.duration)}{song.mood && ` · ${song.mood}`}</small></div>
              <div className="library-row-actions"><button type="button" aria-label={`播放本地歌曲 ${song.title}`} onClick={() => { onPlay(song.id); setOpen(false); }}>播放</button><button type="button" disabled={library.busy} onClick={() => {setEditing(editing === song.id ? null : song.id); setRemoving(null);}}>编辑</button><button type="button" disabled={library.busy} onClick={() => {setRemoving(song.id);setEditing(null);}}>移除</button></div>
            </div>
            {editing === song.id && <SongEditor song={song} library={library} onClose={() => setEditing(null)} />}
            {removing === song.id && <div className="remove-confirm"><p>移除“{song.title}”的本地曲库副本？设备原文件不会删除。</p><button type="button" onClick={async () => { try { await onRemove(song.id); setRemoving(null); } catch(error) { console.error(libraryError(error)); } }}>确认移除副本</button><button type="button" onClick={() => setRemoving(null)}>保留</button></div>}
          </article>)}
        </div>
      </>}
    </dialog>
  </>;
}
