"use client";

import { useEffect, useRef, useState } from "react";
import {
  getNextTrackIndex,
  getPreviousTrackIndex,
  getTrackIndexById,
} from "../../core/player/player-state.ts";
import type { Track } from "../../types/track.ts";

const PLAYBACK_ERROR = "当前试听音频无法播放，请重试。";

export interface LocalAudioController {
  readonly audioTrack: Track;
  readonly elapsedSeconds: number;
  readonly durationSeconds: number;
  readonly isPlaying: boolean;
  readonly playbackError: string;
  readonly volume: number;
  readonly setVolume: (value: number) => void;
  readonly markError: () => void;
  readonly togglePlayback: () => void;
  readonly seek: (nextSeconds: number) => void;
  readonly playPrevious: () => void;
  readonly playNext: () => void;
  readonly playTrack: (trackId: string) => void;
  readonly syncElapsed: () => void;
  readonly syncDuration: () => void;
  readonly markPlaying: () => void;
  readonly markPaused: () => void;
}

export function useLocalAudio(playlist: readonly Track[]) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const resumeAfterChangeRef = useRef(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackError, setPlaybackError] = useState("");
  const [volume, setVolumeState] = useState(1);
  const audioTrack = playlist[trackIndex];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.load();
    setElapsedSeconds(0);
    setDurationSeconds(0);
    setPlaybackError("");
    if (resumeAfterChangeRef.current) {
      const source = audio.src;
      void audio.play().catch((error: unknown) => {
        if (audio.src === source && !(error instanceof DOMException && error.name === "AbortError")) {
          setPlaybackError(PLAYBACK_ERROR);
        }
      });
    }
  }, [audioTrack.previewAudioUrl]);

  function startPlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    setPlaybackError("");
    if (audio.ended) audio.currentTime = 0;
    const source = audio.src;
    void audio.play().catch((error: unknown) => {
      if (audio.src === source && !(error instanceof DOMException && error.name === "AbortError")) {
        setPlaybackError(PLAYBACK_ERROR);
      }
    });
  }

  function togglePlayback() {
    if (audioRef.current?.paused) startPlayback();
    else audioRef.current?.pause();
  }

  function selectTrack(nextIndex: number) {
    resumeAfterChangeRef.current = isPlaying;
    setTrackIndex(nextIndex);
  }

  function playTrack(trackId: string) {
    const nextIndex = getTrackIndexById(playlist, trackId);
    if (nextIndex < 0) return;
    if (nextIndex === trackIndex) {
      startPlayback();
      return;
    }
    resumeAfterChangeRef.current = true;
    setTrackIndex(nextIndex);
  }

  function seek(nextSeconds: number) {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(nextSeconds) || !Number.isFinite(audio.duration)) return;
    const target = Math.max(0, Math.min(nextSeconds, audio.duration));
    audio.currentTime = target;
    setElapsedSeconds(target);
  }

  const controller: LocalAudioController = {
    audioTrack, elapsedSeconds, durationSeconds, isPlaying,
    playbackError, togglePlayback, seek,
    volume,
    setVolume: (value) => {
      if (!Number.isFinite(value)) return;
      const next = Math.max(0, Math.min(1, value));
      if (audioRef.current) audioRef.current.volume = next;
      setVolumeState(next);
    },
    markError: () => { setIsPlaying(false); setPlaybackError(PLAYBACK_ERROR); },
    playPrevious: () => selectTrack(getPreviousTrackIndex(trackIndex, playlist.length)),
    playNext: () => selectTrack(getNextTrackIndex(trackIndex, playlist.length)),
    playTrack,
    syncElapsed: () => setElapsedSeconds(audioRef.current?.currentTime ?? 0),
    syncDuration: () => {
      const duration = audioRef.current?.duration ?? 0;
      setDurationSeconds(Number.isFinite(duration) ? duration : 0);
    },
    markPlaying: () => { setIsPlaying(true); setPlaybackError(""); },
    markPaused: () => setIsPlaying(false),
  };

  return [audioRef, controller] as const;
}
