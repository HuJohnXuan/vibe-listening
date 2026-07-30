import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function readProjectFile(relativePath) {
  return readFileSync(join(projectRoot, relativePath), "utf8");
}

test("testKeepsDesktopPlayerStableAtCommonLaptopWidths", () => {
  const styles = readProjectFile("app/globals.css");

  assert.match(styles, /@media \(max-width: 1100px\)/);
  assert.match(
    styles,
    /@media \(max-width: 1100px\)[\s\S]*?\.room-shell\s*\{[^}]*width:\s*calc\(100vw - 32px\)/,
  );
  assert.match(
    styles,
    /\.current-track h1\s*\{[^}]*overflow:\s*hidden[^}]*text-overflow:\s*ellipsis[^}]*white-space:\s*nowrap/s,
  );
  assert.match(
    styles,
    /\.current-track blockquote\s*\{[^}]*-webkit-line-clamp:\s*2/s,
  );
});

test("testStopsAtTrackEndWithoutForcingAutomaticNextTrack", () => {
  const pageSource = readProjectFile("src/ui/player/player-page.tsx");

  assert.match(pageSource, /onEnded=\{player\.markPaused\}/);
  assert.doesNotMatch(pageSource, /onEnded=\{player\.playNext\}/);
});

test("testDocumentsFutureApiBoundaryWithoutAddingIntegration", () => {
  const integrationPath = join(projectRoot, "docs", "FUTURE_API.md");

  assert.equal(existsSync(integrationPath), true);
  const integrationGuide = readFileSync(integrationPath, "utf8");
  assert.match(integrationGuide, /adapter/i);
  assert.match(integrationGuide, /service/i);
  assert.match(integrationGuide, /Track/);
  assert.match(integrationGuide, /Recommendation/);
  assert.match(integrationGuide, /不在当前 MVP|not part of the current MVP/i);
});

test("testMarksAllTwelvePlanStepsAsCompleteInReadme", () => {
  const readme = readProjectFile("README.md");

  assert.match(readme, /第 1–12 步/);
  assert.match(readme, /FUTURE_API\.md/);
});
