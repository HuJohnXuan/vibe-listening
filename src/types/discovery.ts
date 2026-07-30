import type {
  RecommendationRoute,
} from "./recommendation.ts";
import type { Track } from "./track.ts";

export type RecommendationOrigin = "manual" | "tag_overlap";

export interface RecommendedTrack {
  readonly track: Track;
  readonly route: RecommendationRoute;
  readonly reason: string;
  readonly origin: RecommendationOrigin;
}

export interface RadarRecommendations {
  readonly same_artist: readonly RecommendedTrack[];
  readonly same_room: readonly RecommendedTrack[];
  readonly similar_voice: readonly RecommendedTrack[];
  readonly production_texture: readonly RecommendedTrack[];
}

export interface DiscoveryResult {
  readonly tonightsPicks: readonly RecommendedTrack[];
  readonly radar: RadarRecommendations;
}
