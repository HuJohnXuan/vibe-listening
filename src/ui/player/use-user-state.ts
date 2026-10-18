"use client";

import { useEffect, useRef, useState } from "react";
import {
  createUnavailableUserStateClient,
  createUserStateClient,
} from "../../adapters/user_state_api/user-state-client.ts";
import { resolveLaterTracks } from "../../core/later/later-queue.ts";
import { getOrCreateDeviceId } from "../../services/user_state/device-identity.ts";
import {
  UserStateSynchronizer,
  type UserStateSyncSnapshot,
} from "../../services/user_state/user-state-synchronizer.ts";
import type { Track } from "../../types/track.ts";
import type { UserPreferences, UserState } from "../../types/user-state.ts";

const EMPTY_STATE: UserState = {
  favorites: [], later: [], playbackHistory: [],
  preferences: { theme: "default", displayOptions: {}, musicTags: [] },
};

export function useUserState(playlist: readonly Track[]) {
  const synchronizerRef = useRef<UserStateSynchronizer | null>(null);
  const [snapshot, setSnapshot] = useState<UserStateSyncSnapshot>({
    state: EMPTY_STATE,
    syncError: "",
  });

  useEffect(() => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
    const deviceId = getOrCreateDeviceId(localStorage, () => crypto.randomUUID());
    const client = apiBaseUrl
      ? createUserStateClient({ apiBaseUrl, deviceId, fetcher: fetch })
      : createUnavailableUserStateClient();
    const synchronizer = new UserStateSynchronizer(client);
    synchronizerRef.current = synchronizer;
    const unsubscribe = synchronizer.subscribe(setSnapshot);
    void synchronizer.hydrate();
    return () => {
      unsubscribe();
      synchronizerRef.current = null;
    };
  }, []);

  const { state, syncError } = snapshot;
  return {
    favorites: {
      hasTrack: (trackId: string) => state.favorites.includes(trackId),
      toggleTrack: (trackId: string) => synchronizerRef.current?.toggleFavorite(trackId),
    },
    later: {
      trackIds: state.later,
      tracks: resolveLaterTracks(state.later, playlist),
      addTrack: (trackId: string) => synchronizerRef.current?.addLaterTrack(trackId),
      removeTrack: (trackId: string) => synchronizerRef.current?.removeLaterTrack(trackId),
      hasTrack: (trackId: string) => state.later.includes(trackId),
    },
    playbackHistory: state.playbackHistory,
    recordPlaybackStart: (trackId: string) => {
      synchronizerRef.current?.recordPlaybackStart(trackId);
    },
    preferences: {
      value: state.preferences,
      replace: (preferences: UserPreferences) => {
        synchronizerRef.current?.replacePreferences(preferences);
      },
    },
    syncError,
  };
}
