"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { libraryError, localAppStateRepository, type LocalAppStateRepository } from "../../adapters/local_data/music-library.ts";
import { DEFAULT_LOCAL_APP_STATE, type AmbientMix, type ListeningScene, type LocalAppState, type PlayerState, type Playlist, type RoomPreferences } from "../../types/local-state.ts";

export function useLocalAppState(repository: LocalAppStateRepository = localAppStateRepository) {
  const [state, setState] = useState<LocalAppState>(DEFAULT_LOCAL_APP_STATE);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const latest = useRef(state);
  useEffect(() => { latest.current = state; }, [state]);
  useEffect(() => {
    let active = true;
    repository.readAppState().then(value => { if (active) { latest.current = value; setState(value); setReady(true); } })
      .catch(error => { if (active) { setMessage(`无法读取播放器状态：${libraryError(error)}`); setReady(true); } });
    return () => { active = false; };
  }, [repository]);

  const update = useCallback((change: (current: LocalAppState) => LocalAppState, successMessage = "") => {
    setState(current => {
      const next = change(current); latest.current = next;
      void repository.saveAppState(next).then(() => { if (successMessage) setMessage(successMessage); })
        .catch(error => setMessage(`未能保存到本地：${libraryError(error)}`));
      return next;
    });
  }, [repository]);

  const savePlayer = useCallback((player: PlayerState) => update(current => ({ ...current, player })), [update]);
  const toggleFavorite = (trackId: string) => update(current => ({ ...current, favoriteTrackIds: current.favoriteTrackIds.includes(trackId) ? current.favoriteTrackIds.filter(id => id !== trackId) : [...current.favoriteTrackIds, trackId] }));
  const savePlaylists = (playlists: readonly Playlist[]) => update(current => ({ ...current, playlists }), "歌单已保存到本地。");
  const saveScenes = (scenes: readonly ListeningScene[]) => update(current => ({ ...current, scenes }), "场景已保存到本地。");
  const setRoom = (room: RoomPreferences) => update(current => ({ ...current, room }));
  const setAmbient = (ambient: AmbientMix) => update(current => ({ ...current, ambient }));
  const removeTrackReferences = (trackId: string) => update(current => ({
    ...current,
    favoriteTrackIds: current.favoriteTrackIds.filter(id => id !== trackId),
    playlists: current.playlists.map(playlist => ({ ...playlist, trackIds: playlist.trackIds.filter(id => id !== trackId) })),
    player: { ...current.player, queue: { ...current.player.queue, trackIds: current.player.queue.trackIds.filter(id => id !== trackId), shuffleOrder: current.player.queue.shuffleOrder.filter(id => id !== trackId) } },
  }));
  const sanitizeTrackReferences = useCallback((availableIds: readonly string[]) => {
    const available = new Set(availableIds);
    update(current => ({
      ...current,
      favoriteTrackIds: current.favoriteTrackIds.filter(id => available.has(id)),
      playlists: current.playlists.map(playlist => ({ ...playlist, trackIds: playlist.trackIds.filter(id => available.has(id)) })),
    }));
  }, [update]);

  return { state, ready, message, setMessage, savePlayer, toggleFavorite, savePlaylists, saveScenes, setRoom, setAmbient, removeTrackReferences, sanitizeTrackReferences, latest };
}
