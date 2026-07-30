import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const trackCatalogPath = join(
  projectRoot,
  "src",
  "adapters",
  "local_data",
  "track-catalog.ts",
);
const recommendationCatalogPath = join(
  projectRoot,
  "src",
  "adapters",
  "local_data",
  "recommendation-catalog.ts",
);
const recommendationRoutes = [
  "same_artist",
  "same_room",
  "similar_voice",
  "production_texture",
];

async function loadCatalogs() {
  assert.equal(existsSync(trackCatalogPath), true, "Track catalog must exist");
  assert.equal(
    existsSync(recommendationCatalogPath),
    true,
    "Recommendation catalog must exist",
  );

  const [trackModule, recommendationModule] = await Promise.all([
    import(pathToFileURL(trackCatalogPath).href),
    import(pathToFileURL(recommendationCatalogPath).href),
  ]);

  return {
    tracks: trackModule.tracks,
    recommendations: recommendationModule.recommendations,
  };
}

test("testProvidesEightToTwelveUniqueTracksWhenCatalogLoads", async () => {
  const { tracks } = await loadCatalogs();
  const trackIds = tracks.map((track) => track.id);

  assert.ok(tracks.length >= 8 && tracks.length <= 12);
  assert.equal(new Set(trackIds).size, tracks.length);
});

test("testCompletesRequiredTrackFieldsWhenCatalogLoads", async () => {
  const { tracks } = await loadCatalogs();

  for (const track of tracks) {
    for (const field of [
      "id",
      "title",
      "artist",
      "album",
      "coverUrl",
      "previewAudioUrl",
      "lyricsExcerpt",
      "listeningNote",
    ]) {
      assert.equal(typeof track[field], "string");
      assert.ok(track[field].trim().length > 0);
    }

    assert.ok(track.previewDurationSeconds >= 5);
    assert.deepEqual(Object.keys(track.tags).sort(), [
      "genres",
      "moods",
      "production",
      "voices",
    ]);
    Object.values(track.tags).forEach((tags) => assert.ok(tags.length > 0));
  }
});

test("testProvidesLocalMediaAssetsWhenCatalogLoads", async () => {
  const { tracks } = await loadCatalogs();

  for (const track of tracks) {
    for (const url of [track.coverUrl, track.previewAudioUrl]) {
      assert.match(url, /^\/assets\//);
      const assetPath = join(projectRoot, "public", ...url.split("/"));
      assert.equal(existsSync(assetPath), true, `${url} must exist locally`);
      assert.ok(statSync(assetPath).size > 100, `${url} must not be empty`);
    }
  }
});

test("testUsesApprovedPatternCoversWhenCatalogLoads", async () => {
  const { tracks } = await loadCatalogs();
  const expectedCovers = new Map([
    ["ember_after_midnight", "/assets/covers/ember_after_midnight-pattern-v2.png"],
    ["satin_window", "/assets/covers/satin_window-pattern-v2.png"],
    ["slow_bloom", "/assets/covers/slow_bloom-pattern-v2.png"],
    ["hallway_echo", "/assets/covers/hallway_echo-pattern-v2.png"],
    ["honey_static", "/assets/covers/honey_static-pattern-v2.png"],
    ["velvet_receiver", "/assets/covers/velvet_receiver-pattern-v2.png"],
    ["blue_hour_vinyl", "/assets/covers/blue_hour_vinyl-pattern-v2.png"],
    ["quiet_side_of_rain", "/assets/covers/quiet_side_of_rain-pattern-v2.png"],
    ["velvet_weather", "/assets/covers/velvet_weather-pattern-v2.png"],
    ["candle_smoke", "/assets/covers/candle_smoke-pattern-v2.png"],
  ]);

  for (const [trackId, coverUrl] of expectedCovers) {
    const track = tracks.find((candidate) => candidate.id === trackId);
    assert.equal(track?.coverUrl, coverUrl);
  }
});

test("testKeepsRecommendationsValidWhenCatalogLoads", async () => {
  const { tracks, recommendations } = await loadCatalogs();
  const trackIds = new Set(tracks.map((track) => track.id));

  for (const recommendation of recommendations) {
    assert.ok(trackIds.has(recommendation.sourceTrackId));
    assert.ok(trackIds.has(recommendation.targetTrackId));
    assert.notEqual(
      recommendation.sourceTrackId,
      recommendation.targetTrackId,
    );
    assert.ok(recommendationRoutes.includes(recommendation.route));
    assert.ok(recommendation.reason.trim().length >= 12);
  }
});

test("testCoversFourDiscoveryRoutesWhenTrackIsSelected", async () => {
  const { tracks, recommendations } = await loadCatalogs();

  for (const track of tracks) {
    const trackRecommendations = recommendations.filter(
      (recommendation) => recommendation.sourceTrackId === track.id,
    );
    const routes = trackRecommendations.map(
      (recommendation) => recommendation.route,
    );
    const targets = trackRecommendations.map(
      (recommendation) => recommendation.targetTrackId,
    );

    assert.deepEqual([...new Set(routes)].sort(), [...recommendationRoutes].sort());
    assert.equal(new Set(targets).size, trackRecommendations.length);
  }
});
