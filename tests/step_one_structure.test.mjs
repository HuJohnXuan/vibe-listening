import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const pagePath = join(projectRoot, "app", "page.tsx");
const playerPagePath = join(
  projectRoot,
  "src",
  "ui",
  "player",
  "player-page.tsx",
);
const stylesPath = join(projectRoot, "app", "globals.css");

function readRequiredFile(filePath) {
  assert.equal(
    existsSync(filePath),
    true,
    `Expected ${filePath} to exist for the step-one browser canvas`,
  );

  return readFileSync(filePath, "utf8");
}

function readPageSources() {
  return `${readRequiredFile(pagePath)}\n${readRequiredFile(playerPagePath)}`;
}

test("testRendersDesktopPlayerCanvasWhenApplicationOpens", () => {
  const pageSource = readPageSources();

  assert.match(pageSource, /data-region="turntable"/);
  assert.match(pageSource, /data-region="listening"/);
  assert.match(pageSource, /data-region="player-controls"/);
});

test("testUsesConfirmedDesignTokensWhenCanvasLoads", () => {
  const styleSource = readRequiredFile(stylesPath);

  for (const color of [
    "#201010",
    "#402020",
    "#49352e",
    "#703000",
    "#f0f0e0",
    "#f4d28a",
    "#9a6f2c",
    "#2a2a2a",
    "#fd3156",
  ]) {
    assert.match(styleSource.toLowerCase(), new RegExp(color));
  }
});

test("testOmitsOutOfScopeEntryPointsWhenApplicationOpens", () => {
  const pageSource = readPageSources().toLowerCase();

  for (const forbiddenTerm of ["landing", "search", "login", "sign in"]) {
    assert.doesNotMatch(pageSource, new RegExp(forbiddenTerm));
  }
});

test("testPlacesRhythmAndBluesSignatureOutsideRecordWhenTurntableRenders", () => {
  const pageSource = readPageSources();
  const recordLabel = pageSource.match(
    /className="record-label">([\s\S]*?)<\/div>/,
  );

  assert.match(
    pageSource,
    /className="turntable-signature">Rhythm and Blues<\/span>/,
  );
  assert.ok(recordLabel);
  assert.doesNotMatch(recordLabel[1], /R&amp;B/);
});

test("testKeepsTonearmPivotFixedWhenPlaybackMovesArmAssembly", () => {
  const pageSource = readPageSources();
  const styleSource = readRequiredFile(stylesPath);

  assert.match(pageSource, /className="tonearm-pivot"/);
  assert.match(pageSource, /className=\{`tonearm-moving\$\{isPlaying/);
  assert.match(styleSource, /\.tonearm-moving\.is-playing\s*\{[^}]*transform:/s);
  assert.doesNotMatch(styleSource, /\.tonearm\.is-playing\s*\{[^}]*transform:/s);
});

test("testAttachesTonearmHeadToEndOfMovingBar", () => {
  const pageSource = readPageSources();
  const movingBar = pageSource.match(
    /className="tonearm-bar">([\s\S]*?)<\/div>/,
  );

  assert.ok(movingBar);
  assert.match(movingBar[1], /className="tonearm-head"/);
});

test("testStylesListeningNotesBelowPicksWithCompactCreamTags", () => {
  const styleSource = readRequiredFile(stylesPath);

  assert.match(
    styleSource,
    /\.listening-notes \.section-heading h2\s*\{[^}]*color:\s*var\(--text-secondary\)/s,
  );
  assert.match(
    styleSource,
    /\.note-tag\s*\{[^}]*background:\s*var\(--color-cream\)/s,
  );
  assert.match(
    styleSource,
    /\.note-tag\s*\{[^}]*color:\s*var\(--color-warm-brown\)/s,
  );
  assert.match(styleSource, /\.note-tag\s*\{[^}]*font-size:\s*10px/s);
  assert.match(styleSource, /\.note-tag\s*\{[^}]*font-weight:\s*700/s);
});

test("testExpandsRadarAsWarmInnerSleeveWithoutScanningEffects", () => {
  const styleSource = readRequiredFile(stylesPath);

  assert.match(
    styleSource,
    /\.radar-disclosure\[open\]\s*\{[^}]*position:\s*absolute/s,
  );
  assert.match(
    styleSource,
    /\.radar-panel\s*\{[^}]*animation:\s*radar-reveal/s,
  );
  assert.doesNotMatch(styleSource, /radar-(?:scan|ring|grid)/i);
});

test("testPlacesRadarAndLaterInSharedToolRowWithMatchingInnerSleeves", () => {
  const styleSource = readRequiredFile(stylesPath);

  assert.match(
    styleSource,
    /\.discovery-tools\s*\{[^}]*grid-template-columns:\s*repeat\(2,/s,
  );
  assert.match(
    styleSource,
    /\.later-disclosure\[open\]\s*\{[^}]*position:\s*absolute/s,
  );
  assert.match(
    styleSource,
    /\.later-panel\s*\{[^}]*animation:\s*later-reveal/s,
  );
});

test("testUsesQuietUnifiedStatesForControlsAndProgress", () => {
  const styleSource = readRequiredFile(stylesPath);

  assert.match(
    styleSource,
    /\.transport-controls button:hover\s*\{[^}]*transform:\s*translateY\(-1px\)/s,
  );
  assert.match(
    styleSource,
    /\.transport-controls button:active\s*\{[^}]*transform:\s*scale\(0\.96\)/s,
  );
  assert.match(
    styleSource,
    /\.favorite-control\[aria-pressed="true"\]\s*\{[^}]*color:\s*var\(--color-progress\)/s,
  );
  assert.match(
    styleSource,
    /\.progress-track::-webkit-slider-thumb\s*\{[^}]*width:\s*13px[^}]*opacity:\s*0/s,
  );
  assert.match(
    styleSource,
    /\.progress-track:hover::-webkit-slider-thumb[^}]*\{[^}]*opacity:\s*1/s,
  );
  assert.doesNotMatch(styleSource, /#00f5d4|#2442ff|cyan|blueviolet/i);
});
