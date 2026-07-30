export type RecommendationRoute =
  | "same_artist"
  | "same_room"
  | "similar_voice"
  | "production_texture";

export interface Recommendation {
  readonly sourceTrackId: string;
  readonly targetTrackId: string;
  readonly route: RecommendationRoute;
  readonly reason: string;
}
