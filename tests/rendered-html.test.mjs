import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

async function render() {
  // npm test builds Next immediately before these assertions. Never read old Vite dist.
  const html = await readFile(new URL("../.next/server/app/index.html", import.meta.url), "utf8");
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}

test("testRendersPlayerCanvasWhenHomePageLoads", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Vibe Listening<\/title>/i);
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

test("testRendersSongMemoryAtmosphereWhenHomePageLoads", async () => {
  const response = await render();
  const html = await response.text();

  assert.match(html, /data-section="listening-atmosphere"/);
  assert.match(html, /这首歌的听歌氛围/);
  assert.match(html, /aria-label="给这首歌留一句记忆"/);
  assert.match(html, /写下一段和它有关的记忆/);
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

test("production HTML includes room fallback, camera entry points and real volume", async () => {
  const html = await (await render()).text();
  assert.match(html, /data-room-status="loading"/);
  assert.match(html, /房间全景/);
  assert.match(html, /唱机特写/);
  assert.match(html, /class="record-closeup"/);
  assert.match(html, /type="range"[^>]+aria-label="音量"/);
  assert.match(html, /只留在本次页面/);
});
