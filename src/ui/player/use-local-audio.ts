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
  const audioTrack = playlist[trackIndex];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.load();
    setElapsedSeconds(0);
    setDurationSeconds(0);
    setPlaybackError("");
    if (resumeAfterChangeRef.current) {
      void audio.play().catch(() => setPlaybackError(PLAYBACK_ERROR));
    }
  }, [audioTrack.previewAudioUrl]);

  function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play().catch(() => setPlaybackError(PLAYBACK_ERROR));
    } else {
      audio.pause();
    }
  }

  function selectTrack(nextIndex: number) {
    resumeAfterChangeRef.current = isPlaying;
    setTrackIndex(nextIndex);
  }

  function playTrack(trackId: string) {
    const nextIndex = getTrackIndexById(playlist, trackId);
    if (nextIndex < 0) return;
    resumeAfterChangeRef.current = true;
    setTrackIndex(nextIndex);
  }

  function seek(nextSeconds: number) {
    if (!audioRef.current) return;
    audioRef.current.currentTime = nextSeconds;
    setElapsedSeconds(nextSeconds);
  }

  const controller: LocalAudioController = {
    audioTrack, elapsedSeconds, durationSeconds, isPlaying,
    playbackError, togglePlayback, seek,
    playPrevious: () => selectTrack(getPreviousTrackIndex(trackIndex, playlist.length)),
    playNext: () => selectTrack(getNextTrackIndex(trackIndex, playlist.length)),
    playTrack,
    syncElapsed: () => setElapsedSeconds(audioRef.current?.currentTime ?? 0),
    syncDuration: () => setDurationSeconds(audioRef.current?.duration ?? 0),
    markPlaying: () => setIsPlaying(true),
    markPaused: () => setIsPlaying(false),
  };

  return [audioRef, controller] as const;
}
