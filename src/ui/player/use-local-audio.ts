"use client";

import { useEffect, useRef, useState } from "react";
import { appendTrack, createQueue, currentQueueId, moveTrack, playNext as insertNext, playNow, queueOrder, removeTrack, sanitizeQueue, setPlaybackMode, stepQueue } from "../../core/player/playback-queue.ts";
import type { PlaybackMode, PlayerState, QueueState } from "../../types/local-state.ts";
import type { Track } from "../../types/track.ts";

const PLAYBACK_ERROR = "当前音频无法播放，已停止自动跳转。";

export interface LocalAudioController {
  readonly audioTrack: Track;
  readonly elapsedSeconds: number;
  readonly durationSeconds: number;
  readonly isPlaying: boolean;
  readonly playbackError: string;
  readonly volume: number;
  readonly queue: QueueState;
  readonly queueTracks: readonly Track[];
  readonly mode: PlaybackMode;
  readonly setVolume: (value: number) => void;
  readonly togglePlayback: () => void;
  readonly seek: (nextSeconds: number) => void;
  readonly playPrevious: () => void;
  readonly playNext: () => void;
  readonly playTrack: (trackId: string, collectionIds?: readonly string[]) => void;
  readonly addNext: (trackId: string) => void;
  readonly addToQueue: (trackId: string) => void;
  readonly removeFromQueue: (trackId: string) => void;
  readonly moveInQueue: (from: number, to: number) => void;
  readonly hasInQueue: (trackId: string) => boolean;
  readonly setMode: (mode: PlaybackMode) => void;
  readonly syncElapsed: () => void;
  readonly syncDuration: () => void;
  readonly markPlaying: () => void;
  readonly markPaused: () => void;
  readonly handleEnded: () => void;
  readonly handleError: () => void;
  readonly snapshot: () => PlayerState;
}

export function useLocalAudio(playlist: readonly Track[], restored: PlayerState | null, restoreReady: boolean) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const resumeAfterChangeRef = useRef(false);
  const restoredRef = useRef(false);
  const pendingSeekRef = useRef(0);
  const failedRef = useRef(new Set<string>());
  const [queue, setQueue] = useState<QueueState>(() => createQueue(playlist[0] ? [playlist[0].id] : []));
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackError, setPlaybackError] = useState("");
  const [volume, setVolumeState] = useState(1);
  const availableIds = playlist.map(track => track.id);
  const selectedId = currentQueueId(queue);
  const audioTrack = playlist.find(track => track.id === selectedId) ?? playlist[0];

  useEffect(() => {
    if (!restoreReady || restoredRef.current || !playlist.length) return;
    restoredRef.current = true;
    const fallback = playlist[0] ? [playlist[0].id] : [];
    const restoredQueue = restored ? sanitizeQueue(restored.queue, availableIds) : createQueue(fallback);
    setQueue(restoredQueue.trackIds.length ? restoredQueue : createQueue(fallback));
    pendingSeekRef.current = Math.max(0, restored?.elapsedSeconds ?? 0);
    const nextVolume = Math.max(0, Math.min(1, restored?.volume ?? 1));
    setVolumeState(nextVolume);
    if (audioRef.current) audioRef.current.volume = nextVolume;
  // Restore only once after both stores are ready.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restoreReady, playlist.length]);

  useEffect(() => {
    if (!restoredRef.current) return;
    setQueue(current => {
      const cleaned = sanitizeQueue(current, availableIds);
      return cleaned.trackIds.length ? cleaned : createQueue(playlist[0] ? [playlist[0].id] : []);
    });
  // Catalog edits must preserve the current stable id.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableIds.join("|")]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioTrack) return;
    audio.load(); setElapsedSeconds(0); setDurationSeconds(0); setPlaybackError("");
    if (resumeAfterChangeRef.current) {
      const source = audio.src;
      void audio.play().catch((error: unknown) => {
        if (audio.src === source && !(error instanceof DOMException && error.name === "AbortError")) setPlaybackError(PLAYBACK_ERROR);
      });
    }
  }, [audioTrack]);

  function startPlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    setPlaybackError(""); failedRef.current.clear();
    if (audio.ended) audio.currentTime = 0;
    const source = audio.src;
    void audio.play().catch((error: unknown) => {
      if (audio.src === source && !(error instanceof DOMException && error.name === "AbortError")) setPlaybackError(PLAYBACK_ERROR);
    });
  }

  function transition(direction: 1 | -1, ended = false) {
    const result = stepQueue(queue, direction, ended);
    if (result.replay) { if (audioRef.current) audioRef.current.currentTime = 0; startPlayback(); return; }
    if (result.stopped) { resumeAfterChangeRef.current = false; audioRef.current?.pause(); setIsPlaying(false); return; }
    resumeAfterChangeRef.current = isPlaying || ended; pendingSeekRef.current = 0; setQueue(result.queue);
  }

  function selectTrack(trackId: string, collectionIds?: readonly string[]) {
    if (!playlist.some(track => track.id === trackId)) return;
    resumeAfterChangeRef.current = true; pendingSeekRef.current = 0; failedRef.current.clear();
    setQueue(current => collectionIds ? createQueue(collectionIds.filter(id => availableIds.includes(id)), trackId) : playNow(current, trackId));
    if (trackId === audioTrack.id) startPlayback();
  }

  const controller: LocalAudioController = {
    audioTrack, elapsedSeconds, durationSeconds, isPlaying, playbackError, volume, queue,
    queueTracks: queueOrder(queue).slice(queue.currentIndex + 1).map(id => playlist.find(track => track.id === id)).filter((track): track is Track => Boolean(track)),
    mode: queue.mode,
    setVolume(value) { if (!Number.isFinite(value)) return; const next = Math.max(0, Math.min(1, value)); if (audioRef.current) audioRef.current.volume = next; setVolumeState(next); },
    togglePlayback() { if (audioRef.current?.paused) startPlayback(); else audioRef.current?.pause(); },
    seek(nextSeconds) { const audio = audioRef.current; if (!audio || !Number.isFinite(nextSeconds) || !Number.isFinite(audio.duration)) return; const target = Math.max(0, Math.min(nextSeconds, audio.duration)); audio.currentTime = target; setElapsedSeconds(target); },
    playPrevious: () => transition(-1), playNext: () => transition(1), playTrack: selectTrack,
    addNext: trackId => setQueue(current => insertNext(current, trackId)),
    addToQueue: trackId => setQueue(current => appendTrack(current, trackId)),
    removeFromQueue: trackId => setQueue(current => removeTrack(current, trackId)),
    moveInQueue: (from, to) => setQueue(current => moveTrack(current, current.currentIndex + 1 + from, current.currentIndex + 1 + to)),
    hasInQueue: trackId => queue.trackIds.includes(trackId),
    setMode: mode => setQueue(current => setPlaybackMode(current, mode)),
    syncElapsed: () => setElapsedSeconds(audioRef.current?.currentTime ?? 0),
    syncDuration: () => { const audio = audioRef.current; const duration = audio?.duration ?? 0; setDurationSeconds(Number.isFinite(duration) ? duration : 0); if (audio && pendingSeekRef.current > 0 && Number.isFinite(duration)) { audio.currentTime = Math.min(pendingSeekRef.current, Math.max(0, duration - 0.1)); setElapsedSeconds(audio.currentTime); pendingSeekRef.current = 0; } },
    markPlaying: () => { setIsPlaying(true); setPlaybackError(""); }, markPaused: () => setIsPlaying(false),
    handleEnded: () => transition(1, true),
    handleError: () => { const id = audioTrack?.id; if (!id) return; failedRef.current.add(id); if (failedRef.current.size < queueOrder(queue).length) transition(1, true); else { setIsPlaying(false); setPlaybackError(PLAYBACK_ERROR); resumeAfterChangeRef.current = false; } },
    snapshot: () => ({ schemaVersion: 1, queue, currentTrackId: audioTrack?.id ?? null, elapsedSeconds, volume }),
  };
  return [audioRef, controller] as const;
}
