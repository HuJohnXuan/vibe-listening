/** Adds a track ID once while preserving the queue's insertion order. */
export function addTrackToLater(
  trackIds: readonly string[],
  trackId: string,
): readonly string[] {
  return trackIds.includes(trackId) ? trackIds : [...trackIds, trackId];
}

/** Reports whether a track ID is already saved for later. */
export function hasTrackInLater(
  trackIds: readonly string[],
  trackId: string,
): boolean {
  return trackIds.includes(trackId);
}

/** Removes a selected track ID without changing the remaining order. */
export function removeTrackFromLater(
  trackIds: readonly string[],
  trackId: string,
): readonly string[] {
  return trackIds.filter((queuedTrackId) => queuedTrackId !== trackId);
}

/** Resolves queued IDs to available tracks while preserving queue order. */
export function resolveLaterTracks<T extends { readonly id: string }>(
  trackIds: readonly string[],
  tracks: readonly T[],
): readonly T[] {
  const trackById = new Map(tracks.map((track) => [track.id, track]));
  return trackIds.flatMap((trackId) => {
    const track = trackById.get(trackId);
    return track ? [track] : [];
  });
}
