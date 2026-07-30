"use client";

import { buildDiscovery } from "../../services/discovery/build-discovery.ts";
import type { Recommendation } from "../../types/recommendation.ts";
import type { Track } from "../../types/track.ts";
import { useLaterQueue } from "./use-later-queue.ts";
import { useLocalAudio } from "./use-local-audio.ts";

export type { LocalAudioController } from "./use-local-audio.ts";
export type { LaterQueueController } from "./use-later-queue.ts";

export function usePlayerView(
  playlist: readonly Track[],
  recommendations: readonly Recommendation[],
) {
  const [audioRef, player] = useLocalAudio(playlist);
  const later = useLaterQueue(playlist);
  const displayTrack = player.audioTrack;
  const discovery = buildDiscovery({
    currentTrackId: displayTrack.id,
    tracks: playlist,
    recommendations,
  });

  return { audioRef, player, later, displayTrack, discovery };
}
