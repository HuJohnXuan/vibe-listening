export function getNextTrackIndex(
  currentIndex: number,
  trackCount: number,
): number {
  if (trackCount <= 0) {
    return 0;
  }

  return (currentIndex + 1) % trackCount;
}

export function getPreviousTrackIndex(
  currentIndex: number,
  trackCount: number,
): number {
  if (trackCount <= 0) {
    return 0;
  }

  return (currentIndex - 1 + trackCount) % trackCount;
}

/** Returns the matching playlist index, or -1 when the track is unavailable. */
export function getTrackIndexById(
  tracks: readonly { readonly id: string }[],
  trackId: string,
): number {
  return tracks.findIndex((track) => track.id === trackId);
}

export function formatPlaybackTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const wholeSeconds = Math.floor(seconds);
  const minutes = Math.floor(wholeSeconds / 60);
  const remainingSeconds = String(wholeSeconds % 60).padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}
