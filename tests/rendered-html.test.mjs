import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("testRendersPlayerCanvasWhenHomePageLoads", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>R&amp;B Fireplace Radar<\/title>/i);
  assert.match(html, /data-region="turntable"/);
  assert.match(html, /data-region="listening"/);
  assert.match(html, /data-region="player-controls"/);
});

test("testOmitsDeferredFeaturesWhenHomePageLoads", async () => {
  const response = await render();
  const html = await response.text();

  assert.doesNotMatch(html, /<form\b/i);
  assert.doesNotMatch(html, /<input\b[^>]*type=["'](?:search|text)["']/i);
  assert.doesNotMatch(html, /\brole=["']search["']/i);
  assert.doesNotMatch(html, /\btype=["']search["']/i);
  assert.doesNotMatch(html, /aria-label=["']搜索["']/i);
  assert.doesNotMatch(html, /href=["'][^"']*(?:login|signin)[^"']*["']/i);
  assert.doesNotMatch(html, />\s*(?:登录|Sign in)\s*</i);
});

test("testRendersDefaultTrackAndThreePicksWhenHomePageLoads", async () => {
  const response = await render();
  const html = await response.text();
  const recommendationRows =
    html.match(/data-recommendation-row="true"/g) ?? [];

  assert.match(html, /data-section="current-track"/);
  assert.match(html, /Ember After Midnight/);
  assert.match(html, /Mara Vale/);
  assert.match(html, /Leave the lamp low/);
  assert.match(html, /data-section="listening-notes"/);
  assert.match(html, /data-section="tonights-picks"/);
  assert.equal(recommendationRows.length, 3);
});

test("testRendersListeningNotesAsFourCompactTagGroupsWhenHomePageLoads", async () => {
  const response = await render();
  const html = await response.text();
  const noteGroups = html.match(/data-note-group="true"/g) ?? [];
  const noteTags = html.match(/data-note-tag="true"/g) ?? [];

  assert.match(html, /data-listening-note="true"/);
  assert.match(html, /像壁炉将熄未熄时的余温/);
  assert.equal(noteGroups.length, 4);
  assert.equal(noteTags.length, 8);
});

test("testRendersOperableLocalAudioControlsWhenHomePageLoads", async () => {
  const response = await render();
  const html = await response.text();

  assert.match(html, /<audio\b[^>]*data-audio-player="true"/i);
  assert.match(html, /<input\b[^>]*type="range"/i);
  assert.match(html, /aria-label="上一首"/);
  assert.match(html, /aria-label="播放"/);
  assert.match(html, /aria-label="下一首"/);
  assert.doesNotMatch(html, /aria-label="播放"[^>]*disabled/i);
});

test("testRendersPlaybackAndLaterActionsForThreePicksWhenHomePageLoads", async () => {
  const response = await render();
  const html = await response.text();
  const playActions = html.match(/data-pick-play="true"/g) ?? [];
  const laterActions = html.match(/data-pick-later="true"/g) ?? [];

  assert.equal(playActions.length, 3);
  assert.equal(laterActions.length, 3);
  assert.match(html, /aria-label="播放 Satin Window"/);
  assert.match(html, /aria-label="加入 Satin Window 到 Later"/);
});

test("testRendersExpandableRadarWithFourDiscoveryRoutesWhenHomePageLoads", async () => {
  const response = await render();
  const html = await response.text();
  const radarRoutes = html.match(/data-radar-route="true"/g) ?? [];

  assert.match(html, /data-section="radar"/);
  assert.match(html, /aria-label="展开或收起 Radar"/);
  assert.equal(radarRoutes.length, 4);
  for (const routeLabel of [
    "Same Artist, Deeper Cut",
    "Same Room",
    "Similar Voice",
    "Production Texture",
  ]) {
    assert.match(html, new RegExp(routeLabel));
  }
});

test("testRendersLaterPanelAndRadarAddActionsWhenHomePageLoads", async () => {
  const response = await render();
  const html = await response.text();
  const radarLaterActions = html.match(/data-radar-later="true"/g) ?? [];
  const laterRows = html.match(/data-later-row="true"/g) ?? [];

  assert.match(html, /data-section="later"/);
  assert.match(html, /aria-label="展开或收起 Later"/);
  assert.match(html, /还没有加入歌曲/);
  assert.equal(radarLaterActions.length, 4);
  assert.equal(laterRows.length, 0);
});

test("testRendersAccessibleFavoriteControlWhenPlayerLoads", async () => {
  const response = await render();
  const html = await response.text();

  assert.match(html, /data-player-favorite="true"/);
  assert.match(html, /aria-label="喜欢当前歌曲"/);
  assert.match(html, /aria-pressed="false"/);
  assert.match(html, /title="喜欢当前歌曲"/);
});
