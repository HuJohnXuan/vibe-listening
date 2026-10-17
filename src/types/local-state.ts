import type { RoomWeather } from "../core/vibe/build-listening-atmosphere.ts";
import type { RoomType } from "../core/vibe/room-presets.ts";

export const LOCAL_STATE_VERSION = 1;

export type PlaybackMode = "sequence" | "shuffle" | "repeat-all" | "repeat-one";

export interface QueueState {
  readonly schemaVersion: 1;
  readonly trackIds: readonly string[];
  readonly currentIndex: number;
  readonly mode: PlaybackMode;
  readonly shuffleOrder: readonly string[];
}

export interface PlayerState {
  readonly schemaVersion: 1;
  readonly queue: QueueState;
  readonly currentTrackId: string | null;
  readonly elapsedSeconds: number;
  readonly volume: number;
}

export interface Playlist {
  readonly id: string;
  readonly name: string;
  readonly trackIds: readonly string[];
  readonly createdAt: number;
  readonly updatedAt: number;
}

export type Daylight = "auto" | "morning" | "dusk" | "night";

export interface RoomPreferences {
  readonly roomType: RoomType | "auto";
  readonly daylight: Daylight;
  readonly weather: RoomWeather | null;
  readonly residentVisible: boolean;
  readonly residentAuto: boolean;
}

export interface AmbientMix {
  readonly enabled: boolean;
  readonly volume: number;
  readonly followRoom: boolean;
}

export interface ListeningScene {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly name: string;
  readonly room: RoomPreferences;
  readonly playlistId: string | null;
  readonly ambient: AmbientMix;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface LocalAppState {
  readonly schemaVersion: 1;
  readonly player: PlayerState;
  readonly favoriteTrackIds: readonly string[];
  readonly playlists: readonly Playlist[];
  readonly scenes: readonly ListeningScene[];
  readonly room: RoomPreferences;
  readonly ambient: AmbientMix;
}

export const DEFAULT_QUEUE: QueueState = {
  schemaVersion: LOCAL_STATE_VERSION,
  trackIds: [],
  currentIndex: -1,
  mode: "sequence",
  shuffleOrder: [],
};

export const DEFAULT_ROOM_PREFERENCES: RoomPreferences = {
  roomType: "auto",
  daylight: "auto",
  weather: null,
  residentVisible: true,
  residentAuto: true,
};

export const DEFAULT_AMBIENT_MIX: AmbientMix = {
  enabled: false,
  volume: 0.28,
  followRoom: true,
};

export const DEFAULT_LOCAL_APP_STATE: LocalAppState = {
  schemaVersion: LOCAL_STATE_VERSION,
  player: {
    schemaVersion: LOCAL_STATE_VERSION,
    queue: DEFAULT_QUEUE,
    currentTrackId: null,
    elapsedSeconds: 0,
    volume: 1,
  },
  favoriteTrackIds: [],
  playlists: [],
  scenes: [],
  room: DEFAULT_ROOM_PREFERENCES,
  ambient: DEFAULT_AMBIENT_MIX,
};
