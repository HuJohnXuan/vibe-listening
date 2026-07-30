import type {
  Recommendation,
  RecommendationRoute,
} from "../../types/recommendation.ts";
import type { RecommendationOrigin } from "../../types/discovery.ts";
import type { Track, TrackTags } from "../../types/track.ts";

export interface RankedRecommendation {
  readonly recommendation: Recommendation;
  readonly origin: RecommendationOrigin;
  readonly score: number;
}

interface RankRecommendationOptions {
  readonly currentTrack: Track;
  readonly tracks: readonly Track[];
  readonly recommendations: readonly Recommendation[];
}

interface OverlapDetails {
  readonly route: RecommendationRoute;
  readonly score: number;
  readonly sharedLabels: readonly string[];
}

type TagKey = keyof TrackTags;

const TAG_WEIGHTS: Readonly<Record<TagKey, number>> = {
  genres: 3,
  moods: 2,
  voices: 3,
  production: 3,
};

function findSharedTags(options: {
  source: Track;
  target: Track;
  key: TagKey;
}): readonly string[] {
  const targetTags = new Set(options.target.tags[options.key]);
  return options.source.tags[options.key].filter((tag) => targetTags.has(tag));
}

function calculateRouteScore(options: {
  source: Track;
  target: Track;
  keys: readonly TagKey[];
}): number {
  return options.keys.reduce(
    (score, key) =>
      score +
      findSharedTags({ source: options.source, target: options.target, key })
        .length *
        TAG_WEIGHTS[key],
    0,
  );
}

function selectStrongestRoute(options: {
  source: Track;
  target: Track;
}): RecommendationRoute {
  if (options.source.artist === options.target.artist) {
    return "same_artist";
  }

  const routeScores: readonly [RecommendationRoute, number][] = [
    ["same_room", calculateRouteScore({ ...options, keys: ["genres", "moods"] })],
    ["similar_voice", calculateRouteScore({ ...options, keys: ["voices"] })],
    [
      "production_texture",
      calculateRouteScore({ ...options, keys: ["production"] }),
    ],
  ];
  return [...routeScores].sort((left, right) => right[1] - left[1])[0][0];
}

function calculateOverlap(options: {
  source: Track;
  target: Track;
}): OverlapDetails {
  const tagKeys = Object.keys(TAG_WEIGHTS) as readonly TagKey[];
  const sharedLabels = tagKeys.flatMap((key) =>
    findSharedTags({ ...options, key }),
  );
  const tagScore = tagKeys.reduce(
    (score, key) =>
      score +
      findSharedTags({ ...options, key }).length * TAG_WEIGHTS[key],
    0,
  );
  const artistScore = options.source.artist === options.target.artist ? 6 : 0;

  return {
    route: selectStrongestRoute(options),
    score: tagScore + artistScore,
    sharedLabels,
  };
}

function createFallbackReason(options: {
  route: RecommendationRoute;
  sharedLabels: readonly string[];
}): string {
  const labels = options.sharedLabels.slice(0, 2).join("、");
  if (options.route === "same_artist") {
    return "同一位歌手的另一种侧面，保留熟悉声线，也换了一点房间里的光。";
  }
  if (options.route === "similar_voice") {
    return labels
      ? `${labels} 的声线触感相近，情绪可以很自然地接续下去。`
      : "声线都保持克制与贴近，适合沿着相同的情绪继续听下去。";
  }
  if (options.route === "production_texture") {
    return labels
      ? `${labels} 的制作纹理互相呼应，器乐边缘同样柔和。`
      : "制作都收掉了尖锐边缘，低频与留白保持相近的温度。";
  }
  return labels
    ? `${labels} 让两首歌停留在相近的房间与光线里。`
    : "节奏与留白都很从容，适合继续保持现在的安静氛围。";
}

function collectManualRecommendations(
  options: RankRecommendationOptions,
): readonly RankedRecommendation[] {
  const validTrackIds = new Set(options.tracks.map((track) => track.id));
  const seenTargets = new Set<string>();

  return options.recommendations
    .filter((recommendation) => {
      const isValid =
        recommendation.sourceTrackId === options.currentTrack.id &&
        recommendation.targetTrackId !== options.currentTrack.id &&
        validTrackIds.has(recommendation.targetTrackId) &&
        !seenTargets.has(recommendation.targetTrackId);
      if (isValid) {
        seenTargets.add(recommendation.targetTrackId);
      }
      return isValid;
    })
    .map((recommendation, index) => ({
      recommendation,
      origin: "manual" as const,
      score: Number.MAX_SAFE_INTEGER - index,
    }));
}

function collectTagRecommendations(options: {
  currentTrack: Track;
  tracks: readonly Track[];
  excludedTrackIds: ReadonlySet<string>;
}): readonly RankedRecommendation[] {
  return options.tracks
    .filter(
      (track) =>
        track.id !== options.currentTrack.id &&
        !options.excludedTrackIds.has(track.id),
    )
    .map((track) => {
      const overlap = calculateOverlap({
        source: options.currentTrack,
        target: track,
      });
      return {
        recommendation: {
          sourceTrackId: options.currentTrack.id,
          targetTrackId: track.id,
          route: overlap.route,
          reason: createFallbackReason(overlap),
        },
        origin: "tag_overlap" as const,
        score: overlap.score,
      };
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.recommendation.targetTrackId.localeCompare(
          right.recommendation.targetTrackId,
        ),
    );
}

export function rankRecommendations(
  options: RankRecommendationOptions,
): readonly RankedRecommendation[] {
  const manualRecommendations = collectManualRecommendations(options);
  const manualTargetIds = new Set(
    manualRecommendations.map(
      ({ recommendation }) => recommendation.targetTrackId,
    ),
  );
  const tagRecommendations = collectTagRecommendations({
    currentTrack: options.currentTrack,
    tracks: options.tracks,
    excludedTrackIds: manualTargetIds,
  });

  return [...manualRecommendations, ...tagRecommendations];
}
