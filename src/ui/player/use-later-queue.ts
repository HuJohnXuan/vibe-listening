"use client";

import { useState } from "react";
import {
  addTrackToLater,
  hasTrackInLater,
  removeTrackFromLater,
  resolveLaterTracks,
} from "../../core/later/later-queue.ts";
import type { Track } from "../../types/track.ts";

export interface LaterQueueController {
  readonly trackIds: readonly string[];
  readonly tracks: readonly Track[];
  readonly addTrack: (trackId: string) => void;
  readonly removeTrack: (trackId: string) => void;
  readonly hasTrack: (trackId: string) => boolean;
}

export function useLaterQueue(playlist: readonly Track[]): LaterQueueController {
  const [trackIds, setTrackIds] = useState<readonly string[]>([]);

  return {
    trackIds,
    tracks: resolveLaterTracks(trackIds, playlist),
    addTrack: (trackId) => {
      setTrackIds((currentTrackIds) =>
        addTrackToLater(currentTrackIds, trackId)
      );
    },
    removeTrack: (trackId) => {
      setTrackIds((currentTrackIds) =>
        removeTrackFromLater(currentTrackIds, trackId)
      );
    },
    hasTrack: (trackId) => hasTrackInLater(trackIds, trackId),
  };
}
