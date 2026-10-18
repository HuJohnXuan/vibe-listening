export type PreferenceValue = boolean | number | string | null;

export interface UserPreferences {
  readonly theme: string;
  readonly displayOptions: Readonly<Record<string, PreferenceValue>>;
  readonly musicTags: readonly string[];
}

export interface PlaybackHistoryEntry {
  readonly trackId: string;
  readonly startedAt: string;
}

export interface UserState {
  readonly favorites: readonly string[];
  readonly later: readonly string[];
  readonly playbackHistory: readonly PlaybackHistoryEntry[];
  readonly preferences: UserPreferences;
}
