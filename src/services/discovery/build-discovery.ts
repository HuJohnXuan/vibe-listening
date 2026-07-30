import { RecommendationError } from "../../core/recommendations/recommendation-error.ts";
import { rankRecommendations } from "../../core/recommendations/rank-recommendations.ts";
import type {
  DiscoveryResult,
  RadarRecommendations,
  RecommendedTrack,
} from "../../types/discovery.ts";
import type { Recommendation } from "../../types/recommendation.ts";
import type { Track } from "../../types/track.ts";

interface BuildDiscoveryOptions {
  readonly currentTrackId: string;
  readonly tracks: readonly Track[];
  readonly recommendations: readonly Recommendation[];
}

function createEmptyRadar(): {
  [Route in keyof RadarRecommendations]: RecommendedTrack[];
} {
  return {
    same_artist: [],
    same_room: [],
    similar_voice: [],
    production_texture: [],
  };
}

export function buildDiscovery(
  options: BuildDiscoveryOptions,
): DiscoveryResult {
  const currentTrack = options.tracks.find(
    (track) => track.id === options.currentTrackId,
  );
  if (!currentTrack) {
    throw new RecommendationError({
      code: "TRACK_NOT_FOUND",
      message: "无法为不存在的当前歌曲生成推荐。",
      context: { currentTrackId: options.currentTrackId },
    });
  }

  const trackById = new Map(options.tracks.map((track) => [track.id, track]));
  const rankedRecommendations = rankRecommendations({
    currentTrack,
    tracks: options.tracks,
    recommendations: options.recommendations,
  });
  const recommendedTracks = rankedRecommendations.flatMap((ranked) => {
    const track = trackById.get(ranked.recommendation.targetTrackId);
    return track
      ? [
          {
            track,
            route: ranked.recommendation.route,
            reason: ranked.recommendation.reason,
            origin: ranked.origin,
          },
        ]
      : [];
  });
  const radar = createEmptyRadar();
  recommendedTracks.forEach((item) => radar[item.route].push(item));

  return {
    tonightsPicks: recommendedTracks.slice(0, 3),
    radar,
  };
}
