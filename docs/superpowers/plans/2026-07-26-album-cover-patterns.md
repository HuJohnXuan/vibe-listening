# Album Cover Patterns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate four distinct, high-contrast square pattern covers for the songs currently visible on the homepage.

**Architecture:** Generate one independent raster asset per song with the built-in image generator. Visually inspect every output against the shared constraints, then save approved non-destructive variants beside the existing cover assets without changing page references.

**Tech Stack:** Built-in image generation, PNG assets, local visual inspection.

## Global Constraints

- Use warm brown, burgundy, honey gold, and ember orange.
- Use patterns only; no vinyl records, turntables, grooves, circular record labels, text, logos, or watermarks.
- Keep one clear centered motif that remains legible as a small thumbnail.
- Maintain one vintage, tactile series style across all four covers.
- Do not replace existing cover files or modify the page.

---

### Task 1: Generate and Validate Four Pattern Covers

**Files:**
- Create: `public/assets/covers/ember_after_midnight-pattern-v2.png`
- Create: `public/assets/covers/satin_window-pattern-v2.png`
- Create: `public/assets/covers/slow_bloom-pattern-v2.png`
- Create: `public/assets/covers/honey_static-pattern-v2.png`

**Interfaces:**
- Consumes: the visual constraints in `docs/superpowers/specs/2026-07-26-album-cover-patterns-design.md`
- Produces: four independent square PNG assets ready for user review

- [x] **Step 1: Generate `Ember After Midnight`**

  Prompt for a square album-cover pattern: glowing ember fragments and abstract smoke ribbons against a near-black burgundy field, strong orange-gold contrast, vintage paper and woven-fabric texture, centered motif, no text and no record-like circles.

- [x] **Step 2: Generate `Satin Window`**

  Prompt for a square album-cover pattern: angular moonlit window panes interrupting flowing burgundy satin folds, champagne-gold highlights, strong light-dark separation, vintage tactile texture, no text and no record-like circles.

- [x] **Step 3: Generate `Slow Bloom`**

  Prompt for a square album-cover pattern: a stylized golden flower unfolding in layered asymmetrical petals on a deep warm-brown field, restrained ember glow, botanical print and textile texture, no text and no record-like circles.

- [x] **Step 4: Generate `Honey Static`**

  Prompt for a square album-cover pattern: amber honey streams crossed by fine jagged radio-wave noise and geometric sparks on dark chocolate brown, crisp golden contrast, screen-print texture, no text and no record-like circles.

- [x] **Step 5: Validate and save**

  Inspect all four images for thumbnail contrast, distinct motifs, consistent palette, absence of forbidden record imagery, and square composition. Save each approved PNG to its exact path above without changing existing assets.
