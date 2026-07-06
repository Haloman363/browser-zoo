# STATE: browser-zoo

## Current Phase: Decompilation Program (post-M1)
**Status**: Milestone 1 (playable prototype) complete. Now executing the ZT1 faithful-reimplementation program (`docs/superpowers/specs/2026-07-02-zt1-decompilation-design.md`): recover ground-truth game rules from configs + binary, feed them into `web/src/core/`.

- **Track A (config-first extraction) — complete** (merged to master 2026-07-05): full-fidelity INI parser, complete `.ai`/`.uca` config dump (`tools/dump_configs.ts` → `data/`), config schema doc (`docs/re/config-schema.md`), asset+config manifest (`tools/build_manifest.ts` → `data/manifest.json`).
- **A3 widening — complete** (2026-07-06): `tools/sweep_all.ts` (subprocess-per-chunk pool, memory-bounded) + `tools/sweep_assets.ts` rip the whole corpus into `data/assets/` — 55,311 graphics decoded to 1.04M PNG frames + per-graphic meta.json, 255k standard-format assets copied, 0 failures. Coverage verified against `data/manifest.json` (328,486 files fully accounted). See `docs/re/archive-survey.md` for the `.lle`/`ztatb` verdicts.
- **Track B (binary RE) — in progress**: B1 done (2026-07-06) — Ghidra 12.1.2 auto-analyzed `zoo.exe` into `re/zoo.gpr`, string-reference naming pass renamed 323 functions, full 7,316-function index at `re/functions.csv` (`tools/ghidra/NameFromStrings.java`). Assert strings leak the original source tree (`c:\aqua\src\...`) so functions arrive module-grouped. Next: B2 algorithm recovery prioritized by the schema doc's "Open questions", B3 port into `web/src/core/`.

## Milestone 1 (complete)
**Status**: A fully-featured, authentic Zoo Tycoon 1 simulation is playable in the browser.

## Key Features Implemented
- [x] **Universal Extraction**: Robust toolset for original ZT1 graphics (`.ztd`, Skip-Draw RLE) and audio (`.wav`) extraction.
- [x] **Authentic UI & HUD**: Recreated Main Menu, primary HUD, Financial Panels, and Animal Inspection windows using original assets.
- [x] **Advanced Simulation**: 
    - Time/Calendar system driving financial cycles.
    - Detailed Economy (salaries, admission fees, concession profits).
    - Advanced AI: Guests with complex needs (Hunger, Thirst, Rest, Trash) and Staff with maintenance routines.
    - Animal Needs: Hunger, Energy, and Health systems.
- [x] **Immersive Environment**: 
    - Spatialized positional audio for animals.
    - Robust `AudioManager` with Music, SFX, and Ambient channels.
    - Integrated original ambient sounds (Forest, Sea, Wind, Leaves).
    - Volume controls for all audio types in the Options menu.
    - Procedural dynamic shadows, and a calendar-triggered Weather system (Rain, Snow, Storms).
- [x] **Map & Scenario Support**: Binary `.zoo` map parser (`TZFBF`) and `.scn` rule tracking for playable scenarios.
- [x] **Persistence**: Named save slots and automatic autosave functionality using LocalStorage.
- [x] **Multiplayer Support**: P2P connectivity via PeerJS for collaborative building and real-time state synchronization.

## Final Notes
The prototype is complete and ready for user testing and further expansion (e.g., more scenarios, aquatic animals).

## Open Todos
- [x] **[UI] Build interface just like Zoo Tycoon with extracted assets** (Completed)
- [x] **[Engine] Import existing game scenarios** (Completed)
- [x] **[Network] Add multiplayer option to host and connect with others** (Completed)
- [x] **[Audio] Add game music and sound effects** (Completed)
