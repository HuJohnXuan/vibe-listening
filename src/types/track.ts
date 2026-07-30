export interface TrackTags {
  readonly genres: readonly string[];
  readonly moods: readonly string[];
  readonly voices: readonly string[];
  readonly production: readonly string[];
}

export interface Track {
  readonly id: string;
  readonly title: string;
  readonly artist: string;
  readonly album: string;
  readonly coverUrl: string;
  readonly previewAudioUrl: string;
  readonly previewDurationSeconds: number;
  readonly lyricsExcerpt: string;
  readonly tags: TrackTags;
  readonly listeningNote: string;
}
