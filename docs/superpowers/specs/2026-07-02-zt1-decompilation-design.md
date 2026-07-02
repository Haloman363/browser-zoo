# ZT1 Faithful Reimplementation — Decompilation Program

**Date:** 2026-07-02
**Status:** Approved design
**Scope of first plan:** Track A only (A1–A3). Track B scaffolded as follow-on.

## Goal

Fully "own" Zoo Tycoon 1 (2001) as a *faithful reimplementation*. Two tracks feed
one target — the existing `web/src/core/` engine — replacing guessed logic and
partial assets with verified ground truth. Not a byte-matching decomp; not a
recompile of `zoo.exe`. The OpenRCT2 / devilution model: understand the original,
rewrite it cleanly so it behaves identically.

Sequencing: **config-first**. Much of the "game logic" is data hiding in `.ai`/
`.uca` config files; extract that before touching the binary, so binary RE is
scoped to only what the configs cannot explain.

## Architecture — three artifacts

Everything produced lands in one of three places:

1. **`data/` — the ZT1 Data Pack** (new). Clean, open, documented content ripped
   from `.ztd`: all assets (PNG/OGG) plus *complete* config JSON. Engine-agnostic.
   The durable asset — any future project can build on it.
2. **`docs/re/` — the Behavior Spec** (new). Plain-English + pseudocode of every
   recovered algorithm the configs don't explain. Each entry tagged with the
   `zoo.exe` address it came from and a confidence level.
3. **`web/src/core/` — the reimplementation** (exists). Guessed formulas swapped
   for verified ones, each cross-referenced to a spec entry.

The Ghidra project (`re/zoo.gpr`) is a *tool*, not a deliverable. Its output is
the spec doc.

## Track A — Config-first extraction (FIRST PLAN)

The current extractor (`tools/master_extract_v2.ts`) grabs 4 metadata fields and
often misses them (observed: `name` blank, `family` "Unknown"). The `.ai`/`.uca`
files are INI text holding animal stats, prices, needs, and tuning values — a
large fraction of the game rules as plain data.

- **A1 — Complete config dump.** One tool that walks every `.ztd`, finds every
  `.ai`/`.uca`/`.ani`/`.cfg`, parses *all* sections/keys (not a hand-picked few),
  emits one JSON per object plus a merged index. No field discarded.
- **A2 — Config schema doc.** From the dumped data, document what each key means
  (`cName`, `cFamily`, and the many stat/price/need keys currently ignored). This
  is game-rules recovery — much of "the logic" is data.
- **A3 — Asset completeness pass.** Extend the per-animal extractor to a full
  sweep: animals, scenery, fences, UI, guests, staff, sounds, maps — nothing left
  behind. Produce a manifest of what exists.

Reuse `tools/lib/` (archive, palette, extractor) — it works. Mostly widening the
existing extractor, not new machinery.

## Track B — Binary RE (LATER PLANS, scaffolded now)

`zoo.exe`: 2.4 MB, MSVC C++, DirectDraw/DirectInput, **not packed** (clean
`.text`/`.rsrc`, readable strings). About as friendly as a 2001 Win32 binary
gets. Error strings ("Couldn't GetProcAddress DirectDrawCreateEx", etc.) anchor
function naming.

- **B1 — Ghidra project scaffold.** Load `zoo.exe`, auto-analyze, name functions
  from string references. Deliverable: `re/zoo.gpr` + a function-naming pass.
- **B2 — Targeted algorithm recovery**, prioritized by Track A's gaps. Likely:
  satisfaction/happiness formula, guest AI decisions, pathfinding weights, economy
  tick math. Each → a `docs/re/` entry with address + pseudocode + confidence.
- **B3 — Port & verify.** Replace the matching `core/` manager logic; verify
  behavior against the original where observable.

Track B scope is *defined by Track A's gaps* — we do not RE what the configs
already gave us. This is the reason for config-first sequencing.

## Out of scope (YAGNI)

- **No byte-matching decomp.** Faithful reimpl was chosen; no chasing matching
  assembly.
- **No recompiling `zoo.exe`.** Ghidra output informs the spec only.
- **No RE of rendering/DirectDraw.** The Three.js renderer already replaces it. RE
  targets *game logic* only.
- **No new engine.** `web/` is the target; improve it, don't restart.

## Legal

`zoo.exe` and `.ztd` stay gitignored (already are). The Data Pack (`data/`) and RE
spec are derived works from files the developer owns; keep them local and
undistributed, same policy as `Gamefiles/`. Add `data/` and `re/` to
`.gitignore`.
