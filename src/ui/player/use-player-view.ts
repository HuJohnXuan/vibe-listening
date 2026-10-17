"use client";

import { buildDiscovery } from "../../services/discovery/build-discovery.ts";
import type { Recommendation } from "../../types/recommendation.ts";
import type { Track } from "../../types/track.ts";
import { useLocalAudio } from "./use-local-audio.ts";
import type { PlayerState } from "../../types/local-state.ts";

export type { LocalAudioController } from "./use-local-audio.ts";

export function usePlayerView(
  playlist: readonly Track[],
  recommendations: readonly Recommendation[],
  restored: PlayerState | null,
  restoreReady: boolean,
) {
  const [audioRef, player] = useLocalAudio(playlist, restored, restoreReady);
  const displayTrack = player.audioTrack;
  const discovery = buildDiscovery({
    currentTrackId: displayTrack.id,
    tracks: playlist,
    recommendations,
  });

  return { audioRef, player, displayTrack, discovery };
}
