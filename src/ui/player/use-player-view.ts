"use client";

import { buildDiscovery } from "../../services/discovery/build-discovery.ts";
import type { Recommendation } from "../../types/recommendation.ts";
import type { Track } from "../../types/track.ts";
import { useLocalAudio } from "./use-local-audio.ts";
import { useUserState } from "./use-user-state.ts";

export type { LocalAudioController } from "./use-local-audio.ts";
export type { LaterQueueController } from "./use-later-queue.ts";

export function usePlayerView(
  playlist: readonly Track[],
  recommendations: readonly Recommendation[],
) {
  const userState = useUserState(playlist);
  const [audioRef, player] = useLocalAudio(playlist, userState.recordPlaybackStart);
  const later = userState.later;
  const displayTrack = player.audioTrack;
  const discovery = buildDiscovery({
    currentTrackId: displayTrack.id,
    tracks: playlist,
    recommendations,
  });

  return {
    audioRef, player, later, displayTrack, discovery,
    favorites: userState.favorites,
    playbackHistory: userState.playbackHistory,
    preferences: userState.preferences,
    syncError: userState.syncError,
  };
}
